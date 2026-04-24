package ai_news

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/setting/system_setting"
)

// GenImageOptions controls one /v1/images/generations call.
type GenImageOptions struct {
	Prompt string
	Size   string // "1024x1024" (default), "1024x1792", etc.
	N      int    // default 1
}

// GenImageResult is one generated image as returned by the upstream.
// Exactly one of URL / B64 will be set.
type GenImageResult struct {
	URL string
	B64 string
}

// StoredImage describes one image after we've downloaded + cached it locally.
// RelPath is the path under imagesRoot() — store this in DB, never the absolute
// path (so the storage root can change between deploys).
type StoredImage struct {
	Position  int    `json:"position"`
	Prompt    string `json:"prompt"`
	Caption   string `json:"caption,omitempty"`
	SourceURL string `json:"source_url,omitempty"`
	RelPath   string `json:"rel_path"`
	Mime      string `json:"mime"`
	Bytes     int64  `json:"bytes"`
}

type imagesGenRequest struct {
	Model          string `json:"model"`
	Prompt         string `json:"prompt"`
	N              int    `json:"n,omitempty"`
	Size           string `json:"size,omitempty"`
	ResponseFormat string `json:"response_format,omitempty"`
}

type imagesGenResponse struct {
	Data []struct {
		URL     string `json:"url,omitempty"`
		B64JSON string `json:"b64_json,omitempty"`
	} `json:"data"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error"`
}

// 5 min — image gen is slower than chat, especially for n>1.
var imageHTTPClient = &http.Client{Timeout: 5 * time.Minute}

// PreflightCheckImageGen returns nil if the image-gen settings are usable.
// Called before any generation attempt so we fail fast with a useful message.
func PreflightCheckImageGen() error {
	s := system_setting.GetAINewsSettings()
	if strings.TrimSpace(s.ImageGenBaseURL) == "" {
		return fmt.Errorf("图像生成接口未配置: 请在 AI 前沿 → 设置 中填写 Base URL")
	}
	if strings.TrimSpace(s.ImageGenAPIKey) == "" {
		return fmt.Errorf("图像生成接口未配置: 请在 AI 前沿 → 设置 中填写 API Key")
	}
	if strings.TrimSpace(s.ImageGenModel) == "" {
		return fmt.Errorf("图像生成接口未配置: 请在 AI 前沿 → 设置 中填写模型名 (如 gpt-image-2)")
	}
	return nil
}

// GenerateImage calls /v1/images/generations and returns the upstream results.
// Caller is responsible for downloading + storing.
func GenerateImage(ctx context.Context, opts GenImageOptions) ([]GenImageResult, error) {
	s := system_setting.GetAINewsSettings()
	if err := PreflightCheckImageGen(); err != nil {
		return nil, err
	}
	if strings.TrimSpace(opts.Prompt) == "" {
		return nil, fmt.Errorf("prompt is required")
	}
	if opts.N <= 0 {
		opts.N = 1
	}
	if opts.Size == "" {
		opts.Size = "1024x1024"
	}

	body := imagesGenRequest{
		Model:  s.ImageGenModel,
		Prompt: opts.Prompt,
		N:      opts.N,
		Size:   opts.Size,
		// Don't force response_format — gpt-image-2 returns b64_json by default
		// and rejects the field. The decoder handles either shape.
	}
	raw, err := common.Marshal(body)
	if err != nil {
		return nil, err
	}

	url := imageGenURL(s.ImageGenBaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.ImageGenAPIKey)

	resp, err := imageHTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("image gen request: %w", err)
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("image gen HTTP %d at %s: %s", resp.StatusCode, url, truncate(string(respBody), 400))
	}

	var parsed imagesGenResponse
	if err := common.Unmarshal(respBody, &parsed); err != nil {
		return nil, fmt.Errorf("decode image gen response: %w (body=%s)", err, truncate(string(respBody), 200))
	}
	if parsed.Error != nil && parsed.Error.Message != "" {
		return nil, fmt.Errorf("image gen error: %s", parsed.Error.Message)
	}
	if len(parsed.Data) == 0 {
		return nil, fmt.Errorf("image gen returned no data (body=%s)", truncate(string(respBody), 200))
	}

	out := make([]GenImageResult, 0, len(parsed.Data))
	for _, d := range parsed.Data {
		out = append(out, GenImageResult{URL: d.URL, B64: d.B64JSON})
	}
	return out, nil
}

// imageGenURL builds the full /v1/images/generations URL, accepting any of:
//   - http://host:port
//   - http://host:port/
//   - http://host:port/v1
//   - http://host:port/v1/
//
// Matches the OpenAI Python SDK convention (which expects base_url without
// /v1) but tolerates admins who copy the path from a curl example.
func imageGenURL(base string) string {
	b := strings.TrimRight(base, "/")
	b = strings.TrimSuffix(b, "/v1")
	return b + "/v1/images/generations"
}

// imagesRoot returns the directory where briefing images are stored.
// Prefers /data (the docker-compose volume mount); falls back to ./data
// for local dev. Override with env AI_NEWS_IMAGES_DIR.
func imagesRoot() string {
	if dir := os.Getenv("AI_NEWS_IMAGES_DIR"); dir != "" {
		return dir
	}
	if st, err := os.Stat("/data"); err == nil && st.IsDir() {
		return "/data/ai_news/images"
	}
	return "data/ai_news/images"
}

// briefingImageDir is the per-briefing folder under imagesRoot().
func briefingImageDir(briefingId int) string {
	return filepath.Join(imagesRoot(), fmt.Sprintf("%d", briefingId))
}

// downloadHTTPClient is for fetching the URL the gen API hands back.
// Keep it modest — these are usually quick same-host pulls.
var downloadHTTPClient = &http.Client{Timeout: 60 * time.Second}

// DownloadAndStoreImage saves one generated image to local disk under the
// briefing's directory. Returns metadata to persist in DB. Either srcURL or
// b64 must be non-empty.
func DownloadAndStoreImage(ctx context.Context, briefingId, position int, srcURL, b64 string) (StoredImage, error) {
	dir := briefingImageDir(briefingId)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return StoredImage{}, fmt.Errorf("mkdir %s: %w", dir, err)
	}

	var data []byte
	switch {
	case b64 != "":
		decoded, err := base64.StdEncoding.DecodeString(b64)
		if err != nil {
			return StoredImage{}, fmt.Errorf("decode b64 image: %w", err)
		}
		data = decoded
	case srcURL != "":
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, srcURL, nil)
		if err != nil {
			return StoredImage{}, err
		}
		resp, err := downloadHTTPClient.Do(req)
		if err != nil {
			return StoredImage{}, fmt.Errorf("fetch %s: %w", srcURL, err)
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 400 {
			return StoredImage{}, fmt.Errorf("fetch %s: HTTP %d", srcURL, resp.StatusCode)
		}
		data, err = io.ReadAll(resp.Body)
		if err != nil {
			return StoredImage{}, fmt.Errorf("read body: %w", err)
		}
	default:
		return StoredImage{}, fmt.Errorf("no image data (both url and b64 empty)")
	}

	mime, ext := sniffImageMIME(data)
	hash := sha1.Sum(data)
	short := hex.EncodeToString(hash[:4])
	filename := fmt.Sprintf("%02d_%s%s", position, short, ext)
	abs := filepath.Join(dir, filename)
	if err := os.WriteFile(abs, data, 0o644); err != nil {
		return StoredImage{}, fmt.Errorf("write %s: %w", abs, err)
	}

	rel, err := filepath.Rel(imagesRoot(), abs)
	if err != nil {
		// Should not happen — abs is built from imagesRoot. Store the basename
		// + briefing as a usable fallback.
		rel = filepath.Join(fmt.Sprintf("%d", briefingId), filename)
	}
	return StoredImage{
		Position:  position,
		SourceURL: srcURL,
		RelPath:   rel,
		Mime:      mime,
		Bytes:     int64(len(data)),
	}, nil
}

// ResolveStoredImagePath returns the absolute on-disk path for a stored
// image's relative path. It also rejects path-traversal attempts so the HTTP
// serve handler can safely pass user-supplied paths through.
func ResolveStoredImagePath(rel string) (string, error) {
	clean := filepath.Clean("/" + rel)[1:] // strip leading slash, normalize
	if strings.HasPrefix(clean, "..") || strings.Contains(clean, "/../") {
		return "", fmt.Errorf("invalid path")
	}
	root := imagesRoot()
	abs := filepath.Join(root, clean)
	// Make sure abs is still under root after any resolution.
	absRoot, _ := filepath.Abs(root)
	absResolved, err := filepath.Abs(abs)
	if err != nil {
		return "", err
	}
	if !strings.HasPrefix(absResolved, absRoot+string(filepath.Separator)) && absResolved != absRoot {
		return "", fmt.Errorf("path escapes root")
	}
	return absResolved, nil
}

// DeleteBriefingImageDir removes the entire image folder for a briefing.
// Used on regenerate and on cleanup.
func DeleteBriefingImageDir(briefingId int) error {
	dir := briefingImageDir(briefingId)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return nil
	}
	return os.RemoveAll(dir)
}

// sniffImageMIME inspects the magic bytes and returns (mime, fileExt).
// We default to png because gpt-image-* outputs PNG, but the few common
// alternatives are detected so the downloaded file ends up with a sensible
// extension for clients (and for the ZIP archive).
func sniffImageMIME(data []byte) (mime, ext string) {
	if len(data) >= 8 && bytes.Equal(data[:8], []byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}) {
		return "image/png", ".png"
	}
	if len(data) >= 3 && bytes.Equal(data[:3], []byte{0xff, 0xd8, 0xff}) {
		return "image/jpeg", ".jpg"
	}
	if len(data) >= 6 && (bytes.Equal(data[:6], []byte("GIF87a")) || bytes.Equal(data[:6], []byte("GIF89a"))) {
		return "image/gif", ".gif"
	}
	if len(data) >= 12 && bytes.Equal(data[:4], []byte("RIFF")) && bytes.Equal(data[8:12], []byte("WEBP")) {
		return "image/webp", ".webp"
	}
	return "image/png", ".png"
}

