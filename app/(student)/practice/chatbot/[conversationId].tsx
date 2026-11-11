import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { ChatSessionScreen } from '@/src/features/ai-chatbot/presentation/screens/ChatSessionScreen';
export default withLoginRequired(ChatSessionScreen);
