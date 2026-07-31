// ═══════════════════════════════════════════════
//  Checklist view (심사 진행)
// ═══════════════════════════════════════════════
async function openAudit(id){
  currentAudit = await dbGet('audits', id);
  if(!currentAudit) return;
  checklistFilter = 'all';
  document.getElementById('content').classList.remove('web-content');

  setHidden('topbar', true);
  setHidden('tabbar', true);
  setHidden('topbar-action', true);

  renderChecklist(currentAudit);
}

function syncDetailStickyOffset(){
  const shell = document.querySelector('.detail-shell');
  const top = document.querySelector('.detail-top');
  if(!shell || !top) return;
  shell.style.setProperty('--detail-sticky-offset', `${Math.ceil(top.getBoundingClientRect().height)}px`);
}

window.addEventListener('resize', () => {
  if(currentAudit) syncDetailStickyOffset();
});

function getChecklistScrollContainer(){
  // Return the element that actually owns vertical scrolling.
  // Tablet split view uses .detail-content for layout, but #content or the
  // document can be the real scroll container depending on viewport/browser.
  const candidates = [
    document.querySelector('.detail-content'),
    byId('content'),
    document.scrollingElement,
    document.documentElement
  ].filter(Boolean);

  return candidates.find(el => el.scrollHeight > el.clientHeight + 1)
    || byId('content')
    || document.scrollingElement
    || document.documentElement;
}

function getElementTopInScroller(el, scroller){
  const scrollerRect = scroller.getBoundingClientRect
    ? scroller.getBoundingClientRect()
    : { top: 0 };
  const elRect = el.getBoundingClientRect();
  return scroller.scrollTop + elRect.top - scrollerRect.top;
}

function getSectionAlignmentOffset(scroller){
  // Use the first section's natural top position as the alignment baseline.
  // This keeps click-jump placement identical to the first section's initial placement
  // without hard-coding sticky header or progress-bar heights.
  const firstSection = document.querySelector('.detail-section-start');
  if(!scroller || !firstSection) return 0;
  return getElementTopInScroller(firstSection, scroller);
}

function scrollToAlignedTarget(target, options = {}){
  syncDetailStickyOffset();
  const scroller = getChecklistScrollContainer();
  if(!scroller || !target) return;

  const alignmentOffset = getSectionAlignmentOffset(scroller);
  const targetTop = getElementTopInScroller(target, scroller);
  const destination = targetTop - alignmentOffset + (options.offset || 0);

  scroller.scrollTo({
    top: Math.max(0, destination),
    behavior: options.behavior || 'smooth'
  });
}

function scrollToChecklistSection(sectionId){
  const target = document.getElementById(sectionId);
  const index = Number(String(sectionId).replace('sec-', ''));

  if(Number.isFinite(index)) setCurrentSectionChip(index, true);
  scrollToAlignedTarget(target);
}

function getSectionIndexForItemIndex(itemIndex){
  const item = currentAudit?.items?.[itemIndex];
  if(!item) return -1;

  const sectionNames = [];
  (currentAudit.items || []).forEach(checkItem => {
    const sectionName = checkItem.section || '일반';
    if(!sectionNames.includes(sectionName)) sectionNames.push(sectionName);
  });

  return sectionNames.indexOf(item.section || '일반');
}

function scrollToChecklistItem(itemIndex){
  const el = document.getElementById('ci-' + itemIndex);
  if(!el) return;

  const body = document.getElementById('cb-' + itemIndex);
  if(body) body.classList.remove('hidden');

  const sectionIndex = getSectionIndexForItemIndex(itemIndex);
  if(sectionIndex >= 0) setCurrentSectionChip(sectionIndex, true);

  // Align incomplete-item jumps with section navigation instead of centering the card.
  // Add a 3px destination correction so the card border does not sit on the sticky boundary.
  scrollToAlignedTarget(el, { offset: 3 });
}

function br(value){
  return esc(value || '').split(String.fromCharCode(10)).join('<br>');
}

function normalizeResultValue(value){
  return AuditRules.normalizeResultValue(value);
}

function resultClass(result){
  const r = normalizeResultValue(result);
  return r === 'YES' ? 'badge-ok' : r === 'NO' ? 'badge-ng' : r === 'OBS' ? 'badge-obs' : r === 'N/A' ? 'badge-na' : 'badge-na';
}

function resultCssClass(result){
  const r = normalizeResultValue(result);
  if(r === 'YES') return 'yes';
  if(r === 'NO') return 'no';
  if(r === 'OBS') return 'obs';
  if(r === 'N/A') return 'na';
  return 'na';
}

function resultLabel(result){
  const r = normalizeResultValue(result);
  return r || '미완료';
}

function renderRequirementTable(audit, item){
  const idx = item._idx;
  const ref = br(item.ref || '—');
  const question = br(item.question || '');
  const internalRef = br(item.refStd || '');
  const externalRef = br(item.externalRef || item.external || '');
  const itemNumber = String(idx + 1).padStart(2, '0');

  return `<div class="check-input-card field-card-toggle" tabindex="0" aria-label="점검항목">
    <div class="check-input-top">
      <span class="check-input-no">${itemNumber}</span>
      <div class="check-input-content">
        <div class="check-input-section">${ref}</div>
        <div class="check-input-question">${question}</div>
      </div>
    </div>
    ${(internalRef || externalRef) ? `<details class="check-input-reference">
      <summary class="check-reference-toggle">Reference</summary>
      <div class="check-input-refs">
        ${internalRef ? `<div class="check-ref-line"><span class="check-ref-label">Internal Ref.</span><span>${internalRef}</span></div>` : ''}
        ${externalRef ? `<div class="check-ref-line"><span class="check-ref-label">External Ref.</span><span>${externalRef}</span></div>` : ''}
      </div>
    </details>` : ''}
  </div>`;
}

function renderResultPanel(audit, item){
  const idx = item._idx;
  const result = normalizeResultValue(item.result || '');
  const options = [
    ['YES', 'YES', 'selected-ok'],
    ['NO', 'NO', 'selected-ng'],
    ['OBS', 'OBS', 'selected-obs'],
    ['N/A', 'N/A', 'selected-na']
  ];

  return `<div class="result-panel">
    <div class="result-panel-title">Result</div>
    <div class="field-result-row">
      ${options.map(([value,label,cls])=>`<button type="button" class="field-choice ${result===value ? cls : ''}" onclick="setResult(${audit.id},${idx},'${value}', event)" ${audit.status===AUDIT_STATUS.DONE ? 'disabled' : ''}>${label}</button>`).join('')}
    </div>
  </div>`;
}

// An item can be assigned to 0, 1, or many of the template's maturity
// scales (see the 2026-07-26 grilling session) — this renders one
// independent panel per assigned scale, each with its own level selection.
function renderMaturityPanels(audit, item){
  const idx = item._idx;
  const allScales = AuditRules.deriveMaturityScales(audit);
  const { assignedScales, results } = MaturityResolution.resolveItemMaturity(item, allScales);
  if(!assignedScales.length) return '';

  return assignedScales.map(scale => {
    const currentLevel = results[scale.id] || '';
    return `<div class="maturity-panel">
      <div class="maturity-panel-title">Maturity Assessment${scale.name ? ` — ${esc(scale.name)}` : ''}</div>
      <div class="maturity-level-list" role="radiogroup" aria-label="Maturity Assessment ${esc(scale.name)}">
        ${scale.labels.map((level, levelIndex)=>{
          const c = AuditRules.getMaturityGuidance(item, scale.id, levelIndex, level);
          const selected = currentLevel === level;
          return `<div class="maturity-card ${selected ? 'selected' : ''}" role="radio" aria-checked="${selected ? 'true' : 'false'}" aria-disabled="${audit.status===AUDIT_STATUS.DONE ? 'true' : 'false'}" tabindex="${audit.status===AUDIT_STATUS.DONE ? '-1' : '0'}" ${audit.status===AUDIT_STATUS.DONE ? '' : `onclick="setMaturityResult(${audit.id},${idx},'${scale.id}','${level}', event)" onkeydown="if(event.key==='Enter'||event.key===' '){setMaturityResult(${audit.id},${idx},'${scale.id}','${level}', event)}"`}>
            <div class="maturity-card-head">
              <span class="maturity-radio" aria-hidden="true"></span>
              <div class="maturity-card-title">${esc(level)}</div>
              ${c.title ? `<div class="maturity-card-summary">${esc(c.title)}</div>` : ''}
            </div>
            ${c.title ? `<details class="maturity-details"><summary>기준 자세히</summary><div>${esc(c.title)}${c.body ? `<br>${esc(c.body)}` : ''}</div></details>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function renderCommentPanel(audit, item){
  const idx = item._idx;
  const note = esc(getPendingNoteValue(audit.id, idx, item.note || ''));
  return `<div class="comment-panel">
    <div class="comment-panel-title">Comment(s)</div>
    <textarea rows="2" placeholder="판단 근거, 관찰 내용 등을 입력하세요" oninput="scheduleNoteSave(${audit.id},${idx},this.value)" onblur="flushNoteSave(${audit.id},${idx})" ${audit.status===AUDIT_STATUS.DONE ? 'disabled' : ''}>${note}</textarea>
  </div>`;
}

function renderEvidencePanel(audit, item){
  const idx = item._idx;
  const photoCount = (item.photos || []).length;
  return `<div class="field-photo-panel">
    <div class="check-label">Evidence / 사진${photoCount ? ` · ${photoCount}장` : ''}</div>
    <div class="photo-row" id="photos-${idx}">
      ${(item.photos||[]).map((p)=>`<img class="photo-thumb" src="${p}" onclick="viewPhoto('${p}')" alt="사진">`).join('')}
       ${audit.status===AUDIT_STATUS.DONE ? '' : `<div class="photo-add" onclick="openPhotoModal(${audit.id},${idx})" tabindex="0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="13" r="4"/><path d="M5 7H3a2 2 0 00-2 2v9a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2h-2l-2-3H9L7 7z"/></svg>
       <span>추가</span>
       </div>`}
    </div>
    <div class="photo-storage-note">사진은 이 기기에 저장됩니다. 정기적으로 백업하세요.</div>
  </div>`;
}

function renderChecklistItem(audit, item){
  const idx = item._idx;
  const result = item.result || '';
  return `<div class="field-check-card ${result?'answered':''}" id="ci-${idx}">
    ${renderRequirementTable(audit, item)}
    <div class="check-body" id="cb-${idx}">
      ${renderResultPanel(audit, item)}
      ${renderMaturityPanels(audit, item)}
      ${renderCommentPanel(audit, item)}
      ${renderEvidencePanel(audit, item)}
    </div>
  </div>`;
}
function getSectionNavState(secItems){
  // Navigation chips are not status badges.
  // Keep section chips visually neutral regardless of YES/NO/OBS/N/A results.
  const completion = getSectionCompletion(secItems);
  return { ...completion, className: 'is-neutral' };
}

function getSectionChipLabel(sectionName){
  // Section headers often include an ordinal prefix such as "5. 지상 조업".
  // The chip already communicates position through horizontal order, so remove
  // the prefix to reduce numeric noise while keeping the original section title below.
  return String(sectionName || '').replace(/^\s*\d+\s*[.)]\s*/, '').trim() || String(sectionName || '일반');
}

function renderSectionAnchorChip(sectionName, secItems, sectionIndex, idPrefix = 'nav-sec-'){
  const state = getSectionNavState(secItems);
  const label = getSectionChipLabel(sectionName);
  const chipId = `${idPrefix}${sectionIndex}`;
  return `<button type="button" id="${chipId}" data-section-index="${sectionIndex}" class="anchor-chip ${state.className}" onclick="scrollToChecklistSection('sec-${sectionIndex}')" aria-label="${esc(sectionName)} 섹션으로 이동, ${state.answered}/${state.total} 항목 완료">
    <span class="anchor-chip-label">${esc(label)}</span>
    <span class="anchor-chip-count">${state.answered}/${state.total}</span>
  </button>`;
}

function renderPendingAnchorChip(audit){
  const summary = getAuditSummary(audit);
  const pending = Math.max(summary.total - summary.answered, 0);
  return `<button type="button" class="anchor-chip is-neutral" onclick="jumpToNext(${audit.id})" aria-label="미완료 항목 ${pending}개">
    <span class="anchor-chip-label">미완료</span>
    <span class="anchor-chip-count">${pending}</span>
  </button>`;
}

// Owns the section-chip scroll-tracking lifecycle: the debounced scroll
// listener, which scroller it's attached to, and the currently highlighted
// section index. attach()/detach() are the only two entry points a caller
// needs — the scroll/rAF bookkeeping that used to be four loose module
// variables lives here instead.
const SectionChipTracker = {
  scrollHandler: null,
  currentIndex: -1,
  scrollContainer: null,
  attach(){
    const scroller = getChecklistScrollContainer();
    if(!scroller) return;
    this.detach();
    this.currentIndex = -1;
    this.scrollContainer = scroller;
    let scrollFrame = null;
    this.scrollHandler = () => {
      if(scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        updateCurrentSectionChip(true);
      });
    };
    scroller.addEventListener('scroll', this.scrollHandler, {passive:true});
    requestAnimationFrame(() => updateCurrentSectionChip(false));
  },
  detach(){
    if(this.scrollHandler && this.scrollContainer){
      this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
    }
    this.scrollHandler = null;
    this.scrollContainer = null;
  }
};

function getCurrentChecklistSectionIndex(){
  const headers = [...document.querySelectorAll('.detail-section-start')];
  const scroller = getChecklistScrollContainer();
  if(headers.length === 0 || !scroller) return -1;

  const alignmentOffset = getSectionAlignmentOffset(scroller);
  const activeLine = scroller.scrollTop + alignmentOffset + 1;
  let currentIndex = 0;

  headers.forEach((header, index) => {
    if(getElementTopInScroller(header, scroller) <= activeLine) currentIndex = index;
  });

  return currentIndex;
}

function scrollChipIntoOwnContainer(chip){
  // Scroll only the chip's own strip (sidebar / anchor-nav), never bubble to
  // the outer #content scroller — that one is driven separately by
  // scrollToAlignedTarget and native scrollIntoView() fighting it here was
  // what made the desktop sidebar jump land in the wrong place.
  const box = chip.closest('.detail-sidebar, .detail-anchor-nav');
  if(!box) return;

  const chipRect = chip.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();

  if(chipRect.left < boxRect.left) box.scrollLeft -= (boxRect.left - chipRect.left);
  else if(chipRect.right > boxRect.right) box.scrollLeft += (chipRect.right - boxRect.right);

  if(chipRect.top < boxRect.top) box.scrollTop -= (boxRect.top - chipRect.top);
  else if(chipRect.bottom > boxRect.bottom) box.scrollTop += (chipRect.bottom - boxRect.bottom);
}

function setCurrentSectionChip(index, shouldAlignStart = true){
  if(index < 0) return;
  const indexChanged = index !== SectionChipTracker.currentIndex;
  SectionChipTracker.currentIndex = index;

  document.querySelectorAll('.detail-anchor-nav .anchor-chip, .detail-sidebar .anchor-chip').forEach(chip => {
    chip.classList.remove('is-current');
  });

  const activeChips = [
    document.getElementById('nav-mobile-' + index),
    document.getElementById('nav-side-' + index)
  ].filter(Boolean);

  if(activeChips.length === 0) return;
  activeChips.forEach(chip => chip.classList.add('is-current'));

  if(shouldAlignStart && indexChanged){
    activeChips.forEach(chip => scrollChipIntoOwnContainer(chip));
  }
}

function updateCurrentSectionChip(shouldAlignStart = true){
  setCurrentSectionChip(getCurrentChecklistSectionIndex(), shouldAlignStart);
}

function openSectionSheet(){
  const modal = byId('modal-sections');
  if(modal && !modal.dataset.backdropBound){
    modal.addEventListener('click', event => {
      if(event.target === modal) closeModal('modal-sections');
    });
    modal.dataset.backdropBound = '1';
  }

  updateCurrentSectionChip(false);
  document.querySelectorAll('#modal-sections .section-sheet-item[data-section-index]').forEach(item => {
    item.classList.toggle('is-current', Number(item.dataset.sectionIndex) === SectionChipTracker.currentIndex);
  });
  openModal('modal-sections');
}

function goToSectionFromSheet(sectionIndex){
  closeModal('modal-sections');
  requestAnimationFrame(() => scrollToChecklistSection(`sec-${sectionIndex}`));
}

function jumpToPendingFromSheet(auditId){
  closeModal('modal-sections');
  requestAnimationFrame(() => jumpToNext(auditId));
}

// Pure: which items pass the current filter, grouped by section — no DOM,
// testable without rendering.
function visibleSections(items, filter){
  const visibleItems = items
    .map((item, idx) => ({...item, _idx: idx}))
    .filter(item => filter === 'all' || (filter === 'pending' ? !item.result : normalizeResultValue(item.result) === filter));
  return Object.entries(AuditRules.bucketBySection(visibleItems));
}

function renderChecklist(audit){
  const c = document.getElementById('content');
  const items = getAuditItems(audit);
  const summary = getAuditSummary(audit);
  const sectionEntries = visibleSections(items, checklistFilter);

  c.innerHTML=`
  <div class="detail-shell">
    <div class="detail-top">
      <div class="detail-top-row">
        <button type="button" class="btn btn-ghost detail-back" onclick="backFromChecklist()" aria-label="목록으로 돌아가기">←</button>
        <div class="detail-title-wrap">
          <div class="detail-title">${esc(audit.title)}</div>
          <div class="detail-meta">${esc(audit.auditor||'심사원 미입력')} · ${esc(audit.dept||'부서 미입력')} · ${esc(audit.date||'일자 미입력')}</div>
        </div>
        <span class="detail-top-ratio">${summary.answered}/${summary.total}</span>
        <span class="badge ${audit.status===AUDIT_STATUS.DONE?'badge-ok':'badge-obs'}">${audit.status===AUDIT_STATUS.DONE?'완료':'진행 중'}</span>
      </div>
      <div class="detail-progress">
        <div class="detail-progress-head">
          <span class="detail-progress-text">${summary.answered}/${summary.total} 완료 · ${summary.percent}%</span>
          <div class="result-count-row detail-result-counts">
            <span class="badge badge-ok">YES ${summary.yes}</span>
            <span class="badge badge-ng">NO ${summary.no}</span>
            <span class="badge badge-na">N/A ${summary.na}</span>
            <span class="badge badge-obs">OBS ${summary.obs}</span>
          </div>
        </div>
        <div class="prog-wrap detail-prog-wrap"><div class="prog-fill" style="width:${summary.percent}%"></div></div>
        <div class="checklist-filter-row">
          ${[['all','전체'],['pending','미완료'],['NO','NO'],['OBS','OBS']].map(([value,label])=>`<button type="button" class="anchor-chip ${checklistFilter===value ? 'is-current' : ''}" aria-pressed="${checklistFilter===value ? 'true' : 'false'}" onclick="setChecklistFilter('${value}')">${label}</button>`).join('')}
        </div>
      </div>
    </div>


    <div class="detail-body">
      <aside class="detail-sidebar" aria-label="점검 섹션 사이드바">
        <div class="detail-sidebar-label">SECTION</div>
        ${sectionEntries.map(([sec, secItems], i)=>renderSectionAnchorChip(sec, secItems, i, 'nav-side-')).join('')}
        ${renderPendingAnchorChip(audit)}
      </aside>

      <div class="detail-content">
        <div class="detail-checklist-column">
          ${sectionEntries.length === 0 ? `
            <div class="empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              <h3>조건에 맞는 항목 없음</h3>
              <p>다른 필터를 선택해보세요</p>
            </div>
          ` : sectionEntries.map(([sec,secItems], sectionIndex)=>`
            <div class="section-header detail-section-start" id="sec-${sectionIndex}">
              <span class="detail-section-title">${esc(sec)}</span>
              <span class="check-section-summary check-section-summary-inline">${getSectionCompletion(secItems).answered}/${getSectionCompletion(secItems).total}</span>
            </div>
            ${secItems.map(item=>renderChecklistItem(audit, item)).join('')}
          `).join('')}
        </div>
        <div class="detail-scroll-tail" aria-hidden="true"></div>
      </div>
    </div>

    <div class="detail-bottom-action">
      <div class="detail-bottom-action-inner">
        <button type="button" class="btn btn-ghost flex-1" onclick="backFromChecklist()">목록</button>
        <button type="button" class="btn btn-ghost detail-section-action" onclick="openSectionSheet()">섹션</button>
        ${audit.status === AUDIT_STATUS.DONE
          ? `<button type="button" class="btn btn-teal flex-2" onclick="reopenAudit(${audit.id})">심사 다시 열기</button>`
          : summary.answered < summary.total
            ? `<button type="button" class="btn btn-teal flex-2" onclick="jumpToNext(${audit.id})">미완료 ${summary.total-summary.answered}개</button>`
            : `<button type="button" class="btn btn-teal flex-2" onclick="finishAudit(${audit.id})">심사 완료</button>`}
      </div>
    </div>

    <div class="modal-backdrop" id="modal-sections">
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-sections-title">
        <div class="modal-handle"></div>
        <div class="modal-title" id="modal-sections-title">섹션 이동</div>
        <div class="modal-body">
          <button type="button" class="section-sheet-item section-sheet-pending" onclick="jumpToPendingFromSheet(${audit.id})">
            <span class="section-sheet-label">미완료 항목으로 이동</span>
            <span class="section-sheet-count">${Math.max(summary.total-summary.answered,0)}</span>
          </button>
          <div class="section-sheet-list">
            ${sectionEntries.map(([sec, secItems], i)=>{
              const completion = getSectionCompletion(secItems);
              return `<button type="button" class="section-sheet-item" data-section-index="${i}" onclick="goToSectionFromSheet(${i})">
                <span class="section-sheet-label">${esc(sec)}</span>
                <span class="section-sheet-count">${completion.answered}/${completion.total}</span>
              </button>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
  requestAnimationFrame(() => {
    syncDetailStickyOffset();
    SectionChipTracker.attach();
  });
}


function toggleCheckItem(idx){
  const body = document.getElementById('cb-'+idx);
  if(!body) return;
  body.classList.toggle('hidden');
}

function preserveDetailScroll(previousScrollTop, openIdx, anchorTopBefore = null){
  const restore = () => {
    const c = getChecklistScrollContainer();
    const card = document.getElementById('ci-'+openIdx);
    const body = document.getElementById('cb-'+openIdx);
    if(body) body.classList.remove('hidden');

    if(!c) return;

    // Result/Maturity selection is an in-place edit.
    // Keep the tapped card at the same viewport position after full re-render.
    // This avoids the mobile browser's focus/scroll correction from making the page jump.
    if(typeof anchorTopBefore === 'number' && card){
      const anchorTopAfter = card.getBoundingClientRect().top;
      c.scrollTop += anchorTopAfter - anchorTopBefore;
    } else {
      c.scrollTop = previousScrollTop;
    }
  };

  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
  setTimeout(restore, 80);
  setTimeout(restore, 180);
}

function stopInputScrollJump(event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
  }
  if(document.activeElement && typeof document.activeElement.blur === 'function'){
    document.activeElement.blur();
  }
}

async function setMaturityResult(auditId, idx, scaleId, maturity, event){
  stopInputScrollJump(event);
  return enqueueAuditWrite(auditId, async () => {
    const audit = await dbGet('audits', auditId);
    if(!audit) return;
    if(audit.status === AUDIT_STATUS.DONE){ showToast('완료된 심사는 다시 열어야 수정할 수 있습니다'); return; }
    applyPendingNotesToAudit(audit);

    const content = getChecklistScrollContainer();
    const anchorCard = document.getElementById('ci-'+idx);
    const previousScrollTop = content ? content.scrollTop : 0;
    const anchorTopBefore = anchorCard ? anchorCard.getBoundingClientRect().top : null;

    const results = { ...AuditRules.deriveMaturityResults(audit.items[idx]) };
    results[scaleId] = maturity;
    audit.items[idx].maturityResults = results;
    currentAudit = audit;
    await dbPut('audits', audit);

    renderChecklist(audit);
    preserveDetailScroll(previousScrollTop, idx, anchorTopBefore);
  });
}

async function setResult(auditId, idx, result, event){
  stopInputScrollJump(event);
  return enqueueAuditWrite(auditId, async () => {
    const audit = await dbGet('audits', auditId);
    if(!audit) return;
    if(audit.status === AUDIT_STATUS.DONE){ showToast('완료된 심사는 다시 열어야 수정할 수 있습니다'); return; }
    applyPendingNotesToAudit(audit);

    const content = getChecklistScrollContainer();
    const anchorCard = document.getElementById('ci-'+idx);
    const previousScrollTop = content ? content.scrollTop : 0;
    const anchorTopBefore = anchorCard ? anchorCard.getBoundingClientRect().top : null;

    const wasAnswered = !!audit.items[idx].result;
    audit.items[idx].result = normalizeResultValue(result);
    currentAudit = audit;
    await dbPut('audits', audit);

    renderChecklist(audit);
    preserveDetailScroll(previousScrollTop, idx, anchorTopBefore);
    if(!wasAnswered && result) showToast('저장되었습니다');
  });
}

const noteSaveTimers = new Map();
const pendingNoteValues = new Map();
const auditWriteQueues = new Map();

function enqueueAuditWrite(auditId, write){
  const previous = auditWriteQueues.get(auditId) || Promise.resolve();
  const next = previous.catch(() => {}).then(write);
  const settled = next.finally(() => {
    if(auditWriteQueues.get(auditId) === settled) auditWriteQueues.delete(auditId);
  });
  auditWriteQueues.set(auditId, settled);
  return next;
}

function setChecklistFilter(value){
  checklistFilter = value;
  if(currentAudit) renderChecklist(currentAudit);
}

function waitForAuditWrites(auditId){
  return auditWriteQueues.get(auditId) || Promise.resolve();
}

function clearPendingNoteWrites(){
  for(const timer of noteSaveTimers.values()) clearTimeout(timer);
  noteSaveTimers.clear();
  pendingNoteValues.clear();
}

function getNoteSaveKey(auditId, idx){
  return `${auditId}:${idx}`;
}

function getPendingNoteValue(auditId, idx, fallback = ''){
  const key = getNoteSaveKey(auditId, idx);
  return pendingNoteValues.has(key) ? pendingNoteValues.get(key) : fallback;
}

function applyPendingNotesToAudit(audit){
  if(!audit?.id || !Array.isArray(audit.items)) return audit;
  audit.items.forEach((item, idx) => {
    const key = getNoteSaveKey(audit.id, idx);
    if(pendingNoteValues.has(key)) item.note = pendingNoteValues.get(key);
  });
  return audit;
}

function scheduleNoteSave(auditId, idx, note){
  if(currentAudit?.id === auditId && currentAudit.status === AUDIT_STATUS.DONE){
    showToast('완료된 심사는 다시 열어야 수정할 수 있습니다');
    return;
  }
  const key = getNoteSaveKey(auditId, idx);
  pendingNoteValues.set(key, note);

  if(currentAudit?.id === auditId && currentAudit.items?.[idx]){
    currentAudit.items[idx].note = note;
  }

  clearTimeout(noteSaveTimers.get(key));
  noteSaveTimers.set(key, setTimeout(() => persistNoteValue(auditId, idx), 400));
}

async function persistNoteValue(auditId, idx){
  const key = getNoteSaveKey(auditId, idx);
  const note = pendingNoteValues.get(key);
  if(note === undefined) return;

  noteSaveTimers.delete(key);
  return enqueueAuditWrite(auditId, async () => {
    const audit = await dbGet('audits', auditId);
    if(!audit?.items?.[idx] || audit.status === AUDIT_STATUS.DONE) return;
    audit.items[idx].note = note;
    await dbPut('audits', audit);
    if(currentAudit?.id === auditId && currentAudit.items?.[idx]) currentAudit.items[idx].note = note;
    if(pendingNoteValues.get(key) === note) pendingNoteValues.delete(key);
  });
}

function flushNoteSave(auditId, idx){
  const key = getNoteSaveKey(auditId, idx);
  clearTimeout(noteSaveTimers.get(key));
  noteSaveTimers.delete(key);
  return persistNoteValue(auditId, idx);
}

async function deleteAudit(id, event){
  event?.stopPropagation();
  const audit = await dbGet('audits', id);
  if(!audit) return;
  if(!confirm(`"${audit.title}" 심사 기록과 첨부 사진을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
  await dbDelete('audits', id);
  if(currentAudit?.id === id) currentAudit = null;
  showToast('심사 기록을 삭제했습니다');
  switchTab('audits');
}

async function flushPendingNotesForAudit(auditId){
  const indices = [...pendingNoteValues.keys()]
    .filter(key => key.startsWith(`${auditId}:`))
    .map(key => Number(key.slice(String(auditId).length + 1)));
  for(const idx of indices) await flushNoteSave(auditId, idx);
}

function jumpToNext(auditId){
  const items = currentAudit?.items||[];
  const nextIdx = items.findIndex(i=>!i.result);
  if(nextIdx<0){ showToast('모든 항목이 완료되었습니다 ✓'); return; }
  scrollToChecklistItem(nextIdx);
}

async function finishAudit(id){
  await flushPendingNotesForAudit(id);
  await waitForAuditWrites(id);
  const audit = await dbGet('audits', id);
  if(!audit) return;
  if(audit.status === AUDIT_STATUS.DONE){ showToast('이미 완료된 심사입니다'); return; }
  const unanswered = audit.items?.filter(i=>!i.result).length||0;
  if(!AuditRules.canCompleteAudit(audit)){
    showToast(`미완료 항목 ${unanswered}개를 입력해야 심사를 완료할 수 있습니다`);
    jumpToNext(id);
    return;
  }
  audit.status=AUDIT_STATUS.DONE;
  await dbPut('audits', audit);
  showToast('심사가 완료되었습니다');
  backFromChecklist();
}

async function reopenAudit(id){
  const audit = await dbGet('audits', id);
  if(!audit || audit.status !== AUDIT_STATUS.DONE) return;
  if(!confirm('완료 상태를 해제하고 심사를 다시 수정하시겠습니까?')) return;
  audit.status = AUDIT_STATUS.PROGRESS;
  audit.reopenedAt = new Date().toISOString();
  await dbPut('audits', audit);
  currentAudit = audit;
  renderChecklist(audit);
  showToast('심사를 다시 열었습니다');
}

function backFromChecklist(){
  setVisible('topbar', true);
  setVisible('tabbar', true);
  setHidden('topbar-action', true);
  currentAudit=null;
  switchTab('audits');
}
