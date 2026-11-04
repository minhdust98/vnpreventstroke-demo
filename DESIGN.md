---
name: VNPreventStroke
description: Web theo dõi phòng ngừa đột quỵ tái phát cho bác sĩ và quản lý khoa (bản demo)
colors:
  accent: "#0071E3"
  accent-soft: "#E8F2FD"
  accent-ink: "#0058B0"
  act: "#DE2A1F"
  act-soft: "#FFEEED"
  act-ink: "#C4140A"
  watch: "#FF9500"
  watch-soft: "#FFF3E2"
  watch-ink: "#A34A00"
  ok: "#34C759"
  ok-soft: "#E9F8ED"
  ok-ink: "#1B7F3B"
  paper: "#FFFFFF"
  sheet: "#FFFFFF"
  fill: "#F5F5F7"
  fill-2: "#ECECEF"
  ink: "#1D1D1F"
  ink-soft: "#6E6E73"
  rule: "#E5E5EA"
  series-1: "#0071E3"
  series-2: "#00A0A0"
  accent-dark: "#0A6FD6"
  accent-soft-dark: "#10294A"
  accent-ink-dark: "#6CB4FF"
  act-dark: "#D93A30"
  act-soft-dark: "#3D1512"
  act-ink-dark: "#FF8A80"
  watch-dark: "#FF9F0A"
  watch-soft-dark: "#3A2810"
  watch-ink-dark: "#FFB84D"
  ok-dark: "#30D158"
  ok-soft-dark: "#12321C"
  ok-ink-dark: "#5FE08A"
  paper-dark: "#000000"
  sheet-dark: "#1C1C1E"
  fill-dark: "#2C2C2E"
  fill-2-dark: "#3A3A3C"
  ink-dark: "#F5F5F7"
  ink-soft-dark: "#A1A1A6"
  rule-dark: "#38383A"
  series-1-dark: "#3F86E0"
  series-2-dark: "#14A87F"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.015em"
    fontFeature: "tnum"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.006em"
    fontFeature: "tnum"
  table:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
  micro:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    fontFeature: "tnum"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  hair: "3px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "18px"
  pill: "999px"
spacing:
  "2xs": "4px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  "2xl": "20px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-secondary:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.fill-2}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-ghost-hover:
    backgroundColor: "{colors.fill}"
  button-suggest-act:
    backgroundColor: "{colors.act-soft}"
    textColor: "{colors.act-ink}"
    rounded: "{rounded.xs}"
    padding: "4px 10px"
  button-suggest-watch:
    backgroundColor: "{colors.watch-soft}"
    textColor: "{colors.watch-ink}"
    rounded: "{rounded.xs}"
    padding: "4px 10px"
  chip-act:
    backgroundColor: "{colors.act-soft}"
    textColor: "{colors.act-ink}"
    rounded: "{rounded.pill}"
    padding: "1px 9px 1px 6px"
  chip-watch:
    backgroundColor: "{colors.watch-soft}"
    textColor: "{colors.watch-ink}"
    rounded: "{rounded.pill}"
    padding: "1px 9px 1px 6px"
  chip-ok:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok-ink}"
    rounded: "{rounded.pill}"
    padding: "1px 9px 1px 6px"
  card:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.lg}"
    padding: "9px 14px"
  stat-tile:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 9px"
  search-field:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 34px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 9px"
  nav-item-active:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
  table-header:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    padding: "8px 10px"
  table-footer:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    padding: "8px 10px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
---

# Design System: VNPreventStroke

## Overview

**Creative North Star: "Bàn trực yên tĩnh"**

Một mặt bàn làm việc sáng, gọn, kiểu Apple: nền trắng hoặc đen tuyền, các khối xám lạnh nhạt, chữ đen mềm. Mọi thứ im lặng cho đến khi dữ liệu có lý do lên tiếng. Màu chỉ xuất hiện ở hai chỗ: một màu xanh dương cho thao tác, và ba màu mức độ (đỏ, cam, xanh lá) chỉ khi `rules.js` có lý do. Mắt bác sĩ đi thẳng tới chỗ có màu; phần còn lại là giấy.

Mật độ cao nhưng không chật: chữ thân 14px, bảng 13.5px, hàng 40 đến 50px, khoảng cách theo bậc 4 đến 20px. Dashboard và hồ sơ một trang phải nằm gọn trong một màn hình 1440×900 và 1366×768, nên bố cục dùng lưới co giãn với các vùng tự cuộn bên trong thay vì cuộn trang. Chi tiết không viết thành dòng chữ cố định: nó nằm trong tooltip, hoặc sau một cú bấm vào tiêu đề thẻ, hàng bảng, ô số liệu.

Không bóng đổ trang trí, không chuyển động trên bề mặt dùng nhiều lần mỗi phút. Chiều sâu đến từ lớp màu xám (paper, sheet, fill) và đường kẻ mảnh; bóng chỉ có ở lớp nổi tạm thời.

**Key Characteristics:**
- Một màu nhấn (xanh dương) cho thao tác, liên kết, tiêu điểm.
- Ba màu mức độ luôn đi cùng hình (tam giác, thoi, tròn) hoặc chữ.
- Một họ xám lạnh duy nhất cho nền, khối, chữ phụ, đường kẻ.
- Chữ số dạng bảng (tabular) ở mọi nơi; chữ phụ không nhỏ hơn 12px.
- Không cuộn trang ở dashboard và hồ sơ; vùng con tự cuộn.
- Sáng và tối song song, cùng tên token.

## Colors

Bảng màu trung tính lạnh kiểu Apple, một màu nhấn xanh dương, ba màu mức độ dành riêng cho phân loại lâm sàng.

### Primary
- **Xanh thao tác** (accent): nút chính, tab đang chọn (gạch dưới), viền tiêu điểm, ngày hôm nay trong lịch, icon gợi ý. Bản "soft" làm nền cho tin nhắn của bác sĩ, ô lọc đang bật, lịch hẹn đã xác nhận, hộp thông tin. Bản "ink" là màu chữ liên kết và trạng thái hover của tiêu đề bấm được.

### Secondary
- **Đỏ can thiệp** (act), **Cam theo dõi** (watch), **Xanh ổn định** (ok): ba màu mức độ, mỗi màu có ba sắc. Sắc đặc dùng cho dấu hình (`U.mark`) và viên mức độ ở đầu hồ sơ; sắc soft làm nền chip, ô số liệu, tab mức độ đang chọn; sắc ink làm chữ trên nền soft và số đếm. Viên mức độ cam và xanh dùng chữ đen (#1D1D1F) để đủ tương phản; viên đỏ dùng chữ trắng.

### Tertiary
- **Chuỗi biểu đồ** (series-1 xanh dương, series-2 xanh mòng két): hai đường trong biểu đồ huyết áp (tâm thu, tâm trương). Không dùng ngoài biểu đồ.

### Neutral
- **Giấy** (paper): nền trang và nền hồ sơ trượt ra. Đen tuyền ở chế độ tối.
- **Tờ** (sheet): nền thẻ, bảng, menu, hộp thoại. Trùng giấy ở chế độ sáng; nâng lên #1C1C1E ở chế độ tối.
- **Khối** (fill, fill-2): nền nút phụ, ô số liệu, hàng hover, hàng đang mở, ô tìm kiếm, dòng tổng cuối bảng; fill-2 là trạng thái hover của khối.
- **Mực** (ink): chữ chính, và cả giá trị chưa đạt mục tiêu (in đậm).
- **Mực phụ** (ink-soft): chữ phụ, tiêu đề cột, nhãn ô, trục biểu đồ.
- **Kẻ** (rule): đường kẻ 1px giữa hàng, viền thẻ, đường phân cách.

### Named Rules
**The One Accent Rule.** Xanh dương chỉ cho thứ bấm được hoặc đang có tiêu điểm. Không dùng xanh dương để trang trí, làm tiêu đề hay tô số liệu.

**The Reason-Before-Color Rule.** Đỏ, cam, xanh lá chỉ xuất hiện khi `rules.js` trả về một lý do cho đúng ô, hàng hay bệnh nhân đó. Giá trị lệch mục tiêu mà không có lý do từ quy tắc thì in đậm màu mực, không tô màu (`U.state` trả về "Cần cải thiện" đậm, không đỏ). Huy hiệu số đếm (mực đậm, chữ giấy), nhãn [Đề xuất], hộp lưu ý và lịch hẹn chờ xác nhận (viền mảnh) cũng dùng màu trung tính.

**The Shape-With-Color Rule.** Màu mức độ không bao giờ đứng một mình: đỏ đi với tam giác, cam với hình thoi, xanh với hình tròn, hoặc kèm chữ ("Cần can thiệp", "Cần theo dõi", "Ổn định").

## Typography

**Display Font:** phông hệ thống Apple (SF Pro), Inter (tải từ Google Fonts) trên máy không có SF, rồi Segoe UI, Roboto.
**Body Font:** cùng một họ.

**Character:** Một họ không chân duy nhất, chặt nhẹ (letter-spacing âm), số dạng bảng để các cột số thẳng hàng. Phân cấp bằng cỡ và độ đậm, không bằng phông thứ hai.

### Hierarchy
- **Display** (600, 30px, 1.12): số đếm ở ba tab mức độ trên dashboard, tiêu đề màn chọn vai trò và trang chọn demo.
- **Headline** (600, 22px): tiêu đề trang (h1), giá trị lớn trong ô số liệu hồ sơ, tên bệnh nhân ở đầu hồ sơ, điểm thang nguy cơ.
- **Title** (600, 14px): tiêu đề thẻ (h2) và tiêu đề hộp thoại; tiêu đề phụ (h3) 13px.
- **Body** (400, 14px, 1.4): chữ thường. Bảng dùng 13.5px.
- **Label** (500, 12px): tiêu đề cột, nhãn ô, chú thích biểu đồ, chip. Có cỡ trung gian 12.5px cho dòng phụ trong hàng đợi và nút nhỏ.
- **Micro** (600, 11px): chỉ cho số đếm trên huy hiệu tròn (menu, tab, hội thoại) và ký hiệu trong ô bản đồ uống thuốc.

### Named Rules
**The 12px Floor Rule.** Chữ phụ, nhãn, chip, trục biểu đồ không nhỏ hơn 12px. Ngoại lệ duy nhất là số đếm trên huy hiệu (Micro, 11px).

**The Tabular Rule.** `font-variant-numeric: tabular-nums` đặt ở `body`; mọi con số thẳng cột, không cần lớp riêng.

## Layout

Khung cố định toàn màn hình: banner bản demo 24px trên cùng (luôn có, kèm số cấp cứu 115), menu trái 212px (thu còn 58px khi bấm thu gọn hoặc khi cửa sổ hẹp hơn 1180px), thanh trên 52px, vùng nội dung với lề 14px 20px 18px. `html` và `body` không cuộn; chỉ vùng con cuộn.

**Dashboard bác sĩ:** lưới hai cột (hàng đợi co giãn, cột phải 284px). Trên hàng đợi là ba tab mức độ chia đều. Cột phải là hai thẻ xếp dọc theo tỉ lệ 1.2 : 1, mỗi thẻ tự cuộn. Khi chiều cao dưới 700px, số đếm thu về 24px.

**Hồ sơ một trang:** mở dạng lớp phủ toàn vùng nội dung. Hàng sáu ô số liệu, rồi lưới hai cột (cột trái co giãn, cột phải 350px). Thẻ trong cột có chiều cao theo nội dung; thẻ thuốc co giãn và tự cuộn. Chi tiết mở trong bảng trượt từ phải (rộng tối đa 960px hoặc 88%).

**Nhịp khoảng cách:** 4, 6, 8, 10, 14, 18, 20px. Khoảng cách giữa các thẻ 10 đến 14px; đệm trong thẻ 14px ngang.

### Named Rules
**The One-Screen Rule.** Dashboard và hồ sơ một trang không cuộn ở 1440×900 và 1366×768. Khi thiếu chỗ, rút gọn bố cục hoặc cho vùng con tự cuộn; không thêm thanh cuộn trang.

**The Click-For-Detail Rule.** Không có dòng giải thích hay nhãn phụ cố định. Chi tiết nằm trong tooltip (thuộc tính `title`, hoặc tooltip tối `.ctip` trên biểu đồ) hoặc sau một cú bấm.

## Elevation & Depth

Phẳng khi nghỉ. Chiều sâu đến từ lớp màu: paper → sheet → fill, cộng viền 1px màu kẻ. Ở chế độ tối, sheet sáng hơn paper một bậc nên thẻ nổi lên mà không cần bóng.

### Shadow Vocabulary
- **Lớp nổi** (`box-shadow: 0 8px 30px rgba(0,0,0,.12)`; tối: `rgba(0,0,0,.5)`): chỉ cho menu thả, kết quả tìm kiếm, hộp thoại, thông báo nhanh.
- **Nút đoạn đang chọn** (`box-shadow: 0 1px 2px rgba(0,0,0,.14)`): ô đang chọn trong điều khiển phân đoạn.
- **Vòng nhấn** (`box-shadow: 0 0 0 2px sheet, 0 0 0 3.5px ink`): vòng quanh lần khám mRS mới nhất và ô bỏ liều nguy hiểm trên bản đồ nhiệt (vòng màu act).

Lớp che: hộp thoại `rgba(0,0,0,.32)`, bảng trượt `rgba(0,0,0,.28)`.

### Named Rules
**The Flat-At-Rest Rule.** Thẻ, bảng, ô số liệu không có bóng. Bóng chỉ thuộc về thứ nổi tạm thời trên trang.

**The Fade-Only Rule.** Chuyển động duy nhất là mờ dần độ trong suốt (0.12 đến 0.15 giây) khi hồ sơ, hộp thoại, bảng trượt, thông báo xuất hiện. Không trượt, không phóng to, không chuyển động trên hàng đợi, bảng, tab, hover.

## Shapes

Góc bo mềm, đồng tâm: khối ngoài 14px (thẻ, bảng, ô số liệu, hộp thoại), khối trong nhỏ hơn (menu và ô gạch 12px, nút và ô nhập 8px, nút nhỏ, nhãn, tooltip và lịch hẹn 6px; dấu dữ liệu nhỏ như ô bản đồ uống thuốc và ô chú giải 3px). Ô chọn vai trò 18px. Chip, huy hiệu, avatar tròn hoàn toàn. Viền luôn 1px màu kẻ; viền nét đứt nghĩa là "chưa có dữ liệu" (thang điểm chưa tính, ô chưa ghi).

Ba dấu mức độ là hình học thuần, 10px: tam giác (clip-path), hình thoi (vuông xoay 45°), hình tròn. Icon nét 1.8, đầu tròn, 14 đến 18px, vẽ SVG nội tuyến.

## Components

### Buttons
- **Shape:** bo 8px (nút nhỏ 7px), không viền.
- **Primary:** nền xanh thao tác, chữ trắng, 500, đệm 6px 12px. Hover tối đi 6% (brightness .94). Mỗi khu vực tối đa một nút chính.
- **Secondary:** nền khối xám, hover sang fill-2. Bên trong hàng đợi đang mở, nút phụ đổi nền sang sheet để tách khỏi nền fill.
- **Ghost:** không nền, hover hiện khối xám.
- **Gợi ý (sug):** nền soft và chữ ink theo mức của bệnh nhân, đậm 600, icon tia sáng 11px. Luôn có tooltip "Gợi ý theo quy tắc, bác sĩ quyết định".
- **Icon button:** 34px vuông (nhỏ 28px), bo 9px, hover khối xám, luôn có `aria-label` và `title`.
- **Focus:** viền 2px xanh thao tác, cách 2px.

### Chips
- **Mức độ:** viên tròn, 12px đậm, nền soft, chữ ink, icon đi kèm (cảnh báo, nửa tròn, dấu tích).
- **Nhãn (tag):** bo 5px, 12px, nền khối, chữ phụ. Biến thể "demo" nền xanh soft.
- **Lọc đang bật:** viên xanh soft có nút x.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** sheet, viền 1px màu kẻ.
- **Shadow Strategy:** không có (xem Elevation).
- **Header:** cao tối thiểu 42px (36px trong hồ sơ), đệm 9px 14px; tiêu đề là nút bấm được kèm mũi tên phải, hover chuyển xanh.
- **Internal Padding:** 14px ngang.

### Clickable Heading (tiêu đề thẻ bấm được)
Tiêu đề thẻ chính là đường vào phần chi tiết: chữ tiêu đề + mũi tên phải 14px màu phụ, hover cả hai chuyển xanh ink. Thay cho liên kết "Xem tất cả" ở góc thẻ.

### Inputs / Fields
- **Style:** viền 1px màu kẻ, nền sheet, bo 8px, đệm 6px 9px. Ô tìm kiếm trên thanh trên không viền, nền khối, bo 9px, có icon kính lúp và phím tắt `/`.
- **Focus:** viền tiêu điểm xanh chung.
- **Error / Draft:** lỗi hiện trong hộp nền act-soft; ô ngưỡng đang sửa có viền xanh và nền xanh soft, ô đã đổi in đậm.

### Tables
- **Style:** 13.5px, hàng kẻ 1px, tiêu đề cột 12px chữ phụ, dính trên khi cuộn.
- **Sort:** bấm tiêu đề cột để sắp xếp; cột đang sắp có chữ đậm màu mực và mũi tên xuống, kèm `aria-sort`.
- **Rows:** cả hàng bấm được, hover nền khối, Enter hoặc Space mở. Cột lý do lấp phần còn lại và tự cắt bằng dấu "…", toàn văn ở tooltip.
- **Footer:** bảng tổng quan quản lý là một bảng duy nhất, hàng tổng "Toàn khoa" nằm trong `tfoot`, nền khối, chữ đậm.

### Navigation
- **Menu trái:** hàng 8px 9px, bo 8px, icon 18px. Hover và mục đang chọn nền khối; mục đang chọn đậm 600. Số đếm cạnh mục là chữ phụ; số tin chưa đọc là huy hiệu tròn.
- **Tab trong bảng trượt:** gạch dưới 2.5px xanh thao tác ở tab đang chọn.
- **Điều khiển phân đoạn:** rãnh khối, ô chọn nền sheet với bóng 1px.

### Level Tabs (tab mức độ)
Ba ô chia đều đầu dashboard: dấu hình + tên mức, số đếm 30px tô màu ink của mức. Ô đang chọn nền soft của mức đó; ô khác nền khối.

### Queue Row (hàng đợi)
Hàng 50px: tên (đậm), nhãn "Mới", lý do (cắt bằng "…", số lý do thêm dạng "+1"), nút gợi ý, mũi tên mở. Bấm hàng mở rộng tại chỗ trên nền khối, có thanh thao tác dính đáy.

### Stat Tile (ô số liệu)
Nền khối, bo 14px, nhãn 12px chữ phụ, giá trị 22px đậm, đơn vị 12px. Khi quy tắc có lý do, cả ô nhận nền soft và chữ ink của mức, kèm dấu hình và lý do ngắn.

## Do's and Don'ts

### Do:
- **Do** dùng xanh thao tác (#0071E3) chỉ cho nút chính, liên kết, tab đang chọn và viền tiêu điểm.
- **Do** ghép mỗi màu mức độ với hình (`U.mark`: tam giác, thoi, tròn) hoặc chữ.
- **Do** in đậm màu mực cho giá trị lệch mục tiêu khi `rules.js` không có lý do tô màu.
- **Do** đưa chi tiết vào tooltip hoặc sau cú bấm vào tiêu đề thẻ, hàng, ô.
- **Do** giữ dashboard và hồ sơ một trang vừa 1440×900 và 1366×768 không cuộn trang; vùng con tự cuộn.
- **Do** viết token cho cả `:root` và `:root[data-theme="dark"]` với cùng tên khi thêm màu.
- **Do** để tiêu đề cột là nút sắp xếp, và hàng tổng nằm trong `tfoot`.

### Don't:
- **Don't** dùng đỏ, cam, xanh lá chỉ vì một con số trông xấu; màu mức độ cần lý do từ `rules.js`.
- **Don't** thêm dòng giải thích, nhãn phụ hay chú thích cố định dưới tiêu đề.
- **Don't** đặt liên kết "Xem tất cả" ở góc thẻ; tiêu đề thẻ đã bấm được.
- **Don't** dùng chữ phụ nhỏ hơn 12px.
- **Don't** thêm bóng cho thẻ, bảng, ô số liệu.
- **Don't** thêm chuyển động trượt, phóng to hay chuyển động trên hàng đợi, bảng, hover; chỉ mờ dần ở lớp phủ.
- **Don't** thêm màu nhấn thứ hai hay họ xám thứ hai.
