import { File } from 'expo-file-system';

const MAX_RECORDING_BYTES = 2_500_000;

/** Đọc file ghi âm của expo-audio (iOS/Android) thành base64 để gửi AI. */
export const readRecordingBase64 = async (uri: string | null | undefined): Promise<string> => {
  if (!uri) throw new Error('Không đọc được bản ghi âm. Hãy thử lại.');
  const file = new File(uri);
  if (!file.exists || file.size < 1000) throw new Error('Bản ghi âm quá ngắn. Hãy giữ micro và nói rõ hơn.');
  if (file.size > MAX_RECORDING_BYTES) throw new Error('Bản ghi âm quá dài. Hãy nói ngắn gọn hơn.');
  return file.base64();
};
