// winter/winterWorlds.ts — Cấu hình "vùng đất mùa đông" cho từng chương của bản đồ Christmas Winter Adventure.
// Chương thứ n dùng thế giới (n-1) % số thế giới → không phụ thuộc số chương, không đổi dữ liệu nghiệp vụ.

/** Bảng màu chủ đạo của bản đồ mùa đông. */
export const WINTER = {
  midnight: '#060D1F',
  night: '#0B1730',
  sapphire: '#172554',
  ice: '#93C5FD',
  cyan: '#67E8F9',
  snow: '#F1F5F9',
  green: '#22C55E',
  red: '#DC2626',
  gold: '#FBBF24',
} as const;

export type WinterDecor =
  | 'tree'
  | 'snowman'
  | 'gift'
  | 'reindeer'
  | 'cabin'
  | 'lantern'
  | 'candy'
  | 'gingerbread'
  | 'signpost'
  | 'bush';

export interface WinterWorld {
  key: string;
  /** Tên vùng đất (hiển thị trên banner, thay tên biome ở chế độ mùa đông). */
  name: string;
  /** Gradient banner chương: navy → sapphire → màu đặc trưng vùng đất. */
  banner: [string, string, string];
  /** Màu nhấn của vùng (viền banner, đường đã đi, quầng sáng). */
  accent: string;
  /** Cực quang phía sau vùng này (2 màu). */
  aurora: [string, string];
  /** Trang trí xen kẽ hai bên đường đi, lặp theo thứ tự. */
  decor: WinterDecor[];
}

export const WINTER_WORLDS: WinterWorld[] = [
  {
    key: 'pine-forest',
    name: 'Rừng Thông Tuyết Trắng',
    banner: ['#0B1730', '#172554', '#14532D'],
    accent: '#4ADE80',
    aurora: ['#22C55E', '#67E8F9'],
    decor: ['tree', 'bush', 'snowman', 'tree', 'reindeer', 'signpost'],
  },
  {
    key: 'christmas-village',
    name: 'Ngôi Làng Giáng Sinh',
    banner: ['#0B1730', '#172554', '#7F1D1D'],
    accent: '#FBBF24',
    aurora: ['#F472B6', '#93C5FD'],
    decor: ['cabin', 'lantern', 'gift', 'tree', 'gingerbread', 'candy'],
  },
  {
    key: 'frozen-lake',
    name: 'Hồ Băng Huyền Ảo',
    banner: ['#0B1730', '#172554', '#0E7490'],
    accent: '#67E8F9',
    aurora: ['#67E8F9', '#A78BFA'],
    decor: ['bush', 'snowman', 'signpost', 'tree', 'lantern', 'reindeer'],
  },
  {
    key: 'northern-lights',
    name: 'Thung Lũng Cực Quang',
    banner: ['#0B1730', '#1E1B4B', '#4C1D95'],
    accent: '#A78BFA',
    aurora: ['#22C55E', '#A78BFA'],
    decor: ['tree', 'reindeer', 'lantern', 'bush', 'snowman', 'tree'],
  },
  {
    key: 'santa-workshop',
    name: 'Xưởng Quà Ông Già Noel',
    banner: ['#0B1730', '#172554', '#9A3412'],
    accent: '#FB923C',
    aurora: ['#FBBF24', '#F472B6'],
    decor: ['gift', 'candy', 'cabin', 'gingerbread', 'gift', 'lantern'],
  },
  {
    key: 'ice-castle',
    name: 'Lâu Đài Pha Lê Băng Giá',
    banner: ['#0B1730', '#172554', '#1D4ED8'],
    accent: '#93C5FD',
    aurora: ['#93C5FD', '#67E8F9'],
    decor: ['signpost', 'tree', 'snowman', 'lantern', 'bush', 'reindeer'],
  },
];

export const getWinterWorld = (chapterNumber: number): WinterWorld =>
  WINTER_WORLDS[Math.max(0, chapterNumber - 1) % WINTER_WORLDS.length];
