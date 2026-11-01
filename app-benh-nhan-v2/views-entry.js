'use strict';
// Nhập số: huyết áp, đo 3 lần, đường huyết, cân nặng, ô số chung.

function keypad(left, right) {
  const k = n => `<button class="key" data-a="key" data-p="${n}" aria-label="Số ${n}">${n}</button>`;
  return `<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k).join('')}${left || '<span></span>'}${k(0)}${right || '<button class="key ghost" data-a="key" data-p="del">Xóa</button>'}</div>`;
}

// ---- Huyết áp ----
A.startBP = id => {
  const p = P();
  if (id) { const r = p.bp.find(x => x.id === id); S.ui.bp = { sys: String(r.sys), dia: String(r.dia), focus: 'sys', editId: id }; }
  else S.ui.bp = { sys: '', dia: '', focus: 'sys' };
  S.ui.keyTarget = 'bp';
  S.sheet = null;
  go('bpEntry');
};
function bpComplete(field, s) {
  if (field === 'sys') return s.length === 3 || (s.length === 2 && '6789'.includes(s[0]));
  return s.length === 3 || (s.length === 2 && s[0] !== '1');
}
function bpKey(st, k) {
  if (k === 'del') {
    if (st[st.focus].length) st[st.focus] = st[st.focus].slice(0, -1);
    else if (st.focus === 'dia') st.focus = 'sys';
    return;
  }
  const f = st.focus;
  if (bpComplete(f, st[f])) st[f] = '';
  st[f] += k;
  if (f === 'sys' && bpComplete('sys', st.sys) && !st.dia) st.focus = 'dia';
}
A.key = k => {
  const t = S.ui.keyTarget;
  if (t === 'bp') bpKey(S.ui.bp, k);
  else if (t === 'guide') bpKey(S.ui.g, k);
  else if (t === 'riskNum') { if (k === 'del') S.ui.riskNum = (S.ui.riskNum || '').slice(0, -1); else if ((S.ui.riskNum || '').length < 3) S.ui.riskNum = (S.ui.riskNum || '') + k; }
  else if (t === 'glu') { const g = S.ui.glu; if (k === 'del') g.digits = g.digits.slice(0, -1); else if (g.digits.length < 4) g.digits += k; }
  else if (t === 'num') {
    const n = S.ui.num;
    if (k === 'del') n.text = n.text.slice(0, -1);
    else if (k === ',') { if (!n.text.includes(',') && n.text) n.text += ','; }
    else if (n.text.replace(',', '').length < (n.maxLen || 4)) n.text += k;
    if (n.auto && n.text.length === n.auto && k !== 'del') { render(); return A.numSave(); }
  }
  S.navFocus = false; render();
};
A.bpFocus = f => { (S.ui.keyTarget === 'guide' ? S.ui.g : S.ui.bp).focus = f; render(); };

function bpBoxes(st) {
  const box = (f, label) => `<button class="bpbox ${st.focus === f ? 'on' : ''}" data-a="bpFocus" data-p="${f}" aria-label="${label}"><span class="k">${label}</span><span class="v ${st[f] ? '' : 'empty'}">${st[f] || '_ _'}</span></button>`;
  return `<div class="bp">${box('sys', 'Số trên')}${box('dia', 'Số dưới')}</div>`;
}
V.bpEntry = () => {
  const st = S.ui.bp, p = P();
  const last = lastOf(p.bp);
  let h = topBar({ close: true });
  h += `<h1 class="t small">${st.editId ? 'Sửa số huyết áp' : 'Ghi huyết áp'}</h1>`;
  h += `<div class="sub" style="margin-top:-.4rem">${st.note ? esc(st.note) : last ? `Lần trước ${last.sys}/${last.dia}` : 'Trên máy đo có hai số. Nhập số trên trước.'}</div>`;
  h += bpBoxes(st);
  h += keypad('<button class="key ghost" data-a="sheetHowTo">Cách đo</button>');
  h += `<button class="btn" data-a="bpSave" ${st.sys && st.dia && bpComplete('dia', st.dia) ? '' : 'disabled'}>Lưu</button>`;
  if (!st.editId) h += `<div class="yn"><button class="btn sec small" data-a="startGuide">Đo 3 lần cùng app</button><button class="btn sec small" data-a="bpPhoto">${icon('camera')}Chụp máy đo</button></div>`;
  return { chrome: 'modal', html: h };
};
A.bpPhoto = () => dialog({ title: 'Chụp máy đo (mô phỏng)', body: '<p class="sub ink">Trên điện thoại thật, app đọc số từ ảnh chụp máy đo. Bản demo giả định đọc được <b>126/78</b>. Bạn luôn phải kiểm tra lại số trước khi lưu.</p>', buttons: [{ label: 'Dùng số này', a: 'bpPhotoUse' }, { label: 'Thôi', a: 'closeDialog', cls: 'sec' }] });
A.bpPhotoUse = () => { S.dialog = null; Object.assign(S.ui.bp, { sys: '126', dia: '78', focus: 'dia', note: 'Số đọc từ ảnh. Hãy kiểm tra lại rồi bấm Lưu.' }); render(); };
A.sheetHowTo = () => openSheet('howTo');
V.howTo = () => ({ title: 'Cách đo huyết áp', html: `<button class="navbtn" data-a="closeSheet">Đóng</button><div class="q">Cách đo huyết áp tại nhà</div>
  <div style="display:flex;flex-direction:column;gap:.5rem">${HOWTO.map(s => `<div class="ct">${icon('check', 'green')}<span>${s}</span></div>`).join('')}</div>
  <div class="card"><div class="sub ink"><b>Chỉ số tốt:</b> số trên dưới 130 và số dưới dưới 80 mmHg. Mức này có thể điều chỉnh theo tuổi và bệnh nền, hãy theo mục tiêu bác sĩ dặn.</div></div>` });
const HOWTO = ['Nghỉ ngơi 5 phút, không hút thuốc, cà phê, ăn hay tập thể dục 30 phút trước khi đo.', 'Ngồi thẳng, tay ngang tim, không bị gò bó, chân đặt trên sàn.', 'Đo 3 lần, mỗi lần cách nhau 1 phút.', 'Ghi lại trung bình 2 lần đo cuối. App tính giúp nếu bạn chọn đo cùng app.', 'Không nói chuyện khi đo.'];

function bpStore(sys, dia, src) {
  const p = P(), st = S.ui.bp;
  const cur = currentMoment(dayPlan(p, nowMs()));
  if (st && st.editId) {
    const r = p.bp.find(x => x.id === st.editId); r.sys = sys; r.dia = dia; r.edited = true;
    persist(); return r;
  }
  const r = { id: `b${Date.now()}`, t: nowMs(), sys, dia, moment: cur && cur.items.some(i => i.kind === 'bp') ? cur.key : nearestMoment(), by: whoEntered(), src: src || 'manual' };
  p.bp.push(r); p.recheckAt = null; D.bpSaved++;
  persist(); return r;
}
function nearestMoment() {
  const h = new Date(nowMs()).getHours();
  return h < 11 ? 'sang' : h < 14 ? 'trua' : h < 19 ? 'chieu' : 'toi';
}
A.bpSave = () => {
  const st = S.ui.bp, sys = Number(st.sys), dia = Number(st.dia), issues = bpIssues(sys, dia);
  if (issues.length) {
    return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="sub ink">${issues.map(esc).join('<br>')}</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, vẫn lưu', a: 'bpSaveForce', cls: 'sec' }] });
  }
  finishBP(sys, dia);
};
A.bpSaveForce = () => { S.dialog = null; finishBP(Number(S.ui.bp.sys), Number(S.ui.bp.dia)); };
function finishBP(sys, dia, src) { const r = bpStore(sys, dia, src); replaceTop('bpResult', { id: r.id }); }

V.bpResult = ({ id }) => {
  const p = P(), r = p.bp.find(x => x.id === id), key = bpStatus(r.sys, r.dia), tr = bpTrend(p.bp, nowMs());
  const danger = key === 'high' || key === 'low';
  let h = `<div class="center" style="padding-top:1.1rem"><div class="sub" style="font-weight:600">Huyết áp ${whenWord(r.t)}</div><div class="num" style="margin-top:.3rem">${r.sys}/${r.dia}</div></div>`;
  if (key === 'high') {
    h = topBar({ close: true, closeA: 'home', closeLabel: ' ' }) + h;
    h += `<div class="center"><span class="pill bg-amber">${icon('alert')}Huyết áp đang rất cao</span></div>`;
    h += `<div class="card"><div class="big">Hãy ngồi yên, nghỉ 5 phút rồi đo lại.</div><div class="sub ink" style="margin-top:.6rem;font-weight:600">Gọi 115 ngay nếu có một trong các dấu hiệu:</div><div class="sub ink" style="margin-top:.2rem">Méo miệng, yếu hoặc tê một bên, nói khó, mắt mờ đột ngột, chóng mặt nặng, đau đầu dữ dội.</div></div>`;
    h += `<button class="btn red" data-a="call" data-p="115">${icon('phone')}Gọi 115</button><button class="btn" data-a="bpRecheck">Đo lại sau 5 phút</button><button class="btn sec small" data-a="call" data-p="${esc(p.careTeam.phone)}|bác sĩ">Gọi bác sĩ</button>`;
  } else if (key === 'low') {
    h = topBar({ close: true, closeA: 'home', closeLabel: ' ' }) + h;
    h += `<div class="center"><span class="pill bg-amber">${icon('alert')}Huyết áp đang thấp</span></div>`;
    h += `<div class="card"><div class="big">Hãy ngồi hoặc nằm nghỉ, rồi đo lại sau 5 phút.</div><div class="sub ink" style="margin-top:.6rem">Nếu vẫn thấp, hoặc bạn thấy choáng, sắp ngất, hãy gọi bác sĩ. Gọi 115 nếu có dấu hiệu đột quỵ hoặc ngất.</div></div>`;
    h += `<button class="btn" data-a="bpRecheck">Đo lại sau 5 phút</button><button class="btn sec small" data-a="call" data-p="${esc(p.careTeam.phone)}|bác sĩ">Gọi bác sĩ</button><button class="btn red small" data-a="call" data-p="115">${icon('phone')}Gọi 115</button>`;
  } else {
    h += `<div class="center"><span class="pill ${key === 'good' ? 'bg-green' : 'bg-amber'}">${icon(key === 'good' ? 'check' : 'up')}${key === 'good' ? 'Tốt, trong mục tiêu' : 'Cần cải thiện'}</span></div>`;
    h += `<div class="card"><div class="big">${key === 'good' ? BRD.bpGood : BRD.bpImprove}</div>${key === 'improve' ? `<button class="link left" data-a="go" data-p="article:bp">Cách kiểm soát huyết áp</button>` : ''}</div>`;
    h += `<div class="card"><div class="mid">${esc(bpTrendSentence(tr))}</div>${bpSpark(p)}</div>`;
  }
  if (r.by !== 'self') h += `<p class="note center">Ghi là do ${esc(r.by)} nhập.</p>`;
  if (!danger) h += '<div class="spacer"></div>';
  h += `<button class="link" data-a="bpFix" data-p="${r.id}">Nhập nhầm? Sửa số</button>`;
  if (!danger) h += '<button class="btn" data-a="home">Xong</button>';
  else h += '<button class="link" data-a="home">Về Hôm nay</button>';
  return { chrome: 'modal', html: h };
};
function bpSpark(p) {
  const ms = nowMs(), rs = p.bp.filter(r => r.t > ms - 7 * 864e5 && r.t <= ms).sort((a, b) => a.t - b.t);
  if (rs.length < 4) return '';
  const syss = rs.map(r => r.sys);
  return lineChart({ h: 92, label: `Số trên trong 7 ngày, gần nhất ${syss[syss.length - 1]}`, xMin: ms - 7 * 864e5, xMax: ms, yMin: Math.min(115, ...syss) - 4, yMax: Math.max(135, ...syss) + 4, lines: [{ v: 130, t: '130' }], series: [{ pts: rs.map(r => [r.t, r.sys]), color: 'var(--blue)' }] });
}
A.bpFix = id => { S.ui.bp = { sys: '', dia: '', focus: 'sys', editId: id }; const r = P().bp.find(x => x.id === id); S.ui.bp.sys = String(r.sys); S.ui.bp.dia = String(r.dia); S.ui.keyTarget = 'bp'; replaceTop('bpEntry'); };
A.bpRecheck = () => { const p = P(); p.recheckAt = nowMs() + 5 * 6e4; persist(); A.home(); toast('Nghỉ 5 phút rồi đo lại nhé'); };

// ---- Đo 3 lần cùng app: hẹn giờ và tự tính trung bình 2 lần cuối, theo hướng dẫn trong BRD ----
let guideTimer = null;
A.startGuide = () => { S.ui.g = { step: 0, reads: [], sys: '', dia: '', focus: 'sys', wait: 0 }; S.ui.keyTarget = 'guide'; replaceTop('bpGuide'); };
function runWait(sec, onDone) {
  clearInterval(guideTimer);
  const g = S.ui.g; g.wait = sec; g.onDone = onDone; render();
  guideTimer = setInterval(() => {
    g.wait--;
    const el = document.getElementById('cd');
    if (el) el.textContent = `${Math.floor(g.wait / 60)}:${pad2(g.wait % 60)}`;
    if (g.wait <= 0) { clearInterval(guideTimer); g.wait = 0; render(); }
  }, 1000);
}
A.gRest = () => runWait(300);
A.gSkip = () => { clearInterval(guideTimer); S.ui.g.wait = 0; render(); };
A.gBegin = () => { const g = S.ui.g; g.step = 1; render(); };
A.gNext = () => {
  const g = S.ui.g;
  const sys = Number(g.sys), dia = Number(g.dia), issues = bpIssues(sys, dia);
  if (issues.length) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="sub ink">${issues.map(esc).join('<br>')}</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, tiếp tục', a: 'gNextForce', cls: 'sec' }] });
  gAdvance();
};
A.gNextForce = () => { S.dialog = null; gAdvance(); };
function gAdvance() {
  const g = S.ui.g;
  g.reads.push([Number(g.sys), Number(g.dia)]); g.sys = ''; g.dia = ''; g.focus = 'sys';
  g.step = g.reads.length >= 3 ? 4 : g.reads.length + 1;
  if (g.step <= 3) runWait(60); else render();
}
A.gFinish = () => {
  const g = S.ui.g, l = g.reads.slice(-2);
  S.ui.bp = {};
  finishBP(Math.round(mean(l.map(x => x[0]))), Math.round(mean(l.map(x => x[1]))), 'guided');
};
V.bpGuide = () => {
  const g = S.ui.g;
  let h = topBar({ close: true, closeA: 'gClose' });
  if (g.wait > 0) {
    h += `<h1 class="t small">${g.step === 0 ? 'Nghỉ 5 phút' : `Chờ trước lần đo ${g.step}`}</h1><div class="spacer"></div><div class="center"><div class="num" id="cd" style="font-size:5rem">${Math.floor(g.wait / 60)}:${pad2(g.wait % 60)}</div><div class="sub" style="margin-top:.5rem">Ngồi yên, không nói chuyện.</div></div><div class="spacer"></div><button class="btn sec" data-a="gSkip">Bỏ qua, đo luôn</button>`;
    return { chrome: 'modal', html: h };
  }
  if (g.step === 0) {
    h += `<h1 class="t small">Đo 3 lần cùng app</h1><div class="sub ink">App hẹn giờ và tự tính trung bình 2 lần cuối, bạn không phải tính.</div><div style="display:flex;flex-direction:column;gap:.5rem">${HOWTO.slice(0, 2).concat(HOWTO[4]).map(s => `<div class="ct">${icon('check', 'green')}<span>${s}</span></div>`).join('')}</div><div class="spacer"></div><button class="btn" data-a="gBegin">Tôi đã nghỉ, bắt đầu đo</button><button class="btn sec small" data-a="gRest">${icon('clock')}Hẹn giờ nghỉ 5 phút</button>`;
    return { chrome: 'modal', html: h };
  }
  if (g.step === 4) {
    const l = g.reads.slice(-2), s = Math.round(mean(l.map(x => x[0]))), d = Math.round(mean(l.map(x => x[1])));
    h += `<h1 class="t small">Trung bình 2 lần cuối</h1><div class="center"><div class="num">${s}/${d}</div></div><div class="rows">${g.reads.map((r, i) => row({ n: `Lần ${i + 1}`, val: `${r[0]}/${r[1]}` })).join('')}</div><div class="spacer"></div><button class="btn" data-a="gFinish">Lưu số này</button>`;
    return { chrome: 'modal', html: h };
  }
  h += `<div class="prog">${[1, 2, 3].map(i => `<i class="${i <= g.step ? 'on' : ''}"></i>`).join('')}</div><h1 class="t small">Lần đo ${g.step} trong 3</h1>`;
  h += bpBoxes(g) + keypad();
  h += `<button class="btn" data-a="gNext" ${g.sys && g.dia && bpComplete('dia', g.dia) ? '' : 'disabled'}>${g.step === 3 ? 'Xong' : 'Tiếp'}</button>`;
  return { chrome: 'modal', html: h };
};
A.gClose = () => { clearInterval(guideTimer); S.ui.keyTarget = 'bp'; A.back(); };

// ---- Đường huyết ----
const gluUnit = () => D.settings.gluUnit === 'mg' ? 'mg/dL' : 'mmol/L';
function gluShow(v) { return D.settings.gluUnit === 'mg' ? `${Math.round(v * MOL_TO_MG)} mg/dL` : `${dec(Number(v).toFixed(1))} mmol/L`; }
A.startGlu = () => {
  const h = new Date(nowMs()).getHours();
  S.ui.glu = { digits: '', fasting: h < 10 }; S.ui.keyTarget = 'glu'; go('gluEntry');
};
function gluParse(g) {
  if (!g.digits) return null;
  if (D.settings.gluUnit === 'mg') return Number(g.digits) / MOL_TO_MG;
  return g.digits.length === 1 ? Number(g.digits) : Number(g.digits) / 10;
}
function gluText(g) {
  if (!g.digits) return '_ _';
  if (D.settings.gluUnit === 'mg' || g.digits.length === 1) return g.digits;
  return `${g.digits.slice(0, -1)},${g.digits.slice(-1)}`;
}
V.gluEntry = () => {
  const g = S.ui.glu, last = lastOf(P().glucose);
  let h = topBar({ close: true }) + '<h1 class="t small">Ghi đường huyết</h1>';
  h += `<div class="sub" style="margin-top:-.4rem">${last ? `Lần trước ${gluShow(last.v)}` : 'Nhập số trên máy thử đường'}</div>`;
  h += `<div class="bpbox on"><span class="k">Đường huyết (${gluUnit()})</span><span class="v ${g.digits ? '' : 'empty'}">${gluText(g)}</span></div>`;
  h += `<div class="yn"><button class="chip ${g.fasting ? 'on' : ''}" aria-pressed="${g.fasting}" data-a="gluFast" data-p="1">Lúc đói</button><button class="chip ${!g.fasting ? 'on' : ''}" aria-pressed="${!g.fasting}" data-a="gluFast" data-p="0">Sau ăn</button></div>`;
  h += keypad();
  h += `<button class="btn" data-a="gluSave" ${g.digits ? '' : 'disabled'}>Lưu</button>`;
  return { chrome: 'modal', html: h };
};
A.gluFast = v => { S.ui.glu.fasting = v === '1'; render(); };
A.gluSave = () => {
  const v = gluParse(S.ui.glu);
  if (v < TH.glu.min || v > TH.glu.max) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="sub ink">Số ${esc(gluText(S.ui.glu))} ${gluUnit()} có vẻ không đúng.</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, vẫn lưu', a: 'gluSaveForce', cls: 'sec' }] });
  gluFinish(v);
};
A.gluSaveForce = () => { S.dialog = null; gluFinish(gluParse(S.ui.glu)); };
function gluFinish(v) {
  const p = P(), g = S.ui.glu, cur = currentMoment(dayPlan(p, nowMs()));
  const r = { id: `g${Date.now()}`, t: nowMs(), v: Math.round(v * 10) / 10, fasting: g.fasting, moment: cur ? cur.key : nearestMoment(), by: whoEntered() };
  p.glucose.push(r); persist(); replaceTop('gluResult', { id: r.id });
}
V.gluResult = ({ id }) => {
  const p = P(), r = p.glucose.find(x => x.id === id), key = gluStatus(r.v, r.fasting);
  const num = D.settings.gluUnit === 'mg' ? `${Math.round(r.v * MOL_TO_MG)}` : dec(r.v.toFixed(1));
  let h = `<div class="center" style="padding-top:1.1rem"><div class="sub" style="font-weight:600">Đường huyết ${r.fasting ? 'lúc đói' : 'sau ăn'}</div><div class="num" style="margin-top:.3rem">${num} <small>${gluUnit()}</small></div></div>`;
  const doc = `<button class="btn sec small" data-a="call" data-p="${esc(p.careTeam.phone)}|bác sĩ">Gọi bác sĩ</button>`;
  if (key === 'critical') {
    h = topBar({ close: true, closeA: 'home', closeLabel: ' ' }) + h + `<div class="center"><span class="pill bg-amber">${icon('alert')}Đường huyết rất cao</span></div><div class="card"><div class="big">Số này cần được xử trí ngay.</div><div class="sub ink" style="margin-top:.4rem">Hãy gọi 115 hoặc nhờ người đưa đến cơ sở y tế. Nếu bạn nghi máy đo sai, có thể đo lại ngay, nhưng đừng chờ lâu.</div></div><button class="btn red" data-a="call" data-p="115">${icon('phone')}Gọi 115</button>${doc}`;
  } else if (key === 'high') {
    h = topBar({ close: true, closeA: 'home', closeLabel: ' ' }) + h + `<div class="center"><span class="pill bg-amber">${icon('alert')}Đường huyết đang rất cao</span></div><div class="card"><div class="big">Hãy gọi bác sĩ trong hôm nay.</div><div class="sub ink" style="margin-top:.4rem">Gọi 115 nếu bạn thấy lơ mơ, rất mệt, nôn nhiều hoặc có dấu hiệu đột quỵ.</div></div><button class="btn" data-a="call" data-p="${esc(p.careTeam.phone)}|bác sĩ">${icon('phone')}Gọi bác sĩ</button><button class="btn red small" data-a="call" data-p="115">${icon('phone')}Gọi 115</button>`;
  } else if (key === 'low') {
    h = topBar({ close: true, closeA: 'home', closeLabel: ' ' }) + h + `<div class="center"><span class="pill bg-amber">${icon('alert')}Đường huyết đang thấp</span></div><div class="card"><div class="big">Nếu đang tỉnh táo, hãy ăn hoặc uống thứ có đường, rồi đo lại sau 15 phút.</div><div class="sub ink" style="margin-top:.4rem">Gọi 115 nếu lơ mơ hoặc ngất.</div></div>${doc}<button class="btn red small" data-a="call" data-p="115">${icon('phone')}Gọi 115</button>`;
  } else {
    h += `<div class="center">${key === 'none' ? '<span class="pill bg-muted">Đã lưu</span>' : `<span class="pill ${key === 'good' ? 'bg-green' : 'bg-amber'}">${icon(key === 'good' ? 'check' : 'up')}${key === 'good' ? 'Tốt' : 'Cần cải thiện'}</span>`}</div>`;
    h += `<div class="card"><div class="mid">${key === 'good' ? 'Đường huyết lúc đói của bạn đang tốt. Hãy duy trì nhé!' : key === 'improve' ? 'Đường huyết lúc đói của bạn hơi cao. Hãy theo dõi thường xuyên và tham khảo ý kiến bác sĩ.' : 'Số này đã vào lịch sử để bác sĩ xem cùng các lần khác.'}</div></div><div class="spacer"></div>`;
  }
  h += `<button class="btn" data-a="home">Xong</button>`;
  return { chrome: 'modal', html: h };
};

// ---- Cân nặng: dùng nút tăng giảm vì thay đổi ít ----
A.startWeight = () => { const p = P(); const l = lastOf(p.weights); S.ui.w = { v: l ? l.v : (p.weight || 60) }; go('weightEntry'); };
V.weightEntry = () => {
  const w = S.ui.w, p = P(), b = bmiOf(p.height, w.v), bs = bmiStatus(b);
  let h = topBar({ close: true }) + '<h1 class="t small">Ghi cân nặng</h1><div class="sub" style="margin-top:-.4rem">Số lần trước đã điền sẵn, chỉ chỉnh nếu khác.</div>';
  h += `<div class="stepper"><button class="sb" data-a="wStep" data-p="-0.5" aria-label="Giảm nửa ký">${icon('minus')}</button><div class="center"><div class="num" style="font-size:3.25rem">${dec(w.v)}</div><div class="sub">kg</div></div><button class="sb" data-a="wStep" data-p="0.5" aria-label="Tăng nửa ký">${icon('plus')}</button></div>`;
  h += `<div class="card center"><div class="mid">BMI ${b ? dec(b.toFixed(1)) : 'chưa có'}: ${esc(bs.word)}</div><div class="note" style="margin-top:.25rem">Bình thường từ 18,5 đến 22,9 theo Bộ Y tế</div></div>`;
  h += `<button class="link" data-a="wType">Nhập số khác</button><div class="spacer"></div><button class="btn" data-a="wSave">Lưu</button>`;
  return { chrome: 'modal', html: h };
};
A.wStep = d => { S.ui.w.v = Math.max(20, Math.round((S.ui.w.v + Number(d)) * 2) / 2); render(); };
A.wType = () => openNum({ title: 'Cân nặng', unit: 'kg', comma: true, min: TH.weight.min, max: TH.weight.max, maxLen: 4, onSave: 'wTyped', noun: 'Cân nặng' });
A.wTyped = v => { S.ui.w.v = v; A.back(); };
A.wSave = () => {
  const p = P(), v = S.ui.w.v;
  if (v < TH.weight.min || v > TH.weight.max) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="sub ink">Cân nặng ${dec(v)} kg có vẻ không đúng.</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, vẫn lưu', a: 'wSaveForce', cls: 'sec' }] });
  wFinish(v);
};
A.wSaveForce = () => { S.dialog = null; wFinish(S.ui.w.v); };
function wFinish(v) { const p = P(); p.weights.push({ t: nowMs(), v, by: whoEntered() }); p.weight = v; persist(); A.back(); toast(`Đã lưu ${dec(v)} kg`); }

// ---- Ô nhập số dùng chung ----
function openNum(o, push) { S.ui.num = Object.assign({ text: o.value != null ? String(o.value).replace('.', ',') : '' }, o); S.ui.prevKey = S.ui.keyTarget; S.ui.keyTarget = 'num'; go('numEntry'); }
V.numEntry = () => {
  const n = S.ui.num;
  let h = topBar({ close: true, closeA: 'numCancel' }) + `<h1 class="t small">${esc(n.title)}</h1>`;
  if (n.why) h += `<div class="sub ink" style="margin-top:-.3rem">${esc(n.why)}</div>`;
  h += `<div class="bpbox on"><span class="k">${esc(n.noun || n.title)}${n.unit ? ` (${esc(n.unit)})` : ''}</span><span class="v ${n.text ? '' : 'empty'}">${esc(n.text) || '_ _'}</span></div>`;
  h += keypad(n.comma ? '<button class="key" data-a="key" data-p=",">,</button>' : '');
  h += `<button class="btn" data-a="numSave" ${n.text ? '' : 'disabled'}>Lưu</button>`;
  return { chrome: 'modal', html: h };
};
A.numCancel = () => { S.ui.keyTarget = S.ui.prevKey; A.back(); };
A.numSave = () => {
  const n = S.ui.num, v = Number(n.text.replace(',', '.'));
  if ((n.min != null && v < n.min) || (n.max != null && v > n.max)) {
    return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="sub ink">${esc(n.noun || n.title)} ${esc(n.text)}${n.unit ? ` ${esc(n.unit)}` : ''} có vẻ không đúng.</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }].concat(n.hardMin ? [] : [{ label: 'Đúng rồi, vẫn lưu', a: 'numForce', cls: 'sec' }]) });
  }
  S.ui.keyTarget = S.ui.prevKey;
  A[n.onSave](v);
};
A.numForce = () => { const n = S.ui.num; S.dialog = null; S.ui.keyTarget = S.ui.prevKey; A[n.onSave](Number(n.text.replace(',', '.'))); };
