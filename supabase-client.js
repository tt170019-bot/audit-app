(function(root, factory){
  root.SupabaseClient = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  const SUPABASE_URL = 'https://glwxmotsuwauxcwobmap.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsd3htb3RzdXdhdXhjd29ibWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjk2NzAsImV4cCI6MjA5OTk0NTY3MH0.HnaMSJC7bTovJSRTel65dYNb51MPpSkh2cUnBzds3cs';

  function createClient(url, anonKey){
    async function selectAll(table){
      const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
      });
      if(!response.ok) throw new Error(`Supabase REST HTTP ${response.status} (${table})`);
      return response.json();
    }

    // wayfinder #11 — writes go through the caller's own access token (not the
    // anon key) so Postgres RLS sees the real Registrant and can enforce
    // created_by/updated_by server-side, not just as a client-side convention.
    async function writeRequest(method, path, body, accessToken){
      const response = await fetch(`${url}/rest/v1/${path}`, {
        method,
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => null);
      if(!response.ok) throw new Error(data?.message || `Supabase REST HTTP ${response.status} (${path})`);
      return Array.isArray(data) ? data[0] : data;
    }

    function insert(table, row, accessToken){
      return writeRequest('POST', table, row, accessToken);
    }

    function update(table, id, patch, accessToken){
      return writeRequest('PATCH', `${table}?id=eq.${encodeURIComponent(id)}`, patch, accessToken);
    }

    return { url, anonKey, selectAll, insert, update };
  }

  let client = null;

  return {
    createClient,
    getClient(){ return client || (client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)); },
    setClient(fake){ client = fake; }
  };
});
