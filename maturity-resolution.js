// Resolves an item's Maturity Assessment against a template's Maturity Scale
// library — the one place the legacy-vs-multi-scale reconciliation (see
// audit-rules.js) is combined into what a renderer actually needs: which
// scales this item is assigned to, its currently selected level per scale,
// and the guidance text per (scale, level). See docs/adr and CONTEXT.md for
// the Maturity Assessment / Maturity Scale vocabulary.
(function(root, factory){
  const AuditRules = root.AuditRules || (typeof require === 'function' ? require('./audit-rules.js') : undefined);
  const resolution = factory(AuditRules);
  if(typeof module === 'object' && module.exports) module.exports = resolution;
  root.MaturityResolution = resolution;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(AuditRules){

  function resolveItemMaturity(item, scaleLibrary){
    const library = Array.isArray(scaleLibrary) ? scaleLibrary : [];
    const assignment = AuditRules.deriveItemMaturityAssignment(item);
    const results = AuditRules.deriveMaturityResults(item);
    const assignedScales = assignment.scaleIds.map(id => library.find(s => s.id === id)).filter(Boolean);
    return {
      assignedScales,
      selectedLevel(scaleId){ return results[scaleId] || ''; },
      guidance(scaleId, levelIndex, levelLabel){ return AuditRules.getMaturityGuidance(item, scaleId, levelIndex, levelLabel); }
    };
  }

  return { resolveItemMaturity };
});
