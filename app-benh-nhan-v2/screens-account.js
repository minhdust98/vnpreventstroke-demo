'use strict';
// Đăng nhập, đăng ký, mã OTP, quên và đổi mật khẩu, đăng xuất. Chỉ mô phỏng: không có máy chủ, mật khẩu không được lưu,
// mã OTP nhận 6 số bất kỳ. Màn đăng nhập đứng trước phần bắt đầu; đổi mật khẩu và đăng xuất nằm ở Cài đặt › Tài khoản.

const acc = () => S.draft.acc || (S.draft.acc = { phone: '', pw: '', pw2: '', old: '', code: '', agree: false, mode: 'login' });
const phoneOk = v => String(v).replace(/\D/g, '').length >= 9;
const accInput = (id, label, field, type, value, auto) => `<div><label class="label" for="${id}">${label}</label><input id="${id}" class="input" type="${type}"${type === 'tel' ? ' inputmode="tel"' : ''} data-field="${field}" value="${esc(value)}" autocomplete="${auto}"></div>`;
const accTop = () => `<header class="top"><button class="nav" ${on('setting', { k: 'lang', v: D.settings.lang === 'vi' ? 'en' : 'vi' })}>${D.settings.lang === 'vi' ? 'English' : 'Tiếng Việt'}</button></header>`;
const accBack = () => `<header class="top"><button class="nav" ${on('back')}>${icon('back')}Quay lại</button></header>`;

V.login = () => {
  const a = acc();
  let h = accTop() + `<div class="brand">${icon('brain')}</div>` + h1('Đăng nhập', 'q');
  h += accInput('ph', 'Số điện thoại', 'accPhone', 'tel', a.phone, 'tel') + accInput('pw', 'Mật khẩu', 'accPw', 'password', a.pw, 'current-password');
  h += btn('Đăng nhập', 'accLogin') + btn('Quên mật khẩu', 'accGo', { v: 'forgot', mode: 'forgot' }, 'plain') + btn('Đăng ký', 'accGo', { v: 'register', mode: 'register' }, 'soft') + btn('Chỉ xem thông tin', 'onGuest', {}, 'plain');
  return { chrome: 'bare', white: true, html: h };
};
F.accPhone = v => { acc().phone = v; };
F.accPw = v => { acc().pw = v; };
F.accPw2 = v => { acc().pw2 = v; };
F.accOld = v => { acc().old = v; };
F.accCode = v => { acc().code = v.replace(/\D/g, '').slice(0, 6); };
A.accGo = ({ v, mode }) => { acc().mode = mode; go(v); };
A.accLogin = () => {
  const a = acc();
  if (!phoneOk(a.phone)) { toast('Số điện thoại chưa đúng'); return false; }
  if (a.pw.length < 6) { toast('Mật khẩu có ít nhất 6 ký tự'); return false; }
  a.mode = 'login'; go('otp');
};

V.register = () => {
  const a = acc();
  let h = accBack() + h1('Đăng ký', 'q');
  h += accInput('ph', 'Số điện thoại', 'accPhone', 'tel', a.phone, 'tel') + accInput('pw', 'Mật khẩu', 'accPw', 'password', a.pw, 'new-password') + accInput('pw2', 'Nhập lại mật khẩu', 'accPw2', 'password', a.pw2, 'new-password');
  h += group([checkRow('Tôi đồng ý với điều khoản sử dụng', '', a.agree, 'accAgree'), row({ title: 'Điều khoản', a: 'go', p: { v: 'terms' } })]);
  h += '<div class="spacer"></div>' + btn('Tạo tài khoản', 'accRegister', {}, '', a.agree ? '' : 'disabled');
  return { chrome: 'modal', white: true, html: h };
};
A.accAgree = () => { acc().agree = !acc().agree; };
A.accRegister = () => {
  const a = acc();
  if (!phoneOk(a.phone)) { toast('Số điện thoại chưa đúng'); return false; }
  if (a.pw.length < 6) { toast('Mật khẩu có ít nhất 6 ký tự'); return false; }
  if (a.pw !== a.pw2) { toast('Hai mật khẩu chưa giống nhau'); return false; }
  a.mode = 'register'; go('otp');
};
V.terms = () => ({ chrome: 'push', html: `${topBar({ back: 'Quay lại' })}${h1('Điều khoản', 'sm')}<ul class="bullets">${TERMS.map(x => `<li>${x}</li>`).join('')}</ul>` });

V.forgot = () => {
  const a = acc();
  return { chrome: 'modal', white: true, html: `${accBack()}${h1('Quên mật khẩu', 'q')}${accInput('ph', 'Số điện thoại', 'accPhone', 'tel', a.phone, 'tel')}<div class="spacer"></div>${btn('Gửi mã', 'accForgot')}` };
};
A.accForgot = () => { if (!phoneOk(acc().phone)) { toast('Số điện thoại chưa đúng'); return false; } acc().mode = 'forgot'; go('otp'); };

V.otp = () => {
  const a = acc();
  return { chrome: 'modal', white: true, html: `${accBack()}${h1(`Nhập mã gửi tới ${a.phone}`, 'q')}<input class="input otp" type="text" inputmode="numeric" maxlength="6" data-field="accCode" value="${esc(a.code)}" aria-label="Mã gồm 6 số" autocomplete="one-time-code"><div class="spacer"></div>${btn('Xác nhận', 'accOtp')}${btn('Gửi lại mã', 'demo', { msg: 'Bản demo: nhập 6 số bất kỳ' }, 'plain')}` };
};
A.accOtp = () => {
  const a = acc();
  if (a.code.length !== 6) { toast('Mã gồm 6 số'); return false; }
  a.code = '';
  if (a.mode === 'forgot') { go('newPw'); return; }
  D.account = { phone: a.phone };
  S.draft = {};
  // Đã có hồ sơ thì vào thẳng Trang chủ, chưa có thì bắt đầu khai báo
  if (D.owner && D.profiles[D.owner]) { D.active = D.active || D.owner; home(); } else S.stack = [{ v: 'welcome', p: {} }];
  S.focus = true;
};
V.newPw = () => {
  const a = acc();
  return { chrome: 'modal', white: true, html: `${accBack()}${h1('Mật khẩu mới', 'q')}${accInput('pw', 'Mật khẩu mới', 'accPw', 'password', a.pw, 'new-password')}${accInput('pw2', 'Nhập lại mật khẩu', 'accPw2', 'password', a.pw2, 'new-password')}<div class="spacer"></div>${btn('Đổi mật khẩu', 'accNewPw')}` };
};
A.accNewPw = () => {
  const a = acc();
  if (a.pw.length < 6) { toast('Mật khẩu có ít nhất 6 ký tự'); return false; }
  if (a.pw !== a.pw2) { toast('Hai mật khẩu chưa giống nhau'); return false; }
  S.draft = {}; S.stack = [{ v: 'login', p: {} }]; S.focus = true; toast('Đã đổi mật khẩu');
};

// ---- Cài đặt › Tài khoản ----
V.account = () => {
  let h = topBar({ back: 'Cài đặt' }) + h1('Tài khoản', 'sm');
  h += group(row({ title: 'Số điện thoại', value: esc((D.account && D.account.phone) || '') }));
  h += group([row({ icon: 'lock', title: 'Đổi mật khẩu', a: 'go', p: { v: 'changePw' } }), row({ icon: 'back', title: 'Đăng xuất', a: 'accLogout' })]);
  return { chrome: 'push', html: h };
};
V.changePw = () => {
  const a = acc();
  return { chrome: 'modal', html: `${topBar({ close: true })}${h1('Đổi mật khẩu', 'sm')}${accInput('po', 'Mật khẩu hiện tại', 'accOld', 'password', a.old, 'current-password')}${accInput('pw', 'Mật khẩu mới', 'accPw', 'password', a.pw, 'new-password')}${accInput('pw2', 'Nhập lại mật khẩu mới', 'accPw2', 'password', a.pw2, 'new-password')}<div class="cta">${btn('Lưu', 'accChange')}</div>` };
};
A.accChange = () => {
  const a = acc();
  if (a.old.length < 6) { toast('Nhập mật khẩu hiện tại'); return false; }
  if (a.pw.length < 6) { toast('Mật khẩu mới có ít nhất 6 ký tự'); return false; }
  if (a.pw !== a.pw2) { toast('Hai mật khẩu chưa giống nhau'); return false; }
  S.draft.acc = null; back(); toast('Đã đổi mật khẩu');
};
A.accLogout = () => dialog({ title: 'Đăng xuất?', body: '<p class="body">Dữ liệu của bạn vẫn được giữ.</p>', buttons: [{ label: 'Đăng xuất', a: 'accLogoutYes' }, { label: 'Hủy', a: 'closeDialog', cls: 'soft' }] });
A.accLogoutYes = () => { D.account = null; S.dialog = null; S.sheet = null; S.draft = {}; S.tab = 'home'; S.stack = [{ v: 'login', p: {} }]; S.focus = true; };
