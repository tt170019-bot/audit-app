# 점검표 탭 (Templates Tab) UI/UX Redesign

Redesign of the screen `renderTemplates` renders when the user enters the
top-tab **점검표** (`index.html:651-798`). Structural change, not a reskin.
Derived from a grilling session on 2026-09-02.

## Framing

- **Primary user: the Registrant.** This screen is their template-management
  console. The ordinary auditor is a secondary audience.
- **For an auditor this screen is a reference list** — see which official
  templates exist and their revision status. Auditors start audits from the
  홈 "새 심사 시작" modal (`#na-template`), not here.
- **App-wide settings (device storage, backup/restore, destructive resets)
  currently live on this tab.** They stay here — no separate settings tab —
  but pulled into their own clearly-labelled collapsible section, not mixed
  with sync and login.

## Problems with the current screen

1. **Login is buried.** The Registrant is the primary user and must log in
   to do anything, but login/logout/등록자 관리 sit inside a collapsed
   `설정` accordion. The primary action (`+ 점검표 등록`) is at the top; the
   prerequisite (login) is three sections deep.
2. **`설정` accordion is overloaded.** One "설정" holds six unrelated things:
   sync status, login, device storage, a data-retention notice,
   backup/restore, and three destructive resets.
3. **Mobile shows a 7-column horizontal-scroll table** (`min-width: 40rem`)
   in a mobile-first app.
4. **The empty state is a dead end.** "저장된 점검표가 없습니다. 온라인
   상태에서 동기화를 실행하세요." — but the 동기화 button is inside the
   collapsed accordion.
5. **`저장된 점검표 (N)` count is the filtered count.** Filter to a division
   with nothing in it and the header reads "(0)".
6. **The "상태" column (활성/비활성) exposes an internal sync artifact as if
   it were user-controllable.** `active:false` is set automatically when a
   newer revision syncs (`index.html:459`); there is no toggle. A Registrant
   sees "비활성" with no way to act on it.
7. **Redundant "심사원 화면" notice** inside 설정 duplicates what a login
   prompt already says.

## Target layout (top to bottom)

### 1. Session bar

A slim bar above everything else.

- **Logged out:** `로그인하면 점검표를 등록·수정할 수 있습니다` + `[로그인]`
  (opens `openLoginModal`, unchanged magic-link flow).
- **Logged in:** `you@email` + `[등록자 관리]` `[로그아웃]`, and directly
  below it a prominent primary `+ 점검표 등록` button (opens
  `openNewChecklistModal`, unchanged).

Login / logout / 등록자 관리 are **removed from the 설정 / 기기·백업
section** — they live only here.

### 2. Sync strip

One always-visible line directly under the session bar:

- Reachable: `점검표 서버: 접근 가능 · [동기화]`
- Offline: `오프라인 · 저장된 점검표 사용 중` (warning colour), `[동기화]`
  still present but tapping it toasts "오프라인입니다".
- Online but unreachable: `점검표 서버 접근 실패` (warning colour), `[동기화]`.

Drop the `활성 N건 · 자동동기화 M건` counts — noise for the Registrant, and
"활성 N" is meaningless once superseded copies are hidden (section 5).
`[동기화]` calls `syncChecklistsNow`, unchanged.

### 3. Header

`저장된 점검표 N개` where **N is the total of current templates** (not the
filtered count, not counting superseded local copies). When a division or
text filter is active, a subtle line below: `운항 부문 · 3개 표시` (or
`"안전관리" 검색 · 2개 표시`).

### 4. Filters

- 부문 `<select>` (전체 부문 + `AuditRules.DIVISIONS`), unchanged behaviour
  (`filterTemplatesByDivision`).
- **New:** a text filter next to it, matching 명칭 or 점검표번호
  (case-insensitive substring). Client-side, no debounce needed at this
  list size.

### 5. Template list

**Current templates only.** Superseded Local Templates (see CONTEXT.md) are
hidden by default. At the bottom of the list: a `이전 개정본 N개 보기`
toggle. When expanded, superseded rows/cards render below, visually dimmed
(reuse `.template-card-inactive`). The toggle is absent when N is 0.

**Responsive:**

- **≥ 768px — table.** Columns: 점검표번호 · 점검표 명칭 · 부문 · 개정번호
  · 개정일자 · 액션. **The 상태 column is removed.** Null 개정번호/일자
  render as `—`.
- **< 768px — cards.** Field hierarchy per card:
  - 명칭 (primary)
  - `번호 · 부문` (meta line 1)
  - `개정 N · 2026-07-01` (meta line 2; **omit this line entirely** when
    both revision fields are absent — do not render `—`)
  - actions row (see below)

**Row / card actions:**

| Audience | Desktop | Mobile card |
|---|---|---|
| Logged out (auditor) | no actions | no actions |
| Logged in (Registrant) | `다운로드` `수정` `이력` `삭제` in the 액션 column | `다운로드` visible + `수정` `이력` `삭제` behind a `⋯` (관리) toggle |

- `다운로드` (`downloadTemplateExcel`) is **not shown to logged-out users** —
  an auditor cannot re-register an .xlsx, so it has no purpose for them.
- `수정` / `이력` require `t.source === 'supabase'` (unchanged).
- `삭제` (`deleteTemplate`) keeps its current single `confirm()` naming
  Supabase deletion.
- Row/card body click does nothing (button-only). A template detail view is
  explicitly out of scope.

**Sort:** 부문 ascending, then 명칭 ascending (`localeCompare(…, 'ko')`).
Drop the current `importedAt`-descending primary sort — a management console
should be scannable, not ordered by sync time.

### 6. Empty states

- **No current templates at all:**
  - Online: `등록된 점검표가 없습니다.` + `[지금 동기화]` (+ `[로그인]` when
    logged out).
  - Offline: `오프라인입니다. 온라인 상태에서 동기화하세요.` + disabled or
    toast-on-tap `[지금 동기화]`.
- **Filter matches nothing (templates exist):** `이 조건에 해당하는 점검표가
  없습니다.` — no sync button.

### 7. 기기 · 백업 section

A single `<details>` (collapsed by default), labelled **기기 · 백업** — not
"설정". Shown to both audiences. Contents, in order:

1. **백업 및 복원** card — `[백업]` (`exportLocalBackup`) / `[복원]`
   (`selectLocalBackup`). First because data-loss is the real risk and this
   is the mitigation.
2. **기기 저장공간** card — `updateStorageStatus`, unchanged.
3. **데이터 보관 안내** panel — unchanged copy.
4. **저장 데이터 리셋** (Registrant only) — nested inside a second
   warning-coloured `<details>` (`위험 · 저장 데이터 삭제`), collapsed:
   - `심사 기록 초기화` (`resetAuditData`) — keeps its `confirm()`.
   - `점검표 초기화` (`resetTemplateData`) — keeps its `confirm()`.
   - `전체 로컬 데이터 삭제` (`resetAllLocalData`) — **upgraded to a typed
     confirmation**: user must type `삭제` into a field before the button
     enables, in addition to (or replacing) the current double `confirm()`.

**Removed from this section entirely:** the 공식 점검표 동기화 info panel
(its essence moves to the sync strip), the login card, and the "심사원
화면" notice.

## Out of scope

- The `openNewChecklistModal` → review-wizard registration flow itself.
- A template detail / preview view.
- A separate top-level 설정 tab.
- The 홈 tab's "공식 점검표" shortcut button (keep as-is; it still lands here).

## Files this will touch (implementation, later)

- `index.html` — `renderTemplates` (full rewrite of the template string),
  plus small helpers: text-filter state, the `이전 개정본` toggle, typed
  confirmation for `resetAllLocalData`.
- `styles.css` — responsive table→card rules for the template list (there is
  unused `.template-list-grid` / `.template-format-card` scaffolding to build
  on), session bar, sync strip, nested warning `<details>`.
- `tests/checklist-ui.test.js` — several assertions encode current markup:
  the `+ 점검표 등록` button string (line ~317), the `수정`/`이력`/`삭제`
  visibility ternaries (lines ~329, ~336, ~355). These must be updated in
  lockstep with the rewrite, not worked around.
- `backup.js` — `resetAllLocalData` typed-confirmation change.

## Testing (implementation, later)

- `npm test` green; update the `checklist-ui.test.js` assertions above.
- Manual: logged-out vs logged-in; empty / filtered-empty / populated;
  mobile < 768 (cards, `⋯` menu) vs desktop table; superseded-copies toggle;
  offline sync strip; typed confirmation on 전체 삭제; backup/restore still
  reachable.
