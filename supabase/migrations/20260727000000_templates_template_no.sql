-- 점검표번호 (점검표 명칭과 별도로 관리하는 문서 식별 번호).
-- Run this once in the Supabase SQL Editor (or `supabase db push`).

alter table templates add column if not exists template_no text;
alter table template_revisions add column if not exists template_no text;

-- Widen the snapshot trigger (from the prior migrations) to carry the new column.
create or replace function snapshot_template_revision()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into template_revisions (template_id, name, filename, sections, items, maturity_scale, maturity_scales, revision_no, revision_date, division, template_no, updated_by, updated_at)
  values (old.id, old.name, old.filename, old.sections, old.items, old.maturity_scale, old.maturity_scales, old.revision_no, old.revision_date, old.division, old.template_no, old.updated_by, old.updated_at);
  return new;
end;
$$;
