// Kiểm tra quy tắc và dữ liệu, không cần trình duyệt: node test/logic.js
const path = require('path');
global.window = global;
const dir = path.join(__dirname, '..', 'web-bac-si-v2');
['data.js', 'rules.js', 'insights.js'].forEach((f) => require(path.join(dir, f)));
const V = global.VNPS, D = V.data, R = V.rules, I = V.ins;
let fail = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fail++; };

const cls = R.classifyAll(D.unit);
const count = (L) => { const k = { act: 0, watch: 0, ok: 0 }; L.forEach((p) => { k[cls[p.id].level]++; }); return k; };
const nam = count(D.patients);
ok(D.patients.length === 48 && nam.act === 6 && nam.watch === 14 && nam.ok === 28, 'BS. Nam: 48 bệnh nhân, 6 / 14 / 28 (' + JSON.stringify(nam) + ')');
const core = { P001: 'act', P002: 'watch', P003: 'watch', P004: 'ok', P005: 'ok' };
Object.keys(core).forEach((id) => ok(cls[id].level === core[id], id + ' đúng mức ' + core[id] + ' theo file 00'));
ok(D.patients.every((p) => p.doc === 'nam'), 'Cổng Bác sĩ chỉ có bệnh nhân của BS. Nam');
ok(D.doctors.every((d) => D.unit.some((p) => p.doc === d.id)), 'Mỗi bác sĩ trong khoa có bệnh nhân');
ok(new Set(D.unit.map((p) => p.id)).size === D.unit.length, 'Mã bệnh nhân không trùng trong khoa');
ok(D.patients.filter(I.severe).length === 18, 'Ca nặng (mRS ≥3) của BS. Nam: 18');
ok(I.recovery(D.patients.find((p) => p.id === 'P008')).s.map((x) => x.v).join('>') === '4>4>3>2', 'P008 có chuỗi mRS 4 > 4 > 3 > 2');
ok(I.median([5, 1, 3]) === 3 && I.median([1, 3]) === 2, 'Trung vị tính đúng');
const p = D.unit.find((x) => x.thread.length >= 2 && x.thread[0].from !== 'bs' && x.thread[1].from === 'bs');
ok(!!p && I.replyHours(p)[0] > 0, 'Đo được thời gian trả lời tin nhắn');
const ik = (id) => cls[id].reasons.filter((r) => r.code.startsWith('intake'));
ok(ik('P011').some((r) => r.code === 'intake-af' && r.level === 'watch') && ik('P013').some((r) => r.code === 'intake-sym' && r.level === 'watch') && ik('P020').some((r) => r.code === 'intake-sym'), 'Hồ sơ ban đầu: 2 cảnh báo [Đề xuất] ở mức cần theo dõi (P011 rung nhĩ, P013 và P020 triệu chứng)');
ok(!R.intakeShared(D.patients.find((p) => p.id === 'P005')) && !ik('P005').length, 'P005 chưa đồng ý chia sẻ: bác sĩ không thấy hồ sơ ban đầu, không có cảnh báo');
ok(D.unit.every((p) => !ik(p.id).length || cls[p.id].level !== 'ok'), 'Cảnh báo hồ sơ ban đầu không làm bệnh nhân nào thành cần can thiệp và không có ai ổn định mang cảnh báo');
console.log(fail ? fail + ' kiểm tra lỗi' : 'Tất cả đạt');
process.exit(fail ? 1 : 0);
