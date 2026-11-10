# ALI ENGLISH — Teacher Dashboard (Giai đoạn 1)
**Trạng thái:** Giao diện & mã backend đã được lưu lên GitHub. **Chưa được kích hoạt trên Firebase cho đến khi triển khai Cloud Functions và Rules**.

## 1. Truy cập trang giáo viên

- <https://lehuy17.github.io/aliacademy/teacher.html>
- Đăng nhập qua trang chung: <https://lehuy17.github.io/aliacademy/login.html>
- Tài khoản phải được cấp **Firebase Authentication custom claim** `role: "teacher"` hoặc `role: "admin"` và Firestore `users/{UID}.status: "active"`.
- Học viên `role: student` không thể truy cập dashboard nhờ kiểm tra custom claim từ Firebase Auth. Giao diện chặn truy cập là bổ trợ; **quyền thực tế do Cloud Functions và Security Rules xác minh**.

## 2. Phân quyền

| Vai trò | Quyền |
|---|---|
| Học viên | Đăng nhập xem phim được xuất bản, nghe phụ đề, tua từng câu |
| Giáo viên | Xem danh sách học viên, tạo tài khoản học viên mới, khóa/mở khóa học viên; **tự đăng phim song ngữ và xuất bản NGAY khi kiểm tra kỹ thuật đạt**, không cần duyệt của Admin |
| Admin | Các quyền trên; có thể cấp quyền Teacher/Admin qua công cụ quản trị tin cậy |

Giáo viên không được tự đổi vai trò lên `admin`, không được tạo giáo viên mới từ trình duyệt, không được sửa quyền tùy ý hoặc ghi trực tiếp catalog. Không dùng `role` trong Firestore do client ghi để quyết định quyền; tin vào custom claim đã ký.

## 3. Kích hoạt Firebase (quản trị ALI cần thực hiện một lần)

**Cảnh báo quan trọng:** repo này chưa có quyền tự triển khai lên dự án Firebase `ali-english`. Đăng mã lên GitHub **không tự kích hoạt backend**. Người quản trị Firebase phải hoàn tất bước này.

### 3.1 Chuẩn bị

1. Truy cập <https://console.firebase.google.com/project/ali-english/overview>, kiểm tra dự án Firebase đúng tên `ali-english`, có Authentication Email/Password, Firestore và Cloud Storage.
2. Cloud Functions v2/Storage có thể yêu cầu nâng cấp dự án sang **Blaze (billing)**. Kiểm tra chi phí và hạn mức.
3. Cài Node.js 22 LTS và Firebase CLI trên máy quản trị:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
4. Clone repo:
   ```bash
   git clone https://github.com/Lehuy17/aliacademy.git
   cd aliacademy
   npm --prefix functions install
   ```

### 3.2 Cấp quyền cho nhân sự ALI

1. Mở Firebase Console → **Authentication → Users → Add user**, tạo email/mật khẩu giáo viên (nếu chưa có).
2. Dùng tài khoản quản trị có Application Default Credentials (ADC) hợp lệ. Có thể chạy `gcloud auth application-default login` trên máy quản trị hoặc đặt biến `GOOGLE_APPLICATION_CREDENTIALS` tới tệp khóa **chỉ lưu trên máy quản trị**.
3. Chạy từ thư mục gốc repo:
   ```bash
   ALI_BOOTSTRAP_CONFIRM=YES node functions/grant-role.cjs teacher@example.com teacher
   ```
   Với Admin ban đầu, sử dụng `admin` thay vì `teacher`. Chỉ người đang sở hữu dự án mới có quyền chạy lệnh này. Không đưa khóa service account vào GitHub, trình duyệt, Google Sheets hoặc chatbot.
4. Yêu cầu giáo viên **đăng xuất rồi đăng nhập lại** để nhận token quyền mới.

### 3.3 Triển khai các hàm bảo mật

Trong thư mục repo chạy:
```bash
firebase deploy --project ali-english --only functions
```

Mã nguồn:
- `functions/index.js` — `teacherCreateStudent`, `teacherSetStudentStatus`, `teacherPublishMovie`.
- `functions/package.json` — phiên bản Node và thư viện Firebase/ffprobe.
- Các hàm được triển khai tại vùng `asia-southeast1` để phù hợp cài đặt Dashboard.

**Không chèn access token, Firebase Admin key hoặc GitHub PAT vào tệp JS công khai.**

### 3.4 Triển khai Security Rules — KHÔNG ghi đè quy tắc cũ

Mở Firebase Console:
- Firestore Database → Rules: tham khảo `firestore-rules-teacher.txt`.
- Storage → Rules: tham khảo `storage-rules-teacher.txt`.

Các tệp này là **mẫu đầy đủ để tích hợp**, nhưng nếu dự án đã có các quy tắc cho bài test A1–A2, kết quả học viên hoặc dữ liệu khác thì phải **GỘP** các phần `users`, `user`, `teacherMovies`, `teacherMovieCaptions` với quy tắc hiện có, không dán đè toàn bộ rồi làm mất quyền hoạt động của các tính năng khác.

Storage Rules yêu cầu liên kết quyền truy vấn Firestore để kiểm tra phim đã công bố. Firebase có thể yêu cầu xác nhận quyền truy cập liên dịch vụ khi lưu quy tắc.

**Không mở** `allow read, write: if true` để "thử nhanh". Không dùng quy tắc cho phép giáo viên tự sửa `users/{UID}.role`.

### 3.5 CORS và nền video kính mờ

Nguồn video giáo viên đăng nằm trong Firebase Storage, URL phát là từ Firebase Storage SDK. Để canvas lấy **khung hình video đang phát** làm nền mờ đúng cảnh trên desktop, phải cấu hình CORS cho bucket và kiểm tra thực tế trình duyệt. Nếu chưa cấu hình, video vẫn có thể phát qua URL tải hợp lệ nhưng nền mờ dùng poster thật của phim.

Khuyến nghị cấu hình origin giới hạn `https://lehuy17.github.io`, phương thức `GET,HEAD`. Đừng tùy tiện mở CORS cho mọi miền nếu không cần. Luôn kiểm thử tại Chrome, Safari và điện thoại.

## 4. Giáo viên sử dụng thế nào?

### Quản lý học viên
- Tab **Quản lý học viên** → nhập họ tên + email → **Tạo tài khoản học viên**.
- Hệ thống tạo Firebase Authentication + Firestore `users/{UID}` qua Cloud Function.
- Một mật khẩu ngẫu nhiên an toàn được hiển thị **một lần**; giáo viên gửi riêng tới học viên và yêu cầu đặt lại mật khẩu.
- Có thể khóa/mở khóa tài khoản học viên; không cho khóa tài khoản giáo viên/Admin.

### Đăng phim (không cần Admin duyệt)
- Tab **Đăng phim song ngữ** → nhập tiêu đề, mô tả.
- Tải MP4 H.264/AAC, tối đa 720p, **nhỏ hơn 90 MB**. Không tải nguyên bản HEVC 500MB+.
- Tải JSON schema ALI hoặc SRT song ngữ: một dòng tiếng Anh, một dòng tiếng Việt; có timecode đúng video.
- Website **tự tạo poster từ một khung hình của đúng video**.
- Giáo viên đánh dấu đã kiểm tra quyền sử dụng, nội dung Anh, bản dịch Việt và thời gian phụ đề.
- Nhấn **Tải lên & xuất bản phim ngay**. Video, poster và JSON được gửi lên Storage theo đường dẫn `teacher_movies/{teacherUID}/{movieID}/...`.
- Cloud Function **đọc lại video thực tế bằng ffprobe**, kiểm tra H.264/AAC, yuv420p, 720p, duration, faststart, file poster/JSON cùng ID, đối chiếu timecode + EN/VI. Nếu đạt, ghi phim vào `teacherMovies/{movieID}` và phụ đề vào `teacherMovieCaptions/{movieID}`, `status:"published"` — **xuất bản trực tiếp, không qua bước chờ Admin**.
- Phim xuất hiện trong thư viện `movies.html` sau khi tải lại; sử dụng trình HTML5 + CC trên phim, phụ đề tự cuộn, tô dòng hiện tại và click để tua.

**Điều kiện tự động là cổng kỹ thuật, không bảo đảm AI tự kiểm duyệt bản quyền hoặc độ đúng của bản dịch.** Quyền duyệt nội dung cuối cùng thuộc người giáo viên đã xác nhận.

## 5. Tệp dự án

| Tệp | Vai trò |
|---|---|
| `teacher.html` | Giao diện Dashboard |
| `ali-teacher.css` | UI cam–trắng đồng nhất ALI |
| `ali-teacher.js` | Đăng nhập, quản lý học viên, upload phim |
| `ali-cinema-player.js` | Kết hợp phim GitHub và phim giáo viên từ Firebase vào cùng thư viện |
| `functions/index.js` | Backend xác thực role & xuất bản tức thời |
| `functions/grant-role.cjs` | Cấp custom claim cho teacher/admin từ máy quản trị |
| `firestore-rules-teacher.txt` | Mẫu quyền truy cập Firestore cần tích hợp |
| `storage-rules-teacher.txt` | Mẫu quyền upload và đọc video cần tích hợp |
| `docs/ALI_MOVIE_STANDARD.md` | Quy chuẩn bắt buộc ALI-CINEMA-STD-01 |

## 6. Kiểm thử trước khi mở cho giáo viên

- [ ] Đăng nhập account chưa có role Teacher → Dashboard từ chối.
- [ ] Admin cấp claim Teacher, học viên đăng xuất/đăng nhập → mở Dashboard.
- [ ] Giáo viên tạo học viên mới; Authentication và Firestore có UID khớp.
- [ ] Học viên đăng nhập website bằng tài khoản mới.
- [ ] Giáo viên khóa rồi mở lại tài khoản học viên.
- [ ] Video HEVC, video >90MB hoặc thiếu tiếng → bị từ chối, không xuất bản.
- [ ] JSON/SRT chỉ có tiếng Anh hoặc mốc thời gian sai → bị từ chối.
- [ ] Video MP4 H.264/AAC có phụ đề đúng → upload thành công, trạng thái xuất bản trực tiếp.
- [ ] Thư viện học viên có card poster thực, xem phim, tua câu và phụ đề Anh–Việt.
- [ ] Tài khoản học viên không thể gọi Cloud Functions hoặc upload lên Storage để xuất bản phim.
- [ ] Đăng nhập trên điện thoại, nền kính mờ và phụ đề hiển thị đúng.

## 7. Bảo mật và chi phí

- Bản video được lưu trong Firebase Storage; **URL download có token là dạng bearer URL** và người nhận được URL có thể truy cập file nếu token còn hiệu lực. Điều này khác với "không thể lấy URL nguồn". Nếu ALI cần kiểm soát truy cập mạnh, cần proxy/stream có xác thực hoặc signed URL ngắn hạn.
- Firestore/Storage Rules giới hạn upload theo vai trò Teacher/Admin. Phim chỉ hiển thị cho tài khoản đăng nhập sau khi xuất bản.
- Teacher không cần tài khoản GitHub hoặc quyền trực tiếp truy cập mã nguồn.
- Cloud Functions, Storage và dữ liệu media có thể phát sinh phí. Theo dõi ngân sách/hạn mức.

**Chưa được thực hiện từ đây:** triển khai Firebase Functions, tích hợp các Rules vào môi trường đang hoạt động, tạo/cấp custom claim tài khoản giáo viên đầu tiên và kiểm thử upload thật. Những bước này cần quyền quản trị dự án Firebase và lựa chọn bật dịch vụ có thể tính phí.
