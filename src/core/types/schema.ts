import { z } from 'zod';

// ==========================================
// 1. AUTH SCHEMA
// ==========================================
export type UserRole = 'admin' | 'teacher' | 'student';
export type UserPlan = 'free' | 'premium_monthly' | 'premium_yearly' | 'lifetime' | 'student';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  role: z.enum(['admin', 'teacher', 'student']).default('student'),
  plan: z.enum(['free', 'premium_monthly', 'premium_yearly', 'lifetime', 'student']).default('free'),
  plan_expires_at: z.string().optional().nullable(),
  cefr_level: z.string().optional().nullable(),
  target_goal: z.string().optional().nullable(),
  ui_language: z.string().default('vi'),
  timezone: z.string().default('Asia/Ho_Chi_Minh'),
  tts_voice: z.string().optional().nullable(),
  tts_speed: z.number().default(1.0),
  is_active: z.boolean().default(true),
  is_email_verified: z.boolean().default(false),
  last_login_at: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  referral_code: z.string().optional().nullable(),
  referred_by: z.string().uuid().optional().nullable(),
  daily_goal_xp: z.number().default(50),
  onboarding_completed: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string()
});
export type User = z.infer<typeof UserSchema>;

// ==========================================
// 2. CONTENT SCHEMA
// ==========================================
export const TopicSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name_vi: z.string(),
  name_en: z.string(),
  icon_emoji: z.string().optional().nullable(),
  color_hex: z.string().optional().nullable(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  word_count: z.number().default(0)
});
export type Topic = z.infer<typeof TopicSchema>;

export const WordSchema = z.object({
  id: z.string().uuid(),
  word: z.string(),
  ipa_us: z.string().optional().nullable(),
  ipa_uk: z.string().optional().nullable(),
  audio_us_url: z.string().optional().nullable(),
  audio_uk_url: z.string().optional().nullable(),
  part_of_speech: z.string().optional().nullable(),
  cefr_level: z.string().optional().nullable(),
  frequency_rank: z.number().optional().nullable(),
  image_url: z.string().optional().nullable(),
  topic_id: z.number().optional().nullable(),
  is_system: z.boolean().default(true),
  is_approved: z.boolean().default(false)
});
export type Word = z.infer<typeof WordSchema>;

export const WordMeaningSchema = z.object({
  id: z.string().uuid(),
  word_id: z.string().uuid(),
  meaning_vi: z.string(),
  meaning_en: z.string().optional().nullable(),
  usage_note: z.string().optional().nullable(),
  sort_order: z.number().default(0)
});
export type WordMeaning = z.infer<typeof WordMeaningSchema>;

// ==========================================
// 3. LEARNING SCHEMA (SRS, Gamification, Quiz)
// ==========================================
export type SrsStage = 'new' | 'learning' | 'review' | 'mastered';
export type SrsRating = 0 | 1 | 2 | 3; // 0=Again, 1=Hard, 2=Good, 3=Easy

export const DeckSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  source: z.enum(['manual', 'system_topic', 'image_scan', 'reading', 'chatbot']),
  is_public: z.boolean().default(false),
  card_count: z.number().default(0),
  shared_code: z.string().optional().nullable(),
  created_at: z.string()
});
export type Deck = z.infer<typeof DeckSchema>;

export const DeckCardSchema = z.object({
  id: z.string().uuid(),
  deck_id: z.string().uuid(),
  word_id: z.string().uuid().optional().nullable(),
  custom_front: z.string().optional().nullable(),
  custom_back: z.string().optional().nullable(),
  user_note: z.string().optional().nullable(),
  is_suspended: z.boolean().default(false)
});
export type DeckCard = z.infer<typeof DeckCardSchema>;

export const SrsStateSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  deck_card_id: z.string().uuid(),
  interval_days: z.number().default(1),
  repetitions: z.number().default(0),
  ease_factor: z.number().default(2.5),
  due_date: z.string(),
  srs_stage: z.enum(['new', 'learning', 'review', 'mastered']).default('new'),
  correct_count: z.number().default(0),
  incorrect_count: z.number().default(0),
  lapses: z.number().default(0)
});
export type SrsState = z.infer<typeof SrsStateSchema>;

export const UserStatsSchema = z.object({
  user_id: z.string().uuid(),
  xp_total: z.number().default(0),
  xp_this_week: z.number().default(0),
  level: z.number().default(1),
  coins: z.number().default(0),
  streak_current: z.number().default(0),
  streak_longest: z.number().default(0),
  streak_freeze_count: z.number().default(0),
  league: z.enum(['bronze', 'silver', 'gold', 'diamond']).default('bronze')
});
export type UserStats = z.infer<typeof UserStatsSchema>;

// ==========================================
// 4. TEACHER & CLASS MEMBERSHIP SCHEMA
// ==========================================
export type ClassMemberRole = 'student' | 'assistant_teacher';
export type AssignmentType = 'quiz' | 'vocab_deck' | 'writing' | 'roleplay' | 'reading';
export type AssignmentStatus = 'Chưa làm' | 'Đang làm' | 'Đã nộp' | 'Đạt' | 'Chưa đạt';

export const ClassSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  teacher_id: z.string().uuid(),
  join_code: z.string(),
  max_students: z.number().default(30),
  cefr_target: z.string().default('B1'),
  status: z.enum(['active', 'archived', 'scheduled']).default('active'),
  start_date: z.string(),
  end_date: z.string()
});
export type TeacherClass = z.infer<typeof ClassSchema>;

export const ClassMemberSchema = z.object({
  class_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['student', 'assistant_teacher']).default('student'),
  joined_at: z.string(),
  status: z.enum(['active', 'removed', 'dropped']).default('active')
});
export type ClassMember = z.infer<typeof ClassMemberSchema>;

export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  class_id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  assignment_type: z.enum(['quiz', 'vocab_deck', 'writing', 'roleplay', 'reading']),
  reference_id: z.string().uuid(),
  title: z.string(),
  instructions: z.string().optional().nullable(),
  due_date: z.string(),
  passing_score: z.number().default(70),
  is_graded: z.boolean().default(true)
});
export type Assignment = z.infer<typeof AssignmentSchema>;

// GIẢ ĐỊNH NGOÀI SCHEMA GỐC: Bảng assignment_submissions theo dõi trạng thái nộp bài theo từng học viên
export interface AssignmentSubmission {
  id: string;
  class_id: string;
  assignment_id: string;
  user_id: string;
  status: AssignmentStatus;
  score?: number;
  submitted_at?: string;
}

// ==========================================
// 5. SOCIAL SCHEMA
// ==========================================
export const CommunityPostSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string(),
  image_url: z.string().optional().nullable(),
  post_type: z.enum(['achievement', 'question', 'study_log', 'shared_deck', 'general']),
  visibility: z.enum(['public', 'friends_only', 'private']).default('public'),
  like_count: z.number().default(0),
  comment_count: z.number().default(0),
  is_pinned: z.boolean().default(false),
  created_at: z.string()
});
export type CommunityPost = z.infer<typeof CommunityPostSchema>;

export const FriendshipSchema = z.object({
  user_id: z.string().uuid(),
  friend_id: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'blocked']).default('pending'),
  requested_by: z.string().uuid(),
  created_at: z.string()
});
export type Friendship = z.infer<typeof FriendshipSchema>;

// ==========================================
// 6. NOTIFICATION SCHEMA
// ==========================================
export type NotificationType = 'streak' | 'leaderboard' | 'reminder' | 'achievement' | 'marketing' | 'system' | 'student_at_risk' | 'assignment_submitted' | 'class_join_request';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: NotificationType;
  is_read: boolean;
  target_route?: string;
  created_at: string;
}

// ==========================================
// 7. MONGODB COLLECTIONS (Writing & Chatbot)
// ==========================================
export interface WritingError {
  error_id: string;
  type: 'spelling' | 'grammar' | 'word_choice';
  position_start: number;
  position_end: number;
  original: string;
  suggestion: string;
  explanation_vi: string;
  severity: 'minor' | 'major';
  is_accepted: boolean;
}

export interface WritingAnalysis {
  id: string;
  submission_id: string;
  user_id: string;
  analyzed_at: string;
  ai_model: string;
  errors: WritingError[];
  scoring_detail: {
    task_achievement: number;
    coherence_cohesion: number;
    lexical_resource: number;
    grammatical_range: number;
  };
  rewritten_text: string;
}

export interface ChatMessage {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  sent_at: string;
  grammar_check?: {
    has_error: boolean;
    corrected_text: string;
    rule_explanation_vi: string;
    natural_alternatives: string[];
  };
  referenced_word_ids?: string[];
}
