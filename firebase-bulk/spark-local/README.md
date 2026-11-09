# ALI English — 5–10 tài khoản trên Firebase Spark (không cần Blaze)

## Cách dùng đơn giản: Google Sheets → CSV → Firebase

Dùng **máy tính Windows có Node.js 22+**. Không cần triển khai Cloud Functions, không cần thay gói Spark.

### Một lần đầu

1. Mở [Google Sheets ALI](https://docs.google.com/spreadsheets/d/1XBb9DVDc2tjb9f1wgjIk08wRrrZcWWK84r_PWH6FZgI/edit). Ở tab **Học viên**, nhập 5–10 email, tùy chọn Họ tên và Lớp.
2. Mở [Firebase Console → Project settings → Service accounts](https://console.firebase.google.com/project/ali-english/settings/serviceaccounts/adminsdk). Trên máy quản trị riêng, tạo và tải **private key JSON** của đúng dự án `ali-english`.
3. Giải nén ZIP của repository. Trong thư mục `firebase-bulk/spark-local` đặt file JSON đó tên `firebase-service-account.json`. **Không gửi file JSON cho ChatGPT, không tải lên Google Sheets/GitHub, không chép vào hosting công khai.**
4. Cài [Node.js 22+](https://nodejs.org/). Mở CMD trong đúng thư mục `spark-local`, chạy:
   ```bat
   npm install
   ```

### Mỗi lần tạo 5–10 tài khoản

1. Ở Google Sheets, chọn tab **Học viên**, vào **File → Download → Comma Separated Values (.csv)**, đổi tên thành `students.csv` và lưu tại `spark-local`.
2. Mở CMD ngay trong thư mục đó, chạy **chỉ kiểm tra**:
   ```bat
   node create-students.cjs students.csv
   ```
3. Nếu đúng danh sách 5–10 email, chạy:
   ```bat
   node create-students.cjs students.csv --apply
   ```
4. Script kiểm tra email, tạo Firebase Authentication rồi bổ sung/đối chiếu hồ sơ Firestore `users/{uid}`. Script không đổi trạng thái khóa hoặc quyền admin hiện có. File báo cáo `results-...csv` nằm trên máy của bạn.
5. Học viên mở [đăng nhập ALI](https://lehuy17.github.io/aliacademy/login.html), nhập email, nhấn **Quên mật khẩu?**, đặt mật khẩu theo email từ Firebase, sau đó đăng nhập.

## Lưu ý
- Script chỉ chạy khi quản trị viên chủ động thêm `--apply`. Chưa có tài khoản nào được tạo chỉ vì nhập email vào Sheet.
- Không có nút tự đồng bộ trực tiếp từ Sheets ở chế độ Spark này: bạn cần tải CSV và chạy lệnh tại máy quản trị.
- Đừng cho nhân viên không được ủy quyền dùng khóa JSON. Nếu nghi lộ, thu hồi/rotate khóa ngay tại Google Cloud.
- Chạy thử 1–2 email thuộc quyền quản lý của ALI trước khi tạo đủ 10.
- Mỗi lần tối đa 10 dòng dữ liệu trong CSV để giảm nguy cơ thao tác nhầm.
- Bạn có thể xóa file `students.csv` và `results-...csv` khỏi máy khi không còn cần, theo quy định bảo vệ dữ liệu học viên.
