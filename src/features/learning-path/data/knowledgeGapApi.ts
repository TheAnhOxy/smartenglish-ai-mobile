export interface SkillGapItem {
  id: string;
  category: string;
  name: string;
  masteryLevel: 1 | 2 | 3 | 4 | 5; // 1=Weakest (Coral), 5=Strongest (Leaf Green)
  wrongCount: number;
  wrongWords: string[];
}

export const MOCK_KNOWLEDGE_GAPS: SkillGapItem[] = [
  { id: 'kg-1', category: 'Ngữ Pháp', name: 'Thì Hiện Tại Hoàn Thành', masteryLevel: 2, wrongCount: 4, wrongWords: ['since/for usage', 'already vs yet'] },
  { id: 'kg-2', category: 'Ngữ Pháp', name: 'Mệnh Đề Quan Hệ', masteryLevel: 1, wrongCount: 6, wrongWords: ['whose', 'whom'] },
  { id: 'kg-3', category: 'Từ Vựng', name: 'Từ Vựng Hợp Đồng Doanh Nghiệp', masteryLevel: 3, wrongCount: 2, wrongWords: ['negotiation', 'agreement'] },
  { id: 'kg-4', category: 'Phát Âm', name: 'Âm Tiết Phụ Âm Cuối /θ/ và /ð/', masteryLevel: 2, wrongCount: 5, wrongWords: ['think vs this', 'breathe'] },
  { id: 'kg-5', category: 'Phát Âm', name: 'Trọng Âm Từ Có 3 Âm Tiết', masteryLevel: 4, wrongCount: 1, wrongWords: ['accomplish'] },
  { id: 'kg-6', category: 'Đọc Hiểu', name: 'Bẫy Từ Đồng Nghĩa Part 7', masteryLevel: 5, wrongCount: 0, wrongWords: [] }
];

export const fetchKnowledgeGapsApi = async (): Promise<SkillGapItem[]> => {
  return MOCK_KNOWLEDGE_GAPS;
};
