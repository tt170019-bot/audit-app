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
assert.equal(
  rules.canCompleteAudit({behaviorOutcomeAssessment:true, items:[{result:''}, {result:''}]}),
  true,
  'Behavior/Outcome 평가 항목은 판단하지 않으므로 완료 처리를 막으면 안 됩니다',
);

assert.deepEqual(rules.BEHAVIOR_CODES, ['DA', 'DI', 'UD']);
assert.deepEqual(rules.OUTCOME_CODES, ['UAS', 'AE', 'IC']);
assert.equal(
  rules.inferReportTemplateType({behaviorOutcomeAssessment: true}),
  'report-type-2',
  'Behavior/Outcome 평가 점검표는 항목별 블록 레이아웃(type-2)을 써야 합니다',
);

// ═══ Judgment mode (2026-07-31 architecture review) — one seam behind
// canCompleteAudit and every "answered" count, instead of a flag re-checked
// at each call site ═══
assert.equal(rules.judgmentModeFor({items:[]}), rules.JUDGMENT_MODES.auditResult, '기본은 Audit Result 모드여야 합니다');
assert.equal(rules.judgmentModeFor({behaviorOutcomeAssessment:true}), rules.JUDGMENT_MODES.behaviorOutcome);
assert.equal(rules.JUDGMENT_MODES.auditResult.showsFraction, true);
assert.equal(rules.JUDGMENT_MODES.behaviorOutcome.showsFraction, false);
assert.equal(
  rules.JUDGMENT_MODES.auditResult.answeredCount([{result:'YES'}, {result:''}, {result:'NO'}]),
  2,
  'Audit Result 모드는 실제로 응답된 항목만 세야 합니다',
);
assert.equal(
  rules.JUDGMENT_MODES.behaviorOutcome.answeredCount([{result:''}, {result:''}]),
  2,
  'Behavior/Outcome 모드는 판단하지 않으므로 전체를 완료로 세야 합니다',
);

assert.deepEqual(rules.DIVISIONS, ['안전', '보안', '정비', '운항', '객실', '화물', '여객지원', '종합통제']);

// ═══ deriveMaturityScales(template) — multi-scale model, 2026-07-26 ═══
assert.deepEqual(
  rules.deriveMaturityScales({maturityScales:[{id:'sA', name:'안전척도', labels:['미흡','우수']}]}),
  [{id:'sA', name:'안전척도', labels:['미흡','우수']}],
  '새 다중 척도 배열이 있으면 그대로 사용해야 합니다',
);
assert.deepEqual(
  rules.deriveMaturityScales({maturityScales:[]}),
  [],
  '작성자가 척도를 전부 지운 빈 배열은 레거시 필드로 되돌아가지 않고 존재 자체를 신뢰해야 합니다',
);
assert.deepEqual(
  rules.deriveMaturityScales({maturityScales:[], maturityScale:{name:'구척도', labels:['A','B']}}),
  [],
  '새 배열이 존재하면(비어 있어도) 레거시 단일 척도보다 우선해야 합니다',
);
assert.deepEqual(
  rules.deriveMaturityScales({maturityScale:{name:'등급', labels:['A','B']}}),
  [{id: rules.LEGACY_SCALE_ID, name:'등급', labels:['A','B']}],
  '레거시 단일 척도는 legacy id로 어댑팅되어야 합니다',
);
assert.deepEqual(
  rules.deriveMaturityScales({checklistUiType:'maturity'}),
  [{id: rules.LEGACY_SCALE_ID, name:'성숙도 등급', labels:['Conformity','Established','Mature','Leading']}],
  '레거시 성숙도 체크리스트는 legacy 4단계 척도로 어댑팅되어야 합니다',
);
assert.deepEqual(
  rules.deriveMaturityScales({checklistUiType:'standard'}),
  [],
  '일반 체크리스트는 척도가 없어야 합니다',
);
assert.deepEqual(
  rules.deriveMaturityScales({filename:'현장탑승심사표.xlsx'}),
  [{id: rules.LEGACY_SCALE_ID, name:'성숙도 등급', labels:['Conformity','Established','Mature','Leading']}],
  'checklistUiType가 없으면 getChecklistUiType으로 재추론해야 합니다',
);

// ═══ deriveItemMaturityAssignment(item) ═══
assert.deepEqual(
  rules.deriveItemMaturityAssignment({maturityScaleIds:['sA','sB'], maturityGuidance:{sA:['가']}}),
  {scaleIds:['sA','sB'], guidance:{sA:['가']}},
  '새 형태는 scaleIds/guidance를 그대로 전달해야 합니다',
);
assert.deepEqual(
  rules.deriveItemMaturityAssignment({maturityOn:true, conformityCriteria:'C', establishedCriteria:'E', matureCriteria:'M', leadingCriteria:'L'}),
  {scaleIds:[rules.LEGACY_SCALE_ID], guidance:{[rules.LEGACY_SCALE_ID]:['C','E','M','L']}},
  '레거시 maturityOn+criteria 컬럼은 legacy scale 하나로 어댑팅되어야 합니다',
);
assert.deepEqual(
  rules.deriveItemMaturityAssignment({}), {scaleIds:[], guidance:{}},
  '아무 성숙도 정보도 없으면 빈 배정이어야 합니다',
);

// ═══ getMaturityGuidance(item, scaleId, levelIndex, levelLabel) ═══
assert.equal(
  rules.getMaturityGuidance({maturityScaleIds:['sA'], maturityGuidance:{sA:['직접 입력한 안내문']}}, 'sA', 0, '미흡').title,
  '직접 입력한 안내문',
  '항목별로 직접 입력한 안내문이 있으면 그것을 써야 합니다',
);
assert.equal(
  rules.getMaturityGuidance({maturityOn:true}, rules.LEGACY_SCALE_ID, 3, 'Leading').title,
  '예방과 개선 활동으로 절차를 고도화하는 수준',
  'legacy 척도는 안내문이 비어 있으면 기본 안내문으로 폴백해야 합니다',
);
assert.equal(
  rules.getMaturityGuidance({maturityScaleIds:['sA']}, 'sA', 0, '미흡').title,
  '',
  '커스텀 척도는 안내문이 비어 있어도 기본 안내문으로 폴백하지 않아야 합니다',
);

// ═══ deriveMaturityResults(item) ═══
assert.deepEqual(
  rules.deriveMaturityResults({maturityResults:{sA:'미흡', sB:'3단계'}}),
  {sA:'미흡', sB:'3단계'},
  '새 형태는 maturityResults를 그대로 전달해야 합니다',
);
assert.deepEqual(
  rules.deriveMaturityResults({maturity:'Leading'}),
  {[rules.LEGACY_SCALE_ID]:'Leading'},
  '레거시 단일 maturity 문자열은 legacy id로 어댑팅되어야 합니다',
);
assert.deepEqual(rules.deriveMaturityResults({}), {});

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
