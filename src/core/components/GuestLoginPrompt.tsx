import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogIn } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { useAuthStore } from '@/src/core/flows/authStore';

interface GuestLoginPromptProps {
  title?: string;
}

/** Màn hình thay thế cho chức năng cần tài khoản khi người dùng đang dùng thử (vai trò khách). */
export const GuestLoginPrompt: React.FC<GuestLoginPromptProps> = ({ title = 'Đăng nhập để sử dụng' }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const exitGuestMode = useRoleGateStore((s) => s.exitGuestMode);

  const goTo = (path: '/(auth)/login' | '/(auth)/register') => {
    exitGuestMode();
    router.replace(path);
  };

  return (
    <View
      className="flex-1 items-center justify-center bg-surface dark:bg-darkBg px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-4">
        <LogIn size={24} color={AppColors.primary} />
      </View>
      <Text className="text-base font-bold text-neutralInk dark:text-white mb-6 text-center">{title}</Text>
      <Pressable
        onPress={() => goTo('/(auth)/login')}
        className="w-full h-12 rounded-2xl bg-primary items-center justify-center active:bg-primaryDark"
      >
        <Text className="text-white font-bold text-sm">Đăng nhập</Text>
      </Pressable>
      <Pressable onPress={() => goTo('/(auth)/register')} className="mt-3 py-2">
        <Text className="text-sm font-semibold text-primary">Tạo tài khoản</Text>
      </Pressable>
    </View>
  );
};

/**
 * Bọc một route: chưa đăng nhập (khách) hoặc thiếu quyền `permKey` → hiện lời mời đăng nhập
 * thay vì để màn hình gọi API rồi lỗi 401/403.
 */
export function withLoginRequired<P extends object>(Screen: React.ComponentType<P>, permKey?: string) {
  const Guarded = (props: P) => {
    const isLoggedIn = useAuthStore((s) => !!s.currentUser);
    const allowed = useRoleGateStore((s) => (permKey ? s.hasPermission(permKey) : true));
    if (!isLoggedIn) return <GuestLoginPrompt />;
    if (!allowed) return <GuestLoginPrompt title="Tài khoản chưa được cấp quyền dùng chức năng này" />;
    return <Screen {...props} />;
  };
  Guarded.displayName = `withLoginRequired(${Screen.displayName || Screen.name || 'Screen'})`;
  return Guarded;
}
