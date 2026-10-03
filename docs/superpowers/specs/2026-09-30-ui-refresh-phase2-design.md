# Design Spec: Phase 2 — UI/UX Refresh (Lộ Trình, Bộ Thẻ, Quiz)

**Dự án:** SmartEnglish AI Lexora (Mobile App)  
**Ngày:** 2026-09-30  
**Trạng thái:** Chờ User duyệt  
**Định hướng phong cách:** Playful & Premium (Duolingo / BeReal gen-next) — Gamified, Tactile 3D, Gradient Depth, Micro-Interactions

---

## 1. Mục tiêu & Phạm vi (Scope & Objectives)

### 1.1. Phạm vi thực hiện
1. **Sub-Tab Switcher Bar (`app/(student)/learn.tsx`):**
   - Nâng cấp thanh chuyển đổi 4 sub-tabs (`Lộ Trình` | `Bộ Thẻ` | `Luyện Nói` | `Quiz`).
   - Hiệu ứng capsule indicator trượt mượt mà (smooth sliding spring).
   - Icon sinh động, typography rõ ràng, không gian thoáng đãng.
2. **Cây Lộ Trình Duolingo-Style (`LearningPathScreen.tsx`):**
   - Tactile 3D Nodes: Các nút học tròn có độ dày đế (shadow/depth), hiệu ứng lún xuống khi nhấn (press down).
   - Node hiện tại: Vòng xung tỏa sáng (pulse ring), badge tooltip ngọn lửa "Bắt đầu ở đây!".
   - Node đã hoàn thành: Sáng rực rỡ với icon sao vàng và checkmark.
   - Serpentine Path: Đường cong SVG Cubic Bezier mềm mại, hiệu ứng gradient theo trạng thái hoàn thành.
   - Dynamic Atmospheric Background: Các quầng sáng mềm mại trôi nổi trên UI-thread.
   - Milestone cuối chương: Hòm kho báu / Cột mốc hoàn thành chương.
   - Modal chi tiết bài học: Bottom Sheet bo cong hiện đại với nút CTA spring đàn hồi.
3. **Kho Bộ Thẻ SRS (`DecksScreen.tsx`):**
   - Loại bỏ các ô card trắng đơn điệu, chuyển sang thiết kế Card Stacking 3D (hiệu ứng chồng thẻ bài ma thuật).
   - Gradient chủ đề riêng biệt (Du lịch, Công nghệ, Kinh doanh, Đời sống).
   - Thanh tiến độ ghi nhớ SRS (Mastery Bar) hiển thị trực quan.
   - Nút "Tạo thẻ mới" viền nét đứt sang trọng, nảy đàn hồi khi chạm.
   - Segmented control "Chủ đề hệ thống" vs "Bộ thẻ của tôi" dạng animated sliding capsule.
4. **AI Quiz Setup (`QuickQuizSetupScreen.tsx`):**
   - Hero Banner "Quiz nhanh hôm nay" dạng LinearGradient rực rỡ với icon Zap phát sáng.
   - Thẻ chọn dạng câu hỏi (Trắc nghiệm, Điền từ, Ghép nối, Sắp xếp): Icon độc bản, hiệu ứng spring press nảy vui mắt khi tick chọn.
   - Bộ đếm số lượng câu hỏi stepper to rõ, dễ bấm.
   - Nút CTA "Tạo bài thi tùy chỉnh" dạng Gradient Button kèm icon hành động.

### 1.2. Ràng buộc bất di bất dịch (Non-negotiable Constraints)
* **Tab Luyện Nói (`SpeakingHomeScreen`):** **TUYỆT ĐỐI KHÔNG CHỈNH SỬA** logic, layout hay giao diện của màn hình này.
* **Logic & Data:** Giữ nguyên 100% các API gọi backend (`knowledgeGapApi`, `deckApi`, `vocabularyApi`, `fetchLearningPathRoadmapApi`), state management (Zustand), và routing navigation.
* **TypeScript Strict:** Không sử dụng `any`, xử lý đầy đủ kiểu dữ liệu.
* **Hiệu năng:** Tận dụng Reanimated UI-thread cho các chuyển động lặp lại (loop), không gây giật lag hoặc tiêu hao pin.

---

## 2. Kiến trúc & Thiết kế Chi tiết (Detailed Architecture & UI)

### 2.1. Sub-Tab Switcher Bar (`app/(student)/learn.tsx`)
* **Vị trí:** Cố định bên dưới SafeArea Header.
* **Cấu trúc:**
  - Container: Nền `colors.surface` với viền dưới mảnh `colors.border`.
  - Switcher Wrapper: Nền `colors.surfaceMuted`, bo tròn `borderRadius: 20`, padding 4px.
  - Tab Item:
    * `path`: Icon `Compass`, nhãn "Lộ Trình"
    * `decks`: Icon `Layers`, nhãn "Bộ Thẻ"
    * `speaking`: Icon `Mic`, nhãn "Luyện Nói"
    * `quiz`: Icon `Zap`, nhãn "Quiz"
  - Active Tab: Nền gradient `cardGradients.blue` (hoặc `primary`), text trắng `#FFFFFF`, scale nảy nhẹ 1.03.

### 2.2. Cây Lộ Trình Học Phản Xạ (`LearningPathScreen.tsx`)
* **Background Hài Hòa & Phân Vùng Thế Giới Học Tập (Thematic Chapter Biomes):**
  - Để lộ trình không bị trơ trọi trên một nền phẳng đơn điệu, toàn bộ cây bài học được thiết kế như một **Bản đồ thế giới (Adventure Map)** với các vùng đất (Biomes) hài hòa theo từng chương:
    * **Chương 1 — Thung lũng khởi động (Emerald & Mint):** Tông màu xanh tươi mát, dịu mắt, quầng sáng mềm mại tạo cảm hứng khởi đầu nhẹ nhàng.
    * **Chương 2 — Vịnh tri thức phản xạ (Indigo & Cyan):** Tông màu công nghệ hiện đại, chuyển sắc đại dương sâu lắng, biểu trưng cho sự tiến bộ vững chắc.
    * **Chương 3 — Hoàng hôn bứt phá (Sunset Amber & Flame):** Tông màu cam ấm áp, tràn đầy năng lượng, thúc đẩy việc tăng tốc phản xạ giao tiếp.
    * **Chương 4 — Đỉnh cao tinh vân (Royal Violet & Fuchsia):** Tông màu tím huyền bí, sang trọng dành cho cấp độ cao cấp và bài học chuyên sâu.
  - **Khung đảo học tập (Island Biome Container):** Mỗi chương nằm trong một khối thẻ nền bán trong suốt (Subtle Gradient Island Backdrop) có bo góc lớn (`borderRadius: 28`), viền phát sáng nhẹ và họa tiết mây/bụi sao trôi bồng bềnh, giúp các Unit bài học nằm gọn gàng, ấm cúng và hài hòa tuyệt đối.
  - **Dynamic Ambient Layer:** Các hạt ánh sáng và quầng sáng mềm (Orbs) trôi nhẹ trên UI-thread tạo cảm giác không gian đa chiều, sống động nhưng không làm rối mắt hay che khuất chữ.

* **Hệ thống Node Duolingo 3D:**
  - Kích thước: `NODE_SIZE = 76`.
  - Cấu trúc 2 lớp giả lập 3D:
    * Lớp đế (Base shadow layer): Dày 6px đặt lệch phía dưới để tạo hiệu ứng khối 3D đúc nổi.
    * Lớp mặt (Face layer): Khi nhấn (`onPressIn`), mặt nút di chuyển xuống `translateY: 4` để chạm sát lớp đế.
  - Màu sắc theo trạng thái:
    * `completed`: Mặt nút xanh lá `colors.success`, đế xanh sẫm, icon Star trắng.
    * `current`: Mặt nút xanh ngọc Indigo `colors.primary`, viền cam năng động, pulse ring xung quanh.
    * `unlocked`: Mặt nút trắng ngà viền primary nhạt.
    * `locked`: Mặt nút xám bạc, icon Crown/Lock xám mờ.
* **Đường nối Serpentine SVG:**
  - Đường uốn cong Cubic Bezier: `M x1 y1 C x1 midY, x2 midY, x2 y2`.
  - Đường viền nền dày 12px tạo bóng đổ chiều sâu + đường nét chính 6px màu sắc chuyển động.
  - Điểm checkpoint tròn (orb dot) ở giữa mỗi nhánh kết nối.
* **Chapter Header & End-of-Chapter Milestone:**
  - Header mỗi chương: Banner Gradient sang trọng với Badge cấp độ và thanh tiến độ hoàn thành chương.
  - Cuối mỗi chương: Khối rương báu phần thưởng (Chest Milestone) với icon rương vàng lấp lánh và badge "+100 XP Thưởng".
* **Chapter Header & End-of-Chapter Milestone:**
  - Header mỗi chương: Banner Gradient sang trọng với Badge cấp độ và thanh tiến độ hoàn thành chương.
  - Cuối mỗi chương: Khối rương báu phần thưởng (Chest Milestone) với icon rương vàng lấp lánh và badge "+100 XP Thưởng".

### 2.3. Kho Bộ Thẻ Ghi Nhớ SRS (`DecksScreen.tsx`)
* **Card Stacking 3D Deck:**
  - Lớp thẻ phụ phía sau (Stacked card preview) tạo cảm giác bộ thẻ có chiều dày.
  - Card chính:
    * Header card: Icon chủ đề nổi bật trên nền squircle gradient + Badge số lượng thẻ + Badge PRO (nếu có).
    * Tiêu đề & mô tả: Typography rõ ràng, dễ đọc.
    * Footer: Thanh tiến độ Mastery Progress Bar mini (chia tỉ lệ màu: xanh đã thuộc, cam cần ôn).
* **Segmented Bar:**
  - 2 Tab: "Chủ đề hệ thống" & "Bộ thẻ của tôi" với animation pill và badge số lượng thẻ cá nhân.
* **Nút tạo thẻ mới:** Card viền nét đứt bo tròn 20px, icon `Plus` xoay nảy đàn hồi `usePressSpring`.

### 2.4. Đấu Trường AI Quiz (`QuickQuizSetupScreen.tsx`)
* **Hero Challenge Banner:**
  - Sử dụng `LinearGradient` từ `cardGradients.blue` sang tím mộng mơ.
  - Huy hiệu `Zap` màu vàng gold rực rỡ, vòng pulse nhấp nháy.
  - Nút "Bắt đầu ngay" bo tròn dạng button 3D nổi bật.
* **Question Type Selection Cards:**
  - Lưới 2 cột với 4 dạng câu hỏi:
    1. Trắc nghiệm: Icon `ListChecks`, màu accent xanh dương.
    2. Điền từ: Icon `PenLine`, màu accent cam streak.
    3. Ghép nối: Icon `Sparkles`, màu accent tím violet.
    4. Sắp xếp từ: Icon `ArrowUpDown`, màu accent xanh ngọc emerald.
  - Khi được chọn: Card có hiệu ứng nảy spring, viền màu rực rỡ, checkmark nổi bật.
* **Stepper & Topic Selector:**
  - Nút tăng giảm số lượng câu hỏi với kích thước chạm thoải mái (touch target >= 44px).
  - Chip chủ đề dạng kẹo dẻo bo tròn mềm mại.
  - Nút CTA chính "Tạo bài thi tùy chỉnh" với LinearGradient cam hoặc xanh navy.

---

## 3. Danh sách File Thay Đổi & Tạo Mới

| File | Hành động | Mục đích |
|---|---|---|
| `app/(student)/learn.tsx` | Modify | Nâng cấp thanh 4 sub-tabs với capsule sliding & icon sinh động |
| `src/features/learning-path/presentation/screens/LearningPathScreen.tsx` | Modify | Nâng cấp cây Duolingo 3D, nodes lún 3D, SVG branch, background gradient, chapter chest |
| `src/features/flashcard-srs/presentation/screens/DecksScreen.tsx` | Modify | Thay đổi sang Card Stacking 3D, gradient theo chủ đề, thanh mastery progress |
| `src/features/quiz-exam/presentation/screens/QuickQuizSetupScreen.tsx` | Modify | Nâng cấp Hero Gradient, type cards tương tác sinh động, button CTA nổi bật |
| `src/features/ai-speaking/presentation/screens/SpeakingHomeScreen.tsx` | **NO TOUCH** | Giữ nguyên 100% không chỉnh sửa |

---

## 4. Kế hoạch Kiểm Thử (Verification Plan)
1. **Kiểm tra TypeScript:** `npx tsc --noEmit` đạt 0 lỗi.
2. **Kiểm tra Metro Bundler & Runtime:**
   - Mở tab Lộ Trình: Cây Duolingo hiển thị đẹp mắt, các node bấm nảy đàn hồi, modal bài học mở mượt mà.
   - Chuyển sang tab Bộ Thẻ: Lưới thẻ bài 3D hiển thị sắc nét, chuyển giữa 2 tab con mượt mà, modal tạo thẻ hoạt động tốt.
   - Chuyển sang tab Luyện Nói: Xác nhận màn hình SpeakingHomeScreen hoạt động bình thường, không suy suyển.
   - Chuyển sang tab Quiz: Tùy chỉnh số lượng câu hỏi và chọn dạng bài hoạt động trơn tru.
