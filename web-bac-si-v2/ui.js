/* VNPreventStroke (demo) · tiện ích giao diện dùng chung: icon, chip, biểu đồ SVG, hộp thoại */
(function (g) {
  'use strict';
  const V = g.VNPS, T = V.T, R = V.rules, D = V.data;
  const U = (V.ui = {});

  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const esc = U.esc;

  const IC = {
    home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 010 7M21.5 20c0-2.8-1.8-4.8-4.5-5.7"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    bell: '<path d="M6 17v-6a6 6 0 1112 0v6l2 2H4zM10 21h4"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>', chevR: '<path d="M9 5l7 7-7 7"/>', chevD: '<path d="M5 9l7 7 7-7"/>', chevU: '<path d="M5 15l7-7 7 7"/>',
    spark: '<path d="M12 3l1.9 6.6L20.5 12l-6.6 2.4L12 21l-1.9-6.6L3.5 12l6.6-2.4z"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.4"/>',
    watch: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18z" fill="currentColor"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    dash: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    send: '<path d="M3 11l18-8-8 18-2-8z"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    print: '<path d="M7 9V3h10v6M5 9h14v8H5zM7 14h10v7H7z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.4"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
    building: '<path d="M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3M3 21h18"/>',
    pill: '<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l5 7"/>',
    stetho: '<path d="M6 3v6a4 4 0 008 0V3M10 13v3a4 4 0 008 0v-2"/><circle cx="18" cy="12" r="2"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5"/>',
    logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
    star: '<path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z"/>',
  };
  U.ic = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>';
  const ic = U.ic;

  /* ---------- chip, trạng thái ---------- */
  U.lvl = { act: { t: 'Cần can thiệp', ic: 'alert' }, watch: { t: 'Cần theo dõi', ic: 'watch' }, ok: { t: 'Ổn định', ic: 'check' } };
  U.mark = (k) => '<span class="mk mk-' + k + '" role="img" aria-label="' + (k === 'act' ? 'Cần can thiệp' : k === 'watch' ? 'Cần theo dõi' : 'Ổn định') + '"></span>';
  U.chip = (k, txt) => '<span class="chip ' + k + '">' + ic(U.lvl[k].ic) + esc(txt || U.lvl[k].t) + '</span>';
  U.tierChip = (t, scale) => {
    if (!t) return '';
    const m = { high: ['high', 'alert'], mid: ['mid', 'watch'], low: ['low', 'check'], none: ['neutral', 'dash'], na: ['neutral', 'dash'] }[t.key] || ['neutral', 'dash'];
    return '<span class="chip ' + m[0] + '">' + ic(m[1]) + esc((scale ? scale + ' · ' : '') + t.label) + '</span>';
  };
  U.state = (s, good, bad, none) => {
    if (s === 'ok') return '<span class="state sm-ok">' + ic('check') + (good || 'Tốt') + '</span>';
    if (s === 'bad') return '<span class="state sm-bad">' + ic('alert') + (bad || 'Cần cải thiện') + '</span>';
    if (s === 'private') return '<span class="state sm-none">' + ic('dash') + 'BN chưa cho phép chia sẻ</span>';
    return '<span class="state sm-none">' + ic('dash') + (none || 'Chưa có số đo') + '</span>';
  };
  U.initials = (n) => { const w = n.trim().split(/\s+/); return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };
  U.av = (p, lvl) => '<span class="av ' + (lvl || '') + '">' + esc(U.initials(p.name)) + '</span>';
  U.dxName = { NMN: 'Nhồi máu não', CMN: 'Chảy máu não', TIA: 'TIA', NONE: 'Chưa từng đột quỵ' };
  U.dx = (p) => U.dxName[p.dx.type] + (p.dx.onset != null ? ' ' + T.fmtDMY(p.dx.onset) : '');
  U.dxShort = (p) => (p.dx.type === 'NONE' ? 'Chưa đột quỵ' : p.dx.type + ' ' + T.fmtDM(p.dx.onset) + '/' + String(T.dateOf(p.dx.onset).getFullYear()).slice(2));
  U.sexName = (p) => (p.sex === 'M' ? 'Nam' : 'Nữ');
  U.site = (p) => (p.site === 'BM' ? 'Bạch Mai' : 'Vinmec Times City');
  U.dt = (d, h) => T.fmtH(h) + ' ' + T.fmtDMY(d);
  U.num = R.num;
  U.pct = (n, t) => (t ? Math.round((100 * n) / t) + '%' : '—');

  /* ---------- hộp thoại, thông báo ---------- */
  U.modal = (html, wide) => {
    const m = document.getElementById('modal');
    m.hidden = false;
    m.innerHTML = '<div class="mbox' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    const f = m.querySelector('input,select,textarea,button.primary');
    if (f) setTimeout(() => f.focus(), 30);
  };
  U.closeModal = () => { const m = document.getElementById('modal'); m.hidden = true; m.innerHTML = ''; };
  U.toast = (msg) => {
    const old = document.querySelector('.toast'); if (old) old.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
  };

  /* ---------- biểu đồ ---------- */
  U.niceTicks = (lo, hi, n) => {
    n = n || 5; const span = hi - lo || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
    for (let v = a; v <= b + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
    return out;
  };

  // series: [{name,color,shape,pts:[{x,y,tip,over,crit}]}], x tính theo ngày (số thực); khoảng trống > 1,1 ngày thì ngắt đường, không nội suy.
  // Mỗi chuỗi giữ màu riêng: tô đặc = vượt mức của chính chuỗi đó, rỗng = chưa vượt; chỉ điểm chạm mốc nguy hiểm mới đổi sang dấu đỏ.
  // refs ghi nhãn ở lề phải để không đè đường dữ liệu; lane = dải ngày bỏ liều trên cùng trục thời gian.
  U.lineChart = (o) => {
    const w = o.w || 640, h = o.h || 200, l = 52, r = o.rr || 12, t = 26, lane = o.lane, b = lane ? 56 : 36;
    const xs = o.xFrom == null ? -29 : o.xFrom, xe = (o.xTo == null ? 0 : o.xTo) + 1;
    const all = o.series.flatMap((s) => s.pts.map((p) => p.y)).concat((o.refs || []).map((x) => x.y));
    if (!o.series.some((s) => s.pts.length)) return '<div class="empty">Chưa có số đo trong kỳ này.</div>';
    const tk = o.ticks || U.niceTicks(o.yMin != null ? o.yMin : Math.min.apply(null, all) - 5, o.yMax != null ? o.yMax : Math.max.apply(null, all) + 5, 4);
    const y0 = tk[0], y1 = tk[tk.length - 1], pb = h - b;
    const X = (v) => l + ((v - xs) / (xe - xs)) * (w - l - r), Y = (v) => t + (1 - (v - y0) / (y1 - y0)) * (pb - t);
    let s = '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.label || 'Biểu đồ') + '">';
    (lane || []).filter((m) => m.crit).forEach((m) => { s += '<rect class="band" x="' + X(m.d) + '" y="' + t + '" width="' + (X(m.d + 1) - X(m.d)) + '" height="' + (pb - t) + '"/>'; });
    tk.forEach((v) => { s += '<line class="tick" x1="' + l + '" x2="' + (w - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'; });
    s += '<line class="ax" x1="' + l + '" x2="' + l + '" y1="' + t + '" y2="' + pb + '"/><line class="ax" x1="' + l + '" x2="' + (w - r) + '" y1="' + pb + '" y2="' + pb + '"/>';
    const step = (xe - xs) > 14 ? 7 : 1, dateY = pb + (lane ? 34 : 14);
    for (let d = Math.ceil(xs); d < xe; d++) if (((0 - d) % step) === 0) s += '<text x="' + X(d + 0.5) + '" y="' + dateY + '" text-anchor="middle">' + T.fmtDM(d) + '</text>';
    if (lane) {
      s += '<text x="' + (l - 6) + '" y="' + (pb + 16) + '" text-anchor="end">Bỏ liều</text>';
      lane.forEach((m) => {
        const cx = X(m.d + 0.5), cy = pb + 12, k = 3.6;
        s += '<path class="' + (m.crit ? 'mk-crit' : 'mk-dose') + '" d="M' + (cx - k) + ' ' + (cy - k) + 'L' + (cx + k) + ' ' + (cy + k) + 'M' + (cx + k) + ' ' + (cy - k) + 'L' + (cx - k) + ' ' + (cy + k) + '"/>';
        s += '<rect class="hit" x="' + X(m.d) + '" y="' + (pb + 4) + '" width="' + (X(m.d + 1) - X(m.d)) + '" height="16" data-tip="' + esc(m.tip) + '"/>';
      });
    }
    (o.refs || []).forEach((rf) => { s += '<line class="ref" stroke="' + rf.color + '" x1="' + l + '" x2="' + (w - r) + '" y1="' + Y(rf.y) + '" y2="' + Y(rf.y) + '"/><text x="' + (w - r + 6) + '" y="' + (Y(rf.y) + 4) + '">' + esc(rf.label) + '</text>'; });
    const crits = [];
    o.series.forEach((se) => {
      let d = '', prev = null;
      se.pts.forEach((p) => { const c = X(p.x) + ',' + Y(p.y); d += (prev && p.x - prev.x <= 1.1 ? 'L' : 'M') + c; prev = p; });
      s += '<path d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="2" stroke-linejoin="round"/>';
      se.pts.forEach((p) => {
        const cx = X(p.x), cy = Y(p.y);
        if (p.crit) { crits.push({ cx, cy, v: p.y }); return; }
        s += se.shape === 'square'
          ? '<rect x="' + (cx - 3) + '" y="' + (cy - 3) + '" width="6" height="6" fill="' + se.color + '" stroke="var(--sheet)" stroke-width="1"/>'
          : '<circle cx="' + cx + '" cy="' + cy + '" r="3.2" fill="' + se.color + '" stroke="var(--sheet)" stroke-width="1"/>';
      });
      const f = se.pts[0];
      if (f && o.series.length > 1) s += '<text class="dl" x="' + (X(f.x) + 8) + '" y="' + (Y(f.y) - 8) + '">' + esc(se.name) + '</text>';
    });
    crits.forEach((c) => { s += '<rect x="' + (c.cx - 5) + '" y="' + (c.cy - 5) + '" width="10" height="10" transform="rotate(45 ' + c.cx + ' ' + c.cy + ')" fill="var(--act)" stroke="var(--sheet)" stroke-width="2"/><text class="dl" x="' + (c.cx - 9) + '" y="' + (c.cy - 9) + '" text-anchor="end" style="font-weight:700;fill:var(--ink)">' + c.v + '</text>'; });
    const seen = {}, colW = Math.max(6, ((w - l - r) / (xe - xs)) * 0.5);
    o.series.flatMap((se) => se.pts).forEach((p) => { if (seen[p.x]) return; seen[p.x] = 1; s += '<rect class="hit col" x="' + (X(p.x) - colW / 2) + '" y="' + t + '" width="' + colW + '" height="' + (pb - t) + '" data-tip="' + esc(p.tip) + '"/>'; });
    s += '<text class="ttl" x="' + (l - 6) + '" y="' + (t - 12) + '" text-anchor="end">' + esc(o.yUnit || '') + '</text>';
    s += '<text class="ttl" x="' + ((l + w - r) / 2) + '" y="' + (h - 2) + '" text-anchor="middle">' + esc(o.xTitle || 'Ngày đo (dd/mm)') + '</text></svg>';
    return s;
  };
  U.chartSay = (t) => (t ? '<p class="chartsay">' + esc(t) + '</p>' : '');

  U.spark = (pts, o) => {
    o = o || {}; const w = o.w || 220, h = o.h || 46;
    if (!pts.length) return '<div class="muted xs">Chưa có số đo</div>';
    const ys = pts.map((p) => p.y).concat(o.ref != null ? [o.ref] : []);
    const lo = Math.min.apply(null, ys) - 4, hi = Math.max.apply(null, ys) + 4;
    const X = (v) => 2 + ((v + 29) / 30) * (w - 4), Y = (v) => 3 + (1 - (v - lo) / (hi - lo)) * (h - 6);
    let d = '', prev = null;
    pts.forEach((p) => { d += (prev && p.x - prev.x <= 1.1 ? 'L' : 'M') + X(p.x) + ',' + Y(p.y); prev = p; });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:' + w + 'px" role="img" aria-label="' + esc(o.label || 'Xu hướng 30 ngày') + '">' +
      (o.ref != null ? '<line x1="2" x2="' + (w - 2) + '" y1="' + Y(o.ref) + '" y2="' + Y(o.ref) + '" stroke="var(--ok)" stroke-dasharray="4 3"/>' : '') +
      '<path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="1.6"/>' +
      pts.filter((p) => p.bad).map((p) => '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="2.8" fill="var(--act)"/>').join('') + '</svg>';
  };

  // lịch tuân thủ 30 ngày dạng ô: hàng = thuốc, cột = ngày; T uống · M bỏ · N chưa có dữ liệu (không phải "bỏ")
  U.heat = (p) => {
    const cols = '150px repeat(30,minmax(0,1fr))';
    let s = '<div class="heat" style="grid-template-columns:' + cols + '"><div></div>';
    for (let i = 0; i < 30; i++) s += '<div class="dh">' + (i % 5 === 0 ? T.fmtDM(i - 30) : '') + '</div>';
    p.meds.forEach((m) => {
      const crit = D.isCrit(m.cls);
      s += '<div class="hl' + (crit ? ' crit' : '') + '" title="' + esc(m.name + ' ' + m.dose + ' · ' + D.CLS_VN[m.cls]) + '">' + esc(m.name) + '</div>';
      m.log.forEach((c, i) => {
        const d = i - 30;
        s += '<div class="cell" style="grid-template-rows:repeat(' + c.length + ',1fr)">';
        for (let k = 0; k < c.length; k++) {
          const ch = c[k], tip = T.fmtDM(d) + ' ' + m.times[k] + ' · ' + (ch === 'T' ? 'đã uống' : ch === 'M' ? 'BỎ LIỀU' : 'chưa có dữ liệu');
          s += '<i class="' + ch + (ch === 'M' && crit ? ' crit' : '') + '" title="' + esc(tip) + '">' + (ch === 'M' ? '✕' : '') + '</i>';
        }
        s += '</div>';
      });
    });
    return s + '</div><div class="legend"><span><i style="background:color-mix(in srgb,var(--ok) 55%,var(--sheet))"></i>Đã uống</span><span><i style="background:var(--act)"></i>Bỏ liều</span><span><i class="hatch"></i>Chưa có dữ liệu</span></div>';
  };

})(typeof globalThis !== 'undefined' ? globalThis : window);
