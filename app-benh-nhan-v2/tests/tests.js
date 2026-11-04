'use strict';
// Kiểm tra tự động. Mở tests/index.html bằng trình duyệt, hoặc chạy không giao diện: node tests/run.js
// Kết quả nằm trong #report và tiêu đề trang: "PASS n/n" hoặc "FAIL k/n".

const results = [];
let taps = 0;
const ok = (name, cond, extra) => results.push({ name, pass: !!cond, extra });
const load = k => { D = null; loadScenario(k); D.settings.theme = 'light'; render(); taps = 0; };
const text = () => document.getElementById('phone').innerText;
const panelText = () => { renderPanel(); return document.getElementById('panel').textContent; };
const screen = () => current().v;
function findBtn(a, prm) {
  return [...document.querySelectorAll('#phone [data-a]')].filter(x => !x.disabled).find(x => x.dataset.a === a && Object.entries(prm || {}).every(([k, v]) => x.dataset[k] === String(v)));
}
function c(a, prm) {
  const el = findBtn(a, prm);
  if (!el) throw new Error(`Không thấy nút ${a} ${JSON.stringify(prm || {})} trên màn ${screen()}`);
  el.click(); taps++;
}
const keys = s => [...String(s)].forEach(k => c('key', { k }));
const missing = sc => SCALE_INPUTS[sc].filter(l => scaleValue(P(), l, now()) == null);
function answerAll(val) {
  const asked = [];
  A.startRisk(); render();
  for (let i = 0; i < 20; i++) {
    const id = riskRemaining(P(), now())[0];
    if (!id) break;
    asked.push(id);
    const q = RISK_Q[id];
    if (q.kind === 'bp') { c('startBP', { mode: 'risk' }); keys('140'); keys('90'); c('bpSave'); }
    else c('riskAns', { id, v: q.opts ? q.opts[0][0] : val });
  }
  return asked;
}
function newUser(stroke, year, type) {
  load('moi'); c('onStroke', { v: stroke ? 1 : 0 }); c('onConsent', { k: 'doctor', v: 1 }); c('onConsent', { k: 'research', v: 0 }); c('onAsk', { step: 'year' });
  keys(year); keys('165'); keys('62'); c('numSave');
  if (stroke) { c('go', { v: 'onType' }); c('onTypeSet', { v: type }); }
  c('onFinish');
}
function test(name, fn) { try { fn(); } catch (e) { results.push({ name: `${name} (lỗi)`, pass: false, extra: e.message }); } }

bind();

test('Buổi sáng', () => {
  load('an');
  ok('Hôm nay nói rõ việc cần làm', /Sáng nay: dùng thuốc và đo huyết áp\./.test(text()));
  c('dosesAll', { mk: 'sang' });
  ok('Dùng thuốc 1 chạm', taps === 1, taps);
  ok('Thẻ cấp cứu có giờ liều hôm nay', Object.keys(P().doses).some(k => k.startsWith('2026-10-31|sang|apx')));
  ok('Sau thuốc còn huyết áp', /đo huyết áp là xong/.test(text()));
  const t0 = taps;
  c('startBP'); keys('126'); ok('Tự sang ô số dưới', S.draft.bp.focus === 'dia'); keys('78'); c('bpSave');
  ok('Ghi huyết áp 7 chạm', taps - t0 === 7, taps - t0);
  ok('Cả buổi sáng 8 chạm', taps === 8, taps);
  ok('Kết quả tốt, câu khích lệ BRD, xu hướng', text().includes(BRD.bpGood) && /Trung bình 7 ngày/.test(text()));
  c('home');
  ok('Xong buổi sáng', /Xong buổi sáng\. Không cần làm gì đến 17:00\./.test(text()));
});
test('Đánh dấu từng thuốc', () => {
  load('an'); c('dose', { mk: 'sang', id: 'apx' });
  ok('Một thuốc đã dùng, vẫn còn việc', P().doses[doseKey(now(), 'sang', 'apx')] && /dùng thuốc/.test(text()));
  c('dose', { mk: 'sang', id: 'apx' });
  ok('Chạm lại để bỏ đánh dấu', !P().doses[doseKey(now(), 'sang', 'apx')]);
});
test('Số đo bất thường', () => {
  load('an'); c('startBP'); keys('192'); keys('118'); c('bpSave');
  ok('192/118: cảnh báo, có 115, không khen', /Huyết áp đang rất cao/.test(text()) && /Gọi 115/.test(text()) && !text().includes(BRD.bpGood));
  ok('Có nút sửa số', !!findBtn('startBP', { id: current().p.id }));
  load('an'); c('startBP'); keys('85'); keys('55'); c('bpSave');
  ok('85/55: cảnh báo thấp', /Huyết áp đang thấp/.test(text()) && !text().includes(BRD.bpGood));
  load('an'); c('startBP'); keys('300'); keys('80'); c('bpSave');
  ok('300/80: hỏi lại, không chặn', S.dialog && /vẫn lưu/.test(text()));
  load('an'); c('startBP'); keys('80'); keys('120'); c('bpSave');
  ok('Nhập đảo: hỏi lại', S.dialog && /nhập đảo/.test(text()));
  load('an'); c('startBP'); keys('135'); keys('85'); c('bpSave');
  ok('135/85: câu BRD cần cải thiện và bài học', text().includes(BRD.bpImprove) && /Cách kiểm soát huyết áp/.test(text()));
  load('ha'); c('startGlu'); keys('333'); c('gluSave');
  ok('Đường huyết 33,3: gọi 115', /Đường huyết rất cao/.test(text()) && /Gọi 115/.test(text()));
  load('ha'); c('startGlu'); keys('999'); c('gluSave');
  ok('Đường huyết 99,9: hỏi lại', S.dialog && /kiểm tra lại/.test(text()));
  load('an'); A.startWeight(); render(); for (let i = 0; i < 60; i++) c('wStep', { d: -0.5 }); c('wSave');
  ok('Cân nặng dưới 35: hỏi lại, không chặn', S.dialog && /vẫn lưu/.test(text()));
});
test('Đo 3 lần', () => {
  load('an'); c('startBP'); c('startGuide'); c('gBegin'); keys('140'); keys('90'); c('gNext'); c('gSkip'); keys('130'); keys('80'); c('gNext'); c('gSkip'); keys('126'); keys('78'); c('gNext');
  ok('Trung bình 2 lần cuối', /128\/79/.test(text()));
  c('gFinish'); ok('Lưu số trung bình', last(P().bp).sys === 128 && last(P().bp).dia === 79);
  clearInterval(guideTimer);
});
test('Quên liều chống đông', () => {
  load('an'); A.pMissLast(); render();
  ok('Có dòng thuốc tối qua chưa ghi', /Thuốc tối qua/.test(text()));
  c('go', { v: 'missed' });
  ok('Hỏi đúng buổi', /Tối qua bạn đã dùng thuốc chưa\?/.test(text()));
  ok('Không có lựa chọn dùng ngay', !/uống ngay|dùng ngay|uống bù ngay/i.test(text()));
  c('missedAns', { v: 'no' });
  ok('Không tự dùng bù, có gọi bác sĩ và dược sĩ', /Đừng tự dùng bù/.test(text()) && /thuốc chống đông/.test(text()) && /Gọi bác sĩ/.test(text()) && /Gọi dược sĩ/.test(text()));
  ok('Ghi là bỏ lỡ', adherence(P(), 30, now(), times()).missed >= 1);
  c('back'); ok('Dòng chưa ghi biến mất', !/Thuốc tối qua/.test(text()));
});
test('Buổi chiều và bỏ app 5 ngày', () => {
  load('an'); A.pTime({ t: '17:02' }); render();
  ok('Thuốc sáng chưa ghi được hỏi nhẹ', /Thuốc buổi sáng/.test(text()) && /Chưa ghi/.test(text()));
  ok('Không hối huyết áp buổi sáng', !/Huyết áp buổi sáng/.test(text()));
  load('an'); const before = adherence(P(), 30, now(), times()); A.pJump(); render();
  ok('Không bắt nhập bù', !/Chưa ghi/.test(text()));
  ok('Không trách', !/bỏ lỡ|quên|lười/i.test(text()));
  const after = adherence(P(), 30, now(), times());
  ok('Không có ghi nhận tăng, bỏ lỡ không tăng', after.none > before.none && after.missed <= before.missed);
  ok('Hỏi đã đi khám chưa', /Bạn đã đi khám ngày 03\/11 chưa\?/.test(text()));
});
test('Lần đầu mở app', () => {
  load('moi'); taps = 0; c('onStroke', { v: 1 });
  ok('Chưa chọn đồng ý thì không đi tiếp', !findBtn('onAsk', { step: 'year' }));
  c('onConsent', { k: 'doctor', v: 1 });
  ok('Một câu vẫn chưa đủ', !findBtn('onAsk', { step: 'year' }));
  c('onConsent', { k: 'research', v: 0 }); c('onAsk', { step: 'year' }); keys('1958'); keys('165'); keys('62'); c('numSave'); c('onScan'); c('go', { v: 'onTrack' }); c('onFinish');
  ok('Sau đột quỵ, quét mã bệnh viện', P() && P().meds.length === 3 && P().appts.length === 1, `${taps} chạm`);
  ok('Tái khám tự lên lịch 1 tháng', daysBetween(now(), P().appts[0].t) >= 28);
  ok('Đồng ý đúng lựa chọn', P().consents.doctor === true && P().consents.research === false);
  load('moi'); taps = 0; c('onStroke', { v: 0 }); c('onConsent', { k: 'doctor', v: 0 }); c('onConsent', { k: 'research', v: 0 }); c('onAsk', { step: 'year' }); keys('1984'); keys('170'); keys('68'); c('numSave'); c('onFinish');
  ok('Chưa đột quỵ', P() && !P().meds.length, `${taps} chạm`);
  ok('Dưới 55 tuổi không có câu hỏi thang', riskRemaining(P(), now()).length === 0);
  load('moi'); c('onStroke', { v: 1 }); c('onConsent', { k: 'doctor', v: 1 }); c('onConsent', { k: 'research', v: 1 }); c('onAsk', { step: 'year' }); keys('1958'); c('back');
  ok('Quay lại bước năm sinh vẫn đúng câu', /Bạn sinh năm nào\?/.test(text()));
});
test('Câu hỏi thang điểm', () => {
  newUser(false, 1960);
  ok('Nhóm tiên phát từ 55', careGroup(P(), now()) === 'pri55');
  ok('FSRP thiếu trước khi trả lời', missing('FSRP 2017').length > 0);
  let a = answerAll('no');
  ok('FSRP hỏi tối đa 8 câu', a.length === 8, a.join(','));
  ok('FSRP đủ 10 mục', missing('FSRP 2017').length === 0, missing('FSRP 2017').join(', '));
  ok('Số trên lấy từ màn nhập huyết áp', scaleValue(P(), 'Huyết áp tâm thu', now()) === '140');
  newUser(true, 1950, 'ischemic'); a = answerAll('no');
  ok('Thứ phát hỏi tối đa 8 câu', a.length === 8, a.join(','));
  ok('ESRS và SPI-II đủ đầu vào', !missing('ESRS').length && !missing('SPI-II').length);
  ok('Chờ bác sĩ xác nhận', /chờ xác nhận/.test(panelText()));
  A.pConfirm(); ok('Bác sĩ xác nhận xong thì sẵn sàng', /ESRS: sẵn sàng/.test(panelText()));
  newUser(true, 1950, 'tia'); answerAll('unknown');
  ok('Chưa rõ tính là thiếu', missing('ESRS').length >= 5);
  newUser(true, 1950, 'ischemic');
  ok('Ô trống không thành Không', scaleValue(P(), 'Tăng huyết áp', now()) === null);
  load('ha'); P().meds.push(med('x', 'Amlodipine', 'bp', '1 viên', '5 mg', ['sang'], { end: '2027-01-01' }));
  ok('Có thuốc hạ áp thì không hỏi lại', !riskRemaining(P(), now()).includes('bpmed'));
  ok('Đã đo thì không hỏi số trên', !riskRemaining(P(), now()).includes('sbp'));
  load('an'); ok('An còn 1 câu', riskRemaining(P(), now()).length === 1);
  load('binh'); ok('Bình đủ, không còn câu', !riskRemaining(P(), now()).length && !missing('ESRS').length);
  load('an'); A.go({ v: 'questions' }); render(); c('qSheet', { id: 'pad' }); c('riskAns', { id: 'pad', v: 'no', close: 1 });
  ok('Sửa câu trả lời trong danh sách', P().facts.pad.v === 'no' && !S.sheet);
});
test('Theo dõi theo nhóm', () => {
  const planText = k => { load(k); c('tab', { t: 'metrics' }); c('go', { v: 'plan' }); return text(); };
  let t = planText('an');
  ok('Sau nhồi máu não', /Phòng đột quỵ tái phát/.test(t) && /Tái khám/.test(t) && /LDL/.test(t) && /Dưới 1,8/.test(t) && /Triệu chứng mới/.test(t));
  t = planText('lan');
  ok('Sau chảy máu não', /Phòng chảy máu não tái phát/.test(t) && /Hỏi bác sĩ trước khi dùng thuốc mới/.test(t) && !/1,8/.test(t));
  t = planText('ha');
  ok('Tiên phát từ 55', /Phòng đột quỵ lần đầu/.test(t) && !/Tái khám/.test(t) && /Xét nghiệm mỡ máu/.test(t) && /Đo đường huyết/.test(t));
  t = planText('tu');
  ok('Dưới 55', /Phòng đột quỵ từ sớm/.test(t) && !/Mỗi ngày/.test(t) && !/Tái khám/.test(t));
  t = planText('binh'); ok('Đột quỵ lâu năm', /Tái khám/.test(t) && /Đang tắt/.test(t));
  newUser(true, 1950, 'unknown'); c('tab', { t: 'metrics' }); c('go', { v: 'plan' });
  ok('Không nhớ loại đột quỵ', /Hỏi bác sĩ loại đột quỵ/.test(text()) && !/1,8/.test(text()));
  ['an', 'lan', 'ha', 'tu', 'binh', 'mai'].forEach(k => { load(k); ok(`Mục nào cũng có nguồn: ${k}`, planItems(P(), now()).every(i => i.src && A[i.a])); });
});
test('Xét nghiệm', () => {
  load('an'); c('tab', { t: 'metrics' });
  ok('Chỉ số có LDL và đánh giá', /LDL/.test(text()) && /2,1\smmol\/L/.test(text()));
  c('go', { v: 'labDetail', test: 'ldl' });
  ok('Mục tiêu theo nhóm', /dưới 1,8/.test(text()) && !!document.querySelector('#view svg.chart'));
  const n0 = P().labs.length;
  c('labAdd', { test: 'ldl' }); c('labManual', { test: 'ldl' }); keys('1'); c('key', { k: ',' }); keys('7'); c('numSave');
  const l = P().labs[P().labs.length - 1];
  ok('Nhập tay một kết quả', P().labs.length === n0 + 1 && l.test === 'ldl' && l.v === 1.7 && l.source === 'self' && dayKey(l.date) === dayKey(now()));
  ok('Kết quả mới hiện trên màn', screen() === 'labDetail' && /1,7/.test(text()));
  load('an'); A.pScan(); render();
  ok('Chụp phiếu: màn kiểm tra 5 kết quả', screen() === 'scanReview' && /Lưu 5 kết quả/.test(text()));
  c('scanToggle', { test: 'tg' }); ok('Bỏ một kết quả', /Lưu 4 kết quả/.test(text()));
  c('scanEdit', { test: 'ldl' }); c('key', { k: 'del' }); c('key', { k: 'del' }); c('key', { k: 'del' }); keys('2'); c('key', { k: ',' }); keys('2'); c('numSave');
  ok('Sửa số đọc được', screen() === 'scanReview' && /2,2 mmol\/L/.test(text()));
  const n1 = P().labs.length; c('scanSave');
  const saved = P().labs.slice(n1);
  ok('Lưu 4 kết quả từ ảnh', saved.length === 4 && saved.every(x => x.source === 'photo' && dayKey(x.date) === '2026-10-28') && saved.find(x => x.test === 'ldl').v === 2.2);
  ok('Về tab Chỉ số', S.tab === 'metrics' && screen() === 'metrics');
  load('an'); c('startBP'); S.draft.scanTarget = 'bp'; scanned(null); render();
  ok('Chụp máy đo điền số, chờ bấm Lưu', S.draft.bp.sys === '126' && S.draft.bp.dia === '78' && screen() === 'bpEntry');
});
test('Học', () => {
  load('an'); c('tab', { t: 'learn' }); c('go', { v: 'befast' });
  ok('BE FAST đủ 6 chữ', document.querySelectorAll('#view .letter').length === 6);
  c('fastMode', { v: 'fast' });
  ok('FAST còn 4 chữ', [...document.querySelectorAll('#view .letter')].map(x => x.textContent).join('') === 'FAST');
  load('an'); c('tab', { t: 'learn' }); c('go', { v: 'exercises' });
  ok('Mặc định bài tập nằm giường', /Đổi tư thế/.test(text()) && /Tập vai/.test(text()));
  c('exLevel', { v: 'stand' }); ok('Chọn mức đứng và nhớ trong hồ sơ', P().mobility === 'stand' && /Đi bộ/.test(text()));
  c('exLevel', { v: 'bed' }); c('go', { v: 'exercise', id: 'shoulder' });
  ok('Bài tập có các bước, cảnh báo dừng, người hỗ trợ', document.querySelectorAll('#view .steps li').length >= 3 && text().includes(EXERCISE_STOP) && /Cần người hỗ trợ/.test(text()));
  load('an'); c('tab', { t: 'learn' }); c('go', { v: 'topic', topic: 'diet' });
  ok('Ăn uống có đĩa ăn mẫu', !!document.querySelector('#view .plate') && /Ăn nhạt/.test(text()));
  c('go', { v: 'article', topic: 'diet', id: 'salt' }); ok('Bài ăn nhạt', /5 g muối/.test(text()));
  load('an'); A.go({ v: 'article', topic: 'meds', id: 'missed' }); render();
  ok('Bài quên liều có gọi bác sĩ', /Gọi bác sĩ/.test(text()) && /Đừng tự dùng bù/.test(text()));
  load('an'); c('tab', { t: 'learn' });
  ok('Dành cho bạn: bài tập và thuốc chống đông', /Bài tập phục hồi/.test(text()) && /Thuốc chống đông/.test(text()));
  load('mai'); c('tab', { t: 'learn' }); ok('Người bệnh nằm giường: có bài khó nuốt', /Khó nuốt sau đột quỵ/.test(text()));
  load('moi'); c('onGuest');
  ok('Khách xem được, có 115, không có tab', /Học/.test(text()) && !!document.querySelector('#view .sos') && !document.querySelector('#tabs button'));
  c('go', { v: 'befast' }); c('back'); c('guestBack'); ok('Về lại câu hỏi đầu', /từng bị đột quỵ chưa/.test(text()));
});
test('Thuốc', () => {
  load('tu'); c('tab', { t: 'meds' }); const t0 = taps;
  c('medNew'); c('medPick'); c('medPicked', { g: 'bp', n: 'Amlodipine' }); c('medF', { k: 'strength', v: '5 mg' }); c('medM', { v: 'sang' }); c('medF', { k: 'days', v: '30' }); c('medSave');
  ok('Thêm thuốc 7 chạm', P().meds.length === 1 && taps - t0 === 7, taps - t0);
  load('an'); c('tab', { t: 'meds' });
  ok('Thuốc: 7 ngày, 30 ngày, câu BRD', /7 ngày/.test(text()) && /30 ngày/.test(text()) && text().includes(BRD.medGood));
  c('openMoment', { mk: 'sang' }); c('dose', { mk: 'sang', id: 'aml' });
  ok('Ghi liều từ tab Thuốc', !!P().doses[doseKey(now(), 'sang', 'aml')]);
  load('an'); A.go({ v: 'medDetail', id: 'apx' }); render(); c('medPause', { id: 'apx' });
  ok('Tạm dừng chống đông có cảnh báo', S.dialog && /chống đông có thể nguy hiểm/.test(text()));
  load('an'); ok('Tổng liều khớp', (() => { const a = adherence(P(), 30, now(), times()); return a.taken + a.missed + a.none === a.due; })());
  load('an'); A.pNotif({ kind: 'meds', mk: 'sang' }); render(); const t1 = taps; c('lockTaken', { mk: 'sang' });
  ok('Bấm trên thông báo là xong', !S.lock && !!P().doses[doseKey(now(), 'sang', 'apx')] && taps - t1 === 1);
});
test('Người nhà, chảy máu não, tái khám, triệu chứng', () => {
  load('mai'); ok('Dải đang chăm', /Đang chăm: Trần An/.test(text()));
  c('startBP'); keys('126'); keys('78'); c('bpSave'); ok('Ghi do người nhà nhập', last(P().bp).by === 'Trần Mai');
  load('lan'); ok('Chảy máu não không có câu thang', !riskPlan(P(), now()).ids.length);
  c('open115'); c('sosTo', { v: 'card' }); ok('Thẻ cấp cứu không ghi chống đông', !/CHỐNG ĐÔNG/.test(text()));
  load('an'); ok('Sắp tới có tái khám', /Tái khám/.test(text()) && /T3 03\/11/.test(text()));
  c('go', { v: 'visit' }); ok('Lịch đủ nơi khám và việc chuẩn bị', /tầng 3/.test(text()) && /Mang thuốc/.test(text()));
  c('apptConfirm'); ok('Xác nhận sẽ đến', /Bạn sẽ đến/.test(text()));
  load('an'); A.pDoc({ k: 'good' }); ok('Tốt thì hẹn 3 tháng', daysBetween(now(), nextAppt(P()).t) > 85);
  load('an'); A.pDoc({ k: 'bad' }); ok('Chưa tốt thì hẹn 1 tháng', daysBetween(now(), nextAppt(P()).t) < 32);
  load('an'); c('open115'); c('sosTo', { v: 'symptoms' }); c('symPick', { v: SYMPTOMS[3] }); c('symStep', { v: 2 }); c('symNow');
  ok('Triệu chứng đang xảy ra: mở 115', S.sheet && S.sheet.v === 'sos');
  load('an'); c('open115'); c('sosTo', { v: 'symptoms' }); c('symPick', { v: SYMPTOMS[3] }); c('symStep', { v: 2 }); c('symStep', { v: 3 });
  ok('Đã hết vẫn khuyên báo bác sĩ', /vẫn nên báo bác sĩ/.test(text()));
  c('symDone', { v: 0 }); A.go({ v: 'summary' }); render(); ok('Có trong tóm tắt', /Yếu hoặc tê một bên/.test(text()));
  load('tu'); A.go({ v: 'summary' }); render(); ok('Chưa đồng ý thì không gửi', /Chưa chia sẻ với bác sĩ/.test(text()) && !/Gửi cho bác sĩ/.test(text()));
});
test('Hồ sơ', () => {
  load('an'); A.go({ v: 'conditions' }); render();
  ok('Bệnh nền lấy chung câu trả lời', /Tăng huyết áp/.test(text()));
  c('go', { v: 'condition', id: 'lipid' }); c('condSet', { id: 'lipid', v: 'yes' }); c('condNum', { id: 'lipid', k: 'ldl' }); keys('3'); c('key', { k: ',' }); keys('2'); c('numSave');
  ok('Câu chi tiết theo BRD', P().facts.lipid.v === 'yes' && P().facts.lipid.detail.ldl === 3.2);
  load('an'); A.go({ v: 'reminders' }); render(); c('trackToggle', { k: 'bp' }); c('timeStep', { k: 'sang', d: 15 });
  ok('Nhắc nhở gộp một chỗ', !P().track.bp && D.settings.times.sang === '07:15');
  home(); render(); ok('Tắt nhắc đo thì Hôm nay không còn việc huyết áp', !/đo huyết áp/.test(text()));
  load('an'); A.go({ v: 'display' }); render(); c('setting', { k: 'lang', v: 'en' });
  ok('Đổi sang tiếng Anh', /Display/.test(text()));
  c('back'); ok('Tab tiếng Anh', /Today/.test(document.getElementById('tabs').innerText));
  D.settings.lang = 'vi';
});

// Duyệt mọi màn đi tới được: không lỗi, không tràn, nút đủ lớn, mọi màn có 115, không có chữ phụ kiểu cũ
function crawl(k, setup) {
  const issues = new Set(), t0 = Date.now(), seen = new Set(), queue = [[]];
  const reset = () => { D = null; loadScenario(k); D.settings.theme = 'light'; if (setup) setup(); render(); };
  const btns = () => [...document.querySelectorAll('#phone [data-a]')].filter(b => !b.disabled && b.id !== 'statusbar' && b.getAttribute('aria-hidden') !== 'true' && !(S.lock && !b.closest('#lockLayer')) && !(S.dialog && !b.closest('#dialogLayer')) && !(S.sheet && !S.dialog && !b.closest('#sheetLayer')));
  const sig = () => { const t = current(); return [t.v, JSON.stringify(t.p || {}).replace(/"day":"?\d+"?/, ''), S.sheet ? S.sheet.v : '', S.dialog ? S.dialog.title : '', S.lock ? S.lock.kind : ''].join('|'); };
  while (queue.length && Date.now() - t0 < 7000) {
    const path = queue.shift();
    try {
      reset();
      let okPath = true;
      for (const key of path) { const b = btns().find(x => x.dataset.a + JSON.stringify(x.dataset) === key); if (!b) { okPath = false; break; } b.click(); }
      if (!okPath) continue;
    } catch (e) { issues.add(`Lỗi: ${e.message}`); continue; }
    const s = sig(); if (seen.has(s)) continue; seen.add(s);
    const view = document.getElementById('view'), txt = document.getElementById('phone').innerText;
    if (view.scrollWidth > view.clientWidth + 1) issues.add(`Tràn ngang: ${s}`);
    if (/undefined|NaN|\[object|null\b/.test(txt)) issues.add(`Chữ lỗi: ${s}`);
    if (/\b(AM|PM)\b/.test(txt)) issues.add(`Giờ AM/PM: ${s}`);
    if (current().v !== 'faq' && /mức nguy cơ|nguy cơ (thấp|trung bình|cao)|điểm nguy cơ/i.test(txt)) issues.add(`Hiện nguy cơ: ${s}`);
    if (document.querySelector('#phone .sub, #phone .note, #phone .d, #phone .legend')) issues.add(`Còn chữ phụ kiểu cũ: ${s}`);
    if (!S.sheet && !S.lock && !document.querySelector('#view .sos')) issues.add(`Thiếu nút 115: ${current().v}`);
    if (!S.sheet && !S.lock && !document.querySelector('#view h1')) issues.add(`Thiếu tiêu đề: ${current().v}`);
    btns().forEach(b => { const r = b.getBoundingClientRect(); if (r.width && (r.height < 44 || r.width < 44)) issues.add(`Nút nhỏ: ${(b.innerText || b.dataset.a).trim().slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`); if (!A[b.dataset.a]) issues.add(`Nút không có hành động: ${b.dataset.a}`); if (!(b.innerText.trim() || b.getAttribute('aria-label'))) issues.add(`Nút thiếu nhãn: ${b.dataset.a}`); });
    const next = [...new Set(btns().map(b => b.dataset.a + JSON.stringify(b.dataset)))].filter(x => !/^(key|wStep|setting|pickWhen)\{/.test(x) && !(x.startsWith('open115') && path.length) && !(x.startsWith('call{') && path.length > 2) && !x.startsWith('scan{'));
    next.forEach(x => queue.push(path.concat([x])));
  }
  clearInterval(guideTimer);
  return { k, states: seen.size, left: queue.length, issues: [...issues] };
}
const crawls = [];
['an', 'ha', 'tu', 'mai', 'lan', 'binh', 'moi'].forEach(k => { try { crawls.push(crawl(k)); } catch (e) { crawls.push({ k, states: 0, left: 0, issues: [e.message] }); } });
try { crawls.push(Object.assign(crawl('an', () => { D.settings.size = 'xl'; document.getElementById('phone').style.width = '320px'; }), { k: 'an, chữ rất lớn, 320px' })); } catch (e) { crawls.push({ k: 'xl', states: 0, issues: [e.message] }); }
document.getElementById('phone').style.width = '390px';
crawls.forEach(r => ok(`Duyệt mọi màn: ${r.k} (${r.states} màn${r.left ? `, còn ${r.left}` : ''})`, !r.issues.length, r.issues.slice(0, 6).join(' | ')));

const fails = results.filter(r => !r.pass);
document.title = `${fails.length ? 'FAIL' : 'PASS'} ${results.length - fails.length}/${results.length}`;
document.getElementById('report').textContent = `${document.title}\n\n${results.map(r => `${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.extra != null && r.extra !== '' ? `  [${r.extra}]` : ''}`).join('\n')}`;
