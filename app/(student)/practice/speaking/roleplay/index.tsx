import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { RoleplayScenariosScreen } from '@/src/features/ai-speaking/presentation/screens/RoleplayScenariosScreen';
export default withLoginRequired(RoleplayScenariosScreen);
