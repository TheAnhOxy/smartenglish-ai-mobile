// theme/motion.ts — Motion system chuẩn hóa cho Loxera English
//
// NGUYÊN TẮC:
// - Vật có khối lượng (card, button, modal, flashcard) → withSpring()
// - Chuyển động trừu tượng (màu, opacity, progress bar) → withTiming() với easing cong
// - KHÔNG dùng withTiming cho nút bấm/card — sẽ bị "đơ"
// - KHÔNG đặt tất cả animation chung 1 duration/easing — sẽ "phẳng như PowerPoint"

import { Easing } from 'react-native-reanimated';

// ───── SPRING PRESETS — 3 loại, không tự bịa thêm ─────
export const spring = {
  // Nút bấm, toggle, Pressable — phản hồi TỨC THÌ khi ngón tay chạm
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  // Card, list item, sheet xuất hiện — mềm mại, không nảy nhiều
  gentle: {
    damping: 18,
    stiffness: 150,
    mass: 1,
  },
  // Flashcard flip, bottom sheet kéo ra, milestone pop — rõ độ nảy
  bouncy: {
    damping: 12,
    stiffness: 180,
    mass: 1,
  },
} as const;

// ───── TIMING PRESETS — cho opacity, màu, progress bar ─────
// Dùng easing cong (Easing.out(Easing.cubic)) — KHÔNG dùng easing tuyến tính mặc định
export const timing = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

// Easing chuẩn — dùng kèm withTiming
export const easings = {
  // Ra nhanh, giảm tốc mềm — hầu hết transition
  out: Easing.out(Easing.cubic),
  // Vào từ từ, ra nhanh — ẩn/dismiss
  in: Easing.in(Easing.cubic),
  // Cả hai chiều mượt — looping, idle animation
  inOut: Easing.inOut(Easing.quad),
} as const;
