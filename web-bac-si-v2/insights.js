/* VNPreventStroke (demo) · tầng gợi ý cho bác sĩ. Chỉ đọc dữ liệu và rules.js, không đổi mức nguy cơ, không dùng AI.
 * Quy ước tự đặt ở đây đều là [Đề xuất]. */
(function (g) {
  'use strict';
  const V = g.VNPS, T = V.T, R = V.rules;
  const I = (V.ins = {});
  const RANK = { ok: 0, watch: 1, act: 2 };
  const signed = (n) => (n > 0 ? '+' : '') + n;

  /* ---------- Mới so với 24 giờ trước: chạy lại đúng rules.js trên dữ liệu cắt đến 07:30 hôm qua ---------- */
  const CUT = -1 + T.NOW_H / 24;
  const asOfYesterday = (p) => {
    const q = JSON.parse(JSON.stringify(p));
    const sh = (a) => (a || []).filter((x) => x.d + (x.h == null ? 12 : x.h) / 24 <= CUT).map((x) => Object.assign({}, x, { d: x.d + 1 }));
    ['bp', 'glu', 'weight', 'events', 'thread'].forEach((k) => { q[k] = sh(q[k]); });
    Object.keys(q.labs || {}).forEach((k) => { q.labs[k] = sh(q.labs[k]); });
    q.meds.forEach((m) => { m.log = ['-'.repeat(m.times.length)].concat(m.log.slice(0, -1)); });
    const last = q.bp[q.bp.length - 1];
    q.lastData = p.lastData.d + p.lastData.h / 24 <= CUT ? { d: p.lastData.d + 1, h: p.lastData.h } : (last ? { d: last.d, h: last.h } : { d: -30, h: 8 });
    q.appt = Object.assign({}, q.appt, { d: q.appt.d + 1 });
    return q;
  };
  let base = {}, baseKey = '';
  I.baseline = (p) => {
    const k = JSON.stringify(R.cfg);
    if (k !== baseKey) { base = {}; baseKey = k; }
    if (!base[p.id]) base[p.id] = R.classify(asOfYesterday(p), R.cfg);
    return base[p.id];
  };
  // Bỏ lý do "tái khám sắp tới": lý do này đổi chỉ vì lịch trôi, không phải vì bệnh nhân thay đổi.
  I.changes = (p, c) => {
    const b = I.baseline(p), had = new Set(b.reasons.map((r) => r.code));
    const reasons = c.reasons.filter((r) => !had.has(r.code) && r.code !== 'appt');
    const up = RANK[c.level] > RANK[b.level];
    return up || reasons.length ? { up, from: b.level, to: c.level, reasons } : null;
  };

  /* ---------- Gợi ý việc nên làm: thứ tự ưu tiên theo lý do đang mở ---------- */
  const ACT = {
    neuro: ['Gọi hỏi triệu chứng', 'call'], 'bp-crit': ['Gọi hỏi triệu chứng', 'call'], glu: ['Gọi xác nhận', 'call'], 'miss-ac': ['Gọi hỏi bỏ liều', 'call'],
    msg: ['Trả lời tin nhắn', 'msg'], 'bp-avg3': ['Nhắc đo lại HA', 'msg'], overdue: ['Đặt lại lịch', 'appt'], 'hr-adh': ['Nhắc uống thuốc', 'msg'], stale: ['Nhắc nhập số', 'msg'],
    'bp-avg7': ['Nhắc đo lại HA', 'msg'], adh: ['Nhắc uống thuốc', 'msg'], ldl: ['Xem xét nghiệm', 'lab'], a1c: ['Xem xét nghiệm', 'lab'], appt: ['Chuẩn bị khám', 'open'],
  };
  const PRI = ['neuro', 'bp-crit', 'glu', 'miss-ac', 'msg', 'bp-avg3', 'overdue', 'hr-adh', 'stale', 'bp-avg7', 'adh', 'ldl', 'a1c', 'appt'];
  I.action = (p, c, isOpen) => {
    const open = c.reasons.filter((r) => isOpen(r));
    const r = PRI.map((k) => open.find((x) => x.code === k)).find(Boolean);
    return r && ACT[r.code] ? { label: ACT[r.code][0], kind: ACT[r.code][1], reason: r } : null;
  };

  /* ---------- Quy luật trong dữ liệu: chỉ nêu là trùng thời điểm, không kết luận nguyên nhân ---------- */
  I.doseByTime = (p) => {
    const o = { am: { t: 0, m: 0 }, pm: { t: 0, m: 0 } };
    p.meds.forEach((m) => m.log.forEach((c) => {
      for (let s = 0; s < c.length; s++) {
        if (c[s] !== 'T' && c[s] !== 'M') continue;
        const k = m.times[s] >= '17:00' ? 'pm' : 'am';
        o[k].t++; if (c[s] === 'M') o[k].m++;
      }
    }));
    return o;
  };
  // [Đề xuất] So tỷ lệ, không so số liều, để người có nhiều liều tối không bị nêu oan: ≥3 liều tối, tỷ lệ tối ≥1,5 lần và cao hơn ≥5 điểm % so với sáng.
  I.eveningMiss = (p) => {
    if (!p.consentAdh) return null;
    const o = I.doseByTime(p);
    if (!o.am.t || !o.pm.t || o.pm.m < 3) return null;
    const am = o.am.m / o.am.t, pm = o.pm.m / o.pm.t;
    if (pm < 1.5 * am || pm - am < 0.05) return null;
    return { pmM: o.pm.m, pmT: o.pm.t, amM: o.am.m, amT: o.am.t, pmPct: Math.round(100 * pm), amPct: Math.round(100 * am) };
  };
  I.eveningText = (e) => 'Quên liều buổi tối nhiều hơn buổi sáng: tối ' + e.pmM + '/' + e.pmT + ' liều (' + e.pmPct + '%), sáng ' + e.amM + '/' + e.amT + ' liều (' + e.amPct + '%) trong 30 ngày. Chỉ nêu quy luật, không kết luận nguyên nhân.';
  I.patterns = (p) => { const e = I.eveningMiss(p); return e ? [I.eveningText(e)] : []; };

  /* ---------- Câu kết luận trên chart ---------- */
  I.trend = (p) => {
    const a = R.avgBP(p, 7); if (!a) return null;
    const L = p.bp.filter((x) => x.d >= -13 && x.d <= -7); if (!L.length) return { a, prev: null };
    const prev = { s: Math.round(L.reduce((t, x) => t + x.s, 0) / L.length), dia: Math.round(L.reduce((t, x) => t + x.dia, 0) / L.length) };
    return { a, prev, ds: a.s - prev.s, dd: a.dia - prev.dia };
  };
  I.bpSentence = (p, rg) => {
    const L = p.bp.filter((x) => x.d >= -(rg - 1)), c = R.cfg; if (!L.length) return '';
    const t = I.trend(p), parts = [];
    if (t) parts.push('HA TB 7 ngày ' + t.a.s + '/' + t.a.dia + ' mmHg' + (t.prev ? ', so với 7 ngày trước ' + signed(t.ds) + '/' + signed(t.dd) : ''));
    else parts.push('Không có số đo trong 7 ngày qua');
    parts.push(L.filter((x) => x.s >= c.avg7Sys || x.dia >= c.avg7Dia).length + '/' + L.length + ' lần đo ≥' + c.avg7Sys + '/' + c.avg7Dia + ' trong ' + rg + ' ngày');
    const crit = L.filter((x) => x.s >= c.critSys || x.dia >= c.critDia);
    if (crit.length) { const k = crit[crit.length - 1]; parts.push(crit.length + ' lần đo chạm mốc ' + c.critSys + '/' + c.critDia + ', gần nhất ' + k.s + '/' + k.dia + ' lúc ' + R.stamp(k.d, k.h)); }
    else parts.push('không có lần đo nào chạm mốc ' + c.critSys + '/' + c.critDia);
    return parts.join('; ') + '.';
  };
  I.gluSentence = (p, rg) => {
    const L = p.glu.filter((x) => x.d >= -(rg - 1)), c = R.cfg; if (!L.length) return '';
    const k = L[L.length - 1], crit = L.filter((x) => x.v < c.gluLow || x.v > c.gluHigh);
    return 'Lần đo gần nhất ' + R.num(k.v, 1) + ' mmol/L lúc ' + R.stamp(k.d, k.h) + '; ' + L.filter((x) => x.v > 5.6).length + '/' + L.length + ' lần đo vượt 5,6 trong ' + rg + ' ngày; ' + (crit.length ? crit.length + ' lần ngoài ngưỡng an toàn ' + R.num(c.gluLow, 1) + '–' + R.num(c.gluHigh, 1) : 'không có lần nào ngoài ngưỡng an toàn ' + R.num(c.gluLow, 1) + '–' + R.num(c.gluHigh, 1)) + '.';
  };
  I.medSentence = (p) => {
    const a = R.adherence(p); if (!a) return '';
    const crit = R.misses(p, -7, true).filter((m) => m.d <= -1).length;
    return 'Bỏ ' + a.missed + '/' + (a.taken + a.missed) + ' liều trong 30 ngày; ' + (crit ? crit + ' liều chống đông/kháng tiểu cầu trong 7 ngày qua' : 'không bỏ liều chống đông/kháng tiểu cầu nào trong 7 ngày qua') + '.';
  };

  /* ---------- Tìm theo nhu cầu ---------- */
  I.norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
  const byCode = (t, a, codes) => ({ t, a, codes, f: (p, c) => c.reasons.some((r) => codes.includes(r.code)) });
  I.NEEDS = {
    miss: byCode('Bỏ liều thuốc', ['bo lieu', 'quen thuoc', 'quen lieu', 'tuan thu'], ['miss-ac', 'adh', 'hr-adh']),
    bp: byCode('HA cao', ['ha cao', 'huyet ap', 'tang huyet ap'], ['bp-crit', 'bp-avg3', 'bp-avg7']),
    silent: byCode('Lâu không nhập số', ['im lang', 'chua nhap', 'khong nhap', 'lau khong nhap'], ['stale']),
    over: byCode('Quá hẹn tái khám', ['qua hen', 'tre hen'], ['overdue']),
    glu: byCode('Đường huyết, HbA1c', ['duong huyet', 'hba1c', 'tieu duong'], ['glu', 'a1c']),
    ldl: byCode('LDL-C vượt mục tiêu', ['mo mau', 'ldl'], ['ldl']),
    neuro: byCode('Triệu chứng mới', ['trieu chung'], ['neuro']),
    msg: { t: 'Tin nhắn đang chờ', a: ['tin nhan', 'cho tra loi'], f: (p) => !!R.pending(p), why: (p) => '"' + R.pending(p).text + '"' },
    supply: { t: 'Sắp hết thuốc', a: ['het thuoc', 'sap het'], f: (p) => p.meds.some((m) => m.supply <= 7), why: (p) => p.meds.filter((m) => m.supply <= 7).map((m) => m.name + ' còn ' + m.supply + ' ngày').join(', ') },
    fresh: { t: 'Có dấu hiệu mới', a: ['moi', 'dau hieu moi'], f: (p, c) => !!I.changes(p, c), why: (p, c) => { const ch = I.changes(p, c); return ch.reasons.length ? ch.reasons[0].text : 'Chuyển mức so với hôm qua'; } },
  };
  I.needWhy = (k, p, c) => { const n = I.NEEDS[k]; if (n.why) return n.why(p, c); const r = c.reasons.find((x) => n.codes.includes(x.code)); return r ? r.text : ''; };
  I.needOf = (q) => {
    const n = I.norm(q); if (n.length < 2) return null;
    const keys = Object.keys(I.NEEDS);
    return keys.find((k) => I.NEEDS[k].a.includes(n)) || (n.length >= 3 ? keys.find((k) => I.NEEDS[k].a.some((x) => x.startsWith(n))) : null) || null;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
