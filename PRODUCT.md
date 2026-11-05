# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Bác sĩ chuyên khoa đột quỵ** theo dõi bệnh nhân sau xuất viện, trên máy tính ở phòng khám hoặc bàn làm việc (màn 1366–1440 px). Việc chính: biết ai cần xử lý hôm nay, xử lý ngay tại hàng đợi, mở hồ sơ một trang, hoàn tất buổi tái khám và ghi điểm mRS với ca nặng. Chỉ thấy bệnh nhân của mình.
- **Cán bộ quản lý khoa** xem toàn khoa: số bệnh nhân, từng bác sĩ và bệnh nhân họ quản lý, tin nhắn đang chờ trả lời, ngưỡng cảnh báo. Mở được hồ sơ bệnh nhân của cả khoa nhưng chỉ đọc (không ghi, không đọc nội dung tin nhắn).
- **Người xem bản demo**: hội đồng và nhà tài trợ, cần hình dung sản phẩm sẽ hoạt động thế nào.

## Product Purpose

Bản demo bấm thử của web theo dõi phòng ngừa đột quỵ tái phát. Chưa phải sản phẩm thật: không có máy chủ, toàn bộ bệnh nhân và số liệu là giả định, không dùng để chẩn đoán hay điều trị.

Thành công là: bác sĩ bấm thử thấy dùng được (mở lên thấy ngay ai cần xử lý, xử lý trong vài cú bấm, góp ý được), và hội đồng hình dung được sản phẩm sẽ chạy thế nào.

## Positioning

Mức độ của mỗi bệnh nhân (cần can thiệp, cần theo dõi, ổn định) tính hoàn toàn từ dữ liệu theo quy tắc minh bạch trong `rules.js`, không phải AI, và luôn kèm lý do cụ thể. Bác sĩ xử lý hay hẹn xem lại không làm đổi mức; mức chỉ đổi khi dữ liệu đổi.

## Operating Context

- Mở bằng cách bấm đúp `index.html` hoặc qua GitHub Pages. Không có bước build, không có máy chủ; đường dẫn theo `#/...`.
- Bác sĩ dùng giữa các ca khám: xem hàng đợi buổi sáng, chuẩn bị trước giờ tái khám, nhắn tin với bệnh nhân (bệnh nhân dùng app riêng).
- Giao diện tiếng Việt.

## Capabilities and Constraints

- Mức độ chỉ tính qua `rules.js`. Không tự đặt ngưỡng lâm sàng hay hệ số thang điểm mới; quy ước tự đặt ghi `[Đề xuất]` trong code (ví dụ ca nặng = mRS ≥3 ở ít nhất một lần khám).
- Dữ liệu demo cố định: bác sĩ đăng nhập có 48 bệnh nhân, phân loại 6 / 14 / 28; khoa có 4 bác sĩ, 155 bệnh nhân.
- Dashboard bác sĩ và hồ sơ một trang không cuộn ở 1440×900 và 1366×768.
- Bác sĩ chỉ thấy bệnh nhân của mình; số liệu toàn khoa chỉ ở cổng Quản lý.
- Luôn giữ banner bản demo (kèm số cấp cứu 115), đánh dấu "Gợi ý" cho gợi ý tự động, và chữ "minh họa" ở tính năng chưa thật.
- Không thêm dòng giải thích hay nhãn phụ; nếu màn hình cần chúng mới hiểu được thì sửa bố cục.

## Brand Commitments

- Tên: VNPreventStroke, dấu hiệu là ô chữ "V". Không dùng logo của tổ chức có thật, không tên người thật. Không ghi tên cơ sở trong PRODUCT.md và DESIGN.md.

## Evidence on Hand

- Toàn bộ bệnh nhân, chỉ số, tin nhắn và lịch hẹn sinh từ số ngẫu nhiên cố định trong `web-bac-si-v2/data.js`.
- Không có dữ liệu bệnh nhân thật, kết quả lâm sàng, đánh giá hay lời chứng thực. Không được bịa những thứ này.

## Product Principles

1. Ai cần xử lý hôm nay phải thấy ngay khi mở, không phải cuộn.
2. Mức độ đến từ dữ liệu và quy tắc, không từ thao tác của người dùng.
3. Mỗi màn hình một mục đích; chi tiết hiện khi bấm, không thành dòng chữ cố định.
4. Không bịa ngưỡng, hệ số hay kết quả lâm sàng.
5. Mỗi vai trò chỉ thấy đúng phần dữ liệu của mình.

## Accessibility & Inclusion

- Màu mức độ luôn đi kèm hình (tam giác, thoi, tròn) hoặc chữ.
- Đủ tương phản ở cả nền sáng và nền tối.
- Dùng được bằng bàn phím: Enter hoặc Space trên hàng, Escape đóng lớp trên cùng.
