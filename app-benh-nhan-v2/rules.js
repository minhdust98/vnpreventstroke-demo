'use strict';
// Logic lâm sàng thuần, không đụng tới giao diện: ngưỡng, đánh giá, xu hướng, kế hoạch trong ngày, tuân thủ thuốc, thang điểm.
// Mức "tốt" theo BRD v6. Mức nghi nhập sai và mức nguy hiểm là ĐỀ XUẤT, chờ bác sĩ duyệt.

const TH = {
  bp: { sysMin: 60, sysMax: 260, diaMin: 30, diaMax: 160, goodSys: 130, goodDia: 80, veryHighSys: 180, veryHighDia: 120, lowSys: 90, lowDia: 60 },
  glu: { min: 1, max: 40, low: 3.9, goodFasting: 5.6, veryHigh: 16.7, critical: 33.3 },
  weight: { min: 35, max: 200 },
  height: { min: 120, max: 210 },
  year: { min: 1920, maxAge: 15 },
  adherenceGood: 0.8,
};
const MOL_TO_MG = 18;
const DAY = 864e5;

// ---- Thời gian ----
function dayKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function atTime(ms, hhmm, addMin) {
  const d = new Date(ms), [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m + (addMin || 0), 0, 0);
  return d.getTime();
}
function daysBetween(a, b) { return Math.round((new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0)) / DAY); }
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
const ageOf = (p, ms) => new Date(ms).getFullYear() - p.birthYear;

// ---- Đánh giá số đo: good | improve | high | low | critical | none ----
function bpStatus(sys, dia) {
  const t = TH.bp;
  if (sys >= t.veryHighSys || dia >= t.veryHighDia) return 'high';
  if (sys < t.lowSys || dia < t.lowDia) return 'low';
  return sys < t.goodSys && dia < t.goodDia ? 'good' : 'improve';
}
function bpIssues(sys, dia) {
  const t = TH.bp, out = [];
  if (sys < t.sysMin || sys > t.sysMax) out.push(`Số trên ${sys} có vẻ không đúng.`);
  if (dia < t.diaMin || dia > t.diaMax) out.push(`Số dưới ${dia} có vẻ không đúng.`);
  if (sys <= dia) out.push('Số trên thường lớn hơn số dưới. Có thể bạn đã nhập đảo.');
  return out;
}
function gluStatus(v, fasting) {
  const t = TH.glu;
  if (v >= t.critical) return 'critical';
  if (v >= t.veryHigh) return 'high';
  if (v < t.low) return 'low';
  if (fasting) return v <= t.goodFasting ? 'good' : 'improve';
  return 'none';
}
function bmiOf(heightCm, weightKg) { return heightCm && weightKg ? weightKg / Math.pow(heightCm / 100, 2) : null; }
// Ngưỡng BMI của Bộ Y tế ghi trong BRD
function bmiStatus(b) {
  if (b == null) return { key: 'none', word: '' };
  if (b < 18.5) return { key: 'improve', word: 'Thiếu cân' };
  if (b < 23) return { key: 'good', word: 'Bình thường' };
  if (b < 25) return { key: 'improve', word: 'Thừa cân' };
  return { key: 'improve', word: b < 30 ? 'Béo phì độ 1' : 'Béo phì độ 2' };
}

// ---- Nhóm người bệnh ----
function careGroup(p, ms) {
  if (p.stroke === false) return ageOf(p, ms) >= 55 ? 'pri55' : 'priYoung';
  if (p.strokeType === 'hemorrhage') return 'secHem';
  if (p.strokeType === 'ischemic' || p.strokeType === 'tia') return 'secIsch';
  return 'secUnknown';
}
// LDL: mức chung 2,6 theo BRD. Sau nhồi máu não/TIA dùng 1,8 theo bản nhận xét TestFlight (AHA/ASA 2021), chờ bác sĩ chốt.
function ldlGoal(p, ms) { return careGroup(p, ms) === 'secIsch' ? 1.8 : 2.6; }
// Xét nghiệm: ngưỡng theo bảng PreventStroke của BRD. HDL và triglyceride chưa có ngưỡng trong BRD nên không đánh giá.
function labStatus(test, v, p, ms) {
  if (test === 'ldl') return v < ldlGoal(p, ms) ? 'good' : 'improve';
  if (test === 'tc') return v < 5.2 ? 'good' : 'improve';
  if (test === 'a1c') return v < 5.7 ? 'good' : 'improve';
  if (test === 'fpg') return v <= 5.6 ? 'good' : 'improve';
  if (test === 'egfr') return v >= 60 ? 'good' : 'improve';
  return 'none';
}
function labGoalText(test, p, ms) {
  return { ldl: `Dưới ${String(ldlGoal(p, ms)).replace('.', ',')}`, tc: 'Dưới 5,2', a1c: 'Dưới 5,7', fpg: 'Không quá 5,6', egfr: 'Từ 60' }[test] || '';
}
const labResults = (p, test) => p.labs.filter(l => l.test === test).sort((a, b) => b.date - a.date);

// ---- Xu hướng huyết áp: trung bình 7 ngày, dưới 4 lần đo thì chưa nói xu hướng ----
function bpTrend(readings, ms) {
  const last = readings.filter(r => r.t <= ms && r.t > ms - 7 * DAY);
  const prev = readings.filter(r => r.t <= ms - 7 * DAY && r.t > ms - 14 * DAY);
  const res = { count: last.length };
  if (last.length) { res.sys = Math.round(mean(last.map(r => r.sys))); res.dia = Math.round(mean(last.map(r => r.dia))); }
  if (last.length >= 4 && prev.length >= 4) res.delta = res.sys - Math.round(mean(prev.map(r => r.sys)));
  return res;
}
function bpTrendSentence(tr) {
  if (tr.count < 4) return '';
  const base = `Trung bình 7 ngày ${tr.sys}/${tr.dia}`;
  if (tr.delta == null) return `${base}.`;
  if (tr.delta <= -2) return `${base}, thấp hơn tuần trước ${-tr.delta} điểm.`;
  if (tr.delta >= 2) return `${base}, cao hơn tuần trước ${tr.delta} điểm.`;
  return `${base}, gần như tuần trước.`;
}

// ---- Thuốc và kế hoạch trong ngày ----
const timesDefault = () => Object.fromEntries(MOMENTS.map(m => [m.key, m.time]));
const doseKey = (ms, mk, medId) => `${dayKey(ms)}|${mk}|${medId}`;
function medsActive(p, ms) {
  const dk = dayKey(ms);
  return p.meds.filter(m => !m.paused && (!m.start || m.start <= dk) && (!m.end || m.end >= dk));
}
// Gom việc theo buổi: thuốc, đo huyết áp, đo đường huyết
function dayPlan(p, ms, times) {
  const t = times || timesDefault(), dk = dayKey(ms), meds = medsActive(p, ms), out = [];
  for (const m of MOMENTS) {
    const due = atTime(ms, t[m.key]), items = [];
    const mm = meds.filter(x => x.moments.includes(m.key));
    if (mm.length) {
      const logs = mm.map(x => p.doses[doseKey(ms, m.key, x.id)]);
      const taken = logs.filter(l => l && l.s === 'taken');
      const missed = logs.filter(l => l && l.s === 'missed').length;
      items.push({ kind: 'meds', meds: mm, taken: taken.length, missed, total: mm.length, lastT: taken.map(l => l.t).sort().pop(), done: taken.length + missed === mm.length, filled: taken.length === mm.length });
    }
    if (p.track.bp && p.track.bpMoments.includes(m.key)) { const r = p.bp.find(x => dayKey(x.t) === dk && x.moment === m.key); items.push({ kind: 'bp', reading: r, done: !!r, filled: !!r }); }
    if (p.track.glucose && p.track.gluMoments.includes(m.key)) { const r = p.glucose.find(x => dayKey(x.t) === dk && x.moment === m.key); items.push({ kind: 'glu', reading: r, done: !!r, filled: !!r }); }
    if (items.length) out.push({ key: m.key, label: m.label, word: m.label.toLowerCase(), time: t[m.key], due, items, reached: due <= ms });
  }
  return out;
}
function currentMoment(plan) { let c = null; plan.forEach(m => { if (m.reached) c = m; }); return c; }
function nextMoment(plan) { return plan.find(m => !m.reached) || null; }
function nearestMoment(ms) { const h = new Date(ms).getHours(); return h < 11 ? 'sang' : h < 14 ? 'trua' : h < 19 ? 'chieu' : 'toi'; }

// Liều chưa ghi của buổi đã qua. Chỉ hỏi hôm nay và hôm qua, và chỉ khi hôm qua có dùng app: bỏ app vài ngày thì không bắt nhập bù.
function overdueDoses(p, ms, times) {
  const out = [], plan = dayPlan(p, ms, times), cur = currentMoment(plan);
  const collect = (day, pl, yesterday) => pl.forEach(m => {
    if (!yesterday && (!m.reached || (cur && m.key === cur.key))) return;
    const it = m.items.find(x => x.kind === 'meds');
    if (it && !it.done) out.push({ day, key: m.key, yesterday, meds: it.meds.filter(x => !p.doses[doseKey(day, m.key, x.id)]) });
  });
  collect(ms, plan, false);
  const y = ms - DAY;
  if (Object.keys(p.doses).some(k => k.startsWith(dayKey(y)))) collect(y, dayPlan(p, y, times), true);
  return out;
}

// Tuân thủ: chỉ tính liều đã đến hạn. "Bỏ lỡ" khác "không có ghi nhận".
function adherence(p, days, ms, times) {
  const t = times || timesDefault(), res = { due: 0, taken: 0, missed: 0, none: 0 };
  for (let i = 0; i < days; i++) {
    const day = ms - i * DAY, dk = dayKey(day);
    for (const med of p.meds) {
      if ((med.start && med.start > dk) || (med.end && med.end < dk)) continue;
      for (const mk of med.moments) {
        const due = atTime(day, t[mk]);
        if (due > ms) continue;
        const log = p.doses[`${dk}|${mk}|${med.id}`];
        if (i === 0 && !log && ms - due < 4 * 36e5) continue; // chưa quá 4 giờ thì chưa tính
        res.due++;
        if (log && log.s === 'taken') res.taken++; else if (log && log.s === 'missed') res.missed++; else res.none++;
      }
    }
  }
  return res;
}
function adherenceKey(a) {
  const known = a.taken + a.missed;
  return !known ? 'none' : a.taken / known >= TH.adherenceGood ? 'good' : 'improve';
}
// Trạng thái từng ngày: full | partial | missed | none | ongoing | nodoses
function dayDoseState(p, day, ms, times) {
  const t = times || timesDefault(), dk = dayKey(day);
  let due = 0, taken = 0, missed = 0, future = 0;
  for (const med of p.meds) {
    if ((med.start && med.start > dk) || (med.end && med.end < dk)) continue;
    for (const mk of med.moments) {
      if (atTime(day, t[mk]) > ms) { future++; continue; }
      due++;
      const log = p.doses[`${dk}|${mk}|${med.id}`];
      if (log && log.s === 'taken') taken++; else if (log && log.s === 'missed') missed++;
    }
  }
  if (!due && !future) return 'nodoses';
  if (dk === dayKey(ms) && future) return 'ongoing';
  if (due && taken === due) return 'full';
  if (taken) return 'partial';
  return missed ? 'missed' : 'none';
}
const daysLeft = (m, ms) => daysBetween(ms, new Date(`${m.end}T00:00:00`).getTime());
function medsEnding(p, ms, within) { return medsActive(p, ms).filter(m => m.end && daysLeft(m, ms) <= within).sort((a, b) => (a.end > b.end ? 1 : -1)); }
const hasMedGroup = (p, g) => p.meds.some(m => m.group === g && !m.paused);
const nextAppt = p => p.appts.filter(a => ['upcoming', 'confirmed', 'change'].includes(a.state)).sort((x, y) => x.t - y.t)[0] || null;

// ---- Câu hỏi thang điểm. Lấy từ dữ liệu sẵn có để không hỏi lại. Ô trống không được hiểu là "Không". ----
function factOf(p, id) {
  const x = p.facts[id];
  if (x && x.v != null) return x.v;
  if ((id === 'htn' || id === 'bpmed') && hasMedGroup(p, 'bp')) return 'yes';
  if (id === 'dm' && hasMedGroup(p, 'dm')) return 'yes';
  if (id === 'sbp' && p.bp.length) return 'have';
  if (id === 'sex' && p.sex) return p.sex === 'other' ? 'unknown' : p.sex;
  if (id === 'smoke' && p.habits.smoke) return p.habits.smoke === 'none' ? 'no' : 'yes';
  return null;
}
// Bộ câu theo chỉ thị mục 5: FSRP 2017 từ 55 tuổi; ESRS và SPI-II sau đột quỵ thiếu máu hoặc TIA.
function riskPlan(p, ms) {
  if (p.stroke === false) {
    if (ageOf(p, ms) < 55) return { scales: [], ids: [], reason: 'under55' };
    return { scales: ['FSRP 2017'], ids: ['sex', 'sbp', 'bpmed', 'smoke', 'dm', 'cvd', 'af', 'confirm'] };
  }
  if (p.strokeType === 'ischemic' || p.strokeType === 'tia') return { scales: ['ESRS', 'SPI-II'], ids: ['htn', 'dm', 'smoke', 'prior', 'mi', 'chf', 'cvdother', 'pad'] };
  return { scales: [], ids: [], reason: p.strokeType === 'hemorrhage' ? 'hemorrhage' : 'unknownType' };
}
const riskRemaining = (p, ms) => riskPlan(p, ms).ids.filter(id => factOf(p, id) == null);

// Đầu vào từng thang, để phía bác sĩ thấy đủ và biết chỗ thiếu. Demo không tính điểm.
const SCALE_INPUTS = {
  'FSRP 2017': ['Tiền sử đột quỵ/TIA', 'Tuổi', 'Giới tính', 'Huyết áp tâm thu', 'Điều trị hạ áp', 'Hút thuốc', 'Đái tháo đường', 'Bệnh tim mạch', 'Rung nhĩ', 'Bác sĩ hoặc hồ sơ xác nhận'],
  ESRS: ['Tuổi', 'Tăng huyết áp', 'Đái tháo đường', 'Bệnh động mạch ngoại biên', 'Nhồi máu cơ tim', 'Bệnh tim mạch khác', 'Hút thuốc', 'TIA/đột quỵ trước đó'],
  'SPI-II': ['Tuổi', 'Tăng huyết áp', 'Đái tháo đường', 'Tiền sử nhồi máu não/TIA', 'Loại biến cố', 'Nhồi máu cơ tim', 'Bệnh tim mạch khác', 'Suy tim sung huyết'],
};
const SCALE_FACT = { 'Giới tính': 'sex', 'Điều trị hạ áp': 'bpmed', 'Hút thuốc': 'smoke', 'Đái tháo đường': 'dm', 'Bệnh tim mạch': 'cvd', 'Rung nhĩ': 'af', 'Bác sĩ hoặc hồ sơ xác nhận': 'confirm', 'Tăng huyết áp': 'htn', 'Bệnh động mạch ngoại biên': 'pad', 'Nhồi máu cơ tim': 'mi', 'Bệnh tim mạch khác': 'cvdother', 'TIA/đột quỵ trước đó': 'prior', 'Tiền sử nhồi máu não/TIA': 'prior', 'Suy tim sung huyết': 'chf' };
const SCALE_VERSION = { 'FSRP 2017': 'Dufouil_2017', ESRS: 'ESRS', 'SPI-II': 'SPI-II' };
// Tiền sử bệnh chỉ dùng khi bác sĩ hoặc hồ sơ đã xác nhận (file câu hỏi thang điểm, slide 16)
const NEEDS_CONFIRM = ['dm', 'htn', 'cvd', 'af', 'prior', 'pad', 'mi', 'cvdother', 'chf'];
function scaleValue(p, label, ms) {
  if (label === 'Tiền sử đột quỵ/TIA') return p.stroke === false ? 'Không' : 'Có';
  if (label === 'Tuổi') return p.birthYear ? `${ageOf(p, ms)}` : null;
  if (label === 'Huyết áp tâm thu') { const last = p.bp.slice().sort((a, b) => b.t - a.t)[0], x = p.facts.sbp; return last ? `${last.sys}` : x && x.sys ? `${x.sys}` : null; }
  if (label === 'Loại biến cố') return { ischemic: 'Đột quỵ', tia: 'TIA' }[p.strokeType] || null;
  const v = factOf(p, SCALE_FACT[label]);
  if (v == null || v === 'unknown') return null;
  return { yes: 'Có', no: 'Không', male: 'Nam', female: 'Nữ' }[v] || v;
}
function scaleSource(p, label) {
  const id = SCALE_FACT[label];
  if (!id) return '';
  const x = p.facts[id];
  if (!x || x.v == null) return ' (tự lấy)';
  return { hospital: ' (bệnh viện)', doctor: ' (bác sĩ)', patient: ' (bệnh nhân khai)' }[x.source] || '';
}
const pendingConfirm = (p, ms) => riskPlan(p, ms).ids.filter(id => NEEDS_CONFIRM.includes(id) && p.facts[id] && p.facts[id].source === 'patient' && p.facts[id].v !== 'unknown');

// ---- Thói quen: một câu mỗi tuần, xoay vòng ----
const weekIdx = ms => Math.floor((ms - new Date(2026, 0, 4).getTime()) / (7 * DAY));
function weeklyKind(p, ms) {
  if (!p.track.weeklyHabits) return null;
  const w = weekIdx(ms);
  if (p.habitLog.some(x => x.w === w)) return null;
  return ['activity', 'diet', 'alcohol'][w % 3];
}

// ---- Bài học dành cho bạn, theo nhóm, thuốc và khả năng vận động ----
function forYou(p) {
  const out = [];
  if (p.stroke && FEATURES.exercises) out.push({ exercise: true });
  if (p.mobility === 'bed') out.push({ topic: 'diet', id: 'swallow' });
  if (p.meds.some(m => m.group === 'anticoag' && !m.paused)) out.push({ topic: 'meds', id: 'bleed' });
  if (p.meds.some(m => /sintrom/i.test(m.name) && !m.paused)) out.push({ topic: 'diet', id: 'vka' });
  if (factOf(p, 'htn') === 'yes') out.push({ topic: 'bp', id: 'control' });
  out.push({ topic: 'diet', id: 'salt' });
  return out.slice(0, 3);
}

// ---- Hồ sơ ban đầu: những gì người bệnh khai, để bác sĩ mở ra xem. Không tính điểm, không đổi nhóm theo dõi. ----
const INTAKE_CONDS = [['htn', 'Tăng huyết áp'], ['dm', 'Đái tháo đường'], ['lipid', 'Rối loạn mỡ máu'], ['kidney', 'Bệnh thận'], ['cvd', 'Bệnh tim mạch'], ['af', 'Rung nhĩ'], ['apnea', 'Ngưng thở khi ngủ']];
const joinList = l => l.join(', ');
function intakeSummary(p, ms) {
  const out = [{ k: 'Nhóm theo dõi', v: CARE_TITLE[careGroup(p, ms)] }];
  const val = id => factOf(p, id);
  const yes = INTAKE_CONDS.filter(([id]) => val(id) === 'yes').map(c => c[1]), unk = INTAKE_CONDS.filter(([id]) => val(id) === 'unknown').map(c => c[1].toLowerCase());
  const answered = INTAKE_CONDS.some(([id]) => val(id) != null);
  if (answered) out.push({ k: 'Bệnh nền', v: (yes.length ? joinList(yes) : 'Không có') + (unk.length ? `. Chưa rõ: ${joinList(unk)}` : '') });
  const drugs = [p.drugs.anticoag ? `Chống đông: ${p.drugs.anticoag.toLowerCase()}` : '', p.drugs.antiplatelet ? `Kháng tiểu cầu: ${p.drugs.antiplatelet.toLowerCase()}` : ''].filter(Boolean);
  if (drugs.length) out.push({ k: 'Thuốc đã dùng', v: joinList(drugs) });
  const hab = [['smoke', 'Hút thuốc'], ['alcohol', 'Rượu bia'], ['activity', 'Vận động']].filter(([k]) => p.habits[k] && HABIT_SHORT[k][p.habits[k]]).map(([k, n]) => `${n}: ${HABIT_SHORT[k][p.habits[k]].toLowerCase()}`);
  if (hab.length) out.push({ k: 'Sinh hoạt', v: joinList(hab) });
  const fam = p.facts.family;
  if (fam && fam.v != null) {
    const kinds = (fam.detail && fam.detail.kinds) || [];
    out.push({ k: 'Gia đình', v: `${fam.v === 'yes' ? 'Đột quỵ hoặc bệnh tim trước 60 tuổi' : fam.v === 'no' ? 'Không có đột quỵ hoặc bệnh tim sớm' : 'Chưa rõ'}${kinds.length ? `. Từng bị: ${joinList(kinds.map(x => x.toLowerCase()))}` : ''}` });
  }
  if (p.otherConditions) out.push({ k: OTHER_LABEL.cond, v: p.otherConditions });
  const ot = (p.intake && p.intake.other) || {};
  ['heart', 'life', 'family', 'symptoms'].forEach(k => { if (ot[k]) out.push({ k: OTHER_LABEL[k], v: ot[k] }); });
  if (p.intake && p.intake.symptoms) out.push({ k: 'Triệu chứng 3 tháng qua', v: p.intake.symptoms.length ? joinList(p.intake.symptoms) : p.intake.unknown ? 'Không nhớ' : 'Không có' });
  return out;
}
// Điều bác sĩ nên xem trước. [Đề xuất] chưa có trong BRD, chờ bác sĩ chốt. Chỉ hiện phía bác sĩ, người bệnh không thấy.
function intakeFlags(p) {
  const out = [], sym = (p.intake && p.intake.symptoms) || [];
  if (sym.length) out.push('Có triệu chứng giống đột quỵ trong 3 tháng qua, chưa có đánh giá');
  if (factOf(p, 'af') === 'yes' && !hasMedGroup(p, 'anticoag') && p.drugs.anticoag !== 'Có') out.push('Rung nhĩ, chưa thấy thuốc chống đông (người bệnh khai)');
  return out;
}

// ---- Mức nguy cơ cho người bệnh: chỉ hiện mức Thấp / Trung bình / Cao, không hiện điểm. ----
// Ngưỡng từng mức là [Đề xuất], chờ bác sĩ chốt, và chỉ nằm ở đây. Điểm và công thức không đổi.
// esrs: điểm ESRS (bảng điểm của phía bác sĩ). fsrp: ước tính % trong 10 năm do phía bác sĩ tính; app chưa có hệ số FSRP nên chỉ đọc số này.
const RISK_LEVEL = { esrs: [[0, 'low'], [3, 'mid'], [7, 'high']], fsrp: [[0, 'low'], [5, 'mid'], [10, 'high']] };
const riskLevelOf = (scale, v) => RISK_LEVEL[scale].reduce((k, [from, key]) => (v >= from ? key : k), 'low');
// ESRS: tuổi dưới 65 là 0, đến 75 là 1, trên 75 là 2; mỗi yếu tố sau 1 điểm. Tim khác tính cả suy tim.
function esrsScore(p, ms) {
  const a = ageOf(p, ms), yes = id => factOf(p, id) === 'yes', known = id => ['yes', 'no'].includes(factOf(p, id));
  const ids = ['htn', 'dm', 'pad', 'mi', 'smoke', 'prior'], need = ids.filter(id => !known(id));
  const heart = yes('cvdother') || yes('chf') ? 1 : known('cvdother') && known('chf') ? 0 : null;
  if (heart == null) need.push('cvdother');
  if (need.length) return { need };
  return { score: (a < 65 ? 0 : a <= 75 ? 1 : 2) + ids.filter(yes).length + heart };
}
// Kết quả để vẽ màn: level (có mức), need (còn câu hỏi), wait (chờ phía bác sĩ), na (chưa có thang)
function riskResult(p, ms) {
  const pl = riskPlan(p, ms);
  if (!pl.ids.length) return { state: 'na', why: pl.reason };
  const remain = riskRemaining(p, ms);
  if (remain.length) return { state: 'need', remain };
  if (p.stroke === false) return p.fsrp == null ? { state: 'wait' } : { state: 'level', scale: 'fsrp', key: riskLevelOf('fsrp', p.fsrp) };
  const e = esrsScore(p, ms);
  // Còn câu trả lời "chưa rõ": chờ phía bác sĩ xem, giống FSRP chưa có số
  return e.need ? { state: 'wait' } : { state: 'level', scale: 'esrs', key: riskLevelOf('esrs', e.score) };
}

// ---- Tỷ lệ chưa dùng = số lần chưa dùng ÷ số lần cần dùng trong kỳ (7, 30 ngày). Tính chung hoặc cho một thuốc. ----
function missRate(p, days, ms, times, medId) {
  const a = adherence(medId ? { meds: p.meds.filter(m => m.id === medId), doses: p.doses } : p, days, ms, times);
  return { due: a.due, not: a.due - a.taken };
}
