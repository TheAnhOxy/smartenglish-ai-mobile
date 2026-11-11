import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { KnowledgeGapScreen } from '@/src/features/learning-path/presentation/screens/KnowledgeGapScreen';
export default withLoginRequired(KnowledgeGapScreen);
