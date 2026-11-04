// Edge/Chrome chạy ngầm qua giao thức DevTools, bấm bằng chuột thật. Dùng chung cho ui.js và worst.js (Node ≥ 22, không cần cài gói).
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const PAGE = 'file:///' + path.join(__dirname, '..', 'web-bac-si-v2', 'index.html').replace(/\\/g, '/').replace(/ /g, '%20');
const BROWSER = process.env.BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((f) => fs.existsSync(f));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

exports.sleep = sleep;
exports.open = async () => {
  if (!BROWSER) throw new Error('Không tìm thấy Edge/Chrome. Đặt biến BROWSER=đường dẫn trình duyệt.');
  const port = 9400 + Math.floor(Math.random() * 400), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'vnps-'));
  const proc = spawn(BROWSER, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  let tgt; for (let i = 0; i < 60 && !tgt; i++) { try { tgt = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find((t) => t.type === 'page'); } catch (e) { /* đợi trình duyệt */ } if (!tgt) await sleep(300); }
  if (!tgt) { proc.kill(); throw new Error('Trình duyệt không mở được cổng ' + port); }
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
  let seq = 0; const waits = {}, errors = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && waits[d.id]) { (d.error ? waits[d.id].rej : waits[d.id].res)(d.error || d.result); delete waits[d.id]; } if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text); };
  const send = (method, params) => new Promise((res, rej) => { const id = ++seq; waits[id] = { res, rej }; ws.send(JSON.stringify({ id, method, params: params || {} })); });
  await send('Page.enable'); await send('Runtime.enable');
  const b = { errors, send };
  b.js = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text); return r.result.value; };
  b.view = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  // Mở lại trang từ đầu: trạng thái và dữ liệu về mặc định.
  b.goto = async (hash) => { await send('Page.navigate', { url: 'about:blank' }); await sleep(100); await send('Page.navigate', { url: PAGE + (hash || '') }); await sleep(700); };
  // Bấm bằng chuột thật vào phần tử đầu tiên khớp selector (và chữ, nếu có); lỗi nếu phần tử bị che.
  b.click = async (sel, text) => {
    const p = await b.js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(sel)})].find(e=>e.getClientRects().length&&(!${JSON.stringify(text || '')}||e.textContent.includes(${JSON.stringify(text || '')})));if(!e)return{miss:1};e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,t=document.elementFromPoint(x,y);return{x,y,ok:!!t&&(t===e||e.contains(t))}})()`);
    if (p.miss) throw new Error('Không thấy ' + sel + ' ' + (text || ''));
    if (!p.ok) throw new Error('Bị che: ' + sel + ' ' + (text || ''));
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await sleep(120);
  };
  b.key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); await sleep(100); };
  b.type = (text) => send('Input.insertText', { text });
  b.shot = async (file) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); };
  // Đóng hẳn trình duyệt qua giao thức trước khi diệt tiến trình: trên Windows, kill chỉ dừng tiến trình mẹ.
  b.close = async () => { try { await Promise.race([send('Browser.close'), sleep(1500)]); } catch (e) { /* đã đóng */ } try { ws.close(); } catch (e) { /* đã đóng */ } proc.kill(); };
  return b;
};
