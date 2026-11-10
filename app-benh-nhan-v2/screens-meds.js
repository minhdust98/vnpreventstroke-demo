'use strict';
// Tab Thuốc: liều hôm nay, tuân thủ 7 và 30 ngày, danh sách thuốc, thêm và sửa thuốc.

const ymd = s => (s ? s.split('-').reverse().join('/') : '');
const groupLabel = g => (MED_CATALOG.find(x => x.group === g) || { label: 'Thuốc khác' }).label;

V.meds = () => {
  const p = P(), ms = now(), t = times(), active = medsActive(p, ms);
  let h = topBar({ back: 'Trang chủ' }) + h1('Thuốc');
  if (!p.meds.length) return { chrome: 'push', html: `${h}<section class="card"><p class="lead">Chưa có thuốc</p>${btn(`${icon('plus')}Thêm thuốc`, 'medNew')}</section>` };
  const today = plan().filter(m => m.items.some(i => i.kind === 'meds')).map(m => {
    const it = m.items.find(i => i.kind === 'meds');
    return row({ icon: 'pill', title: `${m.label} · ${m.time}`, value: `${it.taken}/${it.total}`, status: it.filled ? 'good' : '', a: 'openMoment', p: { mk: m.key }, aria: `Thuốc buổi ${m.word}, đã dùng ${it.taken} trên ${it.total}` });
  });
  h += group(today, { title: 'Hôm nay' });
  // Một thẻ: 7 chấm cho 7 ngày, tỷ lệ chưa dùng (7 hoặc 30 ngày), câu khích lệ theo BRD
  const days = [6, 5, 4, 3, 2, 1, 0].map(i => ms - i * DAY), word = { full: 'đủ', partial: 'một phần', missed: 'bỏ lỡ', none: 'không có ghi nhận', ongoing: 'đang diễn ra', nodoses: 'không có thuốc' };
  const per = S.draft.missDays || 30, mr = missRate(p, per, ms, t), k = adherenceKey(adherence(p, 30, ms, t));
  h += `<section class="card"><div class="dots" role="group" aria-label="7 ngày">${days.map(d => { const s = dayDoseState(p, d, ms, t); return `<div class="day"><span class="dot ${s}" role="img" aria-label="${ddmm(d)}: ${word[s]}">${s === 'full' ? icon('check') : ''}</span>${WD_S[new Date(d).getDay()]}</div>`; }).join('')}</div>`
    + seg([[7, '7 ngày'], [30, '30 ngày']], per, 'missDays')
    + (mr.due ? `<p class="lead">Chưa dùng: ${mr.not}/${mr.due} lần</p>` : '') + (k === 'none' ? '' : `<p class="body">${k === 'good' ? BRD.medGood : BRD.medImprove}</p>`) + '</section>';
  h += group(active.map(m => { const left = m.end ? daysLeft(m, ms) : 99; return row({ icon: 'pill', title: esc(medName(m)), value: left <= 7 ? `Còn ${left} ngày` : momentsText(m), tone2: left <= 7 ? 'amber' : '', a: 'go', p: { v: 'medDetail', id: m.id } }); }), { title: 'Đang dùng', action: { label: 'Thêm', icon: 'plus', a: 'medNew' } });
  h += group([FEATURES.missedHelp ? row({ icon: 'book', title: 'Khi quên liều', a: 'go', p: { v: 'article', topic: 'meds', id: 'missed' } }) : '', row({ icon: 'bell', title: 'Nhắc nhở', a: 'go', p: { v: 'reminders' } })]);
  const off = p.meds.filter(m => !active.includes(m));
  h += group(off.map(m => row({ title: esc(medName(m)), value: m.paused ? 'Tạm dừng' : `Hết ${ymd(m.end)}`, a: 'go', p: { v: 'medDetail', id: m.id } })), off.length ? { title: 'Đã ngừng' } : null);
  return { chrome: 'push', html: h };
};
A.openMoment = ({ mk }) => sheet('moment', { mk });
A.missDays = ({ v }) => { S.draft.missDays = Number(v); };

V.medDetail = ({ id }) => {
  const m = P().meds.find(x => x.id === id);
  let h = topBar({ back: 'Thuốc' }) + h1(m.name, 'sm');
  h += group([
    row({ title: 'Nhóm', value: esc(groupLabel(m.group)) }),
    row({ title: 'Liều', value: esc([m.strength, m.dose].filter(Boolean).join(', ')) }),
    row({ title: 'Buổi', value: m.moments.map(x => `${mo(x).label} ${(m.times && m.times[x]) || mo(x).time}`).join(', ') }),
    row({ title: 'Đường dùng', value: esc(m.route) }),
    row({ title: 'Từ ngày', value: ymd(m.start) }),
    row({ title: 'Đến ngày', value: m.end ? ymd(m.end) : 'Dài hạn' }),
    m.note ? row({ title: 'Lưu ý', value: esc(m.note) }) : '',
  ]);
  const r7 = missRate(P(), 7, now(), times(), id), r30 = missRate(P(), 30, now(), times(), id);
  if (r30.due) h += group([r7.due ? row({ title: 'Chưa dùng 7 ngày', value: `${r7.not}/${r7.due} lần` }) : '', row({ title: 'Chưa dùng 30 ngày', value: `${r30.not}/${r30.due} lần` })]);
  h += btn('Sửa', 'medEdit', { id }, 'soft') + btn(m.paused ? 'Nhắc lại' : 'Tạm dừng nhắc', 'medPause', { id }, 'soft') + btn('Xóa thuốc', 'medDel', { id }, 'plain');
  return { chrome: 'push', html: h };
};
A.medPause = ({ id }) => {
  const m = P().meds.find(x => x.id === id);
  if (m.paused) { m.paused = false; return; }
  dialog({ title: 'Tạm dừng nhắc thuốc này?', body: `<p class="body">${m.group === 'anticoag' ? 'Tự ngừng thuốc chống đông có thể nguy hiểm. ' : ''}Chỉ dừng khi bác sĩ đã dặn.</p>`, buttons: [{ label: 'Giữ nhắc thuốc', a: 'closeDialog' }, { label: 'Bác sĩ đã dặn, tạm dừng', a: 'medPauseYes', p: { id }, cls: 'soft' }] });
};
A.medPauseYes = ({ id }) => { P().meds.find(x => x.id === id).paused = true; S.dialog = null; };
A.medDel = ({ id }) => dialog({ title: 'Xóa thuốc này?', body: '<p class="body">Lịch sử đã ghi vẫn được giữ.</p>', buttons: [{ label: 'Giữ lại', a: 'closeDialog' }, { label: 'Xóa', a: 'medDelYes', p: { id }, cls: 'soft' }] });
A.medDelYes = ({ id }) => { const m = P().meds.find(x => x.id === id); m.end = dayKey(now() - DAY); m.paused = true; S.dialog = null; back(); toast('Đã xóa'); };

// ---- Thêm hoặc sửa thuốc, theo thiết kế "Tự nhập thuốc": tên (có gợi ý khi gõ), hàm lượng, liều, thời điểm uống,
// số lần dùng, giờ từng lần kèm bật nhắc, ngày bắt đầu và kết thúc. Giờ gõ vào được gán về buổi gần nhất (sáng, trưa, chiều, tối). ----
const momentAt = hhmmStr => { const h = Number(hhmmStr.split(':')[0]); return h < 11 ? 'sang' : h < 14 ? 'trua' : h < 19 ? 'chieu' : 'toi'; };
const slotsFor = n => [['07:00'], ['07:00', '20:00'], ['07:00', '12:00', '20:00'], ['07:00', '12:00', '17:00', '20:00']][n - 1].map(time => ({ time, on: true }));
const NOTE_OPTS = [['before', 'Trước ăn'], ['mid', 'Trong bữa ăn'], ['after', 'Sau ăn'], ['none', 'Không yêu cầu']];
const noteKey = note => (NOTE_OPTS.find(([, l]) => l === note) || ['none'])[0];
A.medNew = () => { S.draft.med = { name: '', group: '', strength: '', dose: '', note: '', route: 'Uống', slots: slotsFor(1), start: dayKey(now()), end: dayKey(now() + 30 * DAY) }; go('medForm'); };
A.medEdit = ({ id }) => {
  const m = P().meds.find(x => x.id === id);
  S.draft.med = Object.assign({}, m, { editId: id, slots: m.moments.map(k => ({ time: (m.times && m.times[k]) || D.settings.times[k], on: !m.remind || m.remind[k] !== false })), end: m.end || '' });
  go('medForm');
};
// Gợi ý tên thuốc từ danh mục khi gõ; vẽ vào ô riêng để không mất con trỏ
function medSuggest() {
  const f = S.draft.med, q = (f.name || '').trim().toLowerCase();
  if (!q) return '';
  const hits = [];
  MED_CATALOG.forEach(g => g.items.forEach(i => { if (i[0].toLowerCase().includes(q) && i[0].toLowerCase() !== q) hits.push({ g: g.group, n: i[0], l: g.label }); }));
  return hits.length ? group(hits.slice(0, 5).map(x => row({ title: esc(x.n), value: esc(x.l), a: 'medSuggestPick', p: { g: x.g, n: x.n } }))) : '';
}
const medItem = f => { const cat = MED_CATALOG.find(g => g.group === f.group); return cat && cat.items.find(i => i[0] === f.name); };
V.medForm = () => {
  const f = S.draft.med, item = medItem(f), n = f.slots.length;
  const input = (id, label, field, val, ph) => `<div><label class="label" for="${id}">${label}</label><input id="${id}" class="input" data-field="${field}" value="${esc(val)}" placeholder="${esc(ph || '')}" autocomplete="off"></div>`;
  let h = topBar({ close: true }) + h1(f.editId ? 'Sửa thuốc' : 'Thêm thuốc', 'sm');
  if (!f.editId) h += `<div class="two">${btn(`${icon('camera')}Chụp đơn thuốc`, 'scan', { target: 'rx' }, 'soft')}${btn(`${icon('qr')}Quét mã QR`, 'rxQr', {}, 'soft')}</div>`;
  h += input('mn', 'Tên thuốc', 'medName', f.name, 'Nhập tên thuốc') + `<div id="medSuggest" class="stack">${medSuggest()}</div>`;
  h += input('ms', 'Hàm lượng thuốc', 'medStrength', f.strength, 'Ví dụ: 500 mg');
  if (item && item[1].length > 1) h += chips(item[1].map(x => [x, x]), f.strength, 'medF', { k: 'strength' }, 'wrap');
  h += input('md', 'Liều dùng', 'medDose', f.dose, 'Ví dụ: 2 viên') + chips(DOSES.map(x => [x, x]), f.dose, 'medF', { k: 'dose' }, 'wrap');
  h += `<h2 class="label">Thời điểm uống</h2>${chips(NOTE_OPTS.map(([k, l]) => [k, l]), noteKey(f.note), 'medNote', {}, 'grid')}`;
  h += `<h2 class="label">Số lần dùng</h2>${chips([1, 2, 3, 4].map(k => [String(k), `${k} lần mỗi ngày`]), String(n), 'medTimes', {}, 'grid')}`;
  h += f.slots.map((s, i) => group([`<label class="row date-row time-row"><span class="row-title">Giờ uống lần ${i + 1}</span><span class="row-value">${esc(s.time)}</span><input type="time" data-field="medTime" data-i="${i}" value="${esc(s.time)}" aria-label="Giờ uống lần ${i + 1}"></label>`, toggle('Nhắc uống thuốc', s.on, 'medRemind', { i })])).join('');
  h += group([`<label class="row date-row"><span class="row-title">Ngày bắt đầu</span><span class="row-value">${dmy(f.start)}</span><input type="date" data-field="medStart" value="${esc(f.start)}" aria-label="Ngày bắt đầu"></label>`, f.end ? `<label class="row date-row"><span class="row-title">Ngày kết thúc</span><span class="row-value">${dmy(f.end)}</span><input type="date" data-field="medEnd" value="${esc(f.end)}" min="${esc(f.start)}" aria-label="Ngày kết thúc"></label>` : '', toggle('Dùng dài hạn', !f.end, 'medLong')]);
  h += group(row({ title: 'Đường dùng', value: esc(f.route), a: 'medRoute' }));
  h += `<div class="cta">${btn('Lưu thuốc', 'medSave')}</div>`;
  return { chrome: 'modal', html: h };
};
F.medName = v => {
  const f = S.draft.med; f.name = v;
  const hit = MED_CATALOG.flatMap(g => g.items.map(i => ({ g: g.group, n: i[0] }))).find(x => x.n.toLowerCase() === v.trim().toLowerCase());
  f.group = hit ? hit.g : 'other';
  const el = document.getElementById('medSuggest'); if (el) { el.innerHTML = medSuggest(); if (D.settings.lang === 'en') translateTree(el); }
};
F.medDose = v => { S.draft.med.dose = v; };
F.medStrength = v => { S.draft.med.strength = v; };
F.medTime = (v, el) => { if (v) S.draft.med.slots[Number(el.dataset.i)].time = v; };
F.medStart = v => { S.draft.med.start = v; };
F.medEnd = v => { S.draft.med.end = v; };
A.medSuggestPick = ({ g, n }) => { const f = S.draft.med, c = MED_CATALOG.find(x => x.group === g).items.find(i => i[0] === n); Object.assign(f, { group: g, name: n, strength: c[1].length === 1 ? c[1][0] : f.strength }); S.focus = true; };
A.medF = ({ k, v }) => { S.draft.med[k] = v; };
A.medNote = ({ v }) => { S.draft.med.note = (NOTE_OPTS.find(([k]) => k === v) || [0, ''])[1] === 'Không yêu cầu' ? '' : NOTE_OPTS.find(([k]) => k === v)[1]; };
A.medTimes = ({ v }) => { const f = S.draft.med, n = Number(v); if (n !== f.slots.length) f.slots = slotsFor(n); };
A.medRemind = ({ i }) => { const s = S.draft.med.slots[Number(i)]; s.on = !s.on; };
A.medLong = () => { const f = S.draft.med; f.end = f.end ? '' : dayKey(new Date(`${f.start}T12:00:00`).getTime() + 30 * DAY); };
A.medRoute = () => sheet('medRouteSheet');
V.medRouteSheet = () => ({ title: 'Đường dùng', html: `${sheetHead('Đường dùng')}${chips(ROUTES.map(r => [r, r]), S.draft.med.route, 'medRouteSet')}` });
A.medRouteSet = ({ v }) => { S.draft.med.route = v; S.sheet = null; };
A.medSave = () => {
  const f = S.draft.med, p = P();
  if (!f.name.trim()) { toast('Nhập tên thuốc'); return false; }
  if (f.end && f.end < f.start) { toast('Ngày kết thúc phải sau ngày bắt đầu'); return false; }
  const moments = [...new Set(f.slots.map(s => momentAt(s.time)))], times = {}, remind = {};
  f.slots.forEach(s => { const k = momentAt(s.time); times[k] = s.time; remind[k] = s.on; });
  const rec = { name: f.name.trim(), group: f.group || 'other', strength: f.strength.trim(), dose: f.dose.trim() || '1 viên', moments, times, remind, start: f.start, end: f.end || null, note: f.note, route: f.route };
  if (f.editId) Object.assign(p.meds.find(x => x.id === f.editId), rec);
  else p.meds.push(Object.assign({ id: `m${Date.now()}`, source: 'self' }, rec));
  S.draft.med = null; back(); toast(f.editId ? 'Đã cập nhật' : 'Đã thêm. App sẽ nhắc đúng buổi.');
};

// ---- Chụp đơn thuốc hoặc quét mã QR đơn: đọc ra danh sách, người dùng tick từng thuốc trước khi lưu ----
function rxStart(img) {
  const p = P(), active = medsActive(p, now()).map(m => m.name.toLowerCase());
  S.draft.rx = { img, items: RX_SAMPLE.map(m => Object.assign({}, m, { on: !active.includes(m.name.toLowerCase()) })) };
  go('rxReview');
}
A.rxQr = () => rxStart(null);
V.rxReview = () => {
  const rx = S.draft.rx, n = rx.items.filter(i => i.on).length;
  let h = topBar({ close: true }) + h1('Thuốc đọc được', 'sm') + (rx.img ? `<img class="thumb" src="${rx.img}" alt="Ảnh đơn thuốc">` : '');
  h += group(rx.items.map((i, k) => `<div class="row"><button class="check-btn" role="checkbox" aria-checked="${i.on}" aria-label="Lưu ${esc(i.name)}" ${on('rxToggle', { i: k })}><span class="check">${icon('check')}</span></button><span class="row-title">${esc(medName(i))}</span><span class="row-value">${momentsText(i)}</span></div>`));
  return { chrome: 'modal', html: h + btn(`Lưu ${n} thuốc`, 'rxSave', {}, '', n ? '' : 'disabled') };
};
A.rxToggle = ({ i }) => { const it = S.draft.rx.items[Number(i)]; it.on = !it.on; };
A.rxSave = () => {
  const p = P(), items = S.draft.rx.items.filter(i => i.on);
  items.forEach((i, k) => p.meds.push({ id: `m${Date.now()}${k}`, name: i.name, group: i.group, strength: i.strength, dose: i.dose, moments: i.moments.slice(), start: dayKey(now()), end: dayKey(now() + 30 * DAY), note: i.note, route: 'Uống', source: 'photo' }));
  S.draft.rx = null; S.draft.med = null; openRoot('meds'); toast(`Đã thêm ${items.length} thuốc`);
};
