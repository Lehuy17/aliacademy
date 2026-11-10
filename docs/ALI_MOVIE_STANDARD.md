# ALI ENGLISH — QUY CHUẨN XUẤT BẢN VIDEO SONG NGỮ
**Mã chuẩn:** ALI-CINEMA-STD-01 · **Phiên bản:** 1.0 · **Ngày áp dụng:** 10/11/2026  
**Trạng thái:** Quy chuẩn chuẩn hóa cho mọi video *mới* của thư viện ALI English.  
**Mẫu trực quan:** Video quay màn hình do ALI cung cấp ngày 10/11/2026 (24,27 giây, desktop 1834 × 934), ghi lại bài “Video luyện nghe ALI · 01”.  
**Tệp kỹ thuật:** `movies.html`, `ali-cinema-page.css`, `ali-cinema-player.js`, `ali-movies.json`, `captions/*.json`.

> **Nguyên tắc bất biến:** Mỗi video mới phải có một nguồn HTML5 có thể điều khiển `currentTime`, dữ liệu phụ đề Anh–Việt đúng phim/đúng thời gian và giao diện dùng chung. Không coi việc hiển thị video qua Google Drive iframe là hoàn thành bài phim song ngữ đồng bộ.

## 1. Các trạng thái và phạm vi áp dụng

| Trạng thái | Ý nghĩa | Được đưa lên thư viện học viên? |
|---|---|---|
| **Nháp** | Đã có video hoặc lời thoại nhưng chưa đối chiếu thời gian, bản dịch hay quyền sử dụng | Không |
| **Chờ nghiệm thu** | Video/ảnh/caption/nguồn phát hợp lệ về kỹ thuật, đang chạy checklist thực tế | Không |
| **Đạt chuẩn** | Đã kiểm thử trên desktop và mobile, quyền sử dụng hợp lệ, phụ đề được rà soát | **Có** |
| **Phim cũ chưa đạt** | Được thêm trước khi có quy chuẩn, có thể chưa đủ chức năng | Không được dùng làm mẫu để đăng phim mới; cần kế hoạch nâng cấp |

Phim đang có trước ngày áp dụng được giữ nguyên để không gián đoạn học viên; các mục cũ được liệt kê trong `docs/ALI_MOVIE_LEGACY_BASELINE.json` và kiểm tra bằng chế độ *ngoại lệ cố định* (không tự động trở thành đạt chuẩn). **Bất cứ phim mới nào, hoặc phim cũ được chỉnh sửa, đều phải đạt toàn bộ cổng kiểm tra mới.**

## 2. Hành vi chuẩn, đối chiếu video mẫu

### 2.1 Bố cục

- **Máy tính (chiều rộng lớn hơn 850px):** video bên **trái**, bảng phụ đề tương tác bên **phải**, trong cùng một vùng giao diện; chiều cao vùng hiển thị video tối đa **470px** để tránh video quá lớn. Video dọc dùng `object-fit: contain`, không bóp méo/cắt mất khuôn hình.
- **Điện thoại / tablet nhỏ (≤850px):** **video phía trên**, phụ đề phía dưới. Cả hai có thể thao tác, phụ đề có vùng cuộn riêng.
- **Minimal Glassmorphism:** tông cam–kem ALI, lớp kính mờ `backdrop-filter`, góc bo và bóng dịu. Nền máy tính mờ **từ các khung hình đang phát của đúng video** (canvas HTML5). Khi video chưa tải hoặc máy yếu, có thể dùng **poster thật của chính video** làm nền tạm.
- Ảnh đại diện card phải lấy từ khung hình video, không dùng icon phim chung hoặc hình minh họa không liên quan. Giữ một giao diện chung; không tự viết một trang CSS riêng cho mỗi phim.

### 2.2 Điều khiển và phụ đề — bắt buộc

1. Học viên chọn phim trong thư viện → mở đúng phim, đúng tiêu đề và phụ đề tương ứng.
2. Nút Play/Pause, âm lượng, tua trên thanh thời gian của **chính video HTML5** hoạt động.
3. Phụ đề tiếng Anh và tiếng Việt xuất hiện **trên video** theo câu đang phát (có thể bật/tắt bằng CC).
4. Bảng bên phải hiển thị danh sách theo thứ tự thời gian, mốc mm:ss, câu Anh–Việt; chọn **EN+VI / EN / VI** không làm thay đổi thời gian phim.
5. Khi thời gian phim đi qua `cue.start`, câu tương ứng có trạng thái **current** (đường viền/tô cam). Khi câu kết thúc và không có lời thoại, không treo phụ đề sai trên màn hình.
6. Khi **Tự động cuộn** bật, bảng di chuyển để câu hiện tại nằm trong vùng đọc; khi tắt, học viên được cuộn thủ công mà video vẫn chạy bình thường.
7. **Bấm một câu** → video nhảy tới `cue.start` (sai số mong muốn ≤0,5 giây), chạy từ đó, bảng cập nhật dòng đang phát. Đây là thao tác **thực tế**, không phải nút trang trí.
8. Có A− / A+ điều chỉnh cỡ chữ; nút về đầu danh sách không làm ngắt video.
9. Khi tạm dừng, tua, phát lại, đổi phim, chọn ngôn ngữ, kết thúc video: trạng thái câu và đồng hồ phải cập nhật. Đóng phim phải dừng âm thanh/video nền.
10. Tải chậm/lỗi: hiển thị trạng thái ngắn và chức năng xử lý lỗi hợp lệ, không để bộ đếm thời gian hoặc câu phụ đề của phim trước.

> **Trong video quay màn hình:** có thể quan sát video 00:53, hai cột, nền kính mờ, câu hiện tại tô viền cam; tại một thời điểm phát ở khoảng 00:11, sau thao tác tua, video về khoảng 00:03 và dòng đầu được chọn. Đây là **mẫu hành vi**, không phải chứng nhận rằng mọi phim hiện tại đã hoạt động như vậy.

## 3. Chuẩn nguồn video

**Bắt buộc đối với phim mới đạt chuẩn:**

- **Nguồn phát:** HTML5 `<video>`, khai báo trong catalog `"source": {"type":"url","url":"./media/<id>/video.mp4"}`. Video phải nằm trên **cùng origin** với website (hoặc một CDN được cấu hình CORS, Range, quyền truy cập và logic tương đương — chỉ dùng sau khi được kỹ thuật nghiệm thu).
- **Không dùng Google Drive iframe làm nguồn chính** cho bài phim cần đồng bộ; iframe không cung cấp thời gian phát/currentTime hay pixel cho mã ALI nên không đáp ứng việc tua theo từng câu, tự cuộn hoặc nền mờ đồng bộ.
- **Container MP4, video H.264 (AVC), audio AAC**, pixel format `yuv420p`, metadata `+faststart`; ưu tiên **854×480 hoặc 1280×720**, tối đa 720p cho clip học thông thường. Giữ đúng tỷ lệ gốc, không kéo dãn. Tốc độ khung hình thường 24–30 fps.
- Khuyến nghị file gọn, **mục tiêu ≤60 MiB** cho một bài, **cổng cứng <90 MiB** cho tệp đặt trực tiếp trên GitHub Pages. Nếu dài hơn, dùng CDN/video hosting có HTTP Range và phân quyền thay vì ghép file lớn lên repo.
- **Thời lượng phim và phụ đề phải cùng một bản cắt**. Không dùng phụ đề của bản trailer/đường truyền khác dù cùng tên phim.
- Không tự động phát tiếng khi vừa mở trang; việc phát phụ thuộc thao tác học viên và chính sách trình duyệt.
- Ảnh poster `./media/<id>/poster.jpg` hoặc `.webp` lấy từ chính bản MP4 đang phát.
- Có quyền sử dụng/phân phối nội dung trước khi xuất bản; đặc biệt thận trọng với trích đoạn phim thương mại.

**Lệnh tạo MP4 mẫu (điều chỉnh kích cỡ giữ tỷ lệ):**

```bash
ffmpeg -i source.mp4 -map 0:v:0 -map 0:a:0 \
  -vf "scale=854:480:force_original_aspect_ratio=decrease:force_divisible_by=2" \
  -c:v libx264 -preset medium -crf 26 -pix_fmt yuv420p -r 24 \
  -c:a aac -b:a 96k -movflags +faststart video.mp4
```

Nếu không có audio track, quy trình nhập video phải xử lý rõ ràng; không công bố video bị mất tiếng.

## 4. Chuẩn phụ đề song ngữ

Tạo một file JSON **riêng biệt cho mỗi phim**: `captions/<id>.json`, mã hóa UTF-8. Ví dụ:

```json
{
  "status": "reviewed",
  "duration": 53.4,
  "cues": [
    {"start": 3.00, "end": 5.80, "en": "Good afternoon.", "vi": "Chào buổi chiều."},
    {"start": 5.81, "end": 8.90, "en": "My name is Russell.", "vi": "Cháu tên là Russell."}
  ]
}
```

- `start` và `end` là **số giây**, không phải chuỗi `"00:03"`; `0 ≤ start < end ≤ duration` (cho phép sai lệch kỹ thuật tối đa 1 giây).
- Cue phải **sắp theo `start` tăng dần**, giữ tương quan với âm thanh; không gán trùng/sai câu của phim khác. Không để `en` hoặc `vi` rỗng.
- Dùng câu ngắn, dễ đọc; khuyến nghị 1–2 dòng tiếng Anh và 1–2 dòng tiếng Việt; dấu câu, tên riêng và cách dịch nhất quán.
- **Phải rà soát lời thoại gốc, bản dịch, mốc thời gian bằng cách nghe/xem thực tế**. Không duyệt nội dung chỉ bằng ASR/AI; AI có thể bỏ câu, nhận dạng nhầm hoặc cắt quá ngắn.
- Ngắt giữa các câu là bình thường. Hai câu chồng thời gian trên 0,3 giây phải được kiểm tra nguyên nhân; giọng nói chồng nhau được xử lý có chủ đích.
- Có thể nhập SRT/VTT sau đó chuyển sang schema JSON, nhưng file cuối phải đúng cấu trúc trên.
- Không ghi `status: reviewed` nếu chưa có người chịu trách nhiệm kiểm duyệt thực tế.

## 5. Catalog dùng chung: `ali-movies.json`

Mỗi phim mới thêm **đúng một** object; xem file mẫu `docs/ALI_MOVIE_ENTRY_TEMPLATE.json`. Bắt buộc:

```json
{
  "id": "ali-video-02",
  "title": "Tên phim đúng",
  "category": "PHIM SONG NGỮ · ALI",
  "description": "Giới thiệu ngắn về nội dung",
  "duration": "02:15",
  "durationSeconds": 135,
  "poster": "./media/ali-video-02/poster.jpg",
  "captions": "./captions/ali-video-02.json",
  "source": {"type": "url", "url": "./media/ali-video-02/video.mp4"},
  "presentation": {
    "hideSourceLink": true,
    "background": "film-blur",
    "layout": "video-left-captions-right"
  },
  "qa": {
    "rightsConfirmed": true,
    "englishReviewed": true,
    "vietnameseReviewed": true,
    "timingsReviewed": true,
    "desktopMobileTested": true,
    "approvedAt": "2026-11-10"
  }
}
```

- **ID:** `a-z`, `0-9`, dấu `-`; không trùng, không đổi tùy tiện sau khi xuất bản.
- Đường dẫn nội dung mới nên cùng thư mục `media/<id>/`; không đặt URL Drive gốc, link trang chứa đáp án hoặc đường dẫn video khác vào ô `source.url`.
- **Không thêm video mới thẳng vào danh sách khi chưa đủ file và xác nhận checklist.** Giữ vật liệu chưa hoàn thiện bên ngoài `ali-movies.json`.
- Các giá trị `qa` là xác nhận của người chịu trách nhiệm, **không phải** kết quả tự động. Khai báo sai các cờ này được xem là chưa nghiệm thu.
- Nếu nội dung được giữ trong hệ thống có phân quyền, phải kiểm tra quyền người học trên **backend nguồn video**, không chỉ chặn giao diện bằng Firebase.

## 6. Quy trình đăng một phim mới — SOP cho nhân sự

| Bước | Người làm | Sản phẩm đầu ra / Cổng nghiệm thu |
|---|---|---|
| 01. Tiếp nhận | Quản trị nội dung | Tên phim, bản gốc, xác nhận quyền sử dụng, thời lượng |
| 02. Chuẩn hóa media | Kỹ thuật | `video.mp4` H.264/AAC, poster từ chính clip, thử phát và tua |
| 03. Tạo transcript | Biên tập phụ đề | Phụ đề EN, đủ câu, có timecode |
| 04. Dịch và rà soát | Biên tập Anh–Việt | Phụ đề VI tự nhiên, chính xác, xem đối chiếu từng đoạn |
| 05. Xuất bản thử | Kỹ thuật | Cặp MP4 + JSON + poster cùng ID trong nhánh thử |
| 06. Kiểm tra tự động | GitHub Actions | `Validate ALI bilingual movies` **PASS** |
| 07. Kiểm thử thực tế | Nhân sự QA | Qua toàn bộ checklist ở mục 7 trên desktop/mobile |
| 08. Duyệt công bố | Người phụ trách ALI | Ghi `qa` đã xác minh, gộp vào `main` |
| 09. Hậu kiểm | QA | Kiểm tra ngay trên GitHub Pages khi triển khai xong |

**Nếu bất kỳ cổng nào thất bại: chưa đăng phim.** Tuyệt đối không lấy việc trang hiển thị một card/phát được iframe làm kết luận “đạt chuẩn”.

## 7. Checklist nghiệm thu bắt buộc — 16 bài thử

- [ ] **01. Đúng phim:** card, poster, tên và tiếng khớp file đã duyệt.
- [ ] **02. Video:** chơi được từ đầu đến cuối, tiếng rõ, không lỗi codec.
- [ ] **03. Tua thanh thời gian:** thử tại 00:03, 25%, 50%, 90%, gần cuối; thời gian và cảnh đúng.
- [ ] **04. Phụ đề trên video:** EN và VI thay theo câu đang phát; có CC bật/tắt.
- [ ] **05. Bảng phụ đề:** đủ câu, sắp đúng thứ tự, không rỗng, không nhầm phim.
- [ ] **06. Tô sáng:** dòng `current` đúng câu đang nói, không treo dòng sai.
- [ ] **07. Tự cuộn:** khi bật, câu hiện tại nằm trong vùng nhìn; không nhảy loạn.
- [ ] **08. Cuộn thủ công:** tắt tự cuộn vẫn xem/đọc bình thường; bật lại quay về câu hiện tại.
- [ ] **09. Bấm câu để tua:** thử tối thiểu 3 câu ở đầu, giữa, cuối; sai số mục tiêu ≤0,5 giây.
- [ ] **10. Ngôn ngữ:** EN+VI, EN, VI đều đúng khi video đang phát.
- [ ] **11. Font:** A− / A+ hoạt động; không cắt chữ trên màn hình nhỏ.
- [ ] **12. Tạm dừng / tua / tiếp tục:** đồng hồ và dòng tô cam cập nhật nhất quán.
- [ ] **13. Đổi phim/đóng phim:** dừng tiếng/iframe/nền, không mang caption cũ sang phim mới.
- [ ] **14. Nền phim:** glassmorphism dùng chính poster/khung hình của phim đang xem; desktop không phóng video quá 470px.
- [ ] **15. Mobile:** video trên, phụ đề dưới; các nút bấm và vùng cuộn dùng được bằng cảm ứng.
- [ ] **16. Bảo mật / bản quyền:** đã xác nhận quyền sử dụng, link nguồn không xuất hiện dưới dạng nút; hiểu rõ video tĩnh công khai vẫn có thể bị tìm qua DevTools.

**Dấu hiệu không đạt:** card có hình không khớp phim, Drive iframe chiếm toàn bộ màn hình, caption không tô sáng hoặc không thể click để tua, dòng phụ đề tự phát sinh sai từ AI, lỗi kết thúc video nhưng audio tiếp tục, hoặc không kiểm tra được clip trên điện thoại.

## 8. Kiểm tra tự động trong repo

Từ máy kỹ thuật có Node.js + FFprobe:

```bash
node scripts/validate-ali-movies.cjs
```

GitHub Actions chạy cùng kiểm tra khi thư viện được thay đổi. Nó kiểm tra **cấu trúc, nguồn HTML5, file tồn tại, codec/thời lượng, đường dẫn, đối chiếu cue, duplicate ID và cờ QA**. Nó **không thể** thay thế việc nghe dịch và kiểm thử chức năng ngoài trình duyệt.

**Ngoại lệ hiện tại (không phải mẫu chuẩn):**

- `ali-video-01`: phim cũ đã thể hiện tính năng đồng bộ trong video mẫu, nhưng cấu trúc nguồn kiểu `chunked` riêng và metadata cũ.
- `spiderman-nwh-2021-doing-this-long-time`: **đã chuyển sang MP4 H.264/AAC trên chính website** và có 264 cue Anh–Việt với thời gian. Chức năng tua/tự cuộn dùng chung trình HTML5; **phụ đề ASR + dịch tự động chưa được con người rà soát**, quyền sử dụng và kiểm thử đa thiết bị vẫn cần người phụ trách ALI xác nhận trước khi ghi `qa.approvedAt`.

Khi nâng cấp mục cũ, phải chuyển về MP4 đồng bộ, dùng caption đúng bản video và hoàn tất QA; mọi chỉnh sửa khác bản baseline đều đi qua validator.

## 9. Giới hạn về bảo vệ video

Đừng đánh đồng **ẩn link Drive** với **không thể lấy file video**. HTML5 phát từ GitHub Pages công khai vẫn hiển thị tài nguyên qua mạng/DevTools. Yêu cầu “học viên xem được nhưng không thể truy cập/download nguồn” cần **hệ thống phát video có kiểm soát truy cập ở máy chủ**, không thể bảo đảm chỉ bằng CSS, Firebase client hoặc ảnh nền kính mờ.

---

**Đơn vị quản lý quy chuẩn:** ALI Academy · **Tài liệu gốc trên GitHub:** `docs/ALI_MOVIE_STANDARD.md`.  
**Khi thay đổi giao diện hay chức năng phim về sau:** chỉnh một lần trong mã player dùng chung, cập nhật tài liệu này và chạy lại checklist; **không tạo ngoại lệ giao diện riêng cho từng bộ phim**.


## 10. Kiểm soát lỗi khi đăng phim mới (đã tích hợp)

- **Trang xem phim chung:** `movies.html` + `ali-cinema-player.js` + `ali-cinema-page.css`; tuyệt đối không nhân bản trang cho từng phim.
- **Danh mục và dữ liệu:** `ali-movies.json`, `captions/<id>.json`, `media/<id>/video.mp4`, `media/<id>/poster.jpg`.
- **Mẫu điền:** `docs/ALI_MOVIE_ENTRY_TEMPLATE.json`.
- **Bộ kiểm tra tự động:** `scripts/validate-ali-movies.cjs`. Kiểm tra đường dẫn video/poster/phụ đề **cùng ID phim**, H.264/AAC, thời lượng, mốc thời gian, đủ EN/VI và phê duyệt QA.
- **GitHub Actions:** `.github/workflows/validate-ali-movies.yml` chạy kiểm tra trên các thay đổi danh mục/tệp phim/phụ đề; khi thêm phim mới không đạt chuẩn sẽ báo lỗi.
- **Phim Spider-Man mẫu nâng cấp:** tệp được xử lý bằng `.github/workflows/prepare-spiderman-sync.yml`. Quy trình tải bản gốc, xuất MP4 và poster, kiểm thử, chỉ cập nhật danh mục sau khi tệp được tạo thành công. Không chép nguyên workflow dành riêng Spider-Man để dùng cho phim khác; với phim mới theo SOP ở mục 6.

**Vận hành quan trọng:** GitHub Actions báo lỗi **không tự khóa được việc push lên nhánh `main`** khi chưa bật branch protection. Quản trị ALI cần yêu cầu kiểm tra `ALI Movie Quality Gate` đạt thành công trước khi merge pull request, và phân công người duyệt nội dung. Các trường QA không được tự tích xanh khi chưa thực hiện kiểm tra thực tế.
