const assert = require('assert/strict');
const fs = require('fs');

// index.html was split (report-export.js / registrant-ui.js / review-wizard.js /
// audit-detail.js / core.js / backup.js / photo.js carved out to keep the main
// file from growing without bound) — concatenate them all so the regex
// assertions below don't care which physical file a given piece of UI wiring
// now lives in. Keep this list in sync whenever index.html is split further —
// a regex assertion "passing" after a rename/move it never re-matched a
// runtime behavior change, it just stopped seeing the code at all.
const source = [
  '../index.html',
  '../report-export.js',
  '../registrant-ui.js',
  '../review-wizard.js',
  '../audit-detail.js',
  '../core.js',
  '../backup.js',
  '../photo.js',
].map(p => fs.readFileSync(require.resolve(p), 'utf8')).join('\n');

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

assert.doesNotMatch(
  source,
  /activeChips\.forEach\(chip => chip\.scrollIntoView/,
  '섹션 칩 하이라이트는 scrollIntoView를 쓰면 안 됩니다 (사이드바가 #content 자식이라 실제 섹션 점프 스크롤과 충돌해 데스크톱에서 엉뚱한 위치로 이동하는 버그가 있었음) — scrollChipIntoOwnContainer로 사이드바/앵커바만 스크롤해야 합니다',
);

assert.match(
  source,
  /function scrollChipIntoOwnContainer\(chip\)\{/,
  'scrollChipIntoOwnContainer 헬퍼가 있어야 섹션 칩 스크롤이 #content를 안 건드립니다',
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
  /function renderChecklistItem\(audit, item\)\{[\s\S]*?renderMaturityPanels\(audit, item\)/,
  '점검항목은 renderMaturityPanels를 호출해야 합니다 (항목에 배정된 척도가 0개면 빈 문자열을 반환)',
);

assert.match(
  source,
  /function renderMaturityPanels\(audit, item\)\{[\s\S]*?if\(!assignedScales\.length\) return '';/,
  'Maturity Assessment 패널은 항목에 척도가 하나도 배정되지 않으면 렌더링하지 않아야 합니다',
);

assert.match(
  source,
  /function renderMaturityPanels\(audit, item\)\{[\s\S]*?scale\.labels\.map\(\(level, levelIndex\)=>\{/,
  'Maturity Assessment 패널은 하드코딩된 4단계 대신 항목에 배정된 각 척도의 가변 라벨을 순회해야 합니다',
);

assert.match(
  source,
  /assignedScales\.map\(scale => \{/,
  '항목에 여러 척도가 배정되면 척도마다 독립된 패널을 렌더링해야 합니다',
);

assert.match(
  source,
  /\$\{c\.title \? `<details class="maturity-details">/,
  '안내 텍스트가 없는 성숙도 레벨은 details(기준 자세히)를 렌더링하지 않아야 합니다',
);

// Word/PDF 내보내기 다중 척도 지원 (TODOS.md의 "Word/PDF export doesn't support
// multi-scale maturity yet" 항목 해결) — 항목이 실제 배정된 척도만큼(0~N개) 각각
// 독립된 Maturity 테이블을 반복 렌더링해야 하고, 더 이상 legacy 단일 척도로
// 고정되면 안 됩니다.
assert.doesNotMatch(
  source,
  /AuditRules\.LEGACY_SCALE_ID/,
  'Word 보고서 렌더러가 legacy 단일 척도로 고정되면 안 됩니다 (다중 척도 지원)',
);

assert.match(
  source,
  /function renderMaturityTable\(item, scale\)\{/,
  '척도별로 독립된 Maturity 테이블을 만드는 헬퍼가 있어야 합니다',
);

assert.match(
  source,
  /function renderFieldAuditItem\(item, index, scales\)\{[\s\S]*?MaturityResolution\.resolveItemMaturity\(item, scales\)/,
  'Word 보고서 항목 렌더러는 항목에 실제 배정된 척도 목록을 받아 사용해야 합니다',
);

assert.match(
  source,
  /function renderFieldAuditItems\(audit\)\{\s*const scales = AuditRules\.deriveMaturityScales\(audit\);/,
  'Word 보고서는 audit의 척도 라이브러리를 유도해서 각 항목 렌더러에 넘겨야 합니다',
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
  '자동 동기화는 Supabase 소스를 처리해야 합니다',
);

// ADR-0001 — GitHub 기반 점검표 동기화(checklists/ 폴더 + Contents API)는 완전히 제거됨
assert.doesNotMatch(
  source,
  /loadGitHubIndex|getGitHubRepoInfo|CHECKLIST_FOLDER_PATH|source === 'github-api'|source === 'github-index'/,
  'GitHub 기반 점검표 동기화 경로는 남아있지 않아야 합니다',
);

assert.match(
  source,
  /const maturityScales = AuditRules\.deriveMaturityScales\(tpl\);/,
  '심사 생성 시 템플릿의 척도 라이브러리를 (레거시 어댑팅 포함) 유도해서 audit에 저장해야 합니다',
);

assert.match(
  source,
  /const assignment = AuditRules\.deriveItemMaturityAssignment\(i\);[\s\S]{0,120}maturityScaleIds: assignment\.scaleIds, maturityGuidance: assignment\.guidance, maturityResults: \{\}/,
  '심사 생성 시 항목별로 배정된 척도 id 목록과 안내문을 그대로 복사하고, 결과는 빈 객체로 시작해야 합니다',
);

assert.match(
  source,
  /maturityScaleIds: Array\.isArray\(item\.maturityScaleIds\) \? item\.maturityScaleIds : undefined,/,
  '점검표 항목 정규화는 항목별 척도 배정 배열을 보존해야 합니다',
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
  /async function requestLoginLink\(\)\{[\s\S]*?getRegistrantAuth\(\)\.requestMagicLink\(email\)/,
  '로그인은 SupabaseAuth 모듈을 통해 매직링크를 요청해야 합니다',
);

assert.doesNotMatch(
  source,
  /id="login-password"/,
  '비밀번호 입력 필드는 더 이상 없어야 합니다',
);

assert.match(
  source,
  /async function registrantSignOut\(\)\{[\s\S]*?getRegistrantAuth\(\)\.signOut\(\)/,
  '로그아웃은 SupabaseAuth 모듈을 통해야 합니다',
);

assert.doesNotMatch(
  source,
  /function loadSupabaseChecklists\(\)[\s\S]{0,400}getRegistrantSession/,
  '익명 읽기(Supabase 동기화) 경로는 로그인 상태를 확인하지 않아야 합니다',
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

// 개정번호/개정일자 — 수기 입력(필수), 저장 페이로드에 포함
assert.match(
  source,
  /<input type="number" step="1" required value="\$\{esc\(w\.revisionNo\)\}"/,
  '개정번호는 필수 정수 입력칸이어야 합니다',
);

assert.match(
  source,
  /<input type="date" required value="\$\{esc\(w\.revisionDate\)\}"/,
  '개정일자는 필수 날짜 입력칸이어야 합니다',
);

assert.match(
  source,
  /if\(reviewWizard\.revisionNo === '' \|\| reviewWizard\.revisionNo == null \|\| !reviewWizard\.revisionDate\)\{/,
  '개정번호/개정일자를 비운 채로는 항목 검토 단계로 넘어갈 수 없어야 합니다',
);

assert.match(
  source,
  /const payload = \{[\s\S]*?revisionNo: w\.revisionNo,[\s\S]{0,40}revisionDate: w\.revisionDate/,
  '저장 페이로드에 개정번호/개정일자가 포함되어야 합니다',
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
  /registrantSession\?\.user \? `\s*<div class="align-end-row"><button type="button" class="btn btn-teal" onclick="openNewChecklistModal\(\)">\+ 점검표 등록<\/button><\/div>` : ''/,
  '점검표 등록 버튼은 관리자 모드가 아니라 로그인한 Registrant 여부로 표시되어야 합니다',
);

assert.match(
  source,
  /function openNewChecklistModal\(\)\{/,
  '점검표 등록 버튼은 모달(명칭\\/개정번호\\/개정일자\\/Excel 업로드)을 열어야 합니다',
);

assert.match(
  source,
  /t\.source === 'supabase' && registrantSession\?\.user[\s\S]{0,80}openReviewWizardForEdit/,
  '등록된 점검표 카드에는 로그인한 Registrant에게만 수정 버튼이 보여야 합니다',
);

// Checklist Template Revision history (ADR-0001/0002)
assert.match(
  source,
  /t\.source === 'supabase' && registrantSession\?\.user[\s\S]{0,80}openTemplateHistory/,
  '등록된 점검표 카드에는 로그인한 Registrant에게만 이력 버튼이 보여야 합니다',
);

assert.match(
  source,
  /<div class="modal-backdrop" id="modal-history">/,
  '점검표 개정 이력 모달이 있어야 합니다',
);

assert.match(
  source,
  /async function openTemplateHistory\(localId\)\{[\s\S]*?ChecklistSource\.loadTemplateRevisions\(client, tpl\.supabaseId\)/,
  '이력 조회는 ChecklistSource.loadTemplateRevisions를 사용해야 합니다',
);

// 점검표 삭제 권한 — Registrant 로그인 기준 (구 ?admin=1 토글 완전 제거, 2026-07-26)
assert.match(
  source,
  /registrantSession\?\.user \? `<button type="button" class="btn btn-danger btn-sm" onclick="deleteTemplate\(\$\{t\.id\},event\)">삭제<\/button>` : ''/,
  '삭제 버튼은 관리자 모드가 아니라 로그인한 Registrant 여부로 표시되어야 합니다',
);

assert.match(
  source,
  /async function deleteTemplate\(id, e\)\{[\s\S]*?if\(!session\?\.user\)\{ showToast\('로그인 후 삭제할 수 있습니다'\); return; \}/,
  '삭제 실행 시점에도 다시 한번 Registrant 로그인 여부를 확인해야 합니다',
);

assert.match(
  source,
  /await ChecklistSource\.deleteSupabaseTemplate\(SupabaseClient\.getClient\(\), session\.accessToken, tpl\.supabaseId\)/,
  '삭제는 로컬 캐시만이 아니라 Supabase의 실제 행을 지워야 합니다',
);

assert.doesNotMatch(
  source,
  /isAdminMode|setAdminMode|ADMIN_MODE_STORAGE_KEY|\?admin=1/,
  '암호 없는 ?admin=1 관리자 토글은 완전히 제거되어야 합니다',
);

assert.match(
  source,
  /function restoreTemplateRevision\(idx\)\{[\s\S]*?openReviewWizard\(\{[\s\S]{0,40}mode: 'edit'/,
  '복원은 새 등록이 아니라 기존 수정 마법사(edit 모드)를 재사용해야 합니다',
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

// 이메일 링크 로그인/초대 수락 (access_token URL 해시 처리 — invite와 magiclink는 동일 경로)
assert.doesNotMatch(
  source,
  /id="modal-accept-invite"/,
  '비밀번호 입력용 초대 수락 모달은 더 이상 없어야 합니다',
);

assert.match(
  source,
  /initEmailLinkSignIn\(\);/,
  '앱 시작 시 URL의 초대\\/매직링크를 감지해야 합니다',
);

assert.match(
  source,
  /type !== 'invite' && type !== 'magiclink'/,
  '초대 링크와 매직링크 로그인을 모두 같은 경로로 처리해야 합니다',
);

assert.match(
  source,
  /getRegistrantAuth\(\)\.completeSessionFromTokens\(parsed\.accessToken, parsed\.refreshToken, parsed\.expiresIn\)/,
  '이메일 링크의 access token으로 바로 세션을 완성해야 합니다 (비밀번호 단계 없음)',
);

assert.match(
  source,
  /if\(params\.get\('error'\)\) return \{ error: true \};/,
  '만료\\/무효 링크(에러 해시)도 감지해서 처리해야 합니다',
);

assert.match(
  source,
  /function openLoginModal\(\)\{/,
  '로그인 모달은 열 때마다 이전 상태(전송됨 메시지, 이전 이메일 등)를 초기화해야 합니다',
);

console.log('checklist UI tests passed');
