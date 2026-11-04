'use strict';
// Chạy tests/index.html trong trình duyệt không giao diện, in kết quả, thoát mã 1 nếu có ca hỏng.
//   node tests/run.js

const path = require('path');
const { pathToFileURL } = require('url');
const { openBrowser } = require('./browser');

(async () => {
  const br = await openBrowser();
  try {
    await br.open(pathToFileURL(path.join(__dirname, 'index.html')).href, { ready: '/^(PASS|FAIL)/.test(document.title)' });
    const report = await br.run("document.getElementById('report').textContent");
    const fails = report.split('\n').filter(l => l.startsWith('FAIL  '));
    console.log(fails.length ? fails.join('\n') : report.split('\n').slice(-3).join('\n'));
    console.log(await br.run('document.title'));
    process.exitCode = /^PASS/.test(await br.run('document.title')) ? 0 : 1;
  } finally { br.close(); }
})().catch(e => { console.error(e); process.exit(1); });
