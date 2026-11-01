'use strict';
// Màn Hôm nay, xác nhận thuốc, quên liều, nút 115, thẻ cấp cứu, thông báo màn khóa.

function ringSvg(plan) {
  const n = plan.length, gap = 3, len = 100 / n - gap;
  let out = '<svg class="r" viewBox="0 0 128 128" aria-hidden="true"><g fill="none" stroke-width="15">';
  plan.forEach((m, i) => {
    const off = -(i * (100 / n));
    const f = m.items.filter(x => x.filled).length / m.items.length;
    out += `<circle cx="64" cy="64" r="54" pathLength="100" stroke="var(--track)" stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${off}"/>`;
    if (f > 0) out += `<circle cx="64" cy="64" r="54" pathLength="100" stroke="var(--teal)" stroke-dasharray="${len * f} ${100 - len * f}" stroke-dashoffset="${off}"/>`;
  });
  return out + '</g></svg>';
}

function phraseOf(kind) { return { meds: 'dùng thuốc', bp: 'đo huyết áp', glu: 'đo đường huyết' }[kind]; }

function todaySummary(plan, cur, next) {
  if (!plan.length) return 'Hôm nay không có việc gì cần làm.';
  if (!cur) return `Việc đầu tiên hôm nay lúc ${next.time}.`;
  const pending = cur.items.filter(x => !x.done);
  if (pending.length === 1) return `${cur.label} nay: ${phraseOf(pending[0].kind)} là xong.`;
  if (pending.length === 2) return `${cur.label} nay: ${phraseOf(pending[0].kind)} và ${phraseOf(pending[1].kind)}.`;
  if (pending.length > 2) return `${cur.label} nay: ${pending.slice(0, -1).map(x => phraseOf(x.kind)).join(', ')} và ${phraseOf(pending[pending.length - 1].kind)}.`;
  if (next) return `Xong buổi ${cur.word}. Không cần làm gì đến ${next.time}.`;
  return 'Xong hết hôm nay. Hẹn bạn ngày mai.';
}

const medLine = m => `${esc(m.name)} ${esc(m.strength || '')}${m.dose ? `, ${esc(m.dose)}` : ''}`;
const lastOf = arr => arr.slice().sort((a, b) => b.t - a.t)[0];
function whenWord(t) {
  const d = daysBetween(t, nowMs());
  const part = new Date(t).getHours() < 11 ? 'sáng' : new Date(t).getHours() < 14 ? 'trưa' : new Date(t).getHours() < 18 ? 'chiều' : 'tối';
  if (d === 0) return `${part} nay`;
  if (d === 1) return `${part} qua`;
  return `${d} ngày trước`;
}

function taskCard(m, it) {
  if (it.kind === 'meds') {
    if (it.done) {
      const words = it.taken === it.total ? `Đã dùng ${it.total} thuốc lúc ${hhmm(it.lastT)}` : it.taken ? `Đã dùng ${it.taken} trong ${it.total} thuốc` : 'Đã ghi là chưa dùng';
      return `<div class="card"><div class="lbl">${ic('pill', 'teal')}Thuốc buổi ${m.word}</div><div class="st ${it.taken === it.total ? 'green' : 'muted'}" style="margin-top:.5rem;font-size:1.06rem">${icon('check')}${words}</div><button class="link left" data-a="medEditOpen" data-p="${m.key}">Sửa nếu bấm nhầm</button></div>`;
    }
    return `<div class="card"><div class="lbl">${ic('pill', 'teal')}Thuốc buổi ${m.word}</div>
      <div class="sub ink" style="margin:.5rem 0 .7rem">${it.meds.map(medLine).join('<br>')}</div>
      <button class="btn teal" data-a="medsTaken" data-p="${m.key}">${icon('check')}Đã dùng</button>
      <button class="link" data-a="medEditOpen" data-p="${m.key}">Chỉ dùng một số thuốc</button></div>`;
  }
  if (it.kind === 'bp') {
    if (it.done) return `<button class="card row-b" style="border:0" data-a="go" data-p="bpDetail">${ic('heart', 'blue')}<span class="m"><span class="n" style="display:block">Huyết áp buổi ${m.word}</span>${statusChip(bpStatus(it.reading.sys, it.reading.dia))}</span><span class="val">${it.reading.sys}/${it.reading.dia}</span>${chev()}</button>`;
    const last = lastOf(P().bp);
    return `<div class="card"><div class="lbl">${ic('heart', 'blue')}Huyết áp</div><div class="sub" style="margin:.4rem 0 .65rem">${last ? `Lần trước ${last.sys}/${last.dia}, ${whenWord(last.t)}` : 'Chưa có lần đo nào'}</div><button class="btn" data-a="startBP">Đo và ghi</button></div>`;
  }
  if (it.done) return `<button class="card row-b" style="border:0" data-a="go" data-p="gluDetail">${ic('drop', 'purple')}<span class="m"><span class="n" style="display:block">Đường huyết buổi ${m.word}</span></span><span class="val">${gluShow(it.reading.v)}</span>${chev()}</button>`;
  const lg = lastOf(P().glucose);
  return `<div class="card"><div class="lbl">${ic('drop', 'purple')}Đường huyết</div><div class="sub" style="margin:.4rem 0 .65rem">${lg ? `Lần trước ${gluShow(lg.v)}, ${whenWord(lg.t)}` : 'Chưa có lần đo nào'}</div><button class="btn" data-a="startGlu">Đo và ghi</button></div>`;
}

// Liều đã qua buổi mà chưa ghi. Chỉ hỏi về hôm nay và tối qua, và chỉ khi hôm qua có dùng app: bỏ app vài ngày thì không hỏi bù.
function overdueDoses(p, plan, cur) {
  const ms = nowMs(), out = [];
  plan.forEach(m => {
    if (!m.reached || (cur && m.key === cur.key)) return;
    const it = m.items.find(x => x.kind === 'meds');
    if (it && !it.done) out.push({ day: ms, key: m.key, word: `buổi ${m.word}`, meds: it.meds.filter(x => !p.doses[doseKey(ms, m.key, x.id)]) });
  });
  const y = ms - 864e5; const yk = dayKey(y);
  const hadActivity = Object.keys(p.doses).some(k => k.startsWith(yk));
  if (hadActivity) {
    dayPlan(p, y).forEach(m => {
      const it = m.items.find(x => x.kind === 'meds');
      if (it && !it.done) out.push({ day: y, key: m.key, word: `${m.word} qua`, meds: it.meds.filter(x => !p.doses[doseKey(y, m.key, x.id)]) });
    });
  }
  return out;
}

const WEEKLY = {
  activity: { q: 'Tuần này bạn vận động thế nào?', opts: [['good', 'Từ 2,5 giờ trở lên'], ['little', 'Không thường xuyên'], ['none', 'Không']], good: BRD.activeGood, bad: BRD.activeImprove, isGood: v => v === 'good' },
  diet: { q: 'Tuần này bạn có ăn mặn, nhiều đồ ngọt hoặc dầu mỡ không?', opts: [['yes', 'Ít, không đáng kể'], ['no', 'Khá nhiều']], good: 'Bạn đang ăn uống rất tốt. Hãy tiếp tục nhé!', bad: 'Thử giảm dần món mặn, ngọt và nhiều dầu mỡ. Mỗi thay đổi nhỏ đều có ích.', isGood: v => v === 'yes' },
  alcohol: { q: 'Tuần này bạn uống rượu bia thế nào?', opts: [['none', 'Không uống'], ['little', 'Ít'], ['mid', 'Vừa'], ['much', 'Nhiều']], good: BRD.alcoholGood, bad: BRD.alcoholImprove, isGood: v => v === 'none' || v === 'little' },
};
function weekIdx(ms) { return Math.floor((ms - new Date(2026, 0, 4).getTime()) / (7 * 864e5)); }
function weeklyQuestion(p) {
  if (!p.track.weeklyHabits) return null;
  const w = weekIdx(nowMs());
  if (p.habitLog.some(x => x.w === w)) return null;
  const kinds = ['activity', 'diet', 'alcohol'];
  return kinds[w % kinds.length];
}

V.today = () => {
  const p = P(), ms = nowMs();
  const plan = dayPlan(p, ms), cur = currentMoment(plan), next = nextMoment(plan, ms);
  const summary = todaySummary(plan, cur, next);
  S.ui.speakText = summary;
  const curPending = cur ? cur.items.filter(x => !x.done).length : 0;
  const allDone = plan.length && plan.every(m => m.items.every(x => x.done));
  let h = topBar();
  if (D.proxyName && D.owner !== D.active) h += `<div class="banner bg-blue">Đang chăm: ${esc(p.name)}. ${esc(p.name)} đã đồng ý chia sẻ.</div>`;
  h += '<h1 class="t">Hôm nay</h1>';
  h += `<div class="sub" style="margin-top:-.45rem">${wdName(ms)}, ${ddmm(ms)}</div>`;

  if (plan.length >= 2) {
    const center = curPending > 0 ? `<b>${curPending}</b><span>việc còn lại ${cur.word} nay</span>` : (cur || allDone) ? icon('check') : `<b>${plan.length}</b><span>buổi hôm nay</span>`;
    h += `<div class="card ring-wrap"><div class="ring" role="img" aria-label="${esc(summary)}">${ringSvg(plan)}<div class="c">${center}</div></div><div style="min-width:0"><div class="big">${esc(summary)}</div><div class="legend">${plan.map(m => (cur && m.key === cur.key) ? `<b>${m.label}</b>` : m.label).join(' · ')}</div><button class="speak" data-a="speak">${icon('sound')}Đọc to</button></div></div>`;
  } else {
    h += `<div class="card"><div class="big">${esc(summary)}</div><button class="speak" data-a="speak">${icon('sound')}Đọc to</button></div>`;
  }

  if (p.recheckAt) {
    const ready = ms >= p.recheckAt;
    h += `<div class="card"><div class="lbl">${ic('heart', 'amber')}Đo lại huyết áp</div><div class="sub" style="margin:.4rem 0 .65rem">${ready ? 'Bạn đã nghỉ đủ, hãy đo lại nhé.' : `Sau khi nghỉ 5 phút, khoảng ${hhmm(p.recheckAt)}.`}</div><button class="btn" data-a="startBP">Đo lại</button></div>`;
  }

  // Liều chưa ghi của buổi đã qua: hỏi nhẹ, không báo đỏ
  overdueDoses(p, plan, cur).forEach(o => {
    h += `<button class="card row-b" style="border:0" data-a="openMissed" data-p="${o.day}|${o.key}">${ic('pill', 'muted')}<span class="m"><span class="n" style="display:block">Thuốc ${esc(o.word)} chưa ghi nhận</span><span class="d" style="display:block">${o.meds.map(m => esc(m.name)).join(', ')}</span></span>${chev()}</button>`;
  });

  if (cur) cur.items.slice().sort((a, b) => a.done - b.done).forEach(it => { h += taskCard(cur, it); });

  const later = plan.filter(m => !m.reached);
  if (later.length) {
    h += `<div class="sec">Tiếp theo</div><div class="rows">`;
    later.forEach(m => m.items.forEach(it => {
      const nm = it.kind === 'meds' ? `Thuốc buổi ${m.word}, ${it.total} thuốc` : it.kind === 'bp' ? 'Đo huyết áp' : 'Đo đường huyết';
      h += row({ icon: it.kind === 'meds' ? 'pill' : it.kind === 'bp' ? 'heart' : 'drop', tone: it.kind === 'meds' ? 'teal' : it.kind === 'bp' ? 'blue' : 'purple', n: nm, d: m.time });
    }));
    h += '</div>';
  }

  // Tái khám và thuốc: chỉ hiện khi sắp đến
  const ap = nextAppt(p);
  if (ap) {
    const dd = daysBetween(ms, ap.t);
    if (dd < 0 || ap.t < ms) h += `<div class="rows">${row({ icon: 'cal', tone: 'orange', n: 'Bạn đã đi khám chưa?', d: `Lịch ${ddmm(ap.t)}`, a: 'tab', p: 'visit' })}</div>`;
    else if (dd <= 3) h += `<div class="rows">${row({ icon: 'cal', tone: 'orange', n: dd === 0 ? 'Tái khám hôm nay' : `Tái khám sau ${dd} ngày`, d: `${wdName(ap.t)} ${ddmm(ap.t)}, ${hhmm(ap.t)}`, a: 'tab', p: 'visit' })}</div>`;
  }
  medsEnding(p).slice(0, 1).forEach(m => {
    const left = daysBetween(ms, new Date(m.end + 'T00:00:00').getTime());
    h += `<div class="rows">${row({ icon: 'pill', tone: 'orange', n: 'Sắp hết thuốc', d: `${esc(m.name)} còn ${left} ngày`, a: 'tab', p: 'visit' })}</div>`;
  });

  const wq = weeklyQuestion(p);
  const reply = S.ui.weekReply;
  if (reply) h += `<div class="card"><div class="st ${reply.good ? 'green' : 'amber'}" style="font-size:1.06rem">${icon(reply.good ? 'check' : 'up')}${reply.good ? 'Tốt' : 'Cần cải thiện'}</div><div class="sub ink" style="margin-top:.35rem">${esc(reply.text)}</div></div>`;
  else if (wq) {
    const w = WEEKLY[wq];
    h += `<div class="sec">Câu hỏi của tuần</div><div class="card"><div class="mid">${w.q}</div><div class="chips" style="margin-top:.65rem">${w.opts.map(o => `<button class="chip" data-a="weeklyAns" data-p="${wq}|${o[0]}">${o[1]}</button>`).join('')}</div></div>`;
  }

  // Câu hồ sơ chỉ hiện khi không còn việc của buổi này
  const remain = riskRemaining(p);
  if (remain.length && !curPending && !D.dismissed[`risk${dayKey(ms)}`]) {
    h += `<div class="card"><div class="lbl">${ic('walk', 'green')}Yếu tố của bạn</div><div class="sub ink" style="margin:.4rem 0 .6rem">Còn ${remain.length} câu. Bạn có muốn nhập tiếp thông tin?</div><div class="yn"><button class="btn small" data-a="startRisk">Trả lời</button><button class="btn sec small" data-a="dismissRisk">Để sau</button></div></div>`;
  }

  // Lời nhắc đánh giá theo BRD: sau 7 ngày hoặc sau 10 lần đo
  if (!curPending && (D.prompt7 || D.bpSaved >= 10) && !D.dismissed.feedback) {
    const txt = D.bpSaved >= 10 ? 'Bạn đang theo dõi huyết áp rất đều đặn! Bạn có nhận xét gì về tính năng này không? Gửi phản hồi cho chúng tôi nhé!' : 'Chào bạn! Bạn đã sử dụng VNPreventStroke được một tuần rồi. Chúng tôi rất mong nhận được phản hồi của bạn để giúp ứng dụng ngày càng tốt hơn. Bạn có muốn dành chút thời gian đánh giá ứng dụng không?';
    h += `<div class="card"><div class="sub ink">${txt}</div><div class="yn" style="margin-top:.6rem"><button class="btn small" data-a="go" data-p="feedback">Có, đánh giá ngay</button><button class="btn sec small" data-a="dismissFeedback">Để sau</button></div></div>`;
  }

  if (p.stroke && !p.meds.length) {
    h += `<div class="card"><div class="lbl">${ic('pill', 'teal')}Thêm thuốc để app nhắc đúng giờ</div><div class="sub" style="margin:.4rem 0 .6rem">Chọn từ danh sách, không cần gõ. Người nhà hoặc bệnh viện nhập giúp cũng được.</div><button class="btn small" data-a="medNewFromToday">Thêm thuốc</button></div>`;
  }
  if (!plan.length && !p.stroke) {
    h += `<div class="rows">${row({ icon: 'alert', tone: 'red', n: 'Nhận biết dấu hiệu đột quỵ', d: 'Để giúp được mình và người thân', a: 'go', p: 'signs' })}${row({ icon: 'group', tone: 'blue', n: 'Theo dõi giúp người thân', d: 'Thêm hồ sơ cho bố mẹ', a: 'go', p: 'caregivers' })}${row({ icon: 'heart', tone: 'blue', n: 'Muốn theo dõi huyết áp?', d: 'Bật nhắc đo khi bạn cần', a: 'go', p: 'schedule' })}</div>`;
  }
  return { chrome: 'tab', html: h };
};

A.medNewFromToday = () => A.medNew();

function medsEnding(p) {
  const ms = nowMs();
  return medsActive(p, ms).filter(m => m.end && daysBetween(ms, new Date(m.end + 'T00:00:00').getTime()) <= 7).sort((a, b) => (a.end > b.end ? 1 : -1));
}

// Xác nhận dùng thuốc
function setDose(p, day, mk, medId, state, t) {
  const k = doseKey(day, mk, medId);
  if (state === 'clear') delete p.doses[k];
  else p.doses[k] = { s: state, t: t || nowMs(), by: whoEntered() };
}
A.medsTaken = mk => {
  const p = P(), ms = nowMs();
  const meds = medsActive(p, ms).filter(x => x.moments.includes(mk));
  meds.forEach(x => setDose(p, ms, mk, x.id, 'taken'));
  persist();
  S.navFocus = false; render();
  toast(meds.some(m => m.group === 'anticoag') ? 'Đã ghi. Thẻ cấp cứu đã có giờ liều mới.' : 'Đã ghi. Bạn đã dùng đủ thuốc buổi này.');
};
A.medEditOpen = mk => openSheet('medEdit', { mk });
V.medEdit = ({ mk }) => {
  const p = P(), ms = nowMs(), mo = momentOf(mk);
  const meds = medsActive(p, ms).filter(x => x.moments.includes(mk));
  return { title: 'Sửa thuốc', html: `<button class="navbtn" data-a="closeSheet">Xong</button><div class="q">Thuốc buổi ${mo.word}</div>
    ${meds.map(m => { const l = p.doses[doseKey(ms, mk, m.id)]; const st = l ? l.s : 'none'; return `<div class="card"><div class="n">${medLine(m)}</div><div class="yn" style="margin-top:.5rem"><button class="chip ${st === 'taken' ? 'on' : ''}" aria-pressed="${st === 'taken'}" data-a="medSet" data-p="${mk}|${m.id}|${st === 'taken' ? 'clear' : 'taken'}">Đã dùng</button><button class="chip ${st === 'missed' ? 'on' : ''}" aria-pressed="${st === 'missed'}" data-a="medSet" data-p="${mk}|${m.id}|${st === 'missed' ? 'clear' : 'missed'}">Chưa dùng</button></div></div>`; }).join('')}
    <p class="note">Bấm lại để bỏ chọn. Quên liều thì đừng tự dùng bù, hãy hỏi bác sĩ hoặc dược sĩ.</p>` };
};
A.medSet = q => {
  const [mk, id, st] = q.split('|');
  setDose(P(), nowMs(), mk, id, st); persist(); render();
};

// Liều chưa ghi của buổi đã qua
A.openMissed = q => { const [d, key] = q.split('|'); go('medMissed', { day: Number(d), key }); };
V.medMissed = (o) => {
  const p = P(), ms = o.day, mo = momentOf(o.key);
  const meds = medsActive(p, ms).filter(x => x.moments.includes(o.key));
  const pend = o.ans ? (o.meds || meds) : meds.filter(x => !p.doses[doseKey(ms, o.key, x.id)]);
  const isY = dayKey(ms) !== dayKey(nowMs());
  const anti = pend.some(m => m.group === 'anticoag');
  let h = topBar({ close: true });
  h += `<div class="lbl">${ic('pill', 'teal')}Thuốc ${isY ? `${mo.word} qua` : `buổi ${mo.word}`}</div>`;
  h += `<h1 class="q">${pend.map(m => esc(m.name)).join(', ')} ${mo.time} chưa được ghi nhận</h1>`;
  h += `<div class="yn"><button class="chip tall ${o.ans === 'yes' ? 'on' : ''}" data-a="missedAns" data-p="yes">Đã dùng rồi</button><button class="chip tall ${o.ans === 'no' ? 'on' : ''}" data-a="missedAns" data-p="no">Chưa dùng</button></div>`;
  if (o.ans === 'yes') {
    h += `<div class="card"><div class="mid">Bạn đã dùng lúc nào?</div><div class="chips" style="margin-top:.6rem"><button class="chip" data-a="missedTime" data-p="0">Khoảng ${mo.time}</button><button class="chip" data-a="missedTime" data-p="60">Muộn khoảng 1 giờ</button><button class="chip" data-a="missedTime" data-p="180">Muộn hơn nữa</button></div></div>`;
  }
  if (o.ans === 'no') {
    h += `<div class="card"><div class="big">Đừng tự dùng bù hay gấp đôi liều.</div><div class="sub ink" style="margin-top:.4rem">${anti ? `${pend.length > 1 ? `${pend.filter(m => m.group === 'anticoag').map(m => esc(m.name)).join(', ')} là thuốc chống đông.` : 'Đây là thuốc chống đông.'} Hãy hỏi bác sĩ hoặc dược sĩ bạn nên làm gì.` : 'Hãy hỏi bác sĩ hoặc dược sĩ bạn nên làm gì.'}</div>
      <button class="btn" style="margin-top:.75rem" data-a="call" data-p="${esc(p.careTeam.phone)}|bác sĩ">${icon('phone')}Gọi bác sĩ</button><button class="btn sec small" style="margin-top:.5rem" data-a="call" data-p="${esc(p.careTeam.pharmacy)}|dược sĩ">Gọi dược sĩ</button></div>
      <div class="sub">Lần này được ghi là "đã bỏ lỡ". ${p.consents.doctor ? 'Bác sĩ sẽ thấy vì bạn đã đồng ý chia sẻ.' : 'Chỉ mình bạn thấy.'}</div><button class="btn sec small" data-a="back">Xong</button>`;
  }
  return { chrome: 'modal', html: h };
};
function topOf() { return S.stack[S.stack.length - 1]; }
A.missedAns = a => {
  const o = topOf().p, p = P();
  const meds = medsActive(p, o.day).filter(x => x.moments.includes(o.key));
  if (!o.meds) o.meds = meds.filter(x => !p.doses[doseKey(o.day, o.key, x.id)]);
  o.ans = a;
  if (a === 'no') { o.meds.forEach(m => setDose(p, o.day, o.key, m.id, 'missed', atTime(o.day, momentOf(o.key).time))); persist(); }
  render();
};
A.missedTime = mins => {
  const o = topOf().p, p = P();
  const t = atTime(o.day, momentOf(o.key).time, Number(mins));
  o.meds.forEach(m => setDose(p, o.day, o.key, m.id, 'taken', t)); persist();
  A.back(); toast('Đã ghi lại');
};
A.weeklyAns = q => {
  const [kind, v] = q.split('|'), p = P(), w = WEEKLY[kind];
  p.habits[kind] = v;
  p.habitLog.push({ w: weekIdx(nowMs()), kind, v, t: nowMs(), by: whoEntered() });
  S.ui.weekReply = { good: w.isGood(v), text: w.isGood(v) ? w.good : w.bad };
  persist(); render();
};
A.dismissRisk = () => { D.dismissed[`risk${dayKey(nowMs())}`] = true; persist(); render(); };
A.dismissFeedback = () => { D.dismissed.feedback = true; persist(); render(); };

// Nút 115
V.sos = () => {
  const p = P();
  return { title: 'Gọi cấp cứu 115', html: `<button class="navbtn" data-a="closeSheet">Đóng</button>
    <button class="btn red huge" data-a="call" data-p="115">${icon('phone')}Gọi 115</button>
    <div class="mid">Dấu hiệu đột quỵ, chỉ cần một dấu hiệu</div>
    <div style="display:flex;flex-direction:column;gap:.45rem">${SIGNS.map(s => `<div class="ct">${icon('alert', 'redt')}<span>${s}</span></div>`).join('')}</div>
    <div class="rows" style="margin-top:.25rem">
      ${p ? row({ icon: 'card', tone: 'red', n: 'Thẻ cấp cứu', d: 'Đưa đội cấp cứu xem', a: 'sosCard' }) : ''}
      ${row({ icon: 'pin', tone: 'blue', n: 'Bệnh viện đột quỵ gần nhất', d: `${esc(CENTERS[0].name)}, ${dec(CENTERS[0].km)} km`, a: 'sosCenter' })}
    </div>` };
};
const SIGNS = ['Yếu hoặc tê một bên cơ thể', 'Khó nói hoặc nói ngọng, méo miệng', 'Mất hoặc giảm thị lực đột ngột', 'Mất thăng bằng, chóng mặt nặng', 'Đau đầu dữ dội, khác thường'];
A.sosCard = () => { S.sheet = null; go('card'); };
A.sosCenter = () => { S.sheet = null; go('center', { id: 'a' }); };

// Thẻ cấp cứu: tự lấy từ danh sách thuốc
V.card = () => {
  const p = P(), ms = nowMs();
  const meds = medsActive(p, ms);
  const anti = meds.filter(m => m.group === 'anticoag');
  const plate = meds.filter(m => m.group === 'antiplatelet');
  const other = meds.filter(m => m.group !== 'anticoag' && m.group !== 'antiplatelet');
  const lastDose = list => {
    const ts = [];
    list.forEach(m => Object.keys(p.doses).forEach(k => { if (k.endsWith(`|${m.id}`) && p.doses[k].s === 'taken') ts.push(p.doses[k].t); }));
    return ts.sort((a, b) => b - a)[0];
  };
  const hist = [];
  if (p.history.htn) hist.push('Tăng huyết áp');
  if (p.history.dm) hist.push('Đái tháo đường');
  if (p.history.af || (p.facts.af && p.facts.af.v === 'yes')) hist.push('Rung nhĩ');
  const strokeTxt = p.stroke ? ({ ischemic: 'Nhồi máu não', hemorrhage: 'Chảy máu não', tia: 'Cơn thoáng qua (TIA)' }[p.strokeType] || 'Có, chưa rõ loại') + (p.strokeDate ? `, ${p.strokeDate}` : '') : 'Chưa từng';
  const blk = (title, list) => {
    const t = lastDose(list);
    return `<div class="emerg"><div class="k">${title}</div><div class="v">${list.map(m => `${esc(m.name)} ${esc(m.strength)}, ${m.moments.length} lần/ngày`).join('<br>')}</div><div class="w">${t ? `Liều gần nhất đã ghi: ${daysBetween(t, ms) === 0 ? 'hôm nay' : daysBetween(t, ms) === 1 ? 'hôm qua' : ddmm(t)} ${hhmm(t)}` : 'Chưa có ghi nhận liều gần nhất'}</div></div>`;
  };
  let h = topBar({ close: true }) + '<h1 class="t small">Thẻ cấp cứu</h1>';
  h += `<div style="font-size:1.35rem;font-weight:700">${esc(p.name)}${p.birthYear ? `, sinh năm ${p.birthYear}` : ''}</div>`;
  if (anti.length) h += blk('ĐANG DÙNG THUỐC CHỐNG ĐÔNG', anti);
  if (plate.length) h += blk('ĐANG DÙNG THUỐC KHÁNG NGƯNG TẬP TIỂU CẦU', plate);
  h += `<div class="card"><div class="sumrow"><span>Đột quỵ</span><b>${esc(strokeTxt)}</b></div><div class="sumrow"><span>Bệnh nền</span><b>${hist.length ? hist.join(', ') : 'Chưa ghi'}</b></div><div class="sumrow"><span>Thuốc khác</span><b>${other.length ? other.map(m => esc(m.name)).join(', ') : 'Không'}</b></div></div>`;
  if (p.contact) h += `<div class="card"><div class="sub">Người nhà</div><div class="mid">${esc(p.contact.name)} (${esc(p.contact.rel)})</div><button class="btn small" style="margin-top:.5rem" data-a="call" data-p="${esc(p.contact.tel)}|${esc(p.contact.name)}">${icon('phone')}Gọi ${esc(p.contact.tel)}</button></div>`;
  else h += `<button class="btn sec small" data-a="go" data-p="profile">Thêm người nhà để gọi khi cần</button>`;
  h += '<p class="note">Tự cập nhật từ danh sách thuốc, không phải nhập thêm. Trên điện thoại thật, bạn có thể chép các dòng này vào mục thông tin y tế của máy để xem được khi máy đang khóa.</p>';
  return { chrome: 'modal', white: true, html: h };
};

// Thông báo trên màn khóa (mô phỏng)
V.lock = o => {
  const ms = nowMs();
  const head = `<div class="clock">${hhmm(ms)}</div><div class="lockdate">${wdName(ms)}, ${new Date(ms).getDate()} tháng ${new Date(ms).getMonth() + 1}</div>`;
  const open = '<button class="link" style="color:#fff;margin-top:auto" data-a="lockOpen">Mở app</button>';
  if (o.kind === 'meds') {
    const p = P(); const meds = medsActive(p, ms).filter(x => x.moments.includes(o.mk));
    const mo = momentOf(o.mk);
    return `${head}<div class="notif"><div class="lbl">${ic('pill', 'teal')}Đến giờ thuốc buổi ${mo.word}</div><div style="font-size:1.2rem;line-height:1.35">${meds.map(m => `<b>${esc(m.name)}</b> ${esc(m.strength)}, ${esc(m.dose)}`).join('<br>')}</div><button class="btn teal" data-a="lockTaken" data-p="${o.mk}">${icon('check')}Đã dùng</button><button class="btn sec small" data-a="lockLater">Nhắc lại sau ${D.settings.notif.repeat} phút</button></div>${open}`;
  }
  if (o.kind === 'repeat') {
    return `${head}<div class="notif"><div class="lbl">${ic('pill', 'teal')}Nhắc lại: thuốc buổi ${momentOf(o.mk).word}</div><div style="font-size:1.1rem">Bạn đã dùng chưa? Nếu đã dùng, bấm để ghi lại.</div><button class="btn teal" data-a="lockTaken" data-p="${o.mk}">${icon('check')}Đã dùng</button><button class="btn sec small" data-a="lockClose">Để sau</button></div>${open}`;
  }
  if (o.kind === 'measure') {
    return `${head}<div class="notif"><div class="lbl">${ic('heart', 'blue')}Đến giờ đo huyết áp</div><div style="font-size:1.1rem">Ngồi nghỉ 5 phút rồi đo. Chạm để ghi số.</div><button class="btn" data-a="lockBP">Đo và ghi</button><button class="btn sec small" data-a="lockClose">Để sau</button></div>${open}`;
  }
  const ap = nextAppt(P());
  return `${head}<div class="notif"><div class="lbl">${ic('cal', 'orange')}Tái khám sau ${o.days} ngày</div><div style="font-size:1.1rem;line-height:1.35"><b>${ap ? `${wdName(ap.t)} ${ddmm(ap.t)}, ${hhmm(ap.t)}` : ''}</b><br>${ap ? esc(ap.place) : ''}<br>${ap ? esc(ap.prep) : ''}</div><button class="btn" data-a="lockVisit">Xem lịch</button><button class="btn sec small" data-a="lockClose">Đóng</button></div>${open}`;
};
A.lockTaken = mk => { S.lock = null; A.medsTaken(mk); };
A.lockLater = () => { const mk = S.lock.mk; S.lock = { kind: 'repeat', mk }; render(); toast(`Sẽ nhắc lại sau ${D.settings.notif.repeat} phút`); };
A.lockClose = () => { S.lock = null; render(); };
A.lockOpen = () => { S.lock = null; render(); };
A.lockBP = () => { S.lock = null; A.startBP(); };
A.lockVisit = () => { S.lock = null; A.tab('visit'); };
