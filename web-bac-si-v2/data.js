/* VNPreventStroke (demo) · dữ liệu mẫu cho web bác sĩ
 * TOÀN BỘ LÀ NHÂN VẬT GIẢ. "Hôm nay" = thứ Bảy 31/10/2026, 07:30.
 * 5 bệnh nhân nòng cốt (P001–P005) khớp file 00_Chung; 43 bệnh nhân còn lại sinh theo spec bên dưới.
 * Mọi chuỗi đo (HA, đường huyết, liều thuốc) được SINH từ spec bằng bộ số ngẫu nhiên có hạt giống (cố định),
 * mức 🔴🟡🟢 KHÔNG được gán cứng: rules.js tính từ dữ liệu này.
 * Quy ước: d = số ngày so với hôm nay (0 = hôm nay, -1 = hôm qua, +5 = 5 ngày nữa). h = giờ dạng số thập phân.
 */
(function (g) {
  'use strict';
  const V = (g.VNPS = g.VNPS || {});

  /* ---------- thời gian ---------- */
  const BASE = new Date(2026, 9, 31);
  const NOW_H = 7.5;
  const off = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Math.round((new Date(y, m - 1, d) - BASE) / 864e5); };
  const dateOf = (o) => new Date(2026, 9, 31 + o);
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtDM = (o) => { const x = dateOf(o); return pad2(x.getDate()) + '/' + pad2(x.getMonth() + 1); };
  const fmtDMY = (o) => fmtDM(o) + '/' + dateOf(o).getFullYear();
  const fmtH = (h) => { const m = Math.round(h * 60); return pad2(Math.floor(m / 60) % 24) + ':' + pad2(m % 60); };
  const DOW = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dow = (o) => DOW[dateOf(o).getDay()];
  const addMonths = (o, k) => { const x = dateOf(o); x.setMonth(x.getMonth() + k); return Math.round((x - BASE) / 864e5); };
  const hoursAgo = (d, h) => (0 - d) * 24 + (NOW_H - h);
  V.T = { off, dateOf, fmtDM, fmtDMY, fmtH, dow, addMonths, hoursAgo, NOW_H, DOW };

  /* ---------- số ngẫu nhiên có hạt giống ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const r1 = (x) => Math.round(x * 10) / 10;

  /* ---------- danh mục thuốc (tên/liều lấy từ file 00 cho 5 BN nòng cốt) ---------- */
  const MED = {
    clop: { name: 'Clopidogrel', dose: '75 mg', cls: 'antiplatelet', times: ['07:30'], sig: '1 viên buổi sáng' },
    asa81: { name: 'Aspirin', dose: '81 mg', cls: 'antiplatelet', times: ['07:30'], sig: '1 viên sau ăn sáng' },
    atorv20: { name: 'Atorvastatin', dose: '20 mg', cls: 'statin', times: ['20:00'], sig: '1 viên buổi tối' },
    atorv40: { name: 'Atorvastatin', dose: '40 mg', cls: 'statin', times: ['20:00'], sig: '1 viên buổi tối' },
    rosuva10: { name: 'Rosuvastatin', dose: '10 mg', cls: 'statin', times: ['20:00'], sig: '1 viên buổi tối' },
    amlo5: { name: 'Amlodipin', dose: '5 mg', cls: 'antihtn', times: ['07:30'], sig: '1 viên buổi sáng' },
    losartan50: { name: 'Losartan', dose: '50 mg', cls: 'antihtn', times: ['07:30'], sig: '1 viên buổi sáng' },
    peri4: { name: 'Perindopril', dose: '4 mg', cls: 'antihtn', times: ['07:30'], sig: '1 viên buổi sáng' },
    indap: { name: 'Indapamid', dose: '1,5 mg', cls: 'antihtn', times: ['07:30'], sig: '1 viên buổi sáng' },
    bis25: { name: 'Bisoprolol', dose: '2,5 mg', cls: 'other', times: ['07:30'], sig: '1 viên buổi sáng' },
    metf850: { name: 'Metformin', dose: '850 mg', cls: 'dm', times: ['07:30', '19:30'], sig: '1 viên sau ăn sáng và sau ăn tối' },
    gli60: { name: 'Gliclazid', dose: '60 mg', cls: 'dm', times: ['07:30'], sig: '1 viên trước ăn sáng' },
    apix5: { name: 'Apixaban', dose: '5 mg', cls: 'anticoag', times: ['07:30', '19:30'], sig: '1 viên sáng, 1 viên tối' },
    riva20: { name: 'Rivaroxaban', dose: '20 mg', cls: 'anticoag', times: ['19:00'], sig: '1 viên cùng bữa tối' },
  };
  const CLS_VN = { antiplatelet: 'Kháng tiểu cầu', anticoag: 'Chống đông', statin: 'Statin', antihtn: 'Hạ áp', dm: 'Đái tháo đường', other: 'Khác' };
  const isCrit = (cls) => cls === 'anticoag' || cls === 'antiplatelet';
  const isPm = (t) => parseInt(t, 10) >= 17;

  /* ---------- hộ gia đình, tên ---------- */
  const FAM_NAMES = [['Minh Châu', 'con gái'], ['Quang Huy', 'con trai'], ['Thu Trang', 'con gái'], ['Văn Long', 'con trai'], ['Thị Hương', 'vợ'], ['Văn Bình', 'chồng'], ['Hồng Nhung', 'con dâu'], ['Đức Mạnh', 'con rể']];

  /* ---------- 48 bệnh nhân: spec ---------- */
  // P(id, họ tên, tuổi, giới, cơ sở, tùy chọn)
  const SPECS = [];
  const P = (id, name, age, sex, site, o) => SPECS.push(Object.assign({ id, name, age, sex, site }, o));

  /* ===== 5 BN nòng cốt (khớp file 00) ===== */
  P('P001', 'Trần Văn Hùng', 64, 'M', 'BM', {
    dx: ['NMN', '2026-08-12', 3, 1], rf: 'htn dm smoke', fam: ['Trần Thị Hoa', 'vợ'],
    bp: { b: [146, 88], sd: [7, 4], drift: [10, 6], w3: [168, 98], pins: [[0, 'am', 6.8, 182, 104]] },
    glu: { b: 8.4, sd: 0.9, pins: [[0, 6.4, 8.9]] },
    lab: { ldl: [2.9, '2026-10-05'], tc: [4.9, '2026-10-05'], a1c: [8.1, '2026-10-05'] },
    ht: 168, kg: 74, meds: ['clop', 'atorv40', 'amlo5', 'metf850'],
    adh: 90, miss: [[-3, 'Clopidogrel', 0], [-1, 'Clopidogrel', 0]], fill: { meds: ['Atorvastatin', 'Amlodipin', 'Metformin'] },
    next: '2026-11-12', time: '08:30', iv: 1,
    life: { cig: 12, alc: 0.5, alcTxt: 'Bia thỉnh thoảng', ex: 60, diet: 'Ăn mặn, hay ăn đồ chiên rán', sleep: 6 },
    supply: { Clopidogrel: 5 },
    notes: [[-19, 'Tái khám 12/10: HA phòng khám 148/90, còn hút thuốc, đã tư vấn bỏ thuốc lá. Hẹn lại sau 1 tháng. Dặn mang sổ đo HA.']],
    hist: [[-24, 'bp', 'HA TB 7 ngày 152/94', 'Đã nhắc BN đo HA đúng giờ, kiểm tra lại khi tái khám 12/10.']],
    thread: [[-14, 9.2, 'bn', 'Bác sĩ ơi, sáng nay tôi đo HA 150/92, có sao không ạ?'], [-14, 11.0, 'bs', 'Chào bác, mức này cao hơn mục tiêu. Bác tiếp tục đo 2 lần/ngày, ngồi nghỉ 5 phút trước khi đo, và mang sổ đo khi tái khám nhé.']],
  });
  P('P002', 'Nguyễn Thị Lan', 71, 'F', 'BM', {
    dx: ['TIA', '2026-06-20', 0, 0], rf: 'htn af', fam: ['Minh Anh', 'con gái'],
    bp: { b: [142, 86], sd: [6, 4], w7: [146, 88] },
    lab: { ldl: [2.4, '2026-10-15'], tc: [4.4, '2026-10-15'] },
    ht: 155, kg: 56, meds: ['apix5', 'losartan50', 'rosuva10'],
    adh: 86, miss: [[-2, 'Apixaban', 1]], fill: { meds: ['Apixaban', 'Rosuvastatin', 'Losartan'], pm: 3, cap: { Apixaban: 3 } },
    next: '2026-11-05', time: '08:30', iv: 1,
    life: { cig: 0, alc: 0, ex: 90, diet: 'Ăn nhạt vừa phải, ít rau xanh', sleep: 6.5 },
    supply: { Apixaban: 9 },
    notes: [[-26, 'Tái khám 05/10: HA phòng khám 142/86, đã giải thích vai trò của thuốc chống đông. Con gái (Minh Anh) được kết nối để nhận thông báo khi bà bỏ liều.']],
    hist: [],
    thread: [
      [-9, 10.5, 'nt', 'Chào bác sĩ, con là Minh Anh, con gái bà Lan. Mẹ cháu hay quên thuốc buổi tối, cháu nên nhắc thế nào cho phù hợp ạ?'],
      [-9, 14.0, 'bs', 'Chào chị Minh Anh. Chị có thể đặt báo thức cùng bữa tối và nhờ mẹ xác nhận trên app. Chúng tôi sẽ xem lại lịch uống thuốc khi mẹ tái khám.'],
      [-1, 6.667, 'bn', 'Tôi hay quên liều tối, có uống bù được không?'],
    ],
  });
  P('P003', 'Lê Minh Quân', 47, 'M', 'VM', {
    dx: ['NONE', null, null, null], reg: '2026-09-18', rf: 'htn smoke',
    bp: { b: [138, 88], sd: [6, 4] }, stale: 7,
    lab: { ldl: [3.8, '2026-10-12'], tc: [6.0, '2026-10-12'] },
    ht: 170, kg: 78.3, meds: ['amlo5'], adh: 93,
    next: '2026-11-26', time: '09:00', iv: 1,
    life: { cig: 10, alc: 1, alcTxt: 'Khoảng 1 ly bia/ngày', ex: 40, diet: 'Ăn ngoài nhiều, ít rau', sleep: 6.5 },
    notes: [[-43, 'Khám lần đầu: THA phát hiện 09/2026, hút ½ bao/ngày, BMI 27,1, LDL-C 3,8 mmol/L. Dưới 55 tuổi nên chưa tính được FSRP 2017. Đã tư vấn bỏ thuốc lá, tăng vận động.']],
  });
  P('P004', 'Phạm Thu Hà', 58, 'F', 'BM', {
    dx: ['CMN', '2025-11-08', 8, 1], rf: 'htn', fam: ['Phạm Đức Anh', 'con trai'],
    bp: { b: [124, 78], sd: [5, 3], w7: [124, 78] },
    lab: { ldl: [2.3, '2026-09-20'], tc: [4.3, '2026-09-20'] },
    ht: 158, kg: 54, meds: ['amlo5', 'peri4', 'indap'], adh: 97,
    next: '2026-11-20', time: '09:30', iv: 3,
    life: { cig: 0, alc: 0, ex: 160, diet: 'Ăn nhạt, nhiều rau', sleep: 7 },
    notes: [[-72, 'Tái khám 3 tháng: HA ổn định, dung nạp thuốc tốt. ESRS và SPI-II không áp dụng do chảy máu não.']],
  });
  P('P005', 'Đỗ Văn Tâm', 69, 'M', 'BM', {
    dx: ['NMN', '2026-03-14', 2, 0], rf: 'htn', fam: ['Đỗ Thị Hằng', 'vợ'],
    bp: { b: [128, 76], sd: [5, 3], w7: [128, 76] },
    lab: { ldl: [2.1, '2026-10-02'], tc: [4.0, '2026-10-02'], a1c: [5.5, '2026-10-02'] },
    ht: 167, kg: 63, meds: ['clop', 'atorv20', 'amlo5', 'losartan50'], adh: 98,
    next: '2026-10-31', time: '10:00', iv: 3,
    life: { cig: 0, alc: 1, alcTxt: 'Thỉnh thoảng 1 ly rượu vang', ex: 200, diet: 'Ăn nhạt, hay đi bộ buổi sáng', sleep: 7 },
    notes: [[-92, 'Tái khám 3 tháng: mRS 0, HA đạt mục tiêu, đi bộ đều. Hẹn tái khám định kỳ 31/10.']],
  });

  /* ===== 5 BN 🔴 còn lại ===== */
  P('P006', 'Vũ Thị Hạnh', 67, 'F', 'BM', {
    dx: ['NMN', '2026-07-02', 4, 1], rf: 'htn', fam: ['Thu Trang', 'con gái'],
    bp: { b: [136, 84], sd: [5, 3], w7: [139, 86], pins: [[-1, 'pm', 20.5, 186, 112]] },
    lab: { ldl: [2.3, '2026-10-09'] }, ht: 156, kg: 55, meds: ['asa81', 'atorv20', 'peri4', 'amlo5'], adh: 93,
    next: '2026-10-31', time: '09:00', iv: 1,
  });
  P('P007', 'Ngô Quốc Bảo', 72, 'M', 'VM', {
    dx: ['TIA', '2026-09-14', 0, 0], rf: 'htn', fam: ['Ngô Thị Thanh', 'con gái'],
    bp: { b: [134, 82], sd: [5, 3] }, lab: { ldl: [2.2, '2026-10-06'] }, meds: ['asa81', 'atorv40', 'amlo5'], adh: 94,
    ev: [[-1, 21.5, 'fast', 'BN báo tê và yếu tay trái khoảng 20 phút, đã tự hết (mục "Triệu chứng mới" trên app)']],
    next: '2026-11-10', time: '08:30', iv: 1,
  });
  P('P008', 'Trịnh Văn Sơn', 76, 'M', 'BM', {
    dx: ['NMN', '2026-05-20', 5, 2], rf: 'htn af', fam: ['Văn Long', 'con trai'],
    bp: { b: [130, 78], sd: [5, 3] }, lab: { ldl: [2.2, '2026-10-01'] }, meds: ['riva20', 'bis25', 'atorv20'],
    adh: 91, miss: [[-5, 'Rivaroxaban', 0], [-3, 'Rivaroxaban', 0], [-1, 'Rivaroxaban', 0]], fill: { meds: ['Bisoprolol', 'Atorvastatin'] },
    next: '2026-11-19', time: '08:30', iv: 1,
  });
  P('P009', 'Hoàng Thị Mai', 62, 'F', 'VM', {
    dx: ['NMN', '2026-06-10', 3, 1], rf: 'htn dm', fam: ['Đức Mạnh', 'con rể'],
    bp: { b: [128, 78], sd: [5, 3] }, glu: { b: 7.2, sd: 0.7, pins: [[-1, 5.9, 3.4]] },
    lab: { ldl: [2.2, '2026-10-08'], a1c: [6.8, '2026-10-08'] }, meds: ['asa81', 'atorv20', 'metf850', 'gli60', 'losartan50'], adh: 92,
    next: '2026-11-14', time: '09:00', iv: 1,
  });
  P('P010', 'Đặng Văn Khoa', 70, 'M', 'BM', {
    dx: ['NMN', '2026-03-18', 6, 2], rf: 'htn dm smoke', fam: ['Hồng Nhung', 'con dâu'],
    bp: { b: [138, 86], sd: [6, 4] }, glu: { b: 8.0, sd: 1.0 }, lab: { ldl: [2.4, '2026-09-28'], a1c: [7.9, '2026-09-28'] },
    meds: ['clop', 'atorv40', 'amlo5', 'metf850'], adh: 74,
    next: '2026-10-22', time: '09:00', iv: 1, nextStatus: 'missed', life: { cig: 15, alc: 1, ex: 30, diet: 'Ăn mặn', sleep: 5.5 },
  });

  /* ===== 12 BN 🟡 còn lại ===== */
  P('P011', 'Bùi Thị Lệ', 60, 'F', 'BM', { dx: ['NMN', '2026-04-22', 3, 1], rf: 'htn', bp: { b: [150, 92], sd: [5, 3], w7: [152, 94], w3: [153, 95] }, lab: { ldl: [2.3, '2026-10-10'] }, meds: ['asa81', 'atorv20', 'amlo5', 'peri4'], adh: 94, next: '2026-11-17', iv: 1 });
  P('P012', 'Phan Văn Dũng', 68, 'M', 'VM', { dx: ['NMN', '2026-02-11', 2, 1], rf: 'htn dm', bp: { b: [144, 91], sd: [5, 3], w7: [144, 92], w3: [145, 92] }, glu: { b: 6.9, sd: 0.6 }, lab: { ldl: [2.2, '2026-10-04'], a1c: [6.8, '2026-10-04'] }, adh: 93, next: '2026-11-12', iv: 1 });
  P('P013', 'Cao Thị Nga', 65, 'F', 'BM', { dx: ['TIA', '2026-08-03', 0, 0], rf: 'htn', bp: { b: [128, 78], sd: [5, 3] }, lab: { ldl: [2.2, '2026-10-12'] }, adh: 84, next: '2026-12-03', iv: 3 });
  P('P014', 'Lương Đức Thành', 73, 'M', 'VM', { dx: ['NMN', '2026-01-25', 4, 1], rf: 'htn mi', bp: { b: [130, 80], sd: [5, 3] }, lab: { ldl: [2.3, '2026-09-30'] }, adh: 82, next: '2026-11-24', iv: 3 });
  P('P015', 'Đinh Thị Hồng', 59, 'F', 'BM', { dx: ['NMN', '2026-09-02', 3, 1], rf: 'htn', bp: { b: [132, 80], sd: [5, 3] }, lab: { ldl: [2.4, '2026-10-02'] }, adh: 92, stale: 9, next: '2026-11-09', iv: 1 });
  P('P016', 'Vương Minh Tuấn', 54, 'M', 'VM', { dx: ['NMN', '2026-07-19', 5, 1], rf: 'htn smoke', bp: { b: [134, 84], sd: [5, 3] }, lab: { ldl: [2.4, '2026-09-24'] }, adh: 93, stale: 14, next: '2026-11-11', iv: 1 });
  P('P017', 'Lý Thị Thu', 64, 'F', 'BM', { dx: ['NMN', '2026-03-30', 2, 0], rf: 'htn', bp: { b: [126, 78], sd: [5, 3] }, lab: { ldl: [3.1, '2026-10-19'] }, adh: 95, next: '2026-12-01', iv: 3 });
  P('P018', 'Mai Văn Phúc', 66, 'M', 'BM', { dx: ['NMN', '2026-06-29', 3, 1], rf: 'htn dm', bp: { b: [128, 78], sd: [5, 3] }, glu: { b: 7.8, sd: 0.8 }, lab: { ldl: [2.3, '2026-10-11'], a1c: [8.2, '2026-10-11'] }, adh: 93, next: '2026-11-23', iv: 1 });
  P('P019', 'Tạ Thị Yến', 69, 'F', 'VM', {
    dx: ['TIA', '2026-08-28', 0, 0], rf: 'htn', bp: { b: [126, 78], sd: [5, 3] }, lab: { ldl: [2.2, '2026-10-05'] }, adh: 94, next: '2026-11-16', iv: 1,
    supply: { Amlodipin: 3 },
    thread: [[-2, 14.33, 'bn', 'Thuốc huyết áp của tôi còn khoảng 3 ngày, tôi xin đơn mới thế nào ạ?']],
  });
  P('P020', 'Dương Quang Hải', 57, 'M', 'BM', { dx: ['NMN', '2026-09-20', 2, 1], rf: 'htn smoke', bp: { b: [128, 80], sd: [5, 3] }, lab: { ldl: [2.3, '2026-10-14'] }, adh: 95, next: '2026-11-03', time: '09:30', iv: 1 });
  P('P021', 'Hồ Thị Tuyết', 71, 'F', 'VM', { dx: ['CMN', '2025-12-05', 7, 2], rf: 'htn', bp: { b: [128, 78], sd: [5, 3] }, lab: { ldl: [2.3, '2026-09-26'] }, adh: 96, next: '2026-11-06', time: '08:30', iv: 3 });
  P('P022', 'Nguyễn Đình Lâm', 63, 'M', 'BM', { dx: ['NMN', '2026-05-08', 3, 1], rf: 'htn dm', bp: { b: [128, 78], sd: [5, 3] }, glu: { b: 6.7, sd: 0.6 }, lab: { ldl: [2.9, '2026-10-14'], a1c: [6.7, '2026-10-14'] }, adh: 85, next: '2026-10-31', time: '10:45', iv: 1 });

  /* ===== 26 BN 🟢 còn lại: P023–P029 là người chưa từng đột quỵ (nhánh "Người có nguy cơ") ===== */
  const NONE_DX = ['NONE', null, null, null];
  P('P023', 'Kiều Thị Bích', 58, 'F', 'VM', { dx: NONE_DX, reg: '2026-07-14', rf: 'htn', fsrp: 6, adh: 95, next: '2026-12-10', iv: 3 });
  P('P024', 'Lâm Quốc Bình', 61, 'M', 'BM', { dx: NONE_DX, reg: '2026-06-02', rf: 'htn dm', fsrp: 12, adh: 94, next: '2026-10-31', time: '09:30', iv: 3 });
  P('P025', 'Châu Văn Hậu', 55, 'M', 'VM', { dx: NONE_DX, reg: '2026-08-21', rf: 'smoke', fsrp: 9, adh: 96, next: '2026-12-18', iv: 3 });
  P('P026', 'Thái Thị Hoa', 52, 'F', 'BM', { dx: NONE_DX, reg: '2026-09-04', rf: 'htn', adh: 97, next: '2026-12-22', iv: 3 });
  P('P027', 'Quách Thị Xuân', 66, 'F', 'BM', { dx: NONE_DX, reg: '2026-05-19', rf: 'htn dm af', fsrp: 15, adh: 95, next: '2026-11-30', iv: 3 });
  P('P028', 'Âu Văn Đức', 63, 'M', 'VM', { dx: NONE_DX, reg: '2026-07-30', rf: 'htn ?af', fsrp: 11, adh: 93, next: '2027-01-08', iv: 3 });
  P('P029', 'Từ Thị Kim', 57, 'F', 'BM', { dx: NONE_DX, reg: '2026-08-11', rf: 'dm', fsrp: 7, adh: 96, next: '2026-12-15', iv: 3 });

  P('P030', 'Đoàn Văn Lộc', 66, 'M', 'BM', { dx: ['NMN', '2026-04-01', 2, 0], rf: 'htn ?pad', adh: 96, today: false, next: '2026-12-02', iv: 3 });
  P('P031', 'Trương Thị Bảo', 68, 'F', 'BM', { dx: ['NMN', '2026-05-26', 3, 1], rf: 'htn', adh: 97, next: '2026-10-31', time: '08:30', iv: 3 });
  P('P032', 'Sầm Văn Kiên', 61, 'M', 'VM', { dx: ['NMN', '2026-06-18', 2, 0], rf: 'htn dm', adh: 94, next: '2026-11-25', iv: 3 });
  P('P033', 'Dư Thị Phượng', 73, 'F', 'BM', { dx: ['TIA', '2026-07-07', 0, 0], rf: 'htn', noAdh: true, next: '2026-12-09', iv: 3 });
  P('P034', 'Mạc Văn Thịnh', 59, 'M', 'VM', { dx: ['NMN', '2026-03-03', 3, 1], rf: 'htn smoke', adh: 93, next: '2026-11-18', iv: 3 });
  P('P035', 'Giang Thị Oanh', 64, 'F', 'BM', { dx: ['CMN', '2026-02-14', 6, 1], rf: 'htn', adh: 98, next: '2026-11-27', iv: 3 });
  P('P036', 'Khổng Văn Tiến', 75, 'M', 'BM', { dx: ['NMN', '2025-12-12', 4, 1], rf: 'htn dm af', fam: ['Văn Bình', 'con trai'], adh: 95, today: false, next: '2026-12-05', iv: 3 });
  P('P037', 'Ninh Thị Thảo', 70, 'F', 'VM', { dx: ['TIA', '2026-08-16', 0, 0], rf: 'htn', adh: 96, next: '2026-11-19', iv: 1, req: { want: '2026-11-24', why: 'Xin dời sang tuần sau vì con đưa đi khám bằng xe riêng', via: 'app' } });
  P('P038', 'Thạch Văn Hòa', 67, 'M', 'BM', { dx: ['NMN', '2026-01-09', 3, 1], rf: 'htn mi', adh: 92, next: '2026-12-12', iv: 3 });
  P('P039', 'Hà Thị Ngọc', 62, 'F', 'VM', { dx: ['NMN', '2026-05-02', 2, 0], rf: 'dm', adh: 95, next: '2026-11-21', iv: 3 });
  P('P040', 'Lò Văn Nghĩa', 80, 'M', 'BM', { dx: ['NMN', '2025-10-21', 5, 2], rf: 'htn hf', fam: ['Quang Huy', 'con trai'], adh: 95, today: false, next: '2026-11-13', iv: 3 });
  P('P041', 'Bế Thị Lụa', 56, 'F', 'BM', { dx: ['CMN', '2026-06-01', 4, 1], rf: 'htn', adh: 97, next: '2026-12-04', iv: 3 });
  P('P042', 'Tòng Văn Sáng', 65, 'M', 'VM', { dx: ['TIA', '2026-09-09', 0, 0], rf: 'htn dm', adh: 94, next: '2026-11-09', iv: 1 });
  P('P043', 'Nông Thị Mận', 77, 'F', 'BM', { dx: ['NMN', '2025-11-30', 4, 1], rf: 'htn af', fam: ['Thị Hương', 'con dâu'], adh: 96, next: '2026-11-17', iv: 3 });
  P('P044', 'Lưu Văn Quý', 60, 'M', 'VM', { dx: ['NMN', '2026-04-17', 2, 0], rf: 'htn smoke', noAdh: true, next: '2026-11-28', iv: 3 });
  P('P045', 'Cung Thị Hiền', 68, 'F', 'BM', {
    dx: ['NMN', '2026-07-25', 3, 1], rf: 'htn', adh: 95, next: '2026-11-27', iv: 1,
    thread: [[0, 6.17, 'bn', 'Tôi xin đổi lịch khám sang tuần sau vì có việc gia đình, được không bác sĩ?']],
    req: { want: '2026-12-04', why: 'Việc gia đình', via: 'tin nhắn' },
  });
  P('P046', 'Ma Văn Điền', 72, 'M', 'BM', { dx: ['TIA', '2026-05-11', 0, 0], rf: 'htn dm', adh: 93, next: '2026-11-20', iv: 3 });
  P('P047', 'Chu Thị Nhàn', 63, 'F', 'VM', { dx: ['NMN', '2026-03-25', 2, 0], rf: 'htn', adh: 98, next: '2026-11-22', iv: 3 });
  P('P048', 'Âu Dương Hưng', 74, 'M', 'BM', { dx: ['CMN', '2026-01-30', 5, 2], rf: 'htn', adh: 96, next: '2026-12-14', iv: 3 });

  /* ---------- các bác sĩ khác trong khoa: sinh bệnh nhân bằng số ngẫu nhiên cố định ----------
   * Thêm vào sau 48 BN của BS. Nam nên hồ sơ của BS. Nam không đổi. reply = khoảng giờ trả lời tin nhắn. */
  const DOCTORS = [
    { id: 'nam', name: 'BS. Nguyễn Hoàng Nam', short: 'BS. Nam', site: 'BM' },
    { id: 'hang', name: 'BS. Lê Thu Hằng', short: 'BS. Hằng', site: 'VM', n: 36, reply: [2, 9], wait: [30, 3] },
    { id: 'long', name: 'BS. Phạm Đức Long', short: 'BS. Long', site: 'BM', n: 41, reply: [9, 34], wait: [52, 40, 27, 9] },
    { id: 'anh', name: 'BS. Vũ Ngọc Anh', short: 'BS. Anh', site: 'BM', n: 30, reply: [1, 5], wait: [2] },
  ];
  const isoOf = (o) => { const x = dateOf(o); return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate()); };
  const NAME_POOL = {
    fam: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trịnh', 'Mai', 'Tô', 'Hà', 'Lương', 'Kiều', 'Quách', 'Tạ', 'Lưu', 'Triệu', 'Thân', 'La'],
    M: [['Văn', 'Đức', 'Minh', 'Quốc', 'Hữu', 'Công', 'Thành', 'Xuân'], ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Hiếu', 'Hòa', 'Khang', 'Kiên', 'Lâm', 'Lộc', 'Nghĩa', 'Phong', 'Quang', 'Sơn', 'Tài', 'Thắng', 'Toàn', 'Trung', 'Tuấn', 'Việt', 'Vinh']],
    F: [['Thị', 'Ngọc', 'Thu', 'Thanh', 'Kim', 'Bích', 'Hồng', 'Mỹ'], ['Anh', 'Chi', 'Dung', 'Giang', 'Hà', 'Hạnh', 'Hoa', 'Hương', 'Liên', 'Linh', 'Loan', 'Ngân', 'Nhung', 'Oanh', 'Phương', 'Quyên', 'Thoa', 'Trang', 'Uyên', 'Vân']],
  };
  const QA = [
    ['Bác sĩ ơi, mấy hôm nay tôi hay chóng mặt buổi sáng, có cần đi khám sớm không ạ?', 'Chào bác, bác đo HA lúc chóng mặt và ghi vào app. Nếu kèm yếu tay chân, nói khó hay méo miệng thì gọi 115 ngay.'],
    ['Tôi uống thuốc huyết áp xong hơi mệt, có đổi giờ uống được không?', 'Chào bác, bác giữ nguyên thuốc, ghi lại giờ mệt vào app để bác sĩ xem và điều chỉnh khi tái khám.'],
    ['Xin bác sĩ cho hỏi tôi có được tập đi bộ buổi tối không?', 'Được bác ạ, bác đi bộ nhẹ 30 phút, tránh ngay sau bữa ăn và mang theo điện thoại.'],
    ['Kết quả mỡ máu tháng trước của tôi có ổn không ạ?', 'Chào bác, LDL-C còn hơi cao so với mục tiêu, bác duy trì thuốc và mình sẽ xét nghiệm lại khi tái khám.'],
  ];
  const deptSpecs = () => {
    let seq = SPECS.length;
    const used = new Set(SPECS.map((s) => s.name));
    DOCTORS.slice(1).forEach((doc, di) => {
      const r = rng(9001 + di * 131);
      const waits = doc.wait.slice();
      for (let k = 0; k < doc.n; k++) {
        const sex = r() < 0.5 ? 'M' : 'F';
        let name; do { name = pick(r, NAME_POOL.fam) + ' ' + pick(r, NAME_POOL[sex][0]) + ' ' + pick(r, NAME_POOL[sex][1]); } while (used.has(name));
        used.add(name);
        const age = 48 + Math.floor(r() * 36), u = r();
        const type = u < 0.56 ? 'NMN' : u < 0.7 ? 'TIA' : u < 0.82 ? 'CMN' : 'NONE';
        const onsetD = -40 - Math.floor(r() * 320);
        const nihss = type === 'TIA' ? 0 : type === 'CMN' ? 3 + Math.floor(r() * 9) : 1 + Math.floor(r() * 9);
        const mrs = type === 'TIA' ? 0 : r() < 0.45 ? 1 : r() < 0.5 ? 2 : 0;
        const rf = ['htn'].filter(() => r() < 0.82).concat(r() < 0.3 ? ['dm'] : [], r() < 0.18 ? ['smoke'] : [], type !== 'CMN' && r() < 0.1 ? ['af'] : [], r() < 0.06 ? ['mi'] : []).join(' ');
        const sp = { id: 'P' + String(++seq).padStart(3, '0'), name, age, sex, site: doc.site, doc, rf, iv: r() < 0.55 ? 3 : 1, thread: [], adh: 90 + Math.floor(r() * 9) };
        sp.dx = type === 'NONE' ? NONE_DX : [type, isoOf(onsetD), nihss, mrs];
        if (type === 'NONE') { sp.reg = isoOf(-30 - Math.floor(r() * 150)); if (age >= 55) sp.fsrp = 5 + Math.floor(r() * 14); }
        if (/dm/.test(rf)) sp.glu = { b: r1(6.3 + r() * 1.6), sd: 0.6 };
        sp.next = isoOf(2 + Math.floor(r() * 75));
        const roll = r();
        if (roll < 0.07) sp.bp = { b: [150, 90], sd: [6, 4], pins: [[0, 'am', 6.7, 181 + Math.floor(r() * 12), 102 + Math.floor(r() * 8)]] };
        else if (roll < 0.1) { sp.next = isoOf(-9 - Math.floor(r() * 12)); sp.nextStatus = 'missed'; sp.iv = 1; }
        else if (roll < 0.22) sp.bp = { b: [146, 89], sd: [5, 3], w7: [146 + Math.floor(r() * 5), 88 + Math.floor(r() * 4)] };
        else if (roll < 0.28) sp.stale = 8 + Math.floor(r() * 7);
        else if (roll < 0.34) sp.adh = 81 + Math.floor(r() * 7);
        else if (roll < 0.39) sp.lab = { ldl: [r1(2.8 + r() * 0.5), isoOf(-12 - Math.floor(r() * 20))] };
        if (r() < 0.4) {
          const t = pick(r, QA), d0 = -(4 + Math.floor(r() * 20)), h0 = 8 + r() * 10, rep = doc.reply[0] + r() * (doc.reply[1] - doc.reply[0]), h1 = h0 + rep;
          sp.thread.push([d0, r1(h0), 'bn', t[0]], [d0 + Math.floor(h1 / 24), r1(h1 % 24), 'bs', t[1]]);
        }
        if (waits.length && (k + 1) % Math.floor(doc.n / (doc.wait.length + 1)) === 0) {
          const w = waits.shift(), at = T_NOW - w, t = pick(r, QA);
          sp.thread.push([Math.floor(at / 24), r1(((at % 24) + 24) % 24), 'bn', t[0]]);
        }
        SPECS.push(sp);
      }
    });
  };
  const T_NOW = NOW_H;
  deptSpecs();

  /* ---------- bộ dựng: spec -> hồ sơ đầy đủ ---------- */
  function parseRF(str) {
    const o = { htn: 0, dm: 0, smoke: 0, af: 0, mi: 0, pad: 0, hf: 0, ocvd: 0, prior: 0 };
    (str || '').split(/\s+/).filter(Boolean).forEach((t) => {
      if (t[0] === '?') o[t.slice(1)] = null; else o[t] = 1;
    });
    return o;
  }

  function fitWindow(list, tS, tD) {
    // chỉnh các lần đo không bị ghim để trung bình cửa sổ đúng bằng mục tiêu (làm tròn)
    const adj = list.filter((x) => !x.pin);
    if (!adj.length || !list.length) return;
    [['s', tS], ['dia', tD]].forEach(([k, tgt]) => {
      let delta = Math.round(tgt * list.length) - list.reduce((a, x) => a + x[k], 0);
      let guard = 0;
      while (delta !== 0 && guard++ < 5000) {
        const x = adj[guard % adj.length];
        const step = delta > 0 ? 1 : -1;
        x[k] += step; delta -= step;
      }
    });
  }

  function genBP(sp, r, lastD) {
    const o = sp.bp || { b: [118 + Math.round(r() * 14), 73 + Math.round(r() * 8)], sd: [5, 3] };
    const [bs, bd] = o.b, [ss, sdd] = o.sd || [5, 3], dr = o.drift || [0, 0];
    const out = [];
    for (let d = -29; d <= lastD; d++) {
      ['am', 'pm'].forEach((slot) => {
        if (d === 0 && slot === 'pm') return;
        if (d !== lastD && d !== -1 && r() < 0.08) return;
        if (d === lastD && slot === 'pm' && lastD < 0 && r() < 0.3) return;
        const t = (d + 29) / 29;
        let s = Math.round(bs + dr[0] * t + gauss(r) * ss);
        let dia = Math.round(bd + dr[1] * t + gauss(r) * sdd);
        s = clamp(s, 100, 176); dia = clamp(dia, 56, 98);
        if (s - dia < 30) s = dia + 30;
        const h = slot === 'am' ? 6.2 + r() * 1.0 : 19.4 + r() * 1.6;
        out.push({ d, slot, h: r1(h), s, dia, src: r() < 0.9 ? 'BN tự nhập' : 'NVYT nhập', pin: false });
      });
    }
    (o.pins || []).forEach(([d, slot, h, s, dia]) => {
      let x = out.find((y) => y.d === d && y.slot === slot);
      if (!x) { x = { d, slot, src: 'BN tự nhập' }; out.push(x); }
      Object.assign(x, { h, s, dia, pin: true });
    });
    out.sort((a, b) => a.d - b.d || (a.slot === 'am' ? -1 : 1));
    if (o.w3) fitWindow(out.filter((x) => x.d >= -2), o.w3[0], o.w3[1]);
    if (o.w7) fitWindow(out.filter((x) => x.d >= -6), o.w7[0], o.w7[1]);
    out.forEach((x) => { delete x.pin; });
    return out;
  }

  function genGlu(sp, r, lastD) {
    const o = sp.glu; if (!o) return [];
    const out = [];
    for (let d = -29; d <= lastD; d++) {
      if (r() > 0.8 && d !== lastD) continue;
      out.push({ d, h: r1(6.2 + r() * 0.8), v: r1(clamp(o.b + gauss(r) * o.sd, 4.4, 13)), src: 'BN tự nhập' });
    }
    (o.pins || []).forEach(([d, h, v]) => {
      const i = out.findIndex((x) => x.d === d);
      const rec = { d, h, v, src: 'BN tự nhập' };
      if (i >= 0) out[i] = rec; else out.push(rec);
    });
    return out.sort((a, b) => a.d - b.d);
  }

  function genWeight(sp, r, lastD, kg) {
    const out = [];
    [-28, -21, -14, -7, 0].forEach((d) => {
      if (d > lastD) return;
      out.push({ d, kg: r1(kg + (d === Math.min(0, lastD) ? 0 : gauss(r) * 0.4)), src: d === -28 ? 'Bệnh viện' : 'BN tự nhập' });
    });
    if (out.length) out[out.length - 1].kg = kg;
    return out;
  }

  function genLabs(sp, r, rf) {
    const L = sp.lab || {};
    const mk = (pair, drop, base) => {
      if (!pair) return [];
      const [v, iso] = pair; const d = off(iso);
      const arr = [{ d, v, src: 'Bệnh viện' }];
      for (let k = 1; k <= 2; k++) {
        const dd = d - 90 * k;
        if (sp.onset != null && dd < sp.onset - 5) break;
        arr.unshift({ d: dd, v: r1(Math.max(base, v + drop * k * (0.7 + r() * 0.6))), src: 'Bệnh viện' });
      }
      return arr;
    };
    let ldl = L.ldl;
    if (!ldl) ldl = [r1(1.7 + r() * 0.7), '2026-' + (r() < 0.5 ? '09-2' : '10-0') + Math.floor(1 + r() * 8)];
    let tc = L.tc || [r1(ldl[0] + 1.8 + r() * 0.4), ldl[1]];
    let a1c = L.a1c;
    if (!a1c && rf.dm) a1c = [r1(6.3 + r() * 0.5), '2026-10-0' + Math.floor(1 + r() * 8)];
    return { ldl: mk(ldl, 0.5, 1.2), tc: mk(tc, 0.5, 2.8), a1c: mk(a1c, 0.5, 5.0) };
  }

  function genDoses(p, sp, r, lastRec) {
    const nDays = 30;
    p.meds.forEach((m) => {
      m._c = [];
      for (let i = 0; i < nDays; i++) m._c.push(m.times.map(() => (i - 30 > lastRec ? 'N' : 'T')));
    });
    let total = 0;
    p.meds.forEach((m) => m._c.forEach((c) => c.forEach((x) => { if (x !== 'N') total++; })));
    if (sp.noAdh) { total = 0; }
    const target = Math.round(total * (1 - (sp.adh == null ? 94 : sp.adh) / 100));
    const cap = (sp.fill && sp.fill.cap) || {};
    const used = {};
    const mark = (m, i, s) => { m._c[i][s] = 'M'; used[m.name] = (used[m.name] || 0) + 1; };
    let n = 0;
    (sp.miss || []).forEach(([d, name, slot]) => {
      const m = p.meds.find((x) => x.name === name); const i = d + 30;
      if (m && m._c[i] && m._c[i][slot] === 'T') { mark(m, i, slot); n++; }
    });
    const names = sp.fill && sp.fill.meds;
    const pmW = (sp.fill && sp.fill.pm) || 1;
    let cand = [];
    p.meds.forEach((m) => {
      if (names && names.indexOf(m.name) < 0) return;
      m._c.forEach((c, i) => c.forEach((x, s) => {
        const d = i - 30;
        if (x !== 'T') return;
        if (isCrit(m.cls) && d > -8) return;
        cand.push({ m, i, s, w: isPm(m.times[s]) ? pmW : 1 });
      }));
    });
    while (n < target && cand.length) {
      const tot = cand.reduce((a, c) => a + c.w, 0);
      let x = r() * tot, k = 0;
      for (; k < cand.length - 1; k++) { x -= cand[k].w; if (x <= 0) break; }
      const c = cand.splice(k, 1)[0];
      mark(c.m, c.i, c.s); n++;
      if (cap[c.m.name] != null && used[c.m.name] >= cap[c.m.name]) cand = cand.filter((y) => y.m !== c.m);
    }
    p.meds.forEach((m) => { m.log = m._c.map((c) => c.join('')); delete m._c; });
  }

  function defMeds(sp, rf, r) {
    const t = sp.dx[0]; const k = [];
    if (rf.af === 1) k.push(r() < 0.5 ? 'apix5' : 'riva20');
    if (t === 'NMN' || t === 'TIA') {
      if (rf.af !== 1) k.push(r() < 0.6 ? 'asa81' : 'clop');
      k.push(r() < 0.5 ? 'atorv40' : 'rosuva10');
    }
    if (rf.htn) k.push(pick(r, ['amlo5', 'losartan50', 'peri4']));
    if (rf.dm) k.push('metf850');
    if (!k.length) k.push('atorv20');
    return k;
  }

  const NOTE_TPL = [
    'Tái khám định kỳ: tình trạng ổn định, tiếp tục kế hoạch hiện tại.',
    'Tái khám: đã nhắc đo HA 2 lần/ngày và mang sổ khi tái khám.',
    'Tái khám: đã tư vấn ăn nhạt, tăng vận động vừa sức.',
  ];
  const ALERT_TPL = [
    ['bp', 'HA TB 7 ngày 144/90', 'Đã gọi BN, nhắc đo lại đúng cách. Theo dõi thêm 1 tuần.'],
    ['miss', 'Bỏ 2 liều thuốc hạ áp', 'Đã nhắn tin nhắc, BN xác nhận dùng lại đều.'],
    ['nodata', 'Chưa nhập dữ liệu 8 ngày', 'Đã nhắn BN, BN quên đăng nhập, đã hướng dẫn lại.'],
  ];
  const THREAD_TPL = [
    ['Bác sĩ ơi, sáng nay tôi đo HA hơi cao so với mọi ngày, có cần lo không ạ?', 'Chào bác, bác nghỉ 5 phút rồi đo lại. Nếu vẫn cao kéo dài vài ngày, bác nhắn lại để bác sĩ xem sổ đo.'],
    ['Cho tôi hỏi nên ăn nhạt như thế nào cho dễ?', 'Bác xem bài "Ăn nhạt bớt muối kiểu Việt" trong mục Giáo dục sức khỏe trên app, mình sẽ trao đổi thêm khi tái khám.'],
  ];

  function build(sp, idx) {
    const r = rng(idx * 7919 + 17);
    const rf = parseRF(sp.rf);
    const type = sp.dx[0];
    const onset = sp.dx[1] ? off(sp.dx[1]) : null;
    sp.onset = onset;
    const lastD = sp.stale ? -sp.stale : (sp.today === false ? -1 : 0);
    const meds = (sp.meds || defMeds(sp, rf, r)).map((k) => Object.assign({}, MED[k], { supply: 12 + Math.floor(r() * 30) }));
    Object.keys(sp.supply || {}).forEach((nm) => meds.forEach((m) => { if (m.name === nm) m.supply = sp.supply[nm]; }));
    const hdr = sp.sex === 'M' ? 165 + Math.round(r() * 10) : 150 + Math.round(r() * 9);
    const ht = sp.ht || hdr;
    const kg = sp.kg || r1((21 + r() * 5.5) * Math.pow(ht / 100, 2));
    const fam = sp.fam || (r() < 0.55 ? pick(r, FAM_NAMES.filter((f) => f[1] !== (sp.sex === 'M' ? 'chồng' : 'vợ') && (sp.age >= 58 || /vợ|chồng/.test(f[1])))) : null);
    const n = parseInt(sp.id.slice(1), 10);
    const p = {
      id: sp.id, name: sp.name, age: sp.age, sex: sp.sex, site: sp.site,
      phone: '0900 000 ' + String(n).padStart(3, '0'),
      family: fam ? { name: fam[0], rel: fam[1], phone: '0900 100 ' + String(n).padStart(3, '0') } : null,
      doc: (sp.doc || DOCTORS[0]).id, doctor: (sp.doc || DOCTORS[0]).name, coDoctor: !sp.doc && sp.site === 'VM' ? 'BS. Lê Thu Hằng (Vinmec)' : null,
      consent: true, consentAdh: !sp.noAdh,
      dx: { type, onset, nihss: sp.dx[2], mrs: sp.dx[3], reg: sp.reg ? off(sp.reg) : null },
      rf, ht, meds,
      targets: {},
      fsrp: sp.fsrp == null ? null : sp.fsrp,
      life: Object.assign({ cig: rf.smoke ? 8 : 0, alc: 0, ex: 60 + Math.round(r() * 120), diet: 'Ăn nhạt vừa phải', sleep: r1(6 + r() * 1.5) }, sp.life || {}),
      events: (sp.ev || []).map(([d, h, kind, text]) => ({ d, h, kind, text })),
      lastRecD: lastD,
    };
    p.bp = genBP(sp, r, lastD);
    p.glu = genGlu(sp, r, lastD);
    p.weight = genWeight(sp, r, lastD, kg);
    p.labs = genLabs(sp, r, rf);
    genDoses(p, sp, r, lastD);

    // lần đo gần nhất
    const last = p.bp.concat(p.glu).sort((a, b) => a.d - b.d || a.h - b.h).pop();
    p.lastData = last ? { d: last.d, h: last.h } : { d: -99, h: 0 };

    // lịch hẹn + lịch sử tái khám (suy ngược theo chu kỳ 1/3 tháng)
    const nextD = off(sp.next);
    p.appt = { d: nextD, time: sp.time || pick(r, ['08:30', '09:00', '09:30', '10:30', '11:00']), status: sp.nextStatus || 'scheduled', kind: sp.iv === 3 ? 'Tái khám định kỳ (3 tháng)' : 'Tái khám (1 tháng)', iv: sp.iv || 1 };
    const since = onset != null ? onset + 12 : (p.dx.reg != null ? p.dx.reg : -120);
    p.visits = [];
    let vd = nextD, first = true, mrsStep = 0;
    for (let k = 0; k < 4; k++) {
      vd = addMonths(vd, -(sp.iv === 3 ? 3 : 1));
      if (vd >= 0 || vd < since) break;
      p.visits.unshift({ d: vd });
    }
    p.visits.forEach((v, i) => {
      const left = p.visits.length - 1 - i;
      const base = sp.bp ? sp.bp.b : [128, 78];
      v.kind = i === 0 && onset != null ? 'Tái khám đầu tiên sau xuất viện' : 'Tái khám định kỳ';
      v.bp = [Math.round(base[0] + 6 + gauss(r) * 4), Math.round(base[1] + 3 + gauss(r) * 3)];
      v.mrs = p.dx.mrs == null ? null : Math.min(4, p.dx.mrs + (left > 0 ? Math.min(left, 2) - (r() < 0.4 ? 1 : 0) : 0));
      if (v.mrs != null && v.mrs < p.dx.mrs) v.mrs = p.dx.mrs;
      v.eq = r1(clamp(0.96 - 0.07 * (v.mrs || 0) - 0.02 * left + gauss(r) * 0.015, 0.4, 0.99)) ;
      v.note = pick(r, NOTE_TPL);
    });
    p.lastVisitD = p.visits.length ? p.visits[p.visits.length - 1].d : null;

    // yêu cầu đổi lịch
    p.req = sp.req ? { want: off(sp.req.want), why: sp.req.why, via: sp.req.via } : null;

    // tin nhắn
    p.thread = (sp.thread || []).map(([d, h, from, text]) => ({ d, h, from, text }));
    if (!sp.thread && idx % 6 === 0 && n > 5) {
      const t = pick(r, THREAD_TPL); const d0 = -(6 + Math.floor(r() * 12));
      p.thread = [{ d: d0, h: 10.2, from: 'bn', text: t[0] }, { d: d0, h: 13.1, from: 'bs', text: t[1] }];
    }

    // ghi chú lâm sàng + lịch sử cảnh báo
    p.notes = (sp.notes || []).map(([d, text]) => ({ d, h: 10, by: p.doctor, text }));
    if (!p.notes.length && p.visits.length) {
      const v = p.visits[p.visits.length - 1];
      p.notes.push({ d: v.d, h: 10, by: p.doctor, text: 'Tái khám ' + fmtDM(v.d) + ': HA phòng khám ' + v.bp[0] + '/' + v.bp[1] + '. ' + v.note });
    }
    p.history = (sp.hist || (idx % 5 === 0 && n > 5 ? [[-(15 + Math.floor(r() * 12))].concat(pick(r, ALERT_TPL))] : [])).map(([d, group, reason, note]) => ({ d, h: 8.2, group, reason, by: p.doctor, note, doneAt: { d, h: 9.1 } }));
    return p;
  }

  // unit = mọi BN của khoa; patients = BN của bác sĩ đang đăng nhập (BS. Nam), cổng Bác sĩ chỉ dùng danh sách này
  const unit = SPECS.map((s, i) => build(s, i + 1));

  /* ---------- Hồ sơ ban đầu do bệnh nhân khai trên app (cùng cấu trúc với app-benh-nhan-v2) ----------
   * facts[id] = { v: 'yes' | 'no' | 'unknown', source: 'patient' | 'hospital' | 'doctor', by, t }; câu chưa trả lời thì không có mục.
   * Đủ: P001 P002 P008 P009 P011 P013 P027 · một phần: P003 P006 P014 P020 · mở ra rồi bỏ qua hết: P004 · chưa đồng ý chia sẻ: P005.
   * Người có cảnh báo hồ sơ ban đầu (P011, P013, P020) vốn đã ở mức cần theo dõi, nên phân loại 6 / 14 / 28 giữ nguyên. */
  const INTAKE = {
    P001: { f: { htn: 'yes', dm: 'yes', lipid: 'yes', kidney: 'no', cvd: 'no', af: 'no', apnea: 'unknown' }, drugs: { anticoag: 'Không', antiplatelet: 'Có' }, habits: { smoke: 'mid', alcohol: 'little', activity: 'little' }, family: ['yes', ['Đột quỵ', 'Tăng huyết áp']], symptoms: [] },
    P002: { hosp: 1, f: { htn: 'yes', dm: 'no', lipid: 'yes', kidney: 'no', cvd: 'no', af: 'yes', apnea: 'no' }, drugs: { anticoag: 'Có' }, habits: { smoke: 'none', alcohol: 'none', activity: 'good' }, family: ['no', []], symptoms: [] },
    P008: { hosp: 1, f: { htn: 'yes', dm: 'no', lipid: 'yes', kidney: 'no', cvd: 'no', af: 'yes', apnea: 'unknown' }, drugs: { anticoag: 'Có' }, habits: { smoke: 'none', alcohol: 'little', activity: 'none' }, family: ['unknown', []], symptoms: [], unknown: true },
    P009: { hosp: 1, f: { htn: 'yes', dm: 'yes', lipid: 'yes', kidney: 'yes', cvd: 'no', af: 'no', apnea: 'no' }, drugs: { anticoag: 'Không', antiplatelet: 'Có' }, habits: { smoke: 'none', alcohol: 'none', activity: 'little' }, family: ['yes', ['Đái tháo đường']], symptoms: [] },
    P011: { f: { htn: 'yes', dm: 'no', lipid: 'unknown', kidney: 'no', cvd: 'no', af: 'yes', apnea: 'yes' }, drugs: { anticoag: 'Không', antiplatelet: 'Có' }, habits: { smoke: 'none', alcohol: 'little', activity: 'good' }, family: ['no', []], symptoms: [] },
    P013: { hosp: 1, f: { htn: 'yes', dm: 'no', lipid: 'yes', kidney: 'no', cvd: 'no', af: 'no', apnea: 'no' }, drugs: { antiplatelet: 'Có' }, habits: { smoke: 'none', alcohol: 'none', activity: 'good' }, family: ['yes', ['Đột quỵ']], symptoms: ['Mất thăng bằng, chóng mặt', 'Nói khó, nói ngọng'] },
    P027: { hosp: 1, f: { htn: 'yes', dm: 'yes', lipid: 'no', kidney: 'no', cvd: 'no', af: 'yes', apnea: 'no' }, drugs: { anticoag: 'Có' }, habits: { smoke: 'none', alcohol: 'none', activity: 'good' }, family: ['no', []], symptoms: [] },
    P003: { f: { htn: 'yes', dm: 'unknown' } },
    P006: { habits: { smoke: 'none', alcohol: 'none', activity: 'strong' }, family: ['yes', ['Bệnh tim mạch']], symptoms: [] },
    P014: { hosp: 1, f: { htn: 'yes', dm: 'no', cvd: 'yes', af: 'no' }, habits: { smoke: 'little' } },
    P020: { f: { htn: 'yes' }, habits: { smoke: 'mid' }, symptoms: ['Yếu hoặc tê một bên'] },
    P004: { skipped: true },
  };
  const HOSPITAL_KNOWN = ['htn', 'dm', 'cvd', 'af'];
  unit.forEach((p) => {
    const x = INTAKE[p.id] || {}, fact = (v, src) => ({ v, source: src, by: src === 'hospital' ? 'Bệnh viện' : null, t: -20 });
    p.consents = { doctor: p.id !== 'P005' };
    p.facts = {}; p.drugs = Object.assign({}, x.drugs); p.habits = Object.assign({}, x.habits);
    Object.keys(x.f || {}).forEach((id) => { p.facts[id] = fact(x.f[id], x.hosp && HOSPITAL_KNOWN.includes(id) ? 'hospital' : 'patient'); });
    if (x.family) p.facts.family = Object.assign(fact(x.family[0], 'patient'), { detail: { kinds: x.family[1] } });
    p.intake = x.symptoms ? { symptoms: x.symptoms, unknown: !!x.unknown, d: -20 } : x.skipped ? { symptoms: null, d: -20 } : null;
  });
  const patients = unit.filter((p) => p.doc === 'nam');

  /* ---------- nội dung tĩnh ---------- */
  const education = [
    { id: 'E1', t: 'Nhận biết dấu hiệu đột quỵ BE-FAST', s: 'Các dấu hiệu cần gọi 115 ngay. Dành cho BN và người thân.' },
    { id: 'E2', t: 'Đo huyết áp đúng cách tại nhà', s: 'Ngồi nghỉ 5 phút, đo 3 lần, lấy trung bình 2 lần cuối; đo 2 lần/ngày.' },
    { id: 'E3', t: 'Ăn nhạt, bớt muối kiểu Việt', s: 'Gợi ý thay thế nước mắm, đồ muối, mì gói trong bữa ăn quen thuộc.' },
    { id: 'E4', t: 'Bỏ thuốc lá: bắt đầu từ đâu', s: 'Các bước đầu tiên và nơi hỗ trợ.' },
    { id: 'E5', t: 'Vì sao không được tự ngừng thuốc chống đông', s: 'Giải thích nguy cơ khi ngừng thuốc và cách xử trí khi quên liều: hỏi bác sĩ.' },
  ];
  const library = {
    algos: [
      { n: 'ESRS', v: 'ESRS · bảng điểm file 00 §4.1 (demo)', ap: 'Sau nhồi máu não hoặc TIA', note: 'Mốc phân tầng ≥3 là cao: cần BS xác nhận' },
      { n: 'SPI-II', v: 'SPI-II · bảng điểm file 00 §4.1 (demo)', ap: 'Sau TIA hoặc đột quỵ thiếu máu nhẹ', note: 'Mốc 0–3 / 4–7 / 8–15: cần BS xác nhận' },
      { n: 'FSRP 2017', v: 'Dufouil_2017 (khung nhập liệu)', ap: 'Từ 55 tuổi, chưa từng đột quỵ/TIA', note: 'Chưa có hệ số: demo dùng % minh họa' },
      { n: 'CHA₂DS₂-VASc', v: 'CHA2DS2-VASc · BRD v6', ap: 'Bệnh nhân rung nhĩ', note: 'Bảng điểm theo BRD' },
      { n: 'ABCD2', v: 'ABCD2 · BRD v6', ap: 'Sau TIA', note: 'BRD để trống ô "tuổi" và "HA": cần xác nhận' },
    ],
    guides: [
      { org: 'AHA/ASA', t: 'Guideline for the Prevention of Stroke in Patients With Stroke and TIA (2021)', s: 'Phạm vi: dự phòng thứ phát sau nhồi máu não và TIA.' },
      { org: 'AHA/ASA', t: 'Guideline for the Primary Prevention of Stroke (2024)', s: 'Phạm vi: dự phòng tiên phát cho người chưa từng đột quỵ.' },
      { org: 'ESO', t: 'Hướng dẫn của Tổ chức Đột quỵ Châu Âu về kiểm soát huyết áp sau đột quỵ', s: 'Phạm vi: huyết áp ở giai đoạn cấp và sau đột quỵ.' },
      { org: 'Bộ Y tế', t: 'Hướng dẫn chẩn đoán và điều trị đột quỵ não (số quyết định: cần xác nhận)', s: 'Phạm vi: chẩn đoán, xử trí và dự phòng đột quỵ tại Việt Nam.' },
    ],
  };
  const doctor = { name: 'BS. Nguyễn Hoàng Nam', short: 'BS. Nam', unit: 'Phòng khám dự phòng thứ phát, Trung tâm Đột quỵ', managed: 48 };
  const lastVisitApptToday = patients.filter((p) => p.appt.d === 0).length;

  V.data = { patients, unit, doctors: DOCTORS.map(({ id, name, short, site }) => ({ id, name, short, site })), unitName: 'Trung tâm Đột quỵ', MED, CLS_VN, education, library, doctor, isCrit, lastVisitApptToday };
})(typeof globalThis !== 'undefined' ? globalThis : window);
