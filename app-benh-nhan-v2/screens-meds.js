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
  // Một thẻ tuân thủ: 7 chấm cho 7 ngày, một dòng cho 30 ngày, câu khích lệ theo BRD
  const days = [6, 5, 4, 3, 2, 1, 0].map(i => ms - i * DAY), word = { full: 'đủ', partial: 'một phần', missed: 'bỏ lỡ', none: 'không có ghi nhận', ongoing: 'đang diễn ra', nodoses: 'không có thuốc' };
  const a = adherence(p, 30, ms, t), k = adherenceKey(a);
  h += `<section class="card"><div class="dots" role="group" aria-label="7 ngày">${days.map(d => { const s = dayDoseState(p, d, ms, t); return `<div class="day"><span class="dot ${s}" role="img" aria-label="${ddmm(d)}: ${word[s]}">${s === 'full' ? icon('check') : ''}</span>${WD_S[new Date(d).getDay()]}</div>`; }).join('')}</div>`
    + (a.due ? `<p class="lead">30 ngày qua: ${a.taken}/${a.due} liều</p>` : '') + (k === 'none' ? '' : `<p class="body">${k === 'good' ? BRD.medGood : BRD.medImprove}</p>`) + '</section>';
  h += group(active.map(m => { const left = m.end ? daysLeft(m, ms) : 99; return row({ icon: 'pill', title: esc(medName(m)), value: left <= 7 ? `Còn ${left} ngày` : momentsText(m), tone2: left <= 7 ? 'amber' : '', a: 'go', p: { v: 'medDetail', id: m.id } }); }), { title: 'Đang dùng', action: { label: 'Thêm', icon: 'plus', a: 'medNew' } });
  h += group([FEATURES.missedHelp ? row({ icon: 'book', title: 'Khi quên liều', a: 'go', p: { v: 'article', topic: 'meds', id: 'missed' } }) : '', row({ icon: 'bell', title: 'Nhắc nhở', a: 'go', p: { v: 'reminders' } })]);
  const off = p.meds.filter(m => !active.includes(m));
  h += group(off.map(m => row({ title: esc(medName(m)), value: m.paused ? 'Tạm dừng' : `Hết ${ymd(m.end)}`, a: 'go', p: { v: 'medDetail', id: m.id } })), off.length ? { title: 'Đã ngừng' } : null);
  return { chrome: 'push', html: h };
};
A.openMoment = ({ mk }) => sheet('moment', { mk });

V.medDetail = ({ id }) => {
  const m = P().meds.find(x => x.id === id);
  let h = topBar({ back: 'Thuốc' }) + h1(m.name, 'sm');
  h += group([
    row({ title: 'Nhóm', value: esc(groupLabel(m.group)) }),
    row({ title: 'Liều', value: esc([m.strength, m.dose].filter(Boolean).join(', ')) }),
    row({ title: 'Buổi', value: m.moments.map(x => `${mo(x).label} ${mo(x).time}`).join(', ') }),
    row({ title: 'Đường dùng', value: esc(m.route) }),
    row({ title: 'Từ ngày', value: ymd(m.start) }),
    row({ title: 'Đến ngày', value: m.end ? ymd(m.end) : 'Dài hạn' }),
    m.note ? row({ title: 'Lưu ý', value: esc(m.note) }) : '',
  ]);
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

// ---- Thêm thuốc: một màn, gần như chỉ chạm ----
A.medNew = () => { S.draft.med = { name: '', group: '', strength: '', dose: '1 viên', moments: [], days: 30, note: '', route: 'Uống' }; go('medForm'); };
A.medEdit = ({ id }) => { const m = P().meds.find(x => x.id === id); S.draft.med = Object.assign({}, m, { moments: m.moments.slice(), editId: id }); go('medForm'); };
V.medForm = () => {
  const f = S.draft.med, cat = MED_CATALOG.find(g => g.group === f.group), item = cat && cat.items.find(i => i[0] === f.name);
  let h = topBar({ close: true }) + h1(f.editId ? 'Sửa thuốc' : 'Thêm thuốc', 'sm');
  h += group(row({ icon: 'pill', title: f.name ? esc(f.name) : 'Chọn tên thuốc', a: 'medPick' }));
  if (item) h += `<h2 class="label">Hàm lượng</h2>${chips(item[1].map(s => [s, s]), f.strength, 'medF', { k: 'strength' }, 'wrap')}`;
  else if (f.name) h += `<label class="label" for="fStr">Hàm lượng</label><input id="fStr" class="input" data-field="medStrength" value="${esc(f.strength)}">`;
  h += `<h2 class="label">Mỗi lần</h2>${chips(DOSES.map(s => [s, s]), f.dose, 'medF', { k: 'dose' }, 'grid')}`;
  h += `<h2 class="label">Buổi</h2>${chips(MOMENTS.map(m => [m.key, m.label]), f.moments, 'medM', {}, 'grid')}`;
  if (!f.editId) h += `<h2 class="label">Dùng trong</h2>${chips(DURATIONS.map(([v, l]) => [String(v), l]), String(f.days), 'medF', { k: 'days' }, 'grid')}`;
  h += `<h2 class="label">Lưu ý</h2>${chips(MED_NOTES.map(s => [s, s]), f.note, 'medNote', {}, 'wrap')}`;
  h += group(row({ title: 'Đường dùng', value: esc(f.route), a: 'medRoute' }));
  h += `<div class="cta">${btn('Lưu', 'medSave', {}, '', f.name && f.moments.length ? '' : 'disabled')}</div>`;
  return { chrome: 'modal', html: h };
};
A.medF = ({ k, v }) => { S.draft.med[k] = k === 'days' ? Number(v) : v; };
A.medM = ({ v }) => { const l = S.draft.med.moments, i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); };
A.medNote = ({ v }) => { S.draft.med.note = S.draft.med.note === v ? '' : v; };
A.medRoute = () => sheet('medRouteSheet');
V.medRouteSheet = () => ({ title: 'Đường dùng', html: `${sheetHead('Đường dùng')}${chips(ROUTES.map(r => [r, r]), S.draft.med.route, 'medRouteSet')}` });
A.medRouteSet = ({ v }) => { S.draft.med.route = v; S.sheet = null; };
F.medStrength = v => { S.draft.med.strength = v; };
A.medPick = () => { S.draft.pickQ = ''; sheet('medPicker'); };
function pickList() {
  const q = (S.draft.pickQ || '').toLowerCase();
  return MED_CATALOG.map(g => { const it = g.items.filter(i => !q || i[0].toLowerCase().includes(q)); return it.length ? group(it.map(i => row({ title: esc(i[0]), a: 'medPicked', p: { g: g.group, n: i[0] } })), { title: g.label }) : ''; }).join('');
}
V.medPicker = () => ({ title: 'Chọn thuốc', html: `${sheetHead('Chọn thuốc')}<input class="input" type="search" data-field="pickSearch" aria-label="Tìm tên thuốc" placeholder="Tìm tên thuốc" autocomplete="off"><div id="pickList" class="stack">${pickList()}</div>${group(row({ title: 'Thuốc khác', a: 'medOther' }))}` });
F.pickSearch = v => { S.draft.pickQ = v; const el = document.getElementById('pickList'); if (el) { el.innerHTML = pickList(); if (D.settings.lang === 'en') translateTree(el); } };
A.medPicked = ({ g, n }) => { const f = S.draft.med, c = MED_CATALOG.find(x => x.group === g).items.find(i => i[0] === n); Object.assign(f, { group: g, name: n, strength: c[1].length === 1 ? c[1][0] : '' }); S.sheet = null; S.focus = true; };
A.medOther = () => { S.draft.medOther = ''; dialog({ title: 'Tên thuốc', body: '<input class="input" data-field="medOther" aria-label="Tên thuốc" autocomplete="off">', buttons: [{ label: 'Xong', a: 'medOtherOk' }, { label: 'Hủy', a: 'closeDialog', cls: 'soft' }] }); };
F.medOther = v => { S.draft.medOther = v; };
A.medOtherOk = () => { const n = (S.draft.medOther || '').trim(); if (!n) return false; Object.assign(S.draft.med, { name: n, group: 'other', strength: '' }); S.dialog = null; S.sheet = null; };
A.medSave = () => {
  const f = S.draft.med, p = P();
  if (f.editId) Object.assign(p.meds.find(x => x.id === f.editId), { name: f.name, group: f.group, strength: f.strength, dose: f.dose, moments: f.moments, note: f.note, route: f.route });
  else p.meds.push({ id: `m${Date.now()}`, name: f.name, group: f.group, strength: f.strength, dose: f.dose, moments: f.moments.slice(), start: dayKey(now()), end: f.days ? dayKey(now() + f.days * DAY) : null, note: f.note, route: f.route, source: 'self' });
  back(); toast(f.editId ? 'Đã cập nhật' : 'Đã thêm. App sẽ nhắc đúng buổi.');
};
