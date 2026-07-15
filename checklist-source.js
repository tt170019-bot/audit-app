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

  return { displayName, extractRows, loadGitHubIndex };
});
