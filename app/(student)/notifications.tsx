import { NotificationsScreen } from '@/src/features/notifications/presentation/screens/NotificationsScreen';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
export default withLoginRequired(NotificationsScreen);
