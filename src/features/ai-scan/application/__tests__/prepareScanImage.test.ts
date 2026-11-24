jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));

import { resizeTarget, SCAN_MAX_SIDE } from '../prepareScanImage';

describe('resizeTarget', () => {
  it('ảnh ngang 12MP của iPhone thu về cạnh dài 1280', () => {
    expect(resizeTarget(4032, 3024)).toEqual({ width: SCAN_MAX_SIDE });
  });

  it('ảnh dọc thu theo chiều cao', () => {
    expect(resizeTarget(3024, 4032)).toEqual({ height: SCAN_MAX_SIDE });
  });

  it('ảnh đã nhỏ hoặc không rõ kích thước thì giữ nguyên', () => {
    expect(resizeTarget(1080, 720)).toBeNull();
    expect(resizeTarget(1280, 1280)).toBeNull();
    expect(resizeTarget(undefined, 3000)).toBeNull();
    expect(resizeTarget(0, 0)).toBeNull();
  });
});
