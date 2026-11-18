/**
 * Nhịp phần nghe TOEIC trong chế độ thi thử: thời gian trả lời sau khi băng dừng và
 * thời gian chờ tối đa (phòng khi âm thanh/TTS lỗi, không bao giờ báo "đã phát xong").
 *
 * Đề thật: Part 1–2 nghỉ 5 giây sau mỗi câu; Part 3–4 mỗi câu hỏi được đọc rồi nghỉ 8 giây.
 * Ứng dụng không đọc câu hỏi Part 3–4 nên cộng thêm thời gian để học viên tự đọc câu hỏi.
 */
export const ANSWER_SECONDS: Record<string, number> = {
  PART_1: 8,
  PART_2: 8,
  PART_3: 12,
  PART_4: 12,
};

/** Số giây trả lời sau khi băng của câu/cụm câu dừng. Part 3–4 tính theo số câu trong cụm. */
export const answerWindowSeconds = (part: string | undefined, questionCount: number): number => {
  const perQuestion = ANSWER_SECONDS[part ?? ''] ?? 8;
  const count = part === 'PART_3' || part === 'PART_4' ? Math.max(1, questionCount) : 1;
  return perQuestion * count;
};

/** Tốc độ đọc TTS (rate 0.9) khoảng 2,2 từ/giây. */
const WORDS_PER_SECOND = 2.2;

/**
 * Thời gian chờ tối đa (giây) cho băng của một câu/cụm câu: theo độ dài file nếu biết,
 * nếu không thì ước theo số từ của transcript. Luôn dư 10 giây và không dưới 15 giây.
 */
export const audioWatchdogSeconds = (opts: { durationSec?: number | null; script?: string | null }): number => {
  if (opts.durationSec && opts.durationSec > 0) return Math.ceil(opts.durationSec) + 10;
  const words = (opts.script ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(15, Math.ceil(words / WORDS_PER_SECOND) + 10);
};
