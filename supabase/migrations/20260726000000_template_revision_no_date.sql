-- Manually-entered revision number/date on Checklist Templates (Registrant
-- types these in when saving; not auto-derived from updated_at).
-- Run this once in the Supabase SQL Editor (or `supabase db push`).

alter table templates add column if not exists revision_no integer;
alter table templates add column if not exists revision_date date;

alter table template_revisions add column if not exists revision_no integer;
alter table template_revisions add column if not exists revision_date date;

-- Widen the snapshot trigger (from the first migration) to carry the new
-- columns into template_revisions too.
create or replace function snapshot_template_revision()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into template_revisions (template_id, name, filename, sections, items, maturity_scale, revision_no, revision_date, updated_by, updated_at)
  values (old.id, old.name, old.filename, old.sections, old.items, old.maturity_scale, old.revision_no, old.revision_date, old.updated_by, old.updated_at);
  return new;
end;
$$;
