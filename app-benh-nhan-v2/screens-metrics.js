'use strict';
// Tab Chỉ số: huyết áp, đường huyết, cân nặng, xét nghiệm (nhập tay hoặc chụp phiếu), thói quen, kế hoạch theo nhóm, tóm tắt cho bác sĩ.

const labDef = id => LABS.find(l => l.id === id);
const labNum = (test, v) => (test === 'egfr' ? `${Math.round(v)}` : fix1(v));
const LAB_GOAL = { tc: 5.2, a1c: 5.7, fpg: 5.6, egfr: 60 };
const SOURCE_WORD = { hospital: 'Bệnh viện', self: 'Tự nhập', photo: 'Ảnh chụp' };

// Phần Theo dõi của Hồ sơ sức khỏe: số đo theo ngày, xét nghiệm, lối sống, triệu chứng
function followBlock(p, ms) {
  const lb = last(p.bp), lg = last(p.glucose), lw = last(p.weights), bmi = bmiOf(p.height, p.weight), sym = last(p.symptoms);
  const home = [row({ icon: 'heart', title: 'Huyết áp', value: lb ? `${lb.sys}/${lb.dia}` : '', status: lb ? bpStatus(lb.sys, lb.dia) : '', a: 'go', p: { v: 'bpDetail' } })];
  if (p.track.glucose || lg) home.push(row({ icon: 'drop', title: 'Đường huyết', value: lg ? gluNum(lg.v) : '', status: lg ? gluStatus(lg.v, lg.fasting) : '', a: 'go', p: { v: 'gluDetail' } }));
  home.push(row({ icon: 'scale', title: 'Cân nặng', value: lw || p.weight ? `${dec(lw ? lw.v : p.weight)} kg` : '', status: bmi ? bmiStatus(bmi).key : '', a: 'startWeight' }));
  let h = group(home);
  const labs = LABS.filter(labOn).map(l => ({ l, r: labResults(p, l.id)[0] })).filter(x => x.r);
  h += group(labs.length ? labs.map(({ l, r }) => row({ icon: 'flask', title: l.name, value: `${labNum(l.id, r.v)} ${l.unit}`, status: labStatus(l.id, r.v, p, ms), a: 'go', p: { v: 'labDetail', test: l.id } })) : row({ icon: 'plus', title: 'Thêm kết quả', a: 'labAdd' }), { title: 'Xét nghiệm', action: labs.length ? { label: 'Thêm', icon: 'plus', a: 'labAdd' } : null });
  h += group(Object.keys(HABITS).map(k => { const H = HABITS[k], v = p.habits[k], known = v && v !== 'unknown'; return row({ icon: H.icon, title: H.name, value: known ? H.words[H.good(v) ? 0 : 1] : '', status: known ? (H.good(v) ? 'good' : 'improve') : '', a: 'go', p: { v: 'habit', k } }); }), { title: 'Lối sống' });
  h += group([row({ icon: 'pencil', title: 'Triệu chứng', value: sym ? ddmm(sym.t) : '', a: 'go', p: { v: 'symptoms' } }), FEATURES.plan ? row({ icon: 'today', title: 'Kế hoạch theo dõi', a: 'go', p: { v: 'plan' } }) : '']);
  return h;
}

// ---- Kế hoạch theo nhóm tiên phát, thứ phát. Nguồn từng mục hiện ở bảng điều khiển demo. ----
function planItems(p, ms) {
  const g = careGroup(p, ms), sec = g.startsWith('sec'), ap = nextAppt(p), out = [];
  // Mục cảnh báo (icon alert) tô đỏ như nút 115; các mục khác không tô màu
  const add = (s, ic, title, value, a, q, src) => out.push({ s, ic, tone: ic === 'alert' ? 'red' : '', title, value, a, p: q, src });
  if (p.meds.length || sec) add('Mỗi ngày', 'pill', 'Dùng thuốc đúng giờ', '', 'go', { v: 'meds' }, sec ? 'BRD: Tuân thủ dùng thuốc' : 'BRD: Nhắc uống thuốc cho người nguy cơ cao hoặc huyết áp cao');
  if (g === 'priYoung') add('Khi cần', 'heart', 'Đo huyết áp', 'Dưới 130/80', 'go', { v: 'bpDetail' }, 'BRD: Chỉ số tốt của huyết áp. Tần suất do demo đề xuất');
  else add('Mỗi ngày', 'heart', 'Đo huyết áp', p.track.bp ? 'Dưới 130/80' : 'Đang tắt', 'go', { v: p.track.bp ? 'bpDetail' : 'reminders' }, sec ? 'BRD: Sáng và chiều, dưới 130/80. Nhận xét TestFlight: AHA/ASA 2021' : 'BRD: Sáng và chiều nếu chọn theo dõi, dưới 130/80');
  if (p.track.glucose || factOf(p, 'dm') === 'yes') add('Mỗi ngày', 'drop', 'Đo đường huyết', 'Lúc đói tới 5,6', 'go', { v: p.track.glucose ? 'gluDetail' : 'reminders' }, 'BRD: Đường huyết lúc đói');
  add('Mỗi tuần', 'walk', 'Thói quen', '', 'go', { v: 'habit', k: 'activity' }, 'BRD: Thói quen sinh hoạt. Hỏi mỗi tuần theo gợi ý của điều phối');
  if (sec) {
    add('Khi khám', 'cal', 'Tái khám', ap ? `${WD_S[new Date(ap.t).getDay()]} ${ddmm(ap.t)}` : '', 'go', { v: 'visit' }, 'BRD: Mục 3.2 Tái khám');
    if (g === 'secIsch') add('Khi khám', 'flask', 'LDL', 'Dưới 1,8', 'go', { v: 'labDetail', test: 'ldl' }, 'Nhận xét TestFlight: AHA/ASA 2021, chờ bác sĩ chốt. BRD chỉ có mức chung 2,6');
    if (g === 'secHem') add('Khi khám', 'pill', 'Hỏi bác sĩ trước khi dùng thuốc mới', '', 'go', { v: 'article', topic: 'meds', id: 'bleed' }, 'Demo đề xuất, chưa có trong BRD, chờ bác sĩ chốt');
    if (g === 'secUnknown') add('Khi khám', 'doc', 'Hỏi bác sĩ loại đột quỵ', '', 'go', { v: 'strokeType' }, 'BRD: Tiền sử bệnh đột quỵ');
    add('Khi có dấu hiệu lạ', 'alert', 'Triệu chứng mới', 'Gọi 115', 'go', { v: 'symptoms' }, 'BRD: Các triệu chứng, FAST');
  } else {
    add('Mỗi tháng', 'scale', 'Cân nặng', 'BMI 18,5 đến 22,9', 'startWeight', {}, 'BRD: Ngưỡng BMI của Bộ Y tế. Tần suất do demo đề xuất');
    if (g === 'pri55') add('Khi khám', 'flask', 'Xét nghiệm mỡ máu', 'LDL dưới 2,6', 'go', { v: 'labDetail', test: 'ldl' }, 'BRD: Bảng PreventStroke');
    add('Khi có dấu hiệu lạ', 'alert', 'Dấu hiệu đột quỵ', 'BE FAST', 'go', { v: 'befast' }, 'BRD: Thông tin cần biết về đột quỵ');
  }
  return out;
}
V.plan = () => {
  const p = P(), ms = now(), items = planItems(p, ms), remain = riskRemaining(p, ms);
  let h = topBar({ back: 'Hồ sơ sức khỏe' }) + h1(CARE_TITLE[careGroup(p, ms)], 'sm');
  [...new Set(items.map(i => i.s))].forEach(s => { h += group(items.filter(i => i.s === s).map(i => row({ icon: i.ic, tone: i.tone, title: i.title, value: i.value, a: i.a, p: i.p })), { title: s }); });
  if (remain.length) h += `<section class="card"><p class="lead">Còn ${remain.length} câu hỏi cho bác sĩ</p>${btn('Trả lời', 'startRisk')}</section>`;
  return { chrome: 'push', html: h };
};

// ---- Bàn phím số dùng chung. S.draft.keys cho biết ô nào đang nhận số. ----
function bpComplete(f, s) { return f === 'sys' ? s.length === 3 || (s.length === 2 && '6789'.includes(s[0])) : s.length === 3 || (s.length === 2 && s[0] !== '1'); }
function bpKey(st, k) {
  if (k === 'del') { if (st[st.focus]) st[st.focus] = st[st.focus].slice(0, -1); else if (st.focus === 'dia') st.focus = 'sys'; return; }
  if (bpComplete(st.focus, st[st.focus])) st[st.focus] = '';
  st[st.focus] += k;
  if (st.focus === 'sys' && bpComplete('sys', st.sys) && !st.dia) st.focus = 'dia';
}
A.key = ({ k }) => {
  const t = S.draft.keys;
  if (t === 'bp') bpKey(S.draft.bp, k);
  else if (t === 'guide') bpKey(S.draft.g, k);
  else if (t === 'glu') { const g = S.draft.glu; g.digits = k === 'del' ? g.digits.slice(0, -1) : g.digits.length < 4 ? g.digits + k : g.digits; }
  else if (t === 'num') {
    const n = S.draft.num;
    if (k === 'del') n.text = n.text.slice(0, -1);
    else if (k === ',') { if (n.text && !n.text.includes(',')) n.text += ','; }
    else if (n.text.replace(',', '').length < (n.maxLen || 4)) n.text += k;
    if (n.auto && k !== 'del' && n.text.length === n.auto) return A.numSave();
  }
};
const bpFields = st => `<div class="fields">${field('Số trên', st.sys, st.focus === 'sys', 'bpFocus', { f: 'sys' })}${field('Số dưới', st.dia, st.focus === 'dia', 'bpFocus', { f: 'dia' })}</div>`;
A.bpFocus = ({ f }) => { (S.draft.keys === 'guide' ? S.draft.g : S.draft.bp).focus = f; };

// ---- Huyết áp ----
A.startBP = ({ id, mode }) => {
  const r = id && P().bp.find(x => x.id === id);
  S.draft.bp = { sys: r ? String(r.sys) : '', dia: r ? String(r.dia) : '', focus: 'sys', editId: id || null, mode: mode || '' };
  S.draft.keys = 'bp'; S.sheet = null;
  go('bpEntry');
};
V.bpEntry = () => {
  const st = S.draft.bp, ready = st.sys && st.dia && bpComplete('dia', st.dia);
  let h = topBar({ close: true }) + h1(st.mode === 'risk' ? 'Huyết áp gần nhất' : st.editId ? 'Sửa số huyết áp' : 'Ghi huyết áp', 'sm') + bpFields(st);
  h += keypad(`<button class="key key-plain" ${on('go', { v: 'article', topic: 'bp', id: 'measure' })}>Cách đo</button>`);
  h += btn('Lưu', 'bpSave', {}, '', ready ? '' : 'disabled');
  if (!st.editId && !st.mode) h += `<div class="two">${btn('Đo 3 lần', 'startGuide', {}, 'soft')}${btn(`${icon('camera')}Chụp máy`, 'scan', { target: 'bp' }, 'soft')}</div>`;
  return { chrome: 'modal', html: h };
};
A.bpSave = () => {
  const st = S.draft.bp, sys = Number(st.sys), dia = Number(st.dia), issues = bpIssues(sys, dia);
  if (issues.length) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="body">${issues.map(esc).join('<br>')}</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, vẫn lưu', a: 'bpSaveForce', cls: 'soft' }] });
  finishBP(sys, dia);
};
A.bpSaveForce = () => { S.dialog = null; finishBP(Number(S.draft.bp.sys), Number(S.draft.bp.dia)); };
function finishBP(sys, dia, src) {
  const p = P(), st = S.draft.bp || {};
  if (st.mode === 'risk') { p.facts.sbp = { v: 'yes', sys, dia, source: 'patient', by: byWho(), t: now() }; back(); return; }
  if (st.editId) { Object.assign(p.bp.find(x => x.id === st.editId), { sys, dia, edited: true }); replace('bpResult', { id: st.editId }); return; }
  const cur = currentMoment(plan()), r = { id: `b${Date.now()}`, t: now(), sys, dia, moment: cur && cur.items.some(i => i.kind === 'bp') ? cur.key : nearestMoment(now()), by: byWho(), src: src || 'manual' };
  p.bp.push(r); p.recheckAt = null; D.bpSaved++;
  replace('bpResult', { id: r.id });
}
function bpSpark(p) {
  const ms = now(), rs = p.bp.filter(r => r.t > ms - 7 * DAY && r.t <= ms).sort((a, b) => a.t - b.t), sy = rs.map(r => r.sys);
  return rs.length < 4 ? '' : chart({ h: 92, label: `Số trên 7 ngày, gần nhất ${sy[sy.length - 1]}`, xMin: ms - 7 * DAY, xMax: ms, yMin: Math.min(115, ...sy) - 4, yMax: Math.max(135, ...sy) + 4, lines: [{ v: 130, t: '130' }], series: [{ pts: rs.map(r => [r.t, r.sys]), color: 'var(--tint)' }] });
}
// Màn kết quả là cửa một chiều: không quay lại ô nhập, "Xong" về đúng chỗ đã mở. Luôn có nút 115.
V.bpResult = ({ id }) => {
  const p = P(), r = p.bp.find(x => x.id === id), key = bpStatus(r.sys, r.dia), danger = key === 'high' || key === 'low';
  let h = topBar({ close: 'none' }) + `<div class="center"><h1 class="hero-label">Huyết áp ${whenWord(r.t)}</h1><p class="hero">${r.sys}/${r.dia}</p></div>`;
  const call115 = btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red'), callDoc = btn('Gọi bác sĩ', 'call', { num: p.careTeam.phone, who: 'bác sĩ' }, 'soft');
  if (key === 'high') {
    h += `<div class="center">${pill('high', 'Huyết áp đang rất cao')}</div><section class="card"><p class="lead">Ngồi yên, nghỉ 5 phút rồi đo lại.</p><p class="body"><b>Gọi 115 ngay nếu có:</b> méo miệng, yếu hoặc tê một bên, nói khó, mắt mờ đột ngột, chóng mặt nặng, đau đầu dữ dội.</p></section>${call115}${btn('Đo lại sau 5 phút', 'bpRecheck', {}, 'soft')}${callDoc}`;
  } else if (key === 'low') {
    h += `<div class="center">${pill('low', 'Huyết áp đang thấp')}</div><section class="card"><p class="lead">Ngồi hoặc nằm nghỉ, rồi đo lại sau 5 phút.</p><p class="body">Vẫn thấp, hoặc thấy choáng, sắp ngất: gọi bác sĩ. Gọi 115 nếu ngất hoặc có dấu hiệu đột quỵ.</p></section>${btn('Đo lại sau 5 phút', 'bpRecheck')}${callDoc}${call115}`;
  } else {
    const tr = bpTrendSentence(bpTrend(p.bp, now()));
    h += `<div class="center">${pill(key, key === 'good' ? 'Tốt, trong mục tiêu' : 'Cần cải thiện')}</div><section class="card"><p class="lead">${key === 'good' ? BRD.bpGood : BRD.bpImprove}</p>${key === 'improve' ? `<button class="link" ${on('go', { v: 'article', topic: 'bp', id: 'control' })}>Cách kiểm soát huyết áp</button>` : ''}</section>`;
    if (tr) h += `<section class="card"><p class="lead">${esc(tr)}</p>${bpSpark(p)}</section>`;
    h += '<div class="spacer"></div>';
  }
  h += btn('Sửa số', 'bpEdit', { id: r.id }, 'plain') + btn('Xong', 'back', {}, danger ? 'plain' : '');
  return { chrome: 'modal', html: h };
};
A.bpEdit = ({ id }) => { S.stack.pop(); A.startBP({ id }); };
A.bpRecheck = () => { P().recheckAt = now() + 5 * 6e4; home(); toast('Nghỉ 5 phút rồi đo lại nhé'); };

// Đo 3 lần cùng app: hẹn giờ và tự tính trung bình 2 lần cuối, theo hướng dẫn trong BRD
let guideTimer = null;
A.startGuide = () => { S.draft.g = { step: 0, reads: [], sys: '', dia: '', focus: 'sys', wait: 0 }; S.draft.keys = 'guide'; replace('bpGuide'); };
function waitFor(sec) {
  clearInterval(guideTimer);
  const g = S.draft.g; g.wait = sec;
  guideTimer = setInterval(() => {
    g.wait--;
    const el = document.getElementById('countdown');
    if (el) el.textContent = `${Math.floor(g.wait / 60)}:${pad2(g.wait % 60)}`;
    if (g.wait <= 0) { clearInterval(guideTimer); g.wait = 0; render(); }
  }, 1000);
}
A.gRest = () => waitFor(300);
A.gSkip = () => { clearInterval(guideTimer); S.draft.g.wait = 0; };
A.gBegin = () => { S.draft.g.step = 1; };
A.gNext = () => {
  const g = S.draft.g, issues = bpIssues(Number(g.sys), Number(g.dia));
  if (issues.length) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="body">${issues.map(esc).join('<br>')}</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, tiếp tục', a: 'gNextForce', cls: 'soft' }] });
  gAdvance();
};
A.gNextForce = () => { S.dialog = null; gAdvance(); };
function gAdvance() {
  const g = S.draft.g;
  g.reads.push([Number(g.sys), Number(g.dia)]); Object.assign(g, { sys: '', dia: '', focus: 'sys' });
  g.step = g.reads.length >= 3 ? 4 : g.reads.length + 1;
  if (g.step <= 3) waitFor(60);
}
A.gFinish = () => { const l = S.draft.g.reads.slice(-2); S.draft.bp = {}; finishBP(Math.round(mean(l.map(x => x[0]))), Math.round(mean(l.map(x => x[1]))), 'guided'); };
A.gClose = () => { clearInterval(guideTimer); S.draft.keys = 'bp'; back(); };
V.bpGuide = () => {
  const g = S.draft.g;
  let h = topBar({ close: true, closeA: 'gClose' });
  if (g.wait > 0) return { chrome: 'modal', html: `${h}${h1(g.step === 0 ? 'Nghỉ 5 phút' : `Chờ lần đo ${g.step}`, 'sm')}<div class="spacer"></div><p class="hero xl center" id="countdown">${Math.floor(g.wait / 60)}:${pad2(g.wait % 60)}</p><div class="spacer"></div>${btn('Đo luôn', 'gSkip', {}, 'soft')}` };
  if (g.step === 0) return { chrome: 'modal', html: `${h}${h1('Đo 3 lần', 'sm')}<ul class="bullets">${[HOWTO[1], HOWTO[4]].map(s => `<li>${s}</li>`).join('')}</ul><div class="spacer"></div>${btn('Bắt đầu đo', 'gBegin')}${btn(`${icon('clock')}Nghỉ 5 phút trước`, 'gRest', {}, 'soft')}` };
  if (g.step === 4) {
    const l = g.reads.slice(-2), s = Math.round(mean(l.map(x => x[0]))), d = Math.round(mean(l.map(x => x[1])));
    return { chrome: 'modal', html: `${h}${h1('Trung bình 2 lần cuối', 'sm')}<p class="hero center">${s}/${d}</p>${group(g.reads.map((r, i) => row({ title: `Lần ${i + 1}`, value: `${r[0]}/${r[1]}` })))}<div class="spacer"></div>${btn('Lưu', 'gFinish')}` };
  }
  h += `${h1(`Lần đo ${g.step} trong 3`, 'sm')}${bpFields(g)}${keypad()}${btn(g.step === 3 ? 'Xong' : 'Tiếp', 'gNext', {}, '', g.sys && g.dia && bpComplete('dia', g.dia) ? '' : 'disabled')}`;
  return { chrome: 'modal', html: h };
};

V.bpDetail = () => {
  const p = P(), ms = now(), per = Number(S.draft.bpPer || 7);
  const list = p.bp.filter(r => r.t > ms - per * DAY && r.t <= ms).sort((a, b) => b.t - a.t);
  let h = topBar({ back: 'Hồ sơ sức khỏe' }) + h1('Huyết áp', 'sm') + (p.bp.length ? seg([[7, 'Tuần'], [30, 'Tháng'], [90, '3 tháng']], per, 'bpPer') : '');
  if (!list.length) h += `<section class="card empty"><p class="hero">–/–</p><p class="lead">${p.bp.length ? 'Không có lần đo' : 'Chưa có lần đo'}</p></section>`;
  if (list.length) {
    const s = Math.round(mean(list.map(r => r.sys))), d = Math.round(mean(list.map(r => r.dia)));
    const daily = f => { const by = {}; list.forEach(r => { (by[dayKey(r.t)] = by[dayKey(r.t)] || []).push(r[f]); }); return Object.entries(by).map(([k, v]) => [new Date(`${k}T12:00:00`).getTime(), mean(v)]).sort((a, b) => a[0] - b[0]); };
    const pts = daily('sys'), ptd = daily('dia');
    const xl = per === 7 ? [0, 1, 2, 3, 4, 5, 6].map(i => { const t = new Date(ms - i * DAY).setHours(12, 0, 0, 0); return [t, WD_S[new Date(t).getDay()]]; }) : [0, Math.floor(per / 2), per - 1].map(i => [ms - i * DAY, ddmm(ms - i * DAY)]);
    h += `<section class="card"><div class="center"><p class="hero-label">Trung bình</p><p class="hero">${s}/${d}</p>${pill(bpStatus(s, d))}</div>${chart({ h: 190, label: `Trung bình số trên ${s}, số dưới ${d}`, xMin: ms - per * DAY, xMax: ms, yMin: Math.min(70, ...ptd.map(x => x[1])) - 5, yMax: Math.max(140, ...pts.map(x => x[1])) + 8, lines: [{ v: 130, t: '130' }, { v: 80, t: '80' }], series: [{ pts, color: 'var(--tint)', label: 'Số trên' }, { pts: ptd, color: 'var(--ink2)', dash: true, label: 'Số dưới' }], xLabels: xl })}</section>`;
  }
  h += btn('Ghi số đo', 'startBP');
  const show = S.draft.bpAll ? list : list.slice(0, 5);
  h += group(show.map(r => row({ title: `${WD_S[new Date(r.t).getDay()]} ${ddmm(r.t)} · ${hhmm(r.t)}`, value: `${r.by !== 'self' ? icon('user') : ''}${r.sys}/${r.dia}`, a: 'bpRow', p: { id: r.id }, aria: `${ddmm(r.t)} ${hhmm(r.t)}, ${r.sys} trên ${r.dia}${r.by !== 'self' ? `, ${r.by} nhập` : ''}` })), list.length ? { title: 'Lần đo' } : null);
  if (list.length > 5 && !S.draft.bpAll) h += btn(`Xem tất cả ${list.length} lần đo`, 'bpAll', {}, 'plain');
  h += group([row({ icon: 'bell', title: 'Nhắc nhở', value: p.track.bp ? p.track.bpMoments.map(k => mo(k).label).join(', ') : 'Tắt', a: 'go', p: { v: 'reminders' } }), FEATURES.deviceLink ? toggle('Máy đo có kết nối', p.track.device, 'toggleDevice') : '']);
  return { chrome: 'push', html: h };
};
A.bpPer = ({ v }) => { S.draft.bpPer = Number(v); S.draft.bpAll = false; };
A.bpAll = () => { S.draft.bpAll = true; };
A.toggleDevice = () => { P().track.device = !P().track.device; };
A.bpRow = ({ id }) => sheet('bpRowSheet', { id });
V.bpRowSheet = ({ id }) => { const r = P().bp.find(x => x.id === id); return { title: 'Lần đo', html: `${sheetHead(`${ddmmyy(r.t)} · ${hhmm(r.t)}`)}<p class="hero center">${r.sys}/${r.dia}</p>${btn('Sửa số', 'startBP', { id }, 'soft')}${btn('Xóa', 'bpDel', { id }, 'plain')}` }; };
A.bpDel = ({ id }) => dialog({ title: 'Xóa lần đo này?', buttons: [{ label: 'Giữ lại', a: 'closeDialog' }, { label: 'Xóa', a: 'bpDelYes', p: { id }, cls: 'soft' }] });
A.bpDelYes = ({ id }) => { const p = P(); p.bp = p.bp.filter(x => x.id !== id); S.dialog = null; S.sheet = null; toast('Đã xóa'); };

// ---- Đường huyết ----
A.startGlu = () => { S.draft.glu = { digits: '', fasting: new Date(now()).getHours() < 10 }; S.draft.keys = 'glu'; go('gluEntry'); };
const gluParse = g => (!g.digits ? null : D.settings.gluUnit === 'mg' ? Number(g.digits) / MOL_TO_MG : g.digits.length === 1 ? Number(g.digits) : Number(g.digits) / 10);
const gluText = g => (!g.digits ? '' : D.settings.gluUnit === 'mg' || g.digits.length === 1 ? g.digits : `${g.digits.slice(0, -1)},${g.digits.slice(-1)}`);
V.gluEntry = () => {
  const g = S.draft.glu;
  return { chrome: 'modal', html: `${topBar({ close: true })}${h1('Ghi đường huyết', 'sm')}${field(`Đường huyết (${gluUnit()})`, gluText(g), true)}${chips([['1', 'Lúc đói'], ['0', 'Sau ăn']], g.fasting ? '1' : '0', 'gluFast', {}, 'grid')}${keypad()}${btn('Lưu', 'gluSave', {}, '', g.digits ? '' : 'disabled')}` };
};
A.gluFast = ({ v }) => { S.draft.glu.fasting = v === '1'; };
A.gluSave = () => {
  const v = gluParse(S.draft.glu);
  if (v < TH.glu.min || v > TH.glu.max) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="body">Số ${esc(gluText(S.draft.glu))} ${gluUnit()} có vẻ không đúng.</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, vẫn lưu', a: 'gluSaveForce', cls: 'soft' }] });
  gluFinish(v);
};
A.gluSaveForce = () => { S.dialog = null; gluFinish(gluParse(S.draft.glu)); };
function gluFinish(v) {
  const p = P(), cur = currentMoment(plan()), r = { id: `g${Date.now()}`, t: now(), v: Math.round(v * 10) / 10, fasting: S.draft.glu.fasting, moment: cur ? cur.key : nearestMoment(now()), by: byWho() };
  p.glucose.push(r); replace('gluResult', { id: r.id });
}
V.gluResult = ({ id }) => {
  const p = P(), r = p.glucose.find(x => x.id === id), key = gluStatus(r.v, r.fasting);
  const call115 = btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red'), callDoc = btn(`${icon('phone')}Gọi bác sĩ`, 'call', { num: p.careTeam.phone, who: 'bác sĩ' }, 'soft');
  let h = `${topBar({ close: 'none' })}<div class="center"><h1 class="hero-label">Đường huyết ${r.fasting ? 'lúc đói' : 'sau ăn'}</h1><p class="hero">${gluNum(r.v)}<small>${gluUnit()}</small></p></div>`;
  if (key === 'critical') h += `<div class="center">${pill('critical', 'Đường huyết rất cao')}</div><section class="card"><p class="lead">Cần được xử trí ngay.</p><p class="body">Gọi 115 hoặc nhờ người đưa tới cơ sở y tế. Nghi máy đo sai thì đo lại ngay, nhưng đừng chờ lâu.</p></section>${call115}${callDoc}`;
  else if (key === 'high') h += `<div class="center">${pill('high', 'Đường huyết đang rất cao')}</div><section class="card"><p class="lead">Gọi bác sĩ trong hôm nay.</p><p class="body">Gọi 115 nếu lơ mơ, rất mệt, nôn nhiều hoặc có dấu hiệu đột quỵ.</p></section>${callDoc}${call115}`;
  else if (key === 'low') h += `<div class="center">${pill('low', 'Đường huyết đang thấp')}</div><section class="card"><p class="lead">Nếu tỉnh táo, ăn hoặc uống thứ có đường, rồi đo lại sau 15 phút.</p><p class="body">Gọi 115 nếu lơ mơ hoặc ngất.</p></section>${callDoc}${call115}`;
  else h += `<div class="center">${key === 'none' ? '' : pill(key)}</div>${key === 'none' ? '' : `<section class="card"><p class="lead">${key === 'good' ? 'Đường huyết lúc đói đang tốt. Hãy duy trì nhé!' : 'Đường huyết lúc đói hơi cao. Hãy theo dõi thường xuyên và tham khảo ý kiến bác sĩ.'}</p></section>`}<div class="spacer"></div>`;
  return { chrome: 'modal', html: h + btn('Xong', 'back') };
};
V.gluDetail = () => {
  const p = P(), ms = now(), list = p.glucose.slice().sort((a, b) => b.t - a.t), f = list.filter(r => r.fasting).slice(0, 7);
  let h = topBar({ back: 'Hồ sơ sức khỏe' }) + h1('Đường huyết', 'sm');
  if (f.length) { const m = mean(f.map(r => r.v)); h += `<section class="card"><div class="center"><p class="hero-label">Lúc đói, ${f.length} lần gần nhất</p><p class="hero">${gluNum(m)}<small>${gluUnit()}</small></p>${pill(gluStatus(m, true))}</div>${list.length >= 2 ? chart({ h: 150, label: 'Đường huyết các lần đo', xMin: list[list.length - 1].t, xMax: ms, yMin: 3, yMax: Math.max(10, ...list.map(r => r.v)) + 1, lines: [{ v: 5.6, t: '5,6' }], series: [{ pts: list.slice().reverse().map(r => [r.t, r.v]), color: 'var(--tint)' }] }) : ''}</section>`; }
  else h += `<section class="card empty"><p class="hero">–</p><p class="lead">Chưa có lần đo</p></section>`;
  h += btn('Ghi số đo', 'startGlu');
  h += group(list.slice(0, 7).map(r => row({ title: `${WD_S[new Date(r.t).getDay()]} ${ddmm(r.t)} · ${r.fasting ? 'Lúc đói' : 'Sau ăn'}`, value: gluNum(r.v), status: gluStatus(r.v, r.fasting) })), list.length ? { title: 'Lần đo' } : null);
  h += group(row({ icon: 'bell', title: 'Nhắc nhở', value: p.track.glucose ? p.track.gluMoments.map(k => mo(k).label).join(', ') : 'Tắt', a: 'go', p: { v: 'reminders' } }));
  return { chrome: 'push', html: h };
};

// ---- Cân nặng: nút tăng giảm vì thay đổi ít ----
A.startWeight = () => { const l = last(P().weights); S.draft.w = l ? l.v : P().weight || 60; go('weightEntry'); };
V.weightEntry = () => {
  const p = P(), w = S.draft.w, b = bmiOf(p.height, w), bs = bmiStatus(b);
  return { chrome: 'modal', html: `${topBar({ close: true })}${h1('Cân nặng', 'sm')}<div class="stepper"><button class="key" ${on('wStep', { d: -0.5 })} aria-label="Giảm nửa ký">${icon('minus')}</button><p class="hero center">${dec(w)} <small>kg</small></p><button class="key" ${on('wStep', { d: 0.5 })} aria-label="Tăng nửa ký">${icon('plus')}</button></div>${b ? `<div class="center">${pill(bs.key, `BMI ${fix1(b)} · ${bs.word}`)}</div>` : ''}${btn('Nhập số khác', 'wType', {}, 'plain')}<div class="spacer"></div>${btn('Lưu', 'wSave')}` };
};
A.wStep = ({ d }) => { S.draft.w = Math.max(20, Math.round((S.draft.w + Number(d)) * 2) / 2); };
A.wType = () => openNum({ title: 'Cân nặng', unit: 'kg', comma: true, min: TH.weight.min, max: TH.weight.max, maxLen: 4, onSave: 'wTyped' });
A.wTyped = v => { S.draft.w = v; back(); };
A.wSave = () => {
  const v = S.draft.w;
  if (v < TH.weight.min || v > TH.weight.max) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="body">Cân nặng ${dec(v)} kg có vẻ không đúng.</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, vẫn lưu', a: 'wSaveForce', cls: 'soft' }] });
  wFinish(v);
};
A.wSaveForce = () => { S.dialog = null; wFinish(S.draft.w); };
function wFinish(v) { const p = P(); p.weights.push({ t: now(), v, by: byWho() }); p.weight = v; back(); toast(`Đã lưu ${dec(v)} kg`); }

// ---- Ô nhập số dùng chung. o.onSave là tên hành động nhận số đã nhập. ----
function openNum(o) { S.draft.num = Object.assign({ text: o.value != null ? dec(o.value) : '' }, o); S.draft.prevKeys = S.draft.keys; S.draft.keys = 'num'; go('numEntry'); }
V.numEntry = () => {
  const n = S.draft.num;
  // Tiêu đề đã nói tên chỉ số, ô số chỉ cần đơn vị
  let h = topBar({ close: true, closeA: 'numCancel' }) + h1(n.title, 'sm') + field(esc(n.unit || n.label || n.title), esc(n.text), true);
  if (n.date) h += group(dateRow('Ngày', 'numDate', n.date));
  return { chrome: 'modal', html: `${h}${keypad(n.comma ? `<button class="key" ${on('key', { k: ',' })}>,</button>` : '')}${btn('Lưu', 'numSave', {}, '', n.text ? '' : 'disabled')}${n.scan ? btn(`${icon('camera')}Chụp phiếu`, 'scan', { target: 'lab' }, 'soft') : ''}` };
};
F.numDate = v => { S.draft.num.date = v; };
A.numCancel = () => { S.draft.keys = S.draft.prevKeys; back(); };
A.numSave = () => {
  const n = S.draft.num, v = Number(n.text.replace(',', '.'));
  if ((n.min != null && v < n.min) || (n.max != null && v > n.max)) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="body">${esc(n.label || n.title)} ${esc(n.text)}${n.unit ? ` ${esc(n.unit)}` : ''} có vẻ không đúng.</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, vẫn lưu', a: 'numForce', cls: 'soft' }] });
  S.draft.keys = S.draft.prevKeys; A[n.onSave](v);
};
A.numForce = () => { const n = S.draft.num; S.dialog = null; S.draft.keys = S.draft.prevKeys; A[n.onSave](Number(n.text.replace(',', '.'))); };

// ---- Xét nghiệm: bệnh viện nhập, người bệnh tự thêm bằng tay hoặc chụp phiếu ----
V.labDetail = ({ test }) => {
  const p = P(), ms = now(), l = labDef(test), list = labResults(p, test), latest = list[0];
  let h = topBar({ back: 'Hồ sơ sức khỏe' }) + h1(l.name, 'sm');
  if (latest) {
    const goal = test === 'ldl' ? ldlGoal(p, ms) : LAB_GOAL[test], asc = list.slice().reverse();
    h += `<section class="card"><div class="center"><p class="hero-label">${ddmmyy(latest.date)}</p><p class="hero">${labNum(test, latest.v)}<small>${l.unit}</small></p>${pill(labStatus(test, latest.v, p, ms))}${labGoalText(test, p, ms) ? `<p class="hero-label mt">Mục tiêu ${labGoalText(test, p, ms).toLowerCase()}</p>` : ''}</div>`;
    if (list.length >= 2) { const vs = list.map(x => x.v); h += chart({ h: 150, label: `${l.name} các lần xét nghiệm`, xMin: asc[0].date, xMax: ms, yMin: Math.min(...vs, goal || Infinity) * 0.8, yMax: Math.max(...vs, goal || 0) * 1.15, lines: goal ? [{ v: goal, t: dec(goal) }] : [], series: [{ pts: asc.map(x => [x.date, x.v]), color: 'var(--tint)', dots: true }] }); }
    h += '</section>';
  } else h += `<section class="card empty"><p class="hero">–</p><p class="lead">Chưa có kết quả</p></section>`;
  h += btn(`${icon('plus')}Thêm kết quả`, 'labChoose', { test });
  h += group(list.map(x => row({ title: ddmmyy(x.date), value: `${labNum(test, x.v)}`, status: labStatus(test, x.v, p, ms), aria: `${ddmmyy(x.date)}, ${SOURCE_WORD[x.source] || SOURCE_WORD.self}, ${labNum(test, x.v)} ${l.unit}` })));
  return { chrome: 'push', html: h };
};
// Thêm từ tab Chỉ số: một sheet có nút chụp phiếu và danh sách xét nghiệm để gõ tay
A.labAdd = () => sheet('labAddSheet');
V.labAddSheet = () => ({ title: 'Thêm kết quả', html: `${sheetHead('Thêm kết quả')}${btn(`${icon('camera')}Chụp phiếu`, 'scan', { target: 'lab' }, 'soft')}${group(LABS.filter(labOn).map(l => row({ title: l.name, value: l.unit, a: 'labChoose', p: { test: l.id } })))}` });
A.labChoose = ({ test }) => { S.sheet = null; labOpen(test); };
function labOpen(test) { const l = labDef(test); S.draft.labTest = test; openNum({ title: l.name, unit: l.unit, comma: test !== 'egfr', maxLen: 5, min: l.min, max: l.max, date: dayKey(now()), scan: true, onSave: 'labSaved' }); }
A.labSaved = v => {
  const test = S.draft.labTest, d = S.draft.num.date ? new Date(`${S.draft.num.date}T12:00:00`).getTime() : now();
  P().labs.push({ id: `l${Date.now()}`, test, v, date: d, source: 'self', by: byWho() });
  replace('labDetail', { test }); toast('Đã lưu');
};
// Chụp phiếu: mở máy ảnh. Bản demo luôn đọc ra cùng một bộ số mẫu, người dùng phải kiểm tra trước khi lưu.
A.scan = ({ target }) => { S.draft.scanTarget = target; const el = document.getElementById('scanInput'); if (el) el.click(); return false; };
F.scanFile = (v, el, type) => {
  if (type !== 'change' || !el.files || !el.files[0]) return;
  const reader = new FileReader();
  reader.onload = () => { el.value = ''; scanned(reader.result); refresh(); };
  reader.readAsDataURL(el.files[0]);
};
function scanned(img) {
  if (S.draft.scanTarget === 'bp') { Object.assign(S.draft.bp, { sys: '126', dia: '78', focus: 'dia' }); return; }
  if (S.draft.scanTarget === 'visit') { S.draft.visit.photo = img; return; }
  if (S.draft.scanTarget === 'rx') { rxStart(img); return; }
  S.sheet = null;
  S.draft.scan = { img, date: SCAN_SAMPLE.date, items: Object.entries(SCAN_SAMPLE.values).filter(([test]) => labOn(labDef(test))).map(([test, v]) => ({ test, v, on: true })) };
  go('scanReview');
}
V.scanReview = () => {
  const sc = S.draft.scan, n = sc.items.filter(i => i.on).length;
  let h = topBar({ close: true }) + h1('Kiểm tra kết quả', 'sm') + (sc.img ? `<img class="thumb" src="${sc.img}" alt="Ảnh phiếu xét nghiệm">` : '');
  h += group(dateRow('Ngày xét nghiệm', 'scanDate', sc.date));
  // Số đọc từ ảnh tô màu nhấn: chạm vào số để sửa
  h += group(sc.items.map(i => { const l = labDef(i.test); return `<div class="row"><button class="check-btn" role="checkbox" aria-checked="${i.on}" aria-label="Lưu ${esc(l.name)}" ${on('scanToggle', { test: i.test })}><span class="check">${icon('check')}</span></button><span class="row-title">${esc(l.name)}</span><button class="row-value edit" ${on('scanEdit', { test: i.test })} aria-label="Sửa ${esc(l.name)}, ${labNum(i.test, i.v)} ${l.unit}">${labNum(i.test, i.v)} ${l.unit}</button></div>`; }));
  return { chrome: 'modal', html: h + btn(`Lưu ${n} kết quả`, 'scanSave', {}, '', n ? '' : 'disabled') };
};
F.scanDate = v => { S.draft.scan.date = v; };
A.scanToggle = ({ test }) => { const i = S.draft.scan.items.find(x => x.test === test); i.on = !i.on; };
A.scanEdit = ({ test }) => { const l = labDef(test), i = S.draft.scan.items.find(x => x.test === test); S.draft.scanEdit = test; openNum({ title: l.name, unit: l.unit, comma: test !== 'egfr', maxLen: 5, min: l.min, max: l.max, value: i.v, onSave: 'scanEdited' }); };
A.scanEdited = v => { S.draft.scan.items.find(x => x.test === S.draft.scanEdit).v = v; back(); };
A.scanSave = () => {
  const sc = S.draft.scan, d = new Date(`${sc.date}T12:00:00`).getTime(), items = sc.items.filter(i => i.on);
  items.forEach(i => P().labs.push({ id: `l${Date.now()}${i.test}`, test: i.test, v: i.v, date: d, source: 'photo', by: byWho() }));
  S.draft.scan = null; openRoot('metrics'); toast(`Đã lưu ${items.length} kết quả`);
};

// ---- Thói quen ----
V.habit = ({ k }) => {
  const p = P(), H = HABITS[k], v = p.habits[k], known = v && v !== 'unknown';
  let h = topBar({ back: 'Hồ sơ sức khỏe' }) + h1(H.name, 'sm');
  if (known) h += `<section class="card"><div class="card-head">${statusIcon(H.good(v) ? 'good' : 'improve')}${H.good(v) ? 'Tốt' : 'Cần cải thiện'}</div><p class="body">${esc(H.good(v) ? H.okText : H.badText)}</p></section>`;
  h += chips(H.opts, v, 'habitSet', { k });
  if (k === 'diet' && known) { const list = v === 'yes' ? DIET_GOOD : DIET_BAD; h += chips(list.map(x => [x, x]), p.habits.dietItems || [], 'dietItem'); }
  if (k === 'smoke' && known && v !== 'none') { const s = p.habits.smokeInfo || {}; h += group([row({ title: 'Số điếu mỗi ngày', value: s.perDay != null ? s.perDay : '', a: 'smokeNum', p: { f: 'perDay' } }), row({ title: 'Mục tiêu giảm xuống', value: s.goal != null ? `${s.goal} điếu` : '', a: 'smokeNum', p: { f: 'goal' } })]); }
  if (k === 'activity') h += group([toggle('Số bước từ điện thoại', p.track.steps, 'toggleSteps'), p.track.steps ? row({ title: 'Hôm nay', value: '3.420 bước' }) : '']);
  h += `<h2 class="label">Hỏi lại</h2>${seg([['tuan', 'Mỗi tuần'], ['thang', 'Mỗi tháng'], ['tat', 'Tắt']], p.track.weeklyHabits ? p.track.habitEvery : 'tat', 'habitEvery')}`;
  return { chrome: 'push', html: h };
};
A.habitSet = ({ k, v }) => { const p = P(); p.habits[k] = v; p.habitLog.push({ w: -1, kind: k, v, t: now(), by: byWho() }); if (k === 'smoke') p.facts.smoke = { v: v === 'none' ? 'no' : 'yes', source: 'patient' }; };
A.dietItem = ({ v }) => { const l = P().habits.dietItems || (P().habits.dietItems = []), i = l.indexOf(v); if (i >= 0) l.splice(i, 1); else l.push(v); };
A.habitEvery = ({ v }) => { const t = P().track; t.weeklyHabits = v !== 'tat'; if (v !== 'tat') t.habitEvery = v; };
A.toggleSteps = () => {
  if (P().track.steps) { P().track.steps = false; return; }
  dialog({ title: 'Lấy số bước từ điện thoại?', body: '<p class="body">App chỉ đọc số bước từ Apple Health hoặc Health Connect. Tắt được bất cứ lúc nào.</p>', buttons: [{ label: 'Đồng ý', a: 'stepsYes' }, { label: 'Không', a: 'closeDialog', cls: 'soft' }] });
};
A.stepsYes = () => { P().track.steps = true; S.dialog = null; };
A.smokeNum = ({ f }) => { S.draft.smokeField = f; openNum({ title: f === 'goal' ? 'Mục tiêu giảm xuống' : 'Số điếu mỗi ngày', unit: 'điếu', maxLen: 3, min: 0, max: 100, onSave: 'smokeSaved' }); };
A.smokeSaved = v => { const p = P(); (p.habits.smokeInfo = p.habits.smokeInfo || {})[S.draft.smokeField] = v; back(); };

// ---- Tóm tắt cho bác sĩ: số đo, thuốc, xét nghiệm, triệu chứng. Không có điểm nguy cơ. ----
V.summary = () => {
  const p = P(), ms = now(), rs = p.bp.filter(r => r.t > ms - 30 * DAY && r.t <= ms), gl = p.glucose.filter(r => r.t > ms - 30 * DAY);
  const a = adherence(p, 30, ms, times()), sym = p.symptoms.filter(s => s.t > ms - 30 * DAY);
  let h = topBar({ close: true }) + h1(`${p.name}${p.birthYear ? `, ${ageOf(p, ms)} tuổi` : ''}`, 'sm') + `<div class="date">30 ngày, đến ${ddmmyy(ms)}</div>`;
  h += group(intakeSummary(p, ms).map(x => row({ title: x.k, value: esc(x.v) })), { title: 'Hồ sơ ban đầu' });
  if (rs.length) { const sy = rs.map(r => r.sys), di = rs.map(r => r.dia); h += `<section class="card"><div class="card-head">Huyết áp<span class="aside">${rs.length} lần đo</span></div><p class="hero md">${Math.round(mean(sy))}/${Math.round(mean(di))}</p>${group([row({ title: 'Cao nhất', value: `${Math.max(...sy)}/${Math.max(...di)}` }), row({ title: 'Thấp nhất', value: `${Math.min(...sy)}/${Math.min(...di)}` }), rs.some(r => r.by !== 'self') ? row({ title: 'Người nhà nhập', value: `${rs.filter(r => r.by !== 'self').length} lần` }) : ''])}</section>`; }
  if (gl.length) h += group(row({ icon: 'drop', title: 'Đường huyết trung bình', value: `${gluNum(mean(gl.map(r => r.v)))} ${gluUnit()}` }));
  if (p.meds.length) h += `<section class="card"><div class="card-head">Thuốc<span class="aside">${a.due} liều</span></div><div class="stats"><div><b>${a.taken}</b><span>Đã dùng</span></div><div><b>${a.missed}</b><span>Bỏ lỡ</span></div><div><b>${a.none}</b><span>Không ghi</span></div></div>${group(medsActive(p, ms).map(m => row({ title: esc(medName(m)), value: momentsText(m) })))}</section>`;
  const labs = LABS.filter(labOn).map(l => ({ l, r: labResults(p, l.id)[0] })).filter(x => x.r);
  if (labs.length) h += group(labs.map(({ l, r }) => row({ title: l.name, value: `${labNum(l.id, r.v)} ${l.unit}`, status: labStatus(l.id, r.v, p, ms) })), { title: 'Xét nghiệm gần nhất' });
  h += group(sym.length ? sym.map(s => row({ title: esc(s.list.join(', ')), value: ddmm(s.t) })) : row({ title: 'Không ghi nhận' }), { title: 'Triệu chứng mới' });
  const ask = riskPlan(p, ms).ids.filter(id => factOf(p, id) === 'unknown' || pendingConfirm(p, ms).includes(id));
  if (ask.length) h += group(row({ title: ask.map(id => RISK_Q[id].short).join(', ') }), { title: 'Cần bác sĩ xác nhận' });
  h += p.consents.doctor ? btn(`${icon('share')}Gửi cho bác sĩ`, 'summarySend', {}, 'soft') : group(row({ icon: 'lock', title: 'Chưa chia sẻ với bác sĩ', a: 'go', p: { v: 'sharing' } }));
  return { chrome: 'modal', white: true, html: h };
};
A.summarySend = () => { toast('Đã gửi cho bác sĩ'); return false; };
