// Kiểm thử giao diện bằng chuột thật trên Edge/Chrome chạy ngầm (Node ≥ 22, không cần cài gói): node test/ui.js
// Mở web từ file:// như khi bấm đúp index.html. Thoát với mã 1 nếu có lỗi.
const B = require('./browser.js'), sleep = B.sleep;
let fail = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fail++; };

(async () => {
  const b = await B.open(), { js, click, key, view, goto } = b;
  const noScroll = () => js(`(()=>{const d=document.documentElement,m=document.getElementById('main');return d.scrollHeight<=innerHeight&&d.scrollWidth<=innerWidth&&(!m||m.scrollHeight<=m.clientHeight)})()`);
  try {
    // Bác sĩ: không cuộn ở hai cỡ màn hình, hồ sơ một trang với cả 48 bệnh nhân, sáng và tối
    for (const [w, h] of [[1440, 900], [1366, 768]]) {
      await view(w, h); await goto(); await click('[data-a="role"][data-v="doctor"]'); await sleep(200);
      ok(await noScroll(), w + 'x' + h + ' dashboard không cuộn');
      ok(await js(`(()=>{const s=document.querySelector('.dash-body .scroll').getBoundingClientRect();return [...document.querySelectorAll('.qrow')].every(r=>r.getBoundingClientRect().bottom<=s.bottom)})()`), w + 'x' + h + ' thấy đủ 6 bệnh nhân cần can thiệp');
      const bad = await js(`(async()=>{const V=VNPS,out=[];for(const p of V.data.patients){V.debug.H.open({dataset:{id:p.id}});await new Promise(r=>setTimeout(r,20));const o=document.querySelector('.opage');if(o.scrollHeight>o.clientHeight+1)out.push(p.id+' trang');for(const s of ['.orc','.olc']){const e=document.querySelector(s);if(e.scrollHeight>e.clientHeight+1)out.push(p.id+s)}const svg=document.querySelector('#ovchart svg');if(svg&&svg.viewBox.baseVal.height<274)out.push(p.id+' chart thấp');if(/undefined|NaN|\\[object/.test(o.innerText))out.push(p.id+' chữ lỗi');if(V.ins.severe(p)!==!!document.querySelector('.omrs'))out.push(p.id+' thẻ mRS');for(const [k] of V.views.PTABS)if(/undefined|NaN|\\[object/.test(V.views.pdBody(p,k).replace(/data-[a-z]+="[^"]*"/g,'')))out.push(p.id+':'+k);V.debug.H.close()}return out})()`);
      ok(!bad.length, w + 'x' + h + ' hồ sơ một trang không cuộn, thẻ mRS đúng ca nặng, mọi tab hiển thị được' + (bad.length ? ': ' + bad.slice(0, 5).join(', ') : ''));
    }
    await view(1366, 768); await goto('#/d/home'); await js(`VNPS.debug.H.theme()`); await sleep(100);
    ok(await noScroll(), '1366x768 nền tối: dashboard không cuộn');
    await goto('#/d/home'); await sleep(200);
    await click('.qrow', 'Trần Văn Hùng'); await click('[data-a="qchip"]', 'Đã gọi BN'); await click('[data-a="qdone"]');
    ok(await js(`VNPS.views.muted(VNPS.byId.P001)&&VNPS.S.cls.P001.level==='act'&&VNPS.S.qx==='P007'`), 'Xử lý tại hàng đợi: 3 cú bấm, mức giữ nguyên, tự sang người kế');
    await click('.mini-row', 'Vũ Thị Hạnh'); ok(await js(`!!document.querySelector('.sheet .prep')`), 'Bấm lịch hôm nay mở thẳng Chuẩn bị khám');
    await click('.sheet [data-a="ptab"][data-t="visit"]'); await click('.sheet [data-a="apdone"]'); await click('[data-a="mrspick"][data-v="1"]');
    await js(`document.getElementById('c_txt').value='Ổn định'`); await click('[data-a="apdonesave"]');
    ok(await js(`VNPS.ins.mrs(VNPS.byId.P006).slice(-1)[0].v===1&&VNPS.ins.mrs(VNPS.byId.P006).slice(-1)[0].d===0`), 'Hoàn tất khám ghi được mRS hôm nay');
    await key('Escape', 'Escape', 27); await key('Escape', 'Escape', 27);
    // Hồ sơ ban đầu: nguồn khai, bác sĩ xác nhận ngay trên hồ sơ, chưa khai không thành "Không", chưa đồng ý chia sẻ thì không thấy
    await goto('#/d/patient/P001');
    ok(await js(`(()=>{const c=document.querySelector('.ointake');return !!c&&/Bệnh nền/.test(c.innerText)&&/BN khai/.test(c.innerText)})()`), 'Hồ sơ ban đầu hiện trên hồ sơ một trang, có nguồn khai');
    await click('.ointake [data-a="icfm"]'); await click('[data-a="icfv"][data-k="dm"][data-v="no"]'); await click('[data-a="icfsave"]');
    ok(await js(`VNPS.byId.P001.facts.htn.source==='doctor'&&VNPS.byId.P001.facts.dm.v==='no'&&/BS xác nhận/.test(document.querySelector('.ointake').innerText)&&!document.querySelector('.ointake [data-a="icfm"]')`), 'Bác sĩ xác nhận bệnh nền ngay trên hồ sơ');
    await goto('#/d/patient/P012'); ok(await js(`(()=>{const t=document.querySelector('.ointake').innerText;return /Chưa khai/.test(t)&&!/Không/.test(t)})()`), 'Người chưa khai hiện "Chưa khai", không phải "Không"');
    await goto('#/d/patient/P005'); ok(await js(`!document.querySelector('.ointake')&&!document.querySelector('[data-t="intake"]')`), 'Người chưa đồng ý chia sẻ: bác sĩ không thấy hồ sơ ban đầu');
    await goto('#/d/home'); await click('[data-a="qtab"][data-v="watch"]');
    ok(await js(`[...document.querySelectorAll('.qrow')].some(r=>/triệu chứng giống đột quỵ/i.test(r.title+r.innerText+r.querySelector('.why').title))`), 'Cảnh báo hồ sơ ban đầu vào hàng đợi Cần theo dõi');
    await goto('#/d/patients'); await click('[data-a="plv"][data-v="severe"]');
    ok(await js(`document.querySelectorAll('.tbl.list tbody tr').length`) === 18, 'Trang Bệnh nhân lọc Ca nặng: 18');
    await goto('#/d/msgs'); ok(await js(`document.getElementById('msgbox').value.length>20`), 'Hộp thư có mẫu soạn sẵn');

    // Quản lý
    await view(1440, 900); await goto('#/m/overview'); await sleep(200);
    const sums = await js(`(()=>{const t=document.querySelector('.dtbl'),i=[...t.querySelectorAll('thead th')].findIndex(th=>th.textContent==='Bệnh nhân'),rows=[...t.querySelectorAll('tbody tr')],foot=t.querySelector('tfoot tr');return {sum:rows.reduce((a,r)=>a+(+r.children[i].textContent.replace(/\\D/g,'')),0),total:foot?+foot.children[i].textContent.replace(/\\D/g,''):-1,unit:VNPS.data.unit.length,docs:rows.length}})()`);
    ok(sums.sum === sums.total && sums.total === sums.unit && sums.docs === 4, 'Toàn khoa: tổng theo bác sĩ khớp tổng khoa (' + sums.total + ')');
    await click('.dtbl tfoot a.hl'); ok(await js(`location.hash==='#/m/dashboard'&&document.querySelectorAll('.mstats .lvtab').length===5&&!!document.querySelector('#main svg.chart')`), 'Bấm chữ Toàn khoa mở trang Tổng quan có biểu đồ');
    await click('.mstats .lvtab', 'Bệnh nhân'); ok(await js(`document.querySelectorAll('.tbl.list tbody tr').length===VNPS.data.unit.length`), 'Ô Bệnh nhân mở danh sách toàn bộ bệnh nhân của khoa');
    await goto('#/m/overview');
    await click('.dtbl tbody tr', 'Lê Thu Hằng'); ok(await js(`location.hash==='#/m/doctor/hang'&&document.querySelectorAll('.tbl.list tbody tr').length===VNPS.data.unit.filter(p=>p.doc==='hang').length`), 'Trang một bác sĩ liệt kê đúng bệnh nhân của bác sĩ đó');
    await goto('#/m/msgs'); await click('[data-a="nudge"]'); ok(await js(`Object.keys(VNPS.S.nudged).length===1`), 'Nhắc bác sĩ trả lời tin chờ quá hạn');
    ok(await js(`!document.querySelector('#main .thread,#main .msg')`), 'Quản lý không thấy nội dung tin nhắn');
    await goto('#/m/thresholds'); await js(`(()=>{const i=document.querySelector('[data-k="staleDays"]');i.value='6';i.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    ok(await js(`!VNPS.S.cls.P003.reasons.some(r=>r.code==='stale')&&/[0-9]+ bệnh nhân đổi mức/.test(document.querySelector('.page-h').innerText)`), 'Đổi ngưỡng: chưa áp dụng, báo trước số bệnh nhân đổi mức');
    await click('[data-a="cfgsave"]');
    ok(await js(`VNPS.S.cls.P003.reasons.some(r=>r.code==='stale')&&VNPS.rules.cfg.staleDays===6`), 'Bấm Lưu thì ngưỡng mới áp dụng cho phân loại');
    ok(!b.errors.length, 'Không có lỗi JavaScript' + (b.errors.length ? ': ' + b.errors.slice(0, 3).join(' | ') : ''));
  } catch (e) { ok(false, 'Lỗi khi chạy: ' + e.message); }
  await b.close();
  console.log(fail ? fail + ' kiểm tra lỗi' : 'Tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
