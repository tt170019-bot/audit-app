# Audit Checklist

This context manages audits, the checklist templates they are created from, supporting evidence, and the reports generated from them. It distinguishes ordinary audit results from maturity assessments, which are recorded per checklist item against a template-defined Maturity Scale.

## Language

### The audit

**Audit**:
The local, per-device record created from a Checklist Template: a snapshot of that template's sections and items, plus the auditor's Audit Results (or Behavior/Outcome entries), comments, and Evidence. Carries a status of in-progress or completed. Lives only in the Personal Audit Workspace; the template snapshot is frozen at creation and untouched by later template edits.
_Avoid_: Audit Report (that is the generated document, not the record), inspection, 심사 as a distinct entity

**Audit Result**:
The auditor's assessment of whether a requirement is satisfied, observed, unsatisfied, or not applicable.
_Avoid_: Maturity level, score

**Completed Audit**:
An Audit whose every checklist item has an Audit Result (a Behavior/Outcome audit counts as complete as soon as it is opened, since its items carry no pass/fail judgment). Its status is locked: read-only until explicitly reopened.
_Avoid_: Partially completed audit, draft

**Evidence**:
Supporting material — in practice always photos — attached to a checklist item to substantiate its Audit Result or Maturity Assessment. The code and UI call these "photos" (`item.photos`); "Evidence" is the domain term for the same thing.
_Avoid_: Attachment

**Behavior/Outcome Assessment**:
A fixed, single-purpose alternative to the ordinary Audit Result, used only by the Line Safety Audit checklist. Each item shows two hardcoded code groups — Behavior (DA/DI/UD) and Outcome (UAS/AE/IC) — and the auditor may enter a free integer against any number of codes in either group (not a single pick). Enabled per template via a template-level flag; when on, it fully replaces the item's Audit Result buttons. Codes are the same across every item in the template — not Registrant-configurable, not per-item.
_Avoid_: Result (collides with Audit Result — the form's "Result" column is this assessment's Outcome group, not an Audit Result); "Weather-style" (a description with no basis, previously in this glossary)

**Line Safety Audit (LSA)**:
The one checklist template whose items use a Behavior/Outcome Assessment instead of ordinary Audit Results — the 현장탑승심사. "LSA" is the shorthand carried in the code (`renderLsaFieldItem`, "LSA Details").
_Avoid_: LOSA, weather audit

### Checklist templates

**Checklist Template**:
The shared, editable definition an Audit is created from — a name, its sections, its items, and (optionally) a Maturity Scale. It has a stable identity: a Registrant's edit overwrites it in place rather than creating a new one. The single source of truth lives in Supabase; GitHub-synced templates are retired (see below).
_Avoid_: Checklist, preset, form

**Maturity Assessment**:
An independent assessment of organizational maturity, recorded against its checklist template's Maturity Scale. Not every item carries one — which items do is fixed per template: set item by item by a Registrant in the review wizard, or, for legacy templates that predate the wizard, inferred wholesale from the checklist name.
_Avoid_: Audit result, satisfaction, checklist type

**Maturity Scale**:
A checklist template's own ordered list of levels (a name plus an ordered list of labels — e.g. Conformity/Established/Mature/Leading, or any custom set a Registrant defines) that its items' Maturity Assessments are recorded against. Defined once per template, not per item.
_Avoid_: Maturity levels, scale (ambiguous alone), rubric

**Checklist Template Revision**:
An immutable snapshot of a Checklist Template's full content (name, sections, items, Maturity Scale), captured automatically the instant before a Registrant's edit overwrites the template. Revisions accumulate append-only per template and exist so a past edit can be inspected or restored. Distinct from an Audit's template snapshot: a Revision preserves the Template's own edit history; the Audit's snapshot preserves what one specific Audit used, and neither is affected by later template edits.
_Avoid_: Version, backup, template history

**Revision Number / Revision Date**:
A Checklist Template's own document-control identity — an integer and a calendar date a Registrant types in by hand when saving (e.g. "개정 3 · 2026-07-01"). Independent of `updated_at`: nothing derives or auto-increments it, so it can be left blank, skipped, or set out of order if that's what the paper trail says.
_Avoid_: Version number, updated date

**Template Version Label**:
A display-only string shown next to a Checklist Template, derived on the fly for the UI. Prefers Revision Number/Date when the Registrant has set them; falls back to a formatted update date otherwise. Not a stored entity — do not confuse with Checklist Template Revision, which is an actual persisted record.
_Avoid_: Version, revision

### Reports and exports

**Audit Report**:
A document generated on demand from a completed Audit for distribution — Word (`exportWord`), PDF (`exportPDF`), or the general-purpose Excel (`exportExcel`). Not persisted: nothing in storage is an Audit Report; it is produced fresh from the Audit each time. The Word/PDF layout is chosen by the Report Template Type.
_Avoid_: Export file, output

**Report Template Type**:
Which of the two Word/PDF layouts an Audit Report uses — `report-type-1` (plain) or `report-type-2` (the Maturity Assessment / Behavior-Outcome block layout, rendered from `templates/report-type-2.html`). Stored on the Audit as `reportTemplate`; inferred (`inferReportTemplateType`) from whether the checklist owns a Maturity Scale or a Behavior/Outcome flag. One of the two mechanical remnants of the retired Checklist Type 1/2 split.
_Avoid_: Checklist type, "report type" alone

**Checklist UI Type**:
`checklistUiType` — `standard` or `maturity`, keyword-inferred (`getChecklistUiType`) from a checklist's name (`checklist-2`, `현장탑승심사표`, `안전성과지표`, `리튬`, …) for legacy templates that carry no explicit Maturity Scale. The other remnant of the retired Type 1/2 split; only affects templates that never went through the review wizard.
_Avoid_: Checklist type

**TOPS Excel**:
An Excel export (`exportTopsChecklistExcel`) matching the external TOPS system's bulk-registration import schema — exactly 12 fixed columns, Audit Result marks only. Not extensible with extra columns; the import rejects anything that doesn't match the schema exactly. See [ADR-0003](docs/adr/0003-tops-excel-stays-result-only.md).
_Avoid_: Confusing with `exportExcel`'s general-purpose Excel export, which does carry Maturity Assessment columns.

### People and storage

**Registrant**:
An authenticated person invited to register new checklist templates or edit existing ones. Holding a Registrant session is what authorizes writing to the shared checklist store; an ordinary auditor works offline against synced templates and never logs in.
_Avoid_: Admin, administrator, manager

**Personal Audit Workspace**:
A private collection of audits stored on one user's local device. Not shared with other users, not synchronized between devices. A concept, not a named entity — there is no code object by this name; it is the collective term for the on-device `audits` store.
_Avoid_: Shared team workspace, synchronized workspace

### Retired concepts

**Checklist Type 1 / Checklist Type 2** (retired):
No longer real concepts. A checklist used to be classified wholesale as one or the other, inferred from its filename; that classification is gone, replaced by a per-item Maturity Assessment flag and a template's Maturity Scale. Two mechanical remnants survive: the Report Template Type (`report-type-1/2`, all templates) and the Checklist UI Type (`checklistUiType`, legacy templates only). Listed here so old references to "Type 2" (e.g. in legacy Excel column labels) can be traced back to what they meant.
_Avoid_: Use "Maturity Assessment" (per-item) and "Maturity Scale" (per-template) instead.

**Admin mode / `?admin=1`** (retired):
Was a local, unauthenticated URL toggle that only showed or hid management buttons on one device and granted no real write access. Removed 2026-07-26; write access to the shared checklist store is now solely a Registrant's authenticated session. Listed so old commits and comments referencing it can be traced.
_Avoid_: Use "Registrant" instead.

**GitHub-synced Checklist** (retired):
Templates used to also come from `.xlsx` files committed to a `checklists/` folder and read live via the GitHub Contents API, alongside the Supabase-registered ones. That path is retired; the Checklist Template is now Supabase-only. Listed here only so old code comments/commits referencing "GitHub sync", `github-api`/`github-index` sources, or `preset` templates can be traced back to what they meant.
_Avoid_: Use "Checklist Template" (Supabase-backed) instead.
