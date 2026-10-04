# UI Refresh Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp toàn diện giao diện & animation cho tab "Lộ trình" gồm 4 sub-tabs: Thanh Switcher capsule mượt mà, Cây lộ trình Duolingo 3D với background hài hòa theo từng chương (Thematic Biomes), Kho Bộ thẻ SRS card stack 3D, và Đấu trường AI Quiz tương tác sinh động; giữ nguyên 100% tab Luyện nói.

**Architecture:** Sử dụng Reanimated và `expo-linear-gradient` để tạo các tactile 3D nodes (hiệu ứng nút bấm lún xuống), gradient island backdrops, và animated indicator. Tận dụng các hooks `usePressSpring`, `usePulseRing`, theme tokens từ `src/theme/` và SVG Bezier connectors.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript ~6.0, Reanimated 4.5, react-native-svg, expo-linear-gradient, lucide-react-native.

**Spec:** `docs/superpowers/specs/2026-09-30-ui-refresh-phase2-design.md`

## Global Constraints
- Tab Luyện Nói (`SpeakingHomeScreen`): TUYỆT ĐỐI KHÔNG CHỈNH SỬA bất kỳ dòng code nào.
- Giữ nguyên 100% logic API, hook data, JWT auth và routing navigation của Expo Router.
- TypeScript strict, 0 lỗi `any` và `tsc --noEmit` đạt 0 lỗi.
- Reanimated: Chạy animation lặp lại trên UI-thread, không re-render React state không cần thiết.

## Review Focus
- Đảm bảo khi switch giữa 4 sub-tabs, trạng thái scroll và render không bị lag hay giật layout.
- Kiểm tra tính toán toạ độ SVG Bezier đường nối cây Duolingo chính xác theo chiều rộng màn hình.
- Đảm bảo các node bài học lún 3D chuẩn xác khi bấm (`onPressIn` / `onPressOut`).
- Đảm bảo thanh tiến độ SRS trong màn hình bộ thẻ hiển thị đúng tỷ lệ.
- Đảm bảo logic chọn dạng câu hỏi và số lượng câu hỏi trong Quiz hoạt động chính xác khi bấm "Bắt đầu".

---

### Task 1: Nâng cấp Sub-Tab Switcher Bar (`app/(student)/learn.tsx`)

**Files:**
- Modify: `app/(student)/learn.tsx`

**Interfaces:**
- Consumes: `colors`, `cardGradients` from `@/src/theme`, `usePressSpring` from `@/src/hooks/usePressSpring`, Lucide icons (`Compass`, `Layers`, `Mic`, `Zap`).
- Produces: Màn hình container tab Learn với thanh capsule switcher 4 nút mượt mà, icon động, text sắc nét.

- [x] **Step 1: Khảo sát và chuẩn bị dữ liệu tab**
- [x] **Step 2: Viết giao diện Capsule Switcher với Animated Style**
- [x] **Step 3: Kiểm tra chuyển đổi 4 màn hình**
- [x] **Step 4: Kiểm tra TypeScript**

---

### Task 2: Nâng cấp Cây Lộ Trình Duolingo 3D & Background Hài Hòa (`LearningPathScreen.tsx`)

- [x] **Step 1: Tạo Thematic Biomes & Island Backdrop cho từng Chương**
- [x] **Step 2: Xây dựng Tactile 3D Duolingo Node Component**
- [x] **Step 3: Nâng cấp SVG Bezier Branch Connectors & Chapter Chest Milestone**
- [x] **Step 4: Hoàn thiện Modal Chi Tiết Bài Học**
- [x] **Step 5: Kiểm tra TypeScript & Render**

---

### Task 3: Nâng cấp Kho Bộ Thẻ Ghi Nhớ SRS (`DecksScreen.tsx`)

- [x] **Step 1: Cấu hình Gradient & Icon Theme theo từng loại bộ thẻ**
- [x] **Step 2: Xây dựng Card Stacking 3D Deck Component**
- [x] **Step 3: Nâng cấp Segmented Bar & Nút "Tạo thẻ mới"**
- [x] **Step 4: Kiểm tra TypeScript & Render**

---

### Task 4: Nâng cấp Đấu Trường AI Quiz (`QuickQuizSetupScreen.tsx`)

- [x] **Step 1: Nâng cấp Hero Challenge Banner**
- [x] **Step 2: Nâng cấp Question Type Cards**
- [x] **Step 3: Tinh chỉnh Stepper Bộ đếm số câu hỏi & Topic Chips**
- [x] **Step 4: Kiểm tra TypeScript & Navigation**

---

### Task 5: Kiểm thử Toàn diện & Xác thực Hoàn thành (Verification)

- [x] **Step 1: Kiểm tra TypeScript toàn dự án** (`npx tsc --noEmit` exit code 0)
- [x] **Step 2: Xác nhận tab Luyện Nói không bị ảnh hưởng** (`SpeakingHomeScreen.tsx` nguyên vẹn 100%)
- [x] **Step 3: Kiểm tra chuyển đổi mượt mà giữa các tab**
