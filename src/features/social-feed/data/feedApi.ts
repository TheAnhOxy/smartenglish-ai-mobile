export interface FeedPostItem {
  id: string;
  user_name: string;
  user_avatar: string;
  milestone_title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked: boolean;
}

export const fetchSocialFeedApi = async (): Promise<FeedPostItem[]> => {
  return [
    {
      id: 'post-1',
      user_name: 'Minh Anh',
      user_avatar: 'https://i.pravatar.cc/100?img=1',
      milestone_title: '🔥 Đạt Chuỗi Streak 14 Ngày',
      content: 'Vừa đạt chuỗi 14 ngày ôn thẻ liên tục! Mọi người cùng cố gắng nhé 💪',
      likes_count: 12,
      comments_count: 3,
      created_at: '10 phút trước',
      is_liked: false
    },
    {
      id: 'post-2',
      user_name: 'Hoàng Nam',
      user_avatar: 'https://i.pravatar.cc/100?img=2',
      milestone_title: '🎓 Đạt Điểm Quiz Ngữ Pháp 100%',
      content: 'Bài Quiz Thì Hiện Tại Hoàn Thành khá hay, AI giải thích rất chi tiết!',
      likes_count: 8,
      comments_count: 1,
      created_at: '1 giờ trước',
      is_liked: true
    }
  ];
};
