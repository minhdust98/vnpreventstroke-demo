'use strict';
// Bảng điều khiển bản demo, nằm ngoài khung điện thoại, không thuộc app.

function renderPanel() {
  const el = document.getElementById('panel'), keepY = el.scrollTop, ms = now(), p = P();
  const pb = (a, prm, label, small, sel) => `<button class="pb${sel ? ' on' : ''}" ${on(a, prm)}>${label}${small ? `<small>${small}</small>` : ''}</button>`;
  let h = pb('closePanel', {}, 'Đóng bảng, về app', '', false).replace('class="pb', 'class="pb panel-close');
  h += '<h2>Bảng điều khiển demo</h2><p class="pn">Không thuộc app. Dữ liệu giả.</p><h3>Người dùng</h3>';
  Object.keys(SCENARIOS).forEach(k => { h += pb('pScenario', { k }, SCENARIOS[k].who, SCENARIOS[k].label, D.scenario === k); });
  h += `<h3>${WD[new Date(ms).getDay()]} ${ddmm(ms)}, ${hhmm(ms)}</h3><div class="g2">${[['07:02', 'Sáng'], ['12:05', 'Trưa'], ['17:02', 'Chiều'], ['20:02', 'Tối']].map(([t, l]) => pb('pTime', { t }, `${l} ${t}`, '', hhmm(ms) === t)).join('')}</div>`;
  h += pb('pJump', {}, 'Bỏ app 5 ngày rồi quay lại', 'Không bị trách, không phải nhập bù');
  if (p) {
    const medM = plan().find(m => m.items.some(i => i.kind === 'meds'));
    h += '<h3>Thông báo</h3>' + (medM ? pb('pNotif', { kind: 'meds', mk: medM.key }, `Thuốc buổi ${medM.word}`) : '') + (p.track.bp ? pb('pNotif', { kind: 'measure' }, 'Đo huyết áp') : '');
    if (nextAppt(p)) h += `<div class="g2">${pb('pNotif', { kind: 'appt', days: 3 }, 'Tái khám, trước 3 ngày')}${pb('pNotif', { kind: 'appt', days: 1 }, 'Tái khám, trước 1 ngày')}</div>`;
    h += '<h3>Tình huống</h3>' + (p.meds.length ? pb('pMissLast', {}, 'Tối qua chưa ghi thuốc') : '');
    h += `<div class="g2">${[['192', '118', 'Rất cao'], ['85', '55', 'Thấp'], ['300', '80', 'Nghi nhập sai'], ['126', '78', 'Tốt']].map(([s, d, l]) => pb('pBP', { s, d }, `${s}/${d}`, l)).join('')}</div>`;
    h += pb('pScan', {}, 'Phiếu xét nghiệm mẫu', 'Như khi chụp phiếu') + pb('pPrompt', {}, 'Đã dùng đủ 7 ngày', 'Hiện lời mời đánh giá');
    h += '<h3>Phía bác sĩ</h3>';
    if (p.appts.length) h += `<div class="g2">${pb('pDoc', { k: 'good' }, 'Khám tốt', 'Hẹn 3 tháng')}${pb('pDoc', { k: 'bad' }, 'Chưa tốt', 'Hẹn 1 tháng')}</div>`;
    h += pb('pMsg', {}, 'Bác sĩ gửi tin nhắn') + doctorView();
  }
  h += `<h3>Đo thao tác</h3><div id="meter">${meterHtml()}</div><div class="g2">${pb('pMeter', { v: 'start' }, 'Bắt đầu')}${pb('pMeter', { v: 'stop' }, 'Dừng')}</div>`;
  h += '<h3>Khác</h3>' + pb('pReset', {}, 'Đặt lại demo');
  el.innerHTML = h; el.scrollTop = keepY;
}

// Web bác sĩ nhận gì. Demo không tính điểm, không tự tạo hệ số hay kết quả.
function doctorView() {
  const p = P(), ms = now(), pl = riskPlan(p, ms);
  if (!p.consents.doctor) return '<p class="pn">Người bệnh chưa đồng ý chia sẻ, phía bác sĩ không thấy dữ liệu.</p>';
  let h = '';
  if (!pl.scales.length) h += `<p class="pn">${{ under55: 'Dưới 55 tuổi: FSRP 2017 không áp dụng.', hemorrhage: 'Sau chảy máu não: chưa có thang phù hợp.', unknownType: 'Chưa rõ loại đột quỵ: chờ bác sĩ xác nhận.' }[pl.reason]}</p>`;
  else {
    const pending = pendingConfirm(p, ms);
    h += '<p class="pn">Đầu vào gửi sang web bác sĩ. Điểm chỉ tính và xem ở phía bác sĩ.</p>';
    pl.scales.forEach(sc => {
      const miss = SCALE_INPUTS[sc].filter(l => scaleValue(p, l, ms) == null), st = miss.length ? `còn thiếu ${miss.length}` : pending.length ? `đủ đầu vào, chờ xác nhận ${pending.length} mục` : 'sẵn sàng';
      h += `<details ${miss.length ? 'open' : ''}><summary>${sc}: ${st}</summary><table>${SCALE_INPUTS[sc].map(l => { const v = scaleValue(p, l, ms); return `<tr><td>${l}</td><td class="${v == null ? 'miss' : ''}">${v == null ? 'Thiếu' : esc(v) + scaleSource(p, l)}</td></tr>`; }).join('')}</table><p class="pn">algorithm_version: ${SCALE_VERSION[sc]}${miss.length ? `. Chưa thể tính điểm vì thiếu: ${miss.join(', ')}.` : ''}</p></details>`;
    });
    if (pl.scales.includes('ESRS')) h += '<p class="pn">Cần bác sĩ chốt: câu "bệnh tim khác" dùng định nghĩa ESRS (không tính nhồi máu cơ tim và rung nhĩ), SPI-II chỉ loại nhồi máu cơ tim và cần tránh cộng trùng với suy tim.</p>';
    if (pending.length || (p.facts.confirm && p.facts.confirm.source !== 'doctor')) h += `<button class="pb" ${on('pConfirm')}>Bác sĩ xác nhận các câu bệnh nhân đã khai</button>`;
  }
  h += `<details><summary>Nguồn kế hoạch theo dõi</summary><table>${planItems(p, ms).map(i => `<tr><td>${i.title}</td><td style="text-align:left;font-weight:400">${i.src}</td></tr>`).join('')}</table></details>`;
  return h;
}
const meterHtml = () => `<div class="meter">${S.meter.taps} <small>chạm</small> ${dec(S.meter.sec.toFixed(1))} <small>giây${S.meter.running ? ', đang đo' : ''}</small></div>`;

A.openPanel = () => { document.getElementById('panel').classList.add('open'); return false; };
A.closePanel = () => { document.getElementById('panel').classList.remove('open'); return false; };
const closePanel = () => document.getElementById('panel').classList.remove('open');
A.pScenario = ({ k }) => { loadScenario(k); closePanel(); };
A.pTime = ({ t }) => { D.now = atTime(D.now, t); S.draft.weekReply = null; S.lock = null; home(); closePanel(); };
A.pJump = () => { D.now = atTime(D.now + 5 * DAY, '07:02'); D.prompt7 = true; S.draft.weekReply = null; S.lock = null; home(); closePanel(); };
A.pNotif = ({ kind, mk, days }) => { S.lock = { kind, mk, days: Number(days) }; S.focus = true; closePanel(); };
A.pMissLast = () => {
  const p = P(), y = now() - DAY, meds = medsActive(p, y);
  let lastMk = null;
  MOMENTS.forEach(m => { if (meds.some(x => x.moments.includes(m.key))) lastMk = m.key; });
  meds.filter(x => x.moments.includes(lastMk)).forEach(x => { delete p.doses[doseKey(y, lastMk, x.id)]; });
  home(); closePanel();
};
A.pBP = ({ s, d }) => { home(); A.startBP({}); Object.assign(S.draft.bp, { sys: s, dia: d, focus: 'dia' }); closePanel(); };
A.pScan = () => { home(); S.tab = 'metrics'; S.draft.scanTarget = 'lab'; scanned(null); closePanel(); };
A.pPrompt = () => { D.prompt7 = true; D.dismissed.feedback = false; home(); closePanel(); };
A.pDoc = ({ k }) => {
  const p = P(), cur = p.appts.filter(a => a.state !== 'done').sort((a, b) => a.t - b.t)[0], d = new Date(now());
  if (cur) { cur.state = 'done'; cur.result = k === 'good' ? 'Tốt, hẹn 3 tháng' : 'Chưa tốt, hẹn 1 tháng'; cur.t = Math.min(cur.t, now()); }
  d.setMonth(d.getMonth() + (k === 'good' ? 3 : 1)); d.setHours(8, 0, 0, 0);
  p.appts.push({ id: `a${Date.now()}`, t: d.getTime(), place: 'Bệnh viện mẫu A, khoa Đột quỵ, tầng 3', prep: 'Mang thuốc đang dùng và kết quả xét nghiệm.', state: 'upcoming' });
  home(); go('visit'); closePanel();
};
A.pMsg = () => { P().messages.unshift({ id: `m${Date.now()}`, from: P().careTeam.doctor, t: now(), text: 'Huyết áp tuần này khá ổn. Tiếp tục dùng thuốc đều nhé.', read: false }); home(); closePanel(); };
A.pConfirm = () => {
  const p = P();
  Object.keys(p.facts).forEach(id => { const x = p.facts[id]; if (NEEDS_CONFIRM.includes(id) && x.source === 'patient' && x.v !== 'unknown') x.source = 'doctor'; });
  if (riskPlan(p, now()).ids.includes('confirm')) p.facts.confirm = { v: 'yes', source: 'doctor', t: now() };
};
A.pMeter = ({ v }) => { const m = S.meter; if (v === 'start') Object.assign(m, { taps: 0, sec: 0, start: Date.now(), running: true }); else m.running = false; };
A.pReset = () => { store.clear(); D = null; loadScenario('an'); };
