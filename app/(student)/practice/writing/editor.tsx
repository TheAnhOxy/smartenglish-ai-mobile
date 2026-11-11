import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { WritingEditorScreen } from '@/src/features/ai-writing/presentation/screens/WritingEditorScreen';
export default withLoginRequired(WritingEditorScreen);
