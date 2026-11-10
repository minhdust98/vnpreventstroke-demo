'use strict';
// Lần đầu mở app: đúng câu hỏi rẽ nhánh của BRD. Chỉ bắt buộc năm sinh, chiều cao, cân nặng, tiền sử đột quỵ.

const onb = () => S.draft.on || (S.draft.on = {});
const onTop = () => `<header class="top"><button class="nav" ${on('back')}>${icon('back')}Quay lại</button>${sosBtn()}</header>`;

V.welcome = () => {
  const o = onb(), who = o.forOther ? `${esc(o.name)} đã` : o.relative ? 'Người thân của bạn đã' : 'Bạn đã';
  let h = `<header class="top"><button class="nav" ${on('setting', { k: 'lang', v: D.settings.lang === 'vi' ? 'en' : 'vi' })}>${D.settings.lang === 'vi' ? 'English' : 'Tiếng Việt'}</button>${sosBtn()}</header>`;
  h += `<div class="brand">${icon('brain')}</div><p class="lead">VNPreventStroke</p><div class="spacer"></div>`;
  h += h1(`${who} từng bị đột quỵ chưa?`, 'q') + btn('Có', 'onStroke', { v: 1 }) + btn('Chưa', 'onStroke', { v: 0 });
  if (!o.forOther) h += btn(o.relative ? 'Tôi nhập cho bản thân' : 'Tôi nhập cho người thân', 'onRelative', {}, 'plain') + btn('Chỉ xem thông tin', 'onGuest', {}, 'plain');
  return { chrome: 'bare', white: true, html: h };
};
A.onRelative = () => { onb().relative = !onb().relative; };
A.onGuest = () => { S.stack = [{ v: 'learn', p: {} }]; S.focus = true; };
A.onStroke = ({ v }) => {
  const o = onb(), c = D.account && D.account.consent;
  o.stroke = v === '1';
  // Hai câu đồng ý đã nằm ở phần đăng ký: không hỏi lại cho chính mình
  if (c && c.doctor != null && c.research != null && !o.forOther && !o.relative) { Object.assign(o, { doctor: c.doctor, research: c.research }); A.onAsk({ step: 'year' }); } else go('consent');
};

V.consent = () => {
  const o = onb(), ok = o.doctor != null && o.research != null;
  let h = onTop() + h1('Dữ liệu của bạn', 'sm');
  h += [['doctor', 'Cho bác sĩ điều trị xem số đo và thuốc?'], ['research', 'Cho dùng dữ liệu cho nghiên cứu về đột quỵ?']].map(([k, q]) => `<section class="card"><p class="lead">${q}</p>${chips([['1', 'Đồng ý'], ['0', 'Không']], o[k] == null ? null : o[k] ? '1' : '0', 'onConsent', { k }, 'grid')}</section>`).join('');
  h += group(row({ title: 'Bảo mật', a: 'go', p: { v: 'privacy' } })) + `<p class="body">Thông tin trong app chỉ để tham khảo, không thay thế bác sĩ.</p><div class="spacer"></div>`;
  return { chrome: 'modal', html: h + btn('Tiếp tục', 'onAsk', { step: 'year' }, '', ok ? '' : 'disabled') };
};
A.onConsent = ({ k, v }) => { onb()[k] = v === '1'; };

// Ba thông tin bắt buộc, mỗi màn một câu. Lý do hỏi nằm sau nút (i), đúng gợi ý "Xem chi tiết" của BRD.
const ON_STEPS = {
  year: { q: 'Bạn sinh năm nào?', label: 'Năm sinh', maxLen: 4, auto: 4, why: 'Để bác sĩ đánh giá đúng theo tuổi.', next: 'height' },
  height: { q: 'Bạn cao bao nhiêu?', label: 'Chiều cao', unit: 'cm', maxLen: 3, auto: 3, why: 'Để tính chỉ số BMI giúp bạn.', next: 'weight' },
  weight: { q: 'Bạn nặng bao nhiêu?', label: 'Cân nặng', unit: 'kg', maxLen: 4, comma: true, why: 'Để tính chỉ số BMI giúp bạn.' },
};
function onStep(step) {
  const c = ON_STEPS[step], lim = { year: [TH.year.min, new Date(now()).getFullYear() - TH.year.maxAge], height: [TH.height.min, TH.height.max], weight: [TH.weight.min, TH.weight.max] }[step];
  S.draft.num = Object.assign({ text: '', step, title: c.q, min: lim[0], max: lim[1], onSave: 'onSaved' }, c);
  S.draft.prevKeys = 'num'; S.draft.keys = 'num';
}
A.onAsk = ({ step }) => { onStep(step); go('onNum', { step }); };
V.onNum = ({ step }) => {
  if (!S.draft.num || S.draft.num.step !== step) onStep(step);
  const n = S.draft.num, i = Object.keys(ON_STEPS).indexOf(n.step);
  let h = onTop() + `<div class="prog">${[0, 1, 2].map(k => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>`;
  h += `<div class="q-head">${h1(n.q, 'q')}<button class="icon-btn" ${on('onWhy')} aria-label="Vì sao hỏi">${icon('info')}</button></div>`;
  h += field(`${n.label}${n.unit ? ` (${n.unit})` : ''}`, esc(n.text), true) + keypad(n.comma ? `<button class="key" ${on('key', { k: ',' })}>,</button>` : '');
  return { chrome: 'modal', html: h + (n.auto ? '' : btn('Tiếp', 'numSave', {}, '', n.text ? '' : 'disabled')) };
};
A.onWhy = () => sheet('onWhySheet');
V.onWhySheet = () => ({ title: 'Vì sao hỏi', html: `${sheetHead('Vì sao hỏi')}<p class="body">${S.draft.num.why}</p>` });
A.onSaved = v => {
  const o = onb(), step = S.draft.num.step;
  o[{ year: 'birthYear', height: 'height', weight: 'weight' }[step]] = v;
  if (ON_STEPS[step].next) A.onAsk({ step: ON_STEPS[step].next });
  else if (needSex()) go('onSex');
  else onAfterBasics();
};
// Giới tính hỏi ở phần đăng ký. Hồ sơ người thân, hoặc tài khoản chưa có giới tính, thì hỏi ở đây.
const needSex = () => { const o = onb(); return !o.sex && (o.forOther || o.relative || (D.account && D.account.sex === '')); };
const onAfterBasics = () => go(onb().stroke ? 'onLink' : 'onHist', { step: 0 });
V.onSex = () => ({ chrome: 'modal', html: `${onTop()}${h1('Giới tính?', 'q')}${chips([['male', 'Nam'], ['female', 'Nữ'], ['other', 'Khác']], onb().sex, 'onSexSet')}` });
A.onSexSet = ({ v }) => { onb().sex = v; onAfterBasics(); };

V.onLink = () => {
  const o = onb();
  let h = onTop() + h1('Lấy thông tin từ bệnh viện?', 'q');
  if (o.linked) h += group(row({ icon: 'hospital', title: 'Bệnh viện', value: esc(HOSPITAL_SAMPLE.name), wrap: true })) + group([row({ icon: 'doc', title: 'Đột quỵ', value: 'Nhồi máu não, 10/2026' })].concat(HOSPITAL_SAMPLE.dx.map(d => row({ icon: 'doc', title: d.name, value: `từ ${d.year}` }))), { title: 'Chẩn đoán' }) + group([row({ icon: 'pill', title: 'Thuốc', value: '3' }), row({ icon: 'cal', title: 'Tái khám', value: 'Sau 1 tháng' })]) + '<div class="spacer"></div>' + btn('Tiếp tục', 'go', { v: 'onHist', step: 0 });
  else h += `<div class="spacer"></div>${btn(`${icon('qr')}Quét mã trên giấy ra viện`, 'onScan')}${btn('Nhập tay', 'go', { v: 'onType' }, 'soft')}`;
  return { chrome: 'modal', html: h };
};
A.onScan = () => { onb().linked = true; };
V.onType = () => ({ chrome: 'modal', html: `${onTop()}${h1('Bác sĩ nói bạn bị loại đột quỵ nào?', 'q')}${chips(STROKE_TYPES, null, 'onTypeSet')}` });
A.onTypeSet = ({ v }) => { onb().strokeType = v; go('onHist', { step: 0 }); };

// ---- Hồ sơ ban đầu: bệnh nền, gia đình, tim mạch, sinh hoạt, triệu chứng. Mỗi màn một nhóm, câu nào cũng bỏ qua được. ----
const histSteps = () => INTAKE.map(s => Object.assign({}, s, { qs: s.qs.filter(q => !(onb().linked && HOSPITAL_KNOWN.includes(q.id))) })).filter(s => s.qs.length);
const qText = q => q.q || RISK_Q[q.id].q;
function histQ(q, hist) {
  if (q.only && !q.only(hist)) return '';
  if (q.k === 'fact') return `<section class="card"><p class="lead">${qText(q)}</p>${chips(YES_NO_UNSURE, hist[q.id], 'onHistSet', { id: q.id }, 'grid three')}</section>`;
  if (q.k === 'drug') return `<section class="card"><p class="lead">${q.q}</p>${chips(q.opts.map(x => [x, x]), hist[q.id], 'onHistSet', { id: q.id }, 'grid three')}</section>`;
  if (q.k === 'age') return `<section class="card"><label class="lead" for="fam-age">${q.q}</label><input id="fam-age" class="input" inputmode="numeric" maxlength="3" data-field="onFamAge" value="${esc(hist.familyAge || '')}" autocomplete="off"></section>`;
  return row({ icon: HABITS[q.id].icon, title: HABITS[q.id].name, value: (hist.ls || {})[q.id] ? 'Đã trả lời' : '', a: 'onLs', p: { k: q.id } });
}
V.onHist = ({ step }) => {
  const steps = histSteps(), i = Math.min(Number(step), steps.length - 1), s = steps[i], o = onb(), hist = o.hist || (o.hist = {});
  let h = onTop() + `<div class="prog">${steps.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>` + h1(s.title, 'q'), rows = [];
  // Bệnh nền nằm cùng hồ sơ sức khỏe: hiện chẩn đoán đã có từ bệnh viện
  if (s.dx && o.linked) h += group([row({ icon: 'hospital', title: 'Bệnh viện', value: esc(HOSPITAL_SAMPLE.name), wrap: true }), row({ icon: 'doc', title: 'Đột quỵ', value: 'Nhồi máu não, 10/2026' })].concat(HOSPITAL_SAMPLE.dx.map(d => row({ icon: 'doc', title: d.name, value: `từ ${d.year}` }))), { title: 'Chẩn đoán đã có' });
  const flush = () => { if (rows.length) h += group(rows); rows = []; };
  s.qs.forEach(q => { if (q.k === 'ls') rows.push(histQ(q, hist)); else { flush(); h += histQ(q, hist); } });
  flush();
  if (s.dx) {
    h += (hist.dxPhoto ? `<img class="thumb" src="${hist.dxPhoto}" alt="Ảnh giấy chẩn đoán">` : '') + btn(`${icon('camera')}${hist.dxPhoto ? 'Chụp lại giấy chẩn đoán' : 'Chụp giấy chẩn đoán'}`, 'scan', { target: 'dx' }, 'soft');
    h += `<div><label class="label" for="ins">Cơ sở đăng ký khám chữa bệnh (theo bảo hiểm)</label><input id="ins" class="input" maxlength="120" data-field="onInsurance" value="${esc(hist.insurance || '')}" autocomplete="off"></div>`;
  }
  if (s.other) h += `<div><label class="label" for="oth">Khác</label><input id="oth" class="input" maxlength="200" data-field="onHistOther" data-key="${s.other}" value="${esc((hist.other || {})[s.other] || '')}" autocomplete="off"></div>`;
  const last = i === steps.length - 1;
  return { chrome: 'modal', html: `${h}<div class="cta">${btn('Tiếp tục', last ? 'onHistDone' : 'onHistNext', { step: i + 1 })}${last ? '' : btn('Để sau', 'onHistDone', {}, 'plain')}</div>` };
};
F.onHistOther = (v, el) => { const h = onb().hist; (h.other || (h.other = {}))[el.dataset.key] = v; };
F.onInsurance = v => { onb().hist.insurance = v; };
F.onFamAge = v => { onb().hist.familyAge = v.replace(/\D/g, '').slice(0, 3); };
A.onHistNext = ({ step }) => go('onHist', { step: Number(step) });
A.onHistDone = () => go('onTrack');
A.onHistSet = ({ id, v }) => { onb().hist[id] = v; };
// Sinh hoạt: mỗi thói quen mở đúng bộ câu hỏi lối sống, bỏ qua được
A.onLs = ({ k }) => { S.draft.ls = { k, ans: Object.assign({}, (onb().hist.ls || {})[k]), onb: true }; go('lifestyle', { k }); };
// Ghi câu trả lời vào hồ sơ. Câu chưa trả lời giữ trống, không bao giờ thành "Không".
function applyIntake(p, o) {
  const h = o.hist || {}, by = 'self', t = now();
  ['htn', 'dm', 'lipid', 'kidney', 'cvd', 'af', 'apnea', 'family'].forEach(id => { if (h[id]) p.facts[id] = { v: h[id], source: 'patient', by, t }; });
  if (h.cvd) p.facts.heart = { v: h.cvd, source: 'patient', by, t };
  if (h.family === 'yes' && h.familyAge) p.facts.family.detail = { age: Number(h.familyAge) };
  Object.keys(h.ls || {}).forEach(k => lsApply(p, k, h.ls[k], by, t));
  if (h.anticoag) p.drugs.anticoag = h.anticoag;
  if (h.insurance && h.insurance.trim()) p.insurance = { facility: h.insurance.trim() };
  if (h.dxPhoto) (p.visits = p.visits || []).push({ id: `v${t}`, t, place: 'Giấy chẩn đoán', dx: '', photo: h.dxPhoto, by });
  const ot = {};
  Object.keys(h.other || {}).forEach(k => { const x = h.other[k].trim(); if (x) ot[k] = x; });
  if (ot.cond) p.otherConditions = ot.cond;
  delete ot.cond;
  if (INTAKE_SX.some(([id]) => h[id])) p.intake = { t, by, symptoms: INTAKE_SX.filter(([id]) => h[id] === 'yes').map(x => x[2]), unknown: INTAKE_SX.every(([id]) => h[id] === 'unknown'), sx: { sxA: h.sxA, sxB: h.sxB } };
  if (Object.keys(ot).length) { p.intake = p.intake || { t, by }; p.intake.other = ot; }
}

// Muốn được nhắc đo gì: liệt kê từng chỉ số, có giờ nhắc và tần suất. Huyết áp tự bật nếu đã khai tăng huyết áp hoặc từng đột quỵ,
// đường huyết tự bật nếu đã khai đái tháo đường (khai ở màn Bệnh nền hoặc lấy từ bệnh viện).
function trackInit(o) {
  if (o.trackObj) return o.trackObj;
  const h = o.hist || {}, has = id => h[id] === 'yes' || (o.linked && HOSPITAL_SAMPLE.dx.some(d => d.id === id));
  return (o.trackObj = { bp: !!(has('htn') || o.stroke), bpMoments: ['sang', 'chieu'], bpFreq: 'day', glucose: !!has('dm'), gluMoments: ['sang'], gluFreq: 'day', weight: false, weightMoments: ['sang'], weightFreq: 'month', weeklyHabits: false, habitEvery: 'tuan' });
}
V.onTrack = () => ({ chrome: 'modal', html: `${onTop()}${h1('Muốn được nhắc đo gì?', 'q')}${trackCards(trackInit(onb()), 'onb')}<div class="spacer"></div>${btn('Xong', 'onFinish')}` });
A.onFinish = () => {
  const o = onb(), id = `p${Date.now()}`, p = emptyProfile(id, o.name || 'Bạn');
  Object.assign(p, { sex: o.sex || (!o.forOther && !o.relative && D.account && D.account.sex) || null, birthYear: o.birthYear, height: o.height, weight: o.weight, stroke: o.stroke, strokeType: o.strokeType || null, hospitalLinked: !!o.linked });
  p.weights = [{ t: now(), v: o.weight }];
  p.consents = { doctor: o.doctor, research: o.research, family: o.forOther ? true : null };
  Object.assign(p.track, trackInit(o));
  if (o.linked) {
    const start = dayKey(now()), end = dayKey(now() + 30 * DAY), d = new Date(now());
    p.strokeType = 'ischemic'; p.strokeDate = '10/2026';
    p.meds = [med('c1', 'Clopidogrel', 'antiplatelet', '1 viên', '75 mg', ['sang'], { start, end }), med('c2', 'Amlodipine', 'bp', '1 viên', '5 mg', ['sang'], { start, end }), med('c3', 'Atorvastatin', 'lipid', '1 viên', '40 mg', ['toi'], { start, end, note: 'Sau ăn' })];
    d.setMonth(d.getMonth() + 1); d.setHours(8, 0, 0, 0);
    p.appts = [{ id: 'a1', t: d.getTime(), place: 'Bệnh viện mẫu A, khoa Đột quỵ, tầng 3', prep: 'Mang thuốc đang dùng và giấy ra viện.', state: 'upcoming' }];
    p.careTeam = Object.assign({}, p.careTeam, { hospital: HOSPITAL_SAMPLE.name });
    p.facts = { htn: { v: 'yes', source: 'hospital', detail: { year: HOSPITAL_SAMPLE.dx[0].year } }, dm: { v: 'no', source: 'hospital' }, mi: { v: 'no', source: 'hospital' }, prior: { v: 'no', source: 'hospital' }, cvdother: { v: 'no', source: 'hospital' }, chf: { v: 'no', source: 'hospital' } };
  }
  applyIntake(p, o);
  D.profiles[id] = p;
  if (!D.owner) D.owner = id;
  D.active = id; D.onboarding = false;
  S.draft = {}; home();
  toast('Xong. Bắt đầu thôi!');
};
