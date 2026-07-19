// wayfinder #9/#12 — Registrant 로그인/세션, 등록자 관리, 초대 수락 화면.
// index.html의 showToast/closeModal/openModal/esc/switchTab 등 전역을 그대로 쓴다.

let pendingInviteTokens = null;

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

async function registrantSignIn(){
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  setVisible(errorEl, false);
  if(!email || !password){ setVisible(errorEl, true); errorEl.textContent = '이메일과 비밀번호를 입력하세요'; return; }

  try{
    await getRegistrantAuth().signIn(email, password);
    closeModal('modal-login');
    document.getElementById('login-password').value = '';
    showToast('로그인되었습니다');
    if(currentTab === 'templates'){ const c = document.getElementById('content'); if(c) renderTemplates(c); }
  }catch(e){
    setVisible(errorEl, true);
    errorEl.textContent = e.message || '로그인에 실패했습니다';
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
//  초대/비밀번호 재설정 링크 수락
//  Supabase 초대·복구 메일 링크는 access_token을 URL 해시로 들고 돌아온다
//  (#access_token=...&type=invite). 이걸 감지해서 새 비밀번호를 설정하고
//  바로 로그인 상태로 전환한다 — 별도 로그인 단계 없이 즉시 사용 가능.
// ═══════════════════════════════════════════════
function parseAuthHashParams(){
  const hash = location.hash.startsWith('#') ? location.hash.slice(1) : '';
  if(!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const type = params.get('type');
  if(!accessToken || (type !== 'invite' && type !== 'recovery')) return null;
  return {
    accessToken,
    refreshToken: params.get('refresh_token') || '',
    expiresIn: Number(params.get('expires_in') || '3600'),
    type
  };
}

function initInviteAcceptanceFromUrl(){
  const parsed = parseAuthHashParams();
  if(!parsed) return;
  pendingInviteTokens = parsed;
  // Deliberately NOT stripping the hash here. First-time visitors on a fresh
  // browser get force-reloaded by the service worker's controllerchange
  // handler (below) shortly after load, which wipes all in-memory state —
  // if the hash were gone too, the invite would be unrecoverable. Leaving it
  // in place means the reload just re-runs this same detection. Only cleared
  // on successful acceptance, in confirmAcceptInvite().
  document.getElementById('accept-invite-title').textContent = parsed.type === 'recovery' ? '비밀번호 재설정' : '등록자 초대 수락';
  openModal('modal-accept-invite');
}

async function confirmAcceptInvite(){
  const password = document.getElementById('accept-invite-password').value;
  const password2 = document.getElementById('accept-invite-password2').value;
  const errorEl = document.getElementById('accept-invite-error');
  setVisible(errorEl, false);

  if(!password || password.length < 6){ setVisible(errorEl, true); errorEl.textContent = '비밀번호는 6자 이상이어야 합니다'; return; }
  if(password !== password2){ setVisible(errorEl, true); errorEl.textContent = '비밀번호가 일치하지 않습니다'; return; }
  if(!pendingInviteTokens){ setVisible(errorEl, true); errorEl.textContent = '초대 링크 정보를 찾을 수 없습니다. 링크를 다시 열어주세요'; return; }

  try{
    await getRegistrantAuth().acceptInvite(pendingInviteTokens.accessToken, pendingInviteTokens.refreshToken, pendingInviteTokens.expiresIn, password);
    pendingInviteTokens = null;
    history.replaceState(null, '', location.pathname + location.search);
    closeModal('modal-accept-invite');
    showToast('등록자로 활성화되었습니다');
    switchTab('templates');
  }catch(e){
    setVisible(errorEl, true);
    errorEl.textContent = e.message || '처리에 실패했습니다. 링크가 만료되었을 수 있습니다';
  }
}
