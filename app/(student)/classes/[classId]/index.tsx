import { StudentClassDetailScreen } from '@/src/features/class-membership/presentation/screens/StudentClassDetailScreen';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
export default withLoginRequired(StudentClassDetailScreen, 'join_class_submit');
