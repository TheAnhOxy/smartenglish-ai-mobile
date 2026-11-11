import { ProfileScreen } from '@/src/features/profile-settings/presentation/screens/ProfileScreen';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
export default withLoginRequired(ProfileScreen);
