jest.mock('expo-audio', () => ({ RecordingPresets: { HIGH_QUALITY: {} }, useAudioRecorderState: jest.fn() }));

import { meteringToLevel, rmsToLevel } from '../micLevel';

describe('mức âm lượng micro', () => {
  it('metering dB: im lặng = 0, nói to gần 1, không có số = 0', () => {
    expect(meteringToLevel(-160)).toBe(0);
    expect(meteringToLevel(-50)).toBe(0);
    expect(meteringToLevel(-5)).toBeCloseTo(1);
    expect(meteringToLevel(0)).toBe(1);
    expect(meteringToLevel(null)).toBe(0);
    expect(meteringToLevel(Number.NaN)).toBe(0);
  });

  it('RMS của khung sóng web: phẳng = 0, dao động mạnh lên cao', () => {
    expect(rmsToLevel(new Uint8Array(256).fill(128))).toBe(0);
    const loud = Uint8Array.from({ length: 256 }, (_, i) => (i % 2 ? 200 : 56));
    expect(rmsToLevel(loud)).toBe(1);
    const quiet = Uint8Array.from({ length: 256 }, (_, i) => (i % 2 ? 133 : 123));
    expect(rmsToLevel(quiet)).toBeGreaterThan(0);
    expect(rmsToLevel(quiet)).toBeLessThan(0.5);
    expect(rmsToLevel([])).toBe(0);
  });
});
