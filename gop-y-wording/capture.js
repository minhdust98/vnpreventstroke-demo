// Chụp mọi màn của web bác sĩ và quản lý, tách từng ô chữ, ghi ra shots/*.jpg và screens.js cho trang góp ý wording.
// Chạy lại khi giao diện đổi: node gop-y-wording/capture.js   (Node ≥ 22, Edge/Chrome; dùng chung test/browser.js)
const fs = require('fs'), path = require('path');
const B = require('../test/browser.js'), sleep = B.sleep;
const OUT = __dirname, SHOTS = path.join(OUT, 'shots');
const ROOT = 'file:///' + path.join(__dirname, '..').replace(/\\/g, '/').replace(/ /g, '%20') + '/';
fs.mkdirSync(SHOTS, { recursive: true });

// Tách ô chữ trong vùng `scope`: mỗi khối chữ là phần tử gần nhất không phải inline chứa chữ đó.
// Bỏ số liệu thuần (số, ngày, tên người bệnh, tên bác sĩ). Câu giống nhau chỉ khác con số được gộp (khóa thay số bằng #).
const EXTRACT = (scope) => `(() => {
  const roots = [...document.querySelectorAll(${JSON.stringify(scope)})];
  const D = window.VNPS && VNPS.data, names = new Set(D ? D.unit.map((p) => p.name).concat(D.doctors.flatMap((d) => [d.name, d.short])) : []);
  const rs = roots.map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height), pad = 10;
  const cx = Math.max(0, Math.min(...rs.map((r) => r.left)) - pad), cy = Math.max(0, Math.min(...rs.map((r) => r.top)) - pad);
  const vw = Math.min(innerWidth, Math.max(...rs.map((r) => r.right)) + pad) - cx, vh = Math.min(innerHeight, Math.max(...rs.map((r) => r.bottom)) + pad) - cy, out = [], seen = new Map();
  const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null; const s = getComputedStyle(e); if (s.visibility === 'hidden' || +s.opacity === 0) return null; if (r.bottom < cy || r.top > cy + vh || r.right < cx || r.left > cx + vw) return null; return r; };
  const isData = (t) => !/[A-Za-zÀ-ỹĐđ]/.test(t) || names.has(t) || /^P\\d{3}$/.test(t);
  const add = (kind, text, r) => {
    text = String(text || '').replace(/\\s+/g, ' ').trim(); if (text.length < 2 || isData(text)) return;
    const key = text.replace(/\\d+([.,]\\d+)?/g, '#').toLowerCase();
    if (seen.has(key)) { seen.get(key).n++; return; }
    const o = { kind, text, key, x: +((r.left - cx) / vw * 100).toFixed(2), y: +((r.top - cy) / vh * 100).toFixed(2), w: +(r.width / vw * 100).toFixed(2), h: +(r.height / vh * 100).toFixed(2), n: 1 };
    seen.set(key, o); out.push(o);
  };
  const cont = [];
  roots.forEach((root) => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) {
      if (!n.nodeValue.trim()) continue; let e = n.parentElement; if (!e || e.closest('option,script,style,select,textarea,title,.av,.logo')) continue;
      if (e.closest('svg')) { e = e.closest('text') || e; } else { while (e !== root && getComputedStyle(e).display === 'inline') e = e.parentElement; }
      if (!cont.includes(e)) cont.push(e);
    }
    cont.forEach((e) => {
      if (!root.contains(e)) return; const r = vis(e); if (!r) return;
      const svg = !!e.closest('svg');
      const t = svg ? e.textContent : [...e.childNodes].map((c) => (c.nodeType === 3 ? c.nodeValue : c.nodeType === 1 && getComputedStyle(c).display === 'inline' ? c.textContent : ' ')).join('');
      add(svg ? 'Chữ trong biểu đồ' : 'Chữ', t, r);
    });
    root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach((e) => { const r = vis(e); if (r) add('Gợi ý trong ô nhập', e.placeholder, r); });
    root.querySelectorAll('textarea').forEach((e) => { const r = vis(e); if (r && e.value.trim()) add('Mẫu soạn sẵn', e.value, r); });
    root.querySelectorAll('select').forEach((e) => { const r = vis(e); if (r) add('Danh sách chọn', [...e.options].map((o) => o.text).join(' / '), r); });
    root.querySelectorAll('[aria-label]').forEach((e) => { if (e.innerText && e.innerText.trim()) return; const r = vis(e); if (r) add('Nhãn đọc màn hình (không hiện chữ)', e.getAttribute('aria-label'), r); });
  });
  return { clip: { x: cx, y: cy, width: vw, height: vh }, blocks: out.sort((a, b) => (Math.abs(a.y - b.y) < 0.6 ? a.x - b.x : a.y - b.y)) };
})()`;

// Màn hình: g = nhóm, s = mục con, t = tên, url (mặc định web), scope = vùng chứa chữ của màn, tall = chụp cả trang dài, go = thao tác dựng màn.
const MAIN = '#main', SHEET = '.sheet', MODAL = '#modal .mbox';
const H = (a) => `VNPS.debug.H.${a}`;
const S = [
  { id: 'chon-demo', g: 'Chung', s: 'Lối vào', t: 'Trang chọn demo', url: ROOT + 'index.html', scope: 'main' },
  { id: 'chon-vai-tro', g: 'Chung', s: 'Lối vào', t: 'Màn chọn vai trò', hash: '#/', scope: '.landing' },
  { id: 'khung-bac-si', g: 'Chung', s: 'Khung trang', t: 'Banner, menu và thanh trên (bác sĩ)', hash: '#/d/home', scope: '#demoBanner,#side,#top' },
  { id: 'khung-quan-ly', g: 'Chung', s: 'Khung trang', t: 'Menu và thanh trên (quản lý)', hash: '#/m/dashboard', scope: '#side,#top' },
  { id: 'menu-nguoi-dung', g: 'Chung', s: 'Khung trang', t: 'Menu người dùng', hash: '#/d/home', scope: '#top .menu', go: async (b) => { await b.click('[data-a="umenu"]'); } },
  { id: 'tim-nhu-cau', g: 'Chung', s: 'Tìm kiếm', t: 'Tìm theo nhu cầu ("bỏ liều")', hash: '#/d/home', scope: '#sres', go: async (b) => { await b.click('#gs'); await b.type('bỏ liều'); } },
  { id: 'tim-ten', g: 'Chung', s: 'Tìm kiếm', t: 'Tìm theo tên', hash: '#/d/home', scope: '#sres', go: async (b) => { await b.click('#gs'); await b.type('Trần'); } },
  { id: 'tim-khong-thay', g: 'Chung', s: 'Tìm kiếm', t: 'Tìm không thấy', hash: '#/d/home', scope: '#sres', go: async (b) => { await b.click('#gs'); await b.type('Không có ai'); } },

  { id: 'tong-quan-can-thiep', g: 'Bác sĩ', s: 'Tổng quan', t: 'Hàng đợi: Cần can thiệp', hash: '#/d/home', scope: MAIN },
  { id: 'tong-quan-theo-doi', g: 'Bác sĩ', s: 'Tổng quan', t: 'Hàng đợi: Cần theo dõi', hash: '#/d/home', scope: MAIN, go: async (b) => { await b.click('[data-a="qtab"][data-v="watch"]'); } },
  { id: 'tong-quan-on-dinh', g: 'Bác sĩ', s: 'Tổng quan', t: 'Hàng đợi: Ổn định', hash: '#/d/home', scope: MAIN, go: async (b) => { await b.click('[data-a="qtab"][data-v="ok"]'); } },
  { id: 'hang-doi-mo', g: 'Bác sĩ', s: 'Tổng quan', t: 'Mở một dòng hàng đợi', hash: '#/d/home', scope: MAIN, go: async (b) => { await b.click('.qrow', 'Trần Văn Hùng'); } },
  { id: 'hang-doi-loi', g: 'Bác sĩ', s: 'Tổng quan', t: 'Bấm Đã xử lý khi chưa ghi chú', hash: '#/d/home', scope: MAIN, go: async (b) => { await b.click('.qrow', 'Trần Văn Hùng'); await b.click('[data-a="qdone"]'); } },
  { id: 'hang-doi-nhan', g: 'Bác sĩ', s: 'Tổng quan', t: 'Soạn tin ngay trong hàng đợi', hash: '#/d/home', scope: MAIN, go: async (b) => { await b.click('.qrow', 'Trần Văn Hùng'); await b.click('.qx [data-a="qdo"][data-k="msg"]'); } },
  { id: 'hang-doi-da-xu-ly', g: 'Bác sĩ', s: 'Tổng quan', t: 'Sau khi xử lý và hẹn xem lại', hash: '#/d/home', scope: MAIN, go: async (b) => {
    await b.click('.qrow', 'Trần Văn Hùng'); await b.click('[data-a="qchip"]', 'Đã gọi BN'); await b.click('[data-a="qdone"]'); await sleep(200);
    await b.js(`(()=>{const s=document.querySelector('[data-i="qsn"]');s.value='3';s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await sleep(200);
    await b.click('.qrow', 'Trần Văn Hùng'); } },
  { id: 'hang-doi-tua', g: 'Bác sĩ', s: 'Tổng quan', t: 'Sau khi tua demo +3 ngày', hash: '#/d/home', scope: MAIN, go: async (b) => {
    await b.click('.qrow', 'Trần Văn Hùng'); await b.js(`(()=>{const s=document.querySelector('[data-i="qsn"]');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await sleep(200); await b.click('[data-a="qtua"]'); } },
  { id: 'tong-quan-trong', g: 'Bác sĩ', s: 'Tổng quan', t: 'Bác sĩ chưa có bệnh nhân (trống)', hash: '#/d/home', scope: MAIN, go: async (b) => { await b.js(`VNPS.data.patients.splice(0);VNPS.debug.S.appts.splice(0);VNPS.debug.refresh()`); } },

  { id: 'benh-nhan', g: 'Bác sĩ', s: 'Bệnh nhân', t: 'Danh sách bệnh nhân', hash: '#/d/patients', scope: MAIN, tall: true },
  { id: 'benh-nhan-nhu-cau', g: 'Bác sĩ', s: 'Bệnh nhân', t: 'Lọc theo nhu cầu', hash: '#/d/patients', scope: MAIN, go: async (b) => { await b.js(`${H('need')}({dataset:{k:Object.keys(VNPS.ins.NEEDS)[0]}})`); } },
  { id: 'benh-nhan-trong', g: 'Bác sĩ', s: 'Bệnh nhân', t: 'Không có bệnh nhân phù hợp', hash: '#/d/patients', scope: MAIN, go: async (b) => { await b.click('#gs'); await b.type('Không có ai'); } },

  { id: 'ho-so-can-thiep', g: 'Bác sĩ', s: 'Hồ sơ một trang', t: 'Cần can thiệp, khai đủ hồ sơ ban đầu (P001)', hash: '#/d/patient/P001', scope: MAIN },
  { id: 'ho-so-ca-nang', g: 'Bác sĩ', s: 'Hồ sơ một trang', t: 'Ca nặng có Hồi phục mRS (P008)', hash: '#/d/patient/P008', scope: MAIN },
  { id: 'ho-so-chua-khai', g: 'Bác sĩ', s: 'Hồ sơ một trang', t: 'Chưa khai hồ sơ ban đầu (P012)', hash: '#/d/patient/P012', scope: MAIN },
  { id: 'ho-so-khong-chia-se', g: 'Bác sĩ', s: 'Hồ sơ một trang', t: 'Chưa đồng ý chia sẻ (P005)', hash: '#/d/patient/P005', scope: MAIN },
  { id: 'ho-so-moi', g: 'Bác sĩ', s: 'Hồ sơ một trang', t: 'Bệnh nhân mới tạo, chưa có số đo', hash: '#/d/patients', scope: MAIN, go: async (b) => {
    await b.click('[data-a="addpt"]'); await b.click('#p_name'); await b.type('Đinh Thị Mai Hương'); await b.click('#p_age'); await b.type('58'); await b.click('[data-a="addptsave"]'); await sleep(300);
    await b.js(`location.hash='#/d/patient/'+VNPS.data.patients.slice(-1)[0].id`); await sleep(400); await b.js(`document.querySelectorAll('.toast').forEach(t=>t.remove())`); } },
  { id: 'ho-so-menu', g: 'Bác sĩ', s: 'Hồ sơ một trang', t: 'Menu "···" của hồ sơ', hash: '#/d/patient/P001', scope: '.pdmenu .menu', go: async (b) => { await b.click('[data-a="pdmenu"]'); } },
  ...[['sum', 'Tóm tắt'], ['risk', 'Nguy cơ'], ['vit', 'Chỉ số: Huyết áp'], ['med', 'Thuốc'], ['life', 'Lối sống'], ['intake', 'Hồ sơ ban đầu'], ['visit', 'Tái khám'], ['msg', 'Tin nhắn'], ['adv', 'Lời khuyên'], ['note', 'Ghi chú, cảnh báo']].map(([t, n]) => ({ id: 'chi-tiet-' + t, g: 'Bác sĩ', s: 'Hồ sơ: các tab chi tiết', t: n, hash: '#/d/patient/P001', scope: SHEET, go: async (b) => { await b.click('[data-a="ptab"][data-t="note"]'); await b.click('.pd-tabs [data-t="' + t + '"]'); } })),
  ...[['glu', 'Chỉ số: Đường huyết'], ['lab', 'Chỉ số: Xét nghiệm'], ['w', 'Chỉ số: Cân nặng']].map(([m, n]) => ({ id: 'chi-tiet-vit-' + m, g: 'Bác sĩ', s: 'Hồ sơ: các tab chi tiết', t: n, hash: '#/d/patient/P001', scope: SHEET, go: async (b) => { await b.click('[data-a="ptab"][data-t="vit"]'); await b.click('[data-a="pvm"][data-v="' + m + '"]'); } })),
  { id: 'chi-tiet-chuan-bi-kham', g: 'Bác sĩ', s: 'Hồ sơ: các tab chi tiết', t: 'Tóm tắt có Chuẩn bị khám (lịch hôm nay, P006)', hash: '#/d/patient/P006', scope: SHEET, go: async (b) => { await b.click('[data-a="ptab"][data-t="sum"]'); } },

  { id: 'hop-xu-ly', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Xử lý cảnh báo', hash: '#/d/patient/P001', scope: MODAL, go: async (b) => { await b.click('[data-a="pdone"]'); } },
  { id: 'hop-hoan-tat-kham', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Hoàn tất khám, ghi mRS', hash: '#/d/patient/P006', scope: MODAL, go: async (b) => { await b.click('#main [data-a="apdone"]'); } },
  { id: 'hop-hoan-tat-loi', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Hoàn tất khám khi chưa nhập kết luận', hash: '#/d/patient/P006', scope: MODAL, go: async (b) => { await b.click('#main [data-a="apdone"]'); await b.click('[data-a="apdonesave"]'); } },
  { id: 'hop-nhap-ho', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Nhập liệu hộ', hash: '#/d/patient/P001', scope: MODAL, go: async (b) => { await b.click('#main [data-a="entry"]'); } },
  { id: 'hop-dat-lich', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Đặt lịch từ hồ sơ', hash: '#/d/patient/P001', scope: MODAL, go: async (b) => { await b.click('#main [data-a="apnew"]'); } },
  { id: 'hop-loi-khuyen', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Gửi lời khuyên', hash: '#/d/patient/P001', scope: MODAL, go: async (b) => { await b.click('[data-a="pdmenu"]'); await b.click('[data-a="advnew"]'); } },
  { id: 'hop-lien-he', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Thông tin liên hệ', hash: '#/d/patient/P001', scope: MODAL, go: async (b) => { await b.click('[data-a="pinfo"]'); } },
  { id: 'hop-xac-nhan-benh-nen', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Xác nhận bệnh nền', hash: '#/d/patient/P001', scope: MODAL, go: async (b) => { await b.click('#main [data-a="icfm"]'); } },
  { id: 'hop-xu-ly-canh-bao', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Xử lý một cảnh báo (tab Ghi chú)', hash: '#/d/patient/P001', scope: MODAL, go: async (b) => { await b.click('[data-a="ptab"][data-t="note"]'); await b.click('.sheet [data-a="adone"]'); } },
  { id: 'hop-them-benh-nhan', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Thêm bệnh nhân', hash: '#/d/patients', scope: MODAL, go: async (b) => { await b.click('[data-a="addpt"]'); } },
  { id: 'hop-them-loi', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Thêm bệnh nhân khi thiếu tên', hash: '#/d/patients', scope: MODAL, go: async (b) => { await b.click('[data-a="addpt"]'); await b.click('[data-a="addptsave"]'); } },
  { id: 'hop-xuat-csv', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Xuất danh sách CSV', hash: '#/d/patients', scope: MODAL, go: async (b) => { await b.click('[data-a="export"]'); } },
  { id: 'hop-tao-lich', g: 'Bác sĩ', s: 'Hộp thoại', t: 'Tạo lịch (từ Lịch khám)', hash: '#/d/appts', scope: MODAL, go: async (b) => { await b.click('[data-a="apnew"]'); } },

  { id: 'lich-tuan', g: 'Bác sĩ', s: 'Lịch khám', t: 'Xem theo tuần', hash: '#/d/appts', scope: MAIN, go: async (b) => { await b.click('[data-a="apmode"][data-v="week"]'); } },
  { id: 'lich-ngay', g: 'Bác sĩ', s: 'Lịch khám', t: 'Xem theo ngày', hash: '#/d/appts', scope: MAIN, go: async (b) => { await b.click('[data-a="apmode"][data-v="day"]'); } },
  { id: 'lich-thang', g: 'Bác sĩ', s: 'Lịch khám', t: 'Xem theo tháng', hash: '#/d/appts', scope: MAIN, go: async (b) => { await b.click('[data-a="apmode"][data-v="month"]'); } },
  { id: 'tin-nhan', g: 'Bác sĩ', s: 'Tin nhắn', t: 'Hộp thư', hash: '#/d/msgs', scope: MAIN },
  { id: 'cong-cu', g: 'Bác sĩ', s: 'Công cụ tính nguy cơ', t: 'Thang đầu tiên, chưa nhập', hash: '#/d/tools', scope: MAIN, tall: true },
  { id: 'cong-cu-da-nap', g: 'Bác sĩ', s: 'Công cụ tính nguy cơ', t: 'Nạp từ hồ sơ P001', hash: '#/d/tools', scope: MAIN, tall: true, go: async (b) => { await b.js(`(()=>{const s=document.querySelector('[data-i="tipick"]');s.value='P001';s.dispatchEvent(new Event('change',{bubbles:true}))})()`); } },
  ...[1, 2, 3, 4].map((i) => ({ id: 'cong-cu-' + (i + 1), g: 'Bác sĩ', s: 'Công cụ tính nguy cơ', t: 'Thang thứ ' + (i + 1) + ' (nạp từ P001)', hash: '#/d/tools', scope: MAIN, tall: true, go: async (b) => { await b.js(`(()=>{const s=document.querySelector('[data-i="tipick"]');s.value='P001';s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.js(`document.querySelectorAll('[data-a="tool"]')[${i}].click()`); }, title: async (b) => b.js(`document.querySelectorAll('[data-a="tool"]')[${i}].textContent`) })),
  { id: 'cai-dat', g: 'Bác sĩ', s: 'Cài đặt', t: 'Cài đặt', hash: '#/d/settings', scope: MAIN, tall: true },

  { id: 'ql-tong-quan', g: 'Quản lý', s: 'Tổng quan', t: 'Tổng quan khoa: số liệu và 10 biểu đồ', hash: '#/m/dashboard', scope: MAIN, tall: true },
  { id: 'ql-toan-khoa', g: 'Quản lý', s: 'Toàn khoa', t: 'Bảng bác sĩ và tổng khoa', hash: '#/m/overview', scope: MAIN },
  { id: 'ql-danh-sach', g: 'Quản lý', s: 'Danh sách bệnh nhân', t: 'Danh sách từ một ô số (Cần can thiệp)', hash: '#/m/overview', scope: MAIN, tall: true, go: async (b) => { await b.js(`${H('mq')}({dataset:{q:'lvl:act'}})`); } },
  { id: 'ql-danh-sach-ly-do', g: 'Quản lý', s: 'Danh sách bệnh nhân', t: 'Danh sách từ biểu đồ lý do', hash: '#/m/overview', scope: MAIN, tall: true, go: async (b) => { await b.js(`${H('mq')}({dataset:{q:'why:Huyết áp'}})`); } },
  { id: 'ql-bac-si', g: 'Quản lý', s: 'Một bác sĩ', t: 'Trang một bác sĩ', hash: '#/m/doctor/hang', scope: MAIN, tall: true },
  { id: 'ql-ho-so', g: 'Quản lý', s: 'Hồ sơ (chỉ đọc)', t: 'Hồ sơ bệnh nhân, chế độ chỉ đọc', hash: '#/m/doctor/hang', scope: '#drawer', go: async (b) => { await b.click('.tbl.list tbody tr'); } },
  { id: 'ql-ho-so-ghi-chu', g: 'Quản lý', s: 'Hồ sơ (chỉ đọc)', t: 'Tab Ghi chú, cảnh báo chỉ đọc', hash: '#/m/doctor/hang', scope: SHEET, go: async (b) => { await b.click('.tbl.list tbody tr'); await b.click('#drawer [data-a="ptab"][data-t="note"]'); } },
  { id: 'ql-tin-nhan', g: 'Quản lý', s: 'Tin nhắn', t: 'Tin nhắn toàn khoa', hash: '#/m/msgs', scope: MAIN, tall: true },
  { id: 'ql-tin-nhan-da-nhac', g: 'Quản lý', s: 'Tin nhắn', t: 'Sau khi bấm Nhắc bác sĩ', hash: '#/m/msgs', scope: MAIN, go: async (b) => { await b.click('[data-a="nudge"]'); } },
  { id: 'ql-nguong', g: 'Quản lý', s: 'Ngưỡng cảnh báo', t: 'Ngưỡng cảnh báo', hash: '#/m/thresholds', scope: MAIN, tall: true },
  { id: 'ql-nguong-nhap', g: 'Quản lý', s: 'Ngưỡng cảnh báo', t: 'Đang sửa (bản nháp chưa lưu)', hash: '#/m/thresholds', scope: MAIN, go: async (b) => { await b.js(`(()=>{const i=document.querySelector('[data-k="critSys"]');i.value='170';i.dispatchEvent(new Event('change',{bubbles:true}))})()`); } },
];

// Thông báo nhanh và câu báo lỗi: lấy từ mã nguồn (phần chữ ghép từ biến hiện thành …)
const sourceStrings = () => {
  const src = ['app.js', 'views-doctor.js', 'views-patient.js', 'views-manager.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', 'web-bac-si-v2', f), 'utf8')).join('\n');
  const lit = (expr) => expr.split(/(\'(?:[^'\\\\]|\\\\.)*\')/).map((p) => (/^'.*'$/.test(p) ? p.slice(1, -1).replace(/\\'/g, "'") : p.trim() ? '…' : '')).join('').replace(/(…\s*)+/g, '… ').replace(/\s+/g, ' ').trim();
  const grab = (re) => { const o = [], seen = new Set(); let m; while ((m = re.exec(src))) { const t = lit(m[1]); const k = t.toLowerCase(); if (t.replace(/…/g, '').trim().length > 2 && !seen.has(k)) { seen.add(k); o.push(t); } } return o; };
  return { toast: grab(/U\.toast\(([^;]*?)\)\s*[;}]/g), err: grab(/box\('errbox',\s*([^)]*?)\)/g) };
};

(async () => {
  const b = await B.open(), screens = [];
  const nav = async (url) => { await b.send('Page.navigate', { url: 'about:blank' }); await sleep(100); await b.send('Page.navigate', { url }); for (let i = 0; i < 50; i++) { await sleep(100); if (await b.js(`document.readyState==='complete'`).catch(() => false)) break; } await sleep(400); };
  for (const sc of S) {
    try {
      await b.view(1440, 900);
      if (sc.url) await nav(sc.url); else await b.goto(sc.hash);
      if (sc.go) await sc.go(b);
      await sleep(350);
      if (sc.title) sc.t = 'Thang ' + (await sc.title(b)).trim();
      let h = 900;
      if (sc.tall) { h = await b.js(`(()=>{const m=document.getElementById('main');return Math.max(900, m ? m.scrollHeight + m.getBoundingClientRect().top + 24 : document.documentElement.scrollHeight)})()`); h = Math.min(h, 4200); await b.view(1440, h); await sleep(400); await b.js(`window.dispatchEvent(new Event('resize'))`); await sleep(250); }
      await b.js(`document.querySelectorAll('.toast').forEach(t=>t.remove())`).catch(() => {});
      const { clip, blocks } = await b.js(EXTRACT(sc.scope));
      const r = await b.send('Page.captureScreenshot', { format: 'jpeg', quality: 82, clip: Object.assign({ scale: 1 }, clip) });
      fs.writeFileSync(path.join(SHOTS, sc.id + '.jpg'), Buffer.from(r.data, 'base64'));
      screens.push({ id: sc.id, g: sc.g, s: sc.s, t: sc.t, w: Math.round(clip.width), h: Math.round(clip.height), blocks });
      console.log((blocks.length ? 'OK  ' : 'TRỐNG ') + sc.id + ' · ' + blocks.length + ' ô');
    } catch (e) { console.log('LỖI ' + sc.id + ': ' + e.message); }
  }
  const ss = sourceStrings();
  screens.push({ id: 'thong-bao', g: 'Chung', s: 'Thông báo và lỗi', t: 'Thông báo nhanh sau thao tác (toast)', blocks: ss.toast.map((t) => ({ kind: 'Thông báo nhanh', text: t, key: t.replace(/\d+([.,]\d+)?/g, '#').toLowerCase(), n: 1 })) });
  screens.push({ id: 'bao-loi', g: 'Chung', s: 'Thông báo và lỗi', t: 'Câu báo lỗi trong hộp thoại', blocks: ss.err.map((t) => ({ kind: 'Báo lỗi', text: t, key: t.replace(/\d+([.,]\d+)?/g, '#').toLowerCase(), n: 1 })) });
  fs.writeFileSync(path.join(OUT, 'screens.js'), '// Sinh tự động bởi capture.js, đừng sửa tay.\nwindow.SCREENS = ' + JSON.stringify(screens) + ';\n');
  console.log('JS lỗi:', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'không');
  console.log('Tổng: ' + screens.length + ' màn, ' + screens.reduce((a, s) => a + s.blocks.length, 0) + ' ô');
  await b.close();
})();
