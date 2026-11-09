'use strict';
// Nội dung hiển thị trong app: danh mục, câu chữ BRD v6, câu hỏi và bài học.
// Nội dung y khoa ở đây là bản mẫu, chờ bác sĩ và kỹ thuật viên phục hồi chức năng duyệt.

// Cờ bật tắt. Bước 1 ẩn các phần chưa làm: code vẫn còn, đổi true để bật lại.
// sos: nút 115 trên mọi màn, sheet 115 và thẻ cấp cứu. exercises: bài tập phục hồi và câu "Đi lại". plan: kế hoạch theo dõi tự đề xuất.
// hba1c, egfr: hai xét nghiệm chưa theo dõi ở bước 1. deviceLink: máy đo huyết áp kết nối.
// missedHelp: hướng dẫn khi quên liều và nút gọi bác sĩ, dược sĩ. Bước 1 chỉ ghi nhận quên, chờ bác sĩ chốt việc xử lý.
const FEATURES = { sos: false, exercises: false, plan: false, hba1c: false, egfr: false, deviceLink: false, missedHelp: false };

const MOMENTS = [
  { key: 'sang', label: 'Sáng', time: '07:00' },
  { key: 'trua', label: 'Trưa', time: '12:00' },
  { key: 'chieu', label: 'Chiều', time: '17:00' },
  { key: 'toi', label: 'Tối', time: '20:00' },
];

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

// Nhóm thuốc theo BRD
const MED_CATALOG = [
  { group: 'bp', label: 'Thuốc giảm huyết áp', items: [['Amlodipine', ['5 mg', '10 mg']], ['Losartan', ['50 mg', '100 mg']], ['Perindopril', ['5 mg', '10 mg']], ['Bisoprolol', ['2,5 mg', '5 mg']], ['Indapamide', ['1,5 mg']]] },
  { group: 'anticoag', label: 'Thuốc chống đông', items: [['Apixaban', ['2,5 mg', '5 mg']], ['Rivaroxaban', ['15 mg', '20 mg']], ['Dabigatran', ['110 mg', '150 mg']], ['Edoxaban', ['30 mg', '60 mg']], ['Sintrom', ['1 mg', '4 mg']]] },
  { group: 'antiplatelet', label: 'Thuốc kháng ngưng tập tiểu cầu', items: [['Aspirin', ['81 mg', '100 mg']], ['Clopidogrel', ['75 mg']], ['DuoPlavin', ['75/100 mg']]] },
  { group: 'lipid', label: 'Thuốc giảm mỡ máu', items: [['Atorvastatin', ['10 mg', '20 mg', '40 mg']], ['Rosuvastatin', ['10 mg', '20 mg']], ['Ezetimibe', ['10 mg']], ['Fenofibrate', ['145 mg', '200 mg']]] },
  { group: 'dm', label: 'Thuốc tiểu đường', items: [['Metformin', ['500 mg', '850 mg']], ['Insulin', ['Theo bác sĩ dặn']], ['Sitagliptin', ['100 mg']], ['Empagliflozin', ['10 mg']]] },
  { group: 'epilepsy', label: 'Thuốc chống động kinh', items: [['Valproat', ['500 mg']], ['Phenytoin', ['100 mg']], ['Phenobarbital', ['100 mg']], ['Oxcarbazepine', ['300 mg']]] },
  { group: 'anxiety', label: 'Thuốc chống lo âu', items: [['Alprazolam', ['0,25 mg']], ['Diazepam', ['5 mg']], ['Clonazepam', ['0,5 mg']], ['Lorazepam', ['1 mg']]] },
];
const DOSES = ['½ viên', '1 viên', '2 viên', '1 mũi tiêm'];
const DURATIONS = [[7, '7 ngày'], [30, '30 ngày'], [90, '90 ngày'], [0, 'Dài hạn']];
const MED_NOTES = ['Trước ăn', 'Sau ăn', 'Khi đói'];
const ROUTES = ['Uống', 'Tiêm', 'Ngậm dưới lưỡi', 'Khác'];

// Xét nghiệm. Ngưỡng đánh giá nằm trong rules.js (labStatus).
const LABS = [
  { id: 'ldl', name: 'LDL', unit: 'mmol/L', min: 0.3, max: 15 },
  { id: 'tc', name: 'Cholesterol toàn phần', unit: 'mmol/L', min: 1, max: 20 },
  { id: 'hdl', name: 'HDL', unit: 'mmol/L', min: 0.2, max: 5 },
  { id: 'tg', name: 'Triglyceride', unit: 'mmol/L', min: 0.2, max: 50 },
  { id: 'a1c', name: 'HbA1c', unit: '%', min: 3, max: 20 },
  { id: 'fpg', name: 'Đường huyết lúc đói', unit: 'mmol/L', min: 1, max: 40 },
  { id: 'egfr', name: 'eGFR', unit: 'mL/phút', min: 1, max: 200 },
];
const labOn = l => !((l.id === 'a1c' && !FEATURES.hba1c) || (l.id === 'egfr' && !FEATURES.egfr));
// Kết quả mô phỏng khi chụp phiếu xét nghiệm
const SCAN_SAMPLE = { date: '2026-10-28', values: { ldl: 2.4, tc: 4.9, hdl: 1.1, tg: 1.8, a1c: 5.6 } };

// Câu hỏi cho các thang FSRP 2017, ESRS, SPI-II (file "Câu hỏi cho thang điểm", 15/09/2026), viết lại bằng lời thường
const RISK_Q = {
  htn: { short: 'Tăng huyết áp', q: 'Bác sĩ có nói bạn bị tăng huyết áp (cao huyết áp) không?', why: 'Chọn Có nếu đã được chẩn đoán hoặc đang dùng thuốc hạ áp, kể cả khi huyết áp đã ổn.' },
  bpmed: { short: 'Thuốc hạ áp', q: 'Bạn có đang dùng thuốc hạ áp theo đơn không?', why: 'Câu này hỏi về việc đang dùng thuốc, không phải về chẩn đoán.' },
  sbp: { short: 'Huyết áp gần nhất', kind: 'bp', q: 'Huyết áp lần đo gần nhất?', why: 'Bác sĩ dùng số trên (huyết áp tâm thu). Khi bạn đo trong app, số này tự cập nhật.' },
  confirm: { short: 'Đã được xác nhận', q: 'Các câu trả lời vừa rồi đã được bác sĩ hoặc giấy khám xác nhận chưa?', why: 'Ví dụ giấy ra viện, đơn thuốc, hoặc bác sĩ đã nói với bạn. Chưa có cũng không sao, bác sĩ sẽ xem lại khi khám.', opts: [['yes', 'Rồi'], ['unknown', 'Chưa']] },
  sex: { short: 'Giới tính', q: 'Giới tính sinh học?', why: 'Chỉ dùng cho đánh giá của bác sĩ.', opts: [['male', 'Nam'], ['female', 'Nữ'], ['other', 'Khác']] },
  smoke: { short: 'Hút thuốc', q: 'Trong 30 ngày qua, bạn có hút thuốc lá hoặc thuốc lào không?', why: 'Hút thuốc là yếu tố bạn tự thay đổi được.' },
  dm: { short: 'Đái tháo đường', q: 'Bác sĩ có nói bạn bị đái tháo đường (tiểu đường) không?', why: 'Chọn Có nếu đã được chẩn đoán hoặc đang dùng thuốc, kể cả khi đường huyết đã ổn.' },
  cvd: { short: 'Bệnh tim mạch', q: 'Bạn có bệnh mạch vành, suy tim hoặc hẹp động mạch chân không?', why: 'Không tính rung nhĩ, sẽ hỏi ở câu riêng.' },
  af: { short: 'Rung nhĩ', q: 'Bác sĩ có nói bạn bị rung nhĩ (tim đập không đều) không?', why: 'Chọn Có nếu đã được chẩn đoán, đang điều trị, hoặc từng thấy trên điện tâm đồ.' },
  prior: { short: 'Đột quỵ trước đó', q: 'Trước lần đột quỵ này, bạn từng bị đột quỵ hoặc cơn thoáng qua chưa?', why: 'Cơn thoáng qua (TIA) là yếu tay chân, nói khó rồi tự hết.' },
  pad: { short: 'Hẹp động mạch chân', q: 'Bác sĩ có nói bạn bị hẹp động mạch chân (đau bắp chân khi đi, nghỉ thì đỡ) không?', why: 'Bác sĩ gọi là bệnh động mạch ngoại biên.' },
  mi: { short: 'Nhồi máu cơ tim', q: 'Bạn từng bị nhồi máu cơ tim (cơn đau tim) chưa?', why: 'Tính cả khi đã điều trị xong.' },
  cvdother: { short: 'Bệnh tim khác', q: 'Bạn có bệnh tim khác, ngoài nhồi máu cơ tim và rung nhĩ, không?', why: 'Ví dụ bệnh mạch vành, bệnh van tim.' },
  chf: { short: 'Suy tim', q: 'Bác sĩ có nói bạn bị suy tim không?', why: 'Dấu hiệu thường gặp là khó thở, phù chân.' },
};
const YES_NO_UNSURE = [['yes', 'Có'], ['no', 'Không'], ['unknown', 'Chưa rõ']];

// Tiền sử bệnh theo danh mục BRD v6. Câu trả lời chung kho với câu hỏi thang (p.facts).
const YN = ['Có', 'Không'];
const CONDITIONS = [
  { id: 'htn', name: 'Tăng huyết áp', qs: [{ k: 'year', t: 'Năm chẩn đoán', type: 'year' }, { k: 'maxSys', t: 'Số trên cao nhất từng đo', type: 'num', unit: 'mmHg', min: 60, max: 300 }, { k: 'maxDia', t: 'Số dưới cao nhất từng đo', type: 'num', unit: 'mmHg', min: 30, max: 200 }, { k: 'treat', t: 'Đang điều trị', opts: YN }, { k: 'watch', t: 'Thường tự đo huyết áp', opts: ['Có', 'Không', 'Thỉnh thoảng'] }] },
  { id: 'heart', name: 'Tim mạch', qs: [{ k: 'kinds', t: 'Loại bệnh', multi: ['Bệnh mạch vành', 'Suy tim', 'Bệnh van tim', 'Rối loạn nhịp tim khác'] }, { k: 'pad', t: 'Hẹp động mạch chân', opts: YN }, { k: 'carotid', t: 'Hẹp động mạch cảnh', opts: YN }, { k: 'ecg', t: 'Điện tâm đồ bất thường', opts: YN }, { k: 'year', t: 'Năm chẩn đoán', type: 'year' }, { k: 'treat', t: 'Đang điều trị', opts: YN }] },
  { id: 'dm', name: 'Đái tháo đường', qs: [{ k: 'year', t: 'Năm phát hiện', type: 'year' }, { k: 'fpg', t: 'Đường huyết lúc đói gần nhất', type: 'num', unit: 'mmol/L', min: 1, max: 40 }, { k: 'a1c', t: 'HbA1c gần nhất', type: 'num', unit: '%', min: 3, max: 20 }, { k: 'freq', t: 'Đo đường huyết', opts: ['Hằng ngày', 'Thỉnh thoảng', 'Không'] }, { k: 'treat', t: 'Đang dùng thuốc', opts: YN }] },
  { id: 'lipid', name: 'Rối loạn mỡ máu', qs: [{ k: 'year', t: 'Năm chẩn đoán', type: 'year' }, { k: 'ldl', t: 'LDL cao nhất', type: 'num', unit: 'mmol/L', min: 0.5, max: 15 }, { k: 'hdl', t: 'HDL', type: 'num', unit: 'mmol/L', min: 0.2, max: 5 }, { k: 'tg', t: 'Triglyceride cao nhất', type: 'num', unit: 'mmol/L', min: 0.2, max: 50 }, { k: 'tc', t: 'Cholesterol toàn phần cao nhất', type: 'num', unit: 'mmol/L', min: 1, max: 20 }, { k: 'treat', t: 'Đang điều trị', opts: YN }] },
  { id: 'af', name: 'Rung nhĩ', qs: [{ k: 'year', t: 'Năm chẩn đoán', type: 'year' }, { k: 'kind', t: 'Loại rung nhĩ', opts: ['Kịch phát', 'Dai dẳng', 'Mạn tính', 'Không rõ'] }, { k: 'valve', t: 'Do bệnh van tim', opts: ['Không', 'Có', 'Không rõ'] }, { k: 'treat', t: 'Đang điều trị', opts: YN }] },
  { id: 'kidney', name: 'Bệnh thận', qs: [{ k: 'level', t: 'Mức độ', opts: ['Nhẹ', 'Vừa', 'Nặng', 'Không rõ'] }, { k: 'gfr', t: 'GFR', type: 'num', unit: 'mL/phút', min: 1, max: 200 }, { k: 'dialysis', t: 'Đang chạy thận nhân tạo', opts: YN }] },
  { id: 'memory', name: 'Trí nhớ và tinh thần', qs: [{ k: 'decline', t: 'Suy giảm trí nhớ', opts: YN }, { k: 'stress', t: 'Gần đây rất căng thẳng', opts: YN }, { k: 'dx', t: 'Đã được chẩn đoán bệnh trí nhớ', opts: YN }] },
  { id: 'apnea', name: 'Ngưng thở khi ngủ', qs: [{ k: 'dx', t: 'Đã được chẩn đoán', opts: YN }, { k: 'snore', t: 'Ngáy hoặc ban ngày buồn ngủ nhiều', opts: YN }] },
  { id: 'family', name: 'Người thân đột quỵ hoặc bệnh tim trước 60 tuổi', qs: [{ k: 'kinds', t: 'Cha mẹ, anh chị em ruột từng bị', multi: ['Đột quỵ', 'Bệnh tim mạch', 'Tăng huyết áp', 'Đái tháo đường', 'Rối loạn mỡ máu'] }] },
];
const DRUG_HISTORY = [
  { id: 'anticoag', name: 'Thuốc chống đông', opts: ['Có', 'Đã từng', 'Không'] },
  { id: 'antiplatelet', name: 'Thuốc kháng ngưng tập tiểu cầu', opts: ['Có', 'Không'] },
];
const STROKE_TYPES = [['ischemic', 'Nhồi máu não (tắc mạch)'], ['hemorrhage', 'Chảy máu não (vỡ mạch)'], ['tia', 'Cơn thoáng qua (TIA)'], ['unknown', 'Không nhớ']];
const MOBILITY = [['bed', 'Nằm'], ['sit', 'Ngồi'], ['stand', 'Đứng']];

// Thói quen. Câu khích lệ theo BRD.
const HABITS = {
  activity: { icon: 'walk', name: 'Vận động', opts: [['strong', 'Từ 1,5 giờ vận động mạnh mỗi tuần'], ['good', 'Từ 2,5 giờ vận động nhẹ mỗi tuần'], ['little', 'Không thường xuyên'], ['none', 'Không']], good: v => v === 'good' || v === 'strong', okText: BRD.activeGood, badText: BRD.activeImprove, words: ['Đủ', 'Chưa đủ'] },
  smoke: { icon: 'smoke', name: 'Hút thuốc', opts: [['none', 'Không hút'], ['little', 'Ít'], ['mid', 'Vừa'], ['much', 'Nhiều, từ 1 gói mỗi ngày']], good: v => v === 'none', okText: BRD.smokeGood, badText: BRD.smokeImprove, words: ['Không', 'Có'] },
  alcohol: { icon: 'glass', name: 'Rượu bia', opts: [['none', 'Không uống'], ['little', 'Ít'], ['mid', 'Vừa'], ['much', 'Nhiều, từ 4-5 ly mỗi dịp']], good: v => v === 'none' || v === 'little', okText: BRD.alcoholGood, badText: BRD.alcoholImprove, words: ['Ít', 'Nhiều'] },
  diet: { icon: 'leaf', name: 'Ăn uống', opts: [['yes', 'Lành mạnh'], ['no', 'Chưa lành mạnh'], ['unknown', 'Không rõ']], good: v => v === 'yes', okText: 'Bạn đang ăn uống rất tốt. Hãy tiếp tục nhé!', badText: 'Thử giảm dần món mặn, ngọt và nhiều dầu mỡ. Mỗi thay đổi nhỏ đều có ích.', words: ['Tốt', 'Chưa tốt'] },
};
const DIET_GOOD = ['Nhiều rau, trái cây, các loại hạt, đậu, ngũ cốc nguyên hạt', 'Dầu thực vật là nguồn chất béo chính', 'Ăn cá thường xuyên', 'Ít thịt đỏ, ít đồ chế biến sẵn', 'Sữa và sản phẩm từ sữa vừa phải'];
const DIET_BAD = ['Ăn mặn', 'Ăn nhiều đồ ngọt', 'Ăn nhiều dầu mỡ'];

// Một câu mỗi tuần, có chọn sẵn
const WEEKLY = {
  activity: { q: 'Tuần này bạn vận động thế nào?', opts: [['good', 'Từ 2,5 giờ trở lên'], ['little', 'Không thường xuyên'], ['none', 'Không']] },
  diet: { q: 'Tuần này bạn có ăn mặn, ngọt hoặc nhiều dầu mỡ không?', opts: [['yes', 'Ít'], ['no', 'Khá nhiều']] },
  alcohol: { q: 'Tuần này bạn uống rượu bia thế nào?', opts: [['none', 'Không uống'], ['little', 'Ít'], ['mid', 'Vừa'], ['much', 'Nhiều']] },
};

// BE FAST. FAST là bốn chữ F, A, S, T.
const BEFAST = [
  { k: 'B', name: 'Thăng bằng', text: 'Đột ngột chóng mặt, mất thăng bằng, đi loạng choạng.', icon: 'balance' },
  { k: 'E', name: 'Mắt', text: 'Đột ngột mờ mắt, mất thị lực hoặc nhìn đôi.', icon: 'eye' },
  { k: 'F', name: 'Mặt', text: 'Méo miệng, một bên mặt xệ xuống khi cười.', icon: 'face', fast: true },
  { k: 'A', name: 'Tay', text: 'Một bên tay hoặc chân yếu, tê, không giơ lên được.', icon: 'arm', fast: true },
  { k: 'S', name: 'Lời nói', text: 'Nói ngọng, khó nói hoặc không hiểu người khác nói.', icon: 'speech', fast: true },
  { k: 'T', name: 'Thời gian', text: 'Gọi 115 ngay. Ghi lại giờ bắt đầu có dấu hiệu.', icon: 'clock', fast: true },
];
const HEADACHE = 'Đau đầu dữ dội, khác thường';
const SYMPTOMS = ['Mất thăng bằng, chóng mặt', 'Mờ mắt, mất thị lực', 'Méo miệng', 'Yếu hoặc tê một bên', 'Nói khó, nói ngọng', HEADACHE];

// Hồ sơ ban đầu: hỏi ngay khi khai báo để phân loại sớm và để bác sĩ mở hồ sơ là có đủ.
// Mọi câu đều bỏ qua được. Ô trống không bao giờ được hiểu là "Không". Người đã nối hồ sơ bệnh viện không bị hỏi lại phần bệnh viện đã có.
const HOSPITAL_KNOWN = ['htn', 'dm', 'cvd', 'af'];
const INTAKE_FAMILY = ['Đột quỵ', 'Bệnh tim mạch', 'Tăng huyết áp', 'Đái tháo đường', 'Rối loạn mỡ máu'];
const INTAKE = [
  { title: 'Bệnh nền', other: 'cond', qs: [{ k: 'fact', id: 'htn' }, { k: 'fact', id: 'dm' }, { k: 'fact', id: 'lipid', q: 'Bác sĩ có nói bạn bị rối loạn mỡ máu (mỡ máu cao) không?' }, { k: 'fact', id: 'kidney', q: 'Bác sĩ có nói bạn bị bệnh thận không?' }] },
  { title: 'Tim mạch', other: 'heart', qs: [{ k: 'fact', id: 'cvd' }, { k: 'fact', id: 'af' }, { k: 'drug', id: 'anticoag', q: 'Bạn có đang dùng thuốc chống đông không?', opts: ['Có', 'Đã từng', 'Không'] }] },
  { title: 'Sinh hoạt', other: 'life', qs: [{ k: 'habit', id: 'smoke' }, { k: 'habit', id: 'alcohol' }, { k: 'habit', id: 'activity' }, { k: 'fact', id: 'apnea', q: 'Bạn có hay ngáy to hoặc ngừng thở khi ngủ không?' }] },
  { title: 'Gia đình', other: 'family', qs: [{ k: 'fact', id: 'family', q: 'Cha mẹ, anh chị em ruột có ai bị đột quỵ hoặc bệnh tim trước 60 tuổi không?' }, { k: 'multi', id: 'familyKinds', q: 'Cha mẹ, anh chị em ruột có ai từng bị:', opts: INTAKE_FAMILY, none: 'Không ai', unknown: 'Chưa rõ' }] },
  { title: 'Triệu chứng', other: 'symptoms', qs: [{ k: 'multi', id: 'symptoms', q: 'Trong 3 tháng qua, bạn có từng bị:', opts: SYMPTOMS, none: 'Không có', unknown: 'Không nhớ' }] },
];
// Ô "Khác" ở mỗi nhóm: chữ tự do, tối đa 200 ký tự. Bệnh khác dùng chung p.otherConditions; các ô còn lại nằm ở p.intake.other.
const OTHER_LABEL = { cond: 'Bệnh khác', heart: 'Tim mạch khác', life: 'Sinh hoạt khác', family: 'Gia đình khác', symptoms: 'Triệu chứng khác' };
// Giá trị ngắn của thói quen, để dòng tóm tắt gọn
const HABIT_SHORT = { smoke: { none: 'Không', little: 'Ít', mid: 'Vừa', much: 'Nhiều' }, alcohol: { none: 'Không', little: 'Ít', mid: 'Vừa', much: 'Nhiều' }, activity: { strong: 'Mạnh, đủ', good: 'Nhẹ, đủ', little: 'Không thường xuyên', none: 'Không' } };

// Bài tập phục hồi theo khả năng vận động. Mức "Nằm" dành cho người bệnh nặng, cần người nhà hỗ trợ.
const EXERCISE_STOP = 'Dừng tập và báo bác sĩ nếu đau ngực, khó thở, chóng mặt hoặc đau nhiều.';
const EXERCISES = [
  { id: 'turn', level: 'bed', name: 'Đổi tư thế', reps: 'Mỗi 2 giờ', helper: true, steps: ['Lần lượt cho nằm ngửa, nghiêng bên khỏe, nghiêng bên yếu.', 'Kê gối đỡ tay và chân bên yếu.', 'Xem da ở gót chân, mông, lưng có vùng đỏ không.'] },
  { id: 'position', level: 'bed', name: 'Đặt tay chân bên yếu', reps: 'Khi đổi tư thế', helper: true, steps: ['Đặt tay bên yếu lên gối, vai hơi đưa ra trước.', 'Để bàn tay mở, các ngón duỗi.', 'Không kéo tay bên yếu khi đỡ người bệnh dậy.'] },
  { id: 'shoulder', level: 'bed', name: 'Tập vai', reps: '10 lần, 2 lượt mỗi ngày', helper: true, steps: ['Người bệnh nằm ngửa.', 'Một tay đỡ khuỷu, một tay đỡ cổ tay bên yếu.', 'Từ từ đưa tay lên phía đầu tới khi thấy căng nhẹ.', 'Hạ xuống chậm.'] },
  { id: 'elbow', level: 'bed', name: 'Tập khuỷu và cổ tay', reps: '10 lần, 2 lượt mỗi ngày', helper: true, steps: ['Đỡ cánh tay bên yếu.', 'Gập rồi duỗi khuỷu tay thật chậm.', 'Gập và ngửa cổ tay nhẹ nhàng.'] },
  { id: 'fingers', level: 'bed', name: 'Duỗi ngón tay', reps: '10 lần', helper: true, steps: ['Nhẹ nhàng mở từng ngón tay bên yếu.', 'Giữ 5 giây rồi thả.'] },
  { id: 'ankle', level: 'bed', name: 'Tập cổ chân', reps: '15 lần, 3 lượt mỗi ngày', helper: true, steps: ['Gập bàn chân về phía người rồi duỗi ra.', 'Nếu người bệnh chưa tự làm được, người nhà làm giúp.'] },
  { id: 'knee', level: 'bed', name: 'Co duỗi gối', reps: '10 lần, 2 lượt mỗi ngày', helper: true, steps: ['Đỡ dưới gối và gót chân bên yếu.', 'Từ từ co gối lên rồi duỗi thẳng.'] },
  { id: 'bridge', level: 'bed', name: 'Nâng hông', reps: '10 lần', steps: ['Nằm ngửa, co hai gối, bàn chân đặt trên giường.', 'Nâng hông lên, giữ 5 giây.', 'Hạ xuống chậm.'] },
  { id: 'breathe', level: 'bed', name: 'Hít thở sâu', reps: '10 lần, 3 lượt mỗi ngày', steps: ['Hít vào chậm bằng mũi.', 'Giữ 2 giây.', 'Thở ra chậm bằng miệng.'] },
  { id: 'sitBalance', level: 'sit', name: 'Ngồi thăng bằng', reps: '5 phút', helper: true, steps: ['Ngồi mép giường, hai bàn chân chạm sàn.', 'Người nhà đứng cạnh bên yếu.', 'Giữ lưng thẳng, tăng dần thời gian ngồi.'] },
  { id: 'reach', level: 'sit', name: 'Với tay', reps: '10 lần mỗi bên', steps: ['Ngồi vững trên ghế có tựa.', 'Với tay ra trước, rồi sang hai bên.', 'Trở về ngồi thẳng.'] },
  { id: 'squeeze', level: 'sit', name: 'Bóp bóng', reps: '10 lần, 3 lượt mỗi ngày', steps: ['Cầm quả bóng mềm hoặc khăn cuộn bằng tay bên yếu.', 'Bóp chặt, giữ 3 giây rồi thả.'] },
  { id: 'kneeExt', level: 'sit', name: 'Duỗi gối', reps: '10 lần mỗi chân', steps: ['Ngồi trên ghế.', 'Duỗi thẳng một chân, giữ 3 giây.', 'Hạ xuống chậm.'] },
  { id: 'sitStand', level: 'sit', name: 'Đứng lên ngồi xuống', reps: '5 lần', helper: true, steps: ['Ngồi ghế chắc chắn, hai bàn chân chạm sàn.', 'Nghiêng người ra trước rồi đứng lên.', 'Ngồi xuống chậm.'] },
  { id: 'shift', level: 'stand', name: 'Chuyển trọng lượng', reps: '10 lần', steps: ['Đứng vịn thành ghế chắc chắn.', 'Dồn trọng lượng sang chân trái rồi sang chân phải.'] },
  { id: 'heel', level: 'stand', name: 'Nhón gót', reps: '10 lần', steps: ['Đứng vịn thành ghế.', 'Nhón gót lên, giữ 2 giây, hạ xuống.'] },
  { id: 'march', level: 'stand', name: 'Bước tại chỗ', reps: '1 phút', steps: ['Đứng vịn thành ghế.', 'Lần lượt nâng từng gối lên như bước đi.'] },
  { id: 'walk', level: 'stand', name: 'Đi bộ', reps: '5 đến 10 phút', helper: true, steps: ['Đi trên nền phẳng, đủ sáng.', 'Dùng gậy hoặc khung tập nếu được chỉ định.', 'Có người đi cùng khi mới tập.'] },
];

// Bài học. Mỗi chủ đề là một danh sách bài ngắn.
const HOWTO = ['Nghỉ 5 phút, không hút thuốc, uống cà phê, ăn hay tập thể dục trong 30 phút trước khi đo.', 'Ngồi thẳng, tay ngang tim, không bị gò bó, chân đặt trên sàn.', 'Đo 3 lần, mỗi lần cách nhau 1 phút.', 'Ghi lại trung bình 2 lần đo cuối. App tính giúp khi bạn chọn đo 3 lần.', 'Không nói chuyện khi đo.'];
const TOPICS = [
  { id: 'diet', title: 'Ăn uống phòng đột quỵ', icon: 'leaf', items: [
    { id: 'plate', title: 'Đĩa ăn mỗi bữa', body: ['Một nửa là rau.', 'Một phần tư là cơm, ưu tiên gạo lứt hoặc ngũ cốc nguyên hạt.', 'Một phần tư là cá, đậu phụ hoặc thịt nạc.'] },
    { id: 'salt', title: 'Ăn nhạt', body: ['Dưới 5 g muối mỗi ngày, khoảng một thìa cà phê, tính cả nước mắm, bột canh, mì chính.', 'Nêm nhạt khi nấu, chấm ít.', 'Hạn chế dưa cà muối, mắm, đồ hộp, mì gói.'] },
    { id: 'veg', title: 'Rau và trái cây', body: ['Ít nhất 400 g mỗi ngày.', 'Có rau trong mỗi bữa.', 'Ăn trái cây thay đồ ngọt.'] },
    { id: 'fat', title: 'Chất béo', body: ['Dùng dầu thực vật thay mỡ động vật.', 'Ăn cá hai lần mỗi tuần.', 'Hạn chế đồ chiên rán, nội tạng, da gà.'] },
    { id: 'limit', title: 'Nên hạn chế', body: ['Thịt đỏ, giò chả, xúc xích, lạp xưởng.', 'Bánh kẹo, nước ngọt.', 'Rượu bia.'] },
    { id: 'menu', title: 'Thực đơn mẫu một ngày', body: ['Sáng: bánh mì nguyên cám, trứng luộc, sữa không đường.', 'Trưa: cơm gạo lứt, cá hấp, rau luộc, canh rau nêm nhạt.', 'Tối: cơm, đậu phụ sốt cà chua, rau xào ít dầu.', 'Bữa phụ: một quả chuối hoặc một quả cam.'] },
    { id: 'swallow', title: 'Khó nuốt sau đột quỵ', body: ['Ngồi thẳng khi ăn và 30 phút sau khi ăn.', 'Thức ăn mềm, chia nhỏ, từng thìa nhỏ.', 'Không cho ăn khi người bệnh lơ mơ.', 'Ho sặc khi ăn uống: báo bác sĩ để được đánh giá nuốt.'] },
    { id: 'vka', title: 'Khi dùng Sintrom', body: ['Ăn rau xanh đều đặn mỗi ngày, không đột ngột ăn rất nhiều hay bỏ hẳn.', 'Hỏi bác sĩ trước khi dùng thực phẩm chức năng, thuốc nam.'] },
  ] },
  { id: 'meds', title: 'Dùng thuốc an toàn', icon: 'pill', items: [
    { id: 'stop', title: 'Không tự ngừng thuốc', body: ['Thuốc giúp phòng đột quỵ lần sau, kể cả khi bạn thấy khỏe.', 'Chỉ ngừng hoặc đổi liều khi bác sĩ dặn.', 'Sắp hết thuốc: hẹn khám sớm để không bị gián đoạn.'] },
    { id: 'missed', title: 'Quên liều', body: ['Đừng tự dùng bù hay gấp đôi liều.', 'Hỏi bác sĩ hoặc dược sĩ bạn nên làm gì.'], calls: true },
    { id: 'bleed', title: 'Thuốc chống đông', body: ['Báo bác sĩ ngay nếu chảy máu chân răng, chảy máu cam lâu cầm, nước tiểu đỏ, phân đen, bầm tím nhiều.', 'Gọi 115 nếu đau đầu dữ dội đột ngột hoặc nôn ra máu.', 'Báo cho nha sĩ và bác sĩ khác biết bạn đang dùng thuốc chống đông.', 'Không tự dùng thêm aspirin hay thuốc giảm đau chống viêm khi bác sĩ chưa dặn.'] },
  ] },
  { id: 'bp', title: 'Huyết áp', icon: 'heart', items: [
    { id: 'measure', title: 'Cách đo huyết áp', body: HOWTO },
    { id: 'control', title: 'Kiểm soát huyết áp', body: ['Dùng thuốc đúng giờ, không tự ngừng khi số đã đẹp.', 'Ăn nhạt, vận động đều, hạn chế rượu bia, không hút thuốc.', 'Đo đúng cách và đưa số cho bác sĩ xem.'] },
  ] },
];

const FAQ = [
  ['App có thay thế bác sĩ không?', 'Không. App chỉ để tham khảo. Hãy luôn theo chỉ định của bác sĩ đang điều trị cho bạn.'],
  ['Sao app không cho biết điểm nguy cơ?', 'Kết quả đánh giá nguy cơ được bác sĩ xem và giải thích khi khám. App cho bạn thấy các chỉ số đang tốt và cần cải thiện.'],
  ['Quên ghi vài ngày thì sao?', 'Không sao. Không cần nhập bù, cứ tiếp tục từ hôm nay.'],
  ['Ai xem được dữ liệu của tôi?', 'Chỉ những người bạn đã đồng ý. Bạn đổi ý được bất cứ lúc nào trong Hồ sơ.'],
  ['Người nhà nhập hộ được không?', 'Được. Mời người nhà trong Hồ sơ. App ghi rõ ai đã nhập.'],
];
const REFS = ['BRD v6 của nhóm bác sĩ dự án VNPreventStroke', 'American Heart Association, American Stroke Association', 'Tổ chức Y tế Thế giới (WHO)', 'Hướng dẫn chẩn đoán và điều trị hiện hành của Bộ Y tế'];

const CENTERS = [
  { id: 'a', name: 'Bệnh viện mẫu A', addr: '12 Đường Mẫu, Quận Một', km: 2.4, x: 62, y: 40, tel: '0900 000 001', open: 'Mở 24/7' },
  { id: 'b', name: 'Bệnh viện mẫu B', addr: '45 Phố Thử, Quận Hai', km: 5.1, x: 28, y: 62, tel: '0900 000 002', open: 'Mở 24/7' },
  { id: 'c', name: 'Bệnh viện mẫu C', addr: '7 Đường Giả, Quận Ba', km: 8.7, x: 78, y: 74, tel: '0900 000 003', open: 'Khoa thần kinh' },
];

// Tiêu đề kế hoạch theo nhóm người bệnh (rules.careGroup)
const CARE_TITLE = { secIsch: 'Phòng đột quỵ tái phát', secHem: 'Phòng chảy máu não tái phát', secUnknown: 'Phòng đột quỵ tái phát', pri55: 'Phòng đột quỵ lần đầu', priYoung: 'Phòng đột quỵ từ sớm' };

const PRIVACY = [
  'Thông tin y tế của bạn được mã hóa và bảo vệ.',
  'Dữ liệu chỉ được chia sẻ khi bạn chọn Đồng ý: với bác sĩ điều trị, với nhóm nghiên cứu, hoặc với người nhà. Mỗi lựa chọn là riêng biệt, tiếp tục dùng app không có nghĩa là đồng ý.',
  'Nhóm phát triển: Trung tâm Sức khỏe thông minh VinUni-Illinois, Viện AI4Life - ĐH Bách khoa Hà Nội, ĐH Khoa học Tự nhiên - ĐHQG TP. HCM, cùng bác sĩ tại các bệnh viện tham gia.',
  'Bạn có quyền xem, sửa hoặc yêu cầu xóa thông tin của mình.',
  'Thông tin trong app chỉ để tham khảo, không thay thế lời khuyên, chẩn đoán hay điều trị của bác sĩ.',
];
const FEEDBACK_HELPED = ['Theo dõi các chỉ số sức khỏe', 'Có động lực cải thiện chỉ số và thói quen', 'Có thông tin để trao đổi với bác sĩ', 'Hiểu rõ hơn về phòng chống đột quỵ'];
const FEEDBACK_WHY_NOT = ['Giao diện khó sử dụng', 'Thông tin chưa hữu ích', 'Tính năng không hoạt động tốt', 'Nhắc nhở không phù hợp'];
