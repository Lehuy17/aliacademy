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
