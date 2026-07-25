-- Checklist Template Revision history (see ADR-0002).
-- Run this once in the Supabase SQL Editor (or `supabase db push` if you use the CLI).
--
-- Adjust types if they don't match your actual `templates` table:
--   - `template_id uuid` must match the type of `templates.id`.
--   - `updated_by uuid` must match the type of `templates.updated_by`.

create table if not exists template_revisions (
  id bigint generated always as identity primary key,
  template_id uuid not null references templates(id) on delete cascade,
  name text not null,
  filename text,
  sections jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  maturity_scale jsonb,
  updated_by uuid,
  updated_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table template_revisions enable row level security;

-- Anyone can read revision history (mirrors the existing public read on `templates`).
create policy "template_revisions_select_all"
  on template_revisions for select
  using (true);

-- No insert/update/delete policy on purpose — the only writer is the trigger
-- below, which runs as SECURITY DEFINER and bypasses RLS. Nobody can forge
-- history through the REST API directly.

create or replace function snapshot_template_revision()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into template_revisions (template_id, name, filename, sections, items, maturity_scale, updated_by, updated_at)
  values (old.id, old.name, old.filename, old.sections, old.items, old.maturity_scale, old.updated_by, old.updated_at);
  return new;
end;
$$;

drop trigger if exists template_revisions_snapshot on templates;
create trigger template_revisions_snapshot
  before update on templates
  for each row
  execute function snapshot_template_revision();
