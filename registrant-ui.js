// wayfinder #9/#12 — Registrant 로그인/세션, 등록자 관리, 이메일 링크 로그인 화면.
// index.html의 showToast/closeModal/openModal/esc/switchTab 등 전역을 그대로 쓴다.

// wayfinder #9 — Registrant 인증. 로그인 상태는 등록(체크리스트 쓰기)/등록자
// 관리 화면에서만 쓰인다 — 감사자의 익명 읽기/감사 진행 플로우는 이 모듈을
// 전혀 거치지 않는다.
function getRegistrantAuth(){
  return SupabaseAuth.getAuth(SupabaseClient.getClient());
}

function getRegistrantSession(){
  return getRegistrantAuth().getSession();
}

async function restoreRegistrantSession(){
  return getRegistrantAuth().restoreSession();
}

function openLoginModal(){
  document.getElementById('login-email').value = '';
  setVisible('login-error', false);
  setVisible('login-sent', false);
  const btn = document.getElementById('login-submit-btn');
  btn.textContent = '로그인 링크 받기';
  btn.disabled = false;
  openModal('modal-login');
}

async function requestLoginLink(){
  const email = document.getElementById('login-email').value.trim();
  const errorEl = document.getElementById('login-error');
  const sentEl = document.getElementById('login-sent');
  const btn = document.getElementById('login-submit-btn');
  setVisible(errorEl, false);
  if(!email){ setVisible(errorEl, true); errorEl.textContent = '이메일을 입력하세요'; return; }

  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = '전송 중...';
  try{
    await getRegistrantAuth().requestMagicLink(email);
    setVisible(sentEl, true);
    sentEl.textContent = '로그인 링크를 보냈습니다. 메일함을 확인하세요.';
    btn.textContent = '다시 보내기';
    btn.disabled = false;
  }catch(e){
    setVisible(errorEl, true);
    errorEl.textContent = e.message || '전송에 실패했습니다';
    btn.textContent = originalLabel;
    btn.disabled = false;
  }
}

async function registrantSignOut(){
  await getRegistrantAuth().signOut();
  showToast('로그아웃되었습니다');
  if(currentTab === 'templates'){ const c = document.getElementById('content'); if(c) renderTemplates(c); }
}

// ═══════════════════════════════════════════════
//  wayfinder #12 — 등록자 관리 (초대/목록/제거)
//  Admin API가 필요한 작업이라 registrants.js를 통해 Edge Function만 호출한다.
// ═══════════════════════════════════════════════
async function openRegistrantsModal(){
  const session = getRegistrantSession();
  if(!session?.user){ showToast('로그인이 필요합니다'); return; }
  openModal('modal-registrants');
  await renderRegistrantsModal();
}

async function renderRegistrantsModal(){
  const session = getRegistrantSession();
  const body = document.getElementById('registrants-body');
  if(!session?.user){ body.innerHTML = `<div class="sub text-danger">로그인이 필요합니다</div>`; return; }

  body.innerHTML = '불러오는 중입니다...';
  try{
    const users = await Registrants.getRegistrants(SupabaseClient.getClient()).list(session.accessToken);
    body.innerHTML = `
      <div class="check-label">새 등록자 초대</div>
      <input type="email" id="registrant-invite-email" placeholder="you@example.com">
      <button type="button" class="btn btn-teal btn-sm field-gap" onclick="inviteRegistrant()">초대</button>
      <div class="sub text-danger" id="registrant-error" style="display:none;"></div>
      <div class="section-header mt-150">현재 등록자 (${users.length})</div>
      ${users.map(u => `
      <div class="card-row">
        <div class="flex-1"><div class="label">${esc(u.email || u.id)}</div></div>
        ${u.id === session.user.id ? `<span class="sub">나</span>` : `<button type="button" class="btn btn-danger btn-sm" onclick="removeRegistrant('${u.id}')">제거</button>`}
      </div>`).join('')}
    `;
  }catch(e){
    body.innerHTML = `<div class="sub text-danger">등록자 목록을 불러오지 못했습니다: ${esc(e.message||'')}</div>`;
  }
}

async function inviteRegistrant(){
  const session = getRegistrantSession();
  if(!session?.user){ showToast('로그인이 필요합니다'); return; }
  const email = document.getElementById('registrant-invite-email').value.trim();
  const errorEl = document.getElementById('registrant-error');
  setVisible(errorEl, false);
  if(!email){ setVisible(errorEl, true); errorEl.textContent = '이메일을 입력하세요'; return; }

  try{
    await Registrants.getRegistrants(SupabaseClient.getClient()).invite(session.accessToken, email);
    showToast(`${email}님을 초대했습니다`);
    await renderRegistrantsModal();
  }catch(e){
    setVisible(errorEl, true);
    errorEl.textContent = e.message || '초대에 실패했습니다';
  }
}

async function removeRegistrant(userId){
  const session = getRegistrantSession();
  if(!session?.user){ showToast('로그인이 필요합니다'); return; }
  try{
    await Registrants.getRegistrants(SupabaseClient.getClient()).remove(session.accessToken, userId);
    showToast('등록자를 제거했습니다');
    await renderRegistrantsModal();
  }catch(e){
    showToast('제거에 실패했습니다: ' + (e.message || ''));
  }
}

// ═══════════════════════════════════════════════
//  이메일 링크 로그인/초대 수락
//  Supabase 초대·매직링크 메일은 access_token을 URL 해시로 들고 돌아온다
//  (#access_token=...&type=invite 또는 &type=magiclink). 둘 다 같은 방식으로
//  처리한다 — 비밀번호 설정 단계 없이 토큰으로 바로 로그인 상태가 된다.
// ═══════════════════════════════════════════════
function parseAuthHashParams(){
  const hash = location.hash.startsWith('#') ? location.hash.slice(1) : '';
  if(!hash) return null;
  const params = new URLSearchParams(hash);
  if(params.get('error')) return { error: true };
  const accessToken = params.get('access_token');
  const type = params.get('type');
  if(!accessToken || (type !== 'invite' && type !== 'magiclink')) return null;
  return {
    accessToken,
    refreshToken: params.get('refresh_token') || '',
    expiresIn: Number(params.get('expires_in') || '3600')
  };
}

async function initEmailLinkSignIn(){
  const parsed = parseAuthHashParams();
  if(!parsed) return;

  // Clear the hash only after the outcome is handled, not before — a
  // first-time visitor's service worker registration can force a reload via
  // the controllerchange handler (below) partway through, and if the hash
  // were already gone the link would be unrecoverable. A reload mid-flight
  // just re-runs this same detection from the top.
  if(parsed.error){
    history.replaceState(null, '', location.pathname + location.search);
    showToast('링크가 만료되었습니다. 다시 요청하세요');
    openLoginModal();
    return;
  }

  try{
    await getRegistrantAuth().completeSessionFromTokens(parsed.accessToken, parsed.refreshToken, parsed.expiresIn);
    history.replaceState(null, '', location.pathname + location.search);
    showToast('로그인되었습니다');
    switchTab('templates');
  }catch(e){
    history.replaceState(null, '', location.pathname + location.search);
    showToast('로그인에 실패했습니다: ' + (e.message || ''));
    openLoginModal();
  }
}
