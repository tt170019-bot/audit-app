// ═══════════════════════════════════════════════
//  wayfinder #10/#11 — 등록 검토 마법사 (2단계: 척도 정의 → 항목 검토)
//  prototype/review-modal variant B의 마크업/동작을 실제 데이터에 연동.
//  확인 시 Supabase에 실제로 등록/수정한다 (#11).
// ═══════════════════════════════════════════════
let reviewWizard = null;

function genScaleId(){
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function openReviewWizard({mode, templateId, name, filename, sections, items, scales, revisionNo, revisionDate, division}){
  reviewWizard = {
    mode, templateId,
    name, filename,
    sections: sections || [],
    items: items.map((it, i) => {
      const assignment = AuditRules.deriveItemMaturityAssignment(it);
      return {...it, _idx:i, _scaleIds: [...assignment.scaleIds], _guidance: JSON.parse(JSON.stringify(assignment.guidance))};
    }),
    // Scale library for this template — 0, 1, or many scales, each with its
    // own name + freely-sized label list. Items pick any subset (see
    // _scaleIds above), each with its own per-item guidance text.
    scales: (scales && scales.length ? scales : []).map(s => ({id: s.id || genScaleId(), name: s.name || '', labels: Array.isArray(s.labels) ? [...s.labels] : []})),
    revisionNo: revisionNo ?? '',
    revisionDate: revisionDate || '',
    division: division || '',
    step: 1
  };
  renderReviewWizard();
  openModal('modal-review');
}

function closeReviewWizard(){
  reviewWizard = null;
  closeModal('modal-review');
}

function reviewRevisionEditor(){
  const w = reviewWizard;
  return `<div class="review-scale-box">
    <div class="review-label-row">
      <input type="number" step="1" required value="${esc(w.revisionNo)}" placeholder="개정번호 (예: 3)" oninput="reviewSetRevisionNo(this.value)">
      <input type="date" required value="${esc(w.revisionDate)}" oninput="reviewSetRevisionDate(this.value)">
    </div>
  </div>
  <div class="review-scale-box">
    <select required onchange="reviewSetDivision(this.value)">
      <option value="" ${w.division === '' ? 'selected' : ''}>— 소속부문을 선택하세요 —</option>
      ${AuditRules.DIVISIONS.map(d => `<option value="${esc(d)}" ${w.division === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}
    </select>
  </div>`;
}

function reviewScaleEditor(scale, si){
  return `<div class="review-scale-box">
    <div class="review-label-row">
      <input class="review-scale-name" value="${esc(scale.name)}" placeholder="척도 이름 (예: 안전 척도)" oninput="reviewSetScaleName(${si},this.value)">
      <button type="button" class="review-icon-btn" title="이 척도 삭제" onclick="reviewRemoveScale(${si})">✕</button>
    </div>
    ${scale.labels.map((l,i)=>`<div class="review-label-row">
      <input value="${esc(l)}" oninput="reviewSetLabel(${si},${i},this.value)">
      <button type="button" class="review-icon-btn" title="위로" ${i===0?'disabled':''} onclick="reviewMoveLabel(${si},${i},-1)">↑</button>
      <button type="button" class="review-icon-btn" title="아래로" ${i===scale.labels.length-1?'disabled':''} onclick="reviewMoveLabel(${si},${i},1)">↓</button>
      <button type="button" class="review-icon-btn" title="삭제" onclick="reviewRemoveLabel(${si},${i})">✕</button>
    </div>`).join('')}
    <button type="button" class="review-add-label" onclick="reviewAddLabel(${si})">+ 라벨 추가</button>
    <div class="review-preview">
      ${scale.labels.map(l=>`<div class="maturity-card"><div class="maturity-card-head"><span class="maturity-radio" aria-hidden="true"></span><div class="maturity-card-title">${esc(l)}</div></div></div>`).join('')}
    </div>
  </div>`;
}

function reviewItemRow(item, scales){
  const scaleIds = item._scaleIds;
  return `<div class="review-item-row-block">
    <div class="review-item-row">
      <div class="review-item-main">
        <div class="review-item-tag">${esc(item.section)} · ${esc(item.ref || '')}</div>
        <div class="review-item-q">${esc(item.question)}</div>
      </div>
    </div>
    ${scales.length ? `<div class="review-item-scale-picker">
      ${scales.map(s => `<label class="review-scale-check">
        <input type="checkbox" ${scaleIds.includes(s.id) ? 'checked' : ''} onchange="reviewToggleItemScale(${item._idx},'${s.id}')"> ${esc(s.name || '(이름 없음)')}
      </label>`).join('')}
    </div>` : ''}
    ${scaleIds.map(sid => {
      const scale = scales.find(s => s.id === sid);
      if(!scale) return '';
      const guidance = item._guidance[sid] || [];
      return `<div class="review-item-guidance">
        <div class="review-item-guidance-title">${esc(scale.name || '(이름 없음)')} 안내문구</div>
        ${scale.labels.map((label,li)=>`<div class="review-label-row">
          <span class="review-guidance-level">${esc(label)}</span>
          <input value="${esc(guidance[li] || '')}" placeholder="안내문구 (비우면 기본 문구)" oninput="reviewSetItemGuidance(${item._idx},'${sid}',${li},this.value)">
        </div>`).join('')}
      </div>`;
    }).join('')}
  </div>`;
}

function renderReviewWizard(){
  const w = reviewWizard;
  if(!w) return;
  const step1 = w.step === 1;
  const onCount = w.items.filter(i => i._scaleIds.length > 0).length;
  const scaleSummary = w.scales.length
    ? w.scales.map(s => `${esc(s.name || '(이름 없음)')}(${s.labels.length}단계)`).join(', ')
    : '없음 (성숙도 평가 미사용)';

  document.getElementById('modal-review-title').textContent = w.mode === 'edit' ? `점검표 수정 — ${w.name}` : '점검표 등록 검토';

  document.getElementById('review-body').innerHTML = `
    <div class="review-steps">
      <div class="review-step ${step1?'active':''}">1. 척도 정의</div>
      <div class="review-step ${!step1?'active':''}">2. 항목 검토</div>
    </div>
    ${step1 ? `
      ${w.mode === 'edit' ? `
      <div class="review-sub">개정번호와 개정일자를 입력하세요.</div>
      ${reviewRevisionEditor()}
      ` : ''}
      <div class="review-sub">이 점검표에서 쓸 성숙도 척도를 0개, 1개, 또는 여러 개 만드세요. 척도마다 이름과 단계 수를 자유롭게 정할 수 있고, 다음 단계에서 항목마다 어떤 척도를 쓸지 고릅니다.</div>
      ${w.scales.map((s,i)=>reviewScaleEditor(s,i)).join('')}
      <button type="button" class="review-add-label" onclick="reviewAddScale()">+ 척도 추가</button>
    ` : `
      <div class="review-sub">척도: <b>${scaleSummary}</b> — <a href="#" onclick="event.preventDefault();reviewGotoStep(1)">수정</a></div>
      <div>${w.items.map(item => reviewItemRow(item, w.scales)).join('')}</div>
    `}
  `;

  document.getElementById('review-actions').innerHTML = step1
    ? `<button type="button" class="btn btn-ghost flex-1" onclick="closeReviewWizard()">취소</button>
       <button type="button" class="btn btn-teal flex-2" onclick="reviewGotoStep(2)">다음</button>`
    : `<button type="button" class="btn btn-ghost flex-1" onclick="reviewGotoStep(1)">이전</button>
       <button type="button" class="btn btn-teal flex-2" onclick="confirmReviewWizard()">확인 (${onCount}/${w.items.length}개 성숙도 배정됨)</button>`;
}

function reviewSetRevisionNo(v){ reviewWizard.revisionNo = v; }
function reviewSetRevisionDate(v){ reviewWizard.revisionDate = v; }
function reviewSetDivision(v){ reviewWizard.division = v; }
function reviewSetScaleName(si,v){ reviewWizard.scales[si].name = v; }
function reviewSetLabel(si,i,v){ reviewWizard.scales[si].labels[i] = v; }
function reviewAddLabel(si){ reviewWizard.scales[si].labels.push('새 라벨'); renderReviewWizard(); }
function reviewRemoveLabel(si,i){ reviewWizard.scales[si].labels.splice(i,1); renderReviewWizard(); }
function reviewMoveLabel(si,i,dir){
  const labels = reviewWizard.scales[si].labels;
  const j = i + dir;
  if(j < 0 || j >= labels.length) return;
  [labels[i], labels[j]] = [labels[j], labels[i]];
  renderReviewWizard();
}
function reviewAddScale(){
  reviewWizard.scales.push({id: genScaleId(), name: '', labels: ['새 라벨']});
  renderReviewWizard();
}
function reviewRemoveScale(si){
  const removedId = reviewWizard.scales[si].id;
  reviewWizard.scales.splice(si, 1);
  // Un-assign the removed scale from every item so nothing references a
  // dangling scale id.
  reviewWizard.items.forEach(item => {
    item._scaleIds = item._scaleIds.filter(id => id !== removedId);
    delete item._guidance[removedId];
  });
  renderReviewWizard();
}
function reviewToggleItemScale(idx, scaleId){
  const item = reviewWizard.items.find(i => i._idx === idx);
  if(item._scaleIds.includes(scaleId)){
    item._scaleIds = item._scaleIds.filter(id => id !== scaleId);
  } else {
    item._scaleIds.push(scaleId);
    if(!item._guidance[scaleId]) item._guidance[scaleId] = [];
  }
  renderReviewWizard();
}
function reviewSetItemGuidance(idx, scaleId, levelIndex, v){
  const item = reviewWizard.items.find(i => i._idx === idx);
  if(!item._guidance[scaleId]) item._guidance[scaleId] = [];
  item._guidance[scaleId][levelIndex] = v;
}
function reviewGotoStep(n){
  if(n === 2){
    if(reviewWizard.mode === 'edit'){
      if(reviewWizard.revisionNo === '' || reviewWizard.revisionNo == null || !reviewWizard.revisionDate){
        showToast('개정번호와 개정일자를 입력하세요');
        return;
      }
      if(!reviewWizard.division){
        showToast('소속부문을 선택하세요');
        return;
      }
    }
    for(const scale of reviewWizard.scales){
      const check = AuditRules.validateMaturityScale(scale);
      if(!check.valid){ showToast(check.error); return; }
    }
  }
  reviewWizard.step = n;
  renderReviewWizard();
}

async function confirmReviewWizard(){
  const w = reviewWizard;
  const session = getRegistrantSession();
  if(!session?.user){ showToast('로그인이 필요합니다'); return; }

  for(const scale of w.scales){
    const check = AuditRules.validateMaturityScale(scale);
    if(!check.valid){ showToast(check.error); return; }
  }

  const payload = {
    name: w.name,
    filename: w.filename,
    sections: w.sections,
    items: w.items.map(({_idx, _scaleIds, _guidance, ...item}) => ({
      ...item,
      maturityScaleIds: _scaleIds,
      maturityGuidance: _guidance
    })),
    maturityScales: w.scales,
    revisionNo: w.revisionNo,
    revisionDate: w.revisionDate,
    division: w.division
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
    scales: AuditRules.deriveMaturityScales(tpl),
    revisionNo: tpl.revisionNo,
    revisionDate: tpl.revisionDate,
    division: tpl.division
  });
}

// ═══════════════════════════════════════════════
//  Checklist Template Revision history (ADR-0001/0002)
//  Read-only list of past snapshots + restore, which just reopens the same
//  edit wizard above prefilled with the old snapshot's content.
// ═══════════════════════════════════════════════
let templateHistory = null;

async function openTemplateHistory(localId){
  const tpl = await getNormalizedTemplate(localId);
  if(!tpl || tpl.source !== 'supabase'){ showToast('이력을 볼 수 없는 점검표입니다'); return; }

  templateHistory = { localId, templateId: tpl.supabaseId, name: tpl.name, revisions: null, viewingIndex: null };
  openModal('modal-history');
  renderTemplateHistory();

  try{
    const client = SupabaseClient.getClient();
    templateHistory.revisions = await ChecklistSource.loadTemplateRevisions(client, tpl.supabaseId);
  }catch(e){
    templateHistory.revisions = [];
    showToast('이력을 불러오지 못했습니다: ' + (e.message || ''));
  }
  renderTemplateHistory();
}

function closeTemplateHistory(){
  templateHistory = null;
  closeModal('modal-history');
}

function templateRevisionLabel(rev){
  const no = rev.revisionNo != null ? `개정 ${rev.revisionNo}` : '';
  const date = rev.revisionDate || '';
  const label = [no, date].filter(Boolean).join(' · ');
  if(label) return label;
  return rev.updatedAt ? `수정 ${new Date(rev.updatedAt).toLocaleString('ko-KR')}` : '시각 정보 없음';
}

function templateHistoryRow(rev, idx){
  return `<div class="review-item-row">
    <div class="review-item-main">
      <div class="review-item-tag">${esc(templateRevisionLabel(rev))}</div>
      <div class="review-item-q">${esc(rev.name)} · 항목 ${rev.items.length}개</div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" onclick="viewTemplateRevision(${idx})">보기</button>
  </div>`;
}

function renderTemplateHistory(){
  const h = templateHistory;
  if(!h) return;
  document.getElementById('modal-history-title').textContent = `점검표 개정 이력 — ${h.name}`;

  if(h.revisions === null){
    document.getElementById('history-body').innerHTML = `<div class="review-sub">이력을 불러오는 중입니다…</div>`;
    document.getElementById('history-actions').innerHTML = `<button type="button" class="btn btn-ghost flex-1" onclick="closeTemplateHistory()">닫기</button>`;
    return;
  }

  if(h.viewingIndex === null){
    document.getElementById('history-body').innerHTML = h.revisions.length
      ? h.revisions.map((rev, idx) => templateHistoryRow(rev, idx)).join('')
      : `<div class="review-sub">아직 수정 이력이 없습니다.</div>`;
    document.getElementById('history-actions').innerHTML = `<button type="button" class="btn btn-ghost flex-1" onclick="closeTemplateHistory()">닫기</button>`;
    return;
  }

  const rev = h.revisions[h.viewingIndex];
  document.getElementById('history-body').innerHTML = `
    <div class="review-sub">${esc(templateRevisionLabel(rev))} 시점의 내용 · 척도: <b>${esc(AuditRules.deriveMaturityScales(rev).map(s=>s.name).join(', ') || '없음')}</b></div>
    <div>${rev.items.map(item => `<div class="review-item-row">
      <div class="review-item-main">
        <div class="review-item-tag">${esc(item.section)} · ${esc(item.ref || '')}</div>
        <div class="review-item-q">${esc(item.question)}</div>
      </div>
    </div>`).join('')}</div>
  `;
  document.getElementById('history-actions').innerHTML = `
    <button type="button" class="btn btn-ghost flex-1" onclick="viewTemplateRevision(null)">목록으로</button>
    <button type="button" class="btn btn-teal flex-2" onclick="restoreTemplateRevision(${h.viewingIndex})">이 버전으로 복원</button>
  `;
}

function viewTemplateRevision(idx){
  templateHistory.viewingIndex = idx;
  renderTemplateHistory();
}

function restoreTemplateRevision(idx){
  const h = templateHistory;
  const rev = h.revisions[idx];
  const templateId = h.templateId;
  closeTemplateHistory();
  openReviewWizard({
    mode: 'edit',
    templateId,
    name: rev.name,
    filename: rev.filename,
    sections: rev.sections,
    items: rev.items,
    scales: AuditRules.deriveMaturityScales(rev),
    revisionNo: rev.revisionNo,
    revisionDate: rev.revisionDate,
    division: rev.division
  });
  showToast('복원할 내용을 검토 후 저장하세요');
}
