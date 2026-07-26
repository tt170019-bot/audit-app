// ═══════════════════════════════════════════════
//  Photo
// ═══════════════════════════════════════════════
function openPhotoModal(auditId, itemIdx){
  currentPhotoTarget = {auditId, itemIdx};
  pendingPhotos = [...(currentAudit?.items[itemIdx]?.photos||[])];
  renderPhotoPreview();
  openModal('modal-photo');
}

function renderPhotoPreview(){
  const area = document.getElementById('photo-preview-area');
  if(!area) return;
  area.innerHTML = pendingPhotos.map((p,i)=>`
    <div class="photo-frame">
      <img class="photo-thumb" src="${p}" alt="사진">
      <button type="button" onclick="pendingPhotos.splice(${i},1);renderPhotoPreview()" class="photo-remove" aria-label="첨부 사진 ${i + 1} 삭제">✕</button>
    </div>`).join('');
}

function takePhoto(){
  document.getElementById('file-camera').click();
  document.getElementById('file-camera').onchange = e=>{
    handleImageFile(e.target.files[0]);
    e.target.value='';
  };
}
function pickPhoto(){
  document.getElementById('file-gallery').click();
  document.getElementById('file-gallery').onchange = e=>{
    handleImageFile(e.target.files[0]);
    e.target.value='';
  };
}
function handleImageFile(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload=e=>{
    // Resize to max 800px for storage
    const img = new Image();
    img.onload=()=>{
      const MAX=800;
      let w=img.width, h=img.height;
      if(w>MAX||h>MAX){ const r=MAX/Math.max(w,h); w=Math.round(w*r); h=Math.round(h*r); }
      const canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      pendingPhotos.push(canvas.toDataURL('image/jpeg',0.75));
      renderPhotoPreview();
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

async function savePhoto(){
  if(!currentPhotoTarget) return;
  const {auditId, itemIdx} = currentPhotoTarget;
  const audit = await dbGet('audits', auditId);
  if(!audit) return;
  if(audit.status === AUDIT_STATUS.DONE){ showToast('완료된 심사는 다시 열어야 수정할 수 있습니다'); return; }
  audit.items[itemIdx].photos = [...pendingPhotos];
  currentAudit = audit;
  await dbPut('audits', audit);
  // Refresh photos in UI
  const area = document.getElementById('photos-'+itemIdx);
  if(area){
    area.innerHTML = pendingPhotos.map(p=>`<img class="photo-thumb photo-thumb-clickable" src="${p}" onclick="viewPhoto('${p}')" alt="사진">`).join('')+
      `<div class="photo-add" onclick="openPhotoModal(${auditId},${itemIdx})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="13" r="4"/><path d="M5 7H3a2 2 0 00-2 2v9a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2h-2l-2-3H9L7 7z"/></svg>
        <span>추가</span>
      </div>`;
  }
  closeModal('modal-photo');
  showToast(`사진 ${pendingPhotos.length}장 저장됨`);
}

function viewPhoto(src){
  const d=document.createElement('div');
  d.className = 'viewer';
  d.innerHTML=`<img src="${src}" alt="첨부 사진 확대"><button type="button" class="viewer-close" onclick="this.parentNode.remove()" aria-label="닫기">✕</button>`;
  document.body.appendChild(d);
}
