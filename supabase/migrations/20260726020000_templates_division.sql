-- 점검표 소속부문 태그 (심사 시작 시 부문별로 점검표 목록을 빠르게 좁히기 위함).
-- Run this once in the Supabase SQL Editor (or `supabase db push`).

alter table templates add column if not exists division text;
alter table template_revisions add column if not exists division text;

-- Widen the snapshot trigger (from the first migration) to carry the new column.
create or replace function snapshot_template_revision()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into template_revisions (template_id, name, filename, sections, items, maturity_scale, revision_no, revision_date, division, updated_by, updated_at)
  values (old.id, old.name, old.filename, old.sections, old.items, old.maturity_scale, old.revision_no, old.revision_date, old.division, old.updated_by, old.updated_at);
  return new;
end;
$$;
