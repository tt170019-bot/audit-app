// Audit lifecycle — building a new Audit from a Checklist Template, and the
// summary/completion queries audit-detail.js and report-export.js read
// through. Carved out of index.html (2026-07-31 architecture review) to
// match the module split already drawn for checklist-source.js and
// maturity-resolution.js; these functions are the same weight, they just
// hadn't been moved yet.

// Pure: everything needed to build an Audit sits in the two parameters, so
// this is testable without touching the DOM or IndexedDB. createAudit()
// below is the thin handler that reads the "새 심사" modal's fields and
// calls this.
function buildAuditFromTemplate(tpl, { title, date, auditor, dept, templateId }){
  const maturityScales = AuditRules.deriveMaturityScales(tpl);
  return {
    title, date, auditor, dept,
    templateId,
    templateName: tpl.name || '',
    templateVersion: getTemplateVersionLabel(tpl),
    checklistUiType: tpl.checklistUiType || AuditRules.getChecklistUiType(tpl),
    reportTemplate: tpl.reportTemplate || AuditRules.inferReportTemplateType(tpl),
    maturityScales,
    behaviorOutcomeAssessment: Boolean(tpl.behaviorOutcomeAssessment),
    status: AUDIT_STATUS.PROGRESS,
    createdAt: new Date().toISOString(),
    items: tpl.items.map(i=>{
      const assignment = AuditRules.deriveItemMaturityAssignment(i);
      return {...i, result:null, note:'', photos:[], maturityScaleIds: assignment.scaleIds, maturityGuidance: assignment.guidance, maturityResults: {}, behaviorOutcome: {}};
    })
  };
}

async function createAudit(){
  const title = document.getElementById('na-title').value.trim();
  const tplId = parseInt(document.getElementById('na-template').value);
  const date  = document.getElementById('na-date').value;
  const auditor = document.getElementById('na-auditor').value.trim();
  const dept  = document.getElementById('na-dept').value.trim();

  if(!title){ showToast('심사 제목을 입력하세요'); return; }
  if(!tplId){ showToast('점검표를 선택하세요'); return; }

  const tpl = await getNormalizedTemplate(tplId);
  if(!tpl){ showToast('점검표를 불러올 수 없습니다'); return; }
  if(!tpl.items.length){ showToast('점검표 항목 형식이 맞지 않습니다. 다시 업로드하세요'); return; }

  const audit = buildAuditFromTemplate(tpl, { title, date, auditor, dept, templateId: tplId });
  const id = await dbPut('audits', audit);
  closeModal('modal-newaudit');
  audit.id = id;
  showToast('심사가 시작되었습니다');
  openAudit(id);
}

// ═══════════════════════════════════════════════
//  Audit summary helpers
//  - Centralizes repeated YES/NO/OBS/N/A and completion calculations.
//  - Keeps one-file delivery while reducing render/export duplication.
// ═══════════════════════════════════════════════
function getAuditItems(audit){
  return Array.isArray(audit?.items) ? audit.items : [];
}

function countAuditResult(items, resultValue){
  return items.filter(item => normalizeResultValue(item.result) === resultValue).length;
}

function getAuditSummary(audit){
  const items = getAuditItems(audit);
  const total = items.length;
  const answered = AuditRules.judgmentModeFor(audit).answeredCount(items);
  const yes = countAuditResult(items, RESULT_VALUE.YES);
  const no = countAuditResult(items, RESULT_VALUE.NO);
  const obs = countAuditResult(items, RESULT_VALUE.OBS);
  const na = countAuditResult(items, RESULT_VALUE.NA);
  const percent = total ? Math.round(answered / total * 100) : 0;

  return {
    total,
    answered,
    percent,
    ok: yes,
    yes,
    ng: no,
    no,
    obs,
    na
  };
}

function getSectionCompletion(items, mode = AuditRules.JUDGMENT_MODES.auditResult){
  const safeItems = Array.isArray(items) ? items : [];
  return {
    total: safeItems.length,
    answered: mode.answeredCount(safeItems)
  };
}

function getResultPercent(count, total){
  return total ? `${Math.round(count / total * 100)}%` : '';
}
