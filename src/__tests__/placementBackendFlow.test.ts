import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import {
  fetchPlacementTestApi,
  submitPlacementTestApi,
} from '@/src/features/onboarding/data/onboardingApi';

describe('Phase 12 Mobile – Placement Test Backend Flow Hardening', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('1. Fetches official placement test questions from learning-service without leaking answers', async () => {
    mock.onPost('/api/v1/learning/placement/start').reply(200, {
      status: 200,
      data: {
        attemptId: 901,
        examId: 99,
        title: 'Placement Assessment 2026',
        durationMinutes: 25,
        totalQuestions: 2,
        questions: [
          {
            id: 1,
            questionText: 'Choose the correct synonym for "diligent".',
            options: [
              { id: 'A', text: 'Hardworking' },
              { id: 'B', text: 'Careless' },
              { id: 'C', text: 'Lazy' },
            ],
            category: 'vocabulary',
            points: 1,
          },
          {
            id: 2,
            questionText: 'She _____ to London three times.',
            options: [
              { id: 'A', text: 'has been' },
              { id: 'B', text: 'is going' },
              { id: 'C', text: 'went' },
            ],
            category: 'grammar',
            points: 1,
          },
        ],
      },
    });

    const session = await fetchPlacementTestApi();
    expect(session.attemptId).toBe(901);
    expect(session.questions).toHaveLength(2);
    expect(session.questions[0].category).toBe('vocabulary');
    expect(session.questions[0].options[0].text).toBe('Hardworking');
    // Ensure answers are not leaked in the payload
    expect((session.questions[0] as any).correctAnswer).toBeUndefined();
  });

  it('2. Submits placement answers to backend and receives server-side CEFR evaluation', async () => {
    mock.onPost('/api/v1/learning/placement/submit').reply(200, {
      status: 200,
      data: {
        attemptId: 901,
        assessedCefrLevel: 'B2',
        scorePct: 80,
        recommendedGoal: 'IELTS 6.5+',
        feedbackVi: 'Bạn có nền tảng ngữ pháp và từ vựng khá vững.',
        skills: {
          vocabulary: 85,
          grammar: 80,
          reading: 75,
          listening: 80,
        },
      },
    });

    const result = await submitPlacementTestApi({
      attemptId: 901,
      examId: 99,
      answers: { '1': 'A', '2': 'A' },
      timeSpentSeconds: 300,
    });

    expect(result.cefr_level).toBe('B2');
    expect(result.score_pct).toBe(80);
    expect(result.skills.vocabulary).toBe(85);
    expect(result.skills.grammar).toBe(80);
    expect(result.recommendedGoal).toBe('IELTS 6.5+');
  });

  it('3. Throws when backend returns invalid or empty questions to trigger error screen', async () => {
    mock.onPost('/api/v1/learning/placement/start').reply(500, {
      status: 500,
      message: 'Learning service unavailable',
    });
    mock.onGet('/api/v1/learning/placement/session').reply(500);
    mock.onGet('/api/v1/content/exams/placement').reply(500);

    await expect(fetchPlacementTestApi()).rejects.toThrow();
  });
});
