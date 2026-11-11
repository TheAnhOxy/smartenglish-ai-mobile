import { Platform } from 'react-native';

// Font Inter chưa được nạp vào app → không được khai báo tên "Inter" trơn:
// - Web: trình duyệt không có font dự phòng sẽ rơi về Times New Roman → dùng chuỗi font hệ thống giống react-native-web.
// - iOS/Android: để undefined → dùng font hệ thống (San Francisco / Roboto), đồng nhất với các Text không đặt font.
const FONT_FAMILY: string | undefined = Platform.select({
  web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

export const font = {
  family: FONT_FAMILY,
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  scale: 1.2,
};
