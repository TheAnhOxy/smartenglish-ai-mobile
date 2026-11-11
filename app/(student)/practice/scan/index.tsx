import { ScanCameraScreen } from '@/src/features/ai-scan/presentation/screens/ScanCameraScreen';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
export default withLoginRequired(ScanCameraScreen, 'use_ai_scan');
