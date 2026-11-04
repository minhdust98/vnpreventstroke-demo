/* VNPreventStroke (demo) · quy tắc lâm sàng. Nguồn: 00_Chung §4 (và BRD v6 cho CHA₂DS₂-VASc, ABCD2).
 * Mức 🔴🟡🟢 = [Đề xuất – cần bác sĩ duyệt] (§4.3). Mọi ngưỡng nằm trong CFG, chỉnh được ở vai Quản lý.
 * KHÔNG có hệ số FSRP: % nguy cơ FSRP là số minh họa nạp sẵn trong dữ liệu mẫu.
 */
(function (g) {
  'use strict';
  const V = g.VNPS; const T = V.T; const D = V.data;
  const R = (V.rules = {});

  R.DEFAULT_CFG = {
    critSys: 180, critDia: 120, critWindow: 3,   // M5: cửa sổ 3 ngày
    avg3Sys: 160, avg3Dia: 100,
    avg7Sys: 140, avg7Dia: 90,
    missWindow: 7, missCount: 2,
    gluLow: 3.9, gluHigh: 16.7,
    overdueDays: 7,
    adhLow: 80, adhOk: 90,
    staleDays: 7,
    ldlTarget: 2.6, a1cDM: 7.0, a1cNonDM: 5.7,
    msgHours: 24, apptSoonDays: 7,
    bpTargetS: 130, bpTargetD: 80,
  };
  R.cfg = Object.assign({}, R.DEFAULT_CFG);

  /* ---------- tiện ích định dạng (tiếng Việt: dấu phẩy thập phân) ---------- */
  const num = (x, d) => (x == null || isNaN(x) ? '—' : (d == null ? String(x) : Number(x).toFixed(d)).replace('.', ','));
  const lc = (s) => s.toLowerCase();
  R.num = num;
  R.when = (d, h) => {
    if (d === 0) return h < 12 ? 'sáng nay' : 'hôm nay';
    if (d === -1) return h < 12 ? 'sáng qua' : 'tối qua';
    return T.fmtDM(d);
  };
  R.stamp = (d, h) => T.fmtH(h) + ' ' + (d === 0 ? 'hôm nay' : d === -1 ? 'hôm qua' : T.fmtDM(d));

  /* ---------- đại lượng suy ra từ dữ liệu ---------- */
  R.avgBP = (p, days) => {
    const L = p.bp.filter((x) => x.d >= -(days - 1) && x.d <= 0);
    if (!L.length) return null;
    return { s: Math.round(L.reduce((a, x) => a + x.s, 0) / L.length), dia: Math.round(L.reduce((a, x) => a + x.dia, 0) / L.length), n: L.length };
  };
  R.lastBP = (p) => p.bp[p.bp.length - 1] || null;
  R.lastGlu = (p) => p.glu[p.glu.length - 1] || null;
  R.lastW = (p) => p.weight[p.weight.length - 1] || null;
  R.bmi = (p) => { const w = R.lastW(p); return w ? Math.round((w.kg / Math.pow(p.ht / 100, 2)) * 10) / 10 : null; };
  R.lab = (p, k) => { const a = p.labs[k]; return a && a.length ? a[a.length - 1] : null; };
  R.adherence = (p, days) => {
    if (!p.consentAdh) return null;
    let t = 0, m = 0;
    const from = 30 - (days || 30);
    p.meds.forEach((x) => x.log.forEach((c, i) => { if (i < from) return; for (const ch of c) { if (ch === 'T') t++; else if (ch === 'M') m++; } }));
    return t + m ? { pct: Math.round((100 * t) / (t + m)), taken: t, missed: m } : null;
  };
  R.misses = (p, fromD, critOnly) => {
    const out = [];
    p.meds.forEach((m) => {
      if (critOnly && !D.isCrit(m.cls)) return;
      m.log.forEach((c, i) => {
        const d = i - 30;
        if (d < fromD) return;
        for (let s = 0; s < c.length; s++) if (c[s] === 'M') out.push({ d, med: m.name, cls: m.cls, slot: s, time: m.times[s], h: parseInt(m.times[s], 10) + parseInt(m.times[s].slice(3), 10) / 60 });
      });
    });
    return out.sort((a, b) => a.d - b.d || a.h - b.h);
  };
  R.staleDays = (p) => -p.lastData.d;
  R.pending = (p) => {
    const t = p.thread; if (!t.length) return null;
    const l = t[t.length - 1];
    return l.from === 'bs' ? null : { d: l.d, h: l.h, hours: Math.round(T.hoursAgo(l.d, l.h) * 10) / 10, text: l.text };
  };
  R.targets = (p, cfg) => ({
    ldl: p.targets.ldl != null ? p.targets.ldl : cfg.ldlTarget,
    a1c: p.targets.a1c != null ? p.targets.a1c : (p.rf.dm === 1 ? cfg.a1cDM : cfg.a1cNonDM),
  });
  R.a1cExceeds = (p, v, cfg) => (p.rf.dm === 1 ? v > R.targets(p, cfg).a1c : v >= R.targets(p, cfg).a1c);

  /* ---------- thang điểm (dùng chung cho hồ sơ và công cụ tính) ---------- */
  // inp: {age, sex, event: 'NMN'|'TIA'|'CMN'|'NONE', htn, dm, smoke, af, mi, pad, hf, ocvd, prior}; 1/0/null (null/undefined = chưa rõ)
  const tri = (v) => (v === 1 || v === 0 ? v : null);
  const yn = (v) => (v === 1 ? 'Có' : 'Không');
  const NA = (scale, why, version) => ({ scale, applicable: false, naReason: why, version });
  const DATE = T.fmtDMY(0);

  function finish(scale, used, missing, miss, tierFn, version, extra) {
    const score = used.reduce((a, x) => a + x.pts, 0);
    const maxPossible = score + miss;
    const tier = tierFn(score);
    const couldChange = missing.length > 0 && tierFn(maxPossible).key !== tier.key;
    return Object.assign({ scale, applicable: true, score, used, missing, tier, partial: missing.length > 0, couldChange, maxPossible, version, date: DATE }, extra || {});
  }

  R.scales = {
    esrs(inp) {
      const v = 'ESRS · bảng điểm file 00 §4.1';
      if (inp.event === 'CMN') return NA('ESRS', 'Chảy máu não: ESRS không áp dụng.', v);
      if (inp.event === 'NONE') return NA('ESRS', 'Chưa từng đột quỵ/TIA: ESRS không áp dụng. Từ 55 tuổi dùng FSRP.', v);
      const used = [], missing = []; let miss = 0;
      const a = inp.age; used.push({ label: 'Tuổi ' + (a < 65 ? '<65' : a <= 75 ? '65–75' : '>75'), pts: a < 65 ? 0 : a <= 75 ? 1 : 2, val: a + ' tuổi' });
      const ocvd = inp.hf === 1 || inp.ocvd === 1 ? 1 : (tri(inp.ocvd) == null || tri(inp.hf) == null ? null : 0);
      [['Tăng huyết áp', inp.htn], ['Đái tháo đường', inp.dm], ['Bệnh động mạch ngoại biên', inp.pad], ['Nhồi máu cơ tim', inp.mi], ['Bệnh tim mạch khác (không tính NMCT, rung nhĩ)', ocvd], ['Hút thuốc hiện tại', inp.smoke], ['TIA/đột quỵ trước biến cố hiện tại', inp.prior]].forEach(([label, val]) => {
        const t = tri(val);
        if (t == null) { missing.push(label); miss += 1; } else used.push({ label, pts: t, val: yn(t) });
      });
      return finish('ESRS', used, missing, miss, (s) => (s >= 3 ? { key: 'high', label: 'Cao' } : { key: 'low', label: 'Thấp' }), v, { band: '0–2 thấp · ≥3 cao', bandNote: 'Mốc phân tầng lấy theo y văn gốc, cần BS xác nhận.' });
    },
    spi(inp) {
      const v = 'SPI-II · bảng điểm file 00 §4.1';
      if (inp.event === 'CMN') return NA('SPI-II', 'Chảy máu não: SPI-II không áp dụng.', v);
      if (inp.event === 'NONE') return NA('SPI-II', 'Chưa từng đột quỵ/TIA: SPI-II không áp dụng.', v);
      const used = [], missing = []; let miss = 0;
      used.push({ label: 'Tuổi >70', pts: inp.age > 70 ? 2 : 0, val: inp.age + ' tuổi' });
      [['Tăng huyết áp', inp.htn, 1], ['Đái tháo đường', inp.dm, 3], ['Tiền sử nhồi máu não/TIA trước biến cố hiện tại', inp.prior, 3]].forEach(([label, val, w]) => {
        const t = tri(val);
        if (t == null) { missing.push(label); miss += w; } else used.push({ label, pts: t * w, val: yn(t) });
      });
      used.push({ label: 'Biến cố hiện tại là đột quỵ (không phải TIA)', pts: inp.event === 'NMN' ? 2 : 0, val: inp.event === 'NMN' ? 'Đột quỵ' : 'TIA' });
      // tim: không cộng trùng giữa suy tim, NMCT, bệnh tim mạch khác (file 00 / slide 15)
      const hf = tri(inp.hf), mi = tri(inp.mi), oc = tri(inp.ocvd);
      let heart = 0, note = 'Không cộng trùng giữa các mục tim';
      if (hf === 1) heart = 3; else if (mi === 1 || oc === 1) heart = 1;
      used.push({ label: 'Bệnh tim (suy tim 3 / NMCT hoặc bệnh tim khác 1)', pts: heart, val: hf === 1 ? 'Suy tim' : mi === 1 ? 'NMCT' : oc === 1 ? 'Bệnh tim khác' : 'Không', note });
      if (hf == null) { missing.push('Suy tim sung huyết'); miss += 3 - heart; }
      else if (hf === 0 && (mi == null || oc == null) && heart === 0) { missing.push(mi == null ? 'Nhồi máu cơ tim' : 'Bệnh tim mạch khác'); miss += 1; }
      return finish('SPI-II', used, missing, miss, (s) => (s <= 3 ? { key: 'low', label: 'Thấp' } : s <= 7 ? { key: 'mid', label: 'Trung bình' } : { key: 'high', label: 'Cao' }), v, { band: '0–3 thấp · 4–7 trung bình · 8–15 cao', bandNote: 'Mốc phân tầng lấy theo y văn gốc, cần BS xác nhận. Chưa có ngưỡng NIHSS cho "đột quỵ nhẹ".' });
    },
    fsrp(inp, illustrative) {
      const v = 'Dufouil_2017 (khung nhập liệu, chưa có hệ số)';
      if (inp.event !== 'NONE') return NA('FSRP 2017', 'Đã có đột quỵ/TIA: không tính FSRP tiên phát, chuyển sang thang thứ phát.', v);
      if (inp.age < 55) return NA('FSRP 2017', 'Chưa áp dụng (<55 tuổi): chưa có ước tính nguy cơ tiên phát.', v);
      const used = [{ label: 'Tuổi', val: inp.age + ' tuổi' }, { label: 'Giới', val: inp.sex === 'M' ? 'Nam' : 'Nữ' }];
      const missing = [];
      const cvd = inp.mi === 1 || inp.pad === 1 || inp.hf === 1 || inp.ocvd === 1 ? 1 : ([inp.mi, inp.pad, inp.hf, inp.ocvd].some((x) => tri(x) == null) ? null : 0);
      [['Hút thuốc 30 ngày qua', inp.smoke], ['Đái tháo đường', inp.dm], ['Bệnh tim mạch (mạch vành, suy tim, ĐM ngoại biên)', cvd], ['Rung nhĩ', inp.af], ['Đang dùng thuốc hạ áp / tăng huyết áp', inp.htn]].forEach(([label, val]) => {
        const t = tri(val); if (t == null) missing.push(label); else used.push({ label, val: yn(t) });
      });
      const r = { scale: 'FSRP 2017', applicable: true, used, missing, version: v, date: DATE, partial: missing.length > 0, tier: { key: 'none', label: 'Chưa có mốc phân tầng' } };
      if (missing.length) r.insufficient = true; else r.pct = illustrative == null ? null : illustrative;
      return r;
    },
    cha(inp) {
      const v = 'CHA₂DS₂-VASc · BRD v6';
      if (inp.af === 0) return NA('CHA₂DS₂-VASc', 'Không có rung nhĩ: không tính.', v);
      const used = [], missing = []; let miss = 0;
      if (tri(inp.af) == null) { missing.push('Rung nhĩ'); }
      const a = inp.age;
      [['Suy tim / rối loạn chức năng thất trái', inp.hf, 1], ['Tăng huyết áp', inp.htn, 1], ['Đái tháo đường', inp.dm, 1]].forEach(([label, val, w]) => {
        const t = tri(val); if (t == null) { missing.push(label); miss += w; } else used.push({ label, pts: t * w, val: yn(t) });
      });
      used.push({ label: 'Tuổi ' + (a >= 75 ? '≥75' : a >= 65 ? '65–74' : '<65'), pts: a >= 75 ? 2 : a >= 65 ? 1 : 0, val: a + ' tuổi' });
      const stroke = inp.event === 'NMN' || inp.event === 'TIA' || inp.prior === 1 ? 1 : (inp.prior == null ? null : 0);
      if (stroke == null) { missing.push('Tiền sử đột quỵ/TIA'); miss += 2; } else used.push({ label: 'Tiền sử đột quỵ thiếu máu / TIA / huyết khối', pts: stroke * 2, val: yn(stroke) });
      const vasc = inp.mi === 1 || inp.pad === 1 ? 1 : (tri(inp.mi) == null || tri(inp.pad) == null ? null : 0);
      if (vasc == null) { missing.push('Bệnh mạch máu (NMCT, ĐM ngoại biên)'); miss += 1; } else used.push({ label: 'Bệnh mạch máu (NMCT, ĐM ngoại biên)', pts: vasc, val: yn(vasc) });
      used.push({ label: 'Giới nữ', pts: inp.sex === 'F' ? 1 : 0, val: inp.sex === 'F' ? 'Nữ' : 'Nam' });
      const female = inp.sex === 'F';
      const tierFn = (s) => { const k = female ? s - 1 : s; return k <= 0 ? { key: 'low', label: 'Thấp' } : k === 1 ? { key: 'mid', label: 'Trung bình' } : { key: 'high', label: 'Cao' }; };
      return finish('CHA₂DS₂-VASc', used, missing, miss, tierFn, v, { band: 'Nam: 0 thấp · 1 trung bình · ≥2 cao. Nữ: 1 thấp · 2 trung bình · ≥3 cao', bandNote: 'Điểm cao: BRD khuyến cáo điều trị dự phòng huyết khối. Ngưỡng cần BS xác nhận (BRD cũng nhắc CHA₂DS₂-VA).' });
    },
    abcd2(inp) {
      const v = 'ABCD2 · BRD v6';
      const used = [], missing = []; let miss = 0;
      const a = inp.age; used.push({ label: 'Tuổi ≥60', pts: a >= 60 ? 1 : 0, val: a + ' tuổi' });
      const bp = tri(inp.bp140); if (bp == null) { missing.push('HA lúc đánh giá ≥140/90'); miss += 1; } else used.push({ label: 'HA lúc đánh giá ≥140/90', pts: bp, val: yn(bp) });
      const cl = inp.clin; if (cl == null) { missing.push('Triệu chứng lâm sàng'); miss += 2; } else used.push({ label: 'Triệu chứng', pts: cl === 'uni' ? 2 : cl === 'speech' ? 1 : 0, val: cl === 'uni' ? 'Yếu một bên' : cl === 'speech' ? 'Rối loạn ngôn ngữ, không yếu' : 'Triệu chứng khác' });
      const du = inp.dur; if (du == null) { missing.push('Thời gian triệu chứng'); miss += 2; } else used.push({ label: 'Thời gian', pts: du === '60' ? 2 : du === '10' ? 1 : 0, val: du === '60' ? '≥60 phút' : du === '10' ? '10–59 phút' : '<10 phút' });
      const dm = tri(inp.dm); if (dm == null) { missing.push('Đái tháo đường'); miss += 1; } else used.push({ label: 'Đái tháo đường', pts: dm, val: yn(dm) });
      return finish('ABCD2', used, missing, miss, (s) => (s <= 3 ? { key: 'low', label: 'Thấp' } : s <= 5 ? { key: 'mid', label: 'Trung bình' } : { key: 'high', label: 'Cao' }), v, { band: '0–3 thấp · 4–5 trung bình · 6–7 cao', bandNote: 'BRD để trống ô "tuổi" và "HA" của bảng ABCD2; demo dùng mô tả quen thuộc, cần xác nhận.' });
    },
  };

  const inputsOf = (p) => Object.assign({ age: p.age, sex: p.sex, event: p.dx.type }, p.rf);
  R.inputsOf = inputsOf;
  R.patientScales = (p) => {
    const i = inputsOf(p);
    const out = { esrs: R.scales.esrs(i), spi: R.scales.spi(i), fsrp: R.scales.fsrp(i, p.fsrp), cha: R.scales.cha(i) };
    return out;
  };
  // "nguy cơ tái phát cao" (M6, [Đề xuất]): ESRS cao hoặc SPI-II cao
  R.highRecurrence = (p) => {
    const s = R.patientScales(p);
    return (s.esrs.applicable && s.esrs.tier.key === 'high') || (s.spi.applicable && s.spi.tier.key === 'high');
  };
  // mức nguy cơ tổng cho cột "Mức nguy cơ" (dài hạn): cao nhất trong các thang tái phát áp dụng
  R.riskTier = (p) => {
    const s = R.patientScales(p);
    const rank = { low: 1, mid: 2, high: 3 };
    let best = null;
    [s.esrs, s.spi, s.cha].forEach((x) => { if (x.applicable && !x.insufficient && x.tier && rank[x.tier.key] && (!best || rank[x.tier.key] > rank[best.tier.key])) best = x; });
    if (best) return { key: best.tier.key, label: best.tier.label, by: best.scale };
    if (s.fsrp.applicable && s.fsrp.pct != null) return { key: 'none', label: 'FSRP ' + s.fsrp.pct + '% (minh họa)', by: 'FSRP 2017' };
    if (p.dx.type === 'CMN') return { key: 'na', label: 'Không áp dụng (chảy máu não)', by: null };
    if (p.dx.type === 'NONE' && p.age < 55) return { key: 'na', label: 'Chưa áp dụng (<55 tuổi)', by: null };
    return { key: 'na', label: 'Chưa đánh giá', by: null };
  };

  /* ---------- phân loại 🔴🟡🟢 ---------- */
  const PRIO = ['neuro', 'bp-crit', 'miss-ac', 'glu', 'bp-avg3', 'overdue', 'hr-adh', 'bp-avg7', 'adh', 'stale', 'ldl', 'a1c', 'msg', 'appt'];
  R.GROUPS = { neuro: 'Triệu chứng mới', 'bp-crit': 'Huyết áp', 'bp-avg3': 'Huyết áp', 'bp-avg7': 'Huyết áp', glu: 'Đường huyết', 'miss-ac': 'Bỏ liều', adh: 'Bỏ liều', 'hr-adh': 'Bỏ liều', overdue: 'Quá hẹn', stale: 'Không có dữ liệu', ldl: 'Xét nghiệm', a1c: 'Xét nghiệm', msg: 'Tin nhắn', appt: 'Tái khám sắp tới' };
  R.ISSUE = { neuro: 'Triệu chứng', 'bp-crit': 'Huyết áp', 'bp-avg3': 'Huyết áp', 'bp-avg7': 'Huyết áp', glu: 'Đường huyết', 'miss-ac': 'Thuốc', adh: 'Thuốc', 'hr-adh': 'Thuốc', overdue: 'Lịch hẹn', stale: 'Thiếu dữ liệu', ldl: 'Mỡ máu', a1c: 'Đường huyết', msg: 'Tin nhắn', appt: 'Lịch hẹn' };

  R.classify = (p, cfg) => {
    cfg = cfg || R.cfg;
    const re = [];
    const add = (code, level, text, at, raw) => re.push({ code, level, group: R.GROUPS[code], text, at, raw: raw || [], prio: PRIO.indexOf(code) });
    const inWin = (d, n) => d >= -(n - 1) && d <= 0;

    p.events.filter((e) => e.kind === 'fast' && inWin(e.d, cfg.critWindow)).forEach((e) => add('neuro', 'act', 'Báo triệu chứng thần kinh mới ' + R.when(e.d, e.h), { d: e.d, h: e.h }, [e.text, 'Hướng dẫn BN/người thân: nếu triệu chứng còn hoặc quay lại, gọi 115.']));
    const crit = p.bp.filter((x) => inWin(x.d, cfg.critWindow) && (x.s >= cfg.critSys || x.dia >= cfg.critDia));
    if (crit.length) {
      const c = crit[crit.length - 1];
      add('bp-crit', 'act', 'HA ' + c.s + '/' + c.dia + ' ' + R.when(c.d, c.h), { d: c.d, h: c.h }, crit.map((x) => 'Đo ' + R.stamp(x.d, x.h) + ' · ' + x.s + '/' + x.dia + ' mmHg · ' + x.src));
    }
    const ms = R.misses(p, -cfg.missWindow, true).filter((m) => m.d <= -1);
    if (ms.length >= cfg.missCount) {
      const names = Array.from(new Set(ms.map((m) => lc(m.med)))).join(', ');
      const l = ms[ms.length - 1];
      add('miss-ac', 'act', 'bỏ ' + ms.length + ' liều ' + names, { d: l.d, h: l.h }, ms.map((m) => 'Bỏ liều ' + m.med + ' ' + m.time + ' ngày ' + T.fmtDM(m.d)));
    }
    const gl = p.glu.filter((x) => inWin(x.d, cfg.critWindow) && (x.v < cfg.gluLow || x.v > cfg.gluHigh));
    if (gl.length) {
      const x = gl[gl.length - 1];
      add('glu', 'act', 'Đường huyết ' + num(x.v, 1) + ' mmol/L ' + R.when(x.d, x.h) + (x.v < cfg.gluLow ? ' (thấp)' : ' (cao)'), { d: x.d, h: x.h }, gl.map((y) => 'Đo ' + R.stamp(y.d, y.h) + ' · ' + num(y.v, 1) + ' mmol/L · ' + y.src));
    }
    const a3 = R.avgBP(p, 3);
    if (a3 && a3.n >= 3 && (a3.s >= cfg.avg3Sys || a3.dia >= cfg.avg3Dia)) {
      const L = p.bp.filter((x) => x.d >= -2);
      add('bp-avg3', 'act', 'HA TB 3 ngày ' + a3.s + '/' + a3.dia, { d: L[L.length - 1].d, h: L[L.length - 1].h }, L.map((x) => 'Đo ' + R.stamp(x.d, x.h) + ' · ' + x.s + '/' + x.dia + ' mmHg'));
    }
    const ap = p.appt;
    if (ap.d < 0 && ap.status !== 'done' && -ap.d > cfg.overdueDays) add('overdue', 'act', 'Quá hẹn tái khám ' + -ap.d + ' ngày (hẹn ' + T.fmtDM(ap.d) + ')', { d: ap.d, h: 9 }, ['Lịch hẹn ' + T.fmtDMY(ap.d) + ' ' + ap.time + ': chưa đến khám.']);
    const ad = R.adherence(p);
    const hr = R.highRecurrence(p);
    if (hr && ad && ad.pct < cfg.adhLow) {
      const s = R.patientScales(p); const x = s.esrs.applicable && s.esrs.tier.key === 'high' ? 'ESRS ' + s.esrs.score : 'SPI-II ' + s.spi.score;
      add('hr-adh', 'act', 'Nguy cơ tái phát cao (' + x + ') · tuân thủ ' + ad.pct + '%', { d: -1, h: 20 }, ['Tuân thủ 30 ngày ' + ad.pct + '% (' + ad.taken + '/' + (ad.taken + ad.missed) + ' liều)']);
    }
    // vàng
    const a7 = R.avgBP(p, 7);
    if (a7 && a7.n >= 4 && (a7.s >= cfg.avg7Sys || a7.dia >= cfg.avg7Dia)) {
      const L = p.bp.filter((x) => x.d >= -6);
      add('bp-avg7', 'watch', 'HA TB 7 ngày ' + a7.s + '/' + a7.dia, { d: L[L.length - 1].d, h: L[L.length - 1].h }, ['Trung bình ' + a7.n + ' lần đo trong 7 ngày: ' + a7.s + '/' + a7.dia + ' mmHg (ngưỡng ' + cfg.avg7Sys + '/' + cfg.avg7Dia + ')']);
    }
    if (ad && ad.pct < cfg.adhOk && !(hr && ad.pct < cfg.adhLow)) add('adh', 'watch', 'Tuân thủ thuốc ' + ad.pct + '%', { d: -1, h: 20 }, ['Tuân thủ 30 ngày ' + ad.pct + '% (' + ad.taken + '/' + (ad.taken + ad.missed) + ' liều), mục tiêu ≥' + cfg.adhOk + '%']);
    const st = R.staleDays(p);
    if (p.noData) add('stale', 'watch', 'Mới tạo hồ sơ, chưa có số đo nào', { d: 0, h: T.NOW_H }, ['Hồ sơ tạo hôm nay, chưa có dữ liệu sức khỏe. Ô trống không được hiểu là "ổn định".']);
    else if (st > cfg.staleDays) add('stale', 'watch', 'Chưa có dữ liệu mới ' + st + ' ngày', { d: p.lastData.d, h: p.lastData.h }, ['Lần nhập gần nhất: ' + R.stamp(p.lastData.d, p.lastData.h)]);
    const ldl = R.lab(p, 'ldl'), tg = R.targets(p, cfg);
    if (ldl && ldl.v >= tg.ldl) add('ldl', 'watch', 'LDL-C ' + num(ldl.v, 1) + ' mmol/L (mục tiêu <' + num(tg.ldl, 1) + ')', { d: ldl.d, h: 9 }, ['Xét nghiệm ' + T.fmtDMY(ldl.d) + ' · ' + ldl.src]);
    const a1 = R.lab(p, 'a1c');
    if (a1 && R.a1cExceeds(p, a1.v, cfg)) add('a1c', 'watch', 'HbA1c ' + num(a1.v, 1) + '% (mục tiêu ' + (p.rf.dm === 1 ? '≤' : '<') + num(tg.a1c, 1) + ')', { d: a1.d, h: 9 }, ['Xét nghiệm ' + T.fmtDMY(a1.d) + ' · ' + a1.src]);
    const pm = R.pending(p);
    if (pm && pm.hours > cfg.msgHours) add('msg', 'watch', 'Tin nhắn chờ ' + Math.floor(pm.hours) + ' giờ chưa trả lời', { d: pm.d, h: pm.h }, ['"' + pm.text + '"']);
    if (ap.d >= 1 && ap.d <= cfg.apptSoonDays && ap.status === 'scheduled') add('appt', 'watch', 'Tái khám sau ' + ap.d + ' ngày (' + T.fmtDM(ap.d) + ' ' + ap.time + ')', { d: ap.d - 1, h: 8 }, ['Lịch hẹn ' + T.fmtDMY(ap.d) + ' ' + ap.time]);

    const level = re.some((x) => x.level === 'act') ? 'act' : re.length ? 'watch' : 'ok';
    // sắp xếp lý do: đỏ trước, theo ưu tiên
    re.sort((a, b) => (a.level === b.level ? a.prio - b.prio : a.level === 'act' ? -1 : 1));
    const latest = re.filter((x) => x.level === level).reduce((m, x) => (!m || x.at.d * 24 + x.at.h > m.d * 24 + m.h ? x.at : m), null);
    return { id: p.id, level, reasons: re, at: latest };
  };

  R.classifyAll = (list, cfg) => { const m = {}; list.forEach((p) => { m[p.id] = R.classify(p, cfg); }); return m; };
  R.counts = (list, map) => { const c = { act: 0, watch: 0, ok: 0, total: list.length }; list.forEach((p) => { c[map[p.id].level]++; }); return c; };

  /* ---------- chỉ số và trạng thái tốt / cần cải thiện (§4.2) ---------- */
  R.ind = (p, cfg) => {
    cfg = cfg || R.cfg;
    const out = {};
    const a7 = R.avgBP(p, 7), lb = R.lastBP(p);
    out.bp = { avg7: a7, last: lb, state: a7 ? (a7.s < cfg.bpTargetS && a7.dia < cfg.bpTargetD ? 'ok' : 'bad') : 'none' };
    const lg = R.lastGlu(p);
    out.glu = { last: lg, state: lg ? (lg.v <= 5.6 ? 'ok' : 'bad') : 'none' };
    const ldl = R.lab(p, 'ldl'); const tg = R.targets(p, cfg);
    out.ldl = { last: ldl, target: tg.ldl, state: ldl ? (ldl.v < tg.ldl ? 'ok' : 'bad') : 'none' };
    const tc = R.lab(p, 'tc'); out.tc = { last: tc, state: tc ? (tc.v < 5.2 ? 'ok' : 'bad') : 'none' };
    const a1 = R.lab(p, 'a1c'); out.a1c = { last: a1, target: tg.a1c, state: a1 ? (R.a1cExceeds(p, a1.v, cfg) ? 'bad' : 'ok') : 'none' };
    const b = R.bmi(p); out.bmi = { v: b, state: b == null ? 'none' : b >= 18.5 && b < 23 ? 'ok' : 'bad', label: b == null ? '' : b < 18.5 ? 'thấp' : b < 23 ? 'bình thường' : b < 25 ? 'thừa cân' : 'béo phì' };
    const ad = R.adherence(p); out.adh = { v: ad, state: !p.consentAdh ? 'private' : ad ? (ad.pct >= cfg.adhOk ? 'ok' : 'bad') : 'none' };
    // null = chưa ghi nhận: không tính là đạt hay không đạt.
    out.smoke = { cig: p.life.cig, state: p.life.cig == null ? 'none' : p.life.cig === 0 ? 'ok' : 'bad' };
    const lim = p.sex === 'F' ? 1 : 2; out.alc = { v: p.life.alc, limit: lim, state: p.life.alc == null ? 'none' : p.life.alc <= lim ? 'ok' : 'bad' };
    out.ex = { v: p.life.ex, state: p.life.ex == null ? 'none' : p.life.ex >= 150 ? 'ok' : 'bad' };
    return out;
  };

  // yếu tố có thể thay đổi + khuyến nghị gợi ý (không phải chỉ định điều trị)
  R.modifiable = (p, cfg) => {
    const I = R.ind(p, cfg), L = [];
    if (I.smoke.state === 'bad') L.push({ k: 'smoke', t: 'Hút thuốc lá', v: p.life.cig + ' điếu/ngày', rec: 'Tư vấn bỏ thuốc lá và giới thiệu hỗ trợ cai thuốc.', edu: 'E4' });
    if (I.bp.state === 'bad') L.push({ k: 'bp', t: 'Huyết áp', v: I.bp.avg7.s + '/' + I.bp.avg7.dia + ' mmHg (TB 7 ngày)', rec: 'Nhắc đo đúng cách (nghỉ 5 phút, 3 lần, lấy TB 2 lần cuối), ăn nhạt, kiểm tra tuân thủ thuốc.', edu: 'E2' });
    if (I.adh.state === 'bad') L.push({ k: 'adh', t: 'Tuân thủ thuốc', v: I.adh.v.pct + '%', rec: 'Hỏi lý do quên liều, đặt giờ nhắc phù hợp, nhờ người thân hỗ trợ nhắc.', edu: 'E5' });
    if (I.ldl.state === 'bad') L.push({ k: 'ldl', t: 'LDL-C', v: num(I.ldl.last.v, 1) + ' mmol/L', rec: 'Xem lại chế độ ăn, vận động; BS đánh giá mục tiêu LDL-C cho từng bệnh nhân.' });
    if (I.a1c.state === 'bad') L.push({ k: 'a1c', t: 'HbA1c', v: num(I.a1c.last.v, 1) + '%', rec: 'Nhắc theo dõi đường huyết đói, chế độ ăn; BS đặt mục tiêu HbA1c cá thể.' });
    if (I.bmi.state === 'bad' && I.bmi.v >= 23) L.push({ k: 'bmi', t: 'BMI', v: num(I.bmi.v, 1) + ' (' + I.bmi.label + ')', rec: 'Tư vấn chế độ ăn và tăng vận động vừa sức.' });
    if (I.ex.state === 'bad') L.push({ k: 'ex', t: 'Vận động', v: p.life.ex + ' phút/tuần', rec: 'Khuyến khích đi bộ đều, hướng tới ≥150 phút/tuần vừa sức. [Đề xuất: mục tiêu theo WHO]' });
    if (I.alc.state === 'bad') L.push({ k: 'alc', t: 'Rượu bia', v: num(p.life.alc, 1) + ' đơn vị/ngày', rec: 'Tư vấn giảm rượu bia (nam ≤2, nữ ≤1 đơn vị/ngày).' });
    return L;
  };

  /* ---------- kiểm tra giá trị nhập (nhập hộ) ---------- */
  R.validate = (f) => {
    const err = [], warn = [];
    const has = (v) => v !== '' && v != null && !isNaN(Number(v));
    if (has(f.sys) !== has(f.dia)) err.push('Huyết áp cần nhập đủ cả tâm thu và tâm trương.');
    if (has(f.sys) && has(f.dia)) {
      const s = Number(f.sys), d = Number(f.dia);
      if (s < 70 || s > 260 || d < 40 || d > 150) err.push('Huyết áp ' + s + '/' + d + ' mmHg nằm ngoài khoảng hợp lệ (tâm thu 70–260, tâm trương 40–150). Kiểm tra lại số đo.');
      else if (s <= d) err.push('Tâm thu phải lớn hơn tâm trương.');
      else if (s >= R.cfg.critSys || d >= R.cfg.critDia) warn.push('Huyết áp rất cao (tâm thu ≥' + R.cfg.critSys + ' hoặc tâm trương ≥' + R.cfg.critDia + '). Xác nhận số đo; nếu BN có triệu chứng thần kinh mới, hướng dẫn gọi 115.');
    }
    if (has(f.glu)) {
      const v = Number(f.glu);
      if (v < 1.5 || v > 40) err.push('Đường huyết ' + num(v, 1) + ' mmol/L nằm ngoài khoảng hợp lệ (1,5–40).');
      else if (v < R.cfg.gluLow || v > R.cfg.gluHigh) warn.push('Đường huyết ' + num(v, 1) + ' mmol/L ngoài ngưỡng an toàn (' + num(R.cfg.gluLow, 1) + '–' + num(R.cfg.gluHigh, 1) + ').');
    }
    if (has(f.kg)) { const v = Number(f.kg); if (v < 20 || v > 250) err.push('Cân nặng ' + v + ' kg nằm ngoài khoảng hợp lệ (20–250).'); }
    if (has(f.alc)) {
      const v = Number(f.alc);
      if (v < 0 || v > 20) err.push('Rượu ' + v + ' đơn vị/ngày không hợp lý (1 đơn vị = 10 g cồn). Kiểm tra lại, giá trị tối đa nhận là 20.');
      else if (v > 2) warn.push('Rượu ' + num(v, 1) + ' đơn vị/ngày vượt mức khuyến cáo (nam ≤2, nữ ≤1).');
    }
    return { err, warn };
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
