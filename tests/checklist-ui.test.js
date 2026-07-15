const assert = require('assert/strict');
const fs = require('fs');

const source = fs.readFileSync(require.resolve('../index.html'), 'utf8');

assert.match(
  source,
  /onclick="jumpToNext\(\$\{audit\.id\}\)"[^>]*>미완료 \$\{summary\.total-summary\.answered\}개<\/button>`/,
  '미완료 버튼은 남은 항목으로 이동해야 합니다',
);

console.log('checklist UI tests passed');
