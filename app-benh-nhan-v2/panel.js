'use strict';
// Bảng điều khiển bản demo. Nằm ngoài khung điện thoại, không thuộc app.

function renderPanel() {
  const el = document.getElementById('panel');
  const keepY = el.scrollTop;
  const ms = nowMs();
  const pb = (a, p, label, small, on) => `<button class="pb ${on ? 'on' : ''}" data-a="${a}" data-p="${esc(p || '')}">${label}${small ? `<small>${small}</small>` : ''}</button>`;
  let h = '<button class="pb panel-close" data-a="closePanel">Đóng bảng, về app</button>';
  h += '<h2>Bảng điều khiển demo</h2><p class="pn">Không thuộc app. Dùng để đổi tình huống khi xem thử. Toàn bộ dữ liệu là giả.</p>';
  h += '<h3>Đang xem ai</h3>';
  Object.keys(SCENARIOS).forEach(k => { const s = SCENARIOS[k]; h += pb('pScenario', k, s.who, s.label, D.scenario === k); });
  h += `<h3>Thời gian: ${WD[new Date(ms).getDay()]} ${ddmm(ms)}, ${hhmm(ms)}</h3><div class="grid2">`;
  [['07:02', 'Sáng 07:02'], ['12:05', 'Trưa 12:05'], ['17:02', 'Chiều 17:02'], ['20:02', 'Tối 20:02']].forEach(t => { h += pb('pTime', t[0], t[1], '', hhmm(ms) === t[0]); });
  h += '</div><div style="height:5px"></div>';
  h += pb('pJump', '5', 'Bỏ app 5 ngày rồi quay lại', 'Không bị trách, không phải nhập bù');
  if (P()) {
    const plan = dayPlan(P(), ms);
    const medM = plan.find(m => m.items.some(i => i.kind === 'meds'));
    h += '<h3>Giả lập thông báo</h3>';
    if (medM) h += pb('pNotif', `meds|${medM.key}`, `Đến giờ thuốc buổi ${medM.word}`);
    if (P().track.bp) h += pb('pNotif', 'measure', 'Đến giờ đo huyết áp');
    if (nextAppt(P())) h += `<div class="grid2">${pb('pNotif', 'appt|3', 'Tái khám, trước 3 ngày')}${pb('pNotif', 'appt|1', 'Tái khám, trước 1 ngày')}</div><div style="height:5px"></div>`;
    h += '<h3>Giả lập tình huống</h3>';
    if (P().meds.length) h += pb('pMissLast', '', 'Tối qua chưa ghi thuốc', 'Xem luồng quên liều');
    h += `<div class="grid2">${pb('pBP', '192|118', 'Nhập 192/118', 'Rất cao')}${pb('pBP', '85|55', 'Nhập 85/55', 'Thấp')}${pb('pBP', '300|80', 'Nhập 300/80', 'Nghi nhập sai')}${pb('pBP', '126|78', 'Nhập 126/78', 'Tốt')}</div><div style="height:5px"></div>`;
    h += pb('pPrompt', '', 'Đã dùng đủ 7 ngày', 'Hiện lời mời đánh giá trên Hôm nay');
    h += '<h3>Phía bác sĩ (web bác sĩ)</h3>';
    if (P().appts.length) h += `<div class="grid2">${pb('pDoc', 'good', 'Kết quả khám tốt', 'Hẹn lại sau 3 tháng')}${pb('pDoc', 'bad', 'Kết quả chưa tốt', 'Hẹn lại sau 1 tháng')}</div><div style="height:5px"></div>`;
    h += pb('pMsg', '', 'Bác sĩ gửi tin nhắn');
    h += doctorView();
  }
  h += '<h3>Đo thao tác</h3><div id="meter">' + meterHtml() + '</div>';
  h += `<div class="grid2">${pb('pMeter', 'start', 'Bắt đầu đo')}${pb('pMeter', 'stop', 'Dừng')}</div>`;
  h += '<h3>Khác</h3>' + pb('pReset', '', 'Đặt lại toàn bộ demo');
  el.innerHTML = h;
  el.scrollTop = keepY;
}

// Những gì web bác sĩ nhận được. Demo không tính điểm, không tự tạo hệ số hay kết quả.
function scaleValue(p, label) {
  const last = lastOf(p.bp);
  if (label === 'Tiền sử đột quỵ/TIA') return p.stroke === false ? 'Không' : 'Có';
  if (label === 'Tuổi') return p.birthYear ? `${age(p)}` : null;
  if (label === 'Huyết áp tâm thu') { if (last) return `${last.sys}`; const x = p.facts.sbp; return x && x.v && x.v !== 'unknown' ? `${x.v}` : null; }
  if (label === 'Loại biến cố') return { ischemic: 'Đột quỵ', tia: 'TIA' }[p.strokeType] || null;
  const v = factOf(p, SCALE_FACT[label]);
  if (v == null || v === 'unknown') return null;
  return { yes: 'Có', no: 'Không', male: 'Nam', female: 'Nữ' }[v] || v;
}
function scaleSource(p, label) {
  const x = p.facts[SCALE_FACT[label]];
  if (!SCALE_FACT[label]) return '';
  if (!x || x.v == null) return ' (tự lấy từ thuốc)';
  return { hospital: ' (bệnh viện)', doctor: ' (bác sĩ)', patient: ' (bệnh nhân khai)' }[x.source] || '';
}
function doctorView() {
  const p = P(), plan = riskPlan(p, nowMs());
  let h = '';
  if (!p.consents.doctor) return '<p class="pn" style="margin-top:6px">Người bệnh chưa đồng ý chia sẻ, nên phía bác sĩ không thấy dữ liệu này.</p>';
  if (!plan.scales.length) {
    const why = { under55: 'Dưới 55 tuổi: FSRP 2017 không áp dụng.', hemorrhage: 'Sau chảy máu não: ESRS và SPI-II không áp dụng, chưa có thang phù hợp.', unknownType: 'Chưa rõ loại đột quỵ: cần bác sĩ xác nhận trước khi chọn thang.' }[plan.reason];
    h += `<p class="pn" style="margin-top:6px">${why}</p>`;
  } else {
    h += '<p class="pn" style="margin-top:6px">Đầu vào gửi sang web bác sĩ. Điểm được tính và xem ở phía bác sĩ, app bệnh nhân không hiện. Demo không tính điểm.</p>';
    const pending = plan.ids.filter(id => NEEDS_CONFIRM.includes(id) && p.facts[id] && p.facts[id].source === 'patient' && p.facts[id].v !== 'unknown');
    plan.scales.forEach(sc => {
      const miss = []; let rows = '';
      SCALE_INPUTS[sc].forEach(l => { const v = scaleValue(p, l); if (v == null) miss.push(l); rows += `<tr><td>${l}</td><td class="${v == null ? 'miss' : ''}">${v == null ? 'Thiếu' : esc(v) + scaleSource(p, l)}</td></tr>`; });
      const st = miss.length ? `còn thiếu ${miss.length}` : pending.length ? `đủ đầu vào, chờ xác nhận ${pending.length} mục` : 'sẵn sàng';
      h += `<details style="margin-bottom:6px" ${miss.length ? 'open' : ''}><summary style="font-weight:700;cursor:pointer;min-height:28px">${sc}: ${st}</summary><table>${rows}</table><p class="pn" style="margin:4px 0 0">algorithm_version: ${SCALE_VERSION[sc]}${miss.length ? `. Chưa thể tính điểm vì thiếu: ${miss.join(', ')}.` : ''}</p></details>`;
    });
    if (plan.scales.includes('ESRS')) h += '<p class="pn">Cần bác sĩ chốt: một câu "bệnh tim khác" đang dùng định nghĩa ESRS (không tính nhồi máu cơ tim và rung nhĩ), trong khi SPI-II chỉ loại nhồi máu cơ tim. SPI-II cũng cần tránh cộng trùng với suy tim.</p>';
    if (pending.length || (p.facts.confirm && p.facts.confirm.source !== 'doctor')) h += '<button class="pb" data-a="pConfirm">Bác sĩ xác nhận các câu bệnh nhân đã khai</button>';
  }
  const items = carePlanItems(p, nowMs());
  h += `<details style="margin-top:6px"><summary style="font-weight:700;cursor:pointer;min-height:28px">Nguồn của màn Theo dõi của bạn</summary><table>${items.map(i => `<tr><td>${i.n}</td><td style="text-align:left;font-weight:400">${i.src}</td></tr>`).join('')}</table></details>`;
  return h;
}
A.pConfirm = () => {
  const p = P();
  Object.keys(p.facts).forEach(id => { const x = p.facts[id]; if (NEEDS_CONFIRM.includes(id) && x.source === 'patient' && x.v !== 'unknown') x.source = 'doctor'; });
  if (riskPlan(p, nowMs()).ids.includes('confirm')) p.facts.confirm = { v: 'yes', source: 'doctor', t: nowMs() };
  persist(); render();
};
function meterHtml() {
  const c = D.settings.counter;
  return `<div class="meter">${c.taps} <small>chạm</small> ${c.lastSec.toFixed(1).replace('.', ',')} <small>giây${c.running ? ', đang đo' : ''}</small></div>`;
}
function renderMeter() { const m = document.getElementById('meter'); if (m) m.innerHTML = meterHtml(); }

A.openPanel = () => { document.getElementById('panel').classList.add('open'); };
A.closePanel = () => { document.getElementById('panel').classList.remove('open'); };
A.pScenario = k => { const lang = D.settings; loadScenario(k); A.closePanel(); S.navFocus = true; render(); document.getElementById('view').scrollTop = 0; };
A.pTime = t => { D.now = atTime(D.now, t); S.ui.weekReply = null; S.lock = null; persist(); A.home(); A.closePanel(); };
A.pJump = n => { D.now = atTime(D.now + Number(n) * 864e5, '07:02'); D.prompt7 = true; S.ui.weekReply = null; S.lock = null; persist(); A.home(); A.closePanel(); };
A.pNotif = q => {
  const [k, x] = q.split('|');
  if (k === 'meds') S.lock = { kind: 'meds', mk: x };
  else if (k === 'measure') S.lock = { kind: 'measure' };
  else S.lock = { kind: 'appt', days: Number(x) };
  A.closePanel(); S.navFocus = true; render();
};
A.pMissLast = () => {
  const p = P(), y = nowMs() - 864e5, meds = medsActive(p, y);
  let last = null;
  MOMENTS.forEach(m => { if (meds.some(x => x.moments.includes(m.key))) last = m.key; });
  meds.filter(x => x.moments.includes(last)).forEach(x => { delete p.doses[doseKey(y, last, x.id)]; });
  Object.keys(p.doses).forEach(() => {});
  if (!Object.keys(p.doses).some(k => k.startsWith(dayKey(y)))) { const first = meds[0]; if (first) { const mk = first.moments[0]; if (mk !== last) p.doses[doseKey(y, mk, first.id)] = { s: 'taken', t: atTime(y, momentOf(mk).time), by: 'self' }; else p.doses[`${dayKey(y)}|_|_`] = { s: 'none', t: y }; } }
  persist(); A.home(); A.closePanel();
};
A.pBP = q => {
  const [s, d] = q.split('|');
  A.home(); A.startBP();
  Object.assign(S.ui.bp, { sys: s, dia: d, focus: 'dia' });
  A.closePanel(); render();
};
A.pPrompt = () => { D.prompt7 = true; D.dismissed.feedback = false; persist(); A.home(); A.closePanel(); };
A.pDoc = kind => {
  const p = P();
  const cur = p.appts.filter(a => a.state !== 'done').sort((a, b) => a.t - b.t)[0];
  if (cur) { cur.state = 'done'; cur.result = kind === 'good' ? 'Tốt, hẹn 3 tháng' : 'Chưa tốt, hẹn 1 tháng'; if (cur.t > nowMs()) cur.t = nowMs(); }
  const d = new Date(nowMs()); d.setMonth(d.getMonth() + (kind === 'good' ? 3 : 1)); d.setHours(8, 0, 0, 0);
  p.appts.push({ id: `a${Date.now()}`, t: d.getTime(), place: 'Bệnh viện mẫu A, khoa Đột quỵ, tầng 3', prep: 'Mang thuốc đang dùng và kết quả xét nghiệm.', state: 'upcoming', source: kind === 'good' ? 'Hẹn 3 tháng vì lần trước tốt' : 'Hẹn 1 tháng vì lần trước chưa tốt' });
  persist(); A.tab('visit'); A.closePanel();
};
A.pMsg = () => { const p = P(); p.messages.unshift({ id: `m${Date.now()}`, from: p.careTeam.doctor, t: nowMs(), text: 'Huyết áp tuần này khá ổn. Tiếp tục dùng thuốc đều nhé.', read: false }); persist(); A.tab('visit'); A.closePanel(); };
A.pMeter = v => {
  const c = D.settings.counter;
  if (v === 'start') { c.taps = 0; c.lastSec = 0; c.start = Date.now(); c.running = true; } else c.running = false;
  renderMeter();
};
A.pReset = () => { try { localStorage.removeItem(STORE_KEY); } catch (e) {} D = null; loadScenario('an'); render(); document.getElementById('view').scrollTop = 0; };
