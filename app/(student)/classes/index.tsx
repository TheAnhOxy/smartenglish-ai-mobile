import { StudentClassesScreen } from '@/src/features/class-membership/presentation/screens/StudentClassesScreen';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
export default withLoginRequired(StudentClassesScreen, 'join_class_submit');
