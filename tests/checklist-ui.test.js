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

// wayfinder #8 — Supabase 익명 읽기
assert.match(
  source,
  /<script src="supabase-client\.js"><\/script>/,
  'supabase-client.js가 로드되어야 합니다',
);

assert.match(
  source,
  /async function loadSupabaseChecklists\(\)\{[\s\S]*?ChecklistSource\.loadSupabaseTemplates\(client\)/,
  'Supabase 템플릿 조회는 ChecklistSource.loadSupabaseTemplates를 사용해야 합니다',
);

assert.match(
  source,
  /async function autoLoadChecklists\(\)\{[\s\S]*?const supabaseTemplates = await loadSupabaseChecklists\(\);/,
  '자동 동기화는 GitHub와 나란히 Supabase 소스도 처리해야 합니다',
);

assert.match(
  source,
  /const maturityScale = tpl\.maturityScale \|\| deriveMaturityScale\(tpl\);/,
  '심사 생성 시 템플릿에 저장된 커스텀 척도를 레거시 추론보다 우선해야 합니다',
);

assert.match(
  source,
  /maturityOn: i\.maturityOn \?\? Boolean\(maturityScale\)/,
  '심사 생성 시 항목별 maturityOn 플래그가 템플릿에 있으면 그대로 사용해야 합니다',
);

assert.match(
  source,
  /maturityOn: item\.maturityOn,/,
  '점검표 항목 정규화는 항목별 maturityOn 플래그를 보존해야 합니다',
);

// wayfinder #9 — Registrant 인증 기반
assert.match(
  source,
  /<script src="supabase-auth\.js"><\/script>/,
  'supabase-auth.js가 로드되어야 합니다',
);

assert.match(
  source,
  /restoreRegistrantSession\(\)/,
  '앱 시작 시 로컬에 남은 등록자 세션을 복원 시도해야 합니다',
);

assert.match(
  source,
  /async function registrantSignIn\(\)\{[\s\S]*?getRegistrantAuth\(\)\.signIn\(email, password\)/,
  '로그인은 SupabaseAuth 모듈을 통해야 합니다',
);

assert.match(
  source,
  /async function registrantSignOut\(\)\{[\s\S]*?getRegistrantAuth\(\)\.signOut\(\)/,
  '로그아웃은 SupabaseAuth 모듈을 통해야 합니다',
);

assert.doesNotMatch(
  source,
  /function loadChecklistIndex\(\)[\s\S]{0,400}getRegistrantSession/,
  '익명 읽기(GitHub/Supabase 동기화) 경로는 로그인 상태를 확인하지 않아야 합니다',
);

// wayfinder #10/#11 — 등록 검토 마법사 + Supabase 실제 저장
assert.match(
  source,
  /<div class="modal-backdrop" id="modal-review">/,
  '등록 검토 마법사 모달이 있어야 합니다',
);

assert.match(
  source,
  /function handleFileSelect\(file\)\{[\s\S]*?if\(!getRegistrantSession\(\)\?\.user\)/,
  '엑셀 업로드는 로그인한 Registrant만 시작할 수 있어야 합니다',
);

assert.match(
  source,
  /openReviewWizard\(\{[\s\S]{0,120}mode: 'new'/,
  '엑셀 파싱 직후에는 바로 저장하지 않고 검토 마법사를 열어야 합니다',
);

assert.doesNotMatch(
  source,
  /function handleFileSelect\(file\)\{[\s\S]*?source: 'manual'/,
  '엑셀 업로드는 더 이상 기기 로컬(source:manual)로 바로 저장하지 않아야 합니다',
);

assert.match(
  source,
  /async function confirmReviewWizard\(\)\{[\s\S]*?if\(!session\?\.user\)\{ showToast\('로그인이 필요합니다'\); return; \}/,
  '확인 시점에도 다시 한번 로그인 여부를 확인해야 합니다',
);

assert.match(
  source,
  /await ChecklistSource\.registerSupabaseTemplate\(client, session\.accessToken, session\.user\.id, payload\)/,
  '새 점검표 등록은 로그인 사용자의 access token으로 Supabase에 써야 합니다',
);

assert.match(
  source,
  /await ChecklistSource\.updateSupabaseTemplate\(client, session\.accessToken, session\.user\.id, w\.templateId, payload\)/,
  '기존 점검표 수정도 로그인 사용자의 access token으로 Supabase에 써야 합니다',
);

assert.match(
  source,
  /\$\{registrantSession\?\.user \? `\s*<div class="section-header">점검표 등록<\/div>/,
  '업로드 영역은 관리자 모드가 아니라 로그인한 Registrant 여부로 표시되어야 합니다',
);

assert.match(
  source,
  /t\.source === 'supabase' && registrantSession\?\.user[\s\S]{0,80}openReviewWizardForEdit/,
  '등록된 점검표 카드에는 로그인한 Registrant에게만 수정 버튼이 보여야 합니다',
);

// wayfinder #12 — 등록자 관리 (초대/목록/제거)
assert.match(
  source,
  /<script src="registrants\.js"><\/script>/,
  'registrants.js가 로드되어야 합니다',
);

assert.match(
  source,
  /<div class="modal-backdrop" id="modal-registrants">/,
  '등록자 관리 모달이 있어야 합니다',
);

assert.match(
  source,
  /async function openRegistrantsModal\(\)\{\s*const session = getRegistrantSession\(\);\s*if\(!session\?\.user\)/,
  '등록자 관리 화면은 로그인하지 않으면 열리지 않아야 합니다',
);

assert.match(
  source,
  /Registrants\.getRegistrants\(SupabaseClient\.getClient\(\)\)\.list\(session\.accessToken\)/,
  '등록자 목록 조회는 로그인 사용자의 access token으로 Edge Function을 호출해야 합니다',
);

assert.match(
  source,
  /Registrants\.getRegistrants\(SupabaseClient\.getClient\(\)\)\.invite\(session\.accessToken, email\)/,
  '초대도 로그인 사용자의 access token으로 Edge Function을 호출해야 합니다',
);

assert.match(
  source,
  /Registrants\.getRegistrants\(SupabaseClient\.getClient\(\)\)\.remove\(session\.accessToken, userId\)/,
  '제거도 로그인 사용자의 access token으로 Edge Function을 호출해야 합니다',
);

assert.match(
  source,
  /registrantSession\?\.user \? `<button type="button" class="btn btn-ghost btn-sm" onclick="openRegistrantsModal\(\)">등록자 관리<\/button>` : ''/,
  '"등록자 관리" 버튼은 로그인했을 때만 보여야 합니다',
);

// 초대/비밀번호 재설정 링크 수락 (invite/recovery access_token URL 해시 처리)
assert.match(
  source,
  /<div class="modal-backdrop" id="modal-accept-invite">/,
  '초대 수락 모달이 있어야 합니다',
);

assert.match(
  source,
  /initInviteAcceptanceFromUrl\(\);/,
  '앱 시작 시 URL의 초대\\/복구 링크를 감지해야 합니다',
);

assert.match(
  source,
  /type !== 'invite' && type !== 'recovery'/,
  '초대 링크와 비밀번호 재설정 링크를 모두 처리해야 합니다',
);

assert.match(
  source,
  /getRegistrantAuth\(\)\.acceptInvite\(pendingInviteTokens\.accessToken, pendingInviteTokens\.refreshToken, pendingInviteTokens\.expiresIn, password\)/,
  '초대 수락은 URL에서 받은 access token으로 비밀번호를 설정해야 합니다',
);

console.log('checklist UI tests passed');
