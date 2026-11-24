// components/xmas/DeckArt.tsx — Minh hoạ Giáng sinh theo chủ đề bộ thẻ (Thư viện phép thuật).
// Chủ đề nhận theo tên bộ thẻ (không phụ thuộc số lượng bộ); không khớp chủ đề nào → hộp quà kiến thức.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

export type DeckTopic = 'health' | 'nature' | 'education' | 'travel' | 'tech' | 'business' | 'daily' | 'gift';

interface DeckXmasStyle {
  topic: DeckTopic;
  /** Viền/ánh sáng của thẻ. */
  glow: string;
  /** Gradient nền nhẹ của thẻ (trên → dưới). */
  tint: [string, string];
}

const has = (s: string, keys: string[]) => keys.some((k) => s.includes(k));

export const getDeckXmas = (name: string): DeckXmasStyle => {
  const n = name.toLowerCase();
  if (has(n, ['sức khỏe', 'sức khoẻ', 'y tế', 'health', 'medical'])) return { topic: 'health', glow: '#34D399', tint: ['rgba(16,185,129,0.16)', 'rgba(16,30,34,0.92)'] };
  if (has(n, ['môi trường', 'thiên nhiên', 'nature', 'environment'])) return { topic: 'nature', glow: '#4ADE80', tint: ['rgba(34,197,94,0.16)', 'rgba(16,30,34,0.92)'] };
  if (has(n, ['giáo dục', 'học tập', 'education', 'school'])) return { topic: 'education', glow: '#FBBF24', tint: ['rgba(251,191,36,0.16)', 'rgba(16,30,34,0.92)'] };
  if (has(n, ['du lịch', 'di chuyển', 'travel', 'bay'])) return { topic: 'travel', glow: '#60A5FA', tint: ['rgba(59,130,246,0.18)', 'rgba(16,30,34,0.92)'] };
  if (has(n, ['công nghệ', 'technology', ' ai', 'ai ', ' it', 'it '])) return { topic: 'tech', glow: '#A78BFA', tint: ['rgba(139,92,246,0.18)', 'rgba(16,30,34,0.92)'] };
  if (has(n, ['kinh doanh', 'tài chính', 'đàm phán', 'business', 'finance'])) return { topic: 'business', glow: '#FBBF24', tint: ['rgba(245,158,11,0.18)', 'rgba(16,30,34,0.92)'] };
  if (has(n, ['đời sống', 'giao tiếp', 'daily', 'life'])) return { topic: 'daily', glow: '#FB923C', tint: ['rgba(251,146,60,0.16)', 'rgba(16,30,34,0.92)'] };
  return { topic: 'gift', glow: '#F87171', tint: ['rgba(239,68,68,0.14)', 'rgba(16,30,34,0.92)'] };
};

const SNOW = '#F8FAFC';

/** Minh hoạ nhỏ (khoảng 48px) đặt ở góc thẻ. */
export const DeckArt: React.FC<{ topic: DeckTopic; size?: number }> = ({ topic, size = 48 }) => (
  <View pointerEvents="none" style={{ width: size, height: size }}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {topic === 'health' ? (
        <>
          <Rect x={14} y={34} width={72} height={52} rx={10} fill="#E11D48" />
          <Rect x={36} y={22} width={28} height={16} rx={5} fill="none" stroke="#BE123C" strokeWidth={6} />
          <Rect x={45} y={46} width={10} height={30} rx={2} fill={SNOW} />
          <Rect x={35} y={56} width={30} height={10} rx={2} fill={SNOW} />
          <Path d="M10 36 Q30 26 50 34 Q70 26 90 36 L90 30 Q70 20 50 28 Q30 20 10 30 Z" fill={SNOW} />
          <Path d="M80 12 v16 M72 20 h16 M74 14 l12 12 M86 14 l-12 12" stroke="#A7F3D0" strokeWidth={2.4} strokeLinecap="round" />
        </>
      ) : topic === 'nature' ? (
        <>
          <Polygon points="34,14 56,60 12,60" fill="#15803D" />
          <Polygon points="34,34 62,84 6,84" fill="#166534" />
          <Polygon points="70,30 90,74 50,74" fill="#16A34A" />
          <Polygon points="70,48 96,92 44,92" fill="#15803D" />
          <Path d="M24 34 L34 14 L44 34 Q34 28 24 34 Z M60 50 L70 30 L80 50 Q70 44 60 50 Z" fill={SNOW} />
          <Rect x={0} y={88} width={100} height={12} rx={6} fill={SNOW} />
          <Circle cx={70} cy={30} r={4} fill="#FACC15" />
        </>
      ) : topic === 'education' ? (
        <>
          <Rect x={12} y={66} width={64} height={14} rx={3} fill="#1E3A8A" />
          <Rect x={18} y={52} width={60} height={14} rx={3} fill="#9F1239" />
          <Rect x={10} y={38} width={62} height={14} rx={3} fill="#166534" />
          <Path d="M8 40 Q30 30 74 38 L74 34 Q30 26 8 36 Z" fill={SNOW} />
          <Rect x={80} y={44} width={10} height={36} rx={2} fill="#FDE7BD" />
          <Path d="M85 26 Q92 36 85 42 Q78 36 85 26 Z" fill="#FB923C" />
          <Circle cx={85} cy={36} r={9} fill="rgba(251,191,36,0.3)" />
          <Rect x={4} y={80} width={92} height={6} rx={3} fill="#78350F" />
        </>
      ) : topic === 'travel' ? (
        <>
          <Rect x={18} y={40} width={50} height={48} rx={8} fill="#B91C1C" />
          <Rect x={33} y={28} width={20} height={14} rx={4} fill="none" stroke="#7F1D1D" strokeWidth={5} />
          <Rect x={40} y={40} width={6} height={48} fill="#FACC15" />
          <Path d="M16 44 Q42 32 70 44 L70 38 Q42 26 16 38 Z" fill={SNOW} />
          <Path d="M62 20 L92 12 L88 18 L70 24 L76 32 L70 32 L62 26 Z" fill="#93C5FD" />
          <Circle cx={24} cy={92} r={3} fill="#1E293B" />
          <Circle cx={62} cy={92} r={3} fill="#1E293B" />
        </>
      ) : topic === 'tech' ? (
        <>
          <Rect x={22} y={36} width={56} height={44} rx={12} fill="#475569" />
          <Rect x={30} y={46} width={40} height={20} rx={8} fill="#0F172A" />
          <Circle cx={42} cy={56} r={4.5} fill="#22D3EE" />
          <Circle cx={58} cy={56} r={4.5} fill="#22D3EE" />
          <Path d="M24 38 Q40 6 66 10 Q80 14 78 30 L70 28 Q62 22 56 30 L52 38 Z" fill="#DC2626" />
          <Rect x={20} y={32} width={46} height={9} rx={4.5} fill={SNOW} />
          <Circle cx={78} cy={30} r={6} fill={SNOW} />
          <Rect x={34} y={80} width={32} height={10} rx={4} fill="#334155" />
          <Path d="M86 52 l6 -6 M86 64 l8 0 M12 52 l-6 -6" stroke="#A78BFA" strokeWidth={3} strokeLinecap="round" />
        </>
      ) : topic === 'business' ? (
        <>
          <Rect x={14} y={48} width={72} height={40} rx={6} fill="#92400E" />
          <Path d="M14 50 Q50 20 86 50 Z" fill="#B45309" />
          <Rect x={14} y={58} width={72} height={6} fill="#FBBF24" />
          <Rect x={44} y={56} width={12} height={14} rx={2} fill="#FDE68A" />
          <Path d="M14 50 Q50 18 86 50 Q50 28 14 50 Z" fill={SNOW} opacity={0.9} />
          <Ellipse cx={30} cy={90} rx={9} ry={4} fill="#FBBF24" />
          <Ellipse cx={72} cy={92} rx={9} ry={4} fill="#FACC15" />
          <Path d="M66 30 L76 20 L84 26 L94 12" stroke="#4ADE80" strokeWidth={4} fill="none" strokeLinecap="round" />
        </>
      ) : topic === 'daily' ? (
        <>
          <Rect x={22} y={40} width={46} height={46} rx={8} fill="#DC2626" />
          <Path d="M68 50 Q86 52 82 66 Q78 76 68 74" stroke="#DC2626" strokeWidth={7} fill="none" />
          <Ellipse cx={45} cy={42} rx={23} ry={6} fill="#78350F" />
          <Circle cx={36} cy={38} r={6} fill={SNOW} />
          <Circle cx={48} cy={36} r={5} fill={SNOW} />
          <Path d="M34 28 Q30 18 36 10 M50 26 Q46 16 52 8" stroke="rgba(241,245,249,0.7)" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d="M30 60 h30 M30 70 h30" stroke={SNOW} strokeWidth={3} strokeDasharray="4,4" />
        </>
      ) : (
        <>
          <Rect x={16} y={44} width={68} height={46} rx={6} fill="#DC2626" />
          <Rect x={10} y={32} width={80} height={16} rx={5} fill="#EF4444" />
          <Rect x={45} y={32} width={10} height={58} fill="#FACC15" />
          <Path d="M50 32 C30 10 18 22 34 32 Z M50 32 C70 10 82 22 66 32 Z" fill="#FACC15" />
          <Path d="M8 36 Q50 22 92 36 L92 30 Q50 16 8 30 Z" fill={SNOW} />
        </>
      )}
    </Svg>
  </View>
);
