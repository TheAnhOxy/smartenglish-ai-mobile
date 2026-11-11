import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { StudyDeckScreen } from '@/src/features/flashcard-srs/presentation/screens/StudyDeckScreen';
export default withLoginRequired(StudyDeckScreen);
