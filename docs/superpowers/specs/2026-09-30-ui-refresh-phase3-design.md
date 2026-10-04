# UI Refresh Phase 3 Design Specification

> **Date:** 2026-09-30  
> **Target:** Home Dashboard (`HomeScreen.tsx`) & Analytics/Progress Hub (`AnalyticsScreen.tsx`)  
> **Status:** Approved by User

---

## 1. Executive Summary

Bản thiết kế Phase 3 tập trung vào 2 mục tiêu lớn được người dùng yêu cầu:
1. **Làm phong phú trang Home (Topping & Sinh động):** Thêm Daily Quests (Nhiệm vụ hàng ngày có thưởng XP), Thử thách 60s Blitz Challenge, Nâng cấp thẻ Word of the Day sinh động tương tác, kết hợp micro-animations và feedback xúc giác mượt mà.
2. **Đại tu Tab Thống kê / Tiến độ (`AnalyticsScreen.tsx`):**
   - **Mục Tiến độ (Progress):** Giao diện đẹp mắt, loại bỏ hoàn toàn icon AI robot, nâng cấp chuỗi ngày liên tiếp (Streak) rực rỡ với hiệu ứng hào quang, sinh thêm 4 dạng biểu đồ kỹ năng trực quan (Radar Pentagon 5 trục, 7-Day Time Distribution bar chart, Accuracy Wave Trend line chart, và CEFR Skill Mastery bars).
   - **Mục Phân tích chuyên sâu (Analytics):** Bỏ icon AI, thay bằng icon tri thức/ánh sáng (`Sparkles`, `Lightbulb`), bổ sung ma trận Điểm mạnh/Điểm yếu thực tế, thẻ Gợi ý học tập có nút hành động nhanh và danh sách bài học đề xuất củng cố.
   - **Mục Xếp hạng (Ranking):** Sôi nổi và kích thích cạnh tranh với Podium 3D Top 3, thanh phân vùng thăng hạng Silver -> Gold League, chỉ số biến động thứ hạng (+2, -1), và thẻ vị trí cá nhân phát sáng ghim khoảng cách XP để vượt đối thủ.

---

## 2. Design Tokens & Consistency Rules

- **Theme Palette:** Tuân thủ chuẩn `src/theme/colors.ts`:
  - Brand Primary: Deep Navy `#1F4E79`, Mid Navy `#2563A8`.
  - Brand Secondary: Cyan `#00B0F0`.
  - Gamification (Tách biệt hoàn toàn brand):
    - Streak: Lửa cam `#FF7A45` / `#E8592A` / `#FFE7DB`.
    - XP: Vàng ánh kim `#FFC24B` / `#F2A400` / `#FFF3DA`.
    - Coin: Vàng hổ phách `#F59E0B`.
- **Iconography Rule:**
  - **TUYỆT ĐỐI BỎ ICON AI / ROBOT** (`Bot`) theo yêu cầu người dùng. Thay bằng `Sparkles`, `Lightbulb`, `Compass`, `BrainCircuit`, `TrendingUp`, `Trophy`.
- **Typography:**
  - Font Inter / System font đồng bộ với typography tokens `font.family`.
- **Animation Framework:**
  - `react-native-reanimated`: `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `FadeInDown`.
  - `usePressSpring` cho cảm giác xúc giác (tactile press feedback).

---

## 3. Screen 1: Home Dashboard (`HomeScreen.tsx`)

### 3.1 Topping 1: Daily Quests (Nhiệm vụ hàng ngày)
- Khối 3 nhiệm vụ ngày kèm thanh tiến độ và phần thưởng XP:
  1. 🗂️ Ôn 10 thẻ ghi nhớ SRS: `8/10 thẻ` • Thưởng +20 XP.
  2. 🎯 Đạt 80%+ 1 bài Quiz: `0/1 bài` • Thưởng +30 XP.
  3. 🎙️ Luyện phát âm 3 phút: `3/3 phút (Hoàn thành!)` • Thưởng +25 XP.
- Nút nhận thưởng với trạng thái tương tác xúc giác, khi hoàn thành có badge CheckCircle2 xanh lá.

### 3.2 Topping 2: Blitz 60s Mini Challenge (Thử thách tốc độ)
- Thẻ banner gradient kích thích nhịp độ nhanh: "⚡ Thử thách Blitz 60s — Phản xạ 10 từ vựng", nút "Chơi ngay" chuyển nhanh vào mini-quiz.

### 3.3 Nâng cấp Word of the Day
- Tích hợp phát âm audio với trạng thái active sóng âm, badge từ loại (Adj, Noun, Verb), phiên âm chuẩn quốc tế IPA, giải nghĩa tiếng Việt, câu ví dụ thực tế kèm highlight, nút Bookmark lưu vào bộ thẻ cá nhân.

---

## 4. Screen 2: Analytics & Progress Hub (`AnalyticsScreen.tsx`)

### 4.1 Segment Switcher Bar
- 3 Tabs:
  - **Tiến Độ**: Icon `TrendingUp`
  - **Đánh Giá**: Icon `Sparkles` (Đã loại bỏ `Bot`)
  - **Xếp Hạng**: Icon `Trophy`

### 4.2 Tab 1: Tiến Độ Học Tập
1. **Streak Card Hoàng Hôn:**
   - Gradient Cam Lửa `['#FF7A45', '#E8592A']`, icon lửa hào quang, thông báo mốc kỷ lục và số ngày còn lại để đạt mốc vàng tiếp theo.
   - 7 ngày tuần với các ô trạng thái tròn: Đã check (có checkmark và nền phát sáng), Ngày hôm nay (viền sáng nổi bật), Ngày chưa tới (dấu chấm mờ).
2. **4 Thẻ Chỉ Số Nhanh (Glass/Gradient Cards):**
   - 📚 127 Từ đã thuộc (+14 tuần này)
   - 🎯 82% Điểm Quiz trung bình
   - ⏱️ 4.2h Thời gian tích lũy
   - ⚡ 1.8s Tốc độ phản xạ
3. **Bộ 4 Biểu Đồ Kỹ Năng Đa Dạng:**
   - **Radar Pentagon Chart:** Mạng nhện 5 kỹ năng (Từ vựng, Ngữ pháp, Nói, Đọc, Nghe) với các vòng lưới đồng tâm và điểm nút tương tác.
   - **7-Day Learning Time Bar Chart:** Cột thời gian từng ngày (T2 -> CN), thanh ngày hiện tại nổi bật với màu Cyan `#00B0F0`, độ cao co dãn mượt mà bằng Reanimated spring.
   - **Accuracy Wave Line Chart:** Biểu đồ đường cong SVG biểu diễn biến thiên độ chính xác các bài kiểm tra tuần này kèm vùng bóng đổ gradient.
   - **CEFR Skill Mastery Level Bars:** 5 thanh năng lực chi tiết chia theo cấp độ chuẩn A1 - B2 với tỷ lệ phần trăm và màu sắc trực quan.
4. **Nút Xuất Báo Cáo PDF:**
   - Thiết kế cao cấp, huy hiệu thành tích.

### 4.3 Tab 2: Đánh Giá Năng Lực (Analytics)
1. **Tổng Quan Điểm Năng Lực:** Thẻ điểm tổng thể 74/100, dự báo trình độ B1 Independent.
2. **Bộ lọc danh mục:** Tất cả, Ngữ pháp, Từ vựng, Phát âm, Lộ trình.
3. **Thẻ Lời Khuyên Trực Quan (Smart Insights):** Lời khuyên cụ thể về Collocations và cấu trúc câu + 2 phím tắt hành động.
4. **Ma Trận Điểm Mạnh & Lỗ Hổng Kiến Thức:**
   - Cần củng cố: Phân biệt "Make" vs "Do", Phát âm đuôi "-ed" (kèm mẹo ghi nhớ).
   - Điểm mạnh: Trọng âm từ 3 âm tiết (88%), Vốn từ vựng Công sở (85%).
5. **Đề Xuất Bài Tập Củng Cố Ngay:** Các thẻ bài luyện tập nhanh 5 câu tương ứng với điểm yếu để người học khắc phục tức thì.

### 4.4 Tab 3: Bảng Xếp Hạng & Giải Đấu (Ranking)
1. **League Banner (Silver League):**
   - Đếm ngược thời gian kết thúc tuần.
   - Vạch phân chia vùng: Thăng hạng (Top 3), An toàn (Hạng 4-7), Nguy cơ (Hạng 8-10).
2. **Bục Podium 3D:**
   - Top 1: Bục vàng cao nhất (vương miện `Crown` vàng óng, vòng sáng avatar, badge XP nổi bật).
   - Top 2: Bục bạc bên trái.
   - Top 3: Bục đồng bên phải.
3. **Danh Sách Xếp Hạng Đầy Đủ:**
   - Avatar, tên, XP tuần, huy hiệu thứ hạng, chỉ số biến động (+2, -1, =).
4. **Thẻ Sticky/Floating Vị Trí Cá Nhân:**
   - Vị trí của Bạn (#3) với viền sáng neon, ghi chú: "Chỉ còn 80 XP nữa để vượt Hoàng Nam lên Top 2!".
