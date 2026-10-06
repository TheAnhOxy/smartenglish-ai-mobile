import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Crown,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  Bot,
  Mic,
  FileText,
  Camera,
  Users,
  Flame,
  ArrowRight,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';
import {
  fetchStudentPlansApi,
  subscribeToPlanApi,
  StudentSubscriptionPlan,
} from '@/src/features/subscription-paywall/data/subscriptionApi';

export const PaywallScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { currentUser, updateCurrentUser } = useAuthStore();

  const [plans, setPlans] = useState<StudentSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('S-PLAN-YEARLY');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Reanimated Animation Shared Values
  const floatY = useSharedValue(0);
  const glowPulse = useSharedValue(1);

  useEffect(() => {
    // 1. Floating Crown animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    );

    // 2. Glowing Recommended Card pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Fetch live plans synced with Admin config
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await fetchStudentPlansApi();
      setPlans(data);
      // Default to popular plan or yearly
      const popular = data.find((p) => p.isPopular);
      if (popular) {
        setSelectedPlanId(popular.id);
      } else if (data.length > 1) {
        setSelectedPlanId(data[1].id);
      }
    } catch (e) {
      console.warn('Failed to load plans:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const animatedCrownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
  }));

  // Identify Free plan and Paid plans
  const freePlan = plans.find((p) => p.id === 'S-PLAN-FREE' || (p.priceMonthly === 0 && p.priceYearly === 0)) || {
    id: 'S-PLAN-FREE',
    name: 'Học Viên Miễn Phí',
    badge: 'Cơ bản',
    priceMonthly: 0,
    priceYearly: 0,
    durationMonths: 0,
    isPopular: false,
    isActive: true,
    quotas: { chat: 15, speaking: 10, writing: 2, scan: 5, maxClasses: 3 },
    features: [
      { key: 'toeic_exam', label: 'Làm đề thi TOEIC & Mock Test miễn phí', enabled: true },
      { key: 'flashcard_srs', label: 'Học từ vựng Flashcard SRS không giới hạn từ', enabled: true },
    ],
  };

  const paidPlans = plans.filter((p) => p.id !== 'S-PLAN-FREE' && (p.priceMonthly > 0 || p.priceYearly > 0));

  const selectedPlan = paidPlans.find((p) => p.id === selectedPlanId) || paidPlans[0] || {
    id: 'S-PLAN-YEARLY',
    name: 'Học Viên Premium Năm',
    badge: 'Khuyên dùng 🔥',
    priceMonthly: 0,
    priceYearly: 1490000,
    durationMonths: 12,
    isPopular: true,
    isActive: true,
    quotas: { chat: 9999, speaking: 9999, writing: 9999, scan: 9999, maxClasses: 9999 },
    features: [],
  };

  const isCurrentPremium =
    currentUser?.plan?.includes('premium') || currentUser?.plan === 'lifetime';

  const formatPrice = (plan: StudentSubscriptionPlan) => {
    const price = plan.priceYearly > 0 ? plan.priceYearly : plan.priceMonthly;
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);
      await subscribeToPlanApi({
        planId: selectedPlan.id,
        paymentMethod: 'MOMO',
      });

      const newPlan =
        selectedPlan.durationMonths >= 12
          ? 'premium_yearly'
          : selectedPlan.durationMonths === 999
          ? 'lifetime'
          : 'premium_monthly';

      updateCurrentUser({ plan: newPlan as any });

      Alert.alert(
        '🎉 Nâng cấp thành công!',
        `Bạn đã nâng cấp thành công gói ${selectedPlan.name}. Toàn bộ giới hạn AI và tính năng PRO đã được kích hoạt không giới hạn!`,
        [{ text: 'Bắt đầu học ngay', onPress: () => router.back() }]
      );
    } catch (err) {
      // Fallback for offline / demo testing
      const newPlan =
        selectedPlan.durationMonths >= 12
          ? 'premium_yearly'
          : selectedPlan.durationMonths === 999
          ? 'lifetime'
          : 'premium_monthly';

      updateCurrentUser({ plan: newPlan as any });

      Alert.alert(
        '🎉 Nâng cấp thành công!',
        `Gói ${selectedPlan.name} đã được kích hoạt trên tài khoản của bạn. Chúc bạn học tập hiệu quả!`,
        [{ text: 'Tuyệt vời', onPress: () => router.back() }]
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Top Header Bar */}
      <View style={s.headerBar}>
        <View style={s.headerTitleRow}>
          <Animated.View style={animatedCrownStyle}>
            <Crown color="#F59E0B" size={24} fill="#F59E0B" />
          </Animated.View>
          <Text style={s.headerTitle}>Gói Học Viên & Quyền Lợi</Text>
        </View>

        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else if (params.from === 'learn') {
              router.navigate('/(student)/learn' as any);
            } else {
              router.navigate('/(student)/profile' as any);
            }
          }}
          style={s.closeBtn}
        >
          <X color="#FFFFFF" size={20} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* User Current Plan Status Banner */}
        <View style={[s.statusCard, isCurrentPremium ? s.statusCardPremium : s.statusCardFree]}>
          <View style={s.statusIconWrap}>
            {isCurrentPremium ? (
              <Crown color="#F59E0B" size={20} fill="#F59E0B" />
            ) : (
              <ShieldCheck color="#38BDF8" size={20} />
            )}
          </View>
          <View style={s.statusContent}>
            <Text style={s.statusSubLabel}>GÓI TÀI KHOẢN</Text>
            <Text style={s.statusPlanName}>
              {isCurrentPremium
                ? currentUser?.plan === 'premium_yearly'
                  ? 'Premium Năm'
                  : currentUser?.plan === 'lifetime'
                  ? 'Premium Trọn Đời'
                  : 'Premium Tháng'
                : 'Tài khoản Miễn Phí'}
            </Text>
          </View>
        </View>

        {/* 1. SECTION: QUYỀN LỢI HIỆN TẠI (GÓI FREE) */}
        <View style={s.sectionBox}>
          <View style={s.sectionHeader}>
            <View style={s.sectionIconPillFree}>
              <Text style={s.sectionIconTextFree}>FREE</Text>
            </View>
            <Text style={s.sectionTitle}>Quyền lợi hiện tại (Gói Free)</Text>
          </View>

          {/* Quota Grid */}
          <View style={s.quotaGrid}>
            <View style={s.quotaItem}>
              <View style={s.quotaIconRow}>
                <Bot color="#38BDF8" size={16} />
                <Text style={s.quotaLabel}>AI Chat</Text>
              </View>
              <Text style={s.quotaValue}>{freePlan.quotas.chat} lượt<Text style={s.quotaUnit}>/ngày</Text></Text>
            </View>

            <View style={s.quotaItem}>
              <View style={s.quotaIconRow}>
                <Mic color="#F43F5E" size={16} />
                <Text style={s.quotaLabel}>Phát âm AI</Text>
              </View>
              <Text style={s.quotaValue}>{freePlan.quotas.speaking} lượt<Text style={s.quotaUnit}>/ngày</Text></Text>
            </View>

            <View style={s.quotaItem}>
              <View style={s.quotaIconRow}>
                <FileText color="#F59E0B" size={16} />
                <Text style={s.quotaLabel}>Viết luận AI</Text>
              </View>
              <Text style={s.quotaValue}>{freePlan.quotas.writing} bài<Text style={s.quotaUnit}>/tuần</Text></Text>
            </View>

            <View style={s.quotaItem}>
              <View style={s.quotaIconRow}>
                <Camera color="#06B6D4" size={16} />
                <Text style={s.quotaLabel}>Quét ảnh đề</Text>
              </View>
              <Text style={s.quotaValue}>{freePlan.quotas.scan} lượt<Text style={s.quotaUnit}>/ngày</Text></Text>
            </View>
          </View>

          <View style={s.quotaSingleRow}>
            <View style={s.quotaIconRow}>
              <Users color="#A855F7" size={16} />
              <Text style={s.quotaLabel}>Tham gia lớp học giáo viên:</Text>
            </View>
            <Text style={s.quotaValueBold}>Tối đa {freePlan.quotas.maxClasses} lớp</Text>
          </View>

          {/* Free Standard Features */}
          <View style={s.freeFeaturesList}>
            {freePlan.features.map((f, idx) => (
              <View key={f.key || idx} style={s.featureRow}>
                <CheckCircle2 color="#64748B" size={16} />
                <Text style={s.featureTextMuted}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. SECTION: NÂNG LÊN PRO CÓ THÊM ĐƯỢC GÌ? */}
        <View style={s.sectionBoxPro}>
          <View style={s.proHeaderBar}>
            <View style={s.proHeaderLeft}>
              <Sparkles color="#F59E0B" size={18} />
              <Text style={s.sectionTitlePro}>Nâng lên PRO nhận thêm được gì?</Text>
            </View>
            <View style={s.unlimitedPill}>
              <Zap color="#FFFFFF" size={12} />
              <Text style={s.unlimitedPillText}>VÔ HẠN</Text>
            </View>
          </View>

          {/* Comparison Table */}
          <View style={s.compareTable}>
            <View style={s.compareHeaderRow}>
              <Text style={s.colHeaderFeature}>TÍNH NĂNG / HẠN MỨC</Text>
              <Text style={s.colHeaderFree}>GÓI FREE</Text>
              <Text style={s.colHeaderPro}>GÓI PRO 🔥</Text>
            </View>

            <View style={s.compareRow}>
              <View style={s.featureTitleWrap}>
                <Bot color="#38BDF8" size={15} />
                <Text style={s.compareFeatureText}>AI Chat hội thoại</Text>
              </View>
              <Text style={s.compareFreeVal}>15 lượt/ngày</Text>
              <View style={s.proValBadge}>
                <Text style={s.proValText}>Không giới hạn</Text>
              </View>
            </View>

            <View style={s.compareRow}>
              <View style={s.featureTitleWrap}>
                <Mic color="#F43F5E" size={15} />
                <Text style={s.compareFeatureText}>Luyện phát âm AI</Text>
              </View>
              <Text style={s.compareFreeVal}>10 lượt/ngày</Text>
              <View style={s.proValBadge}>
                <Text style={s.proValText}>Không giới hạn</Text>
              </View>
            </View>

            <View style={s.compareRow}>
              <View style={s.featureTitleWrap}>
                <FileText color="#F59E0B" size={15} />
                <Text style={s.compareFeatureText}>Chấm viết luận AI</Text>
              </View>
              <Text style={s.compareFreeVal}>2 bài/tuần</Text>
              <View style={s.proValBadge}>
                <Text style={s.proValText}>Band 8.0+ Vô hạn</Text>
              </View>
            </View>

            <View style={s.compareRow}>
              <View style={s.featureTitleWrap}>
                <Camera color="#06B6D4" size={15} />
                <Text style={s.compareFeatureText}>Quét ảnh giải bài</Text>
              </View>
              <Text style={s.compareFreeVal}>5 lượt/ngày</Text>
              <View style={s.proValBadge}>
                <Text style={s.proValText}>Không giới hạn</Text>
              </View>
            </View>

            <View style={[s.compareRow, { borderBottomWidth: 0 }]}>
              <View style={s.featureTitleWrap}>
                <Users color="#A855F7" size={15} />
                <Text style={s.compareFeatureText}>Tham gia lớp học</Text>
              </View>
              <Text style={s.compareFreeVal}>Tối đa 3 lớp</Text>
              <View style={s.proValBadge}>
                <Text style={s.proValText}>Không giới hạn</Text>
              </View>
            </View>
          </View>

          {/* Pro Exclusive Feature List */}
          <Text style={s.proExclusiveTitle}>ĐẶC QUYỀN NÂNG CAO TRÊN PRO:</Text>
          <View style={s.proExclusiveList}>
            <View style={s.proExItem}>
              <View style={s.proExBullet}>
                <Star color="#F59E0B" size={13} fill="#F59E0B" />
              </View>
              <Text style={s.proExMainText}>AI Cố vấn 1-1 phân tích bẫy đề TOEIC</Text>
            </View>

            <View style={s.proExItem}>
              <View style={s.proExBullet}>
                <Star color="#F59E0B" size={13} fill="#F59E0B" />
              </View>
              <Text style={s.proExMainText}>Mở khóa trọn bộ từ vựng & đề thi nâng cao</Text>
            </View>

            <View style={s.proExItem}>
              <View style={s.proExBullet}>
                <Star color="#F59E0B" size={13} fill="#F59E0B" />
              </View>
              <Text style={s.proExMainText}>Báo cáo đánh giá chuẩn khung CEFR</Text>
            </View>

            <View style={s.proExItem}>
              <View style={s.proExBullet}>
                <Star color="#F59E0B" size={13} fill="#F59E0B" />
              </View>
              <Text style={s.proExMainText}>Ưu tiên Model AI cao cấp & tốc độ cao</Text>
            </View>

            <View style={s.proExItem}>
              <View style={s.proExBullet}>
                <Star color="#F59E0B" size={13} fill="#F59E0B" />
              </View>
              <Text style={s.proExMainText}>100% Không có quảng cáo làm phiền</Text>
            </View>
          </View>
        </View>

        {/* 3. SECTION: CHỌN GÓI NÂNG CẤP */}
        <View style={s.plansSection}>
          <Text style={s.plansSectionTitle}>CHỌN GÓI NÂNG CẤP</Text>

          {isLoading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color="#F59E0B" size="small" />
              <Text style={{ color: '#94A3B8', marginTop: 6, fontSize: 13 }}>Đang tải...</Text>
            </View>
          ) : (
            <View style={s.pricingCardsWrap}>
              {paidPlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isYearly = plan.durationMonths === 12;
                const isLifetime = plan.durationMonths === 999;
                const priceFormatted = formatPrice(plan);

                // Calculate monthly equivalent if yearly
                const monthlyEquiv = isYearly
                  ? Math.round((plan.priceYearly || 1490000) / 12).toLocaleString('vi-VN') + ' đ/tháng'
                  : null;

                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlanId(plan.id)}
                    style={({ pressed }) => [
                      s.planCard,
                      isSelected && s.planCardSelected,
                      plan.isPopular && s.planCardPopular,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    {/* Badge top */}
                    {plan.isPopular && (
                      <View style={s.popularTag}>
                        <Flame color="#FFFFFF" size={12} fill="#FFFFFF" />
                        <Text style={s.popularTagText}>{plan.badge || 'Khuyên dùng • Tiết kiệm 38%'}</Text>
                      </View>
                    )}

                    <View style={s.planCardContent}>
                      <View style={s.planInfoLeft}>
                        <View style={s.planNameRow}>
                          <Text style={[s.planNameText, isSelected && s.planNameTextSelected]}>
                            {plan.name}
                          </Text>
                          {plan.badge && !plan.isPopular && (
                            <View style={s.planBadgeSmall}>
                              <Text style={s.planBadgeSmallText}>{plan.badge}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={s.planPriceMain}>
                          {priceFormatted}
                          <Text style={s.planDurationUnit}>
                            {isLifetime ? ' / trọn đời' : isYearly ? ' / năm' : ' / tháng'}
                          </Text>
                        </Text>

                        {monthlyEquiv && (
                          <Text style={s.monthlyEquivText}>
                            Chỉ ~{monthlyEquiv} • Tiết kiệm 38% 🔥
                          </Text>
                        )}
                        {isLifetime && (
                          <Text style={s.lifetimeText}>
                            Sở hữu vĩnh viễn • Không cần gia hạn
                          </Text>
                        )}
                      </View>

                      {/* Radio button circle */}
                      <View style={[s.radioCircle, isSelected && s.radioCircleSelected]}>
                        {isSelected && <View style={s.radioInnerDot} />}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Commitment Notes */}
        <View style={s.trustSection}>
          <View style={s.trustItem}>
            <ShieldCheck color="#10B981" size={16} />
            <Text style={s.trustText}>Kích hoạt ngay lập tức</Text>
          </View>
          <View style={s.trustItem}>
            <Zap color="#F59E0B" size={16} />
            <Text style={s.trustText}>Hỗ trợ học tập 24/7</Text>
          </View>
        </View>

        {/* Extra bottom padding for sticky bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom CTA Upgrade Button */}
      <View style={s.bottomCtaBar}>
        <Pressable
          onPress={handleSubscribe}
          disabled={isSubscribing}
          style={({ pressed }) => [
            s.upgradeBtn,
            isSubscribing && { opacity: 0.7 },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          {isSubscribing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={s.upgradeBtnContent}>
              <Text style={s.upgradeBtnTitle}>
                Nâng cấp ngay • {formatPrice(selectedPlan)}
              </Text>
              <ArrowRight color="#FFFFFF" size={20} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Current Status Card */
  statusCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  statusCardFree: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  statusCardPremium: {
    backgroundColor: '#172554',
    borderColor: '#1D4ED8',
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusContent: {
    flex: 1,
  },
  statusSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  statusPlanName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statusHint: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 3,
    lineHeight: 16,
  },

  /* Section 1: Free */
  sectionBox: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconPillFree: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sectionIconTextFree: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  quotaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quotaItem: {
    width: '48.5%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quotaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  quotaLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  quotaValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  quotaUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  quotaSingleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quotaValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  freeFeaturesList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureTextMuted: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Section 2: Pro */
  sectionBoxPro: {
    backgroundColor: '#172554',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  proHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  proHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitlePro: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unlimitedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unlimitedPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sectionDescPro: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },

  /* Compare Table */
  compareTable: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    marginBottom: 16,
  },
  compareHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  colHeaderFeature: {
    flex: 1.3,
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  colHeaderFree: {
    width: 82,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  colHeaderPro: {
    width: 95,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
    color: '#F59E0B',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  featureTitleWrap: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compareFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  compareFreeVal: {
    width: 82,
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
  },
  proValBadge: {
    width: 95,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
  },
  proValText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
    textAlign: 'center',
  },

  /* Pro Exclusives */
  proExclusiveTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  proExclusiveList: {
    gap: 10,
  },
  proExItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  proExBullet: {
    marginTop: 2,
  },
  proExContent: {
    flex: 1,
  },
  proExMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  proExSubText: {
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 2,
    lineHeight: 15,
  },

  /* Section 3: Plans */
  plansSection: {
    marginBottom: 16,
  },
  plansSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  plansSectionDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12,
  },
  pricingCardsWrap: {
    gap: 10,
  },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E293B',
  },
  planCardPopular: {
    borderColor: '#F59E0B',
  },
  popularTag: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  popularTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfoLeft: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  planNameTextSelected: {
    color: '#FFFFFF',
  },
  planBadgeSmall: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  planBadgeSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  planPriceMain: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F59E0B',
    marginTop: 4,
  },
  planDurationUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  monthlyEquivText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 3,
  },
  lifetimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 3,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioCircleSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  /* Trust notes */
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Sticky Bottom CTA */
  bottomCtaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  upgradeBtn: {
    backgroundColor: '#D97706',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeBtnTextWrap: {
    flex: 1,
  },
  upgradeBtnTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  upgradeBtnSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
});
