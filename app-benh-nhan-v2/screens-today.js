'use strict';
// Tab Hôm nay: việc của buổi hiện tại, sắp tới, quên liều, tái khám, nút 115, thẻ cấp cứu, thông báo màn khóa.

const KIND = { meds: { icon: 'pill' }, bp: { icon: 'heart', name: 'Huyết áp', start: 'startBP', detail: 'bpDetail' }, glu: { icon: 'drop', name: 'Đường huyết', start: 'startGlu', detail: 'gluDetail' } };
const isProxy = () => D.proxyName && D.owner !== D.active;

// Danh sách thuốc của một buổi. Buổi chưa tới thì chỉ xem, không đánh dấu trước được.
function doseRows(mk, day, readOnly) {
  const p = P();
  return medsActive(p, day).filter(m => m.moments.includes(mk)).map(m => {
    const l = p.doses[doseKey(day, mk, m.id)], dose = l && l.s === 'missed' ? 'Bỏ lỡ' : esc(m.dose);
    return readOnly ? row({ title: esc(medName(m)), value: dose }) : checkRow(esc(medName(m)), dose, l && l.s === 'taken', 'dose', { mk, id: m.id });
  }).join('');
}
// Việc chưa làm là một thẻ có nút; việc đã xong thu lại thành một dòng
function taskCard(m, it) {
  if (it.kind === 'meds') return `<section class="card"><div class="card-head">Thuốc buổi ${m.word}<span class="aside">${m.time}</span></div><div class="list">${doseRows(m.key, now())}</div>${btn(`${icon('check')}Đã dùng`, 'dosesAll', { mk: m.key })}</section>`;
  const k = KIND[it.kind];
  return `<section class="card"><div class="card-head">${k.name}</div>${btn('Ghi số đo', k.start)}</section>`;
}
function doneRow(m, it) {
  if (it.kind === 'meds') return row({ icon: 'pill', title: `Thuốc buổi ${m.word}`, value: it.lastT ? hhmm(it.lastT) : '', status: 'good', a: 'openMoment', p: { mk: m.key } });
  const k = KIND[it.kind], r = it.reading;
  return row({ icon: k.icon, title: `${k.name} buổi ${m.word}`, value: it.kind === 'bp' ? `${r.sys}/${r.dia}` : gluNum(r.v), status: it.kind === 'bp' ? bpStatus(r.sys, r.dia) : gluStatus(r.v, r.fasting), a: 'go', p: { v: k.detail } });
}

// Hôm nay là một khối ở giữa Trang chủ, chỉ có việc của hôm nay. Thứ tự nói lên việc cần làm: việc còn lại, việc đã xong, rồi việc sắp tới.
function todayBlock() {
  const p = P(), ms = now(), pl = plan(), cur = currentMoment(pl);
  const todo = cur ? cur.items.filter(x => !x.done) : [], done = cur ? cur.items.filter(x => x.done) : [];
  let h = '';

  if (p.recheckAt) h += `<section class="card"><div class="card-head">Đo lại huyết áp<span class="aside">${hhmm(p.recheckAt)}</span></div>${btn('Đo lại', 'startBP')}</section>`;
  h += group(overdueDoses(p, ms, times()).map(o => row({ icon: 'pill', title: o.yesterday ? `Thuốc ${mo(o.key).word} qua` : `Thuốc buổi ${mo(o.key).word}`, value: 'Chưa ghi', tone2: 'amber', a: 'go', p: { v: 'missed', day: o.day, mk: o.key } })));
  const ap = nextAppt(p);
  if (ap && ap.t < ms) h += `<section class="card"><p class="lead">Bạn đã đi khám ngày ${ddmm(ap.t)} chưa?</p><div class="two">${btn('Đã khám', 'apptDone')}${btn('Chưa', 'go', { v: 'apptChange' }, 'soft')}</div></section>`;
  todo.forEach(it => { h += taskCard(cur, it); });
  h += group(done.map(it => doneRow(cur, it)));

  const msg = p.messages.find(m => !m.read);
  if (msg) h += `<button class="card" ${on('go', { v: 'messages' })}><span class="card-head">${esc(msg.from)}<span class="aside">${ddmm(msg.t)}</span></span><span class="body">${esc(msg.text)}</span></button>`;

  const soon = [];
  pl.filter(m => !m.reached).forEach(m => m.items.forEach(it => soon.push(row({ icon: KIND[it.kind].icon, title: it.kind === 'meds' ? `Thuốc buổi ${m.word}` : `Đo ${KIND[it.kind].name.toLowerCase()}`, value: m.time }))));
  if (ap && ap.t >= ms) soon.push(row({ icon: 'cal', title: 'Tái khám', value: `${WD_S[new Date(ap.t).getDay()]} ${ddmm(ap.t)}`, a: 'go', p: { v: 'visit' } }));
  medsEnding(p, ms, 5).forEach(m => soon.push(row({ icon: 'pill', title: esc(m.name), value: `Còn ${daysLeft(m, ms)} ngày`, tone2: 'amber', a: 'go', p: { v: 'medDetail', id: m.id } })));
  h += group(soon, soon.length ? { title: 'Sắp tới' } : null);

  // Câu hỏi và lời mời chỉ hiện khi việc của buổi đã xong
  if (!todo.length) {
    const wk = weeklyKind(p, ms), reply = S.draft.weekReply;
    if (reply) h += `<section class="card"><div class="card-head">${statusIcon(reply.good ? 'good' : 'improve')}${reply.good ? 'Tốt' : 'Cần cải thiện'}</div><p class="body">${esc(reply.text)}</p></section>`;
    else if (wk) h += `<section class="card"><p class="lead">${WEEKLY[wk].q}</p>${chips(WEEKLY[wk].opts, null, 'weekly', { k: wk })}</section>`;
  }
  if (p.stroke && !p.meds.length) h += `<section class="card"><div class="card-head">Thuốc</div>${btn('Thêm thuốc', 'medNew')}</section>`;
  if (!pl.length && !p.stroke) h += `<section class="card empty"><p class="lead">Hôm nay không có việc cần làm</p></section>` + group([row({ icon: 'alert', tone: 'red', title: 'Dấu hiệu đột quỵ', a: 'go', p: { v: 'befast' } }), row({ icon: 'heart', title: 'Nhắc đo huyết áp', a: 'go', p: { v: 'reminders' } })]);
  return h;
}

// ---- Ghi liều ----
function setDose(day, mk, id, state, t) {
  const p = P(), k = doseKey(day, mk, id);
  if (state === 'clear') delete p.doses[k]; else p.doses[k] = { s: state, t: t || now(), by: byWho() };
}
A.dose = ({ mk, id }) => { const l = P().doses[doseKey(now(), mk, id)]; setDose(now(), mk, id, l && l.s === 'taken' ? 'clear' : 'taken'); };
A.dosesAll = ({ mk }) => {
  const meds = medsActive(P(), now()).filter(m => m.moments.includes(mk));
  meds.forEach(m => { const l = P().doses[doseKey(now(), mk, m.id)]; if (!l || l.s !== 'taken') setDose(now(), mk, m.id, 'taken'); });
  toast(FEATURES.sos && meds.some(m => m.group === 'anticoag') ? 'Đã ghi. Thẻ cấp cứu có giờ liều mới.' : 'Đã ghi');
};
V.moment = ({ mk }) => {
  const m = mo(mk), ms = now(), reached = atTime(ms, m.time) <= ms;
  const left = medsActive(P(), ms).some(x => x.moments.includes(mk) && !P().doses[doseKey(ms, mk, x.id)]);
  return { title: `Thuốc buổi ${m.word}`, html: `${sheetHead(`${m.label} · ${m.time}`)}<div class="list">${doseRows(mk, ms, !reached)}</div>${reached && left ? btn(`${icon('check')}Đã dùng`, 'dosesAll', { mk }) : ''}` };
};
A.weekly = ({ k, v }) => {
  const p = P(), H = HABITS[k];
  p.habits[k] = v;
  p.habitLog.push({ w: weekIdx(now()), kind: k, v, t: now(), by: byWho() });
  S.draft.weekReply = { good: H.good(v), text: H.good(v) ? H.okText : H.badText };
};
A.dismiss = ({ k }) => { D.dismissed[k] = true; };

// ---- Liều chưa ghi của buổi đã qua. Bước 1 chỉ ghi nhận: không gợi ý dùng bù, không hướng dẫn, không nút gọi. ----
V.missed = o => {
  const p = P(), day = Number(o.day), m = mo(o.mk), yesterday = dayKey(day) !== dayKey(now());
  const meds = o.ids ? o.ids.split(',').map(id => p.meds.find(x => x.id === id)) : medsActive(p, day).filter(x => x.moments.includes(o.mk) && !p.doses[doseKey(day, o.mk, x.id)]);
  let h = topBar({ close: true }) + h1(yesterday ? `${m.label} qua bạn đã dùng thuốc chưa?` : `Buổi ${m.word} bạn đã dùng thuốc chưa?`, 'q');
  h += group(meds.map(x => row({ icon: 'pill', title: esc(medName(x)), value: m.time })));
  h += chips([['yes', 'Đã dùng'], ['no', 'Chưa dùng']], o.ans, 'missedAns', {}, 'grid');
  if (o.ans === 'yes') h += `<section class="card"><p class="lead">Dùng lúc nào?</p>${chips([['0', `Khoảng ${m.time}`], ['60', 'Muộn khoảng 1 giờ'], ['180', 'Muộn hơn nữa']], null, 'missedTime')}</section>`;
  return { chrome: 'modal', html: h };
};
A.missedAns = ({ v }) => {
  const o = current().p, p = P(), day = Number(o.day);
  if (!o.ids) o.ids = medsActive(p, day).filter(x => x.moments.includes(o.mk) && !p.doses[doseKey(day, o.mk, x.id)]).map(x => x.id).join(',');
  o.ans = v;
  if (v === 'no') { o.ids.split(',').forEach(id => setDose(day, o.mk, id, 'missed', atTime(day, times()[o.mk]))); back(); toast('Đã ghi'); }
};
A.missedTime = ({ v }) => {
  const o = current().p, day = Number(o.day), t = atTime(day, times()[o.mk], Number(v));
  o.ids.split(',').forEach(id => setDose(day, o.mk, id, 'taken', t));
  back(); toast('Đã ghi lại');
};

// ---- Tái khám theo BRD: 1 tháng sau xuất viện, 3 tháng nếu tốt, 1 tháng nếu chưa tốt ----
V.visit = () => {
  const p = P(), ap = nextAppt(p);
  let h = topBar({ back: 'Quay lại' }) + h1('Tái khám');
  if (ap) {
    const state = ap.state === 'change' ? `<div class="banner">Đã gửi yêu cầu đổi lịch</div>` : ap.state === 'confirmed' ? `<div class="card-head">${statusIcon('good')}Bạn sẽ đến</div>${btn('Đổi lịch', 'go', { v: 'apptChange' }, 'soft')}` : `<div class="two">${btn('Tôi sẽ đến', 'apptConfirm')}${btn('Đổi lịch', 'go', { v: 'apptChange' }, 'soft')}</div>`;
    h += `<section class="card"><p class="hero sm">${WD[new Date(ap.t).getDay()]} ${ddmm(ap.t)}<br>${hhmm(ap.t)}</p><p class="body">${esc(ap.place)}</p><p class="body">${esc(ap.prep)}</p>${state}</section>`;
  } else h += `<section class="card"><p class="lead">Chưa có lịch</p></section>`;
  h += group([row({ icon: 'doc', title: 'Tóm tắt cho bác sĩ', a: 'go', p: { v: 'summary' } }), ap ? row({ icon: 'cal', title: 'Thêm vào lịch điện thoại', a: 'demo', p: { msg: 'Trên điện thoại thật, lịch hẹn được thêm vào lịch của máy' } }) : '']);
  const past = p.appts.filter(a => a.state === 'done' || a.state === 'attended').sort((a, b) => b.t - a.t);
  h += group(past.map(a => row({ title: ddmmyy(a.t), value: esc(a.result || 'Chờ kết quả') })), past.length ? { title: 'Đã khám' } : null);
  return { chrome: 'push', html: h };
};
A.apptConfirm = () => { nextAppt(P()).state = 'confirmed'; toast('App sẽ nhắc trước 1 ngày'); };
A.apptDone = () => { nextAppt(P()).state = 'attended'; toast('Bác sĩ sẽ cập nhật kết quả'); };
V.apptChange = () => {
  const w = S.draft.when;
  return { chrome: 'modal', html: `${topBar({ close: true })}${h1('Đổi lịch khám', 'sm')}${chips([['week', 'Trong tuần này'], ['next', 'Tuần sau'], ['call', 'Bệnh viện gọi lại để hẹn']], w, 'pickWhen')}${btn('Gửi yêu cầu', 'apptSend', {}, '', w ? '' : 'disabled')}` };
};
A.pickWhen = ({ v }) => { S.draft.when = v; };
A.apptSend = () => { const a = nextAppt(P()); if (a) { a.state = 'change'; a.t = Math.max(a.t, now() + DAY); } S.draft.when = null; back(); toast('Đã gửi yêu cầu đổi lịch'); };

// ---- Nút 115 ----
V.sos = () => ({ title: 'Gọi cấp cứu 115', html: `<div class="sheet-head"><span></span><button class="nav" ${on('closeSheet')}>Đóng</button></div>
  ${btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red huge')}
  ${group([P() && FEATURES.sos ? row({ icon: 'card', tone: 'red', title: 'Thẻ cấp cứu', a: 'sosTo', p: { v: 'card' } }) : '', row({ icon: 'pin', title: 'Bệnh viện gần nhất', value: `${dec(CENTERS[0].km)} km`, a: 'sosTo', p: { v: 'center', id: 'a' } })])}
  <div class="list">${BEFAST.filter(s => s.k !== 'T').map(s => `<div class="sign"><span class="letter">${s.k}</span><div><b>${s.name}</b><p>${s.text}</p></div></div>`).join('')}<div class="sign"><span class="letter">!</span><div><b>Đau đầu</b><p>${HEADACHE}.</p></div></div></div>
  ${P() ? group(row({ icon: 'pencil', title: 'Ghi triệu chứng', a: 'sosTo', p: { v: 'symptoms' } })) : ''}` });
A.sosTo = ({ v, ...p }) => { S.sheet = null; go(v, p); };

// ---- Thẻ cấp cứu: tự lấy từ danh sách thuốc ----
V.card = () => {
  const p = P(), ms = now(), meds = medsActive(p, ms);
  const lastDose = list => Object.keys(p.doses).filter(k => list.some(m => k.endsWith(`|${m.id}`)) && p.doses[k].s === 'taken').map(k => p.doses[k].t).sort((a, b) => b - a)[0];
  const block = (label, list) => {
    if (!list.length) return '';
    const t = lastDose(list), d = t ? daysBetween(t, ms) : null;
    return `<div class="emerg"><b>${label}</b><strong>${list.map(m => `${esc(medName(m))}, ${m.moments.length} lần/ngày`).join('<br>')}</strong><span class="body">${t ? `Liều gần nhất: ${d === 0 ? 'hôm nay' : d === 1 ? 'hôm qua' : ddmm(t)} ${hhmm(t)}` : 'Chưa có ghi nhận liều gần nhất'}</span></div>`;
  };
  const cond = CONDITIONS.filter(c => factOf(p, c.id) === 'yes').map(c => c.name);
  const stroke = p.stroke ? `${(STROKE_TYPES.find(s => s[0] === p.strokeType) || [0, 'Có'])[1]}${p.strokeDate ? `, ${p.strokeDate}` : ''}` : 'Chưa từng';
  const other = meds.filter(m => m.group !== 'anticoag' && m.group !== 'antiplatelet');
  let h = topBar({ close: true }) + h1('Thẻ cấp cứu', 'sm') + `<p class="lead">${esc(p.name)}${p.birthYear ? `, sinh năm ${p.birthYear}` : ''}</p>`;
  h += block('ĐANG DÙNG THUỐC CHỐNG ĐÔNG', meds.filter(m => m.group === 'anticoag')) + block('ĐANG DÙNG THUỐC KHÁNG NGƯNG TẬP TIỂU CẦU', meds.filter(m => m.group === 'antiplatelet'));
  h += group([row({ title: 'Đột quỵ', value: esc(stroke) }), row({ title: 'Bệnh nền', value: esc(cond.join(', ') || 'Chưa ghi') }), row({ title: 'Thuốc khác', value: esc(other.map(m => m.name).join(', ') || 'Không') })]);
  h += p.contact ? `<section class="card"><div class="card-head">${esc(p.contact.name)}<span class="aside">${esc(p.contact.rel)}</span></div>${btn(`${icon('phone')}${esc(p.contact.tel)}`, 'call', { num: p.contact.tel, who: p.contact.name })}</section>` : btn('Thêm người nhà', 'go', { v: 'info' }, 'soft');
  return { chrome: 'modal', white: true, html: h };
};

// ---- Triệu chứng mới: đang xảy ra thì đưa thẳng tới 115 ----
V.symptoms = () => {
  const s = S.draft.sym || (S.draft.sym = { list: [], step: 1 }), p = P();
  let h = topBar({ close: true, closeA: 'symClose' });
  if (s.step === 1) {
    h += h1('Có điều gì khác thường?', 'sm') + chips(SYMPTOMS.map(x => [x, x]), s.list, 'symPick');
    h += btn('Tiếp', 'symStep', { v: 2 }, '', s.list.length ? '' : 'disabled');
    if (p.symptoms.length) h += group(p.symptoms.slice().reverse().map(x => row({ title: esc(x.list.join(', ')), value: ddmm(x.t) })), { title: 'Đã ghi' });
  } else if (s.step === 2) {
    h += h1('Dấu hiệu này có đang xảy ra không?', 'q') + btn('Có, đang xảy ra', 'symNow', {}, 'red') + btn('Không, đã hết', 'symStep', { v: 3 }, 'soft');
  } else if (s.step === 4) {
    h += h1('Gọi 115 ngay', 'q') + btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red huge') + btn('Xong', 'symClose', {}, 'plain');
  } else {
    h += h1('Dù đã hết, vẫn nên báo bác sĩ ngay', 'q') + `<p class="body">Dấu hiệu đột quỵ có thể tự hết rồi quay lại nặng hơn.</p>`;
    h += btn(`${icon('phone')}Gọi bác sĩ`, 'call', { num: p.careTeam.phone, who: 'bác sĩ' });
    h += `<section class="card"><p class="lead">Bạn đã đi khám chưa?</p><div class="two">${btn('Rồi', 'symDone', { v: 1 }, 'soft')}${btn('Chưa', 'symDone', { v: 0 }, 'soft')}</div></section>`;
  }
  return { chrome: 'modal', html: h };
};
A.symPick = ({ v }) => { const l = S.draft.sym.list, i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); };
A.symStep = ({ v }) => { S.draft.sym.step = Number(v); S.focus = true; };
const symSave = visited => P().symptoms.push({ t: now(), list: S.draft.sym.list.slice(), visited, by: byWho() });
A.symNow = () => {
  symSave(false);
  if (!FEATURES.sos) { S.draft.sym.step = 4; S.focus = true; return; }
  S.draft.sym = null; S.stack.pop(); sheet('sos');
};
A.symDone = ({ v }) => { symSave(v === '1'); S.draft.sym = null; back(); toast('Đã ghi lại cho bác sĩ'); };
A.symClose = () => { S.draft.sym = null; back(); };

// ---- Thông báo trên màn khóa (mô phỏng) ----
V.lock = o => {
  const ms = now(), d = new Date(ms);
  const head = `<div class="clock">${hhmm(ms)}</div><div class="lockdate">${WD[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}</div>`;
  const openApp = `<button class="btn plain lock-open" ${on('lockClose')}>Mở app</button>`;
  const card = (ic, title, body, buttons) => `${head}<div class="notif"><div class="card-head">${tile(ic)}${title}</div><div class="body">${body}</div>${buttons}</div>${openApp}`;
  if (o.kind === 'meds' || o.kind === 'repeat') {
    const meds = medsActive(P(), ms).filter(x => x.moments.includes(o.mk)), m = mo(o.mk);
    return card('pill', o.kind === 'repeat' ? `Nhắc lại: thuốc buổi ${m.word}` : `Đến giờ thuốc buổi ${m.word}`, meds.map(x => `<b>${esc(x.name)}</b> ${esc(x.strength)}, ${esc(x.dose)}`).join('<br>'),
      btn(`${icon('check')}Đã dùng`, 'lockTaken', { mk: o.mk }) + (o.kind === 'meds' ? btn(`Nhắc lại sau ${D.settings.notif.repeat} phút`, 'lockLater', { mk: o.mk }, 'soft') : btn('Để sau', 'lockClose', {}, 'soft')));
  }
  if (o.kind === 'measure') return card('heart', 'Đến giờ đo huyết áp', 'Ngồi nghỉ 5 phút rồi đo.', btn('Ghi số đo', 'lockBP') + btn('Để sau', 'lockClose', {}, 'soft'));
  const ap = nextAppt(P());
  return card('cal', `Tái khám sau ${o.days} ngày`, ap ? `<b>${WD[new Date(ap.t).getDay()]} ${ddmm(ap.t)}, ${hhmm(ap.t)}</b><br>${esc(ap.place)}<br>${esc(ap.prep)}` : '', btn('Xem lịch', 'lockVisit') + btn('Đóng', 'lockClose', {}, 'soft'));
};
A.lockTaken = ({ mk }) => { S.lock = null; A.dosesAll({ mk }); };
A.lockLater = ({ mk }) => { S.lock = { kind: 'repeat', mk }; toast(`Sẽ nhắc lại sau ${D.settings.notif.repeat} phút`); };
A.lockClose = () => { S.lock = null; };
A.lockBP = () => { S.lock = null; A.startBP({}); };
A.lockVisit = () => { S.lock = null; home(); go('visit'); };
