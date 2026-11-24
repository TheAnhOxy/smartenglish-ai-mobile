jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => undefined },
}));
jest.mock('nativewind', () => ({ colorScheme: { set: jest.fn() } }));

import { StyleSheet } from 'react-native';

describe('themeMode qua Fast Refresh', () => {
  it('đang tối mà module nạp lại → về Sáng vẫn đúng màu gốc cho cả style cũ lẫn mới', () => {
    const first = require('../themeMode') as typeof import('../themeMode');
    const { ds } = require('../ds') as typeof import('../ds');
    const before = StyleSheet.create({ card: { backgroundColor: ds.card, color: '#0F172A' } });
    first.setThemePref('dark');

    // Fast Refresh: module theme chạy lại từ đầu trong khi token đang ở bản tối
    let second!: typeof import('../themeMode');
    jest.isolateModules(() => {
      second = require('../themeMode');
    });
    const after = StyleSheet.create({ card: { backgroundColor: ds.card } });

    second.setThemePref('light');
    expect(ds.card).toBe('#FFFFFF');
    expect(before.card).toEqual({ backgroundColor: '#FFFFFF', color: '#0F172A' });
    expect(after.card.backgroundColor).toBe('#FFFFFF');
    expect(second.isDarkTheme()).toBe(false);
  });
});
