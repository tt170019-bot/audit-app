// Resolves an item's Maturity Assessment against a template's Maturity Scale
// library — the one place the legacy-vs-multi-scale reconciliation (see
// audit-rules.js) is combined into what a renderer actually needs: which
// scales this item is assigned to, and its currently selected level per
// scale. Guidance text stays a direct AuditRules.getMaturityGuidance(item,
// ...) call at each call site — every caller already has `item` in scope,
// so wrapping it in a closure here added indirection with no encapsulation
// value. See docs/adr and CONTEXT.md for the Maturity Assessment / Maturity
// Scale vocabulary.
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
    return { assignedScales, results };
  }

  return { resolveItemMaturity };
});
