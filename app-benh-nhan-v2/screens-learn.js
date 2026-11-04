'use strict';
// Tab Học: BE FAST, bài tập phục hồi theo khả năng vận động, ăn uống, dùng thuốc an toàn, huyết áp, trung tâm đột quỵ, hỏi đáp.

const topicOf = id => TOPICS.find(t => t.id === id);
const chromeLearn = () => (P() ? 'push' : 'bare');
const backLearn = () => topBar({ back: 'Học' });

V.learn = () => {
  const guest = !P();
  let h = guest ? `<header class="top"><button class="nav" ${on('guestBack')}>${icon('back')}Quay lại</button>${sosBtn()}</header>` : topBar();
  h += h1('Học');
  h += `<button class="befast" ${on('go', { v: 'befast' })}><span class="row-letters">${BEFAST.map(s => `<span>${s.k}</span>`).join('')}</span><strong>Dấu hiệu đột quỵ</strong></button>`;
  if (!guest) h += group(forYou(P()).map(x => (x.exercise ? row({ icon: 'walk', tone: 'green', title: 'Bài tập phục hồi', a: 'go', p: { v: 'exercises' } }) : (() => { const t = topicOf(x.topic), it = t.items.find(i => i.id === x.id); return row({ icon: t.icon, tone: t.tone, title: it.title, a: 'go', p: { v: 'article', topic: t.id, id: it.id } }); })())), { title: 'Dành cho bạn' });
  h += group([row({ icon: 'walk', tone: 'green', title: 'Bài tập phục hồi', a: 'go', p: { v: 'exercises' } })].concat(TOPICS.map(t => row({ icon: t.icon, tone: t.tone, title: t.title, a: 'go', p: { v: 'topic', topic: t.id } }))), { title: 'Chủ đề' });
  h += group([row({ icon: 'pin', tone: 'blue', title: 'Trung tâm đột quỵ', a: 'go', p: { v: 'centers' } }), row({ icon: 'msg', tone: 'blue', title: 'Hỏi đáp', a: 'go', p: { v: 'faq' } }), row({ icon: 'doc', tone: 'muted', title: 'Nguồn tham khảo', a: 'go', p: { v: 'refs' } })]);
  if (guest) h += btn('Tạo hồ sơ', 'guestBack');
  return { chrome: guest ? 'bare' : 'tab', html: h };
};
A.guestBack = () => { S.stack = [{ v: 'welcome', p: {} }]; S.focus = true; };

// BE FAST: thêm B (thăng bằng) và E (mắt) vào FAST
V.befast = () => {
  const mode = S.draft.fast || 'befast', signs = BEFAST.filter(s => mode === 'befast' || s.fast);
  let h = backLearn() + h1(mode === 'befast' ? 'BE FAST' : 'FAST') + seg([['befast', 'BE FAST'], ['fast', 'FAST']], mode, 'fastMode');
  h += `<div class="list">${signs.map(s => `<div class="sign"><span class="letter">${s.k}</span><div><b>${s.name}</b><p>${s.text}</p></div></div>`).join('')}</div>`;
  h += btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red');
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
  const e = EXERCISES.find(x => x.id === id), lvIcon = { bed: 'bed', sit: 'chair', stand: 'walk' }[e.level];
  let h = topBar({ back: 'Bài tập' }) + `<div class="card-head">${tile(lvIcon, 'green')}${e.helper ? `<span class="badge">${icon('user')}Cần người hỗ trợ</span>` : ''}</div>` + h1(e.name, 'sm');
  h += `<ol class="steps">${e.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
  h += group(row({ title: 'Lặp lại', value: esc(e.reps) }));
  h += `<div class="warn">${icon('alert')}<span>${EXERCISE_STOP}</span></div>`;
  h += btn(`${icon('sound')}Đọc to`, 'speak', { text: `${e.name}. ${e.steps.join(' ')} ${e.reps}.` }, 'soft');
  return { chrome: chromeLearn(), html: h };
};

const PLATE = `<svg class="plate" viewBox="0 0 200 200" role="img" aria-label="Đĩa ăn: một nửa rau, một phần tư cơm, một phần tư đạm">
  <path d="M100 10A90 90 0 0 0 100 190Z" fill="var(--green-bg)" stroke="var(--green)" stroke-width="3"/>
  <path d="M100 100L100 10A90 90 0 0 1 190 100Z" fill="var(--amber-bg)" stroke="var(--amber)" stroke-width="3"/>
  <path d="M100 100L190 100A90 90 0 0 1 100 190Z" fill="var(--orange-bg)" stroke="var(--orange)" stroke-width="3"/>
  <g font-size="17" font-weight="800" fill="var(--ink)" text-anchor="middle"><text x="55" y="106">Rau</text><text x="140" y="68">Cơm</text><text x="140" y="148">Đạm</text></g></svg>`;
V.topic = ({ topic }) => {
  const t = topicOf(topic);
  let h = backLearn() + h1(t.title, 'sm') + (topic === 'diet' ? PLATE : '');
  h += group(t.items.map(it => row({ title: it.title, a: 'go', p: { v: 'article', topic, id: it.id } })));
  return { chrome: chromeLearn(), html: h };
};
V.article = ({ topic, id }) => {
  const t = topicOf(topic), it = t.items.find(i => i.id === id), p = P();
  let h = topBar({ back: t.title }) + h1(it.title, 'sm') + `<ul class="bullets">${it.body.map(b => `<li>${b}</li>`).join('')}</ul>`;
  if (it.calls && p) h += btn(`${icon('phone')}Gọi bác sĩ`, 'call', { num: p.careTeam.phone, who: 'bác sĩ' }) + btn('Gọi dược sĩ', 'call', { num: p.careTeam.pharmacy, who: 'dược sĩ' }, 'soft');
  return { chrome: chromeLearn(), html: h };
};

function mapSvg(active) {
  const pts = CENTERS.map(c => `<circle cx="${c.x}" cy="${c.y}" r="${c.id === active ? 4 : 3}" fill="${c.id === active ? 'var(--red)' : 'var(--blue)'}" stroke="var(--card)" stroke-width="1"/>`).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 30H100M0 70H100M35 0V100M72 0V100" stroke="var(--card)" stroke-width="2.5" fill="none" vector-effect="non-scaling-stroke"/>${pts}<circle cx="48" cy="52" r="2.2" fill="var(--teal)"/></svg>`;
}
V.centers = () => ({ chrome: chromeLearn(), html: `${backLearn()}${h1('Trung tâm đột quỵ', 'sm')}<div class="map" role="img" aria-label="Bản đồ các trung tâm đột quỵ">${mapSvg()}</div>${group(CENTERS.map(c => row({ icon: 'pin', tone: 'blue', title: esc(c.name), value: `${dec(c.km)} km`, a: 'go', p: { v: 'center', id: c.id } })))}${btn(`${icon('phone')}Có dấu hiệu đột quỵ: gọi 115`, 'call', { num: '115' }, 'red')}` });
V.center = ({ id }) => {
  const c = CENTERS.find(x => x.id === id);
  return { chrome: chromeLearn(), html: `${topBar({ back: 'Trung tâm' })}${h1(c.name, 'sm')}<div class="map" role="img" aria-label="Vị trí ${esc(c.name)}">${mapSvg(c.id)}</div>${group([row({ title: 'Địa chỉ', value: esc(c.addr) }), row({ title: 'Khoảng cách', value: `${dec(c.km)} km` }), row({ title: 'Giờ mở', value: esc(c.open) })])}${btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red')}${btn(`${icon('phone')}Gọi bệnh viện`, 'call', { num: c.tel, who: c.name }, 'soft')}${btn(`${icon('pin')}Chỉ đường`, 'demo', { msg: 'Trên điện thoại thật, nút này mở bản đồ chỉ đường' }, 'soft')}` };
};
V.faq = () => ({ chrome: chromeLearn(), html: `${backLearn()}${h1('Hỏi đáp', 'sm')}${FAQ.map(([q, a]) => `<section class="card"><p class="lead">${q}</p><p class="body">${a}</p></section>`).join('')}` });
V.refs = () => ({ chrome: chromeLearn(), html: `${backLearn()}${h1('Nguồn tham khảo', 'sm')}<ul class="bullets">${REFS.map(r => `<li>${r}</li>`).join('')}</ul>` });
