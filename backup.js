const BACKUP_FORMAT = 'audit-app-backup';
const BACKUP_VERSION = 1;

async function exportLocalBackup(){
  const [audits, templates] = await Promise.all([dbAll('audits'), dbAll('templates')]);
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    audits,
    templates
  };
  const blob = new Blob([JSON.stringify(backup)], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-app-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`백업 완료: 심사 ${audits.length}건, 점검표 ${templates.length}건`);
}

function selectLocalBackup(){
  document.getElementById('file-backup')?.click();
}

function isValidBackup(backup){
  return backup && backup.format === BACKUP_FORMAT && backup.version === BACKUP_VERSION &&
    Array.isArray(backup.audits) && Array.isArray(backup.templates) &&
    backup.audits.every(audit => audit && typeof audit === 'object' && Array.isArray(audit.items)) &&
    backup.templates.every(template => template && typeof template === 'object' && Array.isArray(template.items));
}

function restoreLocalBackup(backup){
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['audits', 'templates'], 'readwrite');
    const audits = tx.objectStore('audits');
    const templates = tx.objectStore('templates');
    audits.clear();
    templates.clear();
    backup.templates.forEach(template => templates.put(template));
    backup.audits.forEach(audit => audits.put(audit));
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('저장소에 백업 데이터를 기록할 수 없습니다.'));
  });
}

function handleLocalBackupFile(file){
  if(!file) return;
  const input = document.getElementById('file-backup');
  if(input) input.value = '';
  const reader = new FileReader();
  reader.onload = async e => {
    try{
      const backup = JSON.parse(String(e.target.result || ''));
      if(!isValidBackup(backup)) throw new Error('지원하지 않는 백업 파일입니다.');
      const first = confirm(`백업 파일에는 심사 ${backup.audits.length}건, 점검표 ${backup.templates.length}건이 있습니다. 현재 기기 데이터를 모두 교체하시겠습니까?`);
      if(!first) return;
      const second = confirm('현재 기기의 심사 기록, 사진, 점검표가 모두 삭제되고 백업 파일로 교체됩니다. 계속하시겠습니까?');
      if(!second) return;
      clearPendingNoteWrites();
      await Promise.all([...auditWriteQueues.values()]);
      await restoreLocalBackup(backup);
      currentAudit = null;
      pendingPhotos = [];
      showToast('백업 데이터를 복원했습니다');
      switchTab('home');
    } catch(err){
      appError('백업 복원 실패:', err);
      showToast(err.message || '백업 파일을 복원할 수 없습니다');
    }
  };
  reader.readAsText(file, 'utf-8');
}


async function resetAuditData(){
  if(!getRegistrantSession()?.user){ showToast('로그인 후 초기화할 수 있습니다'); return; }
  const ok = confirm('이 기기에 저장된 모든 심사 기록과 사진을 삭제합니다. 점검표는 유지됩니다. 계속하시겠습니까?');
  if(!ok) return;
  await dbClear('audits');
  currentAudit = null;
  showToast('심사 기록이 삭제되었습니다');
  switchTab('home');
}

async function resetTemplateData(){
  if(!getRegistrantSession()?.user){ showToast('로그인 후 초기화할 수 있습니다'); return; }
  const ok = confirm('이 기기에 저장된 모든 점검표를 삭제합니다. 기존 심사 기록은 유지됩니다. 계속하시겠습니까?');
  if(!ok) return;
  await dbClear('templates');
  showToast('점검표가 삭제되었습니다');
  if(await updateOnlineTag()){
    try{
      await autoLoadChecklists();
      showToast('공식 점검표를 다시 동기화했습니다');
    } catch(err){
      appWarn('점검표 재동기화 실패:', err);
      showToast('점검표 삭제 완료. 재동기화는 나중에 실행하세요');
    }
  }
  switchTab('templates');
}

async function resetAllLocalData(){
  if(!getRegistrantSession()?.user){ showToast('로그인 후 초기화할 수 있습니다'); return; }
  const first = confirm('이 기기의 모든 심사 기록, 사진, 점검표를 삭제합니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?');
  if(!first) return;
  const second = confirm('정말 전체 로컬 데이터를 삭제하시겠습니까?');
  if(!second) return;
  await Promise.all([dbClear('audits'), dbClear('templates')]);
  currentAudit = null;
  pendingPhotos = [];
  showToast('전체 로컬 데이터가 삭제되었습니다');
  if(await updateOnlineTag()){
    try{
      await autoLoadChecklists();
    } catch(err){
      appWarn('전체 초기화 후 점검표 재동기화 실패:', err);
    }
  }
  switchTab('home');
}
