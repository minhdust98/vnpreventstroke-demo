'use strict';
// Lần đầu dùng app: đúng câu hỏi và logic rẽ nhánh của BRD, chỉ bắt buộc tuổi, chiều cao, cân nặng, tiền sử đột quỵ.

V.onWelcome = () => {
  const on = S.ui.on || {};
  const lang = D.settings.lang;
  let h = `<div class="top"><button class="navbtn" data-a="setLangWelcome">${lang === 'vi' ? 'English' : 'Tiếng Việt'}</button>${sosBtn()}</div>`;
  h += `<div class="brand">${icon('brain')}</div><div style="font-size:1.4rem;font-weight:700">VNPreventStroke</div><div class="spacer"></div>`;
  h += `<h1 class="q" style="font-size:2rem">${on.forOther ? `${esc(on.name)} đã từng bị đột quỵ chưa?` : 'Bạn đã từng bị đột quỵ chưa?'}</h1>`;
  if (!on.forOther) h += '<div class="sub">Nhập hộ người thân? Hãy trả lời theo người đó.</div>';
  h += '<button class="btn tall" data-a="onStroke" data-p="1">Có</button><button class="btn tall" data-a="onStroke" data-p="0">Chưa</button>';
  if (!on.forOther) h += '<button class="link" data-a="onGuest">Chỉ xem thông tin về đột quỵ</button>';
  return { chrome: 'bare', html: h };
};
A.setLangWelcome = () => { D.settings.lang = D.settings.lang === 'vi' ? 'en' : 'vi'; persist(); render(); };
A.onGuest = () => { S.stack = [{ v: 'learn' }]; S.navFocus = true; render(); };
A.onStroke = v => {
  S.ui.on = Object.assign(S.ui.on || {}, { stroke: v === '1' });
  go('onConsent');
};

V.onConsent = () => {
  const on = S.ui.on;
  const blk = (k, q, d) => `<div class="card"><div class="mid" style="font-weight:700">${q}</div><div class="sub" style="margin-top:.2rem">${d}</div><div class="yn" style="margin-top:.55rem"><button class="chip ${on[k] === true ? 'on' : ''}" aria-pressed="${on[k] === true}" data-a="onC" data-p="${k}|1">Đồng ý</button><button class="chip ${on[k] === false ? 'on' : ''}" aria-pressed="${on[k] === false}" data-a="onC" data-p="${k}|0">Không</button></div></div>`;
  let h = `<div class="top"><button class="navbtn" data-a="back">${icon('back')}Quay lại</button>${sosBtn()}</div><h1 class="t small">Dữ liệu của bạn, bạn quyết định</h1>`;
  h += blk('doctor', 'Cho bác sĩ điều trị xem số đo và thuốc của bạn?', 'Bác sĩ theo dõi được giữa hai lần khám.');
  h += blk('research', 'Cho dùng dữ liệu cho nghiên cứu về đột quỵ?', 'Không ảnh hưởng đến việc dùng app.');
  h += '<div class="sub ink">App chỉ để tham khảo, không thay thế bác sĩ. Đổi ý lúc nào cũng được.</div><button class="link" data-a="go" data-p="about">Xem chi tiết</button><div class="spacer"></div>';
  h += `<button class="btn" data-a="onConsentNext" ${on.doctor != null && on.research != null ? '' : 'disabled'}>Tiếp tục</button>`;
  return { chrome: 'modal', html: h };
};
A.onC = q => { const [k, v] = q.split('|'); S.ui.on[k] = v === '1'; render(); };
A.onConsentNext = () => onAsk('year');

// Ba thông tin bắt buộc. Mỗi màn một câu, có thanh tiến trình, có nói vì sao hỏi.
const ON_STEPS = ['year', 'height', 'weight'];
function onAsk(step) {
  const i = ON_STEPS.indexOf(step), max = new Date(nowMs()).getFullYear() - TH.year.maxAge;
  const cfg = {
    year: { title: 'Bạn sinh năm nào?', noun: 'Năm sinh', maxLen: 4, auto: 4, min: TH.year.min, max, why: 'Để bác sĩ đánh giá đúng theo tuổi.', onSave: 'onYear', hardMin: false },
    height: { title: 'Bạn cao bao nhiêu?', noun: 'Chiều cao', unit: 'cm', maxLen: 3, auto: 3, min: TH.height.min, max: TH.height.max, why: 'Để tính chỉ số BMI giúp bạn.', onSave: 'onHeight' },
    weight: { title: 'Bạn nặng bao nhiêu?', noun: 'Cân nặng', unit: 'kg', maxLen: 4, comma: true, min: TH.weight.min, max: TH.weight.max, why: 'Để tính chỉ số BMI giúp bạn.', onSave: 'onWeight' },
  }[step];
  S.ui.num = Object.assign({ text: '', prog: i + 1, progN: 3 }, cfg);
  S.ui.prevKey = 'num'; S.ui.keyTarget = 'num';
  go('onNum');
}
V.onNum = () => {
  const n = S.ui.num;
  let h = `<div class="top"><button class="navbtn" data-a="back">${icon('back')}Quay lại</button>${sosBtn()}</div>`;
  h += `<div class="prog">${[1, 2, 3].map(i => `<i class="${i <= n.prog ? 'on' : ''}"></i>`).join('')}</div>`;
  h += `<h1 class="q" style="margin-top:.5rem">${esc(n.title)}</h1><div class="sub ink">${esc(n.why)}</div>`;
  h += `<div class="bpbox on"><span class="k">${esc(n.noun)}${n.unit ? ` (${esc(n.unit)})` : ''}</span><span class="v ${n.text ? '' : 'empty'}">${esc(n.text) || '_ _'}</span></div>`;
  h += keypad(n.comma ? '<button class="key" data-a="key" data-p=",">,</button>' : '');
  if (!n.auto) h += `<button class="btn" data-a="numSave" ${n.text ? '' : 'disabled'}>Tiếp</button>`;
  return { chrome: 'modal', html: h };
};
A.onYear = v => { S.ui.on.birthYear = v; onAsk('height'); };
A.onHeight = v => { S.ui.on.height = v; onAsk('weight'); };
A.onWeight = v => { S.ui.on.weight = v; if (S.ui.on.stroke) go('onLink'); else go('onTrack'); };

// Liên kết bệnh viện: lấy sẵn thuốc, lịch khám, tiền sử
V.onLink = () => {
  const on = S.ui.on;
  let h = `<div class="top"><button class="navbtn" data-a="back">${icon('back')}Quay lại</button>${sosBtn()}</div><h1 class="q">Lấy thông tin từ bệnh viện?</h1><div class="sub ink">Quét mã trên giấy ra viện. Thuốc, lịch tái khám và tiền sử sẽ tự điền, bạn không phải nhập.</div>`;
  if (on.linked) {
    h += `<div class="card"><div class="st green" style="font-size:1.06rem">${icon('check')}Đã lấy thông tin (mô phỏng)</div><div class="sub ink" style="margin-top:.4rem">3 thuốc · Tái khám sau 1 tháng · Nhồi máu não</div></div><div class="spacer"></div><button class="btn" data-a="onToTrack">Tiếp tục</button>`;
  } else {
    h += `<div class="spacer"></div><button class="btn tall" data-a="onScan">${icon('qr')}Quét mã</button><button class="btn sec" data-a="onNoScan">Để sau</button>`;
  }
  return { chrome: 'modal', html: h };
};
A.onScan = () => { S.ui.on.linked = true; render(); };
A.onToTrack = () => go('onTrack');
A.onNoScan = () => go('onType');
V.onType = () => {
  let h = `<div class="top"><button class="navbtn" data-a="back">${icon('back')}Quay lại</button>${sosBtn()}</div><h1 class="q">Bác sĩ có nói bạn bị loại đột quỵ nào không?</h1><div class="sub ink">Không nhớ cũng không sao.</div><div class="chips">`;
  [['ischemic', 'Tắc mạch máu não (nhồi máu não)'], ['hemorrhage', 'Vỡ mạch máu não (chảy máu não)'], ['tia', 'Cơn thoáng qua, tự hết (TIA)'], ['unknown', 'Không nhớ']].forEach(o => { h += `<button class="chip left tall" style="font-size:1.2rem" data-a="onTypeSet" data-p="${o[0]}">${o[1]}</button>`; });
  h += '</div>';
  return { chrome: 'modal', html: h };
};
A.onTypeSet = v => { S.ui.on.strokeType = v; go('onTrack'); };

// Hỏi có muốn theo dõi không, đúng BRD. Người sau đột quỵ gợi ý sẵn huyết áp vì đây là việc chính.
V.onTrack = () => {
  const on = S.ui.on;
  if (on.tBP === undefined) { on.tBP = !!on.stroke; on.tGlu = false; on.tHabit = false; }
  const t = (k, n, d) => `<button class="chip left ${on[k] ? 'on' : ''}" style="min-height:4.5rem" aria-pressed="${!!on[k]}" data-a="onT" data-p="${k}"><span><span style="display:block">${n}</span><span class="d" style="display:block;font-weight:400">${d}</span></span></button>`;
  let h = `<div class="top"><button class="navbtn" data-a="back">${icon('back')}Quay lại</button>${sosBtn()}</div><h1 class="q">Bạn có muốn chúng tôi hỗ trợ theo dõi?</h1><div class="sub ink">Chọn những gì có ích với bạn. Đổi được bất cứ lúc nào.</div><div class="chips">`;
  h += t('tBP', 'Huyết áp', 'Nhắc đo sáng và chiều');
  h += t('tGlu', 'Đường huyết', 'Nếu bạn có máy thử đường');
  h += t('tHabit', 'Thói quen', 'Một câu mỗi tuần, có chọn sẵn');
  h += '</div><div class="spacer"></div><button class="btn" data-a="onFinish">Xong</button>';
  return { chrome: 'modal', html: h };
};
A.onT = k => { S.ui.on[k] = !S.ui.on[k]; render(); };
A.onFinish = () => {
  const on = S.ui.on;
  const id = `p${Date.now()}`;
  const p = emptyProfile(id, on.name || 'Bạn');
  Object.assign(p, { birthYear: on.birthYear, height: on.height, weight: on.weight, stroke: on.stroke, strokeType: on.strokeType || null, hospitalLinked: !!on.linked });
  p.weights = [{ t: nowMs(), v: on.weight }];
  p.consents = { doctor: on.doctor, research: on.research, family: on.forOther ? true : null };
  p.track.bp = !!on.tBP; p.track.glucose = !!on.tGlu; p.track.weeklyHabits = !!on.tHabit;
  if (on.linked) {
    p.strokeType = 'ischemic'; p.strokeDate = '10/2026';
    p.meds = [
      med('c1', 'Clopidogrel (Plavix)', 'antiplatelet', '1 viên', '75 mg', ['sang'], { start: dayKey(nowMs()), end: dayKey(nowMs() + 30 * 864e5) }),
      med('c2', 'Amlodipine', 'bp', '1 viên', '5 mg', ['sang'], { start: dayKey(nowMs()), end: dayKey(nowMs() + 30 * 864e5) }),
      med('c3', 'Atorvastatin', 'lipid', '1 viên', '40 mg', ['toi'], { start: dayKey(nowMs()), end: dayKey(nowMs() + 30 * 864e5), note: 'Sau ăn' }),
    ];
    const d = new Date(nowMs()); d.setMonth(d.getMonth() + 1); d.setHours(8, 0, 0, 0);
    p.appts = [{ id: 'a1', t: d.getTime(), place: 'Bệnh viện mẫu A, khoa Đột quỵ, tầng 3', prep: 'Mang thuốc đang dùng và giấy ra viện.', state: 'upcoming', source: 'Tự lên lịch 1 tháng sau xuất viện' }];
    p.facts = { htn: { v: 'yes', source: 'hospital' }, dm: { v: 'no', source: 'hospital' }, mi: { v: 'no', source: 'hospital' }, prior: { v: 'no', source: 'hospital' }, cvdother: { v: 'no', source: 'hospital' }, chf: { v: 'no', source: 'hospital' } };
    p.history = { htn: true };
  }
  D.profiles[id] = p;
  if (!D.owner) D.owner = id;
  D.active = id;
  D.onboarding = false;
  S.ui = {};
  S.stack = []; S.tab = 'today';
  persist(); S.navFocus = true; render();
  document.getElementById('view').scrollTop = 0;
  toast('Xong. Bắt đầu thôi!');
};
