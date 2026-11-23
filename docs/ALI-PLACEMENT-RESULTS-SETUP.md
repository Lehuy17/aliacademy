# ALI Academy · Đồng bộ kết quả placement

## Vấn đề đã xác minh ngày 23/11/2026

- Google Sheet **Học viên test** `18akzuhbaPHxihINySIUrMJlvfzjNx59qW7jRIs_2j-0` trước đó chỉ có tab `Results` dành cho A1–A2, với điểm /60.
- B1, IELTS, TOEIC từng hiển thị kết quả ở trình duyệt qua `ali-results.js`, chỉ lưu localStorage. Không có POST gửi Google Sheets.
- Không có bản ghi IELTS tại ~15:00 thứ Sáu 20/11/2026 trong tab `Results`. KHÔNG suy đoán học viên không làm bài.
- Phiếu điểm local có thể phục hồi **chỉ trên máy/trình duyệt đã làm bài** tại `test-history.html`; không thể truy xuất từ máy quản lý.

## Các tab trong cùng Google Sheet

- `Results`: A1–A2 **giữ nguyên**, dùng backend đang triển khai, không ghi dữ liệu các bài test khác vào tab này.
- `IELTS Results`: Listening /20, Reading /13, Writing giáo viên /100; J là điểm khách quan /33; K xếp lớp khi đủ ba kỹ năng. Dải điểm từ tài liệu ALI: Foundation/Pre-IELTS, Ignite, Elevate, Breakthrough, Mastery. Điểm 90–100 Writing hoặc các kỹ năng không đồng dải sẽ chuyển **giáo viên xét**.
- `TOEIC Results`: Listening giáo viên /25, Reading /30, Grammar nền /6; J tổng /55; K xếp TOEIC 400/550 theo thang tài liệu ALI. Không tự gán điểm Listening vì chưa có đáp án xác minh. Chưa cho xếp lớp khi thiếu Listening.
- `B1 Results`: tài liệu ghi tổng /60 nhưng các phần liệt kê Grammar /15 + Reading /10 + Writing /15 + Listening /10 = **50 điểm**. Cột K chỉ cộng các phần /50 và cột L báo **giáo viên xác minh thang điểm**; tuyệt đối không xếp B1 từ dải /60 khi chưa giải quyết mâu thuẫn tài liệu.
- `Speaking Results`: giáo viên nhập 5 tiêu chí tại N:R, mỗi tiêu chí /5. G tự cộng /25; H xếp Foundation/A1/A2/B1/B2/B2 nâng cao với điều kiện kiểm soát tiêu chí theo rubric ALI, không chỉ nhìn tổng điểm. Đây là sổ quản trị; hệ thống Speaking recording hiện sử dụng backend riêng và **chưa tự đồng bộ vào tab mới**.

Các cột tổng và lớp dùng công thức ARRAYFORMULA. Trên Sheet locale Việt Nam, phân cách tham số công thức phải dùng dấu **chấm phẩy**.

## Kích hoạt Web App (cần chủ tài khoản Google thực hiện)

**Mã đã chuẩn bị nhưng CHƯA có URL triển khai. Website sẽ KHÔNG báo đã lưu cho đến khi có receipt của server.**

1. Đăng nhập tài khoản Google có quyền **chỉnh sửa** Google Sheet nêu trên.
2. Vào [script.google.com](https://script.google.com) → **New project**.
3. Sao chép nội dung tệp `apps-script/ali-placement-results.gs` trong repository này vào `Code.gs` của Apps Script mới. **Không dán chung với code cũ có `doPost`/`doGet`**, vì trùng tên sẽ làm hỏng cả hệ thống.
4. Trong trình chỉnh sửa Apps Script, chạy `aliPlacementVerifySetup()`, cấp quyền Google Sheets và xác nhận log ghi nhận đủ ba tab `IELTS Results`, `TOEIC Results`, `B1 Results`.
5. **Deploy → New deployment → Web app.** Execute as **Me** (tài khoản chủ Sheet); Who has access **Anyone** (nếu cần học viên ngoài tổ chức dùng). Xem xét chính sách dữ liệu học viên trước khi cho phép gửi công khai.
6. Sao chép URL chính xác dạng `https://script.google.com/macros/s/.../exec`.
7. Mở `ali-placement-sync-config.js` trên GitHub và thay chuỗi `endpoint:''` bằng URL vừa deploy. Chỉ chỉnh tệp này sau khi chạy thử Web App; **không** dùng endpoint A1–A2 hoặc Speaking cho bài IELTS/TOEIC/B1.
8. Từ `tests.html`, đăng ký một học viên test giả, nộp IELTS, B1 và TOEIC trên **ba phiên riêng**, kiểm tra từng bài có trạng thái **“Đã xác nhận lưu Google Sheets”** cùng dòng số. Đối chiếu đúng tên, Submission ID, điểm Reading/Listening/Grammar, essay, JSON tại ba tab, không được báo thành công nếu không có dòng.
9. Test lại nút **Gửi lại** với cùng Submission ID; phải trả receipt `duplicate:true` và **không** tạo dòng trùng. Thử mất kết nối; trình duyệt phải hiển thị **chưa lưu** và cho tải JSON dự phòng.
10. Sau khi thành công, cập nhật phiên bản mã JS/URL cache nếu trình duyệt vẫn giữ bản cũ.

### Lưu ý hệ thống và an toàn

- Cần cân nhắc quota Apps Script, giới hạn gửi dữ liệu, chống spam, quyền truy cập Sheet, và không cung cấp thông tin học viên qua link chia sẻ công khai.
- Không đưa API keys hay service-account JSON lên GitHub.
- Kết quả từ website là **điểm tự chấm phía trình duyệt** và có thể bị sửa bởi người dùng. Muốn dùng để xếp lớp chính thức, cần kiểm tra kết quả phía máy chủ hoặc giảng viên duyệt lại. Điểm Writing, Speaking luôn chờ giảng viên.
- Nếu nhận được ảnh màn hình kết quả IELTS của học viên hôm 20/11, có thể nhập lại sau khi giảng viên xác minh. **Không tự tạo dữ liệu lùi ngày**.
- Sheet `Results` A1–A2 không bị đổi. Cần cập nhật backend riêng hiện có nếu muốn gửi Speaking audio/giảng viên về `Speaking Results` của cùng workbook.

## Tệp kỹ thuật

- `apps-script/ali-placement-results.gs`: Web App nhận kết quả, ghi đúng tab, chống trùng theo Submission ID, kiểm tra một ô sau khi ghi.
- `ali-placement-sync-config.js`: URL sau deploy, đang để trống.
- `ali-placement-sync.js`: gửi form + nonce + receipt; lưu tạm 20 bản trong localStorage, nút tải JSON và gửi lại.
- `ali-results.js`: gọi đồng bộ sau khi chấm; chỉ báo thành công khi nhận được `saved:true`.
- `test-history.html`: xem lại phiếu điểm đã lưu cục bộ **trên thiết bị người học**.
