// theme/detection.ts — Bảng màu định danh riêng cho nhận diện vật thể AI (AI Object Detection)
// Quy tắc:
// - TÁCH BIỆT hoàn toàn khỏi brand (primary) và gamification (streak/xp/coin).
// - Các màu có tông "muted/dusty", độ bão hòa giảm, hài hòa khi đứng cạnh nhau.
// - Card vocab dùng `soft` làm viền trái 3px + dot số thứ tự, nền card là `surface` trung tính.

export const detectionPalette = [
  { stroke: '#5B8DEF', soft: '#EAF0FE', name: 'sky' },     // xanh dương nhẹ — vật thể #1
  { stroke: '#F2994A', soft: '#FDF0E4', name: 'amber' },   // cam đất — vật thể #2
  { stroke: '#27AE93', soft: '#E4F5F1', name: 'teal' },    // xanh ngọc trầm — vật thể #3
  { stroke: '#B183D9', soft: '#F3ECFA', name: 'purple' },  // tím nhạt — vật thể #4
  { stroke: '#E0678A', soft: '#FBEAF0', name: 'rose' },    // hồng đất — vật thể #5
] as const;

export type DetectionColor = (typeof detectionPalette)[number];

export const getDetectionColor = (index: number): DetectionColor => {
  return detectionPalette[index % detectionPalette.length];
};
