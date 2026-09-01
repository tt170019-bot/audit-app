# Warm Monochrome Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the audit checklist PWA to the `minimalist-ui` aesthetic — warm monochrome canvas, charcoal primary, washed status pastels, tighter radius, near-zero shadows, quiet section headers, one-shot scroll-reveal motion — with no DOM or render-function changes.

**Architecture:** Token-layer reskin. Almost all change lands in `styles.css` `:root` custom properties and a handful of rule bodies. One new self-contained script (`motion.js`) adds scroll-reveal by watching `#content` / `<body>` for re-renders — no edits to `renderTab`, `renderChecklist`, or any render path. Inline SVG icons get a uniform heavier stroke. `DESIGN.md` is rewritten to describe the new system.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no framework. Offline-first PWA with a network-first service worker (`sw.js`). Tests are plain Node scripts under `tests/*.test.js`, run by `tests/run.js` via `npm test` — no test framework. UI is verified by regex assertions over concatenated source text, not a DOM.

**Spec:** `docs/superpowers/specs/2026-09-02-minimalist-ui-warm-monochrome-reskin-design.md`

## Global Constraints

- **No build step, no bundler, no new dependency.** The repo has zero `dependencies` and zero `devDependencies`; keep it that way.
- **Offline-first: all assets local and same-origin.** No Google Fonts, no CDN links. Every new file that must survive offline goes into `sw.js` `CACHE_FILES`.
- **Pretendard is the only typeface.** No serif. No new font asset. `sw.js` font caching (`./fonts/PretendardVariable.woff2`) is unchanged.
- **Do not rename CSS classes.** `tests/checklist-ui.test.js` regex-matches class names and markup in concatenated source; a rename silently defeats an assertion. Change values and rule bodies, not selectors.
- **Korean UI text is never `text-transform: uppercase`.** Editorial hierarchy on Korean strings comes from size, weight, colour, and mild `letter-spacing` only. The existing Latin caption labels (`RESULT` / `COMMENT(S)` / `EVIDENCE`) keep their uppercasing.
- **Light mode only.** `color-scheme: light` and the single light palette stay.
- **No decorative imagery, illustrations, gradients, or ambient gradient blobs.** The `minimalist-ui` photography / illustration / radial-blob directives do not apply to this field tool.
- **`prefers-reduced-motion: reduce` must fully disable the reveal animation** — no opacity fade, no transform, no transition.
- Commit after every task. Run `npm test` before starting Task 1 and after every task; it must stay green.

---

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `styles.css` | All visual tokens and rule changes; scroll-reveal base/transition CSS | 1, 2, 4 |
| `index.html` | Inline SVG icon stroke; `<script src="motion.js">` tag | 3, 4 |
| `audit-detail.js` | Two inline SVG icons (camera, checklist) | 3 |
| `photo.js` | One inline SVG icon (camera) | 3 |
| `motion.js` | **New.** Self-contained one-shot scroll-reveal via IntersectionObserver + MutationObserver | 4 |
| `sw.js` | Add `./motion.js` to `CACHE_FILES` | 4 |
| `DESIGN.md` | Full rewrite to the new system | 5 |
| `tests/design-tokens.test.js` | **New.** Regex guards on token values and key rule changes | 1, 2 |
| `tests/icons.test.js` | **New.** Regex guards: no thin strokes, round caps present | 3 |
| `tests/motion.test.js` | **New.** Regex guards on `motion.js` shape + wiring | 4 |
| `tests/checklist-ui.test.js` | Add `'../motion.js'` to the `source` array | 4 |

---

## Task 1: Colour, shape, and type tokens

**Files:**
- Modify: `styles.css` — the `:root` block (roughly lines 8–150)
- Test: `tests/design-tokens.test.js` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: token values that Task 2's rule edits and Task 4's reveal CSS rely on — notably `--radius-large: 0.75rem`, `--radius-medium: 0.5rem`, `--radius-small: 0.375rem` (unchanged, reused for buttons/badges), `--shadow-card-hover`, `--ads-brand: #1A1A18`, `--page-bg: #F7F6F3`.

- [ ] **Step 1: Write the failing test**

Create `tests/design-tokens.test.js`:

```js
const assert = require('assert/strict');
const fs = require('fs');
const css = fs.readFileSync(require.resolve('../styles.css'), 'utf8');

// Warm monochrome canvas + neutrals
assert.match(css, /--page-bg:\s*#F7F6F3;/, 'page background is warm bone');
assert.match(css, /--border-subtle:\s*#EAEAEA;/, 'subtle border is the minimalist-ui neutral');
assert.match(css, /--text-primary:\s*#1F1F1D;/, 'body text is warm charcoal, not cool');

// Colour is scarce: charcoal primary, no indigo left anywhere
assert.match(css, /--ads-brand:\s*#1A1A18;/, 'primary accent is charcoal');
assert.doesNotMatch(css, /#4F46E5/i, 'no indigo brand hue remains');
assert.doesNotMatch(css, /#4338CA/i, 'no indigo pressed hue remains');
assert.doesNotMatch(css, /#EEF0FE/i, 'no indigo-tinted selection background remains');

// Washed status pastels (minimalist-ui values)
assert.match(css, /--ads-success-bg:\s*#EDF3EC;/, 'YES background is washed green');
assert.match(css, /--ads-success-text:\s*#346538;/, 'YES text is washed green');
assert.match(css, /--ads-danger-bg:\s*#FDEBEC;/, 'NO background is washed red');
assert.match(css, /--ads-danger-text:\s*#9F2F2D;/, 'NO text is washed red');
assert.match(css, /--ads-obs-bg:\s*#F0EEFA;/, 'OBS background is washed lavender');
assert.match(css, /--ads-obs-text:\s*#5B4B96;/, 'OBS text is washed lavender');

// Solid destructive button keeps real contrast
assert.match(css, /--ads-danger:\s*#DC2626;/, 'solid danger button colour stays high-contrast');

// Near-zero resting shadow + a defined hover lift
assert.match(css, /--shadow-card:\s*0 1px 2px rgba\(0, ?0, ?0, ?0\.03\);/, 'resting card shadow is near-zero');
assert.match(css, /--shadow-card-hover:\s*0 2px 8px rgba\(0, ?0, ?0, ?0\.04\);/, 'hover lift token exists');

// Crisp radius
assert.match(css, /--radius-large:\s*0\.75rem;/, 'card radius is 12px');
assert.match(css, /--radius-medium:\s*0\.5rem;/, 'control radius is 8px');

// Editorial type contrast (Pretendard only — scale, not serif)
assert.match(css, /--font-page-title-size:\s*1\.5rem;/, 'page title scaled up for contrast');
assert.match(css, /--font-kpi-size:\s*2rem;/, 'KPI number scaled up for contrast');

// Focus ring is the minimalist-ui pale blue
assert.match(css, /--focus-ring:\s*0 0 0 0\.1875rem #E1F3FE;/, 'focus ring is pale blue');

console.log('design token tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/design-tokens.test.js`
Expected: FAIL on the first assertion (`--page-bg` still `#F4F5F7`).

- [ ] **Step 3: Edit the `:root` block in `styles.css`**

Apply exactly these value changes inside `:root` (keep every other line, keep declaration order):

```css
  --page-bg: #F7F6F3;
  --border-subtle: #EAEAEA;
  --border-control: #DAD9D4;
  --divider: #EEEEEB;
  --selected-bg: #E1F3FE;
  --selected-text: #1F6C9F;
  --text-primary: #1F1F1D;
  --text-secondary: #6B6B66;
```

```css
  --ads-text-subtlest: #9A9A93;
  --ads-link: #1F6C9F;
```

```css
  --ads-surface-container: #F2F1EE;
  --ads-surface-container-hovered: #EAE8E3;
  --ads-border-bold: #C4C3BD;
  --ads-brand: #1A1A18;
  --ads-brand-hovered: #333331;
  --ads-brand-pressed: #333331;
  --ads-danger: #DC2626;
  --ads-danger-bg: #FDEBEC;
  --ads-danger-text: #9F2F2D;
  --ads-warning-bg: #FBF3DB;
  --ads-warning-bold: #C08A1E;
  --ads-warning-text: #956400;
  --ads-success-bg: #EDF3EC;
  --ads-success-bold: #346538;
  --ads-success-text: #346538;
  --ads-obs-bg: #F0EEFA;
  --ads-obs-bold: #5B4B96;
  --ads-obs-text: #5B4B96;
  --ads-information-bold: #1F6C9F;
  --ads-neutral-bg: #F1F1EF;
  --ads-neutral-bold: #8A8A83;
  --ads-neutral-text: #6B6B66;
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-card-hover: 0 2px 8px rgba(0, 0, 0, 0.04);
  --focus-ring: 0 0 0 0.1875rem #E1F3FE;
```

Leave `--ads-information-bg: var(--selected-bg)` and `--ads-information-text: var(--selected-text)` as-is (they follow the new pale blue automatically). Add the new `--shadow-card-hover` line immediately after `--shadow-card`.

Then the KPI / page-title scale and the shadow-overlay:

```css
  --shadow-overlay: 0 8px 32px rgba(0, 0, 0, 0.12);
```

```css
  --font-kpi-size: 2rem;                  /* 32px */
  --font-kpi-line: 2.25rem;               /* 36px */
  --font-page-title-size: 1.5rem;         /* 24px */
  --font-page-title-line: 1.9rem;         /* 30px */
```

Then radius:

```css
  --radius-medium: 0.5rem;
  --radius-large: 0.75rem;
  --radius-xlarge: 0.875rem;
  --radius-xxlarge: 1rem;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/design-tokens.test.js`
Expected: PASS — `design token tests passed`.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all test files pass. (No existing test asserts on CSS, so nothing else should move.)

- [ ] **Step 6: Commit**

```bash
git add styles.css tests/design-tokens.test.js
git commit -m "style: warm-monochrome token palette, charcoal primary, crisp radius"
```

---

## Task 2: Component rule adjustments

**Files:**
- Modify: `styles.css` — rule bodies (see each step for the selector and current line neighbourhood)
- Test: `tests/design-tokens.test.js` (extend)

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Add the failing assertions**

Append to `tests/design-tokens.test.js`, before the final `console.log`:

```js
// Primary CTA: charcoal, crisp corner, no shadow
assert.match(
  css,
  /\.btn-primary, \.btn-teal \{[^}]*border-radius: var\(--radius-small\);[^}]*\}/,
  'primary buttons use the 6px crisp radius',
);
assert.match(
  css,
  /\.btn-primary, \.btn-teal \{[^}]*box-shadow: none;[^}]*\}/,
  'primary buttons have no shadow',
);

// Section headers become quiet labels, not headings
assert.match(
  css,
  /\.section-header \{[^}]*color: var\(--ads-text-subtlest\);[^}]*\}/,
  'section headers use the subtlest text colour',
);
assert.doesNotMatch(
  css,
  /\.section-header \{[^}]*text-transform: uppercase[^}]*\}/,
  'section headers are not uppercased (Korean text)',
);

// Accordion toggles use + / − , never a chevron glyph or rotation
assert.doesNotMatch(css, /content: '⌄'/, 'no chevron glyph on accordion toggles');
assert.doesNotMatch(css, /transform: rotate\(180deg\)/, 'no rotation on accordion toggles');
assert.match(css, /\.check-reference-toggle::after \{[^}]*content: '\+';[^}]*\}/, 'reference toggle shows +');
assert.match(
  css,
  /\.check-input-reference\[open\] \.check-reference-toggle::after \{ content: '−'; \}/,
  'open reference toggle shows −',
);

// Interactive card hover lift
assert.match(
  css,
  /\.audit-item:hover, \.audit-item:active \{[^}]*box-shadow: var\(--shadow-card-hover\);[^}]*\}/,
  'audit list items lift on hover',
);

// Item-number chip is quiet (outline, not filled)
assert.match(
  css,
  /\.check-input-no \{[^}]*background: transparent;[^}]*\}/,
  'item number chip is transparent with a border',
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/design-tokens.test.js`
Expected: FAIL on the `.btn-primary, .btn-teal` radius assertion.

- [ ] **Step 3: Edit `.btn-primary, .btn-teal`**

Current (≈ line 186):

```css
.btn-primary, .btn-teal { background: var(--ads-brand); border-color: var(--ads-brand); color: var(--ads-text-inverse); }
```

Replace with:

```css
.btn-primary, .btn-teal { background: var(--ads-brand); border-color: var(--ads-brand); color: var(--ads-text-inverse); border-radius: var(--radius-small); box-shadow: none; }
```

- [ ] **Step 4: Edit `.section-header`**

Current (≈ line 173):

```css
.section-header { padding: var(--space-200) var(--mobile-page-padding) var(--space-100); font-size: var(--font-section-title-size); line-height: var(--font-section-title-line); font-weight: var(--ads-weight-semibold); letter-spacing: -0.01em; color: var(--ads-text-subtle); }
```

Replace with:

```css
.section-header { padding: var(--space-200) var(--mobile-page-padding) var(--space-100); font-size: var(--font-helper-size); line-height: var(--font-helper-line); font-weight: var(--ads-weight-medium); letter-spacing: 0.02em; color: var(--ads-text-subtlest); }
```

- [ ] **Step 5: Edit the accordion toggle glyphs**

`.check-reference-toggle::after` (≈ line 356). Current:

```css
.check-reference-toggle::after { content: '⌄'; flex: 0 0 auto; color: var(--ads-text-subtlest); font-size: var(--font-body-size); transition: transform 150ms ease; }
.check-input-reference[open] .check-reference-toggle::after { transform: rotate(180deg); }
```

Replace both lines with:

```css
.check-reference-toggle::after { content: '+'; flex: 0 0 auto; color: var(--ads-text-subtlest); font-size: var(--font-body-size); font-weight: var(--ads-weight-medium); }
.check-input-reference[open] .check-reference-toggle::after { content: '−'; }
```

`.templates-settings-toggle::after` (≈ line 510). Current:

```css
.templates-settings-toggle::after { content: '⌄'; color: var(--ads-text-subtlest); font-size: var(--font-body-size); transition: transform 150ms ease; }
.templates-settings[open] > .templates-settings-toggle::after { transform: rotate(180deg); }
```

Replace both lines with:

```css
.templates-settings-toggle::after { content: '+'; color: var(--ads-text-subtlest); font-size: var(--font-body-size); font-weight: var(--ads-weight-medium); }
.templates-settings[open] > .templates-settings-toggle::after { content: '−'; }
```

- [ ] **Step 6: Edit `.audit-item` hover for the lift + transition**

Current (≈ lines 260–261):

```css
.audit-item { margin: var(--space-0) var(--mobile-page-padding) var(--card-stack-gap); padding: var(--space-200); cursor: pointer; transition: background-color 150ms ease, border-color 150ms ease; }
.audit-item:hover, .audit-item:active { background: var(--ads-surface-container); border-color: var(--ads-border-bold); }
```

Replace with:

```css
.audit-item { margin: var(--space-0) var(--mobile-page-padding) var(--card-stack-gap); padding: var(--space-200); cursor: pointer; transition: background-color 150ms ease, border-color 150ms ease, box-shadow 200ms ease; }
.audit-item:hover, .audit-item:active { background: var(--ads-surface-container); border-color: var(--ads-border-bold); box-shadow: var(--shadow-card-hover); }
```

- [ ] **Step 7: Edit `.check-input-no`**

Current (≈ line 349):

```css
.check-input-no { flex: 0 0 var(--space-500); width: var(--space-500); height: var(--space-500); display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-large); background: var(--ads-surface-container); color: var(--ads-text); font-size: var(--font-control-size); line-height: var(--font-control-line); font-weight: var(--ads-weight-medium); font-variant-numeric: tabular-nums; }
```

Replace with:

```css
.check-input-no { flex: 0 0 var(--space-500); width: var(--space-500); height: var(--space-500); display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-medium); background: transparent; border: var(--ui-border-width) solid var(--ads-border); color: var(--ads-text); font-size: var(--font-control-size); line-height: var(--font-control-line); font-weight: var(--ads-weight-medium); font-variant-numeric: tabular-nums; }
```

- [ ] **Step 8: Small type-contrast touches**

- `.badge` (≈ line 201): add `letter-spacing: 0.05em;` before the closing brace.
- `.result-panel-title, .maturity-panel-title, .comment-panel-title, .check-label` (≈ line 366): change `letter-spacing: 0.04em` to `letter-spacing: 0.06em`.
- `.stat-val` (≈ line 247): add `letter-spacing: -0.03em; font-variant-numeric: tabular-nums;` before the closing brace.
- `.home-title` (≈ line 273): change `letter-spacing: -0.01em` to `letter-spacing: -0.02em`.
- `.detail-title` (≈ line 299): add `letter-spacing: -0.02em;` before the closing brace.
- Desktop macro-whitespace — inside `@media (min-width: 48rem)` (≈ line 410 block), add a rule:

```css
  #content.web-content .section-header { padding-top: var(--space-400); }
```

- [ ] **Step 9: Run the token test, then the full suite**

Run: `node tests/design-tokens.test.js` → PASS
Run: `npm test` → all pass

- [ ] **Step 10: Commit**

```bash
git add styles.css tests/design-tokens.test.js
git commit -m "style: quiet section headers, +/- accordions, hover lift, type contrast"
```

---

## Task 3: Heavier icon stroke

**Files:**
- Modify: `index.html` (inline SVGs at lines ~50, 53, 56, 59, 162, 210, 214, 574, 578, 609, 848, 868–880)
- Modify: `audit-detail.js` (lines ~261, ~498)
- Modify: `photo.js` (line ~70)
- Test: `tests/icons.test.js` (create)

**Interfaces:** none.

Rationale: `minimalist-ui` bans thin-line icon sets and wants Phosphor Bold/Fill. A full path swap is deferred to Approach B; for now, normalise every inline icon to a heavier uniform stroke with round caps/joins. This is a documented deviation, recorded in `DESIGN.md` (Task 5).

- [ ] **Step 1: Write the failing test**

Create `tests/icons.test.js`:

```js
const assert = require('assert/strict');
const fs = require('fs');
const files = ['../index.html', '../audit-detail.js', '../photo.js'];
const src = files.map(p => fs.readFileSync(require.resolve(p), 'utf8')).join('\n');

assert.doesNotMatch(src, /stroke-width="1\.5"/, 'no 1.5px icon strokes remain');
assert.doesNotMatch(src, /stroke-width="1\.8"/, 'no 1.8px icon strokes remain');
assert.doesNotMatch(src, /stroke-width="2"/, 'no bare 2px icon strokes remain (normalise to 2.25)');
assert.match(src, /stroke-linecap="round" stroke-linejoin="round"/, 'icons use round caps and joins');

console.log('icon tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/icons.test.js`
Expected: FAIL on `stroke-width="1.5"`.

- [ ] **Step 3: Normalise strokes in `index.html`**

Do three global replacements across `index.html`. In every inline `<svg>` opening tag the attribute string is `stroke="currentColor" stroke-width="X"`. Replace:

- `stroke="currentColor" stroke-width="1.8"` → `stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"`
- `stroke="currentColor" stroke-width="1.5"` → `stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"`
- `stroke="currentColor" stroke-width="2">` → `stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">`
- `stroke="currentColor" stroke-width="2.5">` → `stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">`

(The trailing `>` in the last two disambiguates `stroke-width="2"` from `stroke-width="2.25"` and `stroke-width="2.5"` from `stroke-width="2.55"` etc. — match the exact strings shown.)

- [ ] **Step 4: Normalise strokes in `audit-detail.js` and `photo.js`**

Both use `stroke="currentColor" stroke-width="1.5"` inside template-literal SVG strings. Apply the same replacement:

- `stroke="currentColor" stroke-width="1.5"` → `stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"`

`audit-detail.js` has two occurrences (camera icon ~line 261, checklist icon ~line 498); `photo.js` has one (~line 70). `replace_all` is safe here.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/icons.test.js`
Expected: PASS — `icon tests passed`.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all pass. `checklist-ui.test.js` matches icon markup only for the `+` icon in `.quick-actions` by class, not stroke — unaffected. Confirm.

- [ ] **Step 7: Commit**

```bash
git add index.html audit-detail.js photo.js tests/icons.test.js
git commit -m "style: heavier uniform icon stroke with round caps"
```

---

## Task 4: Scroll-reveal motion

**Files:**
- Create: `motion.js`
- Modify: `index.html` — one `<script>` tag before `</body>` (after the existing final inline `</script>` at line ~1127)
- Modify: `sw.js` — add `./motion.js` to `CACHE_FILES`
- Modify: `styles.css` — append the reveal base/transition/reduced-motion block at end of file
- Modify: `tests/checklist-ui.test.js` — add `'../motion.js'` to the `source` array
- Test: `tests/motion.test.js` (create)

**Interfaces:**
- Consumes: `--shadow-card-hover` is unrelated; the reveal CSS uses literal `cubic-bezier(0.16, 1, 0.3, 1)` and `0.75rem`.
- Produces: adds class `motion-ready` to `<body>` on load (when supported); adds class `is-revealed` to each target once it enters the viewport. No global functions, no exports — a self-invoking IIFE.

- [ ] **Step 1: Write the failing test**

Create `tests/motion.test.js`:

```js
const assert = require('assert/strict');
const fs = require('fs');

const motion = fs.readFileSync(require.resolve('../motion.js'), 'utf8');
const css = fs.readFileSync(require.resolve('../styles.css'), 'utf8');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const sw = fs.readFileSync(require.resolve('../sw.js'), 'utf8');

// motion.js shape
assert.match(motion, /new IntersectionObserver\(/, 'uses IntersectionObserver');
assert.match(motion, /new MutationObserver\(/, 'rescans on re-render via MutationObserver');
assert.match(motion, /\.unobserve\(/, 'reveal is one-shot (unobserve after reveal)');
assert.match(motion, /prefers-reduced-motion: reduce/, 'honours reduced motion');
assert.match(motion, /classList\.add\(['"]motion-ready['"]\)/, 'sets body.motion-ready as a support gate');
assert.doesNotMatch(motion, /addEventListener\(\s*['"]scroll['"]/, 'never listens to scroll events');

// CSS reveal states, gated on body.motion-ready so a JS failure never hides content
assert.match(css, /body\.motion-ready .+:not\(\.is-revealed\)/, 'hidden state is gated on motion-ready');
assert.match(css, /cubic-bezier\(0\.16, ?1, ?0\.3, ?1\)/, 'reveal easing matches the spec');
assert.match(
  css,
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.is-revealed[\s\S]*?transition: none/,
  'reduced-motion disables the transition in CSS too',
);

// Wiring
assert.match(html, /<script src="motion\.js"><\/script>/, 'motion.js is loaded');
assert.match(sw, /'\.\/motion\.js'/, 'motion.js is precached for offline');

console.log('motion tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/motion.test.js`
Expected: FAIL — `Cannot find module '../motion.js'`.

- [ ] **Step 3: Create `motion.js`**

```js
// motion.js — one-shot scroll-reveal for cards and list items.
//
// Self-contained: no edits to any render function. A MutationObserver on
// <body> catches every SPA re-render (tab switch, checklist open, modal
// open) and hands freshly added targets to an IntersectionObserver, which
// reveals each one the first time it scrolls into the viewport, then
// forgets it. prefers-reduced-motion short-circuits to an instant reveal.
(function () {
  'use strict';

  var SELECTOR =
    '.card, .audit-item, .field-check-card, .stat-card, .template-format-card, .export-card';

  if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) {
    // Unsupported: never add motion-ready, so the hidden-state CSS below
    // (scoped to body.motion-ready) never applies and everything shows.
    return;
  }

  var body = document.body;
  body.classList.add('motion-ready');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var io = new IntersectionObserver(
    function (entries) {
      var batch = 0;
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var el = entries[i].target;
        io.unobserve(el);
        el.style.transitionDelay = Math.min(batch, 6) * 80 + 'ms';
        el.classList.add('is-revealed');
        batch++;
      }
    },
    { root: null, threshold: 0.05, rootMargin: '0px 0px -6% 0px' }
  );

  function scan() {
    var targets = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      if (el.classList.contains('is-revealed') || el.dataset.revealSeen) continue;
      el.dataset.revealSeen = '1';
      if (reduce.matches) {
        el.classList.add('is-revealed');
      } else {
        io.observe(el);
      }
    }
  }

  var pending = 0;
  var mo = new MutationObserver(function () {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = 0;
      scan();
    });
  });
  mo.observe(body, { childList: true, subtree: true });

  // If the user flips the OS setting mid-session, re-evaluate.
  var onReduceChange = function () { scan(); };
  if (reduce.addEventListener) reduce.addEventListener('change', onReduceChange);
  else if (reduce.addListener) reduce.addListener(onReduceChange);

  scan();
})();
```

- [ ] **Step 4: Append the reveal CSS to `styles.css`**

At the very end of `styles.css`:

```css
/* ── Scroll-reveal (motion.js) ─────────────────────────────────────── */
body.motion-ready .card,
body.motion-ready .audit-item,
body.motion-ready .field-check-card,
body.motion-ready .stat-card,
body.motion-ready .template-format-card,
body.motion-ready .export-card {
  transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
body.motion-ready .card:not(.is-revealed),
body.motion-ready .audit-item:not(.is-revealed),
body.motion-ready .field-check-card:not(.is-revealed),
body.motion-ready .stat-card:not(.is-revealed),
body.motion-ready .template-format-card:not(.is-revealed),
body.motion-ready .export-card:not(.is-revealed) {
  opacity: 0;
  transform: translateY(0.75rem);
}
body.motion-ready .is-revealed {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  body.motion-ready .card,
  body.motion-ready .audit-item,
  body.motion-ready .field-check-card,
  body.motion-ready .stat-card,
  body.motion-ready .template-format-card,
  body.motion-ready .export-card {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 5: Add the script tag to `index.html`**

Between the final `</script>` (line ~1127) and `</body>` (line ~1128):

```html
<script src="motion.js"></script>
</body>
```

- [ ] **Step 6: Precache `motion.js` in `sw.js`**

In the `CACHE_FILES` array, add `'./motion.js',` immediately after `'./review-wizard.js',` and before `'./styles.css',`.

- [ ] **Step 7: Add `motion.js` to the checklist-ui test source list**

In `tests/checklist-ui.test.js`, add `'../motion.js',` to the `source` array (end of the list is fine). This keeps the "concatenate every shipped UI script" invariant from that file's header comment.

- [ ] **Step 8: Run tests**

Run: `node tests/motion.test.js` → PASS
Run: `npm test` → all pass

- [ ] **Step 9: Commit**

```bash
git add motion.js styles.css index.html sw.js tests/motion.test.js tests/checklist-ui.test.js
git commit -m "feat: one-shot scroll-reveal motion, reduced-motion safe"
```

---

## Task 5: Rewrite `DESIGN.md`

**Files:**
- Modify: `DESIGN.md` (full rewrite)

**Interfaces:** none.

- [ ] **Step 1: Replace the entire contents of `DESIGN.md` with:**

```markdown
# 심사 점검표 앱 디자인 기준

이 문서는 이 저장소의 화면 변경 기준입니다. 방향은 `minimalist-ui`
(warm monochrome editorial) 를 현장 심사 도구에 맞게 적용한 것입니다.
마케팅용 히어로·장식 카드·사진·일러스트·그라데이션은 이 앱에 적용하지
않습니다 — 기능 도구입니다.

## 방향

- 라이트 모드 전용
- Pretendard 로컬 가변폰트만 사용: `./fonts/PretendardVariable.woff2`.
  serif 없음. 에디토리얼 위계는 크기·굵기·자간·색 대비로만 만든다.
- 전체 배경은 웜본(`#F7F6F3`), 카드는 순백(`#FFFFFF`). 색은 희소
  자원이며 대부분 의미 전달에만 쓴다.
- 주 실행 색은 브랜드 색조가 아니라 차콜(`#1A1A18`)이다.

## 색상 토큰

- 배경 `--page-bg` #F7F6F3 / 카드 `--card-bg` #FFFFFF
- 본문 `--text-primary` #1F1F1D / 보조 `--text-secondary` #6B6B66 /
  흐린 라벨 `--ads-text-subtlest` #9A9A93
- 주 실행/선택/포커스 강조: 차콜 `--ads-brand` #1A1A18, hover #333331
- 포커스 링 `--focus-ring` `0 0 0 3px #E1F3FE` (pale blue), 선택 소프트
  배경 `--selected-bg` #E1F3FE
- 상태 색(카드·배지·상태 버튼 공용, 워시드 파스텔):
  - YES `--ads-success-bg` #EDF3EC / text #346538
  - NO  `--ads-danger-bg` #FDEBEC / text #9F2F2D
  - OBS `--ads-obs-bg` #F0EEFA / text #5B4B96 (워시드 라벤더)
  - N/A `--ads-neutral-bg` #F1F1EF / text #6B6B66
  - 경고 `--ads-warning-bg` #FBF3DB / text #956400
- 파괴적 실행 버튼(`.btn-danger`)의 솔리드 색은 대비 확보를 위해
  `#DC2626` 을 유지한다. 워시드 핑크는 흰 글자 대비가 부족하다.
- 카드 테두리 `--ads-border` #EAEAEA (1px)
- 그림자: 평상시 거의 없음 `--shadow-card` `0 1px 2px rgba(0,0,0,.03)`.
  상호작용 카드(`.audit-item`)만 hover 시 `--shadow-card-hover`
  `0 2px 8px rgba(0,0,0,.04)` 로 살짝 뜬다.

## 타이포그래피

- 본문·입력: 16px
- 페이지 제목: 24px / weight 600 / 자간 -0.02em
- KPI 숫자: 32px / weight 600 / 자간 -0.03em / tabular-nums
- 섹션 헤더: 13px / weight 500 / 흐린 색 / 자간 0.02em — 제목이 아니라
  조용한 라벨. 한글이므로 uppercase 하지 않는다.
- 필드 캡션 라벨(RESULT / COMMENT(S) / EVIDENCE, 라틴): 12px, 흐린 색,
  uppercase, 자간 0.06em 유지
- 버튼: 14px / weight 500
- 보조 텍스트: 13px

## 간격과 모양

- 기준 단위 4px
- 모바일 가장자리·카드 간격 14px(`--mobile-page-padding`), 인접 카드
  세로 간격 14px(`--card-stack-gap`), 데스크톱 그리드 gap 16px
- 데스크톱 섹션 헤더 상단 여백 32px(매크로 화이트스페이스). 모바일은
  현장 밀도를 위해 16px 유지
- 카드 radius 12px(`--radius-large`), 버튼·입력·작은 요소 8px
  (`--radius-medium`), 주 실행 버튼 6px(`--radius-small`)
- 모달 시트 상단 코너 16px

## 상태 버튼과 입력창

- 상태 버튼(YES/NO/OBS/N/A)은 테두리 없이 배경·텍스트 색으로만 구분.
  미선택 시 배경 `#F7F6F3`, 텍스트 보조 회색. 선택 시 해당 워시드
  파스텔 배경 + 해당 상태 텍스트 색.
- 입력창은 카드와 같은 흰 배경, 테두리로만 구분. 포커스 시 배경 그대로,
  테두리를 차콜로, `--focus-ring` pale blue 글로우 추가.
- 항목 번호 칩(`.check-input-no`)은 채우지 않고 1px 테두리 아웃라인으로
  조용하게 둔다.

## 컴포넌트

- 주 실행 버튼: 차콜 배경, 흰 글자, radius 6px, 그림자 없음,
  `:active` 시 `scale(0.98)`
- 배지: pill, 소형, uppercase(라틴), 자간 0.05em, 워시드 파스텔 배경
- 아코디언(참조 토글, 템플릿 설정): 컨테이너 박스 없음, `border-top`
  1px 만. 토글 표시는 회전 셰브런이 아니라 `+` / `−` 글리프 교체.

## 아이콘

- 현재: 인라인 SVG, stroke 2.25, round cap/join 통일.
- `minimalist-ui` 는 얇은 라인 아이콘 세트를 금지하고 Phosphor
  Bold/Fill 을 요구한다. 실제 Phosphor path 교체는 향후 작업(Approach
  B)으로 남긴다 — 오프라인 인라인 SVG 라 최소 변경을 우선했다.

## 상호작용과 모션

- 44px 는 모든 터치 조작 대상의 최소 클릭·터치 영역이다. 버튼의 보이는
  높이로 해석하지 않는다. 시각 크기가 44px 보다 작은 요소는 투명한 히트
  영역으로 44px 를 확보한다.
- 결과 상태는 색 외에 텍스트로도 구분한다.
- 스크롤 진입 시 카드·리스트 항목이 1회만 페이드+상승(12px, 600ms
  `cubic-bezier(.16,1,.3,1)`, 최대 6개 stagger)한다. `motion.js` 담당.
- `prefers-reduced-motion: reduce` 시 모션은 완전히 꺼진다(페이드·이동·
  트랜지션 없음). `motion.js` 미실행 시에도 콘텐츠는 항상 보인다
  (`body.motion-ready` 게이트).

## 유지 원칙 (현장 도구)

- 마케팅 히어로, 장식 카드, 그라데이션, 앰비언트 배경 없음
- 데스크톱에서도 바깥 여백을 없애지 않고 열·콘텐츠 폭으로 확장
- 밀도가 필요한 현장 화면에서는 모바일 간격을 데스크톱보다 촘촘히 둔다
```

- [ ] **Step 2: Verify no stale references**

Grep the new `DESIGN.md` for `#4F46E5`, `Linear`, `인디고`, `#F4F5F7` — expected: no matches (the Linear source-doc reference and indigo accent are intentionally gone).

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: all pass (docs-only change).

- [ ] **Step 4: Commit**

```bash
git add DESIGN.md
git commit -m "docs: rewrite DESIGN.md for the warm-monochrome system"
```

---

## Task 6: Full verification and manual QA

**Files:** none (fixes, if any regressions are found, amend the relevant task's files and commit separately).

**Interfaces:** none.

- [ ] **Step 1: Full automated suite**

Run: `npm test`
Expected: `N/N test files passed`, exit 0.

- [ ] **Step 2: Serve locally**

Run: `python -m http.server 8000` (or `npx serve .`) from the repo root; open `http://localhost:8000`. A static server is required — `file://` breaks the service worker and module loading.

- [ ] **Step 3: Manual QA matrix**

Check each at a mobile viewport (~390px), desktop ≥768px, and desktop ≥1025px:

- **홈**: KPI numbers legible (32px, washed status colours), quick-action buttons charcoal with 6px corners, recent-audit cards fade in on load and on scroll.
- **점검 기록**: list items lift on hover (desktop), fade in staggered; empty state icon uses the heavier stroke.
- **체크리스트 상세 — Type 1** (no maturity): result buttons show washed pastels when selected; `RESULT` / `COMMENT(S)` / `EVIDENCE` labels still uppercase with wider tracking; item-number chip is an outline, not a grey fill; Reference accordion shows `+`, flips to `−` on open, no box tint; field cards fade in as you scroll.
- **체크리스트 상세 — Type 2** (maturity): maturity panels render; selected maturity radio is charcoal-filled; multi-scale items still show independent panels.
- **섹션 내비게이션**: mobile bottom sheet + desktop left sidebar — active chip is charcoal, section headers read as quiet labels not headings.
- **하단 액션 바**: primary button charcoal, no shadow.
- **점검표**: list, division filter, settings accordion (`+`/`−`), `+ 점검표 등록` button (charcoal) when logged in; registrant login modal — bottom sheet on mobile, centred on desktop, 16px top corners.
- **검토 마법사**: `review-*` styling sits correctly on the new palette (step pills, scale boxes); active step pill is charcoal.
- **내보내기**: export cards, badges (washed pastels, 0.05em tracking).
- **모달 전반**: backdrop, sheet slide-up, sticky action row.
- **오프라인**: DevTools → Network → Offline, reload. Shell + `motion.js` served from cache; scroll-reveal still runs; icons still render.
- **prefers-reduced-motion**: DevTools → Rendering → "Emulate prefers-reduced-motion: reduce", reload. All cards appear immediately, no fade, no movement.
- **`motion.js` disabled** (DevTools → block `motion.js`, or Settings → Disable JavaScript for a hard check): every card and list item is fully visible — nothing is stuck at `opacity: 0`.

- [ ] **Step 4: Report spot-checks that do NOT need deep QA**

- `templates/report-type-1.html` and `report-type-2.html` and `report-export.js` output: these do not load `styles.css`. Confirm the files were not touched (`git diff --stat HEAD~6 -- templates report-export.js` shows nothing) and generate one Word + one PDF export to confirm they still open. No visual QA beyond "it opens and looks like before".

- [ ] **Step 5: If regressions were found and fixed, final commit**

```bash
git add -A
git commit -m "fix: QA follow-ups for warm-monochrome reskin"
```

Otherwise, nothing to commit — the work is done across Tasks 1–5.

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| 1. Colour tokens | Task 1 |
| 2. Typography | Task 1 (scale vars) + Task 2 (rule touches) |
| 3. Radius & spacing | Task 1 (radius vars) + Task 2 (desktop section-header padding) |
| 4. Components (buttons, badges, statuses, accordions, check-input-no, maturity radio, upload/photo) | Task 2. Note: `.field-choice` unselected background and `.maturity-radio`/`.upload-zone` follow the retokenised values from Task 1 with no rule edit — verified in Task 6 QA. |
| 5. Iconography | Task 3 |
| 6. Motion | Task 4 |
| 7. DESIGN.md rewrite | Task 5 |
| 8. Testing | `tests/design-tokens.test.js`, `tests/icons.test.js`, `tests/motion.test.js` across Tasks 1–4; manual matrix in Task 6 |

No spec requirement is left without a task. The spec's "deferred to Approach B" list (home bento, real Phosphor swap, monospace metadata) is intentionally out of scope and recorded in the rewritten `DESIGN.md`.

**Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to Task N". Every code step shows the exact old string and the exact replacement, or the full file body.

**Type consistency:** No functions defined across tasks. `motion.js` exposes no API (IIFE). CSS custom-property names used in later tasks (`--shadow-card-hover`, `--radius-small`, `--radius-large`, `--ads-brand`, `--ads-text-subtlest`, `--ads-border`, `--focus-ring`) are all either introduced in Task 1 or pre-existing and unchanged in name. The class `is-revealed` / body class `motion-ready` are spelled identically in `motion.js` (Task 4 Step 3), the reveal CSS (Task 4 Step 4), and `tests/motion.test.js` (Task 4 Step 1).
