# SMARTENGLISH AI — MASTER PROMPT v5: FLOW + UI + REACT NATIVE + PHÂN QUYỀN VAI TRÒ

### (Bản v5 — CHUYỂN TOÀN BỘ NGĂN XẾP CÔNG NGHỆ từ Flutter sang React Native + Expo (New Architecture) theo đúng stack chỉ định; giữ nguyên 100% LOGIC NGHIỆP VỤ, LUỒNG, QUY TẮC và PHÂN QUYỀN VAI TRÒ của bản v4)

> **Vì sao có bản v5**: Bản v4 đã hoàn chỉnh về mặt nghiệp vụ (Mục 6), phân quyền vai trò (Mục 0.2/6.0) và đặc tả UI/animation (Mục 7) cho Mobile App, nhưng viết cho Flutter/Dart. Bản v5 **giữ nguyên tuyệt đối mọi nội dung nghiệp vụ, luồng, bảng/schema tham chiếu, quy tắc chống AI-slop, bảng màu, và ma trận phân quyền vai trò** — chỉ thay thế lớp triển khai kỹ thuật (ngôn ngữ, framework, package, tên pattern) từ Flutter/Dart sang **React Native (New Architecture — Fabric & TurboModules) + TypeScript + Expo SDK**, theo đúng bộ stack đã chỉ định. Nếu prompt này và 2 file gốc (`.sql`/`.docx`) vênh nhau ở bất kỳ điểm nghiệp vụ nào — **luôn ưu tiên theo 2 file gốc**, không tự suy diễn thêm.
>
> **Vì sao có bản v4** *(giữ nguyên lý do gốc)*: Bản v3 chưa nói rõ Mobile App xử lý gì khi tài khoản `teacher`/`admin` đăng nhập, và bỏ sót nhóm màn hình cho Học viên đã tham gia lớp học. Bản v4 thêm **Mục 0.2 — PHÂN QUYỀN VAI TRÒ TRÊN MOBILE APP**, **Mục 6.0 — Luồng Role Gating & Lớp học**, nhóm màn hình mới **S. Lớp học & Bài tập được giao**, **T. Teacher Companion**, **Admin Blocked Screen**.
>
> **Vì sao có bản v3** *(giữ nguyên lý do gốc)*: Bản v2 mô tả rất kỹ giao diện + animation nhưng không ép AI coding agent phải sinh **logic nghiệp vụ** thật (điều kiện, chuyển trạng thái, gating Free/Premium, luồng dữ liệu qua nhiều màn hình). Bản v3 thêm **Mục 6 — LUỒNG NGHIỆP VỤ CHI TIẾT** là spec logic bắt buộc, ngang hàng spec giao diện.
>
> **Cách dùng**: Copy toàn bộ file, dán cho AI coding agent (Cursor/Claude Code/Antigravity...) trong dự án React Native + Expo dài hơi. Đính kèm thêm:
> - `DB_SmartEnglishAI_revised_8services.sql` (schema 8 service PostgreSQL + MongoDB + Redis, đã có comment từng field)
> - `TÀI_LIỆU_ĐẶC_TẢ_YÊU_CẦU_CHỨC_NĂNG_HỆ_THỐNG_SMARTEN.docx` (đặc tả 16 nhóm chức năng, 3 phần: Học tập cốt lõi, Web mở rộng, IoT)
>
> Hai file này là **nguồn sự thật duy nhất** cho tên bảng/cột/enum và hành vi nghiệp vụ. Nếu prompt này và 2 file gốc vênh nhau ở bất kỳ điểm nào — **luôn ưu tiên theo 2 file gốc**, không tự suy diễn thêm.

---

## 0. VAI TRÒ & NGUYÊN TẮC LÀM VIỆC

Bạn là **Senior React Native Engineer kiêm Product Designer**, chuyên xây app EdTech production thật (không phải demo Figma-to-code). Trước khi sinh bất kỳ dòng code nào, bạn phải:

1. Đọc và xác nhận đã nắm **8 schema Postgres** (`auth`, `content`, `learning`, `ai_practice`, `payment`, `notification`, `teacher`, `social`), **2 collection MongoDB** (`writing_analyses`, `chatbot_conversations`), **Redis key pattern**.
2. Đọc và xác nhận đã nắm **16 nhóm chức năng** trong đặc tả (10 nhóm học tập cốt lõi Mobile+Web, 4 nhóm mở rộng Web Portal, 2 nhóm IoT).
3. Đọc kỹ **Mục 6 — LUỒNG NGHIỆP VỤ CHI TIẾT** của file này và coi đó là **spec logic bắt buộc**, ngang hàng với spec giao diện ở Mục 7 — không được chỉ implement Mục 7 rồi bỏ qua Mục 6.
4. Đọc kỹ **Mục 0.2 — PHÂN QUYỀN VAI TRÒ TRÊN MOBILE APP** trước khi code màn hình đăng nhập/điều hướng gốc (`app/_layout.tsx` + guard logic) — đây là lớp gating chạy trước tất cả mọi luồng khác kể cả Mục 6.1, vì nó quyết định user vào được app hay bị chặn/rẽ nhánh ngay từ sau khi xác thực token thành công.

### 0.1 Quy tắc tối cao — KHÔNG CHỈ VẼ GIAO DIỆN

> Đây là quy tắc quan trọng nhất kể từ bản v3, đặt lên đầu vì đây chính là lỗi đã xảy ra ở lần chạy trước:

- Với **mỗi màn hình**, trước khi viết `presentation/`, phải viết xong `application/` (custom hook chứa state machine + logic điều kiện, dựng trên Zustand cho state client thuần và TanStack Query cho mọi thao tác gọi API) tương ứng theo đúng luồng ở Mục 6. Component UI chỉ được **đọc state** (qua hook `useXxxStore()`/`useXxxQuery()`) và **gọi hàm/mutation** trên hook đó — **không được** nhét logic điều kiện (if free/premium, if quota hết, if validation sai...) thẳng vào thân component render (JSX body).
- Mọi nút bấm quan trọng (Lưu, Gửi, Nộp bài, Kết bạn, Thanh toán...) phải có đủ 4 trạng thái xử lý thật trong code: `idle → loading → success/failure`. Với hành động gọi API, dùng nguyên trạng `status`/`isPending`/`isSuccess`/`isError` sẵn có của TanStack Query `useMutation` (không tự viết lại state machine trùng lặp); với state machine thuần client (không gọi API — vd trạng thái ghi âm, trạng thái phiên roleplay), định nghĩa 1 discriminated union TypeScript rõ ràng dạng `type FlowState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; message: string }` quản lý trong Zustand slice — **không phải chỉ đổi `useState` màu mè không có type rõ ràng**.
- Với mock data: hành động phải **thật sự làm thay đổi state** đúng theo field trong schema (vd: đánh giá thẻ SRS "Good" → phải **thực sự tính lại** `ease_factor`/`interval_days`/`due_date` bằng công thức SM-2 ở Mục 6.3, không phải chỉ chuyển sang thẻ tiếp theo cho có).
- Nếu 1 luồng đụng ≥2 service/schema (vd: quét ảnh xong lưu vào Flashcard → đụng `ai_practice` + `learning`), phải code **2 lớp gọi API riêng biệt** (2 file trong `data/api/`, ví dụ `scanApi.ts` và `deckApi.ts`) gọi tuần tự trong hook `application/`, đúng tinh thần microservice — **không** gộp thành 1 hàm "god function" xuyên schema.

### 0.2 PHÂN QUYỀN VAI TRÒ TRÊN MOBILE APP (RBAC) — bắt buộc đọc

> **Bối cảnh**: `auth.users.role` (schema `auth`) nhận 1 trong 3 giá trị `admin` / `teacher` / `student`, và cùng 1 hệ thống đăng nhập (`auth-service`) phục vụ **cả Mobile App lẫn Web Portal**. Nghĩa là về mặt kỹ thuật, 1 tài khoản `role='teacher'` hoặc `role='admin'` **hoàn toàn có thể đăng nhập được vào Mobile App** bằng đúng email/password đó — nếu không xử lý rõ, AI coding agent dễ tự bịa hành vi sai (vd: cho Admin vào thẳng Home học tập như Student, hoặc crash vì thiếu field). Mục này định nghĩa rõ **ai được làm gì trên Mobile App**, dựa đúng theo Mục I (Danh mục Actors) của tài liệu đặc tả gốc: *Học viên dùng Mobile+Web, Giáo viên dùng Web Portal, Admin dùng Web Portal*.

**Bảng phân quyền tổng — CHỐT CỨNG, không tự suy diễn thêm quyền nào khác:**

| Vai trò (`auth.users.role`) | Được dùng Mobile App? | Phạm vi cụ thể trên Mobile |
| --- | --- | --- |
| `student` | ✅ Toàn quyền | **100% các nhóm màn hình A → S** liệt kê ở Mục 7.1 — đây là actor chính và DUY NHẤT mà toàn bộ Mục 6 (luồng nghiệp vụ) áp dụng đầy đủ. |
| `teacher` | ⚠️ Có, nhưng **chỉ ở chế độ "Teacher Companion" rút gọn** — KHÔNG được vào các màn học tập (Scan/Speaking/Writing/Quiz/Flashcard...) dưới danh nghĩa vai trò Giáo viên | Xem Mục 0.2.2 bên dưới. Toàn bộ nghiệp vụ quản lý lớp thật (tạo lớp, giao bài, chấm điểm — Nhóm 12 đặc tả) vẫn **chỉ làm trên Web Portal** đúng actor gốc; Mobile chỉ là kênh xem nhanh + nhận thông báo. |
| `admin` | 🚫 Không — chặn hoàn toàn | Xem Mục 0.2.3 bên dưới. Admin CMS/System Config/Revenue (Nhóm 14 đặc tả) là nghiệp vụ vận hành hệ thống, không có lý do nghiệp vụ để tồn tại trên app tiêu dùng cài trên điện thoại cá nhân — chặn ngay sau xác thực, không rẽ nhánh vào bất kỳ tab nào. |
| `student` **+ đang là `assistant_teacher`** trong 1 `teacher.class_members` cụ thể | ✅ Vẫn dùng Mobile như Student bình thường | Trợ giảng vẫn là 1 tài khoản `role='student'` ở cấp hệ thống — `assistant_teacher` chỉ là vai trò **trong phạm vi 1 lớp** (field `teacher.class_members.role`), không nâng cấp quyền toàn hệ thống. Trên Mobile, khác biệt duy nhất: trong màn `S.2 Chi tiết lớp học`, nếu `class_members.role='assistant_teacher'` → hiện thêm 1 nút "Ghim thông báo lớp" (ghim 1 bài Feed vào đầu `S.2`). ⚠️ *GIẢ ĐỊNH NGOÀI SCHEMA GỐC*: đặc tả không mô tả chi tiết quyền trợ giảng, hành vi ghim này là suy luận hợp lý tối thiểu — phải ghi rõ comment khi code. |

#### 0.2.1 Luồng kỹ thuật: Role Gating ngay sau xác thực

Đây chính là **Mục 6.0** mới (xem chi tiết state machine đầy đủ ở Mục 6.0 bên dưới, phần này chỉ tóm tắt yêu cầu điều hướng):

1. Ngay sau khi màn Splash/Đăng nhập xác thực JWT thành công → đọc `role` từ payload mock (lưu trong Zustand `useAuthStore`, hydrate ban đầu từ `react-native-mmkv`) → **guard chạy trong `app/_layout.tsx` gốc (root layout của Expo Router)**, dùng `useEffect` + `router.replace(...)` (từ hook `useRouter()` của `expo-router`) đọc `role` mỗi lần app khởi động/foreground trở lại — không phải if/else rải rác trong từng màn hình con.
2. `role == 'student'` → vào nhóm route `app/(student)/` — Tab Navigator 5 tab bình thường (Mục 1 điều hướng gốc).
3. `role == 'teacher'` → vào **nhóm route riêng `app/(teacher-companion)/`** (layout hoàn toàn khác — KHÔNG dùng chung Tab Navigator 5 tab của Student), xem Mục 0.2.2.
4. `role == 'admin'` → vào **route riêng `app/admin-blocked.tsx`**, xem Mục 0.2.3, không có bottom tab bar.

#### 0.2.2 Màn hình MỚI — "Teacher Companion" (rút gọn, chỉ đọc)

> Mục tiêu: Giáo viên cài app trên điện thoại chủ yếu để **nhận thông báo tức thời** (có học viên nộp bài trễ, có học viên nguy cơ bỏ học) và **liếc nhanh** tình hình lớp — không thay thế Web Portal. Toàn bộ thao tác **ghi** (tạo lớp, giao bài, chấm điểm, duyệt học liệu AI) đều khóa trên Mobile, kèm CTA mở Web Portal.

1. **T.1 — Danh sách lớp (read-only)**: List card `teacher.classes` do giáo viên phụ trách (`teacher_id = current_user`), mỗi card hiện tên lớp, sĩ số hiện tại/`max_students`, badge số bài tập `due_date` trong 48h tới. Chạm vào card → T.2.
   - Empty state (giáo viên chưa có lớp nào) → text + CTA "Tạo lớp học trên Web Portal" (không có nút tạo lớp trên Mobile).
2. **T.2 — Chi tiết lớp (read-only)**: Bảng điểm rút gọn — chỉ 3 cột (Tên học viên, % hoàn thành, Cờ ⚠️ nguy cơ bỏ học nếu `last_login_at` > 7 ngày trước hoặc completion_rate thấp bất thường theo mock rule đơn giản) — không có filter/sort phức tạp như bản Web đầy đủ. Nút nổi góc dưới "Xem đầy đủ & Chấm điểm trên Web Portal" (mở link bằng `Linking.openURL()` của React Native, không cố code lại toàn bộ nghiệp vụ chấm điểm trên Mobile).
   - ⚠️ Đây là màn duy nhất Teacher Companion hiển thị dữ liệu chi tiết học viên — tuyệt đối không thêm nút sửa/xoá nào ở Mobile.
3. **T.3 — Trung tâm thông báo Giáo viên**: **Tái sử dụng đúng UI `notification-center` (Mục O)** nhưng lọc theo `notification_type` dành riêng cho Teacher (vd `student_at_risk`, `assignment_submitted`, `class_join_request`) — ⚠️ *GIẢ ĐỊNH NGOÀI SCHEMA GỐC*: các `notification_type` này không có trong `.sql` gốc, phải thêm comment rõ khi code, không tự thêm cột.
4. **Không có bottom tab bar 5 tab của Student.** Layout Teacher Companion dùng Header đơn giản + Drawer Navigator (`@react-navigation/drawer`) 3 mục (Lớp học / Thông báo / Đăng xuất) — cố ý khác biệt hoàn toàn về bố cục với Student để không ai nhầm lẫn 2 chế độ.

#### 0.2.3 Màn hình MỚI — "Admin Blocked Screen"

1 màn duy nhất, không có nav: icon khóa lớn (Lucide `Lock`) + text "Tài khoản Quản trị viên chỉ được sử dụng trên Web Portal" + nút "Đăng xuất" (Button `variant="outline"` của RNR, không phải CTA cam — tránh trông giống hành động tích cực). Không có mascot Sparky ở màn này (Sparky là linh vật học tập dành cho Học viên, dùng ở đây sẽ gây lệch tông "nghiêm túc, vận hành hệ thống" cần thiết cho ngữ cảnh admin).

---

## 1. BỐI CẢNH SẢN PHẨM

**Sản phẩm**: SmartEnglish AI — "AI Practice Partner" toàn diện cho người học tiếng Anh Việt Nam.

**Kiến trúc hệ thống thật**:

- **Mobile App**: **React Native (New Architecture — Fabric & TurboModules) + TypeScript, khởi tạo bằng Expo SDK (Prebuild/Config Plugins)** — nền tảng chính, ưu tiên số 1. Dùng Prebuild để vừa giữ tiện lợi của Expo Router vừa can thiệp sâu Native Module khi cần (AI Camera Frame Processor, NFC).
- **Web Portal**: Next.js (SSR/SSG) — landing SEO, dashboard Giáo viên/Admin (nhóm L–M chỉ wireframe/spec trong prompt này). **NativeWind dùng chung 1 bộ design token Tailwind với Web Next.js** — đây chính là lý do chọn NativeWind thay vì StyleSheet thuần, để đồng bộ token 2 nền tảng.
- **Backend**: Spring Boot, 8 microservice, schema-per-service trên 1 PostgreSQL instance + MongoDB + Redis.
- **AI Provider**: Google Vision/Gemini Vision (ảnh), Azure Speech/STT (phát âm), OpenAI/Gemini (chatbot/roleplay/chấm luận/sinh bài đọc).
- **Điều hướng Mobile**: Bottom Tab Bar 5 tab — `Home` · `Practice` · `Review` · `League` · `Profile` (Expo Router `Tabs` layout, xem Mục 2.1). Thêm **icon chuông thông báo** + **icon tìm kiếm** cố định trên Header mọi tab chính (Notification Center).

**Actor** (theo đặc tả): Học viên (Mobile/Web), Giáo viên (Web Portal), Admin (Web Portal), Hệ thống AI/IoT bên ngoài. **Xem Mục 0.2 để biết chính xác Mobile App xử lý thế nào khi tài khoản `teacher`/`admin` đăng nhập** — không phải Mobile App chỉ dành cho Học viên tuyệt đối, mà có 2 chế độ rút gọn dành riêng cho 2 vai trò còn lại.

---

## 2. NGĂN XẾP CÔNG NGHỆ & TỔ CHỨC THƯ MỤC (REACT NATIVE + EXPO)

### 2.1 Bộ Tech Stack chính thức (KHÓA CỨNG — không tự đổi sang thư viện khác cùng nhóm trừ khi giải thích lý do kỹ thuật bắt buộc)

**A. Nền tảng & Kiến trúc (Core & Architecture)**

- **React Native (New Architecture — Fabric & TurboModules) + TypeScript**, khởi tạo với **Expo SDK (Prebuild / Config Plugins)** — vừa tận dụng Expo Router vừa can thiệp sâu Native Module khi làm việc với AI Camera/Audio/NFC.
- **Expo Router (v3+)** làm cơ chế điều hướng chính (file-based routing, tương đồng cấu trúc route với Next.js của Web, hỗ trợ Deep Linking và Auth Guard liền mạch). `@react-navigation/drawer` (React Navigation v7 core, Expo Router build trên nền này) dùng riêng cho Drawer của Teacher Companion (Mục 0.2.2) vì Expo Router chưa có Drawer built-in tương đương Tabs.

**B. Giao diện & Styling (UI & Design System)**

- **NativeWind (v4 — Tailwind CSS for React Native)**: viết style bằng utility class chuẩn Tailwind, đồng bộ design token với Web Next.js.
- **React Native Reusables (RNR — shadcn UI cho RN)** làm hệ Base Component (Dialog, Sheet, Button, Card, Avatar, Badge, Accordion) — mọi nơi trước đây dùng widget Material mặc định của Flutter (`ElevatedButton`/`Card`/`AppBar`/`Chip`/`showDialog`) nay bắt buộc dùng component RNR đã style theo token Mục 5, tuyệt đối không dùng `Button`/`Modal`/`TextInput` trần của `react-native` core chưa style.
- **Lucide React Native** — bộ icon vector đồng bộ (thay `phosphor_flutter`/`lucide_icons` bản Flutter).

**C. Quản lý trạng thái & Xử lý mạng (State & Network)**

- **Zustand**: quản lý Global Client State (User profile, App settings, Gamification streak, mọi state machine thuần client không gọi API) — đóng vai trò lớp `application/` cho các luồng không đụng network.
- **TanStack Query (React Query v5)**: quản lý Server State — tự động Caching, Optimistic Updates, Refetch khi mạng phục hồi. **Đây là lớp thay thế trực tiếp cho `AsyncValue`/`StateNotifier` của Riverpod ở bản Flutter** — mọi hành động gọi API (submit quiz, lưu flashcard, thanh toán, gửi tin nhắn chat...) bắt buộc dùng `useMutation`/`useQuery` để có sẵn `isPending/isSuccess/isError` đúng 4 trạng thái yêu cầu ở Mục 0.1, không tự viết lại state machine trùng lặp bằng `useState`.
- **Axios (Custom Interceptors)**: tự động gắn JWT Access Token, xử lý Refresh Token Rotation, bắt lỗi tập trung. Kết hợp **`axios-mock-adapter`** (mock layer, delay 300–900ms) để UI có sẵn loading/error thật ngay từ đầu khi chưa có backend thật — đây là lớp thay thế cho `dio` + `MockInterceptor` bản Flutter.
- **WebSocket (API `WebSocket` built-in của React Native, bọc trong custom hook `useRoleplaySocket`)**: xử lý Real-time Voice Chat & Live Subtitles cho AI Roleplay Companion — mock bằng `setInterval` giả lập audio 2 chiều tới khi có API thật.

**D. Lưu trữ Cục bộ & Xử lý Offline-First (SRS Flashcard)**

- **Expo SQLite (Next-gen API)** (hoặc `OP-SQLite` nếu cần hiệu năng cao hơn cho >10k thẻ) — database SQLite chạy trực tiếp trên thiết bị để lưu hàng ngàn từ vựng, tính SM-2 cục bộ khi mất kết nối (Mục 6.4 offline-first bắt buộc theo đặc tả).
- **`react-native-mmkv`**: bộ nhớ Key-Value siêu nhanh, dùng lưu token/session/cache tức thời (thay `SharedPreferences` bản Flutter). Với riêng `refresh_token` (dữ liệu nhạy cảm), dùng thêm **`expo-secure-store`** (mã hoá ở tầng OS) thay vì MMKV thường.

**E. Đồ họa, Animation & Trò chơi hóa (Gamification)**

- **React Native Reanimated (v3+) + React Native Gesture Handler**: xử lý animation lật thẻ 3D Flashcard, kéo-thả mượt trên UI thread (target 120 FPS trên thiết bị hỗ trợ) — thay thế toàn bộ `flutter_animate`/`flutter_staggered_animations`/`AnimatedContainer`/`AnimatedSize`/`Hero` của bản Flutter. Reanimated 3's `entering`/`exiting`/`layout` prop (`LinearTransition`, `FadeIn`, `SlideInRight`...) là công cụ chính cho mọi transition khai báo (declarative), kể cả hiệu ứng "bay sang tab khác" (Mục 7.2) trước đây dùng `Hero`.
- **`@shopify/react-native-skia`**: vẽ biểu đồ sóng âm (waveform) thời gian thực, radar chart, sparkline, learning-path curve, và mọi hiệu ứng đồ họa 2D tuỳ biến khác — **thay thế đồng thời cả `CustomPainter` lẫn `fl_chart`** của bản Flutter (Skia đủ mạnh để tự vẽ chart, không cần thêm thư viện chart riêng).
- **`lottie-react-native`**: chạy animation vector — ngọn lửa Streak, pháo hoa Confetti khi thăng cấp/hoàn thành bài, và **6 pose cảm xúc của linh vật Sparky** (thay `rive`/`lottie` bản Flutter — chọn Lottie làm chuẩn duy nhất thay vì Rive vì asset Lottie dễ xuất từ After Effects hơn cho đội thiết kế không chuyên Rive; nếu team có sẵn asset Rive, `@rive-app/react-native-runtime` là lựa chọn thay thế tương đương, ghi rõ lý do nếu đổi).
- **`expo-haptics`**: rung phản hồi khi ăn mừng/đúng-sai đáp án (thay `HapticFeedback` bản Flutter).

**F. Xử lý Đa phương tiện, Thị giác AI & Phần cứng (Hardware & AI)**

- **React Native Vision Camera (v4)**: chụp ảnh quét từ vựng + Frame Processor vẽ Bounding Box lên vật thể theo thời gian thực.
- **`expo-image-picker`**: chọn ảnh có sẵn từ thư viện (bổ sung cho Vision Camera vốn chỉ lo chụp trực tiếp — luồng C.1 Mục 6.2 cần cả 2 lối vào "Chụp/chọn ảnh").
- **`react-native-audio-recorder-player`** (hoặc `expo-av` cho phát lại đơn giản): thu âm microphone đa nền tảng, xuất PCM/WAV gửi server chấm điểm phát âm IPA; `expo-av`'s `Audio.Sound.setOnPlaybackStatusUpdate` cung cấp `positionMillis` để đồng bộ transcript Karaoke-Sync (Mục 6.8).
- **`expo-speech`**: phát âm Text-to-Speech (TTS) chuẩn US/UK (thay `flutter_tts`).
- **`react-native-nfc-manager`**: đọc/ghi chip NFC cho tính năng "Chạm thẻ để học" (Mục 6.13).

### 2.2 Cấu trúc thư mục — feature-first, giữ nguyên tinh thần 3 lớp `data/application/presentation` của bản Flutter, thích ứng với Expo Router file-based routing

> **Nguyên tắc chuyển đổi quan trọng nhất**: Expo Router **bắt buộc** file trong thư mục `app/` phải là route (mỗi file = 1 màn hình điều hướng được). Để vẫn giữ đúng tinh thần "3 lớp bắt buộc mỗi feature" của Mục 0.1, ta tách biệt: **`app/` chỉ chứa route file MỎNG** (import và render lại Screen component từ `src/features/`, không chứa logic gì khác ngoài lấy `useLocalSearchParams`/`useRouter` và truyền props) — toàn bộ `data/application/presentation` thật sự nằm trong `src/features/`.

```
app/                                  # Expo Router — CHỈ chứa route file mỏng (file-based routing)
  _layout.tsx                          # Root layout — chứa RoleGate guard (Mục 0.2.1/6.0.A), khởi tạo QueryClientProvider + ThemeProvider
  (auth)/                              # nhóm route Onboarding & Đăng nhập — public, chưa cần role
    welcome.tsx
    choose-goal.tsx
    placement-intro.tsx
    login.tsx
    placement-result.tsx
    placement-test.tsx                 # nhóm P — Đang làm bài Placement Test
  (student)/                           # nhóm route CHỈ role='student' — Tab Navigator 5 tab
    _layout.tsx                         # <Tabs> của Expo Router — tương đương StatefulShellRoute Flutter
    home/
      index.tsx                         # B.1 Home
      daily-challenge.tsx
      lesson/[id].tsx
      analytics.tsx
    practice/                           # tab gộp Scan/Speaking/Writing/Chatbot (Mục Practice hub)
      scan/...
      speaking/...
      writing/...
      chatbot/...
    review/                             # tab Flashcard SRS
      decks/index.tsx
      decks/[deckId]/study.tsx
      topics.tsx
      manage.tsx
    league/
      index.tsx
      shop.tsx
      badges.tsx
      nfc.tsx
    profile/
      index.tsx
      notifications-settings.tsx
      premium.tsx
      checkout.tsx
      classes/index.tsx                 # 🆕 S.0 Danh sách lớp của tôi
      classes/join.tsx                  # 🆕 S.1 Nhập mã lớp
      classes/[classId]/index.tsx       # 🆕 S.2 Chi tiết lớp
      classes/[classId]/assignments.tsx # 🆕 S.3 Danh sách bài tập
      referral.tsx
    notifications.tsx                   # O. Trung tâm thông báo (Student)
    knowledge-gap.tsx                   # Q. Ma trận chẩn đoán lỗ hổng kiến thức
    social/
      feed.tsx
      post/[id].tsx
      create-post.tsx
      friends.tsx
      report.tsx
  (teacher-companion)/                 # 🆕 nhóm route CHỈ role='teacher' — Drawer Navigator riêng
    _layout.tsx                         # Drawer 3 mục (Lớp học/Thông báo/Đăng xuất)
    classes/index.tsx                    # T.1
    classes/[classId].tsx                # T.2
    notifications.tsx                    # T.3
  admin-blocked.tsx                    # 🆕 route CHỈ role='admin' — không nav
src/
  core/
    theme/                              # NativeWind tailwind.config.js token mở rộng, ThemeProvider, useAppTheme() hook
    api/                                # Axios instance + interceptor JWT/refresh, axios-mock-adapter setup
    flows/                              # 🆕 Zustand store dùng chung nhiều feature (PaywallFlow, QuotaFlow, RoleGateStore)
    components/                          # RNR/shadcn component tái style theo token (Button, Card, Dialog, Sheet, Badge, Accordion...)
    i18n/                                 # i18next config, locales/vi.json, locales/en.json
    db/                                   # Expo SQLite schema/migration cho offline SRS
  features/
    auth/                                 # ↔ schema auth
    onboarding/                           # ↔ auth.users, learning.user_stats (placement test)
    home-dashboard/                       # ↔ learning.user_stats, daily_plans, content.lessons
    ai-scan/                               # ↔ ai_practice.scans, detected_objects
    ai-speaking/                           # ↔ ai_practice.pronunciation_sessions, roleplay_*
    ai-writing/                             # ↔ ai_practice.submissions + Mongo writing_analyses
    ai-chatbot/                             # ↔ Mongo chatbot_conversations
    flashcard-srs/                           # ↔ learning.decks, deck_cards, srs_states
    quiz-exam/                               # ↔ learning.quizzes, questions, attempts
    reading-listening/                       # ↔ content.lessons
    learning-path/                            # ↔ learning.daily_plans, placement test, knowledge gap
    gamification/                              # ↔ learning.user_stats, league_*, badge_*
    iot-nfc/                                    # ↔ ai_practice.nfc_tags
    notification-center/                        # ↔ notification.push_tokens/user_settings/templates
    social/                                      # ↔ schema social (feed, bạn bè, follow, report)
    profile-settings/                             # ↔ auth.users, notification.user_settings
    payment-premium/                               # ↔ payment.orders, subscriptions, coupons
    referral/                                       # ↔ auth.users.referral_code/referred_by
    class-membership/                                # 🆕 ↔ nhóm màn S — teacher.classes/class_members/assignments
    teacher-companion/                                # 🆕 ↔ nhóm màn T + Admin Blocked Screen
  App.tsx                                             # entry (nếu không dùng expo-router 100%, chỉ để bootstrap provider)
```

Mỗi feature trong `src/features/` **bắt buộc đủ 3 thư mục**, không được thiếu `application/`:

```
src/features/flashcard-srs/
  data/            # TypeScript interface + Zod schema khớp 100% cột .sql, api/*.ts (Axios call thật + mock qua axios-mock-adapter), fakeData.ts (seed mock)
  application/      # 🆕 Zustand store (state machine thuần client, vd SrsQueueStore) + custom hook bọc TanStack Query (vd useReviewCardMutation) chứa logic Mục 6, KHÔNG chứa JSX
  presentation/      # screens/ (component màn hình đầy đủ, được app/ route file import lại) + components/ (widget con), chỉ đọc state qua hook từ application/
```

### 2.3 Bảng đối chiếu package đầy đủ (bổ sung ngoài 6 nhóm cốt lõi ở Mục 2.1)

| Nhóm | Package | Lý do dùng | Tương đương bản Flutter cũ |
| --- | --- | --- | --- |
| State management | `zustand` | Global client state + state machine thuần | `flutter_riverpod`/`StateNotifier` |
| Server state | `@tanstack/react-query` | Cache, optimistic update, refetch, 4-state loading chuẩn | `AsyncValue`/`AsyncNotifier` |
| Model & validate | `zod` + TypeScript `interface` | Schema khớp 100% cột `.sql`, validate runtime | `freezed`/`json_serializable` |
| Routing | `expo-router` (+ `@react-navigation/drawer` cho Teacher) | File-based routing, deep-link, tab/drawer navigator | `go_router`/`StatefulShellRoute` |
| Network layer (giả lập) | `axios` + `axios-mock-adapter` (delay 300–900ms) | UI có sẵn loading/error thật từ đầu | `dio` + `MockInterceptor` |
| Animation linh vật Sparky | `lottie-react-native` (hoặc `@rive-app/react-native-runtime` nếu có asset Rive) | 6 state cảm xúc, không ảnh tĩnh | `rive`/`lottie` |
| Animation UI | `react-native-reanimated` v3+, `react-native-gesture-handler` | Micro-interaction khai báo, layout transition, gesture 3D flip | `flutter_animate`/`flutter_staggered_animations` |
| Vẽ tùy biến & chart | `@shopify/react-native-skia` | Learning path, waveform, radar, sparkline | `CustomPainter` + `fl_chart` |
| Confetti & Haptic | asset Lottie confetti (qua `lottie-react-native`) + `expo-haptics` | Ăn mừng | `confetti` + `HapticFeedback` |
| Camera/quét ảnh | `react-native-vision-camera` v4 + `expo-image-picker` | Chụp trực tiếp + chọn từ thư viện | `camera` + `image_picker` |
| Ghi âm/phát âm | `react-native-audio-recorder-player`, `expo-av` | Thu âm, phát lại, đồng bộ transcript | `record` + `just_audio` |
| TTS | `expo-speech` | | `flutter_tts` |
| Roleplay realtime (mock) | `WebSocket` built-in (custom hook) | | `web_socket_channel` |
| Ảnh/skeleton | `expo-image` (cache + blurhash placeholder) + shimmer tự viết bằng Reanimated | | `cached_network_image` + `shimmer` |
| Lưới responsive/danh sách dài | `FlatList numColumns` (built-in) hoặc `@shopify/flash-list` cho list rất dài (>200 item) | | `flutter_staggered_grid_view` |
| Bottom sheet | `@gorhom/bottom-sheet` | Thay `showModalBottomSheet` | — |
| Ngày giờ | `react-native-calendars` (deadline picker Teacher) + `dayjs` | | `table_calendar` + `intl` |
| Đa ngôn ngữ | `i18next` + `react-i18next` + `expo-localization` | ARB → JSON locales | `flutter_localizations`/`intl` (ARB) |
| Số điện thoại | `react-native-phone-number-input` | Chuẩn hóa/validate SĐT tìm bạn bè (E.164, mặc định +84) | `intl_phone_number_input` |
| Debounce tìm kiếm | viết tay bằng `useDeferredValue`/`setTimeout` trong hook (không thêm package ngoài) | Search bạn bè/từ điển không gọi mỗi keystroke | `Timer` tự viết trong Riverpod |
| Danh bạ máy (tùy chọn, cần xin quyền) | `expo-contacts` | "Tìm bạn bè qua danh bạ" — **chỉ bật nếu người dùng chủ động cấp quyền** | `flutter_contacts` |
| Lưu trữ nhanh/token | `react-native-mmkv` + `expo-secure-store` (riêng refresh token) | | `SharedPreferences`/mock secure storage |
| Offline SQLite | `expo-sqlite` (Next-gen API) | SRS offline-first | (không có bản Flutter tương ứng — v4 dùng mock local field `is_synced`) |
| Trạng thái mạng | `@react-native-community/netinfo` | Giả lập mất mạng để test offline-first Mục 6.4 | `Connectivity` package |
| OAuth | `expo-auth-session` + `expo-apple-authentication` | Đăng nhập Google/Apple/Facebook mock | mock `provider_uid` |
| Chia sẻ | `Share` API built-in của `react-native` (hoặc `expo-sharing`) | Referral, chia sẻ deck | `share_plus` |
| Icon | `lucide-react-native` | | `phosphor_flutter`/`lucide_icons` |

### 2.4 Theming, Responsive

Dùng NativeWind `tailwind.config.js` mở rộng `colors`/`fontFamily` theo đúng token Mục 5 (`primary`, `secondary`, `accent`, `success`, `error`, `warning`, `neutralInk`, `neutralGray`, `surface`, `cardWhite`, `darkBg`, `darkCard`) + hook `useAppTheme()` xuất các token dạng TypeScript const cho nơi NativeWind className không vói tới được (màu vẽ trong Skia Canvas, màu truyền vào Lottie dynamic properties). 2 theme sáng/tối qua NativeWind `dark:` variant + `useColorScheme()` — riêng nhóm Speaking/Scan luôn ép `darkBg`/`darkCard` bất kể theme hệ thống (đúng yêu cầu Mục 5, không phải "dark mode" theo cấu hình máy). Breakpoint responsive dùng hook `useWindowDimensions()` kết hợp NativeWind prefix `sm:`/`md:`/`lg:` (NativeWind v4 hỗ trợ breakpoint chuẩn Tailwind): `<600` mobile, `600–1024` tablet, `>1024` desktop web (Web Portal Next.js).

---

## 3. NGUỒN CẢM HỨNG THIẾT KẾ (tham khảo, KHÔNG sao chép nguyên bản)

> Dùng các nguồn dưới đây để **định hướng cảm giác chuyển động và bố cục**, tuyệt đối không copy logo/icon/màu thương hiệu của các app này. Bảng màu bắt buộc vẫn theo Mục 5 (Momentum Orange + Deep Teal).

| Nguồn tham khảo | Học được gì | Không nên bê nguyên |
| --- | --- | --- |
| Duolingo — Learning Path UI (Dribbble/Banani) | Đường lộ trình cong nối node tròn, node "đang học" pulsing, node khóa mờ xám — cảm giác 1 con đường xuyên suốt thay vì danh sách bài học khô khan | Không dùng xanh lá + logo cú của Duolingo; không dùng đúng bố cục "1 nút tròn to giữa màn hình" lặp lại y hệt |
| ELSA Speak — màn hình chấm điểm phát âm | Cách hiển thị điểm theo % lớn + 4 chỉ số phụ (Accuracy/Stress/Intonation/Fluency) rõ ràng, feedback màu theo mức độ lỗi | Không dùng đúng bố cục thanh ngang xanh dương của ELSA — bản SmartEnglish dùng gauge tròn (vẽ bằng Skia) theo Mục 5 |
| Dribbble "Gamified AI Education Platform" | Cảm hứng thẻ 3D nổi nhẹ cho huy hiệu/phần thưởng, hiệu ứng glow cho vật phẩm hiếm | Không copy nguyên palette tím-xanh AI mặc định đã bị cấm ở Mục 4 |
| Behance "Duolingo Gamification Deconstruction" | Cách phân rã 10 nguyên lý gamification (streak, XP, league, quest) thành từng component riêng biệt — dùng làm checklist khi implement Mục 6.10 (Gamification) | — |

Khi sinh code, ở phần đầu output nhóm màn hình Gamification (J) và Speaking (D), ghi 1–2 dòng comment "lấy cảm hứng bố cục từ [nguồn], màu/token theo Mục 5 SmartEnglish" để người review biết rõ nguồn tham khảo, tránh tranh cãi bản quyền thiết kế về sau.

---

## 4. QUY TẮC CHỐNG "GIAO DIỆN AI SÁO RỖNG" (giữ nguyên tinh thần bản v2, chuyển kỹ thuật sang RN)

1. **Màu sắc**: chỉ dùng bảng Mục 5, cấm gradient tím-xanh AI mặc định.
2. **Typography**: Be Vietnam Pro ExtraBold (tiêu đề) + Inter/Public Sans (nội dung) — nạp qua `expo-font`, khai báo trong NativeWind `fontFamily` token — tối thiểu 5 cấp type scale.
3. **Bố cục**: grid 4/8px (NativeWind spacing scale mặc định đã theo hệ 4px, chỉ dùng đúng token có sẵn, không tự chèn giá trị `px` rời rạc), tránh lặp "toàn thẻ trắng bo góc 12px" — luân phiên full-bleed và bất đối xứng.
4. **Icon & Sparky**: 1 phong cách icon nhất quán (`lucide-react-native`), Sparky là Lottie 6 state (hoặc Rive nếu đổi — Mục 2.1.E), không ảnh tĩnh.
5. **Trạng thái tương tác**: mọi component đều có `pressed`/`disabled`/`loading`/`empty`/`error` code thật (Pressable với `style` theo `pressed` state của RN, RNR Button có sẵn `disabled` prop, TanStack Query `isPending` cho loading) — không `<ActivityIndicator />` trần giữa màn hình trống không có context.
6. **Không dùng component RN core mặc định chưa style lại**: `Button`/`Modal`/`TextInput`/`Alert.alert()` trần của `react-native` — đều phải thay bằng component RNR (`Button`/`Dialog`/`Sheet`/`Input`) đã style theo NativeWind token Mục 5. Đây là quy tắc thay thế trực tiếp cho "không dùng `ElevatedButton`/`Card`/`AppBar` Material mặc định" của bản Flutter.
7. **Không magic number**: mọi spacing/radius dùng đúng token NativeWind (`p-4`, `rounded-xl`...), không tự viết `padding: 13` rời rạc trong `StyleSheet`.
8. **Animation**: micro (100–200ms, `withTiming`/`withSpring` của Reanimated), chuyển màn hình (250–350ms, `options={{ animation: 'slide_from_right' }}` của Expo Router Stack hoặc Reanimated `SlideInRight`/`SlideOutLeft`), ăn mừng (600ms–1.2s, Lottie confetti + `expo-haptics`), loading AI riêng theo ngữ cảnh (không 1 `ActivityIndicator` dùng chung mọi nơi).

*(Chi tiết animation cho từng màn cụ thể — xem Mục 7, mỗi 🎬 phải có code Reanimated/Skia/Lottie thật khi implement, không mô tả suông.)*

---

## 5. BẢNG MÀU CHÍNH THỨC (KHÓA CỨNG)

Định vị: ấm áp, năng lượng, đáng tin cậy. Cặp chính = cam năng lượng + xanh ngọc lục bảo đậm. Khai báo trong `tailwind.config.js theme.extend.colors` (NativeWind) + đồng thời xuất 1 object TypeScript `AppColors` const trong `src/core/theme/colors.ts` cho nơi cần giá trị hex thô (Skia Canvas, Lottie dynamic color).

| Token (Tailwind class name `bg-primary` v.v. + TS const) | Mã màu | Sử dụng |
| --- | --- | --- |
| `primary` — Momentum Orange | `#FF6B35` | CTA chính, streak, thanh XP |
| `primaryDark` | `#E85A2A` | pressed |
| `secondary` — Deep Teal | `#0F7173` | header phụ, tab active, biểu đồ, Sparky |
| `accent` — Sunshine Yellow | `#FFC93C` | huy hiệu, coin, sao |
| `success` — Leaf Green | `#2ECC71` | đúng, Mastered |
| `error` — Coral Red | `#FF4D4D` | sai, lỗi |
| `warning` — Amber | `#FFA726` | streak sắp hết |
| `neutralInk` | `#1A1D29` | chữ chính |
| `neutralGray` | `#6B7280` | chữ phụ |
| `surface` | `#F7F5F2` | nền app |
| `cardWhite` | `#FFFFFF` | nền card |
| `darkBg` | `#12141C` | nền Speaking/Scan |
| `darkCard` | `#1E212C` | card dark mode |

SRS: Again=Coral, Hard=Amber, Good=Leaf Green, Easy=Deep Teal. Giải đấu: Bronze `#CD7F32`, Silver `#C0C0C0`, Gold `#FFD700`, Diamond `#B9F2FF`. Lỗi viết: đỏ=chính tả, vàng=ngữ pháp, xanh dương=dùng từ.

Sparky: ngọn lửa cách điệu gradient cam-vàng, 6 state Lottie (vui vẻ/ngạc nhiên/ăn mừng/buồn/suy nghĩ/động viên).

---

## 6. LUỒNG NGHIỆP VỤ CHI TIẾT (BẮT BUỘC ĐỌC TRƯỚC KHI VẼ MÀN HÌNH)

> Mỗi luồng dưới đây phải được implement thành 1 (hoặc nhiều) **Zustand store (state machine thuần client) + custom hook bọc TanStack Query `useMutation`/`useQuery`** trong `application/` của feature tương ứng. Format chung: **Bước** (numbered) → **Entity/bảng đụng tới** → **Điều kiện rẽ nhánh** → **Trạng thái UI cần code**. Ký hiệu 🔀 = rẽ nhánh Free/Premium hoặc điều kiện dữ liệu; ⚠️ = trường hợp lỗi/biên bắt buộc xử lý.

### 6.0 Role Gating & Lớp học (Học viên tham gia lớp) — chạy TRƯỚC cả 6.1

**Bảng liên quan**: `auth.users.role`, `teacher.classes`, `teacher.class_members`, `teacher.assignments`.

**A. Role Gating (áp dụng cho MỌI lần mở app, không chỉ lần đầu):**
1. Sau khi màn Splash (đọc token từ `expo-secure-store` qua hook `useAuthBootstrap()`)/Đăng nhập xác thực token thành công → đọc `role` → `useRoleGate()` (Zustand store `src/core/flows/roleGateStore.ts`) quyết định route đích:
   - `role == 'admin'` → `router.replace('/admin-blocked')` (Mục 0.2.3), dừng mọi luồng khác, không prefetch bất kỳ TanStack Query nào cho dữ liệu học tập (tránh lãng phí gọi API/mock không cần thiết).
   - `role == 'teacher'` → `router.replace('/(teacher-companion)/classes')` (Mục 0.2.2).
   - `role == 'student'` → tiếp tục luồng 6.1 (Onboarding nếu `onboarding_completed=false`, hoặc Home nếu đã xong).
2. ⚠️ Guard này phải nằm trong `app/_layout.tsx` (root layout) chạy trong `useEffect` ngay khi `useAuthStore` hydrate xong từ MMKV/SecureStore (dùng cờ `isHydrated` để tránh render nhầm route trước khi biết role) — **không** nằm rải rác trong từng màn hình con — nếu không, user có thể "lách" bằng deep-link thẳng vào route Student dù role khác (Expo Router vẫn cho phép deep-link trực tiếp vào bất kỳ file route nào nếu không có guard tập trung).

**B. Học viên tham gia lớp học (`role='student'` — màn S.1):**
3. Từ `Profile` (Mục K.1) hoặc Home, entry point "Tham gia lớp học" → màn **S.1 Nhập mã lớp**: 1 `TextInput` (RNR `Input`) 6-10 ký tự viết hoa tự động (xử lý trong `onChangeText={(t) => setCode(t.toUpperCase())}`, RN không có `TextInputFormatter` built-in như Flutter nên tự xử lý trong handler), nút "Tham gia" disabled tới khi đủ độ dài tối thiểu.
4. Submit (TanStack Query `useMutation`) → tra `teacher.classes.join_code` (mock qua `axios-mock-adapter`):
   - ⚠️ Không tìm thấy mã → lỗi "Mã lớp không đúng, kiểm tra lại với giáo viên" (không nói rõ "sai" hay "hết hạn" để tránh dò mã).
   - Tìm thấy nhưng `status='archived'` → lỗi "Lớp học này đã kết thúc".
   - Tìm thấy & `status='active'` nhưng sĩ số hiện tại ≥ `max_students` → lỗi "Lớp đã đủ sĩ số".
   - Hợp lệ → tạo `teacher.class_members` (`role='student'`, `status='active'`) → điều hướng thẳng vào **S.2 Chi tiết lớp** của lớp vừa tham gia + toast xác nhận + Sparky "vui vẻ".
5. Học viên có thể ở trong **nhiều lớp cùng lúc** (không giới hạn theo schema) → màn **S.0 Danh sách lớp của tôi** (entry point chính từ Profile) liệt kê tất cả `class_members.status='active'` của user (TanStack Query `useQuery` với `queryKey: ['my-classes']`), mỗi card có tên lớp + tên giáo viên + badge số bài tập `pending`.

**C. Bài tập được giao (`teacher.assignments` → Học viên thực hiện trên Mobile):**
6. Màn **S.3 Danh sách bài tập** (con của S.2, lọc theo `class_id`): mỗi item hiện `assignment_type` (icon riêng: quiz/vocab_deck/writing/roleplay/reading — tái dùng đúng icon nhóm màn hình tương ứng H/G/E/D/I để nhất quán), `due_date` đếm ngược màu theo mức khẩn (còn >3 ngày=Teal, ≤1 ngày=Amber, quá hạn=Coral đỏ + nhãn "Quá hạn"), trạng thái (`Chưa làm`/`Đang làm`/`Đã nộp`/`Đạt`/`Chưa đạt` so với `passing_score`).
7. Chạm vào 1 assignment → **điều hướng thẳng vào đúng route màn hình chức năng gốc đã có** theo `assignment_type` (KHÔNG code lại UI riêng cho "làm bài tập" — tái sử dụng 100% route Quiz/Flashcard/Writing/Roleplay/Reading hiện có), nhưng truyền `assignmentContext` (chứa `assignment_id`, `class_id`) qua query param của Expo Router (`router.push({ pathname: '/(student)/practice/quiz/[id]', params: { id: quizId, assignmentId, classId } })`):
   - `assignment_type='quiz'` → mở route H.2 (Đang làm quiz) với bộ câu hỏi = `reference_id` trỏ tới `learning.quizzes`.
   - `assignment_type='vocab_deck'` → mở route G.2 (Ôn tập lật thẻ) với `deck_id = reference_id`, mục tiêu hoàn thành = học hết thẻ `due` trong deck đó.
   - `assignment_type='writing'` → mở route E.1/E.2 với loại bài viết định sẵn theo assignment, khóa không cho đổi loại bài.
   - `assignment_type='roleplay'` → mở route D.4/D.5 với `scenario_id = reference_id` định sẵn, bỏ qua bước chọn kịch bản.
   - `assignment_type='reading'` → mở route I.2 với bài đọc = `reference_id`.
8. Khi hoàn thành route gốc đó (vd nộp quiz, hoàn thành hết thẻ, gửi bài viết...) → NGOÀI việc lưu kết quả vào đúng bảng gốc như luồng bình thường (Mục 6.2–6.8 tương ứng), **thêm 1 bước ghi nhận nộp bài về ngữ cảnh lớp** (chỉ chạy nếu `assignmentContext` có trong query param) → cập nhật trạng thái item ở S.3 thành `Đã nộp`/`Đạt`/`Chưa đạt` (invalidate TanStack Query `queryKey: ['assignments', classId]` để list tự refetch), đồng thời bắn `notification_type='assignment_submitted'` (mock) để giáo viên thấy ở T.3.
   - ⚠️ *GIẢ ĐỊNH NGOÀI SCHEMA GỐC*: `.sql` gốc chưa có bảng `assignment_submissions` tường minh (chỉ có `teacher.assignments` định nghĩa bài tập) — coding agent cần tự thêm 1 interface/mock-table tối thiểu (`class_id, assignment_id, user_id, status, score, submitted_at`) để lưu trạng thái nộp bài theo từng học viên, và PHẢI ghi rõ comment `// GIẢ ĐỊNH NGOÀI SCHEMA GỐC: bảng assignment_submissions` ngay tại nơi định nghĩa type, để dễ đối chiếu khi có backend thật.
9. 🎬 Badge số bài tập `pending` ở S.0/Home (nếu >0) dùng đúng pattern chấm đỏ nhỏ như badge lời mời kết bạn Mục 7.2 — nhất quán ngôn ngữ hình ảnh "có việc cần chú ý" xuyên toàn app.

### 6.1 Auth & Placement Test (nền tảng — chạy trước mọi luồng khác)

**Bảng liên quan**: `auth.users`, `learning.user_stats`.

1. Mở app lần đầu → hook `useAuthBootstrap()` check `expo-secure-store` có `refresh_token` hợp lệ chưa.
   - Có & còn hạn → decode mock JWT → set `useAuthStore.currentUser` → điều hướng thẳng vào `Home` (bỏ qua Onboarding).
   - ⚠️ Có nhưng hết hạn (mock `token_expires_at` < now) → tự gọi `refreshToken()` (Axios interceptor phản hồi 401 tự động refresh — Mục 2.1.C) giả lập; fail → xóa token, về màn hình Welcome.
   - Không có → màn hình Welcome (A.1).
2. Đăng ký: chọn Email hoặc OAuth (Google/Apple/Facebook qua `expo-auth-session`/`expo-apple-authentication` — mock trả về `provider_uid` giả).
   - 🔀 Validate email trùng (mock kiểm tra `auth.users.email` unique) → nếu trùng, KHÔNG tạo tài khoản mới, hiển thị lỗi + gợi ý "Đăng nhập thay vì đăng ký".
3. Chọn mục tiêu học (A.2) → lưu tạm `target_goal` vào Zustand state cục bộ (`useOnboardingStore`, chưa `POST`, chỉ gửi 1 lần cùng bước 6).
4. Giới thiệu Placement Test (A.3) → **màn Đang làm bài Placement Test** (route `app/(auth)/placement-test.tsx`): 15 câu tổng hợp Đọc/Nghe/Ngữ pháp/Từ vựng, tiến trình dạng thanh ngang liên tục trên cùng (khác chấm tròn của Quiz H.2), KHÔNG cho quay lại câu trước (khác Quiz thường), KHÔNG hiện điểm từng câu ngay (chỉ tổng kết cuối).
   - ⚠️ Thoát giữa chừng → hỏi xác nhận "Thoát sẽ mất kết quả, chắc chắn?" (RNR `AlertDialog` custom style theo token, không `Alert.alert()` mặc định của RN).
5. Nộp bài (`useMutation`) → mock chấm điểm tức thì (delay 1–2s giả lập AI xử lý qua `axios-mock-adapter`) → tính ra `cefr_level` (A1–B2) + điểm 4 kỹ năng (dùng cho radar A.5, vẽ bằng Skia) → gọi API 1 lần: tạo `auth.users` (kèm `target_goal` bước 3) + tạo `learning.user_stats` khởi tạo (`xp_total=0`, `level=1`, `streak_current=0`...).
6. Điều hướng `Home` lần đầu → `onboarding_completed=true`.

### 6.2 Nhóm 1 — AI Image Recognition (màn C)

**Bảng**: `ai_practice.scans`, `ai_practice.detected_objects`, `content.words/word_meanings`, `learning.decks/deck_cards`.

1. Mở tab Scan → hook `useScanQuota()` (TanStack Query, `queryKey: ['scan-quota', today]`) tính số `ai_practice.scans` có `created_at` = hôm nay của user hiện tại.
   - 🔀 Free & đã dùng ≥10 lượt hôm nay → khóa nút chụp, hiện banner "Hết lượt quét hôm nay" + CTA mở Paywall (K.3) — **không** cho chụp thử rồi mới báo lỗi.
   - Premium → không giới hạn, badge ẩn số lượt.
2. Chụp (React Native Vision Camera) hoặc chọn ảnh (`expo-image-picker`) → tạo bản ghi `scans` cục bộ `scan_status='pending'` → hiện `ScanningRingOverlay` (component Skia `Canvas` vẽ vòng quét loading, thay `ScanningRingPainter` bản Flutter).
3. Gọi `submitScan()` (`useMutation`, mock delay 1.5–2.5s) → trả về `detected_count`, danh sách `detected_objects[]` (mỗi object có `bounding_box`, `confidence`, `word_id` map sang `content.words`) → cập nhật `scan_status='completed'`. Vision Camera Frame Processor có thể vẽ Bounding Box preview realtime trên khung hình trước khi gửi (native worklet), nhưng bounding-box **chính thức** hiển thị sau kết quả server vẫn vẽ bằng Skia đè lên `<Image>` ảnh đã chụp (đúng toạ độ trả về từ AI, không lấy từ preview realtime).
   - ⚠️ Mock random 5% trả `scan_status='failed'` (không nhận diện được vật thể nào) → hiện `EmptyStateView` Sparky "suy nghĩ" + nút "Thử lại".
4. Người dùng chạm 1 object card → mở Chi tiết từ (C.3).
   - 🔀 Free → chỉ hiện định nghĩa + 1 ví dụ mặc định (`meaning_vi`, ví dụ trong `word_examples` có sẵn, KHÔNG gọi AI sinh thêm).
   - Premium → gọi thêm AI sinh 3 câu ví dụ theo 3 mức khó (tab Easy/Medium/Hard, dùng RNR `Tabs`) + bóc tách collocation. Free chạm vào tab Medium/Hard → Paywall, không hiện nội dung mờ giả (tránh gây hiểu lầm đã có sẵn).
5. Nhấn "Lưu vào Flashcard" (C.4) → `@gorhom/bottom-sheet` chọn deck có sẵn (`learning.decks` của user) hoặc tạo deck mới nhanh → tạo `learning.deck_cards` mới với `word_id` trỏ đúng từ, `source='image_scan'` implicit qua deck cha (nếu deck mới thì `decks.source='image_scan'`).
   - ⚠️ Từ đã có sẵn trong deck đó rồi (trùng `word_id` trong cùng `deck_id`) → không tạo trùng, hiện toast "Từ này đã có trong bộ thẻ, mở để ôn ngay?" thay vì lỗi im lặng.
6. Toast xác nhận + Sparky cổ vũ, **không cộng XP trực tiếp cho hành động scan** (đặc tả không nêu XP cho Nhóm 1 — chỉ nêu tạo dữ liệu SRS; XP sẽ đến khi thực sự ôn thẻ ở Nhóm 3) — đây là điểm dễ bị AI agent tự bịa thêm XP sai, phải tránh.

### 6.3 Nhóm 2 — AI Speaking & Pronunciation (màn D)

**Bảng**: `ai_practice.pronunciation_sessions`, `roleplay_scenarios`, `roleplay_sessions`.

**A. Chấm từ đơn (Free)**:
1. Hiện từ mục tiêu (lấy ngẫu nhiên từ deck đang học hoặc chỉ định) → giữ nút mic (Pressable + Reanimated `onLongPress`/gesture) → `react-native-audio-recorder-player` bắt đầu ghi.
2. Thả tay → dừng ghi → upload mock (`useMutation`, delay 800ms–1.5s "AI đang phân tích" — component `ListeningDotsWidget`, không `ActivityIndicator`).
3. Trả về `overall_score` (0–100%) → tạo `pronunciation_sessions` (`session_type='single_word'`).
   - 🔀 `overall_score` ≥ 80 → mini confetti (Lottie) + Sparky bay ngang (Reanimated `SlideInRight` + `SlideOutRight`). < 80 → Sparky động viên (không bao giờ hiện Sparky "buồn" ở đây — trạng thái buồn chỉ dành riêng cho mất streak theo Mục 5).
4. Nút "Nghe lại bản ghi của bạn" (`expo-av` phát `audio_url` mock) và "Nghe giọng bản ngữ" (`reference_audio_url`).

**B. Phân tích chi tiết IPA (Premium — câu dài)**:
5. 🔀 Free chạm vào chế độ câu dài → Paywall trực tiếp, không cho ghi âm thử.
6. Premium: ghi âm câu → trả về 4 chỉ số `accuracy/stress/intonation/fluency_score` + mảng `phoneme_errors` (map ký tự IPA sai) → render bôi đỏ ký tự đúng theo `position` trong `phoneme_errors` (Text component tô màu từng ký tự dựa trên mảng, không phải 1 khối Text tĩnh).
7. Màn hình khoang miệng 3D (mô hình xoay dựng bằng Skia hoặc `<video>`/Lottie 3D-look nếu không cần xoay tương tác thật) — chỉ hiện khi user chạm vào 1 lỗi cụ thể trong danh sách `error_feedback`, không tự động hiện toàn bộ.

**C. AI Roleplay Companion (Premium)**:
8. Chọn kịch bản (`roleplay_scenarios`, lọc theo `cefr_level` ≤ trình độ user, `is_premium` khóa nếu Free) → tạo `roleplay_sessions` mới (`turn_count=0`).
9. Vào phòng roleplay: AI mở lời (`opening_line`) → mock qua custom hook `useRoleplaySocket()` bọc `setInterval` giả lập audio 2 chiều (khi có API thật thay bằng `WebSocket` thật) → mỗi lượt thoại tăng `turn_count`/`user_turn_count`.
   - ⚠️ User im lặng >3 giây → hiện chip gợi ý câu thoại (`setTimeout` 3s trong hook, `clearTimeout` nếu user bắt đầu nói lại trước khi hết giờ).
10. Kết thúc phiên (user bấm "Kết thúc" hoặc kịch bản đạt `conversation_goal`) → tính `overall_score`, `grammar_errors`, `vocab_suggestions`, `completion_rate` → cập nhật `roleplay_sessions` → màn hình tổng kết (tái dùng layout Kết quả Quiz H.3, đổi màu theo D).

### 6.4 Nhóm 3 — Vocabulary & Flashcard SRS (màn G)

**Bảng**: `content.topics/words/word_meanings/word_examples/phrases`, `learning.decks/deck_cards/srs_states/review_logs`.

**Công thức SM-2 bắt buộc code đúng (không được đơn giản hoá)**:
```
rating: 0=Again, 1=Hard, 2=Good, 3=Easy

nếu rating == Again (0):
  repetitions = 0
  interval_days = 1
  lapses += 1
else:
  nếu repetitions == 0: interval_days = 1
  nếu repetitions == 1: interval_days = 6
  nếu repetitions >= 2: interval_days = round(interval_days_cũ * ease_factor)
  repetitions += 1

  // cập nhật ease_factor theo rating (q quy đổi 0-5 chuẩn SM-2, ở đây map rating 1/2/3 -> q=3/4/5)
  q = {Hard: 3, Good: 4, Easy: 5}[rating]
  ease_factor_mới = ease_factor_cũ + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ease_factor = max(1.3, ease_factor_mới)   // chặn dưới 1.3 theo chuẩn SM-2

due_date = today + interval_days
srs_stage = 'new' nếu repetitions==0, 'learning' nếu interval_days<21, 'review' nếu >=21, 'mastered' nếu interval_days>=90 và repetitions>=3
mastered_at = set nếu vừa đạt 'mastered' lần đầu (giữ nguyên nếu đã có)
```
1. Vào bộ thẻ → hook `useSrsQueue(deckId)` (đọc trực tiếp từ `expo-sqlite` local DB, không qua network) load danh sách `srs_states` có `due_date <= today` của `deck_id`, sắp theo `due_date` tăng dần.
   - Không còn thẻ nào due → màn hình "Đã ôn xong hôm nay" (Sparky ăn mừng nhẹ, không confetti to — để dành confetti cho Quiz/Streak).
2. Lật thẻ (mặt trước → sau, Reanimated `useAnimatedStyle` với `rotateY` interpolation cho hiệu ứng lật 3D thật trên trục Y) → 4 nút đánh giá → gọi `reviewCard(cardId, rating)` → tính theo công thức trên **ngay trên client** (Offline-first — đây là yêu cầu rõ trong đặc tả) → ghi `review_logs` vào **Expo SQLite local** trước → thẻ tiếp theo trượt vào ngay (Reanimated `layout` transition), KHÔNG chờ round-trip mạng.
3. `useSyncQueue()` (Zustand store, đặt `src/core/flows/`) gom các `review_logs` chưa đồng bộ (`is_synced=false` — field nội bộ app, KHÔNG có trong schema gốc, chỉ tồn tại trong bảng SQLite local) → khi `@react-native-community/netinfo` báo có mạng trở lại, gửi hàng loạt lên server qua TanStack Query `useMutation`, đánh dấu đã đồng bộ.
   - ⚠️ Mock giả lập mất mạng giữa phiên ôn (toggle debug hoặc NetInfo mock) để test rõ hành vi offline-first này — bắt buộc có ít nhất 1 demo case trong mock data.
4. Quản lý sổ tay nâng cao (Web/Tablet, G.4): filter theo `srs_stage`, tìm kiếm, xuất CSV/PDF (mock: sinh file giả lập qua `expo-file-system`, có thể chỉ log console vì không có backend thật).
5. Chia sẻ bộ thẻ: sinh `shared_code` ngẫu nhiên 6 ký tự khi bật `is_public` → người khác nhập mã → tạo bản `decks` mới với `cloned_from` trỏ về deck gốc, copy toàn bộ `deck_cards` (không chia sẻ `srs_states` — người clone bắt đầu học lại từ đầu, đúng bản chất SRS cá nhân hoá).

### 6.5 Nhóm 4 — AI Quiz Generator & Mock Exam (màn H)

**Bảng**: `learning.quizzes/questions/attempts/attempt_answers`.

1. Dynamic Quiz: hook `useGenerateQuiz()` ưu tiên lấy từ có `srs_stage IN ('learning')` hoặc review gần nhất có `rating<=1 (Again/Hard)` trong `review_logs` của user → sinh 4-10 câu đa dạng loại hình → tạo `quizzes` (`quiz_type='dynamic'`, `ai_generated=true`) + `questions[]`.
2. Bắt đầu làm → tạo `attempts` (`status='in_progress'`, `started_at=now`) → mỗi câu trả lời tạo `attempt_answers` trong Zustand state cục bộ, chưa tính điểm ngay.
   - ⚠️ Thoát app giữa chừng → `attempts.status` giữ `in_progress` (persist qua MMKV), khi quay lại hỏi "Tiếp tục bài dở?" hoặc "Làm lại từ đầu" (huỷ attempt cũ, tạo mới).
3. Nộp bài → tính `score_pct`, `correct_count/wrong_count`, `skill_breakdown` → cập nhật `attempts.status='completed'`, `submitted_at=now`.
   - 🔀 Premium: gọi thêm AI sinh giải thích chi tiết cho từng câu sai (`explanation_vi` đã có sẵn trong `questions` mock, Premium mở khoá xem, Free chỉ thấy đúng/sai không thấy giải thích).
4. Mini Test Ngữ pháp: tương tự nhưng `quiz_type='grammar_mini'`, không sinh động theo SRS mà lấy từ ngân hàng câu hỏi cố định theo `cefr_level` chọn trước.
5. Mock Exam (H.4, Web chủ yếu nhưng vẫn cần luồng Mobile rút gọn): `quiz_type='mock_toeic'|'mock_ielts'` → có bộ đếm ngược thật (`setInterval` trong hook, hiển thị qua Reanimated animated text, 2 tiếng/3 tiếng, rút ngắn giả lập demo còn vài phút để test) → hết giờ **tự động** gọi hàm nộp bài y hệt bước 3, khoá mọi input ngay lập tức (prop `pointerEvents="none"` trên `View` bao ngoài toàn bộ form câu hỏi).

### 6.6 Nhóm 5 — AI Chatbot Companion (màn F)

**Bảng**: Mongo `chatbot_conversations`.

1. Hook `useChatQuota()`: Free giới hạn 20 tin nhắn/ngày (đếm số message `role='user'` có `sent_at` hôm nay trên toàn bộ `conversation_id` của user) — hết quota → input bị khoá, hiện paywall inline dưới ô nhập (không chặn xem lại lịch sử cũ).
2. Gửi tin nhắn → thêm vào `messages[]` cục bộ ngay (optimistic update của TanStack Query `useMutation` với `onMutate`) → gọi AI mock (delay 500ms–1.5s "Sparky đang suy nghĩ") → thêm message `role='assistant'` vào cuối.
   - 🔀 Premium bật Grammar Checker: trước khi gửi, kiểm tra câu user gõ → nếu `has_error=true` → hiện mini card sửa lỗi NGAY DƯỚI tin nhắn vừa gửi (không chặn gửi, chỉ gợi ý sau).
3. Chạm từ vựng gạch chân trong tin AI → popup nhanh (component `QuickWordPopup`, tái dùng ở cả Nhóm 5, 7 — giống Tap-to-Translate ở Nhóm 7) → nút lưu 1-chạm → tạo `learning.deck_cards` từ `referenced_word_ids`, đồng thời set `created_deck_id` cho message đó nếu là lần đầu lưu trong hội thoại (tạo deck mới tên "Từ vựng từ Chatbot" nếu user chưa chọn deck có sẵn).
4. Sentence Refactoring (Premium): chạm icon "Diễn đạt lại" trên tin nhắn user → `@gorhom/bottom-sheet` 2-3 gợi ý (`natural_alternatives`) → "Dùng câu này" → thay thế nội dung ô nhập hiện tại (chưa gửi lại), không tự động gửi hộ.

### 6.7 Nhóm 6 — AI Writing Checker (màn E)

**Bảng**: `ai_practice.submissions` + Mongo `writing_analyses`.

1. 🔀 Toàn bộ Nhóm 6 là Premium — Free chạm vào bất kỳ đâu trong tab Writing → Paywall ngay từ màn hình chọn loại bài, không cho gõ thử.
2. Chọn loại bài (Essay/Email/IELTS Task1/Task2) → mở Split-screen Editor (2 `View` chia đôi màn — RN không có sẵn split-view như 1 số framework khác, tự dựng bằng flexbox) → gõ bài (300–1000 từ) → `setInterval` auto-save mỗi 5–10 giây vào `submissions` (`is_draft=true`).
3. Bấm "Chấm bài" → tạo/cập nhật `submissions` (`is_draft=false`) → mock AI phân tích (delay 2–4s, dài hơn các luồng khác vì bài dài — hiện `ThinkingBubbleWidget` có progress % giả lập tăng dần chứ không đứng yên) → trả về `writing_analyses` đầy đủ theo cấu trúc Mục 8.2 của file `.sql` (mảng `errors[]`, `scoring_detail`, `vocabulary_upgrades[]`).
4. Render lỗi: gạch chân đúng màu theo `type` (đỏ=spelling, vàng=grammar, xanh dương=word_choice) tại đúng `position_start/position_end` trong text gốc (dựng bằng nhiều `<Text>` con lồng trong 1 `<Text>` cha, mỗi đoạn theo `position` có style riêng — RN cho phép nest `Text` để tô từng đoạn khác màu).
5. Bấm "Chấp nhận sửa" trên 1 lỗi → thay thế đoạn `original` bằng `suggestion` ngay trong vùng soạn thảo, đánh dấu `is_accepted=true` cho lỗi đó (chỉ ở Zustand state cục bộ, mock không cần gọi lại API).
6. Xem bản viết lại AI (`rewritten_text`) → so sánh 2 cột cuộn đồng bộ (2 `ScrollView`/`FlatList` đồng bộ `onScroll` qua `scrollTo` chéo nhau, hoặc dùng `react-native-reanimated` `useAnimatedScrollHandler` share 1 giá trị offset).

### 6.8 Nhóm 7 — Reading & Listening (màn I)

**Bảng**: `content.lessons` (loại reading/listening).

1. **Màn hình Cấu hình sinh bài đọc AI (Premium)**: trước khi vào thư viện có sẵn, cho phép chọn chủ đề (chip multi-select từ `content.topics`) + độ dài mong muốn (ngắn/vừa/dài) → AI sinh 1 bài đọc/audio mới phù hợp `cefr_level` hiện tại của user (dùng đúng field `content.lessons.lesson_type` + `content_blocks` JSON) → thêm vào thư viện cá nhân, không ảnh hưởng thư viện chung.
   - Free: chỉ dùng thư viện có sẵn (`is_free_preview=true` hoặc đã mua khoá học chứa bài đó), không được sinh bài mới.
2. Đọc bài: chạm từ bất kỳ → popup nhanh (nghĩa/IPA/nút lưu) — dùng đúng 1 component `QuickWordPopup` tái sử dụng ở cả Nhóm 5, 7.
3. Nghe bài: `expo-av` phát, `setOnPlaybackStatusUpdate` callback lấy `positionMillis` đồng bộ transcript, đổi tốc độ 0.75x–1.5x (`setRateAsync`) không làm gián đoạn playback (giữ nguyên vị trí % đã nghe khi đổi tốc độ).
4. Hoàn thành bài (đọc hết/nghe hết hoặc làm xong câu hỏi kèm theo nếu có) → cập nhật `learning.lesson_progress` (`status='completed'`, `xp_earned` cộng theo `lessons.xp_reward`).

### 6.9 Nhóm 8 — AI Personalized Learning Path

**Bảng**: `learning.daily_plans`, `learning.lesson_progress`.

1. Placement Test → xem Mục 6.1 bước 4-5.
2. **Màn Ma trận chẩn đoán lỗ hổng kiến thức (Knowledge Gap Analysis)**: khác với "Bảng phân tích học tập" (B.4, tổng quan chung), màn này tập trung vào **điểm yếu cụ thể** — heatmap dạng lưới các kỹ năng con (thì động từ, giới từ, phát âm nguyên âm dài...) x mức độ thành thạo (màu từ đỏ nhạt→xanh đậm, vẽ bằng Skia hoặc lưới `View` với màu nội suy `interpolateColor` của Reanimated), tính từ tổng hợp `skill_breakdown` trong `attempts` + `skill_tag` trong `questions` sai nhiều lần. Chạm 1 ô → xem danh sách câu/từ liên quan từng sai.
3. Hook `useDailyPlan()` (chạy mỗi sáng, mock bằng nút "Làm mới kế hoạch" thay vì cron thật): tính `flashcard_target` = số thẻ due hôm nay (không vượt quá ngưỡng hợp lý vd 30), `quiz_target` dựa vào `weak_skill_focus` lấy từ bước 2, cân đối `estimated_time_min` theo tổng 2 mục trên.
4. 🔀 Premium: `ai_notes` sinh nhận xét tuỳ biến (vd: "Hôm nay tập trung thì hiện tại hoàn thành vì bạn sai 4/5 câu tuần này"); Free chỉ thấy chỉ tiêu số, không có nhận xét text.
5. Hoàn thành từng phần trong ngày → `flashcard_done`/`quiz_done` cộng dồn real-time (TanStack Query invalidate + refetch tự động, không cần pull-to-refresh thủ công) → khi cả 2 đạt target → `plan_status='completed'` → confetti nhỏ (Lottie) trên card "Kế hoạch hôm nay" ở Home.

### 6.10 Nhóm 9 — Gamification & Động lực học tập (màn J)

**Bảng**: `learning.user_stats/league_rooms/league_members/badge_definitions/user_badges/daily_challenges` + Redis `leaderboard:{league_room_id}`.

1. **XP**: mọi hành động hoàn thành (bài học, quiz, roleplay, lesson đọc/nghe) cộng XP theo bảng quy đổi cố định phải định nghĩa rõ trong code (vd: hoàn thành bài học=`lessons.xp_reward`, quiz đạt≥passing_score=10, roleplay hoàn thành=15...) — **liệt kê rõ bảng quy đổi này thành 1 file `src/core/constants/xpRules.ts` duy nhất**, không rải rác từng feature tự cộng số tuỳ ý.
2. `xp_total`/`xp_this_week` cộng đồng thời; `level` tính lại theo công thức bậc thang (vd: `level = Math.floor(Math.sqrt(xp_total / 100)) + 1`) — chọn công thức rồi giữ nhất quán, ghi rõ trong code.
3. **Streak**: mỗi ngày có ≥1 hoạt động học (bất kỳ Nhóm nào) → `streak_current += 1`; qua nửa đêm không hoạt động → reset về 0 trừ khi user có `streak_freeze_count > 0` → tự động trừ 1 freeze thay vì mất streak (không cần user bấm gì, xử lý ngầm) → hiện thông báo "Đã dùng 1 lượt đóng băng streak" khi mở app lại.
4. **League**: mỗi tuần mới (mock: nút "Bắt đầu tuần mới" debug) → chia user vào `league_rooms` 30 người theo `league` hiện tại → cập nhật `xp_this_week` **realtime qua mock `WebSocket`/polling ngắn** giả lập Redis ZSET (không cần Redis thật trong mock, chỉ mô phỏng hành vi cập nhật tức thời) → cuối tuần: top 3 (`promotion_zone`) lên hạng, đáy bảng (`relegation_zone`) xuống hạng, cộng Coin cho top 3.
5. **Coin Shop**: mua Streak Freeze/Avatar/Theme → trừ `coins`, thêm vật phẩm vào inventory cục bộ (mock, không có bảng inventory riêng trong schema — lưu trong MMKV/state mở rộng phía client, ghi rõ giả định này trong code comment vì ngoài phạm vi schema gốc).
6. **Badge**: điều kiện mở khoá kiểm tra theo `condition_type`/`condition_value` (vd: `condition_type='streak_days'`, `condition_value=7`) sau mỗi hành động liên quan → đạt điều kiện → tạo `user_badges` + popup mở khoá full-screen (Modal RNR, không phải toast nhỏ — đây là khoảnh khắc ăn mừng lớn, kèm Lottie + haptic mạnh hơn mức micro-interaction thường).

### 6.11 Nhóm 10 — Theo dõi tiến độ & Nhắc nhở thông minh

**Bảng**: `learning.daily_learning_stats`, `notification.push_tokens/user_settings/templates`.

1. Dashboard phân tích (B.4): tổng hợp `daily_learning_stats` 7/30 ngày gần nhất cho bar chart (Skia), tổng hợp `skill_scores` trung bình cho radar (Skia).
2. **Trung tâm thông báo (Notification Center)** — màn hình MỚI hoàn toàn: icon chuông trên Header, badge số đỏ = số thông báo `is_read=false` (field nội bộ app, không có trong schema gốc — ghi rõ giả định). Danh sách nhóm theo ngày (Hôm nay/Hôm qua/Cũ hơn), mỗi item icon theo `notification_type` (streak=lửa cam, leaderboard=cúp vàng, reminder=chuông teal, achievement=huy hiệu, marketing=loa). Chạm vào 1 thông báo → điều hướng đúng route liên quan (deep-link nội bộ qua `expo-router`, vd thông báo streak → mở Home tab Streak).
3. "Khung giờ vàng" (`ai_detected_hour`): mock tính bằng cách lấy giờ xuất hiện nhiều nhất trong lịch sử `study_sessions.started_at` giả lập → tự đề xuất trong màn Cài đặt thông báo (K.2), user có thể chấp nhận đề xuất hoặc tự chọn giờ khác.
4. Cài đặt Quiet Hours: trong khoảng `quiet_hours_start`–`quiet_hours_end` → mọi push (trừ loại khẩn nếu có) bị hoãn tới hết khung giờ, không gửi im lặng (mock: chỉ log lại là "đã hoãn", hiển thị trong Notification Center khi khung giờ kết thúc).

### 6.12 Nhóm 13 — Mạng xã hội & Kết bạn qua Số điện thoại/Tên

**Bảng**: `social.*`, `auth.users` (đọc `phone`/`username`/`display_name`).

**A. Tìm kiếm hợp nhất theo Tên HOẶC Số điện thoại**:
1. Màn "Bạn bè & Theo dõi" (N.4) — 1 `Input` tìm kiếm DUY NHẤT trên cùng (không tách 2 ô riêng cho tên/SĐT — trải nghiệm giống Zalo/Messenger: gõ gì tìm nấy).
2. Hook `useFriendSearch()` phân loại input theo regex khi debounce 300ms kết thúc (viết tay bằng `setTimeout`/`useDeferredValue`, không thêm package ngoài):
   - Input chỉ gồm số (+ dấu `+` đầu) → chuẩn hoá theo E.164 (`react-native-phone-number-input`) → tìm khớp **chính xác tuyệt đối** `auth.users.phone` (không tìm gần đúng/số con — lý do bảo mật, tránh dò quét số điện thoại người khác theo kiểu brute-force từng chữ số).
   - Input có chữ → tìm `LIKE` không phân biệt hoa thường trên `username` HOẶC `display_name` (tìm gần đúng bình thường, không giới hạn khớp tuyệt đối như SĐT).
3. ⚠️ Tìm theo SĐT nhưng không thấy kết quả → **không** hiện "Không tìm thấy người dùng này" trần trụi (rò rỉ thông tin số đó có tồn tại hay không trong hệ thống hay không tùy theo cách phản hồi) — luôn hiện đồng nhất 1 thông điệp trung tính "Không có kết quả phù hợp" giống hệt trường hợp tìm theo tên không thấy, để không lộ việc 1 số điện thoại cụ thể có/không đăng ký tài khoản.
4. Kết quả tìm thấy → card user (avatar, tên, 1 dòng CEFR/streak công khai) + nút trạng thái động theo `social.friendships`/`user_follows` hiện tại giữa 2 người: `Kết bạn` (chưa có quan hệ) / `Đã gửi lời mời` (mình vừa gửi, disable nút) / `Chấp nhận` (đối phương đã gửi cho mình trước) / `Bạn bè` (đã `accepted`).

**B. Luồng gửi/chấp nhận lời mời kết bạn**:
5. Bấm "Kết bạn" → tạo `social.friendships` (`status='pending'`, `requested_by=mình`) → optimistic update (TanStack Query `onMutate`) đổi nút ngay thành "Đã gửi lời mời" → đồng thời tạo 1 thông báo (`notification_type` mới ở phía app, map logic sang loại `achievement`/`system` gần nhất nếu không muốn sửa schema, hoặc ghi chú đề xuất bổ sung giá trị enum `friend_request` cho `notification.templates.notification_type` — nêu rõ đây là đề xuất mở rộng schema nhỏ, không tự ý sửa file `.sql` gốc) cho người nhận.
6. Người nhận vào tab "Lời mời" (badge số đỏ nếu có `pending` mới) → 2 nút Chấp nhận/Từ chối:
   - Chấp nhận → `status='accepted'`, `responded_at=now` → card trượt sang tab "Bạn bè" kèm confetti nhỏ (Lottie) cục bộ.
   - Từ chối → xoá bản ghi `friendships` (không giữ lại trạng thái `rejected` vì schema chỉ có `pending/accepted/blocked` — từ chối = xoá để cho phép gửi lại lời mời sau này).
7. ⚠️ Cả 2 người cùng lúc bấm "Kết bạn" với nhau trước khi thấy lời mời của đối phương (race condition) → khi 1 trong 2 tạo request thì phía kia đã có sẵn 1 request `pending` (`requested_by` là mình) → hook phải kiểm tra chiều ngược lại TRƯỚC khi tạo mới, nếu đã tồn tại request ngược chiều thì **tự động chuyển thành accepted** luôn thay vì tạo 2 bản ghi trùng lặp.

**C. Theo dõi (Follow) — độc lập với Kết bạn**:
8. Nút Follow tách biệt hoàn toàn khỏi luồng kết bạn (1 chiều, không cần chấp nhận) → optimistic update đổi "Theo dõi"→"Đang theo dõi" ngay, rollback (TanStack Query `onError` revert cache) nếu mock random fail 5%.

**D. Feed, bình luận, báo cáo**: giữ nguyên luồng đã mô tả ở bản v2 (N.1–N.3, N.5) — không đổi.

### 6.13 Nhóm 15–16 — IoT NFC & Smart Mirror (màn J.4, tóm tắt vì phần cứng ngoài phạm vi code RN thuần)

1. **Provisioning (gán thẻ mới)**: vào "Quản lý thẻ NFC" → nút "+ Gán thẻ mới" → hướng dẫn đưa điện thoại lại gần chip → `react-native-nfc-manager` đọc được `nfc_uid` (mock: giả lập delay rồi trả UID ngẫu nhiên khi chạy trên simulator không có NFC thật) → chọn 1 từ vựng + đặt `label` (vd "Tủ lạnh") → tạo `ai_practice.nfc_tags`.
2. **Trigger học tức thì**: chạm thẻ đã gán → app tự mở (mock: nút debug "Giả lập chạm thẻ X" vì không thể test NFC thật trong môi trường preview) → bật Flashcard đúng `word_id`, phát TTS (`expo-speech`), cộng ngay 5 XP (đây là XP duy nhất được đặc tả nêu rõ con số cụ thể — dùng đúng 5, không tự đổi), cập nhật `tap_count += 1`, `last_tapped_at=now`.
3. **Roleplay theo vị trí (Premium)**: nếu `nfc_tags.label` khớp 1 kịch bản định sẵn (vd "Máy pha cà phê" → kịch bản "Gọi đồ uống") → mở thẳng Roleplay (Mục 6.3.C) thay vì Flashcard.
4. Smart Mirror: chỉ cần 1 màn hình cấu hình phía Mobile "Kết nối Gương" (nhập mã ghép nối / quét QR mock qua Vision Camera) — phần hiển thị chạy trên thiết bị gương không thuộc phạm vi code React Native mobile, chỉ mô tả API `smart_mirror_sessions` mà mobile app đọc để hiện trạng thái "Gương đang kết nối" trong Cài đặt.

### 6.14 Premium Paywall & Thanh toán (màn K.3–K.4)

**Bảng**: `payment.orders/subscriptions/coupons/coupon_usages`.

1. Mọi điểm 🔀 Premium ở các mục trên đều gọi chung 1 hook `usePaywall().show({ trigger: PaywallTrigger.xxx })` — TypeScript enum liệt kê rõ điểm gọi (`scanDetail`, `speakingDeepAnalysis`, `roleplay`, `writing`, `chatbotGrammarCheck`, `readingGenerator`...) để log/analytics sau này biết tính năng nào thúc đẩy nâng cấp nhiều nhất. Paywall hiển thị dưới dạng Modal full-screen (RNR `Dialog`/`Sheet`) từ store `src/core/flows/paywallStore.ts`.
2. Chọn gói → nhập coupon (tuỳ chọn) → hook `useApplyCoupon()` validate: còn hạn (`valid_from/valid_until`), chưa vượt `max_uses`/`max_uses_per_user`, đơn hàng đạt `min_order_vnd`, đúng `plan_ids` áp dụng → hợp lệ → tính `discount_amount`, hiện giá gạch ngang.
3. Bấm thanh toán → tạo `payment.orders` (`status='pending'`) → mock chuyển qua "cổng thanh toán" (giữ nguyên logo gốc VNPay/MoMo/Stripe/ZaloPay) → giả lập callback thành công sau 2-3s → `status='success'` → tạo/cập nhật `payment.subscriptions` (`status='active'`, tính `current_period_end` theo gói) → cập nhật `auth.users.plan`/`plan_expires_at` → mọi `usePaywall()` từ giờ tự động không còn chặn nữa (TanStack Query invalidate `queryKey: ['current-user']` để đọc lại `plan` mới nhất).
   - ⚠️ Mock random fail thanh toán 10% → `status='failed'` → hiện màn hình lỗi thanh toán rõ ràng + nút "Thử lại"/"Đổi phương thức khác", **không** âm thầm coi như thành công.
4. Huỷ gói (Cài đặt) → `cancel_at_period_end=true`, KHÔNG hạ quyền ngay — user vẫn dùng Premium tới hết `current_period_end` mới revert `plan='free'` (mock: nút debug "Tua tới hết hạn" để test revert).

### 6.15 Mời bạn bè nhận thưởng (Referral)

**Bảng**: `auth.users.referral_code/referred_by`, cộng Coin (liên kết Mục 6.10).

1. Màn "Mời bạn bè" trong Hồ sơ: hiện `referral_code` riêng của user dạng lớn + nút Copy (`expo-clipboard`, thêm 1 dòng vào bảng package Mục 2.3) + nút Chia sẻ (`Share` API built-in của `react-native`).
2. Người được mời nhập `referral_code` lúc đăng ký (bước tuỳ chọn trong màn A.4) → khi tài khoản mới hoàn tất Placement Test (Mục 6.1 bước 5) → set `referred_by` = user_id của người giới thiệu.
3. Thưởng: cả người giới thiệu và người được giới thiệu đều +50 Coin (con số ví dụ, ghi rõ đây là **giả định hợp lý do đặc tả không nêu con số cụ thể**, cần xác nhận lại với yêu cầu thật khi có backend, không khẳng định chắc như đinh đóng cột).
4. Màn "Mời bạn bè" hiện thêm danh sách rút gọn "Đã mời N người" (đếm `auth.users` có `referred_by = mình`).

---

## 7. TOÀN BỘ MÀN HÌNH (A–S + T + Admin Blocked) — mỗi màn tham chiếu ngược luồng ở Mục 6

> Quy tắc: **Sinh code màn nào, sinh cả `application/` (logic Mục 6, Zustand store/TanStack Query hook) lẫn `presentation/` (UI dưới đây, screen component + route file mỏng trong `app/`) cho màn đó cùng lúc** — không tách rời 2 lần chạy. Với animation, áp dụng đúng quy tắc Mục 4 (mỗi 🎬 phải có code Reanimated/Skia/Lottie thật, không mô tả suông).

### 7.1 Danh sách nhóm màn hình — vai trò truy cập & luồng logic tương ứng

**Cột "Vai trò"**: mọi nhóm A→S đều là màn hình của **Mobile App**, và trừ khi ghi chú khác, **chỉ `role='student'` truy cập được** (đúng theo Mục 0.2). Nhóm T là ngoại lệ duy nhất dành cho `role='teacher'`.

| Nhóm | Số màn | Vai trò truy cập | Luồng logic tương ứng (Mục 6) |
| --- | --- | --- | --- |
| A. Onboarding & Đăng nhập | 5 màn (Splash, Chọn mục tiêu, Giới thiệu Placement Test, Đăng ký/Đăng nhập, Kết quả xếp hạng) | `student` (đăng ký mới mặc định `role='student'` — không có lựa chọn đăng ký làm Giáo viên/Admin trên Mobile) | 6.1 |
| B. Trang chủ/Lộ trình học | 4 màn (Home, Thử thách hàng ngày, Chi tiết bài học, Bảng phân tích học tập) | `student` | 6.9, 6.10, 6.11 |
| C. Nhận diện ảnh AI | 4 màn (Quét camera, Kết quả nhận diện, Chi tiết từ, Lưu Flashcard) | `student` | 6.2 |
| D. Luyện nói & Phát âm AI | 5 màn (Chấm từ đơn, Kết quả chi tiết, Hướng dẫn khoang miệng, Roleplay chọn kịch bản, Roleplay đang diễn ra) | `student` | 6.3 |
| E. Kiểm tra & Chấm bài viết AI | 4 màn (Chọn loại bài, Split-screen editor, Chi tiết điểm số, So sánh bản viết lại) | `student` | 6.7 |
| F. Chatbot đồng hành AI | 3 màn (Danh sách hội thoại, Chat chính, Popup Sentence Refactoring) | `student` | 6.6 |
| G. Flashcard SRS & Quản lý bộ thẻ | 5 màn (Danh sách bộ thẻ, Ôn tập lật thẻ, Thư viện chủ đề, Lưới quản lý nâng cao, Tra từ điển nhanh) | `student` | 6.4 |
| H. Quiz & Thi thử | 4 màn (Trang chủ Quiz, Đang làm quiz, Kết quả + giải thích, Thi thử Web) | `student` | 6.5 |
| I. Luyện Đọc & Nghe | 3 màn (Thư viện đọc/nghe, Đọc chạm để dịch, Audio Karaoke-Sync) | `student` | 6.8 |
| J. Gamification, Xếp hạng & IoT | 4 màn (Giải đấu tuần, Cửa hàng Coin, Trang huy hiệu, NFC/Gương thông minh) | `student` | 6.10, 6.13 |
| K. Hồ sơ, Cài đặt & Premium | 4 màn (Hồ sơ, Cài đặt thông báo, Bảng giá Premium, Thanh toán) | `student` | 6.11, 6.14 |
| N. Mạng xã hội & Cộng đồng | 5 màn (Feed, Chi tiết bài đăng, Tạo bài đăng, Bạn bè & Theo dõi — **UI cập nhật ở Mục 7.2 bên dưới**, Báo cáo & Kiểm duyệt) | `student` | 6.12 |
| O. Trung tâm thông báo | 2 màn | `student` (bản riêng cho `teacher` xem ở nhóm T.3, dùng lại UI nhưng lọc `notification_type` khác) | 6.0.C, Mục 7.3 |
| P. Đang làm bài Placement Test | 2 màn | `student` | 6.1 |
| Q. Ma trận chẩn đoán lỗ hổng kiến thức | 1 màn | `student` | 6.1, Mục 7.3 |
| R. Mời bạn bè (Referral) | 1 màn | `student` | Mục 7.3 |
| S. Lớp học & Bài tập được giao | 4 màn (S.0 Danh sách lớp của tôi, S.1 Nhập mã lớp, S.2 Chi tiết lớp, S.3 Danh sách bài tập) | `student` | 6.0.B, 6.0.C |
| T. Teacher Companion (rút gọn, read-only) | 3 màn (T.1 Danh sách lớp, T.2 Chi tiết lớp rút gọn, T.3 Thông báo Giáo viên) | `teacher` — CHỈ vai trò này, Student/Admin không vào được nhóm route `(teacher-companion)` | 6.0.A, Mục 0.2.2 |
| Admin Blocked Screen | 1 màn | `admin` — CHỈ vai trò này | 6.0.A, Mục 0.2.3 |
| L. Web Portal — Landing SEO | wireframe/spec (Next.js) | Khách vãng lai + mọi vai trò (SEO công khai) | Nhóm 11 đặc tả |
| M. Web Portal — Dashboard Giáo viên & Admin | wireframe/spec (Next.js) — **đây mới là nơi Giáo viên/Admin thao tác ĐẦY ĐỦ**, nhóm T ở Mobile chỉ là bản rút gọn read-only | `teacher` (quản lý lớp) / `admin` (CMS/hệ thống) | Nhóm 12, 14 đặc tả |

> **Chi tiết UI/animation từng màn nhóm A–N**: giữ nguyên toàn bộ tinh thần đặc tả màu sắc/animation/bố cục đã thống nhất ở bản UI gốc (`SmartEnglishAI_Stitch_Prompt_VI.md`/bản UI Flutter v2) — khi implement, đọc song song để lấy chi tiết từng màn, chỉ thay thuật ngữ kỹ thuật theo bảng chuyển đổi Mục 2 (vd "CustomPainter" → Skia, "AnimatedContainer" → Reanimated `useAnimatedStyle`, "Hero" → Reanimated `layout` transition...).

### 7.2 Cập nhật màn N.4 "Bạn bè & Theo dõi" — mô tả UI đầy đủ

**Bố cục**: Header có 1 `Input` tìm kiếm full-width auto-focus khi chạm (không phải icon kính lúp mở trang riêng — tìm ngay tại chỗ giống Zalo). Dưới ô tìm kiếm là 3 tab (RNR `Tabs`): "Bạn bè" / "Lời mời" (badge đỏ) / "Gợi ý".

- Khi gõ vào ô tìm kiếm: 3 tab tạm ẩn, thay bằng danh sách kết quả tìm kiếm realtime (debounce 300ms). Mỗi kết quả hiện 1 **chip nhỏ phía dưới tên** báo đang khớp theo gì: "Khớp số điện thoại" (icon SĐT teal, Lucide `Phone`) hoặc "Khớp tên người dùng" (icon @ cam, Lucide `AtSign`) — giúp người dùng phân biệt rõ, tránh nhầm kết bạn sai người trùng tên.
- Ô input tự nhận diện định dạng: đang gõ toàn số → hiện gợi ý định dạng SĐT nhỏ bên dưới (`+84 xxx xxx xxx`) qua `react-native-phone-number-input` — không bắt user tự gõ đúng định dạng quốc tế.
- 🎬 Kết quả tìm kiếm fade+trượt lên từng item so le — dùng Reanimated `entering={FadeInDown.delay(index * 50)}` trên mỗi item của `FlatList` (thay `flutter_staggered_animations`), giống Y hệt hiệu ứng tra từ điển nhanh G.5 để nhất quán cảm giác "tìm kiếm" xuyên app.
- Tab "Lời mời": mỗi card có 2 nút nhỏ Chấp nhận (RNR `Button` variant `default` màu cam đặc)/Từ chối (`variant="outline"` viền xám) cạnh nhau, KHÔNG dùng gesture vuốt để xoá (`Swipeable` của `react-native-gesture-handler`) — dễ bấm nhầm với thao tác cuộn danh sách bạn bè dài.
- 🎬 Chấp nhận: card hiện tại co lại về 0 chiều cao (Reanimated `useAnimatedStyle` animate `height`/`opacity` về 0, hoặc dùng `exiting={FadeOutUp}`) đồng thời 1 card y hệt "bay" sang phía tab Bạn bè (Reanimated `layout={LinearTransition}` giữa vị trí cũ/mới, cần lưu vị trí scroll của cả 2 tab trong Zustand store để giữ scroll offset khi chuyển tab trong lúc animate — thay `PageStorageKey` của Flutter) + Lottie confetti scope nhỏ tại vị trí card cũ.
- Tab "Gợi ý": card user + nút Follow đơn (không phải Kết bạn) — gợi ý dựa mock theo cùng `cefr_level`/cùng lớp học `teacher.class_members` nếu có, giữ đúng logic optimistic update ở Mục 6.12.C.

### 7.3 Màn hình HOÀN TOÀN MỚI (chưa tồn tại ở bản v2 gốc)

**O. Trung tâm thông báo** (`notification-center`, dark-mode KHÔNG áp dụng — luôn nền sáng dù mở từ đâu):
1. Header "Thông báo" + nút "Đánh dấu đã đọc tất cả" góc phải. Danh sách nhóm sticky-header theo ngày (Hôm nay/Hôm qua/7 ngày qua) — dùng `SectionList` built-in của React Native với prop `stickySectionHeadersEnabled` (tương đương chính xác `SliverList` + `SliverPersistentHeader` của Flutter, không cần thư viện ngoài). Item chưa đọc = chấm cam nhỏ trái + nền `surface` đậm hơn 4%; đã đọc = nền trắng thường.
   _Chi tiết kỹ thuật: chấm chưa đọc dùng Reanimated `useAnimatedStyle` animate `opacity` về 0 khi chạm đọc._
2. Empty state: Sparky "buồn nhẹ" (không phải trạng thái "buồn" dành cho mất streak — dùng tư thế trung tính hơn nếu bộ Lottie có, hoặc tái dùng "suy nghĩ") + text "Chưa có thông báo nào".

**P. Đang làm bài Placement Test** (`onboarding`, tách khỏi Quiz thường vì không cho xem lại câu trước):
1. Progress dạng thanh ngang liên tục trên cùng (khác chấm tròn của Quiz H.2 — cố ý khác để user cảm nhận đây là bài test nghiêm túc hơn quiz luyện tập thường ngày), không hiện số câu còn lại cụ thể (giảm áp lực).
   _Chi tiết kỹ thuật: `View` bo góc màu Teal, animate `width`% mượt bằng Reanimated `withTiming` khi chuyển câu._
2. Câu hỏi full-screen, không có nút "Quay lại" mặc định trên Header — thay bằng icon "X" (Lucide) mở dialog xác nhận thoát (Mục 6.1 bước 4).

**Q. Ma trận chẩn đoán lỗ hổng kiến thức** (`learning-path`):
1. Lưới heatmap: hàng = nhóm kỹ năng (Thì động từ, Giới từ, Mạo từ, Phát âm nguyên âm, Phát âm phụ âm cuối...), cột = mức thành thạo 5 bậc màu từ Coral nhạt → Leaf Green đậm.
   _Chi tiết kỹ thuật: lưới ô vuông bo góc nhỏ dựng bằng `View`/`Pressable` trong `FlatList numColumns` hoặc vẽ trực tiếp bằng Skia `Canvas` nếu số ô lớn (>100 ô, để tối ưu hiệu năng hơn render nhiều `View`); màu nội suy qua `interpolateColor` của Reanimated theo % thành thạo tính từ mock; chạm ô → `@gorhom/bottom-sheet` liệt kê câu/từ sai liên quan (tái dùng RNR `Accordion` style H.3)._
2. 🎬 Vào màn lần đầu trong phiên: các ô "nhuộm màu" tuần tự từ trái sang phải, trên xuống dưới, trễ 40ms/ô (Reanimated `entering={FadeIn.delay(index * 40)}` trên từng ô) — tạo cảm giác "AI đang phân tích ra bạn".

**R. Mời bạn bè (Referral)** (`referral`):
1. Card lớn gradient cam-vàng (`expo-linear-gradient`, giống style Sparky, đây là 1 trong số ít nơi được dùng gradient ngoài Sparky/ảnh bìa hồ sơ — vì mục đích khuyến khích chia sẻ cần nổi bật) chứa mã `referral_code` monospace lớn + nút Copy (`expo-clipboard`, đổi icon thành tick xanh 1.5s bằng `setTimeout` + state, tái dùng pattern T.1 Teacher Companion Join Code) + nút Chia sẻ.
2. Danh sách "Đã mời N người" dạng `FlatList` đơn giản avatar+tên+ngày tham gia, không cần animation phức tạp.

### 7.3b Chi tiết UI nhóm S — Lớp học & Bài tập được giao (`role='student'`)

**S.0 Danh sách lớp của tôi** (entry point từ `Profile` K.1, thêm 1 dòng menu "Lớp học của tôi" + icon Lucide `GraduationCap`): `FlatList` card, mỗi card = 1 lớp đang tham gia — tên lớp, avatar nhóm nhỏ + tên giáo viên, badge tròn cam nhỏ góc phải card = số bài tập `pending`. Nút nổi (FAB — `Pressable` position `absolute` góc dưới-phải, style theo token) "+ Tham gia lớp mới" → mở S.1.
- Empty state (chưa tham gia lớp nào): Sparky "suy nghĩ" + text "Bạn chưa tham gia lớp học nào" + CTA "Nhập mã lớp".

**S.1 Nhập mã lớp**: `@gorhom/bottom-sheet` đơn giản — 1 `Input` (RNR) lớn giữa màn font monospace chữ hoa tự động, dưới là helper text "Hỏi giáo viên để lấy mã lớp 6-10 ký tự". Nút "Tham gia" pill cam full-width, disabled (xám) tới khi đủ ký tự tối thiểu. 🎬 Submit lỗi → `Input` shake nhẹ ngang 3 lần (Reanimated `withSequence` translateX) + viền đỏ; thành công → sheet đóng lại kèm Lottie confetti mini + điều hướng thẳng S.2.

**S.2 Chi tiết lớp**: Header hiện tên lớp + tên giáo viên + `cefr_target` dạng badge nhỏ. 2 tab (RNR `Tabs`): "Bài tập" (→ S.3) / "Thành viên" (`FlatList` đơn giản avatar+tên, không có hành động gì thêm — chỉ xem). Nếu `class_members.role='assistant_teacher'` của user hiện tại trong lớp này → hiện thêm nút "📌 Ghim thông báo lớp" trên Header (Mục 0.2 điểm cuối bảng).

**S.3 Danh sách bài tập**: `FlatList` item mỗi bài tập — icon trái theo `assignment_type` (dùng đúng icon nhóm H/G/E/D/I tương ứng để nhất quán ngôn ngữ hình ảnh), tên bài tập, đếm ngược `due_date` màu theo mức khẩn (Teal còn nhiều ngày / Amber ≤1 ngày / Coral quá hạn), badge trạng thái pill nhỏ bên phải (Chưa làm=xám / Đang làm=cam outline / Đã nộp=teal / Đạt=xanh lá đặc / Chưa đạt=đỏ đặc). 🎬 Chạm item "Chưa làm" → điều hướng ngay vào route chức năng gốc tương ứng theo Mục 6.0.C bước 7 (transition slide chuẩn của Expo Router Stack, không animation riêng); chạm item "Đã nộp/Đạt/Chưa đạt" → mở màn xem lại kết quả (tái dùng đúng màn kết quả gốc của Quiz/Writing/Roleplay ở chế độ read-only, ẩn nút làm lại nếu đã `is_graded=true` và quá `due_date`).

### 7.3c Chi tiết UI nhóm T — Teacher Companion (`role='teacher'`, rút gọn read-only)

**Tông màu riêng biệt Teacher Companion**: vẫn dùng đúng bảng màu Mục 5 (không tạo bảng màu mới) nhưng **thiên về Deep Teal làm chủ đạo thay vì Momentum Orange** (đảo trọng số 2 màu so với giao diện Student) để tạo cảm giác "chế độ khác, nghiêm túc hơn" ngay từ cái nhìn đầu, tránh Giáo viên nhầm lẫn đang ở chế độ học tập của học viên.

**T.1 Danh sách lớp**: Header không có icon chuông/tìm kiếm kiểu Student (Mục 1 điều hướng gốc) — thay bằng Header tối giản chữ "Lớp học của tôi" + icon mở Drawer (`@react-navigation/drawer`) bên trái. `FlatList` card lớp — tên lớp, sĩ số `hiện tại/max_students` dạng "24/30", badge số bài tập có `due_date` trong 48h tới (màu Amber nếu >0). Mỗi card có 1 dòng nhỏ cuối "Chạm để xem chi tiết — chỉnh sửa trên Web Portal" (chữ xám nhỏ, nhắc nhở giới hạn quyền ngay tại chỗ thay vì để giáo viên bấm thử rồi mới biết không làm được gì).

**T.2 Chi tiết lớp (rút gọn)**: Bảng dữ liệu đơn giản 3 cột cố định (Học viên / % hoàn thành dạng thanh mini-progress ngang / Cờ cảnh báo), KHÔNG có ô nào bấm sửa được, hàng học viên nguy cơ bỏ học có dải Coral nhạt bên trái (tái dùng đúng pattern cảnh báo đã mô tả cho Web Admin). Nút cố định đáy màn "Mở Web Portal để chấm điểm & giao bài" (RNR `Button variant="outline"` viền Teal, không phải CTA cam — đây không phải hành động khuyến khích làm trên Mobile mà là lối thoát sang đúng kênh, gọi `Linking.openURL()`).

**T.3 Thông báo Giáo viên**: Tái dùng 100% component `notification-center` (Mục O) — `SectionList` sticky header theo ngày, chấm chưa đọc — chỉ khác nguồn dữ liệu lọc theo `notification_type` dành cho Teacher (`student_at_risk`, `assignment_submitted`...). ⚠️ *GIẢ ĐỊNH NGOÀI SCHEMA GỐC* (nhắc lại từ Mục 0.2.2).

**Điều hướng Teacher Companion**: Drawer Navigator (`@react-navigation/drawer`, không phải bottom tab) — 3 mục "Lớp học" (T.1) / "Thông báo" (T.3) / "Đăng xuất". Đây là khác biệt bố cục cố ý để không thể nhầm với 5-tab bottom bar của Student.

### 7.3d Admin Blocked Screen (`role='admin'`)

1 màn tĩnh, không Header/nav gì cả — chỉ `View` căn giữa màn: icon khóa lớn (Lucide `Lock`) màu `neutralGray`, text "Tài khoản Quản trị viên chỉ được sử dụng trên Web Portal" (font body, không phải heading to màu mè), dưới là RNR `Button variant="outline"` "Đăng xuất" viền xám. Nền `surface` trơn, không mascot, không màu nhấn Orange/Teal nào — cố ý "lạnh" để không giống bất kỳ màn nào khác trong app, tránh admin hiểu nhầm đây là 1 tính năng đang "thiếu nội dung" (empty state) thay vì 1 chặn truy cập có chủ đích.

### 7.4 Cấu hình sinh bài đọc AI (bổ sung vào nhóm I, không tách nhóm riêng)

Thêm màn **I.0 Cấu hình bài đọc mới (Premium)** trước màn I.1: chip chủ đề multi-select cuộn ngang (`FlatList horizontal`, tái dùng style chip từ Onboarding A.2), 3 lựa chọn độ dài dạng segmented (RNR `Tabs`/`SegmentedControl` — Ngắn/Vừa/Dài), nút "Tạo bài đọc" pill cam full-width dính đáy. Bấm tạo → loading `ThinkingBubbleWidget` → điều hướng thẳng vào màn Đọc (I.2) với bài vừa sinh, đồng thời thêm bài vào đầu danh sách Thư viện (I.1, TanStack Query cache update) khi quay lại.

---

## 8. MOCK DATA — quy tắc & bộ dữ liệu bắt buộc

Quy tắc nền: 1 user demo xuyên suốt, số liệu hợp lý như người thật (không lorem ipsum, không số tròn giả), ≥1 trường hợp lỗi/rỗng cho mỗi luồng chính để test đủ UI trạng thái biên. Mock data viết bằng TypeScript (`src/features/*/data/fakeData.ts`), type theo đúng interface/Zod schema khớp cột `.sql`, nạp qua `axios-mock-adapter` (network layer) hoặc trực tiếp seed vào `expo-sqlite` (cho phần offline SRS). **Bắt buộc có thêm trong bộ Mock Data Set**:

- ≥3 lời mời kết bạn `pending` (ít nhất 1 do mình gửi, ít nhất 1 người khác gửi cho mình) để test đủ nhánh UI Mục 7.2.
- 1 user demo phụ có `phone` set sẵn để test luồng tìm kiếm theo SĐT (Mục 6.12.A) ra kết quả thật, và 1 số điện thoại **không tồn tại** trong mock để test thông điệp trung tính "Không có kết quả phù hợp".
- ≥5 thông báo mock đủ các `notification_type`, ít nhất 2 chưa đọc, trải trên ≥2 ngày khác nhau để test nhóm sticky-header Mục O.
- 1 attempt Placement Test hoàn chỉnh kèm `skill_breakdown` đủ dữ liệu vẽ heatmap Mục Q (không để trống mảng khiến heatmap toàn xám).
- `referral_code` của user demo + ≥2 user khác có `referred_by` trỏ về user demo, để màn R có dữ liệu hiển thị.
- ≥3 `ai_practice.nfc_tags` đã gán sẵn (khác `label`, có 1 cái `tap_count=0` chưa từng chạm để test trạng thái "chưa dùng lần nào").
- 1 `payment.orders` có `status='failed'` trong lịch sử giao dịch (test hiển thị đúng trạng thái lỗi ở màn lịch sử thanh toán nếu có).
- **3 tài khoản demo theo 3 role** để test đủ nhánh Mục 0.2/6.0: 1 tài khoản `role='student'` (user demo chính, dùng cho toàn bộ bộ mock data gốc), 1 tài khoản `role='teacher'` (có sẵn ≥2 `teacher.classes`, mỗi lớp ≥5 `class_members`, ≥3 `assignments` với `due_date` trải đều quá khứ/gần hạn/tương lai để test đủ màu đếm ngược S.3), 1 tài khoản `role='admin'` (chỉ cần đăng nhập được, không cần data gì thêm — vào thẳng Admin Blocked Screen).
- User demo chính (`role='student'`) phải có sẵn ≥2 `teacher.class_members` (tham gia sẵn 2 lớp trước khi mở app lần đầu, để S.0 không rỗng ngay từ đầu) + ≥1 lớp còn "chưa tham gia" có `join_code` biết trước để tester tự nhập thử luồng S.1 thành công, + 1 `join_code` **cố tình sai** để test nhánh lỗi.
- Trong số assignment mock của user demo chính: ≥1 assignment mỗi loại (`quiz`/`vocab_deck`/`writing`/`roleplay`/`reading`) ở đủ 5 trạng thái khác nhau (`Chưa làm`/`Đang làm`/`Đã nộp`/`Đạt`/`Chưa đạt`) để phủ hết badge trạng thái màn S.3, và ≥1 assignment đã **quá hạn `due_date`** nhưng còn `Chưa làm` để test màu Coral đỏ + nhãn "Quá hạn".

---

## 9. HƯỚNG DẪN OUTPUT (thứ tự bắt buộc)

1. **Xác nhận đã đọc** `.sql` + `.docx` + toàn bộ Mục 6 file này — liệt kê ngắn gọn 8 schema, 16 nhóm chức năng, xác nhận đã nắm công thức SM-2 ở Mục 6.4, luồng tìm bạn theo SĐT ở Mục 6.12, **và đặc biệt xác nhận đã nắm rõ Mục 0.2/6.0: 3 vai trò `admin`/`teacher`/`student` dẫn tới 3 trải nghiệm Mobile hoàn toàn khác nhau (Admin Blocked / Teacher Companion / Student full-access)**.
2. **Design System Summary** — code TypeScript thật: `tailwind.config.js` mở rộng token Mục 5 + file `src/core/theme/colors.ts` export `AppColors` const.
3. **Mock Data Set** theo Mục 8 (code TypeScript thật, type theo Zod schema, đủ dữ liệu mới bổ sung — **bao gồm 3 tài khoản demo 3 role**).
4. **`package.json` + `app.json`/`app.config.ts` (Expo config) + `tsconfig.json`** đầy đủ dependency theo Mục 2.1/2.3, bật New Architecture (`newArchEnabled: true` trong Expo config).
5. Cấu trúc thư mục theo Mục 2.2 — **mỗi feature trong `src/features/` phải thấy rõ 3 thư mục `data/application/presentation`, không được gộp**; `app/` chỉ chứa route file mỏng import lại từ `src/features/*/presentation/screens/`. Bao gồm 2 feature mới: `src/features/class-membership/` (↔ nhóm màn S) và `src/features/teacher-companion/` (↔ nhóm màn T + Admin Blocked Screen).
6. **Sinh `useRoleGate()` (Zustand store) + guard logic trong `app/_layout.tsx` (Mục 0.2.1/6.0.A) TRƯỚC KHI sinh bất kỳ route/màn hình nào khác** — đây là lớp chạy sớm nhất trong toàn bộ app, sinh sau cùng sẽ khiến các route Student/Teacher/Admin bị lẫn lộn khi refactor.
7. Với **từng màn** ở Mục 7 (bao gồm nhóm S/T mới): sinh `application/` (Zustand store/TanStack Query hook đúng luồng Mục 6) TRƯỚC, rồi mới `presentation/` (screen component theo Mục 7 + route file mỏng tương ứng trong `app/`). Không được sinh toàn bộ UI trước rồi mới quay lại bổ sung logic sau — thứ tự này chính là để tránh lặp lại lỗi "chỉ ra giao diện" của lần chạy trước.
8. Với mỗi 🎬, code animation thật bằng Reanimated/Skia/Lottie theo đúng chỉ định kỹ thuật ở Mục 7 (không bỏ qua, không thay bằng comment mô tả suông).
9. Giữ nguyên logo bên thứ ba (Google/Apple/Facebook/VNPay/MoMo/Stripe/ZaloPay) — asset chính chủ.
10. Không tự thêm màu/font/icon ngoài Mục 5, không thêm field ngoài Mục 8 và file `.sql` gốc, không thêm package ngoài Mục 2.1/2.3 trừ khi giải thích rõ lý do kỹ thuật bắt buộc — nếu cần giả định ngoài phạm vi schema gốc (như inventory Coin Shop ở Mục 6.10.5, `notification_type='friend_request'` ở Mục 6.12.5, hoặc **bảng `assignment_submissions` và các `notification_type` dành cho Teacher ở Mục 6.0.C/0.2.2**), **phải ghi rõ bằng code comment `// GIẢ ĐỊNH NGOÀI SCHEMA GỐC:`** để người review dễ đối chiếu lại với backend thật sau này.
11. **Không được để Student vào được nhóm route `(teacher-companion)` hoặc `admin-blocked` và ngược lại** — nếu sinh test/demo, phải có ít nhất 1 test case (Jest + `@testing-library/react-native`) chuyển đổi giữa 3 tài khoản demo role (Mục 8) để tự xác minh guard `useRoleGate()` hoạt động đúng trước khi coi là hoàn thành.
