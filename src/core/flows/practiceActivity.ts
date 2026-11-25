/**
 * Mốc "vừa có kết quả luyện tập mới" (bài kiểm tra, AI chấm bài nói/viết, bài đọc/nghe).
 * Tab Thống kê so mốc này khi được mở lại để tải lại Đánh giá AI thay vì giữ số liệu cũ.
 */
let lastPracticeAt = 0;

export const markPracticeUpdated = () => {
  lastPracticeAt = Date.now();
};

export const getPracticeUpdatedAt = () => lastPracticeAt;
