/* Trang góp ý wording: menu theo chủ đề, ảnh từng màn có số đánh dấu, mỗi ô chữ một luồng bình luận GitHub (giscus).
 * Câu giống nhau ở nhiều màn dùng chung một luồng (khóa = câu đã thay số bằng #). Dữ liệu màn hình: screens.js (sinh bởi capture.js).
 * Số góp ý đọc một lần cho cả repo từ API công khai của GitHub (danh sách Discussions), lưu tạm 3 phút, làm mới mỗi 5 phút. */
(function () {
  'use strict';
  const GISCUS = { repo: 'minhdust98/vnpreventstroke-demo', repoId: 'R_kgDOVeplMg', category: 'General', categoryId: 'DIC_kwDOVeplMs4DK9fk' };
  const SCREENS = window.SCREENS || [], $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const term = (b) => 'Wording ' + hash(b.key) + ' · ' + b.text.slice(0, 90);
  // Mỗi câu (khóa) xuất hiện ở những màn nào, ô thứ mấy
  const where = {}, byHash = {};
  SCREENS.forEach((s) => s.blocks.forEach((b, i) => { (where[b.key] = where[b.key] || []).push([s, i]); byHash[hash(b.key)] = b; }));
  let counts = {}, cur = null, openKey = null;
  const cnt = (key) => (counts[hash(key)] || {}).c || 0;
  const LIST = 'da-gop-y';

  function tree(q) {
    const nq = q.trim().toLowerCase(), groups = {};
    SCREENS.forEach((s) => {
      const hit = nq ? s.blocks.filter((b) => b.text.toLowerCase().includes(nq)).length : s.blocks.length;
      if (nq && !hit) return;
      ((groups[s.g] = groups[s.g] || {})[s.s] = groups[s.g][s.s] || []).push([s, hit]);
    });
    const total = Object.keys(counts).filter((h) => byHash[h]).length;
    const cm = (s) => { const n = s.blocks.reduce((a, b) => a + cnt(b.key), 0); return n ? '<em>' + n + '</em>' : ''; };
    $('#tree').innerHTML = '<a href="#' + LIST + '" class="top' + (!cur ? ' on' : '') + '"><span>Đã có góp ý</span>' + (total ? '<em>' + total + '</em>' : '<small>0</small>') + '</a>' +
      (Object.keys(groups).map((g) => '<h2>' + esc(g) + '</h2>' + Object.keys(groups[g]).map((sub) => '<h3>' + esc(sub) + '</h3>' + groups[g][sub].map(([s, n]) => '<a href="#' + s.id + '" class="' + (cur && cur.id === s.id ? 'on' : '') + '"><span>' + esc(s.t) + '</span>' + cm(s) + '<small>' + n + '</small></a>').join('')).join('')).join('') || '<div class="empty">Không thấy chữ này.</div>');
  }

  // Mọi câu đã có góp ý, mới nhất trước
  function showList() {
    cur = null; openKey = null;
    const rows = Object.keys(counts).filter((h) => byHash[h]).map((h) => Object.assign({ b: byHash[h] }, counts[h])).sort((a, b) => (b.at > a.at ? 1 : -1));
    $('#main').innerHTML = '<div class="head"><h1>Đã có góp ý</h1><span class="crumb">' + rows.length + ' câu</span></div>' +
      (rows.length ? '<div class="list">' + rows.map((r) => '<section class="blk"><div class="blk-h"><span class="kind">' + esc(r.b.kind) + '</span><span class="cnt">' + r.c + ' góp ý</span></div><p class="txt">' + esc(r.b.text) + '</p>' +
        '<div class="also">' + where[r.b.key].map(([s, i]) => '<a href="#' + s.id + ':' + (i + 1) + '">' + esc(s.t) + ' (ô ' + (i + 1) + ')</a>').join(' · ') + ' · <a href="' + esc(r.url) + '" target="_blank" rel="noopener">Xem trên GitHub</a></div></section>').join('') + '</div>'
        : '<div class="empty">Chưa có góp ý nào.</div>');
    tree($('#q').value); window.scrollTo(0, 0);
  }

  function show(id, n) {
    cur = SCREENS.find((s) => s.id === id) || SCREENS[0]; openKey = null;
    const others = (b) => where[b.key].filter(([s]) => s.id !== cur.id).length;
    $('#main').innerHTML = '<div class="head"><h1>' + esc(cur.t) + '</h1><span class="crumb">' + esc(cur.g + ' › ' + cur.s) + '</span></div>' +
      '<p class="hint">Bấm số trên ảnh hoặc bấm Góp ý ở ô bên phải. Cần đăng nhập GitHub để viết; ai cũng đọc được.</p>' +
      '<div class="grid">' + (cur.w ? '<div class="left"><div class="shot" id="shot"><img src="shots/' + cur.id + '.jpg" alt="' + esc(cur.t) + '" width="' + cur.w + '" height="' + cur.h + '">' +
        cur.blocks.map((b, i) => (b.x == null ? '' : '<button class="pin" data-i="' + i + '" style="left:' + b.x + '%;top:' + b.y + '%" aria-label="Ô ' + (i + 1) + '">' + (i + 1) + '</button>')).join('') + '</div><div class="tools"><a href="shots/' + cur.id + '.jpg" target="_blank" rel="noopener">Mở ảnh cỡ thật</a><button class="lnk" data-pins>Ẩn số</button></div></div>' : '') +
      '<div class="blocks">' + (cur.blocks.length ? cur.blocks.map((b, i) => '<section class="blk" id="b' + i + '" data-i="' + i + '"><div class="blk-h"><span class="num">' + (i + 1) + '</span><span class="kind">' + esc(b.kind) + (b.n > 1 ? ' · ' + b.n + ' chỗ trên màn' : '') + '</span></div>' +
        '<p class="txt">' + esc(b.text) + '</p>' + (others(b) ? '<div class="also">Cũng có ở ' + others(b) + ' màn khác, dùng chung góp ý</div>' : '') +
        '<button class="go" data-i="' + i + '" data-key="' + esc(b.key) + '">Góp ý</button><div class="thread"></div></section>').join('') : '<div class="empty">Màn này không có chữ.</div>') + '</div></div>';
    tree($('#q').value); window.scrollTo(0, 0); paintCounts();
    if (n != null) { focus(n, true); thread(n); }
  }

  function focus(i, scroll) {
    document.querySelectorAll('.blk.on,.pin.on').forEach((e) => e.classList.remove('on'));
    const blk = $('#b' + i), pin = document.querySelector('.pin[data-i="' + i + '"]'), b = cur.blocks[i];
    if (blk) { blk.classList.add('on'); if (scroll) blk.scrollIntoView({ block: 'nearest' }); }
    if (pin) { pin.classList.add('on'); if (!scroll) pin.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    const old = $('#shot .box'); if (old) old.remove();
    if (b && b.x != null) { const d = document.createElement('div'); d.className = 'box'; d.style.cssText = 'left:' + b.x + '%;top:' + b.y + '%;width:' + b.w + '%;height:' + b.h + '%'; $('#shot').appendChild(d); }
    history.replaceState(null, '', '#' + cur.id + ':' + (i + 1));
  }

  // Khung bình luận giscus cho một ô; mỗi lúc chỉ mở một khung
  function thread(i) {
    const b = cur.blocks[i]; if (!b || openKey === b.key) return; openKey = b.key;
    document.querySelectorAll('.thread').forEach((t) => { t.innerHTML = ''; });
    const box = document.querySelector('#b' + i + ' .thread'), s = document.createElement('script');
    const attrs = { src: 'https://giscus.app/client.js', 'data-repo': GISCUS.repo, 'data-repo-id': GISCUS.repoId, 'data-category': GISCUS.category, 'data-category-id': GISCUS.categoryId, 'data-mapping': 'specific', 'data-term': term(b), 'data-strict': '1', 'data-reactions-enabled': '1', 'data-emit-metadata': '0', 'data-input-position': 'top', 'data-theme': 'light', 'data-lang': 'vi', 'data-loading': 'lazy', crossorigin: 'anonymous' };
    Object.keys(attrs).forEach((k) => s.setAttribute(k, attrs[k])); s.async = true; box.appendChild(s);
  }

  // Một lần cho cả repo: tiêu đề thảo luận "Wording <mã> · …" → số bình luận, đường dẫn, lần cập nhật
  const KEY = 'gopy-web-counts';
  async function loadCounts(force) {
    try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c) counts = c.counts || {}; if (!force && c && Date.now() - c.at < 180000) { repaint(); return; } } catch (e) { /* bỏ qua */ }
    try {
      const next = {};
      for (let page = 1; page < 20; page++) {
        const r = await fetch('https://api.github.com/repos/' + GISCUS.repo + '/discussions?per_page=100&page=' + page, { headers: { Accept: 'application/vnd.github+json' } });
        if (!r.ok) return; const L = await r.json();
        L.forEach((d) => { const m = /^Wording (\w+) · /.exec(d.title || ''); if (m && d.comments > 0) next[m[1]] = { c: d.comments, url: d.html_url, at: d.updated_at }; });
        if (L.length < 100) break;
      }
      counts = next;
      try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), counts })); } catch (e) { /* bỏ qua */ }
      repaint();
    } catch (e) { /* mạng lỗi: giữ số cũ */ }
  }
  function paintCounts() { document.querySelectorAll('.go[data-key]').forEach((e) => { const n = cnt(e.dataset.key); e.textContent = n ? 'Góp ý · ' + n : 'Góp ý'; e.classList.toggle('has', n > 0); }); }
  function repaint() { if (cur) { paintCounts(); tree($('#q').value); } else if (location.hash.slice(1) === LIST) showList(); else tree($('#q').value); }

  document.addEventListener('click', (e) => {
    const pin = e.target.closest('.pin'), go = e.target.closest('.go'), blk = e.target.closest('.blk[data-i]'), tg = e.target.closest('[data-pins]');
    if (tg) { const s = $('#shot'); s.classList.toggle('nopins'); tg.textContent = s.classList.contains('nopins') ? 'Hiện số' : 'Ẩn số'; return; }
    if (pin) { focus(+pin.dataset.i, true); thread(+pin.dataset.i); return; }
    if (go) { focus(+go.dataset.i, false); thread(+go.dataset.i); return; }
    if (blk && !e.target.closest('.thread')) focus(+blk.dataset.i, false);
  });
  $('#q').addEventListener('input', (e) => tree(e.target.value));
  const route = () => {
    const [id, n] = decodeURIComponent(location.hash.slice(1)).split(':');
    if (id === LIST) { showList(); return; }
    if (!cur || cur.id !== id) show(id, n ? +n - 1 : null); else if (n) { focus(+n - 1, true); thread(+n - 1); }
  };
  window.addEventListener('hashchange', route);
  route(); loadCounts(); setInterval(() => loadCounts(true), 300000);
})();
