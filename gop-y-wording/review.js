/* Trang góp ý wording: menu theo chủ đề, ảnh từng màn có số đánh dấu, mỗi ô chữ một luồng bình luận GitHub (giscus).
 * Câu giống nhau ở nhiều màn dùng chung một luồng (khóa = câu đã thay số bằng #). Dữ liệu màn hình: screens.js (sinh bởi capture.js). */
(function () {
  'use strict';
  const GISCUS = { repo: 'minhdust98/vnpreventstroke-demo', repoId: 'R_kgDOVeplMg', category: 'General', categoryId: 'DIC_kwDOVeplMs4DK9fk' };
  const SCREENS = window.SCREENS || [], $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const term = (b) => 'Wording ' + hash(b.key) + ' · ' + b.text.slice(0, 90);
  // Câu này còn ở những màn nào
  const where = {}; SCREENS.forEach((s) => s.blocks.forEach((b) => { (where[b.key] = where[b.key] || []).push(s.id); }));
  const counts = {};
  let cur = null, openKey = null;

  function tree(q) {
    const nq = q.trim().toLowerCase(), groups = {};
    SCREENS.forEach((s) => {
      const hit = nq ? s.blocks.filter((b) => b.text.toLowerCase().includes(nq)).length : s.blocks.length;
      if (nq && !hit) return;
      ((groups[s.g] = groups[s.g] || {})[s.s] = groups[s.g][s.s] || []).push([s, hit]);
    });
    $('#tree').innerHTML = Object.keys(groups).map((g) => '<h2>' + esc(g) + '</h2>' + Object.keys(groups[g]).map((sub) => '<h3>' + esc(sub) + '</h3>' + groups[g][sub].map(([s, n]) => '<a href="#' + s.id + '" class="' + (cur && cur.id === s.id ? 'on' : '') + '"><span>' + esc(s.t) + '</span><small>' + n + '</small></a>').join('')).join('')).join('') || '<div class="empty">Không thấy chữ này.</div>';
  }

  function show(id, n) {
    cur = SCREENS.find((s) => s.id === id) || SCREENS[0]; openKey = null;
    const others = (b) => (where[b.key] || []).filter((x) => x !== cur.id).length;
    $('#main').innerHTML = '<div class="head"><h1>' + esc(cur.t) + '</h1><span class="crumb">' + esc(cur.g + ' › ' + cur.s) + '</span></div>' +
      '<p class="hint">Bấm số trên ảnh hoặc bấm Góp ý ở ô bên phải. Cần đăng nhập GitHub để viết; ai cũng đọc được.</p>' +
      '<div class="grid">' + (cur.w ? '<div class="left"><div class="shot" id="shot"><img src="shots/' + cur.id + '.jpg" alt="' + esc(cur.t) + '" width="' + cur.w + '" height="' + cur.h + '">' +
        cur.blocks.map((b, i) => (b.x == null ? '' : '<button class="pin" data-i="' + i + '" style="left:' + b.x + '%;top:' + b.y + '%" aria-label="Ô ' + (i + 1) + '">' + (i + 1) + '</button>')).join('') + '</div><div class="tools"><a href="shots/' + cur.id + '.jpg" target="_blank" rel="noopener">Mở ảnh cỡ thật</a><button class="lnk" data-pins>Ẩn số</button></div></div>' : '') +
      '<div class="blocks">' + (cur.blocks.length ? cur.blocks.map((b, i) => '<section class="blk" id="b' + i + '" data-i="' + i + '"><div class="blk-h"><span class="num">' + (i + 1) + '</span><span class="kind">' + esc(b.kind) + (b.n > 1 ? ' · ' + b.n + ' chỗ trên màn' : '') + '</span><span class="cnt" data-key="' + esc(b.key) + '"></span></div>' +
        '<p class="txt">' + esc(b.text) + '</p>' + (others(b) ? '<div class="also">Cũng có ở ' + others(b) + ' màn khác, dùng chung góp ý</div>' : '') +
        '<button class="go" data-i="' + i + '">Góp ý</button><div class="thread"></div></section>').join('') : '<div class="empty">Màn này không có chữ.</div>') + '</div></div>';
    tree($('#q').value); window.scrollTo(0, 0);
    if (n != null) focus(n, true);
    loadCounts();
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
    const b = cur.blocks[i]; if (openKey === b.key) return; openKey = b.key;
    document.querySelectorAll('.thread').forEach((t) => { t.innerHTML = ''; });
    const box = document.querySelector('#b' + i + ' .thread'), s = document.createElement('script');
    const attrs = { src: 'https://giscus.app/client.js', 'data-repo': GISCUS.repo, 'data-repo-id': GISCUS.repoId, 'data-category': GISCUS.category, 'data-category-id': GISCUS.categoryId, 'data-mapping': 'specific', 'data-term': term(b), 'data-strict': '1', 'data-reactions-enabled': '1', 'data-emit-metadata': '0', 'data-input-position': 'top', 'data-theme': 'light', 'data-lang': 'vi', 'data-loading': 'lazy', crossorigin: 'anonymous' };
    Object.keys(attrs).forEach((k) => s.setAttribute(k, attrs[k])); s.async = true; box.appendChild(s);
  }

  // Số góp ý của từng ô trên màn đang xem (đọc công khai qua giscus; lỗi thì bỏ qua, không hiện số)
  async function loadCounts() {
    const scr = cur, todo = scr.blocks.filter((b) => counts[b.key] === undefined);
    const one = async (b) => {
      try {
        const u = 'https://giscus.app/api/discussions?repo=' + encodeURIComponent(GISCUS.repo) + '&term=' + encodeURIComponent(term(b)) + '&category=' + encodeURIComponent(GISCUS.category) + '&number=0&strict=true&last=1';
        const r = await fetch(u); if (r.status === 404) { counts[b.key] = 0; return; }
        if (!r.ok) return; const j = await r.json(); counts[b.key] = (j.discussion && (j.discussion.totalCommentCount + j.discussion.totalReplyCount)) || 0;
      } catch (e) { /* mạng lỗi: không hiện số */ }
    };
    for (let k = 0; k < todo.length; k += 4) { await Promise.all(todo.slice(k, k + 4).map(one)); if (cur !== scr) return; paintCounts(); }
    paintCounts();
  }
  function paintCounts() { document.querySelectorAll('.cnt').forEach((e) => { const n = counts[e.dataset.key]; e.textContent = n ? n + ' góp ý' : ''; }); }

  document.addEventListener('click', (e) => {
    const pin = e.target.closest('.pin'), go = e.target.closest('.go'), blk = e.target.closest('.blk'), tg = e.target.closest('[data-pins]');
    if (tg) { const s = $('#shot'); s.classList.toggle('nopins'); tg.textContent = s.classList.contains('nopins') ? 'Hiện số' : 'Ẩn số'; return; }
    if (pin) { focus(+pin.dataset.i, true); thread(+pin.dataset.i); return; }
    if (go) { focus(+go.dataset.i, false); thread(+go.dataset.i); return; }
    if (blk && !e.target.closest('.thread')) focus(+blk.dataset.i, false);
  });
  $('#q').addEventListener('input', (e) => tree(e.target.value));
  const route = () => { const [id, n] = decodeURIComponent(location.hash.slice(1)).split(':'); if (!cur || cur.id !== id) show(id, n ? +n - 1 : null); };
  window.addEventListener('hashchange', route);
  route();
})();
