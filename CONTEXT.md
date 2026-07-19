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

**Evidence**:
Supporting material attached to substantiate an audit result or maturity assessment.
_Avoid_: Attachment, photo

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
