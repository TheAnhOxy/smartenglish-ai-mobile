import { DARK, toDarkColor, toDarkStyle } from '../darkColorMap';

describe('darkColorMap', () => {
  it('nền trắng / xám nhạt → nền tối', () => {
    expect(toDarkColor('#FFFFFF', 'bg')).toBe(DARK.card);
    expect(toDarkColor('white', 'bg')).toBe(DARK.card);
    expect(toDarkColor('#F4F7FB', 'bg')).toBe(DARK.bg);
  });

  it('nền pastel giữ sắc màu nhưng tối đi', () => {
    const out = toDarkColor('#DCFCE7', 'bg') as string; // xanh lá nhạt
    expect(out).toMatch(/^#[0-9A-F]{6}$/);
    expect(out).not.toBe(DARK.bg);
    const g = parseInt(out.slice(3, 5), 16);
    const r = parseInt(out.slice(1, 3), 16);
    expect(g).toBeGreaterThan(r); // vẫn ngả xanh lá
    expect(g).toBeLessThan(90); // đủ tối
  });

  it('nút màu đậm và chữ trắng giữ nguyên', () => {
    expect(toDarkColor('#0369A1', 'bg')).toBe('#0369A1');
    expect(toDarkColor('#FFFFFF', 'text')).toBe('#FFFFFF');
    expect(toDarkColor('rgba(255,255,255,0.2)', 'bg')).toBe('rgba(255,255,255,0.2)');
  });

  it('chữ tối → chữ sáng; chữ màu đậm → bản sáng cùng sắc', () => {
    expect(toDarkColor('#0F172A', 'text')).toBe(DARK.ink);
    expect(toDarkColor('#64748B', 'text')).toBe(DARK.muted);
    const green = toDarkColor('#166534', 'text') as string;
    expect(parseInt(green.slice(3, 5), 16)).toBeGreaterThan(170);
  });

  it('viền nhạt → viền tối', () => {
    expect(toDarkColor('#E2E8F0', 'border')).toBe(DARK.line);
  });

  it('toDarkStyle chỉ đổi thuộc tính màu và không sửa object gốc', () => {
    const style = { backgroundColor: '#FFFFFF', color: '#0F172A', padding: 4, shadowColor: '#000000' };
    const out = toDarkStyle(style);
    expect(out).toEqual({ backgroundColor: DARK.card, color: DARK.ink, padding: 4, shadowColor: '#000000' });
    expect(style.backgroundColor).toBe('#FFFFFF');
    const plain = { padding: 2 };
    expect(toDarkStyle(plain)).toBe(plain);
  });
});
