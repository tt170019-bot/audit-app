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

// ── Component rules ────────────────────────────────────────────────
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
assert.doesNotMatch(css, /content: '⌄'/, 'no chevron glyph on accordion toggles');
assert.doesNotMatch(css, /transform: rotate\(180deg\)/, 'no rotation on accordion toggles');
assert.match(css, /\.check-reference-toggle::after \{[^}]*content: '\+';[^}]*\}/, 'reference toggle shows +');
assert.match(
  css,
  /\.check-input-reference\[open\] \.check-reference-toggle::after \{ content: '−'; \}/,
  'open reference toggle shows −',
);
assert.match(
  css,
  /\.audit-item:hover, \.audit-item:active \{[^}]*box-shadow: var\(--shadow-card-hover\);[^}]*\}/,
  'audit list items lift on hover',
);
assert.match(
  css,
  /\.check-input-no \{[^}]*background: transparent;[^}]*\}/,
  'item number chip is transparent with a border',
);

console.log('design token tests passed');
