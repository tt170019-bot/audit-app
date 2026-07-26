-- Allow any logged-in Registrant to delete a Checklist Template (see the
-- "Delete permission" decision in the 2026-07-26 grilling session): delete
-- moves from the client-side, password-less ?admin=1 toggle to the same real
-- auth check that registration/editing already uses.
-- Run this once in the Supabase SQL Editor (or `supabase db push`).

create policy "templates_delete_authenticated"
  on templates for delete
  to authenticated
  using (true);
