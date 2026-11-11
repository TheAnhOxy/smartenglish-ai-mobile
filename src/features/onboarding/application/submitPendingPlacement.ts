import { Alert, Platform } from 'react-native';
import { submitPlacementTestApi } from '../data/onboardingApi';
import { useOnboardingStore } from './useOnboardingStore';

const notify = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
};

/** Nộp bài kiểm tra đầu vào mà khách đã làm xong trước khi đăng nhập. Gọi ngay sau khi đăng nhập thành công. */
export const submitPendingPlacement = async (): Promise<void> => {
  const { pendingSubmit, answers, attemptId, examId, setResult, resetTest, setPendingSubmit } =
    useOnboardingStore.getState();
  if (!pendingSubmit || Object.keys(answers).length === 0) return;

  setPendingSubmit(false);
  try {
    const result = await submitPlacementTestApi({
      attemptId: attemptId || undefined,
      examId: examId || undefined,
      answers,
    });
    setResult(result);
    notify('Đã lưu kết quả kiểm tra đầu vào', `Trình độ của bạn: ${result.cefr_level}`);
    resetTest();
  } catch {
    notify('Chưa lưu được kết quả', 'Bạn có thể làm lại bài kiểm tra đầu vào trong phần Luyện tập.');
  }
};
