'use strict';
// Tab Sức khỏe: chỉ số, thuốc, thói quen, xét nghiệm, yếu tố, triệu chứng. Không có điểm hay mức nguy cơ (BRD).

V.health = () => {
  const p = P(), ms = nowMs();
  const lb = lastOf(p.bp), lg = lastOf(p.glucose), lw = lastOf(p.weights);
  const a30 = adherence(p, 30), ak = adherenceKey(a30);
  const bmi = bmiOf(p.height, p.weight);
  let h = topBar() + '<h1 class="t">Sức khỏe</h1>';
  h += `<div class="rows">${row({ icon: 'today', tone: 'blue', n: 'Theo dõi của bạn', d: CARE_INTRO[careGroup(p, ms)].title, a: 'go', p: 'carePlan' })}</div>`;
  h += '<div class="rows">';
  h += row({ icon: 'heart', tone: 'blue', n: 'Huyết áp', st: lb ? statusChip(bpStatus(lb.sys, lb.dia)) : `<span class="d">${p.track.bp ? 'Chưa có lần đo' : 'Chưa theo dõi'}</span>`, val: lb ? `${lb.sys}/${lb.dia}` : '', a: 'go', p: 'bpDetail' });
  if (p.track.glucose || lg) h += row({ icon: 'drop', tone: 'purple', n: 'Đường huyết', d: lg ? `${lg.fasting ? 'Lúc đói' : 'Sau ăn'}, ${whenWord(lg.t)}` : 'Chưa có lần đo', val: lg ? gluShow(lg.v).replace(' mmol/L', '').replace(' mg/dL', '') : '', a: 'go', p: 'gluDetail' });
  h += row({ icon: 'pill', tone: 'teal', n: 'Thuốc', st: p.meds.length ? (ak === 'none' ? '<span class="d">Chưa có ghi nhận</span>' : statusChip(ak, ak === 'good' ? 'Đều đặn' : 'Cần cải thiện')) : '<span class="d">Chưa có thuốc</span>', val: p.meds.length ? `${medsActive(p, ms).length} loại` : '', a: 'go', p: 'meds' });
  h += row({ icon: 'scale', tone: 'purple', n: 'Cân nặng', d: bmi ? `BMI ${dec(bmi.toFixed(1))}, ${bmiStatus(bmi).word.toLowerCase()}` : 'Chưa có', val: p.weight ? `${dec(p.weight)} kg` : '', a: 'startWeight' });
  h += '</div>';

  h += '<div class="sec">Thói quen</div><div class="rows">';
  h += habitRow('activity') + habitRow('smoke') + habitRow('alcohol') + habitRow('diet');
  h += '</div>';

  h += '<div class="rows">';
  h += row({ icon: 'walk', tone: 'green', n: 'Yếu tố của bạn', d: 'Đang tốt và có thể cải thiện', a: 'go', p: 'factors' });
  if (p.stroke) h += row({ icon: 'alert', tone: 'orange', n: 'Ghi triệu chứng mới', d: 'Khi có điều gì khác thường', a: 'go', p: 'symptoms' });
  else h += row({ icon: 'alert', tone: 'orange', n: 'Ghi triệu chứng', d: 'Khi có điều gì khác thường', a: 'go', p: 'symptoms' });
  h += row({ icon: 'flask', tone: 'orange', n: 'Xét nghiệm', d: p.labs.length ? `Bệnh viện nhập, ngày ${p.labs[0].date}` : 'Bệnh viện hoặc bác sĩ nhập', a: 'go', p: 'labs' });
  h += '</div>';
  return { chrome: 'tab', html: h };
};

const HABITS = {
  activity: { icon: 'walk', tone: 'green', name: 'Vận động', opts: [['strong', 'Từ 1,5 giờ vận động mạnh mỗi tuần'], ['good', 'Từ 2,5 giờ vận động nhẹ mỗi tuần'], ['little', 'Không thường xuyên'], ['none', 'Không']], isGood: v => v === 'good' || v === 'strong', good: BRD.activeGood, bad: BRD.activeImprove, goodLabel: 'Tốt' },
  smoke: { icon: 'smoke', tone: 'muted', name: 'Hút thuốc', opts: [['none', 'Không hút'], ['little', 'Ít'], ['mid', 'Vừa'], ['much', 'Nhiều, từ 1 gói/ngày']], isGood: v => v === 'none', good: BRD.smokeGood, bad: BRD.smokeImprove },
  alcohol: { icon: 'glass', tone: 'orange', name: 'Uống rượu bia', opts: [['none', 'Không uống'], ['little', 'Ít'], ['mid', 'Vừa'], ['much', 'Nhiều, từ 4-5 ly mỗi dịp']], isGood: v => v === 'none' || v === 'little', good: BRD.alcoholGood, bad: BRD.alcoholImprove },
  diet: { icon: 'leaf', tone: 'green', name: 'Ăn uống', opts: [['yes', 'Ăn uống lành mạnh'], ['no', 'Chưa lành mạnh'], ['unknown', 'Không rõ']], isGood: v => v === 'yes', good: 'Bạn đang ăn uống rất tốt. Hãy tiếp tục nhé!', bad: 'Thử giảm dần món mặn, ngọt và nhiều dầu mỡ. Mỗi thay đổi nhỏ đều có ích.' },
};
function habitRow(k) {
  const p = P(), H = HABITS[k], v = p.habits[k];
  const st = v == null || v === 'unknown' ? '<span class="d">Chưa trả lời</span>' : statusChip(H.isGood(v) ? 'good' : 'improve');
  return row({ icon: H.icon, tone: H.tone, n: H.name, st, a: 'go', p: `habit:${k}` });
}

V.habit = ({ id }) => {
  const p = P(), H = HABITS[id], v = p.habits[id];
  let h = topBar({ back: 'Sức khỏe' }) + `<h1 class="t small">${H.name}</h1>`;
  if (v != null && v !== 'unknown') h += `<div class="card">${statusChip(H.isGood(v) ? 'good' : 'improve')}<div class="sub ink" style="margin-top:.35rem">${esc(H.isGood(v) ? H.good : H.bad)}</div></div>`;
  h += `<div class="sec">Mức hiện tại</div><div class="chips">${H.opts.map(o => `<button class="chip left ${v === o[0] ? 'on' : ''}" aria-pressed="${v === o[0]}" data-a="habitSet" data-p="${id}|${o[0]}">${o[1]}</button>`).join('')}</div>`;
  if (id === 'diet') {
    const list = v === 'yes' ? ['Ăn nhiều rau, trái cây, các loại hạt, đậu, ngũ cốc nguyên hạt', 'Dùng dầu olive là nguồn chất béo chính', 'Ăn cá và hải sản thường xuyên', 'Ăn ít thịt đỏ, ít thực phẩm chế biến sẵn', 'Uống rượu vang vừa phải', 'Lượng sữa và sản phẩm từ sữa vừa phải'] : (v === 'no' || v === 'unknown') ? ['Ăn mặn', 'Ăn nhiều đồ ngọt', 'Ăn nhiều dầu mỡ'] : [];
    if (list.length) { const sel = p.habits.dietItems || []; h += `<div class="sec">Chọn những mục đúng với bạn (không bắt buộc)</div><div class="chips">${list.map(x => `<button class="chip left ${sel.includes(x) ? 'on' : ''}" aria-pressed="${sel.includes(x)}" data-a="dietItem" data-p="${esc(x)}">${x}</button>`).join('')}</div>`; }
  }
  if (id === 'smoke' && v && v !== 'none') {
    const s = p.habits.smokeInfo || {};
    h += `<div class="rows">${row({ n: 'Số điếu mỗi ngày', val: s.perDay != null ? s.perDay : 'Chưa ghi', a: 'smokeNum', p: 'perDay' })}${row({ n: 'Mục tiêu giảm xuống', val: s.goal != null ? `${s.goal} điếu` : 'Chưa đặt', a: 'smokeNum', p: 'goal' })}</div><button class="link left" data-a="go" data-p="article:bp">Thông tin và hỗ trợ bỏ thuốc</button>`;
  }
  if (id === 'activity') {
    h += `<div class="rows">${sw(p.track.steps, 'Lấy số bước từ điện thoại', 'toggleSteps', '', 'Từ Apple Health hoặc Health Connect, cần bạn đồng ý')}${p.track.steps ? row({ n: 'Số bước hôm nay (mô phỏng)', val: '3.420' }) : ''}</div>`;
  }
  h += `<div class="sec">Bạn có muốn chúng tôi hỗ trợ theo dõi?</div><div class="seg">${[['tuan', 'Mỗi tuần'], ['thang', 'Mỗi tháng'], ['tat', 'Tắt']].map(o => `<button aria-pressed="${(p.track.weeklyHabits ? p.track.habitEvery : 'tat') === o[0]}" data-a="habitEvery" data-p="${o[0]}">${o[1]}</button>`).join('')}</div><p class="note">App hỏi một câu có chọn sẵn, không bắt nhập số mỗi ngày.</p>`;
  return { chrome: 'push', html: h };
};
A.habitSet = q => { const [k, v] = q.split('|'), p = P(); p.habits[k] = v; p.habitLog.push({ w: -1, kind: k, v, t: nowMs(), by: whoEntered() }); if (k === 'smoke') p.facts.smoke = { v: v === 'none' ? 'no' : 'yes', source: 'patient' }; persist(); render(); };
A.dietItem = x => { const p = P(), l = p.habits.dietItems || (p.habits.dietItems = []); const i = l.indexOf(x); if (i >= 0) l.splice(i, 1); else l.push(x); persist(); render(); };
A.habitEvery = v => { const p = P(); p.track.weeklyHabits = v !== 'tat'; if (v !== 'tat') p.track.habitEvery = v; persist(); render(); };
A.toggleSteps = () => {
  const p = P();
  if (p.track.steps) { p.track.steps = false; persist(); return render(); }
  dialog({ title: 'Cho phép lấy số bước?', body: '<p class="sub ink">App chỉ đọc số bước từ Apple Health hoặc Health Connect. Bạn tắt được lúc nào cũng được.</p>', buttons: [{ label: 'Đồng ý', a: 'stepsYes' }, { label: 'Không', a: 'closeDialog', cls: 'sec' }] });
};
A.stepsYes = () => { P().track.steps = true; S.dialog = null; persist(); render(); };
A.smokeNum = f => openNum({ title: f === 'goal' ? 'Mục tiêu giảm xuống' : 'Số điếu mỗi ngày', noun: 'Số điếu', unit: 'điếu', maxLen: 3, onSave: f === 'goal' ? 'smokeGoal' : 'smokePer', min: 0, max: 100 });
A.smokeGoal = v => { const p = P(); (p.habits.smokeInfo = p.habits.smokeInfo || {}).goal = v; persist(); A.back(); };
A.smokePer = v => { const p = P(); (p.habits.smokeInfo = p.habits.smokeInfo || {}).perDay = v; persist(); A.back(); };

// ---- Chi tiết huyết áp ----
function dailyAvg(list, field) {
  const by = {};
  list.forEach(r => { const k = dayKey(r.t); (by[k] = by[k] || []).push(r); });
  return Object.values(by).map(a => [new Date(a[0].t).setHours(12, 0, 0, 0), mean(a.map(x => x[field]))]).sort((x, y) => x[0] - y[0]);
}
V.bpDetail = () => {
  const p = P(), ms = nowMs(), per = S.ui.bpPer || 7;
  const list = p.bp.filter(r => r.t > ms - per * 864e5 && r.t <= ms).sort((a, b) => b.t - a.t);
  let h = topBar({ back: 'Sức khỏe' }) + '<h1 class="t small">Huyết áp</h1>';
  h += `<div class="seg">${[[7, 'Tuần'], [30, 'Tháng'], [90, '3 tháng']].map(o => `<button aria-pressed="${per === o[0]}" data-a="bpPer" data-p="${o[0]}">${o[1]}</button>`).join('')}</div>`;
  if (list.length) {
    const s = Math.round(mean(list.map(r => r.sys))), d = Math.round(mean(list.map(r => r.dia)));
    const word = per === 7 ? 'Tuần này' : per === 30 ? '30 ngày qua' : '3 tháng qua';
    const gs = s < TH.bp.goodSys, gd = d < TH.bp.goodDia;
    const verdict = gs && gd ? 'Trong mục tiêu.' : gs ? 'Số trên đạt mục tiêu, số dưới hơi cao.' : gd ? 'Số dưới đạt mục tiêu, số trên hơi cao.' : 'Hơi cao so với mục tiêu.';
    const pts = dailyAvg(list, 'sys'), ptd = dailyAvg(list, 'dia');
    const lo = Math.min(70, ...ptd.map(x => x[1])) - 5, hi = Math.max(140, ...pts.map(x => x[1])) + 8;
    const xmin = ms - per * 864e5;
    const nl = per === 7 ? [0, 1, 2, 3, 4, 5, 6].map(i => { const t = new Date(ms - i * 864e5).setHours(12, 0, 0, 0); return [t, WD_S[new Date(t).getDay()]]; }) : [0, Math.floor(per / 2), per - 1].map(i => { const t = ms - i * 864e5; return [t, ddmm(t)]; });
    h += `<div class="card"><div class="big">${word} trung bình <b>${s}/${d}</b>. ${verdict}</div>${lineChart({ h: 190, label: `${word} trung bình số trên ${s}, số dưới ${d}. Bảng số đo ở dưới.`, xMin: xmin, xMax: ms, yMin: lo, yMax: hi, lines: [{ v: 130, t: '130' }, { v: 80, t: '80' }], series: [{ pts, color: 'var(--blue)', label: 'Số trên' }, { pts: ptd, color: 'var(--purple)', dash: true, label: 'Số dưới' }], xLabels: nl })}<p class="note" style="margin-top:.4rem">Đường đứt nét xanh lá là mục tiêu: số trên dưới 130, số dưới dưới 80.</p></div>`;
  } else h += `<div class="card"><div class="mid">Chưa có số đo trong giai đoạn này.</div></div>`;
  h += `<button class="btn" data-a="startBP">Ghi số mới</button>`;
  if (list.length) {
    const show = S.ui.bpAll ? list : list.slice(0, 5);
    h += `<div class="rows">${show.map(r => row({ n: `${wdName(r.t)} ${ddmm(r.t)}, ${hhmm(r.t)}`, d: r.by !== 'self' ? `Do ${esc(r.by)} nhập` : (r.src === 'guided' ? 'Trung bình 2 lần cuối' : ''), val: `${r.sys}/${r.dia}`, a: 'bpRowOpen', p: r.id })).join('')}</div>`;
    if (list.length > 5 && !S.ui.bpAll) h += `<button class="link" data-a="bpAllShow">Xem tất cả ${list.length} lần đo</button>`;
  }
  h += `<div class="rows">${row({ icon: 'book', tone: 'blue', n: 'Cách kiểm soát huyết áp', a: 'go', p: 'article:bp' })}${row({ icon: 'heart', tone: 'blue', n: 'Cách đo đúng', a: 'sheetHowTo' })}${row({ icon: 'bell', tone: 'orange', n: 'Lịch nhắc đo', d: p.track.bp ? p.track.bpMoments.map(k => momentOf(k).label).join(', ') : 'Đang tắt', a: 'go', p: 'schedule' })}</div>`;
  return { chrome: 'push', html: h };
};
A.bpPer = v => { S.ui.bpPer = Number(v); S.ui.bpAll = false; render(); };
A.bpAllShow = () => { S.ui.bpAll = true; render(); };
A.bpRowOpen = id => openSheet('bpRow', { id });
V.bpRow = ({ id }) => {
  const r = P().bp.find(x => x.id === id);
  return { title: 'Lần đo', html: `<button class="navbtn" data-a="closeSheet">Đóng</button><div class="center"><div class="num">${r.sys}/${r.dia}</div><div class="sub">${wdName(r.t)} ${ddmmyy(r.t)}, ${hhmm(r.t)}</div></div><button class="btn sec" data-a="startBP" data-p="${id}">Sửa số</button><button class="btn sec" data-a="bpDel" data-p="${id}" style="color:var(--red)">Xóa lần đo này</button>` };
};
A.bpDel = id => dialog({ title: 'Xóa lần đo này?', body: '<p class="sub ink">Số này sẽ không còn trong lịch sử.</p>', buttons: [{ label: 'Giữ lại', a: 'closeDialog' }, { label: 'Xóa', a: 'bpDelYes', p: id, cls: 'sec' }] });
A.bpDelYes = id => { const p = P(); p.bp = p.bp.filter(x => x.id !== id); S.dialog = null; S.sheet = null; persist(); render(); toast('Đã xóa'); };

V.gluDetail = () => {
  const p = P(), ms = nowMs();
  const list = p.glucose.slice().sort((a, b) => b.t - a.t);
  let h = topBar({ back: 'Sức khỏe' }) + '<h1 class="t small">Đường huyết</h1>';
  if (list.length >= 2) {
    const asc = list.slice().reverse().map(r => [r.t, r.v]);
    const f = list.filter(r => r.fasting).slice(0, 7);
    h += `<div class="card">${f.length ? `<div class="big">Lúc đói trung bình <b>${dec(mean(f.map(r => r.v)).toFixed(1))} mmol/L</b> trong ${f.length} lần gần nhất.</div>` : ''}${lineChart({ h: 150, label: 'Đường huyết các lần đo gần đây', xMin: asc[0][0], xMax: ms, yMin: 3, yMax: Math.max(10, ...list.map(r => r.v)) + 1, lines: [{ v: 5.6, t: '5,6' }], series: [{ pts: asc, color: 'var(--purple)' }] })}</div>`;
  }
  h += `<button class="btn" data-a="startGlu">Ghi số mới</button>`;
  if (list.length) h += `<div class="rows">${list.slice(0, 6).map(r => row({ n: `${wdName(r.t)} ${ddmm(r.t)}, ${hhmm(r.t)}`, d: r.fasting ? 'Lúc đói' : 'Sau ăn', val: gluShow(r.v) })).join('')}</div>`;
  h += `<div class="rows">${row({ icon: 'bell', tone: 'orange', n: 'Lịch nhắc đo', d: p.track.glucose ? p.track.gluMoments.map(k => momentOf(k).label).join(', ') : 'Đang tắt', a: 'go', p: 'schedule' })}</div>`;
  return { chrome: 'push', html: h };
};

// ---- Thuốc ----
V.meds = () => {
  const p = P(), ms = nowMs(), active = medsActive(p, ms), a = adherence(p, 30), k = adherenceKey(a);
  let h = topBar({ back: 'Sức khỏe' }) + '<h1 class="t small">Thuốc</h1>';
  if (p.meds.length) {
    const days = [6, 5, 4, 3, 2, 1, 0].map(i => ms - i * 864e5);
    const ico = { full: icon('check'), partial: icon('check'), missed: icon('dash'), none: '', ongoing: '', nodoses: '' };
    h += `<div class="card"><div class="lbl">7 ngày qua</div><div class="daygrid">${days.map(d => { const s = dayDoseState(p, d); return `<div class="day"><span class="dot ${s}" role="img" aria-label="${ddmm(d)}: ${{ full: 'đủ', partial: 'một phần', missed: 'đã bỏ lỡ', none: 'không có ghi nhận', ongoing: 'đang diễn ra', nodoses: 'không có thuốc' }[s]}">${ico[s]}</span>${WD_S[new Date(d).getDay()]}</div>`; }).join('')}</div>
      <p class="note" style="margin-top:.5rem">Vòng đặc: đủ. Viền đậm: một phần. Hôm nay là đang diễn ra. Xám: chưa có ghi nhận hoặc bỏ lỡ.</p></div>`;
    h += `<div class="card"><div class="lbl">30 ngày qua, ${a.due} liều đến hạn</div><div class="sumrow" style="margin-top:.3rem;border:0"><span>Đã dùng</span><b>${a.taken}</b></div><div class="sumrow"><span>Đã bỏ lỡ</span><b>${a.missed}</b></div><div class="sumrow"><span>Không có ghi nhận</span><b>${a.none}</b></div>${k !== 'none' ? `<div class="sub ink" style="margin-top:.5rem">${esc(k === 'good' ? BRD.medGood : BRD.medImprove)}</div>` : ''}</div>`;
    h += `<div class="sec">Đang dùng</div><div class="rows">${active.map(m => row({ icon: 'pill', tone: m.group === 'anticoag' ? 'red' : 'teal', n: `${esc(m.name)} ${esc(m.strength)}`, d: `${esc(m.dose)} · ${m.moments.map(x => momentOf(x).label).join(', ')}`, a: 'go', p: `medDetail:${m.id}` })).join('') || '<div class="row-s"><span class="d">Chưa có thuốc đang dùng</span></div>'}</div>`;
    const off = p.meds.filter(m => !active.includes(m));
    if (off.length) h += `<div class="sec">Đã ngừng hoặc hết đợt</div><div class="rows">${off.map(m => row({ n: `${esc(m.name)} ${esc(m.strength)}`, d: m.paused ? 'Đang tạm dừng' : `Hết ${m.end}`, a: 'go', p: `medDetail:${m.id}` })).join('')}</div>`;
  } else {
    h += '<div class="card"><div class="mid">Chưa có thuốc nào.</div><div class="sub" style="margin-top:.3rem">Thêm thuốc để app nhắc đúng giờ. Người nhà hoặc bệnh viện nhập giúp cũng được.</div></div>';
  }
  h += `<button class="btn" data-a="medNew">${icon('plus')}Thêm thuốc</button>`;
  h += `<div class="rows">${row({ icon: 'bell', tone: 'orange', n: 'Giờ nhắc thuốc', d: 'Sáng, trưa, chiều, tối', a: 'go', p: 'notif' })}${row({ icon: 'book', tone: 'blue', n: 'Hướng dẫn dùng thuốc', a: 'go', p: 'article:meds' })}</div>`;
  return { chrome: 'push', html: h };
};
const GROUP_LABEL = id => (MED_CATALOG.find(g => g.group === id) || { label: 'Thuốc khác' }).label;
V.medDetail = ({ id }) => {
  const p = P(), m = p.meds.find(x => x.id === id);
  if (!m) return { chrome: 'push', html: topBar({ back: 'Thuốc' }) };
  let h = topBar({ back: 'Thuốc' }) + `<h1 class="t small">${esc(m.name)}</h1><div class="sub" style="margin-top:-.35rem">${esc(GROUP_LABEL(m.group))}</div>`;
  h += `<div class="card"><div class="sumrow"><span>Liều</span><b>${esc(m.strength)}, ${esc(m.dose)}</b></div><div class="sumrow"><span>Buổi</span><b>${m.moments.map(x => `${momentOf(x).label} ${momentOf(x).time}`).join(', ')}</b></div><div class="sumrow"><span>Đường dùng</span><b>${esc(m.route)}</b></div><div class="sumrow"><span>Từ ngày</span><b>${esc(m.start)}</b></div><div class="sumrow"><span>Đến ngày</span><b>${m.end ? esc(m.end) : 'Dài hạn'}</b></div>${m.note ? `<div class="sumrow"><span>Lưu ý</span><b>${esc(m.note)}</b></div>` : ''}<div class="sumrow"><span>Nguồn</span><b>${m.source === 'hospital' ? 'Bệnh viện nhập' : 'Tự nhập'}</b></div></div>`;
  h += `<button class="btn sec" data-a="medEdit" data-p="${m.id}">Sửa thông tin thuốc</button><button class="btn sec" data-a="medPause" data-p="${m.id}">${m.paused ? 'Dùng lại' : 'Tạm dừng nhắc'}</button><button class="btn sec" style="color:var(--red)" data-a="medDel" data-p="${m.id}">Xóa thuốc này</button>`;
  return { chrome: 'push', html: h };
};
A.medPause = id => {
  const m = P().meds.find(x => x.id === id);
  if (m.paused) { m.paused = false; persist(); return render(); }
  dialog({ title: 'Tạm dừng nhắc thuốc này?', body: `<p class="sub ink">Chỉ dừng khi bác sĩ đã dặn. ${m.group === 'anticoag' ? 'Tự ngừng thuốc chống đông có thể nguy hiểm.' : 'Đừng tự ngừng thuốc khi chưa hỏi bác sĩ.'}</p>`, buttons: [{ label: 'Giữ nhắc thuốc', a: 'closeDialog' }, { label: 'Bác sĩ đã dặn, tạm dừng', a: 'medPauseYes', p: id, cls: 'sec' }] });
};
A.medPauseYes = id => { P().meds.find(x => x.id === id).paused = true; S.dialog = null; persist(); render(); };
A.medDel = id => dialog({ title: 'Xóa thuốc này?', body: '<p class="sub ink">Thuốc sẽ không còn trong danh sách và thẻ cấp cứu. Lịch sử đã ghi vẫn được giữ.</p>', buttons: [{ label: 'Giữ lại', a: 'closeDialog' }, { label: 'Xóa', a: 'medDelYes', p: id, cls: 'sec' }] });
A.medDelYes = id => { const p = P(); const m = p.meds.find(x => x.id === id); m.end = dayKey(nowMs() - 864e5); m.paused = true; S.dialog = null; S.stack.pop(); persist(); render(); toast('Đã xóa khỏi danh sách'); };

// Thêm thuốc: một màn duy nhất, gần như chỉ chạm
A.medNew = () => { S.ui.med = { name: '', group: '', strength: '', dose: '1 viên', moments: [], days: 30, note: '', route: 'Uống', more: false }; go('medForm'); };
A.medEdit = id => { const m = P().meds.find(x => x.id === id); S.ui.med = Object.assign({}, m, { moments: m.moments.slice(), days: m.end ? -1 : 0, more: false, editId: id }); go('medForm'); };
V.medForm = () => {
  const f = S.ui.med;
  const cat = MED_CATALOG.find(g => g.group === f.group);
  const item = cat && cat.items.find(i => i[0] === f.name);
  const chip = (act, val, label, on) => `<button class="chip ${on ? 'on' : ''}" aria-pressed="${!!on}" data-a="${act}" data-p="${esc(val)}">${label}</button>`;
  let h = topBar({ close: true, closeLabel: 'Hủy' }) + `<h1 class="t small">${f.editId ? 'Sửa thuốc' : 'Thêm thuốc'}</h1>`;
  h += `<div class="rows">${row({ icon: 'pill', tone: 'teal', n: f.name ? esc(f.name) : 'Chọn tên thuốc', d: f.name ? esc(GROUP_LABEL(f.group)) : 'Chọn từ danh sách, không cần gõ', a: 'medPick' })}</div>`;
  if (item) h += `<div><span class="fieldlabel">Hàm lượng</span><div class="chipwrap">${item[1].map(s => chip('medF', `strength|${s}`, esc(s), f.strength === s)).join('')}</div></div>`;
  else if (f.name) h += `<div><label class="fieldlabel" for="fStr">Hàm lượng (nếu biết)</label><input id="fStr" class="input" data-field="medStrength" value="${esc(f.strength)}"></div>`;
  h += `<div><span class="fieldlabel">Mỗi lần dùng</span><div class="chipwrap">${['½ viên', '1 viên', '2 viên', '1 mũi tiêm'].map(s => chip('medF', `dose|${s}`, s, f.dose === s)).join('')}</div></div>`;
  h += `<div><span class="fieldlabel">Dùng vào buổi nào?</span><div class="chipwrap">${MOMENTS.map(m => chip('medM', m.key, `${m.label}<br>${momentOf(m.key).time}`, f.moments.includes(m.key))).join('')}</div></div>`;
  if (!f.editId) h += `<div><span class="fieldlabel">Dùng trong bao lâu?</span><div class="chipwrap">${[[7, '7 ngày'], [30, '30 ngày'], [90, '90 ngày'], [0, 'Dài hạn']].map(o => chip('medF', `days|${o[0]}`, o[1], f.days === o[0])).join('')}</div></div>`;
  h += `<div><span class="fieldlabel">Lưu ý (không bắt buộc)</span><div class="chipwrap">${['Trước ăn', 'Sau ăn', 'Khi đói'].map(s => chip('medF', `note|${f.note === s ? '' : s}`, s, f.note === s)).join('')}</div></div>`;
  if (f.more) h += `<div><span class="fieldlabel">Đường dùng</span><div class="chipwrap">${['Uống', 'Tiêm', 'Ngậm dưới lưỡi', 'Khác'].map(s => chip('medF', `route|${s}`, s, f.route === s)).join('')}</div></div>`;
  else h += '<button class="link left" data-a="medMore">Đường dùng khác (tiêm, ngậm)</button>';
  h += `<button class="btn" data-a="medSave" ${f.name && f.moments.length ? '' : 'disabled'}>Lưu thuốc</button>`;
  if (!f.name || !f.moments.length) h += `<p class="note center">${!f.name ? 'Chọn tên thuốc' : 'Chọn ít nhất một buổi'} để lưu.</p>`;
  return { chrome: 'modal', html: h };
};
A.medF = q => { const i = q.indexOf('|'), k = q.slice(0, i), v = q.slice(i + 1); S.ui.med[k] = k === 'days' ? Number(v) : v; render(); };
A.medM = k => { const l = S.ui.med.moments, i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k); render(); };
A.medMore = () => { S.ui.med.more = true; render(); };
A.medPick = () => openSheet('medPicker');
A.fieldInput = (f, v) => {
  if (f === 'medStrength') S.ui.med.strength = v;
  if (f === 'medOther') S.ui.medOther = v;
  if (f === 'symOther') S.ui.sym.other = v;
  if (f === 'fbText') S.ui.fb.text = v;
  if (f === 'fbEmail') S.ui.fb.email = v;
  if (f === 'histOther') P().history.otherText = v;
  if (f === 'contactName') S.ui.contact.name = v;
  if (f === 'contactTel') S.ui.contact.tel = v;
  if (f === 'name') S.ui.newName = v;
  if (f === 'address') P().address = v;
  if (f === 'pickSearch') { S.ui.pickQ = v; const list = document.getElementById('pickList'); if (list) { list.innerHTML = pickList(); if (D.settings.lang === 'en') translateTree(list); } }
};
function pickList() {
  const q = (S.ui.pickQ || '').toLowerCase();
  return MED_CATALOG.map(g => {
    const it = g.items.filter(i => !q || i[0].toLowerCase().includes(q));
    if (!it.length) return '';
    return `<div class="sec">${g.label}</div><div class="rows">${it.map(i => row({ n: esc(i[0]), a: 'medPicked', p: `${g.group}|${i[0]}` })).join('')}</div>`;
  }).join('');
}
V.medPicker = () => ({ title: 'Chọn thuốc', html: `<button class="navbtn" data-a="closeSheet">Đóng</button><div class="q">Chọn thuốc</div><div><label class="fieldlabel" for="ps">Tìm tên thuốc</label><input id="ps" class="input" data-field="pickSearch" value="${esc(S.ui.pickQ || '')}" autocomplete="off"></div><div id="pickList" style="display:flex;flex-direction:column;gap:.5rem">${pickList()}</div><div class="rows">${row({ n: 'Thuốc khác, không có trong danh sách', a: 'medOther' })}</div>` });
A.medPicked = q => { const [g, n] = q.split('|'), f = S.ui.med; f.group = g; f.name = n; const c = MED_CATALOG.find(x => x.group === g).items.find(i => i[0] === n); f.strength = c[1].length === 1 ? c[1][0] : ''; S.sheet = null; S.ui.pickQ = ''; S.navFocus = true; render(); };
A.medOther = () => { S.ui.medOther = ''; dialog({ title: 'Tên thuốc', body: '<label class="fieldlabel" for="oth">Nhập tên thuốc</label><input id="oth" class="input" data-field="medOther">', buttons: [{ label: 'Xong', a: 'medOtherOk' }, { label: 'Hủy', a: 'closeDialog', cls: 'sec' }] }); };
A.medOtherOk = () => { const n = (S.ui.medOther || '').trim(); if (!n) return; Object.assign(S.ui.med, { name: n, group: 'other', strength: '' }); S.dialog = null; S.sheet = null; render(); };
A.medSave = () => {
  const f = S.ui.med, p = P();
  if (f.editId) {
    const m = p.meds.find(x => x.id === f.editId);
    Object.assign(m, { name: f.name, group: f.group, strength: f.strength, dose: f.dose, moments: f.moments, note: f.note, route: f.route });
    persist(); A.back(); toast('Đã cập nhật lịch nhắc'); return;
  }
  const start = dayKey(nowMs());
  const end = f.days ? dayKey(nowMs() + f.days * 864e5) : null;
  p.meds.push({ id: `m${Date.now()}`, name: f.name, group: f.group, strength: f.strength, dose: f.dose, moments: f.moments.slice(), start, end, note: f.note, route: f.route, source: 'self' });
  persist(); A.back(); toast('Đã thêm. App sẽ nhắc đúng buổi.');
};

// ---- Xét nghiệm: bệnh viện nhập, người bệnh chỉ thêm nếu muốn ----
V.labs = () => {
  const p = P();
  let h = topBar({ back: 'Sức khỏe' }) + '<h1 class="t small">Xét nghiệm</h1><div class="sub ink" style="margin-top:-.3rem">Bệnh viện hoặc bác sĩ nhập. Bạn không cần tự nhập những số này.</div>';
  h += `<div class="card"><div class="sub ink"><b>Mục tiêu LDL của bạn:</b> dưới ${dec(ldlGoal(p, nowMs()))} mmol/L${careGroup(p, nowMs()) === 'secIsch' ? ', bác sĩ có thể đặt mức khác' : ''}.</div></div>`;
  if (p.labs.length) h += `<div class="rows">${p.labs.map(l => row({ icon: 'flask', tone: 'orange', n: esc(l.name), d: `${esc(l.date)} · ${esc(l.source)}`, st: l.status ? statusChip(l.status) : '', val: `${esc(l.v)} ${esc(l.unit).length < 8 ? esc(l.unit) : ''}` })).join('')}</div>`;
  else h += '<div class="card"><div class="mid">Chưa có kết quả.</div><div class="sub" style="margin-top:.25rem">Kết quả sẽ tự xuất hiện khi bệnh viện cập nhật.</div></div>';
  h += `<button class="btn sec" data-a="labAdd">${icon('plus')}Tự thêm từ giấy xét nghiệm</button>`;
  return { chrome: 'push', html: h };
};
A.labAdd = () => openSheet('labPick');
V.labPick = () => ({ title: 'Chọn xét nghiệm', html: `<button class="navbtn" data-a="closeSheet">Đóng</button><div class="q">Xét nghiệm nào?</div><div class="rows">${LAB_TYPES.map((l, i) => row({ n: l.name, d: l.unit, a: 'labChoose', p: String(i) })).join('')}</div>` });
const LAB_TYPES = [{ name: 'LDL cholesterol', unit: 'mmol/L', good: v => v < ldlGoal(P(), nowMs()) }, { name: 'Cholesterol toàn phần', unit: 'mmol/L', good: v => v < 5.2 }, { name: 'HbA1c', unit: '%', good: v => v < 5.7 }, { name: 'Đường huyết tĩnh mạch lúc đói', unit: 'mmol/L', good: v => v <= 5.6 }, { name: 'eGFR', unit: 'mL/phút', good: v => v >= 60 }];
A.labChoose = i => { S.sheet = null; S.ui.labI = Number(i); const l = LAB_TYPES[i]; openNum({ title: l.name, unit: l.unit, comma: true, maxLen: 5, onSave: 'labSaved', min: 0.1, max: 200 }); };
A.labSaved = v => { const p = P(), l = LAB_TYPES[S.ui.labI]; p.labs.unshift({ id: `l${Date.now()}`, name: l.name, v: dec(v), unit: l.unit, date: ddmmyy(nowMs()), status: l.good(v) ? 'good' : 'improve', source: 'Tự nhập' }); persist(); A.back(); toast('Đã thêm'); };

// ---- Yếu tố của bạn: thay cho điểm nguy cơ, đúng BRD ----
function computeFactors(p) {
  const good = [], bad = [], ms = nowMs();
  const tr = bpTrend(p.bp, ms);
  if (tr.count) {
    const k = bpStatus(tr.sys, tr.dia);
    if (k === 'good') good.push({ n: 'Huyết áp trong mục tiêu', d: `Trung bình 7 ngày ${tr.sys}/${tr.dia}`, a: 'go', p: 'bpDetail' });
    else bad.push({ n: k === 'low' ? 'Huyết áp đang thấp' : 'Huyết áp hơi cao', d: 'Theo dõi thường xuyên và tham khảo ý kiến bác sĩ.', a: 'go', p: 'bpDetail' });
  }
  if (p.meds.length) {
    const k = adherenceKey(adherence(p, 30));
    if (k === 'good') good.push({ n: 'Dùng thuốc đều', a: 'go', p: 'meds' });
    else if (k === 'improve') bad.push({ n: 'Dùng thuốc chưa đều', d: 'Tính năng nhắc nhở có thể giúp bạn.', a: 'go', p: 'meds' });
  }
  const f = p.glucose.filter(r => r.fasting).sort((a, b) => b.t - a.t).slice(0, 7);
  if (f.length) { const m = mean(f.map(r => r.v)); (m <= TH.glu.goodFasting ? good : bad).push({ n: m <= TH.glu.goodFasting ? 'Đường huyết lúc đói tốt' : 'Đường huyết lúc đói hơi cao', d: 'Trung bình các lần gần đây', a: 'go', p: 'gluDetail' }); }
  const bmi = bmiOf(p.height, p.weight);
  if (bmi) { const s = bmiStatus(bmi); (s.key === 'good' ? good : bad).push({ n: `Cân nặng: ${s.word.toLowerCase()}`, d: `BMI ${dec(bmi.toFixed(1))}`, a: 'startWeight' }); }
  Object.keys(HABITS).forEach(k => {
    const v = p.habits[k], H = HABITS[k];
    if (v == null || v === 'unknown') return;
    const isG = H.isGood(v);
    const names = { activity: ['Vận động đủ', 'Vận động ít'], smoke: ['Không hút thuốc', 'Đang hút thuốc'], alcohol: ['Hạn chế rượu bia', 'Uống nhiều rượu bia'], diet: ['Ăn uống lành mạnh', 'Ăn uống chưa lành mạnh'] }[k];
    (isG ? good : bad).push({ n: names[isG ? 0 : 1], d: k === 'smoke' && isG ? 'Một trong những quyết định tốt nhất cho sức khỏe.' : (isG ? '' : { activity: 'Hãy cố gắng vận động thêm.', smoke: 'Chúng tôi có thể hỗ trợ nếu bạn muốn bỏ thuốc.', alcohol: 'Hãy cân nhắc giảm dần.', diet: 'Thử giảm món mặn, ngọt, nhiều dầu mỡ.' }[k]), a: 'go', p: `habit:${k}` });
  });
  return { good, bad };
}
V.factors = () => {
  const p = P(), { good, bad } = computeFactors(p), plan = riskPlan(p, nowMs()), remain = riskRemaining(p);
  const unknowns = plan.ids.filter(id => factOf(p, id) === 'unknown');
  const toConfirm = plan.ids.filter(id => NEEDS_CONFIRM.includes(id) && p.facts[id] && p.facts[id].source === 'patient' && p.facts[id].v !== 'unknown');
  let h = topBar({ back: 'Sức khỏe' }) + '<h1 class="t small">Yếu tố của bạn</h1>';
  if (p.stroke) h += '<div class="sub ink" style="margin-top:-.3rem">Các yếu tố còn tồn tại sau đột quỵ.</div>';
  const r = o => `<button class="row-b" data-a="${o.a}" data-p="${esc(o.p || '')}">${icon(o.icon)}<span class="m"><span class="n" style="display:block">${esc(o.n)}</span>${o.d ? `<span class="d" style="display:block">${esc(o.d)}</span>` : ''}</span>${chev()}</button>`;
  if (good.length) h += `<div class="sec green">Đang làm tốt</div><div class="rows">${good.map(o => r(Object.assign({ icon: 'check' }, o)).replace('class="i "', 'class="i green"')).join('')}</div>`;
  if (bad.length) h += `<div class="sec amber">Có thể cải thiện</div><div class="rows">${bad.map(o => r(Object.assign({ icon: 'up' }, o)).replace('class="i "', 'class="i amber"')).join('')}</div>`;
  if (!good.length && !bad.length) h += '<div class="card"><div class="mid">Khi bạn ghi số đo hoặc trả lời vài câu, các yếu tố sẽ hiện ở đây.</div></div>';
  if (remain.length) h += `<div class="card"><div class="mid">Còn ${remain.length} câu giúp bác sĩ đánh giá đầy đủ hơn.</div><button class="btn small" style="margin-top:.6rem" data-a="startRisk">Trả lời</button></div>`;
  if (unknowns.length) h += `<div class="sec">Bác sĩ sẽ hỏi thêm khi tái khám</div><div class="card"><div class="sub ink">${unknowns.map(id => esc(RISK_SHORT[id])).join(' · ')}</div></div>`;
  if (toConfirm.length) h += '<p class="note">Bác sĩ sẽ xem lại các câu trả lời của bạn khi khám.</p>';
  if (plan.reason === 'under55') h += '<p class="note">Thang đánh giá hiện dùng áp dụng từ 55 tuổi, nên bạn không cần trả lời thêm câu hỏi nào.</p>';
  if (plan.reason === 'hemorrhage') h += '<p class="note">Sau chảy máu não, app chưa có thang đánh giá phù hợp. Bác sĩ sẽ theo dõi trực tiếp, bạn không cần trả lời thêm.</p>';
  if (plan.reason === 'unknownType') h += `<div class="card"><div class="mid">Bác sĩ có nói bạn bị loại đột quỵ nào không?</div><button class="btn sec small" style="margin-top:.6rem" data-a="go" data-p="strokeType">Trả lời</button></div>`;
  h += '<p class="note">Bác sĩ của bạn sẽ giải thích đánh giá nguy cơ khi khám. App không hiển thị điểm nguy cơ.</p>';
  return { chrome: 'push', html: h };
};
const RISK_SHORT = { htn: 'Tăng huyết áp', bpmed: 'Thuốc hạ áp', sbp: 'Huyết áp', confirm: 'Xác nhận thông tin', sex: 'Giới tính', smoke: 'Hút thuốc', dm: 'Đái tháo đường', cvd: 'Bệnh tim mạch', af: 'Rung nhĩ', prior: 'Đột quỵ trước đó', pad: 'Hẹp động mạch ở chân', mi: 'Nhồi máu cơ tim', cvdother: 'Bệnh tim khác', chf: 'Suy tim' };

// Hồ sơ đầy dần: mỗi câu một màn, chạm là lưu
A.startRisk = () => { S.ui.riskDetail = false; go('riskQ'); };
V.riskQ = () => {
  const p = P(), plan = riskPlan(p, nowMs()), remain = riskRemaining(p);
  const total = plan.ids.length, done = total - remain.length;
  const id = remain[0];
  if (!id) return { chrome: 'modal', html: `${topBar({ close: true })}<div class="spacer"></div><div class="center">${icon('check', 'green')}<h1 class="q" style="margin-top:.5rem">Xong rồi, cảm ơn bạn</h1><div class="sub ink" style="margin-top:.4rem">Bác sĩ sẽ dùng các câu trả lời này khi khám cho bạn.</div></div><div class="spacer"></div><button class="btn" data-a="back">Xem yếu tố của bạn</button>` };
  const q = RISK_Q[id], opts = q.opts || [['yes', 'Có'], ['no', 'Không'], ['unknown', 'Chưa rõ']];
  if (q.kind === 'num') S.ui.keyTarget = 'riskNum';
  let h = `<div class="top"><button class="navbtn" data-a="back">Để sau</button>${sosBtn()}</div><div class="sub" style="font-weight:600">Câu ${done + 1} trong ${total}</div>`;
  h += `<div class="prog">${plan.ids.map((_, i) => `<i class="${i <= done ? 'on' : ''}"></i>`).join('')}</div>`;
  h += `<h1 class="q" style="margin-top:.7rem">${q.q}</h1><div class="sub ink" style="font-size:1.12rem">${q.help}</div>`;
  h += S.ui.riskDetail ? `<div class="card"><div class="sub ink">${q.detail}</div></div>` : '<button class="link left" data-a="riskMore">Xem chi tiết</button>';
  if (q.kind === 'num') {
    const t = S.ui.riskNum || '';
    h += `<div class="bpbox on"><span class="k">Số trên (mmHg)</span><span class="v ${t ? '' : 'empty'}">${t || '_ _'}</span></div>${keypad()}<div class="yn"><button class="btn small" data-a="riskSbp" ${t.length >= 2 ? '' : 'disabled'}>Lưu</button><button class="btn sec small" data-a="riskAns" data-p="${id}|unknown">Chưa đo</button></div>`;
    return { chrome: 'modal', html: h };
  }
  h += `<div class="chips">${opts.map(o => `<button class="chip tall" data-a="riskAns" data-p="${id}|${o[0]}">${o[1]}</button>`).join('')}</div><div class="spacer"></div>`;
  h += '<div class="card"><div class="sub ink"><b>Vì sao hỏi:</b> giúp bác sĩ của bạn đánh giá đầy đủ hơn. Chưa rõ cũng không sao, bác sĩ sẽ hỏi khi tái khám.</div></div>';
  return { chrome: 'modal', html: h };
};
A.riskSbp = () => {
  const v = Number(S.ui.riskNum);
  if (v < TH.bp.sysMin || v > TH.bp.sysMax) return dialog({ title: 'Bạn kiểm tra lại giúp', body: `<p class="sub ink">Số trên ${v} có vẻ không đúng.</p>`, buttons: [{ label: 'Sửa số', a: 'closeDialog' }, { label: 'Đúng rồi, vẫn lưu', a: 'riskSbpOk', cls: 'sec' }] });
  A.riskSbpOk();
};
A.riskSbpOk = () => { S.dialog = null; A.riskAns(`sbp|${Number(S.ui.riskNum)}`); };
A.riskMore = () => { S.ui.riskDetail = true; render(); };
A.riskAns = q => {
  const [id, v] = q.split('|'), p = P();
  p.facts[id] = { v, source: 'patient', by: whoEntered(), t: nowMs() };
  if ((id === 'htn' || id === 'dm' || id === 'af') && v !== 'unknown') p.history[id] = v === 'yes';
  if (id === 'sbp') S.ui.riskNum = '';
  if (id === 'sex') { p.sex = v; p.facts.sex.v = v === 'other' ? 'unknown' : v; }
  if (id === 'smoke' && v !== 'unknown') { p.habits.smoke = v === 'no' ? 'none' : (p.habits.smoke && p.habits.smoke !== 'none' ? p.habits.smoke : 'mid'); }
  S.ui.riskDetail = false; persist(); render(); document.getElementById('view').scrollTop = 0;
};
V.strokeType = () => {
  const p = P();
  let h = topBar({ close: true }) + '<h1 class="q">Bác sĩ có nói bạn bị loại đột quỵ nào không?</h1><div class="chips">';
  [['ischemic', 'Tắc mạch máu não (nhồi máu não)'], ['hemorrhage', 'Vỡ mạch máu não (chảy máu não)'], ['tia', 'Cơn thoáng qua, tự hết (TIA)'], ['unknown', 'Không nhớ']].forEach(o => { h += `<button class="chip left tall ${p.strokeType === o[0] ? 'on' : ''}" style="font-size:1.2rem" data-a="strokeTypeSet" data-p="${o[0]}">${o[1]}</button>`; });
  h += '</div><p class="note">Không nhớ cũng không sao. App vẫn nhắc thuốc, theo dõi và tái khám bình thường. Bệnh viện sẽ bổ sung sau.</p>';
  return { chrome: 'modal', html: h };
};
A.strokeTypeSet = v => { P().strokeType = v; persist(); A.back(); };

// ---- Triệu chứng: có đang xảy ra thì đưa thẳng tới 115 ----
const SYMPTOMS = ['Yếu hoặc tê liệt một bên cơ thể', 'Mất hoặc giảm thị lực đột ngột', 'Khó nói hoặc nói ngọng', 'Mất thăng bằng hoặc chóng mặt nghiêm trọng', 'Đau đầu dữ dội, khác thường'];
V.symptoms = () => {
  const p = P(); S.ui.sym = S.ui.sym || { list: [], other: '', step: 1 };
  const s = S.ui.sym;
  let h = topBar({ close: true, closeA: 'symClose' });
  if (s.step === 1) {
    h += '<h1 class="t small">Có điều gì khác thường?</h1><div class="sub ink" style="margin-top:-.3rem">Chọn những gì bạn thấy.</div>';
    h += `<div class="chips">${SYMPTOMS.map(x => `<button class="chip left ${s.list.includes(x) ? 'on' : ''}" aria-pressed="${s.list.includes(x)}" data-a="symT" data-p="${esc(x)}">${x}</button>`).join('')}</div>`;
    h += `<div><label class="fieldlabel" for="so">Triệu chứng khác (không bắt buộc)</label><input id="so" class="input" data-field="symOther" value="${esc(s.other)}"></div>`;
    h += `<button class="btn" data-a="symNext" ${s.list.length || s.other ? '' : 'disabled'}>Tiếp</button>`;
    if (p.symptoms.length) h += `<div class="sec">Đã ghi trước đây</div><div class="rows">${p.symptoms.slice().reverse().map(x => row({ n: esc(x.list.join(', ')), d: `${ddmmyy(x.t)} · ${x.visited ? 'Đã đi khám' : 'Chưa đi khám'}` })).join('')}</div>`;
  } else if (s.step === 2) {
    h += '<h1 class="q">Dấu hiệu này có đang xảy ra ngay lúc này không?</h1><div class="chips"><button class="btn red tall" data-a="symNow">Có, đang xảy ra</button><button class="btn sec tall" data-a="symPast">Không, đã hết</button></div>';
  } else {
    h += '<h1 class="q">Dù đã hết, bạn vẫn nên báo bác sĩ ngay.</h1><div class="sub ink">Dấu hiệu đột quỵ có thể tự hết rồi quay lại nặng hơn.</div>';
    h += `<button class="btn" data-a="call" data-p="${esc(p.careTeam.phone)}|bác sĩ">${icon('phone')}Gọi bác sĩ</button>`;
    h += '<div class="card"><div class="mid">Bạn đã đi khám hoặc điều trị chưa?</div><div class="yn" style="margin-top:.6rem"><button class="chip" data-a="symDone" data-p="1">Có</button><button class="chip" data-a="symDone" data-p="0">Chưa</button></div></div>';
  }
  return { chrome: 'modal', html: h };
};
A.symT = x => { const l = S.ui.sym.list, i = l.indexOf(x); if (i >= 0) l.splice(i, 1); else l.push(x); render(); };
A.symNext = () => { S.ui.sym.step = 2; S.navFocus = true; render(); };
function symSave(visited) { const s = S.ui.sym, p = P(); p.symptoms.push({ t: nowMs(), list: s.list.concat(s.other ? [s.other] : []), visited: !!visited, by: whoEntered() }); persist(); }
A.symNow = () => { symSave(false); S.ui.sym = null; S.stack.pop(); openSheet('sos'); };
A.symPast = () => { S.ui.sym.step = 3; S.navFocus = true; render(); };
A.symDone = v => { symSave(v === '1'); S.ui.sym = null; A.back(); toast('Đã ghi lại cho bác sĩ'); };
A.symClose = () => { S.ui.sym = null; A.back(); };

// ---- Theo dõi của bạn: nội dung riêng theo nhóm tiên phát, thứ phát. Nguồn từng mục hiện ở bảng điều khiển demo. ----
function carePlanItems(p, ms) {
  const g = careGroup(p, ms), sec = g.startsWith('sec'), items = [];
  const moments = p.track.bp ? p.track.bpMoments.map(k => momentOf(k).label.toLowerCase()).join(' và ') : '';
  const ap = nextAppt(p), habits = 'Không hút thuốc, hạn chế rượu bia, ăn nhạt, vận động đều.';
  const add = (s, icon, tone, n, d, a, q, src) => items.push({ s, icon, tone, n, d, a, p: q, src });
  if (p.meds.length || sec) add('Mỗi ngày', 'pill', 'teal', 'Dùng thuốc đúng giờ', 'Không tự ngừng hay đổi liều. Quên liều thì hỏi bác sĩ hoặc dược sĩ.', 'go', 'meds', sec ? 'BRD: Tuân thủ dùng thuốc' : 'BRD: Nhắc uống thuốc cho người nguy cơ cao hoặc huyết áp cao');
  if (g === 'priYoung') {
    add('Khi bạn muốn', 'heart', 'blue', 'Đo huyết áp', 'Khi đi khám hoặc khi bạn muốn biết. Mục tiêu dưới 130/80.', 'go', 'bpDetail', 'BRD: Chỉ số tốt của huyết áp. Tần suất do demo đề xuất');
  } else {
    add('Mỗi ngày', 'heart', 'blue', 'Đo huyết áp', `${p.track.bp ? `Buổi ${moments}. ` : 'Bạn đang tắt nhắc đo. '}Mục tiêu dưới 130/80.`, 'go', p.track.bp ? 'bpDetail' : 'schedule', sec ? 'BRD: Sáng và chiều, dưới 130/80. Nhận xét TestFlight: AHA/ASA 2021 cho người đã đột quỵ' : 'BRD: Sáng và chiều nếu chọn theo dõi, dưới 130/80');
  }
  if (p.track.glucose || p.history.dm) add('Mỗi ngày', 'drop', 'purple', 'Đo đường huyết', 'Lúc đói, mục tiêu không quá 5,6 mmol/L, hoặc theo mức bác sĩ dặn.', 'go', p.track.glucose ? 'gluDetail' : 'schedule', 'BRD: Đường huyết lúc đói');
  add('Mỗi tuần', 'walk', 'green', 'Một câu về thói quen', habits, 'go', 'schedule', 'BRD: Thói quen sinh hoạt. Hỏi mỗi tuần theo gợi ý của điều phối');
  if (sec) {
    add('Theo lịch khám', 'cal', 'orange', 'Tái khám đúng hẹn', `${ap ? `Lần tới ${ddmm(ap.t)}. ` : ''}1 tháng sau xuất viện, sau đó 3 tháng nếu kết quả tốt, 1 tháng nếu chưa tốt.`, 'tab', 'visit', 'BRD: Mục 3.2 Tái khám');
    if (g === 'secIsch') add('Theo lịch khám', 'flask', 'orange', 'Mỡ máu (LDL)', 'Mục tiêu thường dưới 1,8 mmol/L, bác sĩ sẽ đặt cho bạn.', 'go', 'labs', 'Nhận xét TestFlight: AHA/ASA 2021, chờ bác sĩ chốt. BRD chỉ có một mức chung 2,6');
    if (g === 'secHem') add('Theo lịch khám', 'pill', 'orange', 'Hỏi bác sĩ trước khi dùng thuốc mới', 'Đặc biệt là aspirin và thuốc chống đông.', 'go', 'meds', 'Demo đề xuất, chưa có trong BRD, chờ bác sĩ chốt');
    if (g === 'secUnknown') add('Theo lịch khám', 'doc', 'orange', 'Hỏi bác sĩ loại đột quỵ của bạn', 'Để app đưa hướng dẫn đúng với bạn hơn.', 'go', 'strokeType', 'BRD: Tiền sử bệnh đột quỵ');
    add('Khi có điều khác thường', 'alert', 'red', 'Ghi và báo triệu chứng mới', 'Đang xảy ra thì gọi 115 ngay. Đã hết vẫn báo bác sĩ.', 'go', 'symptoms', 'BRD: Các triệu chứng, FAST');
  } else {
    add('Mỗi tháng', 'scale', 'purple', 'Cân nặng', 'BMI bình thường từ 18,5 đến 22,9.', 'startWeight', '', 'BRD: Ngưỡng BMI của Bộ Y tế. Tần suất do demo đề xuất');
    if (g === 'pri55') add('Khi đi khám', 'flask', 'orange', 'Xét nghiệm', 'Cholesterol dưới 5,2, LDL dưới 2,6 mmol/L, HbA1c dưới 5,7%.', 'go', 'labs', 'BRD: Bảng PreventStroke');
    add('Khi có điều khác thường', 'alert', 'red', 'Nhận biết dấu hiệu đột quỵ', 'Chỉ cần một dấu hiệu, hãy gọi 115 ngay.', 'go', 'signs', 'BRD: Thông tin cần biết về đột quỵ');
  }
  return items;
}
V.carePlan = () => {
  const p = P(), ms = nowMs(), g = careGroup(p, ms), intro = CARE_INTRO[g], items = carePlanItems(p, ms);
  let h = topBar({ back: 'Sức khỏe' }) + '<h1 class="t small">Theo dõi của bạn</h1>';
  h += `<div class="card"><div class="big">${intro.title}</div><div class="sub ink" style="margin-top:.3rem">${intro.why}</div></div>`;
  [...new Set(items.map(i => i.s))].forEach(s => {
    h += `<div class="sec">${s}</div><div class="rows">${items.filter(i => i.s === s).map(i => row({ icon: i.icon, tone: i.tone, n: i.n, d: i.d, a: i.a, p: i.p })).join('')}</div>`;
  });
  const remain = riskRemaining(p);
  if (remain.length) h += `<div class="card"><div class="mid">Còn ${remain.length} câu giúp bác sĩ đánh giá đầy đủ hơn.</div><button class="btn small" style="margin-top:.6rem" data-a="startRisk">Trả lời</button></div>`;
  h += '<p class="note">Nội dung mẫu cho bản demo, chờ bác sĩ duyệt. Hãy theo chỉ định của bác sĩ đang điều trị cho bạn.</p>';
  return { chrome: 'push', html: h };
};
