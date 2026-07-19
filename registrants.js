(function(root, factory){
  root.Registrants = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  // wayfinder #12 — invite/list/remove all need the Supabase Admin API, which
  // requires the service_role key. That key must never reach client code, so
  // this module only ever talks to a Supabase Edge Function (deployed
  // separately) that holds the service_role key server-side and checks the
  // caller's own access token before acting.
  function createRegistrants(client){
    async function call(action, body, accessToken){
      const response = await fetch(`${client.url}/functions/v1/registrants`, {
        method: 'POST',
        headers: {
          apikey: client.anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, ...body })
      });
      const data = await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(data?.error || `Registrants function HTTP ${response.status}`);
      return data;
    }

    return {
      list: accessToken => call('list', {}, accessToken).then(d => d.users || []),
      invite: (accessToken, email) => call('invite', { email }, accessToken).then(d => d.user),
      remove: (accessToken, userId) => call('remove', { userId }, accessToken)
    };
  }

  let registrants = null;

  return {
    createRegistrants,
    getRegistrants(client){ return registrants || (registrants = createRegistrants(client)); },
    setRegistrants(fake){ registrants = fake; }
  };
});
