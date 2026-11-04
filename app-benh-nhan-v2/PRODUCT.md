# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Người bệnh lớn tuổi: đã bị đột quỵ và cần phòng tái phát, hoặc từ 55 tuổi có nguy cơ và cần phòng đột quỵ lần đầu. Nhiều người mắt kém, ngại gõ, ít quen điện thoại. Họ mở app mỗi ngày để dùng thuốc đúng giờ, ghi huyết áp và đường huyết, xem và nhập kết quả xét nghiệm.
- Người nhà nhập giúp khi người bệnh nằm một chỗ hoặc không tự dùng điện thoại được.

## Product Purpose

App phòng ngừa đột quỵ cho người bệnh, làm bốn việc:

1. Nhắc dùng thuốc và ghi đã dùng.
2. Theo dõi huyết áp, đường huyết, LDL.
3. Tự nhập hoặc chụp phiếu xét nghiệm.
4. Học dấu hiệu đột quỵ (BE FAST, FAST), bài tập phục hồi chức năng, chế độ ăn phòng đột quỵ.

Thành công là người bệnh dùng thuốc đều, chỉ số được ghi đủ để bác sĩ theo dõi, và nhận ra dấu hiệu đột quỵ để gọi 115 kịp.

## Positioning

App đi cùng web của bác sĩ điều trị. Dữ liệu người bệnh đồng ý chia sẻ đến thẳng bác sĩ; kế hoạch theo dõi khác nhau theo nhóm (phòng lần đầu, sau nhồi máu não hoặc TIA, sau chảy máu não); đánh giá chỉ số theo ngưỡng của tài liệu yêu cầu, không theo ngưỡng tự đặt.

## Operating Context

- Dùng một tay, ở nhà, vào giờ uống thuốc sáng và tối. Đo huyết áp bằng máy đo tại nhà rồi nhập số.
- Phiếu xét nghiệm giấy từ bệnh viện: chụp lại hoặc gõ số.
- Bản hiện tại là bản demo bấm thử: HTML, CSS, JS tĩnh, mở được từ `file://`, dữ liệu giả, giờ demo cố định, bảng điều khiển demo nằm ngoài khung điện thoại.

## Capabilities and Constraints

- Ngưỡng lâm sàng nằm trong `rules.js` và theo tài liệu yêu cầu. Không tự đặt ngưỡng hay hệ số.
- Người bệnh không thấy điểm nguy cơ. FSRP 2017, ESRS và SPI-II chỉ thu đầu vào; điểm tính ở phía bác sĩ.
- Không hướng dẫn uống bù thuốc chống đông; quên liều thì hướng dẫn liên hệ bác sĩ hoặc dược sĩ.
- Đồng ý chia sẻ dữ liệu phải do người dùng chọn rõ ràng.
- Bắt buộc giữ: nút 115 trên mọi màn, nhãn "BẢN DEMO", chữ "minh họa" trên nội dung minh họa, màu mức độ đỏ, cam, xanh luôn có hình đi kèm.
- Nội dung bài tập và chế độ ăn là nội dung mẫu chờ bác sĩ duyệt. Ghi điều này trong README, không thêm chữ lên màn hình.
- Không thư viện, không bước build; các file là script thường.
- Tiếng Việt là chính, có bản tiếng Anh cho giao diện. Giờ 24 giờ, ngày dd/mm, số thập phân dùng dấu phẩy.
- Phần mô phỏng: thông báo, cuộc gọi, đọc chữ từ ảnh phiếu xét nghiệm, quét mã bệnh viện, kết nối máy đo và ứng dụng sức khỏe.

## Brand Commitments

- Tên VNPreventStroke.
- Giọng ấm, ngắn, không trách khi quên, không gây hoảng khi số đo nguy hiểm.
- Câu khích lệ lấy nguyên văn từ tài liệu yêu cầu, nằm trong `content.js`.
- Không dùng logo, biểu tượng hay ảnh chụp của Apple.

## Evidence on Hand

- Dữ liệu giả trong `data.js`: bảy người dùng mẫu theo nhóm theo dõi.
- Chưa có người dùng thật, lời chứng thực hay số liệu hiệu quả. Không được bịa.

## Product Principles

1. Mỗi màn một mục đích; việc của hôm nay đứng đầu.
2. Chạm thay gõ, chụp thay nhập, bàn phím số lớn.
3. An toàn trước: 115 luôn sẵn, số đo nguy hiểm báo rõ, không tư vấn ngoài phạm vi.
4. Không trách: bỏ app vài ngày rồi quay lại không phải nhập bù.
5. Người bệnh làm chủ dữ liệu của mình.

## Accessibility & Inclusion

- Người lớn tuổi, mắt kém: ba cỡ chữ (mặc định Lớn, có Rất lớn), nút cao ít nhất 44px, tương phản đủ ở nền sáng và nền tối.
- Không dùng màu làm tín hiệu duy nhất.
- Đọc to bài học và bài tập.
- Dùng được ở khổ 320px với chữ Rất lớn.
