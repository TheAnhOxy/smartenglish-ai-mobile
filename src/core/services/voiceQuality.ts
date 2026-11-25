// services/voiceQuality.ts — Chấm điểm & chọn giọng đọc tiếng Anh tự nhiên nhất có trên thiết bị.

/**
 * Giọng "đồ chơi"/máy cũ không bao giờ được chọn. iOS có hàng chục giọng như Good News (đọc như hát),
 * Junior, Kathy, Ralph, Bahh, Hysterical… gắn nhãn en-US — trước đây danh sách này thiếu nên app chọn nhầm
 * (giọng iPhone nghe "kỳ" so với web). Mã giọng `com.apple.speech.synthesis.*` / `eloquence` là bộ giọng cũ.
 */
const NOVELTY_VOICE =
  /(speech\.synthesis|eloquence|espeak|\b(albert|bad ?news|bahh|bells|boing|bubbles|cellos|deranged|good ?news|hysterical|jester|junior|kathy|organ|pipe ?organ|princess|ralph|superstar|trinoids|whisper|wobble|zarvox|fred|grandpa|grandma|rocko|shelley|flo|reed|sandy|eddy)\b)/i;
/** Giọng chuẩn, tự nhiên (kể cả bản compact mặc định của iPhone như Samantha). */
const PREFERRED_NAMES = /\b(samantha|ava|zoe|allison|nicky|evan|tom|susan|joelle|nathan|noelle|serena|karen|daniel|moira|tessa|google us english|aria|jenny|guy)\b/i;

export interface VoiceCandidate {
  name?: string;
  identifier?: string;
  language?: string;
  quality?: string;
}

/** Điểm giọng đọc; ≤ 0 nghĩa là không dùng (để hệ thống tự chọn giọng mặc định). */
export const scoreVoice = (v: VoiceCandidate): number => {
  const label = `${v.name ?? ''} ${v.identifier ?? ''}`;
  if (NOVELTY_VOICE.test(label)) return -100;
  let s = 0;
  if (/^en[-_]US/i.test(v.language ?? '')) s += 3;
  else if (/^en[-_](GB|AU|IE|CA)/i.test(v.language ?? '')) s += 1;
  else return -1; // giọng tiếng Anh vùng khác hoặc không rõ: tránh
  if (/premium/i.test(label)) s += 8;
  else if (/enhanced/i.test(label) || v.quality === 'Enhanced') s += 5;
  if (/neural|natural|network|siri/i.test(label)) s += 4;
  if (PREFERRED_NAMES.test(label)) s += 2;
  return s;
};

/** Chọn giọng tốt nhất trong danh sách (null nếu không có giọng nào dùng được). */
export const chooseBestVoice = <T extends VoiceCandidate>(voices: T[]): T | null => {
  let best: T | null = null;
  let bestScore = 0;
  for (const v of voices) {
    const sc = scoreVoice(v);
    if (sc > bestScore) {
      best = v;
      bestScore = sc;
    }
  }
  return best;
};
