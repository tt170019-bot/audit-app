(function(root, factory){
  root.ChecklistSource = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  // wayfinder #8 — Supabase rows already carry parsed items (plus the
  // per-item maturityOn flag and template-level custom scale from #7),
  // so this is a straight normalize, no xlsx parsing step.
  function normalizeSupabaseTemplate(row){
    if(!row || row.id == null || !Array.isArray(row.items) || row.items.length === 0) return null;
    const updatedAt = String(row.updated_at || row.created_at || '').trim();
    return {
      name: String(row.name || '이름 없는 점검표').trim(),
      filename: String(row.filename || '').trim(),
      source: 'supabase',
      supabaseId: row.id,
      templateKey: `supabase:${row.id}@@${updatedAt || 'unversioned'}`,
      sections: Array.isArray(row.sections) && row.sections.length ? row.sections : [...new Set(row.items.map(i => i?.section || '일반'))],
      items: row.items,
      maturityScale: row.maturity_scale || null,
      maturityScales: Array.isArray(row.maturity_scales) ? row.maturity_scales : null,
      revisionNo: row.revision_no ?? null,
      revisionDate: row.revision_date || '',
      division: row.division || '',
      templateNo: row.template_no || '',
      createdBy: row.created_by || '',
      updatedBy: row.updated_by || '',
      updatedAt
    };
  }

  async function loadSupabaseTemplates(client){
    const rows = await client.selectAll('templates');
    return (Array.isArray(rows) ? rows : []).map(normalizeSupabaseTemplate).filter(Boolean);
  }

  // The one seam between the wizard's payload shape (review-wizard.js
  // confirmReviewWizard) and the Supabase row shape. This map is the only
  // place the field list exists — the unknown-key check and the row build
  // both read from it, so there's no second list (a destructure, a values
  // object) that can drift out of sync with the first.
  const TEMPLATE_ROW_MAP = [
    ['name', 'name', v => String(v || '이름 없는 점검표').trim()],
    ['filename', 'filename', v => v || null],
    ['sections', 'sections', v => Array.isArray(v) ? v : []],
    ['items', 'items', v => Array.isArray(v) ? v : []],
    // Always an array (possibly empty) once written through this path —
    // that presence is what tells deriveMaturityScales to stop falling
    // back to a stale legacy maturity_scale column.
    ['maturityScales', 'maturity_scales', v => Array.isArray(v) ? v : []],
    ['revisionNo', 'revision_no', v => v === '' || v == null ? null : parseInt(v, 10)],
    ['revisionDate', 'revision_date', v => v || null],
    ['division', 'division', v => v || null],
    ['templateNo', 'template_no', v => v || null]
  ];

  // wayfinder #11 — registration write path. Both functions stamp who made the
  // change (created_by only on insert, updated_by on both) and hand the saved
  // row straight back through normalizeSupabaseTemplate so callers get the
  // exact same shape as the read path (loadSupabaseTemplates).
  function toSupabaseRow(payload){
    const known = new Set(TEMPLATE_ROW_MAP.map(([payloadKey]) => payloadKey));
    const unknown = Object.keys(payload || {}).filter(k => !known.has(k));
    if(unknown.length) throw new Error(`toSupabaseRow: unknown field(s) [${unknown.join(', ')}] — payload shape drifted from TEMPLATE_ROW_MAP`);
    const row = {};
    for(const [payloadKey, rowKey, toRowValue] of TEMPLATE_ROW_MAP){
      row[rowKey] = toRowValue(payload[payloadKey]);
    }
    return row;
  }

  async function registerSupabaseTemplate(client, accessToken, userId, payload){
    const row = { ...toSupabaseRow(payload), created_by: userId, updated_by: userId };
    const saved = await client.insert('templates', row, accessToken);
    return normalizeSupabaseTemplate(saved);
  }

  async function updateSupabaseTemplate(client, accessToken, userId, id, payload){
    const row = { ...toSupabaseRow(payload), updated_by: userId, updated_at: new Date().toISOString() };
    const saved = await client.update('templates', id, row, accessToken);
    return normalizeSupabaseTemplate(saved);
  }

  // Any logged-in Registrant may delete any template — same as edit, there is
  // no per-owner ownership check, only "is this an authenticated Registrant".
  async function deleteSupabaseTemplate(client, accessToken, id){
    await client.remove('templates', id, accessToken);
  }

  // Checklist Template Revisions — snapshots the DB trigger captured just
  // before each edit (see ADR-0002). Read-only: there is no write path here
  // because the only writer is the trigger itself.
  function normalizeTemplateRevision(row){
    return {
      id: row.id,
      templateId: row.template_id,
      name: String(row.name || '이름 없는 점검표').trim(),
      filename: String(row.filename || '').trim(),
      sections: Array.isArray(row.sections) ? row.sections : [],
      items: Array.isArray(row.items) ? row.items : [],
      maturityScale: row.maturity_scale || null,
      maturityScales: Array.isArray(row.maturity_scales) ? row.maturity_scales : null,
      revisionNo: row.revision_no ?? null,
      revisionDate: row.revision_date || '',
      division: row.division || '',
      templateNo: row.template_no || '',
      updatedBy: row.updated_by || '',
      updatedAt: String(row.updated_at || '').trim(),
      createdAt: String(row.created_at || '').trim()
    };
  }

  async function loadTemplateRevisions(client, templateId){
    const rows = await client.selectAll('template_revisions', `template_id=eq.${encodeURIComponent(templateId)}&order=created_at.desc`);
    return (Array.isArray(rows) ? rows : []).map(normalizeTemplateRevision);
  }

  return { loadSupabaseTemplates, registerSupabaseTemplate, updateSupabaseTemplate, deleteSupabaseTemplate, loadTemplateRevisions };
});
