# ALI Academy — triển khai nhập tài khoản từ Excel

**Firebase project:** `ali-english` · **Region:** `asia-southeast1` · **Function:** `adminImportStudents`

## Trạng thái
- Giao diện: `teacher.html`, `ali-bulk-import.js` trên GitHub Pages.
- Backend: `functions/index.js`; function chỉ chấp nhận người dùng đăng nhập với Firebase custom claim `role=admin` và hồ sơ `users/{uid}.status=active`.
- Chưa có bằng chứng Cloud Function đã được triển khai thành công. Commit mã nguồn lên GitHub không tự động triển khai Firebase.

## Cách triển khai qua GitHub Actions (thủ công)
1. Trong Google Cloud Console, chọn đúng project `ali-english`. Bật billing/Blaze và các API mà Firebase Functions yêu cầu nếu chưa bật.
2. Tạo tài khoản dịch vụ dành cho **triển khai** từ CI, chỉ cấp các IAM role thực sự cần thiết theo hướng dẫn Firebase/Google Cloud cho Cloud Functions Gen 2 và Cloud Run. Không dùng khóa của tài khoản học viên hoặc copy service account key vào repository. Ưu tiên Workload Identity Federation trong môi trường doanh nghiệp; workflow hiện tại hỗ trợ JSON credential của tài khoản dịch vụ.
3. Nếu tổ chức cho phép JSON key, lưu **toàn bộ JSON** trong GitHub > Settings > Secrets and variables > Actions > New repository secret, tên `FIREBASE_SERVICE_ACCOUNT_ALI_ENGLISH`. **Không gửi JSON key trong cuộc trò chuyện, không commit lên GitHub.**
4. Vào Actions > **Deploy ALI Admin Bulk Import (Firebase)** > **Run workflow** (branch `main`).
5. Mở log job, xác nhận Firebase CLI thông báo `adminImportStudents(asia-southeast1)` cập nhật thành công.
6. Mở `https://lehuy17.github.io/aliacademy/teacher.html`, đăng nhập tài khoản Admin (claim + hồ sơ active), tải file CSV mẫu, chạy thử 1 email thật **chưa có trong Firebase**.
7. Kiểm tra Authentication > Users và Firestore > `users/{uid}`: `role=student`, `status=active`. Xác nhận có thể đăng nhập, truy cập trang học viên bằng tài khoản mới.
8. Sau đó nhập file nhỏ 3–5 học viên, mới mở rộng 100; lưu file kết quả mật khẩu trong vùng bảo mật và gửi từng người qua kênh riêng.

## Nguyên tắc an toàn
- Công cụ không dùng mật khẩu cố định cho toàn lớp; mật khẩu tạm chỉ trả về một lần và không lưu plaintext ở Firestore.
- Email trùng được báo `existing`, không sửa hay đặt lại mật khẩu tài khoản cũ.
- Không chạy thử trên danh sách 100 người thật trước khi kiểm tra tài khoản quản trị, quota, billing và quy trình bàn giao.
- Nếu deploy thất bại, kiểm tra log Action trước; thường cần xác nhận billing, quyền IAM, API, hoặc tên project/region.

## Phương án dùng máy tính có Firebase CLI
```bash
npm install --prefix functions
npx firebase-tools login
npx firebase-tools deploy --only functions:adminImportStudents --project ali-english
```

Cần đăng nhập Google có quyền trên dự án Firebase. Không thể xác nhận môi trường live cho tới khi deploy và kiểm tra thực tế.
