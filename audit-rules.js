(function(root, factory){
  const rules = factory();
  if(typeof module === 'object' && module.exports) module.exports = rules;
  root.AuditRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  const MATURITY_LEVELS = Object.freeze(['Conformity', 'Established', 'Mature', 'Leading']);
  const DIVISIONS = Object.freeze(['안전', '보안', '정비', '운항', '객실', '화물', '여객지원', '종합통제']);
  // Behavior/Outcome Assessment (see CONTEXT.md) — fixed codes for the one
  // checklist template that uses this in place of Audit Result. Not
  // Registrant-configurable: every item in that template shows these same
  // two groups.
  const BEHAVIOR_CODES = Object.freeze(['DA', 'DI', 'UD']);
  const OUTCOME_CODES = Object.freeze(['UAS', 'AE', 'IC']);
  // Every template/item/audit-item created before the multi-scale model
  // (2026-07-26) is adapted at read time under this synthetic scale id,
  // instead of a destructive data migration. See deriveMaturityScales /
  // deriveItemMaturityAssignment / deriveMaturityResults below.
  const LEGACY_SCALE_ID = 'legacy';
  const DEFAULT_MATURITY = Object.freeze({
    Conformity: { title: '기본 절차를 인지하고 실행하는 수준', body: '예) 위험 징후 즉시 인지 · 표준 절차 실행 · 필요한 장비 또는 자료 확인' },
    Established: { title: '상황에 맞게 절차와 보고를 수행하는 수준', body: '예) 담당자 간 정보 공유 · 책임자 보고 · 관련 기록과 안내 수행' },
    Mature: { title: '역할 분담과 추가 점검으로 체계적으로 운영하는 수준', body: '예) 역할과 책임 명확화 · 주변 영향 확인 · 상세 기록과 후속조치 검토' },
    Leading: { title: '예방과 개선 활동으로 절차를 고도화하는 수준', body: '예) 예방 조치 강화 · 개선사항 도출 · 교육과 절차 개선으로 환류' }
  });

  function sourceText(source){
    return [source?.checklistUiType, source?.name, source?.filename, source?.title, source?.templateName, source?.templateTitle, source?.templateFilename, source?.reportTemplate].filter(Boolean).join(' ').toLowerCase();
  }

  function inferReportTemplateType(source){
    // A checklist that actually owns maturity scales (new multi-scale wizard,
    // old single-scale shape, or legacy checklistUiType/name keyword match —
    // deriveMaturityScales already covers all three) needs the type-2
    // (Maturity Assessment table) report, regardless of what its name says.
    // A Behavior/Outcome Assessment checklist also needs the type-2
    // per-item block layout — it has no Maturity Scale of its own.
    return (deriveMaturityScales(source).length > 0 || source?.behaviorOutcomeAssessment) ? 'report-type-2' : 'report-type-1';
  }

  function getChecklistUiType(source){
    const text = sourceText(source);
    return text.includes('checklist-2') || text.includes('checklist 2') || text.includes('2번 체크리스트') || text.includes('현장탑승심사표') || text.includes('안전성과지표') || text.includes('리튬') || text.includes('report-type-2')
      ? 'maturity'
      : 'standard';
  }

  function normalizeResultValue(value){
    const valueText = String(value || '').trim().toUpperCase();
    if(valueText === 'OK' || valueText === 'YES' || valueText === 'Y') return 'YES';
    if(valueText === 'NG' || valueText === 'NO' || valueText === 'N') return 'NO';
    if(valueText === 'NA' || valueText === 'N/A') return 'N/A';
    if(valueText === 'OBS' || valueText === 'OBSERVATION') return 'OBS';
    return value || '';
  }

  // Groups items by section, defaulting an unlabeled item to '일반'. Shared
  // by audit-detail.js (checklist view) and report-export.js (Word/Excel
  // export) so the section-key rule lives in one place.
  function bucketBySection(items){
    const sections = {};
    (items || []).forEach(item => {
      const sec = item.section || '일반';
      if(!sections[sec]) sections[sec] = [];
      sections[sec].push(item);
    });
    return sections;
  }

  // Judgment mode (see the 2026-07-31 architecture review) — the one place
  // "does this item carry a per-item judgment" is decided. Audit Result
  // items do (YES/NO/OBS/N-A); Behavior/Outcome items never do (CONTEXT.md).
  // Every caller that used to branch on audit.behaviorOutcomeAssessment for
  // completion/answered-counting reasons should ask the mode instead —
  // rendering-dispatch branches (which panel, which export renderer) stay as
  // plain ternaries at their one call site; they aren't duplicated logic.
  const JUDGMENT_MODES = {
    auditResult: {
      isComplete(items){ return (items || []).every(item => Boolean(normalizeResultValue(item.result))); },
      answeredCount(items){ return (items || []).filter(item => item.result).length; },
      showsFraction: true
    },
    behaviorOutcome: {
      isComplete(){ return true; },
      answeredCount(items){ return (items || []).length; },
      showsFraction: false
    }
  };

  function judgmentModeFor(audit){
    return audit?.behaviorOutcomeAssessment ? JUDGMENT_MODES.behaviorOutcome : JUDGMENT_MODES.auditResult;
  }

  function canCompleteAudit(audit){
    return judgmentModeFor(audit).isComplete(audit?.items);
  }

  // ═══════════════════════════════════════════════
  //  Multi-scale maturity model (2026-07-26)
  //  A template owns a *library* of scales (each its own name + N levels).
  //  Each item picks any subset of that library (0, 1, or many), and each
  //  item authors its own guidance text per scale per level — guidance is
  //  never shared at the scale level, it's a per-item, per-scale array.
  // ═══════════════════════════════════════════════

  // Template-level: always returns an array, adapting whatever shape the
  // stored template happens to have (new maturityScales array, an old
  // singular maturityScale object, or nothing but a legacy checklistUiType
  // flag) into the same array-of-scales shape.
  function deriveMaturityScales(template){
    // Presence, not length, is the signal: once a template is saved through
    // the multi-scale wizard even once, maturityScales is always an array
    // (possibly empty, if the author removed every scale) and must win over
    // a stale legacy maturityScale left over from before that save.
    if(Array.isArray(template?.maturityScales)){
      return template.maturityScales;
    }
    if(template?.maturityScale?.labels?.length){
      return [{ id: LEGACY_SCALE_ID, name: template.maturityScale.name || '성숙도 등급', labels: template.maturityScale.labels }];
    }
    const uiType = template?.checklistUiType || getChecklistUiType(template);
    if(uiType === 'maturity'){
      return [{ id: LEGACY_SCALE_ID, name: '성숙도 등급', labels: [...MATURITY_LEVELS] }];
    }
    return [];
  }

  // Item-level: which scale ids this item is assigned to, and its per-scale
  // per-level guidance text. Adapts the old maturityOn boolean + flat
  // criteria fields (or old flat maturityGuidance array, for a template that
  // had already defined a single custom scale) into the new shape.
  function deriveItemMaturityAssignment(item){
    if(Array.isArray(item?.maturityScaleIds)){
      const guidance = (item?.maturityGuidance && typeof item.maturityGuidance === 'object' && !Array.isArray(item.maturityGuidance))
        ? item.maturityGuidance
        : {};
      return { scaleIds: item.maturityScaleIds, guidance };
    }
    const on = item?.maturityOn ?? Boolean(item?.conformityCriteria || item?.establishedCriteria || item?.matureCriteria || item?.leadingCriteria);
    if(!on) return { scaleIds: [], guidance: {} };
    const legacyGuidance = Array.isArray(item?.maturityGuidance)
      ? item.maturityGuidance
      : [item?.conformityCriteria, item?.establishedCriteria, item?.matureCriteria, item?.leadingCriteria];
    return { scaleIds: [LEGACY_SCALE_ID], guidance: { [LEGACY_SCALE_ID]: legacyGuidance } };
  }

  // Guidance text for one (item, scale, level). Only the synthetic legacy
  // scale id falls back to canned DEFAULT_MATURITY copy when the author left
  // that level blank — a real author-defined scale has no canned fallback,
  // blank just means blank.
  function getMaturityGuidance(item, scaleId, levelIndex, levelLabel){
    const { guidance } = deriveItemMaturityAssignment(item);
    const text = String(guidance?.[scaleId]?.[levelIndex] || '').trim();
    if(text) return { title: text, body: '' };
    if(scaleId === LEGACY_SCALE_ID && DEFAULT_MATURITY[levelLabel]) return DEFAULT_MATURITY[levelLabel];
    return { title: '', body: '' };
  }

  // Audit-item-level: selected level per scale id. Adapts the old single
  // `maturity` string (always meant the one-and-only legacy scale) into the
  // new shape.
  function deriveMaturityResults(item){
    if(item?.maturityResults && typeof item.maturityResults === 'object') return item.maturityResults;
    if(item?.maturity) return { [LEGACY_SCALE_ID]: item.maturity };
    return {};
  }

  function validateMaturityScale(scale){
    const name = String(scale?.name || '').trim();
    const labels = Array.isArray(scale?.labels) ? scale.labels.map(l => String(l || '').trim()).filter(Boolean) : [];
    if(!name) return { valid: false, error: '척도 이름을 입력하세요' };
    if(labels.length === 0) return { valid: false, error: '라벨을 하나 이상 추가하세요' };
    return { valid: true, error: '' };
  }

  return {
    MATURITY_LEVELS, DIVISIONS, LEGACY_SCALE_ID, BEHAVIOR_CODES, OUTCOME_CODES, JUDGMENT_MODES,
    inferReportTemplateType, getChecklistUiType, normalizeResultValue, canCompleteAudit, judgmentModeFor, bucketBySection,
    deriveMaturityScales, deriveItemMaturityAssignment, getMaturityGuidance, deriveMaturityResults,
    validateMaturityScale
  };
});
