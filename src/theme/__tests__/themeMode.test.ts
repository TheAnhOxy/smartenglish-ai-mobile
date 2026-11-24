jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => undefined },
}));
jest.mock('nativewind', () => ({ colorScheme: { set: jest.fn() } }));

import { StyleSheet } from 'react-native';
import { setThemePref, isDarkTheme } from '../themeMode';
import { ds } from '../ds';
import { DARK } from '../darkColorMap';

describe('themeMode', () => {
  it('đổi sáng ↔ tối: token và style viết cứng đổi theo, không crash', () => {
    const styles = StyleSheet.create({
      card: { backgroundColor: '#FFFFFF', color: '#0F172A', padding: 8 },
      button: { backgroundColor: '#0369A1', color: '#FFFFFF' },
    });
    expect(isDarkTheme()).toBe(false);
    expect(ds.card).toBe('#FFFFFF');

    expect(() => setThemePref('dark')).not.toThrow();
    expect(isDarkTheme()).toBe(true);
    // Token tối được "đánh dấu" lệch 1 đơn vị xanh dương (không nhìn thấy khác biệt)
    expect(ds.card.slice(0, 5)).toBe(DARK.card.slice(0, 5));
    expect(styles.card).toEqual({ backgroundColor: DARK.card, color: DARK.ink, padding: 8 });
    expect(styles.button).toEqual({ backgroundColor: '#0369A1', color: '#FFFFFF' });

    // Style tạo ra khi đang tối vẫn quay về đúng màu sáng
    const later = StyleSheet.create({ box: { backgroundColor: ds.card } });
    expect(later.box.backgroundColor).toBe(DARK.card);

    // Màu sáng viết cứng trùng giá trị với token tối (#0EA5E9 = ds.btn tối cũ) KHÔNG được bị dịch ngược sai
    const hard = StyleSheet.create({ x: { backgroundColor: '#0EA5E9' } });

    expect(() => setThemePref('light')).not.toThrow();
    expect(hard.x.backgroundColor).toBe('#0EA5E9');
    expect(ds.card).toBe('#FFFFFF');
    expect(styles.card).toEqual({ backgroundColor: '#FFFFFF', color: '#0F172A', padding: 8 });
    expect(later.box.backgroundColor).toBe('#FFFFFF');
  });
});
