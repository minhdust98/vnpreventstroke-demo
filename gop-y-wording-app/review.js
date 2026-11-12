'use strict';
// Trang góp ý wording app bệnh nhân: ảnh từng màn, số trên ảnh khớp với ô chữ bên cạnh. Mỗi câu chữ là một chủ đề trên
// GitHub Discussions (qua giscus), dùng chung cho mọi màn có câu đó. Số bình luận đọc từ API công khai của GitHub.
const R = window.REVIEW;
const GISCUS = { repo: 'minhdust98/vnpreventstroke-demo', repoId: 'R_kgDOVeplMg', category: 'General', categoryId: 'DIC_kwDOVeplMs4DK9fk' };
const PREFIX = 'App BN';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const termOf = w => `${PREFIX} · ${w} · ${R.words[w][0].slice(0, 80)}`;
let counts = {}, meta = {};  // meta: câu chữ -> { url, at } của chủ đề trên GitHub
const OVERVIEW = { key: 'gop-y', name: 'Đã có góp ý', topic: '' };
let current = null, openWord = null;

// ---- Danh sách màn ----
const allScreens = [];
R.topics.forEach(t => t.screens.forEach(s => { s.topic = t.name; allScreens.push(s); }));
allScreens.forEach(s => { s.words = new Set(); s.shots.forEach(sh => { sh.blocks.forEach(b => s.words.add(b[1])); sh.extra.forEach(e => s.words.add(e[0])); }); });
const screenCount = s => { let n = 0; s.words.forEach(w => { n += counts[w] || 0; }); return n; };
const query = () => $('#search').value.trim().toLowerCase();
const hasQ = (w, q) => R.words[w][0].toLowerCase().includes(q);

function renderSide() {
  const q = query();
  const match = s => !q || s.name.toLowerCase().includes(q) || [...s.words].some(w => hasQ(w, q));
  const fb = Object.keys(counts).filter(w => counts[w] && R.words[w]), total = fb.reduce((n, w) => n + counts[w], 0);
  const top = `<a href="#gop-y" class="all-fb${current === OVERVIEW ? ' on' : ''}">Đã có góp ý${fb.length ? `<span class="sub">${fb.length} câu</span><span class="badge">${total}</span>` : '<span class="sub">chưa có</span>'}</a>`;
  $('#side').innerHTML = top + R.topics.map(t => {
    const list = t.screens.filter(match);
    if (!list.length) return '';
    const open = q || (current && current.topic === t.name) ? ' open' : '';
    return `<details${open}><summary>${esc(t.name)}<span class="n">${list.length}</span></summary>${list.map(s => {
      const c = screenCount(s);
      return `<a href="#${s.key}" class="${current === s ? 'on' : ''}">${esc(s.name)}${s.shots.length > 1 ? `<span class="sub">${s.shots.length} ảnh</span>` : ''}${c ? `<span class="badge">${c}</span>` : ''}</a>`;
    }).join('')}</details>`;
  }).join('') || '<p class="muted pad">Không thấy chữ này.</p>';
}

// ---- Một màn: các ảnh, mỗi ảnh kèm danh sách ô chữ ----
function renderMain() {
  const s = current;
  if (s === OVERVIEW) { renderOverview(); return; }
  if (!s) { $('#main').innerHTML = ''; return; }
  const i = allScreens.indexOf(s), prev = allScreens[i - 1], next = allScreens[i + 1];
  const q = query();
  let h = `<div class="crumb">${esc(s.topic)}</div><h1>${esc(s.name)}</h1>`;
  h += s.shots.map(sh => {
    const marks = sh.blocks.map(b => `<button class="mark${counts[b[1]] ? ' has' : ''}" data-w="${b[1]}" style="left:${b[3]}px;top:${b[4]}px;width:${Math.max(b[5], 8)}px;height:${Math.max(b[6], 8)}px" title="${esc(R.words[b[1]][0])}" aria-label="Ô ${b[0]}"><i>${b[0]}</i></button>`).join('');
    const rows = sh.blocks.map(b => row(b[0], b[1], b[2])).join('');
    const extra = sh.extra.length ? `<h3>Chữ không thấy trên ảnh</h3>${sh.extra.map(e => row('•', e[0], e[1])).join('')}` : '';
    const hit = q && [...sh.blocks.map(b => b[1]), ...sh.extra.map(e => e[0])].some(w => hasQ(w, q));
    return `<section class="shot${hit ? ' hit' : ''}" id="${sh.id}"><h2>${esc(sh.title)}</h2><div class="pair"><div class="phone" style="width:${sh.w}px;height:${sh.h}px"><img src="shots/${sh.id}.webp" width="${sh.w}" height="${sh.h}" alt="${esc(s.name + ', ' + sh.title)}" loading="lazy">${marks}</div><div class="cells">${rows}${extra}</div></div></section>`;
  }).join('');
  h += `<div class="pager">${prev ? `<a href="#${prev.key}">← ${esc(prev.name)}</a>` : '<span></span>'}${next ? `<a href="#${next.key}">${esc(next.name)} →</a>` : ''}</div>`;
  $('#main').innerHTML = h;
  $('#main').scrollTop = 0;
  if (q) { const el = $('#main .cell.hit'); if (el) el.scrollIntoView({ block: 'center' }); }
}
// ---- Trang tổng: mọi câu đã có góp ý, mới nhất lên đầu, kèm các màn có câu đó ----
function renderOverview() {
  const list = Object.keys(counts).filter(w => counts[w] && R.words[w]).sort((a, b) => String((meta[b] || {}).at).localeCompare(String((meta[a] || {}).at)) || counts[b] - counts[a]);
  let h = `<h1>Đã có góp ý</h1><p class="muted">${list.length ? `${list.length} câu chữ, ${list.reduce((n, w) => n + counts[w], 0)} bình luận. Câu có góp ý mới nhất ở trên cùng.` : 'Chưa có góp ý nào. Chọn một màn ở cột trái để bắt đầu.'}</p>`;
  h += list.map(w => {
    const scr = allScreens.filter(s => s.words.has(w)), m = meta[w] || {};
    const d = m.at ? new Date(m.at) : null, p2 = n => String(n).padStart(2, '0'), when = d ? `${p2(d.getDate())}/${p2(d.getMonth() + 1)}, ${p2(d.getHours())}:${p2(d.getMinutes())}` : '';
    return `<section class="fb"><button class="cell${openWord === w ? ' on' : ''}" data-w="${w}"><span class="txt"><span class="kind">${when ? `Cập nhật ${when}` : ''}</span>${esc(R.words[w][0])}</span><span class="cc has">${counts[w]} góp ý</span></button><div class="fb-where">${scr.map(s => `<a href="#${s.key}~${w}">${esc(s.name)}</a>`).join('')}${m.url ? `<a class="gh" href="${m.url}" target="_blank" rel="noopener">Mở trên GitHub</a>` : ''}</div></section>`;
  }).join('');
  $('#main').innerHTML = h;
}
function row(n, w, kind) {
  const [t, data, used] = R.words[w];
  const q = query(), c = counts[w] || 0;
  return `<button class="cell${data ? ' data' : ''}${openWord === w ? ' on' : ''}${q && hasQ(w, q) ? ' hit' : ''}" data-w="${w}"><span class="num">${n}</span><span class="txt"><span class="kind">${esc(kind)}${data ? ' · dữ liệu minh họa' : ''}${used > 1 ? ` · có ở ${used} màn` : ''}</span>${esc(t)}</span><span class="cc${c ? ' has' : ''}">${c ? `${c} góp ý` : 'Góp ý'}</span></button>`;
}

// ---- Khung góp ý: một giscus cho câu chữ đang chọn ----
function openCell(w) {
  openWord = w;
  document.querySelectorAll('.cell.on,.mark.on').forEach(x => x.classList.remove('on'));
  document.querySelectorAll(`[data-w="${w}"]`).forEach(x => x.classList.add('on'));
  const [t, , used] = R.words[w];
  const kinds = new Set(), where = [];
  allScreens.forEach(s => { if (s.words.has(w)) where.push(s.name); s.shots.forEach(sh => { sh.blocks.forEach(b => { if (b[1] === w) kinds.add(b[2]); }); sh.extra.forEach(e => { if (e[0] === w) kinds.add(e[1]); }); }); });
  $('#dKind').textContent = [...kinds].join(', ');
  $('#dText').textContent = t;
  $('#dWhere').textContent = used > 1 ? `Có ở ${used} màn: ${where.slice(0, 6).join(', ')}${where.length > 6 ? '…' : ''}` : `Màn: ${where[0] || ''}`;
  $('#drawer').hidden = false;
  const box = $('#giscus');
  box.innerHTML = '';
  const sc = document.createElement('script');
  sc.src = 'https://giscus.app/client.js';
  Object.entries({ 'data-repo': GISCUS.repo, 'data-repo-id': GISCUS.repoId, 'data-category': GISCUS.category, 'data-category-id': GISCUS.categoryId, 'data-mapping': 'specific', 'data-term': termOf(w), 'data-strict': '1', 'data-reactions-enabled': '1', 'data-emit-metadata': '1', 'data-input-position': 'top', 'data-theme': 'preferred_color_scheme', 'data-lang': 'vi', 'data-loading': 'eager', crossorigin: 'anonymous' }).forEach(([k, v]) => sc.setAttribute(k, v));
  sc.async = true;
  box.appendChild(sc);
}
function closeDrawer() { $('#drawer').hidden = true; openWord = null; document.querySelectorAll('.cell.on,.mark.on').forEach(x => x.classList.remove('on')); }
// giscus báo số bình luận của chủ đề đang mở
window.addEventListener('message', e => {
  if (e.origin !== 'https://giscus.app' || !e.data || !e.data.giscus || !openWord) return;
  const d = e.data.giscus.discussion;
  if (d) { counts[openWord] = (d.totalCommentCount || 0) + (d.totalReplyCount || 0); paintCounts(); }
});

// ---- Số bình luận của mọi câu chữ: đọc danh sách chủ đề công khai ----
async function loadCounts(force) {
  const KEY = 'gopy-app-counts';
  try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c) { counts = c.counts || {}; meta = c.meta || {}; } if (!force && c && Date.now() - c.at < 180000) { paintCounts(); return; } } catch (e) { /* bỏ qua */ }
  const got = {}, gotMeta = {};
  try {
    for (let page = 1; page < 30; page++) {
      const r = await fetch(`https://api.github.com/repos/${GISCUS.repo}/discussions?per_page=100&page=${page}`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) break;
      const list = await r.json();
      list.forEach(d => { const m = String(d.title).match(/^App BN · (W-[a-z0-9]+)/); if (m) { got[m[1]] = (got[m[1]] || 0) + d.comments; gotMeta[m[1]] = { url: d.html_url, at: d.updated_at }; } });
      if (list.length < 100) break;
    }
    counts = Object.assign(counts, got); meta = Object.assign(meta, gotMeta);
    try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), counts, meta })); } catch (e) { /* bỏ qua */ }
  } catch (e) { /* mạng lỗi: vẫn góp ý được, chỉ không hiện số */ }
  paintCounts();
}
function paintCounts() {
  document.querySelectorAll('.cell').forEach(el => { const c = counts[el.dataset.w] || 0, cc = el.querySelector('.cc'); cc.textContent = c ? `${c} góp ý` : 'Góp ý'; cc.classList.toggle('has', !!c); });
  document.querySelectorAll('.mark').forEach(el => el.classList.toggle('has', !!counts[el.dataset.w]));
  if (current === OVERVIEW) renderOverview();
  renderSide();
}

// ---- Điều hướng ----
function route() {
  const [key, w] = decodeURIComponent(location.hash.slice(1)).split('~');
  const s = key === 'gop-y' ? OVERVIEW : allScreens.find(x => x.key === key) || allScreens[0];
  if (s !== current) { current = s; renderMain(); }
  // Từ trang tổng: mở đúng ô của câu đó trên màn
  if (w && R.words[w]) { const cell = $(`#main .cell[data-w="${w}"]`); if (cell) cell.scrollIntoView({ block: 'center' }); openCell(w); }
  renderSide();
  document.body.classList.remove('side-open');
  const a = $('#side a.on'); if (a) a.scrollIntoView({ block: 'nearest' });
}
window.addEventListener('hashchange', route);
document.addEventListener('click', e => {
  const c = e.target.closest('.cell,.mark');
  if (!c) return;
  openCell(c.dataset.w);
  if (c.classList.contains('mark')) { const cell = c.closest('.pair').querySelector(`.cell[data-w="${c.dataset.w}"]`); if (cell) cell.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
});
document.addEventListener('mouseover', e => {
  document.querySelectorAll('.mark.hover').forEach(x => x.classList.remove('hover'));
  const c = e.target.closest('.cell'), sec = c && c.closest('.pair');
  if (sec) sec.querySelectorAll(`.mark[data-w="${c.dataset.w}"]`).forEach(x => x.classList.add('hover'));
});
let tSearch;
$('#search').addEventListener('input', () => {
  clearTimeout(tSearch);
  tSearch = setTimeout(() => {
    const q = query();
    if (q && current && ![...current.words].some(w => hasQ(w, q))) { const s = allScreens.find(x => [...x.words].some(w => hasQ(w, q))); if (s) { current = s; history.replaceState(null, '', '#' + s.key); } }
    renderSide(); renderMain();
  }, 200);
});
$('#dClose').onclick = closeDrawer;
$('#menuBtn').onclick = () => document.body.classList.toggle('side-open');
$('#help').onclick = () => { $('#howto').hidden = false; };
$('#howtoClose').onclick = () => { $('#howto').hidden = true; try { localStorage.setItem('gopy-app-howto', '1'); } catch (e) { /* bỏ qua */ } };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#howto').hidden) $('#howto').hidden = true; else closeDrawer(); } });
try { if (!localStorage.getItem('gopy-app-howto')) $('#howto').hidden = false; } catch (e) { $('#howto').hidden = false; }
route();
loadCounts();
setInterval(() => loadCounts(true), 300000);
