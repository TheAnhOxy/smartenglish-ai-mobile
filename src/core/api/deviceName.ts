import { Platform } from 'react-native';
import * as Device from 'expo-device';

/** Tên thiết bị gửi trong header phải là ASCII (header HTTP không nhận ký tự có dấu → request sẽ lỗi). */
export const WEB_DEVICE_NAME = 'Web browser';

export const toAsciiHeader = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, 120);

/** Tên thiết bị gửi kèm khi đăng nhập (header X-Device-Name) để hiển thị trong danh sách phiên. */
export const getDeviceName = (): string => {
  if (Platform.OS === 'web') return WEB_DEVICE_NAME;
  const os = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const model = toAsciiHeader(Device.modelName || Device.deviceName || '');
  return model ? `${model} (${os})` : `${os} app`;
};
