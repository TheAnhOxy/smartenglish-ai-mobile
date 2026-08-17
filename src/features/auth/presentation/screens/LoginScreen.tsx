import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthFlow } from '../../application/useAuthFlow';
import { AppColors } from '@/src/core/theme/colors';

export const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('student@smartenglish.ai');
  const [password, setPassword] = useState('123456');
  const { login, isPending, isError, error, selectDemoRole } = useAuthFlow();

  const handleLogin = () => {
    login({ email, password });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header & Loxera Logo */}
      <View style={styles.header}>
        <View style={styles.logoCard}>
          <Image
            source={require('@/assets/images/loxera-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appTitle}>Loxera English</Text>
        <Text style={styles.appSubtitle}>
          Trợ lý học tiếng Anh AI thông minh & Lộ trình cá nhân hóa
        </Text>
      </View>

      {/* Quick Demo Role Selection Cards */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          ⚡ ĐĂNG NHẬP NHANH ĐỂ TEST RBAC (3 ROLES)
        </Text>
        <View style={styles.roleRow}>
          <Pressable
            onPress={() => selectDemoRole('student')}
            style={[styles.roleBtn, styles.roleBtnActive]}
          >
            <Text style={styles.roleTitleActive}>🎓 Học Viên</Text>
            <Text style={styles.roleSubActive}>5 Tabs Full</Text>
          </Pressable>

          <Pressable
            onPress={() => selectDemoRole('teacher')}
            style={styles.roleBtn}
          >
            <Text style={styles.roleTitle}>👩‍🏫 Giáo Viên</Text>
            <Text style={styles.roleSub}>Companion</Text>
          </Pressable>

          <Pressable
            onPress={() => selectDemoRole('admin')}
            style={styles.roleBtn}
          >
            <Text style={styles.roleTitle}>🔒 Admin</Text>
            <Text style={styles.roleSub}>Blocked</Text>
          </Pressable>
        </View>
      </View>

      {/* Login Form */}
      <View style={styles.card}>
        <Text style={styles.formTitle}>Đăng Nhập Tài Khoản</Text>

        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {(error as any)?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'}
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="nhapemail@domain.com"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroupLarge}>
          <Text style={styles.inputLabel}>Mật Khẩu</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={isPending}
          style={styles.loginBtn}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.loginBtnText}>Đăng Nhập</Text>
          )}
        </Pressable>
      </View>

      {/* Social Login Dividers */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Hoặc đăng nhập bằng</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <Pressable style={styles.socialBtn}>
          <Text style={styles.socialText}>Google</Text>
        </Pressable>
        <Pressable style={styles.socialBtn}>
          <Text style={styles.socialText}>Apple</Text>
        </Pressable>
        <Pressable style={styles.socialBtn}>
          <Text style={styles.socialText}>Zalo</Text>
        </Pressable>
      </View>

      {/* Link to Register */}
      <View style={styles.registerRow}>
        <Text style={styles.registerText}>Chưa có tài khoản?</Text>
        <Pressable onPress={() => router.push('/(auth)/register' as any)}>
          <Text style={styles.registerLink}>Đăng Ký Ngay ➔</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCard: {
    width: 110,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0EA5E9',
  },
  roleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  roleTitleActive: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  roleSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  roleSubActive: {
    fontSize: 10,
    color: '#0EA5E9',
    marginTop: 2,
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3A5F',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputGroupLarge: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  registerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0EA5E9',
  },
});
