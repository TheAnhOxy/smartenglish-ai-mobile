import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { RoleplaySessionScreen } from '@/src/features/ai-speaking/presentation/screens/RoleplaySessionScreen';
export default withLoginRequired(RoleplaySessionScreen);
