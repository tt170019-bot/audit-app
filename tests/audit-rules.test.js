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

// wayfinder #7 — item-level maturity flag + template-level custom scale
assert.deepEqual(
  rules.deriveMaturityScale({checklistUiType:'maturity'}),
  {name:'성숙도 등급', labels:['Conformity','Established','Mature','Leading']},
  '기존 성숙도 체크리스트는 레거시 4단계 척도로 어댑팅되어야 합니다',
);
assert.equal(
  rules.deriveMaturityScale({checklistUiType:'standard'}), null,
  '일반 체크리스트는 척도가 없어야 합니다',
);
assert.deepEqual(
  rules.deriveMaturityScale({filename:'현장탑승심사표.xlsx'}),
  {name:'성숙도 등급', labels:['Conformity','Established','Mature','Leading']},
  'checklistUiType가 없으면 getChecklistUiType으로 재추론해야 합니다',
);

assert.equal(
  rules.getMaturityGuidanceForScale({conformityCriteria:'커스텀 기준 텍스트'}, ['Conformity','Established','Mature','Leading'], 0).title,
  '커스텀 기준 텍스트',
  '4단계 척도는 위치 기준으로 레거시 criteria 컬럼을 재사용해야 합니다',
);
assert.equal(
  rules.getMaturityGuidanceForScale({}, ['Conformity','Established','Mature','Leading'], 0).title,
  '',
  '4단계 척도라도 criteria 텍스트가 없으면 안내문 없이 비어 있어야 합니다 (커스텀 척도엔 기본 안내문 없음)',
);
assert.equal(
  rules.getMaturityGuidanceForScale({conformityCriteria:'있어도 무시됨'}, ['1','2','3'], 0).title,
  '',
  '4단계가 아닌 척도는 레거시 criteria 컬럼을 재사용하지 않아야 합니다',
);
assert.equal(
  rules.getMaturityGuidanceForScale({maturityGuidance:['직접 입력한 안내문']}, ['1','2','3'], 0).title,
  '직접 입력한 안내문',
  '4단계가 아닌 척도는 item.maturityGuidance에서 직접 입력된 안내문을 읽어야 합니다',
);

// wayfinder #10 — 등록 검토 마법사가 쓰는 순수 함수
assert.equal(
  rules.suggestMaturityOn({conformityCriteria:'기준 있음'}), true,
  'criteria 컬럼에 텍스트가 있으면 기본 제안은 ON이어야 합니다',
);
assert.equal(
  rules.suggestMaturityOn({establishedCriteria:'', matureCriteria:'', leadingCriteria:''}), false,
  'criteria 컬럼이 전부 비어 있으면 기본 제안은 OFF여야 합니다',
);
assert.equal(rules.suggestMaturityOn({}), false);

assert.equal(rules.validateMaturityScale({name:'등급', labels:['A']}).valid, true);
assert.equal(
  rules.validateMaturityScale({name:'', labels:['A']}).valid, false,
  '척도 이름이 없으면 유효하지 않아야 합니다',
);
assert.equal(
  rules.validateMaturityScale({name:'등급', labels:[]}).valid, false,
  '라벨이 하나도 없으면 유효하지 않아야 합니다',
);
assert.equal(
  rules.validateMaturityScale({name:'등급', labels:['', '  ']}).valid, false,
  '공백뿐인 라벨은 없는 것으로 취급해야 합니다',
);

console.log('audit-rules tests passed');
