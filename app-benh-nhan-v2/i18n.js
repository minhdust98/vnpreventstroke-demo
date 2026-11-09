'use strict';
// Tiếng Anh (BRD yêu cầu Việt và Anh). Dịch sau khi vẽ: tiếng Việt là bản gốc, chuỗi chưa có bản dịch giữ nguyên.
// Bài học dài (bài tập, ăn uống) hiện chỉ có tiếng Việt.

const EN = {
  // Khung
  'Hôm nay': 'Today', 'Thuốc': 'Medicines', 'Chỉ số': 'Health', 'Học': 'Learn', 'BẢN DEMO': 'DEMO',
  'Trang chủ': 'Home', 'Thông báo': 'Notifications', 'Cài đặt': 'Settings', 'Chào mừng': 'Welcome', 'Dự đoán nguy cơ': 'Risk prediction', 'Hồ sơ sức khỏe': 'Health record', 'Liên hệ': 'Contact', 'Giáo dục sức khỏe': 'Health education', 'Bác sĩ': 'Doctor', 'Trợ lý AI': 'AI assistant', 'Lịch hẹn': 'Appointments', 'Thêm bác sĩ': 'Add a doctor', 'Chưa có thông báo': 'No notifications', 'Trợ lý AI chưa có trong bản này': 'The AI assistant is not in this version', 'Thêm bác sĩ chưa có trong bản này': 'Adding a doctor is not in this version',
  'Đóng': 'Close', 'Xong': 'Done', 'Lưu': 'Save', 'Hủy': 'Cancel', 'Tiếp': 'Next', 'Quay lại': 'Back', 'Có': 'Yes', 'Không': 'No', 'Chưa rõ': 'Not sure', 'Để sau': 'Later', 'Đồng ý': 'Agree', 'Thêm': 'Add', 'Sửa': 'Edit', 'Sửa số': 'Edit', 'Xóa': 'Delete', 'Giữ lại': 'Keep', 'Chưa': 'Not yet', 'Rồi': 'Yes',
  'Tốt': 'Good', 'Cần cải thiện': 'Could improve', 'Rất cao': 'Very high', 'Thấp': 'Low', 'Sáng': 'Morning', 'Trưa': 'Noon', 'Chiều': 'Afternoon', 'Tối': 'Evening',
  'Ghi số đo': 'Log a reading', 'Khi quên liều': 'If you miss a dose', 'Kế hoạch theo dõi': 'Care plan', 'Chưa đủ': 'Not enough', 'Minh họa': 'Illustration',
  'Chưa có lần đo': 'No readings yet', 'Không có lần đo': 'No readings', 'Chưa có kết quả': 'No results yet', 'Hôm nay không có việc cần làm': 'Nothing to do today',
  'Cholesterol toàn phần': 'Total cholesterol', 'Đường huyết lúc đói': 'Fasting blood sugar', 'Đường huyết sau ăn': 'Blood sugar after a meal',
  'Bệnh nền': 'Medical history', 'Tim mạch': 'Heart', 'Sinh hoạt': 'Lifestyle', 'Gia đình': 'Family', 'Triệu chứng': 'Symptoms', 'Hồ sơ ban đầu': 'Starting profile', 'Triệu chứng 3 tháng qua': 'Symptoms in the last 3 months',
  'Không ai': 'No one', 'Không có': 'None', 'Không nhớ': 'Not sure', 'Đã từng': 'Used to', 'Nhóm theo dõi': 'Care group',
  'Bác sĩ có nói bạn bị rối loạn mỡ máu (mỡ máu cao) không?': 'Has a doctor said you have high cholesterol?', 'Bác sĩ có nói bạn bị bệnh thận không?': 'Has a doctor said you have kidney disease?',
  'Bạn có đang dùng thuốc chống đông không?': 'Are you taking a blood thinner?', 'Bạn có hay ngáy to hoặc ngừng thở khi ngủ không?': 'Do you often snore loudly or stop breathing in your sleep?',
  'Cha mẹ, anh chị em ruột có ai bị đột quỵ hoặc bệnh tim trước 60 tuổi không?': 'Did a parent, brother or sister have a stroke or heart disease before 60?', 'Cha mẹ, anh chị em ruột có ai từng bị:': 'Has a parent, brother or sister ever had:', 'Trong 3 tháng qua, bạn có từng bị:': 'In the last 3 months, have you had:',
  'Tăng huyết áp': 'High blood pressure', 'Đái tháo đường': 'Diabetes', 'Rối loạn mỡ máu': 'High cholesterol', 'Bệnh tim mạch': 'Heart disease', 'Đột quỵ': 'Stroke',
  'Khác': 'Other', 'Bệnh khác': 'Other conditions', 'Tim mạch khác': 'Other heart problems', 'Sinh hoạt khác': 'Other lifestyle', 'Gia đình khác': 'Other family history', 'Triệu chứng khác': 'Other symptoms',
  // Hôm nay
  'Sắp tới': 'Coming up', 'Đo và ghi': 'Measure', 'Đã dùng': 'Taken', 'Huyết áp': 'Blood pressure', 'Đường huyết': 'Blood sugar', 'Tái khám': 'Follow-up visit', 'Chưa ghi': 'Not logged', 'Đo lại huyết áp': 'Measure again', 'Đo lại': 'Measure again', 'Đã khám': 'I went', 'Trả lời': 'Answer', 'Đánh giá': 'Rate', 'Bạn thấy app thế nào?': 'How do you like the app?', 'Dấu hiệu đột quỵ': 'Stroke signs', 'Nhắc đo huyết áp': 'Blood pressure reminders', 'việc': 'tasks', 'buổi': 'times', 'Hôm nay không có việc gì cần làm.': 'Nothing to do today.', 'Xong hết hôm nay. Hẹn bạn ngày mai.': 'All done today. See you tomorrow.', 'Thêm thuốc': 'Add medicine',
  'Đã ghi': 'Logged', 'Đã ghi. Thẻ cấp cứu có giờ liều mới.': 'Logged. Your emergency card has the new dose time.', 'Dùng lúc nào?': 'When did you take it?', 'Muộn khoảng 1 giờ': 'About 1 hour late', 'Muộn hơn nữa': 'Later than that', 'Chưa dùng': 'Not taken', 'Đừng tự dùng bù hay gấp đôi liều.': 'Do not make up or double a dose on your own.', 'Gọi bác sĩ': 'Call doctor', 'Gọi dược sĩ': 'Call pharmacist', 'Tối qua bạn đã dùng thuốc chưa?': 'Did you take your medicines last night?',
  'Tóm tắt cho bác sĩ': 'Summary for your doctor', 'Thêm vào lịch điện thoại': 'Add to phone calendar', 'Tôi sẽ đến': 'I will come', 'Đổi lịch': 'Reschedule', 'Bạn sẽ đến': 'You will come', 'Đã gửi yêu cầu đổi lịch': 'Reschedule request sent', 'Chưa có lịch': 'No visit scheduled', 'Đổi lịch khám': 'Reschedule visit', 'Trong tuần này': 'This week', 'Tuần sau': 'Next week', 'Bệnh viện gọi lại để hẹn': 'Hospital calls me back', 'Gửi yêu cầu': 'Send request',
  // 115 và thẻ cấp cứu
  'Gọi cấp cứu 115': 'Call 115 emergency', 'Gọi 115': 'Call 115', 'Đau đầu': 'Headache', 'Đau đầu dữ dội, khác thường.': 'Sudden, severe, unusual headache.', 'Bệnh viện gần nhất': 'Nearest hospital', 'Ghi triệu chứng': 'Log a symptom', 'Thẻ cấp cứu': 'Emergency card', 'ĐANG DÙNG THUỐC CHỐNG ĐÔNG': 'TAKING A BLOOD THINNER', 'ĐANG DÙNG THUỐC KHÁNG NGƯNG TẬP TIỂU CẦU': 'TAKING AN ANTIPLATELET', 'Đột quỵ': 'Stroke', 'Bệnh nền': 'Conditions', 'Thuốc khác': 'Other medicines', 'Chưa ghi nhận liều gần nhất': 'No recent dose logged', 'Đang gọi 115': 'Calling 115',
  'Thăng bằng': 'Balance', 'Mắt': 'Eyes', 'Mặt': 'Face', 'Tay': 'Arm', 'Lời nói': 'Speech', 'Thời gian': 'Time',
  'Đột ngột chóng mặt, mất thăng bằng, đi loạng choạng.': 'Sudden dizziness, loss of balance, unsteady walking.', 'Đột ngột mờ mắt, mất thị lực hoặc nhìn đôi.': 'Sudden blurred vision, vision loss or double vision.', 'Méo miệng, một bên mặt xệ xuống khi cười.': 'One side of the face droops when smiling.', 'Một bên tay hoặc chân yếu, tê, không giơ lên được.': 'Weakness or numbness on one side, cannot lift the arm.', 'Nói ngọng, khó nói hoặc không hiểu người khác nói.': 'Slurred speech, trouble speaking or understanding.', 'Gọi 115 ngay. Ghi lại giờ bắt đầu có dấu hiệu.': 'Call 115 now. Note the time the signs started.',
  'Có điều gì khác thường?': 'Anything unusual?', 'Dấu hiệu này có đang xảy ra không?': 'Is this happening now?', 'Có, đang xảy ra': 'Yes, right now', 'Không, đã hết': 'No, it has passed', 'Dù đã hết, vẫn nên báo bác sĩ ngay': 'Even if it passed, tell your doctor now', 'Bạn đã đi khám chưa?': 'Have you seen a doctor?', 'Đã ghi lại cho bác sĩ': 'Saved for your doctor',
  // Thuốc
  'Chưa có thuốc': 'No medicines yet', '7 ngày': '7 days', '30 ngày': '30 days', 'Bỏ lỡ': 'Missed', 'Không ghi': 'Not logged', 'Đang dùng': 'Current', 'Quên liều': 'Missed a dose', 'Giờ nhắc': 'Reminder times', 'Đã ngừng': 'Stopped', 'Nhóm': 'Group', 'Liều': 'Dose', 'Buổi': 'Times', 'Đường dùng': 'Route', 'Từ ngày': 'From', 'Đến ngày': 'Until', 'Dài hạn': 'Long term', 'Lưu ý': 'Note', 'Nguồn': 'Source', 'Bệnh viện': 'Hospital', 'Tự nhập': 'Self-entered', 'Tạm dừng nhắc': 'Pause reminders', 'Nhắc lại': 'Resume reminders', 'Xóa thuốc': 'Delete medicine', 'Chọn tên thuốc': 'Choose medicine', 'Hàm lượng': 'Strength', 'Mỗi lần': 'Each time', 'Dùng trong': 'For', 'Chọn thuốc': 'Choose medicine', 'Sửa thuốc': 'Edit medicine', 'Tạm dừng': 'Paused',
  [BRD.medGood]: 'You are following your treatment very well! This plays an important role in preventing another stroke.', [BRD.medImprove]: 'Following your doctor\'s instructions is very important after a stroke. Try to take your medicine regularly. Reminders can help.',
  // Chỉ số
  'Tại nhà': 'At home', 'Xét nghiệm': 'Lab results', 'Thói quen': 'Habits', 'Cân nặng': 'Weight', 'Thêm kết quả': 'Add result', 'Vận động': 'Activity', 'Hút thuốc': 'Smoking', 'Rượu bia': 'Alcohol', 'Ăn uống': 'Diet', 'Đủ': 'Enough', 'Ít': 'Low', 'Nhiều': 'High', 'Chưa tốt': 'Not yet good',
  'Phòng đột quỵ tái phát': 'Preventing another stroke', 'Phòng chảy máu não tái phát': 'Preventing another brain bleed', 'Phòng đột quỵ lần đầu': 'Preventing a first stroke', 'Phòng đột quỵ từ sớm': 'Preventing stroke early', 'Mỗi ngày': 'Every day', 'Mỗi tuần': 'Every week', 'Mỗi tháng': 'Every month', 'Khi khám': 'At visits', 'Khi cần': 'When needed', 'Khi có dấu hiệu lạ': 'If something is unusual', 'Dùng thuốc đúng giờ': 'Take medicines on time', 'Đo huyết áp': 'Measure blood pressure', 'Đo đường huyết': 'Measure blood sugar', 'Triệu chứng mới': 'New symptoms', 'Dưới 130/80': 'Under 130/80', 'Đang tắt': 'Off',
  'Trung bình': 'Average', 'Tuần': 'Week', 'Tháng': 'Month', '3 tháng': '3 months', 'Ghi số mới': 'New reading', 'Lần đo': 'Readings', 'Cách đo đúng': 'How to measure', 'Kiểm soát huyết áp': 'Controlling blood pressure', 'Nhắc đo': 'Reminders', 'Máy đo có kết nối': 'Connected monitor', 'Tắt': 'Off',
  'Ghi huyết áp': 'Log blood pressure', 'Sửa số huyết áp': 'Edit reading', 'Huyết áp gần nhất': 'Latest blood pressure', 'Số trên': 'Top number', 'Số dưới': 'Bottom number', 'Cách đo': 'How to', 'Đo 3 lần': 'Measure 3 times', 'Chụp máy': 'Photo', 'Tốt, trong mục tiêu': 'Good, on target', 'Huyết áp đang rất cao': 'Blood pressure is very high', 'Huyết áp đang thấp': 'Blood pressure is low', 'Ngồi yên, nghỉ 5 phút rồi đo lại.': 'Sit still, rest 5 minutes, then measure again.', 'Đo lại sau 5 phút': 'Measure again in 5 minutes', 'Về Hôm nay': 'Back to Today', 'Bạn kiểm tra lại giúp': 'Please check this', 'Đúng rồi, vẫn lưu': 'It is correct, save', 'Đúng rồi, tiếp tục': 'It is correct, continue', 'Cách kiểm soát huyết áp': 'How to control blood pressure',
  [BRD.bpGood]: 'Great! Your blood pressure is very well controlled. Keep up this healthy lifestyle!', [BRD.bpImprove]: 'Your blood pressure is a little high. Keep tracking it and talk to your doctor for guidance.',
  'Ghi đường huyết': 'Log blood sugar', 'Lúc đói': 'Fasting', 'Sau ăn': 'After meals', 'Nhập số khác': 'Type a number', 'Kiểm tra kết quả': 'Check results', 'Ngày xét nghiệm': 'Test date', 'Ngày': 'Date', 'Chụp phiếu': 'Take photo', 'Nhập tay': 'Type in', 'Kết quả': 'Results', 'Xét nghiệm gần nhất': 'Latest lab results', 'Gửi cho bác sĩ': 'Send to doctor', 'Chưa chia sẻ với bác sĩ': 'Not shared with your doctor', 'Cần bác sĩ xác nhận': 'For your doctor to confirm', 'Không ghi nhận': 'None recorded', 'Cao nhất': 'Highest', 'Thấp nhất': 'Lowest', 'Hỏi lại': 'Ask again',
  // Học
  'Dành cho bạn': 'For you', 'Chủ đề': 'Topics', 'Bài tập phục hồi': 'Rehab exercises', 'Ăn uống phòng đột quỵ': 'Eating to prevent stroke', 'Dùng thuốc an toàn': 'Using medicines safely', 'Trung tâm đột quỵ': 'Stroke centers', 'Hỏi đáp': 'Questions', 'Nguồn tham khảo': 'References', 'Nằm': 'Lying', 'Ngồi': 'Sitting', 'Đứng': 'Standing', 'Lặp lại': 'Repeat', 'Cần người hỗ trợ': 'Needs a helper', 'Đọc to': 'Read aloud', 'Bài tập': 'Exercises', 'Tạo hồ sơ': 'Create profile', 'Chỉ đường': 'Directions', 'Gọi bệnh viện': 'Call hospital', 'Địa chỉ': 'Address', 'Khoảng cách': 'Distance', 'Giờ mở': 'Hours', 'Trung tâm': 'Centers',
  // Hồ sơ
  'Thông tin cá nhân': 'Personal details', 'Câu hỏi cho bác sĩ': 'Questions for your doctor', 'Người nhà': 'Family', 'Tin nhắn': 'Messages', 'Nhờ nhập giúp': 'Ask for help', 'Chia sẻ dữ liệu': 'Data sharing', 'Nhắc nhở': 'Reminders', 'Hiển thị': 'Display', 'Gửi phản hồi': 'Send feedback', 'Bảo mật': 'Privacy', 'Hồ sơ': 'Profile', 'Đang xem': 'Viewing',
  'Tên': 'Name', 'Năm sinh': 'Birth year', 'Chiều cao': 'Height', 'Giới tính': 'Sex', 'Loại đột quỵ': 'Stroke type', 'Đi lại': 'Mobility', 'Nam': 'Male', 'Nữ': 'Female', 'Khác': 'Other', 'Thuốc đã dùng': 'Medicine history', 'Bệnh khác': 'Other conditions', 'Giờ': 'Times', 'Nhắc': 'Remind', 'Câu hỏi mỗi tuần': 'Weekly question', 'Âm thanh': 'Sound', 'Chuông': 'Ring', 'Rung': 'Vibrate', 'Nhắc lại sau': 'Repeat after',
  'Cỡ chữ': 'Text size', 'Giao diện': 'Appearance', 'Ngôn ngữ': 'Language', 'Đơn vị đường huyết': 'Blood sugar unit', 'Vừa': 'Medium', 'Lớn': 'Large', 'Rất lớn': 'Extra large', 'Theo máy': 'Device', 'Mời người nhà': 'Invite family', 'Thêm hồ sơ người thân': 'Add a relative\'s profile', 'Chưa có tin nhắn': 'No messages', 'Nhờ người nhà': 'Ask family', 'Góp ý': 'Comments', 'Gửi': 'Send', 'Xong, cảm ơn bạn': 'Done, thank you', 'Vì sao hỏi': 'Why we ask', 'Nhập huyết áp': 'Enter blood pressure', 'Chưa đo': 'Not measured',
  // Lần đầu
  'Bạn đã từng bị đột quỵ chưa?': 'Have you ever had a stroke?', 'Người thân của bạn đã từng bị đột quỵ chưa?': 'Has your relative ever had a stroke?', 'Tôi nhập cho người thân': 'I am entering for a relative', 'Tôi nhập cho bản thân': 'I am entering for myself', 'Chỉ xem thông tin': 'Just browse', 'Dữ liệu của bạn': 'Your data', 'Cho bác sĩ điều trị xem số đo và thuốc?': 'Let your doctor see your readings and medicines?', 'Cho dùng dữ liệu cho nghiên cứu về đột quỵ?': 'Allow your data for stroke research?', 'Cho người nhà xem và nhập hộ?': 'Let family view and enter for you?', 'Thông tin trong app chỉ để tham khảo, không thay thế bác sĩ.': 'Information in the app is for reference and does not replace your doctor.', 'Đồng ý và tiếp tục': 'Agree and continue',
  'Bạn sinh năm nào?': 'What year were you born?', 'Bạn cao bao nhiêu?': 'How tall are you?', 'Bạn nặng bao nhiêu?': 'How much do you weigh?', 'Lấy thông tin từ bệnh viện?': 'Get your records from the hospital?', 'Quét mã trên giấy ra viện': 'Scan the code on your discharge paper', 'Tiếp tục': 'Continue', 'Muốn được nhắc đo gì?': 'What should we remind you to measure?', 'Thói quen mỗi tuần': 'Weekly habits', 'Bác sĩ nói bạn bị loại đột quỵ nào?': 'What type of stroke did your doctor say?', 'Nhồi máu não (tắc mạch)': 'Ischemic (blocked vessel)', 'Chảy máu não (vỡ mạch)': 'Hemorrhagic (bleeding)', 'Cơn thoáng qua (TIA)': 'Mini-stroke (TIA)', 'Không nhớ': 'I do not remember', 'Sau 1 tháng': 'In 1 month', 'Nhồi máu não': 'Ischemic stroke',
  // Màn khóa
  'Đến giờ đo huyết áp': 'Time to measure blood pressure', 'Ngồi nghỉ 5 phút rồi đo.': 'Rest 5 minutes, then measure.', 'Xem lịch': 'See visit', 'Mở app': 'Open app',
};

const MOMENT_EN = { 'sáng': 'morning', 'trưa': 'noon', 'chiều': 'afternoon', 'tối': 'evening', 'Sáng': 'Morning', 'Trưa': 'Noon', 'Chiều': 'Afternoon', 'Tối': 'Evening' };
const WD_EN = { 'Chủ Nhật': 'Sunday', 'Thứ Hai': 'Monday', 'Thứ Ba': 'Tuesday', 'Thứ Tư': 'Wednesday', 'Thứ Năm': 'Thursday', 'Thứ Sáu': 'Friday', 'Thứ Bảy': 'Saturday' };
const EN_PATTERNS = [
  [/^Thuốc buổi (\S+)$/, (m, a) => `${MOMENT_EN[a[0].toUpperCase() + a.slice(1)]} medicines`],
  [/^Thuốc (\S+) qua$/, (m, a) => `Yesterday ${MOMENT_EN[a] || a} medicines`],
  [/^Huyết áp buổi (\S+)$/, (m, a) => `${MOMENT_EN[a[0].toUpperCase() + a.slice(1)]} blood pressure`],
  [/^(Thứ \S+|Chủ Nhật), (\d+\/\d+)$/, (m, a, b) => `${WD_EN[a]}, ${b}`],
  [/^Đang chăm: (.+)$/, (m, a) => `Caring for: ${a}`],
  [/^(\d+) ngày$/, (m, n) => `${n} days`],
  [/^Còn (\d+) ngày$/, (m, n) => `${n} days left`],
  [/^(Sáng|Trưa|Chiều|Tối)(, (Sáng|Trưa|Chiều|Tối))+$/, m => m.split(', ').map(x => MOMENT_EN[x]).join(', ')],
  [/^30 ngày qua: (\d+)\/(\d+) liều$/, (m, a, b) => `Last 30 days: ${a}/${b} doses`],
  [/^Xem tất cả (\d+) lần đo$/, (m, n) => `See all ${n} readings`],
  [/^Mục tiêu dưới (.+)$/, (m, a) => `Goal: below ${a}`],
  [/^Còn (\d+) câu hỏi cho bác sĩ$/, (m, n) => `${n} questions for your doctor`],
  [/^Còn (\d+)$/, (m, n) => `${n} left`],
  [/^Trả lời (\d+) câu còn lại$/, (m, n) => `Answer ${n} remaining`],
  [/^Lưu (\d+) kết quả$/, (m, n) => `Save ${n} results`],
  [/^Đã lưu (\d+) kết quả$/, (m, n) => `Saved ${n} results`],
  [/^(\d+) liều$/, (m, n) => `${n} doses`],
  [/^(\d+) lần đo$/, (m, n) => `${n} readings`],
  [/^(\d+) mới$/, (m, n) => `${n} new`],
  [/^Bạn đã đi khám ngày (.+) chưa\?$/, (m, a) => `Did you go to your visit on ${a}?`],
  [/^Huyết áp (sáng|trưa|chiều|tối) nay$/, (m, a) => `Blood pressure this ${MOMENT_EN[a]}`],
  [/^Huyết áp (sáng|trưa|chiều|tối) qua$/, (m, a) => `Blood pressure yesterday ${MOMENT_EN[a]}`],
  [/^Trung bình 7 ngày (\S+), thấp hơn tuần trước (\d+) điểm\.$/, (m, a, n) => `7-day average ${a}, ${n} points lower than last week.`],
  [/^Trung bình 7 ngày (\S+), cao hơn tuần trước (\d+) điểm\.$/, (m, a, n) => `7-day average ${a}, ${n} points higher than last week.`],
  [/^Trung bình 7 ngày (\S+), gần như tuần trước\.$/, (m, a) => `7-day average ${a}, about the same as last week.`],
  [/^Liều gần nhất: hôm nay (.+)$/, (m, a) => `Last dose: today ${a}`],
  [/^Liều gần nhất: hôm qua (.+)$/, (m, a) => `Last dose: yesterday ${a}`],
  [/^Đến giờ thuốc buổi (\S+)$/, (m, a) => `Time for ${MOMENT_EN[a]} medicines`],
  [/^Nhắc lại sau (\d+) phút$/, (m, n) => `Remind me in ${n} minutes`],
  [/^Tái khám sau (\d+) ngày$/, (m, n) => `Follow-up visit in ${n} days`],
  [/^(Sáng|Trưa|Chiều|Tối) · (\d+:\d+)$/, (m, a, b) => `${MOMENT_EN[a]} · ${b}`],
  [/^(.+), sinh năm (\d+)$/, (m, a, y) => `${a}, born ${y}`],
  [/^(\d+) tuổi$/, (m, n) => `${n} years old`],
];

function tr(s) {
  if (typeof D === 'undefined' || !D || D.settings.lang !== 'en' || !s) return s;
  const key = String(s).trim();
  if (EN[key]) return String(s).replace(key, EN[key]);
  for (const [re, fn] of EN_PATTERNS) { const m = key.match(re); if (m) return fn(...m); }
  return s;
}
function translateTree(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { if (n.nodeValue.trim()) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; } });
  root.querySelectorAll('[aria-label]').forEach(el => { const t = tr(el.getAttribute('aria-label')); if (t) el.setAttribute('aria-label', t); });
}
