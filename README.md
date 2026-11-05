# VNPreventStroke · bản demo

Bản demo bấm thử của ứng dụng phòng ngừa đột quỵ. Toàn bộ bệnh nhân và số liệu là giả. Không dùng để chẩn đoán hay điều trị.

- `web-bac-si-v2/`: web cho bác sĩ và quản lý khoa. Mở `index.html` (bấm đúp được, không cần máy chủ).
- `app-benh-nhan-v2/`: app cho người bệnh.
- `index.html`: trang chọn demo.

## Web bác sĩ và quản lý

**Bác sĩ** (BS. Nguyễn Hoàng Nam, 48 bệnh nhân) thấy ai cần xử lý hôm nay, xử lý ngay tại hàng đợi, mở hồ sơ một trang. Ca nặng có thẻ **Hồi phục** theo dõi điểm mRS qua các lần khám; hoàn tất khám thì ghi mRS hôm nay. Mục **Hồ sơ ban đầu** hiện những gì người bệnh khai trên app (bệnh nền, thuốc, sinh hoạt, gia đình, triệu chứng 3 tháng qua) kèm nguồn khai; bác sĩ xác nhận ngay trên hồ sơ. Người bệnh chưa đồng ý chia sẻ thì không hiện. Hai cảnh báo từ hồ sơ ban đầu (triệu chứng giống đột quỵ chưa đánh giá, rung nhĩ chưa thấy thuốc chống đông) là `[Đề xuất]`, ở mức cần theo dõi.

**Quản lý** thấy toàn khoa (4 bác sĩ, 155 bệnh nhân), từng bác sĩ và bệnh nhân của họ, thời gian trả lời tin nhắn, và đặt ngưỡng cảnh báo. Quản lý bấm một bệnh nhân để mở hồ sơ một trang như bác sĩ nhưng chỉ đọc: không có nút ghi (gọi, nhắn, xử lý, đặt lịch, xác nhận) và không đọc nội dung tin nhắn. Trang Tổng quan có 10 biểu đồ chung cho khoa; bấm một thanh để mở danh sách bệnh nhân tương ứng.

### Cấu trúc

| File | Vai trò |
|---|---|
| `data.js` | Dữ liệu giả sinh từ số ngẫu nhiên cố định. `D.patients` là bệnh nhân của bác sĩ đang đăng nhập; `D.unit` là cả khoa; `D.doctors` là các bác sĩ |
| `rules.js` | Quy tắc lâm sàng: phân loại cần can thiệp / cần theo dõi / ổn định, thang điểm, ngưỡng (`R.cfg`) |
| `insights.js` | Gợi ý dẫn xuất từ dữ liệu và `rules.js`: dấu mới, việc nên làm, quy luật quên liều, mRS, thời gian trả lời, tìm theo nhu cầu |
| `ui.js` | Thành phần dùng chung: icon, chip, biểu đồ SVG, hộp thoại |
| `views-doctor.js`, `views-patient.js`, `views-manager.js` | Các trang, trả về chuỗi HTML |
| `app.js` | Trạng thái `S`, định tuyến theo `#/...`, xử lý sự kiện qua thuộc tính `data-a` |
| `styles.css` | Một lớp CSS duy nhất, token ở đầu file, có chế độ tối |

Đường dẫn trực tiếp: `#/d/home`, `#/d/patients`, `#/d/patient/P001`, `#/m/dashboard` (Tổng quan), `#/m/overview` (bảng Toàn khoa), `#/m/doctor/hang`, `#/m/msgs`.

### Quy tắc khi sửa

1. Mức độ của bệnh nhân chỉ tính từ dữ liệu qua `rules.js`. Gợi ý, "đã xử lý" hay "hẹn xem lại" không đổi mức.
2. Không tự đặt ngưỡng lâm sàng hay hệ số mới. Quy ước tự đặt ghi `[Đề xuất]` trong code (ví dụ ca nặng = mRS ≥3 ở ít nhất một lần khám).
3. Màu mức độ dùng chung: đỏ tam giác = cần can thiệp, cam thoi = cần theo dõi, xanh tròn = ổn định. Luôn có hình hoặc chữ đi kèm màu, và chỉ tô màu khi `rules.js` có lý do; số chưa đạt mục tiêu mà không có lý do thì in đậm, không tô màu.
4. Dashboard bác sĩ và hồ sơ một trang không cuộn ở 1440×900 và 1366×768.
5. Bác sĩ chỉ thấy bệnh nhân của mình; số liệu toàn khoa chỉ nằm ở cổng Quản lý.
6. Không thêm dòng giải thích hay nhãn phụ; nếu màn hình cần chúng mới hiểu được thì sửa bố cục.

### Kiểm thử

```bash
node test/logic.js
node test/ui.js
node test/worst.js
```

`logic.js` kiểm tra phân loại 6 / 14 / 28 của BS. Nam, 5 bệnh nhân nòng cốt, dữ liệu khoa, mRS. `ui.js` mở web từ `file://` trên Edge hoặc Chrome chạy ngầm và bấm bằng chuột thật: không cuộn, hồ sơ cả 48 bệnh nhân, xử lý tại hàng đợi, ghi mRS, cổng Quản lý. `worst.js` thử từng trang với dữ liệu xấu nhất (tên rất dài, bệnh nhân chưa có số đo, danh sách trống, khoa 1.284 bệnh nhân) ở hai cỡ màn hình và báo chữ tràn hay chữ lỗi; ảnh chụp lưu ở thư mục tạm. Hai file giao diện dùng chung `test/browser.js`. Cần Node 22 trở lên; đặt `BROWSER` nếu trình duyệt nằm chỗ khác.

`PRODUCT.md` ghi người dùng và ràng buộc sản phẩm, `DESIGN.md` ghi hệ thiết kế (token, thành phần, chuyển động).
