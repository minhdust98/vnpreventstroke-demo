// Thử từng trang với dữ liệu xấu nhất: tên rất dài, bệnh nhân chưa có số đo, danh sách trống, số rất lớn: node test/worst.js
// Dữ liệu được đổi ở đúng chỗ dữ liệu demo đi vào (VNPS.data, form Thêm bệnh nhân), không sửa giao diện. Ảnh chụp lưu ở thư mục tạm, in ra cuối.
const fs = require('fs'), os = require('os'), path = require('path');
const B = require('./browser.js'), sleep = B.sleep;
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'vnps-worst-'));
let fail = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fail++; };

// Trường hợp xấu nhất nhưng có thật: họ hoàng tộc nhiều chữ, tên một chữ, học hàm dài, đường dẫn không ngắt được, tin chờ hơn 40 ngày.
const WORST = `(()=>{const V=VNPS,D=V.data,R=V.rules,by=V.byId;
  by.P001.name='Công Tằng Tôn Nữ Thị Phương Thảo';
  by.P002.name='Lê Y';
  by.P001.meds[0].name='Clopidogrel + Aspirin (phối hợp liều cố định)';
  const w=D.patients.filter(p=>R.pending(p));
  w[0].name='Nguyễn Hoàng Bảo Ngọc Phương Uyên';
  w[0].thread=[{d:-44,h:6,from:'bn',text:'Bác sĩ ơi em gửi kết quả xét nghiệm: https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jKLmnOPqrstUVwxyz0123456789/view?usp=sharing 🙏'}];
  D.doctors[1].name='PGS. TS. BS. Nguyễn Thị Phương Thảo Hoàng';
  D.unit.filter(p=>p.doc==='hang').forEach(p=>{p.doctor=D.doctors[1].name});
  const base=D.unit.filter(p=>p.doc==='long');let n=0;
  while(D.unit.length<1284){const c=JSON.parse(JSON.stringify(base[n%base.length]));c.id='X'+String(++n).padStart(4,'0');D.unit.push(c);by[c.id]=c;}
  D.doctors.push({id:'moi',name:'BS. Trần An',short:'BS. An',site:'BM'});
  V.debug.refresh();})()`;
// Bác sĩ mới chưa có bệnh nhân: danh sách trống ở mọi nơi.
const EMPTY = `(()=>{const V=VNPS;V.data.patients.splice(0);V.S.appts.splice(0);V.debug.refresh();})()`;
const badText = (sel) => `(()=>{const e=document.querySelector(${JSON.stringify(sel)});return e?(e.innerText.match(/undefined|NaN|Infinity|\\[object|null/)||[''])[0]:'không thấy'})()`;
// Phần tử chữ bị tràn ra ngoài khung mà không có dấu … (cắt mất chữ không báo).
const spill = `(()=>{const out=[];document.querySelectorAll('#main *,#ov *').forEach(e=>{if(!e.getClientRects().length||e.children.length)return;const s=getComputedStyle(e);if(e.scrollWidth>e.clientWidth+1&&s.overflow!=='visible'&&s.textOverflow!=='ellipsis')out.push((e.className||e.tagName)+': '+e.textContent.trim().slice(0,30))});const d=document.documentElement,m=document.getElementById('main');document.querySelectorAll('#main table').forEach(t=>{const r=t.getBoundingClientRect(),c=t.parentElement.getBoundingClientRect();if(r.right>c.right+1)out.push('bảng tràn khung: '+(t.className||'table'))});if(d.scrollWidth>innerWidth)out.push('cả trang cuộn ngang');if(m&&m.scrollWidth>m.clientWidth+1)out.push('#main cuộn ngang');return out.slice(0,6)})()`;
const noScroll = `(()=>{const d=document.documentElement,m=document.getElementById('main');return d.scrollHeight<=innerHeight&&(!m||m.scrollHeight<=m.clientHeight)})()`;

(async () => {
  const b = await B.open(), { js, view, goto, click, type } = b;
  const check = async (name, sel) => {
    const t = await js(badText(sel)), s = await js(spill);
    ok(!t, name + ': không có chữ lỗi' + (t ? ' (' + t + ')' : ''));
    ok(!s.length, name + ': chữ không tràn khung' + (s.length ? ' (' + s.join('; ') + ')' : ''));
    await b.shot(path.join(OUT, name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^\w-]+/g, '_') + '.png'));
  };
  try {
    for (const [w, h] of [[1440, 900], [1366, 768]]) {
      await view(w, h); const z = w + ' ';
      // Dữ liệu xấu nhất
      for (const [name, hash] of [['dashboard', '#/d/home'], ['benh nhan', '#/d/patients'], ['ho so dai', '#/d/patient/P001'], ['tin nhan', '#/d/msgs'], ['toan khoa', '#/m/overview'], ['bac si', '#/m/doctor/hang'], ['bac si moi', '#/m/doctor/moi'], ['ql tin nhan', '#/m/msgs']]) {
        await goto('#/'); await js(WORST); await js(`location.hash='${hash}'`); await sleep(200);
        if (hash === '#/d/msgs') await click('.clrow', 'Nguyễn Hoàng Bảo Ngọc');
        await check(z + 'xấu nhất ' + name, '#main');
        if (hash === '#/d/home' || hash === '#/d/patient/P001') ok(await js(noScroll) && await js(`(()=>{const o=document.querySelector('.opage');return !o||o.scrollHeight<=o.clientHeight+1})()`), z + 'xấu nhất ' + name + ': không cuộn');
      }
      ok(await js(`VNPS.data.unit.length===1284`), z + 'khoa 1.284 bệnh nhân đã nạp');
      // Bệnh nhân mới, chưa có số đo nào: tạo qua form Thêm bệnh nhân như bác sĩ làm
      await goto('#/d/patients'); await click('[data-a="addpt"]'); await click('#p_name'); await type('Đinh Thị Mai Hương'); await click('#p_age'); await type('58');
      await click('[data-a="addptsave"]'); await sleep(150);
      const id = await js(`VNPS.data.patients.slice(-1)[0].id`);
      await js(`VNPS.debug.H.open({dataset:{id:'${id}'}})`); await sleep(150);
      await check(z + 'chưa có số đo hồ sơ', '.opage');
      ok(await js(`(()=>{const o=document.querySelector('.opage');return o.scrollHeight<=o.clientHeight+1})()`), z + 'chưa có số đo: hồ sơ không cuộn');
      // Danh sách trống
      for (const [name, hash] of [['dashboard', '#/d/home'], ['benh nhan', '#/d/patients'], ['tin nhan', '#/d/msgs']]) {
        await goto(hash); await js(EMPTY); await sleep(150); await check(z + 'trống ' + name, '#main');
      }
      await goto('#/d/patients'); await click('#gs'); await type('Phạm Thị Hoa Mai'); await sleep(150); await check(z + 'tìm không thấy', '#main');
    }
    ok(!b.errors.length, 'Không có lỗi JavaScript' + (b.errors.length ? ': ' + b.errors.slice(0, 3).join(' | ') : ''));
  } catch (e) { ok(false, 'Lỗi khi chạy: ' + e.message); }
  await b.close();
  console.log('Ảnh chụp: ' + OUT);
  console.log(fail ? fail + ' kiểm tra lỗi' : 'Tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
