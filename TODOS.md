# TODOS

## Cross-device audit-record sync
**What:** Audit records and photos currently live only in the browser's own
IndexedDB. Checklist *templates* sync via Supabase; audit *results* do not —
by design, but it means switching devices mid-audit loses in-progress work
except through a full-replace backup/restore.
**Why:** If auditors ever need to hand off or continue an audit on a second
device, there's no path today short of manual JSON export/import.
**Context:** Raised during the 2026-07-26 CEO review of the CI/test-hardening
plan. Deliberately deferred — outside the blast radius of that plan (XL effort,
new server-side data model, new sync/conflict-resolution logic).
**Depends on / blocked by:** Nothing currently blocks starting this; revisit if
multi-device usage becomes a real reported pain point.
