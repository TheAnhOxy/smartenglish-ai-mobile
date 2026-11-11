import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { StudentAssignmentsScreen } from '@/src/features/class-membership/presentation/screens/StudentAssignmentsScreen';
import { useLocalSearchParams } from 'expo-router';

function StudentAssignmentsRoute() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  return <StudentAssignmentsScreen classId={classId || 'class-101'} />;
}

export default withLoginRequired(StudentAssignmentsRoute);
