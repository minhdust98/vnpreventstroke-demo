'use strict';
// Khung app: dữ liệu, điều hướng, vẽ màn hình, thành phần dùng chung.
// Màn hình: V.ten = params => ({ html, chrome, white }). chrome: 'tab' | 'push' | 'modal' | 'bare'.
// Hành động: A.ten = (params, el) => {...}. params là các thuộc tính data-* của nút. Sau mỗi hành động, app tự lưu và vẽ lại.
// Ô nhập chữ: F.ten = (value, el) => {...}, gắn bằng data-field, không vẽ lại khi gõ.

const V = {}, A = {}, F = {};
const STORE_KEY = 'vnps-v4-demo';
let D = null; // dữ liệu demo, được lưu lại
const S = { tab: 'today', stack: [], sheet: null, dialog: null, lock: null, draft: {}, scrollTo: 0, focus: true, meter: { taps: 0, start: 0, running: false, sec: 0 } };

const store = {
  get() { if (window.__TEST__) return null; try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } },
  set() { if (window.__TEST__) return; try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) { /* chế độ riêng tư: chạy trong bộ nhớ */ } },
  clear() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} },
};
const defaultSettings = () => ({ size: 'l', theme: 'light', lang: 'vi', gluUnit: 'mmol', times: timesDefault(), notif: { meds: true, appt: true, sound: true, vibrate: true, repeat: 15 } });

function loadScenario(key) {
  const settings = D ? D.settings : defaultSettings();
  D = Object.assign({ scenario: key, now: DEMO_NOW, settings, prompt7: false, bpSaved: 0, dismissed: {} }, SCENARIOS[key].build());
  Object.assign(S, { tab: 'today', stack: D.onboarding ? [{ v: 'welcome', p: {} }] : [], sheet: null, dialog: null, lock: null, draft: {}, scrollTo: 0, focus: true });
  store.set();
}

// ---- Truy cập nhanh ----
const P = () => D.profiles[D.active];
const now = () => D.now;
const times = () => D.settings.times;
const mo = k => { const m = MOMENTS.find(x => x.key === k); return { key: k, label: m.label, word: m.label.toLowerCase(), time: D.settings.times[k] }; };
const byWho = () => (D.proxyName && D.owner !== D.active ? D.proxyName : 'self');
const plan = () => dayPlan(P(), now(), times());

// ---- Định dạng ----
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const hhmm = ms => { const d = new Date(ms); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const ddmm = ms => { const d = new Date(ms); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`; };
const ddmmyy = ms => `${ddmm(ms)}/${new Date(ms).getFullYear()}`;
const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WD_S = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const dec = v => String(v).replace('.', ',');
const fix1 = v => dec(Number(v).toFixed(1));
const initials = name => { const w = String(name || '').trim().split(/\s+/), l = w[w.length - 1] || ''; return l.length <= 3 ? l : l[0].toUpperCase(); };
const last = arr => arr.slice().sort((a, b) => b.t - a.t)[0];
function whenWord(t) {
  const d = daysBetween(t, now()), h = new Date(t).getHours();
  const part = h < 11 ? 'sáng' : h < 14 ? 'trưa' : h < 18 ? 'chiều' : 'tối';
  return d === 0 ? `${part} nay` : d === 1 ? `${part} qua` : `${d} ngày trước`;
}
const gluUnit = () => (D.settings.gluUnit === 'mg' ? 'mg/dL' : 'mmol/L');
const gluNum = v => (D.settings.gluUnit === 'mg' ? `${Math.round(v * MOL_TO_MG)}` : fix1(v));

// ---- Thành phần giao diện ----
const STATUS_UI = {
  good: { word: 'Tốt', tone: 'green', icon: 'check' },
  improve: { word: 'Cần cải thiện', tone: 'amber', icon: 'dot' },
  high: { word: 'Rất cao', tone: 'amber', icon: 'alert' },
  low: { word: 'Thấp', tone: 'amber', icon: 'alert' },
  critical: { word: 'Rất cao', tone: 'red', icon: 'alert' },
  none: { word: '', tone: 'muted', icon: '' },
};
const on = (a, p) => `data-a="${a}"${Object.entries(p || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('')}`;
const icon = (n, cls) => `<svg class="i ${cls || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const tile = (n, tone) => `<span class="tile ${tone || 'blue'}">${icon(n)}</span>`;
const sosBtn = () => `<button class="sos" ${on('open115')} aria-label="Gọi cấp cứu 115">${icon('phone')}115</button>`;
function topBar(o) {
  const x = o || {};
  let left;
  if (x.close) left = x.close === true ? `<button class="nav" ${on(x.closeA || 'back')}>Đóng</button>` : '<span></span>';
  else if (x.back) left = `<button class="nav" ${on('back')} aria-label="Quay lại ${esc(x.back)}">${icon('back')}${esc(x.back)}</button>`;
  else left = P() ? `<button class="avatar" ${on('go', { v: 'profile' })} aria-label="Hồ sơ của ${esc(P().name)}">${esc(initials(P().name))}</button>` : '<span></span>';
  return `<header class="top">${left}${sosBtn()}</header>`;
}
const h1 = (text, cls) => `<h1 class="title ${cls || ''}">${esc(text)}</h1>`;
function statusIcon(key) { const s = STATUS_UI[key]; return s && s.icon ? `<span class="st ${s.tone}" role="img" aria-label="${s.word}">${icon(s.icon)}</span>` : ''; }
function pill(key, word) { const s = STATUS_UI[key]; return s && s.word ? `<span class="pill ${s.tone}">${icon(s.icon)}${esc(word || s.word)}</span>` : ''; }
// Một dòng trong danh sách: tên bên trái, giá trị bên phải. Không có dòng phụ.
function row(o) {
  const inner = `${o.icon ? tile(o.icon, o.tone) : ''}<span class="row-title">${o.title}</span>${o.value != null || o.status ? `<span class="row-value ${o.tone2 || ''}">${o.status ? statusIcon(o.status) : ''}${o.value != null ? o.value : ''}</span>` : ''}${o.a ? icon('chev', 'chev') : ''}`;
  return o.a ? `<button class="row" ${on(o.a, o.p)}${o.aria ? ` aria-label="${esc(o.aria)}"` : ''}>${inner}</button>` : `<div class="row">${inner}</div>`;
}
function group(rows, head) {
  const h = head ? `<div class="group-head"><h2>${esc(head.title)}</h2>${head.action ? `<button class="link" ${on(head.action.a, head.action.p)}>${head.action.icon ? icon(head.action.icon) : ''}${esc(head.action.label)}</button>` : ''}</div>` : '';
  const body = Array.isArray(rows) ? rows.join('') : rows;
  return body ? `<section class="group">${h}<div class="list">${body}</div></section>` : '';
}
const btn = (label, a, p, variant, attrs) => `<button class="btn ${variant || ''}" ${on(a, p)} ${attrs || ''}>${label}</button>`;
// opts: [[giá trị, nhãn], ...]. Nút gửi data-v cùng các tham số trong base.
function chips(opts, cur, a, base, cls) {
  return `<div class="chips ${cls || ''}">${opts.map(([v, l]) => { const sel = Array.isArray(cur) ? cur.includes(v) : String(cur) === String(v); return `<button class="chip${sel ? ' on' : ''}" aria-pressed="${sel}" ${on(a, Object.assign({}, base, { v }))}>${esc(l)}</button>`; }).join('')}</div>`;
}
function seg(opts, cur, a, base) {
  return `<div class="seg" role="group">${opts.map(([v, l]) => `<button aria-pressed="${String(cur) === String(v)}" ${on(a, Object.assign({}, base, { v }))}>${esc(l)}</button>`).join('')}</div>`;
}
const toggle = (label, onOff, a, p) => `<button class="row" role="switch" aria-checked="${!!onOff}" ${on(a, p)}><span class="row-title">${label}</span><span class="switch"></span></button>`;
const checkRow = (label, value, checked, a, p) => `<button class="row check-row" role="checkbox" aria-checked="${!!checked}" ${on(a, p)}><span class="check">${icon('check')}</span><span class="row-title">${label}</span>${value ? `<span class="row-value">${value}</span>` : ''}</button>`;
function keypad(left) {
  const k = n => `<button class="key" ${on('key', { k: n })}>${n}</button>`;
  return `<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k).join('')}${left || '<span></span>'}${k(0)}<button class="key key-plain" ${on('key', { k: 'del' })} aria-label="Xóa">${icon('delete')}</button></div>`;
}
const field = (label, text, focused, a, p) => `<button class="field${focused ? ' on' : ''}" ${a ? on(a, p) : ''}><span class="field-label">${label}</span><span class="field-value${text ? '' : ' empty'}">${text || '–'}</span></button>`;
// Ô ngày: chữ dd/mm/yyyy do app vẽ, ô date gốc trong suốt phủ lên trên để mở bộ chọn của máy.
const dmy = key => key.split('-').reverse().join('/');
const dateRow = (title, f, value) => `<label class="row date-row"><span class="row-title">${title}</span><span class="row-value">${dmy(value)}</span><input type="date" data-field="${f}" value="${esc(value)}" max="${dayKey(now())}" aria-label="${esc(title)}"></label>`;
const sheetHead = title => `<div class="sheet-head"><h2>${esc(title)}</h2><button class="nav" ${on('closeSheet')}>Xong</button></div>`;

// Biểu đồ đường, không dùng thư viện để mở được khi không có mạng
function chart(o) {
  const W = 320, H = o.h || 170, L = 6, R = 34, T = 16, B = 22;
  const xs = v => L + (W - L - R) * (o.xMax === o.xMin ? 0.5 : (v - o.xMin) / (o.xMax - o.xMin));
  const ys = v => T + (H - T - B) * (1 - (v - o.yMin) / (o.yMax - o.yMin));
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label)}">`;
  (o.lines || []).forEach(l => { s += `<line x1="${L}" x2="${W - R}" y1="${ys(l.v)}" y2="${ys(l.v)}" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="4 4"/><text x="${W - R + 4}" y="${ys(l.v) + 4}" font-size="12" font-weight="600" fill="var(--green)">${l.t}</text>`; });
  (o.series || []).forEach(se => {
    if (!se.pts.length) return;
    s += `<polyline fill="none" stroke="${se.color}" stroke-width="3" ${se.dash ? 'stroke-dasharray="7 5"' : ''} stroke-linecap="round" stroke-linejoin="round" points="${se.pts.map(p => `${xs(p[0]).toFixed(1)},${ys(p[1]).toFixed(1)}`).join(' ')}"/>`;
    se.pts.forEach((p, i) => { if (i === se.pts.length - 1 || se.dots) s += `<circle cx="${xs(p[0]).toFixed(1)}" cy="${ys(p[1]).toFixed(1)}" r="4" fill="${se.color}"/>`; });
    if (se.label) s += `<text x="${Math.max(xs(se.pts[0][0]), L)}" y="${Math.max(ys(se.pts[0][1]) - 8, 12)}" font-size="13" font-weight="700" fill="${se.color}">${se.label}</text>`;
  });
  (o.xLabels || []).forEach(x => { s += `<text x="${xs(x[0])}" y="${H - 5}" font-size="12" fill="var(--ink2)" text-anchor="middle">${x[1]}</text>`; });
  return s + '</svg>';
}

// ---- Điều hướng ----
const current = () => S.stack[S.stack.length - 1] || { v: S.tab, p: {} };
function keepScroll() { const t = S.stack[S.stack.length - 1], y = document.getElementById('view').scrollTop; if (t) t.y = y; else S.rootY = y; }
function go(v, p) { keepScroll(); S.stack.push({ v, p: p || {} }); S.scrollTo = 0; S.focus = true; }
function replace(v, p) { S.stack[S.stack.length - 1] = { v, p: p || {} }; S.scrollTo = 0; S.focus = true; }
function back() { S.stack.pop(); const t = S.stack[S.stack.length - 1]; S.scrollTo = (t ? t.y : S.rootY) || 0; S.focus = true; }
function home() { S.stack = []; S.tab = 'today'; S.sheet = null; S.scrollTo = 0; S.focus = true; }
function sheet(v, p) { S.sheet = { v, p: p || {} }; S.focus = true; }
function dialog(o) { S.dialog = o; S.focus = true; }
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = typeof tr === 'function' ? tr(msg) : msg; el.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2400);
}
function refresh() { store.set(); render(); }

A.back = () => back();
A.home = () => home();
A.tab = ({ t }) => { S.tab = t; S.stack = []; S.rootY = 0; S.scrollTo = 0; S.focus = true; };
A.go = ({ v, ...p }) => go(v, p);
A.closeSheet = () => { S.sheet = null; S.focus = true; };
A.closeDialog = () => { S.dialog = null; };
A.open115 = () => sheet('sos');
A.noop = () => {};
A.call = ({ num, who }) => dialog({ title: num === '115' ? 'Đang gọi 115' : `Gọi ${who || num}`, body: `<p class="body">Bản demo không gọi thật. Trên điện thoại, nút này gọi ngay số <b>${esc(num)}</b>.</p>`, buttons: [{ label: 'Đóng', a: 'closeDialog' }] });
A.speak = ({ text }) => {
  try {
    const u = new SpeechSynthesisUtterance(text || S.speakText || '');
    u.lang = D.settings.lang === 'en' ? 'en-US' : 'vi-VN';
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { toast('Máy này chưa có giọng đọc'); }
  return false;
};
A.demo = ({ msg }) => { toast(msg || 'Bản demo chỉ mô phỏng phần này'); return false; };

// ---- Vẽ ----
function render() {
  const root = document.documentElement, st = D.settings;
  root.dataset.size = st.size; root.lang = st.lang;
  if (st.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = st.theme;
  document.getElementById('statusbar').innerHTML = `<span>${hhmm(now())}</span><span class="demo">BẢN DEMO</span>`;

  const cur = current(), r = V[cur.v](cur.p || {}), view = document.getElementById('view'), keep = view.scrollTop;
  view.innerHTML = `<div class="scr${r.white ? ' white' : ''}" data-screen="${cur.v}">${r.html}</div>`;
  view.scrollTop = S.scrollTo != null ? S.scrollTo : keep;
  S.scrollTo = null;

  const tabs = document.getElementById('tabs');
  tabs.innerHTML = r.chrome === 'modal' || r.chrome === 'bare' || !P() ? '' : [['today', 'today', 'Hôm nay'], ['meds', 'pill', 'Thuốc'], ['metrics', 'wave', 'Chỉ số'], ['learn', 'book', 'Học']]
    .map(([k, i, l]) => `<button ${on('tab', { t: k })} ${S.tab === k ? 'aria-current="page"' : ''}>${icon(i)}<span>${l}</span></button>`).join('');

  const sl = document.getElementById('sheetLayer');
  if (S.sheet) { const s = V[S.sheet.v](S.sheet.p || {}); sl.innerHTML = `<div class="scrim" aria-hidden="true" ${on('closeSheet')}></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(s.title || '')}">${s.html}</div>`; } else sl.innerHTML = '';
  const dl = document.getElementById('dialogLayer'), o = S.dialog;
  dl.innerHTML = o ? `<div class="dialog" role="alertdialog" aria-modal="true" aria-label="${esc(o.title)}"><h2>${esc(o.title)}</h2>${o.body || ''}${(o.buttons || []).map(b => btn(esc(b.label), b.a, b.p, b.cls || '')).join('')}</div>` : '';
  document.getElementById('lockLayer').innerHTML = S.lock ? V.lock(S.lock) : '';

  if (typeof renderPanel === 'function') renderPanel();
  if (st.lang === 'en' && typeof translateTree === 'function') translateTree(document.getElementById('phone'));
  if (S.focus) {
    S.focus = false;
    const t = (o && dl.querySelector('button')) || (S.sheet && sl.querySelector('.sheet button')) || (S.lock && document.querySelector('#lockLayer button')) || view.querySelector('h1') || view;
    if (t.tagName === 'H1') t.setAttribute('tabindex', '-1');
    try { t.focus({ preventScroll: true }); } catch (e) {}
  }
}

function bind() {
  document.addEventListener('click', e => {
    if (e.target.type === 'date' && e.target.showPicker) { try { e.target.showPicker(); } catch (_) { /* máy đã tự mở */ } return; }
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const { a, ...p } = el.dataset;
    if (el.closest('#phone') && el.id !== 'statusbar' && S.meter.running) { S.meter.taps++; S.meter.sec = (Date.now() - S.meter.start) / 1000; }
    if (A[a] && A[a](p, el) !== false) refresh();
  });
  const onField = e => {
    const el = e.target, f = el.dataset && el.dataset.field;
    if (!f || !F[f]) return;
    if (el.type === 'date') { if (!el.value || el.value > el.max) return; el.previousElementSibling.textContent = dmy(el.value); }
    F[f](el.value, el, e.type);
  };
  document.addEventListener('input', onField);
  document.addEventListener('change', onField);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && (S.dialog || S.sheet)) { S.dialog ? (S.dialog = null) : (S.sheet = null); render(); } });
}

function boot() {
  const saved = store.get();
  if (saved && saved.scenario && SCENARIOS[saved.scenario]) {
    D = saved; D.settings = Object.assign(defaultSettings(), D.settings);
    if (D.onboarding && !D.active) S.stack = [{ v: 'welcome', p: {} }];
  } else loadScenario('an');
  bind();
  render();
}
