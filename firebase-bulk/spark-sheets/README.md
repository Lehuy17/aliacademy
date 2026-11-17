# ALI Academy — tạo học viên từ Google Sheets trên Firebase Spark

**Đây là giải pháp không cần cài đặt trên máy và không cần Firebase Cloud Functions/Blaze.**

## Tại sao khác file cũ?

KHÔNG dùng `firebase-bulk/ALI_Bulk_Sheets.gs`: file đó gọi Cloud Functions và yêu cầu Blaze.

Phiên bản mới dùng **OAuth token của người Google đang bấm nút**, gọi trực tiếp Identity Toolkit (tạo Firebase Authentication user) và Firestore REST API, không dùng service account private key. Tài khoản Google phải được quản trị viên Google Cloud cấp quyền, không phải người chỉnh sửa Sheet nào cũng tạo được tài khoản.

## Lỗi cấp quyền cửa sổ mật khẩu

Nếu thấy `Specified permissions are not sufficient to call Ui.showModalDialog`, hãy mở file `appsscript.json` trong dự án Apps Script gắn với Google Sheet ALI. Thêm scope `https://www.googleapis.com/auth/script.container.ui` vào mảng `oauthScopes` (ngoài ba scope cũ), lưu dự án, tải lại Google Sheet và cấp lại quyền OAuth khi được hỏi. Dự án Google Apps Script không tự cập nhật khi file GitHub được sửa.

## Thiết lập một lần

1. Mở Google Sheet ALI: https://docs.google.com/spreadsheets/d/1XBb9DVDc2tjb9f1wgjIk08wRrrZcWWK84r_PWH6FZgI/edit
2. **Extensions → Apps Script**, lưu bản sao mã cũ trước khi thay nếu đang sử dụng.
3. Dán toàn bộ file [ALI_Spark_Sheets.gs](./ALI_Spark_Sheets.gs) vào `Code.gs`.
4. Ở Apps Script chọn `+` → HTML, đặt tên chính xác `ALI_Admin_Passwords`, rồi dán toàn bộ file [ALI_Admin_Passwords.html](./ALI_Admin_Passwords.html). KHÔNG dán HTML vào `Code.gs`.
5. Trong Apps Script → **Project Settings**, bật **Show "appsscript.json" manifest file**; mở file manifest và thay bằng nội dung [appsscript.json](./appsscript.json).
5. Trong Google Cloud Console, xác định **Project number** của `ali-english`, liên kết Apps Script với **standard Google Cloud project** này tại Apps Script Project Settings → Google Cloud Platform (GCP) Project → Change project.
6. Trong GCP project `ali-english`, bật **Identity Toolkit API** và **Cloud Firestore API** (nếu chưa được bật). Bật Email/Password provider trong Firebase Authentication, và đảm bảo Firestore Database đã tồn tại.
7. **IAM & Admin → IAM**: cấp cho Google account quản trị chạy Apps Script hai quyền **Firebase Authentication Admin** (`roles/firebaseauth.admin`) và **Cloud Datastore User** (`roles/datastore.user`) ở dự án `ali-english`. Hãy áp dụng quyền tối thiểu và chỉ cấp cho người thật sự được phép quản lý học viên. Apps Script sử dụng OAuth token của người chạy, không có khóa quản trị chung.
8. Nếu Google yêu cầu cấu hình màn hình chấp thuận OAuth cho Apps Script project, thực hiện theo hướng dẫn Google Cloud; trong môi trường Workspace, có thể đặt internal, nếu đủ điều kiện. Chỉ người quản trị đã cấp IAM mới thực hiện được thao tác Firebase.
9. Nhấn Save → quay lại Sheet, tải lại trang. Menu **ALI Academy · Spark** sẽ xuất hiện. Chạy **1. Kiểm tra danh sách**; cấp quyền OAuth nếu được hỏi.

## Quy chuẩn Google Sheet: tab `Học viên`

| Cột | Nội dung |
|---|---|
| A | Email |
| B | Họ tên |
| C | Lớp học |
| D | Vai trò: `student` |
| E | Yêu cầu: `CHO_TAO` hoặc `BO_QUA` |
| F | Trạng thái: cập nhật tự động |
| G | UID |
| H | Lỗi |
| I | Cập nhật |
| J | Email kích hoạt: DA_GUI hoặc CHUA_GUI |

Không lưu mật khẩu trong Google Sheet. Chức năng tạo mới và cấp lại mật khẩu hiển thị mật khẩu tạm trong một cửa sổ riêng **một lần duy nhất**; không lưu vào ô, lịch sử Google Sheets, log, hoặc gửi tự động. Chỉ quản trị viên được IAM cấp quyền mới thao tác được. Bạn có thể chuẩn bị **100 học viên**, nhưng mỗi lần chọn menu sẽ tạo **tối đa 20 tài khoản** (5 lần cho 100 người), để dễ phát hiện lỗi và phù hợp giới hạn Apps Script.

## Cách dùng

- Chạy **Kiểm tra danh sách**, sửa mọi dòng có lỗi ở cột H.
- Chọn menu **2. Tạo 2 tài khoản + nhận mật khẩu tạm** hoặc **3. Tạo tối đa 20 tài khoản + nhận mật khẩu tạm**. Hộp thoại hiển thị từng email và mật khẩu **chỉ cho tài khoản vừa được tạo mới**, không làm đổi mật khẩu của tài khoản đã tồn tại. Sao chép mật khẩu trước khi đóng và bàn giao riêng cho từng học viên.
- Để **cấp lại mật khẩu** cho học viên có sẵn: chọn một ô trên đúng dòng học viên có `DA_TAO` hoặc `DA_TON_TAI` trong tab `Học viên`, chọn menu **4. Cấp lại mật khẩu tạm (chọn dòng học viên)**, kiểm tra email → xác nhận. Công cụ đối chiếu email/UID Firebase với hồ sơ Firestore `role=student`, `status=active`, không hỗ trợ tài khoản giáo viên/Admin. Việc cấp lại lập tức thay thế mật khẩu cũ.
- Chỉ nhập **2 email bạn kiểm soát**, chạy **Tạo 2 tài khoản thử**.
- Kiểm tra Firebase Console → Authentication → Users và Firestore → `users/{uid}`.
- Kiểm tra email kích hoạt. Nếu email không gửi được, học viên có thể bấm **Quên mật khẩu?** tại trang đăng nhập ALI khi email recovery đã cấu hình.
- Sau khi thử nghiệm thành công, nhập các email còn lại rồi chọn **Tạo tối đa 20 tài khoản tiếp theo** nhiều lần.
- Email đã có `DA_TAO` và `DA_TON_TAI` không xử lý lại. Không tạo/quản lý quyền Teacher hoặc Admin bằng bảng này.

## Khắc phục lỗi

- HTTP 403/PERMISSION_DENIED: kiểm tra quyền IAM của Google account đang chạy và manifest.
- API chưa bật: kiểm tra Google Cloud → APIs & Services.
- HTTP 400/EMAIL_EXISTS: email trùng; mã sẽ đánh dấu DA_TON_TAI.
- `CAN_KIEM_TRA_THU_CONG`: tạo Auth nhưng chưa bảo đảm hồ sơ Firestore; cần kiểm tra bằng Firebase Console trước khi thử lại.
- Cột J ghi `CAP_TAY` hoặc `CAP_LAI_TAY` khi mật khẩu được quản trị viên bàn giao trực tiếp, **không phải email đã gửi**.
- Nếu đóng hộp thoại trước khi sao chép mật khẩu tạm, không thể xem lại; sử dụng chức năng cấp lại cho từng học viên. Không thể xem mật khẩu hiện tại từ Firebase.
- Hạn chế quyền **chỉnh sửa Google Sheets và Apps Script** cho quản trị viên tin cậy; người có quyền sửa mã Apps Script có thể thay đổi cách xử lý dữ liệu. Không gửi/chia sẻ tệp mật khẩu hàng loạt, không lưu mật khẩu trong Drive công khai.
- Firebase không tự bắt buộc học viên đổi mật khẩu khi đăng nhập lần đầu trong giải pháp này. Hãy yêu cầu học viên đổi qua chức năng Quên mật khẩu và bàn giao qua kênh riêng.
- Hệ thống có thể giới hạn số tài khoản mới tạo hoặc số email khôi phục trong một khoảng thời gian. Khi bị giới hạn, dừng và thử lại sau.
- Nếu Apps Script không thể liên kết standard GCP project với Firebase ALI do chính sách tổ chức, nhờ quản trị viên Cloud hỗ trợ thay vì nhập service-account JSON vào Sheet.

**Trạng thái:** mã đã được chuẩn bị, chưa được cài vào bản Google Sheet trực tiếp, chưa cấp IAM hay tạo tài khoản thật. Những bước này cần chủ sở hữu quyền Google Cloud hoàn tất.
