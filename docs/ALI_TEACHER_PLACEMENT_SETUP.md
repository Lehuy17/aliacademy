# ALI Teacher – Kết quả Placement Tests & tạo tài khoản giáo viên

## Quyền truy cập

- **Student:** đăng nhập Firebase Authentication, làm B1/TOEIC/IELTS trên website. Trang kết quả chỉ xác nhận nộp, không công bố đáp án / phân lớp.
- **Teacher/Admin:** đăng nhập tại `login.html` rồi vào `teacher.html` → **Kết quả bài test**, tìm theo tên/email, xem bài nộp, điểm kỹ năng, đáp án, lỗi và hướng chữa.
- **Admin:** phần **Tạo tài khoản giáo viên** trong Teacher Dashboard. Quyền được cấp **server-side** qua Firebase Authentication custom claims; không lưu mật khẩu trong GitHub.
- Firestore collection: `placementAttempts`, chỉ staff được đọc, client không được tự ghi; học viên gửi câu trả lời qua callable `submitPlacementAttempt`.

## Bước bắt buộc để kích hoạt trên Firebase

1. Trong Firebase project **ali-english**, xác nhận có tài khoản **Admin** hiện hành với custom claim `role: admin` và hồ sơ `users/{UID}` status `active`. Nếu chưa có, tạo tài khoản Firebase Authentication bằng Firebase Console và chạy `functions/grant-role.cjs` trên **máy quản trị tin cậy** có Application Default Credentials; không đăng service account lên GitHub.
2. Deploy Cloud Functions bằng workflow GitHub Actions `.github/workflows/deploy-ali-placement.yml` (Run workflow), hoặc chạy `firebase deploy --only functions:submitPlacementAttempt,functions:adminCreateTeacher --project ali-english` trong môi trường triển khai bảo mật.
3. Trong **Firebase Console → Firestore Database → Rules**, **merge** block `placementAttempts` từ `firestore-rules-teacher.txt` vào bộ rules **đang sử dụng**, sau đó Publish. KHÔNG thay thế toàn bộ rules hiện hành bằng file hướng dẫn nếu có collection khác.
4. Tạo giáo viên qua **Teacher Dashboard → Quản lý học viên → Tạo tài khoản giáo viên** khi đã đăng nhập Admin. Nhập tên và email thật do ALI quản lý. Mật khẩu chỉ được trả về một lần; yêu cầu đổi ngay sau khi đăng nhập.
5. Tạo một **học viên thử**, đăng nhập, nộp bài B1 hoặc IELTS / TOEIC, đăng nhập giáo viên kiểm tra danh sách, quyền truy cập và chi tiết trả lời. Xác minh tài khoản học viên không đọc được `placementAttempts` trực tiếp.

## Trạng thái / giới hạn

- Code đã commit; **deployment Functions/Rules và tạo tài khoản thật chưa được xác nhận** qua GitHub connector.
- Chỉ tích hợp trực tiếp các bài **B1, TOEIC, IELTS** theo luồng mới. A1–A2 và Speaking đang có các cơ chế gửi/ghi âm riêng, chưa hợp nhất vào `placementAttempts`.
- TOEIC Listening chưa có bộ audio / đáp án đủ xác minh, nên không thể xếp lớp chính thức từ Reading.
- IELTS Writing và B1 Writing / Reading tự luận cần giáo viên chấm bổ sung; hệ thống chưa có giao diện ghi nhận điểm giáo viên.
- Bảng ngưỡng xếp lớp là **tham khảo nội bộ ALI**, không phải chứng chỉ.
- **Lưu ý bảo mật:** một số đề thi và đáp án gốc vẫn đang nằm trong mã JavaScript client cũ. Nếu yêu cầu giữ bí mật tuyệt đối answer key, cần chuyển toàn bộ phần tạo điểm lên backend và loại bỏ các key khỏi bundle công khai; trang kết quả đã ẩn phần chữa chi tiết nhưng mã tĩnh trên GitHub Pages không thể coi là kho bí mật.
