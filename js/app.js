(() => {
  /* ================================
     Timeline Story Editor v2.1 (CLEAN)
     - 기능 그대로 / JS 정리
     ================================ */

  /* ---------- Constants ---------- */
  const HOUR_HEIGHT = 120;
  const MINUTE_PX = HOUR_HEIGHT / 60;
  const TOTAL_HOURS = 48;
  const MAX_MINUTES = TOTAL_HOURS * 60;
  const MIN_ITEM_HEIGHT = 100;

  /* ---------- DOM ---------- */
  const timeline = document.getElementById('timeline');
  const viewport = document.getElementById('viewport');
  const headerLabel = document.getElementById('headerLabel');
  const titleOverlay = document.getElementById('titleOverlay');
  const titlePageLayer = document.getElementById('titlePageLayer');
  
  const dateInput = document.getElementById('date');
  const datePickerBtn = document.getElementById('datePickerBtn');

  const startTimeSelect = document.getElementById('startTime');
  const endTimeSelect = document.getElementById('endTime');

  const textContentInput = document.getElementById('textContent');
  const itemFileInput = document.getElementById('itemFile');
  const textInputGroup = document.getElementById('textInputGroup');
  const imageInputGroup = document.getElementById('imageInputGroup');

  const addItemBtn = document.getElementById('addItemBtn');
  const timeSummaryEl = document.getElementById('timeSummary');
  const blockListEl = document.getElementById('blockList');

  const themeToggleBtn = document.getElementById('themeToggle');

  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const playBtn = document.getElementById('playBtn');
  const playFullscreenBtn = document.getElementById('playFullscreenBtn');
  const videoTitleInput = document.getElementById('videoTitle');
  
  // ✅ Title BG DOM
const titleBgPickBtn = document.getElementById('titleBgPickBtn');
const titleBgFile    = document.getElementById('titleBgFile');
const titleBgMeta    = document.getElementById('titleBgMeta');
const titleBgName    = document.getElementById('titleBgName');
const titleBgClearBtn= document.getElementById('titleBgClearBtn');

// UI
function refreshTitleBgMetaUI(){
  if (!titleBgMeta || !titleBgName) return;
  if (!titleBgDataUrl) {
    titleBgMeta.style.display = 'none';
    titleBgName.textContent = '';
    return;
  }
  titleBgMeta.style.display = 'flex';
  titleBgName.textContent = (titleBgList.length > 1)
    ? `배경 ${titleBgList.length}장 선택됨`
    : `배경 1장 선택됨`;
}

// 파일 읽기
function readAsDataURL(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error || new Error('read failed'));
    r.readAsDataURL(file);
  });
}

// 여러 장 지원
async function setTitleBgFiles(fileList){
  const files = Array.from(fileList || []).filter(Boolean);
  if (!files.length) return;

  const urls = await Promise.all(files.map(readAsDataURL));

  titleBgList = urls;
  titleBgDataUrl = urls[0] || null;

  refreshTitleBgMetaUI();

  // ✅ 타이틀 오버레이 + 타이틀 탭 레이어 반영
  applyTitleBgToOverlay();      // 내부에서 applyTitleBgToTitlePage()도 호출함
  ensureTitleBgItem();
  clearExtraTitleBgItems();
  scatterExtraTitleBgItems(titleBgList.slice(1));

  markDirtyAndSave('titleBgSet');
}

function clearTitleBg(){
  if (titleBgFile) titleBgFile.value = '';
  titleBgList = [];
  titleBgDataUrl = null;

  refreshTitleBgMetaUI();

  applyTitleBgToOverlay(); // overlay 정리
  clearExtraTitleBgItems();

  // 메인 BG DOM 숨김/정리
  if (titleBgItemEl) titleBgItemEl.style.display = 'none';

  markDirtyAndSave('titleBgClear');
}

// 초기 UI
refreshTitleBgMetaUI();

titleBgPickBtn?.addEventListener('click', () => titleBgFile?.click());

titleBgFile?.addEventListener('change', async (e) => {
  const files = e.target.files;
  if (!files || !files.length) {
    refreshTitleBgMetaUI();
    return;
  }
  try {
    await setTitleBgFiles(files);
  } catch (err) {
    console.warn(err);
    alert('배경 이미지를 불러오지 못했어요.');
  }
});

titleBgClearBtn?.addEventListener('click', clearTitleBg);

  const stepButtons = document.querySelectorAll('.step-btn');
  const step2SubNav = document.getElementById('step2SubNav');
  const itemTypeButtons = document.querySelectorAll('.item-type-toggle .toggle-btn');
  const animationModeButtons = document.querySelectorAll('.animation-mode-toggle .toggle-btn');

  const stepPanels = {
    1: document.getElementById('step1Panel'),
    2: document.getElementById('step2Panel'),
    3: document.getElementById('step3Panel')
  };

  /* ---------- Title Font Toggle ---------- */
  const titleFontButtons = document.querySelectorAll('#titleFontToggle .toggle-btn');
  let currentTitleFont = localStorage.getItem('titleFont') || 'pretendard';

  function applyTitleFont(fontKey){
    titleFontButtons.forEach(b => b.classList.toggle('active', b.dataset.font === fontKey));
    currentTitleFont = fontKey;
    localStorage.setItem('titleFont', fontKey);

    titleOverlay.classList.remove('titlefont-bagel','titlefont-nanum','titlefont-pretendard','titlefont-laudrygo');
    titleOverlay.classList.add(`titlefont-${fontKey}`);
    if (titleItem) {
  titleItem.fontKey = fontKey;
  applyTitleItemStyles();
}
  }

  titleFontButtons.forEach(btn => {
    btn.addEventListener('click', () => applyTitleFont(btn.dataset.font));
  });




  /* ---------- Text Font Toggle ---------- */
  const textFontButtons = document.querySelectorAll('#textFontToggle .toggle-btn');
  let currentTextFont = localStorage.getItem('textFont') || 'pretendard';

  function applyTextFont(fontKey){
    textFontButtons.forEach(b => b.classList.toggle('active', b.dataset.font === fontKey));
    currentTextFont = fontKey;
    localStorage.setItem('textFont', fontKey);
  }

  textFontButtons.forEach(btn => {
    btn.addEventListener('click', () => applyTextFont(btn.dataset.font));
  });
  

  /* ---------- State ---------- */
  let currentItemType = 'file';
  let currentAnimationMode = 'scroll';

  let blocks = [];
  let items = [];

  let titleItem = null;
let titleItemEl = null;
  // ✅ 제목 위치를 사용자가 옮겼는지
let titleItemUserMoved = false;

  let titleBgDataUrl = null;        // base64 (복원용)

  let editingItemEl = null;
  let animFrameId = null;

  // gesture
  let activeTouches = [];
  let gestureState = null;

  let longPressTimer = null;
  let longPressStartPos = null;
  let zCounter = 1;

  let step2View = 'timeline'; // 'timeline' | 'title'

  let titleBgList = [];          // ✅ 여러 장 지원: [dataUrl, dataUrl, ...]
let titleBgItem = null;        // 메인 배경 아이템 state
let titleBgItemEl = null;      // 메인 배경 DOM
  
function hasVideoTitle(){
  return !!(videoTitleInput.value && videoTitleInput.value.trim());
}

function setStep2View(next){
  step2View = next;

  // ✅ CSS 제어용
  document.body.dataset.step2view = next;

  // 버튼 active 처리
  step2SubNav.querySelectorAll('.sub-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.view === next);
  });
if (next === 'title') {
  // ✅ 제목 탭 = 곧바로 프리뷰(가짜 전체화면)
  enterRecordMode('titlePreview');

  titlePageLayer.style.display = 'block';

  ensureTitleItem();
  ensureTitleBgItem();

  // ✅ “블러/딤 적용 안 됨” 타이밍 방지: 배경 요소 생성 후 한 번 더 반영
  applyTitleBgToTitlePage();

  showTitleItem(true);
  showTitleBgItem(true);

 // ✅ 처음 진입 때만 중앙정렬 (사용자가 옮겼으면 유지)
if (!titleItemUserMoved) centerTitleItemInViewport();
  exitEditMode();
} else {
  // ✅ 제목 탭 벗어나면 프리뷰 종료
  if (document.body.classList.contains('record-mode') && recordModeReason === 'titlePreview') {
    exitRecordMode();
  }

  titlePageLayer.style.display = 'none';
  showTitleItem(false);
  showTitleBgItem(false);
}
}


function updateStep2SubNavVisibility(){
  const isStep2 = document.body.dataset.step === '2';
  const show = isStep2 && hasVideoTitle();

  step2SubNav.style.display = show ? 'flex' : 'none';

  // 제목이 없어졌으면 강제로 timeline로 복귀 + 제목 숨김
  if (!show) {
    step2View = 'timeline';
    showTitleItem(false);
  } else {
    // step2 들어왔는데 서브탭 보이면 기본은 타임라인(원래 흐름 유지)
    setStep2View(step2View || 'timeline');
  }
}

  
  /* ---------- Utils ---------- */
 function minutesToTimeLabel(totalMinutes) {
  const isNext = totalMinutes >= 1440;
  let m = totalMinutes;
  if (isNext) m -= 1440;

  const h = Math.floor(m / 60);
  const mm = m % 60;

  const hh = String(h).padStart(2,'0');
  const mmStr = String(mm).padStart(2,'0');
  const base = `${hh}:${mmStr}`;

  return isNext ? `+1일 ${base}` : base;
}

  function clamp(n, min, max){ return Math.max(min, Math.min(n, max)); }

  function formatDateYYYYMMDD(dt){
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const d = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function getDatePlusDays(baseYYYYMMDD, days){
  if (!baseYYYYMMDD) return '';
  const [y, m, d] = baseYYYYMMDD.split('-').map(Number);
  const dt = new Date(y, (m-1), d); // ✅ 로컬 안정 파싱
  dt.setDate(dt.getDate() + days);
  return formatDateYYYYMMDD(dt);
}

function updateHeaderDateByScroll(scrollTop){
  const base = dateInput.value || '';
  if (!base) return;

  // ✅ viewport null 체크 추가
  if (!viewport) return;
  const viewportHeight = viewport.clientHeight;
  const centerY = scrollTop + viewportHeight/2;
  const minutes = centerY / MINUTE_PX;

  const dayIndex = Math.floor(minutes / 1440); // 0: 오늘, 1: +1일
  const clampedDay = clamp(dayIndex, 0, 1);

  const dateStr = getDatePlusDays(base, clampedDay);
  headerLabel.textContent = dateStr + ' 타임라인';
}
function fitTextBoxToContent(el, item, maxW){
  const t = el.querySelector('.timeline-item-text');
  if (!t) return;

  // ✅ 최대 폭(모바일 기준 너무 길어지지 않게)
  const limitW = maxW || Math.max(160, viewport.clientWidth - 80);

  // 측정 전: 자연 크기 + 줄바꿈 허용 + 최대폭 제한
  t.style.width = 'max-content';
  t.style.maxWidth = limitW + 'px';
  t.style.height = 'auto';

  // 레이아웃 반영 후 실제 크기 읽기
  requestAnimationFrame(() => {
    const rect = t.getBoundingClientRect();

    // 터치 가능한 최소 크기 보장
    const newW = clamp(Math.ceil(rect.width), 80, limitW);
    const newH = clamp(Math.ceil(rect.height), 44, 2000);

    el.style.width = newW + 'px';
    el.style.height = newH + 'px';

    item.w = newW;
    item.h = newH;
  });
}

  /* ---------- UI Helper Functions ---------- */
function setActiveByDataset(buttons, key, value){
  buttons.forEach(b => b.classList.toggle('active', b.dataset[key] === value));
}

function applyTitleFontUI(fontKey){
  // 버튼 active
  titleFontButtons.forEach(b => b.classList.toggle('active', b.dataset.font === fontKey));
  // overlay class
  titleOverlay.classList.remove('titlefont-bagel','titlefont-nanum','titlefont-pretendard','titlefont-laudrygo');
  titleOverlay.classList.add(`titlefont-${fontKey}`);
}
    

function applyTextFontUI(fontKey){
  textFontButtons.forEach(b => b.classList.toggle('active', b.dataset.font === fontKey));
}

function applyItemTypeUI(typeKey){
  currentItemType = typeKey;
  setActiveByDataset(itemTypeButtons, 'type', typeKey);

  if (typeKey === 'text') {
    textInputGroup.style.display = 'block';
    imageInputGroup.style.display = 'none';
  } else {
    textInputGroup.style.display = 'none';
    imageInputGroup.style.display = 'block';
  }
}

function applyAnimationModeUI(modeKey){
  currentAnimationMode = modeKey;
  setActiveByDataset(animationModeButtons, 'mode', modeKey);
}

/* ---------- Block / List ---------- */
  function updateBlockList() {
    blockListEl.innerHTML = '';
    if (!blocks.length) return;

    const sorted = blocks.slice().sort((a,b)=>a.startMinutes - b.startMinutes);

    sorted.forEach(b => {
      const li = document.createElement('li');
      li.dataset.blockId = b.id;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'time';
      timeSpan.textContent =
        minutesToTimeLabel(b.startMinutes) + ' ~ ' + minutesToTimeLabel(b.endMinutes);

      const countSpan = document.createElement('span');
      countSpan.className = 'count';
      countSpan.textContent = `아이템 ${items.filter(it => it.blockId === b.id).length}개`;

      const delBtn = document.createElement('button');
      delBtn.className = 'block-delete-btn';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', ev => {
        ev.stopPropagation();
        if (confirm('이 시간 블록 전체를 삭제할까요?')) deleteBlockById(b.id);
      });

      const rightGroup = document.createElement('div');
      rightGroup.className = 'block-right-group';
      rightGroup.appendChild(countSpan);
      rightGroup.appendChild(delBtn);

      li.appendChild(timeSpan);
      li.appendChild(rightGroup);

      li.addEventListener('click', () => scrollToBlock(b.id));
      blockListEl.appendChild(li);
    });
  }

  function updateTimeSummary() {
    if (!blocks.length) {
      timeSummaryEl.textContent = '아직 추가된 시간이 없습니다.';
      blockListEl.innerHTML = '';
      return;
    }
    timeSummaryEl.textContent = `추가된 시간 블록: ${blocks.length}개`;
    updateBlockList();
  }

  function scrollToBlock(blockId) {
    const block = blocks.find(b => b.id === blockId);
    if (!block || !block.element) return;

    const blockTop = parseFloat(block.element.style.top) || 0;
    const blockHeight = block.element.offsetHeight || 0;

    const viewportHeight = viewport.clientHeight;
    const maxScroll = Math.max(0, timeline.scrollHeight - viewportHeight);

    let target = blockTop - (viewportHeight - blockHeight) / 2;
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ top: target, behavior: 'smooth' });

    block.element.classList.add('highlight');
    setTimeout(()=>block.element.classList.remove('highlight'), 800);
  }

  function deleteBlockById(blockId) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const blockItems = items.filter(it => it.blockId === blockId);
    blockItems.forEach(it => {
      const el = timeline.querySelector(`.timeline-item[data-id="${it.id}"]`);
      if (el && el.parentElement) el.parentElement.removeChild(el);
    });

    items = items.filter(it => it.blockId !== blockId);

    if (block.element && block.element.parentElement) {
      block.element.parentElement.removeChild(block.element);
    }
    blocks = blocks.filter(b => b.id !== blockId);

    editingItemEl = null;
    updateTimeSummary();
  }

  /* ---------- Time Options ---------- */
  function updateEndTimeOptions(startMinutes) {
    endTimeSelect.innerHTML = '';
    const minEnd = startMinutes + 30;
    for (let m=minEnd; m<=MAX_MINUTES; m+=30) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = minutesToTimeLabel(m);
      endTimeSelect.appendChild(opt);
    }
  }

  function buildTimeOptions() {
    startTimeSelect.innerHTML = '';
    for (let m=0; m<=MAX_MINUTES-30; m+=30) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = minutesToTimeLabel(m);
      if (m===7*60) opt.selected = true;
      startTimeSelect.appendChild(opt);
    }
    updateEndTimeOptions(parseInt(startTimeSelect.value,10));
  }

  /* ---------- Grid ---------- */
function buildHourGrid() {
  for (let h=0; h<TOTAL_HOURS; h++) {
    const top = h * HOUR_HEIGHT;

    const label = document.createElement('div');
    label.className = 'hour-label';
    label.style.top = (top + 8) + 'px';

    // ✅ B안: 오늘은 00~23, 다음날은 "+1일 00~23"
    const hourInDay = h % 24;
    const hh = String(hourInDay).padStart(2,'0');
    label.textContent = (h >= 24) ? `+1일 ${hh}` : hh;

    const line = document.createElement('div');
    line.className = 'hour-line';
    line.style.top = (top + 28) + 'px';

    const half = document.createElement('div');
    half.className = 'half-line';
    half.style.top = (top + HOUR_HEIGHT/2 + 28) + 'px';

    timeline.appendChild(label);
    timeline.appendChild(line);
    timeline.appendChild(half);
  }
}

  function buildDayBoundary(){
  const base = dateInput.value || '';
  if (!base) return;

  const boundaryTop = 24 * HOUR_HEIGHT;

  const wrap = document.createElement('div');
  wrap.className = 'day-boundary';
  wrap.style.top = boundaryTop + 'px';

  const line = document.createElement('div');
  line.className = 'day-boundary-line';
  line.style.top = '0px';

  const label = document.createElement('div');
  label.className = 'day-boundary-label';
  label.textContent = getDatePlusDays(base, 1); // ✅ 다음날 날짜

  wrap.appendChild(line);
  wrap.appendChild(label);
  timeline.appendChild(wrap);
}


  function clearHourHighlight() {
    document.querySelectorAll('.hour-label').forEach(l => l.classList.remove('active'));
  }

  function highlightHourByScroll(scrollTop) {
    // ✅ viewport null 체크 추가
    if (!viewport) return;
    const viewportHeight = viewport.clientHeight;
    const centerY = scrollTop + viewportHeight/2;
    const minutes = centerY / MINUTE_PX;
    const hourIndex = Math.floor(minutes/60);

    clearHourHighlight();

    const labels = document.querySelectorAll('.hour-label');
    if (hourIndex>=0 && hourIndex<labels.length) labels[hourIndex].classList.add('active');

      // ✅ 추가: 스크롤 위치에 따라 header 날짜 자동 변경
  updateHeaderDateByScroll(scrollTop);
  }

  function resetTimelineDataAndDom() {
    blocks = [];
    items = [];
    editingItemEl = null;
    stopAnimation();
    clearHourHighlight();
    exitEditMode();

    while (timeline.firstChild) timeline.removeChild(timeline.firstChild);
    timeline.style.height = (TOTAL_HOURS*HOUR_HEIGHT)+'px';

    buildHourGrid();
    buildDayBoundary();
    updateTimeSummary();
  }

  /* ---------- Blocks ---------- */
  function getOrCreateBlock(startMinutes,endMinutes){
    const blockId = `block-${startMinutes}-${endMinutes}`;
    let block = blocks.find(b=>b.id===blockId);
    if (block) return block;

    const top = startMinutes * MINUTE_PX;
    const height = (endMinutes-startMinutes) * MINUTE_PX;

    const blockEl = document.createElement('div');
    blockEl.className='time-block';
    blockEl.style.top = top+'px';
    blockEl.style.height = height+'px';
    blockEl.dataset.id = blockId;

    const inner = document.createElement('div');
    inner.className='time-block-inner';
    blockEl.appendChild(inner);
    timeline.appendChild(blockEl);

    block = {id:blockId,startMinutes,endMinutes,duration:endMinutes-startMinutes,element:blockEl};
    blocks.push(block);
    updateTimeSummary();
    return block;
  }

  /* ---------- Items ---------- */
  function getItemByElement(el){
    const id=el.dataset.id;
    return items.find(it=>it.id===id);
  }

  function createItemElement(item) {
    const el = document.createElement('div');
    el.className = 'timeline-item';
    el.dataset.id = item.id;
    el.style.left = item.x + 'px';
    el.style.top = item.y + 'px';
    el.style.width = item.w + 'px';
    el.style.height = item.h + 'px';
    el.style.transform = `rotate(${item.rotation || 0}rad)`;
    el.dataset.rotation = item.rotation || 0;
    el.style.zIndex = (++zCounter).toString();

    if (item.type === 'image') {
      const img = document.createElement('img');
      img.src = item.src;
      img.style.objectFit = 'contain';
      el.appendChild(img);
    } else if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.src;
      v.muted = true;
      v.loop = true;
      v.autoplay = true;
      v.playsInline = true;
      v.style.objectFit = 'contain';
      el.appendChild(v);
    } else {
      const t = document.createElement('div');
      t.className = 'timeline-item-text';
      t.textContent = item.text;

      const fontMap = {
        pretendard: '"PretendardSemiBoldLocal","Pretendard",system-ui,sans-serif',
        laudrygo: '"LaudrygoLocal",system-ui,sans-serif',
        nanum: '"NanumNaMuJeongWeonLocal",system-ui,sans-serif',
        bagel: '"BagelFatOneLocal",system-ui,sans-serif'
      };

      const key = item.fontKey || 'pretendard';
      t.style.fontFamily = fontMap[key] || fontMap.pretendard;
      t.style.fontSize = (item.fontSize || 24) + 'px'; // 최소 24px 보장
      el.appendChild(t);
       // ✅ 추가: 텍스트 크기에 맞춰 박스 자동 맞춤
  fitTextBoxToContent(el, item);
    }
    
    
    // 제스처 이벤트
    el.addEventListener('pointerdown', onGesturePointerDown);
    el.addEventListener('pointermove', onGesturePointerMove);
    el.addEventListener('pointerup', onGesturePointerUp);
    el.addEventListener('pointercancel', onGesturePointerUp);

    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('dragstart', e => e.preventDefault());

    el.style.touchAction = 'pan-y';
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';

    timeline.appendChild(el);
    return el;
  }

  /* =========================
   Title Page (Step2 - Title)
   ========================= */

function ensureTitleItem(){
  const titleText = (videoTitleInput.value || '').trim();
  if (!titleText) return;

  if (!titleItem) {
    titleItem = {
      id: 'title-item',
      blockId: null,
      type: 'text',
      text: titleText,
      x: 24,
      y: 90,
      w: 312,
      h: 120,
      rotation: 0,
      fontKey: currentTitleFont,
      fontSize: 32
    };
    items.push(titleItem);
  } else {
    titleItem.text = titleText;
    titleItem.fontKey = currentTitleFont;
  }

  if (!titleItemEl) {
    titleItemEl = document.createElement('div');
    titleItemEl.className = 'timeline-item';
    titleItemEl.dataset.id = titleItem.id;

    const t = document.createElement('div');
    t.className = 'timeline-item-text';
    titleItemEl.appendChild(t);

    titleItemEl.addEventListener('pointerdown', onGesturePointerDown);
    titleItemEl.addEventListener('pointermove', onGesturePointerMove);
    titleItemEl.addEventListener('pointerup', onGesturePointerUp);
    titleItemEl.addEventListener('pointercancel', onGesturePointerUp);

    titleItemEl.addEventListener('contextmenu', e => e.preventDefault());
    titleItemEl.addEventListener('dragstart', e => e.preventDefault());

    // ✅ Step2 제목 탭 전용 레이어에 붙임
    titlePageLayer.appendChild(titleItemEl);
  }

  syncTitleItemText();
  applyTitleItemStyles();
}

function applyTitleItemStyles(){
  if (!titleItem || !titleItemEl) return;

  titleItemEl.style.left = titleItem.x + 'px';
  titleItemEl.style.top = titleItem.y + 'px';
  titleItemEl.style.width = titleItem.w + 'px';
  titleItemEl.style.height = titleItem.h + 'px';
  titleItemEl.style.transform = `rotate(${titleItem.rotation || 0}rad)`;
  titleItemEl.dataset.rotation = titleItem.rotation || 0;
  titleItemEl.style.zIndex = '9998';

  const t = titleItemEl.querySelector('.timeline-item-text');
  if (t) {
    const fontMap = {
      pretendard: '"PretendardSemiBoldLocal","Pretendard",system-ui,sans-serif',
      laudrygo: '"LaudrygoLocal",system-ui,sans-serif',
      nanum: '"NanumNaMuJeongWeonLocal",system-ui,sans-serif',
      bagel: '"BagelFatOneLocal",system-ui,sans-serif'
    };
    t.style.fontFamily = fontMap[titleItem.fontKey] || fontMap.pretendard;
    t.style.fontSize = (titleItem.fontSize || 32) + 'px';
  }

  // ✅ 제목도 텍스트에 맞춰 박스 자동 맞춤
  fitTextBoxToContent(titleItemEl, titleItem, (viewport.clientWidth || 360) - 48);
}

function syncTitleItemText(){
  if (!titleItem || !titleItemEl) return;
  const t = titleItemEl.querySelector('.timeline-item-text');
  if (t) t.textContent = titleItem.text || '';
}

function showTitleItem(show){
  if (!titleItemEl) return;
  titleItemEl.style.display = show ? 'block' : 'none';
}

function centerTitleItemInViewport(){
  if (!titleItem || !titleItemEl) return;

  requestAnimationFrame(() => {
    const vw = viewport.clientWidth || 360;
    const vh = viewport.clientHeight || 640;

    const w = parseFloat(titleItemEl.style.width) || titleItemEl.offsetWidth || 200;
    const h = parseFloat(titleItemEl.style.height) || titleItemEl.offsetHeight || 80;

    titleItem.x = Math.round((vw - w) / 2);
    titleItem.y = Math.round((vh - h) / 2);

    applyTitleItemStyles();
  });
}
/* ---------- Title BG (메인 + 추가 흩뿌리기) ---------- */

function clearExtraTitleBgItems(){
  // DOM 제거
  Array.from(titlePageLayer.querySelectorAll('.timeline-item')).forEach(el => {
    const id = el.dataset.id || '';
    if (id.startsWith('title-bg-extra-')) el.remove();
  });
  // 상태 제거
  items = items.filter(it => !String(it.id).startsWith('title-bg-extra-'));
}

function ensureTitleBgItem(){
  if (!titleBgDataUrl) return;

  // ✅ viewport null 체크 추가 (모바일 크래시 방지)
  const vw = viewport ? (viewport.clientWidth || 360) : 360;
  const vh = viewport ? (viewport.clientHeight || 640) : 640;

  if (!titleBgItem) {
    titleBgItem = {
      id: 'title-bg-item',
      blockId: null,
      type: 'image',
      src: titleBgDataUrl,
      x: 0,
      y: 0,
      w: vw,
      h: vh,
      rotation: 0
    };
    items.push(titleBgItem);
  } else {
    // ✅ 화면 크기 바뀌어도 배경은 항상 화면에 맞게
    titleBgItem.src = titleBgDataUrl;
    titleBgItem.x = 0;
    titleBgItem.y = 0;
    titleBgItem.w = vw;
    titleBgItem.h = vh;
    titleBgItem.rotation = 0;
  }

  if (!titleBgItemEl) {
    titleBgItemEl = document.createElement('div');
    titleBgItemEl.className = 'timeline-item';
    titleBgItemEl.dataset.id = titleBgItem.id;

    const img = document.createElement('img');
    img.src = titleBgItem.src;
    img.style.objectFit = 'cover'; // ✅ 9:16 꽉 채우기
    titleBgItemEl.appendChild(img);

    titleBgItemEl.addEventListener('pointerdown', onGesturePointerDown);
    titleBgItemEl.addEventListener('pointermove', onGesturePointerMove);
    titleBgItemEl.addEventListener('pointerup', onGesturePointerUp);
    titleBgItemEl.addEventListener('pointercancel', onGesturePointerUp);

    titleBgItemEl.addEventListener('contextmenu', e => e.preventDefault());
    titleBgItemEl.addEventListener('dragstart', e => e.preventDefault());

    titlePageLayer.appendChild(titleBgItemEl);
  }

  applyTitleBgItemStyles();
  /* ✅ 추가: bg DOM 생성/갱신 이후 블러/딤을 다시 강제 반영 */
 applyTitleBgToTitlePage();
}

function applyTitleBgItemStyles(){
  if (!titleBgItem || !titleBgItemEl) return;

  titleBgItemEl.style.left = titleBgItem.x + 'px';
  titleBgItemEl.style.top = titleBgItem.y + 'px';
  titleBgItemEl.style.width = titleBgItem.w + 'px';
  titleBgItemEl.style.height = titleBgItem.h + 'px';
  titleBgItemEl.style.transform = `rotate(${titleBgItem.rotation || 0}rad)`;
  titleBgItemEl.dataset.rotation = titleBgItem.rotation || 0;

  // ✅ 배경은 항상 제일 아래
  titleBgItemEl.style.zIndex = '1';

  const img = titleBgItemEl.querySelector('img');
  if (img) img.src = titleBgItem.src;
}

function showTitleBgItem(show){
  if (!titleBgItemEl) return;
  titleBgItemEl.style.display = show ? 'block' : 'none';
}

function scatterExtraTitleBgItems(extraUrls){
  if (!Array.isArray(extraUrls) || extraUrls.length === 0) return;

  // ✅ viewport null 체크 추가 (모바일 크래시 방지)
  const vw = viewport ? (viewport.clientWidth || 360) : 360;
  const vh = viewport ? (viewport.clientHeight || 640) : 640;

  extraUrls.forEach((src, idx) => {
    const id = `title-bg-extra-${Date.now()}-${idx}`;

    const w = Math.round(clamp(80 + Math.random()*160, 80, vw*0.8));
    const h = Math.round(clamp(80 + Math.random()*200, 80, vh*0.7));
    const x = Math.round(clamp(Math.random()*(vw - w), 0, vw - w));
    const y = Math.round(clamp(Math.random()*(vh - h), 0, vh - h));
    const r = (Math.random()*0.6 - 0.3);

    const it = { id, blockId:null, type:'image', src, x, y, w, h, rotation:r };
    items.push(it);

    const el = document.createElement('div');
    el.className = 'timeline-item';
    el.dataset.id = it.id;
    el.style.left = it.x + 'px';
    el.style.top = it.y + 'px';
    el.style.width = it.w + 'px';
    el.style.height = it.h + 'px';
    el.style.transform = `rotate(${it.rotation}rad)`;
    el.dataset.rotation = it.rotation;
    el.style.zIndex = String(10 + idx);

    const img = document.createElement('img');
    img.src = it.src;
    img.style.objectFit = 'contain';
    el.appendChild(img);

    el.addEventListener('pointerdown', onGesturePointerDown);
    el.addEventListener('pointermove', onGesturePointerMove);
    el.addEventListener('pointerup', onGesturePointerUp);
    el.addEventListener('pointercancel', onGesturePointerUp);

    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('dragstart', e => e.preventDefault());

    titlePageLayer.appendChild(el);
  });
}
  
  /* ---------- Edit Mode ---------- */
  function enterEditMode(el) {
    exitEditMode();
    editingItemEl = el;
    el.classList.add('edit-mode','editing');
    viewport.classList.add('edit-mode');
    el.style.zIndex = (++zCounter).toString();
  }

  function exitEditMode() {
    if (editingItemEl) {
      editingItemEl.classList.remove('edit-mode','editing');
      editingItemEl = null;
    }
    viewport.classList.remove('edit-mode');
  }

  /* ---------- Animation ---------- */
  function stopAnimation(){
    if (animFrameId!==null){
      cancelAnimationFrame(animFrameId);
      animFrameId=null;
    }
  }

  function runAnimation(){
    if (!blocks.length){
      alert('먼저 시간 블록에 아이템을 추가해 주세요.');
      return;
    }

    stopAnimation();
    exitEditMode();

    const mode = currentAnimationMode;
    const blocksSorted = blocks.slice().sort((a,b)=>a.startMinutes - b.startMinutes);
const viewportHeight = viewport.clientHeight;

// ✅ (변경) 실제 아이템 위치 기준으로 시작/끝 계산
const itemEls = Array.from(timeline.querySelectorAll('.timeline-item'));

// 아이템이 하나도 없으면(예외) 기존 blocks 기준으로 fallback
let contentMinTop = 0;
let contentMaxBottom = 0;

if (itemEls.length > 0) {
  const itemTops = itemEls.map(el => parseFloat(el.style.top) || 0);
  const itemBottoms = itemEls.map(el => {
    const top = parseFloat(el.style.top) || 0;
    const h = el.offsetHeight || (parseFloat(el.style.height) || 0);
    return top + h;
  });

  contentMinTop = Math.min(...itemTops);
  contentMaxBottom = Math.max(...itemBottoms);
} else {
  // fallback: 시간 블록 기준(기존 로직)
  const tops = blocks.map(b => parseFloat(b.element.style.top) || 0);
  const bottoms = blocks.map(b => {
    const top = parseFloat(b.element.style.top) || 0;
    return top + b.element.offsetHeight;
  });
  contentMinTop = Math.min(...tops);
  contentMaxBottom = Math.max(...bottoms);
}

// 끝 스크롤 위치
let endScroll = Math.max(contentMaxBottom - viewportHeight + 40, 0);

    const durationSec = parseFloat(speedInput.value) || 8;
    const durationMs = durationSec * 1000;

    const title = videoTitleInput.value.trim();
    const hasTitle = !!title;

    function clampEndToStart(start){
      if (endScroll < start) endScroll = start;
    }

    function startScrollAnimationFrom(startScroll){
      if (mode === 'scrollReveal'){
        itemEls.forEach(el=>{
          el.classList.remove('reveal-visible');
          el.classList.add('reveal-hidden');
        });
      } else {
        itemEls.forEach(el=>{
          el.classList.remove('reveal-hidden','reveal-visible');
        });
      }

      const startTime = performance.now();

      function frame(now){
        const t = Math.min(1, (now - startTime) / durationMs);
        const current = startScroll + (endScroll - startScroll) * t;

        viewport.scrollTop = current;
        highlightHourByScroll(current);

        if (mode === 'scrollReveal'){
          const triggerLine = current + viewportHeight * 0.4;

          blocksSorted.forEach(block=>{
            const blockTop = parseFloat(block.element.style.top) || 0;
            const threshold = blockTop + block.element.offsetHeight * 0.2;

            if (triggerLine >= threshold){
              items.filter(it => it.blockId === block.id).forEach(it=>{
                const el = timeline.querySelector(`.timeline-item[data-id="${it.id}"]`);
                if (el && el.classList.contains('reveal-hidden')){
                  el.classList.remove('reveal-hidden');
                  el.classList.add('reveal-visible');
                }
              });
            }
          });
        }

        if (t < 1){
          animFrameId = requestAnimationFrame(frame);
        } else {
          animFrameId = null;
          clearHourHighlight();
        }
      }

      animFrameId = requestAnimationFrame(frame);
    }

    if (hasTitle){
      titleOverlay.textContent = title;
      titleOverlay.style.display = 'flex';

      const initialScroll = Math.max(contentMinTop - viewportHeight * 0.9, 0);
      clampEndToStart(initialScroll);

      viewport.scrollTop = initialScroll;
      highlightHourByScroll(initialScroll);

      setTimeout(()=>{
        titleOverlay.style.display = 'none';
        startScrollAnimationFrom(initialScroll);
      }, 5000);

    } else {
      const startScroll = Math.max(contentMinTop - 40, 0);
      clampEndToStart(startScroll);

      viewport.scrollTop = startScroll;
      highlightHourByScroll(startScroll);
      startScrollAnimationFrom(startScroll);
    }
  }

    /* ---------- True Fullscreen (REAL) ---------- */
  function requestViewportFullscreen() {
    const el = viewport;

    const req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;

    if (!req) return Promise.reject(new Error('Fullscreen API not supported'));
    const ret = req.call(el);
    // 어떤 브라우저는 Promise를 안 줄 수 있어서 통일
    return (ret && typeof ret.then === 'function') ? ret : Promise.resolve();
  }

  function isViewportFullscreen() {
    const fsEl =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
    return fsEl === viewport;
  }

  function onFullscreenChange() {
    // 풀스크린에서 빠져나온 순간(ESC 등)
    if (!isViewportFullscreen()) {
      stopAnimation();
      clearHourHighlight();
      // 제목 오버레이가 떠있으면 안전하게 내림
      titleOverlay.style.display = 'none';
    }
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  document.addEventListener('mozfullscreenchange', onFullscreenChange);
  document.addEventListener('MSFullscreenChange', onFullscreenChange);

  /* ---------- Record Mode (Fake Fullscreen) ---------- */
  const recordExitBtn = document.getElementById('recordExitBtn');
 let recordModeReason = null; // 'titlePreview' | 'playback' | null

  function enterRecordMode(reason = 'playback') {
  recordModeReason = reason;
  document.body.classList.add('record-mode');
  const mask = viewport.querySelector('.fullscreen-mask');
  if (mask) mask.style.display = 'block';

  // ✅ 레이아웃 변경 직후(9:16 중앙정렬) 사이즈 기반 요소 재정렬
  requestAnimationFrame(() => {
    if (document.body.dataset.step === '2' && document.body.dataset.step2view === 'title') {
      // 배경 반영
      ensureTitleBgItem();
      applyTitleBgToTitlePage();
      centerTitleItemInViewport();
    }
  });
}

function exitRecordMode() {
  document.body.classList.remove('record-mode');
  stopAnimation();
  clearHourHighlight();
  const mask = viewport.querySelector('.fullscreen-mask');
  if (mask) mask.style.display = 'none';
  recordModeReason = null;
}


  /* ---------- Gestures ---------- */
  function onGesturePointerDown(e) {
  const el = e.currentTarget;
  const item = getItemByElement(el);

  // ✅ item이 없으면 early return (모바일 크래시 방지)
  if (!item) return;

  // ✅ 평상시엔 스크롤을 살려둔다 (모바일 핵심)
  const alreadyEditing = (editingItemEl === el);
  if (alreadyEditing) {
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch(_) {}
  }

  activeTouches.push({ id:e.pointerId, x:e.clientX, y:e.clientY });

  // 1 finger: long press to enter edit mode
  if (activeTouches.length === 1) {
    longPressStartPos = { x:e.clientX, y:e.clientY };
    const pid = e.pointerId;

    longPressTimer = setTimeout(() => {
      enterEditMode(el);
      try { el.setPointerCapture(pid); } catch(_) {}

      gestureState = {
        mode:'move',
        startX:e.clientX,
        startY:e.clientY,
        origX:item.x,
        origY:item.y
      };
    }, 500);
  }

if (activeTouches.length === 2 && editingItemEl === el) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  const [t1, t2] = activeTouches;
  const dx = t2.x - t1.x;
  const dy = t2.y - t1.y;

  gestureState = {
    mode:'transform',
    startDist: Math.hypot(dx,dy),
    startAngle: Math.atan2(dy,dx),
    startRotation: item.rotation || 0,
    rotationSensitivity: 0.3,
    startWidth: item.w,
    startHeight: item.h,

    // ✅ 추가: 텍스트면 폰트 사이즈도 스케일링하기 위해 저장
    itemType: item.type,
    startFontSize: (item.type === 'text' ? (item.fontSize || 24) : null)
  };
}

  }

  function onGesturePointerMove(e) {
    const el = e.currentTarget;
    const item = getItemByElement(el);

    // ✅ item이 없으면 early return (모바일 크래시 방지)
    if (!item) return;

    if (longPressTimer && longPressStartPos) {
      const dx = Math.abs(e.clientX - longPressStartPos.x);
      const dy = Math.abs(e.clientY - longPressStartPos.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressStartPos = null;
      }
    }

    activeTouches = activeTouches.map(t =>
      t.id === e.pointerId ? { ...t, x:e.clientX, y:e.clientY } : t
    );

    if (!gestureState) return;

    // move
    if (gestureState.mode === 'move' && activeTouches.length === 1 && editingItemEl === el) {
      e.preventDefault();

      const dx = e.clientX - gestureState.startX;
      const dy = e.clientY - gestureState.startY;

      const newX = gestureState.origX + dx;
      const newY = gestureState.origY + dy;

      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
      void el.offsetHeight;

      item.x = newX;
      item.y = newY;
    }

    // transform
    if (gestureState.mode === 'transform' && activeTouches.length === 2 && editingItemEl === el) {
  e.preventDefault();

  const [t1, t2] = activeTouches;
  const dx = t2.x - t1.x;
  const dy = t2.y - t1.y;

  const dist = Math.hypot(dx,dy);
  const scale = dist / gestureState.startDist;

  const angle = Math.atan2(dy,dx);
  const angleDiff = angle - gestureState.startAngle;
  const rotation = gestureState.startRotation + (angleDiff * gestureState.rotationSensitivity);

  const newW = gestureState.startWidth * scale;
  const newH = gestureState.startHeight * scale;

  el.style.width = `${newW}px`;
  el.style.height = `${newH}px`;
  el.style.transform = `rotate(${rotation}rad)`;
  void el.offsetHeight;

  item.w = newW;
  item.h = newH;
  item.rotation = rotation;

  // ✅ 추가: 텍스트는 폰트 크기도 같이 스케일
  if (gestureState.itemType === 'text') {
    const minFont = 24;
    const maxFont = 160; // 필요하면 조절
    const newFont = clamp(Math.round(gestureState.startFontSize * scale), minFont, maxFont);

    item.fontSize = newFont;
    const t = el.querySelector('.timeline-item-text');
    if (t) t.style.fontSize = newFont + 'px';
  }
}

  }

  function onGesturePointerUp(e) {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressStartPos = null;

    activeTouches = activeTouches.filter(t => t.id !== e.pointerId);

    if (activeTouches.length === 0) {
      gestureState = null;
        // ✅ [추가] title-item을 사용자가 실제로 건드렸으면 이후엔 중앙정렬 안 함
    if (editingItemEl && editingItemEl.dataset.id === 'title-item') {
      titleItemUserMoved = true;
    }
      // ✅ 드래그/핀치/회전 조작이 끝나는 순간 즉시 저장 + 3분 백업 예약
    }
  }

  /* ---------- Events ---------- */
 // 초기 적용(저장 없이 UI만 반영)
applyTitleFontUI(currentTitleFont);
applyTextFontUI(currentTextFont);

buildTimeOptions();

// ✅ 초기화
resetTimelineDataAndDom();

const today = new Date().toISOString().slice(0,10);
dateInput.value = today;
headerLabel.textContent = today + ' 타임라인';
updateHeaderDateByScroll(viewport.scrollTop);

// 기본 상태 반영
applyItemTypeUI(currentItemType);
applyAnimationModeUI(currentAnimationMode);

updateStep2SubNavVisibility();

dateInput.addEventListener('change', () => {
  resetTimelineDataAndDom();
  updateHeaderDateByScroll(viewport.scrollTop);
});


 videoTitleInput.addEventListener('input', () => {
  // ✅ 제목이 있으면 titleItem 준비 + 텍스트 싱크
  if (hasVideoTitle()) {
    ensureTitleItem();
    syncTitleItemText();
    applyTitleItemStyles();
  }

  // ✅ step2에서만 조건부로 서브탭 보이게
  updateStep2SubNavVisibility();

});

  
  datePickerBtn.addEventListener('click', () => {
    if (typeof dateInput.showPicker === 'function') dateInput.showPicker();
    else { dateInput.focus(); dateInput.click(); }
  });

  startTimeSelect.addEventListener('change', () => {
    updateEndTimeOptions(parseInt(startTimeSelect.value,10));
  });

  itemTypeButtons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      itemTypeButtons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentItemType = btn.dataset.type;

      if (currentItemType==='text') {
        textInputGroup.style.display='block';
        imageInputGroup.style.display='none';
      } else {
        textInputGroup.style.display='none';
        imageInputGroup.style.display='block';
      }
    });
  });

  animationModeButtons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      animationModeButtons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentAnimationMode = btn.dataset.mode;
    });
  });

  // 기본 표시 상태
  textInputGroup.style.display='none';
  imageInputGroup.style.display='block';

 // ✅ speed 표시: 처음에도 값 보이게
speedLabel.textContent = speedInput.value + '초';

// ✅ speed 변경 시 라벨 갱신 (한 번만 등록)
speedInput.addEventListener('input', () => {
  speedLabel.textContent = speedInput.value + '초';
});

// ✅ 아이템 추가 (원래 로직 click 핸들러)
addItemBtn.addEventListener('click', () => {
  const startMinutes = parseInt(startTimeSelect.value,10);
  const endMinutes = parseInt(endTimeSelect.value,10);

  if (isNaN(startMinutes)||isNaN(endMinutes)||endMinutes<=startMinutes){
    alert('시작/끝 시간을 올바르게 선택해주세요.');
    return;
  }

  const itemData = {
    id:'item-'+Date.now()+'-'+Math.random().toString(16).slice(2),
    blockId:null,
    type:'',
    x:0,y:0,w:0,h:0,
    rotation:0
  };

  let itemType;

  if (currentItemType==='text'){
    const text = textContentInput.value.trim();
    if (!text){ alert('텍스트를 입력해주세요.'); return; }
    itemType='text';
    itemData.text=text;
    itemData.fontKey = currentTextFont;
  } else {
    const file = itemFileInput.files[0];
    if (!file){ alert('파일을 선택해주세요.'); return; }
    itemData.src = URL.createObjectURL(file);
    itemType = file.type.startsWith('video/') ? 'video' : 'image';
  }

  itemData.type=itemType;

  // ✅ 여기 로직도 현재 코드랑 필드명이 안 맞음(아래 3번 참고)
  const block = blocks.find(b => b.startMinutes === startMinutes && b.endMinutes === endMinutes);
  if (!block){
    alert('해당 시간 구간의 블록을 찾을 수 없습니다.\n(블록 생성/시간 선택을 확인해주세요)');
    return;
  }

  itemData.blockId = block.id;

  // --- 기본 크기/위치 세팅 ---
  const blockEl = document.querySelector(`.time-block[data-id="${block.id}"]`);
  if (blockEl){
    const blockRect = blockEl.getBoundingClientRect();
    const vpRect = viewport.getBoundingClientRect();

    const blockTop = (blockRect.top - vpRect.top) + viewport.scrollTop;
    const w = Math.max(120, Math.min(420, blockRect.width*0.7));
    const h = Math.max(MIN_ITEM_HEIGHT, Math.max(80, blockRect.height*0.5));

    itemData.w=w; itemData.h=h;
    itemData.x=70 + (blockRect.width-w)/2;
    itemData.y=blockTop + (blockRect.height-h)/2;
  }

  items.push(itemData);
  createItemElement(itemData);

  scrollToBlock(block.id);

  if (itemType==='image'||itemType==='video') itemFileInput.value='';
  updateBlockList();
});


  playBtn.addEventListener('click', runAnimation);

   playFullscreenBtn.addEventListener('click', async () => {
    // 먼저 편집/애니메이션 상태 정리
    stopAnimation();
    exitEditMode();

    try {
      // ✅ 진짜 전체화면 요청
      await requestViewportFullscreen();
    } catch (err) {
      // ✅ Fullscreen API 미지원/차단이면 기존 방식으로 fallback
      enterRecordMode('playback');
    }

    // ✅ 레이아웃 변경(전체화면) 반영 후 재생 시작
    requestAnimationFrame(() => requestAnimationFrame(() => runAnimation()));
  });


  recordExitBtn.addEventListener('click', () => {
  if (recordModeReason === 'titlePreview') {
    // ✅ Step2 "타임라인 편집" 탭으로 자동 이동
    exitRecordMode();
    setStep2View('timeline');
  } else {
    // (기존) 재생 fallback record-mode 종료
    exitRecordMode();
  }
});

  document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (recordModeReason === 'titlePreview') {
      exitRecordMode();
      setStep2View('timeline');
    } else {
      exitRecordMode();
    }
  }
});

  viewport.addEventListener('scroll',()=>{
    if (animFrameId===null) highlightHourByScroll(viewport.scrollTop);
  });

 stepButtons.forEach(btn=>{
  btn.addEventListener('click',()=>{
    const step = btn.dataset.step;

    stepButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');

    Object.entries(stepPanels).forEach(([key,p])=>{
      if (key===step) p.classList.add('active');
      else p.classList.remove('active');
    });

    document.body.dataset.step = step;

    // ✅ step2 진입/이탈 시 서브탭 표시 조건 갱신
    updateStep2SubNavVisibility();

    // ✅ [추가] Step2 들어오면 무조건 "타임라인 편집"부터
    if (step === '2') {
      // titlePreview record-mode 잔상 제거
      if (document.body.classList.contains('record-mode')) exitRecordMode();

      // 서브탭이 보여도 기본은 timeline
      setStep2View('timeline');
    } else {
      // step2 밖에서는 title 레이어/record-mode가 남지 않게
      if (document.body.classList.contains('record-mode')) exitRecordMode();
      document.body.dataset.step2view = 'timeline';
      if (titlePageLayer) titlePageLayer.style.display = 'none';
      showTitleItem(false);
      showTitleBgItem(false);
    }

  });
});


  // ✅ Step2 서브탭 클릭
step2SubNav.querySelectorAll('.sub-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    setStep2View(btn.dataset.view);
  });
});

themeToggleBtn.addEventListener('click', () => {
  const body = document.body;
  // ✅ 수정: theme-light 클래스만 토글 (CSS에 theme-dark 스타일 없음)
  if (body.classList.contains('theme-light')) {
    body.classList.remove('theme-light');
    themeToggleBtn.textContent = '라이트 모드';
  } else {
    body.classList.add('theme-light');
    themeToggleBtn.textContent = '다크 모드';
  }
});

  /* ---------- Title BG State ---------- */
  function applyTitleBgToOverlay(){
    if (!titleBgDataUrl) {
      titleOverlay.classList.remove('has-bg');
      titleOverlay.style.removeProperty('--title-bg-url');
      return;
    }
    titleOverlay.classList.add('has-bg');
    titleOverlay.style.setProperty('--title-bg-url', `url("${titleBgDataUrl}")`);
    applyTitleBgToTitlePage(); // ✅ titlePageLayer에도 같이 반영
  }

  // ✅ Title 편집 화면(titlePageLayer) 배경 반영
function applyTitleBgToTitlePage(){
  // 배경이 없으면 아무것도 안 함
  if (!titleBgDataUrl) return;
  // 배경 이미지는 ensureTitleBgItem()에서 이미 처리됨
}

function refreshTitleBgMetaUI(){
  if (!titleBgDataUrl) {
    titleBgMeta.style.display = 'none';
    titleBgName.textContent = '';
    return;
  }
  titleBgMeta.style.display = 'flex';
}

function readAsDataURL(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error || new Error('read failed'));
    r.readAsDataURL(file);
  });
}

async function setTitleBgFiles(fileList){
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const urls = await Promise.all(files.map(f => readAsDataURL(f)));

  titleBgList = urls;
  titleBgDataUrl = urls[0] || null;

  // 파일명 표시(첫번째 기준)
  titleBgName.textContent =
    (files[0].name || '선택된 이미지') + (files.length > 1 ? ` (+${files.length-1})` : '');

  refreshTitleBgMetaUI();
  applyTitleBgToOverlay();     // ✅ 애니메이션 titleOverlay에도 그대로 적용됨

  // ✅ 타이틀 페이지 아이템으로 반영
  ensureTitleBgItem();         // 첫번째는 9:16 꽉 채우는 메인 배경
  clearExtraTitleBgItems();
  scatterExtraTitleBgItems(urls.slice(1)); // 나머지는 랜덤 흩뿌리기
}

})();

/* =========================
   STEP1: 딤/블러 완전 비활성화(모바일 터치 보호)
   - 함수명이 뭐든 상관없이 input/change/click을 캡처 단계에서 차단
   - data-step 변하면 자동으로 다시 적용
   ========================= */

(function step1DisableDimBlur(){
  const STEP_ATTR = 'data-step';

  const isStep1 = () => document.body?.getAttribute(STEP_ATTR) === '1';

  // ✅ 네 코드에서 실제로 쓰는 id가 다르면 여기만 바꾸면 끝
  const dimBlurIds = new Set([
    'pvDimRange', 'pvBlurRange',   // range
    'pvDimPill',  'pvBlurPill',    // pill
  ]);

  const isDimBlurEl = (el) => {
    if (!el) return false;
    // target이 input 자체거나, 그 안쪽 span 등일 수도 있으니 closest로도 체크
    const t = el.closest?.('[id]') || el;
    return !!t?.id && dimBlurIds.has(t.id);
  };

  const applyLock = () => {
    const lock = isStep1();

    dimBlurIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      // STEP1에서는 "안 보여야" 한다고 했으니 숨김
      el.style.display = lock ? 'none' : '';

      // 혹시 display 숨김으로도 이벤트가 들어오는 케이스 방지
      el.style.pointerEvents = lock ? 'none' : '';
      if ('disabled' in el) el.disabled = lock;
    });
  };

  // ✅ 캡처 단계에서 선빵쳐서 막기 (기존 리스너가 뭐든 상관없음)
  const stopIfStep1 = (e) => {
    if (!isStep1()) return;
    if (!isDimBlurEl(e.target)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  // input/change는 range 조작, click/touchstart는 모바일 터치 선차단
  document.addEventListener('input', stopIfStep1, true);
  document.addEventListener('change', stopIfStep1, true);
  document.addEventListener('click', stopIfStep1, true);
  document.addEventListener('touchstart', stopIfStep1, { capture: true, passive: false });

  // ✅ step 변경될 때마다 자동 적용
  const mo = new MutationObserver(() => applyLock());
  mo.observe(document.body, { attributes: true, attributeFilter: [STEP_ATTR] });

  // 최초 1회 적용
  applyLock();
})();


