import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { StudentClassesScreen } from '@/src/features/class-membership/presentation/screens/StudentClassesScreen';
export default withLoginRequired(StudentClassesScreen);
