'use strict';
// Tab Tìm hiểu: dấu hiệu đột quỵ, kiến thức, trung tâm đột quỵ, hướng dẫn, hỏi đáp.

V.learn = () => {
  const guest = !P();
  let h = guest ? `<div class="top"><button class="navbtn" data-a="guestBack">${icon('back')}Quay lại</button>${sosBtn()}</div>` : topBar();
  h += '<h1 class="t">Tìm hiểu</h1>';
  h += `<div class="rows">${row({ icon: 'alert', tone: 'red', n: 'Nhận biết dấu hiệu đột quỵ', d: 'Biết sớm để gọi 115 kịp thời', a: 'go', p: 'signs' })}${row({ icon: 'pin', tone: 'blue', n: 'Trung tâm đột quỵ gần bạn', d: 'Bản đồ, số điện thoại, chỉ đường', a: 'go', p: 'centers' })}</div>`;
  if (!guest) {
    const mine = CARE_READ[careGroup(P(), nowMs())].map(id => ARTICLES.find(a => a.id === id));
    h += `<div class="sec">Dành cho bạn</div><div class="rows">${mine.map(a => row({ icon: 'book', tone: 'blue', n: a.title, d: `Đọc khoảng ${a.mins} phút`, a: 'go', p: `article:${a.id}` })).join('')}</div>`;
  }
  const cats = [...new Set(ARTICLES.map(a => a.cat))];
  cats.forEach(c => {
    h += `<div class="sec">${c}</div><div class="rows">${ARTICLES.filter(a => a.cat === c).map(a => row({ icon: 'book', tone: 'green', n: a.title, d: `Đọc khoảng ${a.mins} phút`, a: 'go', p: `article:${a.id}` })).join('')}</div>`;
  });
  h += `<div class="sec">Video</div><div class="rows">${row({ icon: 'play', tone: 'purple', n: 'Đo huyết áp đúng cách', d: 'Video mẫu, 2 phút', a: 'demoOnly', p: 'Bản demo chưa có video thật' })}${row({ icon: 'play', tone: 'purple', n: 'Bài tập phục hồi tại nhà', d: 'Video mẫu, 5 phút', a: 'demoOnly', p: 'Bản demo chưa có video thật' })}</div>`;
  h += `<div class="sec">Khác</div><div class="rows">${row({ icon: 'msg', tone: 'blue', n: 'Hỏi đáp', a: 'go', p: 'faq' })}${row({ icon: 'doc', tone: 'orange', n: 'Tham khảo khuyến nghị', d: 'Nguồn và thông tin từ các tổ chức', a: 'go', p: 'refs' })}</div>`;
  if (guest) h += '<button class="btn" data-a="guestBack">Tạo hồ sơ để theo dõi</button>';
  return { chrome: guest ? 'bare' : 'tab', white: guest, html: h };
};
A.guestBack = () => { S.stack = [{ v: 'onWelcome' }]; S.navFocus = true; render(); };

V.signs = () => {
  const back = P() ? 'Quay lại' : 'Tìm hiểu';
  let h = topBar({ back }) + '<h1 class="t small">Dấu hiệu đột quỵ</h1><div class="big">Chỉ cần một dấu hiệu, hãy gọi 115 ngay.</div>';
  h += `<div class="card" style="display:flex;flex-direction:column;gap:.55rem">${SIGNS.map(s => `<div class="ct">${icon('alert', 'redt')}<span>${s}</span></div>`).join('')}</div>`;
  h += `<button class="btn red tall" data-a="call" data-p="115">${icon('phone')}Gọi 115</button>`;
  h += '<div class="card"><div class="sub ink">Dấu hiệu đến đột ngột. Dù đã tự hết, vẫn cần đi khám ngay. Không tự lái xe và không đợi xem có đỡ không.</div></div>';
  return { chrome: P() ? 'push' : 'bare', white: !P(), html: h };
};
V.article = ({ id }) => {
  const a = ARTICLES.find(x => x.id === id);
  let h = topBar({ back: 'Quay lại' }) + `<div class="sub" style="font-weight:600">${a.cat}</div><h1 class="t small">${a.title}</h1>`;
  h += `<div class="card" style="display:flex;flex-direction:column;gap:.6rem">${a.body.map(b => `<p class="mid" style="font-weight:400">${b}</p>`).join('')}</div>`;
  h += '<p class="note">Nội dung mẫu cho bản demo, chưa được bác sĩ duyệt. Luôn theo chỉ định của bác sĩ đang điều trị cho bạn.</p>';
  return { chrome: P() ? 'push' : 'bare', white: !P(), html: h };
};
V.faq = () => {
  let h = topBar({ back: 'Tìm hiểu' }) + '<h1 class="t small">Hỏi đáp</h1>';
  h += FAQ.map(f => `<div class="card"><div class="mid" style="font-weight:700">${f[0]}</div><div class="sub ink" style="margin-top:.25rem">${f[1]}</div></div>`).join('');
  h += `<div class="card"><div class="sub ink">Cần hỗ trợ thêm? Gửi thư tới <b>hotro@vidu.invalid</b> (địa chỉ mẫu).</div></div>`;
  return { chrome: P() ? 'push' : 'bare', white: !P(), html: h };
};
V.refs = () => {
  let h = topBar({ back: 'Tìm hiểu' }) + '<h1 class="t small">Tham khảo khuyến nghị</h1>';
  h += '<div class="card"><div class="sub ink">Khuyến nghị trong app dựa trên yêu cầu của nhóm bác sĩ trong BRD v6, tham khảo American Heart Association, American Stroke Association, World Health Organization và các hướng dẫn hiện hành của Việt Nam.</div></div><p class="note">Bản demo chưa có danh mục tài liệu đầy đủ.</p>';
  return { chrome: P() ? 'push' : 'bare', white: !P(), html: h };
};

V.centers = () => {
  let h = topBar({ back: 'Quay lại' }) + '<h1 class="t small">Trung tâm đột quỵ gần bạn</h1>';
  h += `<div class="map" role="img" aria-label="Bản đồ mô phỏng các trung tâm đột quỵ">${mapSvg(null)}</div><p class="note">Bản đồ mô phỏng. Danh sách và vị trí là dữ liệu giả.</p>`;
  h += `<div class="rows">${CENTERS.map(c => row({ icon: 'pin', tone: 'blue', n: esc(c.name), d: `${dec(c.km)} km · ${esc(c.note)}`, a: 'go', p: `center:${c.id}` })).join('')}</div>`;
  h += `<div class="card"><div class="sub ink">Có dấu hiệu đột quỵ? Đừng tự đến bệnh viện, hãy gọi 115.</div><button class="btn red small" style="margin-top:.5rem" data-a="call" data-p="115">${icon('phone')}Gọi 115</button></div>`;
  return { chrome: P() ? 'push' : 'bare', white: !P(), html: h };
};
function mapSvg(activeId) {
  const roads = '<path d="M0 30 H100 M0 70 H100 M35 0 V100 M72 0 V100" stroke="var(--card)" stroke-width="2.5" fill="none" vector-effect="non-scaling-stroke"/>';
  const pts = CENTERS.map(c => `<circle cx="${c.x}" cy="${c.y}" r="${c.id === activeId ? 4 : 3}" fill="${c.id === activeId ? 'var(--red)' : 'var(--blue)'}" stroke="var(--card)" stroke-width="1"/>`).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${roads}${pts}<circle cx="48" cy="52" r="2.2" fill="var(--teal)"/></svg>`;
}
V.center = ({ id }) => {
  const c = CENTERS.find(x => x.id === id);
  let h = topBar({ back: 'Quay lại' }) + `<h1 class="t small">${esc(c.name)}</h1><div class="sub" style="margin-top:-.3rem">${esc(c.addr)} · ${dec(c.km)} km</div><div class="map" role="img" aria-label="Vị trí ${esc(c.name)} trên bản đồ mô phỏng">${mapSvg(c.id)}</div><div class="card"><div class="sub ink">${esc(c.note)}</div></div>`;
  h += `<button class="btn red" data-a="call" data-p="115">${icon('phone')}Gọi 115 nếu có dấu hiệu đột quỵ</button><button class="btn sec" data-a="call" data-p="${esc(c.tel)}|${esc(c.name)}">${icon('phone')}Gọi bệnh viện ${esc(c.tel)}</button><button class="btn sec" data-a="demoOnly" data-p="Trên điện thoại thật, mở ứng dụng bản đồ để chỉ đường">${icon('pin')}Chỉ đường</button>`;
  return { chrome: P() ? 'push' : 'bare', white: !P(), html: h };
};
