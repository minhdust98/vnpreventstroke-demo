'use strict';
// Hồ sơ: thông tin cá nhân, tiền sử (tùy chọn), người nhà, quyền chia sẻ, nhắc nhở, hiển thị, phản hồi.

V.me = () => {
  const p = P();
  let h = topBar({ back: 'Quay lại' });
  h += `<div class="card" style="display:flex;gap:.8rem;align-items:center"><span class="avatar" style="width:4rem;height:4rem;font-size:1.3rem">${esc(initials(p.name))}</span><div style="min-width:0"><h1 class="t small" style="font-size:1.6rem">${esc(p.name)}</h1><div class="sub">${p.birthYear ? `${age(p)} tuổi · ` : ''}${p.stroke ? 'Đã từng đột quỵ' : 'Chưa từng đột quỵ'}</div></div></div>`;
  const ids = Object.keys(D.profiles);
  if (ids.length > 1) h += `<div class="sec">Hồ sơ trong tài khoản</div><div class="rows">${ids.map(id => { const x = D.profiles[id]; return row({ n: esc(x.name) + (id === D.owner ? ' (bạn)' : ''), d: id === D.active ? 'Đang xem' : 'Chạm để chuyển', a: id === D.active ? '' : 'switchProfile', p: id }); }).join('')}</div>`;
  h += `<div class="rows">${row({ icon: 'group', tone: 'blue', n: 'Thông tin cá nhân', d: 'Năm sinh, chiều cao, cân nặng', a: 'go', p: 'profile' })}${row({ icon: 'doc', tone: 'orange', n: 'Tiền sử bệnh', d: 'Không bắt buộc', a: 'go', p: 'history' })}${row({ icon: 'card', tone: 'red', n: 'Thẻ cấp cứu', d: 'Mở ra ngay khi cần', a: 'go', p: 'card' })}${row({ icon: 'group', tone: 'green', n: 'Người nhà', d: 'Xem và nhập hộ', a: 'go', p: 'caregivers' })}</div>`;
  h += `<div class="rows">${row({ icon: 'lock', tone: 'blue', n: 'Quyền chia sẻ dữ liệu', d: 'Bạn quyết định ai được xem', a: 'go', p: 'share' })}${row({ icon: 'heart', tone: 'blue', n: 'Theo dõi gì, nhắc khi nào', a: 'go', p: 'schedule' })}${row({ icon: 'bell', tone: 'orange', n: 'Thông báo', d: 'Giờ nhắc, âm thanh, rung', a: 'go', p: 'notif' })}${row({ icon: 'text', tone: 'purple', n: 'Cỡ chữ và hiển thị', d: 'Cỡ chữ, sáng tối, ngôn ngữ', a: 'go', p: 'display' })}${row({ icon: 'link', tone: 'green', n: 'Kết nối điện thoại', d: 'Số bước, thiết bị đeo', a: 'go', p: 'connect' })}</div>`;
  h += `<div class="rows">${row({ icon: 'msg', tone: 'blue', n: 'Hỏi đáp và hỗ trợ', a: 'go', p: 'faq' })}${row({ icon: 'star', tone: 'orange', n: 'Gửi phản hồi', a: 'go', p: 'feedback' })}${row({ icon: 'doc', tone: 'muted', n: 'Bảo mật và từ chối trách nhiệm', a: 'go', p: 'about' })}</div>`;
  return { chrome: 'push', html: h };
};
A.switchProfile = id => { D.active = id; S.ui = {}; persist(); A.home(); };

V.profile = () => {
  const p = P(), bmi = bmiOf(p.height, p.weight);
  let h = topBar({ back: 'Hồ sơ' }) + '<h1 class="t small">Thông tin cá nhân</h1>';
  h += `<div class="rows">
    ${row({ n: 'Tên', val: esc(p.name), a: 'editName' })}
    ${row({ n: 'Năm sinh', d: p.birthYear ? `${age(p)} tuổi` : '', val: p.birthYear || 'Chưa có', a: 'editYear' })}
    ${row({ n: 'Chiều cao', val: p.height ? `${p.height} cm` : 'Chưa có', a: 'editHeight' })}
    ${row({ n: 'Cân nặng', d: bmi ? `BMI ${dec(bmi.toFixed(1))}, ${bmiStatus(bmi).word.toLowerCase()}` : '', val: p.weight ? `${dec(p.weight)} kg` : 'Chưa có', a: 'startWeight' })}
  </div>`;
  h += `<div class="sec">Không bắt buộc</div><div class="rows">
    ${row({ n: 'Giới tính', val: { male: 'Nam', female: 'Nữ', other: 'Khác' }[p.sex] || 'Chưa có', a: 'editSex' })}
    ${p.stroke ? row({ n: 'Loại đột quỵ', val: { ischemic: 'Nhồi máu não', hemorrhage: 'Chảy máu não', tia: 'Cơn thoáng qua', unknown: 'Không nhớ' }[p.strokeType] || 'Chưa có', a: 'go', p: 'strokeType' }) : ''}
    ${row({ n: 'Người nhà để gọi khi cần', d: p.contact ? `${esc(p.contact.name)} · ${esc(p.contact.tel)}` : 'Chưa có', a: 'editContact' })}
  </div><div><label class="fieldlabel" for="ad">Địa chỉ</label><input id="ad" class="input" data-field="address" value="${esc(p.address)}" autocomplete="street-address"><p class="note" style="margin-top:.3rem">Không cần nhập để tìm bệnh viện gần nhất, app dùng vị trí của máy khi bạn cho phép.</p></div>`;
  return { chrome: 'push', html: h };
};
A.editName = () => { S.ui.newName = P().name; dialog({ title: 'Tên của bạn', body: `<label class="fieldlabel" for="nm">Tên hiển thị</label><input id="nm" class="input" data-field="name" value="${esc(P().name)}" autocomplete="name">`, buttons: [{ label: 'Lưu', a: 'nameOk' }, { label: 'Hủy', a: 'closeDialog', cls: 'sec' }] }); };
A.nameOk = () => { const n = (S.ui.newName || '').trim(); if (n) P().name = n; S.dialog = null; persist(); render(); };
A.editYear = () => openNum({ title: 'Năm sinh', noun: 'Năm sinh', maxLen: 4, onSave: 'yearOk', min: TH.year.min, max: new Date(nowMs()).getFullYear() - TH.year.maxAge, value: P().birthYear });
A.yearOk = v => { P().birthYear = v; persist(); A.back(); };
A.editHeight = () => openNum({ title: 'Chiều cao', noun: 'Chiều cao', unit: 'cm', maxLen: 3, onSave: 'heightOk', min: TH.height.min, max: TH.height.max, value: P().height });
A.heightOk = v => { P().height = v; persist(); A.back(); };
A.editSex = () => dialog({ title: 'Giới tính', buttons: [{ label: 'Nam', a: 'sexOk', p: 'male' }, { label: 'Nữ', a: 'sexOk', p: 'female' }, { label: 'Khác', a: 'sexOk', p: 'other' }, { label: 'Hủy', a: 'closeDialog', cls: 'sec' }] });
A.sexOk = v => { P().sex = v; P().facts.sex = { v: v === 'other' ? 'unknown' : v, source: 'patient' }; S.dialog = null; persist(); render(); };
A.editContact = () => { const c = P().contact || {}; S.ui.contact = { name: c.name || '', tel: c.tel || '' }; dialog({ title: 'Người nhà', body: `<label class="fieldlabel" for="cn">Tên</label><input id="cn" class="input" data-field="contactName" value="${esc(c.name || '')}"><label class="fieldlabel" for="ct" style="margin-top:.5rem">Số điện thoại</label><input id="ct" class="input" type="tel" inputmode="tel" data-field="contactTel" value="${esc(c.tel || '')}">`, buttons: [{ label: 'Lưu', a: 'contactOk' }, { label: 'Hủy', a: 'closeDialog', cls: 'sec' }] }); };
A.contactOk = () => { const c = S.ui.contact; if (c.name && c.tel) P().contact = { name: c.name, rel: (P().contact && P().contact.rel) || 'người nhà', tel: c.tel }; S.dialog = null; persist(); render(); };

// Tiền sử bệnh theo đúng danh mục BRD. Đều tùy chọn, không bao giờ nhắc.
const YN = ['Có', 'Không'];
const HISTORY = [
  { id: 'htn', name: 'Cao huyết áp', qs: [{ k: 'year', t: 'Được chẩn đoán từ năm nào?', type: 'year' }, { k: 'maxSys', t: 'Số trên cao nhất từng ghi nhận', type: 'num', unit: 'mmHg', min: 60, max: 300 }, { k: 'maxDia', t: 'Số dưới cao nhất từng ghi nhận', type: 'num', unit: 'mmHg', min: 30, max: 200 }, { k: 'treat', t: 'Hiện có đang điều trị không?', opts: YN }, { k: 'watch', t: 'Có thường xuyên theo dõi huyết áp không?', opts: ['Có', 'Không', 'Thỉnh thoảng'] }] },
  { id: 'heart', name: 'Tim mạch', qs: [{ k: 'kinds', t: 'Loại bệnh tim mạch?', multi: ['Bệnh mạch vành', 'Suy tim', 'Bệnh van tim', 'Rối loạn nhịp tim khác'] }, { k: 'pad', t: 'Từng bị hẹp động mạch ở chân?', opts: YN }, { k: 'carotid', t: 'Từng bị hẹp động mạch cảnh?', opts: YN }, { k: 'ecg', t: 'Điện tâm đồ từng bất thường?', opts: YN }, { k: 'year', t: 'Được chẩn đoán từ năm nào?', type: 'year' }, { k: 'treat', t: 'Hiện có đang điều trị không?', opts: YN }] },
  { id: 'dm', name: 'Tiểu đường', qs: [{ k: 'year', t: 'Phát hiện năm nào?', type: 'year' }, { k: 'fpg', t: 'Đường huyết lúc đói gần nhất', type: 'num', unit: 'mmol/L', min: 1, max: 40 }, { k: 'a1c', t: 'HbA1c gần nhất', type: 'num', unit: '%', min: 3, max: 20 }, { k: 'freq', t: 'Có thường đo đường huyết không?', opts: ['Hằng ngày', 'Thỉnh thoảng', 'Không'] }, { k: 'treat', t: 'Có đang dùng thuốc không?', opts: YN }] },
  { id: 'lipid', name: 'Rối loạn mỡ máu', qs: [{ k: 'year', t: 'Được chẩn đoán từ năm nào?', type: 'year' }, { k: 'ldl', t: 'LDL cao nhất từng ghi nhận', type: 'num', unit: 'mmol/L', min: 0.5, max: 15 }, { k: 'hdl', t: 'HDL từng ghi nhận', type: 'num', unit: 'mmol/L', min: 0.2, max: 5 }, { k: 'tg', t: 'Triglyceride cao nhất từng ghi nhận', type: 'num', unit: 'mmol/L', min: 0.2, max: 50 }, { k: 'tc', t: 'Cholesterol toàn phần cao nhất từng ghi nhận', type: 'num', unit: 'mmol/L', min: 1, max: 20 }, { k: 'treat', t: 'Hiện có đang điều trị không?', opts: YN }] },
  { id: 'family', name: 'Người thân từng bị đột quỵ hoặc bệnh tim sớm', qs: [] },
  { id: 'af', name: 'Rung nhĩ', qs: [{ k: 'year', t: 'Được chẩn đoán từ năm nào?', type: 'year' }, { k: 'kind', t: 'Loại rung nhĩ?', opts: ['Kịch phát', 'Dai dẳng', 'Mạn tính', 'Không rõ'] }, { k: 'valve', t: 'Rung nhĩ có do bệnh van tim không?', opts: ['Không do van tim', 'Do van tim', 'Không rõ'] }, { k: 'treat', t: 'Hiện có đang điều trị không?', opts: YN }] },
  { id: 'kidney', name: 'Bệnh thận', qs: [{ k: 'level', t: 'Mức độ bệnh thận?', opts: ['Nhẹ', 'Vừa', 'Nặng', 'Không rõ'] }, { k: 'gfr', t: 'GFR, nếu biết', type: 'num', unit: 'mL/phút', min: 1, max: 200 }, { k: 'dialysis', t: 'Có đang chạy thận nhân tạo không?', opts: YN }] },
  { id: 'memory', name: 'Trí nhớ và tinh thần', qs: [{ k: 'decline', t: 'Có biểu hiện suy giảm trí nhớ không?', opts: YN }, { k: 'stress', t: 'Gần đây có vấn đề rất căng thẳng không?', opts: YN }, { k: 'dx', t: 'Đã được chẩn đoán bệnh về trí nhớ chưa?', opts: YN }] },
  { id: 'apnea', name: 'Ngưng thở khi ngủ', qs: [{ k: 'dx', t: 'Đã được chẩn đoán chưa?', opts: YN }, { k: 'snore', t: 'Hay ngáy hoặc ban ngày buồn ngủ nhiều?', opts: YN }] },
];
V.history = () => {
  const p = P(), dt = p.historyDetail || {};
  let h = topBar({ back: 'Hồ sơ' }) + '<h1 class="t small">Tiền sử bệnh</h1><div class="sub ink" style="margin-top:-.3rem">Không bắt buộc. Chọn bệnh bạn đã mắc, trả lời câu nào cũng được. Bệnh viện có thể điền giúp.</div>';
  HISTORY.forEach(c => {
    const on = !!p.history[c.id];
    h += `<div class="rows">${sw(on, c.name, 'histToggle', c.id)}`;
    if (on) c.qs.forEach(q => {
      const v = (dt[c.id] || {})[q.k];
      h += '<div class="row-s" style="display:block">';
      h += `<div class="n" style="margin-bottom:.4rem">${q.t}</div>`;
      if (q.type === 'year') h += `<button class="chip" data-a="histYear" data-p="${c.id}|${q.k}">${v || 'Chọn năm'}</button>`;
      else if (q.type === 'num') h += `<button class="chip" data-a="histNum" data-p="${c.id}|${q.k}">${v != null ? `${dec(v)} ${q.unit}` : 'Nhập số, nếu biết'}</button>`;
      else if (q.multi) h += `<div class="chipwrap">${q.multi.map(x => `<button class="chip ${(v || []).includes(x) ? 'on' : ''}" aria-pressed="${(v || []).includes(x)}" data-a="histMulti" data-p="${c.id}|${q.k}|${esc(x)}">${x}</button>`).join('')}</div>`;
      else h += `<div class="chipwrap">${q.opts.map(x => `<button class="chip ${v === x ? 'on' : ''}" aria-pressed="${v === x}" data-a="histSet" data-p="${c.id}|${q.k}|${esc(x)}">${x}</button>`).join('')}</div>`;
      h += '</div>';
    });
    h += '</div>';
  });
  h += `<div><label class="fieldlabel" for="ho">Khác</label><input id="ho" class="input" data-field="histOther" value="${esc(p.history.otherText || '')}"></div>`;
  const drug = (k, t, opts) => { const v = (dt.drugs || {})[k]; return `<div class="row-s" style="display:block"><div class="n" style="margin-bottom:.4rem">${t}</div><div class="chipwrap">${opts.map(x => `<button class="chip ${v === x ? 'on' : ''}" aria-pressed="${v === x}" data-a="histSet" data-p="drugs|${k}|${esc(x)}">${x}</button>`).join('')}</div></div>`; };
  h += `<div class="sec">Tiền sử thuốc</div><div class="rows">${drug('anticoag', 'Thuốc chống đông (như sintrom, apixaban, rivaroxaban)', ['Có', 'Đã từng', 'Không'])}${drug('antiplatelet', 'Thuốc kháng ngưng tập tiểu cầu (như aspirin, plavix)', ['Có', 'Không'])}</div>`;
  h += '<p class="note">Thuốc đang dùng nằm ở mục Thuốc, không cần nhập lại ở đây.</p>';
  return { chrome: 'push', html: h };
};
A.histToggle = id => {
  const p = P(); p.history[id] = !p.history[id];
  const map = { htn: 'htn', dm: 'dm', af: 'af' };
  if (map[id]) p.facts[map[id]] = p.history[id] ? { v: 'yes', source: 'patient' } : { v: null };
  persist(); render();
};
A.histSet = q => { const [c, k, v] = q.split('|'), p = P(); p.historyDetail = p.historyDetail || {}; (p.historyDetail[c] = p.historyDetail[c] || {})[k] = v; persist(); render(); };
A.histMulti = q => { const [c, k, v] = q.split('|'), p = P(); p.historyDetail = p.historyDetail || {}; const d = (p.historyDetail[c] = p.historyDetail[c] || {}); const l = d[k] || (d[k] = []); const i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); persist(); render(); };
A.histYear = q => { S.ui.histY = q; openNum({ title: 'Năm', noun: 'Năm', maxLen: 4, onSave: 'histYearOk', min: 1930, max: new Date(nowMs()).getFullYear() }); };
A.histNum = q => { S.ui.histY = q; const [c, k] = q.split('|'), d = HISTORY.find(x => x.id === c).qs.find(x => x.k === k); openNum({ title: d.t, noun: d.t, unit: d.unit, comma: true, maxLen: 5, onSave: 'histYearOk', min: d.min, max: d.max }); };
A.histYearOk = v => { const [c, k] = S.ui.histY.split('|'), p = P(); p.historyDetail = p.historyDetail || {}; (p.historyDetail[c] = p.historyDetail[c] || {})[k] = v; persist(); A.back(); };

// Đồng ý chia sẻ: luôn là lựa chọn rõ ràng
V.share = () => {
  const c = P().consents;
  const row3 = (k, title, desc) => `<div class="card"><div class="mid" style="font-weight:700">${title}</div><div class="sub" style="margin-top:.25rem">${desc}</div><div class="yn" style="margin-top:.6rem"><button class="chip ${c[k] === true ? 'on' : ''}" aria-pressed="${c[k] === true}" data-a="consentSet" data-p="${k}|1">Đồng ý</button><button class="chip ${c[k] === false ? 'on' : ''}" aria-pressed="${c[k] === false}" data-a="consentSet" data-p="${k}|0">Không</button></div></div>`;
  let h = topBar({ back: 'Hồ sơ' }) + '<h1 class="t small">Quyền chia sẻ dữ liệu</h1><div class="sub ink" style="margin-top:-.3rem">Bạn đổi ý được bất cứ lúc nào. Từ chối vẫn dùng được các tính năng trên máy.</div>';
  h += row3('doctor', 'Cho bác sĩ điều trị xem số đo và thuốc của bạn?', 'Bác sĩ theo dõi được giữa hai lần khám.');
  h += row3('research', 'Cho dùng dữ liệu cho nghiên cứu về đột quỵ?', 'Dữ liệu được ẩn danh. Không ảnh hưởng đến việc dùng app.');
  h += row3('family', 'Cho người nhà xem và nhập hộ?', 'Chỉ những người bạn mời. App ghi rõ ai đã nhập.');
  h += `<button class="link" data-a="go" data-p="about">Xem chi tiết về bảo mật</button>`;
  return { chrome: 'push', html: h };
};
A.consentSet = q => { const [k, v] = q.split('|'), p = P(); p.consents[k] = v === '1'; if (k === 'family' && v === '0') p.family.forEach(f => { f.canSee = false; f.canEnter = false; }); persist(); render(); };

V.caregivers = () => {
  const p = P();
  let h = topBar({ back: 'Quay lại' }) + '<h1 class="t small">Người nhà</h1>';
  if (D.proxyName && D.owner !== D.active) h += `<div class="banner bg-blue">Bạn đang chăm ${esc(p.name)}. Mọi số bạn nhập đều ghi là do ${esc(D.proxyName)} nhập.</div>`;
  h += '<div class="sec">Người được xem hồ sơ này</div><div class="rows">';
  h += p.family.length ? p.family.map((f, i) => row({ icon: 'group', tone: 'green', n: `${esc(f.name)} (${esc(f.rel)})`, d: f.canSee ? 'Xem và nhập hộ' : 'Đã tắt quyền' })).join('') : '<div class="row-s"><span class="d">Chưa mời ai</span></div>';
  h += '</div>';
  h += `<button class="btn" data-a="familyInvite">${icon('plus')}Mời người nhà</button>`;
  h += '<div class="sec">Theo dõi giúp người khác</div>';
  h += `<div class="rows">${row({ icon: 'plus', tone: 'blue', n: 'Thêm hồ sơ người thân', d: 'Ví dụ bố mẹ không dùng được điện thoại', a: 'profileAdd' })}</div>`;
  return { chrome: 'push', html: h };
};
A.familyInvite = () => dialog({ title: 'Mời người nhà', body: '<p class="sub ink">Người nhà sẽ xem được số đo, thuốc, lịch khám và nhập hộ được. Bạn tắt được lúc nào cũng được. Bạn có đồng ý không?</p>', buttons: [{ label: 'Đồng ý, gửi lời mời', a: 'familyYes' }, { label: 'Không', a: 'closeDialog', cls: 'sec' }] });
A.familyYes = () => { const p = P(); p.consents.family = true; p.family.push({ name: 'Người nhà mẫu', rel: 'người nhà', canSee: true, canEnter: true }); S.dialog = null; persist(); render(); toast('Đã gửi lời mời (mô phỏng)'); };
A.profileAdd = () => { S.ui.newName = ''; dialog({ title: 'Thêm hồ sơ người thân', body: '<label class="fieldlabel" for="nn">Tên người thân</label><input id="nn" class="input" data-field="name"><p class="note" style="margin-top:.4rem">Bạn cần được người thân đồng ý trước khi nhập thông tin của họ.</p>', buttons: [{ label: 'Tiếp', a: 'profileAddGo' }, { label: 'Hủy', a: 'closeDialog', cls: 'sec' }] }); };
A.profileAddGo = () => { const n = (S.ui.newName || '').trim(); if (!n) return; S.dialog = null; S.ui.on = { name: n, forOther: true }; D.proxyName = D.profiles[D.owner].name; S.stack.push({ v: 'onWelcome', p: {} }); S.navFocus = true; render(); };

// Theo dõi gì, nhắc khi nào
V.schedule = () => {
  const p = P();
  const chips = (key, on) => `<div class="chipwrap" style="margin-top:.5rem">${MOMENTS.map(m => `<button class="chip ${on.includes(m.key) ? 'on' : ''}" aria-pressed="${on.includes(m.key)}" data-a="schedM" data-p="${key}|${m.key}">${m.label}</button>`).join('')}</div>`;
  let h = topBar({ back: 'Quay lại' }) + '<h1 class="t small">Theo dõi gì, nhắc khi nào</h1>';
  h += `<div class="rows">${sw(p.track.bp, 'Theo dõi huyết áp', 'schedT', 'bp', 'Nhắc đo và lưu lịch sử')}${p.track.bp ? `<div class="row-s" style="display:block"><div class="n">Đo vào buổi nào?</div>${chips('bp', p.track.bpMoments)}<p class="note" style="margin-top:.4rem">Mặc định sáng và chiều. Bạn đổi được nếu bác sĩ dặn khác.</p></div>` : ''}</div>`;
  h += `<div class="rows">${sw(p.track.glucose, 'Theo dõi đường huyết', 'schedT', 'glucose', 'Nếu bạn có máy thử đường')}${p.track.glucose ? `<div class="row-s" style="display:block"><div class="n">Đo vào buổi nào?</div>${chips('glu', p.track.gluMoments)}</div>` : ''}</div>`;
  h += `<div class="rows">${sw(p.track.weeklyHabits, 'Một câu về thói quen mỗi tuần', 'schedT', 'weeklyHabits', 'Có chọn sẵn, không phải gõ')}</div>`;
  return { chrome: 'push', html: h };
};
A.schedT = k => { const p = P(); p.track[k] = !p.track[k]; persist(); render(); };
A.schedM = q => { const [k, m] = q.split('|'), p = P(); const l = k === 'bp' ? p.track.bpMoments : p.track.gluMoments; const i = l.indexOf(m); if (i >= 0) { if (l.length > 1) l.splice(i, 1); } else l.push(m); persist(); render(); };

V.notif = () => {
  const n = D.settings.notif;
  let h = topBar({ back: 'Quay lại' }) + '<h1 class="t small">Thông báo</h1><div class="sub ink" style="margin-top:-.3rem">Chỉ gửi những gì thật sự có ích.</div>';
  h += '<div class="sec">Giờ nhắc từng buổi</div><div class="rows">';
  MOMENTS.forEach(m => { const t = D.settings.moments[m.key]; h += `<div class="row-s"><span class="m"><span class="n">${m.label}</span></span><button class="key" style="width:3.25rem;min-height:3rem" data-a="timeStep" data-p="${m.key}|-15" aria-label="Sớm hơn 15 phút buổi ${m.word}">${icon('minus')}</button><span class="val" style="min-width:4rem;text-align:center">${t}</span><button class="key" style="width:3.25rem;min-height:3rem" data-a="timeStep" data-p="${m.key}|15" aria-label="Muộn hơn 15 phút buổi ${m.word}">${icon('plus')}</button></div>`; });
  h += '</div><div class="sec">Nhắc gì</div><div class="rows">';
  h += sw(n.meds, 'Giờ dùng thuốc', 'nToggle', 'meds') + sw(n.measure, 'Giờ đo', 'nToggle', 'measure') + sw(n.appt, 'Lịch tái khám, trước 3 ngày và 1 ngày', 'nToggle', 'appt') + sw(n.habit, 'Câu hỏi mỗi tuần', 'nToggle', 'habit');
  h += '</div><div class="sec">Âm thanh</div><div class="rows">' + sw(n.sound, 'Có chuông', 'nToggle', 'sound') + sw(n.vibrate, 'Có rung', 'nToggle', 'vibrate') + '</div>';
  h += `<div class="sec">Nhắc lại nếu chưa xác nhận, sau</div><div class="seg">${[5, 15, 30].map(x => `<button aria-pressed="${n.repeat === x}" data-a="nRepeat" data-p="${x}">${x} phút</button>`).join('')}</div>`;
  return { chrome: 'push', html: h };
};
A.nToggle = k => { D.settings.notif[k] = !D.settings.notif[k]; persist(); render(); };
A.nRepeat = v => { D.settings.notif.repeat = Number(v); persist(); render(); };
A.timeStep = q => { const [k, d] = q.split('|'); const [hh, mm] = D.settings.moments[k].split(':').map(Number); let t = hh * 60 + mm + Number(d); t = (t + 1440) % 1440; D.settings.moments[k] = `${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`; persist(); render(); };

V.display = () => {
  const s = D.settings;
  const seg = (a, opts, cur) => `<div class="seg">${opts.map(o => `<button aria-pressed="${cur === o[0]}" data-a="${a}" data-p="${o[0]}">${o[1]}</button>`).join('')}</div>`;
  let h = topBar({ back: 'Hồ sơ' }) + '<h1 class="t small">Cỡ chữ và hiển thị</h1>';
  h += `<div class="sec">Cỡ chữ</div>${seg('setSize', [['m', 'Vừa'], ['l', 'Lớn'], ['xl', 'Rất lớn']], s.size)}<div class="card"><div class="big">Hôm nay: dùng thuốc và đo huyết áp.</div></div>`;
  h += `<div class="sec">Giao diện</div>${seg('setTheme', [['auto', 'Theo máy'], ['light', 'Sáng'], ['dark', 'Tối']], s.theme)}`;
  h += `<div class="sec">Ngôn ngữ</div>${seg('setLang', [['vi', 'Tiếng Việt'], ['en', 'English']], s.lang)}`;
  h += `<div class="sec">Đơn vị đường huyết</div>${seg('setUnit', [['mmol', 'mmol/L'], ['mg', 'mg/dL']], s.gluUnit)}`;
  return { chrome: 'push', html: h };
};
A.setSize = v => { D.settings.size = v; persist(); render(); };
A.setTheme = v => { D.settings.theme = v; persist(); render(); };
A.setLang = v => { D.settings.lang = v; persist(); render(); };
A.setUnit = v => { D.settings.gluUnit = v; persist(); render(); };

V.connect = () => {
  const p = P();
  let h = topBar({ back: 'Hồ sơ' }) + '<h1 class="t small">Kết nối điện thoại</h1><div class="sub ink" style="margin-top:-.3rem">App chỉ đọc khi bạn đồng ý, để bạn nhập ít hơn. Bản demo chỉ mô phỏng.</div>';
  h += `<div class="rows">${sw(p.track.steps, 'Số bước từ Apple Health hoặc Health Connect', 'toggleSteps', '')}${sw(p.track.device, 'Huyết áp từ máy đo có kết nối', 'toggleDevice', '')}</div>`;
  return { chrome: 'push', html: h };
};
A.toggleDevice = () => { const p = P(); p.track.device = !p.track.device; persist(); render(); };

// Phản hồi theo BRD: ngắn, được bỏ qua, luôn cảm ơn
V.feedback = () => {
  const f = S.ui.fb = S.ui.fb || { stars: 0, useful: null, picks: [], text: '', email: '', done: false };
  let h = topBar({ back: 'Quay lại' });
  if (f.done) return { chrome: 'push', html: `${h}<div class="spacer"></div><div class="center"><h1 class="q">${BRD.thanks}</h1></div><div class="spacer"></div><button class="btn" data-a="fbClose">Xong</button>` };
  h += '<h1 class="t small">Gửi phản hồi</h1>';
  h += `<div class="card"><div class="mid">Bạn đánh giá app thế nào?</div><div style="display:flex;justify-content:space-between;margin-top:.3rem">${[1, 2, 3, 4, 5].map(n => `<button class="star ${f.stars >= n ? 'on' : ''}" data-a="fbStar" data-p="${n}" aria-label="${n} sao">${icon('star')}</button>`).join('')}</div></div>`;
  h += `<div class="card"><div class="mid">App có hữu ích cho việc phòng chống đột quỵ của bạn không?</div><div class="yn" style="margin-top:.6rem"><button class="chip ${f.useful === true ? 'on' : ''}" data-a="fbUse" data-p="1">Có</button><button class="chip ${f.useful === false ? 'on' : ''}" data-a="fbUse" data-p="0">Không</button></div></div>`;
  if (f.useful != null) {
    const list = f.useful ? ['Theo dõi các chỉ số sức khỏe', 'Có động lực cải thiện chỉ số và thói quen', 'Có thông tin hữu ích để trao đổi với bác sĩ', 'Hiểu rõ hơn về phòng chống đột quỵ'] : ['Giao diện khó sử dụng', 'Thông tin chưa hữu ích hoặc không liên quan', 'Tính năng không hoạt động tốt', 'Nhắc nhở không phù hợp'];
    h += `<div class="sec">${f.useful ? 'App đã giúp bạn thế nào?' : 'Vì sao app chưa hiệu quả với bạn?'}</div><div class="chips">${list.map(x => `<button class="chip left ${f.picks.includes(x) ? 'on' : ''}" aria-pressed="${f.picks.includes(x)}" data-a="fbPick" data-p="${esc(x)}">${x}</button>`).join('')}</div>`;
  }
  h += `<div><label class="fieldlabel" for="fbt">Góp ý thêm (không bắt buộc)</label><textarea id="fbt" class="input" data-field="fbText">${esc(f.text)}</textarea></div>`;
  h += `<div><label class="fieldlabel" for="fbe">Email, nếu muốn được trả lời (không bắt buộc)</label><input id="fbe" class="input" type="email" inputmode="email" autocomplete="email" data-field="fbEmail" value="${esc(f.email)}"></div>`;
  h += `<button class="btn" data-a="fbSend">Gửi</button>`;
  return { chrome: 'push', html: h };
};
A.fbStar = n => { S.ui.fb.stars = Number(n); render(); };
A.fbUse = v => { S.ui.fb.useful = v === '1'; S.ui.fb.picks = []; render(); };
A.fbPick = x => { const l = S.ui.fb.picks, i = l.indexOf(x); if (i >= 0) l.splice(i, 1); else l.push(x); render(); };
A.fbSend = () => { S.ui.fb.done = true; D.dismissed.feedback = true; persist(); render(); };
A.fbClose = () => { S.ui.fb = null; A.back(); };

V.about = () => {
  let h = topBar({ back: 'Quay lại' }) + '<h1 class="t small">Bảo mật và từ chối trách nhiệm</h1>';
  h += `<div class="card" style="display:flex;flex-direction:column;gap:.55rem"><div class="mid" style="font-weight:700">Dữ liệu của bạn</div><p class="sub ink">Thông tin y tế của bạn được mã hóa và bảo vệ. Dữ liệu chỉ được chia sẻ khi bạn đã chọn "Đồng ý": với bác sĩ điều trị, với nhóm nghiên cứu, hoặc với người nhà. Mỗi lựa chọn là riêng biệt. Tiếp tục dùng app không có nghĩa là đồng ý.</p><p class="sub ink">Nhóm phát triển: Trung tâm Sức khỏe thông minh VinUni-Illinois, Viện AI4Life - ĐH Bách khoa Hà Nội, ĐH Khoa học Tự nhiên - ĐHQG TP. HCM, cùng các bác sĩ tại các bệnh viện tham gia.</p><p class="sub ink">Bạn có quyền xem, sửa hoặc yêu cầu xóa thông tin của mình.</p></div>`;
  h += `<div class="card" style="display:flex;flex-direction:column;gap:.55rem"><div class="mid" style="font-weight:700">Xin lưu ý</div><p class="sub ink">Thông tin trong app chỉ để tham khảo, không thay thế lời khuyên, chẩn đoán hay điều trị của bác sĩ. Hãy luôn theo chỉ định của bác sĩ đang điều trị cho bạn.</p></div>`;
  h += '<p class="note">Bản demo: dữ liệu giả, chỉ lưu trên trình duyệt của máy này, không gửi đi đâu.</p>';
  return { chrome: 'push', html: h };
};
