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

// Thông báo: ba phần như thiết kế (Tin nhắn mới, Nhắc uống thuốc, Cập nhật chỉ số). Không lưu riêng, lấy từ những gì app đang biết.
const NTABS = [['msg', 'Tin nhắn'], ['med', 'Nhắc thuốc'], ['idx', 'Chỉ số']];
function notifParts(p, ms) {
  const ap = nextAppt(p), remain = riskRemaining(p, ms), pl = plan();
  const msg = [];
  p.messages.filter(m => !m.read).forEach(m => msg.push(row({ icon: 'msg', title: esc(m.from), value: ddmm(m.t), a: 'openChat' })));
  if (ap && ap.t >= ms && daysBetween(ms, ap.t) <= 7) msg.push(row({ icon: 'cal', title: 'Tái khám', value: `${WD_S[new Date(ap.t).getDay()]} ${ddmm(ap.t)}`, a: 'go', p: { v: 'visit' } }));
  if (remain.length) msg.push(row({ icon: 'gauge', title: `Còn ${remain.length} câu hỏi`, a: 'go', p: { v: 'risk' } }));
  if ((D.prompt7 || D.bpSaved >= 10) && !D.dismissed.feedback) msg.push(row({ icon: 'star', title: 'Bạn thấy app thế nào?', a: 'go', p: { v: 'feedback' } }));
  // Nhắc thuốc: từng buổi, tên thuốc, hàm lượng, số lượng, đúng theo thuốc và giờ đã cài
  const med = pl.filter(m => m.items.some(i => i.kind === 'meds')).map(m => {
    const it = m.items.find(i => i.kind === 'meds');
    return `<section class="card"><div class="card-head">Thuốc buổi ${m.word}<span class="aside">${it.filled ? statusIcon('good') : ''}${m.time}</span></div><div class="list">${it.meds.map(x => row({ title: esc(medName(x)), value: esc(x.dose) })).join('')}</div>${it.filled ? '' : btn('Ghi đã dùng', 'openMoment', { mk: m.key }, 'soft')}</section>`;
  });
  const ending = medsEnding(p, ms, 5).map(m => row({ icon: 'pill', title: esc(medName(m)), value: `Còn ${daysLeft(m, ms)} ngày`, tone2: 'amber' }));
  const idx = [];
  if (p.recheckAt) idx.push(row({ icon: 'heart', title: 'Đo lại huyết áp', value: hhmm(p.recheckAt), a: 'startBP' }));
  pl.forEach(m => m.items.filter(i => i.kind !== 'meds').forEach(i => idx.push(row({ icon: KIND[i.kind].icon, title: `${KIND[i.kind].name} buổi ${m.word}`, value: i.done ? '' : m.time, status: i.done ? 'good' : '', a: i.done ? 'go' : KIND[i.kind].start, p: i.done ? { v: KIND[i.kind].detail } : {} }))));
  const wk = weeklyKind(p, ms);
  if (wk) idx.push(row({ icon: HABITS[wk].icon, title: `${HABITS[wk].name} tuần này`, a: 'go', p: { v: 'lifestyle', k: wk } }));
  return { msg, med, ending, idx };
}
V.notif = () => {
  const p = P(), ms = now(), n = notifParts(p, ms), tab = S.draft.ntab || 'msg', cnt = { msg: n.msg.length, med: n.med.filter(c => /Ghi đã dùng/.test(c)).length + n.ending.length, idx: n.idx.filter(r => !/st green/.test(r)).length };
  let h = topBar() + h1('Thông báo') + seg(NTABS.map(([k, l]) => [k, cnt[k] ? `${l} (${cnt[k]})` : l]), tab, 'ntab');
  if (tab === 'msg' && n.msg.length) h += `<div class="group-head"><span></span><button class="link" ${on('notifRead')}>Đọc tất cả</button></div>`;
  const body = tab === 'med' ? n.med.join('') + group(n.ending, n.ending.length ? { title: 'Sắp hết thuốc' } : null) : group(tab === 'msg' ? n.msg : n.idx);
  h += body || '<section class="card empty"><p class="lead">Chưa có thông báo</p></section>';
  return { chrome: 'tab', html: h };
};
A.ntab = ({ v }) => { S.draft.ntab = v; };
A.notifRead = () => { P().messages.forEach(m => { m.read = true; }); D.dismissed.feedback = true; };
