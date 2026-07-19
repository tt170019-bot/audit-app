const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');

function makeLocalStorage(){
  const store = new Map();
  return {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  };
}

function loadModule(localStorage){
  const context = {
    globalThis: {},
    fetch: (...args) => global.fetch(...args),
    localStorage: localStorage || makeLocalStorage()
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../supabase-auth.js'), 'utf8'), context);
  return { SupabaseAuth: context.globalThis.SupabaseAuth, localStorage: context.localStorage };
}

const client = { url: 'https://example.supabase.co', anonKey: 'anon-key' };

async function main(){
  const originalFetch = global.fetch;

  // signIn() posts email/password grant, stores the session, returns it
  {
    let capturedUrl, capturedBody;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600, user: { id: 'u1', email: 'a@b.com' } }) };
    };
    const { SupabaseAuth, localStorage } = loadModule();
    const auth = SupabaseAuth.createAuth(client);
    const session = await auth.signIn('a@b.com', 'pw');
    assert.equal(capturedUrl, 'https://example.supabase.co/auth/v1/token?grant_type=password');
    assert.deepEqual(capturedBody, { email: 'a@b.com', password: 'pw' });
    assert.equal(session.user.email, 'a@b.com');
    assert.equal(auth.getSession().accessToken, 'at-1');
    assert.ok(localStorage.getItem('auditAppSupabaseSession'), '세션은 로컬에 저장되어야 합니다');
  }

  // signIn() throws with the server's error message on bad credentials
  {
    global.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error_description: '이메일 또는 비밀번호가 올바르지 않습니다' }) });
    const { SupabaseAuth } = loadModule();
    const auth = SupabaseAuth.createAuth(client);
    await assert.rejects(auth.signIn('a@b.com', 'wrong'), /이메일 또는 비밀번호/);
    assert.equal(auth.getSession(), null, '로그인 실패 시 세션이 없어야 합니다');
  }

  // signOut() clears the session both in memory and in localStorage
  {
    const localStorage = makeLocalStorage();
    localStorage.setItem('auditAppSupabaseSession', JSON.stringify({ accessToken: 'at-1', refreshToken: 'rt-1', user: { email: 'a@b.com' } }));
    global.fetch = async () => ({ ok: true, json: async () => ({}) });
    const { SupabaseAuth } = loadModule(localStorage);
    const auth = SupabaseAuth.createAuth(client);
    assert.equal(auth.getSession().user.email, 'a@b.com', '기존 로컬 세션을 시작 시 읽어와야 합니다');
    await auth.signOut();
    assert.equal(auth.getSession(), null);
    assert.equal(localStorage.getItem('auditAppSupabaseSession'), null);
  }

  // restoreSession() refreshes the access token using the stored refresh token
  {
    const localStorage = makeLocalStorage();
    localStorage.setItem('auditAppSupabaseSession', JSON.stringify({ accessToken: 'stale', refreshToken: 'rt-1', user: { email: 'a@b.com' } }));
    let capturedBody;
    global.fetch = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ access_token: 'fresh', refresh_token: 'rt-2', expires_in: 3600, user: { id: 'u1', email: 'a@b.com' } }) };
    };
    const { SupabaseAuth } = loadModule(localStorage);
    const auth = SupabaseAuth.createAuth(client);
    const session = await auth.restoreSession();
    assert.deepEqual(capturedBody, { refresh_token: 'rt-1' });
    assert.equal(session.accessToken, 'fresh');
  }

  // restoreSession() keeps the cached session when the refresh call fails (offline) —
  // the auditor flow (anonymous read) must never be blocked by a stale/unreachable session.
  {
    const localStorage = makeLocalStorage();
    localStorage.setItem('auditAppSupabaseSession', JSON.stringify({ accessToken: 'stale', refreshToken: 'rt-1', user: { email: 'a@b.com' } }));
    global.fetch = async () => { throw new Error('network down'); };
    const { SupabaseAuth } = loadModule(localStorage);
    const auth = SupabaseAuth.createAuth(client);
    const session = await auth.restoreSession();
    assert.equal(session.accessToken, 'stale', '오프라인이면 기존 캐시된 세션을 그대로 유지해야 합니다');
  }

  // acceptInvite() sets a password on the invited/recovering user via their
  // one-time access token (from the email link), then treats them as signed
  // in immediately — no separate login step after accepting.
  {
    let capturedUrl, capturedOptions, capturedBody;
    global.fetch = async (url, options) => {
      capturedUrl = url; capturedOptions = options; capturedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ id: 'u9', email: 'invited@x.com' }) };
    };
    const { SupabaseAuth, localStorage } = loadModule();
    const auth = SupabaseAuth.createAuth(client);
    const session = await auth.acceptInvite('invite-access-token', 'invite-refresh-token', 3600, 'new-pass-123');
    assert.equal(capturedUrl, 'https://example.supabase.co/auth/v1/user');
    assert.equal(capturedOptions.method, 'PUT');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer invite-access-token');
    assert.deepEqual(capturedBody, { password: 'new-pass-123' });
    assert.equal(session.accessToken, 'invite-access-token');
    assert.equal(session.refreshToken, 'invite-refresh-token');
    assert.equal(session.user.email, 'invited@x.com');
    assert.equal(auth.getSession().accessToken, 'invite-access-token', '수락 즉시 로그인 상태여야 합니다');
    assert.ok(localStorage.getItem('auditAppSupabaseSession'), '세션이 로컬에 저장되어야 합니다');
  }

  // acceptInvite() surfaces a server error (e.g. an already-used/expired token)
  {
    global.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error_description: 'Email link is invalid or has expired' }) });
    const { SupabaseAuth } = loadModule();
    const auth = SupabaseAuth.createAuth(client);
    await assert.rejects(auth.acceptInvite('bad-token', 'rt', 3600, 'new-pass-123'), /expired/);
  }

  // getAuth()/setAuth() — a stubbable module-level singleton for tests
  {
    const { SupabaseAuth } = loadModule();
    const fake = { getSession: () => ({ user: { email: 'stub@x.com' } }) };
    SupabaseAuth.setAuth(fake);
    assert.equal(SupabaseAuth.getAuth(client), fake);
  }

  global.fetch = originalFetch;
  console.log('supabase auth tests passed');
}

main().catch(e => { console.error(e); process.exit(1); });
