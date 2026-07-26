-- Multi-scale maturity model (see the 2026-07-26 grilling session): a
-- template can now own a *library* of maturity scales instead of exactly
-- one, and each item picks any subset of that library.
--
-- Kept `maturity_scale` (singular) untouched — old rows still have it, and
-- the app reads it as a fallback when `maturity_scales` is null (see
-- checklist-source.js normalizeSupabaseTemplate). No backfill needed.
-- Run this once in the Supabase SQL Editor (or `supabase db push`).

alter table templates add column if not exists maturity_scales jsonb;
alter table template_revisions add column if not exists maturity_scales jsonb;

-- Widen the snapshot trigger (from the first migration) to carry the new column.
create or replace function snapshot_template_revision()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into template_revisions (template_id, name, filename, sections, items, maturity_scale, maturity_scales, revision_no, revision_date, division, updated_by, updated_at)
  values (old.id, old.name, old.filename, old.sections, old.items, old.maturity_scale, old.maturity_scales, old.revision_no, old.revision_date, old.division, old.updated_by, old.updated_at);
  return new;
end;
$$;
