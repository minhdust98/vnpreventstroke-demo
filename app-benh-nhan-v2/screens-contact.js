'use strict';
// Liên hệ: chat hai chiều với bác sĩ, trợ lý AI, lịch hẹn hai chiều, thêm bác sĩ. Chỉ mô phỏng, không có máy chủ.

const chatBubble = m => `<div class="bubble${m.mine ? ' mine' : ''}">${m.mine ? '' : `<b>${esc(m.from)}</b>`}<p>${esc(m.text)}</p><small>${ddmm(m.t)} ${hhmm(m.t)}</small></div>`;
const chatBar = (field, ph, action, value) => `<div class="cta chat-in"><input class="input" data-field="${field}" maxlength="500" value="${esc(value || '')}" aria-label="${ph}" autocomplete="off"><button class="btn" ${on(action)}>Gửi</button></div>`;
// Phím Enter trong ô chat bấm nút Gửi
document.addEventListener('keydown', e => {
  const f = e.target && e.target.dataset && e.target.dataset.field;
  if (e.key === 'Enter' && (f === 'chatText' || f === 'aiText')) { e.preventDefault(); const b = document.querySelector('#view .chat-in .btn'); if (b) b.click(); }
});

// ---- Liên hệ ----
V.contact = () => {
  const p = P(), ap = nextAppt(p), unread = p.messages.filter(m => !m.read).length;
  let h = topBar({ back: 'Trang chủ' }) + h1('Liên hệ');
  h += group([
    row({ icon: 'msg', title: 'Bác sĩ', value: unread ? `${unread} mới` : '', a: 'openChat' }),
    row({ icon: 'brain', title: 'Trợ lý AI', a: 'go', p: { v: 'assistant' } }),
    row({ icon: 'cal', title: 'Lịch hẹn', value: ap ? `${WD_S[new Date(ap.t).getDay()]} ${ddmm(ap.t)}` : '', a: 'go', p: { v: 'appts' } }),
  ]);
  const docs = (p.hospitalLinked ? [{ name: p.careTeam.doctor, hospital: p.careTeam.hospital, state: 'linked' }] : []).concat(p.doctors || []);
  h += group(docs.map(d => row({ icon: 'user', title: esc(d.name), value: d.state === 'pending' ? 'Chờ bác sĩ đồng ý' : esc(d.hospital || ''), tone2: d.state === 'pending' ? 'amber' : '', wrap: true })), docs.length ? { title: 'Bác sĩ của bạn' } : null);
  h += group(row({ icon: 'plus', title: 'Thêm bác sĩ', a: 'go', p: { v: 'addDoctor' } }));
  return { chrome: 'push', html: h };
};

// ---- Chat với bác sĩ: hai chiều ----
A.openChat = () => { go('messages'); S.scrollTo = 1e6; };
V.messages = () => {
  const p = P();
  p.messages.forEach(m => { m.read = true; });
  let h = topBar({ back: 'Quay lại' }) + h1('Bác sĩ', 'sm');
  h += p.messages.length ? `<div class="chat">${p.messages.slice().sort((a, b) => a.t - b.t).map(chatBubble).join('')}</div>` : '<section class="card empty"><p class="lead">Chưa có tin nhắn</p></section>';
  return { chrome: 'push', html: h + chatBar('chatText', 'Nhắn cho bác sĩ', 'chatSend', S.draft.chat) };
};
F.chatText = v => { S.draft.chat = v; };
A.chatSend = () => {
  const t = (S.draft.chat || '').trim();
  if (!t) return false;
  P().messages.push({ id: `m${Date.now()}`, from: 'Bạn', mine: true, t: now(), text: t, read: true, by: byWho() });
  S.draft.chat = ''; S.scrollTo = 1e6;
};

// ---- Trợ lý AI: trả lời các câu có sẵn trong tài liệu; câu quan trọng chuyển cho bác sĩ ----
const AI_RED = /méo|tê |tê$|yếu|liệt|nói khó|nói ngọng|mờ mắt|mất thị lực|chóng mặt|đau đầu dữ|đau ngực|khó thở|ngất|co giật/i;
const AI_DOSE = /liều|ngừng thuốc|bỏ thuốc|uống bù|gấp đôi|đổi thuốc|tăng thuốc|giảm thuốc|tác dụng phụ|chảy máu/i;
const AI_SKIP = new Set(['của', 'và', 'có', 'không', 'là', 'tôi', 'bạn', 'được', 'thì', 'khi', 'cho', 'một', 'các', 'những', 'này', 'với', 'nào', 'sao', 'gì', 'bị', 'đã', 'để', 'trong', 'ra', 'nên', 'cần', 'app', 'thế']);
const aiTokens = s => (String(s).toLowerCase().match(/\p{L}+/gu) || []).filter(w => w.length > 1 && !AI_SKIP.has(w));
function aiSources() {
  const out = FAQ.map(([q, a]) => ({ t: q, a }));
  TOPICS.forEach(t => t.items.forEach(it => { if (it.id !== 'missed') out.push({ t: it.title, a: it.body.join(' ') }); }));
  return out;
}
function aiAnswer(q) {
  if (AI_RED.test(q)) return { text: 'Có thể là dấu hiệu đột quỵ. Hãy gọi 115 ngay, đừng chờ.', call: true, forward: true };
  if (AI_DOSE.test(q)) return { text: 'Câu này cần bác sĩ hoặc dược sĩ trả lời.', forward: true };
  const qt = new Set(aiTokens(q));
  let best = null, score = 0;
  aiSources().forEach(s => { const n = aiTokens(s.t).filter(w => qt.has(w)).length; if (n > score) { score = n; best = s; } });
  return score >= 2 ? { text: best.a } : { text: 'Câu này cần bác sĩ trả lời.', forward: true };
}
V.assistant = () => {
  const p = P(), log = p.aiLog || [];
  let h = topBar({ back: 'Liên hệ' }) + h1('Trợ lý AI', 'sm');
  if (log.length) h += `<div class="chat">${log.map((x, i) => `<div class="bubble mine"><p>${esc(x.q)}</p></div><div class="bubble"><p>${esc(x.text)}</p></div>${x.call ? btn(`${icon('phone')}Gọi 115`, 'call', { num: '115' }, 'red') : ''}${x.forward ? (x.forwarded ? '<div class="bubble"><p>Đã chuyển cho bác sĩ</p></div>' : btn('Chuyển cho bác sĩ', 'aiForward', { i }, 'soft')) : ''}`).join('')}</div>`;
  h += group(FAQ.slice(0, 4).map(([q]) => row({ title: esc(q), a: 'aiAsk', p: { q } })), { title: 'Câu hỏi thường gặp' });
  return { chrome: 'push', html: h + chatBar('aiText', 'Hỏi về đột quỵ, thuốc, huyết áp', 'aiSend', S.draft.ai) };
};
F.aiText = v => { S.draft.ai = v; };
function aiPush(q) { const p = P(); (p.aiLog = p.aiLog || []).push(Object.assign({ q, t: now() }, aiAnswer(q))); S.scrollTo = 1e6; }
A.aiSend = () => { const q = (S.draft.ai || '').trim(); if (!q) return false; aiPush(q); S.draft.ai = ''; };
A.aiAsk = ({ q }) => aiPush(q);
A.aiForward = ({ i }) => {
  const p = P(), x = p.aiLog[Number(i)];
  p.messages.push({ id: `m${Date.now()}`, from: 'Bạn', mine: true, t: now(), text: `Từ trợ lý AI: ${x.q}`, read: true, by: byWho() });
  x.forwarded = true; toast('Đã chuyển cho bác sĩ');
};

// ---- Lịch hẹn: bác sĩ đặt cho bệnh nhân, bệnh nhân cũng đặt với bác sĩ ----
const APPT_WORD = { upcoming: 'Bác sĩ hẹn', confirmed: 'Bạn sẽ đến', change: 'Đã xin đổi', pending: 'Chờ bác sĩ', done: 'Đã khám', attended: 'Đã khám' };
const APPT_SLOT = { sang: ['Sáng', '08:00'], chieu: ['Chiều', '14:00'] };
V.appts = () => {
  const p = P(), nxt = nextAppt(p), list = p.appts.slice().sort((a, b) => b.t - a.t);
  let h = topBar({ back: 'Liên hệ' }) + h1('Lịch hẹn', 'sm') + btn(`${icon('plus')}Đặt lịch`, 'apptNew');
  h += list.length ? group(list.map(a => row({ icon: 'cal', title: `${WD_S[new Date(a.t).getDay()]} ${ddmm(a.t)} ${hhmm(a.t)}`, value: APPT_WORD[a.state] || '', tone2: a.state === 'pending' ? 'amber' : '', a: nxt && a.id === nxt.id ? 'go' : '', p: { v: 'visit' } }))) : '<section class="card empty"><p class="lead">Chưa có lịch</p></section>';
  return { chrome: 'push', html: h };
};
A.apptNew = () => { S.draft.apt = { date: dayKey(now() + DAY), slot: 'sang' }; go('apptNew'); };
V.apptNew = () => {
  const f = S.draft.apt, min = dayKey(now() + DAY);
  let h = topBar({ close: true }) + h1('Đặt lịch', 'sm');
  h += group(`<label class="row date-row"><span class="row-title">Ngày</span><span class="row-value">${dmy(f.date)}</span><input type="date" data-field="aptDate" value="${esc(f.date)}" min="${min}" aria-label="Ngày"></label>`);
  h += chips(Object.entries(APPT_SLOT).map(([k, [l, t]]) => [k, `${l} ${t}`]), f.slot, 'aptSlot', {}, 'grid');
  return { chrome: 'modal', html: h + '<div class="spacer"></div>' + btn('Gửi yêu cầu', 'aptSend') };
};
F.aptDate = v => { S.draft.apt.date = v; };
A.aptSlot = ({ v }) => { S.draft.apt.slot = v; };
A.aptSend = () => {
  const f = S.draft.apt, p = P(), [, hm] = APPT_SLOT[f.slot];
  if (!f.date || f.date < dayKey(now() + DAY)) { toast('Chọn ngày từ ngày mai'); return false; }
  p.appts.push({ id: `a${Date.now()}`, t: atTime(new Date(`${f.date}T12:00:00`).getTime(), hm), place: `${p.careTeam.hospital}, khoa Đột quỵ`, prep: 'Mang thuốc đang dùng và kết quả xét nghiệm.', state: 'pending', by: 'patient' });
  S.draft.apt = null; back(); toast('Đã gửi yêu cầu');
};

// ---- Thêm bác sĩ: nhập mã hoặc quét mã, chờ bác sĩ đồng ý ----
A.docNew = () => { S.draft.doc = { code: '' }; go('addDoctor'); };
V.addDoctor = () => {
  const f = S.draft.doc || (S.draft.doc = { code: '' });
  let h = topBar({ close: true }) + h1('Thêm bác sĩ', 'sm');
  h += `<div><label class="label" for="dc">Mã bác sĩ</label><input id="dc" class="input" maxlength="20" data-field="docCode" value="${esc(f.code)}" autocomplete="off"></div>`;
  h += btn(`${icon('qr')}Quét mã`, 'docScan', {}, 'soft');
  return { chrome: 'modal', html: h + '<div class="spacer"></div>' + btn('Gửi yêu cầu', 'docSend') };
};
F.docCode = v => { S.draft.doc.code = v; };
A.docScan = () => { S.draft.doc.code = 'BS-2468'; };
A.docSend = () => {
  const f = S.draft.doc, p = P();
  if (!f.code.trim()) { toast('Nhập mã bác sĩ'); return false; }
  (p.doctors = p.doctors || []).push({ id: `d${Date.now()}`, code: f.code.trim(), name: `Bác sĩ ${f.code.trim()}`, hospital: '', state: 'pending' });
  S.draft.doc = null; back(); toast('Đã gửi yêu cầu, chờ bác sĩ đồng ý');
};
