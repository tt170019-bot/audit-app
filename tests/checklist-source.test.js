const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');

const context = { globalThis: {} };
vm.runInNewContext(fs.readFileSync(require.resolve('../checklist-source.js'), 'utf8'), context);
const source = context.globalThis.ChecklistSource;

const rows = source.extractRows([
  ['Section', 'No.', 'Question'],
  ['운항', 'ORG 1.1.1', '절차가 있는가?', 'INT-1'],
  ['운항', 'ORG 1.1.2', ''],
]);

assert.equal(rows.length, 1);
assert.equal(rows[0].section, '운항');
assert.equal(rows[0].ref, 'ORG 1.1.1');
assert.equal(rows[0].type, 'YES/NO/OBS/N/A');

console.log('checklist source tests passed');
