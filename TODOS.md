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

## TOPS Excel export doesn't include maturity results
**What:** `exportTopsChecklistExcel` (fixed TOPS bulk-registration column
layout: ITEM/ITEM_NO/.../S/U-S/N-A/N-O/OBS/Comments) has no columns for
maturity scale results at all. `exportExcel`'s 점검결과 sheet and the
Word/PDF Type-2 export both now render 0–N scale columns/tables per item
(one column/table per scale the item is assigned to).
**Why:** Explicitly excluded from the 2026-07-27 multi-scale export fix —
user asked to do Excel + Word/PDF first, skip TOPS Excel.
**Depends on / blocked by:** Needs a decision on whether to append scale
columns after the fixed TOPS header row (same approach as `exportExcel`) or
leave TOPS Excel result-only by design.
