// Bộ icon riêng của SmartEnglish — nét 1.8, đầu tròn, lớp màu nhạt bên trong (duotone).
// Cùng tên + cùng props với lucide-react-native để thay import mà không đổi cách dùng.
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** 'none' tắt lớp nền nhạt; màu khác → tô đặc phần thân icon */
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

type Ctx = { c: string; w: number; tone: string; toneOpacity: number };
type Draw = (x: Ctx) => React.ReactNode;

const make = (name: string, draw: Draw) => {
  const Icon = ({ size = 24, color = '#0F2A44', strokeWidth = 1.8, fill, style }: IconProps) => {
    const solid = !!fill && fill !== 'none' && fill !== 'transparent';
    const ctx: Ctx = {
      c: color,
      w: strokeWidth,
      tone: solid ? (fill as string) : fill === 'none' ? 'transparent' : color,
      toneOpacity: solid ? 1 : fill === 'none' ? 0 : 0.16,
    };
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
        {draw(ctx)}
      </Svg>
    );
  };
  Icon.displayName = name;
  return Icon;
};

const line = (x: Ctx) => ({
  stroke: x.c,
  strokeWidth: x.w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});
const toned = (x: Ctx) => ({ ...line(x), fill: x.tone, fillOpacity: x.toneOpacity });

// ───── Điều hướng ─────
export const ChevronLeft = make('ChevronLeft', (x) => <Path d="M14.5 6 8.5 12l6 6" {...line(x)} />);
export const ChevronRight = make('ChevronRight', (x) => <Path d="m9.5 6 6 6-6 6" {...line(x)} />);
export const ChevronUp = make('ChevronUp', (x) => <Path d="m6 14.5 6-6 6 6" {...line(x)} />);
export const ChevronDown = make('ChevronDown', (x) => <Path d="m6 9.5 6 6 6-6" {...line(x)} />);
export const ArrowLeft = make('ArrowLeft', (x) => <Path d="M19 12H5.5M11 6l-6 6 6 6" {...line(x)} />);
export const X = make('X', (x) => <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...line(x)} />);
export const Check = make('Check', (x) => <Path d="m5.5 12.5 4.2 4.2L18.5 7.5" {...line(x)} />);
export const Maximize2 = make('Maximize2', (x) => (
  <Path d="M14 4.5h5.5V10M10 19.5H4.5V14M19.5 4.5 13.5 10.5M4.5 19.5l6-6" {...line(x)} />
));
export const Grid = make('Grid', (x) => (
  <>
    <Rect x="4" y="4" width="6.5" height="6.5" rx="1.6" {...toned(x)} />
    <Rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" {...line(x)} />
    <Rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" {...line(x)} />
    <Rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" {...toned(x)} />
  </>
));
export const RotateCcw = make('RotateCcw', (x) => (
  <>
    <Path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" {...line(x)} />
    <Path d="M4.5 4.5V9H9" {...line(x)} />
  </>
));
export const Share2 = make('Share2', (x) => (
  <>
    <Circle cx="17.5" cy="6" r="2.5" {...toned(x)} />
    <Circle cx="6.5" cy="12" r="2.5" {...toned(x)} />
    <Circle cx="17.5" cy="18" r="2.5" {...toned(x)} />
    <Path d="m8.7 10.8 6.6-3.6M8.7 13.2l6.6 3.6" {...line(x)} />
  </>
));
export const LogIn = make('LogIn', (x) => (
  <>
    <Path d="M14 4.5h3.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H14" {...line(x)} />
    <Path d="M4.5 12H14M10.5 8l4 4-4 4" {...line(x)} />
  </>
));

// ───── Trạng thái ─────
export const CheckCircle2 = make('CheckCircle2', (x) => (
  <>
    <Circle cx="12" cy="12" r="8.5" {...toned(x)} />
    <Path d="m8.3 12.3 2.6 2.6 4.9-5.3" {...line(x)} />
  </>
));
export const XCircle = make('XCircle', (x) => (
  <>
    <Circle cx="12" cy="12" r="8.5" {...toned(x)} />
    <Path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" {...line(x)} />
  </>
));
export const AlertCircle = make('AlertCircle', (x) => (
  <>
    <Circle cx="12" cy="12" r="8.5" {...toned(x)} />
    <Path d="M12 7.8v4.8" {...line(x)} />
    <Circle cx="12" cy="16" r="0.6" fill={x.c} stroke={x.c} strokeWidth={x.w * 0.7} />
  </>
));
export const AlertTriangle = make('AlertTriangle', (x) => (
  <>
    <Path d="M10.4 4.8a1.8 1.8 0 0 1 3.2 0l6.6 12.1a1.8 1.8 0 0 1-1.6 2.6H5.4a1.8 1.8 0 0 1-1.6-2.6l6.6-12.1Z" {...toned(x)} />
    <Path d="M12 9.5v4" {...line(x)} />
    <Circle cx="12" cy="16.4" r="0.6" fill={x.c} stroke={x.c} strokeWidth={x.w * 0.7} />
  </>
));
export const HelpCircle = make('HelpCircle', (x) => (
  <>
    <Circle cx="12" cy="12" r="8.5" {...toned(x)} />
    <Path d="M9.7 9.6a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2-2.3 3.3" {...line(x)} />
    <Circle cx="12" cy="16.6" r="0.6" fill={x.c} stroke={x.c} strokeWidth={x.w * 0.7} />
  </>
));
export const Clock = make('Clock', (x) => (
  <>
    <Circle cx="12" cy="13" r="7.5" {...toned(x)} />
    <Path d="M12 9.5V13l2.5 1.5M10 3h4" {...line(x)} />
  </>
));
export const Target = make('Target', (x) => (
  <>
    <Circle cx="12" cy="12" r="8" {...line(x)} />
    <Circle cx="12" cy="12" r="4" {...toned(x)} />
    <Circle cx="12" cy="12" r="0.8" fill={x.c} />
  </>
));

// ───── Học tập ─────
export const BookOpen = make('BookOpen', (x) => (
  <>
    <Path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" {...toned(x)} />
    <Path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" {...line(x)} />
  </>
));
export const Layers = make('Layers', (x) => (
  <>
    <Rect x="7" y="4" width="13" height="16" rx="2.5" {...toned(x)} />
    <Path d="M4 7.5v10A2.5 2.5 0 0 0 6.5 20" {...line(x)} />
  </>
));
export const FileText = make('FileText', (x) => (
  <>
    <Path d="M6.5 3.5h7l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5Z" {...toned(x)} />
    <Path d="M13.5 3.5V8H18M8.5 12.5h7M8.5 16h5" {...line(x)} />
  </>
));
export const Bookmark = make('Bookmark', (x) => (
  <Path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.8L6 20V5a1 1 0 0 1 1-1Z" {...toned(x)} />
));
export const BookmarkCheck = make('BookmarkCheck', (x) => (
  <>
    <Path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.8L6 20V5a1 1 0 0 1 1-1Z" {...toned(x)} />
    <Path d="m9.3 10 1.9 1.9 3.6-3.8" {...line(x)} />
  </>
));
export const GraduationCap = make('GraduationCap', (x) => (
  <>
    <Path d="M3.5 9 12 5l8.5 4L12 13 3.5 9Z" {...toned(x)} />
    <Path d="M7 10.8v4.2c0 1.5 2.2 2.8 5 2.8s5-1.3 5-2.8v-4.2M20.5 9v5" {...line(x)} />
  </>
));
export const BrainCircuit = make('BrainCircuit', (x) => (
  <>
    <Path d="M9.5 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.3 3 3 0 0 0 2.5 4.7 2.8 2.8 0 0 0 5 1.5V6.5a2.5 2.5 0 0 0-2.5-2Z" {...toned(x)} />
    <Path d="M14.5 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5.3 3 3 0 0 1-2.5 4.7 2.8 2.8 0 0 1-5 1.5" {...line(x)} />
    <Path d="M12 12h3M15 12v-2.2M15 12l1.6 1.6" {...line(x)} />
  </>
));
export const Languages = make('Languages', (x) => (
  <>
    <Path d="M4 6h8M8 4v2M10.5 6c-.7 3.4-3 6-6 7.3M6.3 9.2c.9 1.6 2.4 2.9 4.2 3.6" {...line(x)} />
    <Path d="m12.5 20 3.5-8.5 3.5 8.5M13.7 17.2h4.6" {...line(x)} />
  </>
));
export const ScanText = make('ScanText', (x) => (
  <>
    <Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" {...line(x)} />
    <Rect x="7.5" y="8" width="9" height="8" rx="1.5" {...toned(x)} stroke="none" />
    <Path d="M8.5 10h7M8.5 12.5h5M8.5 15h6" {...line(x)} />
  </>
));
export const Camera = make('Camera', (x) => (
  <>
    <Path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2.2h5.4L16.2 7h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" {...toned(x)} />
    <Circle cx="12" cy="12.8" r="3.3" {...line(x)} />
  </>
));
export const MessageSquare = make('MessageSquare', (x) => (
  <Path d="M5.5 4.5h13A1.5 1.5 0 0 1 20 6v9a1.5 1.5 0 0 1-1.5 1.5H10L5.5 20v-3.5h0A1.5 1.5 0 0 1 4 15V6a1.5 1.5 0 0 1 1.5-1.5Z" {...toned(x)} />
));

// ───── Âm thanh / phương tiện ─────
export const Volume2 = make('Volume2', (x) => (
  <>
    <Path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z" {...toned(x)} />
    <Path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...line(x)} />
  </>
));
export const Headphones = make('Headphones', (x) => (
  <>
    <Path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" {...line(x)} />
    <Rect x="4" y="14" width="4" height="6" rx="1.6" {...toned(x)} />
    <Rect x="16" y="14" width="4" height="6" rx="1.6" {...toned(x)} />
  </>
));
export const Mic = make('Mic', (x) => (
  <>
    <Rect x="9" y="3" width="6" height="11" rx="3" {...toned(x)} />
    <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" {...line(x)} />
  </>
));
export const Play = make('Play', (x) => <Path d="M8 5.5v13l10.5-6.5L8 5.5Z" {...toned(x)} />);
export const Pause = make('Pause', (x) => (
  <>
    <Rect x="6.5" y="5" width="4" height="14" rx="1.3" {...toned(x)} />
    <Rect x="13.5" y="5" width="4" height="14" rx="1.3" {...toned(x)} />
  </>
));
export const Square = make('Square', (x) => <Rect x="5.5" y="5.5" width="13" height="13" rx="3" {...toned(x)} />);

// ───── Gamification ─────
export const Flame = make('Flame', (x) => (
  <>
    <Path d="M12 3c.6 3.2 4.8 5.1 4.8 9.7A4.8 4.8 0 0 1 12 17.5a4.8 4.8 0 0 1-4.8-4.8c0-2.3 1.3-3.7 2.3-4.6.2 1.7 1 2.6 1.9 2.9C11 8.7 11.1 5.6 12 3Z" {...toned({ ...x, toneOpacity: x.toneOpacity ? Math.max(x.toneOpacity, 0.3) : 0 })} />
    <Path d="M12 21v-1.2" {...line(x)} />
  </>
));
export const Zap = make('Zap', (x) => (
  <Path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" {...toned({ ...x, toneOpacity: x.toneOpacity ? Math.max(x.toneOpacity, 0.25) : 0 })} />
));
export const Heart = make('Heart', (x) => (
  <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" {...toned(x)} />
));
export const Coins = make('Coins', (x) => (
  <>
    <Circle cx="9.5" cy="9.5" r="5.5" {...toned(x)} />
    <Path d="M14.6 7.6a5.5 5.5 0 1 1-6.9 7" {...line(x)} />
    <Path d="M9.5 7.5v4" {...line(x)} />
  </>
));
export const Trophy = make('Trophy', (x) => (
  <>
    <Path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0V4Z" {...toned(x)} />
    <Path d="M7.5 6H5a2.5 2.5 0 0 0 2.6 3.5M16.5 6H19a2.5 2.5 0 0 1-2.6 3.5M12 13.5V17M8.5 20h7l-.8-3H9.3l-.8 3Z" {...line(x)} />
  </>
));
export const Award = make('Award', (x) => (
  <>
    <Circle cx="12" cy="9" r="5.5" {...toned(x)} />
    <Path d="m9 13.7-1.5 6.8L12 18l4.5 2.5-1.5-6.8" {...line(x)} />
  </>
));
export const Star = make('Star', (x) => (
  <Path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 4Z" {...toned(x)} />
));
export const Sparkles = make('Sparkles', (x) => (
  <>
    <Path d="M10 4.5 11.6 9 16 10.5l-4.4 1.6L10 16.5l-1.6-4.4L4 10.5 8.4 9 10 4.5Z" {...toned(x)} />
    <Path d="M17.5 14v5M15 16.5h5M17 4v3M15.5 5.5h3" {...line(x)} />
  </>
));
export const Lightbulb = make('Lightbulb', (x) => (
  <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" {...toned(x)} />
));
export const Lock = make('Lock', (x) => (
  <>
    <Rect x="5.5" y="10.5" width="13" height="9.5" rx="2" {...toned(x)} />
    <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" {...line(x)} />
  </>
));
export const ThumbsUp = make('ThumbsUp', (x) => (
  <>
    <Rect x="3.5" y="10" width="4" height="10" rx="1.2" {...toned(x)} />
    <Path d="M7.5 11 11 4.5a2 2 0 0 1 2.6 2.3L13 10h5.2a1.8 1.8 0 0 1 1.8 2.1l-1.2 6.2A2 2 0 0 1 16.8 20H7.5" {...line(x)} />
  </>
));
export const ThumbsDown = make('ThumbsDown', (x) => (
  <>
    <Rect x="3.5" y="4" width="4" height="10" rx="1.2" {...toned(x)} />
    <Path d="M7.5 13 11 19.5a2 2 0 0 0 2.6-2.3L13 14h5.2a1.8 1.8 0 0 0 1.8-2.1l-1.2-6.2A2 2 0 0 0 16.8 4H7.5" {...line(x)} />
  </>
));

export const Activity = make('Activity', (x) => <Path d="M3.5 12h3.8l2.4-6.5 4.6 13 2.4-6.5h3.8" {...line(x)} />);

export const Info = make('Info', (x) => (
  <>
    <Circle cx="12" cy="12" r="8.5" {...toned(x)} />
    <Path d="M12 11v5" {...line(x)} />
    <Circle cx="12" cy="8" r="0.6" fill={x.c} stroke={x.c} strokeWidth={x.w * 0.7} />
  </>
));
export const Undo2 = make('Undo2', (x) => (
  <>
    <Path d="M9 14 4.5 9.5 9 5" {...line(x)} />
    <Path d="M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-3" {...line(x)} />
  </>
));

// ───── Hệ thống ─────
export const Bell = make('Bell', (x) => (
  <>
    <Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" {...toned(x)} />
    <Path d="M10 20.5a2.2 2.2 0 0 0 4 0" {...line(x)} />
  </>
));
export const User = make('User', (x) => (
  <>
    <Circle cx="12" cy="8.5" r="3.5" {...toned(x)} />
    <Path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" {...line(x)} />
  </>
));
