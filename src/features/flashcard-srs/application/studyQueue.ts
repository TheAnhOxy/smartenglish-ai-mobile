/**
 * Logic hàng đợi ôn tập flashcard (tách khỏi màn hình để kiểm thử):
 * - chuyển thẻ từ API sang dạng hiển thị,
 * - học lại ngay trong lượt khi chọn "Quên"/"Khó",
 * - mô tả thời điểm ôn tiếp theo.
 */
import type { DeckCardDTO } from '../data/deckApi';

export interface StudyCard {
  id: string;
  cardId?: number;
  word: string;
  ipa: string;
  type: string;
  cefrLevel?: string;
  meaning: string;
  meaningEn?: string;
  example: string;
  exampleVi?: string;
  collocation?: string;
  audioUrl?: string;
  imageUrl?: string;
  /** Thẻ người học chưa ôn lần nào. */
  isNew?: boolean;
  /** Số lần thẻ đã được đưa lại trong lượt vì chọn "Quên"/"Khó". */
  relearnCount?: number;
  /** Trạng thái SM-2 hiện tại (để hiển thị khoảng ôn tiếp theo trên nút chấm). */
  repetitions?: number;
  intervalDays?: number;
  easeFactor?: number;
}

/** Số lần tối đa một thẻ được học lại trong cùng một lượt. */
export const MAX_RELEARN_PER_SESSION = 2;

/** Thẻ của bộ thẻ (customFront "word  /ipa/", customBack "nghĩa\nVí dụ: ...") → thẻ hiển thị. */
export const mapDeckCardToStudyCard = (c: DeckCardDTO & { isNew?: boolean }, idx: number): StudyCard => {
  const front = (c.customFront || '').trim();
  const word = front.split(/\s{2,}|\t|\//)[0]?.trim() || `Từ #${idx + 1}`;
  const ipaMatch = front.match(/\/[^/]+\//);
  const backLines = (c.customBack || '').split('\n');
  const exampleLine = backLines.find((l) => /^(ví dụ:|example:)/i.test(l.trim()));
  return {
    id: String(c.id ?? idx + 1),
    cardId: c.id != null ? Number(c.id) : undefined,
    word,
    ipa: ipaMatch ? ipaMatch[0] : '',
    type: c.userNote || 'Ghi nhớ',
    cefrLevel: '',
    meaning: backLines[0]?.trim() || 'Nghĩa từ vựng',
    meaningEn: '',
    example: exampleLine ? exampleLine.trim().replace(/^(ví dụ:|example:)\s*/i, '') : '',
    exampleVi: '',
    collocation: '',
    imageUrl: c.imageOverrideUrl,
    isNew: Boolean(c.isNew),
    relearnCount: 0,
    repetitions: c.repetitions ?? 0,
    intervalDays: c.intervalDays ?? 0,
    easeFactor: c.easeFactor ?? undefined,
  };
};

/**
 * Sau khi chấm một thẻ: "Quên" (0) hoặc "Khó" (1) → đưa thẻ về cuối lượt để học lại ngay
 * (tối đa MAX_RELEARN_PER_SESSION lần), giống bước "học lại trong ngày" của Anki.
 */
export const requeueAfterRating = (queue: StudyCard[], index: number, rating: number): StudyCard[] => {
  const card = queue[index];
  if (!card || rating >= 2) return queue;
  const count = card.relearnCount ?? 0;
  if (count >= MAX_RELEARN_PER_SESSION) return queue;
  // Server đã đặt lại thẻ về lần lặp 0, khoảng 1 ngày
  return [...queue, { ...card, id: `${card.id}#r${count + 1}`, relearnCount: count + 1, repetitions: 0, intervalDays: 1 }];
};

/** "hôm nay" / "ngày mai" / "sau N ngày (dd/mm)" cho ngày ôn tiếp theo dạng yyyy-MM-dd. */
export const describeNextDue = (nextDueDate?: string | null, today: Date = new Date()): string | null => {
  if (!nextDueDate) return null;
  const [y, m, d] = nextDueDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const due = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((due - now) / 86_400_000);
  if (days <= 0) return 'hôm nay';
  if (days === 1) return 'ngày mai';
  return `sau ${days} ngày (${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')})`;
};

/** Tên bộ thẻ để so khớp: bỏ biểu tượng đầu tên, khoảng trắng thừa, không phân biệt hoa thường. */
export const normalizeDeckName = (name?: string | null): string =>
  (name || '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('vi');

/**
 * Danh sách "Hệ thống" hiển thị chủ đề từ content-service (id chủ đề), còn lịch ôn SM-2 chạy trên
 * bộ thẻ hệ thống của learning-service (id khác). Tìm bộ thẻ hệ thống cùng tên với chủ đề.
 */
export const findSystemDeckIdForTopic = (
  topicName: string | null | undefined,
  systemDecks: { id: number | string; name?: string | null }[],
): number | null => {
  const key = normalizeDeckName(topicName);
  if (!key) return null;
  const match = systemDecks.find((d) => normalizeDeckName(d.name) === key);
  return match ? Number(match.id) : null;
};

/**
 * Khoảng ngày đến lần ôn tiếp theo nếu chấm mức rating (0 Chưa thuộc, 1 Khó, 2 Thuộc, 3 Dễ),
 * cùng công thức SM-2 với learning-service: chấm dưới 2 → học lại, 1 ngày; lần đúng thứ 1 → 1 ngày,
 * thứ 2 → 6 ngày, sau đó khoảng cũ × hệ số dễ.
 */
export const previewIntervalDays = (card: StudyCard, rating: number): number => {
  if (rating < 2) return 1;
  const reps = (card.repetitions ?? 0) + 1;
  if (reps === 1) return 1;
  if (reps === 2) return 6;
  return Math.max(1, Math.round((card.intervalDays || 1) * (card.easeFactor ?? 2.5)));
};

/** Chữ nhỏ dưới nút chấm: "Học lại ngay" hoặc "N ngày". */
export const ratingHint = (card: StudyCard | undefined, rating: number): string => {
  if (!card) return '';
  if (rating < 2) return 'Học lại ngay';
  return `${previewIntervalDays(card, rating)} ngày`;
};
