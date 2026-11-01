/* VNPreventStroke (demo) · hồ sơ bệnh nhân (drawer / toàn trang) */
(function (g) {
  'use strict';
  const V = g.VNPS, T = V.T, R = V.rules, D = V.data, U = V.ui, Ins = V.ins, esc = U.esc, ic = U.ic;
  const W = (V.views = V.views || {});
  const S = () => V.S;
  const num = R.num;

  W.PTABS = [['sum', 'Tóm tắt'], ['risk', 'Nguy cơ'], ['vit', 'Chỉ số'], ['med', 'Thuốc'], ['life', 'Lối sống'], ['visit', 'Tái khám'], ['msg', 'Tin nhắn'], ['adv', 'Lời khuyên'], ['note', 'Ghi chú, cảnh báo']];
  const STAT = { new: ['Mới', 'watch'], doing: ['Đang xử lý', 'neutral'], done: ['Đã xử lý', 'ok'] };

  /* ---------- hồ sơ một trang: phần đầu ---------- */
  const lvlName = { act: 'Cần can thiệp', watch: 'Cần theo dõi', ok: 'Ổn định' };
  W.pdHead = (p, mode) => {
    const c = S().cls[p.id], sn = W.snoozeOf(p), s = S();
    return '<div class="ph">' + U.av(p, c.level) + '<div class="ph-t"><h2>' + esc(p.name) + '</h2><div class="ph-s">' + p.age + ' tuổi · ' + U.sexName(p) + ' · ' + esc(U.dx(p)) + ' · <a href="#" data-a="pinfo" data-id="' + p.id + '">Thông tin liên hệ</a></div></div>' +
      '<span class="pill ' + c.level + '">' + ic(U.lvl[c.level].ic) + lvlName[c.level] + '</span>' +
      (W.handled(p) && !sn ? '<span class="chip ok">' + ic('check') + 'Đã xử lý</span>' : '') + (sn && sn.active ? '<span class="chip neutral">' + ic('calendar') + 'Xem lại ' + T.fmtDM(sn.until) + '</span>' : '') +
      '<span style="flex:1"></span><button class="btn primary" data-a="call" data-id="' + p.id + '">' + ic('phone') + 'Gọi</button><button class="btn" data-a="ptab" data-t="msg">' + ic('msg') + 'Nhắn</button><button class="btn" data-a="apnew" data-id="' + p.id + '">' + ic('calendar') + 'Đặt lịch</button><button class="btn" data-a="entry" data-id="' + p.id + '">' + ic('plus') + 'Nhập hộ</button>' +
      '<span class="pdmenu"><button class="btn" data-a="pdmenu" aria-label="Thêm thao tác" aria-expanded="' + !!s.pdmenu + '">···</button>' + (s.pdmenu ? '<div class="menu"><button data-a="advnew" data-id="' + p.id + '">' + ic('star') + 'Gửi lời khuyên</button><button data-a="ptab" data-t="note">' + ic('list') + 'Ghi chú, cảnh báo</button><button data-a="print" data-id="' + p.id + '">' + ic('print') + 'In, xuất tóm tắt</button></div>' : '') + '</span>' +
      (mode === 'drawer' ? '<button class="iconbtn" data-a="close" aria-label="Đóng hồ sơ">' + ic('x') + '</button>' : '<button class="btn" data-a="back">' + ic('chevL') + 'Quay lại</button>') + '</div>';
  };
  W.infoModal = (p) => {
    const row = (k, v) => '<tr><td class="muted" style="width:150px">' + k + '</td><td>' + v + '</td></tr>';
    U.modal(W.modalHead('Thông tin liên hệ: ' + p.name) + '<div class="mbox-b"><table class="tbl plain"><tbody>' + row('Mã', '<b>' + p.id + '</b>') + row('Điện thoại', p.phone + ' <span class="tag">giả</span>') + row('Người thân', p.family ? '<b>' + esc(p.family.name) + '</b> (' + esc(p.family.rel) + ') ' + p.family.phone : 'Chưa kết nối') + row('Cơ sở', U.site(p)) + row('BS phụ trách', esc(p.doctor) + (p.coDoctor ? ' · phối hợp ' + esc(p.coDoctor) : '')) + row('Chẩn đoán', esc(U.dx(p)) + (p.dx.type === 'NONE' && p.dx.reg != null ? ' · đăng ký ' + T.fmtDMY(p.dx.reg) : '')) + (p.dx.nihss != null ? row('NIHSS lúc vào', p.dx.nihss) : '') + (p.dx.mrs != null ? row('mRS gần nhất', p.dx.mrs) : '') + row('Chia sẻ dữ liệu', 'Đồng ý' + (p.consentAdh ? '' : ' · <span class="chip watch xs">Chưa cho phép chia sẻ tuân thủ thuốc</span>')) + '</tbody></table></div>');
  };
  W.pdoneModal = (p) => {
    U.modal(W.modalHead('Xử lý: ' + p.name) + '<div class="mbox-b"><div class="qnote">' + ['Đã gọi BN', 'Đã nhắn BN', 'Đã hẹn khám'].map((t) => '<button class="btn sm" data-a="qchip" data-v="' + t + '" data-id="' + p.id + '">' + t + '</button>').join('') + '</div><label class="f">Ghi chú (bắt buộc khi đánh dấu đã xử lý)<input type="text" data-i="qnote" data-id="' + p.id + '" value="' + esc(S().qnotes[p.id] || '') + '"></label><div class="qmsgbox"></div><div class="xs muted">Mức theo dõi không đổi vì tính từ dữ liệu.</div></div><div class="mbox-f"><span class="small muted" style="margin-right:auto;align-self:center">Xem lại sau</span>' + [1, 3, 7].map((n) => '<button class="btn" data-a="qsnooze" data-n="' + n + '" data-id="' + p.id + '">' + n + ' ngày</button>').join('') + '<button class="btn primary" data-a="qdone" data-id="' + p.id + '">Đã xử lý</button></div>');
  };

  /* ---------- hồ sơ một trang: ô chỉ số tô màu theo đúng mức của rules.js, không thêm ngưỡng ---------- */
  const lvOf = (p, codes, state) => {
    const rs = S().cls[p.id].reasons.filter((r) => codes.includes(r.code));
    if (rs.some((r) => r.level === 'act')) return 'act';
    if (rs.length || state === 'bad') return 'watch';
    return state === 'ok' ? 'ok' : 'none';
  };
  const reasonOf = (p, codes) => S().cls[p.id].reasons.find((r) => codes.includes(r.code));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const otile = (lv, t, m, label, value, unit, note) => '<button class="otile ' + lv + '" data-a="ptab" data-t="' + t + '"' + (m ? ' data-m="' + m + '"' : '') + '><span class="l">' + label + '</span><span class="v">' + value + (unit ? ' <small>' + unit + '</small>' : '') + '</span><span class="n">' + (lv === 'none' ? '' : U.mark(lv)) + '<span>' + note + '</span></span></button>';
  W.ovTiles = (p) => {
    const I = R.ind(p), c = R.cfg, lb = I.bp.last, out = [];
    const bpCodes = ['bp-crit', 'bp-avg3', 'bp-avg7'], bpLv = lvOf(p, bpCodes, I.bp.state);
    out.push(otile(bpLv, 'vit', 'bp', 'Huyết áp TB 7 ngày', I.bp.avg7 ? I.bp.avg7.s + '/' + I.bp.avg7.dia : '—', I.bp.avg7 ? 'mmHg' : '', lb ? 'Gần nhất ' + lb.s + '/' + lb.dia + (I.bp.avg7 ? '' : ', ' + T.fmtDM(lb.d)) : 'Chưa có số đo'));
    const adCodes = ['miss-ac', 'hr-adh', 'adh'], adLv = p.consentAdh ? lvOf(p, adCodes, I.adh.state) : 'none', adR = reasonOf(p, ['miss-ac']);
    out.push(otile(adLv, 'med', '', 'Tuân thủ thuốc', I.adh.v ? I.adh.v.pct + '%' : '—', '', !p.consentAdh ? 'BN chưa chia sẻ' : !I.adh.v ? 'Chưa có dữ liệu' : adR ? cap(adR.text) : I.adh.state === 'ok' ? 'Đạt mục tiêu ≥' + c.adhOk + '%' : 'Dưới mục tiêu ≥' + c.adhOk + '%'));
    const gluLv = lvOf(p, ['glu'], I.glu.state);
    out.push(otile(gluLv, 'vit', 'glu', 'Đường huyết đói', I.glu.last ? R.num(I.glu.last.v, 1) : '—', I.glu.last ? 'mmol/L' : '', !I.glu.last ? 'Chưa có số đo' : gluLv === 'act' ? 'Ngoài ngưỡng an toàn' : gluLv === 'ok' ? 'Đạt mục tiêu ≤5,6' : 'Trên mục tiêu ≤5,6'));
    const a1cT = (p.rf.dm === 1 ? '≤' : '<') + R.num(I.a1c.target, 1), a1cLv = lvOf(p, ['a1c'], I.a1c.state);
    out.push(otile(a1cLv, 'vit', 'lab', 'HbA1c', I.a1c.last ? R.num(I.a1c.last.v, 1) : '—', I.a1c.last ? '%' : '', !I.a1c.last ? 'Chưa có xét nghiệm' : a1cLv === 'ok' ? 'Đạt mục tiêu ' + a1cT : 'Trên mục tiêu ' + a1cT));
    const ldlLv = lvOf(p, ['ldl'], I.ldl.state), ldlT = '<' + R.num(I.ldl.target, 1);
    out.push(otile(ldlLv, 'vit', 'lab', 'LDL-C', I.ldl.last ? R.num(I.ldl.last.v, 1) : '—', I.ldl.last ? 'mmol/L' : '', !I.ldl.last ? 'Chưa có xét nghiệm' : ldlLv === 'ok' ? 'Đạt mục tiêu ' + ldlT : 'Trên mục tiêu ' + ldlT));
    const w = R.lastW(p);
    out.push(otile(w ? lvOf(p, [], I.bmi.state) : 'none', 'vit', 'w', 'BMI', w ? R.num(I.bmi.v, 1) : '—', w ? 'kg/m²' : '', w ? cap(I.bmi.label) : 'Chưa có số đo'));
    return '<div class="otiles">' + out.join('') + '</div>';
  };

  /* ---------- hồ sơ một trang: các thẻ ---------- */
  const more = (t, label, m) => '<button class="lnk" data-a="ptab" data-t="' + t + '"' + (m ? ' data-m="' + m + '"' : '') + '>' + label + '</button>';
  W.bpLane = (p, from) => {
    if (!p.consentAdh) return null;
    const byDay = {}; R.misses(p, from, false).forEach((m) => { (byDay[m.d] = byDay[m.d] || []).push(m); });
    return Object.keys(byDay).map(Number).map((d) => ({ d, crit: byDay[d].some((m) => D.isCrit(m.cls)), tip: T.fmtDM(d) + ' · bỏ ' + byDay[d].map((m) => m.med + ' ' + m.time).join(', ') }));
  };
  W.bpChart = (p, rg, w, h) => {
    const c = R.cfg, from = -(rg - 1), L = p.bp.filter((x) => x.d >= from);
    const mk = (k, over, crit) => L.map((x) => ({ x: x.d + x.h / 24, y: x[k], over: x[k] >= over, crit: x[k] >= crit, tip: U.dt(x.d, x.h) + ' · ' + x.s + '/' + x.dia + ' mmHg · ' + x.src }));
    return U.lineChart({ w, h, rr: 132, series: [{ name: 'Tâm thu', color: 'var(--s1)', pts: mk('s', c.avg7Sys, c.critSys) }, { name: 'Tâm trương', color: 'var(--s2)', shape: 'square', pts: mk('dia', c.avg7Dia, c.critDia) }], ticks: [40, 80, 120, 160, 200], yUnit: 'mmHg', xFrom: from, xTo: 0, lane: W.bpLane(p, from), refs: [{ y: c.critSys, color: 'var(--act)', label: 'Tâm thu ≥' + c.critSys }, { y: c.bpTargetS, color: 'var(--ok)', label: 'Mục tiêu tâm thu <' + c.bpTargetS }, { y: c.critDia, color: 'var(--act)', label: 'Tâm trương ≥' + c.critDia }, { y: c.bpTargetD, color: 'var(--ok)', label: 'Mục tiêu tâm trương <' + c.bpTargetD }], label: 'Huyết áp ' + rg + ' ngày. ' + Ins.bpSentence(p, rg) });
  };
  W.bpLegend = (p, full) => { const c = R.cfg; return '<div class="legend"><span><svg class="lgm" viewBox="0 0 12 12"><circle cx="6" cy="6" r="3.6" fill="var(--s1)"/></svg>Tâm thu</span><span><svg class="lgm" viewBox="0 0 12 12"><rect x="2.4" y="2.4" width="7.2" height="7.2" fill="var(--s2)"/></svg>Tâm trương</span><span>Tô đặc: ≥' + c.avg7Sys + '/' + c.avg7Dia + '</span><span><svg class="lgm" viewBox="0 0 12 12"><rect x="3" y="3" width="6" height="6" transform="rotate(45 6 6)" fill="var(--act)"/></svg>Chạm mốc ' + c.critSys + '/' + c.critDia + '</span>' + (p.consentAdh ? '<span>✕ bỏ liều chống đông/kháng tiểu cầu · • thuốc khác</span>' : '') + (full ? '<span>Ngày không có số đo để trống, không nội suy</span>' : '') + '</div>'; };
  const chartCard = (p) => {
    const rg = S().pv.range, L = p.bp.filter((x) => x.d >= -(rg - 1)), lb = R.lastBP(p);
    const rseg = (k) => '<button class="' + (rg === k ? 'on' : '') + '" data-a="pvr" data-v="' + k + '">' + k + ' ngày</button>';
    return '<section class="card ocard ochart"><div class="och"><h3>Huyết áp</h3><div class="seg">' + rseg(7) + rseg(30) + '</div><span style="flex:1"></span>' + more('vit', 'Bảng số đo', 'bp') + '</div>' +
      (L.length ? U.chartSay(Ins.bpSentence(p, rg)) + W.bpLegend(p) + '<div class="ovc" id="ovchart" data-id="' + p.id + '"></div>' : '<div class="empty" style="margin:auto">Chưa có số đo trong ' + rg + ' ngày qua.' + (lb ? ' Lần gần nhất: ' + lb.s + '/' + lb.dia + ' mmHg, ' + esc(U.dt(lb.d, lb.h)) + '.' : '') + '</div>') + '</section>';
  };
  W.fitChart = () => {
    const b = document.getElementById('ovchart'); if (!b) return;
    b.innerHTML = ''; const w = b.clientWidth, h = b.clientHeight;
    if (w > 0 && h > 0) b.innerHTML = W.bpChart(V.byId[b.dataset.id], S().pv.range, w, h);
  };
  const lifeCard = (p) => {
    const L = p.life, I = R.ind(p), it = (st, v, u) => '<div>' + '<b>' + (st ? U.mark(st) : '') + v + '</b><span>' + u + '</span></div>', mp = (s) => (s === 'bad' ? 'watch' : s === 'ok' ? 'ok' : null);
    return '<section class="card ocard"><div class="och"><h3>Lối sống</h3><span style="flex:1"></span>' + more('life', 'Chi tiết') + '</div><div class="olife">' + it(mp(I.smoke.state), L.cig === 0 ? 'Không' : L.cig, L.cig === 0 ? 'hút thuốc' : 'điếu/ngày') + it(mp(I.alc.state), R.num(L.alc, 1), 'đơn vị rượu/ngày') + it(mp(I.ex.state), L.ex, 'phút vận động/tuần') + it(L.sleep >= 7 ? 'ok' : 'watch', R.num(L.sleep, 1), 'giờ ngủ/đêm') + '<div class="diet" title="' + esc(L.diet) + '"><b>Ăn uống</b><span>' + esc(L.diet) + '</span></div></div></section>';
  };
  const todoCard = (p) => {
    const c = S().cls[p.id], rs = W.levelReasons(p), a = W.actionOf(p), muted = W.muted(p), sn = W.snoozeOf(p), lv = c.level;
    if (!c.reasons.length) return '<section class="card ocard"><div class="och"><h3 class="lv-ok">' + U.mark('ok') + 'Không có cảnh báo</h3><span style="flex:1"></span>' + more('sum', 'Tóm tắt') + '</div></section>';
    const lastDone = rs.map((r) => W.alertState(p.id, r.code)).filter((x) => x.status === 'done').pop();
    return '<section class="card ocard"><div class="och"><h3 class="lv-' + lv + '">' + U.mark(lv) + 'Cần xử lý</h3><span style="flex:1"></span>' + more('note', 'Tất cả ' + c.reasons.length) + '</div><ul class="otodo">' +
      rs.map((r) => { const d = W.alertState(p.id, r.code).status === 'done'; return '<li' + (d ? ' class="isdone"' : '') + '><b>' + esc(cap(r.text)) + '</b>' + (d ? ' <span class="xs muted">· đã xử lý</span>' : '') + (r.code === 'appt' ? '' : ' <span class="xs muted">' + esc(R.stamp(r.at.d, r.at.h)) + '</span>') + '</li>'; }).join('') + '</ul>' +
      (a && !muted ? '<div class="osug">' + ic('spark') + '<div><b>Gợi ý, bác sĩ quyết định:</b> ' + esc(W.TODO[a.reason.code](p)) + '</div></div>' : '') +
      (muted ? '<div class="ofoot"><span class="small muted" style="flex:1">' + (sn && sn.active ? 'Xem lại ' + T.fmtDM(sn.until) + (sn.note ? ' · ' + esc(sn.note) : '') : 'Đã xử lý' + (lastDone ? ' · ' + esc(lastDone.note) : '')) + '</span><button class="btn sm" data-a="qundo" data-id="' + p.id + '">Hoàn tác</button></div>' : '<div class="ofoot"><button class="btn sm primary" data-a="pdone" data-id="' + p.id + '">Đã xử lý</button><button class="btn sm" data-a="pdone" data-id="' + p.id + '">Xem lại sau</button></div>') + '</section>';
  };
  const riskCard = (p) => {
    const s = R.patientScales(p), rows = [], mp = { high: 'act', mid: 'watch', low: 'ok' };
    const add = (r, name) => { if (!r.applicable) return; if (r.score == null || !r.tier) { rows.push([null, name, r.insufficient ? 'Chưa đủ dữ liệu' : '—']); return; } rows.push([mp[r.tier.key] || null, name, r.score + (r.partial ? '*' : '') + ' · ' + r.tier.label]); };
    add(s.esrs, 'ESRS'); add(s.spi, 'SPI-II'); add(s.cha, 'CHA₂DS₂-VASc');
    if (p.dx.type === 'CMN') rows.push([null, 'ESRS, SPI-II', 'Không áp dụng (chảy máu não)']);
    if (p.dx.type === 'NONE') rows.push([null, 'FSRP', !s.fsrp.applicable ? 'Chưa áp dụng (<55 tuổi)' : s.fsrp.insufficient ? 'Thiếu dữ liệu' : s.fsrp.pct + '% (minh họa)']);
    return '<section class="card ocard"><div class="och"><h3>Mức nguy cơ</h3><span style="flex:1"></span>' + more('risk', 'Chi tiết') + '</div><div class="olist">' + (rows.length ? rows.map(([lv, n, v]) => '<div class="oln">' + (lv ? U.mark(lv) : '<span class="mk mk-none"></span>') + '<span>' + esc(n) + '</span><b class="' + (lv ? 'lv-' + lv : 'muted') + '">' + esc(v) + '</b></div>').join('') : '<div class="oln muted">Chưa có thang áp dụng</div>') + '</div></section>';
  };
  const medCard = (p) => {
    const ms = R.misses(p, -7, true).filter((m) => m.d <= -1);
    const per = (m) => { let t = 0, x = 0; m.log.forEach((c) => { for (const ch of c) { if (ch === 'T') t++; else if (ch === 'M') x++; } }); return t + x ? Math.round(100 * t / (t + x)) : null; };
    const rows = p.meds.map((m) => {
      const pc = p.consentAdh ? per(m) : null, miss = p.consentAdh ? ms.filter((x) => x.med === m.name).length : 0;
      const lv = miss ? 'act' : pc == null ? null : pc >= R.cfg.adhOk ? 'ok' : 'watch', notes = [];
      if (miss) notes.push('bỏ ' + miss + ' liều'); if (m.supply <= 7) notes.push('còn ' + m.supply + ' ngày');
      return '<div class="oln" title="' + esc(m.name + ' ' + m.dose + ' · ' + m.sig) + '">' + (lv ? U.mark(lv) : '<span class="mk mk-none"></span>') + '<span>' + esc(m.name) + '</span>' + (notes.length ? '<span class="onote ' + (miss ? 'lv-act' : 'lv-watch') + '">' + notes.join(' · ') + '</span>' : '') + '<b class="' + (lv ? 'lv-' + lv : 'muted') + '">' + (pc == null ? '—' : pc + '%') + '</b></div>';
    }).join('');
    return '<section class="card ocard omed"><div class="och"><h3>Thuốc</h3><span style="flex:1"></span>' + more('med', 'Lịch 30 ngày') + '</div><div class="olist">' + (rows || '<div class="oln muted">Chưa ghi nhận thuốc</div>') + (!p.consentAdh && p.meds.length ? '<div class="oln xs muted">BN chưa cho phép chia sẻ tuân thủ</div>' : '') + '</div></section>';
  };
  const visitCard = (p) => {
    const a = p.appt, pe = R.pending(p), over = a.d < 0 && a.status !== 'done', prep = W.prepDue(p);
    return '<section class="card ocard"><div class="oln oline">' + ic('calendar') + '<span>Tái khám <b>' + T.fmtDM(a.d) + '</b>, ' + a.time + '</span>' + (over ? '<span class="onote lv-act">quá hẹn ' + -a.d + ' ngày</span>' : a.d === 0 ? '<span class="onote lv-watch">hôm nay</span>' : '') + '<span style="flex:1"></span>' + (prep ? more('sum', 'Chuẩn bị khám') : more('visit', 'Lịch sử')) + '</div>' +
      (pe ? '<div class="oln oline" title="' + esc(pe.text) + '">' + ic('msg') + '<span class="onowrap">Tin chờ ' + Math.max(1, Math.floor(pe.hours)) + ' giờ: "' + esc(pe.text) + '"</span>' + more('msg', 'Trả lời') + '</div>' : '') + '</section>';
  };
  W.pdOverview = (p) => W.ovTiles(p) + '<div class="opg"><div class="olc">' + chartCard(p) + lifeCard(p) + '</div><div class="orc">' + todoCard(p) + riskCard(p) + medCard(p) + visitCard(p) + '</div></div>';
  W.pdSheet = (p, tab) => '<div class="sh-scrim" data-a="sheetclose"></div><aside class="sheet' + (S().sheetAnim ? ' enter' : '') + '" role="dialog" aria-label="Chi tiết hồ sơ"><div class="sheet-h">' + W.pdTabs(tab, p) + '<span style="flex:1"></span><button class="lnk" data-a="ptab" data-t="home">Toàn hồ sơ</button><button class="iconbtn" data-a="sheetclose" aria-label="Đóng chi tiết">' + ic('x') + '</button></div><div class="pd-body">' + W.pdBody(p, tab) + '</div></aside>';
  W.pdTabs = (tab, p) => '<div class="pd-tabs" role="tablist">' + W.PTABS.map(([k, t]) => '<button role="tab" class="' + (tab === k ? 'on' : '') + '" data-a="ptab" data-t="' + k + '">' + t + (k === 'msg' && R.pending(p) ? '<span class="n">1</span>' : '') + (k === 'note' && S().cls[p.id].reasons.filter((x) => W.alertState(p.id, x.code).status !== 'done').length ? '<span class="n">' + S().cls[p.id].reasons.filter((x) => W.alertState(p.id, x.code).status !== 'done').length + '</span>' : '') + '</button>').join('') + '</div>';
  W.patientView = (p, tab, mode) => '<div class="pd opage">' + W.pdHead(p, mode) + W.pdOverview(p) + (tab && tab !== 'home' ? W.pdSheet(p, tab) : '') + '</div>';
  W.pdBody = (p, tab) => ({ sum: W.pdSum, risk: W.pdRisk, vit: W.pdVit, med: W.pdMed, life: W.pdLife, visit: W.pdVisit, msg: W.pdMsg, adv: W.pdAdv, note: W.pdNote }[tab] || W.pdSum)(p);

  /* ---------- thẻ cảnh báo ---------- */
  W.alertCard = (p, r) => {
    const a = W.alertState(p.id, r.code), st = STAT[a.status], key = p.id + ':' + r.code;
    return '<div class="alertcard ' + r.level + (a.status === 'done' ? ' done' : '') + '"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>' + esc(r.text) + '</b><span class="tag">' + esc(r.group) + '</span><span class="xs muted">' + esc(U.dt(r.at.d, r.at.h)) + '</span><span class="chip ' + st[1] + ' xs">' + st[0] + '</span></div>' +
      '<ul class="raw">' + r.raw.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      (a.status === 'done' ? '<div class="xs muted" style="margin-top:4px">Đã xử lý bởi ' + esc(a.by) + ' lúc ' + U.dt(a.at.d, a.at.h) + ' · ' + esc(a.note) + '</div>' : '<div style="display:flex;gap:6px;margin-top:7px">' + (a.status === 'new' ? '<button class="btn sm" data-a="adoing" data-k="' + key + '">Nhận xử lý</button>' : '') + '<button class="btn sm primary" data-a="adone" data-k="' + key + '">Đã xử lý…</button></div>') + '</div>';
  };

  /* ---------- tab: Tóm tắt 30 giây ---------- */
  const trend = Ins.trend;
  const arrow = (d) => (d >= 3 ? '<span style="color:var(--act-ink)" title="Tăng">' + ic('up') + '</span>' : d <= -3 ? '<span style="color:var(--ok-ink)" title="Giảm">' + ic('down') + '</span>' : '→');
  W.tile = (label, value, unit, meta, state, extra) => '<div class="tile ' + (state === 'bad' ? 'bad' : state === 'ok' ? 'ok' : '') + '"><div class="tl">' + label + '</div><div class="tv">' + value + (unit ? ' <small>' + unit + '</small>' : '') + (extra || '') + '</div><div class="tm">' + meta + '</div><div>' + U.state(state) + '</div></div>';
  const srcOf = (x) => esc(x.src);
  W.tiles = (p) => {
    const I = R.ind(p), t = trend(p), none = [], out = [];
    const lb = I.bp.last;
    if (I.bp.avg7) out.push(W.tile('Huyết áp TB 7 ngày', I.bp.avg7.s + '/' + I.bp.avg7.dia, 'mmHg', 'Từ ' + I.bp.avg7.n + ' lần đo · lần gần nhất <b>' + lb.s + '/' + lb.dia + '</b> ' + esc(U.dt(lb.d, lb.h)) + ' · ' + srcOf(lb) + (t && t.prev ? '<br>So với 7 ngày trước (' + t.prev.s + '/' + t.prev.dia + '): ' + arrow(t.ds) + ' ' + (t.ds > 0 ? '+' : '') + t.ds + '/' + (t.dd > 0 ? '+' : '') + t.dd : ''), I.bp.state));
    else if (lb) out.push(W.tile('Huyết áp', '—', '', 'Không có số đo trong 7 ngày qua. Lần đo gần nhất: <b>' + lb.s + '/' + lb.dia + ' mmHg</b> ' + esc(U.dt(lb.d, lb.h)) + ' · ' + srcOf(lb), 'none', ''));
    else none.push('Huyết áp');
    if (I.glu.last) out.push(W.tile('Đường huyết đói', num(I.glu.last.v, 1), 'mmol/L', esc(U.dt(I.glu.last.d, I.glu.last.h)) + ' · ' + srcOf(I.glu.last) + ' · mục tiêu ≤5,6', I.glu.state)); else none.push('Đường huyết đói');
    if (I.a1c.last) out.push(W.tile('HbA1c', num(I.a1c.last.v, 1), '%', 'Xét nghiệm ' + T.fmtDMY(I.a1c.last.d) + ' · mục tiêu ' + (p.rf.dm === 1 ? '≤' : '<') + num(I.a1c.target, 1) + '%', I.a1c.state)); else none.push('HbA1c');
    if (I.ldl.last) out.push(W.tile('LDL-C', num(I.ldl.last.v, 1), 'mmol/L', 'Xét nghiệm ' + T.fmtDMY(I.ldl.last.d) + ' · mục tiêu <' + num(I.ldl.target, 1), I.ldl.state)); else none.push('LDL-C');
    const w = R.lastW(p);
    if (w) out.push(W.tile('BMI', num(I.bmi.v, 1), 'kg/m²', esc(I.bmi.label) + ' · ' + w.kg.toString().replace('.', ',') + ' kg · ' + T.fmtDMY(w.d) + ' · ' + srcOf(w), I.bmi.state)); else none.push('Cân nặng/BMI');
    if (I.adh.v) out.push(W.tile('Tuân thủ thuốc 30 ngày', I.adh.v.pct + '%', '', I.adh.v.taken + '/' + (I.adh.v.taken + I.adh.v.missed) + ' liều · mục tiêu ≥90%', I.adh.state));
    else if (!p.consentAdh) out.push(W.tile('Tuân thủ thuốc', '—', '', 'Bệnh nhân chưa cho phép chia sẻ số liệu tuân thủ', 'private'));
    return '<div class="tiles">' + out.join('') + '</div>' + (none.length ? '<div class="xs muted" style="margin-top:6px">Chưa có dữ liệu: ' + none.join(', ') + '.</div>' : '');
  };
  const TODO = {
    neuro: () => 'Gọi BN ngay để hỏi lại triệu chứng; nếu còn hoặc tái diễn, hướng dẫn gọi 115.',
    'bp-crit': () => 'Gọi BN: hỏi triệu chứng (BE-FAST), đo lại sau nghỉ 5 phút; nếu có triệu chứng thần kinh mới, hướng dẫn gọi 115.',
    'miss-ac': (p) => 'Liên hệ BN xác nhận lý do bỏ liều ' + Array.from(new Set(R.misses(p, -7, true).map((m) => m.med.toLowerCase()))).join(', ') + '; cân nhắc đánh giá lại tuân thủ.',
    glu: () => 'Gọi BN xác nhận tình trạng hiện tại và đo lại đường huyết.',
    'bp-avg3': () => 'Xem lại số đo 3 ngày, kiểm tra kỹ thuật đo và tuân thủ thuốc.',
    overdue: () => 'Liên hệ BN để đặt lại lịch tái khám.',
    'hr-adh': () => 'Trao đổi với BN về lý do tuân thủ thấp (nguy cơ tái phát cao).',
    'bp-avg7': () => 'Kiểm tra kỹ thuật đo và tuân thủ thuốc hạ áp.',
    adh: () => 'Hỏi lý do quên liều, đặt giờ nhắc phù hợp.',
    stale: () => 'Nhắn BN nhập dữ liệu, hoặc nhập hộ khi BN đến khám.',
    ldl: () => 'Xem lại mục tiêu và kế hoạch kiểm soát LDL-C.',
    a1c: () => 'Xem lại mục tiêu và kế hoạch kiểm soát HbA1c.',
    msg: () => 'Trả lời tin nhắn đang chờ.',
    appt: (p) => 'Chuẩn bị tái khám ' + T.dow(p.appt.d) + ' ' + T.fmtDM(p.appt.d) + ' lúc ' + p.appt.time + '.',
  };
  W.TODO = TODO;

  /* ---------- Chuẩn bị khám: thay đổi từ lần khám trước, việc chưa xong, câu bệnh nhân muốn hỏi ---------- */
  W.prepDue = (p) => p.appt.status === 'scheduled' && p.appt.d >= 0 && p.appt.d <= R.cfg.apptSoonDays;
  W.prep = (p) => {
    const v = p.visits[p.visits.length - 1], c = S().cls[p.id], since = v ? v.d : -9999, chg = [], todo = [];
    const a7 = R.avgBP(p, 7), lb = R.lastBP(p);
    if (v) chg.push('HA phòng khám lần trước <b>' + v.bp[0] + '/' + v.bp[1] + '</b> → ' + (a7 ? 'TB 7 ngày tại nhà <b>' + a7.s + '/' + a7.dia + '</b>' : lb ? 'lần đo gần nhất <b>' + lb.s + '/' + lb.dia + '</b> ' + esc(R.stamp(lb.d, lb.h)) : 'chưa có số đo') + ' <span class="xs muted">(khác nơi đo)</span>');
    if (p.visits.length > 1 && v.mrs != null && p.visits[p.visits.length - 2].mrs != null) chg.push(p.visits[p.visits.length - 2].mrs === v.mrs ? 'mRS <b>' + v.mrs + '</b>, không đổi qua 2 lần khám gần nhất' : 'mRS <b>' + p.visits[p.visits.length - 2].mrs + ' → ' + v.mrs + '</b> qua 2 lần khám gần nhất');
    const labs = { ldl: ['LDL-C', ' mmol/L'], tc: ['Cholesterol toàn phần', ' mmol/L'], a1c: ['HbA1c', '%'] };
    Object.keys(labs).forEach((k) => {
      const L = p.labs[k] || [], i = L.length - 1; if (i < 0 || L[i].d <= since) return;
      chg.push(labs[k][0] + ' ' + (i > 0 ? R.num(L[i - 1].v, 1) + ' → ' : '') + '<b>' + R.num(L[i].v, 1) + labs[k][1] + '</b> <span class="xs muted">(' + T.fmtDM(L[i].d) + ')</span>');
    });
    if (v && p.consentAdh) {
      const ad = R.adherence(p, Math.min(30, Math.max(1, -since))), crit = R.misses(p, Math.max(since, -30), true).filter((m) => m.d <= -1).length;
      if (ad) chg.push('Tuân thủ từ lần khám <b>' + ad.pct + '%</b>' + (crit ? ', bỏ <b>' + crit + '</b> liều chống đông/kháng tiểu cầu' : ''));
    }
    const lastNote = p.notes.slice().sort((a, b) => b.d - a.d)[0];
    if (lastNote) todo.push('<span class="xs muted">Ghi chú lần trước:</span> ' + esc(lastNote.text));
    else if (v) todo.push('<span class="xs muted">Ghi chú lần trước:</span> ' + esc(v.note));
    const open = c.reasons.filter((r) => W.alertState(p.id, r.code).status !== 'done' && r.code !== 'appt');
    if (open.length) todo.push('<b>' + open.length + ' cảnh báo đang mở:</b> ' + open.slice(0, 3).map((r) => esc(r.text)).join('; ') + (open.length > 3 ? '…' : ''));
    p.meds.filter((m) => m.supply <= 7).forEach((m) => todo.push('Sắp hết thuốc: <b>' + esc(m.name) + '</b> còn ' + m.supply + ' ngày'));
    S().appts.filter((a) => a.pid === p.id && a.status === 'pending').forEach((a) => todo.push('Yêu cầu chờ xác nhận: ' + esc(a.reason)));
    const pe = R.pending(p), lastQ = p.thread.filter((m) => m.from !== 'bs' && m.d > since).pop();
    const ask = pe ? '<b>"' + esc(pe.text) + '"</b><div class="xs muted">Đang chờ trả lời, gửi ' + esc(R.stamp(pe.d, pe.h)) + '</div>' : lastQ ? '"' + esc(lastQ.text) + '"<div class="xs muted">Đã trả lời, gửi ' + esc(R.stamp(lastQ.d, lastQ.h)) + '</div>' : '<span class="muted">Không có câu hỏi đang chờ.</span>';
    const col = (h, L) => '<div><h5>' + h + '</h5>' + (L.length ? '<ul class="preplist">' + L.map((x) => '<li>' + x + '</li>').join('') + '</ul>' : '<span class="muted small">Không có.</span>') + '</div>';
    return '<section class="card prep"><div class="card-h"><h3>Chuẩn bị khám</h3><span class="muted small">' + T.dow(p.appt.d) + ' ' + T.fmtDM(p.appt.d) + ' lúc ' + p.appt.time + ' · ' + esc(p.appt.kind) + '</span><span style="flex:1"></span><span class="tag dem">tự tổng hợp từ hồ sơ, không dùng AI</span></div><div class="card-b prep-grid">' +
      col(v ? 'Thay đổi từ lần khám ' + T.fmtDM(v.d) : 'Chưa có lần khám trước', chg) + col('Việc chưa xong', todo) + '<div><h5>Bệnh nhân muốn hỏi</h5>' + ask + '</div></div></section>';
  };
  W.bullets = (p) => {
    const c = S().cls[p.id], I = R.ind(p), out = [], t = trend(p), lv = p.visits[p.visits.length - 1], prep = W.prepDue(p);
    const open = c.reasons.filter((r) => W.alertState(p.id, r.code).status !== 'done');
    out.push(['alert', open.length ? '<b>' + open.length + ' cảnh báo đang mở:</b> ' + open.slice(0, 3).map((r) => esc(r.text)).join('; ') + (open.length > 3 ? '…' : '') + '.' : 'Không có cảnh báo đang mở.']);
    if (!prep && lv && t) out.push(['trend', '<b>So với lần khám ' + T.fmtDM(lv.d) + '</b> (HA phòng khám ' + lv.bp[0] + '/' + lv.bp[1] + '): HA TB 7 ngày hiện ' + t.a.s + '/' + t.a.dia + ' mmHg (' + (t.a.s - lv.bp[0] > 0 ? '+' : '') + (t.a.s - lv.bp[0]) + '/' + (t.a.dia - lv.bp[1] > 0 ? '+' : '') + (t.a.dia - lv.bp[1]) + ').']);
    else if (!prep && lv) out.push(['trend', '<b>Lần khám ' + T.fmtDM(lv.d) + ':</b> HA phòng khám ' + lv.bp[0] + '/' + lv.bp[1] + '. Chưa có số đo tại nhà trong 7 ngày để so sánh.']);
    const ms = R.misses(p, -7, true).filter((m) => m.d <= -1), low = p.meds.filter((m) => m.supply <= 7);
    const bits = [];
    if (ms.length) bits.push('bỏ ' + ms.length + ' liều chống đông/kháng tiểu cầu trong 7 ngày (' + Array.from(new Set(ms.map((m) => m.med + ' ' + T.fmtDM(m.d)))).join(', ') + ')');
    if (I.adh.v) bits.push('tuân thủ 30 ngày ' + I.adh.v.pct + '%');
    if (low.length) bits.push('sắp hết thuốc: ' + low.map((m) => m.name + ' còn ' + m.supply + ' ngày').join(', '));
    if (bits.length) out.push(['pill', '<b>Thuốc:</b> ' + bits.join('; ') + '.']);
    const todo = []; if (p.appt.d === 0) todo.push('Hôm nay có hẹn ' + p.appt.time + '.');
    c.reasons.forEach((r) => { const f = TODO[r.code]; if (f && todo.length < 3) todo.push(f(p)); });
    out.push(['check', '<b>Việc cần làm hôm nay (gợi ý, BS quyết định):</b> ' + (todo.length ? todo.map(esc).join(' ') : 'Không có việc cần xử lý.')]);
    const gaps = [], sc = R.patientScales(p);
    if (p.dx.type === 'CMN') gaps.push('chảy máu não: ESRS và SPI-II không áp dụng');
    if (p.dx.type === 'NONE' && p.age < 55) gaps.push('dưới 55 tuổi: FSRP chưa áp dụng, chưa có ước tính nguy cơ tiên phát');
    if (R.staleDays(p) >= R.cfg.staleDays - 0 && R.staleDays(p) <= R.cfg.staleDays) gaps.push(R.staleDays(p) + ' ngày chưa nhập dữ liệu, sắp chạm ngưỡng cảnh báo (>' + R.cfg.staleDays + ' ngày)');
    [sc.esrs, sc.spi].forEach((x) => { if (x.applicable && x.missing.length) gaps.push(x.scale + ' còn thiếu ' + x.missing.join(', ').toLowerCase() + (x.couldChange ? ' (phân tầng có thể đổi)' : '')); });
    if (sc.fsrp.applicable && sc.fsrp.insufficient) gaps.push('FSRP thiếu ' + sc.fsrp.missing.join(', ').toLowerCase());
    if (gaps.length) out.push(['info', '<b>Khoảng trống lâm sàng:</b> ' + esc(gaps.join('; ')) + '.']);
    const pats = Ins.patterns(p);
    if (pats.length) out.push(['trend', '<b>Quy luật trong dữ liệu (gợi ý):</b> ' + esc(pats.join(' ')) + ' <span class="tag prop">[Đề xuất]</span>']);
    return out;
  };
  W.pdSum = (p) => {
    const c = S().cls[p.id];
    const sys = p.bp.filter((x) => x.d >= -29).map((x) => ({ x: x.d + x.h / 24, y: x.s, bad: x.s >= R.cfg.avg3Sys }));
    return (W.prepDue(p) ? W.prep(p) : '') + '<section class="card"><div class="card-h"><h3>Tóm tắt 30 giây</h3><span class="tag dem">tự sinh theo quy tắc, không dùng AI</span></div><div class="card-b"><ul class="bul">' + W.bullets(p).map(([i, t]) => '<li>' + ic(i === 'alert' ? 'alert' : i === 'trend' ? 'chart' : i === 'pill' ? 'pill' : i === 'check' ? 'check' : 'info') + '<div>' + t + '</div></li>').join('') + '</ul></div></section>' +
      '<section class="card"><div class="card-h"><h3>Chỉ số mới nhất</h3><span class="muted xs">Mỗi ô ghi ngày và nguồn riêng</span></div><div class="card-b">' + W.tiles(p) + '</div></section>' +
      '<section class="card"><div class="card-h"><h3>Huyết áp tâm thu 30 ngày</h3><span class="muted xs">mmHg · vạch xanh = mục tiêu &lt;130 · chấm đỏ = ≥' + R.cfg.avg3Sys + '</span></div><div class="card-b">' + U.chartSay(Ins.bpSentence(p, 30)) + U.spark(sys, { ref: 130, w: 520, h: 54 }) + '</div></section>' +
      (c.reasons.length ? '<section><h4 style="margin-bottom:6px">Chi tiết cảnh báo đang mở</h4><div style="display:flex;flex-direction:column;gap:8px">' + c.reasons.map((r) => W.alertCard(p, r)).join('') + '</div></section>' : '');
  };

  /* ---------- tab: Nguy cơ ---------- */
  W.pdRisk = (p) => {
    const sc = R.patientScales(p), mod = R.modifiable(p);
    let insight = '';
    if (sc.cha.applicable && sc.cha.tier.key === 'high' && !(sc.esrs.applicable && sc.esrs.tier.key === 'high') && !(sc.spi.applicable && sc.spi.tier.key === 'high'))
      insight = '<div class="infobox">' + ic('info') + ' ESRS và SPI-II chỉ ở mức <b>thấp</b>, nhưng CHA₂DS₂-VASc là <b>' + sc.cha.score + '</b>. Thang tái phát chung không phản ánh nhu cầu chống đông, nên việc bỏ liều thuốc chống đông là vấn đề thật sự.</div>';
    return insight + '<div style="display:flex;flex-direction:column;gap:12px">' + [sc.esrs, sc.spi, sc.cha, sc.fsrp].map((r) => W.scaleCard(r)).join('') + '</div>' +
      '<section class="card"><div class="card-h"><h3>Yếu tố có thể thay đổi</h3><span class="tag prop">gợi ý khuyến nghị · BS duyệt</span></div><div class="card-b">' + (mod.length ? mod.map((m) => '<div class="mod-row"><div><span class="chip high">' + ic('alert') + esc(m.t) + ' · ' + esc(m.v) + '</span><div class="small" style="margin-top:4px">' + esc(m.rec) + '</div></div><button class="btn sm" data-a="advnew" data-id="' + p.id + '" data-k="' + m.k + '">Gửi lời khuyên</button></div>').join('') : '<span class="muted">Các yếu tố có thể thay đổi đều đạt mục tiêu.</span>') + '</div></section>';
  };

  /* ---------- tab: Chỉ số ---------- */
  W.pdVit = (p) => {
    const s = S().pv, rg = s.range, from = -(rg - 1);
    const seg = (k, t) => '<button class="' + (s.metric === k ? 'on' : '') + '" data-a="pvm" data-v="' + k + '">' + t + '</button>';
    const rseg = (k) => '<button class="' + (rg === k ? 'on' : '') + '" data-a="pvr" data-v="' + k + '">' + k + ' ngày</button>';
    let body = '';
    if (s.metric === 'bp') {
      const L = p.bp.filter((x) => x.d >= from);
      if (!L.length) body = '<div class="empty">Chưa có số đo huyết áp trong ' + rg + ' ngày qua. Lần đo gần nhất: ' + (R.lastBP(p) ? R.lastBP(p).s + '/' + R.lastBP(p).dia + ' mmHg ' + U.dt(R.lastBP(p).d, R.lastBP(p).h) : '—') + '.</div>';
      else {
        const c = R.cfg;
        const days = {}; L.forEach((x) => { (days[x.d] = days[x.d] || {})[x.slot] = x; });
        body = U.chartSay(Ins.bpSentence(p, rg)) + W.bpLegend(p, true) + W.bpChart(p, rg, 760, 330) +
          '<div class="tw" style="max-height:260px;margin-top:10px"><table class="tbl plain"><thead><tr><th>Ngày</th><th>Sáng</th><th>Tối</th><th>Nguồn</th></tr></thead><tbody>' + Object.keys(days).map(Number).sort((a, b) => b - a).map((d) => { const f = (x) => (x ? '<span class="' + (x.s >= 140 || x.dia >= 90 ? 'sm-bad' : x.s < 130 && x.dia < 80 ? 'sm-ok' : '') + '"><b>' + x.s + '/' + x.dia + '</b></span> <span class="xs muted">' + T.fmtH(x.h) + '</span>' + (x.s >= c.critSys || x.dia >= c.critDia ? ' ◆' : x.s >= 140 || x.dia >= 90 ? ' ●' : '') : '<span class="muted">—</span>'); const src = Array.from(new Set(Object.values(days[d]).map((x) => x.src))).join(', '); return '<tr><td>' + ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][T.dateOf(d).getDay()] + ' ' + T.fmtDM(d) + '</td><td>' + f(days[d].am) + '</td><td>' + f(days[d].pm) + '</td><td class="xs">' + esc(src) + '</td></tr>'; }).join('') + '</tbody></table></div><div class="xs muted">Đơn vị mmHg, định dạng tâm thu/tâm trương. Hướng dẫn đo tại nhà: ngồi nghỉ 5 phút, đo 3 lần, lấy trung bình 2 lần cuối.</div>';
      }
    } else if (s.metric === 'glu') {
      const L = p.glu.filter((x) => x.d >= from);
      body = L.length ? U.chartSay(Ins.gluSentence(p, rg)) + U.lineChart({ w: 760, h: 240, rr: 100, series: [{ name: 'Đường huyết đói', color: 'var(--s1)', pts: L.map((x) => ({ x: x.d + x.h / 24, y: x.v, over: x.v > 5.6, crit: x.v < R.cfg.gluLow || x.v > R.cfg.gluHigh, tip: U.dt(x.d, x.h) + ' · ' + num(x.v, 1) + ' mmol/L · ' + x.src })) }], yMin: 2, yMax: Math.max(14, Math.ceil(Math.max.apply(null, L.map((x) => x.v)) + 1)), xFrom: from, xTo: 0, yUnit: 'mmol/L', refs: [{ y: 5.6, color: 'var(--ok)', label: 'Mục tiêu ≤5,6' }, { y: R.cfg.gluLow, color: 'var(--act)', label: 'Ngưỡng thấp ' + num(R.cfg.gluLow, 1) }], label: 'Đường huyết. ' + Ins.gluSentence(p, rg) }) + '<div class="legend"><span>Tô đặc: vượt 5,6 mmol/L. Rỗng: trong mục tiêu</span><span><svg class="lgm" viewBox="0 0 12 12"><rect x="3" y="3" width="6" height="6" transform="rotate(45 6 6)" fill="var(--act)"/></svg>Ngoài ngưỡng an toàn ' + num(R.cfg.gluLow, 1) + '–' + num(R.cfg.gluHigh, 1) + '</span><span>Ngày không có số đo để trống</span></div><div class="tw" style="max-height:220px"><table class="tbl plain"><thead><tr><th>Thời điểm</th><th class="r">mmol/L</th><th>Nguồn</th></tr></thead><tbody>' + L.slice().reverse().map((x) => '<tr><td>' + U.dt(x.d, x.h) + '</td><td class="r ' + (x.v > 5.6 ? 'sm-bad' : 'sm-ok') + '"><b>' + num(x.v, 1) + '</b></td><td class="xs">' + esc(x.src) + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">Bệnh nhân chưa theo dõi đường huyết tại nhà trong ' + rg + ' ngày qua.' + (R.lastGlu(p) ? '' : ' (Chưa có số đo nào.)') + '</div>';
    } else if (s.metric === 'lab') {
      const row = (name, k, tg, fmt) => (p.labs[k] || []).slice().reverse().map((x, i) => '<tr><td>' + (i === 0 ? '<b>' + name + '</b>' : '') + '</td><td>' + T.fmtDMY(x.d) + '</td><td class="r"><b>' + fmt(x.v) + '</b></td><td>' + (tg ? U.state(tg(x.v) ? 'ok' : 'bad') : '') + '</td><td class="xs">' + esc(x.src) + '</td></tr>').join('');
      const tgt = R.targets(p, R.cfg);
      body = '<div class="tw"><table class="tbl plain"><thead><tr><th>Xét nghiệm</th><th>Ngày</th><th class="r">Giá trị</th><th>Đánh giá</th><th>Nguồn</th></tr></thead><tbody>' + (row('LDL-C (mmol/L), mục tiêu <' + num(tgt.ldl, 1), 'ldl', (v) => v < tgt.ldl, (v) => num(v, 1)) + row('Cholesterol toàn phần (mmol/L), mục tiêu <5,2', 'tc', (v) => v < 5.2, (v) => num(v, 1)) + row('HbA1c (%), mục tiêu ' + (p.rf.dm === 1 ? '≤' : '<') + num(tgt.a1c, 1), 'a1c', (v) => !R.a1cExceeds(p, v, R.cfg), (v) => num(v, 1))) + '</tbody></table></div>' + (p.labs.a1c.length ? '' : '<div class="xs muted">Chưa có xét nghiệm HbA1c.</div>');
    } else {
      body = '<div class="tw"><table class="tbl plain"><thead><tr><th>Ngày</th><th class="r">Cân nặng (kg)</th><th class="r">BMI (kg/m²)</th><th>Nguồn</th></tr></thead><tbody>' + p.weight.slice().reverse().map((x) => { const b = Math.round(x.kg / Math.pow(p.ht / 100, 2) * 10) / 10; return '<tr><td>' + T.fmtDMY(x.d) + '</td><td class="r">' + num(x.kg, 1) + '</td><td class="r"><b>' + num(b, 1) + '</b> <span class="xs muted">' + (b < 18.5 ? 'thấp' : b < 23 ? 'bình thường' : b < 25 ? 'thừa cân' : 'béo phì') + '</span></td><td class="xs">' + esc(x.src) + '</td></tr>'; }).join('') + '</tbody></table></div><div class="xs muted">Chiều cao ' + p.ht + ' cm. Ngưỡng BMI cho người Việt: 18,5–22,9 bình thường, ≥23 thừa cân, ≥25 béo phì.</div>';
    }
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><div class="seg">' + seg('bp', 'Huyết áp') + seg('glu', 'Đường huyết') + seg('lab', 'Xét nghiệm') + seg('w', 'Cân nặng · BMI') + '</div>' + (s.metric === 'bp' || s.metric === 'glu' ? '<div class="seg">' + rseg(7) + rseg(30) + '</div>' : '') + '<span class="xs muted">Nguồn dữ liệu: BN tự nhập / NVYT nhập / Bệnh viện</span></div><section class="card"><div class="card-b">' + body + '</div></section>';
  };

  /* ---------- tab: Thuốc & tuân thủ ---------- */
  W.pdMed = (p) => {
    const ad = R.adherence(p), ms = R.misses(p, -7, true).filter((m) => m.d <= -1), ev = Ins.eveningMiss(p);
    const per = (m) => { let t = 0, x = 0; m.log.forEach((c) => { for (const ch of c) { if (ch === 'T') t++; else if (ch === 'M') x++; } }); return t + x ? Math.round(100 * t / (t + x)) : null; };
    return '<section class="card"><div class="card-h"><h3>Thuốc đang dùng</h3>' + (ad ? '<span class="chip ' + (ad.pct >= 90 ? 'ok' : 'watch') + '">' + ic(ad.pct >= 90 ? 'check' : 'watch') + 'Tuân thủ 30 ngày: ' + ad.pct + '% (' + ad.taken + '/' + (ad.taken + ad.missed) + ' liều)</span>' : '<span class="chip neutral">' + ic('dash') + (p.consentAdh ? 'Chưa có dữ liệu tuân thủ' : 'BN chưa cho phép chia sẻ số liệu tuân thủ') + '</span>') + '</div><div class="scroll"><table class="tbl plain"><thead><tr><th>Thuốc</th><th>Nhóm</th><th>Cách dùng</th><th>Giờ uống</th><th class="r">Tuân thủ</th><th class="r">Còn lại</th></tr></thead><tbody>' + p.meds.map((m) => { const pc = p.consentAdh ? per(m) : null; return '<tr><td><b>' + esc(m.name) + '</b> ' + esc(m.dose) + '</td><td>' + (D.isCrit(m.cls) ? '<span class="tag prop">' + esc(D.CLS_VN[m.cls]) + '</span>' : esc(D.CLS_VN[m.cls])) + '</td><td>' + esc(m.sig) + '</td><td class="num">' + m.times.join(', ') + '</td><td class="r">' + (pc == null ? '<span class="muted">—</span>' : '<b class="' + (pc >= 90 ? 'sm-ok' : 'sm-bad') + '">' + pc + '%</b>') + '</td><td class="r">' + (m.supply <= 7 ? '<span class="chip watch xs">' + ic('watch') + 'Sắp hết · ' + m.supply + ' ngày</span>' : m.supply + ' ngày') + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      (ms.length ? '<div class="errbox"><b>' + ic('alert', 'sm') + ' Liều chống đông/kháng tiểu cầu bị bỏ trong 7 ngày qua:</b> ' + ms.map((m) => esc(m.med + ' ' + m.time + ' ngày ' + T.fmtDM(m.d))).join('; ') + '.</div>' : '') +
      (p.consentAdh ? '<section class="card"><div class="card-h"><h3>Lịch tuân thủ 30 ngày</h3><span class="muted xs">' + T.fmtDM(-30) + ' – ' + T.fmtDM(-1) + ' · hôm nay chưa tính</span></div><div class="card-b" style="overflow:auto">' + U.chartSay(Ins.medSentence(p)) + U.heat(p) + (ev ? '<div class="infobox">' + esc(Ins.eveningText(ev)) + ' Cân nhắc đặt giờ nhắc gắn với bữa tối (gợi ý, bác sĩ quyết định). <span class="tag prop">[Đề xuất]</span></div>' : '') + '</div></section>' : '<div class="infobox">Bệnh nhân chưa cho phép chia sẻ số liệu tuân thủ thuốc, nên không có lịch tuân thủ. Đây không phải "đã uống đủ".</div>');
  };

  /* ---------- tab: Lối sống ---------- */
  W.pdLife = (p) => {
    const I = R.ind(p), L = p.life, d = T.fmtDMY(Math.min(-1, p.lastData.d));
    const meta = 'Phiếu hoạt động ' + d + ' · BN tự nhập';
    return '<div class="tiles">' +
      W.tile('Hút thuốc lá', L.cig === 0 ? 'Không hút' : L.cig, L.cig === 0 ? '' : 'điếu/ngày', meta, I.smoke.state) +
      W.tile('Rượu bia', num(L.alc, 1), 'đơn vị/ngày', meta + (L.alcTxt ? ' · ' + esc(L.alcTxt) : '') + '<br>Giới hạn ' + (p.sex === 'F' ? 'nữ ≤1' : 'nam ≤2') + ' đơn vị/ngày (1 đơn vị = 10 g cồn)', I.alc.state) +
      W.tile('Vận động', L.ex, 'phút/tuần', meta + '<br>Mục tiêu ≥150 phút/tuần <span class="tag prop">[Đề xuất] theo WHO</span>', I.ex.state) +
      W.tile('Giấc ngủ', num(L.sleep, 1), 'giờ/đêm', meta, L.sleep >= 7 ? 'ok' : 'bad') +
      W.tile('Ăn uống', '<span style="font-size:15px">' + esc(L.diet) + '</span>', '', meta, 'none') + '</div>' +
      '<div class="xs muted">Giá trị thang đo giờ/ngày, phút/tuần, đơn vị/ngày giữ đúng đơn vị đã nhập. Mọi giá trị đều đến từ cùng một phiếu ghi nhận.</div>';
  };

  /* ---------- tab: Lịch & tái khám ---------- */
  W.pdVisit = (p) => {
    const a = p.appt, c = S().cls[p.id], lv = p.visits[p.visits.length - 1];
    const ruleMonths = c.level === 'ok' ? 3 : 1, ruleDue = lv ? T.addMonths(lv.d, ruleMonths) : null;
    const gapDays = ruleDue != null ? a.d - ruleDue : 0;
    const ap = S().appts.find((x) => x.pid === p.id && x.d === a.d);
    return '<section class="card"><div class="card-h"><h3>Lần hẹn tới</h3><span style="flex:1"></span><button class="btn sm primary" data-a="apnew" data-id="' + p.id + '" data-edit="1">Chỉnh lịch tái khám</button></div><div class="card-b"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span class="serif" style="font-size:20px;font-weight:600">' + T.dow(a.d) + ' ' + T.fmtDMY(a.d) + ' · ' + a.time + '</span>' + (ap ? W.apStatus(ap.status) : '') + (a.d === 0 ? '<span class="chip watch">' + ic('watch') + 'Hôm nay</span>' : '') + (a.d < 0 && a.status !== 'done' ? '<span class="chip act">' + ic('alert') + 'Quá hẹn ' + -a.d + ' ngày</span>' : '') + '</div><div class="small muted" style="margin-top:6px">' + esc(a.kind) + '</div>' +
      '<div class="infobox">Quy tắc gợi ý: lần đầu 1 tháng sau xuất viện; sau đó kết quả tốt 3 tháng/lần, chưa tốt 1 tháng/lần (BS chỉnh được). ' + (ruleDue != null ? 'Với mức hiện tại (' + U.lvl[c.level].t + '), gợi ý khám lại <b>' + T.fmtDMY(ruleDue) + '</b>.' : '') + '</div>' + (Math.abs(gapDays) > 10 && ruleDue != null ? '<div class="warnbox">Lịch hiện tại lệch ' + Math.abs(gapDays) + ' ngày so với quy tắc gợi ý.</div>' : '') + '</div></section>' +
      '<section class="card"><div class="card-h"><h3>Lịch sử tái khám</h3><span class="tag dem">EQ-5D: chỉ số minh họa</span></div><div class="scroll">' + (p.visits.length ? '<table class="tbl plain"><thead><tr><th>Ngày</th><th>Loại</th><th>HA phòng khám</th><th class="r">mRS</th><th class="r">EQ-5D</th><th>Ghi chú</th></tr></thead><tbody>' + p.visits.slice().reverse().map((v) => '<tr><td><b>' + T.fmtDMY(v.d) + '</b></td><td>' + esc(v.kind) + '</td><td>' + v.bp[0] + '/' + v.bp[1] + ' <span class="xs muted">mmHg</span></td><td class="r">' + (v.mrs == null ? '—' : v.mrs) + '</td><td class="r">' + num(v.eq, 2) + '</td><td class="small">' + esc(v.note) + '</td></tr>').join('') + '</tbody></table>' : '<div class="empty">Chưa có lần tái khám nào.</div>') + '</div></section>';
  };

  /* ---------- tab: Tin nhắn, Lời khuyên, Ghi chú ---------- */
  W.pdMsg = (p) => '<section class="card" style="display:flex;flex-direction:column"><div class="thread" id="thread" style="max-height:340px">' + W.threadHtml(p) + '</div>' + W.composer(p) + '</section>';
  W.pdAdv = (p) => {
    const L = S().adv[p.id] || [], mod = R.modifiable(p);
    return '<section class="card"><div class="card-h"><h3>Lời khuyên đã gửi</h3><span style="flex:1"></span><button class="btn sm primary" data-a="advnew" data-id="' + p.id + '">' + ic('plus') + 'Gửi lời khuyên</button></div>' + (L.length ? L.slice().reverse().map((x) => '<div class="mod-row" style="padding:9px 14px"><div><b>' + esc(x.title) + '</b><div class="small">' + esc(x.text) + '</div><div class="xs muted">' + U.dt(x.d, x.h) + ' · ' + esc(x.by) + '</div></div><span class="chip ok xs">' + ic('check') + 'Đã gửi · hiển thị trên app (minh họa)</span></div>').join('') : '<div class="empty">Chưa gửi lời khuyên nào cho bệnh nhân này.</div>') + '</section>' +
      (mod.length ? '<section class="card"><div class="card-h"><h3>Gợi ý theo yếu tố có thể thay đổi</h3></div><div class="card-b">' + mod.map((m) => '<div class="mod-row"><div><b>' + esc(m.t) + '</b> <span class="muted">· ' + esc(m.v) + '</span><div class="small">' + esc(m.rec) + '</div></div><button class="btn sm" data-a="advnew" data-id="' + p.id + '" data-k="' + m.k + '">Gửi</button></div>').join('') + '</div></section>' : '');
  };
  W.pdNote = (p) => {
    const c = S().cls[p.id], notes = p.notes.concat(S().notes[p.id] || []).sort((a, b) => b.d * 24 + b.h - (a.d * 24 + a.h));
    const hist = p.history.concat(Object.keys(S().al).filter((k) => k.indexOf(p.id + ':') === 0 && S().al[k].status === 'done').map((k) => { const r = c.reasons.find((x) => p.id + ':' + x.code === k); const a = S().al[k]; return { d: a.at.d, h: a.at.h, reason: r ? r.text : k, by: a.by, note: a.note, group: r ? r.group : '', doneAt: a.at }; }));
    return '<section class="card"><div class="card-h"><h3>Cảnh báo đang mở</h3><span class="tag">' + c.reasons.filter((r) => W.alertState(p.id, r.code).status !== 'done').length + '</span></div><div class="card-b" style="display:flex;flex-direction:column;gap:8px">' + (c.reasons.length ? c.reasons.map((r) => W.alertCard(p, r)).join('') : '<span class="muted">Không có cảnh báo.</span>') + '</div></section>' +
      '<section class="card"><div class="card-h"><h3>Ghi chú lâm sàng</h3></div><div class="card-b"><textarea id="notebox" rows="2" placeholder="Thêm ghi chú lâm sàng…" aria-label="Ghi chú"></textarea><div style="margin:6px 0 10px"><button class="btn sm primary" data-a="addnote" data-id="' + p.id + '">Lưu ghi chú</button></div>' + notes.map((n) => '<div class="mod-row"><div class="small">' + esc(n.text) + '<div class="xs muted">' + esc(n.by) + ' · ' + U.dt(n.d, n.h) + '</div></div></div>').join('') + '</div></section>' +
      '<section class="card"><div class="card-h"><h3>Lịch sử cảnh báo đã xử lý</h3></div><div class="card-b">' + (hist.length ? hist.map((h) => '<div class="mod-row"><div class="small"><b>' + esc(h.reason) + '</b> <span class="tag">' + esc(h.group) + '</span><div class="xs muted">Xử lý bởi ' + esc(h.by) + ' lúc ' + U.dt(h.doneAt.d, h.doneAt.h) + ' · ' + esc(h.note) + '</div></div></div>').join('') : '<span class="muted">Chưa có lịch sử.</span>') + '</div></section>';
  };

  /* ---------- hộp thoại liên quan hồ sơ ---------- */
  W.modalHead = (t) => '<div class="mbox-h"><h3>' + esc(t) + '</h3><button class="iconbtn" data-a="mclose" aria-label="Đóng">' + ic('x') + '</button></div>';
  W.entryModal = (p) => U.modal(W.modalHead('Nhập liệu hộ · ' + p.name) + '<div class="mbox-b"><div class="small muted">Ghi theo ngày khám ' + T.fmtDMY(0) + '. Nguồn: <b>NVYT nhập</b>. Chỉ nhập mục có số đo; ô trống không được hiểu là "0".</div><div class="form-grid"><label class="f">Huyết áp tâm thu (mmHg)<input type="number" id="e_sys"></label><label class="f">Huyết áp tâm trương (mmHg)<input type="number" id="e_dia"></label><label class="f">Đường huyết đói (mmol/L)<input type="number" step="0.1" id="e_glu"></label><label class="f">Cân nặng (kg)<input type="number" step="0.1" id="e_kg"></label><label class="f">Rượu bia (đơn vị/ngày)<input type="number" step="0.5" id="e_alc"></label></div><div id="e_msg"></div></div><div class="mbox-f"><button class="btn" data-a="mclose">Hủy</button><button class="btn primary" data-a="entrysave" data-id="' + p.id + '">Lưu</button></div>');
  W.advModal = (p, key) => {
    const mod = R.modifiable(p), pre = mod.find((m) => m.k === key);
    U.modal(W.modalHead('Gửi lời khuyên · ' + p.name) + '<div class="mbox-b"><label class="f">Mẫu khuyến nghị<select id="a_tpl">' + (pre ? '' : '<option value="">Tự soạn</option>') + mod.map((m) => '<option value="' + m.k + '"' + (pre && pre.k === m.k ? ' selected' : '') + '>' + esc(m.t + ' · ' + m.v) + '</option>').join('') + D.education.map((e) => '<option value="' + e.id + '">Tài liệu: ' + esc(e.t) + '</option>').join('') + '</select></label><label class="f">Nội dung<textarea id="a_txt" rows="4">' + esc(pre ? pre.rec : '') + '</textarea></label><div class="xs muted">Lời khuyên sẽ hiển thị cho bệnh nhân trên app (minh họa). Mẫu cần lâm sàng duyệt trước khi dùng thật.</div><div id="a_msg"></div></div><div class="mbox-f"><button class="btn" data-a="mclose">Hủy</button><button class="btn primary" data-a="advsave" data-id="' + p.id + '">Gửi</button></div>');
  };
  W.alertDoneModal = (key) => {
    const [pid, code] = key.split(':'), p = V.byId[pid], r = S().cls[pid].reasons.find((x) => x.code === code);
    U.modal(W.modalHead('Đánh dấu đã xử lý') + '<div class="mbox-b"><div><b>' + esc(p.name) + '</b>: ' + esc(r ? r.text : '') + '</div><label class="f">Ghi chú / lý do xử lý (bắt buộc)<textarea id="d_note" rows="3" placeholder="vd. Đã gọi BN, hướng dẫn đo lại sau nghỉ 5 phút…"></textarea></label><div id="d_msg"></div></div><div class="mbox-f"><button class="btn" data-a="mclose">Hủy</button><button class="btn primary" data-a="adonesave" data-k="' + key + '">Đã xử lý</button></div>');
  };
  W.apNewModal = (pid, edit) => {
    const p = pid ? V.byId[pid] : null, d0 = edit && p ? Math.max(0, p.appt.d) : 3;
    U.modal(W.modalHead(edit ? 'Chỉnh lịch tái khám' : 'Tạo lịch khám') + '<div class="mbox-b"><label class="f">Bệnh nhân<select id="n_pid">' + D.patients.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi')).map((x) => '<option value="' + x.id + '"' + (p && p.id === x.id ? ' selected' : '') + '>' + esc(x.name) + ' (' + x.id + ')</option>').join('') + '</select></label><div class="form-grid"><label class="f">Ngày (dd/mm/yyyy)<input type="text" id="n_date" value="' + T.fmtDMY(d0) + '" inputmode="numeric"></label><label class="f">Giờ (24 giờ)<select id="n_time">' + W.HOURS.filter((h) => h >= '07:00' && h <= '17:30').map((h) => '<option' + (h === (edit && p ? p.appt.time : '08:30') ? ' selected' : '') + '>' + h + '</option>').join('') + '</select></label><label class="f">Thời lượng<select id="n_dur"><option value="30" selected>30 phút (mặc định)</option><option value="45">45 phút</option><option value="60">60 phút</option></select></label></div><label class="f">Lý do khám (bắt buộc)<textarea id="n_reason" rows="2">' + (edit ? 'Tái khám theo lịch' : '') + '</textarea></label><div class="xs muted">Lịch do bác sĩ tạo có trạng thái <b>Đã xác nhận</b> (lịch do bệnh nhân đặt qua app là <b>Chờ xác nhận</b>). Hai lịch trùng giờ vẫn được phép tạo.</div><div id="n_msg"></div></div><div class="mbox-f"><button class="btn" data-a="mclose">Hủy</button><button class="btn primary" data-a="apnewsave" data-edit="' + (edit ? 1 : 0) + '">' + (edit ? 'Lưu lịch' : 'Tạo lịch') + '</button></div>');
  };
  W.addPtModal = () => U.modal(W.modalHead('Thêm bệnh nhân / Tạo profile hộ') + '<div class="mbox-b"><div class="small muted">Bản demo: bệnh nhân mới chỉ lưu trong phiên này và không có số đo, nên sẽ vào nhóm "Cần theo dõi" (chưa có dữ liệu).</div><div class="form-grid"><label class="f">Họ và tên<input type="text" id="p_name"></label><label class="f">Tuổi<input type="number" id="p_age" min="0" max="120"></label><label class="f">Giới<select id="p_sex"><option value="M">Nam</option><option value="F">Nữ</option></select></label><label class="f">Cơ sở<select id="p_site"><option value="BM">Bạch Mai</option><option value="VM">Vinmec Times City</option></select></label><label class="f">Chẩn đoán<select id="p_dx"><option value="NONE">Chưa từng đột quỵ</option><option value="NMN">Nhồi máu não</option><option value="CMN">Chảy máu não</option><option value="TIA">TIA</option></select></label></div><div id="p_msg"></div></div><div class="mbox-f"><button class="btn" data-a="mclose">Hủy</button><button class="btn primary" data-a="addptsave">Tạo hồ sơ</button></div>');
})(typeof globalThis !== 'undefined' ? globalThis : window);
