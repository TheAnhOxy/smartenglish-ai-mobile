import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { BackButton } from '@/src/core/components/BackButton';
import { StudentAssignmentsScreen } from '@/src/features/class-membership/presentation/screens/StudentAssignmentsScreen';

function StudentAssignmentsRoute() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-surface dark:bg-darkBg px-4" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-3 mb-4">
        <BackButton />
        <Text className="text-lg font-bold text-neutralInk dark:text-white">Bài tập của lớp</Text>
      </View>
      <StudentAssignmentsScreen classId={classId || 'class-101'} />
    </View>
  );
}

export default withLoginRequired(StudentAssignmentsRoute);
