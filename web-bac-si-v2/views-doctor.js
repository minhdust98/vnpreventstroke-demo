/* VNPreventStroke (demo) · các trang của vai Bác sĩ (trừ hồ sơ bệnh nhân) */
(function (g) {
  'use strict';
  const V = g.VNPS, T = V.T, R = V.rules, D = V.data, U = V.ui, Ins = V.ins, esc = U.esc, ic = U.ic;
  const W = (V.views = V.views || {});
  const S = () => V.S;
  const P = (id) => V.byId[id];

  /* ---------- trợ giúp dùng chung ---------- */
  W.sigOf = (r) => r.code + '|' + r.text + '|' + r.raw.join('|');
  // Đã xử lý tự mở lại khi số liệu của lý do đó đổi: không để bệnh nhân nằm yên cuối hàng đợi khi có số đo mới.
  W.alertState = (pid, code) => {
    const a = S().al[pid + ':' + code]; if (!a) return { status: 'new' };
    if (a.status === 'done' && a.sig) { const r = S().cls[pid].reasons.find((x) => x.code === code); if (r && W.sigOf(r) !== a.sig) return { status: 'new', reopened: true, prev: a }; }
    return a;
  };
  W.levelReasons = (p) => { const c = S().cls[p.id]; return c.reasons.filter((x) => x.level === c.level); };
  W.handled = (p) => {
    const c = S().cls[p.id]; if (c.level === 'ok') return false;
    const rs = W.levelReasons(p);
    return rs.length > 0 && rs.every((x) => W.alertState(p.id, x.code).status === 'done');
  };
  W.snoozeOf = (p) => {
    const n = S().sn[p.id]; if (!n) return null;
    const fresh = W.levelReasons(p).some((r) => !n.sigs.includes(W.sigOf(r))), due = S().day >= n.until;
    return Object.assign({}, n, { fresh, due, active: !fresh && !due });
  };
  W.muted = (p) => { const n = W.snoozeOf(p); return (n && n.active) || (!n && W.handled(p)); };
  W.openCount = (lv) => D.patients.filter((p) => S().cls[p.id].level === lv && !W.muted(p)).length;
  W.snoozedCount = (lv) => D.patients.filter((p) => S().cls[p.id].level === lv && (W.snoozeOf(p) || {}).active).length;
  W.actionOf = (p) => { const c = S().cls[p.id]; return c.level === 'ok' ? null : Ins.action(p, c, (r) => W.alertState(p.id, r.code).status !== 'done'); };
  W.why = (p, max) => {
    const c = S().cls[p.id];
    if (!c.reasons.length) return '<span class="muted">Không có cảnh báo</span>';
    const main = c.reasons.filter((x) => x.level === c.level);
    const shown = (main.length ? main : c.reasons).slice(0, max || 2);
    const rest = c.reasons.length - shown.length;
    return shown.map((x) => esc(x.text)).join(' · ') + (rest > 0 ? ' <span class="muted">+' + rest + ' lý do</span>' : '');
  };
  W.issues = (p) => { const c = S().cls[p.id]; return Array.from(new Set(c.reasons.map((x) => R.ISSUE[x.code]))); };
  W.pendingPatients = () => D.patients.filter((p) => R.pending(p)).sort((a, b) => R.pending(b).hours - R.pending(a).hours);
  W.todayAppts = () => S().appts.filter((a) => a.d === 0 && a.status !== 'canceled').sort((a, b) => a.time.localeCompare(b.time));
  W.groupOf = (g) => (p) => g === 'all' || U.group(p) === g;
  W.updTxt = (p) => R.stamp(p.lastData.d, p.lastData.h);
  const ST = { pending: ['Chờ xác nhận', 'watch'], confirmed: ['Đã xác nhận', 'check'], done: ['Đã hoàn tất', 'check'], canceled: ['Đã hủy', 'x'] };
  W.apStatus = (s) => '<span class="chip ' + (s === 'pending' ? 'watch' : s === 'confirmed' ? 'ok' : 'neutral') + '">' + ic(s === 'pending' ? 'watch' : s === 'canceled' ? 'x' : 'check') + ST[s][0] + '</span>';

  const reopenedOf = (p) => W.levelReasons(p).some((x) => W.alertState(p.id, x.code).reopened);
  const lvlName = { act: 'Cần can thiệp', watch: 'Cần theo dõi', ok: 'Ổn định' };
  W.newTag = (p) => {
    const ch = W.muted(p) ? null : Ins.changes(p, S().cls[p.id]); if (!ch) return '';
    const tip = 'So với 07:30 hôm qua, cùng quy tắc phân loại. ' + (ch.up ? 'Chuyển mức: ' + lvlName[ch.from] + ' → ' + lvlName[ch.to] + '. ' : '') + (ch.reasons.length ? 'Lý do mới: ' + ch.reasons.map((r) => r.text).join('; ') + '.' : '');
    return '<span class="newtag" title="' + esc(tip) + '">Mới</span>';
  };
  // Một dòng: tối đa 2 lý do cùng mức nếu vừa chỗ. Lý do đỏ không hiện trên dòng được đếm riêng, không gộp lẫn với lý do mức thấp hơn.
  W.whyParts = (p) => {
    const c = S().cls[p.id];
    if (!c.reasons.length) return { txt: 'Tái khám ' + T.fmtDM(p.appt.d) + ' lúc ' + p.appt.time, more: '', all: '' };
    const main = c.reasons.filter((x) => x.level === c.level), list = main.length ? main : c.reasons;
    const two = list.length > 1 && list[0].text.length + list[1].text.length <= 44, shown = list.slice(0, two ? 2 : 1);
    const hid = list.length - shown.length, low = c.reasons.length - list.length;
    const more = [hid ? '+' + hid + (c.level === 'act' ? ' đỏ' : '') : '', low ? '+' + low : ''].filter(Boolean).join(' ');
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    return { txt: cap(shown.map((x) => x.text).join(' · ')), more, all: c.reasons.map((x) => x.text).join('; ') };
  };
  W.shortTime = (p) => { const d = p.lastData.d; return d === 0 ? T.fmtH(p.lastData.h) : d === -1 ? 'Hôm qua' : T.fmtDM(d); };
  W.qrow = (p, sel) => {
    const s = S(), c = s.cls[p.id], lv = c.level, done = W.handled(p), sn = W.snoozeOf(p), muted = W.muted(p), open = s.qx === p.id && lv !== 'ok';
    const a = lv !== 'ok' && !muted ? W.actionOf(p) : null, reo = reopenedOf(p), w = W.whyParts(p);
    const tags = W.newTag(p) + (sn && sn.fresh ? '<span class="newtag">Có dữ liệu mới</span>' : sn && sn.due ? '<span class="newtag">Đến hạn xem lại</span>' : reo && !sn ? '<span class="newtag">Có dữ liệu mới</span>' : '');
    const state = sn && sn.active ? 'Xem lại ' + T.fmtDM(sn.until) + ' · ' : done && !sn ? '✓ Đã xử lý · ' : '';
    return '<div class="qitem ' + lv + (open ? ' open' : '') + '" data-q="' + p.id + '"><div class="qrow' + (muted ? ' done' : '') + (sel === p.id ? ' sel' : '') + '" data-a="' + (lv === 'ok' ? 'open' : 'qx') + '" data-id="' + p.id + '" tabindex="0"' + (lv === 'ok' ? '' : ' aria-expanded="' + open + '"') + '>' +
      '<div class="qn"><a href="#" class="nmlink" data-a="open" data-id="' + p.id + '" title="Mở hồ sơ: ' + esc(p.name + ', ' + p.age + ' tuổi, ' + U.sexName(p) + ', ' + U.dxShort(p)) + '">' + esc(p.name) + '</a>' + tags + '</div>' +
      '<div class="why" title="' + esc(w.all) + '"><span class="whyt">' + esc(state + w.txt) + '</span>' + (w.more ? '<span class="whym">' + esc(w.more) + '</span>' : '') + '</div>' +
      '<span class="qt" title="' + esc('Dữ liệu mới nhất: ' + W.updTxt(p)) + '">' + esc(W.shortTime(p)) + '</span>' +
      (a ? '<button class="btn sm sug ' + lv + '" data-a="qdo" data-k="' + a.kind + '" data-id="' + p.id + '" title="' + esc('Gợi ý theo quy tắc, bác sĩ quyết định. Từ: ' + a.reason.text) + '">' + ic('spark') + esc(a.label) + '</button>' : '<span></span>') +
      (lv === 'ok' ? '<span></span>' : '<span class="qchev" aria-hidden="true">' + ic(open ? 'chevU' : 'chevD') + '</span>') + '</div>' +
      (open ? W.qpanel(p) : '') + '</div>';
  };
  /* Bảng xử lý nhanh ngay trong hàng đợi */
  W.qpanel = (p) => {
    const s = S(), c = s.cls[p.id], I = R.ind(p), sn = W.snoozeOf(p), muted = W.muted(p), a = W.actionOf(p), pats = Ins.patterns(p);
    const sys = p.bp.filter((x) => x.d >= -29).map((x) => ({ x: x.d + x.h / 24, y: x.s, bad: x.s >= R.cfg.critSys }));
    const more = c.reasons.filter((r) => r.level !== c.level);
    const reasons = W.levelReasons(p).map((r) => { const st = W.alertState(p.id, r.code); return '<li class="' + r.level + (st.status === 'done' ? ' isdone' : '') + '">' + ic(r.level === 'act' ? 'alert' : 'watch') + '<div><b>' + esc(r.text) + '</b>' + (st.status === 'done' ? ' <span class="xs muted">· đã xử lý</span>' : '') + ' <span class="xs muted">' + esc(r.raw[0] || '') + '</span></div></li>'; }).join('') +
      (more.length ? '<li class="watch">' + ic('watch') + '<div class="small muted"><b>Cũng cần theo dõi:</b> ' + more.map((r) => esc(r.text)).join('; ') + '</div></li>' : '');
    const stats = '<div class="qstat"><span>HA TB 7 ngày</span><b class="' + (I.bp.state === 'bad' ? 'sm-bad' : I.bp.state === 'ok' ? 'sm-ok' : '') + '">' + (I.bp.avg7 ? I.bp.avg7.s + '/' + I.bp.avg7.dia : '—') + '</b></div><div class="qstat"><span>Tuân thủ 30 ngày</span><b class="' + (I.adh.state === 'bad' ? 'sm-bad' : I.adh.state === 'ok' ? 'sm-ok' : '') + '">' + (I.adh.v ? I.adh.v.pct + '%' : p.consentAdh ? '—' : 'BN chưa chia sẻ') + '</b></div>' + U.spark(sys, { ref: R.cfg.bpTargetS, w: 240, h: 44, label: 'Huyết áp tâm thu 30 ngày' }) + '<div class="xs muted">Tâm thu 30 ngày, vạch xanh là mục tiêu &lt;' + R.cfg.bpTargetS + '</div>';
    const sug = a ? '<div class="qsug">' + ic('spark') + '<div><b>Gợi ý theo quy tắc, bác sĩ quyết định:</b> ' + esc(W.TODO[a.reason.code](p)) + ' <span class="xs muted">Lấy từ: ' + esc(a.reason.raw[0] || a.reason.text) + '</span></div></div>' : '';
    const pat = pats.length ? '<div class="qsug">' + ic('chart') + '<div><b>Quy luật trong dữ liệu:</b> ' + esc(pats.join(' ')) + ' <span class="tag prop">[Đề xuất]</span></div></div>' : '';
    const comp = s.qc === p.id ? '<div class="qcomp"><div style="display:flex;gap:8px;align-items:center"><b class="small">Soạn tin cho ' + esc(p.name) + '</b><select data-i="qtpl" data-id="' + p.id + '" aria-label="Chọn mẫu tin"><option value="">Đổi mẫu…</option>' + W.TPL.map((t, i) => '<option value="' + i + '">' + esc(t.t) + '</option>').join('') + '</select><span style="flex:1"></span><button class="btn sm ghost" data-a="msgto" data-id="' + p.id + '">Xem cả hội thoại</button></div><textarea id="qmsg" rows="3" data-i="draft" data-id="' + p.id + '" aria-label="Nội dung tin nhắn">' + esc(W.draftOf(p)) + '</textarea><div style="display:flex;gap:8px;align-items:center"><span class="xs muted" style="flex:1">Mẫu gợi ý [Đề xuất], tên thuốc và số liệu lấy từ hồ sơ. Cần lâm sàng duyệt. Đọc và sửa rồi mới gửi. Demo không gửi tin thật.</span><button class="btn sm" data-a="qcancel">Hủy</button><button class="btn sm primary" data-a="send" data-box="qmsg" data-id="' + p.id + '">' + ic('send') + 'Gửi</button></div></div>' : '';
    const quick = '<button class="btn sm" data-a="qdo" data-k="call" data-id="' + p.id + '" title="Gọi (minh họa)">' + ic('phone') + 'Gọi</button><button class="btn sm" data-a="qdo" data-k="msg" data-id="' + p.id + '">' + ic('msg') + 'Nhắn</button><button class="btn sm" data-a="open" data-id="' + p.id + '">Mở hồ sơ</button>';
    const ch = muted ? null : Ins.changes(p, c);
    const up = ch && ch.up ? '<div class="small" style="color:var(--accent-ink)">Mới: chuyển từ ' + lvlName[ch.from] + ' sang ' + lvlName[ch.to] + ' so với 07:30 hôm qua.</div>' : '';
    let foot;
    if (muted) {
      const lastDone = W.levelReasons(p).map((r) => W.alertState(p.id, r.code)).filter((x) => x.status === 'done').pop();
      foot = '<div class="qact"><div class="qfoot"><span class="small muted" style="flex:1">' + (sn && sn.active ? 'Hẹn xem lại ' + T.fmtDMY(sn.until) + (sn.note ? ' · ' + esc(sn.note) : '') + '. Tự quay về hàng đợi khi đến hạn hoặc có dữ liệu mới.' : 'Đã xử lý' + (lastDone ? ' · ' + esc(lastDone.note) : '') + '. Tự mở lại khi có dữ liệu mới.') + ' Mức theo dõi vẫn giữ vì tính từ dữ liệu.</span>' + quick + '<button class="btn sm" data-a="qundo" data-id="' + p.id + '">Hoàn tác</button></div></div>';
    } else {
      foot = '<div class="qact"><div class="qnote"><span class="small muted">Ghi chú</span>' + ['Đã gọi BN', 'Đã nhắn BN', 'Đã hẹn khám'].map((t) => '<button class="btn sm" data-a="qchip" data-v="' + t + '" data-id="' + p.id + '">' + t + '</button>').join('') + '<input type="text" id="qnote" data-i="qnote" data-id="' + p.id + '" value="' + esc(s.qnotes[p.id] || '') + '" placeholder="Bắt buộc khi đánh dấu đã xử lý" aria-label="Ghi chú xử lý"></div><div id="q_msg"></div>' +
        '<div class="qfoot"><button class="btn sm primary" data-a="qdone" data-id="' + p.id + '">' + ic('check') + 'Đã xử lý, sang người kế</button><span class="small muted" style="margin-left:6px">Xem lại sau</span>' + [1, 3, 7].map((n) => '<button class="btn sm" data-a="qsnooze" data-n="' + n + '" data-id="' + p.id + '">' + n + ' ngày</button>').join('') + '<span style="flex:1"></span>' + quick + '</div></div>';
    }
    return '<div class="qx">' + comp + up + '<div class="qx-grid"><ul class="qreasons">' + reasons + '</ul><div>' + stats + '</div></div>' + (muted ? '' : sug) + pat + (comp ? '' : foot) + '</div>';
  };
  W.queueList = (lv, grp) => {
    const pri = (p) => { if (W.muted(p)) return 3; const n = W.snoozeOf(p); if ((n && (n.due || n.fresh)) || reopenedOf(p)) return 0; return Ins.changes(p, S().cls[p.id]) ? 1 : 2; };
    return D.patients.filter((p) => S().cls[p.id].level === lv && W.groupOf(grp)(p)).sort((a, b) => {
      const pa = pri(a), pb = pri(b); if (pa !== pb) return pa - pb;
      const ta = S().cls[a.id].at, tb = S().cls[b.id].at; return ta && tb ? (tb.d * 24 + tb.h) - (ta.d * 24 + ta.h) : 0;
    });
  };

  /* ---------- Tổng quan (không chart, không cuộn trang) ---------- */
  W.home = () => {
    const s = S(), c = R.counts(D.patients, s.cls), ta = W.todayAppts(), pp = W.pendingPatients();
    const long = pp.filter((p) => R.pending(p).hours > R.cfg.msgHours).length, pendA = s.appts.filter((a) => a.status === 'pending').length;
    const actOpen = W.openCount('act'), watchOpen = W.openCount('watch'), actSn = W.snoozedCount('act'), watchSn = W.snoozedCount('watch');
    const fresh = D.patients.filter((p) => s.cls[p.id].level !== 'ok' && !W.muted(p) && Ins.changes(p, s.cls[p.id])).length;
    const anySn = D.patients.some((p) => (W.snoozeOf(p) || {}).active);
    const list = W.queueList(s.qtab, s.qgroup);
    const tab = (k, t, n) => '<button class="' + (s.qtab === k ? 'on' : '') + '" data-a="qtab" data-v="' + k + '">' + U.mark(k) + t + ' ' + n + '</button>';
    const sub = (open, total, sn) => (open !== total ? open + ' chưa xử lý' + (sn ? ' · ' + sn + ' hẹn xem lại' : '') : '');
    const kpi = (cls, attrs, label, value, foot) => '<button class="kpi ' + cls + '" ' + attrs + '><div class="kl">' + label + '</div><div class="kv">' + value + '</div><div class="ks">' + foot + '</div></button>';
    return '<div class="dash">' +
      '<div class="dash-hi"><h1>Chào buổi sáng, ' + D.doctor.short + '</h1>' + (s.day ? '<span class="tag dem">demo đã tua +' + s.day + ' ngày</span>' : '') + '</div>' +
      '<div class="kpis">' +
      kpi('', 'data-a="nav" data-r="d/patients"', 'Đang quản lý', c.total, '<span class="tri" role="img" aria-label="' + c.act + ' cần can thiệp, ' + c.watch + ' cần theo dõi, ' + c.ok + ' ổn định"><i style="flex:' + c.act + ';background:var(--act)"></i><i style="flex:' + c.watch + ';background:var(--watch)"></i><i style="flex:' + c.ok + ';background:var(--ok)"></i></span>') +
      kpi('act', 'data-a="qtab" data-v="act"', U.mark('act') + 'Cần can thiệp', c.act, sub(actOpen, c.act, actSn)) +
      kpi('watch', 'data-a="qtab" data-v="watch"', U.mark('watch') + 'Cần theo dõi', c.watch, sub(watchOpen, c.watch, watchSn)) +
      kpi('', 'data-a="nav" data-r="d/appts"', 'Lịch hôm nay', ta.length, pendA ? pendA + ' chờ xác nhận' : '') +
      kpi('', 'data-a="nav" data-r="d/msgs"', 'Tin chờ trả lời', pp.length, long ? long + ' quá ' + R.cfg.msgHours + ' giờ' : '') +
      '</div>' +
      '<div class="dash-body">' +
      '<section class="card cardf" aria-label="Hàng đợi ưu tiên"><div class="card-h"><h3>Hàng đợi</h3>' + (fresh ? '<span class="qhintt" title="So với 07:30 hôm qua, cùng quy tắc phân loại">' + fresh + ' có dấu hiệu mới</span>' : '') +
      '<span class="qinfo" tabindex="0" title="Nút có dấu sao là gợi ý theo quy tắc từ dữ liệu của bệnh nhân, bác sĩ quyết định. Không dùng AI.">' + ic('info') + '</span>' + (anySn ? '<button class="btn sm ghost" data-a="qtua" title="Chỉ để thử trong demo: số liệu không đổi">Tua demo +3 ngày</button>' : '') +
      '<span style="flex:1"></span><div class="seg">' + tab('act', 'Can thiệp', c.act) + tab('watch', 'Theo dõi', c.watch) + tab('ok', 'Ổn định', c.ok) + '</div><select data-i="qgroup" aria-label="Nhóm"><option value="all"' + (s.qgroup === 'all' ? ' selected' : '') + '>Tất cả</option><option value="prim"' + (s.qgroup === 'prim' ? ' selected' : '') + '>Tiên phát</option><option value="sec"' + (s.qgroup === 'sec' ? ' selected' : '') + '>Thứ phát</option></select></div>' +
      '<div class="scroll">' + (list.length ? list.map((p) => W.qrow(p, s.drawer && s.drawer.id)).join('') : '<div class="empty">Không có bệnh nhân trong nhóm này.</div>') + '</div></section>' +
      '<div class="col-r">' +
      '<section class="card cardf"><div class="card-h"><h3>Lịch hôm nay</h3><span style="flex:1"></span><button class="lnk" data-a="nav" data-r="d/appts">Xem lịch</button></div><div class="scroll">' +
      (ta.length ? ta.map((a) => { const p = P(a.pid), lv = s.cls[p.id].level; return '<div class="mini-row" data-a="open" data-tab="sum" data-id="' + p.id + '" title="' + esc(a.reason + ' · ' + lvlName[lv]) + '"><span class="tm">' + a.time + '</span><span class="mn">' + esc(p.name) + '</span>' + (a.status !== 'confirmed' ? W.apStatus(a.status) : '') + U.mark(lv) + '</div>'; }).join('') : '<div class="empty">Hôm nay không có lịch khám.</div>') + '</div></section>' +
      '<section class="card cardf"><div class="card-h"><h3>Tin chờ trả lời</h3><span style="flex:1"></span><button class="lnk" data-a="nav" data-r="d/msgs">Hộp thư</button></div><div class="scroll">' +
      (pp.length ? pp.map((p) => { const m = R.pending(p), over = m.hours > R.cfg.msgHours; return '<div class="mini-row" data-a="msgto" data-id="' + p.id + '" title="' + esc(m.text) + '">' + U.mark(over ? 'watch' : 'ok') + '<span class="mn">' + esc(p.name) + '</span><span class="mt">' + Math.max(1, over ? Math.floor(m.hours) : Math.round(m.hours)) + ' giờ</span></div>'; }).join('') : '<div class="empty">Không có tin nhắn chờ trả lời.</div>') + '</div></section>' +
      '</div></div></div>';
  };

  /* ---------- Bệnh nhân ---------- */
  W.filterPatients = () => {
    const f = S().pf, cfg = R.cfg;
    const q = f.q.trim().toLowerCase();
    let L = D.patients.filter((p) => W.groupOf(f.group)(p));
    if (q) L = L.filter((p) => (p.name + ' ' + p.id + ' ' + p.phone).toLowerCase().includes(q));
    if (f.need !== 'all') L = L.filter((p) => Ins.NEEDS[f.need].f(p, S().cls[p.id]));
    if (f.level !== 'all') L = L.filter((p) => S().cls[p.id].level === f.level);
    if (f.dx !== 'all') L = L.filter((p) => p.dx.type === f.dx);
    if (f.site !== 'all') L = L.filter((p) => p.site === f.site);
    if (f.rf !== 'all') L = L.filter((p) => {
      const I = R.ind(p, cfg);
      return { smoke: I.smoke.state === 'bad', htn: p.rf.htn === 1, dm: p.rf.dm === 1, af: p.rf.af === 1, ldl: I.ldl.state === 'bad', adh: I.adh.state === 'bad', bmi: I.bmi.v >= 23, ex: I.ex.state === 'bad', alc: I.alc.state === 'bad' }[f.rf];
    });
    const lv = { act: 0, watch: 1, ok: 2 };
    const key = { risk: (a, b) => lv[S().cls[a.id].level] - lv[S().cls[b.id].level] || (S().cls[b.id].at ? S().cls[b.id].at.d * 24 + S().cls[b.id].at.h : -999) - (S().cls[a.id].at ? S().cls[a.id].at.d * 24 + S().cls[a.id].at.h : -999), upd: (a, b) => (b.lastData.d * 24 + b.lastData.h) - (a.lastData.d * 24 + a.lastData.h), name: (a, b) => a.name.localeCompare(b.name, 'vi'), age: (a, b) => b.age - a.age };
    return L.sort(key[f.sort]);
  };
  W.RFN = { all: 'Tất cả', smoke: 'Đang hút thuốc', htn: 'Tăng huyết áp', dm: 'Đái tháo đường', af: 'Rung nhĩ', ldl: 'LDL-C vượt mục tiêu', adh: 'Tuân thủ thuốc <90%', bmi: 'BMI ≥23', ex: 'Vận động <150 phút/tuần', alc: 'Rượu vượt mức' };
  W.patients = () => {
    const f = S().pf, L = W.filterPatients();
    const opt = (v, cur, t) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + t + '</option>';
    const chips = [];
    if (f.need !== 'all') chips.push(['need', 'Nhu cầu: ' + Ins.NEEDS[f.need].t]);
    if (f.level !== 'all') chips.push(['level', 'Mức: ' + U.lvl[f.level].t]);
    if (f.dx !== 'all') chips.push(['dx', 'Loại: ' + U.dxName[f.dx]]);
    if (f.rf !== 'all') chips.push(['rf', 'Yếu tố: ' + W.RFN[f.rf]]);
    if (f.site !== 'all') chips.push(['site', 'Cơ sở: ' + (f.site === 'BM' ? 'Bạch Mai' : 'Vinmec')]);
    if (f.q) chips.push(['q', 'Tìm: ' + f.q]);
    const seg = (k, t) => '<button class="' + (f.group === k ? 'on' : '') + '" data-a="pgroup" data-v="' + k + '">' + t + '<span class="n">' + D.patients.filter(W.groupOf(k)).length + '</span></button>';
    return '<div class="page" style="height:100%"><div class="page-h"><h1>Bệnh nhân</h1><span class="scope">Đang hiện <b>' + L.length + '</b> / ' + D.patients.length + ' bệnh nhân</span><span class="sp"></span><button class="btn" data-a="export">' + ic('download') + 'Xuất CSV</button><button class="btn primary" data-a="addpt">' + ic('plus') + 'Thêm bệnh nhân / Tạo profile hộ</button></div>' +
      '<div class="toolbar"><div class="seg">' + seg('all', 'Tất cả') + seg('prim', 'Tiên phát') + seg('sec', 'Thứ phát') + '</div>' +
      '<input type="search" placeholder="Tên, mã hoặc số điện thoại" value="' + esc(f.q) + '" data-i="pq" style="width:230px" aria-label="Tìm bệnh nhân">' +
      '<select data-i="plevel" aria-label="Mức theo dõi">' + opt('all', f.level, 'Mọi mức theo dõi') + opt('act', f.level, 'Cần can thiệp') + opt('watch', f.level, 'Cần theo dõi') + opt('ok', f.level, 'Ổn định') + '</select>' +
      '<select data-i="pdx" aria-label="Loại">' + opt('all', f.dx, 'Mọi loại đột quỵ') + opt('NMN', f.dx, 'Nhồi máu não') + opt('CMN', f.dx, 'Chảy máu não') + opt('TIA', f.dx, 'TIA') + opt('NONE', f.dx, 'Chưa từng đột quỵ') + '</select>' +
      '<select data-i="prf" aria-label="Yếu tố nguy cơ">' + Object.keys(W.RFN).map((k) => opt(k, f.rf, k === 'all' ? 'Mọi yếu tố nguy cơ' : W.RFN[k])).join('') + '</select>' +
      '<select data-i="psite" aria-label="Cơ sở">' + opt('all', f.site, 'Mọi cơ sở') + opt('BM', f.site, 'Bạch Mai') + opt('VM', f.site, 'Vinmec Times City') + '</select>' +
      '<label class="small muted">Sắp xếp&nbsp;<select data-i="psort">' + opt('risk', f.sort, 'Mức khẩn trước') + opt('upd', f.sort, 'Cập nhật gần nhất') + opt('name', f.sort, 'Tên A–Z') + opt('age', f.sort, 'Tuổi giảm dần') + '</select></label>' +
      (chips.length ? '<div class="chips">' + chips.map((c) => '<span class="fchip">' + esc(c[1]) + '<button data-a="pclear" data-v="' + c[0] + '" aria-label="Bỏ lọc">✕</button></span>').join('') + '<button class="btn sm ghost" data-a="pclear" data-v="all">Xóa tất cả</button></div>' : '') + '</div>' +
      '<div class="tw fill"><div class="scroll" style="flex:1;min-height:0"><table class="tbl"><thead><tr><th>Mức theo dõi</th><th>Bệnh nhân</th><th>Tuổi · Giới</th><th>Chẩn đoán</th><th>Mức nguy cơ</th><th>Vấn đề cần chú ý</th><th class="r">HA TB 7 ngày</th><th class="r">Tuân thủ 30 ngày</th><th>Cập nhật</th></tr></thead><tbody>' +
      (L.length ? L.map((p) => {
        const c = S().cls[p.id], I = R.ind(p), rk = R.riskTier(p), iss = W.issues(p);
        return '<tr data-a="open" data-id="' + p.id + '"><td>' + U.chip(c.level) + '</td><td><b>' + esc(p.name) + '</b><div class="xs muted">' + p.id + ' · ' + U.site(p) + '</div></td><td>' + p.age + ' · ' + U.sexName(p) + '</td><td>' + esc(U.dxShort(p)) + '</td><td>' + U.tierChip(rk) + '</td><td>' + (iss.length ? esc(iss.join(', ')) : '<span class="muted">Không có</span>') + '</td><td class="r">' + (I.bp.avg7 ? '<span class="' + (I.bp.state === 'ok' ? 'sm-ok' : 'sm-bad') + '">' + I.bp.avg7.s + '/' + I.bp.avg7.dia + '</span> <span class="xs muted">mmHg</span>' : '<span class="muted">—</span>') + '</td><td class="r">' + (I.adh.v ? '<span class="' + (I.adh.state === 'ok' ? 'sm-ok' : 'sm-bad') + '">' + I.adh.v.pct + '%</span>' : '<span class="muted xs">' + (p.consentAdh ? '—' : 'BN chưa chia sẻ') + '</span>') + '</td><td class="xs">' + esc(W.updTxt(p)) + '</td></tr>';
      }).join('') : '<tr><td colspan="9" class="empty">Không có bệnh nhân khớp bộ lọc.</td></tr>') + '</tbody></table></div></div></div>';
  };

  /* ---------- Lịch khám ---------- */
  const dayStart = (d) => d - ((T.dateOf(d).getDay() + 6) % 7);
  W.apptsOn = (d) => S().appts.filter((a) => a.d === d && (S().ap.filter === 'all' || a.status === S().ap.filter)).sort((a, b) => a.time.localeCompare(b.time));
  W.apBtns = (a) => {
    if (a.status === 'pending') return '<button class="btn sm primary" data-a="apconfirm" data-id="' + a.id + '">Xác nhận</button><button class="btn sm danger" data-a="apcancel" data-id="' + a.id + '">Từ chối</button>';
    if (a.status === 'confirmed') return '<button class="btn sm" data-a="apdone" data-id="' + a.id + '">Hoàn tất</button><button class="btn sm danger" data-a="apcancel" data-id="' + a.id + '">Hủy</button>';
    return a.conclusion ? '<span class="xs muted">Kết luận: ' + esc(a.conclusion) + '</span>' : '';
  };
  W.apItem = (a) => { const p = P(a.pid); const end = (() => { const m = parseInt(a.time, 10) * 60 + parseInt(a.time.slice(3), 10) + a.dur; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); })();
    return '<div class="mod-row" style="grid-template-columns:96px minmax(0,1fr) auto"><div><b class="num">' + a.time + '–' + end + '</b><div class="xs muted">' + T.dow(a.d) + ' ' + T.fmtDM(a.d) + '</div></div><div style="min-width:0"><a href="#" data-a="open" data-id="' + p.id + '"><b>' + esc(p.name) + '</b></a> <span class="xs muted">' + p.id + ' · ' + a.dur + ' phút · ' + (a.by === 'patient' ? 'BN đặt qua app' : 'BS tạo') + '</span><div class="small">' + esc(a.reason) + '</div></div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + W.apStatus(a.status) + W.apBtns(a) + '</div></div>'; };
  W.appts = () => {
    const s = S(), ap = s.ap, an = ap.anchor;
    const cnt = (d) => s.appts.filter((a) => a.d === d && a.status !== 'canceled').length;
    const pend = s.appts.filter((a) => a.status === 'pending');
    const overdue = D.patients.filter((p) => s.cls[p.id].reasons.some((r) => r.code === 'overdue'));
    let title = '', body = '';
    if (ap.mode === 'day') {
      title = T.dow(an) + ', ' + T.fmtDMY(an);
      const L = W.apptsOn(an), am = L.filter((a) => a.time < '12:00'), pm = L.filter((a) => a.time >= '12:00');
      body = L.length ? '<div class="scroll" style="padding:4px 14px">' + (am.length ? '<div class="small muted" style="padding-top:8px"><b>Sáng · ' + am.length + ' lịch</b></div>' + am.map(W.apItem).join('') : '') + (pm.length ? '<div class="small muted" style="padding-top:8px"><b>Chiều · ' + pm.length + ' lịch</b></div>' + pm.map(W.apItem).join('') : '') + '</div>' : '<div class="empty">Không có lịch khám trong ngày này.</div>';
    } else if (ap.mode === 'week') {
      const m0 = dayStart(an); title = T.fmtDM(m0) + ' – ' + T.fmtDMY(m0 + 6);
      let hd = '<div class="wh"></div>', cols = '<div class="whr" style="position:relative">';
      for (let h = 7; h <= 17; h++) cols += '<div class="xs muted" style="position:absolute;right:6px;top:' + ((h - 7) * 56 - 6) + 'px">' + String(h).padStart(2, '0') + ':00</div>';
      cols += '</div>';
      for (let i = 0; i < 7; i++) {
        const d = m0 + i; hd += '<div class="wh' + (d === 0 ? ' today' : '') + '"><a href="#" data-a="apday" data-d="' + d + '" style="color:inherit;text-decoration:none">' + ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i] + ' ' + T.fmtDM(d) + '</a><div class="xs muted">' + cnt(d) + ' lịch</div></div>';
        cols += '<div class="wcol">' + W.apptsOn(d).filter((a) => a.time >= '07:00').map((a) => { const mm = (parseInt(a.time, 10) - 7) * 60 + parseInt(a.time.slice(3), 10); return '<div class="ev ' + a.status + '" style="top:' + (mm / 60 * 56) + 'px;height:' + Math.max(24, a.dur / 60 * 56 - 2) + 'px" data-a="apday" data-d="' + d + '" title="' + esc(P(a.pid).name + ' · ' + a.reason + ' · ' + ST[a.status][0]) + '"><b>' + a.time + '</b> ' + esc(P(a.pid).name) + '</div>'; }).join('') + '</div>';
      }
      body = '<div class="week">' + hd + cols + '</div>';
    } else {
      const d1 = T.dateOf(an); const first = new Date(d1.getFullYear(), d1.getMonth(), 1); title = 'Tháng ' + (first.getMonth() + 1) + '/' + first.getFullYear();
      const base = Math.round((first - new Date(2026, 9, 31)) / 864e5), m0 = dayStart(base);
      let cells = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x) => '<div class="mh">' + x + '</div>').join('');
      for (let i = 0; i < 42; i++) {
        const d = m0 + i, out = T.dateOf(d).getMonth() !== first.getMonth(), L = s.appts.filter((a) => a.d === d && a.status !== 'canceled').sort((a, b) => a.time.localeCompare(b.time));
        cells += '<div class="mc' + (out ? ' out' : '') + (d === 0 ? ' today' : '') + '" data-a="apday" data-d="' + d + '"><span class="dn">' + T.dateOf(d).getDate() + '</span>' + L.slice(0, 3).map((a) => '<div class="mevt"><span class="dot ' + a.status + '"></span>' + a.time + ' ' + esc(P(a.pid).name) + '</div>').join('') + (L.length > 3 ? '<div class="xs muted">+' + (L.length - 3) + ' lịch</div>' : '') + '</div>';
      }
      body = '<div class="month">' + cells + '</div>';
    }
    const step = ap.mode === 'month' ? 30 : ap.mode === 'week' ? 7 : 1;
    const seg = (k, t) => '<button class="' + (ap.mode === k ? 'on' : '') + '" data-a="apmode" data-v="' + k + '">' + t + '</button>';
    return '<div class="page" style="height:100%"><div class="page-h"><button class="btn primary" data-a="apnew">' + ic('plus') + 'Tạo lịch khám</button><h1>Lịch khám</h1><span class="tag">Hôm nay: ' + cnt(0) + ' lịch</span><span class="tag">Tuần này: ' + [0, 1, 2, 3, 4, 5, 6].reduce((a, i) => a + cnt(dayStart(0) + i), 0) + ' lịch</span><span class="sp"></span>' +
      '<select data-i="apfilter" aria-label="Trạng thái"><option value="all"' + (ap.filter === 'all' ? ' selected' : '') + '>Mọi trạng thái</option><option value="pending"' + (ap.filter === 'pending' ? ' selected' : '') + '>Chờ xác nhận</option><option value="confirmed"' + (ap.filter === 'confirmed' ? ' selected' : '') + '>Đã xác nhận</option><option value="done"' + (ap.filter === 'done' ? ' selected' : '') + '>Đã hoàn tất</option><option value="canceled"' + (ap.filter === 'canceled' ? ' selected' : '') + '>Đã hủy</option></select>' +
      '<div class="seg">' + seg('day', 'Ngày') + seg('week', 'Tuần') + seg('month', 'Tháng') + '</div></div>' +
      '<div class="cal"><section class="card cal-main"><div class="card-h"><button class="btn sm" data-a="apstep" data-v="-' + step + '" aria-label="Trước">' + ic('chevL') + '</button><button class="btn sm" data-a="apstep" data-v="0">Hôm nay</button><button class="btn sm" data-a="apstep" data-v="' + step + '" aria-label="Sau">' + ic('chevR') + '</button><h3 style="margin-left:6px">' + esc(title) + '</h3></div>' + body +
      '<div class="legend" style="padding:8px 14px;margin:0;border-top:1px solid var(--rule)"><span><span class="dot confirmed"></span>Đã xác nhận</span><span><span class="dot pending"></span>Chờ xác nhận</span><span><span class="dot done"></span>Đã hoàn tất</span><span><span class="dot canceled"></span>Đã hủy (không hiển thị trên lịch tháng)</span></div></section>' +
      '<div style="display:flex;flex-direction:column;gap:12px;min-height:0"><section class="card cardf" style="flex:1"><div class="card-h"><h3>Chờ xác nhận</h3><span class="tag">' + pend.length + '</span></div><div class="scroll">' + (pend.length ? pend.map((a) => '<div style="padding:9px 14px;border-bottom:1px solid var(--rule)"><b>' + esc(P(a.pid).name) + '</b> <span class="xs muted">' + T.fmtDMY(a.d) + ' ' + a.time + '</span><div class="small muted">' + esc(a.reason) + '</div><div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm primary" data-a="apconfirm" data-id="' + a.id + '">Xác nhận</button><button class="btn sm danger" data-a="apcancel" data-id="' + a.id + '">Từ chối</button></div></div>').join('') : '<div class="empty">Không có lịch chờ xác nhận.</div>') + '</div></section>' +
      '<section class="card"><div class="card-h"><h3>Cần đặt lại lịch</h3><span class="tag">' + overdue.length + '</span></div><div class="card-b small">' + (overdue.length ? overdue.map((p) => '<div style="display:flex;align-items:center;gap:8px;justify-content:space-between"><span><b>' + esc(p.name) + '</b><br><span class="xs muted">' + esc(s.cls[p.id].reasons.find((r) => r.code === 'overdue').text) + '</span></span><button class="btn sm" data-a="apnew" data-id="' + p.id + '">Đặt lịch</button></div>').join('') : '<span class="muted">Không có bệnh nhân quá hẹn.</span>') + '</div></section></div></div></div>';
  };

  /* ---------- Tin nhắn ---------- */
  W.TPL = [
    { k: 'do', t: 'Đo lại huyết áp', x: 'Chào {tên}, bác sĩ thấy huyết áp gần đây của bạn {HA}cao hơn mục tiêu. Bạn vui lòng ngồi nghỉ 5 phút rồi đo 3 lần, lấy trung bình 2 lần cuối, đo 2 lần/ngày và ghi vào app nhé.' },
    { k: 'thuoc', t: 'Nhắc uống thuốc', x: 'Chào {tên}, bác sĩ thấy lịch uống {thuốc} gần đây còn bỏ lỡ {liều}. Bạn nhắn lại để bác sĩ hỗ trợ đặt giờ nhắc phù hợp. Vui lòng không tự ý ngừng hoặc đổi thuốc.' },
    { k: 'quen', t: 'Quên liều (mẫu cần BS duyệt)', x: 'Chào {tên}, về việc quên liều {thuốc}: bạn vui lòng liên hệ lại để bác sĩ hướng dẫn cụ thể theo thuốc đang dùng. Tránh tự uống gấp đôi liều.' },
    { k: 'lich', t: 'Nhắc lịch tái khám', x: 'Chào {tên}, lịch tái khám của bạn là {lịch}. Nhớ mang đơn thuốc và sổ đo huyết áp.' },
    { k: 'tc', t: 'Hỏi triệu chứng', x: 'Chào {tên}, bạn có thấy yếu hoặc tê một bên, méo miệng, nói khó, nhìn mờ đột ngột không? Nếu có, hãy gọi 115 ngay.' },
    { k: 'nhap', t: 'Nhắc nhập số', x: 'Chào {tên}, đã {ngày} ngày bác sĩ chưa thấy số đo mới của bạn. Bạn vui lòng đo huyết áp và ghi vào app để bác sĩ tiện theo dõi nhé.' },
    { k: 'doilich', t: 'Trả lời đổi lịch', x: 'Chào {tên}, bác sĩ đã nhận yêu cầu đổi lịch của bạn. Bạn sẽ nhận được thông báo khi lịch mới được xác nhận.' },
    { k: 'don', t: 'Trả lời xin đơn thuốc', x: 'Chào {tên}, bác sĩ đã nhận thông tin {hết thuốc}. Bác sĩ sẽ phản hồi về đơn thuốc. Vui lòng không tự ý ngừng thuốc.' },
  ];
  const mostMissed = (p) => {
    if (!p.consentAdh) return null;
    const L = R.misses(p, -7, true).filter((m) => m.d <= -1), A = L.length ? L : R.misses(p, -30, false); if (!A.length) return null;
    const n = {}; A.forEach((m) => { n[m.med] = (n[m.med] || 0) + 1; });
    const med = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    return { med, n: n[med], days: L.length ? 7 : 30 };
  };
  W.fillTpl = (x, p) => {
    const b = R.lastBP(p), mm = mostMissed(p), low = p.meds.filter((m) => m.supply <= 7);
    return x.replace('{tên}', p.name).replace('{lịch}', T.dow(p.appt.d) + ' ' + T.fmtDMY(p.appt.d) + ' lúc ' + p.appt.time)
      .replace('{HA}', b ? '(lần gần nhất ' + b.s + '/' + b.dia + ' mmHg, ' + R.stamp(b.d, b.h) + ') ' : '')
      .replace('{thuốc}', mm ? mm.med : 'thuốc').replace('{liều}', mm ? mm.n + ' liều trong ' + mm.days + ' ngày qua' : 'một số liều')
      .replace('{ngày}', String(R.staleDays(p))).replace('{hết thuốc}', low.length ? low.map((m) => m.name + ' còn ' + m.supply + ' ngày').join(', ') : 'về thuốc của bạn');
  };
  const CODE_TPL = { neuro: 'tc', 'bp-crit': 'tc', 'bp-avg3': 'do', 'bp-avg7': 'do', 'miss-ac': 'thuoc', 'hr-adh': 'thuoc', adh: 'thuoc', stale: 'nhap', overdue: 'lich', appt: 'lich' };
  W.suggestTpl = (p) => {
    const pe = R.pending(p);
    if (pe) {
      const n = Ins.norm(pe.text);
      if (/quen|uong bu/.test(n)) return 'quen';
      if (/doi lich|doi hen|lich kham/.test(n)) return 'doilich';
      if (/don moi|xin don|het thuoc|con khoang/.test(n)) return 'don';
    }
    const a = W.actionOf(p); return a ? CODE_TPL[a.reason.code] || null : null;
  };
  W.draftOf = (p) => {
    const d = S().drafts[p.id]; if (d != null) return d;
    const k = W.suggestTpl(p), t = k && W.TPL.find((x) => x.k === k);
    return t ? W.fillTpl(t.x, p) : '';
  };
  W.threadHtml = (p) => {
    const rel = p.family ? p.family.name + ' (' + p.family.rel + ')' : 'Người thân';
    return p.thread.length ? p.thread.map((m) => '<div class="msg ' + (m.from === 'bs' ? 'bs' : '') + '"><div class="mt">' + esc(m.from === 'bs' ? D.doctor.short : m.from === 'nt' ? rel : p.name) + ' · ' + U.dt(m.d, m.h) + '</div>' + esc(m.text) + '</div>').join('') : '<div class="empty">Chưa có tin nhắn. Hội thoại hai chiều với bệnh nhân nằm trong cùng một luồng.</div>';
  };
  W.composer = (p) => { const k = S().drafts[p.id] == null ? W.suggestTpl(p) : null; return '<div class="tpls">' + W.TPL.map((t, i) => '<button class="btn sm' + (t.k === k ? ' sug' : '') + '" data-a="tpl" data-i="' + i + '" data-id="' + p.id + '">' + (t.k === k ? ic('spark') : '') + esc(t.t) + '</button>').join('') + '</div><div class="composer"><textarea id="msgbox" data-i="draft" data-id="' + p.id + '" placeholder="Nhập tin nhắn cho ' + esc(p.name) + '…" aria-label="Nội dung tin nhắn">' + esc(W.draftOf(p)) + '</textarea><button class="btn primary" data-a="send" data-id="' + p.id + '">' + ic('send') + 'Gửi</button></div><div class="xs muted" style="padding:0 14px 10px">' + (k ? 'Đã điền sẵn mẫu gợi ý theo tình huống [Đề xuất], tên thuốc và số liệu lấy từ hồ sơ. Đọc và sửa rồi mới gửi. ' : '') + 'Mẫu tin nhắn cần được lâm sàng duyệt. Bản demo không gửi tin thật.</div>'; };
  W.msgs = () => {
    const s = S();
    const L = D.patients.filter((p) => p.thread.length).sort((a, b) => { const pa = R.pending(a) ? 1 : 0, pb = R.pending(b) ? 1 : 0; if (pa !== pb) return pb - pa; const la = a.thread[a.thread.length - 1], lb = b.thread[b.thread.length - 1]; return (lb.d * 24 + lb.h) - (la.d * 24 + la.h); });
    const sel = P(s.mg.sel && L.some((p) => p.id === s.mg.sel) ? s.mg.sel : (L[0] && L[0].id));
    return '<div class="page" style="height:100%"><div class="page-h"><h1>Tin nhắn</h1><span class="scope"><b>' + W.pendingPatients().length + '</b> bệnh nhân chờ trả lời · ' + L.length + ' hội thoại</span></div><div class="chat">' +
      '<section class="card chat-list"><div class="scroll" style="flex:1">' + L.map((p) => { const m = p.thread[p.thread.length - 1], pe = R.pending(p); return '<div class="clrow' + (sel && sel.id === p.id ? ' on' : '') + '" data-a="msel" data-id="' + p.id + '">' + U.av(p, s.cls[p.id].level) + '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:6px"><b>' + esc(p.name) + '</b><span class="xs muted">' + (m.d === 0 ? T.fmtH(m.h) : T.fmtDM(m.d)) + '</span></div><div class="pv">' + (m.from === 'bs' ? 'Bạn: ' : '') + esc(m.text) + '</div>' + (pe && pe.hours > R.cfg.msgHours ? '<span class="chip watch xs">' + ic('watch') + 'Chờ ' + Math.floor(pe.hours) + ' giờ</span>' : '') + '</div>' + (pe ? '<span class="unread">1</span>' : '') + '</div>'; }).join('') + '</div></section>' +
      '<section class="card chat-main">' + (sel ? '<div class="card-h">' + U.av(sel, s.cls[sel.id].level) + '<div><b>' + esc(sel.name) + '</b><div class="xs muted">' + sel.id + ' · ' + U.dxShort(sel) + '</div></div><span style="flex:1"></span><button class="btn sm" data-a="open" data-id="' + sel.id + '">Mở hồ sơ</button></div><div class="thread" id="thread">' + W.threadHtml(sel) + '</div>' + W.composer(sel) : '<div class="empty">Chưa có hội thoại.</div>') + '</section></div></div>';
  };

  /* ---------- Công cụ tính nguy cơ ---------- */
  const TOOLS = {
    esrs: { n: 'ESRS', d: 'Sau nhồi máu não hoặc TIA', f: ['event', 'age', 'htn', 'dm', 'pad', 'mi', 'ocvd', 'smoke', 'prior'] },
    spi: { n: 'SPI-II', d: 'Sau TIA hoặc đột quỵ thiếu máu nhẹ', f: ['event', 'age', 'htn', 'dm', 'prior', 'mi', 'ocvd', 'hf'] },
    cha: { n: 'CHA₂DS₂-VASc', d: 'Bệnh nhân rung nhĩ', f: ['event', 'age', 'sex', 'af', 'hf', 'htn', 'dm', 'pad', 'mi'] },
    abcd2: { n: 'ABCD2', d: 'Sau TIA', f: ['age', 'bp140', 'clin', 'dur', 'dm'] },
    fsrp: { n: 'FSRP 2017', d: 'Khung nhập liệu · chưa có hệ số', f: ['event', 'age', 'sex', 'htn', 'smoke', 'dm', 'cvd', 'af'] },
  };
  const FL = { htn: 'Tăng huyết áp đã chẩn đoán hoặc đang dùng thuốc hạ áp', dm: 'Đái tháo đường đã chẩn đoán hoặc đang điều trị', pad: 'Bệnh động mạch ngoại biên', mi: 'Tiền sử nhồi máu cơ tim', ocvd: 'Bệnh tim mạch khác (không tính NMCT, rung nhĩ)', smoke: 'Hút thuốc hiện tại', prior: 'TIA/đột quỵ thiếu máu trước biến cố hiện tại', hf: 'Suy tim sung huyết', af: 'Rung nhĩ', cvd: 'Bệnh tim mạch (mạch vành, suy tim, ĐM ngoại biên)', bp140: 'Huyết áp lúc đánh giá ≥140/90 mmHg' };
  W.toolInp = () => { const t = S().ti; const o = Object.assign({}, t); if (o.age === '' || o.age == null) o.age = NaN; o.age = Number(o.age); return o; };
  W.tools = () => {
    const s = S(), cur = TOOLS[s.tool], t = s.ti;
    const tri = (k) => '<div class="seg" role="group" aria-label="' + esc(FL[k]) + '">' + [['1', 'Có'], ['0', 'Không'], ['u', 'Chưa rõ']].map(([v, l]) => '<button class="' + ((v === 'u' ? t[k] === null : t[k] === Number(v) && t[k] !== undefined && t[k] !== null) ? 'on' : '') + '" data-a="ti" data-k="' + k + '" data-v="' + v + '">' + l + '</button>').join('') + '</div>';
    const fld = (k) => {
      if (FL[k]) return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:5px 0;border-bottom:1px solid var(--rule)"><span class="small">' + FL[k] + '</span>' + tri(k) + '</div>';
      if (k === 'age') return '<label class="f">Tuổi (năm)<input type="number" min="0" max="120" value="' + esc(t.age == null ? '' : t.age) + '" data-i="tiage"></label>';
      if (k === 'sex') return '<label class="f">Giới<select data-i="tisex"><option value="">Chưa chọn</option><option value="M"' + (t.sex === 'M' ? ' selected' : '') + '>Nam</option><option value="F"' + (t.sex === 'F' ? ' selected' : '') + '>Nữ</option></select></label>';
      if (k === 'event') return '<label class="f">Biến cố / tiền sử đột quỵ<select data-i="tievent"><option value="">Chưa chọn</option><option value="NMN"' + (t.event === 'NMN' ? ' selected' : '') + '>Nhồi máu não</option><option value="TIA"' + (t.event === 'TIA' ? ' selected' : '') + '>TIA</option><option value="CMN"' + (t.event === 'CMN' ? ' selected' : '') + '>Chảy máu não</option><option value="NONE"' + (t.event === 'NONE' ? ' selected' : '') + '>Chưa từng đột quỵ/TIA</option></select></label>';
      if (k === 'clin') return '<label class="f">Triệu chứng lâm sàng<select data-i="ticlin"><option value="">Chưa chọn</option><option value="uni"' + (t.clin === 'uni' ? ' selected' : '') + '>Yếu một bên (± rối loạn ngôn ngữ)</option><option value="speech"' + (t.clin === 'speech' ? ' selected' : '') + '>Rối loạn ngôn ngữ, không yếu một bên</option><option value="other"' + (t.clin === 'other' ? ' selected' : '') + '>Triệu chứng khác</option></select></label>';
      if (k === 'dur') return '<label class="f">Thời gian triệu chứng<select data-i="tidur"><option value="">Chưa chọn</option><option value="60"' + (t.dur === '60' ? ' selected' : '') + '>≥60 phút</option><option value="10"' + (t.dur === '10' ? ' selected' : '') + '>10–59 phút</option><option value="<10"' + (t.dur === '<10' ? ' selected' : '') + '>&lt;10 phút</option></select></label>';
      return '';
    };
    const inp = W.toolInp();
    if (!t.event && s.tool !== 'abcd2') inp.event = undefined;
    let res;
    const ageOk = !isNaN(inp.age);
    if (!ageOk) res = '<div class="infobox">Nhập tuổi để bắt đầu. Ô để trống không được hiểu là "Không".</div>';
    else if (s.tool !== 'abcd2' && !t.event) res = '<div class="infobox">Chọn biến cố / tiền sử đột quỵ để áp dụng đúng thang.</div>';
    else {
      const r = s.tool === 'fsrp' ? R.scales.fsrp(inp, null) : R.scales[s.tool](inp);
      res = W.scaleCard(r, { calc: true });
      if (s.tool === 'cha' && inp.sex == null) res = '<div class="infobox">Chọn giới để tính CHA₂DS₂-VASc.</div>' + res;
    }
    const sel = '<select data-i="tipick" aria-label="Nạp từ hồ sơ"><option value="">Nạp từ hồ sơ bệnh nhân…</option>' + D.patients.map((p) => '<option value="' + p.id + '">' + esc(p.name) + ' (' + p.id + ')</option>').join('') + '</select>';
    return '<div class="page"><div class="page-h"><h1>Công cụ tính nguy cơ</h1><span class="sp"></span>' + sel + '<button class="btn" data-a="tireset">Xóa nhập liệu</button></div>' +
      '<div class="seg" style="align-self:flex-start">' + Object.keys(TOOLS).map((k) => '<button class="' + (s.tool === k ? 'on' : '') + '" data-a="tool" data-v="' + k + '">' + TOOLS[k].n + '</button>').join('') + '</div>' +
      '<div class="grid2" style="align-items:start"><section class="card"><div class="card-h"><h3>' + cur.n + '</h3><span class="muted small">' + cur.d + '</span></div><div class="card-b" style="display:flex;flex-direction:column;gap:6px"><div class="form-grid">' + cur.f.filter((k) => !FL[k]).map(fld).join('') + '</div>' + cur.f.filter((k) => FL[k]).map(fld).join('') + '<div class="xs muted">Không dùng để chẩn đoán hay điều trị. Công cụ hỗ trợ ra quyết định, không thay thế phán đoán lâm sàng.</div></div></section><div>' + res + '</div></div></div>';
  };

  /* thẻ kết quả của một thang (dùng ở hồ sơ và công cụ) */
  W.scaleCard = (r, o) => {
    o = o || {};
    if (!r.applicable) return '<div class="scale na"><div class="scale-h"><h4>' + esc(r.scale) + '</h4><span class="chip neutral">' + ic('dash') + 'Không áp dụng</span></div><div class="scale-b small">' + esc(r.naReason) + '<div class="meta"><span>Phiên bản: ' + esc(r.version) + '</span></div></div></div>';
    let h = '<div class="scale"><div class="scale-h"><h4>' + esc(r.scale) + '</h4>';
    if (r.insufficient) h += '<span class="chip neutral">' + ic('dash') + 'Chưa đủ dữ liệu</span>';
    else if (r.pct != null) h += '<span class="sc">' + r.pct + '%</span><span class="tag dem">minh họa</span>';
    else if (r.score != null) h += '<span class="sc num">' + r.score + '</span><span class="muted small">điểm' + (r.partial ? ' tạm tính' : '') + '</span>' + U.tierChip(r.tier);
    else h += '<span class="chip neutral">' + ic('dash') + 'Demo không tính %</span>';
    h += '</div><div class="scale-b">';
    if (r.scale === 'FSRP 2017' && !r.insufficient && r.pct == null) h += '<div class="warnbox">Chưa có hệ số FSRP trong hồ sơ nên demo không tính %. Dữ liệu mẫu có % minh họa nạp sẵn cho từng bệnh nhân từ 55 tuổi.</div>';
    if (r.scale === 'FSRP 2017' && r.pct != null) h += '<div class="warnbox">% nguy cơ 10 năm nạp sẵn trong dữ liệu mẫu, <b>chỉ để minh họa</b>, không tính từ hệ số thật.</div>';
    if (r.missing && r.missing.length) h += '<div class="warnbox"><b>Chưa thể tính đầy đủ vì thiếu:</b> ' + r.missing.map(esc).join('; ') + '. Vui lòng bổ sung hoặc chọn "Chưa rõ".' + (r.couldChange ? ' <b>Phân tầng có thể đổi</b> khi có đủ dữ liệu (tối đa ' + r.maxPossible + ' điểm).' : '') + '</div>';
    h += '<table class="tbl plain" style="margin-top:8px"><thead><tr><th style="position:static">Biến đã dùng</th><th style="position:static">Giá trị</th>' + (r.score != null ? '<th class="r" style="position:static">Điểm</th>' : '') + '</tr></thead><tbody>' + r.used.map((u) => '<tr><td>' + esc(u.label) + (u.note ? '<div class="xs muted">' + esc(u.note) + '</div>' : '') + '</td><td>' + esc(u.val) + '</td>' + (r.score != null ? '<td class="r"><b>' + u.pts + '</b></td>' : '') + '</tr>').join('') + '</tbody></table>';
    if (r.band) h += '<div class="meta"><span><b>Phân tầng:</b> ' + esc(r.band) + '</span></div>';
    if (r.bandNote) h += '<div class="xs muted">' + esc(r.bandNote) + '</div>';
    h += '<div class="meta"><span>Phiên bản: <code>' + esc(r.version) + '</code></span><span>Ngày tính: ' + r.date + '</span><span>Người nhập: ' + (o.calc ? 'BS. Nguyễn Hoàng Nam (nhập tay)' : 'Hệ thống (từ hồ sơ)') + '</span></div></div></div>';
    return h;
  };

  /* ---------- Cài đặt bác sĩ: lịch khám cố định + lịch bận ---------- */
  const HOURS = []; for (let h = 6; h <= 20; h++) { HOURS.push(String(h).padStart(2, '0') + ':00'); HOURS.push(String(h).padStart(2, '0') + ':30'); }
  W.HOURS = HOURS;
  W.settings = () => {
    const st = S().set; const names = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
    const sel = (k, i, v) => '<select data-i="setT" data-k="' + k + '" data-d="' + i + '" ' + (st.days[i].on ? '' : 'disabled') + ' aria-label="' + k + '">' + HOURS.map((h) => '<option' + (h === v ? ' selected' : '') + '>' + h + '</option>').join('') + '</select>';
    return '<div class="page" style="max-width:860px"><div class="page-h"><h1>Cài đặt</h1></div><p class="muted" style="margin:0">Khai báo khung giờ nhận lịch cố định và các khoảng thời gian bận. Giờ theo hệ 24 giờ, ngày theo dd/mm/yyyy.</p>' +
      '<section class="card"><div class="card-h"><h3>Lịch khám cố định trong tuần</h3><span class="muted small">Dùng để đề xuất lịch phù hợp cho bệnh nhân. Mặc định để trống.</span><span style="flex:1"></span><button class="btn sm" data-a="setsuggest">Gợi ý T2–T6, 08:00–11:30</button></div><div class="card-b">' +
      names.map((n, i) => '<div style="display:grid;grid-template-columns:150px 110px 110px;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid var(--rule)"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" style="width:18px;height:18px" data-i="setOn" data-d="' + i + '"' + (st.days[i].on ? ' checked' : '') + '> ' + n + '</label>' + (st.days[i].on ? sel('from', i, st.days[i].from) + sel('to', i, st.days[i].to) : '<span class="muted small" style="grid-column:2/4">Không nhận lịch</span>') + '</div>').join('') +
      '<div style="margin-top:10px"><button class="btn primary" data-a="setsave">Lưu lịch cố định</button> <span class="xs muted">' + (st.saved ? 'Đã lưu lúc ' + st.saved : 'Chưa lưu') + '</span></div></div></section>' +
      '<section class="card"><div class="card-h"><h3>Thêm lịch bận</h3></div><div class="card-b"><div class="form-grid" style="grid-template-columns:1.2fr 1fr 1fr"><label class="f">Ngày (dd/mm/yyyy)<input type="text" id="bdate" placeholder="vd. ' + T.fmtDMY(3) + '" inputmode="numeric"></label><label class="f">Bắt đầu<select id="bfrom">' + HOURS.map((h) => '<option' + (h === '13:00' ? ' selected' : '') + '>' + h + '</option>').join('') + '</select></label><label class="f">Kết thúc<select id="bto">' + HOURS.map((h) => '<option' + (h === '17:00' ? ' selected' : '') + '>' + h + '</option>').join('') + '</select></label></div><label class="f" style="margin-top:8px">Ghi chú (không hiển thị cho bệnh nhân)<input type="text" id="bnote"></label><div id="berr"></div><div style="margin-top:10px"><button class="btn primary" data-a="busyadd">Lưu lịch bận</button></div></div></section>' +
      '<section class="card"><div class="card-h"><h3>Lịch bận trong 31 ngày tới</h3></div><div class="card-b">' + (st.busy.length ? st.busy.map((b, i) => '<div class="mod-row"><div><b>' + T.fmtDMY(b.d) + '</b> · ' + b.from + '–' + b.to + '<div class="xs muted">' + esc(b.note || 'Không ghi chú') + '</div></div><button class="btn sm ghost" data-a="busydel" data-i="' + i + '">Xóa</button></div>').join('') : '<span class="muted">Chưa có lịch bận.</span>') + '<div class="xs muted" style="margin-top:6px">Lịch khám đã xác nhận cũng chiếm thời gian trên lịch, xem ở trang Lịch khám.</div></div></section></div>';
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
