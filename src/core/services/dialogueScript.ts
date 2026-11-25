import { scoreVoice } from './voiceQuality';
// Tách lời thoại bài nghe thành từng lượt nói để đọc mỗi người bằng một giọng riêng.

export type SpeakerGender = 'male' | 'female' | 'neutral';

export interface DialogueLine {
  /** Khóa người nói ổn định trong một bài, ví dụ "male-1", "female-2", "neutral-1". */
  speaker: string;
  gender: SpeakerGender;
  text: string;
}

const SPEAKER_RE =
  /^\s*[([]?\s*(Man|Woman|Male|Female|M|W|Boy|Girl|Narrator|Announcer|Speaker|Host|Guide)\s*([A-Z]|\d+)?\s*[)\]]?\s*[:\-–—]\s*(.*)$/i;

const genderOf = (label: string): SpeakerGender => {
  const l = label.toLowerCase();
  if (['woman', 'female', 'w', 'girl'].includes(l)) return 'female';
  if (['man', 'male', 'm', 'boy'].includes(l)) return 'male';
  return 'neutral';
};

/** "Woman: Hi.\nMan 2: Hello." → [{female-1, "Hi."}, {male-2, "Hello."}]. Dòng không có nhãn nối vào lượt trước. */
export const parseDialogue = (script: string): DialogueLine[] => {
  const lines: DialogueLine[] = [];
  const raw = script
    .replace(/\\n/g, '\n')
    // Kịch bản viết liền một dòng ("Man: ... Woman: ..."): tách trước mỗi nhãn người nói giữa câu
    .replace(/([.?!"”…])\s+(?=(?:Man|Woman|Male|Female|Boy|Girl|Narrator|Announcer|Speaker|Host|Guide)\s*(?:[A-Z]|\d+)?\s*:)/g, '$1\n')
    .replace(/^\s*["“]|["”]\s*$/g, '')
    .split(/\n+/);
  for (const part of raw) {
    const line = part.trim();
    if (!line) continue;
    const m = SPEAKER_RE.exec(line);
    if (m && m[3].trim()) {
      const gender = genderOf(m[1]);
      const index = m[2] ? (/^\d+$/.test(m[2]) ? Number(m[2]) : m[2].toUpperCase().charCodeAt(0) - 64) : 1;
      lines.push({ speaker: `${gender}-${index}`, gender, text: m[3].trim() });
    } else if (lines.length > 0) {
      lines[lines.length - 1].text += ` ${line}`;
    } else {
      lines.push({ speaker: 'neutral-1', gender: 'neutral', text: line });
    }
  }
  return lines;
};

export interface VoiceInfo {
  identifier: string;
  name: string;
  language: string;
}

const FEMALE_HINTS = [
  'female', 'woman', 'samantha', 'karen', 'moira', 'tessa', 'fiona', 'victoria', 'zira', 'aria', 'jenny',
  'susan', 'hazel', 'serena', 'ava', 'allison', 'nicky', 'kate', 'catherine', 'libby', 'sonia', 'natasha',
  'clara', 'emma', 'michelle', 'linda', 'heather', 'google us english', 'google uk english female',
  'x-iob', 'x-iog', 'x-sfg', 'x-tpc', 'x-tpf',
];
const MALE_HINTS = [
  'male', 'daniel', 'alex', 'fred', 'david', 'mark', 'guy', 'george', 'ryan', 'tom', 'aaron', 'arthur',
  'gordon', 'rishi', 'oliver', 'james', 'william', 'liam', 'andrew', 'brian', 'christopher', 'eric', 'roger',
  'x-iol', 'x-iom', 'x-tpd', 'google uk english male',
];

export const voiceGender = (voice: VoiceInfo): SpeakerGender => {
  const key = `${voice.name} ${voice.identifier}`.toLowerCase();
  // "female" chứa "male": xét giọng nữ trước
  if (FEMALE_HINTS.some((h) => key.includes(h))) return 'female';
  if (MALE_HINTS.some((h) => key.includes(h))) return 'male';
  return 'neutral';
};

export interface SpeakerVoice {
  voice?: string;
  pitch: number;
}

/**
 * Gán giọng cho từng người nói: ưu tiên giọng tiếng Anh đúng giới tính, mỗi người một giọng khác nhau.
 * Thiết bị không có giọng phù hợp thì đổi cao độ để vẫn phân biệt được nam/nữ.
 */
export const assignVoices = (lines: DialogueLine[], voices: VoiceInfo[]): Record<string, SpeakerVoice> => {
  // Chỉ giọng tiếng Anh tự nhiên: bỏ giọng "đồ chơi" của iOS (Ralph, Kathy, Good News…), giọng tốt lên trước
  const english = voices.filter((v) => v.language.toLowerCase().replace('_', '-').startsWith('en') && scoreVoice(v) > 0);
  const isUs = (v: VoiceInfo) => Number(v.language.toLowerCase().includes('us'));
  const preferUs = (a: VoiceInfo, b: VoiceInfo) => isUs(b) - isUs(a) || scoreVoice(b) - scoreVoice(a);
  const pools: Record<SpeakerGender, VoiceInfo[]> = {
    male: english.filter((v) => voiceGender(v) === 'male').sort(preferUs),
    female: english.filter((v) => voiceGender(v) === 'female').sort(preferUs),
    neutral: [],
  };
  const used: Record<SpeakerGender, number> = { male: 0, female: 0, neutral: 0 };
  const basePitch: Record<SpeakerGender, number> = { male: 0.85, female: 1.15, neutral: 1 };
  const result: Record<string, SpeakerVoice> = {};
  for (const line of lines) {
    if (result[line.speaker]) continue;
    const n = used[line.gender]++;
    const pool = pools[line.gender];
    const voice = pool.length > 0 ? pool[n % pool.length] : undefined;
    // Hết giọng khác nhau cho cùng giới tính: lệch cao độ để người thứ hai nghe khác người thứ nhất
    const shift = pool.length > n ? 0 : (line.gender === 'male' ? -0.1 : 0.1) * n;
    result[line.speaker] = {
      voice: voice?.identifier,
      pitch: voice && shift === 0 ? 1 : Math.min(1.5, Math.max(0.6, basePitch[line.gender] + shift)),
    };
  }
  return result;
};
