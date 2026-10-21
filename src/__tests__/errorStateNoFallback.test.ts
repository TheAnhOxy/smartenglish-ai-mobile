import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import { fetchStudentClassesApi } from '@/src/features/class-membership/data/classApi';
import { fetchPassageApi, fetchAudioTrackApi } from '@/src/features/reading-listening/data/readingListeningApi';
import { fetchLearningPathRoadmapApi } from '@/src/features/learning-path/data/knowledgeGapApi';

describe('Phase 12 Mobile – Zero Fallback Mock & Error Propagation Hardening', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('1. Class membership API throws error on backend failure and never returns hardcoded fake classes', async () => {
    mock.onGet('/api/v1/teacher/classes/my-student-classes').reply(500, {
      status: 500,
      message: 'Teacher service database down',
    });

    await expect(fetchStudentClassesApi('101')).rejects.toThrow();
  });

  it('2. Reading passage API throws error on backend failure and never returns hardcoded fake passages', async () => {
    mock.onGet('/api/v1/content/reading/passages/999').reply(404, {
      status: 404,
      message: 'Passage not found',
    });

    await expect(fetchPassageApi('999')).rejects.toThrow();
  });

  it('3. Listening audio track API throws error on backend failure and never returns hardcoded fake audio tracks', async () => {
    mock.onGet('/api/v1/content/listening/lessons/888').reply(500, {
      status: 500,
      message: 'Content service error',
    });

    await expect(fetchAudioTrackApi('888')).rejects.toThrow();
  });

  it('4. Learning roadmap API throws error on backend failure and never returns hardcoded mock milestones', async () => {
    mock.onGet('/api/v1/learning/path').reply(500, {
      status: 500,
      message: 'Learning path service down',
    });
    mock.onGet('/api/v1/content/courses/tree').reply(500, {
      status: 500,
      message: 'Content courses tree service down',
    });

    await expect(fetchLearningPathRoadmapApi('101', true)).rejects.toThrow();
  });
});
