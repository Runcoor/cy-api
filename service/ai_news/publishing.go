package ai_news

// Publishing pipeline for social-post adapters.
//
// Why a Publisher interface and not just a switch?
//   - Each platform's auth model is wildly different (cookie / OAuth / app key /
//     manual). Keeping them behind an interface means we can flip one from STUB
//     to a real implementation without touching the controller, router, or UI.
//   - The 2026 reality (researched separately) is:
//       xiaohongshu: no public API → STUB, manual ZIP only
//       douyin:      no individual API → STUB, would require Chromium + cookie
//                    automation in the container, account-ban risk
//       bilibili:    no official open-platform path; biliup-style cookie POST
//                    works but needs cookie-storage + QR-refresh UX → STUB
//                    until that UX is built
//       weibo:       statuses/share + statuses/upload exist, requires
//                    user-supplied open-platform app credentials → STUB
//                    until the credentials section is added to settings
//   - First commit ships the framework + stubs so the UI, DB, and one-click
//     wiring exist; later commits replace one stub at a time with a real
//     implementation.

import (
	"context"
	"errors"
	"fmt"
	"sort"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
)

// Publisher is one platform's adapter.
type Publisher interface {
	// Platform returns the stable string used in DB and UI keys.
	Platform() string
	// Publish performs the actual upload. Implementations should be idempotent
	// in the failure-replay sense: a re-publish of the same briefing should
	// produce a fresh post or no-op if already published, but never crash
	// because a stale row exists.
	Publish(ctx context.Context, post *SocialPost) (PublishResult, error)
}

// PublishResult is the per-platform success payload.
type PublishResult struct {
	// ExternalURL is the link to the published post on the platform. Empty if
	// the platform doesn't expose one.
	ExternalURL string
	// Notes is short human-readable extra info to show in the admin UI.
	Notes string
}

// ErrUnsupported signals that a platform deliberately doesn't have an
// implementation yet — distinct from a transient failure. The UI shows a
// "暂不支持自动发布" badge instead of a retry button when it sees this.
var ErrUnsupported = errors.New("platform does not support automated publishing yet")

// publishers is the in-process registry of adapters. Built once at init.
var publishers = map[string]Publisher{}

func init() {
	register(&xiaohongshuPublisher{})
	register(&douyinPublisher{})
	register(&bilibiliPublisher{})
	register(&weiboPublisher{})
}

func register(p Publisher) {
	publishers[p.Platform()] = p
}

// AllPublisherKeys returns the canonical UI-display order for platforms.
func AllPublisherKeys() []string {
	out := make([]string, len(model.AINewsSocialPlatformOrder))
	copy(out, model.AINewsSocialPlatformOrder)
	return out
}

// =====================================================================
// Service entry points
// =====================================================================

// ListPublishStatus returns one row per *known* platform for a briefing,
// even if no publish has been attempted yet (those come back with status
// "pending"). Stable order.
func ListPublishStatus(briefingId int) ([]model.AINewsSocialPublish, error) {
	rows, err := model.ListAINewsSocialPublishes(briefingId)
	if err != nil {
		return nil, err
	}
	byPlat := map[string]model.AINewsSocialPublish{}
	for _, r := range rows {
		byPlat[r.Platform] = r
	}
	out := make([]model.AINewsSocialPublish, 0, len(model.AINewsSocialPlatformOrder))
	for _, plat := range model.AINewsSocialPlatformOrder {
		if r, ok := byPlat[plat]; ok {
			out = append(out, r)
			continue
		}
		out = append(out, model.AINewsSocialPublish{
			BriefingId: briefingId,
			Platform:   plat,
			Status:     model.AINewsPublishStatusPending,
		})
	}
	// Sanity: platforms not in the canonical order are appended at the end.
	sort.SliceStable(out, func(i, j int) bool {
		return platformIndex(out[i].Platform) < platformIndex(out[j].Platform)
	})
	return out, nil
}

func platformIndex(p string) int {
	for i, x := range model.AINewsSocialPlatformOrder {
		if x == p {
			return i
		}
	}
	return 999
}

// PublishToPlatform runs one platform's adapter and persists the result.
// Returns the updated row so the caller can echo it back to the UI in one
// round-trip (no extra GET needed).
//
// Synchronous: stubs return instantly, and even real adapters typically
// finish in seconds (single HTTP POST + a few image uploads). If a future
// adapter becomes minute-scale we'll switch to the same enqueue-and-poll
// pattern as social-post generation.
func PublishToPlatform(ctx context.Context, briefingId int, platform string) (*model.AINewsSocialPublish, error) {
	pub, ok := publishers[platform]
	if !ok {
		return nil, fmt.Errorf("unknown platform: %s", platform)
	}
	post, err := GetSocialPostForBriefing(briefingId)
	if err != nil {
		return nil, err
	}
	if post == nil || post.Status != model.AINewsSocialStatusReady {
		return nil, fmt.Errorf("社交帖未生成或未就绪,请先点击「生成」")
	}

	// Mark publishing first so the UI shows progress if this ends up taking
	// a while.
	row := &model.AINewsSocialPublish{
		BriefingId: briefingId,
		Platform:   platform,
		Status:     model.AINewsPublishStatusPublishing,
	}
	_ = model.UpsertAINewsSocialPublish(row)

	res, err := pub.Publish(ctx, post)
	if err != nil {
		final := &model.AINewsSocialPublish{
			BriefingId: briefingId,
			Platform:   platform,
			ErrorMsg:   truncate(err.Error(), 1800),
		}
		if errors.Is(err, ErrUnsupported) {
			final.Status = model.AINewsPublishStatusUnsupported
			final.Notes = err.Error()
			final.ErrorMsg = ""
		} else {
			final.Status = model.AINewsPublishStatusFailed
			common.SysLog(fmt.Sprintf("[ai-news/publish] briefing #%d %s failed: %v", briefingId, platform, err))
		}
		_ = model.UpsertAINewsSocialPublish(final)
		return model.GetAINewsSocialPublish(briefingId, platform)
	}

	final := &model.AINewsSocialPublish{
		BriefingId:  briefingId,
		Platform:    platform,
		Status:      model.AINewsPublishStatusPublished,
		ExternalURL: res.ExternalURL,
		Notes:       res.Notes,
	}
	_ = model.UpsertAINewsSocialPublish(final)
	common.SysLog(fmt.Sprintf("[ai-news/publish] briefing #%d %s published: %s", briefingId, platform, res.ExternalURL))
	return model.GetAINewsSocialPublish(briefingId, platform)
}

// PublishAllResult is the per-platform outcome from a one-click publish.
type PublishAllResult struct {
	Platform string `json:"platform"`
	Success  bool   `json:"success"`
	Message  string `json:"message"`
}

// PublishToAllPlatforms is the one-click handler. Runs every registered
// adapter sequentially (parallel would be premature — once any adapter
// becomes real we want clear logs for each, and sequential keeps the UI
// progressbar interpretable).
func PublishToAllPlatforms(ctx context.Context, briefingId int) []PublishAllResult {
	out := make([]PublishAllResult, 0, len(publishers))
	for _, plat := range model.AINewsSocialPlatformOrder {
		row, err := PublishToPlatform(ctx, briefingId, plat)
		r := PublishAllResult{Platform: plat}
		switch {
		case err != nil:
			r.Message = err.Error()
		case row.Status == model.AINewsPublishStatusPublished:
			r.Success = true
			r.Message = row.ExternalURL
		case row.Status == model.AINewsPublishStatusUnsupported:
			r.Message = row.Notes
		default:
			r.Message = row.ErrorMsg
		}
		out = append(out, r)
	}
	return out
}

// =====================================================================
// Stub adapters — replace one at a time with a real implementation
// =====================================================================

type xiaohongshuPublisher struct{}

func (*xiaohongshuPublisher) Platform() string { return model.AINewsSocialPlatformXiaohongshu }
func (*xiaohongshuPublisher) Publish(_ context.Context, _ *SocialPost) (PublishResult, error) {
	// Reality (2026): no public publishing API. Reverse-engineered tools
	// (browser-automation with stolen cookies) carry account-ban risk and
	// were explicitly declined by the project owner earlier. Use the ZIP
	// download + manual upload to xiaohongshu.com instead.
	return PublishResult{}, fmt.Errorf("%w: 小红书无公开发布 API,请下载 ZIP 后在小红书 APP / 网页手动上传", ErrUnsupported)
}

type douyinPublisher struct{}

func (*douyinPublisher) Platform() string { return model.AINewsSocialPlatformDouyin }
func (*douyinPublisher) Publish(_ context.Context, _ *SocialPost) (PublishResult, error) {
	// Reality (2026): 抖音开放平台 requires a mainland China legal entity
	// to register; no individual-developer access. Open-source uploaders
	// (dreammis/social-auto-upload, withwz/douyin_upload) all use Playwright
	// + reused cookies which need Chromium in the container and have
	// medium-to-high account-ban risk. Not enabled until we ship a
	// dedicated cookie-management UI + accept the risk.
	return PublishResult{}, fmt.Errorf("%w: 抖音个人开发者无开放发布接口,自动化方案需 Chromium 与 cookie 注入,暂未启用", ErrUnsupported)
}

type bilibiliPublisher struct{}

func (*bilibiliPublisher) Platform() string { return model.AINewsSocialPlatformBilibili }
func (*bilibiliPublisher) Publish(_ context.Context, _ *SocialPost) (PublishResult, error) {
	// Reality (2026): no official open platform for individual creators.
	// biliup-rs / biliup (python) drive the t.bilibili.com/api/v2 dynamic
	// endpoints with a stored cookie — viable for image+text 动态. Blocked
	// on building a cookie-storage + QR-refresh flow in settings.
	return PublishResult{}, fmt.Errorf("%w: B 站无开放发布接口,可用方案需扫码登录获取 cookie,后续补充", ErrUnsupported)
}

type weiboPublisher struct{}

func (*weiboPublisher) Platform() string { return model.AINewsSocialPlatformWeibo }
func (*weiboPublisher) Publish(_ context.Context, _ *SocialPost) (PublishResult, error) {
	// Reality (2026): statuses/share + statuses/upload are still documented
	// at open.weibo.com/wiki, but require an open-platform app + access
	// token bound to an ICP-filed callback domain. Implementation is a few
	// HTTPS multipart POSTs once those credentials live in settings.
	return PublishResult{}, fmt.Errorf("%w: 微博发布需要开放平台 app key 与 access token,请先在设置中填写", ErrUnsupported)
}

