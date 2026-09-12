import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoxeraFoxMascot } from './LoxeraFoxMascot';

interface LoxeraFoxLoaderProps {
  message?: string;
  subMessage?: string;
  size?: number;
}

export const LoxeraFoxLoader: React.FC<LoxeraFoxLoaderProps> = ({
  message = 'Loxera AI đang làm việc...',
  subMessage,
  size = 100,
}) => {
  return (
    <View style={styles.container}>
      <LoxeraFoxMascot size={size} showGlow animated />
      <Text style={styles.messageText}>{message}</Text>
      {subMessage ? <Text style={styles.subMessageText}>{subMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
    textAlign: 'center',
  },
  subMessageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});
