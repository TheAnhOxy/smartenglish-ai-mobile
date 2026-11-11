import { SocialFeedScreen } from '@/src/features/social-feed/presentation/screens/SocialFeedScreen';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
export default withLoginRequired(SocialFeedScreen, 'use_community');
