/* VNPreventStroke (demo) · màn chọn vai trò + cổng Quản lý: toàn khoa, từng bác sĩ, tin nhắn, ngưỡng.
 * Quản lý xem danh sách và số liệu, không mở hồ sơ bệnh án, không đọc nội dung tin nhắn. */
(function (g) {
  'use strict';
  const V = g.VNPS, T = V.T, R = V.rules, D = V.data, U = V.ui, Ins = V.ins, esc = U.esc, ic = U.ic;
  const W = (V.views = V.views || {});
  const S = () => V.S;
  const lvl = (p) => S().cls[p.id].level;
  const RANK = { act: 0, watch: 1, ok: 2 };
  const pct = (n, N) => (N ? Math.round((100 * n) / N) : 0);
  const hrs = (h) => (h == null ? '—' : h < 1 ? '<1 giờ' : h < 48 ? Math.round(h) + ' giờ' : Math.round(h / 24) + ' ngày');
  const docOf = (p) => D.doctors.find((d) => d.id === p.doc);
  const siteName = (d) => (d.site === 'VM' ? 'Vinmec Times City' : 'Bạch Mai');

  W.landing = () => '<div class="landing"><div class="land"><div class="brand"><span class="logo">V</span><b>VNPreventStroke</b></div><h1>Chọn cổng</h1><div class="roles">' +
    '<button class="role" data-a="role" data-v="doctor">' + ic('stetho') + '<b>Bác sĩ</b></button><button class="role" data-a="role" data-v="manager">' + ic('chart') + '<b>Quản lý</b></button></div>' +
    '<div class="legal"><a href="#" data-a="legal">Chính sách riêng tư</a><a href="#" data-a="legal">Điều khoản sử dụng</a></div></div></div>';

  /* ---------- số liệu ---------- */
  W.unitOf = (id) => D.unit.filter((p) => p.doc === id);
  W.stats = (L) => {
    const k = { act: 0, watch: 0, ok: 0 }; L.forEach((p) => { k[lvl(p)]++; });
    const wait = L.map(R.pending).filter(Boolean), rep = [].concat.apply([], L.map(Ins.replyHours));
    return { n: L.length, k, convo: L.filter((p) => p.thread.length).length, wait: wait.length, late: wait.filter((w) => w.hours > R.cfg.msgHours).length, med: Ins.median(rep), within: rep.length ? pct(rep.filter((h) => h <= R.cfg.msgHours).length, rep.length) : null, overdue: L.filter((p) => S().cls[p.id].reasons.some((r) => r.code === 'overdue')).length };
  };
  W.tri = (k) => '<span class="tri" role="img" aria-label="' + k.act + ' cần can thiệp, ' + k.watch + ' cần theo dõi, ' + k.ok + ' ổn định"><i style="flex:' + k.act + ';background:var(--act)"></i><i style="flex:' + k.watch + ';background:var(--watch)"></i><i style="flex:' + k.ok + ';background:var(--ok)"></i></span>';
  const byLevel = (L) => L.slice().sort((a, b) => RANK[lvl(a)] - RANK[lvl(b)] || a.name.localeCompare(b.name, 'vi'));

  /* ---------- danh sách bệnh nhân (chỉ xem) ---------- */
  const RISK = { esrs: 'ESRS', spi: 'SPI-II', cha: 'CHA₂DS₂-VASc' };
  W.mq = (q) => {
    const [k, a] = (q || 'lvl:all').split(':'), cfg = R.cfg;
    if (k === 'lvl') return { title: a === 'all' ? 'Toàn khoa' : U.lvl[a].t, f: (p) => a === 'all' || lvl(p) === a };
    if (k === 'late') return { title: 'Tin chờ quá ' + cfg.msgHours + ' giờ', f: (p) => { const w = R.pending(p); return !!w && w.hours > cfg.msgHours; } };
    if (k === 'overdue') return { title: 'Quá hẹn tái khám', f: (p) => S().cls[p.id].reasons.some((r) => r.code === 'overdue') };
    if (k === 'ind') return { title: { bp: 'HA chưa đạt mục tiêu', ldl: 'LDL-C chưa đạt mục tiêu', a1c: 'HbA1c chưa đạt mục tiêu' }[a], f: (p) => (a !== 'a1c' || p.rf.dm === 1) && R.ind(p, cfg)[a].state === 'bad' };
    if (k === 'adh') return { title: 'Tuân thủ thuốc dưới ' + cfg.adhOk + '%', f: (p) => R.ind(p, cfg).adh.state === 'bad' };
    if (k === 'mrs') return { title: 'Ca nặng chưa cải thiện mRS', f: (p) => Ins.severe(p) && Ins.recovery(p).delta >= 0 };
    if (k === 'risk') return { title: RISK[a] + ' cao', f: (p) => { const r = R.patientScales(p)[a]; return r.applicable && !!r.tier && r.tier.key === 'high'; } };
    return { title: 'Toàn khoa', f: () => true };
  };
  W.ptable = (L, withDoc) => '<div class="tw fill"><table class="tbl list"><thead><tr><th>Bệnh nhân</th>' + (withDoc ? '<th>Bác sĩ</th>' : '') + '<th>Tuổi</th><th>Chẩn đoán</th><th>Lý do</th><th class="r">mRS</th><th class="r">Cập nhật</th><th class="r">Tái khám</th></tr></thead><tbody>' +
    (L.length ? L.map((p) => { const w = W.whyParts(p), has = S().cls[p.id].reasons.length; return '<tr class="ro"><td><span class="who">' + U.mark(lvl(p)) + '<b>' + esc(p.name) + '</b></span></td>' + (withDoc ? '<td class="muted">' + esc(docOf(p).short) + '</td>' : '') + '<td class="muted">' + p.age + ' · ' + U.sexName(p) + '</td><td class="muted">' + esc(U.dxShort(p)) + '</td><td class="clip" title="' + esc(w.all) + '">' + (has ? esc(w.txt) + (w.more ? ' <span class="muted">' + esc(w.more) + '</span>' : '') : '') + '</td><td class="r">' + W.mrsCell(p) + '</td><td class="r muted">' + esc(W.shortTime(p)) + '</td><td class="r muted">' + T.fmtDM(p.appt.d) + '</td></tr>'; }).join('') : '<tr><td colspan="8" class="empty">Không có bệnh nhân.</td></tr>') + '</tbody></table></div>';
  W.mlist = () => { const q = W.mq(S().mq), L = byLevel(D.unit.filter(q.f)); return '<div class="page fullh"><div class="page-h"><button class="iconbtn" data-a="mback" aria-label="Về toàn khoa">' + ic('chevL') + '</button><h1>' + esc(q.title) + '</h1><span class="count">' + L.length + '</span></div>' + W.ptable(L, true) + '</div>'; };

  /* ---------- Toàn khoa ---------- */
  const kpi = (cls, q, label, v, foot) => '<button class="kpi ' + cls + '"' + (q ? ' data-a="mq" data-q="' + q + '"' : '') + '><div class="kl">' + label + '</div><div class="kv">' + v + '</div><div class="ks">' + (foot || '') + '</div></button>';
  const meter = (label, n, N, q, tone) => '<button class="mrow" data-a="mq" data-q="' + q + '"><span>' + label + '</span><span class="meter"><i class="' + (tone || '') + '" style="width:' + pct(n, N) + '%"></i></span><b>' + pct(n, N) + '%</b><span class="muted">' + n + '/' + N + '</span></button>';
  W.overview = () => {
    const L = D.unit, s = W.stats(L), cfg = R.cfg, ind = (p) => R.ind(p, cfg);
    const has = (k) => L.filter((p) => ind(p)[k].state !== 'none'), dm = L.filter((p) => p.rf.dm === 1 && ind(p).a1c.state !== 'none'), adh = L.filter((p) => ind(p).adh.v), sev = L.filter(Ins.severe);
    const ok = (A, k) => A.filter((p) => ind(p)[k].state === 'ok').length;
    const sc = {}; L.forEach((p) => { sc[p.id] = R.patientScales(p); });
    const risk = (k) => { const A = L.filter((p) => sc[p.id][k].applicable && sc[p.id][k].tier); return meter(RISK[k], A.filter((p) => sc[p.id][k].tier.key === 'high').length, A.length, 'risk:' + k, 'act'); };
    const row = (d) => { const x = W.stats(W.unitOf(d.id)); return '<tr data-a="mdoc" data-id="' + d.id + '" tabindex="0" title="' + siteName(d) + '"><td><b>' + esc(d.name) + '</b></td><td class="r">' + x.n + '</td><td class="wtri">' + W.tri(x.k) + '</td><td class="r lv-act">' + x.k.act + '</td><td class="r lv-watch">' + x.k.watch + '</td><td class="r' + (x.late ? ' lv-watch' : ' muted') + '">' + x.late + '</td><td class="r">' + hrs(x.med) + '</td></tr>'; };
    return '<div class="page"><div class="page-h"><h1>Toàn khoa</h1></div>' +
      '<div class="kpis">' + kpi('', 'lvl:all', 'Bệnh nhân', s.n, W.tri(s.k)) + kpi('act', 'lvl:act', U.mark('act') + 'Cần can thiệp', s.k.act) + kpi('watch', 'lvl:watch', U.mark('watch') + 'Cần theo dõi', s.k.watch) + kpi('', 'late', 'Tin chờ quá ' + cfg.msgHours + ' giờ', s.late) + kpi('', 'overdue', 'Quá hẹn tái khám', s.overdue) + '</div>' +
      '<div class="mgrid"><section class="card"><table class="tbl dtbl"><thead><tr><th>Bác sĩ</th><th class="r">Bệnh nhân</th><th></th><th class="r">Can thiệp</th><th class="r">Theo dõi</th><th class="r" title="Tin chờ quá ' + cfg.msgHours + ' giờ">Tin chờ</th><th class="r" title="Thời gian trả lời trung vị">Trả lời</th></tr></thead><tbody>' + D.doctors.map(row).join('') + '</tbody></table></section>' +
      '<div class="mcol"><section class="card"><div class="card-h"><h3>Đạt mục tiêu</h3></div><div class="meters">' +
      meter('Huyết áp', ok(has('bp'), 'bp'), has('bp').length, 'ind:bp') + meter('LDL-C', ok(has('ldl'), 'ldl'), has('ldl').length, 'ind:ldl') + meter('HbA1c (đái tháo đường)', ok(dm, 'a1c'), dm.length, 'ind:a1c') + meter('Tuân thủ thuốc', ok(adh, 'adh'), adh.length, 'adh') + meter('Ca nặng cải thiện mRS', sev.filter((p) => Ins.recovery(p).delta < 0).length, sev.length, 'mrs') +
      '</div></section><section class="card"><div class="card-h"><h3>Nguy cơ tái phát cao</h3></div><div class="meters">' + risk('esrs') + risk('spi') + risk('cha') + '</div></section></div></div></div>';
  };

  /* ---------- một bác sĩ ---------- */
  W.mdoctor = (id) => {
    const d = D.doctors.find((x) => x.id === id) || D.doctors[0], L = byLevel(W.unitOf(d.id)), s = W.stats(L);
    return '<div class="page fullh"><div class="page-h"><button class="iconbtn" data-a="mback" aria-label="Về toàn khoa">' + ic('chevL') + '</button><h1>' + esc(d.name) + '</h1><span class="muted">' + siteName(d) + '</span></div>' +
      '<div class="kpis">' + kpi('', '', 'Bệnh nhân', s.n, W.tri(s.k)) + kpi('act', '', U.mark('act') + 'Cần can thiệp', s.k.act) + kpi('watch', '', U.mark('watch') + 'Cần theo dõi', s.k.watch) + kpi('', '', 'Tin chờ quá ' + R.cfg.msgHours + ' giờ', s.late) + kpi('', '', 'Trả lời trung vị', hrs(s.med)) + '</div>' +
      W.ptable(L, false) + '</div>';
  };

  /* ---------- Tin nhắn: số liệu phản hồi, không đọc nội dung ---------- */
  W.mmsgs = () => {
    const cfg = R.cfg, waits = D.unit.map((p) => ({ p, w: R.pending(p) })).filter((x) => x.w).sort((a, b) => b.w.hours - a.w.hours);
    const row = (d) => { const x = W.stats(W.unitOf(d.id)); return '<tr data-a="mdoc" data-id="' + d.id + '" tabindex="0"><td><b>' + esc(d.name) + '</b></td><td class="r">' + x.convo + '</td><td class="r">' + x.wait + '</td><td class="r' + (x.late ? ' lv-watch' : ' muted') + '">' + x.late + '</td><td class="r">' + hrs(x.med) + '</td><td class="r">' + (x.within == null ? '—' : x.within + '%') + '</td></tr>'; };
    const wrow = ({ p, w }) => { const late = w.hours > cfg.msgHours; return '<div class="wrow">' + U.mark(late ? 'watch' : 'ok') + '<b>' + esc(p.name) + '</b><span class="muted">' + esc(docOf(p).short) + '</span><span class="sp"></span><span class="' + (late ? 'lv-watch' : 'muted') + '">' + hrs(w.hours) + '</span>' + (late ? (S().nudged[p.id] ? '<span class="muted small">Đã nhắc</span>' : '<button class="btn sm" data-a="nudge" data-id="' + p.id + '">Nhắc bác sĩ</button>') : '<span class="nudge-gap"></span>') + '</div>'; };
    return '<div class="page"><div class="page-h"><h1>Tin nhắn</h1></div>' +
      '<section class="card"><table class="tbl dtbl"><thead><tr><th>Bác sĩ</th><th class="r">Hội thoại</th><th class="r">Đang chờ</th><th class="r">Chờ quá ' + cfg.msgHours + ' giờ</th><th class="r">Trả lời trung vị</th><th class="r">Trả lời trong ' + cfg.msgHours + ' giờ</th></tr></thead><tbody>' + D.doctors.map(row).join('') + '</tbody></table></section>' +
      '<section class="card"><div class="card-h"><h3>Đang chờ trả lời</h3><span class="count">' + waits.length + '</span></div>' + (waits.length ? waits.map(wrow).join('') : '<div class="empty">Không có tin chờ.</div>') + '</section></div>';
  };

  /* ---------- Ngưỡng cảnh báo (áp dụng cho cả khoa) ---------- */
  const CFGF = [['critSys', 'HA tâm thu cảnh báo (một lần đo)', 'mmHg'], ['critDia', 'HA tâm trương cảnh báo (một lần đo)', 'mmHg'], ['critWindow', 'Cửa sổ cho "bất kỳ lần đo" và đường huyết', 'ngày'], ['avg3Sys', 'HA trung bình 3 ngày: tâm thu', 'mmHg'], ['avg3Dia', 'HA trung bình 3 ngày: tâm trương', 'mmHg'], ['avg7Sys', 'HA trung bình 7 ngày: tâm thu', 'mmHg'], ['avg7Dia', 'HA trung bình 7 ngày: tâm trương', 'mmHg'], ['missWindow', 'Cửa sổ đếm bỏ liều chống đông/kháng tiểu cầu', 'ngày'], ['missCount', 'Số liều bỏ để cảnh báo đỏ', 'liều'], ['gluLow', 'Đường huyết thấp', 'mmol/L'], ['gluHigh', 'Đường huyết cao', 'mmol/L'], ['overdueDays', 'Quá hẹn tái khám', 'ngày'], ['adhLow', 'Tuân thủ thấp (kèm nguy cơ tái phát cao)', '%'], ['adhOk', 'Tuân thủ đạt', '%'], ['staleDays', 'Không có dữ liệu mới quá', 'ngày'], ['ldlTarget', 'Mục tiêu LDL-C (nhỏ hơn)', 'mmol/L'], ['a1cDM', 'Mục tiêu HbA1c người đái tháo đường', '%'], ['a1cNonDM', 'Mục tiêu HbA1c người không đái tháo đường (nhỏ hơn)', '%'], ['msgHours', 'Tin nhắn chờ quá', 'giờ'], ['apptSoonDays', 'Có lịch tái khám trong vòng', 'ngày'], ['bpTargetS', 'Mục tiêu HA tâm thu (nhỏ hơn)', 'mmHg'], ['bpTargetD', 'Mục tiêu HA tâm trương (nhỏ hơn)', 'mmHg']];
  W.thresholds = () => '<div class="page narrow"><div class="page-h"><h1>Ngưỡng cảnh báo</h1><span class="sp"></span><button class="btn" data-a="cfgreset">Khôi phục mặc định</button></div><section class="card"><table class="tbl plain cfg"><tbody>' +
    CFGF.map(([k, n, u]) => '<tr><td>' + esc(n) + '</td><td class="r"><input type="number" step="any" value="' + R.cfg[k] + '" data-i="cfg" data-k="' + k + '"' + (R.cfg[k] !== R.DEFAULT_CFG[k] ? ' class="changed"' : '') + ' aria-label="' + esc(n) + '"></td><td class="muted">' + u + '</td></tr>').join('') + '</tbody></table></section></div>';
})(typeof globalThis !== 'undefined' ? globalThis : window);
