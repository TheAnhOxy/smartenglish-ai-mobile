import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Crown,
  X,
  CheckCircle2,
  Zap,
  Camera,
  Award,
  Sparkles,
  ShieldCheck,
  Flame,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';

export const PaywallScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  // Reanimated Animation Shared Values
  const floatY = useSharedValue(0);
  const glowPulse = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // 1. Floating Crown animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    );

    // 2. Glowing Recommended Card pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // 3. CTA Button subtle pulse
    buttonScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedCrownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
    borderColor: '#FF6B35',
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSubscribe = () => {
    if (currentUser) {
      currentUser.plan = selectedPlan === 'yearly' ? 'premium_yearly' : 'premium_monthly';
    }
    alert('🎉 Nâng cấp SmartEnglish Premium thành công! Bạn có thể sử dụng tất cả tính năng không giới hạn.');
    router.back();
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Top Header Bar */}
        <View style={s.headerBar}>
          <View style={s.headerTitleRow}>
            <Animated.View style={animatedCrownStyle}>
              <Crown color="#FFC93C" size={26} fill="#FFC93C" />
            </Animated.View>
            <Text style={s.headerTitle}>SmartEnglish Premium</Text>
          </View>

          <Pressable onPress={() => router.back()} style={s.closeBtn}>
            <X color="#FFFFFF" size={18} />
          </Pressable>
        </View>

        {/* Feature Badges Row (Replaced AI icons with clean non-AI icons) */}
        <View style={s.featureBadgesRow}>
          <View style={s.badgeItem}>
            <View style={s.badgeIconCircle}>
              <Camera color="#38BDF8" size={24} />
            </View>
            <Text style={s.badgeText}>Quét thông minh</Text>
          </View>

          <View style={s.badgeItem}>
            <View style={[s.badgeIconCircle, s.badgeIconCircleSpecial]}>
              <Sparkles color="#FF6B35" size={24} />
            </View>
            <Text style={s.badgeTextSpecial}>Phân tích nâng cao</Text>
          </View>

          <View style={s.badgeItem}>
            <View style={s.badgeIconCircle}>
              <Award color="#38BDF8" size={24} />
            </View>
            <Text style={s.badgeText}>Chứng nhận</Text>
          </View>
        </View>

        {/* Main Banner Headline */}
        <View style={s.headlineWrap}>
          <Text style={s.headlineText}>
            Nâng tầm khả năng ngôn ngữ với{' '}
            <Text style={s.headlineHighlight}>công nghệ học thế hệ mới</Text>
          </Text>
        </View>

        {/* Feature Comparison Table */}
        <View style={s.comparisonCard}>
          <Text style={s.comparisonTitle}>QUYỀN LỢI PREMIUM</Text>

          <View style={s.featureList}>
            <View style={s.featureItemRow}>
              <View style={s.featureLeft}>
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text style={s.featureLabelText}>Quét ảnh không giới hạn</Text>
              </View>
              <View style={s.freeTagBadge}>
                <Text style={s.freeTagText}>10 lượt/ngày</Text>
              </View>
            </View>

            <View style={s.featureItemRow}>
              <View style={s.featureLeft}>
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text style={s.featureLabelText}>Phân tích IPA chi tiết</Text>
              </View>
              <View style={s.freeTagBadge}>
                <Text style={s.freeTagText}>Không có</Text>
              </View>
            </View>

            <View style={s.featureItemRow}>
              <View style={s.featureLeft}>
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text style={s.featureLabelText}>Luyện nói hội thoại chuyên sâu</Text>
              </View>
              <View style={s.freeTagBadge}>
                <Text style={s.freeTagText}>Không có</Text>
              </View>
            </View>

            <View style={s.featureItemRow}>
              <View style={s.featureLeft}>
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text style={s.featureLabelText}>Chữa bài viết tiếng Anh (Writing)</Text>
              </View>
              <View style={s.freeTagBadge}>
                <Text style={s.freeTagText}>Không có</Text>
              </View>
            </View>

            <View style={s.featureItemRow}>
              <View style={s.featureLeft}>
                <CheckCircle2 color="#FF6B35" size={18} />
                <Text style={s.featureLabelText}>Hoàn toàn không có quảng cáo</Text>
              </View>
              <View style={s.freeTagBadge}>
                <Text style={s.freeTagText}>Có quảng cáo</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cycle Selector (Monthly vs Yearly) */}
        <View style={s.cycleToggleBox}>
          <Pressable
            onPress={() => {
              setCycle('monthly');
              setSelectedPlan('monthly');
            }}
            style={[s.cycleBtn, cycle === 'monthly' && s.cycleBtnActive]}
          >
            <Text style={[s.cycleBtnText, cycle === 'monthly' && s.cycleBtnTextActive]}>Monthly</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setCycle('yearly');
              setSelectedPlan('yearly');
            }}
            style={[s.cycleBtn, cycle === 'yearly' && s.cycleBtnActive]}
          >
            <Text style={[s.cycleBtnText, cycle === 'yearly' && s.cycleBtnTextActive]}>Yearly</Text>
          </Pressable>
        </View>

        {/* Pricing Package Cards Selection */}
        <View style={s.pricingList}>
          {/* Yearly Package (RECOMMENDED with Glowing Reanimated Animation) */}
          <Pressable onPress={() => setSelectedPlan('yearly')}>
            <Animated.View
              style={[
                s.planCard,
                s.planCardYearly,
                selectedPlan === 'yearly' && animatedGlowStyle,
              ]}
            >
              <View style={s.recommendedBadge}>
                <Flame color="#FFFFFF" size={10} fill="#FFFFFF" />
                <Text style={s.recommendedBadgeText}>RECOMMENDED</Text>
              </View>

              <View style={s.planCardContentRow}>
                <View>
                  <Text style={s.priceMainText}>
                    49.900đ<Text style={s.priceSubText}>/tháng</Text>
                  </Text>
                  <Text style={s.savingsText}>599.000đ/năm • Tiết kiệm 44% 🔥</Text>
                </View>

                <View style={[s.radioCircle, selectedPlan === 'yearly' && s.radioCircleSelected]}>
                  {selectedPlan === 'yearly' && <View style={s.radioInnerDot} />}
                </View>
              </View>
            </Animated.View>
          </Pressable>

          {/* Monthly Package */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            style={[
              s.planCard,
              selectedPlan === 'monthly' && s.planCardSelected,
            ]}
          >
            <View style={s.planCardContentRow}>
              <View>
                <Text style={s.priceMainText}>
                  89.000đ<Text style={s.priceSubText}>/tháng</Text>
                </Text>
                <Text style={s.trialText}>Dùng thử 7 ngày miễn phí</Text>
              </View>

              <View style={[s.radioCircle, selectedPlan === 'monthly' && s.radioCircleSelected]}>
                {selectedPlan === 'monthly' && <View style={s.radioInnerDot} />}
              </View>
            </View>
          </Pressable>
        </View>

        {/* Animated Primary CTA Button */}
        <Animated.View style={animatedButtonStyle}>
          <Pressable onPress={handleSubscribe} style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>Bắt đầu dùng thử miễn phí</Text>
          </Pressable>
        </Animated.View>

        <Text style={s.footerSubText}>
          Hủy bất cứ lúc nào • Hoàn tiền 30 ngày bảo đảm
        </Text>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeIconCircleSpecial: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderColor: 'rgba(255, 107, 53, 0.4)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  badgeTextSpecial: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B35',
  },
  headlineWrap: {
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  headlineText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
  },
  headlineHighlight: {
    color: '#FF6B35',
  },
  comparisonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 14,
  },
  featureList: {
    gap: 12,
  },
  featureItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  freeTagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeTagText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  cycleToggleBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 4,
    borderRadius: 16,
    marginBottom: 18,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cycleBtn: {
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cycleBtnActive: {
    backgroundColor: '#0EA5E9',
  },
  cycleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  cycleBtnTextActive: {
    color: '#FFFFFF',
  },
  pricingList: {
    gap: 14,
    marginBottom: 22,
  },
  planCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    position: 'relative',
  },
  planCardYearly: {
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderColor: '#0EA5E9',
  },
  planCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  recommendedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  planCardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceMainText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceSubText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#CBD5E1',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    marginTop: 2,
  },
  trialText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  ctaBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerSubText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
});
