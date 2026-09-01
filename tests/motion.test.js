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
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition: none !important/,
  'reduced-motion disables the transition in CSS too',
);

// Wiring
assert.match(html, /<script src="motion\.js"><\/script>/, 'motion.js is loaded');
assert.match(sw, /'\.\/motion\.js'/, 'motion.js is precached for offline');

console.log('motion tests passed');
