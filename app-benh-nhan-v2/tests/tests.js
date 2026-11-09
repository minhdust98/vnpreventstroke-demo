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
// Thứ tự các nút trên màn, để kiểm tra việc còn lại đứng trước việc đã xong
const order = (...as) => as.map(a => [...document.querySelectorAll('#view [data-a]')].findIndex(x => x.dataset.a === a));
function findBtn(a, prm) {
  return [...document.querySelectorAll('#phone [data-a]')].filter(x => !x.disabled).find(x => x.dataset.a === a && Object.entries(prm || {}).every(([k, v]) => x.dataset[k] === String(v)));
}
function c(a, prm) {
  const el = findBtn(a, prm);
  if (!el) throw new Error(`Không thấy nút ${a} ${JSON.stringify(prm || {})} trên màn ${screen()}`);
  el.click(); taps++;
}
const openTile = v => { home(); render(); c('go', { v }); };
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
  c('onHistDone'); c('onFinish');
}
// Chạy một đoạn với cờ tính năng đã bật, rồi trả lại. Phần bị ẩn ở bước 1 vẫn được kiểm tra khi bật.
function withFlags(f, fn) { const keep = Object.assign({}, FEATURES); Object.assign(FEATURES, f); try { fn(); } finally { Object.assign(FEATURES, keep); } }
const setField = (f, v) => { const el = document.querySelector(`#view [data-field="${f}"]`); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
function test(name, fn) { try { fn(); } catch (e) { results.push({ name: `${name} (lỗi)`, pass: false, extra: e.message }); } }

bind();

test('Buổi sáng', () => {
  load('an');
  ok('Trang chủ: thẻ chào, Hôm nay có ngày, thuốc rồi huyết áp, rồi năm ô', document.querySelector('#view h1').textContent === 'Trần An' && /Thứ Bảy, 31\/10/.test(text()) && (([a, b, t]) => a >= 0 && a < b && b < t)(order('dosesAll', 'startBP', 'go')));
  c('dosesAll', { mk: 'sang' });
  ok('Dùng thuốc 1 chạm', taps === 1, taps);
  ok('Thẻ cấp cứu có giờ liều hôm nay', Object.keys(P().doses).some(k => k.startsWith('2026-10-31|sang|apx')));
  ok('Sau thuốc còn huyết áp, thuốc thu thành một dòng', !findBtn('dosesAll') && (([a, b]) => a >= 0 && a < b)(order('startBP', 'openMoment')));
  const t0 = taps;
  c('startBP'); keys('126'); ok('Tự sang ô số dưới', S.draft.bp.focus === 'dia'); keys('78'); c('bpSave');
  ok('Ghi huyết áp 7 chạm', taps - t0 === 7, taps - t0);
  ok('Cả buổi sáng 8 chạm', taps === 8, taps);
  ok('Kết quả tốt, câu khích lệ BRD, xu hướng', text().includes(BRD.bpGood) && /Trung bình 7 ngày/.test(text()));
  c('back');
  ok('Xong buổi sáng: chỉ còn dòng đã xong và việc sắp tới', !findBtn('dosesAll') && !findBtn('startBP') && !!findBtn('openMoment', { mk: 'sang' }) && /Sắp tới[\s\S]*17:00/.test(text()));
});
test('Đánh dấu từng thuốc', () => {
  load('an'); c('dose', { mk: 'sang', id: 'apx' });
  ok('Một thuốc đã dùng, vẫn còn việc', P().doses[doseKey(now(), 'sang', 'apx')] && !!findBtn('dosesAll', { mk: 'sang' }));
  c('dose', { mk: 'sang', id: 'apx' });
  ok('Chạm lại để bỏ đánh dấu', !P().doses[doseKey(now(), 'sang', 'apx')]);
});
test('Số đo bất thường', () => {
  load('an'); c('startBP'); keys('192'); keys('118'); c('bpSave');
  ok('192/118: cảnh báo, có 115, không khen', /Huyết áp đang rất cao/.test(text()) && /Gọi 115/.test(text()) && !text().includes(BRD.bpGood));
  ok('Có nút sửa số, 115 đang ẩn', !!findBtn('bpEdit', { id: current().p.id }) && !findBtn('open115'));
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
test('Quên liều chỉ ghi nhận', () => {
  load('an'); A.pMissLast(); render();
  ok('Có dòng thuốc tối qua chưa ghi', /Thuốc tối qua/.test(text()));
  c('go', { v: 'missed' });
  ok('Hỏi đúng buổi', /Tối qua bạn đã dùng thuốc chưa\?/.test(text()));
  ok('Không có lựa chọn dùng ngay', !/uống ngay|dùng ngay|uống bù ngay/i.test(text()));
  const t0 = taps; c('missedAns', { v: 'no' });
  ok('Chưa dùng: ghi nhận rồi về Trang chủ, 1 chạm', screen() === 'home' && taps - t0 === 1 && adherence(P(), 30, now(), times()).missed >= 1);
  ok('Không gợi ý dùng bù, không hướng dẫn, không nút gọi bác sĩ hay dược sĩ', !/dùng bù|gấp đôi|hỏi bác sĩ hoặc dược sĩ/i.test(text()) && !findBtn('call'));
  ok('Dòng chưa ghi biến mất', !/Thuốc tối qua/.test(text()));
  load('an'); A.pMissLast(); render(); c('go', { v: 'missed' }); c('missedAns', { v: 'yes' });
  ok('Đã dùng thì hỏi dùng lúc nào', !!findBtn('missedTime', { v: '60' })); c('missedTime', { v: '60' });
  ok('Ghi là đã dùng, muộn 1 giờ', screen() === 'home' && !/Thuốc tối qua/.test(text()) && Object.values(P().doses).some(d => d.s === 'taken'));
  load('an'); openTile('meds'); ok('Thuốc không còn dòng Khi quên liều', !/Khi quên liều/.test(text()));
  load('an'); openTile('learn'); c('go', { v: 'topic', topic: 'meds' }); ok('Dùng thuốc an toàn không còn bài Quên liều', !/Quên liều/.test(text()) && /Không tự ngừng thuốc/.test(text()));
  withFlags({ missedHelp: true }, () => { load('an'); openTile('meds'); ok('Bật cờ thì có lại bài Khi quên liều', /Khi quên liều/.test(text())); });
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
  c('onConsent', { k: 'research', v: 0 }); c('onAsk', { step: 'year' }); keys('1958'); keys('165'); keys('62'); c('numSave'); c('onScan'); ok('Quét mã hiện tên bệnh viện và đợt chẩn đoán', /Bệnh viện mẫu A/.test(text()) && /Tăng huyết áp/.test(text()) && /từ 2019/.test(text())); c('go', { v: 'onHist' }); c('onHistDone'); c('onFinish');
  ok('Sau đột quỵ, quét mã bệnh viện', P() && P().meds.length === 3 && P().appts.length === 1 && P().careTeam.hospital === HOSPITAL_SAMPLE.name && P().facts.htn.detail.year === 2019, `${taps} chạm`);
  ok('Tái khám tự lên lịch 1 tháng', daysBetween(now(), P().appts[0].t) >= 28);
  ok('Đồng ý đúng lựa chọn', P().consents.doctor === true && P().consents.research === false);
  load('moi'); taps = 0; c('onStroke', { v: 0 }); c('onConsent', { k: 'doctor', v: 0 }); c('onConsent', { k: 'research', v: 0 }); c('onAsk', { step: 'year' }); keys('1984'); keys('170'); keys('68'); c('numSave'); c('onHistDone'); c('onFinish');
  ok('Chưa đột quỵ', P() && !P().meds.length, `${taps} chạm`);
  ok('Dưới 55 tuổi không có câu hỏi thang', riskRemaining(P(), now()).length === 0);
  load('moi'); c('onStroke', { v: 1 }); c('onConsent', { k: 'doctor', v: 1 }); c('onConsent', { k: 'research', v: 1 }); c('onAsk', { step: 'year' }); keys('1958'); c('back');
  ok('Quay lại bước năm sinh vẫn đúng câu', /Bạn sinh năm nào\?/.test(text()));
});
test('Hồ sơ ban đầu', () => {
  load('moi'); taps = 0; c('onStroke', { v: 0 }); c('onConsent', { k: 'doctor', v: 1 }); c('onConsent', { k: 'research', v: 0 }); c('onAsk', { step: 'year' }); keys('1962'); keys('160'); keys('60'); c('numSave');
  ok('Sau cân nặng là hồ sơ ban đầu, 5 nhóm', screen() === 'onHist' && document.querySelectorAll('#view .prog i').length === 5 && /Bệnh nền/.test(document.querySelector('#view h1').textContent));
  c('onHistSet', { id: 'htn', v: 'yes' }); c('onHistSet', { id: 'dm', v: 'unknown' }); c('onHistSet', { id: 'lipid', v: 'no' }); c('onHistNext', { step: 1 });
  c('onHistSet', { id: 'af', v: 'yes' }); c('onHistSet', { id: 'anticoag', v: 'Không' }); c('onHistNext', { step: 2 });
  c('onHistPick', { id: 'smoke' }); c('onHistSet', { id: 'smoke', v: 'little', close: 1 }); c('onHistSet', { id: 'apnea', v: 'yes' }); c('onHistNext', { step: 3 });
  c('onHistSet', { id: 'family', v: 'yes' }); c('onHistMulti', { id: 'familyKinds', v: 'Đột quỵ' }); c('onHistMulti', { id: 'familyKinds', v: 'Không ai' });
  ok('Chọn "Không ai" bỏ các mục khác', JSON.stringify(onb().hist.familyKinds) === '["Không ai"]');
  c('onHistMulti', { id: 'familyKinds', v: 'Đột quỵ' }); c('onHistNext', { step: 4 });
  c('onHistMulti', { id: 'symptoms', v: 'Mờ mắt, mất thị lực' });
  const oth = document.getElementById('oth'); oth.value = 'Hay tê đầu ngón tay'; oth.dispatchEvent(new Event('input', { bubbles: true }));
  ok('Mỗi nhóm có ô Khác', !!oth && oth.dataset.key === 'symptoms' && onb().hist.other.symptoms === 'Hay tê đầu ngón tay');
  c('onHistDone'); c('onFinish');
  const p = P();
  ok('Bệnh nền vào hồ sơ, nguồn người bệnh', factOf(p, 'htn') === 'yes' && factOf(p, 'dm') === 'unknown' && factOf(p, 'lipid') === 'no' && p.facts.htn.source === 'patient');
  ok('Câu chưa trả lời giữ trống', factOf(p, 'kidney') == null && factOf(p, 'cvd') == null);
  ok('Tim mạch, thuốc chống đông, ngưng thở', factOf(p, 'af') === 'yes' && p.drugs.anticoag === 'Không' && factOf(p, 'apnea') === 'yes');
  ok('Sinh hoạt, hút thuốc thành câu thang điểm', p.habits.smoke === 'little' && factOf(p, 'smoke') === 'yes' && p.habits.alcohol == null);
  ok('Gia đình', p.facts.family.v === 'yes' && p.facts.family.detail.kinds[0] === 'Đột quỵ');
  ok('Triệu chứng 3 tháng qua và ô Khác', p.intake.symptoms.length === 1 && p.intake.other.symptoms === 'Hay tê đầu ngón tay' && intakeSummary(p, now()).some(x => x.k === 'Triệu chứng khác'));
  ok('Đã trả lời thì không hỏi lại ở câu hỏi thang', !riskRemaining(p, now()).some(id => ['htn', 'dm', 'af', 'smoke'].includes(id)));
  ok('Bác sĩ thấy hồ sơ ban đầu và hai điều cần xem', intakeSummary(p, now()).length >= 5 && intakeFlags(p).length === 2);
  openTile('metrics'); c('hPart', { v: 'visits' }); c('go', { v: 'summary' });
  ok('Tóm tắt cho bác sĩ có hồ sơ ban đầu', /Hồ sơ ban đầu/.test(text()) && /Tăng huyết áp/.test(text()) && !/điểm nguy cơ/i.test(text()));
  load('moi'); c('onStroke', { v: 1 }); c('onConsent', { k: 'doctor', v: 1 }); c('onConsent', { k: 'research', v: 0 }); c('onAsk', { step: 'year' }); keys('1950'); keys('160'); keys('60'); c('numSave'); c('onScan'); c('go', { v: 'onHist' });
  ok('Nối hồ sơ bệnh viện thì không hỏi lại tăng huyết áp, đái tháo đường, tim, rung nhĩ', !findBtn('onHistSet', { id: 'htn' }) && !findBtn('onHistSet', { id: 'dm' }));
  c('onHistNext', { step: 1 });
  ok('Nhóm tim mạch chỉ còn thuốc chống đông', !!findBtn('onHistSet', { id: 'anticoag' }) && !findBtn('onHistSet', { id: 'af' }));
  load('moi'); c('onStroke', { v: 0 }); c('onConsent', { k: 'doctor', v: 1 }); c('onConsent', { k: 'research', v: 0 }); c('onAsk', { step: 'year' }); keys('1962'); keys('160'); keys('60'); c('numSave'); c('onHistDone'); c('onFinish');
  ok('Bỏ qua thì hồ sơ không có câu nào, không bị hiểu là Không', Object.keys(P().facts).length === 0 && !P().intake);
});
test('Dự đoán nguy cơ', () => {
  ok('Ngưỡng ESRS: 2 thấp, 3 và 6 trung bình, 7 cao', ['low', 'mid', 'mid', 'high'].join() === [2, 3, 6, 7].map(v => riskLevelOf('esrs', v)).join());
  ok('Ngưỡng FSRP: 4,9 thấp, 5 và 9,9 trung bình, 10 cao', ['low', 'mid', 'mid', 'high'].join() === [4.9, 5, 9.9, 10].map(v => riskLevelOf('fsrp', v)).join());
  load('ha'); openTile('risk');
  ok('Người từ 55 tuổi chưa đột quỵ, còn câu hỏi: hỏi tiếp, chưa hiện mức', riskRemaining(P(), now()).length > 0 ? (/Còn \d+ câu hỏi/.test(text()) && !!findBtn('startRisk') && !/Trung bình|Thấp|Cao/.test(text())) : true);
  answerAll('no'); A.go({ v: 'risk' }); render();
  ok('Trả lời đủ thì hiện mức từ số minh họa của FSRP, một lời khuyên, nhãn Minh họa, không điểm', riskResult(P(), now()).key === 'mid' && /Trung bình/.test(text()) && /bác sĩ ở lần khám tới/.test(text()) && /Minh họa/.test(text()) && !/\d+\s*(điểm|%)/.test(text()));
  ok('Mức có hình đi kèm', !!document.querySelector('#view .pill svg'));
  load('binh'); openTile('risk');
  const e = esrsScore(P(), now()), key = riskLevelOf('esrs', e.score);
  ok('Sau nhồi máu não, đã trả lời đủ: mức theo ESRS', e.score != null && riskResult(P(), now()).key === key && text().includes(RISK_UI[key].word) && text().includes(RISK_UI[key].advice));
  ok('Màn không có điểm, không tên thang', !/\d+\s*(điểm|%)|ESRS|FSRP|SPI/.test(text()));
  const before = riskResult(P(), now()).key, rank = { low: 1, mid: 2, high: 3 };
  ['htn', 'dm', 'pad', 'mi'].forEach(id => A.riskAns({ id, v: 'yes' })); render();
  ok('Đổi câu trả lời thì mức tự cập nhật, không hỏi lại', rank[riskResult(P(), now()).key] >= rank[before] && riskResult(P(), now()).key === 'high' && !findBtn('startRisk'));
  A.riskAns({ id: 'pad', v: 'unknown' }); render();
  ok('Còn câu chưa rõ thì chờ bác sĩ', /bác sĩ xem câu trả lời/.test(text()));
  load('lan'); openTile('risk'); ok('Sau chảy máu não: chưa có đánh giá', /Chưa có đánh giá cho trường hợp này/.test(text()));
  load('tu'); openTile('risk'); ok('Dưới 55 tuổi: chưa có đánh giá', /Chưa có đánh giá cho trường hợp này/.test(text()));
  load('an'); openTile('risk'); ok('An còn 1 câu', /Còn 1 câu hỏi/.test(text()));
  c('startRisk'); const id = riskRemaining(P(), now())[0]; c('riskAns', { id, v: 'no' }); c('back');
  ok('Trả lời xong về màn mức', screen() === 'risk' && /Thấp|Trung bình|Cao/.test(document.querySelector('#view .pill').textContent));
  c('go', { v: 'questions' }); ok('Xem và sửa câu trả lời, quay lại Dự đoán nguy cơ', /Câu trả lời/.test(document.querySelector('#view h1').textContent) && !!findBtn('back'));
  c('back'); c('profileAdd'); ok('Đánh giá cho người thân', S.dialog && /Hồ sơ người thân/.test(text()));
  load('an'); ok('Hôm nay không còn lời mời câu hỏi cho bác sĩ', !/câu hỏi cho bác sĩ/i.test(text()));
  load('xau'); openTile('risk'); ok('Dữ liệu xấu nhất: Dự đoán nguy cơ vẫn hiện', !!document.querySelector('#view h1'));
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
  const planText = k => { load(k); A.go({ v: 'plan' }); render(); return text(); };
  let t = planText('an');
  ok('Sau nhồi máu não', /Phòng đột quỵ tái phát/.test(t) && /Tái khám/.test(t) && /LDL/.test(t) && /Dưới 1,8/.test(t) && /Triệu chứng mới/.test(t));
  t = planText('lan');
  ok('Sau chảy máu não', /Phòng chảy máu não tái phát/.test(t) && /Hỏi bác sĩ trước khi dùng thuốc mới/.test(t) && !/1,8/.test(t));
  t = planText('ha');
  ok('Tiên phát từ 55', /Phòng đột quỵ lần đầu/.test(t) && !/Tái khám/.test(t) && /Xét nghiệm mỡ máu/.test(t) && /Đo đường huyết/.test(t));
  t = planText('tu');
  ok('Dưới 55', /Phòng đột quỵ từ sớm/.test(t) && !/Mỗi ngày/.test(t) && !/Tái khám/.test(t));
  t = planText('binh'); ok('Đột quỵ lâu năm', /Tái khám/.test(t) && /Đang tắt/.test(t));
  newUser(true, 1950, 'unknown'); A.go({ v: 'plan' }); render();
  ok('Không nhớ loại đột quỵ', /Hỏi bác sĩ loại đột quỵ/.test(text()) && !/1,8/.test(text()));
  ['an', 'lan', 'ha', 'tu', 'binh', 'mai'].forEach(k => { load(k); ok(`Mục nào cũng có nguồn: ${k}`, planItems(P(), now()).every(i => i.src && A[i.a])); });
});
test('Bàn phím thật', () => {
  load('an'); c('startBP');
  ['1', '2', '6', '7', '8'].forEach(key => document.dispatchEvent(new KeyboardEvent('keydown', { key })));
  ok('Gõ số bằng bàn phím thật vào ô huyết áp', S.draft.bp.sys === '126' && S.draft.bp.dia === '78');
});
test('Xét nghiệm', () => {
  load('an'); openTile('metrics');
  ok('Chỉ số có LDL và đánh giá', /LDL/.test(text()) && /2,1\smmol\/L/.test(text()));
  c('go', { v: 'labDetail', test: 'ldl' });
  ok('Mục tiêu theo nhóm', /dưới 1,8/.test(text()) && !!document.querySelector('#view svg.chart'));
  const n0 = P().labs.length;
  c('labChoose', { test: 'ldl' }); ok('Ô nhập xét nghiệm có nút chụp phiếu', !!findBtn('scan', { target: 'lab' })); keys('1'); c('key', { k: ',' }); keys('7'); c('numSave');
  const l = P().labs[P().labs.length - 1];
  ok('Nhập tay một kết quả', P().labs.length === n0 + 1 && l.test === 'ldl' && l.v === 1.7 && l.source === 'self' && dayKey(l.date) === dayKey(now()));
  ok('Kết quả mới hiện trên màn', screen() === 'labDetail' && /1,7/.test(text()));
  load('an'); A.pScan(); render();
  ok('Chụp phiếu: màn kiểm tra 4 kết quả, không có HbA1c', screen() === 'scanReview' && /Lưu 4 kết quả/.test(text()) && !/HbA1c/.test(text()));
  c('scanToggle', { test: 'tg' }); ok('Bỏ một kết quả', /Lưu 3 kết quả/.test(text()));
  c('scanEdit', { test: 'ldl' }); c('key', { k: 'del' }); c('key', { k: 'del' }); c('key', { k: 'del' }); keys('2'); c('key', { k: ',' }); keys('2'); c('numSave');
  ok('Sửa số đọc được', screen() === 'scanReview' && /2,2\smmol\/L/.test(text()));
  const n1 = P().labs.length; c('scanSave');
  const saved = P().labs.slice(n1);
  ok('Lưu 3 kết quả từ ảnh', saved.length === 3 && saved.every(x => x.source === 'photo' && dayKey(x.date) === '2026-10-28') && saved.find(x => x.test === 'ldl').v === 2.2);
  ok('Về Hồ sơ sức khỏe', S.stack.length === 1 && screen() === 'metrics');
  load('an'); c('startBP'); S.draft.scanTarget = 'bp'; scanned(null); render();
  ok('Chụp máy đo điền số, chờ bấm Lưu', S.draft.bp.sys === '126' && S.draft.bp.dia === '78' && screen() === 'bpEntry');
});
test('Học', () => {
  load('an'); openTile('learn'); c('go', { v: 'befast' });
  ok('BE FAST đủ 6 chữ', document.querySelectorAll('#view .letter').length === 6);
  c('fastMode', { v: 'fast' });
  ok('FAST còn 4 chữ', [...document.querySelectorAll('#view .letter')].map(x => x.textContent).join('') === 'FAST');
  load('an'); openTile('learn');
  ok('Bài tập phục hồi đang ẩn ở bước 1', !/Bài tập phục hồi/.test(text()));
  withFlags({ exercises: true }, () => { render(); ok('Bật cờ thì Học có bài tập đứng đầu', /Bài tập phục hồi/.test(text())); });
  withFlags({ exercises: true }, () => {
  A.go({ v: 'exercises' }); render();
  ok('Mặc định bài tập nằm giường', /Đổi tư thế/.test(text()) && /Tập vai/.test(text()));
  c('exLevel', { v: 'stand' }); ok('Chọn mức đứng và nhớ trong hồ sơ', P().mobility === 'stand' && /Đi bộ/.test(text()));
  c('exLevel', { v: 'bed' }); c('go', { v: 'exercise', id: 'shoulder' });
  ok('Bài tập có các bước, cảnh báo dừng, người hỗ trợ', document.querySelectorAll('#view .steps li').length >= 3 && text().includes(EXERCISE_STOP) && /Cần người hỗ trợ/.test(text()));
  });
  load('an'); openTile('learn'); c('go', { v: 'topic', topic: 'diet' });
  ok('Ăn uống có đĩa ăn mẫu', !!document.querySelector('#view .plate') && /Ăn nhạt/.test(text()));
  c('go', { v: 'article', topic: 'diet', id: 'salt' }); ok('Bài ăn nhạt', /5 g muối/.test(text()));
  withFlags({ missedHelp: true }, () => { load('an'); A.go({ v: 'article', topic: 'meds', id: 'missed' }); render();
  ok('Bật cờ: bài quên liều có gọi bác sĩ', /Gọi bác sĩ/.test(text()) && /Đừng tự dùng bù/.test(text())); });
  load('an'); openTile('learn');
  ok('Học: bài riêng đứng đầu', /Thuốc chống đông/.test(text()));
  load('mai'); openTile('learn'); ok('Người bệnh nằm giường: có bài khó nuốt', /Khó nuốt sau đột quỵ/.test(text()));
  load('moi'); c('onGuest');
  ok('Khách xem được, không có tab', /Giáo dục sức khỏe/.test(text()) && !document.querySelector('#tabs button'));
  c('go', { v: 'befast' }); c('back'); c('guestBack'); ok('Về lại câu hỏi đầu', /từng bị đột quỵ chưa/.test(text()));
});
test('Thuốc', () => {
  load('tu'); openTile('meds'); const t0 = taps;
  c('medNew'); c('medPick'); c('medPicked', { g: 'bp', n: 'Amlodipine' }); c('medF', { k: 'strength', v: '5 mg' }); c('medM', { v: 'sang' }); c('medF', { k: 'days', v: '30' }); c('medSave');
  ok('Thêm thuốc 7 chạm', P().meds.length === 1 && taps - t0 === 7, taps - t0);
  load('an'); openTile('meds');
  ok('Thuốc: 7 chấm, chưa dùng X/Y lần, câu BRD', document.querySelectorAll('#view .dot').length === 7 && /Chưa dùng: \d+\/\d+ lần/.test(text()) && text().includes(BRD.medGood));
  c('openMoment', { mk: 'sang' }); c('dose', { mk: 'sang', id: 'aml' });
  ok('Ghi liều từ tab Thuốc', !!P().doses[doseKey(now(), 'sang', 'aml')]);
  load('an'); A.go({ v: 'medDetail', id: 'apx' }); render(); c('medPause', { id: 'apx' });
  ok('Tạm dừng chống đông có cảnh báo', S.dialog && /chống đông có thể nguy hiểm/.test(text()));
  load('an'); ok('Tổng liều khớp', (() => { const a = adherence(P(), 30, now(), times()); return a.taken + a.missed + a.none === a.due; })());
  load('an'); A.pNotif({ kind: 'meds', mk: 'sang' }); render(); const t1 = taps; c('lockTaken', { mk: 'sang' });
  ok('Bấm trên thông báo là xong', !S.lock && !!P().doses[doseKey(now(), 'sang', 'apx')] && taps - t1 === 1);
});
test('Tỷ lệ chưa dùng và chụp đơn thuốc', () => {
  load('an'); const a30 = adherence(P(), 30, now(), times()), m30 = missRate(P(), 30, now(), times()), m7 = missRate(P(), 7, now(), times());
  ok('Chưa dùng = số lần cần dùng trừ số lần đã dùng', m30.due === a30.due && m30.not === a30.due - a30.taken && m7.due < m30.due && m7.not <= m7.due);
  const one = missRate(P(), 30, now(), times(), 'apx'), all = P().meds.map(m => missRate(P(), 30, now(), times(), m.id));
  ok('Từng thuốc cộng lại bằng chung', all.reduce((s, x) => s + x.due, 0) === m30.due && all.reduce((s, x) => s + x.not, 0) === m30.not && one.due > 0);
  openTile('meds'); ok('Thẻ có tỷ lệ chưa dùng 30 ngày', new RegExp(`Chưa dùng: ${m30.not}/${m30.due} lần`).test(text()));
  c('missDays', { v: 7 }); ok('Chuyển sang 7 ngày', new RegExp(`Chưa dùng: ${m7.not}/${m7.due} lần`).test(text()));
  c('go', { v: 'medDetail', id: 'apx' }); ok('Chi tiết thuốc có tỷ lệ chưa dùng của thuốc đó', new RegExp(`Chưa dùng 30 ngày[\\s\\S]*${one.not}/${one.due} lần`).test(text()));
  load('tu'); openTile('meds'); c('medNew'); ok('Thêm thuốc có Chụp đơn thuốc và Quét mã QR', !!findBtn('scan', { target: 'rx' }) && !!findBtn('rxQr'));
  load('an'); openTile('meds'); const n0 = P().meds.length; c('medNew'); c('rxQr');
  ok('Quét mã: danh sách thuốc đọc được, thuốc đã có không tick sẵn', screen() === 'rxReview' && /Lưu 1 thuốc/.test(text()) && /Clopidogrel/.test(text()) && !!document.querySelector('#view [aria-label="Lưu Amlodipine"][aria-checked="false"]'));
  c('rxToggle', { i: 1 }); ok('Tick thêm một thuốc', /Lưu 2 thuốc/.test(text()));
  c('rxSave'); ok('Lưu thuốc: về danh sách, thuốc mới đúng buổi', P().meds.length === n0 + 2 && screen() === 'meds' && /Clopidogrel/.test(text()) && P().meds[n0].moments[0] === 'sang' && P().meds[n0].source === 'photo');
  load('tu'); openTile('meds'); c('medNew'); S.draft.scanTarget = 'rx'; scanned('data:image/gif;base64,R0lGODlhAQABAAAAACw='); render();
  ok('Chụp đơn: ảnh và danh sách', screen() === 'rxReview' && !!document.querySelector('#view img.thumb') && /Lưu 3 thuốc/.test(text()));
});
test('Người nhà, chảy máu não, tái khám, triệu chứng', () => {
  load('mai'); ok('Dải đang chăm', /Đang chăm: Trần An/.test(text()));
  c('startBP'); keys('126'); keys('78'); c('bpSave'); ok('Ghi do người nhà nhập', last(P().bp).by === 'Trần Mai');
  load('lan'); ok('Chảy máu não không có câu thang', !riskPlan(P(), now()).ids.length);
  withFlags({ sos: true }, () => { render(); c('open115'); c('sosTo', { v: 'card' }); ok('Thẻ cấp cứu không ghi chống đông', !/CHỐNG ĐÔNG/.test(text())); });
  load('an'); ok('Sắp tới có tái khám', /Tái khám/.test(text()) && /T3 03\/11/.test(text()));
  c('go', { v: 'visit' }); ok('Lịch đủ nơi khám và việc chuẩn bị', /tầng 3/.test(text()) && /Mang thuốc/.test(text()));
  c('apptConfirm'); ok('Xác nhận sẽ đến', /Bạn sẽ đến/.test(text()));
  load('an'); A.pDoc({ k: 'good' }); ok('Tốt thì hẹn 3 tháng', daysBetween(now(), nextAppt(P()).t) > 85);
  load('an'); A.pDoc({ k: 'bad' }); ok('Chưa tốt thì hẹn 1 tháng', daysBetween(now(), nextAppt(P()).t) < 32);
  withFlags({ sos: true }, () => { load('an'); c('open115'); c('sosTo', { v: 'symptoms' }); c('symPick', { v: SYMPTOMS[3] }); c('symStep', { v: 2 }); c('symNow');
  ok('Triệu chứng đang xảy ra: mở 115', S.sheet && S.sheet.v === 'sos'); });
  load('an'); A.go({ v: 'symptoms' }); render(); c('symPick', { v: SYMPTOMS[3] }); c('symStep', { v: 2 }); c('symNow');
  ok('115 ẩn: triệu chứng đang xảy ra hiện thẳng nút Gọi 115', !S.sheet && /Gọi 115 ngay/.test(text()) && !!findBtn('call', { num: '115' }) && P().symptoms.length === 1);
  load('an'); A.go({ v: 'symptoms' }); render(); c('symPick', { v: SYMPTOMS[3] }); c('symStep', { v: 2 }); c('symStep', { v: 3 });
  ok('Đã hết vẫn khuyên báo bác sĩ', /vẫn nên báo bác sĩ/.test(text()));
  c('symDone', { v: 0 }); A.go({ v: 'summary' }); render(); ok('Có trong tóm tắt', /Yếu hoặc tê một bên/.test(text()));
  load('tu'); A.go({ v: 'summary' }); render(); ok('Chưa đồng ý thì không gửi', /Chưa chia sẻ với bác sĩ/.test(text()) && !/Gửi cho bác sĩ/.test(text()));
});
test('Hồ sơ', () => {
  load('an'); openTile('metrics'); c('hPart', { v: 'intake' });
  ok('Bệnh nền lấy chung câu trả lời, hiện đợt chẩn đoán', /Tăng huyết áp/.test(text()) && /Có, từ 2019/.test(text()));
  c('go', { v: 'condition', id: 'lipid' }); c('condSet', { id: 'lipid', v: 'yes' }); c('condNum', { id: 'lipid', k: 'ldl' }); keys('3'); c('key', { k: ',' }); keys('2'); c('numSave');
  ok('Câu chi tiết theo BRD', P().facts.lipid.v === 'yes' && P().facts.lipid.detail.ldl === 3.2);
  load('an'); A.go({ v: 'reminders' }); render(); c('trackToggle', { k: 'bp' }); c('timeStep', { k: 'sang', d: 15 });
  ok('Nhắc nhở gộp một chỗ', !P().track.bp && D.settings.times.sang === '07:15');
  home(); render(); ok('Tắt nhắc đo thì Hôm nay không còn việc huyết áp', !/đo huyết áp/.test(text()));
  load('an'); A.go({ v: 'display' }); render(); c('setting', { k: 'lang', v: 'en' });
  ok('Đổi sang tiếng Anh', /Display/.test(text()));
  c('tab', { t: 'settings' }); ok('Tab tiếng Anh', /Home/.test(document.getElementById('tabs').innerText));
  D.settings.lang = 'vi';
});

test('Hồ sơ sức khỏe: ba phần', () => {
  load('an'); openTile('metrics');
  ok('Ba phần, mặc định Theo dõi', document.querySelectorAll('#view .seg button').length === 3 && /Huyết áp/.test(text()) && /Lối sống/.test(text()) && /Triệu chứng/.test(text()) && !/Tóm tắt cho bác sĩ/.test(text()));
  c('go', { v: 'bpDetail' }); c('back'); ok('Từ mục quay lại đúng phần', /Huyết áp/.test(text()) && screen() === 'metrics');
  c('hPart', { v: 'intake' });
  ok('Hồ sơ ban đầu: đột quỵ, bệnh viện, bệnh nền, thuốc đã dùng, ô Khác', /Nhồi máu não/.test(text()) && /Bệnh viện mẫu A/.test(text()) && /Rối loạn mỡ máu/.test(text()) && /Thuốc chống đông/.test(text()) && !!document.getElementById('oc'));
  c('go', { v: 'condition', id: 'htn' }); ok('Bệnh nền sửa ở màn con, quay lại Hồ sơ ban đầu', /Tăng huyết áp/.test(document.querySelector('#view h1').textContent)); c('back'); ok('Về đúng phần Hồ sơ ban đầu', /Rối loạn mỡ máu/.test(text()));
  c('hPart', { v: 'visits' });
  ok('Khám bệnh: các lần khám theo ngày, mới nhất trước, có tóm tắt cho bác sĩ', /Phòng khám mẫu B/.test(text()) && /Bệnh viện mẫu A/.test(text()) && text().indexOf('Phòng khám mẫu B') < text().indexOf('12/08/2026') && !!findBtn('go', { v: 'summary' }));
  const n0 = P().visits.length; c('visitNew');
  ok('Form lần khám có ngày, bệnh viện, chẩn đoán, chụp phiếu', !!document.querySelector('input[data-field="visitDate"]') && !!document.getElementById('vp') && !!document.getElementById('vd') && !!findBtn('scan', { target: 'visit' }));
  c('visitSave'); ok('Chưa nhập bệnh viện thì không lưu', P().visits.length === n0 && screen() === 'visitForm');
  const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  set('vp', 'Bệnh viện mẫu C'); set('vd', 'Tăng huyết áp'); S.draft.scanTarget = 'visit'; scanned('data:image/gif;base64,R0lGODlhAQABAAAAACw='); render();
  ok('Ảnh phiếu khám hiện trong form', !!document.querySelector('#view img.thumb')); c('visitSave');
  const v = P().visits[P().visits.length - 1];
  ok('Lưu lần khám: ngày, bệnh viện, chẩn đoán, ảnh', P().visits.length === n0 + 1 && v.place === 'Bệnh viện mẫu C' && v.dx === 'Tăng huyết áp' && !!v.photo && dayKey(v.t) === dayKey(now()) && screen() === 'metrics' && /Bệnh viện mẫu C/.test(text()));
  c('visitEdit', { id: v.id }); set('vd', 'Đã sửa'); c('visitSave'); ok('Sửa lần khám', P().visits.find(x => x.id === v.id).dx === 'Đã sửa');
  c('visitEdit', { id: v.id }); c('visitDel'); c('visitDelYes'); ok('Xóa lần khám', P().visits.length === n0 && !/Bệnh viện mẫu C/.test(text()));
  load('tu'); openTile('metrics'); c('hPart', { v: 'visits' }); ok('Chưa có lần khám', /Chưa có lần khám/.test(text()));
  load('an'); c('go', { v: 'metrics' }); c('go', { v: 'symptoms' }); ok('Triệu chứng ghi được từ Theo dõi', /Có điều gì khác thường/.test(text()));
  load('xau'); openTile('metrics'); c('hPart', { v: 'visits' }); ok('Dữ liệu xấu nhất: Khám bệnh vẫn hiện', /Thêm lần khám/.test(text()));
});
test('Đăng nhập, đăng ký, quên và đổi mật khẩu, đăng xuất', () => {
  load('dn');
  ok('Mở app: màn đăng nhập, chưa có thanh dưới', screen() === 'login' && !document.querySelector('#tabs button') && !!document.getElementById('ph') && !!document.getElementById('pw'));
  c('accLogin'); ok('Thiếu số điện thoại thì ở lại', screen() === 'login');
  setField('accPhone', '0912345678'); setField('accPw', '123'); c('accLogin'); ok('Mật khẩu ngắn thì ở lại', screen() === 'login');
  setField('accPw', 'abcdef'); c('accLogin'); ok('Sang nhập mã OTP', screen() === 'otp');
  c('accOtp'); ok('Chưa đủ 6 số thì ở lại', screen() === 'otp');
  setField('accCode', '123456'); c('accOtp');
  ok('Đăng nhập xong, chưa có hồ sơ thì bắt đầu khai báo', screen() === 'welcome' && D.account.phone === '0912345678' && JSON.stringify(D).indexOf('abcdef') < 0);
  load('dn'); c('accGo', { v: 'register', mode: 'register' });
  ok('Đăng ký: điều khoản không chọn sẵn, nút tạo tài khoản chưa bấm được', !findBtn('accRegister') && !!findBtn('accAgree') && document.querySelector('#view [role="checkbox"]').getAttribute('aria-checked') === 'false');
  c('go', { v: 'terms' }); ok('Xem điều khoản', /không thay thế bác sĩ/.test(text())); c('back');
  setField('accPhone', '0912345678'); setField('accPw', 'abcdef'); setField('accPw2', 'abcdeg'); c('accAgree'); ok('Chọn đồng ý thì bấm được', !!findBtn('accRegister'));
  c('accRegister'); ok('Hai mật khẩu khác nhau thì ở lại', screen() === 'register');
  setField('accPw2', 'abcdef'); c('accRegister'); setField('accCode', '654321'); c('accOtp'); ok('Đăng ký xong vào phần bắt đầu', screen() === 'welcome');
  load('dn'); c('accGo', { v: 'forgot', mode: 'forgot' }); setField('accPhone', '0912345678'); c('accForgot'); setField('accCode', '111111'); c('accOtp');
  ok('Quên mật khẩu: sau mã OTP đặt mật khẩu mới', screen() === 'newPw');
  setField('accPw', 'newpass1'); setField('accPw2', 'newpass1'); c('accNewPw'); ok('Đặt xong về đăng nhập', screen() === 'login' && D.account === null);
  load('an'); c('tab', { t: 'settings' }); c('go', { v: 'account' }); ok('Cài đặt › Tài khoản: số điện thoại, đổi mật khẩu, đăng xuất', /Đổi mật khẩu/.test(text()) && /Đăng xuất/.test(text()) && /0900 000 000/.test(text()));
  c('go', { v: 'changePw' }); setField('accOld', 'abcdef'); setField('accPw', 'newpass1'); setField('accPw2', 'newpass1'); c('accChange'); ok('Đổi mật khẩu xong quay lại', screen() === 'account');
  c('accLogout'); ok('Đăng xuất hỏi lại', S.dialog && /Đăng xuất\?/.test(text())); c('accLogoutYes'); ok('Đăng xuất về màn đăng nhập, dữ liệu còn', screen() === 'login' && D.account === null && !!D.profiles.an);
  setField('accPhone', '0900000000'); setField('accPw', 'abcdef'); c('accLogin'); setField('accCode', '123456'); c('accOtp'); ok('Đăng nhập lại vào thẳng Trang chủ', screen() === 'home' && !!document.querySelector('.tiles'));
});
test('Lối sống: bộ câu hỏi, Giấc ngủ, biểu đồ', () => {
  ok('Vận động: nhẹ từ 2,5 giờ mỗi tuần là đủ, mạnh từ 1,5 giờ là mạnh', [{ light: 0.5 }, { light: 0.2 }, {}, { strong: 0.25 }].map(a => lifestyleClass('activity', a)).join() === 'good,little,none,strong');
  ok('Hút thuốc: không hoặc đã từng là không, đang hút theo số điếu', [{ status: 'never' }, { status: 'ex' }, { status: 'now', perDay: '10' }, { status: 'now', perDay: '20' }, { status: 'now', perDay: '40' }].map(a => lifestyleClass('smoke', a)).join() === 'none,none,little,mid,much');
  ok('Rượu bia theo đơn vị cồn mỗi ngày', [0, 1, 2, 3].map(n => lifestyleClass('alcohol', { units: n })).join() === 'none,little,mid,much');
  ok('Ăn uống: đủ rau, ít chiên, ít đồ ngọt, không thêm muối thường xuyên', lifestyleClass('diet', { veg: 14, fried: 3, sugar: 3, salt: 'never' }) === 'yes' && lifestyleClass('diet', { veg: 13, fried: 3, sugar: 3, salt: 'never' }) === 'no' && lifestyleClass('diet', { veg: 14, fried: 3, sugar: 3, salt: 'often' }) === 'no');
  ok('Giấc ngủ: 7 đến 9 giờ', [6.9, 7, 9, 9.5].map(n => lifestyleClass('sleep', { night: n })).join() === 'no,yes,yes,no');
  ok('Mỗi thói quen có bộ câu: ăn uống 9 câu, hút thuốc 7, giấc ngủ 5, vận động 3 ô, rượu bia 1', LIFESTYLE.diet.qs.length === 9 && LIFESTYLE.smoke.qs.length === 7 && LIFESTYLE.sleep.qs.length === 5 && LIFESTYLE.activity.qs.length === 3 && LIFESTYLE.alcohol.qs.length === 1 && new Set(LIFESTYLE.diet.qs.map(q => q.q)).size === 9);
  load('an'); openTile('metrics');
  ok('Lối sống có Vận động, Hút thuốc, Rượu bia, Giấc ngủ, Ăn uống', ['Vận động', 'Hút thuốc', 'Rượu bia', 'Giấc ngủ', 'Ăn uống'].every(n => text().includes(n)));
  c('go', { v: 'habit', k: 'activity' }); ok('Vận động: có biểu đồ, nút Cập nhật, số bước từ điện thoại', !!document.querySelector('#view svg.chart') && !!findBtn('go', { v: 'lifestyle', k: 'activity' }) && /Số bước từ điện thoại/.test(text()));
  c('back'); c('go', { v: 'habit', k: 'sleep' }); ok('Giấc ngủ có biểu đồ và giấc ngủ từ điện thoại', !!document.querySelector('#view svg.chart') && /Giấc ngủ từ điện thoại/.test(text()));
  c('toggleSync', { k: 'sleep' }); ok('Lấy giấc ngủ từ điện thoại hỏi lại', S.dialog && /giấc ngủ từ điện thoại/.test(text())); c('syncYes', { k: 'sleep' }); ok('Bật giấc ngủ từ điện thoại', P().track.sleep && /Đêm qua/.test(text()));
  c('go', { v: 'lifestyle', k: 'sleep' }); const nSl = P().lifestyleLog.length;
  ok('Giấc ngủ: 5 câu', document.querySelectorAll('#view .ls-q').length === 5);
  c('lsSave'); ok('Chưa trả lời thì không lưu', screen() === 'lifestyle' && P().lifestyleLog.length === nSl);
  setField('lsNum', '6'); document.querySelectorAll('#view [data-field="lsNum"]').forEach((el, i) => { el.value = i === 0 ? '6' : '1'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  ['onset', 'wake', 'tired'].forEach(id => c('lsPick', { id, v: 'sometimes' })); c('lsSave');
  ok('Lưu: ngủ 6 giờ là chưa đủ, thêm một điểm biểu đồ, ghi vào nhật ký', screen() === 'habit' && P().habits.sleep === 'no' && P().lifestyleLog.length === nSl + 1 && P().lifestyleLog[nSl].m === 6 && P().lifestyle.sleep.ans.onset === 'sometimes' && /Cần cải thiện/.test(text()));
  c('back'); c('go', { v: 'habit', k: 'smoke' }); c('go', { v: 'lifestyle', k: 'smoke' });
  ok('Hút thuốc: ban đầu 1 câu, chọn Đang hút thì hiện đủ 7 câu', document.querySelectorAll('#view .ls-q').length === 1 && (c('lsPick', { id: 'status', v: 'now' }), document.querySelectorAll('#view .ls-q').length === 7));
  c('lsPick', { id: 'perDay', v: '20' }); ['first', 'banned', 'hardest', 'morning', 'sick'].forEach(id => c('lsPick', { id, v: { first: '30', hardest: 'first' }[id] || 'no' })); c('lsSave');
  ok('Hút thuốc 11–20 điếu: mức vừa, ghi thành câu thang điểm Hút thuốc = Có', P().habits.smoke === 'mid' && factOf(P(), 'smoke') === 'yes' && P().lifestyleLog.filter(x => x.k === 'smoke').pop().m === 20);
  c('back'); c('go', { v: 'habit', k: 'diet' }); c('go', { v: 'lifestyle', k: 'diet' }); ok('Ăn uống: 9 câu, câu đầu có 3 ô nguồn bữa ăn', document.querySelectorAll('#view .ls-q').length === 9 && !!document.querySelector('#view [data-id="home"]') && !!document.querySelector('#view [data-id="order"]'));
  c('lsClose'); ok('Đóng không lưu', screen() === 'habit');
  load('an'); A.go({ v: 'lifestyle', k: 'alcohol' }); render(); ok('Rượu bia: 1 câu có quy đổi đơn vị cồn', document.querySelectorAll('#view .ls-q').length === 1 && /1 lon bia 330 ml/.test(text()));
  load('an'); ok('Mỗi tuần một thói quen luân phiên, kể cả giấc ngủ', [0, 1, 2, 3].map(i => weeklyKind(Object.assign({}, P(), { habitLog: [] }), now() + i * 7 * DAY)).sort().join() === 'activity,alcohol,diet,sleep');
  c('dosesAll', { mk: 'sang' }); c('startBP'); keys('126'); keys('78'); c('bpSave'); c('back');
  const wk = weeklyKind(P(), now());
  ok('Hôm nay: xong việc thì hỏi một thói quen trong tuần, bấm Trả lời', !!wk && /tuần này/.test(text()) && !!findBtn('go', { v: 'lifestyle', k: wk }));
  c('go', { v: 'lifestyle', k: wk }); const kk = wk; LIFESTYLE[kk].qs.filter(q => q.kind !== 'pick').forEach(q => (q.nums || [[q.id]]).forEach(([id]) => { S.draft.ls.ans[id] = '1'; })); LIFESTYLE[kk].qs.filter(q => q.kind === 'pick' && !q.only).forEach(q => { S.draft.ls.ans[q.id] = q.opts[0][0]; });
  A.lsSave(); render(); ok('Trả lời xong về Hôm nay, có lời nhận xét, không hỏi lại tuần này', screen() === 'home' && weeklyKind(P(), now()) === null && /Tốt|Cần cải thiện/.test(text()));
  load('xau'); openTile('metrics'); c('go', { v: 'habit', k: 'diet' }); ok('Dữ liệu xấu nhất: Ăn uống vẫn hiện', /Cập nhật/.test(text()));
});
test('Liên hệ: chat, trợ lý AI, lịch hẹn, thêm bác sĩ', () => {
  load('an'); openTile('contact'); c('openChat');
  ok('Chat: tin cũ của bác sĩ, ô gõ, nút Gửi', /Nhớ mang kết quả/.test(text()) && !!document.querySelector('#view [data-field="chatText"]') && !!findBtn('chatSend'));
  c('chatSend'); ok('Gửi tin trống thì không gửi', P().messages.filter(m => m.mine).length === 0);
  setField('chatText', 'Dạ cháu cảm ơn bác sĩ'); c('chatSend');
  const mine = P().messages.filter(m => m.mine);
  ok('Hai chiều: tin của bạn hiện bên phải, ô gõ được xóa', mine.length === 1 && mine[0].text === 'Dạ cháu cảm ơn bác sĩ' && !!document.querySelector('#view .bubble.mine') && /Dạ cháu cảm ơn/.test(text()) && document.querySelector('#view [data-field="chatText"]').value === '');
  A.pMsg(); openTile('contact'); c('openChat'); ok('Bác sĩ nhắn thì hiện thêm tin của bác sĩ', /Huyết áp tuần này khá ổn/.test(text()));
  c('back'); c('go', { v: 'assistant' });
  ok('Trợ lý AI: câu hỏi thường gặp, ô gõ', /Câu hỏi thường gặp/.test(text()) && !!document.querySelector('#view [data-field="aiText"]'));
  setField('aiText', 'ăn nhạt thế nào'); c('aiSend');
  ok('Câu có trong tài liệu: trả lời, không chuyển bác sĩ', /5 g muối/.test(text()) && !findBtn('aiForward'));
  setField('aiText', 'Tôi quên liều thuốc thì sao'); c('aiSend');
  ok('Câu về liều thuốc: chuyển bác sĩ, không tự trả lời cách dùng bù', /cần bác sĩ hoặc dược sĩ/.test(text()) && !!findBtn('aiForward') && !/dùng bù/.test(text()));
  const n0 = P().messages.length; c('aiForward', { i: 1 });
  ok('Chuyển cho bác sĩ: thành tin nhắn trong chat', P().messages.length === n0 + 1 && /Từ trợ lý AI/.test(P().messages[n0].text) && P().aiLog[1].forwarded && !findBtn('aiForward'));
  setField('aiText', 'Tôi bị méo miệng và nói khó'); c('aiSend');
  ok('Dấu hiệu đột quỵ: bảo gọi 115 ngay, có nút gọi', /gọi 115 ngay/.test(text()) && !!findBtn('call', { num: '115' }));
  setField('aiText', 'thời tiết hôm nay'); c('aiSend'); ok('Câu không có trong tài liệu: chuyển bác sĩ', /Câu này cần bác sĩ trả lời/.test(text()));
  c('back'); c('go', { v: 'appts' });
  ok('Lịch hẹn: lịch bác sĩ đặt và nút Đặt lịch', /Bác sĩ hẹn/.test(text()) && !!findBtn('apptNew'));
  c('apptNew'); ok('Đặt lịch: chọn ngày từ ngày mai, chọn buổi', !!document.querySelector('#view input[data-field="aptDate"]') && document.querySelector('#view input[data-field="aptDate"]').min === '2026-11-01' && !!findBtn('aptSlot', { v: 'chieu' }));
  c('aptSlot', { v: 'chieu' }); setField('aptDate', '2026-11-12'); const na = P().appts.length; c('aptSend');
  const ap = P().appts[na];
  ok('Bệnh nhân đặt: chờ bác sĩ, đúng ngày và buổi', P().appts.length === na + 1 && ap.state === 'pending' && ap.by === 'patient' && dayKey(ap.t) === '2026-11-12' && hhmm(ap.t) === '14:00' && screen() === 'appts' && /Chờ bác sĩ/.test(text()));
  ok('Lịch chờ chưa vào Sắp tới', nextAppt(P()).id !== ap.id);
  A.pApptOk(); render(); c('go', { v: 'contact' }); c('go', { v: 'appts' }); ok('Bác sĩ nhận lịch thì thành lịch hẹn', P().appts[na].state === 'upcoming');
  c('back'); c('go', { v: 'addDoctor' }); c('docSend'); ok('Chưa nhập mã thì không gửi', screen() === 'addDoctor' && !(P().doctors || []).length);
  c('docScan'); ok('Quét mã điền mã bác sĩ', document.querySelector('#view [data-field="docCode"]').value === 'BS-2468' || S.draft.doc.code === 'BS-2468');
  c('docSend'); ok('Thêm bác sĩ: chờ bác sĩ đồng ý', screen() === 'contact' && P().doctors[0].state === 'pending' && /Chờ bác sĩ đồng ý/.test(text()));
  A.pDocOk(); render(); c('go', { v: 'contact' }); ok('Bác sĩ đồng ý thì liên kết, hiện bệnh viện', P().doctors[0].state === 'linked' && /Bệnh viện mẫu B/.test(text()));
  load('mai'); openTile('contact'); c('openChat'); ok('Người nhà nhập hộ: tin gửi ghi người gửi', (setField('chatText', 'Chào bác sĩ'), c('chatSend'), P().messages.some(m => m.mine && m.by === 'Trần Mai')));
});
test('Trang chủ, Thông báo, Liên hệ, Cài đặt', () => {
  load('an');
  ok('Trang chủ không có thanh trên khi 115 ẩn, có thẻ chào và 5 ô', !document.querySelector('#view .top') && !!document.querySelector('.hello') && ['risk', 'meds', 'metrics', 'contact', 'learn'].every(v => !!findBtn('go', { v })));
  ok('Hôm nay không có lời mời đánh giá app và không có avatar', !/Bạn thấy app thế nào/.test(text()) && !document.querySelector('.avatar'));
  c('go', { v: 'meds' }); ok('Ô Thuốc mở màn Thuốc, quay về Trang chủ', /Đang dùng/.test(text()) && !!findBtn('back')); c('back'); ok('Về Trang chủ', screen() === 'home');
  c('go', { v: 'metrics' }); ok('Ô Hồ sơ sức khỏe', /Hồ sơ sức khỏe/.test(document.querySelector('#view h1').textContent)); c('back');
  c('go', { v: 'contact' }); ok('Liên hệ: bác sĩ, trợ lý AI, lịch hẹn, thêm bác sĩ', /Bác sĩ/.test(text()) && /Trợ lý AI/.test(text()) && /Lịch hẹn/.test(text()) && /Thêm bác sĩ/.test(text()));
  c('go', { v: 'appts' }); c('go', { v: 'visit' }); ok('Lịch hẹn mở tái khám', /Tái khám/.test(text())); c('back'); c('back'); c('back');
  c('tab', { t: 'notif' }); ok('Thông báo có tái khám trong 7 ngày hoặc báo chưa có', /Thông báo/.test(document.querySelector('#view h1').textContent));
  c('tab', { t: 'settings' }); ok('Cài đặt: chia sẻ, nhắc nhở, hiển thị, phản hồi', ['sharing', 'reminders', 'display', 'feedback'].every(v => !!findBtn('go', { v })) && !findBtn('openChat'));
  A.pPrompt(); render(); c('tab', { t: 'notif' }); ok('Lời mời đánh giá app nằm ở Thông báo', /Bạn thấy app thế nào/.test(text()));
  load('an'); A.pMsg(); c('tab', { t: 'notif' }); ok('Tin nhắn mới của bác sĩ hiện ở Thông báo', !!findBtn('openChat'));
  load('xau'); ok('Dữ liệu xấu nhất vẫn có Trang chủ', !!document.querySelector('.tiles'));
});
test('Phần ẩn ở bước 1', () => {
  load('an'); ok('Thanh dưới có 3 tab, năm ô chức năng', document.querySelectorAll('#tabs button').length === 3 && document.querySelectorAll('.tile-btn').length === 5);
  ok('Cờ ẩn đúng', !FEATURES.sos && !FEATURES.exercises && !FEATURES.plan && !FEATURES.hba1c && !FEATURES.egfr);
  ok('Hôm nay không có nút 115', !document.querySelector('.sos') && !findBtn('open115'));
  A.open115({}); ok('Bấm 115 khi ẩn không mở sheet', !S.sheet);
  c('tab', { t: 'settings' }); ok('Cài đặt không có Thẻ cấp cứu', !/Thẻ cấp cứu/.test(text()));
  c('go', { v: 'info' }); ok('Thông tin cá nhân không có Đi lại', !/Đi lại/.test(text()));
  load('an'); openTile('metrics');
  ok('Chỉ số không có kế hoạch theo dõi, HbA1c, eGFR', !/Kế hoạch theo dõi/.test(text()) && !/HbA1c/.test(text()) && !/eGFR/.test(text()));
  c('labAdd'); ok('Thêm xét nghiệm chỉ còn 5 chỉ số mỡ máu và đường huyết', !/HbA1c/.test(text()) && !/eGFR/.test(text()) && /Đường huyết lúc đói/.test(text()) && document.querySelectorAll('#sheetLayer [data-a="labChoose"]').length === 5);
  load('an'); openTile('metrics'); c('go', { v: 'bpDetail' }); ok('Huyết áp không có máy đo kết nối', !/Máy đo có kết nối/.test(text()));
  withFlags({ sos: true, plan: true, hba1c: true, egfr: true, deviceLink: true }, () => {
    load('an'); ok('Bật cờ thì có lại nút 115', !!document.querySelector('.sos'));
    openTile('metrics'); ok('Bật cờ thì có lại kế hoạch, HbA1c, eGFR', /Kế hoạch theo dõi/.test(text()) && /HbA1c/.test(text()) && /eGFR/.test(text()));
    c('open115'); ok('Bật cờ thì sheet 115 mở được', S.sheet && S.sheet.v === 'sos' && /Thẻ cấp cứu/.test(text()));
  });
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
    if (!['faq', 'risk', 'assistant'].includes(current().v) && /mức nguy cơ|nguy cơ (thấp|trung bình|cao)|điểm nguy cơ/i.test(txt)) issues.add(`Hiện nguy cơ: ${s}`);
    if (current().v === 'risk' && /\d+\s*(điểm|%)|điểm nguy cơ|\bESRS\b|\bFSRP\b/i.test(txt)) issues.add(`Hiện điểm hoặc tên thang: ${s}`);
    if (document.querySelector('#phone .sub, #phone .note, #phone .d, #phone .legend')) issues.add(`Còn chữ phụ kiểu cũ: ${s}`);
    if (FEATURES.sos && !S.sheet && !S.lock && !document.querySelector('#view .sos')) issues.add(`Thiếu nút 115: ${current().v}`);
    if (!FEATURES.sos && document.querySelector('#phone .sos')) issues.add(`115 phải ẩn: ${current().v}`);
    if (!S.sheet && !S.lock && !document.querySelector('#view h1')) issues.add(`Thiếu tiêu đề: ${current().v}`);
    btns().forEach(b => { const r = b.getBoundingClientRect(); if (r.width && (r.height < 44 || r.width < 44)) issues.add(`Nút nhỏ: ${(b.innerText || b.dataset.a).trim().slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`); if (!A[b.dataset.a]) issues.add(`Nút không có hành động: ${b.dataset.a}`); if (!(b.innerText.trim() || b.getAttribute('aria-label'))) issues.add(`Nút thiếu nhãn: ${b.dataset.a}`); });
    const next = [...new Set(btns().map(b => b.dataset.a + JSON.stringify(b.dataset)))].filter(x => !/^(key|wStep|setting|pickWhen)\{/.test(x) && !(x.startsWith('open115') && path.length) && !(x.startsWith('call{') && path.length > 2) && !x.startsWith('scan{'));
    next.forEach(x => queue.push(path.concat([x])));
  }
  clearInterval(guideTimer);
  return { k, states: seen.size, left: queue.length, issues: [...issues] };
}
const crawls = [];
['an', 'ha', 'tu', 'mai', 'lan', 'binh', 'moi', 'xau'].forEach(k => { try { crawls.push(crawl(k)); } catch (e) { crawls.push({ k, states: 0, left: 0, issues: [e.message] }); } });
try { crawls.push(Object.assign(crawl('an', () => { D.settings.size = 'xl'; document.getElementById('phone').style.width = '320px'; }), { k: 'an, chữ rất lớn, 320px' })); } catch (e) { crawls.push({ k: 'xl', states: 0, issues: [e.message] }); }
try { crawls.push(Object.assign(crawl('xau', () => { D.settings.size = 'xl'; document.getElementById('phone').style.width = '320px'; }), { k: 'dữ liệu xấu nhất, chữ rất lớn, 320px' })); } catch (e) { crawls.push({ k: 'xau xl', states: 0, issues: [e.message] }); }
document.getElementById('phone').style.width = '390px';
crawls.forEach(r => ok(`Duyệt mọi màn: ${r.k} (${r.states} màn${r.left ? `, còn ${r.left}` : ''})`, !r.issues.length, r.issues.slice(0, 6).join(' | ')));

const fails = results.filter(r => !r.pass);
document.title = `${fails.length ? 'FAIL' : 'PASS'} ${results.length - fails.length}/${results.length}`;
document.getElementById('report').textContent = `${document.title}\n\n${results.map(r => `${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.extra != null && r.extra !== '' ? `  [${r.extra}]` : ''}`).join('\n')}`;
