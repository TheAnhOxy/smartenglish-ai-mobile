import { Alert, Platform } from 'react-native';
import { submitPlacementTestApi } from '../data/onboardingApi';
import { useOnboardingStore } from './useOnboardingStore';
import { clearRoadmapCache } from '@/src/features/learning-path/data/knowledgeGapApi';
import { useAuthStore } from '@/src/core/flows/authStore';
import { profileFieldsFromPlacement } from './learnerLevel';

const notify = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
};

/**
 * Nộp bài kiểm tra đầu vào mà khách đã làm xong trước khi đăng nhập. Gọi ngay sau khi đăng nhập thành công.
 * onSaved: làm mới dữ liệu phụ thuộc kết quả (trạng thái bài đầu vào, lộ trình).
 */
export const submitPendingPlacement = async (onSaved?: () => void): Promise<void> => {
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
    // Trình độ mới dùng ngay cho gia sư AI và nội dung gợi ý, không chờ tải lại hồ sơ
    useAuthStore.getState().updateCurrentUser(profileFieldsFromPlacement(result));
    clearRoadmapCache();
    onSaved?.();
    notify('Đã lưu kết quả kiểm tra đầu vào', `Trình độ của bạn: ${result.cefr_level}`);
    resetTest();
  } catch {
    notify('Chưa lưu được kết quả', 'Bạn có thể làm lại bài kiểm tra đầu vào trong phần Luyện tập.');
  }
};
