const assert = require('assert/strict');
const fs = require('fs');

const source = fs.readFileSync(require.resolve('../sw.js'), 'utf8');

assert.match(source, /const CACHE_NAME = 'audit-app-shell';/, '캐시 이름은 수동 버전 갱신에 의존하지 않아야 합니다');
assert.match(source, /fetch\(event\.request\)[\s\S]*?caches\.match\(event\.request\)/, '온라인에서는 최신 응답을 우선하고 오프라인에서는 캐시를 사용해야 합니다');
assert.match(source, /url\.origin !== self\.location\.origin/, '외부 동기화 요청은 서비스워커 캐시에 누적하지 않아야 합니다');

console.log('service worker tests passed');
