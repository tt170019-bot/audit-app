// ═══════════════════════════════════════════════
//  wayfinder #10/#11 — 등록 검토 마법사 (2단계: 척도 정의 → 항목 검토)
//  prototype/review-modal variant B의 마크업/동작을 실제 데이터에 연동.
//  확인 시 Supabase에 실제로 등록/수정한다 (#11).
// ═══════════════════════════════════════════════
let reviewWizard = null;

function openReviewWizard({mode, templateId, name, filename, sections, items, scaleName, labels}){
  reviewWizard = {
    mode, templateId,
    name, filename,
    sections: sections || [],
    items: items.map((it, i) => ({...it, _idx:i, maturityOn: it.maturityOn ?? AuditRules.suggestMaturityOn(it), _suggested: AuditRules.suggestMaturityOn(it)})),
    scaleName: scaleName || '성숙도 등급',
    labels: labels && labels.length ? [...labels] : ['Conformity','Established','Mature','Leading'],
    step: 1
  };
  renderReviewWizard();
  openModal('modal-review');
}

function closeReviewWizard(){
  reviewWizard = null;
  closeModal('modal-review');
}

function reviewScaleEditor(){
  const w = reviewWizard;
  return `<div class="review-scale-box">
    <input class="review-scale-name" value="${esc(w.scaleName)}" placeholder="척도 이름 (예: 성숙도 등급)" oninput="reviewSetScaleName(this.value)">
    ${w.labels.map((l,i)=>`<div class="review-label-row">
      <input value="${esc(l)}" oninput="reviewSetLabel(${i},this.value)">
      <button type="button" class="review-icon-btn" title="위로" ${i===0?'disabled':''} onclick="reviewMoveLabel(${i},-1)">↑</button>
      <button type="button" class="review-icon-btn" title="아래로" ${i===w.labels.length-1?'disabled':''} onclick="reviewMoveLabel(${i},1)">↓</button>
      <button type="button" class="review-icon-btn" title="삭제" onclick="reviewRemoveLabel(${i})">✕</button>
    </div>`).join('')}
    <button type="button" class="review-add-label" onclick="reviewAddLabel()">+ 라벨 추가</button>
    <div class="review-preview">
      ${w.labels.map(l=>`<div class="maturity-card"><div class="maturity-card-head"><span class="maturity-radio" aria-hidden="true"></span><div class="maturity-card-title">${esc(l)}</div></div></div>`).join('')}
    </div>
  </div>`;
}

function reviewItemRow(item){
  return `<div class="review-item-row">
    <div class="review-item-main">
      <div class="review-item-tag">${esc(item.section)} · ${esc(item.ref || '')}</div>
      <div class="review-item-q">${esc(item.question)}</div>
      ${item._suggested ? `<div class="review-item-hint">criteria 텍스트 있음 → 기본 제안 ON</div>` : ''}
    </div>
    <button type="button" class="review-toggle ${item.maturityOn?'on':''}" role="switch" aria-checked="${item.maturityOn}" onclick="reviewToggleItem(${item._idx})"></button>
  </div>`;
}

function renderReviewWizard(){
  const w = reviewWizard;
  if(!w) return;
  const step1 = w.step === 1;
  const onCount = w.items.filter(i=>i.maturityOn).length;

  document.getElementById('modal-review-title').textContent = w.mode === 'edit' ? `점검표 수정 — ${w.name}` : '점검표 등록 검토';

  document.getElementById('review-body').innerHTML = `
    <div class="review-steps">
      <div class="review-step ${step1?'active':''}">1. 척도 정의</div>
      <div class="review-step ${!step1?'active':''}">2. 항목 검토</div>
    </div>
    ${step1 ? `
      <div class="review-sub">이 템플릿의 모든 성숙도 항목이 공유할 척도를 정의하세요. 라벨은 자유롭게 추가/삭제/순서변경할 수 있습니다.</div>
      ${reviewScaleEditor()}
    ` : `
      <div class="review-sub">척도: <b>${esc(w.scaleName)}</b> (${w.labels.length}단계) — <a href="#" onclick="event.preventDefault();reviewGotoStep(1)">수정</a></div>
      <div>${w.items.map(reviewItemRow).join('')}</div>
    `}
  `;

  document.getElementById('review-actions').innerHTML = step1
    ? `<button type="button" class="btn btn-ghost flex-1" onclick="closeReviewWizard()">취소</button>
       <button type="button" class="btn btn-teal flex-2" onclick="reviewGotoStep(2)">다음</button>`
    : `<button type="button" class="btn btn-ghost flex-1" onclick="reviewGotoStep(1)">이전</button>
       <button type="button" class="btn btn-teal flex-2" onclick="confirmReviewWizard()">확인 (${onCount}/${w.items.length}개 성숙도 ON)</button>`;
}

function reviewSetScaleName(v){ reviewWizard.scaleName = v; }
function reviewSetLabel(i,v){ reviewWizard.labels[i] = v; }
function reviewAddLabel(){ reviewWizard.labels.push('새 라벨'); renderReviewWizard(); }
function reviewRemoveLabel(i){ reviewWizard.labels.splice(i,1); renderReviewWizard(); }
function reviewMoveLabel(i,dir){
  const labels = reviewWizard.labels;
  const j = i + dir;
  if(j < 0 || j >= labels.length) return;
  [labels[i], labels[j]] = [labels[j], labels[i]];
  renderReviewWizard();
}
function reviewToggleItem(idx){
  const item = reviewWizard.items.find(i=>i._idx===idx);
  item.maturityOn = !item.maturityOn;
  renderReviewWizard();
}
function reviewGotoStep(n){
  if(n === 2){
    const check = AuditRules.validateMaturityScale({name:reviewWizard.scaleName, labels:reviewWizard.labels});
    if(!check.valid){ showToast(check.error); return; }
  }
  reviewWizard.step = n;
  renderReviewWizard();
}

async function confirmReviewWizard(){
  const w = reviewWizard;
  const session = getRegistrantSession();
  if(!session?.user){ showToast('로그인이 필요합니다'); return; }

  const check = AuditRules.validateMaturityScale({name:w.scaleName, labels:w.labels});
  if(!check.valid){ showToast(check.error); return; }

  const payload = {
    name: w.name,
    filename: w.filename,
    sections: w.sections,
    items: w.items.map(({_idx, _suggested, ...item}) => item),
    maturityScale: {name: w.scaleName, labels: w.labels}
  };

  try{
    const client = SupabaseClient.getClient();
    const saved = w.mode === 'edit'
      ? await ChecklistSource.updateSupabaseTemplate(client, session.accessToken, session.user.id, w.templateId, payload)
      : await ChecklistSource.registerSupabaseTemplate(client, session.accessToken, session.user.id, payload);

    const existing = await dbAll('templates');
    const localMatch = existing.find(t => t.source === 'supabase' && t.supabaseId === saved.supabaseId);
    await dbPut('templates', {
      ...saved,
      reportTemplate: inferReportTemplateType(saved),
      active: true,
      importedAt: new Date().toISOString(),
      ...(localMatch ? {id: localMatch.id} : {})
    });

    closeReviewWizard();
    showToast(w.mode === 'edit' ? '점검표가 수정되었습니다' : '점검표가 등록되었습니다');
    switchTab('templates');
  }catch(e){
    showToast('저장에 실패했습니다: ' + (e.message || ''));
  }
}

async function openReviewWizardForEdit(localId){
  const tpl = await getNormalizedTemplate(localId);
  if(!tpl || tpl.source !== 'supabase'){ showToast('수정할 수 없는 점검표입니다'); return; }
  openReviewWizard({
    mode: 'edit',
    templateId: tpl.supabaseId,
    name: tpl.name,
    filename: tpl.filename,
    sections: tpl.sections,
    items: tpl.items,
    scaleName: tpl.maturityScale?.name || '성숙도 등급',
    labels: tpl.maturityScale?.labels || [...AuditRules.MATURITY_LEVELS]
  });
}
