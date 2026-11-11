import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { EditProfileScreen } from '@/src/features/profile-settings/presentation/screens/EditProfileScreen';
export default withLoginRequired(EditProfileScreen);
