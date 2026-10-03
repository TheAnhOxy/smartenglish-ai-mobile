# UI Refresh Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp trang Home thêm toppings sinh động (Daily Quests, Blitz Challenge, Word of the Day tương tác cao); Đại tu toàn diện tab Thống kê / Tiến độ (loại bỏ hoàn toàn icon AI, nâng cấp Streak rực rỡ, bổ sung 4 dạng biểu đồ kỹ năng phong phú, sửa giao diện Phân tích năng lực chuyên sâu, và làm bục Podium & bảng Xếp hạng sôi nổi kích thích học tập).

**Architecture:** 
- Sử dụng `react-native-reanimated` cho các animation mượt mà (spring, count-up, stagger reveal, fade-in).
- Dùng `expo-linear-gradient` và `react-native-svg` để vẽ các biểu đồ Radar Pentagon, Wave curve, Bar chart, và các bục Podium 3D.
- Tuân thủ màu sắc chuẩn từ `src/theme/colors.ts` và `src/theme/gradients.ts`.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript ~6.0, Reanimated 4.5, react-native-svg, expo-linear-gradient, lucide-react-native.

**Spec:** `docs/superpowers/specs/2026-09-30-ui-refresh-phase3-design.md`

## Global Constraints
- Không làm gãy bất kỳ routing hoặc logic data hiện có (`authStore`, `deckStore`, v.v.).
- BỎ HOÀN TOÀN ICON AI ROBOT (`Bot`) trong màn hình thống kê theo đúng yêu cầu người dùng.
- TypeScript strict, 0 lỗi `any` và `npx tsc --noEmit` đạt 0 lỗi.

---

### Task 1: Nâng Cấp Topping & Hoạt Họa Trang Home (`HomeScreen.tsx`)

**Files:**
- Modify: `src/features/home-dashboard/presentation/screens/HomeScreen.tsx`

**Features:**
- Thêm section **Daily Quests (Nhiệm vụ hàng ngày)** với 3 nhiệm vụ có thanh progress fill mượt mà và nút nhận thưởng XP.
- Thêm **Blitz 60s Mini Challenge** kích thích phản xạ từ vựng nhanh.
- Nâng cấp **Word of the Day** tương tác sinh động hơn (nghe phát âm với hiệu ứng active, loại từ, ví dụ chi tiết, nút lưu thẻ).
- Tích hợp hiệu ứng bấm tactile `usePressSpring`.

- [x] **Step 1: Định nghĩa types & dummy data cho Daily Quests và Blitz Challenge**
- [x] **Step 2: Viết UI component Daily Quests với Reanimated progress bar**
- [x] **Step 3: Viết UI component Blitz Challenge Card với LinearGradient**
- [x] **Step 4: Hoàn thiện nâng cấp Word of the Day & Layout tổng thể**
- [x] **Step 5: Kiểm tra TypeScript với `npx tsc --noEmit`**

---

### Task 2: Đại Tu Tab Tiến Độ Học Tập & Biểu Đồ Kỹ Năng (`AnalyticsScreen.tsx`)

**Files:**
- Modify: `src/features/home-dashboard/presentation/screens/AnalyticsScreen.tsx`

**Features:**
- Đổi Segment Switcher: Bỏ icon robot `Bot`, dùng icon `TrendingUp`, `Sparkles`, `Trophy`.
- Nâng cấp **Streak Card** với LinearGradient cam lửa rực rỡ, icon lửa animated pulse, mốc kỷ lục và 7 ngày có hào quang.
- Nâng cấp **4 Thẻ Chỉ Số Nhanh (Summary Metrics)**: Từ vựng, Điểm quiz, Thời gian học, Tốc độ phản xạ.
- Tích hợp **4 Dạng Biểu Đồ Kỹ Năng**:
  1. Radar Pentagon 5 trục (Svg polygon & axis lines).
  2. 7-Day Learning Time Bar Chart (Svg/Reanimated bars với cột hôm nay nổi bật).
  3. Accuracy Wave Trend Line Chart (Svg curved wave gradient).
  4. CEFR Skill Mastery Level Bars (5 kỹ năng với level A1-B2 và progress bars).

- [x] **Step 1: Cập nhật Segment Switcher (Loại bỏ icon `Bot`)**
- [x] **Step 2: Thiết kế lại Streak Card rực rỡ**
- [x] **Step 3: Thiết kế 4 thẻ chỉ số nhanh**
- [x] **Step 4: Hoàn thiện 4 dạng biểu đồ kỹ năng phong phú**
- [x] **Step 5: Kiểm tra TypeScript với `npx tsc --noEmit`**

---

### Task 3: Nâng Cấp Tab Phân Tích Chuyên Sâu & Tab Xếp Hạng Sôi Nổi (`AnalyticsScreen.tsx`)

**Files:**
- Modify: `src/features/home-dashboard/presentation/screens/AnalyticsScreen.tsx`

**Features:**
- **Tab Phân Tích Chuyên Sâu:**
  - Bỏ icon robot, thay bằng icon tri thức/ánh sáng (`Sparkles`, `Lightbulb`).
  - Điểm năng lực tổng quan (74/100, B1 Independent).
  - Ma trận Điểm Mạnh & Lỗ Hổng Kiến Thức (Cần cải thiện vs Điểm mạnh kèm ví dụ).
  - Thẻ Đề xuất bài tập củng cố ngay (Interactive practice pills).
- **Tab Xếp Hạng Sôi Nổi:**
  - Silver League countdown & Phân vùng thăng hạng (Top 3 Gold League).
  - Bục Podium 3D (Rank 1 vương miện vàng, Rank 2 bạc, Rank 3 đồng với avatar phát sáng).
  - Bảng xếp hạng chi tiết với chỉ số biến động (+2, -1, =).
  - Thẻ vị trí cá nhân cố định phát sáng (Khoảng cách điểm số tới Top 2).

- [x] **Step 1: Thiết kế giao diện Đánh giá Năng lực (Tab Analytics)**
- [x] **Step 2: Thiết kế bục Podium 3D & League Header (Tab Ranking)**
- [x] **Step 3: Thiết kế Bảng xếp hạng chi tiết & Thẻ vị trí cá nhân phát sáng**
- [x] **Step 4: Kiểm tra TypeScript toàn bộ với `npx tsc --noEmit`**
