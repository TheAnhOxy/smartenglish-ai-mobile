// theme/gradients.ts — Gradient palette cho Loxera English
// Mỗi feature card có màu riêng biệt, KHÔNG dùng chung primary blue
// heroGradient: 3 điểm dừng từ Navy → Cyan (brand gradient)

export const cardGradients = {
  scan:      ['#7C3AED', '#A855F7'] as const,  // tím — AI/Camera
  flashcard: ['#0EA5E9', '#38BDF8'] as const,  // xanh dương — học tập
  chat:      ['#059669', '#10B981'] as const,  // xanh lá — giao tiếp
  quiz:      ['#F59E0B', '#FBBF24'] as const,  // vàng cam — thi cử
} as const;

export const heroGradient = ['#1F4E79', '#2563A8', '#00B0F0'] as const;

// Shadow màu khớp với gradient mỗi card để tạo colored glow
export const cardShadowColors = {
  scan:      '#7C3AED',
  flashcard: '#0EA5E9',
  chat:      '#059669',
  quiz:      '#F59E0B',
} as const;

export type CardGradientKey = keyof typeof cardGradients;
