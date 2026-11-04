/* VNPreventStroke (demo) · màn chọn vai trò + cổng Quản lý: toàn khoa, từng bác sĩ, tin nhắn, ngưỡng.
 * Quản lý xem danh sách và số liệu, không mở hồ sơ bệnh án, không đọc nội dung tin nhắn. */
(function (g) {
  'use strict';
  const V = g.VNPS, R = V.rules, D = V.data, U = V.ui, Ins = V.ins, esc = U.esc, ic = U.ic;
  const W = (V.views = V.views || {});
  const S = () => V.S;
  const lvl = (p) => S().cls[p.id].level;
  const RANK = { act: 0, watch: 1, ok: 2 };
  const pct = (n, N) => (N ? Math.round((100 * n) / N) : 0);
  const docOf = (p) => D.doctors.find((d) => d.id === p.doc);

  W.landing = () => '<div class="landing"><div class="land"><div class="brand"><span class="logo">V</span><b>VNPreventStroke</b></div><h1>Chọn vai trò</h1><div class="roles">' +
    '<button class="role" data-a="role" data-v="doctor">' + ic('stetho') + '<b>Bác sĩ</b></button><button class="role" data-a="role" data-v="manager">' + ic('chart') + '<b>Quản lý khoa</b></button></div></div></div>';

  /* ---------- số liệu ---------- */
  W.unitOf = (id) => D.unit.filter((p) => p.doc === id);
  W.stats = (L) => {
    const k = { act: 0, watch: 0, ok: 0 }; L.forEach((p) => { k[lvl(p)]++; });
    const wait = L.map(R.pending).filter(Boolean), rep = [].concat.apply([], L.map(Ins.replyHours));
    return { n: L.length, k, wait: wait.length, late: wait.filter((w) => w.hours > R.cfg.msgHours).length, med: Ins.median(rep), within: rep.length ? pct(rep.filter((h) => h <= R.cfg.msgHours).length, rep.length) : null, overdue: L.filter((p) => S().cls[p.id].reasons.some((r) => r.code === 'overdue')).length };
  };
  const byLevel = (L) => L.slice().sort((a, b) => RANK[lvl(a)] - RANK[lvl(b)] || a.name.localeCompare(b.name, 'vi'));
  const RISK = { esrs: 'ESRS', spi: 'SPI-II', cha: 'CHA₂DS₂-VASc' };
  const hiRisk = (p) => { const sc = R.patientScales(p); return Object.keys(RISK).some((k) => sc[k].applicable && !!sc[k].tier && sc[k].tier.key === 'high'); };
  // Tỷ lệ đạt mục tiêu: [số đạt, số có dữ liệu]. HbA1c chỉ tính người đái tháo đường; mRS chỉ tính ca nặng.
  const goals = (L) => {
    const I = {}; L.forEach((p) => { I[p.id] = R.ind(p, R.cfg); });
    const rate = (k, f) => { const A = L.filter((p) => I[p.id][k].state !== 'none' && (!f || f(p))); return [A.filter((p) => I[p.id][k].state === 'ok').length, A.length]; };
    const sev = L.filter(Ins.severe), adh = L.filter((p) => I[p.id].adh.v);
    return { bp: rate('bp'), ldl: rate('ldl'), a1c: rate('a1c', (p) => p.rf.dm === 1), adh: [adh.filter((p) => I[p.id].adh.state === 'ok').length, adh.length], mrs: [sev.filter((p) => Ins.recovery(p).delta < 0).length, sev.length], risk: L.filter(hiRisk).length };
  };

  /* ---------- danh sách bệnh nhân (chỉ xem) ---------- */
  W.mq = (q) => {
    const [k, a] = (q || 'lvl:all').split(':'), cfg = R.cfg;
    if (k === 'lvl') return { title: a === 'all' ? 'Toàn khoa' : U.lvl[a].t, f: (p) => a === 'all' || lvl(p) === a };
    if (k === 'late') return { title: 'Tin chờ >' + cfg.msgHours + ' giờ', f: (p) => { const w = R.pending(p); return !!w && w.hours > cfg.msgHours; } };
    if (k === 'overdue') return { title: 'Quá hẹn tái khám', f: (p) => S().cls[p.id].reasons.some((r) => r.code === 'overdue') };
    if (k === 'ind') return { title: { bp: 'HA chưa đạt mục tiêu', ldl: 'LDL-C chưa đạt mục tiêu', a1c: 'HbA1c chưa đạt mục tiêu' }[a], f: (p) => (a !== 'a1c' || p.rf.dm === 1) && R.ind(p, cfg)[a].state === 'bad' };
    if (k === 'adh') return { title: 'Tuân thủ thuốc chưa đạt', f: (p) => R.ind(p, cfg).adh.state === 'bad' };
    if (k === 'mrs') return { title: 'Ca nặng chưa cải thiện mRS', f: (p) => Ins.severe(p) && Ins.recovery(p).delta >= 0 };
    if (k === 'risk') return { title: 'Nguy cơ tái phát cao', f: hiRisk };
    return { title: 'Toàn khoa', f: () => true };
  };
  W.ptable = (L, withDoc) => '<div class="tw fill"><table class="tbl list"><thead><tr><th>Bệnh nhân</th>' + (withDoc ? '<th>Bác sĩ</th>' : '') + '<th>Tuổi</th><th>Chẩn đoán</th><th>Lý do</th><th class="r">mRS</th><th class="r">Cập nhật</th><th class="r">Tái khám</th></tr></thead><tbody>' +
    (L.length ? L.map((p) => { const w = W.whyParts(p), has = S().cls[p.id].reasons.length; return '<tr class="ro"><td><span class="who">' + U.mark(lvl(p)) + '<b class="nm" title="' + esc(p.name) + '">' + esc(p.name) + '</b></span></td>' + (withDoc ? '<td class="muted">' + esc(docOf(p).short) + '</td>' : '') + '<td class="muted">' + p.age + ' · ' + U.sexName(p) + '</td><td class="muted">' + esc(U.dxShort(p)) + '</td><td class="clip" title="' + esc(w.all) + '">' + (has ? esc(w.txt) + (w.more ? ' <span class="muted">' + esc(w.more) + '</span>' : '') : '') + '</td><td class="r">' + W.mrsCell(p) + '</td><td class="r muted">' + esc(W.shortTime(p)) + '</td><td class="r muted">' + V.T.fmtDM(p.appt.d) + '</td></tr>'; }).join('') : '<tr><td colspan="8" class="empty">Không có bệnh nhân.</td></tr>') + '</tbody></table></div>';
  W.mlist = () => { const q = W.mq(S().mq), L = byLevel(D.unit.filter(q.f)); return '<div class="page fullh"><div class="page-h"><button class="iconbtn" data-a="mback" aria-label="Về toàn khoa">' + ic('chevL') + '</button><h1>' + esc(q.title) + '</h1><span class="count">' + U.int(L.length) + '</span></div>' + W.ptable(L, true) + '</div>'; };

  /* ---------- Toàn khoa: một bảng, mỗi bác sĩ một hàng, hàng cuối là cả khoa ---------- */
  const rate = ([n, N], q) => '<td class="r" title="' + n + '/' + N + '">' + (q ? '<button class="cellbtn" data-a="mq" data-q="' + q + '" title="Xem ' + (N - n) + ' người chưa đạt">' : '') + (N ? pct(n, N) + '%' : '—') + (q ? '</button>' : '') + '</td>';
  const cnt = (n, cls, q) => '<td class="r' + (cls ? ' ' + cls : '') + '">' + (q ? '<button class="cellbtn" data-a="mq" data-q="' + q + '">' : '') + U.int(n) + (q ? '</button>' : '') + '</td>';
  const drow = (x, g, tot) => cnt(x.n, '', tot && 'lvl:all') + cnt(x.k.act, x.k.act ? 'lv-act' : 'muted', tot && 'lvl:act') + cnt(x.k.watch, x.k.watch ? 'lv-watch' : 'muted', tot && 'lvl:watch') + cnt(x.overdue, x.overdue ? '' : 'muted', tot && 'overdue') + cnt(x.late, x.late ? 'lv-watch' : 'muted', tot && 'late') +
    '<td class="r">' + U.hrs(x.med) + '</td>' + rate(g.bp, tot && 'ind:bp') + rate(g.ldl, tot && 'ind:ldl') + rate(g.a1c, tot && 'ind:a1c') + rate(g.adh, tot && 'adh') + rate(g.mrs, tot && 'mrs') + cnt(g.risk, '', tot && 'risk:any');
  W.overview = () => {
    const h = R.cfg.msgHours, th = (t, tip, span) => '<th class="r"' + (span ? ' rowspan="2"' : '') + (tip ? ' title="' + tip + '"' : '') + '>' + t + '</th>';
    return '<div class="page"><div class="page-h"><h1>Toàn khoa</h1></div><div class="tw"><table class="tbl plain dtbl"><thead><tr><th rowspan="2">Bác sĩ</th>' + th('Bệnh nhân', '', 1) + th(U.mark('act') + 'Can thiệp', 'Cần can thiệp', 1) + th(U.mark('watch') + 'Theo dõi', 'Cần theo dõi', 1) + th('Quá hẹn', 'Quá hẹn tái khám', 1) + th('Tin chờ >' + h + ' giờ', '', 1) + th('Trả lời trung vị', 'Thời gian trả lời tin nhắn, trung vị', 1) +
      '<th class="grp" colspan="5">Đạt mục tiêu</th>' + th('Nguy cơ cao', 'ESRS, SPI-II hoặc CHA₂DS₂-VASc ở mức cao', 1) + '</tr><tr>' + th('HA') + th('LDL‑C') + th('HbA1c', 'Người đái tháo đường') + th('Tuân thủ thuốc') + th('mRS cải thiện', 'Ca nặng (mRS ≥3) có mRS giảm so với lần đầu') + '</tr></thead><tbody>' +
      D.doctors.map((d) => { const L = W.unitOf(d.id); return '<tr data-a="mdoc" data-id="' + d.id + '" tabindex="0"><td class="nm" title="' + esc(d.name) + '"><b>' + esc(d.name) + '</b></td>' + drow(W.stats(L), goals(L)) + '</tr>'; }).join('') +
      '</tbody><tfoot><tr><td><b>Toàn khoa</b></td>' + drow(W.stats(D.unit), goals(D.unit), true) + '</tr></tfoot></table></div></div>';
  };

  /* ---------- một bác sĩ ---------- */
  W.mdoctor = (id) => {
    const d = D.doctors.find((x) => x.id === id) || D.doctors[0], L = byLevel(W.unitOf(d.id)), s = W.stats(L);
    const st = (label, v, cls) => '<span class="hst">' + label + ' <b class="' + (cls || '') + '">' + v + '</b></span>';
    return '<div class="page fullh"><div class="page-h"><button class="iconbtn" data-a="mback" aria-label="Về toàn khoa">' + ic('chevL') + '</button><h1 class="nm" title="' + esc(d.name) + '">' + esc(d.name) + '</h1>' +
      '<span class="hstats">' + st('Bệnh nhân', U.int(s.n)) + st(U.mark('act') + 'Can thiệp', s.k.act, s.k.act ? 'lv-act' : '') + st(U.mark('watch') + 'Theo dõi', s.k.watch, s.k.watch ? 'lv-watch' : '') + st('Tin chờ >' + R.cfg.msgHours + ' giờ', s.late, s.late ? 'lv-watch' : '') + st('Trả lời trung vị', U.hrs(s.med)) + '</span></div>' +
      W.ptable(L, false) + '</div>';
  };

  /* ---------- Tin nhắn: số liệu phản hồi, không đọc nội dung ---------- */
  W.mmsgs = () => {
    const h = R.cfg.msgHours, waits = D.unit.map((p) => ({ p, w: R.pending(p) })).filter((x) => x.w).sort((a, b) => b.w.hours - a.w.hours);
    const row = (d) => { const x = W.stats(W.unitOf(d.id)); return '<tr data-a="mdoc" data-id="' + d.id + '" tabindex="0"><td class="nm" title="' + esc(d.name) + '"><b>' + esc(d.name) + '</b></td><td class="r">' + x.wait + '</td><td class="r' + (x.late ? ' lv-watch' : ' muted') + '">' + x.late + '</td><td class="r">' + U.hrs(x.med) + '</td><td class="r">' + (x.within == null ? '—' : x.within + '%') + '</td></tr>'; };
    const wrow = ({ p, w }) => { const late = w.hours > h; return '<div class="wrow">' + (late ? U.mark('watch') : '<span class="mk"></span>') + '<b class="nm" title="' + esc(p.name) + '">' + esc(p.name) + '</b><span class="muted">' + esc(docOf(p).short) + '</span><span class="sp"></span><span class="' + (late ? 'lv-watch' : 'muted') + '">' + U.hrs(w.hours) + '</span>' + (late ? (S().nudged[p.id] ? '<span class="nudge-gap muted small">Đã nhắc</span>' : '<button class="btn sm nudge-gap" data-a="nudge" data-id="' + p.id + '">Nhắc bác sĩ</button>') : '<span class="nudge-gap"></span>') + '</div>'; };
    return '<div class="page"><div class="page-h"><h1>Tin nhắn</h1></div>' +
      '<div class="tw"><table class="tbl plain dtbl"><thead><tr><th>Bác sĩ</th><th class="r">Đang chờ</th><th class="r">Tin chờ >' + h + ' giờ</th><th class="r">Trả lời trung vị</th><th class="r">Trả lời trong ' + h + ' giờ</th></tr></thead><tbody>' + D.doctors.map(row).join('') + '</tbody></table></div>' +
      '<section class="card"><div class="card-h"><h2>Đang chờ trả lời</h2><span class="count">' + waits.length + '</span></div>' + (waits.length ? waits.map(wrow).join('') : '<div class="empty">Không có tin chờ.</div>') + '</section></div>';
  };

  /* ---------- Ngưỡng cảnh báo (cả khoa): sửa nháp, xem trước số bệnh nhân đổi mức, rồi mới Lưu ---------- */
  // [nhãn, khóa (một hoặc hai: tâm thu / tâm trương), đơn vị, dấu so sánh đứng trước ô]
  const CFG_GROUPS = [
    ['Huyết áp', [['Cảnh báo một lần đo', ['critSys', 'critDia'], 'mmHg', '≥'], ['Trung bình 3 ngày', ['avg3Sys', 'avg3Dia'], 'mmHg', '≥'], ['Trung bình 7 ngày', ['avg7Sys', 'avg7Dia'], 'mmHg', '≥'], ['Mục tiêu', ['bpTargetS', 'bpTargetD'], 'mmHg', '<'], ['Xét lần đo trong (cả đường huyết)', ['critWindow'], 'ngày']]],
    ['Thuốc', [['Bỏ liều chống đông, kháng tiểu cầu: cảnh báo đỏ từ', ['missCount'], 'liều'], ['Đếm bỏ liều trong', ['missWindow'], 'ngày'], ['Tuân thủ đạt', ['adhOk'], '%', '≥'], ['Tuân thủ thấp (kèm nguy cơ tái phát cao)', ['adhLow'], '%', '<']]],
    ['Đường huyết và xét nghiệm', [['Đường huyết thấp / cao', ['gluLow', 'gluHigh'], 'mmol/L'], ['Mục tiêu LDL-C', ['ldlTarget'], 'mmol/L', '<'], ['Mục tiêu HbA1c, đái tháo đường', ['a1cDM'], '%', '≤'], ['Mục tiêu HbA1c, không đái tháo đường', ['a1cNonDM'], '%', '<']]],
    ['Tái khám và dữ liệu', [['Quá hẹn tái khám', ['overdueDays'], 'ngày', '>'], ['Có lịch tái khám trong vòng', ['apptSoonDays'], 'ngày'], ['Không có dữ liệu mới quá', ['staleDays'], 'ngày']]],
    ['Tin nhắn', [['Tin nhắn chờ quá', ['msgHours'], 'giờ']]],
  ];
  W.cfgShift = (draft) => { const next = R.classifyAll(D.unit, draft); return D.unit.filter((p) => next[p.id].level !== S().cls[p.id].level).length; };
  W.thresholds = () => {
    const dr = S().cfgDraft, cur = dr || R.cfg, n = dr ? W.cfgShift(dr) : 0;
    const inp = (k, label) => '<input type="number" min="0" step="any" value="' + cur[k] + '" data-i="cfg" data-k="' + k + '" class="' + (cur[k] !== R.DEFAULT_CFG[k] ? 'changed' : '') + (dr && dr[k] !== R.cfg[k] ? ' draft' : '') + '" aria-label="' + esc(label) + '">';
    const row = ([label, keys, unit, cmp]) => '<tr><td>' + esc(label) + '</td><td class="r"><span class="cfgv">' + (cmp ? '<span class="muted">' + cmp + '</span>' : '') + keys.map((k) => inp(k, label)).join('<span class="muted">/</span>') + '</span></td><td class="muted">' + unit + '</td></tr>';
    return '<div class="page narrow"><div class="page-h"><h1>Ngưỡng cảnh báo</h1><span class="sp"></span>' +
      (dr ? '<span class="' + (n ? 'lv-watch' : 'muted') + '">' + n + ' bệnh nhân đổi mức</span><button class="btn" data-a="cfgcancel">Hủy</button><button class="btn primary" data-a="cfgsave">Lưu</button>' : '<button class="btn" data-a="cfgreset">Khôi phục mặc định</button>') + '</div>' +
      CFG_GROUPS.map(([g, rows]) => '<section class="card"><div class="card-h"><h2>' + g + '</h2></div><table class="tbl plain cfg"><tbody>' + rows.map(row).join('') + '</tbody></table></section>').join('') + '</div>';
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
