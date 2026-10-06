import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface TabLoadingStateProps {
  message?: string;
  subMessage?: string;
  color?: string;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export const TabLoadingState: React.FC<TabLoadingStateProps> = ({
  message = 'Đang tải dữ liệu...',
  subMessage = 'Vui lòng đợi trong giây lát',
  color = '#4F46E5',
  minHeight = 320,
  style,
}) => {
  return (
    <View style={[styles.container, { minHeight }, style]}>
      <View style={[styles.spinnerWrapper, { borderColor: `${color}35`, backgroundColor: `${color}0F` }]}>
        <ActivityIndicator size="large" color={color} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    width: '100%',
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  message: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subMessage: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
