const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');

function loadModule(){
  const context = { globalThis: {}, fetch: (...args) => global.fetch(...args) };
  vm.runInNewContext(fs.readFileSync(require.resolve('../supabase-client.js'), 'utf8'), context);
  return context.globalThis.SupabaseClient;
}

async function main(){
  const originalFetch = global.fetch;

  // createClient() builds a REST client against a given url/key, no global state
  {
    let capturedUrl, capturedOptions;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return { ok: true, json: async () => [{ id: 1, name: '테스트' }] };
    };

    const client = loadModule().createClient('https://example.supabase.co', 'anon-key');
    const rows = await client.selectAll('templates');
    assert.equal(capturedUrl, 'https://example.supabase.co/rest/v1/templates?select=*');
    assert.equal(capturedOptions.headers.apikey, 'anon-key');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer anon-key');
    assert.deepEqual(rows, [{ id: 1, name: '테스트' }]);
  }

  // selectAll() throws on a non-ok HTTP response, letting callers fall back safely
  {
    global.fetch = async () => ({ ok: false, status: 404 });
    const client = loadModule().createClient('https://example.supabase.co', 'anon-key');
    await assert.rejects(client.selectAll('templates'), /404/);
  }

  global.fetch = originalFetch;

  // getClient()/setClient() — a stubbable module-level singleton for tests
  {
    const SupabaseClient = loadModule();
    const fake = { selectAll: async () => [{ id: 42 }] };
    SupabaseClient.setClient(fake);
    assert.equal(SupabaseClient.getClient(), fake, 'setClient()은 이후 getClient() 호출에 그대로 반영되어야 합니다');
  }

  console.log('supabase client tests passed');
}

main().catch(e => { console.error(e); process.exit(1); });
