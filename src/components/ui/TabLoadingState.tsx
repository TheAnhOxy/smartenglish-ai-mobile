import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { FoxRunLoader } from '@/src/core/components/FoxRunLoader';

interface TabLoadingStateProps {
  message?: string;
  subMessage?: string;
  /** Giữ để tương thích chỗ gọi cũ (loader cáo dùng màu theo bộ thiết kế). */
  color?: string;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}

/** Trạng thái đang tải của các tab: linh vật cáo chạy ngang. */
export const TabLoadingState: React.FC<TabLoadingStateProps> = ({
  message = 'Đang tải dữ liệu...',
  subMessage = 'Vui lòng đợi trong giây lát',
  minHeight = 320,
  style,
}) => (
  <View style={[styles.container, { minHeight }, style]}>
    <FoxRunLoader message={message} subMessage={subMessage} size={72} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    width: '100%',
  },
});
