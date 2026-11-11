import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { ChatConversationsScreen } from '@/src/features/ai-chatbot/presentation/screens/ChatConversationsScreen';
export default withLoginRequired(ChatConversationsScreen);
