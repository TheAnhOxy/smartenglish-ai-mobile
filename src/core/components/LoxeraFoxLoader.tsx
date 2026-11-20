import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FoxRunLoader } from './FoxRunLoader';

interface LoxeraFoxLoaderProps {
  message?: string;
  subMessage?: string;
  /** Chiều cao linh vật (px). */
  size?: number;
}

/** Loader linh vật: cáo chạy ngang trong lúc chờ dữ liệu. */
export const LoxeraFoxLoader: React.FC<LoxeraFoxLoaderProps> = ({
  message = 'Loxera AI đang làm việc...',
  subMessage,
  size = 72,
}) => (
  <View style={styles.container}>
    <FoxRunLoader message={message} subMessage={subMessage} size={Math.min(size, 96)} />
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 16, width: '100%' },
});
