import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { LessonDetailScreen } from '@/src/features/home-dashboard/presentation/screens/LessonDetailScreen';
export default withLoginRequired(LessonDetailScreen);
