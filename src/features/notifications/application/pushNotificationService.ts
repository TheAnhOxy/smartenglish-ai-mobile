import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushTokenApi } from '../data/notificationApi';

// Cấu hình hành vi hiển thị khi ứng dụng đang chạy ở tiền cảnh (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Đăng ký push notifications, cấu hình Android Notification Channels và đồng bộ token lên backend
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Cấu hình các kênh thông báo riêng biệt trên Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('smartenglish-default', {
      name: 'Thông báo chung',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('smartenglish-reminders', {
      name: 'Nhắc nhở học tập & Streak',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('smartenglish-social', {
      name: 'Tương tác cộng đồng & Thảo luận',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Yêu cầu quyền thông báo trên thiết bị vật lý
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushNotification] Người dùng không cấp quyền push notification.');
      return null;
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      token = pushTokenData.data;

      // Đồng bộ token lên backend gắn với JWT của người dùng
      if (token) {
        const deviceType = Platform.OS.toUpperCase();
        const deviceName = Device.modelName || `${Device.brand || 'Device'}`;
        await registerPushTokenApi(token, deviceType, deviceName);
        console.log('[PushNotification] Đã đăng ký Expo Push Token thành công với backend:', token);
      }
    } catch (e) {
      console.warn('[PushNotification] Không thể lấy Expo Push Token:', e);
    }
  } else {
    console.log('[PushNotification] Cần thiết bị vật lý thực tế để nhận Expo Push Notification.');
  }

  return token;
}
