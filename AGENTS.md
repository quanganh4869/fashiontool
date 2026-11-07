# AGENTS.md — QUY TẮC NGHIỆP VỤ VÀ PHÁT TRIỂN BẮT BUỘC CỦA TRENDMOTION STUDIO

> **Phạm vi:** Tài liệu quy tắc cấp dự án, áp dụng cho mọi coding agent, mọi phiên làm việc và mọi giai đoạn phát triển TrendMotion Studio.
> **Mục tiêu:** Giữ đúng nghiệp vụ lõi, không làm sai quan hệ người mẫu – video mẫu – sản phẩm – dự án, không nhảy bước, không làm mất dữ liệu, không phá cấu trúc thư mục và không triển khai ngoài phạm vi prompt hiện tại.

---

## 0. LỆNH BẮT BUỘC CHO AGENT

Trước khi thực hiện bất kỳ yêu cầu nào trong repository này, hãy tìm và đọc toàn bộ file `AGENTS.md` ở thư mục gốc. Sau đó đọc các tài liệu liên quan trực tiếp đến phần việc đang được yêu cầu trong `docs/architecture/`, `docs/design/` và `docs/development/`. Nếu một thư mục con có `AGENTS.md` riêng, phải đọc cả file đó; quy tắc ở thư mục con chỉ được bổ sung hoặc siết chặt quy tắc cấp gốc, không được âm thầm làm trái các nguyên tắc nghiệp vụ cốt lõi trong file này.

Trước khi viết code, hãy kiểm tra repository thực tế, route hiện có, component đã có, service, schema, migration, API contract và trạng thái Git nếu có. Không được mặc định cấu trúc hiện tại vẫn giống một bản mô tả cũ. Không tạo project mới bên trong project hiện tại, không tạo `frontend/frontend`, `src/src`, `models-new`, `studio-v2` hoặc thư mục trùng chức năng. Nếu tài liệu và code không khớp, trước tiên xác định trạng thái thực tế, sau đó cập nhật tài liệu cho đúng; không tự ý xóa code đang được sử dụng.

Mỗi prompt của người dùng chỉ cho phép thực hiện đúng giai đoạn và đúng phạm vi được giao. Không tự triển khai trước bước kế tiếp dù có thể suy đoán được yêu cầu tương lai. Không được tự ý làm thêm module, route, bảng dữ liệu, màn hình, API, tác vụ AI hoặc chức năng chưa được yêu cầu. Nếu một bước phụ bắt buộc để bước hiện tại hoạt động, chỉ làm phần tối thiểu cần thiết và ghi rõ trong báo cáo vì sao phải làm.

Khi một giai đoạn hoàn thành, phải dừng đúng ở ranh giới được yêu cầu. Không tự chuyển sang giai đoạn tiếp theo. Không đánh dấu tính năng hoàn thành nếu mới chỉ có giao diện, mock data, placeholder hoặc API chưa kết nối. Báo cáo phải phân biệt rõ phần đã triển khai thật, phần mới chuẩn bị contract, phần đang chờ Backend/provider và phần chưa thực hiện.

**Ngôn ngữ prompt và tài liệu:** Ưu tiên giải thích nghiệp vụ bằng các đoạn văn tiếng Việt rõ ràng, đầy đủ ngữ cảnh. Tên class, biến, route, field, enum và API có thể dùng tiếng Anh. Không rút gọn một yêu cầu phức tạp thành vài bullet chung chung khiến agent phải tự đoán hành vi.

---

## 1. BẢN CHẤT SẢN PHẨM — KHÔNG ĐƯỢC HIỂU SAI

TrendMotion Studio không phải một công cụ chỉ nhận prompt rồi sinh video. Đây là nền tảng sản xuất video thời trang theo quy trình tái sử dụng tài nguyên. Người dùng cung cấp ảnh của một người mẫu, đặt tên và lưu người mẫu thành một hồ sơ độc lập. Người dùng chọn một video mẫu đã được hệ thống chuẩn bị. Hệ thống kết hợp người mẫu đã chọn vào cấu trúc chuyển động, tư thế, góc máy, nhịp cảnh và bối cảnh của video mẫu để tạo ra một **video nền đã cá nhân hóa theo người mẫu**. Sau đó, người dùng nhập link sản phẩm thời trang. Hệ thống thu thập và kiểm tra các ảnh, thuộc tính và chi tiết của sản phẩm, tạo Product Truth Sheet, rồi thay trang phục trong video nền bằng đúng trang phục của sản phẩm. Kết quả cuối cùng là video affiliate thời trang sử dụng người mẫu của người dùng, chuyển động từ video mẫu và trang phục đúng với sản phẩm được chọn.

Nghiệp vụ cốt lõi có hai công đoạn tạo video khác nhau và tuyệt đối không được gộp nhầm. Công đoạn thứ nhất là **Model Personalization**: đưa người mẫu của người dùng vào Video Template để tạo Personalized Base Video. Công đoạn thứ hai là **Garment/Product Replacement**: dùng Product Asset đã được xác minh để thay trang phục trong Personalized Base Video, tạo Final Product Video. Personalized Base Video không phải video thành phẩm cuối cùng và không được đánh dấu là video affiliate hoàn tất nếu trang phục sản phẩm chưa được thay thế và kiểm tra.

Thứ tự nghiệp vụ chuẩn là:

`Model Profile → Video Template → Model Personalization → Personalized Base Video → Product Link → Product Asset Extraction → Product Truth Sheet → Garment Replacement → Temporal Consistency Check → Quality Review → Final Product Video`.

Không được đảo thứ tự này hoặc tự động nhảy qua các bước xác minh sản phẩm. Không được dùng ảnh người mẫu như ảnh sản phẩm, không được dùng ảnh sản phẩm làm ảnh tham chiếu nhận diện người mẫu, và không được nhầm Video Template với video đã cá nhân hóa.

---

## 2. QUY TẮC QUAN HỆ NGƯỜI MẪU VÀ VIDEO MẪU — QUAN HỆ NHIỀU-NHIỀU

**Một Model Profile có thể kết hợp với nhiều Video Template khác nhau.** Đây là quy tắc nghiệp vụ bắt buộc, không phải trường hợp ngoại lệ. Ví dụ, người mẫu có tên `Linh` có thể được sử dụng với `Fashion Walk 01`, `Mirror Outfit 02`, `Studio Turn 03` và nhiều video mẫu khác. Người dùng không phải tạo hoặc tải lại hồ sơ Linh mỗi khi chọn một video mẫu mới.

Chiều ngược lại cũng phải được hỗ trợ: **một Video Template có thể kết hợp với nhiều Model Profile khác nhau**, miễn là người mẫu đáp ứng yêu cầu tương thích của template và người dùng có quyền sử dụng tài nguyên đó. Vì vậy, quan hệ giữa Model Profile và Video Template về mặt nghiệp vụ là **many-to-many**, không được thiết kế thành một quan hệ one-to-one hoặc one-to-many bị khóa ở một phía.

Không lưu `templateId` duy nhất bên trong Model Profile như thể người mẫu chỉ được phép dùng với một video mẫu. Không lưu `modelId` duy nhất bên trong Video Template như thể video mẫu chỉ dành cho một người mẫu. Hai tài nguyên gốc phải độc lập và được liên kết thông qua một lần kết hợp/generation cụ thể.

Mỗi lần kết hợp một người mẫu với một video mẫu phải tạo một bản ghi nghiệp vụ riêng, có thể đặt tên `ModelTemplateGeneration`, `PersonalizedTemplateVideo` hoặc tên tương đương nhất quán với kiến trúc hiện tại. Bản ghi này tối thiểu phải tham chiếu `modelId`, `modelVersionId`, `templateId`, `templateVersionId`, `projectId` nếu có, cấu hình generation, trạng thái, `baseVideoAssetId` sau khi hoàn thành, thời điểm tạo và thông tin provider. Bản ghi phải lưu snapshot/version của model và template đã sử dụng để kết quả có thể tái lập và không bị thay đổi âm thầm khi tài nguyên gốc được cập nhật.

Một cặp Model Profile và Video Template có thể được chạy lại nhiều lần với cấu hình khác nhau. Không giả định mỗi cặp chỉ có đúng một kết quả. Hệ thống có thể tái sử dụng một Personalized Base Video đã hoàn thành khi `modelVersion`, `templateVersion`, cấu hình đầu vào và các tham số quan trọng trùng khớp, kết quả vẫn hợp lệ và người dùng có quyền truy cập. Không tái sử dụng mù quáng nếu người mẫu, ảnh tham chiếu, video mẫu, mask, motion configuration hoặc pipeline version đã thay đổi.

Khi người dùng cập nhật ảnh người mẫu, hệ thống phải tạo version mới hoặc snapshot mới. Những Personalized Base Video đã tạo từ model version cũ phải tiếp tục tham chiếu version cũ. Khi Video Template được cập nhật, những kết quả đã tạo từ template version cũ vẫn phải giữ nguyên nguồn gốc. Không ghi đè file đầu ra cũ hoặc thay nội dung lịch sử bằng version mới.

**Một người mẫu có thể xuất hiện trong nhiều project và nhiều video thành phẩm. Một video mẫu có thể được nhiều người mẫu sử dụng. Một cặp người mẫu – video mẫu tạo ra một lần cá nhân hóa riêng.** Đây là nguyên tắc nền tảng phải được giữ trong database, API, UI, routing và mọi prompt tiếp theo.

---

## 3. QUY TẮC ĐỊNH NGHĨA PROJECT VÀ TÁI SỬ DỤNG VIDEO NỀN

Project là không gian làm việc lưu một cấu hình sản xuất cụ thể, không phải bản sao của Model Profile hoặc Video Template. Một Project thông thường gắn với một Model Profile version và một Video Template version để tạo một Personalized Base Video. Project đó có thể chứa nhiều lần thử personalization, nhiều sản phẩm đầu vào và nhiều phiên bản Final Product Video tùy quy trình được duyệt.

Nếu người dùng muốn cùng một người mẫu thử một Video Template khác, hệ thống phải cho phép tạo một Project/nhánh sản xuất mới sử dụng lại cùng `modelId`. Không tạo một Model Profile mới. Nếu người dùng muốn cùng một Video Template được sử dụng bởi một Model Profile khác, hệ thống cũng tạo một lần kết hợp/project khác, không nhân bản Video Template gốc.

Sau khi Personalized Base Video hoàn thành, người dùng có thể đưa nhiều link sản phẩm khác nhau vào cùng không gian project theo nghiệp vụ đã được triển khai. Mỗi sản phẩm tạo một Product Replacement Job và một Final Product Video riêng. Các lần thay sản phẩm không được làm thay đổi video nền gốc. Video nền phải được giữ bất biến để có thể tạo những phiên bản sản phẩm khác từ cùng một kết quả personalization.

Phân biệt rõ các đối tượng: `Project` là vùng quản lý công việc; `Model Profile` là hồ sơ người mẫu; `Video Template` là video mẫu gốc có cấu trúc; `ModelTemplateGeneration` là lần kết hợp người mẫu với video mẫu; `Personalized Base Video` là video nền đã cá nhân hóa; `Product Asset` là dữ liệu sản phẩm được nhập; `Product Truth Sheet` là hồ sơ sự thật về cấu tạo trang phục; `Product Replacement Job` là tác vụ thay sản phẩm vào video nền; `Final Product Video` là đầu ra cuối cùng sau kiểm tra.

Không gộp tất cả các đối tượng này vào một bảng `videos` với nhiều cột nullable không rõ ý nghĩa. Cũng không tạo quá nhiều bảng không cần thiết. Hãy xác định entity, relationship, ownership, versioning và vòng đời phù hợp; giải thích trong `docs/architecture/` trước khi triển khai database nghiệp vụ.

---

## 4. QUY TẮC VÒNG ĐỜI VÀ VERSIONING CỦA MODEL PROFILE

Mỗi người mẫu có một `modelId` ổn định do Backend tạo. Tên người mẫu chỉ là tên hiển thị và không được dùng làm định danh. Người dùng có thể đặt tên, đổi tên và ghi chú. Một hồ sơ chứa nhiều ảnh tham chiếu của cùng một người, có một ảnh cover được chọn rõ ràng và có thể có thứ tự ảnh do người dùng sắp xếp.

Một Model Profile có thể có nhiều `ModelAsset`. File gốc phải được lưu riêng, metadata phải xác định asset thuộc model nào, ai sở hữu, loại ảnh, trạng thái lưu, đường dẫn tương đối trong local storage root, checksum và thời điểm tạo. Không đưa file upload thật vào `src/assets/` hoặc Git repository.

Khi hồ sơ được dùng trong một lần personalization, phải lưu `modelVersionId` hoặc snapshot tương đương. Nếu người dùng thêm, xóa, đổi cover hoặc thay đổi ảnh tham chiếu sau đó, version mới không được làm thay đổi kết quả cũ. Project cũ phải tiếp tục có thể truy xuất đúng ảnh và metadata đã dùng tại thời điểm tạo video nền.

Người dùng có thể lưu trữ Model Profile. Hồ sơ đã lưu trữ không được xuất hiện trong lựa chọn mặc định cho project mới nhưng vẫn phải xem được trong lịch sử. Không xóa vật lý hồ sơ hoặc asset đang được project, generation hoặc video lịch sử tham chiếu. Chỉ cho phép xóa vĩnh viễn khi Backend xác nhận không có quan hệ cần bảo toàn và chính sách retention cho phép.

Không dùng nhận dạng sinh trắc học, face embedding hoặc suy luận danh tính để tự kết luận các ảnh thuộc cùng một người. Ở bước quản lý hồ sơ, người dùng tự xác nhận ảnh thuộc cùng người mẫu và có quyền sử dụng.

---

## 5. QUY TẮC ĐỊNH NGHĨA VIDEO TEMPLATE

Video Template là tài nguyên mẫu do hệ thống cung cấp hoặc do người dùng có quyền sử dụng đưa vào. Template không đơn thuần là một file MP4. Nó phải có metadata và cấu trúc đủ để pipeline hiểu được video gồm những cảnh nào, người mẫu xuất hiện ở đâu, chuyển động ra sao và khu vực trang phục nào sẽ được thay thế trong công đoạn Product Replacement.

Một Video Template cần có định danh `templateId`, tên hiển thị, mô tả, thumbnail, video gốc, duration, frame rate, resolution, aspect ratio, audio metadata nếu có, version, trạng thái khả dụng, quyền sử dụng và những metadata phân tích cảnh. Template có thể có nhiều scene/shot. Mỗi scene cần lưu mốc thời gian bắt đầu/kết thúc, góc máy, chuyển động camera nếu xác định được, tư thế/hành động quan sát được và điều kiện tương thích với người mẫu.

Để hỗ trợ thay trang phục, template phải có khái niệm `garment slot` hoặc vùng trang phục mục tiêu. Vùng này cần được mô tả theo scene hoặc theo frame/keyframe tùy kỹ thuật, có mask/segmentation reference, phạm vi cơ thể liên quan, visibility và các điều kiện che khuất nếu có. Không được giả định mọi video mẫu đều có thể thay trang phục chính xác. Một template chỉ được bật chức năng Product Replacement khi đã được kiểm tra và đánh dấu có garment slot phù hợp.

Template phải lưu thông tin license/permission/source. Không sử dụng video tải từ Internet hoặc video của bên thứ ba nếu không có quyền sử dụng. Không đưa một video mẫu chưa rõ quyền vào thư viện chính thức như tài nguyên sẵn sàng sản xuất.

Một Template có thể được dùng với nhiều Model Profile. Trước khi cho phép kết hợp, kiểm tra capability của template, tỷ lệ khung hình, chất lượng video, vùng hiển thị người mẫu, điều kiện pose/occlusion và các yêu cầu đầu vào. Nếu không tương thích, phải hiển thị lý do và không cho tạo job.

---

## 6. QUY TẮC MODEL PERSONALIZATION — KẾT HỢP NGƯỜI MẪU VÀO VIDEO MẪU

Model Personalization là bước tạo một Personalized Base Video từ một Model Profile version và một Video Template version. Mục tiêu là tạo một video có người mẫu của người dùng, sử dụng cấu trúc chuyển động, tư thế, nhịp thời gian, góc máy và bối cảnh của video mẫu trong phạm vi kỹ thuật hỗ trợ.

Đầu vào tối thiểu gồm modelId, modelVersionId, templateId, templateVersionId, những ảnh tham chiếu được chọn, generation configuration và quyền sử dụng liên quan. Không yêu cầu người dùng tải lại ảnh nếu Model Profile đã có ảnh tham chiếu hợp lệ. Người dùng phải chọn hồ sơ người mẫu đã READY và Video Template đã PUBLISHED/READY theo quy ước trạng thái của hệ thống.

Trước khi gửi generation job, hiển thị rõ người mẫu nào đang được chọn, video mẫu nào đang được chọn, thumbnail/video preview của template, thời lượng, tỷ lệ khung hình và chi phí dự kiến nếu hệ thống đã có pricing thật. Không tự tạo giá hoặc credit giả.

Không chuyển sang xử lý sản phẩm trong giai đoạn này. Kết quả chỉ là Personalized Base Video. Video nền phải giữ một tham chiếu ổn định đến Model Profile version và Video Template version. Không gắn một Product Asset chưa được người dùng chọn vào video nền.

Nếu personalization thất bại, không tạo một video đầu ra giả hoặc đánh dấu hoàn thành. Giữ nguyên job state, trả lỗi rõ ràng, cho phép retry theo điều kiện idempotency và credit. Retry không được tự tạo thêm một project mới hoặc trừ credit hai lần.

---

## 7. QUY TẮC PRODUCT LINK VÀ PRODUCT TRUTH SHEET — NGUỒN SỰ THẬT DUY NHẤT CỦA TRANG PHỤC

Sản phẩm thời trang do người dùng nhập bằng link ở bước Product Replacement. Hệ thống phải resolve URL an toàn, xác định nguồn, lấy dữ liệu sản phẩm trong phạm vi được phép và lưu snapshot đầu vào. Không tin URL do trình duyệt gửi một cách mù quáng. Backend phải allowlist domain, validate scheme/host, chống SSRF và không sử dụng cookie đăng nhập riêng tư của người dùng để vượt cơ chế bảo vệ nền tảng.

Product Asset không chỉ có tên và một ảnh đại diện. Nó phải giữ tập ảnh nguồn, URL nguồn, source metadata, tên sản phẩm, mô tả, biến thể nếu có, màu sắc, chất liệu nếu nguồn cung cấp, size nếu có, SKU nếu có và toàn bộ chi tiết nhận diện quan sát được. Ảnh gốc phải được lưu bất biến theo chính sách lưu trữ và không bị thay thế âm thầm khi URL nguồn thay đổi.

Trước khi chạy Product Replacement, hệ thống phải xây dựng Product Truth Sheet. Đây là hồ sơ tham chiếu cấu trúc trang phục, được tạo từ ảnh và dữ liệu sản phẩm thực tế. Truth Sheet phải phân biệt rõ ba loại thông tin: thuộc tính được nguồn xác nhận; chi tiết quan sát được trực tiếp trong ảnh; và chi tiết chưa biết/không thể xác minh. Không được chuyển một suy đoán của AI thành sự thật đã xác nhận.

Với áo sơ mi, Truth Sheet có thể ghi nhận loại cổ, hình dạng cổ, số lượng cúc nhìn thấy, màu và hình dạng cúc, khoảng cách cúc, vị trí túi ngực, số túi, hình dạng nẹp áo, họa tiết, hướng sọc, màu nền, chất liệu nếu có căn cứ, kiểu tay áo, cấu trúc cổ tay, số cúc cổ tay, đường may, đường viền và dáng gấu áo. Với váy, quần, áo khoác hoặc sản phẩm khác, phải sử dụng schema thuộc tính phù hợp với loại trang phục đó. Không ép mọi loại quần áo vào một schema áo sơ mi chung.

Mỗi chi tiết quan trọng nên có giá trị mô tả, nguồn chứng cứ, ảnh tham chiếu liên quan, vị trí/region nếu có thể xác định và confidence/verification status. Một chi tiết không thấy ở ảnh thì phải ghi `unknown` hoặc `not_observable`, không được tự bịa số lượng cúc mặt sau, cấu trúc khóa kéo hoặc logo bị che.

Nếu chỉ có một ảnh mặt trước, hệ thống không được tự khẳng định mặt sau giống mặt trước. Phải yêu cầu ảnh bổ sung nếu video/template có góc quay khiến mặt sau cần được tái tạo. Nếu không thể lấy đủ ảnh, phải cảnh báo giới hạn và yêu cầu người dùng xác nhận hoặc chọn template/góc quay ít rủi ro hơn.

Trước khi tạo video, người dùng phải có cơ hội xem Product Truth Sheet, xem các ảnh tham chiếu và xác nhận rằng đây là sản phẩm đúng. Không tự động thay sản phẩm chỉ vì URL đã resolve thành công.

---

## 8. QUY TẮC GARMENT REPLACEMENT — KHÔNG ĐƯỢC LÀM SAI CHI TIẾT SẢN PHẨM

Đây là ưu tiên nghiệp vụ cao nhất của TrendMotion Studio. Mục tiêu là thay đúng trang phục trong Personalized Base Video bằng trang phục tham chiếu từ Product Truth Sheet. Không phải tạo một bộ quần áo tương tự, không phải lấy cảm hứng từ sản phẩm và không phải tạo một biến thể thời trang mới.

Hệ thống phải cố gắng bảo toàn tất cả đặc điểm nhận diện có thể quan sát và xác minh từ nguồn: màu sắc, sắc độ, họa tiết, hướng sọc, số lượng và vị trí cúc, hình dạng cúc, cổ áo, nẹp áo, túi, đường may, đường viền, khóa kéo, dây kéo, logo, chữ in/thêu, chất liệu, độ bóng, độ dày biểu kiến, tay áo, cổ tay, gấu áo, đường xếp ly, nếp gấp đặc trưng, phom dáng và những chi tiết nhỏ khác. Không được bỏ qua chi tiết nhỏ chỉ vì nó không nổi bật ở thumbnail.

Ảnh sản phẩm nguồn là bằng chứng thị giác ưu tiên. Text prompt chỉ bổ trợ cho ảnh, không được phép ghi đè hoặc mâu thuẫn với ảnh. Nếu Product Truth Sheet nói có 5 cúc nhưng ảnh rõ ràng cho thấy 6 cúc, phải đánh dấu conflict và yêu cầu xác minh; không tự chọn một giá trị thuận tiện.

Pipeline phải xác định đúng vùng trang phục cần thay thế, giữ lại vùng cơ thể không thuộc trang phục, tư thế, chuyển động, khuôn mặt, tóc, tay, phụ kiện không thuộc sản phẩm, bối cảnh, ánh sáng và camera của Personalized Base Video trong phạm vi mục tiêu. Không thay đổi khuôn mặt hoặc danh tính người mẫu khi chỉ yêu cầu thay trang phục. Không làm thay đổi hình thể người mẫu một cách ngoài ý muốn.

Việc thay trang phục phải nhất quán qua thời gian. Không được để màu áo đổi giữa các frame, họa tiết biến mất khi người mẫu xoay người, cúc áo tự tăng/giảm, logo nhảy vị trí, đường may biến dạng hoặc sản phẩm thay đổi kiểu dáng giữa các cảnh. Phải có cơ chế temporal consistency, tracking, keyframe/scene validation hoặc kỹ thuật tương đương phù hợp với provider. Không được chỉ kiểm tra một frame đẹp rồi coi cả video đạt.

Nếu một chi tiết bị che khuất hoàn toàn trong video mẫu, hệ thống không được tự bịa cách hiển thị chi tiết đó. Nếu người mẫu xoay lưng nhưng không có ảnh mặt sau của sản phẩm, phải đánh dấu giới hạn tham chiếu và không tuyên bố đã bảo toàn chính xác mặt sau.

Không được cam kết độ chính xác tuyệt đối nếu model/provider không bảo đảm điều đó. Thay vào đó, hệ thống phải tạo các kiểm tra tự động và quy trình review để phát hiện sai khác, đánh dấu rủi ro và cho phép tạo lại hoặc loại bỏ kết quả. Video không đạt tiêu chí phải ở trạng thái cần kiểm tra/thất bại, không tự đưa vào Final Video Library như thành phẩm đạt chuẩn.

---

## 9. QUY TẮC QUALITY REVIEW TRƯỚC KHI XUẤT VIDEO

Final Product Video chỉ được đánh dấu READY/COMPLETED khi đã qua các bước kiểm tra được cấu hình. Các nhóm kiểm tra tối thiểu gồm: tính nhất quán màu sắc; số lượng/vị trí chi tiết nhận diện có thể quan sát; họa tiết và logo; cấu trúc trang phục; độ ổn định theo frame; hiện tượng flicker/warping; vùng mask/segmentation; lỗi vùng tay/tóc che trang phục; và khả năng phát file đầu ra.

Kiểm tra theo những frame đại diện ở đầu, giữa, cuối video, các keyframe đổi pose, các frame người mẫu xoay người và các thời điểm có occlusion. Không chỉ lấy một frame ngẫu nhiên. Nếu có công cụ so sánh ảnh/vision model, phải ghi rõ kết quả đó là tín hiệu hỗ trợ chứ không phải bằng chứng tuyệt đối.

Khi phát hiện sai chi tiết, kết quả cần có trạng thái như `NEEDS_REVIEW`, `RETRY_REQUIRED` hoặc `FAILED` theo state machine được thống nhất. Người dùng phải biết lý do, ví dụ `Họa tiết không nhất quán ở cảnh 2`, `Không xác minh được mặt sau`, `Chi tiết cúc áo bị thay đổi` hoặc `Vùng trang phục bị biến dạng`. Không hiển thị stack trace.

Không cho phép xuất thành phẩm bằng hành động mặc định khi có lỗi nghiêm trọng chưa được giải quyết. Nếu sản phẩm có chi tiết chưa quan sát được nhưng người dùng chấp nhận giới hạn, phải lưu lại xác nhận đó cùng phiên bản output và không gắn nhãn `đã xác minh đầy đủ`.

---

## 10. QUY TẮC ĐIỀU HƯỚNG, BACK, FORWARD VÀ KHÔNG NHẢY BƯỚC

Mọi quy trình nhiều bước phải có state machine và route tương ứng. Không xây wizard chỉ bằng cách thay component theo một biến React không được lưu. Trạng thái bước hiện tại phải có thể khôi phục sau refresh và được Backend xác minh khi cần.

Không sử dụng `navigate(-1)` làm hành vi Back mặc định cho mọi nút. Nút Back nghiệp vụ phải có đích rõ ràng. Ví dụ, trong quy trình tạo Model Profile, từ bước ảnh quay về bước thông tin; từ bước review quay về bước ảnh. Khi mở trực tiếp một URL bước sau mà điều kiện trước chưa đạt, Router Guard phải đưa người dùng về bước đầu tiên còn thiếu. Không được cho phép bỏ qua bước bằng cách sửa URL.

Browser Back/Forward phải đồng bộ với route và state machine. Khi người dùng đi Back về bước trước, dữ liệu đã lưu không bị xóa. Khi người dùng đi Forward, điều kiện của bước tiếp theo phải được kiểm tra lại. Nếu điều kiện không còn hợp lệ, phải điều hướng về bước phù hợp và giải thích lý do.

Nếu người dùng rời khỏi quy trình khi có dữ liệu chưa lưu hoặc file đang upload, phải ngăn mất dữ liệu bằng autosave, draft hoặc Dialog xác nhận. Không hỏi xác nhận lặp đi lặp lại khi mọi thay đổi đã được lưu thành công.

Khi project đang ở một stage, không được tự động chuyển sang stage tiếp theo chỉ vì một API trả về một phần dữ liệu. Chỉ chuyển stage khi điều kiện nghiệp vụ bắt buộc đã được xác minh và Backend đã ghi nhận state transition thành công. Frontend không được tự đặt `COMPLETED` trước phản hồi Backend.

Mỗi nút Back, Continue, Next, Finish, Retry, Cancel và Leave phải có hành vi cụ thể được mô tả trong spec. Không tạo nút chỉ có hình thức. Nếu một nút chưa có nghiệp vụ, không hiển thị hoặc hiển thị disabled kèm lý do, không để click rồi không có tác dụng.

---

## 11. QUY TẮC TỔ CHỨC FILE VÀ THƯ MỤC

Luôn đặt code theo feature và theo trách nhiệm. Không gom toàn bộ logic vào `App.tsx`, `main.py`, `services.py`, `models.py` hoặc một component/page khổng lồ. Không tạo file chỉ để có thật nhiều file; mỗi file phải có trách nhiệm rõ ràng.

Frontend đặt trong `apps/web/src/features/<feature-name>/`. Mỗi feature có thể có `pages/`, `components/`, `hooks/`, `services/`, `types/`, `schemas/`, `utils/` và `constants/` khi thực sự cần. Page chỉ điều phối layout và state cấp trang; component trình bày; hook quản lý tương tác/state; service giao tiếp API; type định nghĩa contract; schema validate; utils xử lý thuần. Component dùng chung nằm trong `components/ui/`, `components/layout/` và `components/feedback/`, không sao chép lại bên trong từng feature.

Backend đặt trong `apps/api/app/` và phân lớp rõ `api/`, `schemas/`, `models/`, `repositories/`, `services/`, `integrations/`, `workers/`, `middleware/`, `core/` và `db/`. Router không chứa business logic. Service không tự đọc request object. Repository không trả response HTTP. Integration adapter không quyết định state nghiệp vụ tổng thể.

Tài liệu thiết kế đặt trong `docs/design/`; kiến trúc và API contract đặt trong `docs/architecture/`; hướng dẫn phát triển và QA đặt trong `docs/development/`. Không để tài liệu ở root trừ các file hướng dẫn cấp dự án như `README.md` và `AGENTS.md`.

Không để ảnh người dùng upload trong `src/assets/`. Không commit file video lớn, ảnh cá nhân hoặc file output người dùng vào Git. Mọi file runtime phải được lưu trong các thư mục local do ứng dụng quản lý trên máy chạy Backend, theo quy tắc ở mục 11.1. Database chỉ lưu metadata và đường dẫn tương đối bên trong local storage root, không lưu binary media.

Trước khi tạo file mới, tìm kiếm xem trách nhiệm đó đã có file tương ứng chưa. Nếu đã có, mở rộng đúng file hiện tại. Không tạo `ModelCardV2.tsx`, `ModelCardNew.tsx`, `ProductServiceFinal.ts` hoặc các bản sao chỉ để tránh đọc code cũ.

Khi thêm route, phải cập nhật route registry và tài liệu routing nếu dự án đang có. Khi thêm entity hoặc thay relationship, phải cập nhật ERD/data dictionary/API contract tương ứng. Khi thay đổi state machine, phải cập nhật tài liệu workflow. Không để code và tài liệu mô tả hai logic khác nhau.

### 11.1. QUY TẮC LƯU TRỮ LOCAL FILESYSTEM — BẮT BUỘC, KHÔNG TỰ ĐỔI SANG CLOUD

**TrendMotion Studio sử dụng local filesystem storage.** Người dùng đã chỉ định lưu file vào các thư mục local. Vì vậy, coding agent tuyệt đối không tự chọn, đề xuất triển khai hoặc thêm dependency cho Cloudflare R2, Amazon S3, Google Cloud Storage, Azure Blob Storage, Cloudinary, Mux Storage hoặc bất kỳ dịch vụ cloud/object storage nào nếu người dùng chưa yêu cầu rõ ràng. Không tự đưa các biến môi trường `R2_*`, `S3_*`, `CLOUDINARY_*`, `MUX_*` vào cấu hình. Không tạo presigned URL cho object storage. Không chuyển file upload sang dịch vụ bên thứ ba.

Local storage root phải được cấu hình tập trung bằng biến `LOCAL_STORAGE_ROOT`. Giá trị mặc định đề xuất là `./data/storage`, nhưng đường dẫn tương đối phải được resolve dựa trên project root hoặc cấu hình ứng dụng, không được phụ thuộc vào current working directory của tiến trình. Trong môi trường development mặc định, dữ liệu nằm trong thư mục `data/storage/` ở root repository. Khi cần, người dùng có thể đổi sang một đường dẫn local khác thông qua environment variable. Không hardcode đường dẫn tuyệt đối của máy cá nhân vào source code.

Cấu trúc thư mục runtime đề xuất:

```text
data/
├── storage/
│   ├── users/
│   │   └── {user_id}/
│   │       ├── models/
│   │       │   └── {model_id}/
│   │       │       └── versions/{version_id}/
│   │       │           ├── original/
│   │       │           ├── thumbnails/
│   │       │           └── derived/
│   │       └── projects/
│   │           └── {project_id}/
│   │               ├── personalizations/{generation_id}/
│   │               │   ├── inputs/
│   │               │   ├── intermediate/
│   │               │   └── base-video/
│   │               ├── products/{product_id}/
│   │               │   ├── source/
│   │               │   ├── references/
│   │               │   └── truth-sheet/
│   │               └── replacements/{replacement_job_id}/
│   │                   ├── intermediate/
│   │                   ├── quality-review/
│   │                   └── final/
│   ├── templates/
│   │   └── {template_id}/
│   │       └── versions/{version_id}/
│   │           ├── source/
│   │           ├── poster/
│   │           ├── preview/
│   │           └── metadata/
│   └── temp/
│       └── {job_id}/
└── .gitkeep  (optional; do not store user media here)