jest.mock('@/src/components/ds/feedback', () => ({ setUiSoundEnabled: jest.fn(), setUiSoundVolume: jest.fn() }));
jest.mock('expo-sqlite/kv-store', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItemSync: (k: string) => store[k] ?? null,
      setItemSync: (k: string, v: string) => {
        store[k] = v;
      },
    },
  };
});

import { clampVolume, isQuietRoute, useBgmStore } from '../backgroundMusic';

describe('backgroundMusic', () => {
  it('tắt nhạc ở màn học / luyện tập', () => {
    for (const path of [
      '/lesson/12',
      '/practice/speaking',
      '/practice/speaking/roleplay/3',
      '/practice/exam/5',
      '/review/due',
      '/review/decks/7/study',
      '/placement/test',
      '/assistant',
      '/classes/4/assignments',
    ]) {
      expect(isQuietRoute(path)).toBe(true);
    }
  });

  it('phát nhạc ở màn duyệt', () => {
    for (const path of ['/home', '/learn', '/stats', '/profile', '/review/decks', '/courses/3', '/practiceboard', '/', null]) {
      expect(isQuietRoute(path)).toBe(false);
    }
  });

  it('làm tròn âm lượng về nấc 0.2 trong [0.2, 1]', () => {
    expect(clampVolume(0.55)).toBe(0.6);
    expect(clampVolume(0)).toBe(0.2);
    expect(clampVolume(3)).toBe(1);
    expect(clampVolume(Number.NaN)).toBe(0.6);
  });

  it('nút giảm/tăng: giảm ở mức thấp nhất thì tắt tiếng, tăng khi đang tắt thì bật lại', () => {
    const store = useBgmStore.getState();
    store.setEnabled(true);
    store.setVolume(0.4);
    useBgmStore.getState().stepVolume(-1);
    expect(useBgmStore.getState().volume).toBe(0.2);
    useBgmStore.getState().stepVolume(-1);
    expect(useBgmStore.getState().enabled).toBe(false);
    useBgmStore.getState().stepVolume(-1);
    expect(useBgmStore.getState().enabled).toBe(false);
    useBgmStore.getState().stepVolume(1);
    expect(useBgmStore.getState().enabled).toBe(true);
    expect(useBgmStore.getState().volume).toBe(0.2);
    useBgmStore.getState().stepVolume(1);
    expect(useBgmStore.getState().volume).toBe(0.4);
  });
});
