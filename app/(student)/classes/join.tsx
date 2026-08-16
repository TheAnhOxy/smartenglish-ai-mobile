import { JoinClassModal } from '@/src/features/class-membership/presentation/screens/JoinClassModal';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function JoinClassRoute() {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  return (
    <JoinClassModal
      visible={visible}
      onClose={() => {
        setVisible(false);
        router.back();
      }}
    />
  );
}
