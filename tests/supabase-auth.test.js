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
    localStorage: localStorage || makeLocalStorage(),
    location: { origin: 'https://example.github.io', pathname: '/audit-app/' }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../supabase-auth.js'), 'utf8'), context);
  return { SupabaseAuth: context.globalThis.SupabaseAuth, localStorage: context.localStorage };
}

const client = { url: 'https://example.supabase.co', anonKey: 'anon-key' };

async function main(){
  const originalFetch = global.fetch;

  // requestMagicLink() posts the email to the otp endpoint; it does not sign the caller in
  {
    let capturedUrl, capturedBody;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({}) };
    };
    const { SupabaseAuth } = loadModule();
    const auth = SupabaseAuth.createAuth(client);
    await auth.requestMagicLink('a@b.com');
    assert.equal(capturedUrl, 'https://example.supabase.co/auth/v1/otp?redirect_to=https%3A%2F%2Fexample.github.io%2Faudit-app%2F');
    assert.deepEqual(capturedBody, { email: 'a@b.com', create_user: false });
    assert.equal(auth.getSession(), null, '링크 요청만으로는 로그인되지 않아야 합니다');
  }

  // requestMagicLink() throws with the server's error message (e.g. unregistered email)
  {
    global.fetch = async () => ({ ok: false, status: 422, json: async () => ({ msg: 'Signups not allowed for otp' }) });
    const { SupabaseAuth } = loadModule();
    const auth = SupabaseAuth.createAuth(client);
    await assert.rejects(auth.requestMagicLink('nobody@x.com'), /Signups not allowed for otp/);
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

  // completeSessionFromTokens() fetches the user profile for the access token from
  // the email link and treats the caller as signed in immediately — no separate
  // login step after clicking an invite or magic-link email.
  {
    let capturedUrl, capturedOptions;
    global.fetch = async (url, options) => {
      capturedUrl = url; capturedOptions = options;
      return { ok: true, json: async () => ({ id: 'u9', email: 'invited@x.com' }) };
    };
    const { SupabaseAuth, localStorage } = loadModule();
    const auth = SupabaseAuth.createAuth(client);
    const session = await auth.completeSessionFromTokens('link-access-token', 'link-refresh-token', 3600);
    assert.equal(capturedUrl, 'https://example.supabase.co/auth/v1/user');
    assert.equal(capturedOptions.method, 'GET');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer link-access-token');
    assert.equal(session.accessToken, 'link-access-token');
    assert.equal(session.refreshToken, 'link-refresh-token');
    assert.equal(session.user.email, 'invited@x.com');
    assert.equal(auth.getSession().accessToken, 'link-access-token', '완료 즉시 로그인 상태여야 합니다');
    assert.ok(localStorage.getItem('auditAppSupabaseSession'), '세션이 로컬에 저장되어야 합니다');
  }

  // completeSessionFromTokens() surfaces a server error (e.g. an already-used/expired token)
  {
    global.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error_description: 'Email link is invalid or has expired' }) });
    const { SupabaseAuth } = loadModule();
    const auth = SupabaseAuth.createAuth(client);
    await assert.rejects(auth.completeSessionFromTokens('bad-token', 'rt', 3600), /expired/);
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
