/* VNPreventStroke (demo) · trạng thái, điều hướng, khung giao diện, xử lý sự kiện */
(function (g) {
  'use strict';
  const V = g.VNPS, T = V.T, R = V.rules, D = V.data, U = V.ui, W = V.views, esc = U.esc, ic = U.ic;
  const $ = (s) => document.querySelector(s);
  V.byId = {}; D.unit.forEach((p) => { V.byId[p.id] = p; });

  /* ---------- trạng thái ---------- */
  const S = (V.S = {
    role: null, route: '', qtab: 'act', drawer: null, page: null, collapsed: false, theme: 'light', menu: null,
    al: {}, notes: {}, adv: {},
    pf: { q: '', need: 'all', level: 'all', dx: 'all', rf: 'all', sort: 'risk' },
    qx: null, qc: null, qmove: false, qnotes: {}, sn: {}, day: 0, drafts: {}, pdmenu: false, sheetAnim: false,
    pv: { metric: 'bp', range: 30 }, mg: { sel: null }, ap: { mode: 'week', anchor: 0, filter: 'all' }, appts: [],
    tool: 'esrs', ti: {}, set: { days: [0, 1, 2, 3, 4, 5, 6].map(() => ({ on: false, from: '08:00', to: '11:30' })), busy: [], saved: null },
    mq: null, mdoc: null, nudged: {}, cfgDraft: null, mrsPick: null, cls: {}, sres: [], ew: false,
  });
  let aid = 1;
  D.patients.forEach((p) => S.appts.push({ id: 'A' + aid++, pid: p.id, d: p.appt.d, time: p.appt.time, dur: 30, reason: p.appt.kind, status: 'confirmed', by: 'doctor' }));
  D.patients.filter((p) => p.req).forEach((p) => S.appts.push({ id: 'A' + aid++, pid: p.id, d: p.req.want, time: '08:30', dur: 30, reason: 'Xin đổi lịch: ' + p.req.why + ' (qua ' + p.req.via + ')', status: 'pending', by: 'patient' }));
  const derive = () => { S.cls = R.classifyAll(D.unit, R.cfg); };
  derive();
  const NOWH = 7.55;
  const parseDMY = (s) => { const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (!m) return null; const dt = new Date(+m[3], +m[2] - 1, +m[1]); if (dt.getMonth() !== +m[2] - 1) return null; return Math.round((dt - new Date(2026, 9, 31)) / 864e5); };
  const val = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
  const say = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
  const box = (cls, t) => '<div class="' + cls + '">' + t + '</div>';

  /* ---------- điều hướng ---------- */
  const parseHash = () => {
    const h = (location.hash || '#/').slice(2);
    if (!h) { S.role = null; S.route = ''; return; }
    const parts = h.split('/'); S.role = parts[0] === 'm' ? 'manager' : 'doctor';
    if (S.role === 'doctor') {
      if (parts[1] === 'patient' && V.byId[parts[2]]) { S.route = 'd/patient'; S.page = S.page && S.page.id === parts[2] ? S.page : { id: parts[2], tab: 'home' }; }
      else S.route = 'd/' + (['home', 'patients', 'appts', 'msgs', 'tools', 'settings'].includes(parts[1]) ? parts[1] : 'home');
    } else if (parts[1] === 'doctor' && D.doctors.some((d) => d.id === parts[2])) { S.route = 'm/doctor'; S.mdoc = parts[2]; } else S.route = 'm/' + (['dashboard', 'overview', 'msgs', 'list', 'thresholds'].includes(parts[1]) ? parts[1] : 'dashboard');
  };
  const go = (r) => { const t = '#/' + r; if (location.hash === t) { render(); } else location.hash = t; };

  /* ---------- khung ---------- */
  const NAVS = {
    doctor: () => [['home', 'Tổng quan', 'home'], ['patients', 'Bệnh nhân', 'users'], ['appts', 'Lịch khám', 'calendar', W.todayAppts().length, 'n'], ['msgs', 'Tin nhắn', 'msg', W.pendingPatients().length, ''], ['tools', 'Công cụ tính nguy cơ', 'calc'], ['settings', 'Cài đặt', 'gear']].map((x) => ({ r: 'd/' + x[0], t: x[1], i: x[2], b: x[3], bc: x[4] })),
    manager: () => [{ r: 'm/dashboard', t: 'Tổng quan', i: 'home' }, { r: 'm/overview', t: 'Toàn khoa', i: 'chart' }, { r: 'm/msgs', t: 'Tin nhắn', i: 'msg', b: W.stats(D.unit).late, bc: '' }, { r: 'm/thresholds', t: 'Ngưỡng cảnh báo', i: 'gear' }],
  };
  function shell() {
    const app = $('#app');
    if (!S.role) { app.className = 'nosidebar'; app.innerHTML = W.landing(); app.dataset.shell = ''; return false; }
    app.className = S.collapsed ? 'collapsed' : '';
    if (app.dataset.shell !== S.role) { app.innerHTML = '<aside id="side"></aside><div class="col"><header id="top"></header><main id="main"></main></div>'; app.dataset.shell = S.role; app.dataset.top = ''; }
    return true;
  }
  function renderSide() {
    const on = (r) => (S.route === r || (r === 'd/patients' && S.route === 'd/patient') || (r === 'm/overview' && (S.route === 'm/list' || S.route === 'm/doctor')) ? ' on' : '');
    $('#side').innerHTML = '<div class="brand"><span class="logo">V</span><span class="bt"><b>VNPreventStroke</b></span></div><nav class="nav" aria-label="Menu chính">' +
      NAVS[S.role]().map((n) => '<a href="#/' + n.r + '" class="' + on(n.r).trim() + '" title="' + esc(n.t) + '">' + ic(n.i) + '<span class="lb">' + esc(n.t) + '</span>' + (n.b ? '<span class="bd ' + n.bc + '">' + n.b + '</span>' : '') + '</a>').join('') +
      '<div class="sep"></div><button class="navb" data-a="collapse" title="Thu gọn / mở rộng menu">' + ic('panel') + '<span class="lb">Thu gọn menu</span></button><button class="navb" data-a="switchrole" title="Đổi vai trò">' + ic('logout') + '<span class="lb">Đổi vai trò</span></button></nav>';
  }
  function renderTop() {
    const t = $('#top'), me = S.role === 'manager' ? { name: 'Quản lý khoa', short: 'Quản lý', ini: 'QL' } : { name: D.doctor.name, short: D.doctor.short, ini: U.initials(D.doctor.name.replace('BS. ', '')) };
    const keep = t.querySelector('#gs'); const had = keep && document.activeElement === keep ? keep.value : null;
    t.innerHTML = (S.role === 'doctor' ? '<div class="tb-search">' + ic('search') + '<input id="gs" type="search" placeholder="Tìm tên, mã, SĐT hoặc: bỏ liều, HA cao…" autocomplete="off" aria-label="Tìm bệnh nhân" data-i="gs" value="' + esc(S.route === 'd/patients' ? S.pf.q : '') + '"><kbd>/</kbd><div class="sres" id="sres" hidden></div></div>' : '') +
      '<span class="tb-date">' + T.dow(0) + ', ' + T.fmtDMY(0) + ' · 07:30</span><span class="tb-sp"></span>' +
      '<button class="iconbtn" data-a="theme" aria-label="Đổi giao diện sáng/tối" title="Chế độ tối">' + ic(S.theme === 'dark' ? 'sun' : 'moon') + '</button>' +
      '<button class="userbtn" data-a="umenu"><span class="av">' + me.ini + '</span><span class="small"><b>' + me.short + '</b></span>' + ic('chevD') + '</button>';
    if (S.menu === 'user') t.insertAdjacentHTML('beforeend', '<div class="menu"><div class="mi"><b>' + esc(me.name) + '</b></div><hr><button data-a="reset">' + ic('dash') + 'Đặt lại dữ liệu demo</button></div>');
    if (had != null) { const n = t.querySelector('#gs'); n.value = had; n.focus(); }
  }
  function renderMain() {
    const m = $('#main'), r = S.route, fx = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.i : null, pos = fx && document.activeElement.selectionStart;
    const top = m.scrollTop, inner = Array.from(m.querySelectorAll('.dash .scroll')).map((x) => x.scrollTop);
    m.className = r === 'd/home' || r === 'd/patient' ? 'nos' : '';
    let h = '';
    if (r === 'd/home') h = W.home();
    else if (r === 'd/patients') h = W.patients();
    else if (r === 'd/appts') h = W.appts();
    else if (r === 'd/msgs') h = W.msgs();
    else if (r === 'd/tools') h = W.tools();
    else if (r === 'd/settings') h = W.settings();
    else if (r === 'd/patient') h = W.patientView(V.byId[S.page.id], S.page.tab, 'page');
    else if (r === 'm/dashboard') h = W.mdash();
    else if (r === 'm/overview') h = W.overview();
    else if (r === 'm/list') h = W.mlist();
    else if (r === 'm/doctor') h = W.mdoctor(S.mdoc);
    else if (r === 'm/msgs') h = W.mmsgs();
    else if (r === 'm/thresholds') h = W.thresholds();
    m.innerHTML = h; m.scrollTop = top;
    m.querySelectorAll('.dash .scroll').forEach((x, i) => { if (inner[i]) x.scrollTop = inner[i]; });
    if (S.qmove) {
      S.qmove = false;
      const it = m.querySelector('.qitem.open'), box = it && it.closest('.scroll');
      if (box) { const a = it.getBoundingClientRect(), b = box.getBoundingClientRect(); if (a.top < b.top) box.scrollTop -= b.top - a.top; else if (a.bottom > b.bottom) box.scrollTop += Math.min(a.top - b.top, a.bottom - b.bottom); }
    }
    if (fx) { const n = m.querySelector('[data-i="' + fx + '"]'); if (n && fx !== 'gs') { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* number/select */ } } }
    const th = $('#thread'); if (th) th.scrollTop = th.scrollHeight;
    if (r === 'd/patient') { W.fitChart(); S.sheetAnim = false; }
  }
  function renderDrawer() {
    const ov = $('#ov'), old = ov.querySelector('.pd-body'), top = old && ov.dataset.tab === (S.drawer && S.drawer.id + S.drawer.tab) ? old.scrollTop : 0, first = !ov.querySelector('#drawer');
    if (!S.drawer) { ov.innerHTML = ''; ov.dataset.tab = ''; return; }
    const p = V.byId[S.drawer.id];
    ov.innerHTML = '<aside id="drawer" class="' + (first ? 'enter' : '') + '" role="dialog" aria-label="Hồ sơ ' + esc(p.name) + '">' + W.patientView(p, S.drawer.tab, 'drawer') + '</aside>';
    ov.dataset.tab = S.drawer.id + S.drawer.tab; S.sheetAnim = false;
    const b = ov.querySelector('.pd-body'); if (b) b.scrollTop = top;
    const th = ov.querySelector('#thread'); if (th) th.scrollTop = th.scrollHeight;
    W.fitChart();
  }
  function render() {
    document.documentElement.dataset.theme = S.theme;
    document.body.classList.toggle('sw-col', !!S.collapsed);
    if (!shell()) { $('#ov').innerHTML = ''; return; }
    renderSide(); renderTop(); renderMain(); renderDrawer();
  }
  const refresh = () => { derive(); render(); };

  /* ---------- mở hồ sơ ---------- */
  const openP = (id, tab) => {
    if (S.route === 'd/patient') { S.page = { id, tab: tab || 'home' }; location.hash = '#/d/patient/' + id; S.sheetAnim = !!tab; render(); return; }
    const had = S.drawer && S.drawer.id === id;
    S.drawer = { id, tab: tab || (had ? S.drawer.tab : 'home'), direct: !!tab && !had }; S.menu = null; S.pdmenu = false; S.sheetAnim = !!tab; render();
  };
  const curV = () => (S.route === 'd/patient' ? S.page : S.drawer);
  const noteBox = (el) => el.closest('#modal') || document.getElementById('main');
  const noteInput = (el) => noteBox(el).querySelector('[data-i="qnote"]');
  const nextInQueue = (msg) => {
    const n = W.queueList(S.qtab).find((p) => !W.muted(p));
    S.qx = n ? n.id : null; S.qc = null; S.qmove = true; render();
    U.toast(msg + (n ? ' Chuyển sang ' + n.name + '.' : ' Đã hết bệnh nhân chưa xử lý trong tab này.'));
  };

  /* ---------- hành động ---------- */
  const H = {
    role: (el) => go(el.dataset.v === 'doctor' ? 'd/home' : 'm/dashboard'),
    switchrole: () => { S.menu = null; S.drawer = null; location.hash = '#/'; },
    nav: (el) => { S.drawer = null; go(el.dataset.r); },
    collapse: () => { S.collapsed = !S.collapsed; render(); },
    theme: () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; S.menu = null; render(); },
    umenu: () => { S.menu = S.menu === 'user' ? null : 'user'; renderTop(); },
    reset: () => location.reload(),
    open: (el) => openP(el.dataset.id, el.dataset.tab),
    msgto: (el) => { if (S.route === 'd/msgs') { S.mg.sel = el.dataset.id; render(); } else openP(el.dataset.id, 'msg'); },
    close: () => { S.drawer = null; S.pdmenu = false; S.pv.metric = 'bp'; render(); },
    sheetclose: () => { const v = curV(); if (v.direct) { if (S.route === 'd/patient') { v.tab = 'home'; v.direct = false; render(); } else H.close(); return; } v.tab = 'home'; S.pv.metric = 'bp'; if (S.route === 'd/patient') render(); else renderDrawer(); },
    pdmenu: () => { S.pdmenu = !S.pdmenu; if (S.route === 'd/patient') render(); else renderDrawer(); },
    pinfo: (el) => W.infoModal(V.byId[el.dataset.id]),
    pdone: (el) => W.pdoneModal(V.byId[el.dataset.id]),
    back: () => { if (history.length > 1) history.back(); else go('d/patients'); },
    ptab: (el) => { const t = el.dataset.t, v = curV(), wasHome = v.tab === 'home'; v.tab = t; if (t === 'home') v.direct = false; if (el.dataset.m) S.pv.metric = el.dataset.m; S.sheetAnim = wasHome && t !== 'home'; S.pdmenu = false; if (S.route === 'd/patient') render(); else renderDrawer(); },
    call: (el) => { const p = V.byId[el.dataset.id]; U.toast('Gọi ' + p.name + ': ' + p.phone + ' (số giả). Tính năng minh họa, demo không thực hiện cuộc gọi.'); },
    qtab: (el) => { S.qtab = el.dataset.v; S.qx = null; S.qc = null; if (S.route !== 'd/home') go('d/home'); else render(); },
    /* xử lý nhanh tại hàng đợi */
    qx: (el) => { const id = el.dataset.id; S.qx = S.qx === id ? null : id; S.qc = null; S.qmove = true; render(); },
    qdo: (el) => {
      const id = el.dataset.id, p = V.byId[id], k = el.dataset.k;
      if (k === 'appt') { S.qx = id; S.qc = null; render(); W.apNewModal(id, false); return; }
      if (k === 'lab') { S.pv.metric = 'lab'; openP(id, 'vit'); return; }
      if (k === 'open') { openP(id, 'sum'); return; }
      if (k === 'intake') { openP(id, 'intake'); return; }
      S.qx = id; S.qmove = true;
      if (k === 'call') { S.qc = null; if (!S.qnotes[id]) S.qnotes[id] = 'Đã gọi BN'; render(); U.toast('Gọi ' + p.name + ': ' + p.phone + ' (số giả). Tính năng minh họa, demo không thực hiện cuộc gọi.'); return; }
      S.qc = id; render();
    },
    qcancel: () => { S.qc = null; render(); },
    qchip: (el) => { const id = el.dataset.id, n = noteInput(el), mb = noteBox(el).querySelector('.qmsgbox'); S.qnotes[id] = el.dataset.v; if (n) { n.value = el.dataset.v; n.focus(); } if (mb) mb.innerHTML = ''; },
    qdone: (el) => {
      const id = el.dataset.id, p = V.byId[id], n = noteInput(el), inModal = !!el.closest('#modal'), note = (n ? n.value : S.qnotes[id] || '').trim();
      if (!note) { const mb = noteBox(el).querySelector('.qmsgbox'); if (mb) mb.innerHTML = box('errbox', 'Cần ghi chú ngắn: bấm một nút ghi chú hoặc tự nhập.'); if (n) n.focus(); return; }
      W.levelReasons(p).forEach((r) => { const k = id + ':' + r.code; if (W.alertState(id, r.code).status !== 'done') S.al[k] = { status: 'done', note, sig: W.sigOf(r), by: D.doctor.short, at: { d: 0, h: NOWH } }; });
      delete S.sn[id]; delete S.qnotes[id];
      if (inModal) { U.closeModal(); render(); U.toast('Đã xử lý ' + p.name + '. Mức không đổi.'); return; }
      nextInQueue('Đã xử lý ' + p.name + '. Mức không đổi.');
    },
    qsnooze: (el) => {
      const id = el.dataset.id, p = V.byId[id], n = +el.dataset.n, inp = noteInput(el), inModal = !!el.closest('#modal'), note = (inp ? inp.value : '').trim(), until = S.day + n;
      const rec = { d: 0, h: NOWH, by: D.doctor.short, text: 'Hẹn xem lại sau ' + n + ' ngày (' + T.fmtDMY(until) + ')' + (note ? ': ' + note : '') + '.' };
      (S.notes[id] = S.notes[id] || []).push(rec);
      S.sn[id] = { until, n, note, rec, sigs: S.cls[id].reasons.map(W.sigOf) };
      delete S.qnotes[id];
      if (inModal) { U.closeModal(); render(); U.toast(p.name + ': xem lại ' + T.fmtDM(until) + '. Tự quay lại khi có dữ liệu mới.'); return; }
      nextInQueue(p.name + ': xem lại ' + T.fmtDM(until) + '. Tự quay lại khi có dữ liệu mới.');
    },
    qundo: (el) => {
      const id = el.dataset.id, n = S.sn[id];
      if (n) { S.notes[id] = (S.notes[id] || []).filter((x) => x !== n.rec); delete S.sn[id]; } else W.levelReasons(V.byId[id]).forEach((r) => { delete S.al[id + ':' + r.code]; });
      if (!el.closest('#drawer') && S.route === 'd/home') { S.qx = id; S.qmove = true; } render(); U.toast('Đã hoàn tác.');
    },
    qtua: () => { S.day += 3; render(); U.toast('Demo đã tua thêm 3 ngày, chỉ để thử hẹn xem lại. Số liệu và ngày trên trang không đổi.'); },
    need: (el) => { const sr = $('#sres'), gs = $('#gs'); if (sr) sr.hidden = true; if (gs) gs.value = ''; S.pf = Object.assign({}, S.pf, { q: '', need: el.dataset.k, level: 'all', dx: 'all', rf: 'all', sort: 'risk' }); S.drawer = null; go('d/patients'); },
    print: () => U.toast('Tính năng minh họa: in/xuất tóm tắt. Bản chính thức sẽ cảnh báo quyền riêng tư và ghi nhật ký truy cập.'),
    /* bệnh nhân */
    plv: (el) => { const v = el.dataset.v; S.pf.level = v === 'severe' && S.pf.level === 'severe' ? 'all' : v; render(); },
    psort: (el) => { S.pf.sort = el.dataset.v; render(); },
    pclear: (el) => { const v = el.dataset.v; if (v === 'all') S.pf = Object.assign({}, S.pf, { q: '', need: 'all', level: 'all', dx: 'all', rf: 'all' }); else S.pf[v === 'q' ? 'q' : v] = v === 'q' ? '' : 'all'; render(); },
    export: () => { const L = W.filterPatients(); U.modal(W.modalHead('Xuất danh sách bệnh nhân') + '<div class="mbox-b"><div class="warnbox">Tệp CSV chứa thông tin bệnh nhân trong phạm vi đang lọc (' + L.length + ' bệnh nhân). Chỉ xuất khi cần cho công việc chuyên môn. Việc xuất được ghi nhật ký truy cập (minh họa).</div></div><div class="mbox-f"><button class="btn" data-a="mclose">Hủy</button><button class="btn primary" data-a="exportgo">' + ic('download') + 'Xuất CSV</button></div>'); },
    exportgo: () => {
      const L = W.filterPatients(), rows = [['Mã', 'Họ tên', 'Tuổi', 'Giới', 'Cơ sở', 'Chẩn đoán', 'Mức theo dõi', 'Vấn đề cần chú ý', 'HA TB 7 ngày (mmHg)', 'Tuân thủ 30 ngày (%)', 'Cập nhật gần nhất']].concat(L.map((p) => { const I = R.ind(p); return [p.id, p.name, p.age, U.sexName(p), U.site(p), U.dx(p), U.lvl[S.cls[p.id].level].t, W.issues(p).join('; '), I.bp.avg7 ? I.bp.avg7.s + '/' + I.bp.avg7.dia : '', I.adh.v ? I.adh.v.pct : '', U.dt(p.lastData.d, p.lastData.h)]; }));
      const csv = '﻿' + rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'benh-nhan-demo.csv'; document.body.appendChild(a); a.click(); a.remove();
      U.closeModal(); U.toast('Đã xuất ' + L.length + ' bệnh nhân (CSV, UTF-8). Ghi nhật ký truy cập: minh họa.');
    },
    addpt: () => W.addPtModal(),
    addptsave: () => {
      const name = val('p_name').trim(), age = parseInt(val('p_age'), 10);
      if (!name) return say('p_msg', box('errbox', 'Nhập họ và tên.'));
      if (!(age >= 0 && age <= 120)) return say('p_msg', box('errbox', 'Tuổi phải từ 0 đến 120.'));
      const n = D.unit.length + 1, id = 'P' + String(n).padStart(3, '0');
      const nul = { htn: null, dm: null, smoke: null, af: null, mi: null, pad: null, hf: null, ocvd: null, prior: null };
      const p = { id, doc: 'nam', name, age, sex: val('p_sex'), site: val('p_site'), phone: '0900 000 ' + String(n).padStart(3, '0'), family: null, doctor: D.doctor.name, coDoctor: null, consent: true, consentAdh: true, dx: { type: val('p_dx'), onset: null, nihss: null, mrs: null, reg: 0 }, rf: nul, ht: 165, meds: [], targets: {}, fsrp: null, life: { cig: null, alc: null, ex: null, diet: 'Chưa ghi nhận', sleep: null }, events: [], lastRecD: 0, bp: [], glu: [], weight: [], labs: { ldl: [], tc: [], a1c: [] }, lastData: { d: 0, h: T.NOW_H }, noData: true, appt: { d: 14, time: '08:30', status: 'scheduled', kind: 'Khám lần đầu', iv: 1 }, visits: [], req: null, thread: [], notes: [], history: [] };
      D.patients.push(p); D.unit.push(p); V.byId[id] = p; S.appts.push({ id: 'A' + aid++, pid: id, d: 14, time: '08:30', dur: 30, reason: 'Khám lần đầu', status: 'confirmed', by: 'doctor' });
      U.closeModal(); refresh(); U.toast('Đã tạo hồ sơ ' + name + ' (' + id + '). Chưa có số đo nên vào "Cần theo dõi".');
    },
    entry: (el) => { S.ew = false; W.entryModal(V.byId[el.dataset.id]); },
    entrysave: (el) => {
      const p = V.byId[el.dataset.id], f = { sys: val('e_sys'), dia: val('e_dia'), glu: val('e_glu'), kg: val('e_kg'), alc: val('e_alc') };
      if (!Object.values(f).some((x) => x !== '')) return say('e_msg', box('errbox', 'Nhập ít nhất một số đo.'));
      const v = R.validate(f);
      if (v.err.length) return say('e_msg', v.err.map((x) => box('errbox', esc(x))).join(''));
      if (v.warn.length && !S.ew) { S.ew = true; el.textContent = 'Vẫn lưu'; return say('e_msg', v.warn.map((x) => box('warnbox', esc(x))).join('') + '<div class="xs muted">Bấm "Vẫn lưu" nếu số đo đã được xác nhận.</div>'); }
      const h = T.NOW_H;
      if (f.sys !== '') { p.bp.push({ d: 0, slot: 'am', h, s: +f.sys, dia: +f.dia, src: 'NVYT nhập' }); p.bp.sort((a, b) => a.d - b.d || a.h - b.h); }
      if (f.glu !== '') { p.glu.push({ d: 0, h, v: +f.glu, src: 'NVYT nhập' }); p.glu.sort((a, b) => a.d - b.d || a.h - b.h); }
      if (f.kg !== '') p.weight.push({ d: 0, kg: +f.kg, src: 'NVYT nhập' });
      if (f.alc !== '') p.life.alc = +f.alc;
      p.lastData = { d: 0, h }; p.noData = false;
      const before = S.cls[p.id].level; derive(); const after = S.cls[p.id].level;
      U.closeModal(); render(); U.toast('Đã lưu (nguồn: NVYT nhập).' + (before !== after ? ' Mức theo dõi: ' + U.lvl[before].t + ' → ' + U.lvl[after].t + '.' : ''));
    },
    advnew: (el) => W.advModal(V.byId[el.dataset.id], el.dataset.k),
    advsave: (el) => {
      const p = V.byId[el.dataset.id], txt = val('a_txt').trim();
      if (!txt) return say('a_msg', box('errbox', 'Nhập nội dung lời khuyên.'));
      const tpl = val('a_tpl'), edu = D.education.find((e) => e.id === tpl), mod = R.modifiable(p).find((m) => m.k === tpl);
      (S.adv[p.id] = S.adv[p.id] || []).push({ d: 0, h: NOWH, by: D.doctor.short, title: edu ? edu.t : mod ? mod.t : 'Lời khuyên', text: txt });
      U.closeModal(); render(); U.toast('Đã gửi lời khuyên cho ' + p.name + ' (hiển thị trên app: minh họa).');
    },
    adoing: (el) => { S.al[el.dataset.k] = { status: 'doing' }; render(); },
    adone: (el) => W.alertDoneModal(el.dataset.k),
    adonesave: (el) => { const note = val('d_note').trim(); if (!note) return say('d_msg', box('errbox', 'Cần ghi chú hoặc lý do xử lý.')); const [mp, mc] = el.dataset.k.split(':'), mr = S.cls[mp].reasons.find((x) => x.code === mc); S.al[el.dataset.k] = { status: 'done', note, sig: mr ? W.sigOf(mr) : null, by: D.doctor.short, at: { d: 0, h: NOWH } }; U.closeModal(); render(); U.toast('Đã ghi nhận xử lý. Mức theo dõi giữ nguyên vì tính từ dữ liệu; bệnh nhân chuyển xuống cuối hàng đợi.'); },
    addnote: (el) => { const t = val('notebox').trim(); if (!t) return U.toast('Nhập nội dung ghi chú.'); (S.notes[el.dataset.id] = S.notes[el.dataset.id] || []).push({ d: 0, h: NOWH, by: D.doctor.short, text: t }); render(); U.toast('Đã lưu ghi chú.'); },
    pvm: (el) => { S.pv.metric = el.dataset.v; render(); },
    pvr: (el) => { S.pv.range = +el.dataset.v; render(); },
    /* tin nhắn */
    msel: (el) => { S.mg.sel = el.dataset.id; render(); },
    send: (el) => {
      const p = V.byId[el.dataset.id], b = el.dataset.box ? document.getElementById(el.dataset.box) : (el.closest('#drawer, #main') || document).querySelector('#msgbox'), t = b ? b.value.trim() : '';
      if (!t) return U.toast('Nhập nội dung tin nhắn.');
      p.thread.push({ d: 0, h: NOWH, from: 'bs', text: t }); S.drafts[p.id] = '';
      if (el.dataset.box) { S.qc = null; if (!S.qnotes[p.id]) S.qnotes[p.id] = 'Đã nhắn BN'; }
      refresh(); U.toast('Đã gửi (minh họa: demo không gửi tin thật).');
    },
    /* lịch */
    apmode: (el) => { S.ap.mode = el.dataset.v; render(); },
    apstep: (el) => { const v = +el.dataset.v; S.ap.anchor = v === 0 ? 0 : S.ap.mode === 'month' ? T.addMonths(S.ap.anchor, v > 0 ? 1 : -1) : S.ap.anchor + v; render(); },
    apday: (el) => { S.ap.anchor = +el.dataset.d; S.ap.mode = 'day'; render(); },
    apnew: (el) => W.apNewModal(el.dataset.id, el.dataset.edit === '1'),
    apnewsave: (el) => {
      const pid = val('n_pid'), p = V.byId[pid], d = parseDMY(val('n_date')), time = val('n_time'), reason = val('n_reason').trim(), edit = el.dataset.edit === '1';
      if (d == null) return say('n_msg', box('errbox', 'Ngày không hợp lệ. Nhập theo dd/mm/yyyy.'));
      if (d < 0 || (d === 0 && time <= '07:30')) return say('n_msg', box('errbox', 'Không tạo được lịch trong quá khứ.'));
      if (!reason) return say('n_msg', box('errbox', 'Cần nhập lý do khám.'));
      const dur = +val('n_dur');
      const ex = edit ? S.appts.find((a) => a.pid === pid && a.d === p.appt.d && (a.status === 'confirmed' || a.status === 'pending')) : null;
      if (ex) Object.assign(ex, { d, time, dur, reason, status: 'confirmed', by: 'doctor' }); else S.appts.push({ id: 'A' + aid++, pid, d, time, dur, reason, status: 'confirmed', by: 'doctor' });
      p.appt = Object.assign({}, p.appt, { d, time, status: 'scheduled' }); S.ap.anchor = d;
      U.closeModal(); refresh(); U.toast('Đã tạo lịch cho ' + p.name + ' (trạng thái: Đã xác nhận).');
    },
    apconfirm: (el) => { const a = S.appts.find((x) => x.id === el.dataset.id); if (a && a.status === 'pending') { a.status = 'confirmed'; refresh(); U.toast('Đã xác nhận lịch của ' + V.byId[a.pid].name + '. Đã gửi thông báo cho bệnh nhân (minh họa).'); } },
    apcancel: (el) => { const a = S.appts.find((x) => x.id === el.dataset.id); if (a && (a.status === 'pending' || a.status === 'confirmed')) { a.status = 'canceled'; refresh(); U.toast('Đã hủy lịch. Trạng thái cuối, không đổi lại được.'); } },
    apdone: (el) => {
      const a = S.appts.find((x) => x.id === el.dataset.id); if (!a || a.status !== 'confirmed') return;
      const p = V.byId[a.pid]; S.mrsPick = null;
      U.modal(W.modalHead('Hoàn tất khám · ' + p.name) + '<div class="mbox-b">' + (p.dx.type !== 'NONE' ? '<div class="f">mRS hôm nay<div class="seg mrs-pick" role="radiogroup" aria-label="mRS hôm nay">' + V.ins.MRS.slice(0, 6).map((t, i) => '<button data-a="mrspick" data-v="' + i + '" role="radio" aria-checked="false" title="' + esc(t) + '">' + i + '</button>').join('') + '</div></div>' : '') + '<label class="f">Kết luận<textarea id="c_txt" rows="3"></textarea></label><div id="c_msg"></div></div><div class="mbox-f"><button class="btn" data-a="mclose">Hủy</button><button class="btn primary" data-a="apdonesave" data-id="' + a.id + '">Hoàn tất</button></div>');
    },
    mrspick: (el) => { S.mrsPick = +el.dataset.v; el.parentElement.querySelectorAll('button').forEach((b) => { b.classList.toggle('on', b === el); b.setAttribute('aria-checked', b === el); }); },
    apdonesave: (el) => {
      const a = S.appts.find((x) => x.id === el.dataset.id), t = val('c_txt').trim(); if (!t) return say('c_msg', box('errbox', 'Cần nhập kết luận khám.'));
      const p = V.byId[a.pid]; a.status = 'done'; a.conclusion = t;
      if (S.mrsPick != null) (p.mrsLog = p.mrsLog || []).push({ d: a.d, v: S.mrsPick });
      if (p.appt.d === a.d) p.appt.status = 'done';
      U.closeModal(); refresh(); U.toast('Đã hoàn tất khám' + (S.mrsPick != null ? ', mRS ' + S.mrsPick : '') + '.');
    },
    /* công cụ tính */
    tool: (el) => { S.tool = el.dataset.v; render(); },
    tireset: () => { S.ti = {}; render(); },
    ti: (el) => { const k = el.dataset.k, v = el.dataset.v === 'u' ? null : Number(el.dataset.v); if (k === 'cvd') ['mi', 'pad', 'hf', 'ocvd'].forEach((x) => { S.ti[x] = v; }); S.ti[k] = v; render(); },
    /* cài đặt */
    setsuggest: () => { S.set.days.forEach((d, i) => { d.on = i < 5; d.from = '08:00'; d.to = '11:30'; }); render(); },
    setsave: () => { const bad = S.set.days.findIndex((d) => d.on && d.from >= d.to); if (bad >= 0) return U.toast('Giờ kết thúc phải sau giờ bắt đầu (' + ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'][bad] + ').'); S.set.saved = '07:31 ' + T.fmtDMY(0); render(); U.toast('Đã lưu lịch cố định.'); },
    busyadd: () => { const d = parseDMY(val('bdate')), f = val('bfrom'), t = val('bto'); if (d == null) return say('berr', box('errbox', 'Ngày không hợp lệ. Nhập theo dd/mm/yyyy.')); if (d < 0) return say('berr', box('errbox', 'Không thêm lịch bận trong quá khứ.')); if (f >= t) return say('berr', box('errbox', 'Giờ kết thúc phải sau giờ bắt đầu.')); S.set.busy.push({ d, from: f, to: t, note: val('bnote') }); S.set.busy.sort((a, b) => a.d - b.d); render(); U.toast('Đã lưu lịch bận.'); },
    busydel: (el) => { S.set.busy.splice(+el.dataset.i, 1); render(); },
    /* quản lý */
    mdoc: (el) => go('m/doctor/' + el.dataset.id),
    nudge: (el) => { const p = V.byId[el.dataset.id]; S.nudged[p.id] = true; render(); U.toast('Đã nhắc ' + p.doctor + ' trả lời ' + p.name + ' (minh họa).'); },
    mq: (el) => { S.mq = el.dataset.q; go('m/list'); },
    mback: () => go('m/overview'),
    cfgreset: () => { S.cfgDraft = Object.assign({}, R.DEFAULT_CFG); render(); },
    cfgcancel: () => { S.cfgDraft = null; render(); },
    cfgsave: () => { const n = W.cfgShift(S.cfgDraft); R.cfg = S.cfgDraft; S.cfgDraft = null; refresh(); U.toast('Đã lưu ngưỡng cho cả khoa. ' + n + ' bệnh nhân đổi mức.'); },
    mclose: () => U.closeModal(),
    /* hồ sơ ban đầu: bác sĩ xác nhận câu người bệnh tự khai */
    icfm: (el) => W.intakeConfirm(V.byId[el.dataset.id]),
    icfv: (el) => { S.icf[el.dataset.k] = el.dataset.v; el.parentElement.querySelectorAll('button').forEach((b) => { b.classList.toggle('on', b === el); b.setAttribute('aria-checked', b === el); }); },
    icfsave: (el) => { const p = V.byId[el.dataset.id]; Object.keys(S.icf).forEach((id) => { p.facts[id] = { v: S.icf[id], source: 'doctor', by: D.doctor.short, t: 0 }; }); U.closeModal(); refresh(); U.toast('Đã xác nhận bệnh nền của ' + p.name + '.'); },
  };
  R.cfgSet = (k, v) => { R.cfg[k] = v; };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (e.target.closest && e.target.closest('.nav a') && S.drawer) { S.drawer = null; S.pdmenu = false; renderDrawer(); }
    if (S.pdmenu && !(el && el.dataset.a === 'pdmenu')) { S.pdmenu = false; if (S.route === 'd/patient') render(); else if (S.drawer) renderDrawer(); }
    if (!el) { if (S.menu && !e.target.closest('.menu')) { S.menu = null; renderTop(); } const sr = $('#sres'); if (sr && !e.target.closest('.tb-search')) sr.hidden = true; return; }
    const a = el.dataset.a; if (el.tagName === 'A') e.preventDefault();
    if (S.role === 'manager' && W.WRITE.includes(a)) return; // quản lý chỉ đọc hồ sơ
    if (S.menu && a !== 'umenu') S.menu = null;
    if (H[a]) { e.stopPropagation(); H[a](el, e); if (S.menu === null && $('#top') && $('#top').querySelector('.menu')) renderTop(); }
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target, typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName);
    if (e.key === 'Enter' && t.dataset && t.dataset.a === 'open' && !typing) { H.open(t); return; }
    if ((e.key === 'Enter' || e.key === ' ') && t.dataset && (t.dataset.a === 'qx' || t.dataset.a === 'mdoc') && !typing) { e.preventDefault(); H[t.dataset.a](t); return; }
    if (e.key === 'Escape') { if (!$('#modal').hidden) U.closeModal(); else if (S.pdmenu) H.pdmenu(); else if ((S.drawer || S.route === 'd/patient') && curV() && curV().tab !== 'home') H.sheetclose(); else if (S.drawer) H.close(); else if (S.qx) { S.qx = null; S.qc = null; render(); } const sr = $('#sres'); if (sr) sr.hidden = true; return; }
    if (typing || e.ctrlKey || e.metaKey) { if (t.id === 'gs' && e.key === 'Enter') { const sr = $('#sres'), nk = V.ins.needOf(t.value); if (nk) { H.need({ dataset: { k: nk } }); return; } if (S.sres.length) { sr.hidden = true; t.value = ''; openP(S.sres[0].id); } } return; }
    if (e.key === '/' && S.role === 'doctor') { e.preventDefault(); const gs = $('#gs'); if (gs) gs.focus(); }
    if ((e.key === 'j' || e.key === 'k') && S.role === 'doctor' && S.drawer) {
      const L = S.route === 'd/home' ? W.queueList(S.qtab) : S.route === 'd/patients' ? W.filterPatients() : D.patients; const i = L.findIndex((p) => p.id === S.drawer.id);
      const n = L[i + (e.key === 'j' ? 1 : -1)]; if (n) { S.drawer.id = n.id; S.drawer.direct = false; render(); }
    }
  });
  document.addEventListener('input', (e) => {
    const t = e.target, i = t.dataset && t.dataset.i;
    if (i === 'gs') {
      const q = V.ins.norm(t.value), sr = $('#sres'), nk = V.ins.needOf(t.value), need = nk && V.ins.NEEDS[nk];
      if (S.route === 'd/patients' && !need) { sr.hidden = true; S.pf.q = t.value; renderMain(); return; }
      const hit = need ? D.patients.filter((p) => need.f(p, S.cls[p.id])).sort((a, b) => ({ act: 0, watch: 1, ok: 2 })[S.cls[a.id].level] - ({ act: 0, watch: 1, ok: 2 })[S.cls[b.id].level]) : [];
      const names = q ? D.patients.filter((p) => V.ins.norm(p.name + ' ' + p.id + ' ' + p.phone).includes(q) && !hit.includes(p)) : [];
      S.sres = hit.concat(names).slice(0, 7); sr.hidden = !q;
      const row = (p) => { const why = need && hit.includes(p) ? V.ins.needWhy(nk, p, S.cls[p.id]) : ''; return '<button data-a="open" data-id="' + p.id + '">' + U.av(p, S.cls[p.id].level) + '<span><b>' + esc(p.name) + '</b> <span class="xs muted">' + p.id + ' · ' + p.age + ' · ' + U.dxShort(p) + (why ? '<br>' + esc(why) : '') + '</span></span></button>'; };
      sr.innerHTML = (need ? '<button class="sneed" data-a="need" data-k="' + nk + '">' + ic('list') + '<span><b>' + esc(need.t) + '</b> · ' + hit.length + ' bệnh nhân của bạn<br><span class="xs muted">Bấm hoặc Enter để xem cả danh sách</span></span></button>' : '') + (S.sres.length ? S.sres.map(row).join('') : need ? '' : '<div class="empty">Không tìm thấy bệnh nhân.</div>');
    }
    else if (i === 'qnote') { S.qnotes[t.dataset.id] = t.value; }
    else if (i === 'draft') { S.drafts[t.dataset.id] = t.value; }
  });
  document.addEventListener('change', (e) => {
    const t = e.target, i = t.dataset && t.dataset.i, v = t.type === 'checkbox' ? t.checked : t.value;
    const map = { tplsel: () => { if (v === '') return; const p = V.byId[t.dataset.id], txt = W.fillTpl(W.TPL[+v].x, p), b = (t.closest('.composer, .qcomp') || document).querySelector('textarea'); S.drafts[p.id] = txt; if (b) { b.value = txt; b.focus(); } t.value = ''; }, pdx: () => { S.pf.dx = v; render(); }, prf: () => { S.pf.rf = v; render(); }, apfilter: () => { S.ap.filter = v; render(); },
      tiage: () => { S.ti.age = v; render(); }, tisex: () => { S.ti.sex = v || undefined; render(); }, tievent: () => { S.ti.event = v || undefined; render(); }, ticlin: () => { S.ti.clin = v || undefined; render(); }, tidur: () => { S.ti.dur = v || undefined; render(); },
      tipick: () => { if (!v) return; const p = V.byId[v], a7 = R.avgBP(p, 7); S.ti = Object.assign({ age: p.age, sex: p.sex, event: p.dx.type }, p.rf, { cvd: undefined, bp140: a7 ? (a7.s >= 140 || a7.dia >= 90 ? 1 : 0) : undefined }); render(); },
      setOn: () => { S.set.days[+t.dataset.d].on = v; render(); }, setT: () => { S.set.days[+t.dataset.d][t.dataset.k] = v; },
      qsn: () => { if (!v) return; t.dataset.n = v; H.qsnooze(t); },
      // Ngưỡng: sửa vào bản nháp, chỉ áp dụng khi bấm Lưu.
      cfg: () => { const n = parseFloat(v), k = t.dataset.k; if (!(n >= 0)) { t.value = (S.cfgDraft || R.cfg)[k]; U.toast('Nhập số từ 0 trở lên.'); return; } S.cfgDraft = Object.assign({}, S.cfgDraft || R.cfg, { [k]: n }); render(); } };
    if (map[i]) map[i]();
  });
  const tipEl = document.createElement('div'); tipEl.className = 'ctip'; tipEl.hidden = true; document.body.appendChild(tipEl);
  document.addEventListener('mousemove', (e) => {
    const h = e.target.closest && e.target.closest('[data-tip]');
    if (!h) { tipEl.hidden = true; return; }
    tipEl.textContent = h.dataset.tip; tipEl.hidden = false;
    tipEl.style.left = Math.min(innerWidth - tipEl.offsetWidth - 8, e.clientX + 12) + 'px'; tipEl.style.top = (e.clientY - 34) + 'px';
  });
  window.addEventListener('resize', () => W.fitChart());
  window.addEventListener('hashchange', () => { parseHash(); S.drawer = null; S.menu = null; render(); });

  parseHash(); render();
  V.debug = { S, H, refresh };
})(typeof globalThis !== 'undefined' ? globalThis : window);
