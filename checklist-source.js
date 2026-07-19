(function(root, factory){
  root.ChecklistSource = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  function displayName(filename){
    return String(filename || '').split('/').pop().replace(/\.(xlsx|xls)$/i, '').replace(/[_-]+/g, ' ').trim() || '이름 없는 점검표';
  }

  function normalize(item){
    if(!item || item.type !== 'file' || !/\.(xlsx|xls)$/i.test(item.name || '') || String(item.name || '').startsWith('~$')) return null;
    const filename = String(item.name || '').trim();
    const path = String(item.download_url || '').trim();
    if(!filename || !path) return null;
    const sha = String(item.sha || '').trim();
    return { filename, path, name:displayName(filename), sha, updatedAt:'', fingerprint:sha || filename, enabled:true };
  }

  function extractRows(rows){
    if(!Array.isArray(rows)) return [];
    return rows.slice(1).map(row => {
      const [section, ref, question, refStd, externalRef, conformityCriteria, establishedCriteria, matureCriteria, leadingCriteria, type] = row || [];
      if(!question) return null;
      return {
        section: section || '일반', ref, question, refStd, externalRef,
        conformityCriteria, establishedCriteria, matureCriteria, leadingCriteria,
        type: type || 'YES/NO/OBS/N/A'
      };
    }).filter(Boolean);
  }

  async function loadGitHubIndex({owner, repo, branch, folderPath}){
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${folderPath}?ref=${encodeURIComponent(branch)}&ts=${Date.now()}`;
    const response = await fetch(url, {cache:'no-store', headers:{Accept:'application/vnd.github+json'}});
    if(!response.ok) throw new Error(`GitHub Contents API HTTP ${response.status}`);
    const data = await response.json();
    return (Array.isArray(data) ? data : []).map(normalize).filter(Boolean).sort((a, b) => a.filename.localeCompare(b.filename, 'ko'));
  }

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
      createdBy: row.created_by || '',
      updatedBy: row.updated_by || '',
      updatedAt
    };
  }

  async function loadSupabaseTemplates(client){
    const rows = await client.selectAll('templates');
    return (Array.isArray(rows) ? rows : []).map(normalizeSupabaseTemplate).filter(Boolean);
  }

  // wayfinder #11 — registration write path. Both functions stamp who made the
  // change (created_by only on insert, updated_by on both) and hand the saved
  // row straight back through normalizeSupabaseTemplate so callers get the
  // exact same shape as the read path (loadSupabaseTemplates).
  function toSupabaseRow({name, filename, sections, items, maturityScale}){
    return {
      name: String(name || '이름 없는 점검표').trim(),
      filename: filename || null,
      sections: Array.isArray(sections) ? sections : [],
      items: Array.isArray(items) ? items : [],
      maturity_scale: maturityScale || null
    };
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

  return { displayName, extractRows, loadGitHubIndex, loadSupabaseTemplates, registerSupabaseTemplate, updateSupabaseTemplate };
});
