'use strict';
// Hồ sơ sức khỏe: một hồ sơ chung, chia ba phần. Theo dõi (số liệu theo ngày), Hồ sơ ban đầu (người bệnh tự khai), Khám bệnh (các lần khám, theo mốc tái khám).
// Nhập ở Hôm nay thì sau khi lưu số liệu nằm ở Theo dõi. Xem lại lịch sử và biểu đồ thì vào từng mục.

const HPARTS = [['follow', 'Theo dõi'], ['record', 'Hồ sơ']];

V.metrics = () => {
  const p = P(), ms = now(), part = S.draft.hpart || 'follow';
  let h = topBar({ back: 'Trang chủ' }) + h1('Hồ sơ sức khỏe') + seg(HPARTS, part, 'hPart');
  h += part === 'record' ? intakeBlock(p, ms) + visitsBlock(p, ms) : followBlock(p, ms);
  return { chrome: 'push', html: h };
};
A.hPart = ({ v }) => { S.draft.hpart = v; S.scrollTo = 0; };

// ---- Hồ sơ ban đầu: bệnh nền hiện thành các đợt chẩn đoán, ví dụ "Có, từ 2019". Sửa từng mục ở màn con. ----
const condValue = (p, c) => {
  const f = p.facts[c.id], y = f && f.detail && f.detail.year;
  return factOf(p, c.id) === 'yes' && y ? `Có, từ ${y}` : answerText(p, c.id);
};
function intakeBlock(p, ms) {
  const top = [];
  if (p.stroke) top.push(row({ title: 'Đột quỵ', value: esc(`${(STROKE_TYPES.find(s => s[0] === p.strokeType) || [0, 'Có'])[1]}${p.strokeDate ? `, ${p.strokeDate}` : ''}`), a: 'go', p: { v: 'strokeType' } }));
  else if (p.stroke === false) top.push(row({ title: 'Đột quỵ', value: 'Chưa từng' }));
  if (p.hospitalLinked) top.push(row({ icon: 'hospital', title: 'Bệnh viện', value: esc(p.careTeam.hospital), wrap: true }));
  let h = group(top);
  h += group(CONDITIONS.map(c => row({ title: c.name, value: esc(condValue(p, c)), a: 'go', p: { v: 'condition', id: c.id } })), { title: 'Bệnh nền' });
  h += group(DRUG_HISTORY.map(d => row({ title: d.name, value: esc(p.drugs[d.id] || ''), a: 'drugSheet', p: { id: d.id } })), { title: 'Thuốc đã dùng' });
  h += group(row({ title: 'Triệu chứng 3 tháng qua', value: p.intake ? esc(p.intake.symptoms.length ? p.intake.symptoms.length + ' mục' : 'Không có') : '', a: 'symHist' }));
  h += `<label class="label" for="oc">${OTHER_LABEL.cond}</label><input id="oc" class="input" maxlength="200" data-field="otherCond" value="${esc(p.otherConditions)}">`;
  ['heart', 'life', 'family', 'symptoms'].forEach(k => { h += `<label class="label" for="o-${k}">${OTHER_LABEL[k]}</label><input id="o-${k}" class="input" maxlength="200" data-field="otherIntake" data-key="${k}" value="${esc(((p.intake && p.intake.other) || {})[k] || '')}">`; });
  return h;
}

// ---- Khám bệnh: ngày khám, bệnh viện, chẩn đoán, ảnh tờ phiếu. Lần tái khám đã khám cũng nằm trên cùng một dòng thời gian. ----
const hospitalOf = place => String(place || '').split(',')[0];
function visitEntries(p) {
  const own = (p.visits || []).map(v => ({ t: v.t, title: esc(v.place), value: ddmmyy(v.t), a: 'visitEdit', p: { id: v.id } }));
  const kept = p.appts.filter(a => a.state === 'done' || a.state === 'attended').map(a => ({ t: a.t, title: esc(hospitalOf(a.place)), value: ddmmyy(a.t) }));
  return own.concat(kept).sort((a, b) => b.t - a.t);
}
function visitsBlock(p, ms) {
  const list = visitEntries(p);
  let h = `<div class="group-head"><h2>Khám bệnh</h2><button class="link" ${on('visitNew')}>${icon('plus')}Thêm lần khám</button></div>`;
  h += list.length ? group(list.map(x => row({ icon: 'hospital', title: x.title, value: x.value, a: x.a, p: x.p, wrap: true, pad: true }))) : '<section class="card empty"><p class="lead">Chưa có lần khám</p></section>';
  h += group(row({ icon: 'share', title: 'Tóm tắt cho bác sĩ', a: 'go', p: { v: 'summary' } }));
  return h;
}
const visitDraft = () => S.draft.visit;
A.visitNew = () => { S.draft.visit = { id: null, date: dayKey(now()), place: '', dx: '', photo: null }; go('visitForm'); };
A.visitEdit = ({ id }) => { const v = P().visits.find(x => x.id === id); S.draft.visit = { id, date: dayKey(v.t), place: v.place, dx: v.dx, photo: v.photo || null }; go('visitForm'); };
V.visitForm = () => {
  const f = visitDraft();
  let h = topBar({ close: true }) + h1(f.id ? 'Lần khám' : 'Thêm lần khám', 'sm');
  h += group(dateRow('Ngày khám', 'visitDate', f.date));
  h += `<div><label class="label" for="vp">Bệnh viện</label><input id="vp" class="input" maxlength="120" data-field="visitPlace" value="${esc(f.place)}" autocomplete="off"></div>`;
  h += `<div><label class="label" for="vd">Chẩn đoán</label><input id="vd" class="input" maxlength="200" data-field="visitDx" value="${esc(f.dx)}" autocomplete="off"></div>`;
  h += f.photo ? `<img class="thumb" src="${f.photo}" alt="Ảnh tờ phiếu khám">` : '';
  h += btn(`${icon('camera')}${f.photo ? 'Chụp lại phiếu khám' : 'Chụp phiếu khám'}`, 'scan', { target: 'visit' }, 'soft');
  h += `<div class="cta">${btn('Lưu', 'visitSave')}${f.id ? btn('Xóa lần khám', 'visitDel', {}, 'plain') : ''}</div>`;
  return { chrome: 'modal', html: h };
};
F.visitDate = v => { visitDraft().date = v; };
F.visitPlace = v => { visitDraft().place = v; };
F.visitDx = v => { visitDraft().dx = v; };
A.visitSave = () => {
  const f = visitDraft(), p = P();
  if (!f.place.trim()) { toast('Nhập tên bệnh viện'); return false; }
  const t = new Date(`${f.date}T12:00:00`).getTime(), rec = { id: f.id || `v${Date.now()}`, t, place: f.place.trim(), dx: f.dx.trim(), photo: f.photo, by: byWho() };
  p.visits = p.visits || [];
  if (f.id) Object.assign(p.visits.find(x => x.id === f.id), rec); else p.visits.push(rec);
  S.draft.visit = null; S.draft.hpart = 'record'; back(); toast('Đã lưu');
};
A.visitDel = () => dialog({ title: 'Xóa lần khám này?', body: '<p class="body">Không khôi phục được.</p>', buttons: [{ label: 'Giữ lại', a: 'closeDialog' }, { label: 'Xóa', a: 'visitDelYes', cls: 'soft' }] });
A.visitDelYes = () => { const f = visitDraft(), p = P(); p.visits = p.visits.filter(x => x.id !== f.id); S.dialog = null; S.draft.visit = null; back(); toast('Đã xóa'); };
