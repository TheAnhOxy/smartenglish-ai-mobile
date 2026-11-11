import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { WritingAnalysisScreen } from '@/src/features/ai-writing/presentation/screens/WritingAnalysisScreen';
export default withLoginRequired(WritingAnalysisScreen);
