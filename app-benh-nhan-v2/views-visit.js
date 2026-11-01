'use strict';
// Tab Khám bệnh: lịch tái khám theo BRD, bản tóm tắt đưa bác sĩ, tin nhắn, nhờ nhập giúp.

V.visit = () => {
  const p = P(), ms = nowMs(), ap = nextAppt(p);
  let h = topBar() + '<h1 class="t">Khám bệnh</h1>';
  if (ap) {
    const dd = daysBetween(ms, ap.t);
    if (ap.t < ms) {
      h += `<div class="card"><div class="lbl">${ic('cal', 'orange')}Lịch ${wdName(ap.t)} ${ddmm(ap.t)}</div><div class="big" style="margin-top:.5rem">Bạn đã đi khám chưa?</div><div class="yn" style="margin-top:.6rem"><button class="btn small" data-a="apptDone">Đã khám</button><button class="btn sec small" data-a="apptMissed">Chưa khám</button></div></div>`;
    } else {
      const head = dd === 0 ? 'Tái khám hôm nay' : `Tái khám sau ${dd} ngày`;
      h += `<div class="card"><div class="lbl">${ic('cal', 'orange')}${head}</div><div style="font-size:1.5rem;font-weight:800;margin-top:.5rem;line-height:1.2">${wdName(ap.t)} ${ddmm(ap.t)}, ${hhmm(ap.t)}</div><div class="sub" style="margin-top:.25rem">${esc(ap.place)}</div><div class="sub ink" style="margin-top:.25rem">${esc(ap.prep)}</div>`;
      if (ap.state === 'change') h += `<div class="banner bg-blue" style="margin-top:.6rem">Đã gửi yêu cầu đổi lịch. Bệnh viện sẽ xác nhận lại với bạn.</div>`;
      else if (ap.state === 'confirmed') h += `<div class="st green" style="margin-top:.6rem;font-size:1.06rem">${icon('check')}Bạn đã xác nhận sẽ đến</div><button class="link left" data-a="apptChangeOpen">Cần đổi lịch</button>`;
      else h += `<div class="yn" style="margin-top:.6rem"><button class="btn small" data-a="apptConfirm">Tôi sẽ đến</button><button class="btn sec small" data-a="apptChangeOpen">Cần đổi lịch</button></div>`;
      h += `<button class="link left" data-a="demoOnly" data-p="Trên điện thoại thật, lịch hẹn được thêm vào lịch của máy">Thêm vào lịch điện thoại</button><p class="note">${esc(ap.source)}</p></div>`;
    }
  } else if (p.stroke) {
    h += `<div class="card"><div class="lbl">${ic('cal', 'orange')}Chưa có lịch tái khám</div><div class="sub ink" style="margin-top:.4rem">Khi bệnh viện cập nhật, lịch sẽ tự hiện ở đây. Bạn có thể tự nhắc mình.</div></div>`;
  } else {
    h += `<div class="card"><div class="lbl">${ic('cal', 'orange')}Chưa có lịch khám</div><div class="sub ink" style="margin-top:.4rem">Khi có bác sĩ theo dõi, lịch sẽ hiện ở đây.</div></div>`;
  }
  h += `<div class="card bluecard"><div class="big" style="font-size:1.32rem;font-weight:700">Bản tóm tắt đưa bác sĩ</div><div style="font-size:1.06rem;margin-top:.15rem">Có sẵn, không phải nhớ hay kể lại.</div><button class="btn small white" style="margin-top:.5rem" data-a="go" data-p="summary">Mở bản tóm tắt</button></div>`;
  const ending = medsEnding(p);
  h += '<div class="rows">';
  ending.forEach(m => { const left = daysBetween(ms, new Date(`${m.end}T00:00:00`).getTime()); h += row({ icon: 'pill', tone: 'orange', n: 'Sắp hết thuốc', d: `${esc(m.name)} còn ${left} ngày`, a: 'go', p: `medDetail:${m.id}` }); });
  const unread = p.messages.filter(m => !m.read).length;
  h += row({ icon: 'msg', tone: 'blue', n: 'Tin nhắn từ bác sĩ', d: p.messages.length ? esc(p.messages[0].text) : 'Chưa có tin nhắn', a: 'go', p: 'messages', val: unread ? '<span class="pill bg-blue" style="font-size:.95rem;padding:.15rem .5rem">Mới</span>' : '' });
  h += row({ icon: 'pin', tone: 'blue', n: 'Trung tâm đột quỵ gần bạn', a: 'go', p: 'centers' });
  h += row({ icon: 'group', tone: 'green', n: 'Nhờ nhập giúp thông tin', d: 'Bác sĩ hoặc nhân viên y tế nhập giúp', a: 'go', p: 'support' });
  h += '</div>';
  const past = p.appts.filter(a => a.state === 'done' || a.state === 'attended').sort((a, b) => b.t - a.t);
  if (past.length) h += `<div class="sec">Các lần đã khám</div><div class="rows">${past.map(a => row({ n: `${ddmmyy(a.t)}`, d: a.result ? esc(a.result) : 'Đang chờ bác sĩ cập nhật kết quả' })).join('')}</div>`;
  return { chrome: 'tab', html: h };
};
A.apptConfirm = () => { nextAppt(P()).state = 'confirmed'; persist(); render(); toast('Đã xác nhận. App sẽ nhắc trước 1 ngày.'); };
A.apptDone = () => { const a = nextAppt(P()); a.state = 'attended'; persist(); render(); toast('Đã ghi lại. Bác sĩ sẽ cập nhật kết quả.'); };
A.apptMissed = () => go('apptChange');
A.apptChangeOpen = () => go('apptChange');
V.apptChange = () => {
  const c = S.ui.chg = S.ui.chg || { when: null };
  let h = topBar({ close: true }) + '<h1 class="t small">Đổi lịch khám</h1><div class="sub ink" style="margin-top:-.3rem">Bạn muốn đổi sang khi nào?</div>';
  h += `<div class="chips">${['Trong tuần này', 'Tuần sau', 'Bệnh viện gọi lại để hẹn'].map(x => `<button class="chip ${c.when === x ? 'on' : ''}" aria-pressed="${c.when === x}" data-a="chgWhen" data-p="${x}">${x}</button>`).join('')}</div>`;
  h += `<button class="btn" data-a="chgSend" ${c.when ? '' : 'disabled'}>Gửi yêu cầu</button><p class="note">Bệnh viện xác nhận lại lịch mới. Đừng để quá hẹn lâu vì bác sĩ cần theo dõi điều trị của bạn.</p>`;
  return { chrome: 'modal', html: h };
};
A.chgWhen = x => { S.ui.chg.when = x; render(); };
A.chgSend = () => { const a = nextAppt(P()); if (a) { a.state = 'change'; a.t = Math.max(a.t, nowMs() + 864e5); } S.ui.chg = null; persist(); A.back(); toast('Đã gửi yêu cầu đổi lịch'); };

// Bản tóm tắt: không có điểm nguy cơ
V.summary = () => {
  const p = P(), ms = nowMs();
  const rs = p.bp.filter(r => r.t > ms - 30 * 864e5 && r.t <= ms);
  const a = adherence(p, 30);
  const sym = p.symptoms.filter(s => s.t > ms - 30 * 864e5);
  const anyProxy = rs.filter(r => r.by !== 'self').length;
  let h = topBar({ close: true });
  h += `<h1 class="t small">${esc(p.name)}${p.birthYear ? `, ${age(p)} tuổi` : ''}</h1><div class="sub" style="margin-top:-.35rem">Tóm tắt 30 ngày, đến ${ddmmyy(ms)}</div>`;
  if (rs.length) {
    const S0 = rs.map(r => r.sys), D0 = rs.map(r => r.dia);
    h += `<div class="card"><div class="lbl">${ic('heart', 'blue')}Huyết áp, ${rs.length} lần đo</div><div style="font-size:2.5rem;font-weight:800;letter-spacing:-.02em;line-height:1.1;margin-top:.35rem">${Math.round(mean(S0))}/${Math.round(mean(D0))}</div><div class="sub">Trung bình. Cao nhất ${Math.max(...S0)}/${Math.max(...D0)}, thấp nhất ${Math.min(...S0)}/${Math.min(...D0)}</div>${anyProxy ? `<div class="note">${anyProxy} lần do người nhà nhập</div>` : ''}</div>`;
  } else h += `<div class="card"><div class="lbl">${ic('heart', 'blue')}Huyết áp</div><div class="sub ink" style="margin-top:.3rem">Không có số đo trong 30 ngày qua</div></div>`;
  const gl = p.glucose.filter(r => r.t > ms - 30 * 864e5);
  if (gl.length) h += `<div class="card"><div class="lbl">${ic('drop', 'purple')}Đường huyết, ${gl.length} lần đo</div><div class="sub ink" style="margin-top:.3rem">Trung bình ${dec(mean(gl.map(r => r.v)).toFixed(1))} mmol/L</div></div>`;
  if (p.meds.length) h += `<div class="card"><div class="lbl">${ic('pill', 'teal')}Thuốc, ${a.due} liều đến hạn</div><div class="sumrow" style="margin-top:.3rem;border:0"><span>Đã dùng</span><b>${a.taken}</b></div><div class="sumrow"><span>Đã bỏ lỡ</span><b>${a.missed}</b></div><div class="sumrow"><span>Không có ghi nhận</span><b>${a.none}</b></div><div class="note" style="margin-top:.35rem">Đang dùng: ${medsActive(p, ms).map(m => `${esc(m.name)} ${esc(m.strength)}`).join(', ')}</div></div>`;
  h += `<div class="card"><div class="lbl">${ic('alert', 'orange')}Triệu chứng mới</div><div class="sub ink" style="margin-top:.3rem">${sym.length ? sym.map(s => `${ddmm(s.t)}: ${esc(s.list.join(', '))}`).join('<br>') : 'Không ghi nhận'}</div></div>`;
  const plan = riskPlan(p, ms);
  const askDoc = plan.ids.filter(id => factOf(p, id) === 'unknown' || (NEEDS_CONFIRM.includes(id) && p.facts[id] && p.facts[id].source === 'patient'));
  if (askDoc.length) h += `<div class="card"><div class="lbl">${ic('doc', 'orange')}Cần bác sĩ xác nhận</div><div class="sub ink" style="margin-top:.3rem">${askDoc.map(id => esc(RISK_SHORT[id])).join(', ')}</div></div>`;
  const hb = [];
  Object.keys(HABITS).forEach(k => { const v = p.habits[k]; if (v && v !== 'unknown') hb.push(`${HABITS[k].name}: ${HABITS[k].opts.find(o => o[0] === v)[1].toLowerCase()}`); });
  if (hb.length) h += `<div class="card"><div class="lbl">${ic('leaf', 'green')}Thói quen</div><div class="sub ink" style="margin-top:.3rem">${hb.map(esc).join('<br>')}</div></div>`;
  if (p.consents.doctor) h += `<button class="btn sec" data-a="summarySend">Gửi cho bác sĩ</button><p class="note center">Bạn đã đồng ý chia sẻ với bác sĩ.</p>`;
  else h += `<p class="note center">Bạn chưa đồng ý chia sẻ, nên bản này chỉ nằm trên máy. Bạn vẫn có thể đưa điện thoại cho bác sĩ xem.</p><button class="link" data-a="go" data-p="share">Đổi quyền chia sẻ</button>`;
  return { chrome: 'modal', white: true, html: h };
};
A.summarySend = () => toast('Đã gửi cho bác sĩ (mô phỏng)');

V.messages = () => {
  const p = P();
  p.messages.forEach(m => { m.read = true; });
  let h = topBar({ back: 'Khám bệnh' }) + '<h1 class="t small">Tin nhắn từ bác sĩ</h1>';
  h += p.messages.length ? p.messages.map(m => `<div class="card"><div class="sub" style="font-weight:600">${esc(m.from)} · ${ddmm(m.t)}</div><div class="mid" style="margin-top:.25rem">${esc(m.text)}</div></div>`).join('') : '<div class="card"><div class="mid">Chưa có tin nhắn.</div></div>';
  h += '<p class="note">Bác sĩ gửi nhắc nhở và hướng dẫn qua đây. Không dùng mục này khi khẩn cấp, hãy gọi 115.</p>';
  return { chrome: 'push', html: h };
};
V.support = () => {
  let h = topBar({ back: 'Khám bệnh' }) + '<h1 class="t small">Nhờ nhập giúp</h1><div class="sub ink" style="margin-top:-.3rem">Bác sĩ hoặc nhân viên y tế có thể nhập thuốc và tiền sử bệnh giúp bạn khi đi khám.</div>';
  h += '<button class="btn" data-a="supportReq">Gửi yêu cầu nhập giúp</button>';
  h += `<div class="rows">${row({ icon: 'group', tone: 'blue', n: 'Hoặc nhờ người nhà nhập', a: 'go', p: 'caregivers' })}</div>`;
  return { chrome: 'push', html: h };
};
A.supportReq = () => { toast('Đã gửi yêu cầu. Nhân viên y tế sẽ liên hệ.'); A.back(); };
