import { apiClient } from '@/src/core/api/client';
import { Word } from '@/src/core/types/schema';
import { MOCK_WORDS } from '@/src/core/data/mockData';

export interface ScanQuota {
  scans_used_today: number;
  scans_limit: number; // 10 for Free, 999 for Premium
  is_premium: boolean;
}

export interface DetectedObjectItem {
  id: string;
  word_id: string;
  word: string;
  confidence: number;
  bounding_box: { x: number; y: number; width: number; height: number };
  meaning_vi: string;
  examples: {
    easy: string;
    medium: string;
    hard: string;
  };
}

export const fetchScanQuotaApi = async (isPremium: boolean): Promise<ScanQuota> => {
  return {
    scans_used_today: 3,
    scans_limit: isPremium ? 999 : 10,
    is_premium: isPremium
  };
};

export const submitScanImageApi = async (): Promise<{
  scan_id: string;
  detected_count: number;
  objects: DetectedObjectItem[];
}> => {
  return {
    scan_id: 'scan-101',
    detected_count: 2,
    objects: [
      {
        id: 'obj-1',
        word_id: 'word-01',
        word: 'Negotiation',
        confidence: 0.94,
        bounding_box: { x: 50, y: 120, width: 220, height: 140 },
        meaning_vi: 'Sự đàm phán, thương lượng hợp đồng',
        examples: {
          easy: 'We started the negotiation today.',
          medium: 'The negotiation process took three hours to reach an agreement.',
          hard: 'Complex international trade negotiations require careful strategic diplomacy.'
        }
      },
      {
        id: 'obj-2',
        word_id: 'word-02',
        word: 'Accomplish',
        confidence: 0.88,
        bounding_box: { x: 180, y: 300, width: 180, height: 110 },
        meaning_vi: 'Hoàn thành, đạt được mục tiêu',
        examples: {
          easy: 'You can accomplish your goals.',
          medium: 'She accomplished all her assigned tasks before the deadline.',
          hard: 'Accomplishing groundbreaking scientific research requires relentless dedication.'
        }
      }
    ]
  };
};
