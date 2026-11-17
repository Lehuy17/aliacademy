# ALI Academy — 100 học viên từ Excel trên Firebase Spark

Công cụ này chạy trên máy quản trị Windows bằng Firebase Admin SDK, KHÔNG sử dụng Firebase Cloud Functions, không cần nâng cấp lên Blaze. Không chạy trực tiếp trên website GitHub Pages.

## Cài đặt một lần

1. Cài Node.js 22 trở lên từ https://nodejs.org/ (sau đó khởi động lại Terminal nếu cần).
2. Tải bộ công cụ trong thư mục firebase-bulk/spark-local của repository Lehuy17/aliacademy về máy. Giữ nguyên các tệp trong cùng một thư mục.
3. Truy cập Firebase Console cho dự án ali-english: https://console.firebase.google.com/project/ali-english/settings/serviceaccounts/adminsdk . Trong Project settings / Service accounts, chọn Generate new private key, tải JSON xuống máy quản trị đã bảo mật.
4. Đổi tên JSON thành firebase-service-account.json và đặt trong cùng thư mục với create-students.cjs. Không gửi khóa cho ChatGPT, không đưa lên website, email hay GitHub. Nếu chính sách tổ chức chặn tạo khóa thì liên hệ quản trị viên Google Cloud.
5. Nháy đúp nhap-hoc-vien.bat. Chương trình tự cài các thư viện bằng npm khi dùng lần đầu, và tạo file mẫu ALI_Mau_100_Hoc_Vien.xlsx. Máy cần kết nối Internet.

## Nhập Excel mỗi lần

1. Mở ALI_Mau_100_Hoc_Vien.xlsx. Điền từ hàng 2 đến 101 trên sheet Hoc vien. Cột Họ tên và Email là bắt buộc; Mã học viên, Lớp học là tùy chọn. Cột Yêu cầu: trống/CHO_TAO để tạo, BO_QUA để bỏ qua.
2. Lưu, đóng Excel. Nháy đúp nhap-hoc-vien.bat. Dán đường dẫn file Excel hoặc kéo thả file vào cửa sổ.
3. Công cụ kiểm tra danh sách, email sai, mã học viên trùng, giới hạn 100 dòng. Giai đoạn này KHÔNG tạo tài khoản.
4. Kiểm tra đúng danh sách, nhấn Y để tạo thật hoặc N để hủy.
5. Mở thư mục private-output trên máy:
   - bao-cao-....csv: kết quả từng học viên.
   - mat-khau-tam-....csv: mật khẩu ngẫu nhiên chỉ cho tài khoản MỚI.
6. Gửi riêng tài khoản và mật khẩu cho từng học viên, yêu cầu đổi mật khẩu ngay sau lần đăng nhập đầu.

## Sử dụng dòng lệnh nếu muốn

Trong thư mục công cụ, chạy các lệnh sau:

    npm install
    node create-students.cjs --template
    node create-students.cjs "C:\DuLieu\hoc-vien.xlsx"
    node create-students.cjs "C:\DuLieu\hoc-vien.xlsx" --apply

Không có --apply nghĩa là chỉ kiểm tra, không gọi Firebase. File .xls cũ phải chuyển sang .xlsx hoặc .csv.

## Lưu ý quan trọng

- Hãy thử 2 email do ALI kiểm soát trước khi tạo đủ 100.
- Script cố ý BỎ QUA email đã có, không đổi vai trò, mật khẩu hoặc trạng thái tài khoản cũ. Quyền tạo Admin/Teacher không có trong Excel.
- Nếu Firebase Authentication áp dụng giới hạn tạo mới 100 tài khoản/giờ/IP, một lượt nhập đủ 100 có thể chạm giới hạn, đặc biệt nếu cùng IP đã tạo tài khoản trước đó. Không lặp yêu cầu khi đang bị hạn mức.
- Nếu gặp lỗi sau khi tạo tài khoản, script cố gắng xóa tài khoản vừa tạo; dòng CAN_KIEM_TRA_THU_CONG phải được kiểm tra bằng tay.
- Khóa JSON và các file chứa mật khẩu đều là bí mật. Thư mục được .gitignore, nhưng vẫn cần máy quản trị có khóa màn hình và bảo vệ dữ liệu, tuyệt đối không tải file này lên website hoặc Drive chia sẻ công khai.
- Nếu học viên quên mật khẩu, có thể dùng nút Quên mật khẩu? ở https://lehuy17.github.io/aliacademy/login.html khi Firebase Email/Password và email khôi phục đã cấu hình.
- Nút nhập Excel trên teacher.html là phương án Cloud Functions/Blaze khác. Đối với Spark, dùng công cụ LOCAL trong thư mục này.
