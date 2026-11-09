# App người bệnh · bản demo

App giúp người bệnh dùng thuốc đúng giờ; theo dõi huyết áp, đường huyết và xét nghiệm mỡ máu; gom hồ sơ ban đầu và các lần khám; biết mức nguy cơ; liên hệ bác sĩ; học dấu hiệu đột quỵ và cách ăn uống. Toàn bộ người dùng và số liệu là giả. Không dùng để chẩn đoán hay điều trị.

Mở `index.html` bằng cách bấm đúp, không cần máy chủ. Bấm vào thanh trạng thái (dòng "BẢN DEMO") để mở bảng điều khiển demo: đổi người dùng, đổi giờ, giả lập thông báo, phiếu xét nghiệm mẫu, phía bác sĩ.

## Ba tab và năm ô

Thanh dưới: **Trang chủ**, **Thông báo**, **Cài đặt**. Ảnh đại diện và nút 115 không còn ở bước 1.

| Chỗ | Nội dung |
|---|---|
| Trang chủ | Thẻ chào. Khối **Hôm nay** ở giữa: việc còn lại của buổi (thuốc "Đã dùng", "Ghi số đo"), việc đã xong thu thành một dòng, rồi Sắp tới. Bên dưới là năm ô có hình |
| Ô Dự đoán nguy cơ | Mức Thấp, Trung bình hoặc Cao kèm một lời khuyên chung, không hiện điểm. Còn câu hỏi thì hỏi tiếp; sửa câu trả lời; đánh giá cho người thân |
| Ô Thuốc | Liều theo buổi, thẻ tuân thủ (7 chấm, tỷ lệ chưa dùng 7 hoặc 30 ngày: số lần chưa dùng ÷ số lần cần dùng; từng thuốc có tỷ lệ riêng ở chi tiết thuốc), danh sách thuốc, nhắc nhở. Thêm thuốc: chụp đơn thuốc, quét mã QR đơn hoặc chọn từ danh mục; đọc ra danh sách để tick từng thuốc trước khi lưu |
| Ô Hồ sơ sức khỏe | Ba phần chuyển bằng thanh chọn: **Theo dõi** (huyết áp, đường huyết, cân nặng, xét nghiệm LDL, cholesterol, HDL, triglyceride, đường huyết lúc đói, lối sống gồm Vận động, Hút thuốc, Rượu bia, Giấc ngủ, Ăn uống mỗi thói quen một màn có biểu đồ và bộ câu hỏi 7 ngày qua, triệu chứng), **Hồ sơ ban đầu** (đột quỵ, bệnh viện, bệnh nền theo từng đợt chẩn đoán, thuốc đã dùng, ô Khác), **Khám bệnh** (các lần khám: ngày, bệnh viện, chẩn đoán, ảnh phiếu; tóm tắt cho bác sĩ) |
| Ô Liên hệ | **Bác sĩ**: chat hai chiều. **Trợ lý AI**: trả lời các câu có trong tài liệu (câu hỏi thường gặp, bài học); câu về liều thuốc, dấu hiệu đột quỵ hoặc không có trong tài liệu thì chuyển bác sĩ hoặc bảo gọi 115. **Lịch hẹn**: bác sĩ đặt cho bệnh nhân, bệnh nhân cũng đặt (chờ bác sĩ nhận). **Thêm bác sĩ**: nhập hoặc quét mã, chờ bác sĩ đồng ý |
| Ô Giáo dục sức khỏe | BE FAST và FAST, ăn uống phòng đột quỵ, dùng thuốc an toàn, huyết áp, trung tâm đột quỵ, hỏi đáp. Mọi bài có nút Đọc to |
| Thông báo | Tin nhắn mới, đo lại huyết áp, tái khám trong 7 ngày, thuốc sắp hết, câu hỏi còn lại, mời đánh giá. Không lưu riêng, lấy từ dữ liệu có sẵn |
| Cài đặt | Thông tin cá nhân, tài khoản (đổi mật khẩu, đăng xuất), hồ sơ người thân, người nhà, nhờ nhập giúp, chia sẻ dữ liệu, nhắc nhở, hiển thị, phản hồi, bảo mật |

Trước Bắt đầu có Đăng nhập, Đăng ký (điều khoản không chọn sẵn), mã OTP, Quên mật khẩu; chỉ mô phỏng, mật khẩu không được lưu, OTP nhận 6 số bất kỳ. Quét mã bệnh viện hiện tên bệnh viện và các đợt chẩn đoán.

Nhập ở Hôm nay thì sau khi lưu, số liệu nằm ở Hồ sơ sức khỏe › Theo dõi; xem lại lịch sử và biểu đồ thì vào mục đó.

## Phần tạm ẩn ở bước 1

Cờ trong `FEATURES` (đầu `content.js`). Code vẫn còn, đổi `true` là bật lại; bộ kiểm tra bật từng cờ để chắc phần ẩn vẫn chạy.

| Cờ | Ẩn gì |
|---|---|
| `sos` | Nút 115 trên mọi màn, sheet 115, thẻ cấp cứu. Các nút "Gọi 115" ngay trên kết quả đo nguy hiểm, bài BE FAST và khi ghi triệu chứng đang xảy ra vẫn còn |
| `exercises` | Bài tập phục hồi và câu "Đi lại" |
| `plan` | Kế hoạch theo dõi tự đề xuất |
| `hba1c`, `egfr` | Hai xét nghiệm chưa theo dõi ở bước 1; chụp phiếu chỉ điền các chỉ số còn lại |
| `deviceLink` | Máy đo huyết áp kết nối |
| `missedHelp` | Bài "Khi quên liều" và nút gọi bác sĩ, dược sĩ. Quên liều chỉ được ghi nhận |

mRS không có trong app ở bước 1.

## Mức nguy cơ

Người bệnh chỉ thấy mức và một lời khuyên chung (`RISK_UI` trong `content.js`), kèm nhãn "Minh họa". Từ 55 tuổi, chưa đột quỵ: FSRP 2017. Sau nhồi máu não hoặc TIA: ESRS (app vẫn hỏi cả câu của SPI-II để phía bác sĩ dùng). Dưới 55 tuổi và sau chảy máu não: chưa có đánh giá.

- Ngưỡng từng mức nằm một chỗ, `RISK_LEVEL` trong `rules.js`, và là [Đề xuất] chờ bác sĩ chốt: ESRS 0–2 Thấp, 3–6 Trung bình, từ 7 Cao; FSRP dưới 5% Thấp, 5% đến dưới 10% Trung bình, từ 10% Cao. Điểm và cách tính không đổi.
- ESRS tính ngay từ câu trả lời. FSRP chưa có hệ số trong code, nên app chỉ đọc số % do phía bác sĩ tính (`p.fsrp`, trong demo là số minh họa); chưa có số thì app báo mức sẽ hiện sau khi bác sĩ xem câu trả lời.
- Còn câu trả lời "chưa rõ" thì cũng chờ bác sĩ.

## Lối sống

Bộ câu lấy theo thiết kế cũ của dự án, hỏi về 7 ngày qua (`LIFESTYLE` trong `content.js`): Vận động 3 ô giờ, Ăn uống 9 câu, Hút thuốc 7 câu (câu 2 đến 7 chỉ hỏi khi đang hút), Rượu bia 1 câu theo đơn vị cồn, Giấc ngủ 5 câu. Mỗi tuần app hỏi một thói quen luân phiên ở Hôm nay. Kết quả Tốt hoặc Cần cải thiện tính từ câu trả lời bằng `lifestyleClass` trong `rules.js`; ngưỡng ở `LS_RULE` là [Đề xuất] chờ bác sĩ chốt (rượu bia 1 đơn vị cồn mỗi ngày, ăn rau từ 14 bữa, ngủ 7 đến 9 giờ...). Vận động theo BRD: nhẹ từ 2,5 giờ hoặc mạnh từ 1,5 giờ mỗi tuần.

## Hồ sơ ban đầu

Ngay khi khai báo lần đầu (sau năm sinh, chiều cao, cân nặng và đột quỵ), app hỏi thêm 5 nhóm, mỗi màn một nhóm, câu nào cũng bỏ qua được (`INTAKE` trong `content.js`):

| Nhóm | Câu hỏi | Lưu ở |
|---|---|---|
| Bệnh nền | Tăng huyết áp, đái tháo đường, rối loạn mỡ máu, bệnh thận | `p.facts.htn / dm / lipid / kidney` |
| Tim mạch | Bệnh tim mạch (mạch vành, suy tim, hẹp động mạch chân), rung nhĩ, thuốc chống đông | `p.facts.cvd / af` (`cvd` cũng ghi vào `heart`), `p.drugs.anticoag` |
| Sinh hoạt | Hút thuốc, rượu bia, vận động, ngáy to hoặc ngừng thở khi ngủ | `p.habits`, `p.facts.smoke`, `p.facts.apnea` |
| Gia đình | Người thân đột quỵ hoặc bệnh tim trước 60 tuổi (câu của BRD); người thân từng bị bệnh gì | `p.facts.family` (`detail.kinds`) |
| Triệu chứng | Triệu chứng giống đột quỵ trong 3 tháng qua | `p.intake.symptoms` |

Mỗi màn có ô "Khác" để ghi thêm bằng chữ (tối đa 200 ký tự): bệnh khác (`p.otherConditions`), tim mạch khác, sinh hoạt khác, gia đình khác, triệu chứng khác (`p.intake.other`). Sửa lại được ở Hồ sơ sức khỏe › Hồ sơ ban đầu; bác sĩ thấy ở Tóm tắt.

Quy tắc: câu chưa trả lời giữ trống và không bao giờ thành "Không". Câu đã trả lời không bị hỏi lại ở bộ câu thang điểm. Người nối hồ sơ bệnh viện không bị hỏi lại tăng huyết áp, đái tháo đường, tim mạch, rung nhĩ (`HOSPITAL_KNOWN`). Mọi câu sửa lại được ở Hồ sơ sức khỏe › Hồ sơ ban đầu.

Phía bác sĩ: `intakeSummary(p)` (rules.js) gom thành các dòng cho màn Tóm tắt cho bác sĩ và bảng điều khiển demo; `intakeFlags(p)` nêu điều bác sĩ nên xem trước. Hai điều này là đề xuất chờ bác sĩ chốt (triệu chứng giống đột quỵ trong 3 tháng qua; rung nhĩ mà chưa thấy thuốc chống đông). Người bệnh không thấy, và không có điểm.

## Cấu trúc

| File | Vai trò |
|---|---|
| `content.js` | Toàn bộ chữ y khoa: danh mục thuốc, xét nghiệm, câu hỏi, BE FAST, bài tập, bài học, câu khích lệ. Sửa nội dung ở đây, không sửa trong màn |
| `rules.js` | Logic lâm sàng thuần, không đụng giao diện: ngưỡng `TH`, trạng thái huyết áp, đường huyết, xét nghiệm, tuân thủ, lịch trong ngày, nhóm theo dõi, đầu vào thang điểm |
| `data.js` | Người dùng giả (`SCENARIOS`), giờ demo cố định 31/10/2026 07:02. Kịch bản `xau` là dữ liệu xấu nhất: tên dài, bảy thuốc, chưa có số đo, xét nghiệm ngoài ngưỡng |
| `app.js` | Trạng thái, lưu trữ, khung màn, thành phần dùng chung (`row`, `group`, `btn`, `chips`, `seg`, `keypad`, `dateRow`), điều hướng, xử lý sự kiện |
| `screens-*.js` | Mỗi nhóm màn một file: `home` (Trang chủ, Thông báo), `contact` (Liên hệ, chat, trợ lý AI, lịch hẹn, thêm bác sĩ), `account` (đăng nhập, mã OTP, mật khẩu), `today` (Hôm nay, quên liều, tái khám), `meds`, `health` (ba phần của Hồ sơ sức khỏe), `metrics` (huyết áp, đường huyết, xét nghiệm, thói quen), `learn`, `profile` (Cài đặt, dự đoán nguy cơ), `onboarding` |
| `panel.js` | Bảng điều khiển demo, nằm ngoài khung điện thoại |
| `i18n.js` | Bản tiếng Anh cho giao diện. Bài học dài chỉ có tiếng Việt |
| `styles.css` | Một file CSS, token ở đầu file, có nền tối và ba cỡ chữ |
| `PRODUCT.md`, `DESIGN.md` | Bối cảnh sản phẩm và hệ thống thiết kế, cho người và agent đọc trước khi sửa giao diện |
| `tests/` | `tests.js` (kiểm tra trong trình duyệt), `run.js`, `shots.js`, `browser.js` (mở trình duyệt chạy ngầm) |

Không có thư viện, không có bước build. Các file là script thường (không phải module) để mở được từ `file://`.

### Cách viết một màn

```js
V.labDetail = ({ test }) => ({ chrome: 'push', html: topBar({ back: 'Hồ sơ sức khỏe' }) + h1(labDef(test).name) + ... });
A.labChoose = ({ test }) => { S.sheet = null; labOpen(test); };   // gắn vào nút: on('labChoose', { test: 'ldl' })
F.scanDate = v => { S.draft.scan.date = v; };              // gắn vào ô nhập: data-field="scanDate"
```

- `V.tên` trả về `{ html, chrome }`. `chrome`: `tab` (có thanh tab), `push` (màn con), `modal` (việc riêng, có nút Đóng), `bare`. Sheet trả về `{ html }`.
- Màn kết quả (huyết áp, đường huyết) là cửa một chiều: không quay lại ô nhập, "Xong" về chỗ đã mở, có nút gọi 115 khi số đo nguy hiểm (và nút 115 chung khi `FEATURES.sos` bật).
- Khi sheet, hộp thoại hay màn khóa mở, các lớp bên dưới bị `inert`. Sau mỗi lần bấm, tiêu điểm trở về đúng nút vừa bấm.
- `A.tên(params, el)` nhận tham số từ thuộc tính `data-*` của nút. Sau khi chạy, app tự lưu và vẽ lại, trừ khi hàm trả `false`.
- `F.tên(value, el)` chạy khi gõ hoặc đổi ô nhập, không vẽ lại.
- `S.draft` giữ dữ liệu tạm của màn đang nhập. `D` là dữ liệu lưu trong `localStorage`; `P()` là hồ sơ đang mở.

## Quy tắc khi sửa

1. Ngưỡng lâm sàng chỉ nằm trong `rules.js` và theo tài liệu yêu cầu. Không tự đặt ngưỡng hay hệ số mới.
2. Người bệnh chỉ thấy mức Thấp, Trung bình hoặc Cao và một lời khuyên chung, không thấy điểm. Không tự tạo hệ số mới. Ngưỡng từng mức chỉ nằm ở `RISK_LEVEL`.
3. Màu mức độ luôn có hình đi kèm: xanh dấu tích là tốt, cam chấm là cần cải thiện, cam tam giác là cao hoặc thấp, đỏ tam giác là nguy hiểm. Một màu nhấn (`--tint`) cho thao tác, trạng thái được chọn và tiến độ. Icon đầu dòng không tô màu, trừ mục cấp cứu màu đỏ.
4. Bo góc theo ba mức `--r-s`, `--r-m`, `--r-l`; không thêm giá trị lẻ.
5. Số đo nguy hiểm báo rõ nhưng không gây hoảng, và có nút gọi 115 ngay trên màn kết quả. Nút 115 chung đang tạm ẩn (`FEATURES.sos`); khi bật phải có trên mọi màn.
6. Quên liều chỉ ghi nhận, không gợi ý uống bù, không thao tác xử lý. Việc thuốc nào cần uống bù sẽ hỏi bác sĩ ở giai đoạn sau.
7. Đồng ý chia sẻ dữ liệu phải do người dùng chọn rõ ràng, không có lựa chọn ngầm định.
8. Không thêm khẩu hiệu, dòng giải thích hay nhãn phụ. Nếu màn hình cần chúng mới hiểu được thì sửa bố cục. Mỗi ý một nhãn: sheet và màn việc riêng đóng bằng "Đóng", nút ghi số là "Ghi số đo", màn giờ nhắc là "Nhắc nhở".
9. Giờ 24 giờ, ngày dd/mm, số thập phân dùng dấu phẩy. Số và đơn vị ngắn (kg, km, mg) không tách dòng.

## Kiểm thử

```bash
node tests/run.js
node tests/shots.js
```

`run.js` mở `tests/index.html` trên Edge hoặc Chrome chạy ngầm. Bộ kiểm tra bấm các luồng chính (dùng thuốc, ghi huyết áp, xét nghiệm, chụp phiếu, bắt đầu dùng app, người nhà nhập giúp) rồi đi qua mọi màn của từng người dùng giả, kể cả dữ liệu xấu nhất và chữ rất lớn ở khổ 320px. Mỗi màn được dò: tràn ngang, chữ lỗi, giờ AM/PM, chữ về nguy cơ, nút nhỏ hơn 44px, nút không có tên, thiếu 115. Có thể mở thẳng `tests/index.html` bằng trình duyệt để xem kết quả.

`shots.js` chụp các màn chính ở 375×812 (nền sáng, nền tối, chữ rất lớn) và 320px (chữ rất lớn, nền tối), cả với dữ liệu xấu nhất, đếm số chữ trên mỗi màn và số lần bấm cho ba việc chính (dùng thuốc buổi sáng 1, ghi huyết áp 7, nhập LDL 7). Ảnh và `metrics.json` ghi vào thư mục tạm của máy hoặc thư mục truyền vào; không để ảnh trong repo.

Cần Node 22 trở lên. Đặt biến `BROWSER` nếu trình duyệt nằm chỗ khác.

## Phần mô phỏng

- Thông báo và màn khóa: dựng trong app, không phải thông báo thật của máy.
- Gọi điện (115, bác sĩ, dược sĩ, bệnh viện): hiện hộp thoại, không gọi thật.
- Đăng nhập, mã OTP, chat, trợ lý AI, đặt lịch, thêm bác sĩ: không có máy chủ, chỉ lưu trong máy. Trợ lý AI chỉ khớp từ khóa với tài liệu có sẵn.
- Chụp đơn thuốc và quét mã QR đơn: đọc ra danh sách thuốc mẫu, người dùng tick từng thuốc.
- Chụp phiếu xét nghiệm: mở camera hoặc thư viện ảnh thật, nhưng phần đọc chữ trả về kết quả mẫu. Người dùng luôn phải xem lại và bấm Lưu.
- Chụp số trên máy đo huyết áp: điền số mẫu.
- Quét mã bệnh viện, kết nối máy đo, Apple Health và Health Connect, thêm vào lịch, chỉ đường: chỉ báo tính năng sẽ có.
- Đọc to dùng giọng đọc của trình duyệt, nếu máy có.

## Chờ bác sĩ duyệt

- Nội dung bài tập phục hồi chức năng và chế độ ăn uống là nội dung mẫu, chờ bác sĩ duyệt trước khi dùng thật.
- Ngưỡng nguy hiểm của huyết áp và đường huyết trong `TH`.
- Mốc tuân thủ thuốc tốt từ 80%.
- LDL mục tiêu dưới 1,8 mmol/L sau nhồi máu não hoặc TIA, dưới 2,6 mmol/L cho các nhóm khác.
- HDL và triglyceride chưa có ngưỡng nên app chỉ ghi số, không đánh giá.
- Sau chảy máu não: mục "hỏi bác sĩ trước khi dùng thuốc mới".
- Câu "bệnh tim khác": ESRS và SPI-II định nghĩa khác nhau, cần chốt một cách hỏi.
- Dưới 55 tuổi và sau chảy máu não: chưa có thang phù hợp.
- Hai điều cần xem của `intakeFlags` và danh sách bệnh nền, triệu chứng trong Hồ sơ ban đầu.
- Ngưỡng ba mức nguy cơ và ba lời khuyên chung (`RISK_LEVEL`, `RISK_UI`).
- Câu chữ bộ câu hỏi thang điểm, BE FAST và danh sách triệu chứng cần ghi nhận.
- Việc xử lý khi quên liều (thuốc nào cần uống bù).
- Cách trợ lý AI chọn câu cần chuyển bác sĩ (các từ khóa về liều thuốc, dấu hiệu đột quỵ).
- Bộ câu hỏi lối sống, cách chấm Tốt và Cần cải thiện cho từng nhóm.
