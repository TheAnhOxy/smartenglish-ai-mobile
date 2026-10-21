import {
  User,
  UserStats,
  Deck,
  DeckCard,
  SrsState,
  NotificationItem,
  CommunityPost,
  Word
} from '../types/schema';

// ==========================================
// 1. DEMO USERS (3 ROLES)
// ==========================================
export const MOCK_USERS: Record<string, User> = {
  student: {
    id: '3',
    email: 'student.theanh@gmail.com',
    phone: '+84901234567',
    display_name: 'Nguyễn Thế Anh (Học Viên)',
    username: 'student_theanh',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'student',
    plan: 'free',
    cefr_level: 'B1',
    target_goal: 'TOEIC 750+',
    ui_language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    tts_speed: 1.0,
    is_active: true,
    is_email_verified: true,
    referral_code: 'SEAI_STUDENT1',
    daily_goal_xp: 50,
    onboarding_completed: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-16T11:00:00Z'
  },
  teacher: {
    id: '2',
    email: 'teacher.john@smartenglish.com',
    phone: '+84988776655',
    display_name: 'Cô Trần Mai Hương (IELTS 8.5)',
    username: 'teacher_huong',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    role: 'teacher',
    plan: 'premium_yearly',
    cefr_level: 'C2',
    target_goal: 'Giảng dạy',
    ui_language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    tts_speed: 1.0,
    is_active: true,
    is_email_verified: true,
    referral_code: 'TEACHER_HUONG88',
    daily_goal_xp: 100,
    onboarding_completed: true,
    created_at: '2025-06-01T00:00:00Z',
    updated_at: '2026-08-16T11:00:00Z'
  },
  admin: {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@smartenglish.ai',
    phone: '+84911223344',
    display_name: 'Hệ Thống Quản Trị Viên',
    username: 'system_admin',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'admin',
    plan: 'lifetime',
    cefr_level: 'C2',
    target_goal: 'Quản trị',
    ui_language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    tts_speed: 1.0,
    is_active: true,
    is_email_verified: true,
    referral_code: 'ADMIN_MASTER',
    daily_goal_xp: 0,
    onboarding_completed: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-08-16T11:00:00Z'
  }
};

export const MOCK_USER_STATS: Record<string, UserStats> = {
  '11111111-1111-1111-1111-111111111111': {
    user_id: '11111111-1111-1111-1111-111111111111',
    xp_total: 1250,
    xp_this_week: 340,
    level: 4,
    coins: 450,
    streak_current: 7,
    streak_longest: 14,
    streak_freeze_count: 2,
    league: 'silver'
  }
};

// ==========================================
// 2. FLASHCARDS & VOCABULARY (G)
// ==========================================
export const MOCK_WORDS: Word[] = [
  {
    id: 'word-01',
    word: 'Negotiation',
    ipa_us: '/nɪˌɡoʊ.ʃiˈeɪ.ʃən/',
    ipa_uk: '/nɪˌɡəʊ.ʃiˈeɪ.ʃən/',
    part_of_speech: 'noun',
    cefr_level: 'B2',
    frequency_rank: 1200,
    image_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300',
    is_system: true,
    is_approved: true
  },
  {
    id: 'word-02',
    word: 'Accomplish',
    ipa_us: '/əˈkɑːm.plɪʃ/',
    ipa_uk: '/əˈkʌm.plɪʃ/',
    part_of_speech: 'verb',
    cefr_level: 'B2',
    frequency_rank: 1800,
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300',
    is_system: true,
    is_approved: true
  }
];

export const MOCK_DECKS: Deck[] = [
  {
    id: 'deck-toeic-essential',
    user_id: '11111111-1111-1111-1111-111111111111',
    name: 'TOEIC 600 Essential Words',
    description: 'Bộ từ vựng sống còn cho kỳ thi TOEIC Listening & Reading',
    source: 'system_topic',
    is_public: true,
    card_count: 2,
    shared_code: 'TOEIC600',
    created_at: '2026-08-01T08:00:00Z'
  }
];

export const MOCK_DECK_CARDS: DeckCard[] = [
  {
    id: 'card-01',
    deck_id: 'deck-toeic-essential',
    word_id: 'word-01',
    user_note: 'Từ này hay xuất hiện ở Part 7 bài đọc hợp đồng.',
    is_suspended: false
  },
  {
    id: 'card-02',
    deck_id: 'deck-toeic-essential',
    word_id: 'word-02',
    user_note: 'Đi kèm với accomplish a goal.',
    is_suspended: false
  }
];

export const MOCK_SRS_STATES: SrsState[] = [
  {
    id: 'srs-01',
    user_id: '11111111-1111-1111-1111-111111111111',
    deck_card_id: 'card-01',
    interval_days: 1,
    repetitions: 0,
    ease_factor: 2.5,
    due_date: '2026-08-16', // Due hôm nay
    srs_stage: 'new',
    correct_count: 0,
    incorrect_count: 0,
    lapses: 0
  },
  {
    id: 'srs-02',
    user_id: '11111111-1111-1111-1111-111111111111',
    deck_card_id: 'card-02',
    interval_days: 3,
    repetitions: 2,
    ease_factor: 2.6,
    due_date: '2026-08-19',
    srs_stage: 'learning',
    correct_count: 2,
    incorrect_count: 0,
    lapses: 0
  }
];

// ==========================================
// 4. NOTIFICATIONS (O)
// ==========================================
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    user_id: '11111111-1111-1111-1111-111111111111',
    title: 'Cảnh báo Chuỗi Lửa Streak 🔥',
    body: 'Bạn sắp hết ngày hôm nay! Ôn 5 thẻ từ vựng để giữ chuỗi 7 ngày liên tiếp.',
    notification_type: 'streak',
    is_read: false,
    target_route: '/(student)/review/decks',
    created_at: '2026-08-16T09:30:00Z'
  },
  {
    id: 'notif-02',
    user_id: '11111111-1111-1111-1111-111111111111',
    title: 'Bài Tập Mới Được Giao 📚',
    body: 'Cô Trần Mai Hương vừa giao bài tập "Bài Test Ngữ Pháp: Thì Hiện Tại Hoàn Thành".',
    notification_type: 'assignment_submitted',
    is_read: false,
    target_route: '/(student)/profile/classes/class-101/assignments',
    created_at: '2026-08-16T08:00:00Z'
  },
  {
    id: 'notif-03',
    user_id: '11111111-1111-1111-1111-111111111111',
    title: 'Thăng Hạng Bảng Xếp Hạng 🏆',
    body: 'Chúc mừng! Bạn vừa vươn lên Top 3 Giải Đấu Silver Tuần 32.',
    notification_type: 'leaderboard',
    is_read: true,
    target_route: '/(student)/league',
    created_at: '2026-08-15T18:00:00Z'
  }
];

// ==========================================
// 5. COMMUNITY POSTS (N)
// ==========================================
export const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'post-01',
    user_id: '11111111-1111-1111-1111-111111111111',
    content: 'Vừa hoàn thành mốc 7 ngày học liên tiếp trên SmartEnglish AI! Mọi người cùng cố gắng nhé! 🎉🔥',
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500',
    post_type: 'achievement',
    visibility: 'public',
    like_count: 12,
    comment_count: 3,
    is_pinned: false,
    created_at: '2026-08-16T10:00:00Z'
  }
];
