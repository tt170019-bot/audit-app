(function(root, factory){
  const rules = factory();
  if(typeof module === 'object' && module.exports) module.exports = rules;
  root.AuditRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  const MATURITY_LEVELS = Object.freeze(['Conformity', 'Established', 'Mature', 'Leading']);
  const MATURITY_FIELDS = Object.freeze({
    Conformity: 'conformityCriteria',
    Established: 'establishedCriteria',
    Mature: 'matureCriteria',
    Leading: 'leadingCriteria'
  });
  const MATURITY_FIELD_ORDER = Object.freeze(Object.values(MATURITY_FIELDS));
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
    const text = sourceText(source);
    return text.includes('checklist-2') || text.includes('checklist 2') || text.includes('현장탑승심사표') || text.includes('안전성과지표') || text.includes('리튬')
      ? 'report-type-2'
      : 'report-type-1';
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

  function getMaturityConsideration(item, level){
    const text = String(item?.[MATURITY_FIELDS[level]] || '').trim();
    return text ? { title: text, body: '' } : (DEFAULT_MATURITY[level] || { title: '', body: '' });
  }

  function canCompleteAudit(audit){
    return Array.isArray(audit?.items) && audit.items.every(item => Boolean(normalizeResultValue(item.result)));
  }

  // wayfinder #7 — item-level maturity flag + template-level custom scale.
  // Legacy templates/audits only ever carry a whole-checklist checklistUiType;
  // this adapts them to the new shape without a data migration.
  function deriveMaturityScale(source){
    const uiType = source?.checklistUiType || getChecklistUiType(source);
    return uiType === 'maturity' ? { name: '성숙도 등급', labels: [...MATURITY_LEVELS] } : null;
  }

  // Guidance for an arbitrary, template-defined scale. Only the legacy 4
  // criteria columns are reused, and only positionally when the scale has
  // exactly 4 levels — no canned default text for scales this app didn't
  // author (that's what DEFAULT_MATURITY/getMaturityConsideration is for,
  // and it stays reserved for the exact legacy 4-level scale via that API).
  function getMaturityGuidanceForScale(item, labels, index){
    if(Array.isArray(labels) && labels.length === 4){
      const text = String(item?.[MATURITY_FIELD_ORDER[index]] || '').trim();
      if(text) return { title: text, body: '' };
    }
    const custom = String(item?.maturityGuidance?.[index] || '').trim();
    return custom ? { title: custom, body: '' } : { title: '', body: '' };
  }

  return { MATURITY_LEVELS, inferReportTemplateType, getChecklistUiType, normalizeResultValue, getMaturityConsideration, canCompleteAudit, deriveMaturityScale, getMaturityGuidanceForScale };
});
