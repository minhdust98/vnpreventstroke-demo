'use strict';
// Mở Edge hoặc Chrome không giao diện và điều khiển một tab qua DevTools Protocol. Cần Node 22 trở lên.
// Đặt biến BROWSER nếu trình duyệt nằm chỗ khác.

const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const BROWSERS = [process.env.BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
  let id = 0;
  const waiting = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (!m.id || !waiting.has(m.id)) return;
    const { ok, fail } = waiting.get(m.id);
    waiting.delete(m.id);
    if (m.error) fail(new Error(m.error.message)); else ok(m.result);
  };
  const send = (method, params, sessionId) => new Promise((ok, fail) => { id++; waiting.set(id, { ok, fail }); ws.send(JSON.stringify({ id, method, params: params || {}, sessionId })); });
  return { send, close: () => ws.close() };
}

async function openBrowser() {
  const exe = BROWSERS.find(p => fs.existsSync(p));
  if (!exe) throw new Error('Không tìm thấy Edge hoặc Chrome. Đặt biến BROWSER trỏ tới trình duyệt.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vnps-browser-'));
  const proc = spawn(exe, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let port, wsPath;
  for (let i = 0; i < 100 && !wsPath; i++) {
    try { [port, wsPath] = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n'); } catch (_) { /* trình duyệt chưa sẵn sàng */ }
    if (!wsPath) await sleep(100);
  }
  const b = await connect(`ws://127.0.0.1:${port}${wsPath}`);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await b.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p) => b.send(m, p, sessionId);
  const run = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    return r.result.value;
  };
  return {
    port: Number(port), send, run,
    // ready: biểu thức trả true khi trang đã dựng xong
    async open(url, { w = 375, h = 812, theme = 'light', ready = "document.readyState === 'complete'" } = {}) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
      await send('Page.navigate', { url });
      for (let i = 0; i < 600; i++) { if (await run(ready).catch(() => false)) return; await sleep(50); }
      throw new Error(`Trang không sẵn sàng: ${url}`);
    },
    async shot(file) { const { data } = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(data, 'base64')); },
    close() { b.close(); proc.kill(); },
  };
}

module.exports = { openBrowser };
