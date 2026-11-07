jest.mock('@/src/core/api/client', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() }, getCurrentUserId: () => '123',
}));
import { apiClient } from '@/src/core/api/client';
import { clearChatHistory, sendChatMessageApi } from '../chatbotApi';
const post = jest.mocked(apiClient.post);
beforeEach(() => { jest.clearAllMocks(); clearChatHistory(); });
test('quota reply preserves metadata and stays out of history', async () => {
  post.mockResolvedValueOnce({ data: { data: {
    success: true, reply: 'Hết lượt', quota_exceeded: true, quota_used: 15, quota_limit: 15,
  } } });
  const blocked = await sendChatMessageApi('Hello', 'A2');
  expect(blocked.is_quota_message).toBe(true);
  expect(blocked.quota_used).toBe(15);
  post.mockResolvedValueOnce({ data: { data: { success: true, reply: 'Chào' } } });
  await sendChatMessageApi('Hi', 'A2');
  expect(post.mock.calls[1][1]).toEqual({ message: 'Hi', cefrLevel: 'A2', history: [] });
});
test('LLM failures stay out of bounded history', async () => {
  post.mockResolvedValueOnce({ data: { data: { success: false, reply: 'Thử lại' } } });
  expect((await sendChatMessageApi('Bad')).is_error).toBe(true);
  post.mockResolvedValue({ data: { data: { success: true, reply: 'OK' } } });
  for (let i = 0; i < 5; i++) await sendChatMessageApi(`Hello ${i}`);
  expect((post.mock.calls[1][1] as { history: unknown[] }).history).toHaveLength(0);
  expect((post.mock.calls[5][1] as { history: unknown[] }).history).toHaveLength(6);
  expect(post.mock.calls[5][1]).not.toHaveProperty('topic');
});

test('a reply from a cleared session cannot restore its history', async () => {
  let resolveReply!: (value: unknown) => void;
  post.mockImplementationOnce(() => new Promise((resolve) => { resolveReply = resolve; }));
  const pending = sendChatMessageApi('old chat');
  clearChatHistory();
  resolveReply({ data: { data: { success: true, reply: 'old reply' } } });
  await pending;
  post.mockResolvedValueOnce({ data: { data: { success: true, reply: 'new reply' } } });
  await sendChatMessageApi('new chat');
  expect((post.mock.calls[1][1] as { history: unknown[] }).history).toEqual([]);
});
