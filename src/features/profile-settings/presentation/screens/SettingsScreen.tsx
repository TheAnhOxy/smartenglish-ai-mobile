import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  GraduationCap,
  Bell,
  Palette,
  CreditCard,
  ShieldCheck,
  Info,
  LogOut,
  CheckCircle2,
  Minus,
  Plus
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';
import { palette } from '@/src/theme/colors';
import { font } from '@/src/theme/typography';

export const SettingsScreen = () => {
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();

  const [dailyCards, setDailyCards] = useState(20);
  const [ttsVoice, setTtsVoice] = useState('Anh - Mỹ');

  const [reminders, setReminders] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [leaderboardNotifs, setLeaderboardNotifs] = useState(false);

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome' as any);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft color={palette.text} size={20} />
        </Pressable>

        <Text style={styles.headerTitle}>Cài đặt hệ thống</Text>

        <Pressable style={styles.iconBtn}>
          <Search color={palette.text} size={20} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
        {/* Account Card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Pressable style={styles.accountCard}>
            <Image
              source={{
                uri:
                  currentUser?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              }}
              style={styles.avatar}
            />
            <View style={styles.accountInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.accountName}>
                  {currentUser?.display_name || 'Minh Nguyễn'}
                </Text>
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>PLUS</Text>
                </View>
              </View>
              <Text style={styles.accountSub}>Quản lý tài khoản cá nhân</Text>
            </View>
            <ChevronRight color={palette.textSoft} size={20} />
          </Pressable>
        </Animated.View>

        {/* Section: Learning Settings */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <Text style={styles.sectionTitle}>HỌC TẬP</Text>

          <View style={styles.cardGroup}>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Số thẻ học mỗi ngày</Text>
              <View style={styles.counterWrap}>
                <Pressable
                  onPress={() => setDailyCards(Math.max(5, dailyCards - 5))}
                  style={styles.stepBtn}
                >
                  <Minus color={palette.text} size={14} />
                </Pressable>
                <Text style={styles.countText}>{dailyCards}</Text>
                <Pressable
                  onPress={() => setDailyCards(dailyCards + 5)}
                  style={styles.stepBtn}
                >
                  <Plus color={palette.text} size={14} />
                </Pressable>
              </View>
            </View>

            <View style={[styles.rowItem, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Giọng đọc (TTS)</Text>
              <Pressable style={styles.valueBtn}>
                <Text style={styles.valueText}>{ttsVoice}</Text>
                <ChevronRight color={palette.primary} size={16} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Section: Notifications */}
        <Animated.View entering={FadeInDown.delay(140).duration(300)}>
          <Text style={styles.sectionTitle}>THÔNG BÁO</Text>

          <View style={styles.cardGroup}>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Nhắc nhở học hàng ngày</Text>
              <Switch
                value={reminders}
                onValueChange={setReminders}
                trackColor={{ false: palette.border, true: palette.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.rowItem, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Cảnh báo chuỗi Streak</Text>
              <Switch
                value={streakAlerts}
                onValueChange={setStreakAlerts}
                trackColor={{ false: palette.border, true: palette.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.rowItem, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Cập nhật bảng xếp hạng</Text>
              <Switch
                value={leaderboardNotifs}
                onValueChange={setLeaderboardNotifs}
                trackColor={{ false: palette.border, true: palette.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Animated.View>

        {/* Section: Theme */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={styles.sectionTitle}>GIAO DIỆN</Text>

          <View style={styles.themeGrid}>
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const isSelected = themeMode === mode;
              const labels = { light: 'Sáng', dark: 'Tối', system: 'Hệ thống' };
              return (
                <Pressable
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                >
                  <Text style={[styles.themeLabel, isSelected && styles.themeLabelSelected]}>
                    {labels[mode]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut color={palette.danger} size={18} />
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingTop: 52,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: palette.border,
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  accountInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  accountName: {
    fontSize: 16,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.text,
  },
  plusBadge: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  plusBadgeText: {
    fontSize: 10,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.primary,
  },
  accountSub: {
    fontSize: 12,
    fontFamily: font.family,
    color: palette.textSoft,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.textSoft,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderColor: palette.border,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.text,
  },
  counterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.primarySoft,
    padding: 4,
    borderRadius: 12,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '800',
    color: palette.text,
    minWidth: 20,
    textAlign: 'center',
  },
  valueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.primary,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  themeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
  },
  themeCardSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  themeLabel: {
    fontSize: 13,
    fontFamily: font.family,
    fontWeight: '600',
    color: palette.textSoft,
  },
  themeLabelSelected: {
    color: palette.primary,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 40,
  },
  logoutBtnText: {
    fontSize: 14,
    fontFamily: font.family,
    fontWeight: '700',
    color: palette.danger,
  },
});
