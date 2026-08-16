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
}

export const MOCK_CURRICULUM: Chapter[] = [
  {
    id: 'ch-1',
    chapter_number: 1,
    title_vi: 'Chương 1: Giao Tiếp Cơ Bản & Đời Sống',
    title_en: 'Chapter 1: Everyday Basics',
    is_premium: false,
    units: [
      {
        id: 'u-1',
        unit_number: 1,
        title_vi: 'Unit 1: Chào Hỏi & Giới Thiệu',
        title_en: 'Unit 1: Basics & Greetings',
        description_vi: 'Làm quen với các mẫu câu chào hỏi và tự giới thiệu bản thân chuẩn bản xứ.',
        is_premium: false,
        status: 'completed',
        icon_type: 'star',
        total_lessons: 5,
        completed_lessons: 5,
        xp_reward: 50
      },
      {
        id: 'u-2',
        unit_number: 2,
        title_vi: 'Unit 2: Gọi Đồ Ăn & Cà Phê',
        title_en: 'Unit 2: Dining & Ordering',
        description_vi: 'Hội thoại gọi đồ uống tại quán cà phê và đặt bàn nhà hàng.',
        is_premium: false,
        status: 'current',
        icon_type: 'grad',
        total_lessons: 5,
        completed_lessons: 2,
        xp_reward: 60
      },
      {
        id: 'u-3',
        unit_number: 3,
        title_vi: 'Unit 3: Hỏi Đường & Du Lịch',
        title_en: 'Unit 3: Travel & Directions',
        description_vi: 'Kỹ năng hỏi đường, phương tiện công cộng và bắt xe taxi.',
        is_premium: false,
        status: 'unlocked',
        icon_type: 'book',
        total_lessons: 6,
        completed_lessons: 0,
        xp_reward: 70
      },
      {
        id: 'u-4',
        unit_number: 4,
        title_vi: 'Unit 4: Mua Sắm & Mặc Cả',
        title_en: 'Unit 4: Shopping & Prices',
        description_vi: 'Mẫu câu hỏi giá, mua sắm và mặc cả tại siêu thị & cửa hàng.',
        is_premium: false,
        status: 'unlocked',
        icon_type: 'speech',
        total_lessons: 5,
        completed_lessons: 0,
        xp_reward: 65
      }
    ]
  },
  {
    id: 'ch-2',
    chapter_number: 2,
    title_vi: 'Chương 2: Tiếng Anh Công Việc & Văn Phòng',
    title_en: 'Chapter 2: Business & Workplace',
    is_premium: false,
    units: [
      {
        id: 'u-5',
        unit_number: 5,
        title_vi: 'Unit 5: Phỏng Vấn Phản Xạ',
        title_en: 'Unit 5: Job Interviewing',
        description_vi: 'Trả lời các câu hỏi phỏng vấn xin việc phổ biến bằng tiếng Anh.',
        is_premium: false,
        status: 'unlocked',
        icon_type: 'speech',
        total_lessons: 6,
        completed_lessons: 0,
        xp_reward: 80
      },
      {
        id: 'u-6',
        unit_number: 6,
        title_vi: 'Unit 6: Viết Email Thương Mại',
        title_en: 'Unit 6: Business Email Writing',
        description_vi: 'Soạn thảo email chuyên nghiệp, lịch sự trao đổi với đối tác.',
        is_premium: false,
        status: 'unlocked',
        icon_type: 'book',
        total_lessons: 5,
        completed_lessons: 0,
        xp_reward: 85
      },
      {
        id: 'u-7',
        unit_number: 7,
        title_vi: 'Unit 7: Đàm Phán & Thương Lượng 👑',
        title_en: 'Unit 7: Professional Negotiation',
        description_vi: 'Kỹ năng thương lượng hợp đồng và đàm phán thương mại chuyên sâu.',
        is_premium: true,
        status: 'locked',
        icon_type: 'crown',
        total_lessons: 8,
        completed_lessons: 0,
        xp_reward: 120
      }
    ]
  },
  {
    id: 'ch-3',
    chapter_number: 3,
    title_vi: 'Chương 3: Luyện Thi IELTS & TOEIC Chuyên Sâu 👑',
    title_en: 'Chapter 3: Advanced Exams & Fluency',
    is_premium: true,
    units: [
      {
        id: 'u-8',
        unit_number: 8,
        title_vi: 'Unit 8: IELTS Speaking Part 2 & 3 👑',
        title_en: 'Unit 8: Master IELTS Speaking',
        description_vi: 'Luyện phản xạ mộc mạc và mở rộng vốn từ vựng Band 7.0+.',
        is_premium: true,
        status: 'locked',
        icon_type: 'crown',
        total_lessons: 10,
        completed_lessons: 0,
        xp_reward: 150
      },
      {
        id: 'u-9',
        unit_number: 9,
        title_vi: 'Unit 9: TOEIC Listening Master 👑',
        title_en: 'Unit 9: TOEIC Listening Part 3 & 4',
        description_vi: 'Bẫy phát âm & kỹ thuật bắt từ khóa nghe hiểu đề thi TOEIC.',
        is_premium: true,
        status: 'locked',
        icon_type: 'crown',
        total_lessons: 8,
        completed_lessons: 0,
        xp_reward: 140
      }
    ]
  }
];
