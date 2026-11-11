import React from 'react';
import { Image, View, type ImageStyle, type StyleProp } from 'react-native';
import { User } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';

// Ảnh stock / ảnh người thật dùng làm avatar giả trước đây — không bao giờ hiển thị
const STOCK_HOSTS = ['images.unsplash.com', 'i.pravatar.cc', 'randomuser.me', 'api.dicebear.com', 'ui-avatars.com'];

export const isRealAvatarUrl = (uri?: string | null): uri is string =>
  !!uri && uri.trim().length > 0 && !STOCK_HOSTS.some((host) => uri.includes(host));

interface UserAvatarProps {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/** Avatar người dùng: ảnh do người dùng tải lên, nếu không có thì icon người dùng mặc định. */
export const UserAvatar: React.FC<UserAvatarProps> = ({ uri, size = 40, style }) => {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (isRealAvatarUrl(uri)) {
    return <Image source={{ uri }} style={[shape, style]} />;
  }
  return (
    <View
      style={[shape, { backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }, style as object]}
      accessibilityLabel="Ảnh đại diện mặc định"
    >
      <User size={Math.round(size * 0.5)} color={AppColors.primary} />
    </View>
  );
};
