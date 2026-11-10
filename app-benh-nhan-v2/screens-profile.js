'use strict';
// Hồ sơ (chạm ảnh đại diện): thông tin cá nhân, bệnh nền, câu hỏi cho bác sĩ, người nhà, tin nhắn, chia sẻ, nhắc nhở, hiển thị, phản hồi.

const ANSWER = { yes: 'Có', no: 'Không', unknown: 'Chưa rõ', male: 'Nam', female: 'Nữ', other: 'Khác' };
const answerText = (p, id) => { const v = factOf(p, id); if (id === 'sbp' && v) { const x = p.facts.sbp, l = last(p.bp); return v === 'unknown' ? 'Chưa đo' : l ? `${l.sys}/${l.dia}` : `${x.sys}/${x.dia}`; } return v ? ANSWER[v] || v : ''; };

V.settings = () => {
  const p = P(), ms = now(), ids = Object.keys(D.profiles);
  let h = topBar() + h1('Cài đặt');
  if (ids.length > 1) h += group(ids.map(id => row({ icon: 'user', title: esc(D.profiles[id].name), value: id === D.active ? 'Đang xem' : '', a: id === D.active ? '' : 'switchProfile', p: { id } })), { title: 'Hồ sơ' });
  h += group([row({ icon: 'user', title: 'Thông tin cá nhân', a: 'go', p: { v: 'info' } }), row({ icon: 'lock', title: 'Tài khoản', value: esc((D.account && D.account.phone) || ''), a: 'go', p: { v: 'account' } }), FEATURES.sos ? row({ icon: 'card', tone: 'red', title: 'Thẻ cấp cứu', a: 'go', p: { v: 'card' } }) : '']);
  h += group(row({ icon: 'group', title: 'Người nhà', a: 'go', p: { v: 'family' } }));
  h += group([row({ icon: 'lock', title: 'Chia sẻ dữ liệu', a: 'go', p: { v: 'sharing' } }), row({ icon: 'bell', title: 'Nhắc nhở', a: 'go', p: { v: 'reminders' } }), row({ icon: 'text', title: 'Hiển thị', a: 'go', p: { v: 'display' } })]);
  h += group([row({ icon: 'star', title: 'Gửi phản hồi', a: 'go', p: { v: 'feedback' } }), row({ icon: 'doc', title: 'Bảo mật', a: 'go', p: { v: 'privacy' } })]);
  return { chrome: 'tab', html: h };
};
A.switchProfile = ({ id }) => { D.active = id; S.draft = {}; home(); };

// ---- Thông tin cá nhân ----
V.info = () => {
  const p = P(), bmi = bmiOf(p.height, p.weight);
  let h = topBar({ back: 'Cài đặt' }) + h1('Thông tin cá nhân', 'sm');
  h += group([row({ title: 'Tên', value: esc(p.name), a: 'editName' }), row({ title: 'Năm sinh', value: p.birthYear || '', a: 'editYear' }), row({ title: 'Chiều cao', value: p.height ? `${p.height} cm` : '', a: 'editHeight' }), row({ title: 'Cân nặng', value: p.weight ? `${dec(p.weight)} kg` : '', status: bmi ? bmiStatus(bmi).key : '', a: 'startWeight' })]);
  h += group([row({ title: 'Giới tính', value: ANSWER[p.sex] || '', a: 'pickSheet', p: { kind: 'sex' } }), p.stroke ? row({ title: 'Loại đột quỵ', value: (STROKE_TYPES.find(s => s[0] === p.strokeType) || [0, ''])[1], a: 'go', p: { v: 'strokeType' } }) : '', FEATURES.exercises ? row({ title: 'Đi lại', value: (MOBILITY.find(m => m[0] === p.mobility) || [0, ''])[1], a: 'pickSheet', p: { kind: 'mobility' } }) : '', row({ title: 'Người nhà', value: p.contact ? esc(p.contact.name) : '', a: 'editContact' })]);
  h += `<div><label class="label" for="ward">Phường hoặc xã</label><input id="ward" class="input" data-field="ward" value="${esc(p.ward || '')}" autocomplete="address-level3"></div><div><label class="label" for="prov">Tỉnh hoặc thành phố</label><input id="prov" class="input" data-field="province" value="${esc(p.province || '')}" autocomplete="address-level1"></div>`;
  return { chrome: 'push', html: h };
};
F.ward = v => { P().ward = v; store.set(); };
F.province = v => { P().province = v; store.set(); };
A.editName = () => { S.draft.name = P().name; dialog({ title: 'Tên', body: `<input class="input" data-field="name" value="${esc(P().name)}" aria-label="Tên" autocomplete="name">`, buttons: [{ label: 'Lưu', a: 'nameOk' }, { label: 'Hủy', a: 'closeDialog', cls: 'soft' }] }); };
F.name = v => { S.draft.name = v; };
A.nameOk = () => { const n = (S.draft.name || '').trim(); if (n) P().name = n; S.dialog = null; };
A.editYear = () => openNum({ title: 'Năm sinh', maxLen: 4, min: TH.year.min, max: new Date(now()).getFullYear() - TH.year.maxAge, value: P().birthYear, onSave: 'yearOk' });
A.yearOk = v => { P().birthYear = v; back(); };
A.editHeight = () => openNum({ title: 'Chiều cao', unit: 'cm', maxLen: 3, min: TH.height.min, max: TH.height.max, value: P().height, onSave: 'heightOk' });
A.heightOk = v => { P().height = v; back(); };
const PICKS = { sex: { title: 'Giới tính', opts: [['male', 'Nam'], ['female', 'Nữ'], ['other', 'Khác']] }, mobility: { title: 'Đi lại', opts: MOBILITY } };
A.pickSheet = ({ kind }) => sheet('pickOne', { kind });
V.pickOne = ({ kind }) => ({ title: PICKS[kind].title, html: `${sheetHead(PICKS[kind].title)}${chips(PICKS[kind].opts, P()[kind], 'pickSet', { kind })}` });
A.pickSet = ({ kind, v }) => { P()[kind] = v; S.sheet = null; };
A.editContact = () => { const c = P().contact || {}; S.draft.contact = { name: c.name || '', tel: c.tel || '' }; dialog({ title: 'Người nhà', body: `<label class="label" for="cn">Tên</label><input id="cn" class="input" data-field="contactName" value="${esc(c.name || '')}"><label class="label" for="ct">Số điện thoại</label><input id="ct" class="input" type="tel" inputmode="tel" data-field="contactTel" value="${esc(c.tel || '')}">`, buttons: [{ label: 'Lưu', a: 'contactOk' }, { label: 'Hủy', a: 'closeDialog', cls: 'soft' }] }); };
F.contactName = v => { S.draft.contact.name = v; };
F.contactTel = v => { S.draft.contact.tel = v; };
A.contactOk = () => { const c = S.draft.contact, p = P(); if (c.name && c.tel) p.contact = { name: c.name, rel: (p.contact && p.contact.rel) || 'người nhà', tel: c.tel }; S.dialog = null; };
V.strokeType = () => ({ chrome: 'modal', html: `${topBar({ close: true })}${h1('Bác sĩ nói bạn bị loại đột quỵ nào?', 'q')}${chips(STROKE_TYPES, P().strokeType, 'strokeTypeSet', {}, '')}` });
A.strokeTypeSet = ({ v }) => { P().strokeType = v; back(); };

// ---- Bệnh nền: danh mục BRD, chung kho câu trả lời với câu hỏi thang. Danh sách nằm ở Hồ sơ sức khỏe › Hồ sơ ban đầu. ----
F.otherCond = v => { P().otherConditions = v; store.set(); };
F.otherIntake = (v, el) => { const p = P(), i = p.intake || (p.intake = { t: now(), by: byWho() }); (i.other || (i.other = {}))[el.dataset.key] = v; store.set(); };
V.condition = ({ id }) => {
  const p = P(), c = CONDITIONS.find(x => x.id === id), v = factOf(p, id), d = (p.facts[id] && p.facts[id].detail) || {};
  let h = topBar({ back: 'Hồ sơ sức khỏe' }) + h1(c.name, 'sm') + chips(YES_NO_UNSURE, v, 'condSet', { id }, 'grid');
  if (v === 'yes') c.qs.forEach(q => {
    h += `<h2 class="label">${q.t}</h2>`;
    if (q.type) h += group(row({ title: q.type === 'year' ? 'Năm' : q.unit, value: d[q.k] != null ? dec(d[q.k]) : '', a: 'condNum', p: { id, k: q.k } }));
    else h += chips((q.multi || q.opts).map(o => [o, o]), q.multi ? d[q.k] || [] : d[q.k], q.multi ? 'condMulti' : 'condOpt', { id, k: q.k }, 'wrap');
  });
  return { chrome: 'push', html: h };
};
const factFor = id => { const p = P(); return p.facts[id] || (p.facts[id] = { v: null }); };
A.condSet = ({ id, v }) => Object.assign(factFor(id), { v, source: 'patient', by: byWho(), t: now() });
A.condOpt = ({ id, k, v }) => { const f = factFor(id); (f.detail = f.detail || {})[k] = v; };
A.condMulti = ({ id, k, v }) => { const f = factFor(id), d = f.detail = f.detail || {}, l = d[k] || (d[k] = []), i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); };
A.condNum = ({ id, k }) => { const q = CONDITIONS.find(x => x.id === id).qs.find(x => x.k === k), cur = (factFor(id).detail || {})[k]; S.draft.cond = { id, k }; openNum(q.type === 'year' ? { title: q.t, maxLen: 4, min: 1930, max: new Date(now()).getFullYear(), value: cur, onSave: 'condNumOk' } : { title: q.t, unit: q.unit, comma: true, maxLen: 5, min: q.min, max: q.max, value: cur, onSave: 'condNumOk' }); };
A.condNumOk = v => { const { id, k } = S.draft.cond, f = factFor(id); (f.detail = f.detail || {})[k] = v; back(); };
A.symHist = () => sheet('symHistSheet');
V.symHistSheet = () => { const sx = (P().intake && P().intake.sx) || {}; return { title: 'Triệu chứng 3 tháng qua', html: `${sheetHead('Triệu chứng 3 tháng qua')}${INTAKE_SX.map(([id, q]) => `<p class="label">${q}</p>${chips(YES_NO_UNSURE, sx[id], 'symHistSet', { id }, 'grid three')}`).join('')}` }; };
A.symHistSet = ({ id, v }) => {
  const p = P(), i = p.intake || (p.intake = { t: now(), by: byWho(), symptoms: [] }), sx = i.sx || (i.sx = {});
  sx[id] = v;
  i.symptoms = INTAKE_SX.filter(([k]) => sx[k] === 'yes').map(x => x[2]);
  i.unknown = INTAKE_SX.every(([k]) => sx[k] === 'unknown');
};
A.drugSheet = ({ id }) => sheet('drugPick', { id });
V.drugPick = ({ id }) => { const d = DRUG_HISTORY.find(x => x.id === id); return { title: d.name, html: `${sheetHead(d.name)}${chips(d.opts.map(o => [o, o]), P().drugs[id], 'drugSet', { id })}` }; };
A.drugSet = ({ id, v }) => { P().drugs[id] = v; S.sheet = null; };

// ---- Dự đoán nguy cơ: chỉ hiện mức và một lời khuyên chung. Câu hỏi là đầu vào của FSRP (từ 55 tuổi, chưa đột quỵ) và ESRS (sau nhồi máu não hoặc TIA). ----
V.risk = () => {
  const p = P(), ms = now(), r = riskResult(p, ms);
  let h = topBar({ back: 'Trang chủ' }) + h1('Dự đoán nguy cơ');
  if (r.state === 'level') {
    const u = RISK_UI[r.key];
    h += `<section class="card"><div class="center">${pill(u.pill, u.word)}</div><p class="lead center">${u.advice}</p><div class="center"><span class="badge">Minh họa</span></div></section>`;
  } else if (r.state === 'need') {
    h += `<section class="card empty"><p class="lead">Còn ${r.remain.length} câu hỏi</p>${btn('Trả lời', 'startRisk')}</section>`;
  } else h += `<section class="card empty"><p class="lead">${RISK_EMPTY[r.state]}</p></section>`;
  h += group([riskPlan(p, ms).ids.length ? row({ icon: 'msg', title: 'Câu trả lời của bạn', a: 'go', p: { v: 'questions' } }) : '', row({ icon: 'group', title: 'Đánh giá cho người thân', a: 'profileAdd' })]);
  return { chrome: 'push', html: h };
};
V.questions = () => {
  const p = P(), ms = now(), pl = riskPlan(p, ms), remain = riskRemaining(p, ms);
  let h = topBar({ back: 'Dự đoán nguy cơ' }) + h1('Câu trả lời', 'sm');
  h += group(pl.ids.map(id => row({ title: RISK_Q[id].short, value: answerText(p, id), a: 'qSheet', p: { id } })));
  if (remain.length) h += btn(`Trả lời ${remain.length} câu còn lại`, 'startRisk');
  return { chrome: 'push', html: h };
};
A.qSheet = ({ id }) => sheet('qOne', { id });
V.qOne = ({ id }) => {
  const q = RISK_Q[id];
  const body = q.kind === 'bp' ? btn('Nhập huyết áp', 'startBP', { mode: 'risk' }) + btn('Chưa đo', 'riskAns', { id, v: 'unknown', close: 1 }, 'soft') : chips(q.opts || YES_NO_UNSURE, factOf(P(), id), 'riskAns', { id, close: 1 });
  return { title: q.short, html: `${sheetHead(q.short)}<p class="lead">${q.q}</p>${body}` };
};
A.startRisk = () => go('riskQ');
V.riskQ = () => {
  const p = P(), ms = now(), pl = riskPlan(p, ms), remain = riskRemaining(p, ms), id = remain[0];
  if (!id) return { chrome: 'modal', html: `${topBar({ close: true })}<div class="spacer"></div><div class="center"><div class="done-mark">${icon('check')}</div>${h1('Xong, cảm ơn bạn', 'q')}</div><div class="spacer"></div>${btn('Xong', 'back')}` };
  const q = RISK_Q[id], done = pl.ids.length - remain.length;
  let h = `<header class="top"><button class="nav" ${on('back')}>Để sau</button>${sosBtn()}</header><div class="card-head"><span class="muted">${done + 1}/${pl.ids.length}</span><button class="icon-btn end" ${on('riskInfo', { id })} aria-label="Vì sao hỏi">${icon('info')}</button></div>`;
  h += `<div class="prog">${pl.ids.map((_, i) => `<i class="${i <= done ? 'on' : ''}"></i>`).join('')}</div>${h1(q.q, 'q')}`;
  h += q.kind === 'bp' ? btn('Nhập huyết áp', 'startBP', { mode: 'risk' }) + btn('Chưa đo', 'riskAns', { id, v: 'unknown' }, 'soft') : chips(q.opts || YES_NO_UNSURE, null, 'riskAns', { id }, 'tall');
  return { chrome: 'modal', html: h };
};
A.riskInfo = ({ id }) => sheet('riskWhy', { id });
V.riskWhy = ({ id }) => ({ title: 'Vì sao hỏi', html: `${sheetHead('Vì sao hỏi')}<p class="body">${RISK_Q[id].why}</p><p class="body">Câu trả lời giúp bác sĩ đánh giá đầy đủ hơn. Chưa rõ cũng không sao, bác sĩ sẽ hỏi khi khám.</p>` });
A.riskAns = ({ id, v, close }) => {
  const p = P();
  if (id === 'sex') p.sex = v;
  if (id === 'smoke' && v !== 'unknown') p.habits.smoke = v === 'no' ? 'none' : p.habits.smoke && p.habits.smoke !== 'none' ? p.habits.smoke : 'mid';
  p.facts[id] = Object.assign(p.facts[id] || {}, { v: id === 'sex' && v === 'other' ? 'unknown' : v, source: 'patient', by: byWho(), t: now() });
  if (close) S.sheet = null;
  S.scrollTo = 0;
};

// ---- Chia sẻ dữ liệu và Người nhà: xem screens-family.js ----
const CONSENTS = [['doctor', 'Cho bác sĩ điều trị xem số đo và thuốc?'], ['research', 'Cho dùng dữ liệu cho nghiên cứu về đột quỵ?'], ['family', 'Cho người nhà xem và nhập hộ?']];
A.consentSet = ({ k, v }) => { const p = P(); p.consents[k] = v === '1'; if (k === 'family' && v === '0') p.family.forEach(f => { f.canSee = false; }); };

A.profileAdd = () => { S.draft.name = ''; dialog({ title: 'Hồ sơ người thân', body: '<input class="input" data-field="name" aria-label="Tên người thân">', buttons: [{ label: 'Tiếp', a: 'profileAddGo' }, { label: 'Hủy', a: 'closeDialog', cls: 'soft' }] }); };
A.profileAddGo = () => { const n = (S.draft.name || '').trim(); if (!n) return false; S.dialog = null; S.draft.on = { name: n, forOther: true }; D.proxyName = D.profiles[D.owner].name; go('welcome'); };

// ---- Nhắc nhở: liệt kê từng chỉ số, mỗi chỉ số có giờ nhắc và tần suất. Dùng chung với câu "Muốn được nhắc đo gì?" lúc khai báo (ctx 'onb'). ----
const FREQ = [['day', 'Hằng ngày'], ['week', 'Mỗi tuần'], ['month', 'Mỗi tháng']];
const trackOf = ctx => (ctx === 'onb' ? onb().trackObj : P().track);
function trackCards(t, ctx) {
  const c = ctx ? { ctx } : {}, tm = D.settings.times;
  const card = (name, onv, tk, inner) => `<section class="card"><div class="list">${toggle(name, onv, 'trackToggle', Object.assign({ k: tk }, c))}</div>${onv ? inner : ''}</section>`;
  const when = (k, sel) => `<h2 class="label">Giờ nhắc</h2>${chips(MOMENTS.map(m => [m.key, `${m.label} ${tm[m.key]}`]), sel, 'trackMoment', Object.assign({ k }, c), 'wrap')}`;
  const freq = (k, cur, opts) => `<h2 class="label">Tần suất</h2>${seg(opts || FREQ, cur, 'trackFreq', Object.assign({ k }, c))}`;
  return card('Huyết áp', t.bp, 'bp', when('bpMoments', t.bpMoments) + freq('bpFreq', t.bpFreq || 'day'))
    + card('Đường huyết', t.glucose, 'glucose', when('gluMoments', t.gluMoments) + freq('gluFreq', t.gluFreq || 'day'))
    + card('Cân nặng', t.weight, 'weight', when('weightMoments', t.weightMoments || ['sang']) + freq('weightFreq', t.weightFreq || 'month'))
    + card('Lối sống', t.weeklyHabits, 'weeklyHabits', freq('habitEvery', t.habitEvery || 'tuan', [['tuan', 'Mỗi tuần'], ['thang', 'Mỗi tháng']]));
}
V.reminders = () => {
  const st = D.settings, t = P().track;
  let h = topBar({ back: 'Cài đặt' }) + h1('Nhắc nhở', 'sm');
  h += group(MOMENTS.map(m => `<div class="row"><span class="row-title">${m.label}</span><button class="key time-key" ${on('timeStep', { k: m.key, d: -15 })} aria-label="Sớm hơn 15 phút">${icon('minus')}</button><span class="row-value ink time">${st.times[m.key]}</span><button class="key time-key" ${on('timeStep', { k: m.key, d: 15 })} aria-label="Muộn hơn 15 phút">${icon('plus')}</button></div>`), { title: 'Giờ các buổi' });
  h += group([toggle('Thuốc', st.notif.meds, 'notifToggle', { k: 'meds' }), toggle('Tái khám', st.notif.appt, 'notifToggle', { k: 'appt' })], { title: 'Nhắc' });
  h += trackCards(t, '');
  h += group([toggle('Chuông', st.notif.sound, 'notifToggle', { k: 'sound' }), toggle('Rung', st.notif.vibrate, 'notifToggle', { k: 'vibrate' })], { title: 'Âm thanh' });
  h += `<h2 class="label">Nhắc lại sau</h2>${seg([[5, '5 phút'], [15, '15 phút'], [30, '30 phút']], st.notif.repeat, 'notifRepeat')}`;
  return { chrome: 'push', html: h };
};
A.timeStep = ({ k, d }) => { const [hh, mm] = D.settings.times[k].split(':').map(Number), t = (hh * 60 + mm + Number(d) + 1440) % 1440; D.settings.times[k] = `${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`; };
A.trackToggle = ({ k, ctx }) => { const t = trackOf(ctx); t[k] = !t[k]; };
A.trackMoment = ({ k, v, ctx }) => { const t = trackOf(ctx), l = t[k] || (t[k] = ['sang']), i = l.indexOf(v); if (i >= 0) { if (l.length > 1) l.splice(i, 1); } else l.push(v); };
A.trackFreq = ({ k, v, ctx }) => { trackOf(ctx)[k] = v; };
A.notifToggle = ({ k }) => { D.settings.notif[k] = !D.settings.notif[k]; };
A.notifRepeat = ({ v }) => { D.settings.notif.repeat = Number(v); };

V.display = () => {
  const s = D.settings;
  let h = topBar({ back: 'Cài đặt' }) + h1('Hiển thị', 'sm');
  h += `<h2 class="label">Cỡ chữ</h2>${seg([['m', 'Vừa'], ['l', 'Lớn'], ['xl', 'Rất lớn']], s.size, 'setting', { k: 'size' })}`;
  h += `<h2 class="label">Giao diện</h2>${seg([['light', 'Sáng'], ['dark', 'Tối'], ['auto', 'Theo máy']], s.theme, 'setting', { k: 'theme' })}`;
  h += `<h2 class="label">Ngôn ngữ</h2>${seg([['vi', 'Tiếng Việt'], ['en', 'English']], s.lang, 'setting', { k: 'lang' })}`;
  h += `<h2 class="label">Đơn vị đường huyết</h2>${seg([['mmol', 'mmol/L'], ['mg', 'mg/dL']], s.gluUnit, 'setting', { k: 'gluUnit' })}`;
  return { chrome: 'push', html: h };
};
A.setting = ({ k, v }) => { D.settings[k] = v; };

V.support = () => ({ chrome: 'push', html: `${topBar({ back: 'Cài đặt' })}${h1('Nhờ nhập giúp', 'sm')}<p class="body">Bác sĩ hoặc nhân viên y tế nhập thuốc và tiền sử bệnh giúp bạn khi đi khám.</p>${btn('Gửi yêu cầu', 'supportReq')}${group(row({ icon: 'group', title: 'Nhờ người nhà', a: 'go', p: { v: 'family' } }))}` });
A.supportReq = () => { back(); toast('Đã gửi. Nhân viên y tế sẽ liên hệ.'); };

// ---- Phản hồi theo BRD: ngắn, được bỏ qua, luôn cảm ơn ----
V.feedback = () => {
  const f = S.draft.fb || (S.draft.fb = { stars: 0, useful: null, picks: [], text: '', email: '', done: false });
  let h = topBar({ back: 'Quay lại' });
  if (f.done) return { chrome: 'push', html: `${h}<div class="spacer"></div>${h1(BRD.thanks, 'q')}<div class="spacer"></div>${btn('Xong', 'fbClose')}` };
  h += h1('Gửi phản hồi', 'sm');
  h += `<section class="card"><p class="lead">Bạn đánh giá app thế nào?</p><div class="stars">${[1, 2, 3, 4, 5].map(n => `<button class="star${f.stars >= n ? ' on' : ''}" ${on('fbStar', { v: n })} aria-label="${n} sao">${icon('star')}</button>`).join('')}</div></section>`;
  h += `<section class="card"><p class="lead">App có giúp bạn phòng chống đột quỵ không?</p>${chips([['1', 'Có'], ['0', 'Không']], f.useful == null ? null : f.useful ? '1' : '0', 'fbUse', {}, 'grid')}</section>`;
  if (f.useful != null) h += chips((f.useful ? FEEDBACK_HELPED : FEEDBACK_WHY_NOT).map(x => [x, x]), f.picks, 'fbPick');
  h += `<label class="label" for="fbt">Góp ý</label><textarea id="fbt" class="input" data-field="fbText">${esc(f.text)}</textarea>`;
  h += `<label class="label" for="fbe">Email để nhận trả lời</label><input id="fbe" class="input" type="email" inputmode="email" autocomplete="email" data-field="fbEmail" value="${esc(f.email)}">`;
  return { chrome: 'push', html: h + btn('Gửi', 'fbSend') };
};
A.fbStar = ({ v }) => { S.draft.fb.stars = Number(v); };
A.fbUse = ({ v }) => { S.draft.fb.useful = v === '1'; S.draft.fb.picks = []; };
A.fbPick = ({ v }) => { const l = S.draft.fb.picks, i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); };
F.fbText = v => { S.draft.fb.text = v; };
F.fbEmail = v => { S.draft.fb.email = v; };
A.fbSend = () => { S.draft.fb.done = true; D.dismissed.feedback = true; };
A.fbClose = () => { S.draft.fb = null; back(); };
V.privacy = () => ({ chrome: P() ? 'push' : 'bare', html: `${topBar({ back: 'Quay lại' })}${h1('Bảo mật', 'sm')}<ul class="bullets">${PRIVACY.map(x => `<li>${x}</li>`).join('')}</ul>` });
