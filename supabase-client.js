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
    return { url, anonKey, selectAll };
  }

  let client = null;

  return {
    createClient,
    getClient(){ return client || (client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)); },
    setClient(fake){ client = fake; }
  };
});
