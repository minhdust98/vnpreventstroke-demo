'use strict';
// Người nhà: liên kết tài khoản người nhà (họ tên, số điện thoại, mối quan hệ, quyền xem hoặc sửa), lời mời, hủy liên kết,
// nhờ nhân viên y tế nhập giúp. Chia sẻ dữ liệu: nội dung đã đồng ý và các tài khoản đã liên kết. Chỉ mô phỏng, không có máy chủ.

const FAM_CODE = '123456';
const FAM_RELS = ['Vợ hoặc chồng', 'Con', 'Cha hoặc mẹ', 'Anh chị em', 'Người khác'];
const FAM_PERMS = [['0', 'Chỉ xem'], ['1', 'Xem và sửa']];
const famPerm = f => (f.canEdit ? 'Xem và sửa' : 'Chỉ xem');
const famValue = f => (f.state === 'pending' ? 'Đang chờ' : f.canSee === false ? 'Đã tắt' : famPerm(f));

V.family = () => {
  const p = P(), inv = p.invites || [];
  let h = topBar({ back: 'Cài đặt' }) + h1('Người nhà', 'sm');
  if (isProxy()) h += `<div class="banner">Bạn đang chăm ${esc(p.name)}</div>`;
  h += group(row({ icon: 'qr', title: 'Mã kết nối của bạn', value: FAM_CODE }));
  if (inv.length) h += `<div class="group-head"><h2>Lời mời liên kết (${inv.length})</h2></div>` + inv.map(i => `<section class="card"><div class="card-head">${esc(i.name)}<span class="aside">${esc(i.rel)}</span></div><div class="two">${btn('Từ chối', 'invNo', { id: i.id }, 'soft')}${btn('Đồng ý', 'invYes', { id: i.id })}</div></section>`).join('');
  h += group(p.family.map(f => row({ icon: 'user', title: `${esc(f.name)} (${esc(f.rel)})`, value: famValue(f), tone2: f.state === 'pending' ? 'amber' : '', a: 'famOpen', p: { id: f.id }, wrap: true })), p.family.length ? { title: `Người nhà đã liên kết (${p.family.length})` } : null);
  h += btn(`${icon('plus')}Thêm tài khoản người nhà`, 'famNew');
  h += group([row({ icon: 'plus', title: 'Thêm hồ sơ người thân', a: 'profileAdd' }), row({ icon: 'pencil', title: 'Nhờ nhân viên y tế nhập giúp', a: 'go', p: { v: 'support' } })]);
  return { chrome: 'push', html: h };
};
A.invYes = ({ id }) => { const p = P(), i = p.invites.find(x => x.id === id); p.invites = p.invites.filter(x => x.id !== id); p.family.push({ id: `f${Date.now()}`, name: i.name, rel: i.rel, phone: i.phone, canSee: true, canEdit: false, state: 'linked' }); p.consents.family = true; toast('Đã kết nối'); };
A.invNo = ({ id }) => { const p = P(); p.invites = p.invites.filter(x => x.id !== id); };

// ---- Thêm tài khoản người nhà ----
A.famNew = () => { S.draft.fam = { name: '', phone: '', rel: '', edit: '0' }; go('famNew'); };
V.famNew = () => {
  const f = S.draft.fam;
  let h = topBar({ close: true }) + h1('Thêm người nhà', 'sm');
  h += accInput('fn', 'Họ và tên', 'famName', 'text', f.name, 'off') + accInput('fp', 'Số điện thoại', 'famPhone', 'tel', f.phone, 'off');
  h += `<h2 class="label">Mối quan hệ</h2>${chips(FAM_RELS.map(x => [x, x]), f.rel, 'famRel', {}, 'wrap')}`;
  h += `<h2 class="label">Cho phép</h2>${chips(FAM_PERMS, f.edit, 'famEdit', {}, 'grid')}`;
  h += '<p class="body">Người nhà cũng cần có tài khoản trên ứng dụng. Họ xác nhận lời mời trong tài khoản của mình.</p>';
  return { chrome: 'modal', html: h + `<div class="cta">${btn('Gửi lời mời', 'famSend')}</div>` };
};
F.famName = v => { S.draft.fam.name = v; };
F.famPhone = v => { S.draft.fam.phone = v; };
A.famRel = ({ v }) => { S.draft.fam.rel = v; };
A.famEdit = ({ v }) => { S.draft.fam.edit = v; };
A.famSend = () => {
  const f = S.draft.fam;
  if (!f.name.trim()) { toast('Nhập họ và tên'); return false; }
  if (!phoneOk(f.phone)) { toast('Số điện thoại chưa đúng'); return false; }
  if (!f.rel) { toast('Chọn mối quan hệ'); return false; }
  dialog({ title: 'Mời người nhà?', body: `<p class="body">${f.edit === '1' ? 'Người nhà sẽ xem được số đo, thuốc, lịch khám và nhập hộ được.' : 'Người nhà sẽ xem được số đo, thuốc và lịch khám.'} Tắt được bất cứ lúc nào.</p>`, buttons: [{ label: 'Đồng ý, gửi lời mời', a: 'famYes' }, { label: 'Không', a: 'closeDialog', cls: 'soft' }] });
};
A.famYes = () => {
  const f = S.draft.fam, p = P();
  p.family.push({ id: `f${Date.now()}`, name: f.name.trim(), rel: f.rel, phone: f.phone.trim(), canSee: true, canEdit: f.edit === '1', state: 'pending' });
  p.consents.family = true; S.dialog = null; S.draft.fam = null; back(); toast('Đã gửi lời mời');
};

// ---- Một người nhà: thông tin, quyền, hủy liên kết ----
A.famOpen = ({ id }) => sheet('famOne', { id });
V.famOne = ({ id }) => {
  const f = P().family.find(x => x.id === id);
  return { title: f.name, html: `${sheetHead(f.name)}${group([row({ title: 'Mối quan hệ', value: esc(f.rel) }), row({ title: 'Số điện thoại', value: esc(f.phone || '') }), row({ title: 'Trạng thái', value: f.state === 'pending' ? 'Đang chờ' : 'Đã kết nối', tone2: f.state === 'pending' ? 'amber' : '' })])}<h2 class="label">Cho phép</h2>${chips(FAM_PERMS, f.canEdit ? '1' : '0', 'famPerm', { id })}${btn('Xóa liên kết', 'famDel', { id }, 'plain')}` };
};
A.famPerm = ({ id, v }) => { P().family.find(x => x.id === id).canEdit = v === '1'; };
A.famDel = ({ id }) => dialog({ title: 'Hủy liên kết người nhà?', body: '<p class="body">Sau khi hủy, người này sẽ không còn xem được thông tin sức khỏe của bạn.</p>', buttons: [{ label: 'Đồng ý hủy liên kết', a: 'famDelYes', p: { id } }, { label: 'Không đồng ý', a: 'closeDialog', cls: 'soft' }] });
A.famDelYes = ({ id }) => { const p = P(); p.family = p.family.filter(x => x.id !== id); S.dialog = null; S.sheet = null; toast('Đã hủy liên kết'); };

// ---- Chia sẻ dữ liệu: nội dung đã đồng ý, rồi các tài khoản liên kết và quyền của họ ----
V.sharing = () => {
  const p = P(), c = p.consents;
  let h = topBar({ back: 'Cài đặt' }) + h1('Chia sẻ dữ liệu', 'sm');
  h += CONSENTS.map(([k, q]) => `<section class="card"><p class="lead">${q}</p>${chips([['1', 'Đồng ý'], ['0', 'Không']], c[k] == null ? null : c[k] ? '1' : '0', 'consentSet', { k }, 'grid')}</section>`).join('');
  const rows = p.family.map(f => row({ icon: 'user', title: `${esc(f.name)} (${esc(f.rel)})`, value: famValue(f), tone2: f.state === 'pending' ? 'amber' : '', a: 'famOpen', p: { id: f.id }, wrap: true }));
  if (p.hospitalLinked) rows.push(row({ icon: 'hospital', title: esc(p.careTeam.doctor), value: c.doctor ? 'Xem số đo và thuốc' : 'Chưa chia sẻ', wrap: true }));
  (p.doctors || []).filter(d => d.state === 'linked').forEach(d => rows.push(row({ icon: 'hospital', title: esc(d.name), value: c.doctor ? 'Xem số đo và thuốc' : 'Chưa chia sẻ', wrap: true })));
  h += group(rows, rows.length ? { title: 'Tài khoản đã liên kết' } : null);
  return { chrome: 'push', html: h + group(row({ title: 'Bảo mật', a: 'go', p: { v: 'privacy' } })) };
};
