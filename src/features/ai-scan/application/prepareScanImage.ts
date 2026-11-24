import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Cạnh dài tối đa của ảnh gửi đi quét: đủ để AI nhận diện đồ vật mà vẫn nhẹ (~200–400KB). */
export const SCAN_MAX_SIDE = 1280;
const JPEG_QUALITY = 0.7;

/**
 * Kích thước cần thu nhỏ (giữ tỉ lệ, chỉ đặt cạnh dài). Ảnh đã đủ nhỏ hoặc không rõ kích thước
 * thì trả null để giữ nguyên.
 */
export const resizeTarget = (
  width?: number | null,
  height?: number | null,
  maxSide: number = SCAN_MAX_SIDE,
): { width: number } | { height: number } | null => {
  if (!width || !height || width <= 0 || height <= 0) return null;
  if (Math.max(width, height) <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
};

/**
 * Chuẩn hoá ảnh trước khi quét: thu nhỏ và chuyển sang JPEG.
 * Ảnh iPhone gốc 12MP (thường là HEIC) quá nặng cho giới hạn 12 giây mỗi lần gọi Gemini
 * và sai định dạng với `image/jpeg` mà server khai báo.
 */
export async function prepareScanImage(
  uri: string,
  width?: number | null,
  height?: number | null,
): Promise<{ uri: string; base64: string }> {
  const context = ImageManipulator.manipulate(uri);
  const target = resizeTarget(width, height);
  if (target) context.resize(target);
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY, base64: true });
  if (!result.base64) throw new Error('Không đọc được dữ liệu ảnh sau khi xử lý');
  return { uri: result.uri, base64: result.base64 };
}
