jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => undefined },
}));

import '../bootstrap';
import { setLanguage } from '../i18n';

/* eslint-disable @typescript-eslint/no-require-imports */
const runtime = require('react/jsx-runtime') as { jsx: (t: unknown, p: Record<string, unknown>) => { props: Record<string, unknown> } };
const React = require('react') as { createElement: (t: unknown, p: unknown, ...c: unknown[]) => { props: Record<string, unknown> } };
/* eslint-enable @typescript-eslint/no-require-imports */

describe('bootstrap: dịch chữ khi tạo phần tử', () => {
  afterEach(() => setLanguage('vi'));

  it('tiếng Việt: giữ nguyên', () => {
    expect(runtime.jsx('RCTText', { children: 'Đăng nhập' }).props.children).toBe('Đăng nhập');
  });

  it('tiếng Anh: dịch chữ trong Text, placeholder; không đụng phần tử khác', () => {
    setLanguage('en');
    expect(runtime.jsx('RCTText', { children: 'Đăng nhập' }).props.children).toBe('Log in');
    expect(runtime.jsx('RCTVirtualText', { children: ['Còn ', 3, '/', 20, ' lượt'] }).props.children).toBe('3/20 turns left');
    expect(React.createElement('RCTText', null, 'Đăng ký').props.children).toBe('Sign up');
    expect(runtime.jsx('TextInput', { placeholder: 'Mật khẩu' }).props.placeholder).toBe('Password');
    // style và chữ ngoài Text giữ nguyên
    const style = { fontSize: 14 };
    const el = runtime.jsx('RCTText', { children: 'Đăng nhập', style });
    expect(el.props.style).toBe(style);
    expect(runtime.jsx('RCTView', { children: 'Đăng nhập' }).props.children).toBe('Đăng nhập');
  });
});
