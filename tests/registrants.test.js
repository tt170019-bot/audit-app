const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');

function loadModule(){
  const context = { globalThis: {}, fetch: (...args) => global.fetch(...args) };
  vm.runInNewContext(fs.readFileSync(require.resolve('../registrants.js'), 'utf8'), context);
  return context.globalThis.Registrants;
}

const client = { url: 'https://example.supabase.co', anonKey: 'anon-key' };

async function main(){
  const originalFetch = global.fetch;

  // list() calls the registrants function with action:'list' and the caller's access token
  {
    let capturedUrl, capturedOptions, capturedBody;
    global.fetch = async (url, options) => {
      capturedUrl = url; capturedOptions = options; capturedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ users: [{ id: 'u1', email: 'a@b.com' }] }) };
    };
    const registrants = loadModule().createRegistrants(client);
    const users = await registrants.list('access-token-1');
    assert.equal(capturedUrl, 'https://example.supabase.co/functions/v1/registrants');
    assert.equal(capturedOptions.headers.apikey, 'anon-key');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer access-token-1');
    assert.deepEqual(capturedBody, { action: 'list' });
    assert.deepEqual(users, [{ id: 'u1', email: 'a@b.com' }]);
  }

  // invite() sends the email and returns the invited user
  {
    let capturedBody;
    global.fetch = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ user: { id: 'u2', email: 'new@x.com' } }) };
    };
    const registrants = loadModule().createRegistrants(client);
    const user = await registrants.invite('access-token-1', 'new@x.com');
    assert.deepEqual(capturedBody, { action: 'invite', email: 'new@x.com' });
    assert.equal(user.email, 'new@x.com');
  }

  // remove() sends the target userId
  {
    let capturedBody;
    global.fetch = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ ok: true }) };
    };
    const registrants = loadModule().createRegistrants(client);
    await registrants.remove('access-token-1', 'u2');
    assert.deepEqual(capturedBody, { action: 'remove', userId: 'u2' });
  }

  // a function-side error (e.g. unauthorized, or "can't remove yourself") surfaces as a rejected promise
  {
    global.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: '본인 계정은 제거할 수 없습니다' }) });
    const registrants = loadModule().createRegistrants(client);
    await assert.rejects(registrants.remove('access-token-1', 'self'), /본인 계정은 제거할 수 없습니다/);
  }

  global.fetch = originalFetch;

  // getRegistrants()/setRegistrants() — a stubbable module-level singleton for tests
  {
    const Registrants = loadModule();
    const fake = { list: async () => [{ id: 'stub', email: 'stub@x.com' }] };
    Registrants.setRegistrants(fake);
    assert.equal(Registrants.getRegistrants(client), fake);
  }

  console.log('registrants tests passed');
}

main().catch(e => { console.error(e); process.exit(1); });
