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

console.log('checklist UI tests passed');
