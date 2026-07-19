(function(root, factory){
  root.SupabaseAuth = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  const SESSION_KEY = 'auditAppSupabaseSession';

  function readStoredSession(){
    try{
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function writeStoredSession(session){
    try{
      if(session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    }catch(e){ /* storage unavailable (private mode, quota) — session just stays in-memory */ }
  }

  function toSession(data){
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 0) * 1000,
      user: data.user || null
    };
  }

  function createAuth(client){
    let session = readStoredSession();

    async function authRequest(path, body){
      const response = await fetch(`${client.url}/auth/v1/${path}`, {
        method: 'POST',
        headers: { apikey: client.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(data?.error_description || data?.msg || `Supabase Auth HTTP ${response.status}`);
      return data;
    }

    async function signIn(email, password){
      const data = await authRequest('token?grant_type=password', { email, password });
      session = toSession(data);
      writeStoredSession(session);
      return session;
    }

    async function signOut(){
      if(session?.accessToken){
        await fetch(`${client.url}/auth/v1/logout`, {
          method: 'POST',
          headers: { apikey: client.anonKey, Authorization: `Bearer ${session.accessToken}` }
        }).catch(() => {});
      }
      session = null;
      writeStoredSession(null);
    }

    function getSession(){
      return session;
    }

    // Refreshes the access token on startup so a Registrant doesn't have to
    // re-enter a password every visit. If the refresh call fails (offline, or
    // the network is just slow) the previously cached session is kept as-is —
    // this must never block or degrade the anonymous auditor read/take-audit
    // flow, which doesn't touch auth at all.
    async function restoreSession(){
      if(!session?.refreshToken) return null;
      try{
        const data = await authRequest('token?grant_type=refresh_token', { refresh_token: session.refreshToken });
        session = toSession(data);
        writeStoredSession(session);
      }catch(e){ /* keep cached session */ }
      return session;
    }

    return { signIn, signOut, getSession, restoreSession };
  }

  let auth = null;

  return {
    createAuth,
    getAuth(client){ return auth || (auth = createAuth(client)); },
    setAuth(fake){ auth = fake; }
  };
});
