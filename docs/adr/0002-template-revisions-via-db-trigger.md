# Capture Checklist Template Revisions via a DB trigger, not client code

Every edit to a Checklist Template needs its prior content preserved as a Checklist Template Revision. We considered doing this from the client — `review-wizard.js` reads the current row, inserts it into `template_revisions`, then calls `updateSupabaseTemplate` — but that's two REST calls with no shared transaction: a dropped connection between them silently loses a revision or, worse, updates the template without recording what it overwrote. Instead, `templates` has a `BEFORE UPDATE` trigger that copies `OLD` into `template_revisions` as part of the same statement, so the snapshot can't happen without the edit or vice versa. The trigger function runs `SECURITY DEFINER` and `template_revisions` has no client-facing insert policy — the only way a row lands there is through an actual template edit, which also means the app code for saving a template needed no changes at all.

## Status

Accepted
