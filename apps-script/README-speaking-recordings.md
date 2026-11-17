# ALI English — triển khai lưu ghi âm Speaking

## Hiện trạng
- Bài A1–A2 đã có trang ghi âm, checkbox đồng ý và thao tác gửi file sau khi máy chủ xác nhận nộp bài test.
- Bài Speaking A1–B2 dùng trình ghi 4 phần và gửi qua `ali-speaking-config.js`.
- Mã server trong `ali-speaking-recordings.gs` cần **triển khai tại Google Apps Script**. Thêm file vào GitHub không tự tạo deployment.
- Trang kết quả A1–A2 vẫn dùng endpoint test riêng; KHÔNG thay thế endpoint nộp bài A1–A2.
- Cả hai màn hình ghi âm sử dụng endpoint `ALI_SPEAKING_CONFIG.uploadEndpoint` sau khi backend đã triển khai.

## Tài nguyên đã tồn tại
- Thư mục riêng tư: https://drive.google.com/drive/folders/1jKrAaDRZDR8QGXDPx7aAEiKUrYfV7RPk
- Bảng Speaking giáo viên: https://docs.google.com/spreadsheets/d/1ZKWMCOQsgG48JZ3mqeIt_kh9yg5w-UuoryCaxuHRjpo/edit
- Bảng kết quả A1–A2: https://docs.google.com/spreadsheets/d/18akzuhbaPHxihINySIUrMJlvfzjNx59qW7jRIs_2j-0/edit
- Không công khai thư mục ghi âm hoặc dữ liệu học viên.

## Cấu hình bắt buộc bằng tài khoản Google sở hữu Drive
1. Vào https://script.google.com/ và tạo dự án Apps Script mới (không sửa web app test A1–A2 đang hoạt động).
2. Dán **toàn bộ mã** `apps-script/ali-speaking-recordings.gs` vào `Code.gs` của dự án mới.
3. Vào Project Settings > Script Properties, tạo đúng 3 khóa:
   - `ALI_SPEAKING_FOLDER_ID` = `1jKrAaDRZDR8QGXDPx7aAEiKUrYfV7RPk`
   - `ALI_SPEAKING_SHEET_ID` = `1ZKWMCOQsgG48JZ3mqeIt_kh9yg5w-UuoryCaxuHRjpo`
   - `ALI_RESULTS_SHEET_ID` = `18akzuhbaPHxihINySIUrMJlvfzjNx59qW7jRIs_2j-0`
4. Chọn Deploy > New deployment > Web app. Execute as: **Me** (tài khoản có quyền sửa Sheet và thư mục Drive). Để trang test công khai gửi file, cần quyền truy cập web app phù hợp; cân nhắc chống spam/giới hạn tổng lượt trước khi mở công khai.
5. Cấp quyền Google Drive + Google Sheets mà Apps Script yêu cầu. Sao chép URL deployment kết thúc bằng `/exec`.
6. Sửa `ali-speaking-config.js`: thay `uploadEndpoint` bằng URL **mới vừa được triển khai**, commit lên nhánh `main`.
7. Nếu muốn tự đồng bộ cột từ bảng Speaking về Results khi ghi âm đến trước thông tin bài thi, tạo time-driven trigger cho `aliSyncSpeakingLinksToResults` (ví dụ mỗi giờ).
8. Nếu muốn đồng bộ điểm đã được giáo viên xác nhận, tạo time-driven trigger cho `aliSyncTeacherSpeakingGrades` (ví dụ mỗi giờ). Điểm /25 độc lập với điểm Speaking transcript /10 và **không tự đổi tổng điểm /60**.

## Kiểm thử bắt buộc trước khi dùng với học viên thật
1. Dùng một tài khoản test, ghi audio ngắn ở bài Speaking A1–B2, đánh dấu đồng ý và nhấn nộp. Kiểm tra máy khách xuất hiện **Đã nhận xác nhận lưu**.
2. Xác nhận Drive có tệp `ALI_Speaking_<session>_part_<n>`, bảng `Speaking submissions` có đúng 1 dòng cho mỗi phần và cột I có liên kết Drive riêng tư.
3. Test lại A1–A2 và ghi âm ở phần Speaking (checkbox đồng ý). Khi nộp test, xác nhận dữ liệu trong `Results` vẫn đầy đủ; ghi âm lưu vào bảng Speaking và link trả về cột W của cùng `Submission ID`.
4. Chấm thử ở các cột N–R của bảng Speaking, nhập trạng thái `Đã chấm` và nhận xét ở U; chạy `aliSyncTeacherSpeakingGrades`; xác nhận kết quả đi vào cột AA–AD của `Results`.
5. Thử không đồng ý, không cho phép micro, tệp quá 7MB, Internet mất kết nối và gửi lại cùng `uploadId` để bảo đảm không mất dữ liệu, không tạo tệp trùng.
6. Kiểm tra bằng tài khoản giáo viên thực tế: giáo viên có quyền đọc file; người ngoài ALI không mở được âm thanh. Bản ghi giọng nói là dữ liệu cá nhân, cần quy định thời hạn lưu và xóa.

## Chú ý
- Chỉ thêm mã lên GitHub **không đồng nghĩa Google Apps Script đã chạy**. Website sẽ hiển thị kết quả chưa xác minh khi endpoint chưa lưu thành công.
- Web app Apps Script được gọi từ GitHub Pages bằng `POST` dạng form với `no-cors`, sau đó browser xác minh qua `GET?action=status` (JSONP). Không xem việc `fetch` thành công là xác nhận file đã lưu.
- Bảng `Results` được mở rộng bằng 9 cột W–AE. Không xóa hoặc thay đổi 22 cột kết quả gốc.
