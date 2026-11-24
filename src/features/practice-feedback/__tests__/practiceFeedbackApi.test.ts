import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import {
  clampDetails,
  fetchFeedbackOverviewApi,
  submitSessionFeedbackApi,
  toFeedbackItem,
} from '../data/practiceFeedbackApi';

describe('practiceFeedbackApi', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });
  afterEach(() => mock.restore());

  it('toFeedbackItem bỏ qua giá trị sai kiểu thay vì làm vỡ giao diện', () => {
    const item = toFeedbackItem({
      id: '5',
      skill: 'LISTENING',
      overallScore: 'cao',
      feedback: { summary_vi: 'Tốt', advice_vi: ['A', 3, null], vocabulary: { score: 70, words_to_review: ['x', 1] }, speaking: null },
    });
    expect(item.id).toBe(5);
    expect(item.overallScore).toBeNull();
    expect(item.feedback.advice_vi).toEqual(['A']);
    expect(item.feedback.vocabulary).toEqual({ score: 70, comment_vi: '', words_to_review: ['x'] });
    expect(item.feedback.speaking).toBeNull();
  });

  it('clampDetails cắt chi tiết quá dài', () => {
    expect(clampDetails('a'.repeat(10), 5)).toBe('aaaaa…');
    expect(clampDetails('ngắn', 50)).toBe('ngắn');
  });

  it('gửi buổi luyện: kẹp điểm 0–100 và cắt tiêu đề', async () => {
    mock.onPost('/api/v1/ai-practice/feedback/session').reply(201, {
      status: 201,
      data: { id: 1, skill: 'QUIZ', skillLabel: 'Quiz từ vựng', title: 't', overallScore: 80, feedback: { summary_vi: 'ok', advice_vi: ['a'] } },
    });
    const res = await submitSessionFeedbackApi({ skill: 'QUIZ', title: 'x'.repeat(300), score: 140, details: 'chi tiết buổi luyện' });
    const body = JSON.parse(mock.history.post[0].data);
    expect(body.score).toBe(100);
    expect(body.title).toHaveLength(200);
    expect(res.overallScore).toBe(80);
  });

  it('tổng quan rỗng khi chưa luyện buổi nào', async () => {
    mock.onGet('/api/v1/ai-practice/feedback/overview').reply(200, {
      status: 200,
      data: { totalSessions: 0, skills: [], coach: null, recent: [] },
    });
    const ov = await fetchFeedbackOverviewApi();
    expect(ov).toEqual({ totalSessions: 0, skills: [], coach: null, recent: [] });
  });
});
