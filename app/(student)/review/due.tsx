import { StudyDeckScreen } from '@/src/features/flashcard-srs/presentation/screens/StudyDeckScreen';

/** Ôn các thẻ đến hạn hôm nay của mọi bộ thẻ (mở từ trang chủ hoặc thông báo nhắc ôn). */
export default function ReviewDueRoute() {
  return <StudyDeckScreen mode="due" />;
}
