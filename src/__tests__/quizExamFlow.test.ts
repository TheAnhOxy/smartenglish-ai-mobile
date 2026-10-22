import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/src/core/api/client';
import {
  startExamAttemptApi,
  fetchExamAttemptApi,
  saveExamAnswerApi,
  submitExamAttemptApi,
  fetchExamResultApi,
} from '@/src/features/quiz-exam/data/examAttemptApi';

describe('Phase 12 Mobile – Quiz & Exam Lifecycle Flow Hardening', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('1. Starts new exam attempt and normalizes session, questions, and options', async () => {
    mock.onPost('/api/v1/learning/exams/1/start').reply(201, {
      status: 201,
      data: {
        attemptId: 501,
        examId: 1,
        title: 'TOEIC Mini Test 01',
        category: 'TOEIC_MINI',
        durationMinutes: 45,
        remainingSeconds: 2700,
        questions: [
          {
            id: 1,
            questionNumber: 1,
            part: 'PART_1',
            questionText: 'Look at the picture labeled #1.',
            options: [
              { key: 'A', text: 'She is typing on a computer.' },
              { key: 'B', text: 'She is talking on the phone.' },
            ],
          },
        ],
        answers: {},
      },
    });

    const session = await startExamAttemptApi(1);
    expect(session.attemptId).toBe(501);
    expect(session.title).toBe('TOEIC Mini Test 01');
    expect(session.questions).toHaveLength(1);
    expect(session.questions[0].options[0].key).toBe('A');
    expect(session.questions[0].options[0].label).toBe('She is typing on a computer.');
  });

  it('2. Resumes in-progress attempt with previously saved answers', async () => {
    mock.onGet('/api/v1/learning/exams/attempts/501').reply(200, {
      status: 200,
      data: {
        attemptId: 501,
        examId: 1,
        title: 'TOEIC Mini Test 01',
        category: 'TOEIC_MINI',
        remainingSeconds: 1500,
        questions: [
          {
            id: 1,
            questionNumber: 1,
            part: 'PART_1',
            questionText: 'Look at the picture labeled #1.',
            options: [{ key: 'A', text: 'Option A' }, { key: 'B', text: 'Option B' }],
          },
        ],
        answers: { '1': 'A' },
        bookmarks: ['1'],
      },
    });

    const session = await fetchExamAttemptApi(501);
    expect(session.attemptId).toBe(501);
    expect(session.answers['1']).toBe('A');
    expect(session.bookmarks).toContain('1');
    expect(session.remainingSeconds).toBe(1500);
  });

  it('3. Autosaves answer in background without interrupting user', async () => {
    mock.onPut('/api/v1/learning/exams/attempts/501/answers').reply(200, {
      status: 200,
      data: { success: true },
    });

    const res = await saveExamAnswerApi(501, '1', 'B', false);
    expect(res).toBeNull(); // Clean background execution
  });

  it('4. Submits exam attempt and returns graded result with score and XP', async () => {
    mock.onPost('/api/v1/learning/exams/attempts/501/submit').reply(200, {
      status: 200,
      data: {
        attemptId: 501,
        examId: 1,
        title: 'TOEIC Mini Test 01',
        category: 'TOEIC_MINI',
        displayScore: 85,
        scorePercentage: 85,
        passed: true,
        correctAnswers: 17,
        wrongAnswers: 3,
        unanswered: 0,
        xpEarned: 50,
        timeSpentSeconds: 1200,
        startedAt: '2026-10-20T10:00:00Z',
        submittedAt: '2026-10-20T10:20:00Z',
        questions: [],
      },
    });

    const result = await submitExamAttemptApi(501, { '1': 'A', '2': 'B' }, 1200);
    expect(result.attemptId).toBe(501);
    expect(result.displayScore).toBe(85);
    expect(result.passed).toBe(true);
    expect(result.correctAnswers).toBe(17);
    expect(result.xpEarned).toBe(50);
  });

  it('5. Fetches historical exam result detail', async () => {
    mock.onGet('/api/v1/learning/exams/attempts/501').reply(200, {
      status: 200,
      data: {
        attemptId: 501,
        examId: 1,
        title: 'TOEIC Mini Test 01',
        scorePercentage: 90,
        displayScore: 90,
        passed: true,
        correctAnswers: 18,
        xpEarned: 50,
        questions: [],
      },
    });

    const result = await fetchExamResultApi(501);
    expect(result.attemptId).toBe(501);
    expect(result.scorePercentage).toBe(90);
    expect(result.passed).toBe(true);
  });
});
