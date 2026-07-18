const assert = require('assert/strict');
const fs = require('fs');

const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');

assert.match(
  source,
  /onclick="jumpToNext\(\$\{audit\.id\}\)"[^>]*>미완료 \$\{summary\.total-summary\.answered\}개<\/button>`/,
  '미완료 버튼은 남은 항목으로 이동해야 합니다',
);

assert.match(
  source,
  /<details class="check-input-reference">[\s\S]*?<summary class="check-reference-toggle">Reference<\/summary>[\s\S]*?Internal Ref\./,
  '참조 규정은 Reference 아코디언으로 접혀 있어야 합니다',
);

assert.match(
  source,
  /<span class="check-input-no">\$\{itemNumber\}<\/span>[\s\S]*?<div class="check-input-section">\$\{ref\}<\/div>[\s\S]*?<div class="check-input-question">\$\{question\}<\/div>/,
  '점검항목은 번호, 참조 코드, 질문 순서로 표시해야 합니다',
);

assert.doesNotMatch(
  source,
  /@media \(max-width: 47\.9375rem\) \{[\s\S]*?\.field-result-row \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/,
  '모바일 결과 선택은 1행 4열을 유지해야 합니다',
);

assert.match(
  source,
  /async function setResult\([\s\S]*?return enqueueAuditWrite\(auditId, async \(\) => \{/,
  '결과 저장은 메모 저장과 같은 심사별 대기열을 사용해야 합니다',
);

assert.match(
  source,
  /async function setMaturityResult\([\s\S]*?return enqueueAuditWrite\(auditId, async \(\) => \{/,
  '성숙도 저장은 메모 저장과 같은 심사별 대기열을 사용해야 합니다',
);

// wayfinder #7 — item-level maturity flag + template-level custom scale
assert.doesNotMatch(
  source,
  /function isMaturityChecklistAudit\(/,
  '전체 체크리스트 단위 성숙도 판정 함수는 제거되어야 합니다 (항목 단위 플래그로 대체)',
);

assert.doesNotMatch(
  source,
  /function renderStandardChecklistItem\(|function renderFieldChecklistItem\(/,
  '점검항목 렌더 함수는 하나로 합쳐져야 합니다 (성숙도 패널만 조건부로 삽입)',
);

assert.match(
  source,
  /function renderChecklistItem\(audit, item\)\{[\s\S]*?isItemMaturityOn\(audit, item\) \? renderMaturityPanel\(audit, item\) : ''/,
  '점검항목은 항목 단위 성숙도 플래그가 켜져 있을 때만 Maturity Assessment 패널을 렌더링해야 합니다',
);

assert.match(
  source,
  /function renderMaturityPanel\(audit, item\)\{[\s\S]*?scale\.labels\.map\(\(level, levelIndex\)=>\{/,
  'Maturity Assessment 패널은 하드코딩된 4단계 대신 템플릿의 가변 척도를 순회해야 합니다',
);

assert.match(
  source,
  /\$\{c\.title \? `<details class="maturity-details">/,
  '안내 텍스트가 없는 성숙도 레벨은 details(기준 자세히)를 렌더링하지 않아야 합니다',
);

assert.match(
  source,
  /function renderFieldAuditItem\(item, index\)\{[\s\S]*?const maturityLevels = AuditRules\.MATURITY_LEVELS;/,
  'Word 보고서 출력용 렌더러는 이번 변경과 무관하게 그대로 유지되어야 합니다 (범위 밖)',
);

console.log('checklist UI tests passed');
