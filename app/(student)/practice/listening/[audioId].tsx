import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ListeningPlayerScreen } from '@/src/features/reading-listening/presentation/screens/ListeningPlayerScreen';
import { AssignmentSubmitBanner } from '@/src/features/class-membership/presentation/components/AssignmentSubmitBanner';

export default function ListeningPlayerRoute() {
  const { audioId } = useLocalSearchParams<{ audioId: string }>();
  return (
    <ListeningPlayerScreen
      footer={
        <View className="mt-4 -mx-4">
          <AssignmentSubmitBanner referenceId={audioId} />
        </View>
      }
    />
  );
}
