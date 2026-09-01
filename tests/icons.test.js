const assert = require('assert/strict');
const fs = require('fs');
const files = ['../index.html', '../audit-detail.js', '../photo.js'];
const src = files.map(p => fs.readFileSync(require.resolve(p), 'utf8')).join('\n');

assert.doesNotMatch(src, /stroke-width="1\.5"/, 'no 1.5px icon strokes remain');
assert.doesNotMatch(src, /stroke-width="1\.8"/, 'no 1.8px icon strokes remain');
assert.doesNotMatch(src, /stroke-width="2"/, 'no bare 2px icon strokes remain (normalise to 2.25)');
assert.match(src, /stroke-linecap="round" stroke-linejoin="round"/, 'icons use round caps and joins');

console.log('icon tests passed');
