import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { AnalyticsScreen } from '@/src/features/home-dashboard/presentation/screens/AnalyticsScreen';

function AnalyticsRoute() {
  return <AnalyticsScreen showBack />;
}

export default withLoginRequired(AnalyticsRoute);
