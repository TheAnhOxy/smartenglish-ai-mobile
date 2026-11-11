import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { SpeakingHomeScreen } from '@/src/features/ai-speaking/presentation/screens/SpeakingHomeScreen';

function SpeakingIndexRoute() {
  return <SpeakingHomeScreen />;
}

export default withLoginRequired(SpeakingIndexRoute);
