// Kiểm thử giao diện bằng chuột thật trên Edge/Chrome chạy ngầm (Node ≥ 22, không cần cài gói): node test/ui.js
// Mở web từ file:// như khi bấm đúp index.html. Thoát với mã 1 nếu có lỗi.
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const URL_ = 'file:///' + path.join(__dirname, '..', 'web-bac-si-v2', 'index.html').replace(/\\/g, '/').replace(/ /g, '%20');
const BROWSER = process.env.BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((f) => fs.existsSync(f));
if (!BROWSER) { console.log('Không tìm thấy Edge/Chrome. Đặt biến BROWSER=đường dẫn trình duyệt.'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, seq = 0; const waits = {}, errors = [];
const send = (method, params) => new Promise((res, rej) => { const id = ++seq; waits[id] = { res, rej }; ws.send(JSON.stringify({ id, method, params: params || {} })); });
const js = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text); return r.result.value; };
const view = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
const goto = async (hash) => { await send('Page.navigate', { url: URL_ + (hash || '') }); await sleep(700); };
// Bấm bằng chuột thật vào phần tử đầu tiên khớp selector (và chữ, nếu có); lỗi nếu phần tử bị che.
const click = async (sel, text) => {
  const p = await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(sel)})].find(e=>e.getClientRects().length&&(!${JSON.stringify(text || '')}||e.textContent.includes(${JSON.stringify(text || '')})));if(!e)return{miss:1};e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,t=document.elementFromPoint(x,y);return{x,y,ok:!!t&&(t===e||e.contains(t))}})()`);
  if (p.miss) throw new Error('Không thấy ' + sel + ' ' + (text || ''));
  if (!p.ok) throw new Error('Bị che: ' + sel + ' ' + (text || ''));
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(120);
};
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); await sleep(100); };
let fail = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fail++; };
const noScroll = () => js(`(()=>{const d=document.documentElement,m=document.getElementById('main');return d.scrollHeight<=innerHeight&&d.scrollWidth<=innerWidth&&(!m||m.scrollHeight<=m.clientHeight)})()`);

(async () => {
  const port = 9400 + Math.floor(Math.random() * 400), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'vnps-'));
  const proc = spawn(BROWSER, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  try {
    let tgt; for (let i = 0; i < 60 && !tgt; i++) { try { tgt = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find((t) => t.type === 'page'); } catch (e) { /* đợi trình duyệt */ } if (!tgt) await sleep(300); }
    ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && waits[d.id]) { (d.error ? waits[d.id].rej : waits[d.id].res)(d.error || d.result); delete waits[d.id]; } if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text); };
    await send('Page.enable'); await send('Runtime.enable');

    // Bác sĩ: không cuộn ở hai cỡ màn hình, hồ sơ một trang với cả 48 bệnh nhân
    for (const [w, h] of [[1440, 900], [1366, 768]]) {
      await view(w, h); await goto(); await click('[data-a="role"][data-v="doctor"]'); await sleep(200);
      ok(await noScroll(), w + 'x' + h + ' dashboard không cuộn');
      ok(await js(`(()=>{const s=document.querySelector('.dash-body .scroll').getBoundingClientRect();return [...document.querySelectorAll('.qrow')].every(r=>r.getBoundingClientRect().bottom<=s.bottom)})()`), w + 'x' + h + ' thấy đủ 6 bệnh nhân cần can thiệp');
      const bad = await js(`(async()=>{const V=VNPS,out=[];for(const p of V.data.patients){V.debug.H.open({dataset:{id:p.id}});await new Promise(r=>setTimeout(r,20));const o=document.querySelector('.opage');if(o.scrollHeight>o.clientHeight+1)out.push(p.id+' trang');for(const s of ['.orc','.olc']){const e=document.querySelector(s);if(e.scrollHeight>e.clientHeight+1)out.push(p.id+s)}const svg=document.querySelector('#ovchart svg');if(svg&&svg.viewBox.baseVal.height<274)out.push(p.id+' chart thấp');if(/undefined|NaN|\\[object/.test(o.innerText))out.push(p.id+' chữ lỗi');if(V.ins.severe(p)!==!!document.querySelector('.omrs'))out.push(p.id+' thẻ mRS');for(const [k] of V.views.PTABS)if(/undefined|NaN|\\[object/.test(V.views.pdBody(p,k).replace(/data-[a-z]+="[^"]*"/g,'')))out.push(p.id+':'+k);V.debug.H.close()}return out})()`);
      ok(!bad.length, w + 'x' + h + ' hồ sơ một trang không cuộn, thẻ mRS đúng ca nặng, mọi tab hiển thị được' + (bad.length ? ': ' + bad.slice(0, 5).join(', ') : ''));
    }
    await view(1366, 768); await goto('#/d/home'); await sleep(200);
    await click('.qrow', 'Trần Văn Hùng'); await click('[data-a="qchip"]', 'Đã gọi BN'); await click('[data-a="qdone"]');
    ok(await js(`VNPS.views.muted(VNPS.byId.P001)&&VNPS.S.cls.P001.level==='act'&&VNPS.S.qx==='P007'`), 'Xử lý tại hàng đợi: 3 cú bấm, mức giữ nguyên, tự sang người kế');
    await click('.mini-row', 'Vũ Thị Hạnh'); ok(await js(`!!document.querySelector('.sheet .prep')`), 'Bấm lịch hôm nay mở thẳng Chuẩn bị khám');
    await click('.sheet [data-a="ptab"][data-t="visit"]'); await click('.sheet [data-a="apdone"]'); await click('[data-a="mrspick"][data-v="1"]');
    await js(`document.getElementById('c_txt').value='Ổn định'`); await click('[data-a="apdonesave"]');
    ok(await js(`VNPS.ins.mrs(VNPS.byId.P006).slice(-1)[0].v===1&&VNPS.ins.mrs(VNPS.byId.P006).slice(-1)[0].d===0`), 'Hoàn tất khám ghi được mRS hôm nay');
    await key('Escape', 'Escape', 27); await key('Escape', 'Escape', 27);
    await goto('#/d/patients'); await click('[data-a="plv"][data-v="severe"]');
    ok(await js(`document.querySelectorAll('.tbl.list tbody tr').length`) === 18, 'Trang Bệnh nhân lọc Ca nặng: 18');
    await goto('#/d/msgs'); ok(await js(`document.getElementById('msgbox').value.length>20`), 'Hộp thư có mẫu soạn sẵn');

    // Quản lý
    await view(1440, 900); await goto('#/m/overview'); await sleep(200);
    const sums = await js(`(()=>{const i=[...document.querySelectorAll('.dtbl thead th')].findIndex(th=>th.textContent==='Bệnh nhân'),rows=[...document.querySelectorAll('.dtbl tbody tr')].map(r=>+r.children[i].textContent);return {sum:rows.reduce((a,b)=>a+b,0),kpi:+document.querySelector('.kpi .kv').textContent,unit:VNPS.data.unit.length,docs:rows.length}})()`);
    ok(sums.sum === sums.kpi && sums.kpi === sums.unit && sums.docs === 4, 'Toàn khoa: tổng theo bác sĩ khớp tổng khoa (' + sums.kpi + ')');
    await click('.dtbl tbody tr', 'Lê Thu Hằng'); ok(await js(`location.hash==='#/m/doctor/hang'&&document.querySelectorAll('.tbl.list tbody tr').length===VNPS.data.unit.filter(p=>p.doc==='hang').length`), 'Trang một bác sĩ liệt kê đúng bệnh nhân của bác sĩ đó');
    await goto('#/m/msgs'); await click('[data-a="nudge"]'); ok(await js(`Object.keys(VNPS.S.nudged).length===1`), 'Nhắc bác sĩ trả lời tin chờ quá hạn');
    ok(await js(`!document.querySelector('#main .thread,#main .msg')`), 'Quản lý không thấy nội dung tin nhắn');
    await goto('#/m/thresholds'); await js(`(()=>{const i=document.querySelector('[data-k="staleDays"]');i.value='6';i.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    ok(await js(`VNPS.S.cls.P003.reasons.some(r=>r.code==='stale')`), 'Đổi ngưỡng áp dụng ngay cho phân loại');
    ok(!errors.length, 'Không có lỗi JavaScript' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  } catch (e) { ok(false, 'Lỗi khi chạy: ' + e.message); }
  try { ws.close(); } catch (e) { /* đã đóng */ }
  proc.kill();
  console.log(fail ? fail + ' kiểm tra lỗi' : 'Tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
