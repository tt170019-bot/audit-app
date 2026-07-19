# Registrant Login: Password → Magic Link

## Problem

Registrants currently sign in with email + password (`grant_type=password`). Password
setup/reset adds friction (invite acceptance requires choosing a password, forgotten
passwords require a separate recovery flow) for a role that only a handful of trusted,
admin-invited people ever hold. Switch to passwordless email-link ("magic link") login.

## Scope

Registrant auth only. Anonymous auditor read/take-audit flow is untouched — it never
goes through `SupabaseAuth`.

## Decision: full password removal

No password anywhere in the Registrant flow — not for login, not for invite
acceptance, not for recovery. Invite acceptance and magic-link login become the same
mechanism: click an emailed link, land back in the app with an `access_token` in the
URL hash, get signed in immediately. Recovery becomes meaningless (nothing to
recover) and is deleted.

## Changes

### `supabase-auth.js`

- Remove `signIn(email, password)`.
- Remove `acceptInvite(accessToken, refreshToken, expiresIn, password)`.
- Add `requestMagicLink(email)` — `POST /auth/v1/otp` with `{ email, create_user: false }`.
  `create_user: false` so only emails Supabase already knows (i.e. previously invited
  via the `registrants` Edge Function) can ever get a working link — this is the
  access-control boundary, not anything in the UI.
- Add `completeSessionFromTokens(accessToken, refreshToken, expiresIn)` — builds and
  stores the session directly from tokens already present in the URL hash (the part of
  the old `acceptInvite` that isn't the password PUT call).

### `registrant-ui.js`

- `parseAuthHashParams()`: accept `type` of `invite` or `magiclink` only (drop
  `recovery`). Also detect the failure shape Supabase redirects with for an
  expired/invalid link: `#error=access_denied&error_code=otp_expired` (or similar) —
  return an `{ error: true }` shape distinct from the success shape.
- `initInviteAcceptanceFromUrl()` → rename `initEmailLinkSignIn()`:
  - Success (tokens present): call `completeSessionFromTokens`, toast "로그인되었습니다",
    `switchTab('templates')`, clear the hash via `history.replaceState`.
  - Failure (error present): toast "링크가 만료되었습니다. 다시 요청하세요", open
    `modal-login`, clear the hash.
  - Same reload-survival caveat as today applies to both branches: don't strip the hash
    until the outcome (success or failure) has actually been handled, because the
    service worker's `controllerchange` handler can force a reload first on a
    first-time visit.
- `registrantSignIn()` → rename `requestLoginLink()`:
  - Reads `login-email` only (no password field).
  - Disables the submit button and shows "전송 중..." for the duration of the request
    (in-flight guard against double submit; no client-side cooldown timer — server-side
    rate limiting is authoritative and its error surfaces as-is if hit).
  - On success, replaces the modal body with a confirmation: "로그인 링크를 보냈습니다.
    메일함을 확인하세요." Includes a "다시 보내기" action that re-runs the same request
    for the same email.
  - On failure — including the case where `create_user:false` rejects an
    unregistered email (GoTrue returns a 422 here, it does not silently no-op) —
    show `e.message` in `login-error`, the same pattern already used by
    `registrantSignIn`/`inviteRegistrant`'s existing catch blocks. No special-casing
    or translation of individual error codes.
  - Modal close (existing `closeModal('modal-login')` path) resets the modal back to
    the email-entry state, so reopening it never shows a stale "sent" screen.

### `index.html`

- `modal-login`: remove `login-password` input; button label "로그인" → "로그인 링크
  받기". Add the post-submit "sent" state markup (message + 다시 보내기 + 닫기).
- `modal-accept-invite`: delete entirely (both password inputs, the title-swap logic
  for invite vs recovery, and its trigger). Invite acceptance now flows through the
  same `initEmailLinkSignIn()` path as magic-link login — no modal needed for it.
- Remove `confirmAcceptInvite()` and `pendingInviteTokens` and their references.

### Redirect target

`POST /auth/v1/otp` is called with no explicit redirect override — it relies on the
project's already-configured Auth "Site URL", the same default the existing password
-recovery links have been landing on correctly. If manual testing (below) shows the
link redirecting anywhere else, add a `redirect_to` query param to the request URL.

### `supabase/functions/registrants/index.ts`

No changes. `inviteUserByEmail` still redirects back with `type=invite` in the hash;
that's now handled by the same success branch as a magic-link login.

### Tests

`tests/registrants.test.js` (and any other test touching `signIn`/`acceptInvite`):
update to exercise `requestMagicLink` / `completeSessionFromTokens` instead of the
password grant and password-PUT flows.

## Out of scope

- Rate-limit UI (cooldown countdown, resend-disabled timer) — server-side limit is
  enough; adding a client timer duplicates state for no real benefit.
- Any change to the anonymous auditor flow.
- Any change to how invites are issued (`registrants` Edge Function Admin API calls).
