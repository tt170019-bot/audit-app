// wayfinder #12 — 등록자 관리 (초대/목록/제거)
//
// Invite/list/remove all need the Supabase Admin API, which requires the
// service_role key. That key must never reach client code, so this function
// is the one place it lives: it verifies the caller's own access token first
// (any authenticated Registrant — flat permission, no separate role table),
// then performs the requested action with an admin-privileged client.
//
// Deploy via the Supabase dashboard: Edge Functions -> Deploy a new function
// -> name it "registrants" -> paste this file. SUPABASE_URL,
// SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically
// as env vars by the Edge Function runtime — nothing to configure.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "unauthorized" }, 401);

  // Confirm the caller is a real, currently-valid Registrant session before
  // touching the admin client at all.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser(token);
  if (authError || !caller) return json({ error: "unauthorized" }, 401);

  let payload: { action?: string; email?: string; userId?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  if (payload.action === "list") {
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) return json({ error: error.message }, 400);
    return json({ users: data.users.map((u) => ({ id: u.id, email: u.email, createdAt: u.created_at })) });
  }

  if (payload.action === "invite") {
    if (!payload.email) return json({ error: "email is required" }, 400);
    const { data, error } = await admin.auth.admin.inviteUserByEmail(payload.email);
    if (error) return json({ error: error.message }, 400);
    return json({ user: { id: data.user.id, email: data.user.email } });
  }

  if (payload.action === "remove") {
    if (!payload.userId) return json({ error: "userId is required" }, 400);
    if (payload.userId === caller.id) return json({ error: "본인 계정은 제거할 수 없습니다" }, 400);
    const { error } = await admin.auth.admin.deleteUser(payload.userId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: "unknown action" }, 400);
});
