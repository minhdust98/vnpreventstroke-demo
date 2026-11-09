'use strict';
// Chụp các màn chính và đo số chữ, số chạm, bằng Edge hoặc Chrome không giao diện.
//   node tests/shots.js                     ảnh vào thư mục tạm của máy
//   node tests/shots.js <thư mục> today,meds chỉ chụp vài màn
// Ảnh không để trong repo vì repo công khai. Số liệu ghi vào <thư mục>/metrics.json để so trước và sau.

const fs = require('fs'), os = require('os'), path = require('path');
const { pathToFileURL } = require('url');
const { openBrowser } = require('./browser');

const APP = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const OUT = process.argv[2] || path.join(os.tmpdir(), 'vnps-shots');
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;

// Màn: [kịch bản dữ liệu, lệnh dựng màn chạy trong trang]
const SCREENS = {
  home: ['an', ''],
  risk: ['binh', "go('risk')"],
  riskHigh: ['binh', "go('risk'); ['htn', 'dm', 'pad', 'mi'].forEach(id => A.riskAns({ id, v: 'yes' }))"],
  riskNeed: ['an', "go('risk')"],
  riskNa: ['lan', "go('risk')"],
  notif: ['an', "S.tab = 'notif'"],
  settings: ['an', "S.tab = 'settings'"],
  contact: ['an', "go('contact')"],
  meds: ['an', "go('meds')"],
  rxReview: ['an', "go('meds'); A.medNew({}); A.rxQr()"],
  moment: ['an', "go('meds'); A.openMoment({ mk: 'toi' })"],
  medForm: ['an', "go('meds'); A.medNew({})"],
  metrics: ['an', "go('metrics')"],
  hIntake: ['an', "go('metrics'); S.draft.hpart = 'intake'"],
  hVisits: ['an', "go('metrics'); S.draft.hpart = 'visits'"],
  visitForm: ['an', "go('metrics'); A.visitNew()"],
  xauHIntake: ['xau', "go('metrics'); S.draft.hpart = 'intake'"],
  xauHVisits: ['xau', "go('metrics'); S.draft.hpart = 'visits'"],
  glucose: ['ha', "go('metrics')"],
  bpEntry: ['an', 'A.startBP({})'],
  bpResult: ['an', "A.startBP({}); Object.assign(S.draft.bp, { sys: '126', dia: '78' }); A.bpSave({})"],
  bpDanger: ['an', "A.startBP({}); Object.assign(S.draft.bp, { sys: '192', dia: '118' }); A.bpSave({})"],
  bpDetail: ['an', "go('metrics'); go('bpDetail')"],
  labDetail: ['an', "go('metrics'); go('labDetail', { test: 'ldl' })"],
  labAdd: ['an', "go('metrics'); A.labAdd({})"],
  labEntry: ['an', "go('metrics'); A.labChoose({ test: 'ldl' })"],
  scanReview: ['an', "go('metrics'); A.pScan()"],
  learn: ['an', "go('learn')"],
  befast: ['an', "go('learn'); go('befast')"],
  diet: ['an', "go('learn'); go('topic', { topic: 'diet' })"],
  
  login: ['dn', ''],
  register: ['dn', "A.accGo({ v: 'register', mode: 'register' })"],
  otp: ['dn', "acc().phone = '0912 345 678'; go('otp')"],
  account: ['an', "S.tab = 'settings'; go('account')"],
  onLink: ['moi', "S.draft.on = { stroke: true, linked: true }; S.stack = [{ v: 'onLink', p: {} }]"],
  welcome: ['moi', ''],
  lock: ['an', "A.pNotif({ kind: 'meds', mk: 'sang' })"],
  empty: ['tu', ''],
  hist0: ['moi', "S.draft.on = { stroke: false, hist: { htn: 'yes' } }; S.stack = [{ v: 'onHist', p: { step: 0 } }]"],
  hist1: ['moi', "S.draft.on = { stroke: false, hist: {} }; S.stack = [{ v: 'onHist', p: { step: 1 } }]"],
  hist2: ['moi', "S.draft.on = { stroke: false, hist: { smoke: 'little' } }; S.stack = [{ v: 'onHist', p: { step: 2 } }]"],
  hist3: ['moi', "S.draft.on = { stroke: false, hist: { family: 'yes', familyKinds: ['Đột quỵ'] } }; S.stack = [{ v: 'onHist', p: { step: 3 } }]"],
  hist4: ['moi', "S.draft.on = { stroke: false, hist: { symptoms: [] } }; S.stack = [{ v: 'onHist', p: { step: 4 } }]"],
  summary: ['ha', "go('metrics'); go('summary')"],
  // Dữ liệu xấu nhất: tên dài, bảy thuốc, chưa có số đo, xét nghiệm ngoài ngưỡng
  xauHome: ['xau', ''],
  xauMeds: ['xau', "go('meds')"],
  xauMetrics: ['xau', "go('metrics')"],
  xauBp: ['xau', "go('metrics'); go('bpDetail')"],
  xauLab: ['xau', "go('metrics'); go('labDetail', { test: 'egfr' })"],
  xauVisit: ['xau', "go('visit')"],
  xauSettings: ['xau', "S.tab = 'settings'"],
  xauLock: ['xau', "A.pNotif({ kind: 'meds', mk: 'sang' })"],
};
const VARIANTS = [
  { id: '375', w: 375, h: 812, theme: 'light', size: 'l' },
  { id: '375-toi', w: 375, h: 812, theme: 'dark', size: 'l' },
  { id: '375-xl', w: 375, h: 812, theme: 'light', size: 'xl' },
  { id: '320-xl-toi', w: 320, h: 640, theme: 'dark', size: 'xl' },
];
// Việc chính: đếm số lần bấm, kể cả phím số
const TASKS = {
  'Dùng thuốc buổi sáng': ['an', "c('dosesAll', { mk: 'sang' })"],
  'Ghi huyết áp 126/78': ['an', "c('startBP'); k('126'); k('78'); c('bpSave')"],
  'Nhập LDL 1,7 từ Hồ sơ sức khỏe': ['an', "c('go', { v: 'metrics' }); c('labAdd'); c('labChoose', { test: 'ldl' }); k('1,7'); c('numSave')"],
};

// Đặt lại dữ liệu, tắt chuyển động để ảnh không chụp giữa chừng
const reset = (k, v) => `D = null; localStorage.clear(); loadScenario('${k}'); D.settings.theme = '${v.theme}'; D.settings.size = '${v.size}';`;
const PAGE_HELPERS = `
  document.head.insertAdjacentHTML('beforeend', '<style>*,*::before,*::after{transition:none!important;animation:none!important}#toast{display:none!important}</style>');
  window.__taps = 0;
  window.c = (a, p) => {
    const el = [...document.querySelectorAll('#phone [data-a]')].filter(x => !x.disabled).find(x => x.dataset.a === a && Object.entries(p || {}).every(([q, v]) => x.dataset[q] === String(v)));
    if (!el) throw new Error('Không thấy nút ' + a + ' ' + JSON.stringify(p || {}));
    el.click(); window.__taps++;
  };
  window.k = s => [...s].forEach(x => c('key', { k: x }));
  // Chữ trên lớp trên cùng đang hiện: khóa, hộp thoại, sheet, rồi mới đến màn
  window.words = () => {
    const top = ['lockLayer', 'dialogLayer', 'sheetLayer', 'view'].map(id => document.getElementById(id)).find(el => el.innerText.trim());
    return top ? top.innerText.split(/\\s+/).filter(w => /[\\p{L}\\p{N}]/u.test(w)).length : 0;
  };
  true;`;

async function main() {
  const br = await openBrowser(), run = br.run;
  const open = async v => { await br.open(APP, { w: v.w, h: v.h, theme: v.theme, ready: "document.readyState === 'complete' && typeof D !== 'undefined' && !!D" }); await run(PAGE_HELPERS); };
  const shot = file => br.shot(path.join(OUT, file));

  fs.mkdirSync(OUT, { recursive: true });
  const metrics = { words: {}, taps: {}, errors: [] };
  for (const v of VARIANTS) {
    await open(v);
    for (const [name, [k, setup]] of Object.entries(SCREENS)) {
      if (ONLY && !ONLY.includes(name)) continue;
      try {
        await run(`${reset(k, v)} ${setup}; render(); document.getElementById('view').scrollTop = 0; true`);
        await shot(`${name}-${v.id}.png`);
        const more = await run("(() => { const el = document.getElementById('view'); const max = el.scrollHeight - el.clientHeight; if (max < 8 || document.getElementById('sheetLayer').innerText.trim() || document.getElementById('lockLayer').innerText.trim()) return false; el.scrollTop = max; return true; })()");
        if (more) await shot(`${name}-${v.id}-cuoi.png`);
        if (v === VARIANTS[0]) metrics.words[name] = await run('words()');
        const overflow = await run('document.getElementById(\'phone\').scrollWidth > document.getElementById(\'phone\').clientWidth + 1');
        if (overflow) metrics.errors.push(`${name} ${v.id}: tràn ngang`);
      } catch (e) { metrics.errors.push(`${name} ${v.id}: ${e.message.split('\n')[0]}`); }
    }
  }
  await open(VARIANTS[0]);
  for (const [name, [k, steps]] of Object.entries(TASKS)) {
    try { metrics.taps[name] = await run(`${reset(k, VARIANTS[0])} render(); window.__taps = 0; ${steps}; window.__taps`); } catch (e) { metrics.errors.push(`${name}: ${e.message.split('\n')[0]}`); }
  }
  fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2));
  br.close();
  const total = Object.values(metrics.words).reduce((a, n) => a + n, 0);
  console.log(`Ảnh: ${OUT}`);
  console.log('Số chữ:', Object.entries(metrics.words).map(([n, w]) => `${n} ${w}`).join(', '), `| tổng ${total}`);
  console.log('Số chạm:', Object.entries(metrics.taps).map(([n, t]) => `${n} ${t}`).join(', '));
  if (metrics.errors.length) { console.log('Lỗi:\n  ' + metrics.errors.join('\n  ')); process.exitCode = 1; }
}

main().catch(e => { console.error(e); process.exit(1); });
