# App người bệnh · bản demo

App giúp người bệnh làm bốn việc: dùng thuốc đúng giờ; theo dõi huyết áp, đường huyết và LDL; tự nhập hoặc chụp phiếu xét nghiệm; học dấu hiệu đột quỵ, bài tập phục hồi và cách ăn uống. Toàn bộ người dùng và số liệu là giả. Không dùng để chẩn đoán hay điều trị.

Mở `index.html` bằng cách bấm đúp, không cần máy chủ. Bấm vào thanh trạng thái (dòng "BẢN DEMO") để mở bảng điều khiển demo: đổi người dùng, đổi giờ, giả lập thông báo, phiếu xét nghiệm mẫu, phía bác sĩ.

## Bốn tab

| Tab | Nội dung |
|---|---|
| Hôm nay | Việc của hôm nay theo buổi: thuốc, đo huyết áp, đo đường huyết. Lịch tái khám và thuốc sắp hết ở mục Sắp tới |
| Thuốc | Liều hôm nay, 7 ngày gần nhất, tuân thủ 30 ngày, danh sách thuốc, giờ nhắc |
| Chỉ số | Huyết áp, đường huyết, cân nặng, xét nghiệm (LDL, cholesterol, HbA1c, đường huyết lúc đói, eGFR), thói quen, tóm tắt cho bác sĩ |
| Học | BE FAST và FAST, bài tập phục hồi theo khả năng vận động (nằm, ngồi, đứng), ăn uống phòng đột quỵ, dùng thuốc an toàn, huyết áp, trung tâm đột quỵ |

Ảnh đại diện ở góc trái mở Hồ sơ. Nút 115 màu đỏ ở góc phải có trên mọi màn.

## Cấu trúc

| File | Vai trò |
|---|---|
| `content.js` | Toàn bộ chữ y khoa: danh mục thuốc, xét nghiệm, câu hỏi, BE FAST, bài tập, bài học, câu khích lệ. Sửa nội dung ở đây, không sửa trong màn |
| `rules.js` | Logic lâm sàng thuần, không đụng giao diện: ngưỡng `TH`, trạng thái huyết áp, đường huyết, xét nghiệm, tuân thủ, lịch trong ngày, nhóm theo dõi, đầu vào thang điểm |
| `data.js` | Người dùng giả (`SCENARIOS`), giờ demo cố định 31/10/2026 07:02 |
| `app.js` | Trạng thái, lưu trữ, khung màn, thành phần dùng chung (`row`, `group`, `btn`, `chips`, `seg`, `keypad`, `dateRow`), điều hướng, xử lý sự kiện |
| `screens-*.js` | Mỗi tab một file; Hồ sơ và màn bắt đầu mỗi thứ một file |
| `panel.js` | Bảng điều khiển demo, nằm ngoài khung điện thoại |
| `i18n.js` | Bản tiếng Anh cho giao diện. Bài học dài chỉ có tiếng Việt |
| `styles.css` | Một file CSS, token ở đầu file, có nền tối và ba cỡ chữ |

Không có thư viện, không có bước build. Các file là script thường (không phải module) để mở được từ `file://`.

### Cách viết một màn

```js
V.labDetail = ({ test }) => ({ chrome: 'push', html: topBar({ back: 'Chỉ số' }) + h1(labDef(test).name) + ... });
A.labAdd = ({ test }) => sheet('labAddSheet', { test });   // gắn vào nút: on('labAdd', { test: 'ldl' })
F.scanDate = v => { S.draft.scan.date = v; };              // gắn vào ô nhập: data-field="scanDate"
```

- `V.tên` trả về `{ html, chrome }`. `chrome`: `tab` (có thanh tab), `push` (màn con), `modal` (việc riêng, có nút Đóng), `bare`. Sheet trả về `{ html }`.
- `A.tên(params, el)` nhận tham số từ thuộc tính `data-*` của nút. Sau khi chạy, app tự lưu và vẽ lại, trừ khi hàm trả `false`.
- `F.tên(value, el)` chạy khi gõ hoặc đổi ô nhập, không vẽ lại.
- `S.draft` giữ dữ liệu tạm của màn đang nhập. `D` là dữ liệu lưu trong `localStorage`; `P()` là hồ sơ đang mở.

## Quy tắc khi sửa

1. Ngưỡng lâm sàng chỉ nằm trong `rules.js` và theo tài liệu yêu cầu. Không tự đặt ngưỡng hay hệ số mới.
2. Người bệnh chỉ thấy trạng thái, không thấy điểm nguy cơ. FSRP 2017 (từ 55 tuổi, chưa đột quỵ), ESRS và SPI-II (sau nhồi máu não hoặc TIA) chỉ thu đầu vào; điểm tính ở phía bác sĩ. Không tự tạo hệ số hay kết quả.
3. Màu mức độ luôn có hình đi kèm: xanh dấu tích là tốt, cam chấm là cần cải thiện, cam tam giác là cao hoặc thấp, đỏ tam giác là nguy hiểm.
4. Nút 115 có trên mọi màn và luôn dễ bấm. Số đo nguy hiểm báo rõ nhưng không gây hoảng.
5. Không hướng dẫn uống bù thuốc chống đông. Quên liều thì hướng dẫn liên hệ bác sĩ hoặc dược sĩ.
6. Đồng ý chia sẻ dữ liệu phải do người dùng chọn rõ ràng, không có lựa chọn ngầm định.
7. Không thêm khẩu hiệu, dòng giải thích hay nhãn phụ. Nếu màn hình cần chúng mới hiểu được thì sửa bố cục.
8. Giờ 24 giờ, ngày dd/mm, số thập phân dùng dấu phẩy.

## Kiểm thử

```bash
node tests/run.js
node tests/shots.js
```

`run.js` mở `tests/index.html` trên Edge hoặc Chrome chạy ngầm. Bộ kiểm tra bấm các luồng chính (dùng thuốc, ghi huyết áp, xét nghiệm, chụp phiếu, bắt đầu dùng app, người nhà nhập giúp) rồi đi qua mọi màn của từng người dùng giả, kể cả chữ rất lớn ở khổ 320px. Mỗi màn được dò: tràn ngang, chữ lỗi, giờ AM/PM, chữ về nguy cơ, nút nhỏ hơn 44px, nút không có tên, thiếu 115. Có thể mở thẳng `tests/index.html` bằng trình duyệt để xem kết quả.

`shots.js` chụp các màn chính ở 375×812 (nền sáng, nền tối, chữ rất lớn) và 320px (chữ rất lớn, nền tối), đếm số chữ trên mỗi màn và số lần bấm cho ba việc chính. Ảnh và `metrics.json` ghi vào thư mục tạm của máy hoặc thư mục truyền vào; không để ảnh trong repo.

Cần Node 22 trở lên. Đặt biến `BROWSER` nếu trình duyệt nằm chỗ khác.

## Phần mô phỏng

- Thông báo và màn khóa: dựng trong app, không phải thông báo thật của máy.
- Gọi điện (115, bác sĩ, dược sĩ, bệnh viện): hiện hộp thoại, không gọi thật.
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
