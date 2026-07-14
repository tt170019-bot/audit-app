const assert = require('assert/strict');
const rules = require('../audit-rules.js');

assert.equal(rules.inferReportTemplateType({filename:'checklist-2.xlsx'}), 'report-type-2');
assert.equal(rules.getChecklistUiType({filename:'report-type-2.xlsx'}), 'maturity');
assert.equal(rules.getChecklistUiType({filename:'2번 체크리스트.xlsx'}), 'maturity');
assert.equal(rules.getChecklistUiType({filename:'현장탑승심사표.xlsx'}), 'maturity');
assert.equal(rules.normalizeResultValue('ng'), 'NO');
assert.equal(rules.normalizeResultValue('na'), 'N/A');
assert.equal(rules.canCompleteAudit({items:[{result:'YES'}, {result:'OBS'}]}), true);
assert.equal(rules.canCompleteAudit({items:[{result:'YES'}, {result:''}]}), false);
assert.equal(rules.getMaturityConsideration({}, 'Leading').title, '예방과 개선 활동으로 절차를 고도화하는 수준');

console.log('audit-rules tests passed');
