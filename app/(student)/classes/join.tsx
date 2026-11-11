import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { JoinClassModal } from '@/src/features/class-membership/presentation/screens/JoinClassModal';
import { useState } from 'react';
import { useRouter } from 'expo-router';

function JoinClassRoute() {
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

export default withLoginRequired(JoinClassRoute);
