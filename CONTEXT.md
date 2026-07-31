# Audit Checklist

This context manages audit checklists, audit findings, supporting evidence, and audit reports. It distinguishes ordinary audit results from maturity assessments, which are recorded per checklist item against a template-defined Maturity Scale.

## Language

**Checklist Type 1 / Checklist Type 2** (retired):
No longer real concepts in this system. A checklist used to be classified wholesale as one or the other, inferred from its filename; that inference is gone, replaced by a per-item Maturity Assessment flag and a template's Maturity Scale (below). Listed here only so old references to "Type 2" (e.g. in legacy Excel column labels) can be traced back to what they meant.
_Avoid_: Use "Maturity Assessment" (per-item) and "Maturity Scale" (per-template) instead.

**Audit Result**:
The auditor's assessment of whether a requirement is satisfied, observed, unsatisfied, or not applicable.
_Avoid_: Maturity level, score

**Maturity Assessment**:
An independent assessment of organizational maturity, recorded against its checklist template's Maturity Scale. Not every item carries one — a Registrant sets this on/off per item when registering the template.
_Avoid_: Audit result, satisfaction, checklist type

**Maturity Scale**:
A checklist template's own ordered list of levels (a name plus an ordered list of labels — e.g. Conformity/Established/Mature/Leading, or any custom set a Registrant defines) that its items' Maturity Assessments are recorded against. Defined once per template, not per item.
_Avoid_: Maturity levels, scale (ambiguous alone), rubric

**Registrant**:
An authenticated person invited to register new checklist templates or edit existing ones. Distinct from "admin mode": a local, unauthenticated UI toggle (`?admin=1`) that only shows or hides buttons on one device and grants no real write access. Being a Registrant is what actually authorizes writing to the shared checklist store.
_Avoid_: Admin, administrator, manager

**Checklist Template**:
The shared, editable definition an Audit is created from — a name, its sections, its items, and (optionally) a Maturity Scale. It has a stable identity: a Registrant's edit overwrites it in place rather than creating a new one. The single source of truth lives in Supabase; GitHub-synced templates are retired (see below).
_Avoid_: Checklist, preset, form

**Checklist Template Revision**:
An immutable snapshot of a Checklist Template's full content (name, sections, items, Maturity Scale), captured automatically the instant before a Registrant's edit overwrites the template. Revisions accumulate append-only per template and exist so a past edit can be inspected or restored. Distinct from an Audit Report's item snapshot: a Revision preserves the Template's own edit history; the Audit's snapshot preserves what a specific Audit used, and is untouched by later template edits either way.
_Avoid_: Version, backup, template history

**Revision Number / Revision Date**:
A Checklist Template's own document-control identity — an integer and a calendar date a Registrant types in by hand when saving (e.g. "개정 3 · 2026-07-01"). Independent of `updated_at`: nothing derives or auto-increments it, so it can be left blank, skipped, or set out of order if that's what the paper trail says.
_Avoid_: Version number, updated date

**Template Version Label**:
A display-only string shown next to a Checklist Template, derived on the fly for the UI. Prefers Revision Number/Date when the Registrant has set them; falls back to a formatted update date otherwise. Not a stored entity — do not confuse with Checklist Template Revision, which is an actual persisted record.
_Avoid_: Version, revision

**GitHub-synced Checklist** (retired):
Templates used to also come from `.xlsx` files committed to a `checklists/` folder and read live via the GitHub Contents API, alongside the Supabase-registered ones. That path is retired; the Checklist Template is now Supabase-only. Listed here only so old code comments/commits referencing "GitHub sync", `github-api`/`github-index` sources, or `preset` templates can be traced back to what they meant.
_Avoid_: Use "Checklist Template" (Supabase-backed) instead.

**Evidence**:
Supporting material attached to substantiate an audit result or maturity assessment.
_Avoid_: Attachment, photo

**TOPS Excel**:
An Excel export (`exportTopsChecklistExcel`) matching the external TOPS system's bulk-registration import schema — exactly 12 fixed columns, Audit Result marks only. Not extensible with extra columns; the import rejects anything that doesn't match the schema exactly. See [ADR-0003](docs/adr/0003-tops-excel-stays-result-only.md).
_Avoid_: Confusing with `exportExcel`'s general-purpose Excel export, which does carry Maturity Assessment columns.

**Audit Report**:
The generated record of a completed audit, including checklist responses, comments, and evidence.
_Avoid_: Export file, output

**Completed Audit**:
An Audit Report whose every checklist item has an Audit Result. It is locked until explicitly reopened.
_Avoid_: Partially completed audit, draft

## Ownership and Sync

**Personal Audit Workspace**:
A private collection of audits stored on one user's local device. It is not shared with other users or synchronized between devices.
_Avoid_: Shared team workspace, synchronized workspace
