import {
  User,
  UserStats,
  TeacherClass,
  ClassMember,
  Assignment,
  AssignmentSubmission,
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
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@smartenglish.ai',
    phone: '+84901234567',
    display_name: 'Nguyễn Văn Học Viên',
    username: 'student_lexora',
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
    id: '22222222-2222-2222-2222-222222222222',
    email: 'teacher@smartenglish.ai',
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
// 2. CLASSES & ASSIGNMENTS (TEACHER & STUDENT)
// ==========================================
export const MOCK_CLASSES: TeacherClass[] = [
  {
    id: 'class-101',
    name: 'Lớp Luyện Thi TOEIC 750+ (K42)',
    description: 'Chuyên sâu từ vựng & ngữ pháp nâng cao TOEIC Format 2026',
    teacher_id: '22222222-2222-2222-2222-222222222222',
    join_code: 'TOEIC750K42',
    max_students: 30,
    cefr_target: 'B2',
    status: 'active',
    start_date: '2026-08-01',
    end_date: '2026-11-30'
  },
  {
    id: 'class-102',
    name: 'Lớp Giao Tiếp Căn Bản B1',
    description: 'Thực hành phát âm IPA & Roleplay tình huống công sở',
    teacher_id: '22222222-2222-2222-2222-222222222222',
    join_code: 'SPEAKB1FULL',
    max_students: 25,
    cefr_target: 'B1',
    status: 'active',
    start_date: '2026-07-15',
    end_date: '2026-10-15'
  }
];

export const MOCK_CLASS_MEMBERS: ClassMember[] = [
  {
    class_id: 'class-101',
    user_id: '11111111-1111-1111-1111-111111111111',
    role: 'student',
    joined_at: '2026-08-02T10:00:00Z',
    status: 'active'
  },
  {
    class_id: 'class-102',
    user_id: '11111111-1111-1111-1111-111111111111',
    role: 'assistant_teacher', // Demo trợ giảng
    joined_at: '2026-07-16T09:00:00Z',
    status: 'active'
  }
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-01',
    class_id: 'class-101',
    teacher_id: '22222222-2222-2222-2222-222222222222',
    assignment_type: 'quiz',
    reference_id: 'quiz-dynamic-01',
    title: 'Bài Test Ngữ Pháp: Thì Hiện Tại Hoàn Thành',
    instructions: 'Hoàn thành 10 câu trắc nghiệm trước buổi học thứ 5.',
    due_date: '2026-08-18T23:59:59Z', // Hạn gần (Amber)
    passing_score: 70,
    is_graded: true
  },
  {
    id: 'asg-02',
    class_id: 'class-101',
    teacher_id: '22222222-2222-2222-2222-222222222222',
    assignment_type: 'vocab_deck',
    reference_id: 'deck-toeic-essential',
    title: 'Học 30 Từ Vựng Chủ Đề Hợp Đồng (Contracts)',
    instructions: 'Lật và nhớ toàn bộ thẻ trong bộ từ vựng.',
    due_date: '2026-08-15T23:59:59Z', // Hạn quá (Coral đỏ)
    passing_score: 100,
    is_graded: true
  },
  {
    id: 'asg-03',
    class_id: 'class-101',
    teacher_id: '22222222-2222-2222-2222-222222222222',
    assignment_type: 'writing',
    reference_id: 'writing-prompt-01',
    title: 'Viết Viết Viết Email Xin Lỗi Khách Hàng',
    instructions: 'Sử dụng ít nhất 5 từ vựng đã học trong tuần.',
    due_date: '2026-08-25T23:59:59Z', // Hạn thoải mái (Teal)
    passing_score: 75,
    is_graded: true
  }
];

export const MOCK_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: 'sub-01',
    class_id: 'class-101',
    assignment_id: 'asg-01',
    user_id: '11111111-1111-1111-1111-111111111111',
    status: 'Chưa làm'
  },
  {
    id: 'sub-02',
    class_id: 'class-101',
    assignment_id: 'asg-02',
    user_id: '11111111-1111-1111-1111-111111111111',
    status: 'Chưa làm'
  },
  {
    id: 'sub-03',
    class_id: 'class-101',
    assignment_id: 'asg-03',
    user_id: '11111111-1111-1111-1111-111111111111',
    status: 'Đạt',
    score: 85,
    submitted_at: '2026-08-14T15:30:00Z'
  }
];

// ==========================================
// 3. FLASHCARDS & VOCABULARY (G)
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
