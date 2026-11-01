'use strict';
// Toàn bộ dữ liệu trong file này là GIẢ, chỉ để minh họa. Tên, số đo, bệnh viện, số điện thoại đều không có thật.

const DEMO_NOW = new Date(2026, 9, 31, 7, 2).getTime(); // Thứ Bảy 31/10/2026, 07:02

const MOMENTS = [
  { key: 'sang', label: 'Sáng', word: 'sáng', time: '07:00' },
  { key: 'trua', label: 'Trưa', word: 'trưa', time: '12:00' },
  { key: 'chieu', label: 'Chiều', word: 'chiều', time: '17:00' },
  { key: 'toi', label: 'Tối', word: 'tối', time: '20:00' },
];

// Danh mục thuốc theo các nhóm BRD liệt kê
const MED_CATALOG = [
  { group: 'bp', label: 'Thuốc giảm huyết áp', items: [['Amlodipine', ['5 mg', '10 mg']], ['Losartan', ['50 mg', '100 mg']], ['Perindopril', ['5 mg', '10 mg']], ['Bisoprolol', ['2,5 mg', '5 mg']], ['Indapamide', ['1,5 mg']]] },
  { group: 'anticoag', label: 'Thuốc chống đông', items: [['Apixaban', ['2,5 mg', '5 mg']], ['Rivaroxaban', ['15 mg', '20 mg']], ['Dabigatran', ['110 mg', '150 mg']], ['Edoxaban', ['30 mg', '60 mg']], ['Sintrom (kháng vitamin K)', ['1 mg', '4 mg']]] },
  { group: 'antiplatelet', label: 'Thuốc kháng ngưng tập tiểu cầu', items: [['Aspirin', ['81 mg', '100 mg']], ['Clopidogrel (Plavix)', ['75 mg']], ['DuoPlavin', ['75/100 mg']]] },
  { group: 'lipid', label: 'Thuốc giảm mỡ máu', items: [['Atorvastatin', ['10 mg', '20 mg', '40 mg']], ['Rosuvastatin', ['10 mg', '20 mg']], ['Ezetimibe', ['10 mg']], ['Fenofibrate', ['145 mg', '200 mg']]] },
  { group: 'dm', label: 'Thuốc tiểu đường', items: [['Metformin', ['500 mg', '850 mg']], ['Insulin (thuốc tiêm)', ['Theo bác sĩ dặn']], ['Sitagliptin (DPP-4)', ['100 mg']], ['Empagliflozin (SGLT2)', ['10 mg']]] },
  { group: 'epilepsy', label: 'Thuốc chống động kinh', items: [['Valproat', ['500 mg']], ['Phenytoin', ['100 mg']], ['Phenobarbital', ['100 mg']], ['Oxcarbazepine', ['300 mg']]] },
  { group: 'anxiety', label: 'Thuốc chống lo âu', items: [['Alprazolam', ['0,25 mg']], ['Diazepam', ['5 mg']], ['Clonazepam', ['0,5 mg']], ['Lorazepam', ['1 mg']]] },
];

const CENTERS = [
  { id: 'a', name: 'Bệnh viện mẫu A', addr: '12 Đường Mẫu, Quận Một', km: 2.4, x: 62, y: 40, tel: '0900 000 001', note: 'Trung tâm đột quỵ, mở 24/7' },
  { id: 'b', name: 'Bệnh viện mẫu B', addr: '45 Phố Thử, Quận Hai', km: 5.1, x: 28, y: 62, tel: '0900 000 002', note: 'Trung tâm đột quỵ, mở 24/7' },
  { id: 'c', name: 'Bệnh viện mẫu C', addr: '7 Đường Giả, Quận Ba', km: 8.7, x: 78, y: 74, tel: '0900 000 003', note: 'Khoa thần kinh' },
];

const ARTICLES = [
  { id: 'bp', cat: 'Kiểm soát nguy cơ', title: 'Cách kiểm soát huyết áp', mins: 2, body: ['Huyết áp là yếu tố quan trọng nhất có thể thay đổi để phòng đột quỵ.', 'Dùng thuốc đúng giờ theo đơn, không tự ngừng khi thấy số đã đẹp.', 'Ăn nhạt hơn, vận động đều, hạn chế rượu bia và không hút thuốc.', 'Đo đúng cách và đưa số cho bác sĩ. Bác sĩ cần xu hướng, không chỉ một lần đo.'] },
  { id: 'signs', cat: 'Đột quỵ là gì', title: 'Nhận biết dấu hiệu đột quỵ', mins: 1, body: ['Đột quỵ xảy ra khi máu lên não bị tắc hoặc mạch máu não bị vỡ.', 'Dấu hiệu đến đột ngột: yếu một bên, nói khó, mắt mờ, mất thăng bằng, đau đầu dữ dội.', 'Dù dấu hiệu đã tự hết, vẫn cần đi khám ngay.', 'Gọi 115. Không tự lái xe, không đợi xem có đỡ không.'] },
  { id: 'meds', cat: 'Dùng thuốc', title: 'Vì sao không nên tự ngừng thuốc', mins: 2, body: ['Thuốc sau đột quỵ giúp phòng lần sau, kể cả khi bạn thấy khỏe.', 'Quên một liều: đừng tự dùng bù hay gấp đôi. Hãy hỏi bác sĩ hoặc dược sĩ.', 'Sắp hết thuốc: hẹn khám sớm để không bị gián đoạn.'] },
  { id: 'food', cat: 'Lối sống', title: 'Ăn uống sau đột quỵ', mins: 2, body: ['Ăn nhiều rau, trái cây, các loại hạt, đậu, ngũ cốc nguyên hạt.', 'Ăn cá thường xuyên, ít thịt đỏ, ít đồ chế biến sẵn.', 'Giảm mặn, giảm ngọt, giảm dầu mỡ.'] },
  { id: 'move', cat: 'Lối sống', title: 'Vận động an toàn', mins: 2, body: ['Bắt đầu từ việc nhỏ: đi bộ vài phút mỗi ngày, tăng dần.', 'Hỏi bác sĩ hoặc kỹ thuật viên trị liệu về bài tập hợp với bạn.', 'Dừng lại và báo bác sĩ nếu thấy chóng mặt, đau ngực, khó thở.'] },
  { id: 'rehab', cat: 'Hướng dẫn dùng thuốc và trị liệu', title: 'Tập phục hồi tại nhà', mins: 3, body: ['Tập đều mỗi ngày theo hướng dẫn của kỹ thuật viên.', 'Người nhà có thể hỗ trợ, nhưng hãy để người bệnh tự làm những gì còn làm được.'] },
];

const FAQ = [
  ['App có thay thế bác sĩ không?', 'Không. App chỉ để tham khảo. Hãy luôn theo chỉ định của bác sĩ đang điều trị cho bạn.'],
  ['Sao app không cho tôi biết điểm nguy cơ?', 'Kết quả đánh giá nguy cơ được bác sĩ xem và giải thích cho bạn khi khám. App cho bạn thấy các yếu tố đang tốt và có thể cải thiện.'],
  ['Tôi quên ghi vài ngày thì sao?', 'Không sao cả. Không cần nhập bù, cứ tiếp tục từ hôm nay.'],
  ['Ai xem được dữ liệu của tôi?', 'Chỉ những người bạn đã đồng ý. Bạn đổi ý được bất cứ lúc nào trong Hồ sơ.'],
  ['Người nhà nhập hộ được không?', 'Được. Hãy mời người nhà trong Hồ sơ. App ghi rõ ai đã nhập.'],
];

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function dayKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function atTime(ms, hhmm, addMin) {
  const d = new Date(ms);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m + (addMin || 0), 0, 0);
  return d.getTime();
}

function genBP(seed, days, baseSys, baseDia, slope, moments) {
  const r = rng(seed), out = [];
  for (let i = days; i >= 1; i--) {
    const day = DEMO_NOW - i * 864e5;
    for (const mk of moments) {
      if (r() < 0.05) continue;
      const time = MOMENTS.find(m => m.key === mk).time;
      const adj = i * slope;
      out.push({ id: `b${seed}-${i}-${mk}`, t: atTime(day, time, 3 + Math.floor(r() * 25)), sys: Math.round(baseSys + adj + (r() - 0.5) * 9), dia: Math.round(baseDia + adj * 0.45 + (r() - 0.5) * 5), moment: mk, by: 'self' });
    }
  }
  return out;
}

function genDoses(seed, days, meds) {
  const r = rng(seed), log = {};
  for (let i = days; i >= 1; i--) {
    const dk = dayKey(DEMO_NOW - i * 864e5);
    for (const med of meds) {
      for (const mk of med.moments) {
        const x = r();
        const time = MOMENTS.find(m => m.key === mk).time;
        const key = `${dk}|${mk}|${med.id}`;
        if (x < 0.92 || i === 1) log[key] = { s: 'taken', t: atTime(DEMO_NOW - i * 864e5, time, Math.floor(r() * 30)), by: 'self' };
        else if (x < 0.95) log[key] = { s: 'missed', t: atTime(DEMO_NOW - i * 864e5, time, 180), by: 'self' };
      }
    }
  }
  return log;
}

function med(id, name, group, dose, strength, moments, opts) {
  return Object.assign({ id, name, group, dose, strength, moments, start: '2026-08-01', end: null, note: '', route: 'Uống', source: 'hospital' }, opts || {});
}

function emptyProfile(id, name) {
  return {
    id, name, birthYear: null, height: null, weight: null, stroke: null, strokeType: null, strokeDate: '',
    consents: { doctor: null, research: null, family: null },
    meds: [], doses: {}, bp: [], glucose: [], weights: [], labs: [], symptoms: [], facts: {},
    habits: { smoke: null, alcohol: null, diet: null, activity: null }, habitLog: [],
    track: { bp: false, bpMoments: ['sang', 'chieu'], glucose: false, gluMoments: ['sang'], weeklyHabits: false, steps: false, habitEvery: 'tuan' },
    appts: [], messages: [], history: {}, contact: null, address: '', sex: null,
    careTeam: { doctor: 'BS. Demo', pharmacist: 'DS. Demo', hospital: 'Bệnh viện mẫu A', phone: '0900 000 001', pharmacy: '0900 000 009' },
    family: [], hospitalLinked: false, reviewedHistory: false,
  };
}

function apptOn(y, mo, d, hh, mm, extra) {
  return Object.assign({ id: `a${y}${mo}${d}`, t: new Date(y, mo - 1, d, hh, mm).getTime(), place: 'Bệnh viện mẫu A, khoa Đột quỵ, tầng 3', prep: 'Mang thuốc đang dùng và giấy ra viện.', state: 'upcoming', source: 'Bác sĩ hẹn' }, extra || {});
}

const SCENARIOS = {
  an: {
    label: 'Sau đột quỵ, dùng thuốc chống đông', who: 'Trần An, 68 tuổi',
    build() {
      const p = emptyProfile('an', 'Trần An');
      Object.assign(p, { birthYear: 1958, height: 165, weight: 62, stroke: true, strokeType: 'ischemic', strokeDate: '7/2026', hospitalLinked: true });
      p.consents = { doctor: true, research: false, family: true };
      p.meds = [
        med('apx', 'Apixaban', 'anticoag', '1 viên', '5 mg', ['sang', 'toi'], { end: '2027-01-31' }),
        med('aml', 'Amlodipine', 'bp', '1 viên', '5 mg', ['sang'], { end: '2026-11-05' }),
        med('ato', 'Atorvastatin', 'lipid', '1 viên', '20 mg', ['toi'], { end: '2027-01-31', note: 'Sau ăn' }),
      ];
      p.doses = genDoses(11, 40, p.meds);
      p.bp = genBP(11, 40, 127, 79, 0.28, ['sang', 'chieu']);
      p.weights = [{ t: DEMO_NOW - 14 * 864e5, v: 62 }, { t: DEMO_NOW - 44 * 864e5, v: 63 }];
      p.labs = [{ id: 'l1', name: 'LDL cholesterol', v: '2,1', unit: 'mmol/L', date: '28/09/2026', status: 'improve', note: 'Mục tiêu do bác sĩ đặt', source: 'Bệnh viện nhập' }, { id: 'l2', name: 'HbA1c', v: '5,4', unit: '%', date: '28/09/2026', status: 'good', note: 'Dưới 5,7%', source: 'Bệnh viện nhập' }, { id: 'l3', name: 'eGFR', v: '82', unit: 'mL/phút/1,73m²', date: '28/09/2026', status: 'good', note: '', source: 'Bệnh viện nhập' }];
      p.track = Object.assign(p.track, { bp: true, bpMoments: ['sang', 'chieu'], weeklyHabits: true });
      p.habits = { smoke: 'none', alcohol: 'none', diet: 'yes', activity: 'little' };
      p.facts = {
        prior: { v: 'no', source: 'hospital' }, pad: { v: null }, mi: { v: 'no', source: 'hospital' }, cvdother: { v: 'yes', source: 'hospital' },
        chf: { v: 'no', source: 'hospital' }, smoke: { v: 'no', source: 'patient' }, htn: { v: 'yes', source: 'hospital' }, dm: { v: 'no', source: 'hospital' }, af: { v: 'yes', source: 'hospital' },
      };
      p.history = { htn: true, af: true };
      p.contact = { name: 'Trần Mai', rel: 'con', tel: '0900 000 000' };
      p.family = [{ name: 'Trần Mai', rel: 'con', canSee: true, canEnter: true }];
      p.appts = [
        apptOn(2026, 8, 28, 8, 0, { state: 'done', result: 'Chưa tốt, hẹn 1 tháng', source: 'Tự lên lịch 1 tháng sau xuất viện' }),
        apptOn(2026, 9, 28, 8, 0, { state: 'done', result: 'Chưa tốt, hẹn 1 tháng', source: 'Bác sĩ hẹn' }),
        apptOn(2026, 11, 3, 8, 0, { source: 'Hẹn 1 tháng vì lần trước chưa tốt' }),
      ];
      p.messages = [{ id: 'm1', from: 'BS. Demo', t: DEMO_NOW - 2 * 864e5, text: 'Nhớ mang kết quả xét nghiệm khi đi tái khám nhé.', read: false }];
      return { profiles: { an: p }, active: 'an', owner: 'an' };
    },
  },
  ha: {
    label: 'Chưa đột quỵ, từ 55 tuổi', who: 'Lê Hà, 60 tuổi',
    build() {
      const p = emptyProfile('ha', 'Lê Hà');
      Object.assign(p, { birthYear: 1966, height: 158, weight: 64, stroke: false, sex: null });
      p.consents = { doctor: true, research: true, family: null };
      p.meds = [med('met', 'Metformin', 'dm', '1 viên', '500 mg', ['sang'], { source: 'self', note: 'Sau ăn', end: '2027-03-01' })];
      p.doses = genDoses(23, 30, p.meds);
      p.bp = genBP(23, 21, 136, 85, 0.1, ['sang']);
      p.glucose = [6.4, 6.8, 6.1, 7.2, 6.5, 6.9, 6.3].map((v, i) => ({ id: `g${i}`, t: atTime(DEMO_NOW - (i + 1) * 864e5, '07:10'), v, fasting: true, by: 'self' }));
      p.weights = [{ t: DEMO_NOW - 20 * 864e5, v: 64 }];
      p.track = Object.assign(p.track, { bp: true, bpMoments: ['sang'], glucose: true, gluMoments: ['sang'], weeklyHabits: true });
      p.habits = { smoke: 'none', alcohol: 'little', diet: 'no', activity: 'little' };
      p.facts = { smoke: { v: 'no', source: 'patient' }, dm: { v: 'yes', source: 'patient' }, htn: { v: 'yes', source: 'patient' } };
      p.history = { htn: true, dm: true };
      p.contact = null;
      return { profiles: { ha: p }, active: 'ha', owner: 'ha' };
    },
  },
  tu: {
    label: 'Chưa đột quỵ, dưới 55 tuổi', who: 'Phạm Tú, 42 tuổi',
    build() {
      const p = emptyProfile('tu', 'Phạm Tú');
      Object.assign(p, { birthYear: 1984, height: 170, weight: 68, stroke: false });
      p.consents = { doctor: false, research: false, family: null };
      p.track.weeklyHabits = true;
      p.habits = { smoke: 'none', alcohol: 'little', diet: null, activity: null };
      return { profiles: { tu: p }, active: 'tu', owner: 'tu' };
    },
  },
  mai: {
    label: 'Người nhà nhập hộ', who: 'Trần Mai chăm Trần An',
    build() {
      const base = SCENARIOS.an.build();
      const an = base.profiles.an;
      const m = emptyProfile('mai', 'Trần Mai');
      Object.assign(m, { birthYear: 1986, height: 160, weight: 52, stroke: false });
      m.consents = { doctor: false, research: false, family: null };
      m.track.weeklyHabits = true;
      an.doses[`${dayKey(DEMO_NOW)}|sang|apx`] = { s: 'taken', t: atTime(DEMO_NOW, '07:01'), by: 'self' };
      an.doses[`${dayKey(DEMO_NOW)}|sang|aml`] = { s: 'taken', t: atTime(DEMO_NOW, '07:01'), by: 'self' };
      return { profiles: { mai: m, an }, active: 'an', owner: 'mai', proxyName: 'Trần Mai' };
    },
  },
  lan: {
    label: 'Sau chảy máu não', who: 'Đỗ Lan, 71 tuổi',
    build() {
      const p = emptyProfile('lan', 'Đỗ Lan');
      Object.assign(p, { birthYear: 1955, height: 155, weight: 54, stroke: true, strokeType: 'hemorrhage', strokeDate: '3/2026', hospitalLinked: true });
      p.consents = { doctor: true, research: false, family: null };
      p.meds = [med('per', 'Perindopril', 'bp', '1 viên', '5 mg', ['sang'], { end: '2027-02-15' }), med('ind', 'Indapamide', 'bp', '1 viên', '1,5 mg', ['sang'], { end: '2027-02-15' })];
      p.doses = genDoses(31, 40, p.meds);
      p.bp = genBP(31, 30, 131, 79, 0.2, ['sang', 'chieu']);
      p.track = Object.assign(p.track, { bp: true, bpMoments: ['sang', 'chieu'] });
      p.habits = { smoke: 'none', alcohol: 'none', diet: null, activity: 'little' };
      p.contact = { name: 'Đỗ Quân', rel: 'con', tel: '0900 000 005' };
      p.appts = [apptOn(2026, 8, 20, 9, 0, { state: 'done', result: 'Tốt, hẹn 3 tháng' }), apptOn(2026, 11, 20, 9, 0, { source: 'Hẹn 3 tháng vì lần trước tốt' })];
      return { profiles: { lan: p }, active: 'lan', owner: 'lan' };
    },
  },
  binh: {
    label: 'Đột quỵ đã lâu, ổn định', who: 'Vũ Bình, 76 tuổi',
    build() {
      const p = emptyProfile('binh', 'Vũ Bình');
      Object.assign(p, { birthYear: 1950, height: 162, weight: 58, stroke: true, strokeType: 'ischemic', strokeDate: '2021', hospitalLinked: true });
      p.consents = { doctor: true, research: true, family: null };
      p.meds = [med('asp', 'Aspirin', 'antiplatelet', '1 viên', '81 mg', ['sang'], { end: '2026-11-04', note: 'Sau ăn' }), med('ato2', 'Atorvastatin', 'lipid', '1 viên', '20 mg', ['toi'], { end: '2026-11-04' })];
      p.doses = genDoses(41, 40, p.meds);
      p.bp = genBP(41, 12, 126, 76, 0, ['sang']).filter((_, i) => i % 3 === 0);
      p.track = Object.assign(p.track, { bp: false });
      p.habits = { smoke: 'none', alcohol: 'none', diet: 'yes', activity: 'good' };
      p.facts = { prior: { v: 'yes', source: 'hospital' }, pad: { v: 'no', source: 'hospital' }, mi: { v: 'no', source: 'hospital' }, cvdother: { v: 'no', source: 'hospital' }, chf: { v: 'no', source: 'hospital' }, smoke: { v: 'no', source: 'hospital' }, htn: { v: 'yes', source: 'hospital' }, dm: { v: 'no', source: 'hospital' } };
      p.appts = [apptOn(2026, 8, 12, 8, 30, { state: 'done', result: 'Tốt, hẹn 3 tháng' }), apptOn(2026, 11, 12, 8, 30, { source: 'Hẹn 3 tháng vì lần trước tốt' })];
      return { profiles: { binh: p }, active: 'binh', owner: 'binh' };
    },
  },
  moi: {
    label: 'Mở app lần đầu', who: 'Chưa có hồ sơ',
    build() { return { profiles: {}, active: null, owner: null, onboarding: true }; },
  },
};
