export interface PronunciationResult {
  overall_score: number;
  accuracy_score: number;
  stress_score: number;
  intonation_score: number;
  fluency_score: number;
  phoneme_errors: Array<{ phoneme: string; position: number; message: string }>;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  ai_persona: string;
  opening_line: string;
  cefr_level: string;
  is_premium: boolean;
}

export const MOCK_ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'scen-1',
    title: 'Gọi Đồ Uống Tại Quán Cà Phê',
    ai_persona: 'Nhân viên pha chế Starbucks',
    opening_line: 'Hello! Welcome to Starbucks. What can I get started for you today?',
    cefr_level: 'A2',
    is_premium: false
  },
  {
    id: 'scen-2',
    title: 'Phỏng Vấn Xin Việc Vị Trí Developer',
    ai_persona: 'Giám đốc Kỹ thuật (CTO)',
    opening_line: 'Good morning! Thank you for coming in today. Could you tell me about your background?',
    cefr_level: 'B2',
    is_premium: true
  }
];

export const submitPronunciationAudioApi = async (): Promise<PronunciationResult> => {
  return {
    overall_score: 85,
    accuracy_score: 88,
    stress_score: 80,
    intonation_score: 84,
    fluency_score: 88,
    phoneme_errors: [
      { phoneme: 'ʃ', position: 10, message: 'Âm /ʃ/ đọc chưa đủ cong lưỡi' }
    ]
  };
};
