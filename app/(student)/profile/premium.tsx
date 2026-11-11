import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { PaywallScreen } from '@/src/features/subscription-paywall/presentation/screens/PaywallScreen';
export default withLoginRequired(PaywallScreen);
