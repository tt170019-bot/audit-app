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

## Word/PDF export doesn't support multi-scale maturity yet
**What:** `report-export.js`'s Type-2 Word export still renders a single fixed
Maturity table (via `AuditRules.getMaturityGuidance(item, AuditRules.LEGACY_SCALE_ID, ...)`
and `deriveMaturityResults(item)[AuditRules.LEGACY_SCALE_ID]`). It only ever
shows the legacy scale's guidance/result — items with a real multi-scale
assignment (`maturityScaleIds.length > 1`, or a non-legacy scale id) export
with the wrong/missing Maturity section.
**Why:** The 2026-07-26 multi-scale maturity model (audit-rules.js,
review-wizard.js, audit-detail.js) was explicitly scoped to the in-app
audit-taking screen only — the user chose "심사 화면만 먼저, 내보내기는 따로"
(export redesign deferred to a separate pass) rather than block that release
on redesigning the export template.
**Context:** `templates/report-type-2.html` has no JS logic (pure CSS), so no
change needed there; the redesign is scoped to `report-export.js`'s table-building
function only.
**Depends on / blocked by:** Needs a design decision on how a Word/PDF table
should represent 0–N independent scale panels per item before implementation.
