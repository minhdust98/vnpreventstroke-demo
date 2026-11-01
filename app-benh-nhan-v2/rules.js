'use strict';
// Quy tắc đánh giá số đo. Mức "tốt" theo BRD v6. Mức nghi nhập sai và mức nguy hiểm là ĐỀ XUẤT, chờ bác sĩ duyệt.

const TH = {
  bp: { sysMin: 60, sysMax: 260, diaMin: 30, diaMax: 160, goodSys: 130, goodDia: 80, veryHighSys: 180, veryHighDia: 120, lowSys: 90, lowDia: 60 },
  glu: { min: 1, max: 40, low: 3.9, goodFasting: 5.6, veryHigh: 16.7, critical: 33.3 },
  weight: { min: 35, max: 200 },
  height: { min: 120, max: 210 },
  year: { min: 1920, maxAge: 15 },
};

const MOL_TO_MG = 18;

// Câu chữ đúng nguyên văn BRD v6
const BRD = {
  bpGood: 'Tuyệt vời! Huyết áp của bạn đang được kiểm soát rất tốt. Hãy duy trì lối sống lành mạnh này nhé!',
  bpImprove: 'Chỉ số huyết áp của bạn hơi cao. Hãy theo dõi thường xuyên và tham khảo ý kiến bác sĩ để có hướng dẫn phù hợp.',
  alcoholGood: 'Bạn đang có một thói quen sử dụng rượu bia rất tốt hoặc không sử dụng. Điều này rất có lợi cho sức khỏe tổng thể.',
  alcoholImprove: 'Việc giảm lượng rượu bia có thể mang lại nhiều lợi ích cho sức khỏe của bạn. Hãy cân nhắc điều chỉnh thói quen này.',
  smokeGood: 'Chúc mừng bạn đã không hút thuốc! Đây là một trong những quyết định tốt nhất cho sức khỏe của bạn.',
  smokeImprove: 'Bỏ thuốc lá là một trong những hành động quan trọng nhất để giảm nguy cơ đột quỵ và các bệnh lý khác. Chúng tôi có thể cung cấp thông tin và hỗ trợ nếu bạn muốn bỏ thuốc.',
  activeGood: 'Bạn đang rất năng động! Duy trì hoạt động thể chất thường xuyên giúp tăng cường sức khỏe và giảm nguy cơ bệnh tật.',
  activeImprove: 'Hãy cố gắng tăng cường vận động hơn nữa để cải thiện sức khỏe tim mạch và giảm nguy cơ đột quỵ.',
  medGood: 'Bạn đang tuân thủ điều trị rất tốt! Điều này đóng vai trò quan trọng trong việc ngăn ngừa tái phát đột quỵ.',
  medImprove: 'Việc tuân thủ đúng chỉ định của bác sĩ là rất quan trọng sau đột quỵ. Hãy cố gắng uống thuốc đều đặn nhé. Bạn có thể sử dụng tính năng nhắc nhở của ứng dụng.',
  thanks: 'Xin chân thành cảm ơn đánh giá của bạn.',
};

const STATUS = {
  good: { label: 'Tốt', tone: 'green', icon: 'check' },
  improve: { label: 'Cần cải thiện', tone: 'amber', icon: 'up' },
  high: { label: 'Rất cao', tone: 'amber', icon: 'alert' },
  low: { label: 'Thấp', tone: 'amber', icon: 'alert' },
  none: { label: 'Chưa có', tone: 'muted', icon: 'dash' },
};

function bpStatus(sys, dia) {
  const t = TH.bp;
  if (sys >= t.veryHighSys || dia >= t.veryHighDia) return 'high';
  if (sys < t.lowSys || dia < t.lowDia) return 'low';
  if (sys < t.goodSys && dia < t.goodDia) return 'good';
  return 'improve';
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

function bmiOf(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

// Ngưỡng BMI của Bộ Y tế ghi trong BRD
function bmiStatus(b) {
  if (b == null) return { key: 'none', word: 'Chưa có' };
  if (b < 18.5) return { key: 'improve', word: 'Thiếu cân' };
  if (b < 23) return { key: 'good', word: 'Bình thường' };
  if (b < 25) return { key: 'improve', word: 'Thừa cân' };
  if (b < 30) return { key: 'improve', word: 'Béo phì độ 1' };
  return { key: 'improve', word: 'Béo phì độ 2' };
}

function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }

// Trung bình 7 ngày gần nhất và 7 ngày trước đó. Dưới 4 lần đo thì chưa nói xu hướng.
function bpTrend(readings, nowMs) {
  const DAY = 864e5;
  const last = readings.filter(r => r.t <= nowMs && r.t > nowMs - 7 * DAY);
  const prev = readings.filter(r => r.t <= nowMs - 7 * DAY && r.t > nowMs - 14 * DAY);
  const res = { count: last.length };
  if (last.length) {
    res.sys = Math.round(mean(last.map(r => r.sys)));
    res.dia = Math.round(mean(last.map(r => r.dia)));
  }
  if (last.length >= 4 && prev.length >= 4) {
    res.prevSys = Math.round(mean(prev.map(r => r.sys)));
    res.delta = res.sys - res.prevSys;
  }
  return res;
}

function bpTrendSentence(tr) {
  if (tr.count < 4) return 'Thêm vài lần đo nữa, app sẽ cho bạn thấy xu hướng.';
  const base = `Trung bình 7 ngày ${tr.sys}/${tr.dia}`;
  if (tr.delta == null) return `${base}.`;
  if (tr.delta <= -2) return `${base}, thấp hơn tuần trước ${-tr.delta} điểm.`;
  if (tr.delta >= 2) return `${base}, cao hơn tuần trước ${tr.delta} điểm.`;
  return `${base}, gần như tuần trước.`;
}

// Câu hỏi nguy cơ. Lời thường, luôn có "Chưa rõ". Kết quả thang chỉ ở phía bác sĩ, app bệnh nhân không tính.
const RISK_Q = {
  htn: { q: 'Bác sĩ có nói bạn bị tăng huyết áp không?', help: 'Hay còn gọi là cao huyết áp.', detail: 'Chọn Có nếu đã được chẩn đoán hoặc đang dùng thuốc hạ áp, kể cả khi huyết áp đã ổn.' },
  bpmed: { q: 'Bạn có đang dùng thuốc hạ áp theo đơn không?', help: 'Là thuốc bác sĩ kê để giảm huyết áp.', detail: 'Câu này hỏi về việc đang dùng thuốc, không phải về chẩn đoán.' },
  sbp: { kind: 'num', q: 'Số trên của huyết áp gần nhất là bao nhiêu?', help: 'Ví dụ máy hiện 140/60 thì nhập 140.', detail: 'Bác sĩ gọi là huyết áp tâm thu. Sau này bạn đo trong app thì số này tự cập nhật.' },
  confirm: { q: 'Những thông tin vừa rồi đã được bác sĩ hoặc hồ sơ y tế xác nhận chưa?', help: 'Ví dụ giấy ra viện, đơn thuốc, hoặc bác sĩ đã nói với bạn.', detail: 'Chưa có cũng không sao, bác sĩ sẽ xem lại khi bạn đi khám.', opts: [['yes', 'Rồi'], ['unknown', 'Chưa đủ thông tin']] },
  sex: { q: 'Giới tính sinh học của bạn là gì?', help: 'Dùng để bác sĩ đánh giá đúng hơn.', detail: 'Chỉ dùng cho việc đánh giá của bác sĩ, không hiện cho người khác.', opts: [['male', 'Nam'], ['female', 'Nữ'], ['other', 'Khác']] },
  smoke: { q: 'Trong 30 ngày qua, bạn có hút thuốc không?', help: 'Tính cả thuốc lá và thuốc lào.', detail: 'Hút thuốc là yếu tố bạn tự thay đổi được.' },
  dm: { q: 'Bác sĩ có nói bạn bị đái tháo đường không?', help: 'Còn gọi là tiểu đường.', detail: 'Chọn Có nếu đã được chẩn đoán hoặc đang dùng thuốc, kể cả khi đường huyết đã ổn.' },
  cvd: { q: 'Bạn có bệnh tim mạch đã được bác sĩ chẩn đoán không?', help: 'Ví dụ bệnh mạch vành, suy tim, hẹp động mạch ở chân.', detail: 'Không tính rung nhĩ, sẽ hỏi ở câu riêng.' },
  af: { q: 'Bác sĩ có nói bạn bị rung nhĩ không?', help: 'Rung nhĩ là khi tim đập không đều.', detail: 'Chọn Có nếu đã được chẩn đoán, đang điều trị, hoặc từng thấy trên điện tâm đồ.' },
  prior: { q: 'Trước lần đột quỵ này, bạn từng bị đột quỵ hoặc cơn thoáng qua chưa?', help: 'Cơn thoáng qua là yếu tay chân, nói khó rồi tự hết.', detail: 'Bác sĩ gọi là TIA, hoặc cơn thiếu máu não thoáng qua.' },
  pad: { q: 'Bác sĩ có nói bạn bị hẹp động mạch ở chân không?', help: 'Dấu hiệu thường gặp là đau bắp chân khi đi bộ, nghỉ thì đỡ.', detail: 'Bác sĩ gọi là bệnh động mạch ngoại biên.' },
  mi: { q: 'Bạn đã từng bị nhồi máu cơ tim chưa?', help: 'Hay còn gọi là cơn đau tim.', detail: 'Tính cả khi đã điều trị xong.' },
  cvdother: { q: 'Bạn có bệnh tim khác không?', help: 'Không tính nhồi máu cơ tim và rung nhĩ.', detail: 'Ví dụ bệnh mạch vành, bệnh van tim.' },
  chf: { q: 'Bác sĩ có nói bạn bị suy tim không?', help: 'Dấu hiệu thường gặp là khó thở, phù chân.', detail: 'Bác sĩ gọi là suy tim sung huyết.' },
};

// Lấy từ dữ liệu sẵn có để không hỏi lại. Ô trống không được hiểu là "Không".
function hasMedGroup(p, g) { return p.meds.some(m => m.group === g && !m.paused); }
function factOf(p, id) {
  const x = p.facts[id];
  if (x && x.v != null) return x.v;
  if ((id === 'htn' || id === 'bpmed') && hasMedGroup(p, 'bp')) return 'yes';
  if (id === 'dm' && hasMedGroup(p, 'dm')) return 'yes';
  if (id === 'sbp' && p.bp.length) return 'have';
  return null;
}

// Bộ câu theo chỉ thị mục 5: FSRP 2017 từ 55 tuổi; ESRS và SPI-II sau đột quỵ thiếu máu hoặc TIA.
function riskPlan(p, nowMs) {
  const age = new Date(nowMs).getFullYear() - p.birthYear;
  if (p.stroke === false) {
    if (age < 55) return { scales: [], ids: [], reason: 'under55' };
    return { scales: ['FSRP 2017'], ids: ['sex', 'sbp', 'bpmed', 'smoke', 'dm', 'cvd', 'af', 'confirm'] };
  }
  if (p.strokeType === 'ischemic' || p.strokeType === 'tia') {
    return { scales: ['ESRS', 'SPI-II'], ids: ['htn', 'dm', 'smoke', 'prior', 'mi', 'chf', 'cvdother', 'pad'] };
  }
  if (p.strokeType === 'hemorrhage') return { scales: [], ids: [], reason: 'hemorrhage' };
  return { scales: [], ids: [], reason: 'unknownType' };
}

// Đầu vào mỗi thang, để phần "phía bác sĩ" liệt kê đủ và chỉ ra chỗ thiếu. Demo không tính điểm.
const SCALE_INPUTS = {
  'FSRP 2017': ['Tiền sử đột quỵ/TIA', 'Tuổi', 'Giới tính', 'Huyết áp tâm thu', 'Điều trị hạ áp', 'Hút thuốc', 'Đái tháo đường', 'Bệnh tim mạch', 'Rung nhĩ', 'Bác sĩ hoặc hồ sơ xác nhận'],
  ESRS: ['Tuổi', 'Tăng huyết áp', 'Đái tháo đường', 'Bệnh động mạch ngoại biên', 'Nhồi máu cơ tim', 'Bệnh tim mạch khác', 'Hút thuốc', 'TIA/đột quỵ trước đó'],
  'SPI-II': ['Tuổi', 'Tăng huyết áp', 'Đái tháo đường', 'Tiền sử nhồi máu não/TIA', 'Loại biến cố', 'Nhồi máu cơ tim', 'Bệnh tim mạch khác', 'Suy tim sung huyết'],
};

// Nhãn đầu vào của thang -> câu hỏi tương ứng trong app
const SCALE_FACT = { 'Giới tính': 'sex', 'Điều trị hạ áp': 'bpmed', 'Hút thuốc': 'smoke', 'Đái tháo đường': 'dm', 'Bệnh tim mạch': 'cvd', 'Rung nhĩ': 'af', 'Bác sĩ hoặc hồ sơ xác nhận': 'confirm', 'Tăng huyết áp': 'htn', 'Bệnh động mạch ngoại biên': 'pad', 'Nhồi máu cơ tim': 'mi', 'Bệnh tim mạch khác': 'cvdother', 'TIA/đột quỵ trước đó': 'prior', 'Tiền sử nhồi máu não/TIA': 'prior', 'Suy tim sung huyết': 'chf' };
const SCALE_VERSION = { 'FSRP 2017': 'Dufouil_2017', ESRS: 'ESRS', 'SPI-II': 'SPI-II' };
// Tiền sử bệnh chỉ dùng khi đã được bác sĩ hoặc hồ sơ xác nhận (file câu hỏi thang điểm, slide 16)
const NEEDS_CONFIRM = ['dm', 'htn', 'cvd', 'af', 'prior', 'pad', 'mi', 'cvdother', 'chf'];

// Nhóm người bệnh để chọn nội dung theo dõi
function careGroup(p, nowMs) {
  if (p.stroke === false) return new Date(nowMs).getFullYear() - p.birthYear >= 55 ? 'pri55' : 'priYoung';
  if (p.strokeType === 'hemorrhage') return 'secHem';
  if (p.strokeType === 'ischemic' || p.strokeType === 'tia') return 'secIsch';
  return 'secUnknown';
}
const CARE_INTRO = {
  secIsch: { title: 'Phòng đột quỵ tái phát', why: 'Bạn đã từng bị nhồi máu não hoặc cơn thoáng qua. Việc quan trọng nhất bây giờ là phòng lần sau.' },
  secHem: { title: 'Phòng chảy máu não tái phát', why: 'Bạn đã từng bị chảy máu não. Giữ huyết áp trong mục tiêu là việc quan trọng nhất.' },
  secUnknown: { title: 'Phòng đột quỵ tái phát', why: 'Bạn đã từng bị đột quỵ. Việc quan trọng nhất bây giờ là phòng lần sau.' },
  pri55: { title: 'Phòng đột quỵ lần đầu', why: 'Bạn chưa từng bị đột quỵ. Mục tiêu là kiểm soát các yếu tố nguy cơ.' },
  priYoung: { title: 'Phòng đột quỵ từ sớm', why: 'Bạn chưa từng bị đột quỵ và chưa cần theo dõi gì hằng ngày. Xây thói quen tốt từ bây giờ là đủ.' },
};
const CARE_READ = { secIsch: ['meds', 'signs', 'rehab'], secHem: ['bp', 'meds', 'signs'], secUnknown: ['meds', 'signs', 'rehab'], pri55: ['bp', 'food', 'move'], priYoung: ['signs', 'food', 'move'] };
// Mục tiêu LDL: nhóm tiên phát theo BRD (2,6). Nhóm sau nhồi máu não/TIA theo bản nhận xét TestFlight (AHA/ASA 2021), chờ bác sĩ chốt.
function ldlGoal(p, nowMs) { return careGroup(p, nowMs) === 'secIsch' ? 1.8 : 2.6; }
