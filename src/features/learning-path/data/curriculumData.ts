export interface UnitNode {
  id: string;
  unit_number: number;
  title_vi: string;
  title_en: string;
  description_vi: string;
  is_premium: boolean;
  status: 'completed' | 'current' | 'unlocked' | 'locked';
  icon_type: 'star' | 'grad' | 'book' | 'speech' | 'crown';
  total_lessons: number;
  completed_lessons: number;
  xp_reward: number;
}

export interface Chapter {
  id: string;
  chapter_number: number;
  title_vi: string;
  title_en: string;
  is_premium: boolean;
  units: UnitNode[];
  /** Chương bắt đầu theo kết quả kiểm tra đầu vào. */
  placement_start?: boolean;
  /** Chương thấp hơn trình độ đầu vào: mở sẵn để ôn lại. */
  below_placement?: boolean;
  placement_level?: string | null;
  /** Trình độ CEFR của chương (mức thấp nhất của khóa học). */
  cefr_level?: string | null;
}
