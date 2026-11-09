'use strict';
// Trang chủ: thẻ chào, Hôm nay ở giữa, năm ô chức năng. Thông báo. Liên hệ.
// Nhập ở Hôm nay thì sau khi lưu số liệu nằm ở ô chức năng tương ứng; xem lại lịch sử và biểu đồ thì vào ô đó.

const TILES = [
  ['gauge', 'Dự đoán nguy cơ', { v: 'risk' }],
  ['pill', 'Thuốc', { v: 'meds' }],
  ['doc', 'Hồ sơ sức khỏe', { v: 'metrics' }],
  ['msg', 'Liên hệ', { v: 'contact' }],
  ['book', 'Giáo dục sức khỏe', { v: 'learn' }],
];

V.home = () => {
  const p = P(), ms = now();
  let h = topBar();
  if (isProxy()) h += `<div class="banner">Đang chăm: ${esc(p.name)}</div>`;
  h += `<section class="hello"><span class="hello-mark">${icon('brain')}</span><div><p class="hello-sub">Chào mừng</p>${h1(p.name, 'sm')}</div></section>`;
  h += `<section class="group"><div class="group-head"><h2>Hôm nay</h2><span class="date-text">${WD[new Date(ms).getDay()]}, ${ddmm(ms)}</span></div><div class="stack">${todayBlock()}</div></section>`;
  h += `<div class="tiles">${TILES.map(([ic, name, q]) => `<button class="tile-btn" ${on('go', q)}>${icon(ic)}<span>${name}</span></button>`).join('')}</div>`;
  return { chrome: 'tab', html: h };
};

// Thông báo: không lưu riêng, lấy từ những gì app đang biết
V.notif = () => {
  const p = P(), ms = now(), rows = [], ap = nextAppt(p), remain = riskRemaining(p, ms);
  p.messages.filter(m => !m.read).forEach(m => rows.push(row({ icon: 'msg', title: esc(m.from), value: ddmm(m.t), a: 'openChat' })));
  if (p.recheckAt) rows.push(row({ icon: 'heart', title: 'Đo lại huyết áp', value: hhmm(p.recheckAt), a: 'startBP' }));
  if (ap && ap.t >= ms && daysBetween(ms, ap.t) <= 7) rows.push(row({ icon: 'cal', title: 'Tái khám', value: `${WD_S[new Date(ap.t).getDay()]} ${ddmm(ap.t)}`, a: 'go', p: { v: 'visit' } }));
  medsEnding(p, ms, 5).forEach(m => rows.push(row({ icon: 'pill', title: esc(m.name), value: `Còn ${daysLeft(m, ms)} ngày`, tone2: 'amber', a: 'go', p: { v: 'medDetail', id: m.id } })));
  if (remain.length) rows.push(row({ icon: 'gauge', title: `Còn ${remain.length} câu hỏi`, a: 'go', p: { v: 'risk' } }));
  if ((D.prompt7 || D.bpSaved >= 10) && !D.dismissed.feedback) rows.push(row({ icon: 'star', title: 'Bạn thấy app thế nào?', a: 'go', p: { v: 'feedback' } }));
  return { chrome: 'tab', html: topBar() + h1('Thông báo') + (rows.length ? group(rows) : '<section class="card empty"><p class="lead">Chưa có thông báo</p></section>') };
};
