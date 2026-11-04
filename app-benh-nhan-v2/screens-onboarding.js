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
A.onStroke = ({ v }) => { onb().stroke = v === '1'; go('consent'); };

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
  else go(o.stroke ? 'onLink' : 'onTrack');
};

V.onLink = () => {
  const o = onb();
  let h = onTop() + h1('Lấy thông tin từ bệnh viện?', 'q');
  if (o.linked) h += group([row({ icon: 'pill', title: 'Thuốc', value: '3' }), row({ icon: 'cal', title: 'Tái khám', value: 'Sau 1 tháng' }), row({ icon: 'doc', title: 'Đột quỵ', value: 'Nhồi máu não' })]) + '<div class="spacer"></div>' + btn('Tiếp tục', 'go', { v: 'onTrack' });
  else h += `<div class="spacer"></div>${btn(`${icon('qr')}Quét mã trên giấy ra viện`, 'onScan')}${btn('Nhập tay', 'go', { v: 'onType' }, 'soft')}`;
  return { chrome: 'modal', html: h };
};
A.onScan = () => { onb().linked = true; };
V.onType = () => ({ chrome: 'modal', html: `${onTop()}${h1('Bác sĩ nói bạn bị loại đột quỵ nào?', 'q')}${chips(STROKE_TYPES, null, 'onTypeSet')}` });
A.onTypeSet = ({ v }) => { onb().strokeType = v; go('onTrack'); };

// Hỏi có muốn được nhắc đo không, đúng BRD. Người sau đột quỵ được chọn sẵn huyết áp.
V.onTrack = () => {
  const o = onb();
  if (!o.track) o.track = o.stroke ? ['bp'] : [];
  return { chrome: 'modal', html: `${onTop()}${h1('Muốn được nhắc đo gì?', 'q')}${chips([['bp', 'Huyết áp'], ['glucose', 'Đường huyết'], ['habits', 'Thói quen mỗi tuần']], o.track, 'onTrackPick')}<div class="spacer"></div>${btn('Xong', 'onFinish')}` };
};
A.onTrackPick = ({ v }) => { const l = onb().track, i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); };
A.onFinish = () => {
  const o = onb(), id = `p${Date.now()}`, p = emptyProfile(id, o.name || 'Bạn');
  Object.assign(p, { birthYear: o.birthYear, height: o.height, weight: o.weight, stroke: o.stroke, strokeType: o.strokeType || null, hospitalLinked: !!o.linked });
  p.weights = [{ t: now(), v: o.weight }];
  p.consents = { doctor: o.doctor, research: o.research, family: o.forOther ? true : null };
  Object.assign(p.track, { bp: o.track.includes('bp'), glucose: o.track.includes('glucose'), weeklyHabits: o.track.includes('habits') });
  if (o.linked) {
    const start = dayKey(now()), end = dayKey(now() + 30 * DAY), d = new Date(now());
    p.strokeType = 'ischemic'; p.strokeDate = '10/2026';
    p.meds = [med('c1', 'Clopidogrel', 'antiplatelet', '1 viên', '75 mg', ['sang'], { start, end }), med('c2', 'Amlodipine', 'bp', '1 viên', '5 mg', ['sang'], { start, end }), med('c3', 'Atorvastatin', 'lipid', '1 viên', '40 mg', ['toi'], { start, end, note: 'Sau ăn' })];
    d.setMonth(d.getMonth() + 1); d.setHours(8, 0, 0, 0);
    p.appts = [{ id: 'a1', t: d.getTime(), place: 'Bệnh viện mẫu A, khoa Đột quỵ, tầng 3', prep: 'Mang thuốc đang dùng và giấy ra viện.', state: 'upcoming' }];
    p.facts = { htn: { v: 'yes', source: 'hospital' }, dm: { v: 'no', source: 'hospital' }, mi: { v: 'no', source: 'hospital' }, prior: { v: 'no', source: 'hospital' }, cvdother: { v: 'no', source: 'hospital' }, chf: { v: 'no', source: 'hospital' } };
  }
  D.profiles[id] = p;
  if (!D.owner) D.owner = id;
  D.active = id; D.onboarding = false;
  S.draft = {}; home();
  toast('Xong. Bắt đầu thôi!');
};
