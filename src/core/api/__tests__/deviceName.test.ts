import { toAsciiHeader } from '../deviceName';

test('device names sent as HTTP header contain only printable ASCII', () => {
  expect(toAsciiHeader('Trình duyệt web')).toBe('Trinh duyet web');
  expect(toAsciiHeader('Điện thoại của Đức')).toBe('Dien thoai cua Duc');
  expect(toAsciiHeader('iPhone 15 Pro 📱')).toBe('iPhone 15 Pro');
  expect(/^[\x20-\x7E]*$/.test(toAsciiHeader('Ứng dụng Android'))).toBe(true);
});
