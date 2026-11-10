'use strict';
// Tab Học: BE FAST, bài tập phục hồi theo khả năng vận động, ăn uống, dùng thuốc an toàn, huyết áp, trung tâm đột quỵ, hỏi đáp.

const topicOf = id => TOPICS.find(t => t.id === id);
const chromeLearn = () => (P() ? 'push' : 'bare');
const backLearn = () => topBar({ back: 'Quay lại' });

V.learn = () => {
  const guest = !P();
  let h = guest ? `<header class="top"><button class="nav" ${on('guestBack')}>${icon('back')}Quay lại</button>${sosBtn()}</header>` : topBar({ back: 'Trang chủ' });
  h += h1('Giáo dục sức khỏe');
  h += `<button class="befast" ${on('go', { v: 'befast' })}><span class="row-letters">${BEFAST.map(s => `<span>${s.k}</span>`).join('')}</span><strong>Dấu hiệu đột quỵ</strong></button>`;
  // Một danh sách: bài riêng cho người này đứng đầu (thuốc chống đông, khó nuốt...), rồi các chủ đề, chủ đề hợp nhất lên trước
  const fy = guest ? [] : forYou(P()), keys = fy.map(x => (x.exercise ? 'ex' : x.topic)), rank = id => (keys.includes(id) ? keys.indexOf(id) : keys.length);
  const mine = fy.filter(x => !x.exercise).map(x => { const t = topicOf(x.topic), it = t.items.find(i => i.id === x.id); return row({ icon: t.icon, title: it.title, a: 'go', p: { v: 'article', topic: t.id, id: it.id } }); });
  const topics = (FEATURES.exercises ? [{ id: 'ex', icon: 'walk', title: 'Bài tập phục hồi', p: { v: 'exercises' } }] : []).concat(TOPICS.map(t => ({ id: t.id, icon: t.icon, title: t.title, p: { v: 'topic', topic: t.id } })));
  h += group(mine.concat(topics.map((t, i) => ({ t, k: rank(t.id) * 100 + i })).sort((a, b) => a.k - b.k).map(({ t }) => row({ icon: t.icon, title: t.title, a: 'go', p: t.p }))));
  // Người chỉ xem thông tin chưa có Liên hệ nên vẫn tìm thấy hai mục này ở đây
  if (guest) h += group([row({ icon: 'pin', title: 'Trung tâm đột quỵ', a: 'go', p: { v: 'centers' } }), row({ icon: 'info', title: 'Câu hỏi thường gặp', a: 'go', p: { v: 'faq' } })]);
  if (guest) h += btn('Tạo hồ sơ', 'guestBack');
  return { chrome: guest ? 'bare' : 'push', html: h };
};
A.guestBack = () => { S.stack = [{ v: 'welcome', p: {} }]; S.focus = true; };

// BE FAST: thêm B (thăng bằng) và E (mắt) vào FAST
V.befast = () => {
  const mode = S.draft.fast || 'befast', signs = BEFAST.filter(s => mode === 'befast' || s.fast);
  let h = backLearn() + h1('Dấu hiệu đột quỵ', 'sm') + seg([['befast', 'BE FAST'], ['fast', 'FAST']], mode, 'fastMode');
  h += `<div class="list">${signs.map(s => `<div class="sign"><span class="letter">${s.k}</span><div><b>${s.name}</b><p>${s.text}</p></div></div>`).join('')}</div>`;
  h += btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red') + speakBtn(signs.map(s => `${s.name}. ${s.text}`).join(' '));
  return { chrome: chromeLearn(), html: h };
};
A.fastMode = ({ v }) => { S.draft.fast = v; };

// Bài tập theo khả năng vận động. Mức đã chọn được nhớ trong hồ sơ.
const exLevel = () => (P() && P().mobility) || S.draft.exLevel || 'bed';
V.exercises = () => {
  const lv = exLevel();
  let h = backLearn() + h1('Bài tập phục hồi', 'sm') + seg(MOBILITY, lv, 'exLevel');
  h += group(EXERCISES.filter(e => e.level === lv).map(e => row({ title: e.name, value: e.reps.split(',')[0], a: 'go', p: { v: 'exercise', id: e.id } })));
  return { chrome: chromeLearn(), html: h };
};
A.exLevel = ({ v }) => { if (P()) P().mobility = v; else S.draft.exLevel = v; };
V.exercise = ({ id }) => {
  const e = EXERCISES.find(x => x.id === id);
  let h = topBar({ back: 'Bài tập' }) + h1(e.name, 'sm') + (e.helper ? `<span class="badge">${icon('user')}Cần người hỗ trợ</span>` : '');
  h += `<ol class="steps">${e.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
  h += group(row({ title: 'Lặp lại', value: esc(e.reps) }));
  h += `<div class="warn">${icon('alert')}<span>${EXERCISE_STOP}</span></div>`;
  h += speakBtn(`${e.name}. ${e.steps.join(' ')} ${e.reps}.`);
  return { chrome: chromeLearn(), html: h };
};

const PLATE = `<svg class="plate" viewBox="0 0 200 200" role="img" aria-label="Đĩa ăn: một nửa rau, một phần tư cơm, một phần tư đạm">
  <path d="M100 10A90 90 0 0 0 100 190Z" fill="var(--green-bg)" stroke="var(--green)" stroke-width="3"/>
  <path d="M100 100L100 10A90 90 0 0 1 190 100Z" fill="var(--amber-bg)" stroke="var(--amber)" stroke-width="3"/>
  <path d="M100 100L190 100A90 90 0 0 1 100 190Z" fill="var(--fill)" stroke="var(--ink2)" stroke-width="3"/>
  <g font-size="17" font-weight="800" fill="var(--ink)" text-anchor="middle"><text x="55" y="106">Rau</text><text x="140" y="68">Cơm</text><text x="140" y="148">Đạm</text></g></svg>`;
// Chủ đề ăn uống: hình đĩa ăn chính là lối vào bài "Đĩa ăn mỗi bữa", không lặp thành một dòng chữ
V.topic = ({ topic }) => {
  const t = topicOf(topic), plate = topic === 'diet';
  let h = backLearn() + h1(t.title, 'sm') + (plate ? `<button class="plate-btn" ${on('go', { v: 'article', topic, id: 'plate' })} aria-label="Đĩa ăn mỗi bữa">${PLATE}</button>` : '');
  h += group(t.items.filter(it => !(plate && it.id === 'plate') && !(it.id === 'missed' && !FEATURES.missedHelp)).map(it => row({ title: it.title, a: 'go', p: { v: 'article', topic, id: it.id } })));
  return { chrome: chromeLearn(), html: h };
};
V.article = ({ topic, id }) => {
  const t = topicOf(topic), it = t.items.find(i => i.id === id), p = P();
  let h = topBar({ back: t.title }) + h1(it.title, 'sm') + `<ul class="bullets">${it.body.map(b => `<li>${b}</li>`).join('')}</ul>`;
  if (it.calls && p) h += btn(`${icon('phone')}Gọi bác sĩ`, 'call', { num: p.careTeam.phone, who: 'bác sĩ' }) + btn('Gọi dược sĩ', 'call', { num: p.careTeam.pharmacy, who: 'dược sĩ' }, 'soft');
  h += speakBtn(`${it.title}. ${it.body.join(' ')}`);
  return { chrome: chromeLearn(), html: h };
};
const speakBtn = text => btn(`${icon('sound')}Đọc to`, 'speak', { text }, 'soft');

function mapSvg(active) {
  const pts = CENTERS.map(c => `<circle cx="${c.x}" cy="${c.y}" r="${c.id === active ? 4 : 3}" fill="${c.id === active ? 'var(--red)' : 'var(--ink2)'}" stroke="var(--card)" stroke-width="1"/>`).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30H100M0 70H100M35 0V100M72 0V100" stroke="var(--card)" stroke-width="2.5" fill="none" vector-effect="non-scaling-stroke"/>${pts}<circle cx="48" cy="52" r="2.2" fill="var(--tint)"/></svg><span class="tag">Minh họa</span>`;
}
V.centers = () => ({ chrome: chromeLearn(), html: `${backLearn()}${h1('Trung tâm đột quỵ', 'sm')}<div class="map" role="img" aria-label="Bản đồ minh họa các trung tâm đột quỵ">${mapSvg()}</div>${group(CENTERS.map(c => row({ icon: 'pin', title: esc(c.name), value: `${dec(c.km)} km`, a: 'go', p: { v: 'center', id: c.id } })))}${btn(`${icon('phone')}Có dấu hiệu đột quỵ: gọi 115`, 'call', { num: '115' }, 'red')}` });
V.center = ({ id }) => {
  const c = CENTERS.find(x => x.id === id);
  return { chrome: chromeLearn(), html: `${topBar({ back: 'Trung tâm' })}${h1(c.name, 'sm')}<div class="map" role="img" aria-label="Bản đồ minh họa vị trí ${esc(c.name)}">${mapSvg(c.id)}</div>${group([row({ title: 'Địa chỉ', value: esc(c.addr) }), row({ title: 'Khoảng cách', value: `${dec(c.km)} km` }), row({ title: 'Giờ mở', value: esc(c.open) })])}${btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red')}${btn(`${icon('phone')}Gọi bệnh viện`, 'call', { num: c.tel, who: c.name }, 'soft')}${btn(`${icon('pin')}Chỉ đường`, 'demo', { msg: 'Trên điện thoại thật, nút này mở bản đồ chỉ đường' }, 'soft')}` };
};
V.faq = () => ({ chrome: chromeLearn(), html: `${backLearn()}${h1('Câu hỏi thường gặp', 'sm')}${FAQ.map(([q, a]) => `<section class="card"><p class="lead">${q}</p><p class="body">${a}</p></section>`).join('')}` });
