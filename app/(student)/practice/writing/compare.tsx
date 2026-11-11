import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { WritingCompareScreen } from '@/src/features/ai-writing/presentation/screens/WritingCompareScreen';
export default withLoginRequired(WritingCompareScreen);
