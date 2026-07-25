# Retire GitHub-synced checklists in favor of Supabase as the sole source

Checklist Templates used to come from two parallel sources: `.xlsx` files committed to a `checklists/` folder and read live via the GitHub Contents API (`loadGitHubIndex`), and Registrant-managed rows in Supabase (`loadSupabaseTemplates`). Maintaining a template meant either a `git` commit + Actions run, or a login + edit through the app — two different mental models and code paths for the same concept. We removed the GitHub path entirely: `checklists/*.xlsx`, `generate-checklists-index.yml`, `loadGitHubIndex`, and every `github-api`/`github-index`/`preset` source branch. Supabase is now the only place a Checklist Template is registered or edited, which is also the foundation the new Checklist Template Revision history (ADR-0002) builds on — a single source made a single history table sufficient.

## Status

Accepted
