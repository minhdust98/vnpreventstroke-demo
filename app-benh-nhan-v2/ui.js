'use strict';
// Khung app: trạng thái, điều hướng, lớp phủ, tiện ích hiển thị.

const STORE_KEY = 'vnps-v2-demo';
const V = {};   // Màn hình: V.ten(params) => { html, chrome: 'tab'|'push'|'modal'|'bare', title, back }
const A = {};   // Hành động: A.ten(param, element)

let D = null;   // Dữ liệu demo
const S = { tab: 'today', stack: [], sheet: null, dialog: null, lock: null, ui: {} };

function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) { /* chế độ riêng tư: chạy trong bộ nhớ */ } }
function loadStored() { try { const s = localStorage.getItem(STORE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

function loadScenario(key) {
  const built = SCENARIOS[key].build();
  D = Object.assign({ scenario: key, now: DEMO_NOW, settings: D ? D.settings : defaultSettings(), prompt7: false, bpSaved: 0, dismissed: {} }, built);
  S.stack = []; S.tab = 'today'; S.sheet = null; S.dialog = null; S.lock = null; S.ui = {};
  if (D.onboarding) S.stack = [{ v: 'onWelcome' }];
  persist();
}
function defaultSettings() {
  return { size: 'l', theme: 'light', lang: 'vi', gluUnit: 'mmol', moments: { sang: '07:00', trua: '12:00', chieu: '17:00', toi: '20:00' }, notif: { meds: true, measure: true, appt: true, habit: true, sound: true, vibrate: true, repeat: 15 }, counter: { taps: 0, start: 0, running: false, lastSec: 0 } };
}

const P = () => D.profiles[D.active];
const nowMs = () => D.now;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n, c) => `<svg class="i ${c || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const ic = (n, tone) => `<span class="ic bg-${tone}">${icon(n)}</span>`;
const chev = () => icon('chev', 'chev');
const pad2 = n => String(n).padStart(2, '0');
const hhmm = ms => { const d = new Date(ms); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const ddmm = ms => { const d = new Date(ms); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`; };
const ddmmyy = ms => `${ddmm(ms)}/${new Date(ms).getFullYear()}`;
const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WD_S = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const wdName = ms => WD[new Date(ms).getDay()];
const dec = v => String(v).replace('.', ',');
const initials = name => { const w = String(name || '').trim().split(/\s+/), l = w[w.length - 1] || ''; return l.length <= 3 ? l : l[0].toUpperCase(); };
const age = p => new Date(nowMs()).getFullYear() - p.birthYear;
const momentOf = k => { const m = MOMENTS.find(x => x.key === k); return Object.assign({}, m, { time: D.settings.moments[k] || m.time }); };
const whoEntered = () => (D.proxyName && D.owner !== D.active ? D.proxyName : 'self');
const daysBetween = (a, b) => Math.round((new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0)) / 864e5);

function statusChip(key, label) {
  const s = STATUS[key] || STATUS.none;
  const toneC = s.tone === 'muted' ? 'muted' : s.tone;
  return `<span class="st ${toneC}">${icon(s.icon)}${esc(label || s.label)}</span>`;
}
function topBar(opts) {
  const o = opts || {};
  if (o.close) return `<div class="top">${o.closeLabel === ' ' ? '<span></span>' : `<button class="navbtn" data-a="${o.closeA || 'back'}">${esc(o.closeLabel || 'Đóng')}</button>`}${o.title ? `<div class="top-title">${esc(o.title)}</div>` : ''}${sosBtn()}</div>`;
  if (o.back) return `<div class="top"><button class="navbtn" data-a="back" aria-label="Quay lại ${esc(o.back)}">${icon('back')}${esc(o.back)}</button>${sosBtn()}</div>`;
  return `<div class="top"><button class="avatar" data-a="openMe" aria-label="Hồ sơ của ${esc(P() ? P().name : '')}">${esc(P() ? initials(P().name) : '')}</button>${sosBtn()}</div>`;
}
const sosBtn = () => `<button class="sos" data-a="open115" aria-label="Gọi cấp cứu 115">${icon('phone')}115</button>`;
function row(o) {
  const inner = `${o.icon ? ic(o.icon, o.tone || 'blue') : ''}<span class="m"><span class="n" style="display:block">${o.n}</span>${o.d ? `<span class="d" style="display:block">${o.d}</span>` : ''}${o.st ? `<span style="display:block">${o.st}</span>` : ''}</span>${o.val ? `<span class="val">${o.val}</span>` : ''}${o.a ? chev() : ''}`;
  return o.a ? `<button class="row-b" data-a="${o.a}" data-p="${esc(o.p || '')}">${inner}</button>` : `<div class="row-s">${inner}</div>`;
}
function sw(on, label, action, param, desc) {
  return `<button class="switch" role="switch" aria-checked="${!!on}" data-a="${action}" data-p="${esc(param || '')}"><span class="m"><span class="n" style="display:block">${label}</span>${desc ? `<span class="d" style="display:block">${desc}</span>` : ''}</span><span class="tg-w">${on ? 'Bật' : 'Tắt'}</span><span class="tg"></span></button>`;
}

// Điều hướng
function go(v, p) { saveScroll(); S.stack.push({ v, p: p || {} }); S.navFocus = true; render(); document.getElementById('view').scrollTop = 0; }
function replaceTop(v, p) { S.stack[S.stack.length - 1] = { v, p: p || {} }; S.navFocus = true; render(); document.getElementById('view').scrollTop = 0; }
function saveScroll() { const t = S.stack[S.stack.length - 1]; const y = document.getElementById('view').scrollTop; if (t) t.y = y; else S.rootY = y; }
A.back = () => { S.stack.pop(); S.navFocus = true; render(); const t = S.stack[S.stack.length - 1]; document.getElementById('view').scrollTop = (t ? t.y : S.rootY) || 0; };
A.home = () => { S.stack = []; S.tab = 'today'; S.navFocus = true; render(); document.getElementById('view').scrollTop = 0; };
A.tab = t => { S.tab = t; S.stack = []; S.rootY = 0; S.navFocus = true; render(); document.getElementById('view').scrollTop = 0; };
A.go = p => { const [v, x] = String(p).split(':'); go(v, x != null ? { id: x } : {}); };
A.openMe = () => go('me');
function openSheet(v, p) { S.sheet = { v, p: p || {} }; S.navFocus = true; render(); }
A.closeSheet = () => { S.sheet = null; S.navFocus = true; render(); };
A.open115 = () => openSheet('sos');
A.closeDialog = () => { S.dialog = null; render(); };
function dialog(o) { S.dialog = o; render(); }
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = tr(msg); el.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), 2600);
}
A.call = p => {
  const [num, who] = String(p).split('|');
  dialog({ title: num === '115' ? 'Đang gọi 115' : `Gọi ${who || num}`, body: `<p class="sub ink">Đây là bản demo nên không gọi thật. Trên điện thoại, nút này gọi ngay số <b>${esc(num)}</b>.</p>`, buttons: [{ label: 'Đóng', a: 'closeDialog' }] });
};
A.speak = p => {
  const text = S.ui.speakText || p || '';
  try {
    if (!window.speechSynthesis) throw new Error('none');
    const u = new SpeechSynthesisUtterance(text); u.lang = D.settings.lang === 'en' ? 'en-US' : 'vi-VN';
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    toast('Đang đọc to');
  } catch (e) { toast('Máy này chưa có giọng đọc'); }
};
A.noop = () => {};
A.demoOnly = m => toast(m || 'Trong bản demo, phần này chỉ mô phỏng');

// Vẽ
function render() {
  const root = document.documentElement;
  root.dataset.size = D.settings.size;
  if (D.settings.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = D.settings.theme;
  root.lang = D.settings.lang;

  const d = new Date(nowMs());
  const sb = document.getElementById('statusbar');
  sb.innerHTML = `<span>${hhmm(nowMs())}</span><span class="demo">BẢN DEMO · DỮ LIỆU GIẢ</span>`;

  const top = S.stack[S.stack.length - 1] || { v: S.tab, p: {} };
  const r = V[top.v](top.p || {});
  const view = document.getElementById('view');
  const keep = view.scrollTop;
  const scrCls = r.chrome === 'bare' || r.white ? 'scr bare' : 'scr';
  view.innerHTML = `<div class="${scrCls}" data-view="${top.v}">${r.html}</div>`;
  view.scrollTop = keep;

  const tabs = document.getElementById('tabs');
  if (r.chrome === 'modal' || r.chrome === 'bare' || !P()) tabs.innerHTML = '';
  else {
    const items = [['today', 'today', 'Hôm nay'], ['health', 'wave', 'Sức khỏe'], ['visit', 'clinic', 'Khám bệnh'], ['learn', 'book', 'Tìm hiểu']];
    tabs.innerHTML = items.map(([k, i, l]) => `<button data-a="tab" data-p="${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${icon(i)}<span>${l}</span></button>`).join('');
  }

  const sl = document.getElementById('sheetLayer');
  if (S.sheet) { const s = V[S.sheet.v](S.sheet.p || {}); sl.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(s.title || '')}">${s.html}</div>`; }
  else sl.innerHTML = '';

  const dl = document.getElementById('dialogLayer');
  if (S.dialog) {
    const o = S.dialog;
    dl.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true" aria-label="${esc(o.title)}"><h2>${esc(o.title)}</h2>${o.body || ''}${(o.buttons || []).map(b => `<button class="btn ${b.cls || ''} small" data-a="${b.a}" data-p="${esc(b.p || '')}">${esc(b.label)}</button>`).join('')}</div>`;
  } else dl.innerHTML = '';

  const ll = document.getElementById('lockLayer');
  ll.innerHTML = S.lock ? V.lock(S.lock) : '';

  if (typeof renderPanel === 'function') renderPanel();
  if (D.settings.lang === 'en') translateTree(document.getElementById('phone'));

  if (S.navFocus) {
    S.navFocus = false;
    const target = (S.dialog && dl.querySelector('button')) || (S.sheet && sl.querySelector('button')) || (S.lock && ll.querySelector('button')) || view.querySelector('h1') || view;
    if (target.tagName === 'H1') target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (e) {}
  }
}

// Đếm chạm để tự kiểm tra bằng đồng hồ (gợi ý 11 trong chỉ thị)
function bindEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (!el) return;
    if (el.disabled) return;
    const inPhone = el.closest('#phone') && el.id !== 'statusbar';
    if (inPhone) countTap();
    const fn = A[el.dataset.a];
    if (fn) fn(el.dataset.p, el);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (S.dialog) A.closeDialog(); else if (S.sheet) A.closeSheet();
  });
  document.addEventListener('input', e => {
    const f = e.target.dataset && e.target.dataset.field;
    if (f && A.fieldInput) A.fieldInput(f, e.target.value);
  });
}
function countTap() {
  const c = D.settings.counter;
  if (!c.running) return;
  c.taps++;
  c.lastSec = (Date.now() - c.start) / 1000;
  if (typeof renderMeter === 'function') renderMeter();
}

function boot() {
  const stored = loadStored();
  if (stored && stored.scenario) { D = stored; D.settings = Object.assign(defaultSettings(), D.settings); D.settings.counter = defaultSettings().counter; if (D.onboarding && !D.active) S.stack = [{ v: 'onWelcome' }]; }
  else loadScenario('an');
  bindEvents();
  render();
}

// Biểu đồ đường, không dùng thư viện để mở được khi không có mạng
function lineChart(o) {
  const W = 320, H = o.h || 170, L = 8, R = 34, T = 16, B = 22;
  const xs = v => L + (W - L - R) * (o.xMax === o.xMin ? 0.5 : (v - o.xMin) / (o.xMax - o.xMin));
  const ys = v => T + (H - T - B) * (1 - (v - o.yMin) / (o.yMax - o.yMin));
  let out = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label)}">`;
  (o.lines || []).forEach(l => {
    out += `<line x1="${L}" x2="${W - R}" y1="${ys(l.v)}" y2="${ys(l.v)}" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="4 4"/><text x="${W - R + 4}" y="${ys(l.v) + 4}" font-size="12" font-weight="600" fill="var(--green)">${l.t}</text>`;
  });
  (o.series || []).forEach(s => {
    if (!s.pts.length) return;
    out += `<polyline fill="none" stroke="${s.color}" stroke-width="3" ${s.dash ? 'stroke-dasharray="7 5"' : ''} stroke-linecap="round" stroke-linejoin="round" points="${s.pts.map(p => `${xs(p[0]).toFixed(1)},${ys(p[1]).toFixed(1)}`).join(' ')}"/>`;
    const f = s.pts[s.pts.length - 1];
    out += `<circle cx="${xs(f[0]).toFixed(1)}" cy="${ys(f[1]).toFixed(1)}" r="4.5" fill="${s.color}"/>`;
    if (s.label) { const p0 = s.pts[0]; out += `<text x="${Math.max(xs(p0[0]), L)}" y="${Math.max(ys(p0[1]) - 8, 12)}" font-size="13" font-weight="700" fill="${s.color}">${s.label}</text>`; }
  });
  (o.xLabels || []).forEach(x => { out += `<text x="${xs(x[0])}" y="${H - 5}" font-size="12" fill="var(--ink2)" text-anchor="middle">${x[1]}</text>`; });
  return out + '</svg>';
}

// Kế hoạch trong ngày: gom thuốc và đo theo buổi
function medsActive(p, ms) {
  const dk = dayKey(ms);
  return p.meds.filter(m => !m.paused && (!m.start || m.start <= dk) && (!m.end || m.end >= dk));
}
function doseKey(ms, mk, medId) { return `${dayKey(ms)}|${mk}|${medId}`; }
function dayPlan(p, ms) {
  const dk = dayKey(ms);
  const meds = medsActive(p, ms);
  const out = [];
  for (const m of MOMENTS) {
    const mo = momentOf(m.key);
    const due = atTime(ms, mo.time);
    const mm = meds.filter(x => x.moments.includes(m.key));
    const items = [];
    if (mm.length) {
      const logs = mm.map(x => p.doses[doseKey(ms, m.key, x.id)]);
      const taken = logs.filter(l => l && l.s === 'taken').length;
      const missed = logs.filter(l => l && l.s === 'missed').length;
      const lastT = logs.filter(l => l && l.s === 'taken').map(l => l.t).sort().pop();
      items.push({ kind: 'meds', meds: mm, taken, missed, total: mm.length, lastT, done: taken + missed === mm.length, filled: taken === mm.length });
    }
    if (p.track.bp && p.track.bpMoments.includes(m.key)) {
      const r = p.bp.find(x => dayKey(x.t) === dk && x.moment === m.key);
      items.push({ kind: 'bp', reading: r, done: !!r, filled: !!r });
    }
    if (p.track.glucose && p.track.gluMoments.includes(m.key)) {
      const r = p.glucose.find(x => dayKey(x.t) === dk && x.moment === m.key);
      items.push({ kind: 'glu', reading: r, done: !!r, filled: !!r });
    }
    if (items.length) out.push({ key: m.key, label: mo.label, word: mo.word, time: mo.time, due, items, reached: due <= ms });
  }
  return out;
}
// Buổi hiện tại: buổi gần nhất đã tới giờ
function currentMoment(plan) { let c = null; plan.forEach(m => { if (m.reached) c = m; }); return c; }
function nextMoment(plan, ms) { return plan.find(m => !m.reached) || null; }

// Thống kê thuốc: chỉ tính liều đã đến hạn. "Bỏ lỡ" khác "không có ghi nhận".
function adherence(p, days) {
  const ms = nowMs(); const res = { due: 0, taken: 0, missed: 0, none: 0 };
  for (let i = 0; i < days; i++) {
    const day = ms - i * 864e5;
    const dk = dayKey(day);
    for (const med of p.meds) {
      if ((med.start && med.start > dk) || (med.end && med.end < dk)) continue;
      for (const mk of med.moments) {
        const due = atTime(day, momentOf(mk).time);
        if (due > ms) continue;
        const log = p.doses[`${dk}|${mk}|${med.id}`];
        if (i === 0 && !log && ms - due < 4 * 36e5) continue; // chưa quá 4 giờ thì chưa tính
        res.due++;
        if (log && log.s === 'taken') res.taken++; else if (log && log.s === 'missed') res.missed++; else res.none++;
      }
    }
  }
  return res;
}
function adherenceKey(a) {
  const known = a.taken + a.missed;
  if (!known) return 'none';
  return a.taken / known >= 0.8 ? 'good' : 'improve';
}
function dayDoseState(p, day) {
  const ms = nowMs(); const dk = dayKey(day); let due = 0, taken = 0, missed = 0, future = 0;
  for (const med of p.meds) {
    if ((med.start && med.start > dk) || (med.end && med.end < dk)) continue;
    for (const mk of med.moments) {
      const t = atTime(day, momentOf(mk).time);
      if (t > ms) { future++; continue; }
      due++;
      const log = p.doses[`${dk}|${mk}|${med.id}`];
      if (log && log.s === 'taken') taken++; else if (log && log.s === 'missed') missed++;
    }
  }
  if (!due && !future) return 'nodoses';
  if (dk === dayKey(ms) && future) return 'ongoing';
  if (due && taken === due) return 'full';
  if (taken) return 'partial';
  if (missed) return 'missed';
  return 'none';
}
const nextAppt = p => p.appts.filter(a => a.state === 'upcoming' || a.state === 'confirmed' || a.state === 'change').sort((x, y) => x.t - y.t)[0] || null;
function riskRemaining(p) {
  const plan = riskPlan(p, nowMs());
  return plan.ids.filter(id => factOf(p, id) == null);
}
