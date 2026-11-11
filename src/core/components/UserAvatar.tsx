import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
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
export const UserAvatar: React.FC<UserAvatarProps> = ({ uri, size: sizeProp = 40, style }) => {
  // style có width thì dùng kích thước đó, để biểu tượng mặc định không tràn ra ngoài khung
  const styleWidth = (StyleSheet.flatten(style) as ImageStyle | undefined)?.width;
  const size = typeof styleWidth === 'number' ? styleWidth : sizeProp;
  const shape = { width: size, height: size, borderRadius: size / 2 };
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  if (isRealAvatarUrl(uri) && !failed) {
    if (Platform.OS === 'web') {
      // Ảnh Google (lh3.googleusercontent.com) bị từ chối khi trình duyệt gửi kèm Referer → tắt referrer
      return React.createElement('img', {
        src: uri,
        alt: '',
        referrerPolicy: 'no-referrer',
        onError: () => setFailed(true),
        style: { ...shape, objectFit: 'cover', display: 'block', flexShrink: 0, ...(style as object) },
      });
    }
    return <Image source={{ uri }} style={[shape, style]} onError={() => setFailed(true)} />;
  }
  return (
    <View
      style={[shape, { backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style as object]}
      accessibilityLabel="Ảnh đại diện mặc định"
    >
      <User size={Math.round(size * 0.5)} color={AppColors.primary} />
    </View>
  );
};
