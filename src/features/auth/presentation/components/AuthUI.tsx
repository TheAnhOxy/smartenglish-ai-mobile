import React, { createContext, forwardRef, useContext, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextInputInstance } from 'react-native';
// Pressable hỗ trợ style dạng hàm ({ pressed }) — bản của react-native bỏ qua nó (xem PressableCompat)
import { Pressable } from '@/src/core/components/PressableCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { isDarkTheme } from '@/src/theme/themeMode';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { AnimatedFoxMascot } from '@/src/core/components/AnimatedFoxMascot';
import { BackButton } from '@/src/core/components/BackButton';
import { Button3D } from '@/src/components/ds';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AuthBackdropLetters, AuthHeroDecor, NightMoon, NightSky } from './AuthDecor';

/** Chế độ đêm của màn auth (bật khi linh vật chiếu đèn pin). */
const AuthNightContext = createContext(false);
const useNight = () => useContext(AuthNightContext);
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';

/* Bộ khung dùng chung cho đăng nhập / đăng ký / xác thực: phần đầu navy có linh vật, form trong thẻ trắng. */

interface AuthLayoutProps {
  title: string;
  /** Dòng phụ dưới tiêu đề. */
  subtitle?: string;
  onBack?: () => void;
  showMascot?: boolean;
  /** Thay linh vật mặc định (vd. cáo phản ứng theo ô mật khẩu ở màn đăng nhập). */
  mascot?: React.ReactNode;
  /** Chế độ đêm: nền tối, trăng và sao. */
  night?: boolean;
  /** Nút góc phải phần đầu (vd. chọn Sáng/Tối); mặc định là khoảng trống cùng kích thước. */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  onBack,
  showMascot = true,
  mascot,
  night = false,
  headerRight,
  children,
  footer,
}) => {
  const insets = useSafeAreaInsets();
  const nightV = useSharedValue(night ? 1 : 0);
  useEffect(() => {
    nightV.value = withTiming(night ? 1 : 0, { duration: 520 });
  }, [night, nightV]);
  const nightStyle = useAnimatedStyle(() => ({ opacity: nightV.value }));
  const dayStyle = useAnimatedStyle(() => ({ opacity: 1 - nightV.value }));
  const moonStyle = useAnimatedStyle(() => ({
    opacity: nightV.value,
    transform: [{ translateY: (1 - nightV.value) * 30 }, { scale: 0.7 + nightV.value * 0.3 }],
  }));

  return (
    <AuthNightContext.Provider value={night}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, s.nightBg, nightStyle]} pointerEvents="none">
        <NightSky />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, dayStyle]} pointerEvents="none">
        <AuthBackdropLetters />
      </Animated.View>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Phần đầu: nằm trên thẻ form để chùm đèn của linh vật có thể chiếu xuống ô nhập */}
        <View style={[s.hero, { paddingTop: insets.top + 10 }, showMascot ? s.heroTall : s.heroCompact]}>
          <LinearGradient
            colors={[ds.hero, ds.heroSoft, ds.btnEdge]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, s.heroBg]}
          />
          <View style={[s.halo, { width: 180, height: 180, top: 0, right: 0, borderBottomLeftRadius: 180 }]} />
          <View style={[s.halo, { width: 120, height: 120, bottom: 0, left: 0, borderTopRightRadius: 120 }]} />
          {showMascot ? (
            <Animated.View style={[StyleSheet.absoluteFill, dayStyle]} pointerEvents="none">
              <AuthHeroDecor />
            </Animated.View>
          ) : null}
          <Animated.View style={[s.moonWrap, { top: insets.top + 54 }, moonStyle]} pointerEvents="none">
            <NightMoon size={48} />
          </Animated.View>

          <View style={s.heroTop}>
            {onBack ? <BackButton onPress={onBack} variant="onDark" /> : <View style={s.backSpacer} />}
            <Text style={s.brand}>Loxera English</Text>
            {headerRight ?? <View style={s.backSpacer} />}
          </View>

          {showMascot ? (
            <View style={s.mascot}>{mascot ?? <AnimatedFoxMascot size={130} />}</View>
          ) : (
            <View style={{ height: 24 }} />
          )}
        </View>

        <View style={[s.card, night && s.cardNight]}>
          <Text style={[s.title, night && { color: ds.white }]}>{title}</Text>
          {subtitle ? <Text style={[s.subtitle, night && { color: ds.onInk }]}>{subtitle}</Text> : null}
          <View style={{ height: 18 }} />
          {children}
        </View>

        {footer ? <View style={s.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
    </AuthNightContext.Provider>
  );
};

interface AuthTextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon: LucideIcon;
  error?: string | null;
  secure?: boolean;
  /** Báo khi người dùng bấm con mắt hiện/ẩn mật khẩu. */
  onRevealChange?: (revealed: boolean) => void;
}

export const AuthTextField = forwardRef<TextInputInstance, AuthTextFieldProps>(
  ({ label, icon: Icon, error, secure, onRevealChange, onFocus, onBlur, ...inputProps }, ref) => {
    const [hidden, setHidden] = useState(true);
    const [focused, setFocused] = useState(false);
    const night = useNight();
    const tint = error ? ds.red : focused ? (night ? ds.amber : ds.btn) : night ? ds.onInk : ds.faint;
    return (
      <View style={s.field}>
        <Text style={[s.label, night && { color: ds.onInk }]}>{label}</Text>
        <View
          style={[
            s.inputBox,
            night && s.inputBoxNight,
            focused && (night ? s.inputBoxNightFocused : s.inputBoxFocused),
            error ? s.inputBoxError : null,
          ]}
        >
          <Icon size={18} color={tint} />
          <TextInput
            ref={ref}
            {...inputProps}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            secureTextEntry={secure ? hidden : false}
            placeholderTextColor={night ? ds.onInk : ds.faint}
            style={[s.input, night && { color: ds.white }]}
          />
          {secure ? (
            <Pressable
              onPress={() => {
                const next = !hidden;
                setHidden(next);
                onRevealChange?.(!next);
              }}
              hitSlop={10}
              accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
              style={[s.eye, !hidden && s.eyeOn]}
            >
              {hidden ? <Eye size={18} color={ds.muted} /> : <EyeOff size={18} color={ds.amberText} />}
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={s.fieldError}>{error}</Text> : null}
      </View>
    );
  }
);
AuthTextField.displayName = 'AuthTextField';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}

export const AuthButton: React.FC<AuthButtonProps> = ({ label, onPress, loading, disabled, variant = 'primary' }) => (
  <Button3D
    label={label}
    onPress={onPress}
    loading={loading}
    // Button3D tự chặn bấm khi loading; chỉ truyền disabled thật để nút giữ màu chính lúc đang tải
    disabled={disabled}
    variant={variant === 'primary' ? 'primary' : 'light'}
    height={52}
  />
);

/** Logo Google 4 màu. */
const GoogleLogo: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z" />
    <Path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
    <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </Svg>
);

/**
 * Nút "Tiếp tục với Google": giao diện sáng giữ nguyên nút cũ;
 * giao diện tối dùng nút kính tối viền sáng nhẹ + logo Google để hợp tông.
 */
export const AuthGoogleButton: React.FC<{ label: string; onPress: () => void; disabled?: boolean }> = ({ label, onPress, disabled }) => {
  if (!isDarkTheme()) return <AuthButton label={label} variant="outline" onPress={onPress} disabled={disabled} />;
  // Cùng cấu trúc với Button3D (mặt nút 52 + đế 4, lún xuống khi nhấn) để thẳng hàng với nút "Đăng nhập"
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ height: 52 + 4, opacity: disabled ? 0.5 : 1 }}
    >
      {({ pressed }) => (
        <>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 4, height: 52, borderRadius: dsRadius.md, backgroundColor: '#0B1220' }} />
          <View
            style={{
              height: 52,
              borderRadius: dsRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              backgroundColor: pressed ? '#334155' : '#1E293B',
              borderWidth: 1.5,
              borderColor: 'rgba(226,232,240,0.3)',
              transform: [{ translateY: pressed ? 3 : 0 }],
            }}
          >
            <GoogleLogo />
            <Text style={{ fontFamily: dsFont.bold, fontSize: dsSize.base, color: '#F1F5F9' }} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
};

export const AuthErrorBanner: React.FC<{ message?: string | null; children?: React.ReactNode }> = ({ message, children }) =>
  message ? (
    <View style={s.errorBanner}>
      <Text style={s.errorText}>{message}</Text>
      {children}
    </View>
  ) : null;

export const AuthDivider: React.FC<{ label: string }> = ({ label }) => {
  const night = useNight();
  const line = [s.dividerLine, night && { backgroundColor: ds.onInkFaint }];
  return (
    <View style={s.divider}>
      <View style={line} />
      <Text style={[s.dividerText, night && { color: ds.onInk }]}>{label}</Text>
      <View style={line} />
    </View>
  );
};

export const AuthFooterLink: React.FC<{ text: string; link: string; onPress: () => void }> = ({ text, link, onPress }) => {
  const night = useNight();
  return (
    <View style={s.footerRow}>
      <Text style={[s.footerText, night && { color: ds.onInk }]}>{text} </Text>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={[s.footerLink, night && { color: ds.amber }]}>{link}</Text>
      </Pressable>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  nightBg: { backgroundColor: ds.hero },
  moonWrap: { position: 'absolute', right: 34 },
  cardNight: { backgroundColor: ds.heroSoft, borderWidth: 1, borderColor: ds.onInkFaint },
  inputBoxNight: { backgroundColor: ds.onInkFaint, borderColor: ds.onInkFaint },
  inputBoxNightFocused: { borderColor: ds.amber },
  hero: { zIndex: 10, alignItems: 'center', paddingHorizontal: 20 },
  heroTall: { minHeight: 230 },
  heroCompact: { paddingBottom: 20 },
  heroBg: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  halo: { position: 'absolute', backgroundColor: ds.onInkFaint },
  heroTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backSpacer: { width: 40, height: 40 },
  brand: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.skyLight, letterSpacing: 1.2, textTransform: 'uppercase' },
  mascot: { marginTop: 4, alignItems: 'center' },

  card: {
    marginTop: 18,
    marginHorizontal: 16,
    padding: 22,
    backgroundColor: ds.card,
    borderRadius: dsRadius.xl,
    ...dsShadow.card,
  },
  title: { fontFamily: dsFont.displayHeavy, fontSize: dsSize.xl, color: ds.ink, letterSpacing: -0.3 },
  subtitle: { fontFamily: dsFont.body, fontSize: dsSize.sm, color: ds.muted, marginTop: 4 },

  field: { marginBottom: 14 },
  label: { fontFamily: dsFont.semibold, fontSize: dsSize.xs, color: ds.muted, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: dsRadius.md,
    backgroundColor: ds.bg,
    borderWidth: 1.5,
    borderColor: ds.line,
  },
  inputBoxFocused: { backgroundColor: ds.card, borderColor: ds.btn },
  inputBoxError: { borderColor: ds.red },
  input: { flex: 1, fontFamily: dsFont.medium, fontSize: dsSize.base, color: ds.ink, paddingVertical: 0 },
  eye: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eyeOn: { backgroundColor: ds.amberSoft },
  fieldError: { fontFamily: dsFont.medium, fontSize: dsSize.xs, color: ds.red, marginTop: 4 },

  errorBanner: { backgroundColor: ds.redSoft, borderRadius: dsRadius.sm, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  errorText: { fontFamily: dsFont.medium, fontSize: dsSize.xs, color: ds.redText },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: ds.line },
  dividerText: { fontFamily: dsFont.medium, fontSize: dsSize.xs, color: ds.faint, marginHorizontal: 12 },

  footer: { marginTop: 'auto', paddingTop: 24 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontFamily: dsFont.body, fontSize: dsSize.sm, color: ds.muted },
  footerLink: { fontFamily: dsFont.bold, fontSize: dsSize.sm, color: ds.btn },
});
