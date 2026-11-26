import { BookOpen, Headphones, Languages, Mic, PenLine, Puzzle } from 'lucide-react-native';
import type React from 'react';
import type { Band, SkillKey } from '../../../application/skillMap';

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Màu nhận diện từng kỹ năng — dùng chung cho node, nhãn, biểu đồ con và trạng thái chọn. */
export const SKILL_THEME: Record<SkillKey, { main: string; light: string; soft: string; icon: IconType }> = {
  listening: { main: '#0EA5E9', light: '#7DD3FC', soft: '#E0F2FE', icon: Headphones },
  pronunciation: { main: '#F59E0B', light: '#FCD34D', soft: '#FEF3C7', icon: Mic },
  reading: { main: '#6366F1', light: '#A5B4FC', soft: '#EEF2FF', icon: BookOpen },
  writing: { main: '#22C55E', light: '#86EFAC', soft: '#DCFCE7', icon: PenLine },
  grammar: { main: '#F43F5E', light: '#FDA4AF', soft: '#FFE4E6', icon: Puzzle },
  vocabulary: { main: '#8B5CF6', light: '#C4B5FD', soft: '#F3E8FF', icon: Languages },
};

/** Màu theo mức đánh giá (dùng cho chữ mức / điểm thành phần). */
export const BAND_COLOR: Record<Band, string> = {
  none: '#94A3B8',
  weak: '#EF4444',
  improve: '#F97316',
  fair: '#F59E0B',
  good: '#0EA5E9',
  great: '#22C55E',
};

/** Bảng màu chung của AI Skill Map. */
export const MAP = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSoft: '#64748B',
  textAccent: '#334155',
  primary: '#6366F1',
} as const;
