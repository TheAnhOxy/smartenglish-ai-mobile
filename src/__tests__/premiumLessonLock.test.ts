import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import { fetchLessonDetailApi, PremiumLessonLockedError } from '@/src/features/learning-path/data/knowledgeGapApi';

describe('Bài học Premium bị khoá', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });
  afterEach(() => mock.restore());

  it('server trả 403 thì báo PremiumLessonLockedError và không gọi đường dự phòng', async () => {
    mock.onGet('/api/v1/learning/path/lessons/42').reply(403, {
      status: 403,
      message: 'Bài học này dành cho học viên Premium. Nâng cấp gói để tiếp tục học.',
    });

    await expect(fetchLessonDetailApi('42', '7')).rejects.toBeInstanceOf(PremiumLessonLockedError);
    expect(mock.history.get.map((r) => r.url)).toEqual(['/api/v1/learning/path/lessons/42']);
  });

  it('lỗi khác vẫn thử content-service như trước', async () => {
    mock.onGet('/api/v1/learning/path/lessons/43').reply(500, {});
    mock.onGet('/api/v1/content/lessons/43').reply(200, { status: 200, data: { id: 43, titleVi: 'Bài 43', contentBlocks: [] } });

    const data = await fetchLessonDetailApi('43', '7');
    expect(data?.titleVi).toBe('Bài 43');
  });
});
