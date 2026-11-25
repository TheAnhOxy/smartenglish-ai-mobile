jest.mock('expo-speech', () => ({}));
jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn() }));

import { chooseBestVoice } from '../speechService';

// Danh sách giống iPhone thật (rút gọn)
const NOVELTY = [
  { identifier: 'com.apple.speech.synthesis.voice.GoodNews', name: 'Good News', language: 'en-US', quality: 'Default' },
  { identifier: 'com.apple.speech.synthesis.voice.Ralph', name: 'Ralph', language: 'en-US', quality: 'Default' },
  { identifier: 'com.apple.eloquence.en-US.Reed', name: 'Reed', language: 'en-US', quality: 'Default' },
  { identifier: 'com.apple.speech.synthesis.voice.Kathy', name: 'Kathy', language: 'en-US', quality: 'Default' },
  { identifier: 'com.apple.speech.synthesis.voice.Bahh', name: 'Bahh', language: 'en-US', quality: 'Default' },
];
const SAMANTHA = { identifier: 'com.apple.voice.compact.en-US.Samantha', name: 'Samantha', language: 'en-US', quality: 'Default' };
const RISHI = { identifier: 'com.apple.voice.compact.en-IN.Rishi', name: 'Rishi', language: 'en-IN', quality: 'Default' };

describe('chọn giọng đọc trên iPhone', () => {
  it('máy chỉ có giọng mặc định: chọn Samantha, KHÔNG chọn giọng đồ chơi (Good News, Ralph…)', () => {
    expect(chooseBestVoice([...NOVELTY, RISHI, SAMANTHA])?.identifier).toBe(SAMANTHA.identifier);
  });

  it('ưu tiên giọng Premium > Enhanced > giọng chuẩn', () => {
    const enhanced = { identifier: 'com.apple.voice.enhanced.en-US.Evan', name: 'Evan', language: 'en-US', quality: 'Enhanced' };
    const premium = { identifier: 'com.apple.voice.premium.en-US.Zoe', name: 'Zoe', language: 'en-US', quality: 'Enhanced' };
    expect(chooseBestVoice([SAMANTHA, enhanced, ...NOVELTY])?.identifier).toBe(enhanced.identifier);
    expect(chooseBestVoice([SAMANTHA, enhanced, premium])?.identifier).toBe(premium.identifier);
  });

  it('chỉ có giọng đồ chơi: không chọn gì (để hệ thống dùng giọng mặc định)', () => {
    expect(chooseBestVoice(NOVELTY)).toBeNull();
  });
});

describe('gán giọng cho nhân vật hội thoại', () => {
  it('không gán giọng đồ chơi (Ralph, Kathy) cho nhân vật', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { assignVoices } = require('../dialogueScript') as typeof import('../dialogueScript');
    const voices = [
      { identifier: 'ralph', name: 'Ralph', language: 'en-US' },
      { identifier: 'kathy', name: 'Kathy', language: 'en-US' },
      { identifier: 'f1', name: 'Samantha', language: 'en-US' },
      { identifier: 'm1', name: 'Daniel', language: 'en-GB' },
    ];
    const res = assignVoices(
      [
        { speaker: 'A', gender: 'female', text: 'Hi' },
        { speaker: 'B', gender: 'male', text: 'Hello' },
      ] as never,
      voices,
    );
    expect(res.A.voice).toBe('f1');
    expect(res.B.voice).toBe('m1');
  });
});
