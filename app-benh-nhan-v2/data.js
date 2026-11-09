'use strict';
// Dữ liệu GIẢ cho bản demo. Tên, số đo, bệnh viện, số điện thoại đều không có thật.

const DEMO_NOW = new Date(2026, 9, 31, 7, 2).getTime(); // Thứ Bảy 31/10/2026, 07:02

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const timeOf = mk => MOMENTS.find(m => m.key === mk).time;

function genBP(seed, days, baseSys, baseDia, slope, moments) {
  const r = rng(seed), out = [];
  for (let i = days; i >= 1; i--) {
    const day = DEMO_NOW - i * DAY;
    for (const mk of moments) {
      if (r() < 0.05) continue;
      out.push({ id: `b${seed}-${i}-${mk}`, t: atTime(day, timeOf(mk), 3 + Math.floor(r() * 25)), sys: Math.round(baseSys + i * slope + (r() - 0.5) * 9), dia: Math.round(baseDia + i * slope * 0.45 + (r() - 0.5) * 5), moment: mk, by: 'self' });
    }
  }
  return out;
}
function genDoses(seed, days, meds) {
  const r = rng(seed), log = {};
  for (let i = days; i >= 1; i--) {
    const day = DEMO_NOW - i * DAY;
    for (const m of meds) for (const mk of m.moments) {
      const x = r(), key = doseKey(day, mk, m.id);
      if (x < 0.92 || i === 1) log[key] = { s: 'taken', t: atTime(day, timeOf(mk), Math.floor(r() * 30)), by: 'self' };
      else if (x < 0.95) log[key] = { s: 'missed', t: atTime(day, timeOf(mk), 180), by: 'self' };
    }
  }
  return log;
}
const date = (y, m, d) => new Date(y, m - 1, d).getTime();
const lab = (test, v, d, source) => ({ id: `${test}${d}`, test, v, date: d, source: source || 'hospital' });
const hosp = v => ({ v, source: 'hospital' });

function med(id, name, group, dose, strength, moments, opts) {
  return Object.assign({ id, name, group, dose, strength, moments, start: '2026-08-01', end: null, note: '', route: 'Uống', source: 'hospital' }, opts || {});
}
function emptyProfile(id, name) {
  return {
    id, name, birthYear: null, height: null, weight: null, sex: null, stroke: null, strokeType: null, strokeDate: '', mobility: null,
    consents: { doctor: null, research: null, family: null },
    meds: [], doses: {}, bp: [], glucose: [], weights: [], labs: [], symptoms: [],
    facts: {}, drugs: {}, otherConditions: '',
    habits: { smoke: null, alcohol: null, diet: null, activity: null }, habitLog: [],
    track: { bp: false, bpMoments: ['sang', 'chieu'], glucose: false, gluMoments: ['sang'], weeklyHabits: false, habitEvery: 'tuan', steps: false, device: false },
    appts: [], messages: [], visits: [], contact: null, address: '', family: [],
    careTeam: { doctor: 'BS. Demo', hospital: 'Bệnh viện mẫu A', phone: '0900 000 001', pharmacy: '0900 000 009' },
    hospitalLinked: false, recheckAt: null, intake: null,
  };
}
function appt(y, mo, d, hh, mm, extra) {
  return Object.assign({ id: `a${y}${mo}${d}`, t: new Date(y, mo - 1, d, hh, mm).getTime(), place: 'Bệnh viện mẫu A, khoa Đột quỵ, tầng 3', prep: 'Mang thuốc đang dùng và giấy ra viện.', state: 'upcoming' }, extra || {});
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
      p.weights = [{ t: DEMO_NOW - 44 * DAY, v: 63 }, { t: DEMO_NOW - 14 * DAY, v: 62 }];
      p.labs = [lab('ldl', 2.6, date(2026, 7, 20)), lab('ldl', 2.1, date(2026, 9, 28)), lab('a1c', 5.4, date(2026, 9, 28)), lab('egfr', 82, date(2026, 9, 28)), lab('tc', 4.6, date(2026, 9, 28))];
      p.track = Object.assign(p.track, { bp: true, bpMoments: ['sang', 'chieu'], weeklyHabits: true });
      p.habits = { smoke: 'none', alcohol: 'none', diet: 'yes', activity: 'little' };
      p.facts = { prior: hosp('no'), pad: { v: null }, mi: hosp('no'), cvdother: hosp('yes'), chf: hosp('no'), smoke: { v: 'no', source: 'patient' }, htn: hosp('yes'), dm: hosp('no'), af: hosp('yes'), lipid: { v: 'yes', source: 'patient' }, kidney: { v: 'no', source: 'patient' }, family: { v: 'yes', source: 'patient', detail: { kinds: ['Đột quỵ', 'Tăng huyết áp'] } } };
      p.drugs = { anticoag: 'Có' }; p.intake = { t: DEMO_NOW - 90 * DAY, by: 'self', symptoms: [] };
      p.facts.htn.detail = { year: 2019 }; p.facts.lipid.detail = { year: 2024 };
      p.visits = [{ id: 'v1', t: date(2026, 8, 12), place: 'Bệnh viện mẫu A', dx: 'Nhồi máu não, tăng huyết áp', photo: null }, { id: 'v2', t: date(2026, 9, 28), place: 'Phòng khám mẫu B', dx: 'Mỡ máu cao', photo: null }];
      p.contact = { name: 'Trần Mai', rel: 'con', tel: '0900 000 000' };
      p.family = [{ name: 'Trần Mai', rel: 'con', canSee: true }];
      p.appts = [
        appt(2026, 8, 28, 8, 0, { state: 'done', result: 'Chưa tốt, hẹn 1 tháng' }),
        appt(2026, 9, 28, 8, 0, { state: 'done', result: 'Chưa tốt, hẹn 1 tháng' }),
        appt(2026, 11, 3, 8, 0),
      ];
      p.messages = [{ id: 'm1', from: 'BS. Demo', t: DEMO_NOW - 2 * DAY, text: 'Nhớ mang kết quả xét nghiệm khi đi tái khám nhé.', read: false }];
      return { profiles: { an: p }, active: 'an', owner: 'an' };
    },
  },
  ha: {
    label: 'Chưa đột quỵ, từ 55 tuổi', who: 'Lê Hà, 60 tuổi',
    build() {
      const p = emptyProfile('ha', 'Lê Hà');
      Object.assign(p, { birthYear: 1966, height: 158, weight: 64, stroke: false });
      p.consents = { doctor: true, research: true, family: null };
      p.meds = [med('met', 'Metformin', 'dm', '1 viên', '500 mg', ['sang'], { source: 'self', note: 'Sau ăn', end: '2027-03-01' })];
      p.doses = genDoses(23, 30, p.meds);
      p.bp = genBP(23, 21, 136, 85, 0.1, ['sang']);
      p.glucose = [6.4, 6.8, 6.1, 7.2, 6.5, 6.9, 6.3].map((v, i) => ({ id: `g${i}`, t: atTime(DEMO_NOW - (i + 1) * DAY, '07:10'), v, fasting: true, moment: 'sang', by: 'self' }));
      p.weights = [{ t: DEMO_NOW - 20 * DAY, v: 64 }];
      p.labs = [lab('ldl', 3.1, date(2026, 10, 1)), lab('tc', 5.6, date(2026, 10, 1)), lab('a1c', 6.8, date(2026, 10, 1))];
      p.track = Object.assign(p.track, { bp: true, bpMoments: ['sang'], glucose: true, gluMoments: ['sang'], weeklyHabits: true });
      p.habits = { smoke: 'none', alcohol: 'little', diet: 'no', activity: 'little' };
      p.facts = { smoke: { v: 'no', source: 'patient' }, dm: { v: 'yes', source: 'patient' }, htn: { v: 'yes', source: 'patient' }, lipid: { v: 'yes', source: 'patient' }, cvd: { v: 'no', source: 'patient' }, af: { v: 'unknown', source: 'patient' }, family: { v: 'yes', source: 'patient', detail: { kinds: ['Bệnh tim mạch', 'Đái tháo đường'] } } };
      p.intake = { t: DEMO_NOW - 20 * DAY, by: 'self', symptoms: ['Yếu hoặc tê một bên'] };
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
      const base = SCENARIOS.an.build(), an = base.profiles.an;
      const m = emptyProfile('mai', 'Trần Mai');
      Object.assign(m, { birthYear: 1986, height: 160, weight: 52, stroke: false });
      m.consents = { doctor: false, research: false, family: null };
      m.track.weeklyHabits = true;
      an.mobility = 'bed';
      ['apx', 'aml'].forEach(id => { an.doses[doseKey(DEMO_NOW, 'sang', id)] = { s: 'taken', t: atTime(DEMO_NOW, '07:01'), by: 'self' }; });
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
      p.appts = [appt(2026, 8, 20, 9, 0, { state: 'done', result: 'Tốt, hẹn 3 tháng' }), appt(2026, 11, 20, 9, 0)];
      return { profiles: { lan: p }, active: 'lan', owner: 'lan' };
    },
  },
  binh: {
    label: 'Đột quỵ đã lâu, ổn định', who: 'Vũ Bình, 76 tuổi',
    build() {
      const p = emptyProfile('binh', 'Vũ Bình');
      Object.assign(p, { birthYear: 1950, height: 162, weight: 58, stroke: true, strokeType: 'ischemic', strokeDate: '2021', hospitalLinked: true, mobility: 'stand' });
      p.consents = { doctor: true, research: true, family: null };
      p.meds = [med('asp', 'Aspirin', 'antiplatelet', '1 viên', '81 mg', ['sang'], { end: '2026-11-04', note: 'Sau ăn' }), med('ato2', 'Atorvastatin', 'lipid', '1 viên', '20 mg', ['toi'], { end: '2026-11-04' })];
      p.doses = genDoses(41, 40, p.meds);
      p.bp = genBP(41, 12, 126, 76, 0, ['sang']).filter((_, i) => i % 3 === 0);
      p.labs = [lab('ldl', 1.7, date(2026, 8, 12)), lab('a1c', 5.5, date(2026, 8, 12))];
      p.habits = { smoke: 'none', alcohol: 'none', diet: 'yes', activity: 'good' };
      p.facts = { prior: hosp('yes'), pad: hosp('no'), mi: hosp('no'), cvdother: hosp('no'), chf: hosp('no'), smoke: hosp('no'), htn: hosp('yes'), dm: hosp('no'), af: hosp('yes') };
      p.appts = [appt(2026, 8, 12, 8, 30, { state: 'done', result: 'Tốt, hẹn 3 tháng' }), appt(2026, 11, 12, 8, 30)];
      return { profiles: { binh: p }, active: 'binh', owner: 'binh' };
    },
  },
  // Dữ liệu xấu nhất nhưng có thật được: tên dài, nhiều thuốc, chưa có số đo nào, xét nghiệm ngoài ngưỡng, địa chỉ dài
  xau: {
    label: 'Dữ liệu xấu nhất', who: 'Tôn Nữ Thị Hoàng Phương Thảo, 89 tuổi',
    build() {
      const p = emptyProfile('xau', 'Tôn Nữ Thị Hoàng Phương Thảo');
      Object.assign(p, { birthYear: 1937, height: 148, weight: 41, stroke: true, strokeType: 'ischemic', strokeDate: '12/2025', hospitalLinked: true, mobility: 'bed' });
      p.consents = { doctor: true, research: false, family: true };
      p.meds = [
        med('dab', 'Dabigatran etexilate', 'anticoag', '1 viên', '150 mg', ['sang', 'toi'], { end: '2026-11-01' }),
        med('avh', 'Amlodipine + Valsartan + Hydrochlorothiazide', 'bp', '1 viên', '10/320/25 mg', ['sang']),
        med('ros', 'Rosuvastatin', 'lipid', '1 viên', '20 mg', ['toi'], { note: 'Sau ăn' }),
        med('mxr', 'Metformin XR', 'dm', '2 viên', '1000 mg', ['sang', 'toi'], { note: 'Sau ăn' }),
        med('ins', 'Insulin glargine', 'dm', '1 mũi tiêm', '24 đơn vị', ['toi'], { route: 'Tiêm dưới da' }),
        med('eso', 'Esomeprazole', 'other', '1 viên', '40 mg', ['trua'], { note: 'Trước ăn' }),
        med('bis', 'Bisoprolol', 'bp', '½ viên', '2,5 mg', ['sang', 'trua', 'chieu', 'toi']),
      ];
      p.doses = genDoses(51, 3, p.meds);
      p.labs = [lab('ldl', 4.9, date(2026, 10, 30)), lab('egfr', 28, date(2026, 10, 30)), lab('a1c', 9.8, date(2026, 10, 30)), lab('fpg', 12.4, date(2026, 10, 30)), lab('hdl', 0.7, date(2026, 10, 30))];
      p.track = Object.assign(p.track, { bp: true, bpMoments: ['sang', 'chieu'], glucose: true, gluMoments: ['sang'], weeklyHabits: true });
      p.facts = { htn: Object.assign(hosp('yes'), { detail: { year: 1998 } }), dm: hosp('yes'), af: hosp('yes'), chf: hosp('yes') };
      p.visits = [{ id: 'v1', t: date(2026, 10, 30), place: 'Bệnh viện Đa khoa Trung ương mẫu, Trung tâm Đột quỵ và Thần kinh can thiệp', dx: 'Nhồi máu não tái phát, tăng huyết áp, đái tháo đường typ 2, suy tim, rung nhĩ', photo: null }, { id: 'v2', t: date(2026, 9, 3), place: 'Phòng khám Nội tiết', dx: '', photo: null }];
      p.careTeam = { doctor: 'BS. Nguyễn Hoàng Bảo Ngọc', hospital: 'Bệnh viện Đa khoa Trung ương mẫu', phone: '0900 000 001', pharmacy: '0900 000 009' };
      p.contact = { name: 'Tôn Thất Minh Khôi Nguyên', rel: 'cháu nội', tel: '0900 000 000' };
      p.appts = [appt(2026, 11, 2, 7, 30, { place: 'Bệnh viện Đa khoa Trung ương mẫu, Trung tâm Đột quỵ và Thần kinh can thiệp, tòa nhà B, tầng 12, phòng 1208', prep: 'Mang toàn bộ thuốc đang dùng, sổ theo dõi huyết áp, kết quả xét nghiệm máu và phim chụp não gần nhất.' })];
      p.messages = [{ id: 'm1', from: 'BS. Nguyễn Hoàng Bảo Ngọc', t: DEMO_NOW - DAY, text: 'Kết quả xét nghiệm hôm 30/10 cho thấy LDL và HbA1c còn cao, chức năng thận giảm. Gia đình nhớ đo huyết áp sáng và chiều, ghi lại đầy đủ, và đưa bà đi tái khám đúng hẹn ngày 02/11 để bác sĩ điều chỉnh thuốc.', read: false }];
      return { profiles: { xau: p }, active: 'xau', owner: 'xau' };
    },
  },
  moi: {
    label: 'Mở app lần đầu', who: 'Chưa có hồ sơ',
    build() { return { profiles: {}, active: null, owner: null, onboarding: true }; },
  },
};
