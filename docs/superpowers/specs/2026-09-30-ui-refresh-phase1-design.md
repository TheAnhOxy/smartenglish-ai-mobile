# Design Spec: Playful & Premium UI Refresh — Phase 1
**Date:** 2026-09-30
**Scope:** Design System tokens + Home Screen + Tab Bar
**Style Direction:** Playful & Premium (Duolingo/BeReal gen-next)

---

## 1. Vấn đề cần giải quyết

| Vấn đề | Biểu hiện trong code |
|---|---|
| Icon AI lặp lại | Mọi card đều có `Sparkles` + badge "AI", hero = "AI Smart Scanner" |
| Màu đơn sắc | Tất cả icon/accent = `#0284C7` hoặc `primary` — không có màu hierarchy |
| Grid card nhàm | 4 cards giống hệt nhau: cùng `gridIconCircle` style, cùng primary color |
| Animation thiếu chiều sâu | `usePressSpring` + `useStaggerReveal` đơn giản, chưa có: bounce tab, shimmer, pulse ring |
| Tab bar tĩnh | Chỉ đổi màu icon khi active, không có motion |
| Hero banner phẳng | Rectangle đơn màu `primary`, không có gradient hay depth |

---

## 2. Design Tokens Mới (bổ sung vào `src/theme/`)

### 2A. Gradient Palette — `src/theme/gradients.ts` (file mới)
Mỗi feature card có gradient riêng, KHÔNG dùng chung màu primary:

```
scan:       ['#7C3AED', '#A855F7']   — tím (AI/Camera)
flashcard:  ['#0EA5E9', '#38BDF8']   — xanh dương (học tập)
chat:       ['#059669', '#10B981']   — xanh lá (giao tiếp)
quiz:       ['#F59E0B', '#FBBF24']   — vàng cam (thi cử)
hero:       ['#1F4E79', '#2563A8', '#00B0F0'] — brand gradient 3 điểm dừng
```

### 2B. Shadow Mới — thêm vào `src/theme/index.ts`
```
colored: shadow màu khớp với card gradient (tím/xanh/lá/vàng)
```

### 2C. Animation Primitives Mới — `src/hooks/`
- `useTabBounce.ts` — bounce scale + translateY khi tab active (mới)
- `useCountUp.ts` — đã có, nâng cấp để nhận duration
- `usePulseRing.ts` — pulse opacity ring cho avatar notification (mới)
- `useShimmer.ts` — shimmer loading + press effect (mới)
- `useGradientShift.ts` — animated gradient cho hero banner (mới, dùng Skia LinearGradient)

---

## 3. Tab Bar — `app/(student)/_layout.tsx`

### Hiện tại
- Static icon, chỉ đổi màu tint
- Không có motion khi chuyển tab

### Thay đổi
- Wrap mỗi tab icon bằng `useTabBounce`: khi active → scale 1.2 + translateY -3 + spring bouncy
- Active indicator: capsule nhỏ bên dưới icon (không phải background rect)
- Tab bar: thêm `backdropFilter blur` effect (dùng `expo-blur` BlurView) — glass-morphism nhẹ
- Remove border top, dùng shadow phía trên thay thế
- Colors: active = `colors.primary` (navy), inactive = `colors.textFaint`

### Files chạm
- `app/(student)/_layout.tsx`
- Thêm `src/hooks/useTabBounce.ts`

---

## 4. Home Screen — `src/features/home-dashboard/presentation/screens/HomeScreen.tsx`

### 4A. Header
- **Avatar pulse ring**: `usePulseRing` → ring opacity 0.6→0 infinite khi có notification
- **Greeting text**: thêm emoji time-based (🌅 Buổi sáng / ☀️ Buổi chiều / 🌙 Buổi tối)
- **Bỏ text "Loxera English"** dưới greeting — thay bằng status chip (Streak active / Goal met)

### 4B. Stats Bar
- Giữ nguyên layout 3 chip (streak/xp/coin) — đã tốt
- Nâng cấp: số XP dùng `useCountUp` (0 → giá trị thật trong 600ms khi mount)
- Streak chip: thêm tiny flame wiggle animation khi streak > 0

### 4C. Hero Banner
- **Gradient 3 màu** thay background đơn: `['#1F4E79', '#2563A8', '#00B0F0']` left → right
- Dùng `expo-linear-gradient` (đã có trong package.json)
- **Bỏ badge "AI Smart Scanner"** — thay bằng badge đơn giản "Tính năng nổi bật"
- **Bỏ text "Quét Ảnh Nhận Diện Từ Vựng AI"** → "Khám phá từ vựng qua ảnh"
- CTA button: pill trắng với shadow nhẹ thay vì text link
- Mascot fox giữ nguyên

### 4D. Feature Grid Cards (quan trọng nhất)
Thay đổi hoàn toàn 4 cards từ "giống nhau" → "cá tính riêng":

| Card | Gradient | Icon | Label mới |
|---|---|---|---|
| Scan | `#7C3AED → #A855F7` | `ScanText` | "Quét Ảnh" |
| Flashcard | `#0EA5E9 → #38BDF8` | `BookOpen` | "Flashcard" |
| Chat | `#059669 → #10B981` | `MessageSquare` | "Luyện Hội Thoại" |
| Quiz | `#F59E0B → #FBBF24` | `BrainCircuit` | "Kiểm Tra" |

- Layout: icon nằm trên có gradient background (rounded-2xl), text dưới
- Bỏ sub-label nhỏ (giữ label chính thôi — cleaner)
- `usePressSpring(0.93)` — scale nhỏ hơn cho cảm giác "nặng hơn", chắc hơn
- Colored shadow khớp gradient mỗi card

### 4E. Daily Word Card
- Giữ nguyên layout
- Bỏ badge "Từ Vựng Mỗi Ngày" có `Sparkles` — thay bằng text label đơn giản
- Word text: font lớn hơn (28 → 32), bold hơn
- Phonetic: chip riêng với border nhẹ

### 4F. Continue Learning & Live Class
- Continue card: gradient nhẹ trên nền thay background trắng phẳng
- Live card: giữ nguyên (đã ổn)

---

## 5. Các file sẽ tạo/sửa

### Files mới
```
src/theme/gradients.ts
src/hooks/useTabBounce.ts
src/hooks/usePulseRing.ts
```

### Files sửa
```
src/theme/index.ts                    — export gradients, thêm colored shadow
src/hooks/useStaggerReveal.ts         — thêm spring variant (bouncy entry)
app/(student)/_layout.tsx             — tab bar glassmorphism + bounce
src/features/home-dashboard/
  presentation/screens/HomeScreen.tsx — full visual overhaul
```

---

## 6. Những gì KHÔNG thay đổi trong Phase 1
- Không sửa logic, API calls, state management
- Không thay đổi routing/navigation
- Không sửa các màn hình khác (learn, practice, profile...)
- Không thay đổi font (giữ system font hiện tại)
- Không xóa mascot LoxeraFox

---

## 7. Definition of Done (verification-before-completion checklist)
- [ ] 4 grid cards có gradient màu khác nhau, không còn toàn blue
- [ ] Tab bar có bounce animation khi switch tab
- [ ] Hero banner dùng LinearGradient, không còn flat color
- [ ] Không còn badge "AI Smart Scanner" hay "AI" lặp lại nhiều lần
- [ ] Avatar có pulse ring khi có notification
- [ ] XP count-up khi màn hình mount
- [ ] usePressSpring scale 0.93 trên grid cards (cảm giác chắc hơn)
- [ ] Không có TypeScript error
- [ ] Không break navigation/routing
- [ ] Test trên cả iOS và Android layout (SafeArea)
