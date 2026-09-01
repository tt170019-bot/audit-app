# Warm Monochrome Reskin (minimalist-ui, Approach A)

## Goal

Apply the `minimalist-ui` aesthetic — warm monochrome canvas, scarce
color, editorial typographic contrast, near-zero shadows, quiet motion —
to the existing audit checklist PWA **without restructuring the DOM or
the render functions**. This is a token-layer reskin: `:root` custom
properties plus targeted rule changes in `styles.css`, a small new motion
script, an icon stroke adjustment, and a rewrite of `DESIGN.md`.

Both the mobile-first layout and the desktop web layout (the build served
from GitHub) are in scope.

## Non-goals

- No DOM or render-function changes (that is Approach B, deferred).
- No home-screen bento grid, no desktop reading-column restructure
  (deferred to B).
- No new font asset. Pretendard remains the only typeface. No serif.
  `sw.js` font caching is unchanged.
- No decorative imagery, illustrations, gradients, or ambient gradient
  blobs. `DESIGN.md` already forbids these and the app is a functional
  field tool, not a marketing site. The `minimalist-ui`
  photography/illustration/radial-blob directives do not apply here.
- No real Phosphor icon-set swap (deferred to B). See Iconography.

## Constraints

- **Offline-first, no build step.** No Google Fonts, no CDN. All assets
  local and same-origin. Any new file must be added to `sw.js`
  `CACHE_FILES`.
- **`tests/checklist-ui.test.js` is text-regex over concatenated
  source.** Class renames or hardcoded hex values in that file can break
  it with zero behavior change. Keep class names stable; audit that file
  before finishing.
- **Korean UI text does not uppercase.** Editorial "eyebrow" section
  headers use size, weight, colour and mild tracking — never
  `text-transform: uppercase` on Hangul. The existing Latin field-caption
  labels (RESULT / COMMENT(S) / EVIDENCE) keep their uppercasing.
- **Light mode only.** `color-scheme: light` stays.

## Design

### 1. Colour tokens (`styles.css` `:root`)

Warm-neutralise the greys, make colour scarce, swap the indigo accent for
a charcoal one, wash out the status palette.

| Token | Current | New |
|---|---|---|
| `--page-bg` | `#F4F5F7` | `#F7F6F3` |
| `--card-bg` | `#FFFFFF` | unchanged |
| `--header-bg` / `--sidebar-bg` | `#FFFFFF` | unchanged |
| `--border-subtle` (`--ads-border`) | `#E6E8EC` | `#EAEAEA` |
| `--border-control` (`--ads-border-input`) | `#C8CED8` | `#DAD9D4` |
| `--ads-border-bold` | `#B1B5BE` | `#C4C3BD` |
| `--divider` | `#EEF0F3` | `#EEEEEB` |
| `--text-primary` | `#181B22` | `#1F1F1D` |
| `--text-secondary` | `#6B7280` | `#6B6B66` |
| `--ads-text-subtlest` | `#9AA1AC` | `#9A9A93` |
| `--ads-brand` | `#4F46E5` | `#1A1A18` |
| `--ads-brand-hovered` / `--ads-brand-pressed` | `#4338CA` | `#333331` |
| `--ads-link` | `#4F46E5` | `#1F6C9F` (pale-blue text tone; links only) |
| `--selected-bg` | `#EEF0FE` | `#E1F3FE` |
| `--selected-text` | `#4F46E5` | `#1F6C9F` |
| `--focus-ring` | `0 0 0 3px #EEF0FE` | `0 0 0 3px #E1F3FE` |
| `--ads-success-bg` / `-text` / `-bold` | `#EAF7EF` / `#16A34A` | `#EDF3EC` / `#346538` |
| `--ads-danger-bg` / `-text` | `#FDEEEE` / `#DC2626` | `#FDEBEC` / `#9F2F2D` |
| `--ads-obs-bg` / `-text` / `-bold` | `#F1EEFE` / `#8B7CF6` | `#F0EEFA` / `#5B4B96` |
| `--ads-neutral-bg` / `-text` / `-bold` | `#F1F2F4` / `#4B4F58` / `#62666D` | `#F1F1EF` / `#6B6B66` / `#8A8A83` |
| `--ads-warning-bg` / `-text` / `-bold` | `#FFF7D6` / `#7F5F01` / `#D9A214` | `#FBF3DB` / `#956400` / `#C08A1E` |
| `--ads-information-bg` / `-text` | `= --selected-*` | `= --selected-*` (follows) |
| `--shadow-card` | `0 2px 8px rgba(20,20,43,.06)` | `0 1px 2px rgba(0,0,0,.03)` |
| `--shadow-overlay` | `0 16px 40px rgba(0,0,0,.45)` | `0 8px 32px rgba(0,0,0,.12)` |

Notes:

- The `--ads-danger` (solid) token used by `.btn-danger` stays a
  readable `#DC2626` — a washed pink is not enough contrast for a
  white-text destructive button. Only the `-bg` / `-text` (badge / inline)
  danger tones wash out.
- `--ads-brand` is consumed by `.btn-primary`, `.btn-teal`, `.tab-btn.active`,
  `.desktop-nav-btn.active`, `.prog-fill`, `.stat-val`, `.maturity-card.selected
  .maturity-radio`, `.anchor-chip.is-current`, `.dot-new`, and the
  `.upload-zone` / focus borders. All of these become charcoal. Verify
  each reads well on its background (esp. `.stat-val` charcoal-on-white
  and `.prog-fill` charcoal bar).
- Add a `--shadow-card-hover: 0 2px 8px rgba(0,0,0,.04)` token for the
  card/`.audit-item` hover lift.

### 2. Typography (`styles.css` `:root` + rules)

Pretendard only. Editorial contrast from scale, weight, tracking.

| Variable | Current | New |
|---|---|---|
| `--font-page-title-size` / `-line` | `1.25rem` / `1.75rem` | `1.5rem` / `1.9rem` |
| `--font-kpi-size` / `-line` | `1.5rem` / `1.75rem` | `2rem` / `2.25rem` |

- `.home-title` / `.modal-title` / `.detail-title`: add
  `letter-spacing: -0.02em`.
- `.stat-val`: add `letter-spacing: -0.03em`, keep
  `font-variant-numeric: tabular-nums`.
- `.section-header`: drop from `--font-section-title-size` (16px /
  weight 600) to **13px / weight 500 / `color: var(--ads-text-subtlest)`
  / `letter-spacing: 0.02em`**. No uppercase. This is the biggest single
  visual shift — section headers stop competing with content.
  `.detail-section-title` (inside `.section-header.detail-section-start`)
  follows the same treatment.
- `.result-panel-title` / `.maturity-panel-title` / `.comment-panel-title`
  / `.check-label` (the uppercased Latin caption labels): bump
  `letter-spacing` `0.04em` → `0.06em`. Keep uppercase.
- Body / input / button sizes unchanged.

### 3. Radius & spacing (`styles.css` `:root` + rules)

| Token | Current | New |
|---|---|---|
| `--radius-large` | `1.125rem` (18px) | `0.75rem` (12px) |
| `--radius-medium` | `0.5625rem` (9px) | `0.5rem` (8px) |
| `--radius-xxlarge` | `1.5rem` | `1rem` |
| `--radius-xlarge` | `1rem` | `0.875rem` |

- `.btn-primary` / `.btn-teal` / `.btn` primary variants: radius
  `--radius-small` (6px) rather than `--radius-medium`, per
  minimalist-ui CTA spec. `.btn-full` keeps `--radius-large` (now 12px).
- Desktop macro-whitespace: in the `@media (min-width: 48rem)` block,
  `.section-header` top padding `--space-200` → `--space-400`. Mobile
  section-header padding unchanged (density matters on a phone in the
  field).
- `--card-stack-gap` stays `0.875rem` (14px) on mobile;
  `@media (min-width: 48rem)` bumps the grid `gap` to `1rem`.

### 4. Components (`styles.css` rules)

- **Primary button** (`.btn-primary`, `.btn-teal` — names unchanged):
  `background`/`border-color` → `var(--ads-brand)` (now charcoal),
  `box-shadow: none`, `border-radius: var(--radius-small)`. `:hover` →
  `#333331`. `:active` keeps `transform: scale(0.98)`.
- **`.btn-danger`**: unchanged behaviour, solid `--ads-danger`.
- **Badges** (`.badge*`): pastel `-bg` / `-text` tokens update
  automatically; add `letter-spacing: 0.05em` to `.badge`. Already pill
  + small. `border-radius` stays `--radius-small` (badges are not
  containers; the `rounded-full` ban targets large elements).
- **Status buttons** (`.field-choice`): unselected `background` →
  `#F7F6F3` (`var(--page-bg)` already resolves to this after token
  change — no rule edit needed). Selected states inherit the washed
  pastel tokens. No border (unchanged).
- **Card hover** (`.card:hover`, `.audit-item:hover`): add
  `box-shadow: var(--shadow-card-hover)` with a `200ms` transition on
  `box-shadow`. `.audit-item` already transitions
  `background-color, border-color`; add `box-shadow`.
- **Accordions** — `.check-input-reference` / `.check-reference-toggle`
  and `.templates-settings` / `.templates-settings-toggle`:
  - Remove any background tint on the open panel; keep only the existing
    `border-top: 1px solid var(--divider)` (bump to `--ads-border`).
  - Replace the `⌄` pseudo-element glyph with `+`, and switch to `−`
    when `[open]` (via `.check-input-reference[open] .check-reference-toggle::after
    { content: '−'; }`), instead of the current `rotate(180deg)`.
    Keep the `150ms` transition off (glyph swap, no rotation).
  - Same treatment for `.check-input-refs` — no container tint, plain
    text rows.
- **`.check-input-no`** (the item-number chip): `background`
  `var(--ads-surface-container)` → `transparent` with
  `border: 1px solid var(--ads-border)`, keeping it quiet. Radius →
  `--radius-medium` (8px) rather than `--radius-large`.
- **`.maturity-radio`** selected: charcoal fill (follows `--ads-brand`).
- **`.upload-zone` / `.photo-add`** dashed borders: keep dashed, colour
  follows `--ads-border-bold` (now warm). `.upload-zone.drag` hover
  background → `var(--ads-information-bg)` (now pale blue).

### 5. Iconography (`index.html`)

The tab-bar SVGs and other inline SVGs use `stroke-width="1.8"` with
default (butt) caps. `minimalist-ui` bans thin-line icon sets and asks
for Phosphor Bold/Fill. A full Phosphor path swap across ~10 inline icons
is Approach-B scope. For Approach A:

- Change every inline icon `stroke-width` to `2.25`.
- Add `stroke-linecap="round" stroke-linejoin="round"` where missing.
- Standardise: all nav/action icons render at `1.5rem` (already the
  tab-bar size via `.tab-btn svg`).

This is a deliberate, documented deviation from the letter of the
`minimalist-ui` iconography rule, chosen to keep Approach A low-risk and
asset-free. `DESIGN.md` will record it and flag the Phosphor swap as
future work.

### 6. Motion (`motion.js` — new file)

- New same-origin file `motion.js`, loaded from `index.html` after the
  other scripts, added to `sw.js` `CACHE_FILES`.
- On load and after each `switchTab`, an `IntersectionObserver`
  (`root: document.getElementById('content')`, `threshold: 0.05`,
  `rootMargin: '0px 0px -8% 0px'`) watches `.card`, `.audit-item`,
  `.field-check-card`, `.stat-card`, `.template-format-card`,
  `.export-card`.
- On first intersection: element gets a class `is-revealed`; CSS
  transitions it from `{ opacity: 0; transform: translateY(12px); }` to
  `{ opacity: 1; transform: none; }` over `600ms
  cubic-bezier(0.16, 1, 0.3, 1)`. Unobserve after reveal (one-shot).
- Stagger: the observer sets `style.transitionDelay` from the element's
  index among its just-revealed siblings, capped
  (`Math.min(index, 6) * 80ms`), so a long list does not cascade for
  seconds.
- **Guardrails:**
  - `@media (prefers-reduced-motion: reduce)` — no initial offset, no
    transition; elements render final-state immediately. The JS still
    adds `is-revealed` (harmless) but the CSS makes it a no-op.
  - Elements already on screen at mount still animate once (a gentle
    first-paint reveal), but must not block interaction — pointer events
    stay live during the transition.
  - `switchTab` re-runs the observer setup against the newly rendered
    DOM. Because reveal is one-shot per element and the DOM is rebuilt
    per tab, re-entering a tab re-reveals — acceptable.
  - If `IntersectionObserver` is unavailable, `motion.js` immediately
    marks all targets `is-revealed` and returns.
- The reveal base state is scoped so a JS failure cannot leave content
  invisible: `motion.js` adds the class `motion-ready` to `<body>` as its
  very first action, and the hidden state is written as
  `body.motion-ready .card:not(.is-revealed) { opacity: 0; transform: translateY(12px); }`.
  If the script never runs, `motion-ready` is never set and everything
  renders visible.

### 7. `DESIGN.md` rewrite

Rewrite to describe the new system:

- Direction: warm monochrome, light only, Pretendard only (no serif),
  colour is scarce and mostly semantic.
- Colour token table (new values).
- Radius 12 / 8; near-zero resting shadow, subtle hover lift.
- Section headers are quiet labels, not headings.
- Primary action is charcoal, not a brand hue.
- Motion: one-shot scroll-reveal, reduced-motion honoured.
- **Keep** the field-tool rules verbatim: 44px minimum touch/hit area,
  status conveyed by colour *and* text, inputs distinguished by border
  not fill, no marketing hero / decorative cards / gradients.
- Record the icon-stroke deviation and name the Phosphor swap as
  deferred (Approach B).
- Keep the reference to `C:\Users\twayair\Downloads\DESIGN-linear.app.md`
  only if still accurate; otherwise drop it and note the source is now
  `minimalist-ui` adapted for a field tool.

### 8. Testing

- `npm test` green before starting and after finishing.
- Grep `tests/checklist-ui.test.js` (and the rest of `tests/`) for:
  - hardcoded hex values from the old palette
    (`4F46E5`, `181B22`, `F4F5F7`, `EEF0FE`, `16A34A`, `8B7CF6`, ...),
  - assertions on `--radius-large` / shadow / `section-header` sizing,
  - assertions on the `⌄` glyph or `rotate(180deg)`.
  Update any that encode the old design; leave behavioural assertions
  alone.
- Add `motion.js` to the `source` array in `checklist-ui.test.js` if that
  file's concatenation is expected to cover all shipped scripts (check
  its header comment / list first).
- Manual QA matrix (mobile viewport + desktop ≥768 + desktop ≥1025):
  - Home: KPIs, quick actions, recent audits.
  - 점검 기록 list + empty state.
  - Checklist detail — Type 1 (no maturity) and Type 2 (maturity
    panels), result buttons, comment, photo add, reference accordion,
    section navigation (mobile sheet + desktop sidebar), bottom action
    bar, progress bar.
  - 점검표 tab: list, filter, settings accordion, registrant login
    modal, review wizard (`review-*` styles unchanged but verify they
    still sit on the new palette).
  - 내보내기 tab: export cards, badges.
  - Modals: new audit, login — bottom-sheet on mobile, centred on
    desktop.
  - Offline: reload with network disabled, confirm shell + `motion.js`
    served from cache and reveal still runs.
  - `prefers-reduced-motion: reduce`: content appears with no transition.
- The generated Word/PDF reports (`report-export.js`,
  `templates/report-type-*.html`) are independent of `styles.css` —
  confirm they are untouched, no QA needed beyond a spot check.

## Files touched

| File | Change |
|---|---|
| `styles.css` | token values, typography rules, radius, component rules, accordion glyphs, hover shadows, reveal base state |
| `index.html` | inline SVG `stroke-width` / caps; `<script src="motion.js">` |
| `motion.js` | **new** — IntersectionObserver scroll-reveal |
| `sw.js` | add `./motion.js` to `CACHE_FILES` |
| `DESIGN.md` | full rewrite to the new system |
| `tests/checklist-ui.test.js` | update palette/design assertions; add `motion.js` to source list if applicable |

## Rollback

Entirely CSS + one additive script. Reverting the commit restores the
previous look with no data or behaviour impact. Service worker is
network-first, so a redeploy of the old `styles.css` propagates on next
load.

## Deferred to Approach B

- Home-screen bento grid; desktop reading-column / section-divider
  restructure (needs `core.js` / `audit-core.js` render changes).
- Real Phosphor Bold/Fill icon path swap.
- Monospace treatment for metadata (dates, revision numbers).
