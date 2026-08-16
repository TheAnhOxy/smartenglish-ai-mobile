import { StudentAssignmentsScreen } from '@/src/features/class-membership/presentation/screens/StudentAssignmentsScreen';
import { useLocalSearchParams } from 'expo-router';

export default function StudentAssignmentsRoute() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  return <StudentAssignmentsScreen classId={classId || 'class-101'} />;
}
