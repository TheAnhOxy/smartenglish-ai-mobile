export interface PassageItem {
  id: string;
  title: string;
  cefr_level: string;
  content_en: string;
  content_vi: string;
}

export interface AudioTrackItem {
  id: string;
  title: string;
  audio_url: string;
  duration_sec: number;
  subtitles: Array<{ time_ms: number; text_en: string; text_vi: string }>;
}

export const MOCK_PASSAGE: PassageItem = {
  id: 'pass-101',
  title: 'Artificial Intelligence in Modern Healthcare',
  cefr_level: 'B2',
  content_en: 'Artificial Intelligence is revolutionizing modern healthcare system. Machine learning algorithms allow doctors to diagnose complex diseases earlier and with higher precision than ever before.',
  content_vi: 'Trí tuệ nhân tạo đang cách mạng hóa hệ thống y tế hiện đại. Các thuật toán học máy cho phép bác sĩ chẩn đoán các bệnh phức tạp sớm hơn và với độ chính xác cao hơn bao giờ hết.'
};

export const MOCK_AUDIO_TRACK: AudioTrackItem = {
  id: 'aud-101',
  title: 'Business Podcast: Negotiation Strategies',
  audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  duration_sec: 180,
  subtitles: [
    { time_ms: 0, text_en: 'Welcome back to Business Insights podcast.', text_vi: 'Chào mừng quay trở lại với podcast Business Insights.' },
    { time_ms: 5000, text_en: 'Today we will discuss effective negotiation strategies.', text_vi: 'Hôm nay chúng ta sẽ thảo luận về chiến lược đàm phán hiệu quả.' }
  ]
};

export const fetchPassageApi = async (id: string): Promise<PassageItem> => {
  return MOCK_PASSAGE;
};

export const fetchAudioTrackApi = async (id: string): Promise<AudioTrackItem> => {
  return MOCK_AUDIO_TRACK;
};
