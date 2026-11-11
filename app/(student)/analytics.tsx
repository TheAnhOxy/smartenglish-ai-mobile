import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { AnalyticsScreen } from '@/src/features/home-dashboard/presentation/screens/AnalyticsScreen';
export default withLoginRequired(AnalyticsScreen);
