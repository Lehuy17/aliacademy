# ALI English – Thư viện phim song ngữ

Thư viện ở `movies.html` đọc các video thật từ `ali-movies.json`. Không còn ba thẻ bài mẫu không có video.

## Thêm video mới

1. Chuẩn bị video MP4 mà ALI có quyền sử dụng và bản phụ đề có thời gian (nếu muốn đồng bộ).
2. Tải MP4 và ảnh xem trước được trích từ chính video lên kho lưu trữ phù hợp. Khi phát phụ đề đồng bộ, URL MP4 cần truy cập được từ cùng website ALI hoặc thay đổi trình tải video tương ứng.
3. Thêm một mục mới vào mảng `movies` trong `ali-movies.json`, ví dụ:

```json
{
  "id": "ali-video-02",
  "title": "Tên phim song ngữ",
  "category": "PHIM SONG NGỮ · ALI",
  "description": "Mô tả ngắn",
  "duration": "02:15",
  "poster": "./media/ali-video-02/poster.jpg",
  "captions": "./captions/ali-video-02.json",
  "source": {"type": "url", "url": "./media/ali-video-02/video.mp4"},
  "driveId": ""
}
```

4. Commit lên nhánh xuất bản của GitHub Pages. Video mới sẽ xuất hiện dưới dạng thẻ có **ảnh preview thực tế**, không sử dụng icon minh họa.
5. Kiểm thử xem phim, nghe tiếng và đồng bộ phụ đề ở máy tính/điện thoại.

Nếu chỉ có video Drive thì đặt `source.type` thành `drive`, `driveId` thành ID video và cung cấp một `poster` thật có thể tải được. Drive preview là chế độ dự phòng và không đồng bộ thời gian với phụ đề.

Video hiện có `ali-video-01` được phát bằng bộ tải 23 phần `ali-video-loader.js`; khi ảnh thumbnail Drive không tải được, trình duyệt tự trích một frame từ đúng video gốc để dùng làm poster.

## Giới hạn

Trang phim hiện là **thư viện xem video**, không phải bảng quản trị upload. Quản trị viên phải đăng video và sửa `ali-movies.json` bằng quy trình lưu trữ/GitHub. Muốn học viên hoặc nhân viên tải video trực tiếp từ giao diện website phải có backend lưu trữ, xác thực quản trị và quy tắc phân quyền riêng.

Không sử dụng GitHub Pages hoặc Firebase Auth phía trình duyệt làm cơ chế bảo vệ bản quyền video; các file tĩnh trên website có thể được truy cập theo URL.


## Quy chuẩn giao diện bắt buộc cho MỌI phim ALI (cập nhật 2026-11-09)

Khi thêm một phim mới, giữ nguyên **toàn bộ** cấu trúc trang `movies.html` và mã dùng chung `ali-cinema-player.js` / `ali-cinema-page.css`:

- Desktop: **video bên trái, phụ đề tương tác bên phải**, chiều cao video không vượt quá 470px. Mobile: **video trên, phụ đề dưới**.
- Giữ phong cách **Minimal Glassmorphism**: lớp kính mờ, màu nhẹ, bo góc, và nền được tạo từ **chính phim đang chọn**.
- Video phát từ HTML5, cùng nguồn gốc website: canvas tự lấy các khung hình đang phát để tạo **nền mờ chuyển động đồng bộ**.
- Video phát qua Drive iframe (nguồn thứ ba): trình duyệt **không được phép** đọc pixel hay thời gian của iframe do chính sách cross-origin. Trong trường hợp này dùng **thumbnail thật của phim làm nền mờ**, với chuyển động phóng/di chuyển nhẹ. Nếu muốn nền video thật chuyển động cho phim Drive, hãy xuất thêm **video xem trước chất lượng rất thấp, không tiếng**, lưu ở cùng domain ALI và điền `"ambientVideo":"./media/ten-phim/ambient.mp4"` vào mục phim trong `ali-movies.json`. Không tuyên bố nó đồng bộ với iframe Drive: thời điểm phát của hai nguồn không thể đo từ iframe.
- Không đặt nút **“Mở trên Drive”**, không đặt hyperlink ra tệp nguồn, không hiển thị thông số kỹ thuật như 1920×1080/codec hoặc tên nhà cung cấp ở giao diện học viên. Mã chung đã ẩn nút nguồn và che góc mở trực tiếp của trình nhúng ở desktop.
- Nếu chưa có phụ đề, hiển thị thông báo ngắn trong khung phụ đề; không gắn phụ đề sai phim.
- Ảnh xem trước dùng ảnh khung hình thật của phim, không thay bằng icon minh họa.
- Giữ nguyên khả năng người dùng xem video, đóng video, chuyển EN/VI và nghe lại theo câu khi nguồn cho phép.

### Quyền riêng tư và giới hạn không thể bỏ qua

**Ẩn link trong giao diện không bảo vệ được URL nguồn**: nếu Google Drive iframe đang chạy trên trình duyệt học viên và tệp được chia sẻ công khai, học viên có thể tìm thấy file ID và URL qua DevTools, HTML, network request hoặc các điều khiển bên trong iframe. Đây là giới hạn kỹ thuật của trang GitHub Pages tĩnh, không phải lỗi CSS/JS.

Để **thực sự không cho học viên truy cập trực tiếp nguồn**:
1. Lưu video vào hệ thống được ALI kiểm soát, có xác thực và giới hạn quyền theo tài khoản học viên.
2. Phát video qua backend cấp URL có chữ ký sống ngắn/HLS hoặc proxy bảo vệ phù hợp; không đưa Drive ID gốc vào tệp `ali-movies.json` công khai.
3. Cấu hình quyền video nguồn ở mức riêng tư, không chia sẻ `Anyone with the link` nếu bảo mật là điều kiện bắt buộc.
4. Kiểm tra quyền phân phối/trình chiếu trích đoạn phim trước khi phát cho học viên.

**Lưu ý bản quyền:** Với phim điện ảnh thương mại, ALI cần có quyền sử dụng nội dung phù hợp.
