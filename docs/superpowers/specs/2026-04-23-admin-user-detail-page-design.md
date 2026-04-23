# Admin User Detail Page

**Date:** 2026-04-23
**Status:** Approved (pending implementation)
**Owner:** runcoor

## Problem

Administrators currently cannot view a single user's full picture in one place. To investigate a user (e.g. "why is this user being charged from wallet instead of subscription?"), an admin must:

- Open the user list to see basic info + wallet quota
- Open `UserSubscriptionsModal` (a modal) to see active subscriptions
- Navigate to `/console/log` and filter by `user_id` to see usage
- Navigate to `/console/topup` (admin tab) and filter by `user_id` for recharges
- Navigate to `/console/login-log` for login history

This is slow, fragmented, and the modal-based subscription view doesn't show wallet balance, request totals, or task records side-by-side. Support and billing investigations are painful.

## Goal

A single dedicated admin route — **`/console/user/:id`** — that aggregates everything an admin needs to know about one user: identity, finances, subscriptions, usage, recharges, login history, and security state. Includes management actions (gift subscription, invalidate subscription, edit user, etc.) inline.

Out of scope: changing the user list table itself beyond making the username clickable; redesigning any of the existing admin pages; adding new abilities the admin doesn't already have elsewhere (this page consolidates existing capabilities, it doesn't grant new ones).

## User Flow

1. Admin opens `/console/user` (existing user list)
2. Clicks on a username (now rendered as a link) **or** picks "查看详情 / View detail" from the row's action menu
3. Browser navigates to `/console/user/:id`
4. Page loads:
   - Top region: identity card + 4 finance number cards (single aggregated request)
   - Tab region: defaults to first tab ("套餐 / Subscriptions"), other tabs lazy-load on click
5. Admin can perform management actions inline (each action calls an existing API)
6. "← 返回 / Back" button returns to the user list (`/console/user`), preserving prior filter/page state via browser history

## Architecture

### Frontend

**New files:**
- `web/src/pages/User/UserDetail.jsx` — page shell, layout, tab dispatch
- `web/src/pages/User/userDetail/IdentityCard.jsx` — top identity block
- `web/src/pages/User/userDetail/FinanceCards.jsx` — 4 metric cards
- `web/src/pages/User/userDetail/SubscriptionsTab.jsx` — active + history subscriptions, gift/invalidate actions
- `web/src/pages/User/userDetail/UsageLogsTab.jsx` — request log table (reuses `LogsTable` if extractable, else inline)
- `web/src/pages/User/userDetail/TasksTab.jsx` — async task records
- `web/src/pages/User/userDetail/TopupsTab.jsx` — recharge records
- `web/src/pages/User/userDetail/LoginLogsTab.jsx` — login history
- `web/src/pages/User/userDetail/SecurityTab.jsx` — 2FA / Passkey / OAuth bindings status + admin actions
- `web/src/hooks/users/useUserDetail.jsx` — overview fetch, refetch helpers
- `web/src/i18n/locales/zh-CN.json` and `en.json` — new strings

**Modified files:**
- `web/src/App.jsx` — register new lazy route `/console/user/:id`
- `web/src/components/table/users/UsersColumnDefs.jsx` — make `username` cell a `<Link to="/console/user/${id}">`
- `web/src/components/table/users/UsersActions.jsx` — add "查看详情" menu item

**No changes to:**
- Existing modals (`UserSubscriptionsModal`, `EditUserModal`, etc.) — kept as-is so the user list still works for quick edits. The detail page can also open these modals when needed, sharing components.

### Backend

**New endpoint:** `GET /api/user/:id/overview`

Aggregates the data needed to render the top region (identity + finance cards + subscription summary). Avoids 3-4 parallel requests on first paint.

Response shape:
```json
{
  "success": true,
  "data": {
    "user": { /* full User struct (without password/access_token) */ },
    "finance": {
      "wallet_quota": 12345,
      "used_quota": 67890,
      "request_count": 100,
      "topup_total_cents": 99900,
      "topup_total_usd": 9.99
    },
    "subscriptions_summary": {
      "active_count": 1,
      "total_remaining_quota": 500000,
      "earliest_expiry": 1735689600
    },
    "security": {
      "two_factor_enabled": true,
      "passkey_enabled": false,
      "oauth_bindings_count": 2
    }
  }
}
```

**Implementation:** new controller `controller/user_admin.go::GetUserOverview` (or add to `controller/user.go`); permission check identical to existing `GetUser` (`myRole <= user.Role && myRole != RoleRootUser` returns 403).

**No other backend changes required** — all tabs use existing endpoints with `user_id` filter:
- Logs: `GET /api/log/?user_id=X` (existing)
- Tasks: `GET /api/task/?user_id=X` (existing)
- Topups: `GET /api/user/topup?user_id=X` (existing — verify filter param works)
- Login logs: `GET /api/user/login-logs?user_id=X` (existing)
- Subscriptions: `GET /api/subscription/admin/users/:id/subscriptions` (existing)
- OAuth bindings: `GET /api/user/:id/oauth/bindings` (existing)

If any existing endpoint doesn't accept `user_id` filtering, that becomes a small addition (parameter parse + WHERE clause) — to be confirmed in the implementation plan.

## UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ ← 返回用户列表                                                    │ ← BackBar
├──────────────────────────────────────────────────────────────────┤
│ [avatar] 用户名 [角色徽章] [状态徽章]   ID:123  group:Pro        │
│          email@x.com  · 注册:2025-01-02 · 最后登录:2 hours ago   │ ← IdentityCard
│          [编辑] [禁用] [重置密码] [赠送套餐] [...更多]            │
├──────────────────────────────────────────────────────────────────┤
│ ┌─钱包余额─┐ ┌─累计已用─┐ ┌─累计充值─┐ ┌─累计请求─┐              │
│ │ ¥12.3   │ │ ¥67.8    │ │ ¥99.9    │ │  1,234   │              │ ← FinanceCards
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                  │
├──────────────────────────────────────────────────────────────────┤
│ [套餐] [使用记录] [任务记录] [充值记录] [登录日志] [安全]          │ ← Tabs
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  (active tab content — table/cards with own pagination/filters)  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Visual style follows existing console pages (`Team/TeamDetail.jsx` for reference): Semi UI components, `var(--surface)` backgrounds, `var(--radius-lg)` corners. Top region (BackBar + IdentityCard + FinanceCards) is sticky on desktop; scrolls naturally on mobile.

## Tab Contents

### 1. 套餐 / Subscriptions (default)
Cards listing all of this user's subscriptions:
- Each card: plan title, group, total/used/remaining quota with progress bar, start/end times, status badge (生效/已作废/已过期), billing preference toggle
- Top-right: `[+ 赠送套餐]` button → opens existing plan picker (reuse `UserSubscriptionsModal` content as embedded component or replicate)
- Per-card actions: `[作废]` (calls `POST /subscription/admin/user_subscriptions/:id/invalidate`), `[删除]` (calls `DELETE`)
- Section "已失效套餐" collapsible at the bottom

### 2. 使用记录 / Usage Logs
Embedded log table. Approach: extract the table portion of `pages/Log/index.jsx` into a reusable `<LogsTablePanel userId={id} />` component (preserving filters, pagination, columns), then mount inside the tab. Columns: time, model, channel, type, prompt/completion tokens, quota, latency. Own pagination + date range + model filter.

### 3. 任务记录 / Tasks
Async task table (Suno/MJ/Kling). Same extraction approach against `pages/Task/index.jsx` → `<TasksTablePanel userId={id} />`. Columns: task type, model, status, submit time, finish time, quota.

### 4. 充值记录 / Recharges
This user's topup orders + statuses. Extract from admin topup tab in `pages/Recharge` → `<TopupsTablePanel userId={id} />`. Clicking a row opens the existing bill detail modal.

### 5. 登录日志 / Login Logs
This user's login attempts (success + fail) with IP, UA, time, status. Extract from `pages/LoginLog/index.jsx` → `<LoginLogsTablePanel userId={id} />`.

If the source page's table is tightly coupled to its page-level filters and extraction is non-trivial, fall back to a minimal inline table inside the tab using the same backend endpoint — keep the existing page untouched in that case.

### 6. 安全 / Security
- 2FA status (启用/未启用) + `[禁用 2FA]` button (calls existing `DELETE /user/:id/2fa`)
- Passkey status + `[重置 Passkey]` button (calls existing `DELETE /user/:id/reset_passkey`)
- OAuth bindings list with per-provider unbind buttons (reuse logic from existing modal `UserBindingManagementModal`)

## Data Flow

```
On mount:
  GET /api/user/:id/overview        → populates top region (identity, finance, security badges)
  → renders default tab "套餐"
  → tab triggers GET /api/subscription/admin/users/:id/subscriptions

On tab switch:
  Lazy-fetch the tab's data on first activation; cache in state until page unmount or explicit refresh.

On admin action (e.g., 赠送套餐):
  POST → success → re-fetch overview + the affected tab's data only
```

## Permissions

- Route protected by existing `AdminAuth` middleware
- Per-action visibility uses the existing role rule from `controller/user.go::GetUser`:
  ```
  if myRole <= targetRole && myRole != RoleRootUser → 403 / hide button
  ```
- Frontend mirrors this rule by reading the current user's role and the target's role; disables/hides actions a normal admin cannot perform on another admin/root.

## Error Handling

- Overview fetch fails → show error card with retry button; tabs remain inert
- Tab fetch fails → show inline error within that tab; other tabs unaffected
- Admin action fails → toast error message from API; data unchanged
- 404 (user not found / deleted) → show "用户不存在" empty state with back button
- 403 (insufficient permission) → redirect to user list with toast

## Mobile / Responsive

- ≥ 1024px: full layout, sticky top, side-by-side finance cards
- 768–1023px: top region scrolls (not sticky), finance cards 2x2
- < 768px: single-column finance cards, tab bar horizontally scrollable, identity card actions collapse into "..." menu. Functional but not pixel-polished.

## i18n

- Languages: zh-CN (source) + en (per project preference)
- All new strings added to `web/src/i18n/locales/zh-CN.json` and `en.json`
- Backend error messages use existing `i18n` package patterns

## Testing

- Manual: navigate to `/console/user/:id` for various users (active/disabled/deleted/admin/root); verify each tab loads, paginates, filters; verify each action button works and re-fetches correctly; verify role-based hiding works
- Backend: add a unit test for `GetUserOverview` covering: success, user-not-found, insufficient-role, deleted user
- Build: `cd web && bun run build` must succeed; `go build` must succeed

## Reuse from Existing Code

- `useIsMobile()` hook
- `CardTable`, `Modal`, `Tabs`, `SideSheet` from Semi UI
- Role/status badge styles from `UsersColumnDefs.jsx::renderRole / renderStatistics`
- Quota rendering: `renderQuota` from `helpers/render`
- Subscription rendering: refactor reusable parts out of `UserSubscriptionsModal.jsx` into a shared component (`SubscriptionListPanel`) so the modal and the new tab share code
- API helpers: `API.get/post/delete` from `helpers`
- Permission check pattern: `controller/user.go::GetUser`

## Files Changed Summary

**New (frontend):** ~10 files in `web/src/pages/User/userDetail/` + 1 hook + 2 i18n entries (entries within existing JSON files)
**New (backend):** 1 endpoint (`GetUserOverview`) in `controller/user.go` + route registration in `router/api-router.go`
**Modified:** `web/src/App.jsx` (1 lazy import + 1 route), `UsersColumnDefs.jsx` (username cell), `UsersActions.jsx` (menu item)
**Refactor:** extract `SubscriptionListPanel` from `UserSubscriptionsModal.jsx` for shared use

## Open Questions Deferred to Implementation

- Whether each existing tab endpoint already accepts `user_id` (verify in implementation; add WHERE clause if missing)
- Exact admin actions on Security tab — confirm which existing endpoints we surface vs leave to other pages
