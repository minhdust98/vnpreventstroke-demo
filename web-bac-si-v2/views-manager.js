/* VNPreventStroke (demo) · màn chọn vai trò + vai Quản lý (chart tổng hợp, danh sách, ngưỡng) */
(function (g) {
  'use strict';
  const V = g.VNPS, T = V.T, R = V.rules, D = V.data, U = V.ui, esc = U.esc, ic = U.ic;
  const W = (V.views = V.views || {});
  const S = () => V.S;

  W.landing = () => '<div class="landing"><div class="land-card"><div class="brand" style="padding:0 0 10px"><span class="logo">V</span><span class="bt"><b>VNPreventStroke (demo)</b><span>Cổng nhân viên y tế</span></span></div>' +
    '<h1>Chọn cổng làm việc</h1><p class="muted" style="margin:6px 0 0">Tài khoản demo <b>' + esc(D.doctor.name) + '</b> có hai vai trò. Chọn một để vào. Bản demo không yêu cầu mật khẩu và không có mục đăng ký.</p>' +
    '<div class="roles"><button class="role" data-a="role" data-v="doctor"><span class="rh">' + ic('stetho') + 'Bác sĩ</span><span class="muted small">Theo dõi từng bệnh nhân, xử lý cảnh báo hằng ngày.</span><ul><li>Hàng đợi: ai cần can thiệp, ai cần theo dõi</li><li>Hồ sơ chi tiết, tin nhắn, lịch khám</li><li>Công cụ tính nguy cơ</li></ul></button>' +
    '<button class="role" data-a="role" data-v="manager"><span class="rh">' + ic('chart') + 'Quản lý</span><span class="muted small">Nhìn tổng hợp toàn đơn vị theo nhóm bệnh nhân.</span><ul><li>Biểu đồ tổng hợp, có số người trên từng mảng</li><li>Danh sách theo nhóm (chỉ xem, không mở hồ sơ)</li><li>Thang điểm và ngưỡng cảnh báo</li></ul></button></div>' +
    '<div class="legal"><span>' + ic('info', 'sm') + ' Công cụ nghiên cứu, không thay thế quyết định lâm sàng. Dữ liệu minh họa.</span><a href="#" data-a="legal">Chính sách riêng tư</a><a href="#" data-a="legal">Điều khoản sử dụng</a></div></div></div>';

  /* ---------- truy vấn thống kê ---------- */
  const scope = () => D.patients.filter(W.groupOf(S().mgr.group));
  const per = () => S().mgr.period;
  const bpState = (p) => { const a = R.avgBP(p, per()); return !a ? 'none' : a.s < R.cfg.bpTargetS && a.dia < R.cfg.bpTargetD ? 'ok' : 'bad'; };
  const adhPct = (p) => { const a = R.adherence(p, per()); return a ? a.pct : null; };
  const SC = (p) => R.patientScales(p);
  const tierOf = (r) => (!r.applicable ? 'na' : r.missing.length ? 'miss' : r.tier.key);
  W.mq = (q) => {
    const [k, a, b] = q.split(':'), cfg = R.cfg, sc = scope();
    const I = (p) => R.ind(p, cfg);
    let title = '', f = () => true;
    const lvl = (p) => S().cls[p.id].level;
    if (k === 'lvl') { title = a === 'all' ? 'Tất cả bệnh nhân' : U.lvl[a].t; f = (p) => a === 'all' || lvl(p) === a; }
    else if (k === 'stale') { title = 'Chưa nhập dữ liệu >' + cfg.staleDays + ' ngày'; f = (p) => R.staleDays(p) > cfg.staleDays; }
    else if (k === 'site') { title = (a === 'BM' ? 'Bạch Mai' : 'Vinmec Times City') + ' · ' + (b === 'all' ? 'tất cả' : U.lvl[b].t); f = (p) => p.site === a && (b === 'all' || lvl(p) === b); }
    else if (k === 'esrs' || k === 'spi' || k === 'cha') { const nm = { esrs: 'ESRS', spi: 'SPI-II', cha: 'CHA₂DS₂-VASc' }[k], lb = { low: 'thấp', mid: 'trung bình', high: 'cao', miss: 'thiếu biến', na: 'không áp dụng' }[a]; title = nm + ': ' + lb; f = (p) => tierOf(SC(p)[k]) === a; }
    else if (k === 'fsrp') { title = 'FSRP: ' + { pct: 'có % minh họa', u55: 'chưa áp dụng (<55 tuổi)', miss: 'thiếu biến' }[a]; f = (p) => { const r = SC(p).fsrp; return a === 'pct' ? r.applicable && !r.insufficient : a === 'miss' ? r.applicable && r.insufficient : p.dx.type === 'NONE' && !r.applicable; }; }
    else if (k === 'ind') {
      const nm = { bp: 'Huyết áp TB ' + per() + ' ngày', glu: 'Đường huyết đói', ldl: 'LDL-C', a1c: 'HbA1c', bmi: 'BMI', tc: 'Cholesterol toàn phần' }[a], st = { ok: 'đạt mục tiêu', bad: 'cần cải thiện', none: 'chưa có số đo' }[b];
      title = nm + ': ' + st; f = (p) => (a === 'a1c' && p.rf.dm !== 1 ? false : (a === 'bp' ? bpState(p) : I(p)[a].state) === b);
    }
    else if (k === 'cm') { title = 'Bệnh mắc kèm: ' + { htn: 'tăng huyết áp', dm: 'đái tháo đường', af: 'rung nhĩ', mi: 'nhồi máu cơ tim', pad: 'bệnh động mạch ngoại biên', hf: 'suy tim', ocvd: 'bệnh tim mạch khác', prior: 'TIA/đột quỵ trước' }[a]; f = (p) => p.rf[a] === 1; }
    else if (k === 'life') { title = { smoke: 'Hút thuốc', alc: 'Rượu bia', ex: 'Vận động' }[a] + ': ' + { bad: { smoke: 'đang hút', alc: 'vượt mức', ex: '<150 phút/tuần' }[a], ok: { smoke: 'không hút', alc: 'trong mức', ex: '≥150 phút/tuần' }[a] }[b]; f = (p) => I(p)[a].state === b; }
    else if (k === 'adh') { title = 'Tuân thủ thuốc ' + per() + ' ngày: ' + { lt80: '<80%', mid: '80–89%', ge90: '≥90%', priv: 'chưa chia sẻ' }[a]; f = (p) => { const v = adhPct(p); return a === 'priv' ? !p.consentAdh : v != null && (a === 'lt80' ? v < 80 : a === 'mid' ? v >= 80 && v < 90 : v >= 90); }; }
    return { title, list: sc.filter(f) };
  };

  /* ---------- Tổng hợp đơn vị ---------- */
  const seg = (arr) => arr.filter((x) => x.n >= 0);
  const stackRow = (label, sub, segs, total) => '<div class="sl"><div class="lbl">' + esc(label) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div><div>' + U.stack(segs, total, { label }) + '</div></div>';
  W.overview = () => {
    const m = S().mgr, sc = scope(), N = sc.length, cls = S().cls;
    const cnt = (lv, arr) => (arr || sc).filter((p) => cls[p.id].level === lv).length;
    const stale = sc.filter((p) => R.staleDays(p) > R.cfg.staleDays).length;
    const gl = { all: 'Tất cả bệnh nhân', prim: 'Bệnh nhân tiên phát', sec: 'Bệnh nhân thứ phát' }[m.group];
    const pg = (k, t) => '<button class="' + (m.group === k ? 'on' : '') + '" data-a="mgroup" data-v="' + k + '">' + t + '<span class="n">' + D.patients.filter(W.groupOf(k)).length + '</span></button>';
    const pr = (k) => '<button class="' + (m.period === k ? 'on' : '') + '" data-a="mperiod" data-v="' + k + '">' + k + ' ngày</button>';
    const kpi = (cl, lab, icn, v, sub, q) => '<button class="kpi ' + cl + '" data-a="mq" data-q="' + q + '"><div class="kl">' + ic(icn) + lab + '</div><div class="kv">' + v + '<small>bệnh nhân</small></div><div class="ks">' + sub + '</div></button>';
    const pc = (n) => (N ? Math.round((100 * n) / N) : 0) + '% của ' + N;
    const act = cnt('act'), watch = cnt('watch'), ok = cnt('ok');
    // A: theo cơ sở
    const siteRows = [['BM', 'Bạch Mai'], ['VM', 'Vinmec Times City']].map(([k, n]) => { const L = sc.filter((p) => p.site === k); return stackRow(n, L.length + ' bệnh nhân', [{ k: 'act', n: cnt('act', L), label: 'Cần can thiệp', q: 'site:' + k + ':act' }, { k: 'watch', n: cnt('watch', L), label: 'Cần theo dõi', q: 'site:' + k + ':watch' }, { k: 'ok', n: cnt('ok', L), label: 'Ổn định', q: 'site:' + k + ':ok' }], L.length); }).join('');
    // B: phân tầng
    const showSec = m.group !== 'prim', showPrim = m.group !== 'sec';
    const secP = sc.filter((p) => p.dx.type !== 'NONE'), apply = (k) => sc.filter((p) => SC(p)[k].applicable);
    const cntT = (k, t, L) => (L || sc).filter((p) => tierOf(SC(p)[k]) === t).length;
    let B = '';
    if (showSec) {
      const e = apply('esrs'), s2 = apply('spi'), ch = apply('cha');
      B += stackRow('ESRS', e.length + ' BN áp dụng (NMN/TIA) · ' + (secP.length - e.length) + ' không áp dụng (chảy máu não)', seg([{ k: 'low', n: cntT('esrs', 'low'), label: 'Thấp (0–2)', q: 'esrs:low' }, { k: 'high', n: cntT('esrs', 'high'), label: 'Cao (≥3)', q: 'esrs:high' }, { k: 'neutral', n: cntT('esrs', 'miss'), label: 'Thiếu biến', q: 'esrs:miss' }]), e.length);
      B += stackRow('SPI-II', s2.length + ' BN áp dụng', seg([{ k: 'low', n: cntT('spi', 'low'), label: 'Thấp (0–3)', q: 'spi:low' }, { k: 'mid', n: cntT('spi', 'mid'), label: 'Trung bình (4–7)', q: 'spi:mid' }, { k: 'high', n: cntT('spi', 'high'), label: 'Cao (8–15)', q: 'spi:high' }, { k: 'neutral', n: cntT('spi', 'miss'), label: 'Thiếu biến', q: 'spi:miss' }]), s2.length);
      B += stackRow('CHA₂DS₂-VASc', ch.length + ' BN có rung nhĩ', seg([{ k: 'low', n: cntT('cha', 'low'), label: 'Thấp', q: 'cha:low' }, { k: 'mid', n: cntT('cha', 'mid'), label: 'Trung bình', q: 'cha:mid' }, { k: 'high', n: cntT('cha', 'high'), label: 'Cao', q: 'cha:high' }, { k: 'neutral', n: cntT('cha', 'miss'), label: 'Thiếu biến', q: 'cha:miss' }]), ch.length);
    }
    if (showPrim) {
      const pr0 = sc.filter((p) => p.dx.type === 'NONE');
      const a1 = pr0.filter((p) => SC(p).fsrp.applicable && !SC(p).fsrp.insufficient).length, a2 = pr0.filter((p) => !SC(p).fsrp.applicable).length, a3 = pr0.filter((p) => SC(p).fsrp.applicable && SC(p).fsrp.insufficient).length;
      B += stackRow('FSRP 2017', pr0.length + ' BN chưa từng đột quỵ · chưa có mốc phân tầng nên chỉ đếm tình trạng', seg([{ k: 'neutral', n: a1, label: 'Có % minh họa', q: 'fsrp:pct' }, { k: 'gray', n: a2, label: 'Chưa áp dụng (<55 tuổi)', q: 'fsrp:u55' }, { k: 'mid', n: a3, label: 'Thiếu biến', q: 'fsrp:miss' }]), pr0.length);
    }
    // C: chỉ số theo dõi
    const ind = (key, label, sub, L, getter) => { const s = (st) => L.filter((p) => getter(p) === st).length; return stackRow(label, sub, seg([{ k: 'ok2', n: s('ok'), label: 'Đạt mục tiêu', q: 'ind:' + key + ':ok' }, { k: 'bad', n: s('bad'), label: 'Cần cải thiện', q: 'ind:' + key + ':bad' }, { k: 'gray', n: s('none'), label: 'Chưa có số đo', q: 'ind:' + key + ':none' }]), L.length); };
    const dmL = sc.filter((p) => p.rf.dm === 1);
    const C = ind('bp', 'Huyết áp', 'TB ' + per() + ' ngày <130/80 mmHg', sc, bpState) + ind('glu', 'Đường huyết đói', 'lần đo gần nhất ≤5,6 mmol/L', sc, (p) => R.ind(p).glu.state) + ind('ldl', 'LDL-C', 'xét nghiệm gần nhất <' + R.num(R.cfg.ldlTarget, 1) + ' mmol/L', sc, (p) => R.ind(p).ldl.state) + ind('a1c', 'HbA1c', 'chỉ người đái tháo đường (' + dmL.length + ') · ≤' + R.num(R.cfg.a1cDM, 1) + '%', dmL, (p) => R.ind(p).a1c.state) + ind('bmi', 'BMI', 'bình thường 18,5–22,9 kg/m²', sc, (p) => R.ind(p).bmi.state) + ind('tc', 'Cholesterol toàn phần', 'xét nghiệm gần nhất <5,2 mmol/L', sc, (p) => R.ind(p).tc.state);
    // D: bệnh kèm
    const cmRows = [['htn', 'Tăng huyết áp'], ['dm', 'Đái tháo đường'], ['af', 'Rung nhĩ'], ['mi', 'Nhồi máu cơ tim'], ['pad', 'Bệnh động mạch ngoại biên'], ['hf', 'Suy tim'], ['ocvd', 'Bệnh tim mạch khác'], ['prior', 'TIA/đột quỵ trước biến cố hiện tại']].map(([k, n]) => { const unk = sc.filter((p) => p.rf[k] == null).length; return U.hbar(n, sc.filter((p) => p.rf[k] === 1).length, N, 'cm:' + k, unk ? unk + ' bệnh nhân chưa rõ' : ''); }).join('');
    // E: lối sống
    const ls = (key, label, sub, okl, badl, qa) => { const o = sc.filter((p) => R.ind(p)[key].state === 'ok').length, b = sc.filter((p) => R.ind(p)[key].state === 'bad').length; return stackRow(label, sub, [{ k: 'ok2', n: o, label: okl, q: 'life:' + key + ':ok' }, { k: 'bad', n: b, label: badl, q: 'life:' + key + ':bad' }], N); };
    const maxAlc = sc.reduce((a, p) => (p.life.alc > a.v ? { v: p.life.alc, id: p.id } : a), { v: 0, id: '' });
    const E = ls('smoke', 'Hút thuốc lá', 'đang hút so với không hút', 'Không hút', 'Đang hút') + ls('alc', 'Rượu bia', 'nam ≤2, nữ ≤1 đơn vị/ngày', 'Trong mức', 'Vượt mức') + ls('ex', 'Vận động', 'đơn vị: phút/tuần · mục tiêu ≥150', '≥150 phút/tuần', '<150 phút/tuần') + '<div class="xs muted">Rượu cao nhất trong nhóm: <b>' + R.num(maxAlc.v, 1) + ' đơn vị/ngày</b> (' + maxAlc.id + '). 1 đơn vị = 10 g cồn.</div>';
    // F: tuân thủ
    const ad = (f) => sc.filter((p) => p.consentAdh && adhPct(p) != null && f(adhPct(p))).length;
    const F = U.columns([{ label: '<80%', n: ad((v) => v < 80), k: 'high', q: 'adh:lt80' }, { label: '80–89%', n: ad((v) => v >= 80 && v < 90), k: 'mid', q: 'adh:mid' }, { label: '≥90%', n: ad((v) => v >= 90), k: 'low', q: 'adh:ge90' }, { label: 'Chưa chia sẻ', n: sc.filter((p) => !p.consentAdh).length, k: 'neutral', q: 'adh:priv' }], { xTitle: 'Tuân thủ thuốc ' + per() + ' ngày qua (% liều đã uống)', label: 'Phân bố tuân thủ thuốc' });
    const card = (t, sub, body, cls) => '<section class="card ' + (cls || '') + '"><div class="card-h"><h3>' + t + '</h3><span class="muted xs">' + sub + '</span></div><div class="card-b">' + body + '</div></section>';
    return '<div class="mgr"><div class="page-h"><h1>Tổng hợp đơn vị</h1><span class="scope">Đang xem: <b>' + gl + '</b> · HA và tuân thủ tính trên <b>' + per() + ' ngày</b> · <b>' + N + '/' + D.patients.length + '</b> bệnh nhân</span><span class="sp"></span><div class="seg">' + pg('all', 'Tất cả') + pg('prim', 'Tiên phát') + pg('sec', 'Thứ phát') + '</div><div class="seg">' + pr(7) + pr(30) + '</div></div>' +
      '<div class="kpis m5">' + kpi('', 'Đang quản lý', 'users', N, D.patients.length === N ? 'toàn đơn vị' : pc(N), 'lvl:all') + kpi('act', 'Cần can thiệp', 'alert', act, pc(act), 'lvl:act') + kpi('watch', 'Cần theo dõi', 'watch', watch, pc(watch), 'lvl:watch') + kpi('ok', 'Ổn định', 'check', ok, pc(ok), 'lvl:ok') + kpi('', 'Chưa nhập >' + R.cfg.staleDays + ' ngày', 'dash', stale, pc(stale), 'stale') + '</div>' +
      '<div class="mgr-grid">' + card('Mức theo dõi theo cơ sở', 'số bệnh nhân trên từng mảng · bấm để xem danh sách', siteRows) + card('Phân tầng nguy cơ', 'mốc phân tầng cần BS xác nhận', B || '<span class="muted">Không có nhóm áp dụng.</span>') +
      card('Chỉ số theo dõi', 'đạt / chưa đạt mục tiêu theo bảng §4.2', C + '<div class="xs muted" style="margin-top:6px">Phân loại 5 mức riêng từng yếu tố (Bình thường, Độ 1, Độ 2, Cận ngưỡng, Nặng) đang chờ tiêu chí lâm sàng, demo dùng 2 mức.</div>') + card('Bệnh mắc kèm', 'từ hồ sơ sức khỏe, không gồm tiền sử gia đình · số BN / ' + N, cmRows) +
      card('Lối sống', 'số bệnh nhân', E) + card('Tuân thủ thuốc', 'số bệnh nhân theo khoảng tuân thủ', F) + '</div></div>';
  };

  W.mlist = () => {
    const { title, list } = W.mq(S().mq || 'lvl:all'), cls = S().cls;
    return '<div class="page" style="height:100%"><div class="page-h"><button class="btn" data-a="mback">' + ic('chevL') + 'Quay lại tổng hợp</button><h1>' + esc(title) + '</h1><span class="scope"><b>' + list.length + '</b> bệnh nhân · ' + { all: 'Tất cả', prim: 'Tiên phát', sec: 'Thứ phát' }[S().mgr.group] + '</span></div><div class="infobox" style="margin:0">Vai Quản lý chỉ xem danh sách, <b>không mở hồ sơ bệnh án</b> (quyền hạn minh họa, cần chốt: quản lý có được xem danh tính bệnh nhân không).</div>' +
      '<div class="tw fill"><div class="scroll" style="flex:1"><table class="tbl plain"><thead><tr><th>Mức theo dõi</th><th>Bệnh nhân</th><th>Tuổi · Giới</th><th>Chẩn đoán</th><th>Cơ sở</th><th>Lý do chính</th></tr></thead><tbody>' + (list.length ? list.map((p) => '<tr><td>' + U.chip(cls[p.id].level) + '</td><td><b>' + esc(p.name) + '</b> <span class="xs muted">' + p.id + '</span></td><td>' + p.age + ' · ' + U.sexName(p) + '</td><td>' + esc(U.dxShort(p)) + '</td><td>' + U.site(p) + '</td><td class="small">' + W.why(p, 2) + '</td></tr>').join('') : '<tr><td colspan="6" class="empty">Không có bệnh nhân trong nhóm này.</td></tr>') + '</tbody></table></div></div></div>';
  };

  /* ---------- Thang điểm & ngưỡng ---------- */
  const CFGF = [['critSys', 'Huyết áp tâm thu cảnh báo (một lần đo)', 'mmHg'], ['critDia', 'Huyết áp tâm trương cảnh báo (một lần đo)', 'mmHg'], ['critWindow', 'Cửa sổ cho "bất kỳ lần đo" và đường huyết', 'ngày'], ['avg3Sys', 'HA trung bình 3 ngày: tâm thu', 'mmHg'], ['avg3Dia', 'HA trung bình 3 ngày: tâm trương', 'mmHg'], ['avg7Sys', 'HA trung bình 7 ngày: tâm thu', 'mmHg'], ['avg7Dia', 'HA trung bình 7 ngày: tâm trương', 'mmHg'], ['missWindow', 'Cửa sổ đếm bỏ liều chống đông/kháng tiểu cầu', 'ngày'], ['missCount', 'Số liều bỏ để cảnh báo đỏ', 'liều'], ['gluLow', 'Đường huyết thấp', 'mmol/L'], ['gluHigh', 'Đường huyết cao', 'mmol/L'], ['overdueDays', 'Quá hẹn tái khám', 'ngày'], ['adhLow', 'Tuân thủ thấp (kèm nguy cơ tái phát cao)', '%'], ['adhOk', 'Tuân thủ đạt', '%'], ['staleDays', 'Không có dữ liệu mới quá', 'ngày'], ['ldlTarget', 'Mục tiêu LDL-C (nhỏ hơn)', 'mmol/L'], ['a1cDM', 'Mục tiêu HbA1c người đái tháo đường [Đề xuất]', '%'], ['a1cNonDM', 'Mục tiêu HbA1c người không đái tháo đường (nhỏ hơn)', '%'], ['msgHours', 'Tin nhắn chờ quá', 'giờ'], ['apptSoonDays', 'Có lịch tái khám trong vòng', 'ngày'], ['bpTargetS', 'Mục tiêu HA tâm thu (nhỏ hơn)', 'mmHg'], ['bpTargetD', 'Mục tiêu HA tâm trương (nhỏ hơn)', 'mmHg']];
  W.thresholds = () => {
    const c = R.counts(D.patients, S().cls), def = R.DEFAULT_CFG;
    const scales = [['ESRS', 'ESRS · bảng điểm file 00 §4.1', 'Phân tầng 0–2 thấp, ≥3 cao: cần BS xác nhận'], ['SPI-II', 'SPI-II · bảng điểm file 00 §4.1', '0–3 thấp, 4–7 trung bình, 8–15 cao: cần BS xác nhận'], ['FSRP 2017', 'Dufouil_2017 (khung nhập liệu)', 'Chưa có hệ số: % chỉ là minh họa'], ['CHA₂DS₂-VASc', 'CHA2DS2-VASc · BRD v6', 'Bảng điểm theo BRD'], ['ABCD2', 'ABCD2 · BRD v6', 'BRD để trống ô tuổi và HA: cần xác nhận']];
    return '<div class="page" style="max-width:980px"><div class="page-h"><h1>Thang điểm và ngưỡng</h1><span class="scope">Kết quả: <b>' + c.act + '</b> cần can thiệp · <b>' + c.watch + '</b> cần theo dõi · <b>' + c.ok + '</b> ổn định</span><span class="sp"></span><button class="btn" data-a="cfgreset">Khôi phục mặc định</button></div>' +
      '<p class="muted" style="margin:0">Hệ số và ngưỡng cấu hình được (BRD). Đổi giá trị thì phân loại ở cổng Bác sĩ và tổng hợp ở cổng Quản lý đổi theo ngay. Toàn bộ ngưỡng ở mục 4.3 là <b>[Đề xuất – cần bác sĩ duyệt]</b>.</p>' +
      '<section class="card"><div class="card-h"><h3>Thang điểm</h3></div><table class="tbl plain"><thead><tr><th style="position:static">Thang</th><th style="position:static">Phiên bản thuật toán</th><th style="position:static">Ghi chú</th><th style="position:static">Bật</th></tr></thead><tbody>' + scales.map((s) => '<tr><td><b>' + s[0] + '</b></td><td><code>' + esc(s[1]) + '</code></td><td class="small">' + esc(s[2]) + '</td><td><input type="checkbox" checked data-i="demo" aria-label="Bật ' + s[0] + '"></td></tr>').join('') + '</tbody></table></section>' +
      '<section class="card"><div class="card-h"><h3>Ngưỡng cảnh báo</h3><span class="muted xs">Giá trị khác mặc định được tô màu</span></div><table class="tbl plain cfg-tbl"><thead><tr><th style="position:static">Tiêu chí</th><th class="r" style="position:static">Giá trị</th><th style="position:static">Đơn vị</th><th class="r" style="position:static">Mặc định</th></tr></thead><tbody>' + CFGF.map(([k, n, u]) => '<tr><td>' + esc(n) + '</td><td class="r"><input type="number" step="any" value="' + R.cfg[k] + '" data-i="cfg" data-k="' + k + '" style="' + (R.cfg[k] !== def[k] ? 'border-color:var(--accent);background:var(--accent-soft)' : '') + '" aria-label="' + esc(n) + '"></td><td>' + u + '</td><td class="r muted">' + def[k] + '</td></tr>').join('') + '</tbody></table></section></div>';
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
