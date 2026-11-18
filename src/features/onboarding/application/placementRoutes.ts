/**
 * Đường dẫn các màn bài kiểm tra đầu vào. Khách chưa đăng nhập dùng nhóm (auth); học viên đã đăng nhập
 * bị layout gốc đưa ra khỏi (auth), nên dùng bản sao trong khu học viên (student)/placement.
 */
export interface PlacementRoutes {
  intro: string;
  test: string;
  result: string;
}

export const AUTH_PLACEMENT_ROUTES: PlacementRoutes = {
  intro: '/(auth)/placement-intro',
  test: '/(auth)/placement-test',
  result: '/(auth)/placement-result',
};

export const STUDENT_PLACEMENT_ROUTES: PlacementRoutes = {
  intro: '/(student)/placement',
  test: '/(student)/placement/test',
  result: '/(student)/placement/result',
};

/** Chọn bộ đường dẫn theo nhóm route hiện tại (segments[0] của expo-router). */
export const placementRoutesFor = (firstSegment?: string | null): PlacementRoutes =>
  firstSegment === '(student)' ? STUDENT_PLACEMENT_ROUTES : AUTH_PLACEMENT_ROUTES;

/** Khóa React Query cần làm mới sau khi có kết quả bài kiểm tra đầu vào. */
export const PLACEMENT_STATUS_KEY = ['placement', 'status'] as const;
