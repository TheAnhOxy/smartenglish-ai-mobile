import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { LeagueScreen } from '../../src/features/gamification/presentation/screens/LeagueScreen';
export default withLoginRequired(LeagueScreen);
