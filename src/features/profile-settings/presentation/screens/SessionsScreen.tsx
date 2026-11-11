import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Globe, LogOut, Smartphone } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { WEB_DEVICE_NAME } from '@/src/core/api/deviceName';
import { fetchSessionsApi, LoginSession, revokeOtherSessionsApi, revokeSessionApi } from '../../data/sessionApi';
import { BackButton } from '@/src/core/components/BackButton';

const confirm = (title: string, message: string): Promise<boolean> =>
  new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n${message}`));
      return;
    }
    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });

const formatTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const describe = (s: LoginSession) => {
  if (s.deviceName === WEB_DEVICE_NAME) return 'Trình duyệt web';
  if (s.deviceName) return s.deviceName.replace(/ app$/, '').replace(/^(Android|iOS)$/, 'Ứng dụng $1');
  const ua = s.userAgent || '';
  if (/Android/i.test(ua)) return 'Thiết bị Android';
  if (/iPhone|iPad|iOS/i.test(ua)) return 'Thiết bị iOS';
  if (/Mozilla|Chrome|Safari|Edg/i.test(ua)) return 'Trình duyệt web';
  return 'Thiết bị không xác định';
};

/** UC-04: xem các thiết bị đang đăng nhập và đăng xuất từ xa. */
const SessionsContent = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | 'others' | null>(null);
  const query = useQuery({ queryKey: ['login-sessions'], queryFn: fetchSessionsApi });

  const sessions = query.data ?? [];
  const others = sessions.filter((s) => !s.current);

  const revokeOne = async (s: LoginSession) => {
    if (!(await confirm('Đăng xuất thiết bị?', `${describe(s)} sẽ phải đăng nhập lại.`))) return;
    setBusyId(s.id);
    try {
      await revokeSessionApi(s.id);
      await queryClient.invalidateQueries({ queryKey: ['login-sessions'] });
    } finally {
      setBusyId(null);
    }
  };

  const revokeOthers = async () => {
    if (!(await confirm('Đăng xuất các thiết bị khác?', `${others.length} thiết bị sẽ phải đăng nhập lại.`))) return;
    setBusyId('others');
    try {
      await revokeOtherSessionsApi();
      await queryClient.invalidateQueries({ queryKey: ['login-sessions'] });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>Thiết bị đăng nhập</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <Text style={s.lead}>Thiết bị bị đăng xuất sẽ không thể gia hạn phiên và phải đăng nhập lại.</Text>

        {query.isLoading ? (
          <View style={s.state}><ActivityIndicator size="small" color={colors.primary} /></View>
        ) : query.isError ? (
          <View style={s.state}>
            <AlertCircle size={24} color={colors.danger} />
            <Text style={s.lead}>Không tải được danh sách thiết bị</Text>
            <Pressable onPress={() => query.refetch()} style={s.retryBtn}>
              <Text style={s.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {sessions.map((sess) => {
              const web = /web|trình duyệt/i.test(describe(sess));
              const Icon = web ? Globe : Smartphone;
              return (
                <View key={sess.id} style={[s.card, sess.current && s.cardCurrent]}>
                  <View style={s.icon}><Icon size={20} color={colors.primary} /></View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.name}>{describe(sess)}</Text>
                    <Text style={s.meta}>
                      {sess.current ? 'Thiết bị này · ' : ''}Hoạt động {formatTime(sess.lastUsedAt || sess.createdAt)}
                    </Text>
                    {sess.ipAddress ? <Text style={s.meta}>IP {sess.ipAddress}</Text> : null}
                  </View>
                  {!sess.current ? (
                    <Pressable onPress={() => revokeOne(sess)} disabled={busyId !== null} hitSlop={8} accessibilityLabel={`Đăng xuất ${describe(sess)}`}>
                      {busyId === sess.id ? <ActivityIndicator size="small" color={colors.danger} /> : <LogOut size={18} color={colors.danger} />}
                    </Pressable>
                  ) : null}
                </View>
              );
            })}

            {others.length > 0 ? (
              <Pressable onPress={revokeOthers} disabled={busyId !== null} style={s.dangerBtn}>
                {busyId === 'others' ? <ActivityIndicator size="small" color={colors.danger} /> : <LogOut size={16} color={colors.danger} />}
                <Text style={s.dangerText}>Đăng xuất tất cả thiết bị khác</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export const SessionsScreen = withLoginRequired(SessionsContent);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  lead: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  state: { paddingVertical: 32, alignItems: 'center', gap: 8 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardCurrent: { borderColor: colors.primary },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textSoft },
  dangerBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 12,
    marginTop: 4,
  },
  dangerText: { fontSize: 14, fontWeight: '700', color: colors.danger },
});
