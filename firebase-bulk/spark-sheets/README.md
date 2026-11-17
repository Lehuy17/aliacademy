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
| A | Email đăng nhập |
| B | Họ tên |
| C | Lớp học |
| D | Vai trò: `student` |
| E | Yêu cầu: `CHO_TAO` hoặc `BO_QUA` |
| F | Trạng thái (tự động) |
| G | Firebase UID |
| H | Lỗi / ghi chú |
| I | Cập nhật lúc |
| J | Giao tài khoản (`CAP_TAY` hoặc `CAP_LAI_TAY`) |
| K | Mật khẩu đăng nhập chính thức của ALI (rõ, chỉ quản trị) |

**QUAN TRỌNG VỀ BẢO MẬT:** Theo yêu cầu quản trị ALI, cột K là bản sao mật khẩu đăng nhập dạng văn bản rõ. Bất cứ người nào có quyền xem tệp (hoặc bản sao/lịch sử phiên bản) đều có thể biết mật khẩu. Chỉ quản trị viên tin cậy mới được quyền truy cập bảng; không chia sẻ Sheet cho học viên, không để bản sao ở nơi công khai, không dùng mật khẩu này cho tài khoản cá nhân của học viên. Ẩn hoặc bảo vệ cột không thể bảo đảm bí mật với người đã có quyền xem toàn bộ tệp. An toàn hơn là dùng một trình quản lý mật khẩu riêng của tổ chức.

**Tạo tài khoản mới:** Admin có thể điền một mật khẩu mạnh vào K trước khi tạo (12–72 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt), hoặc để K trống để Apps Script tự tạo và lưu K sau khi tạo tài khoản thành công. Firebase nhận mật khẩu đó và giữ nguyên cho đến khi có lần đổi mật khẩu sau.

**Đổi mật khẩu khi học viên quên:** Chọn đúng một dòng có tài khoản và mở menu **4. Đổi mật khẩu khi học viên quên**. Nhập mật khẩu mới hoặc để trống cho mã tự tạo; Apps Script kiểm tra Firebase + Firestore role=student, sau đó cập nhật Firebase và cột K. Học viên có thể tiếp tục đăng nhập bằng email + mật khẩu mới.

**Không tự đổi:** Cột K chỉ là bản sao mật khẩu do ALI cấp, không đồng bộ hai chiều. Sửa trực tiếp K ở tài khoản đã có sẽ **không** đổi mật khẩu Firebase. Học viên dùng nút Quên mật khẩu trên website cũng có thể tự thay đổi mật khẩu và khiến K không còn đúng. Firebase **không cho đọc lại** mật khẩu của người dùng.

**Mật khẩu của tài khoản cũ:** Những tài khoản tạo trước khi có cột K không thể khôi phục mật khẩu đã có. Nếu cần quản lý từ Sheet, Admin phải chủ động thực hiện đúng một lần chức năng đổi mật khẩu cho từng tài khoản đó.

## Cách dùng

1. Chỉ nhập **2 email thử nghiệm do Admin kiểm soát** để thử quy trình.
2. Tải lại Sheet, chọn **ALI Academy · Spark → 1. Kiểm tra danh sách**; sửa lỗi trước khi tạo.
3. Chọn **2. Tạo 2 tài khoản + mật khẩu chính thức**, đối chiếu email và xác nhận. Kiểm tra `DA_TAO`, UID và mật khẩu cột K. Nếu email đã tồn tại, công cụ **không tự đổi mật khẩu cũ**.
4. Mở Firebase Console → Authentication → Users, Firestore → `users/{uid}`, sau đó thử đăng nhập website.
5. Sau khi thử nghiệm, có thể tạo tối đa 20 học viên mỗi lần để quản lý tổng cộng 100 học viên.
6. Đối với học viên quên mật khẩu, chọn dòng, mở mục 4 rồi mới xác nhận thay đổi. Không dùng lại mật khẩu đã biết hoặc lưu password bên ngoài bảng quản trị.

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
