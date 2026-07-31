-- Behavior/Outcome Assessment (see CONTEXT.md) — a template-level flag for
-- the one checklist that replaces Audit Result with two fixed code groups
-- (Behavior: DA/DI/UD, Outcome: UAS/AE/IC), each code taking a free integer.
-- Run this once in the Supabase SQL Editor (or `supabase db push`).

alter table templates add column if not exists behavior_outcome_assessment boolean not null default false;
alter table template_revisions add column if not exists behavior_outcome_assessment boolean not null default false;

-- Widen the snapshot trigger (from the prior migrations) to carry the new column.
create or replace function snapshot_template_revision()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into template_revisions (template_id, name, filename, sections, items, maturity_scale, maturity_scales, revision_no, revision_date, division, template_no, behavior_outcome_assessment, updated_by, updated_at)
  values (old.id, old.name, old.filename, old.sections, old.items, old.maturity_scale, old.maturity_scales, old.revision_no, old.revision_date, old.division, old.template_no, old.behavior_outcome_assessment, old.updated_by, old.updated_at);
  return new;
end;
$$;
