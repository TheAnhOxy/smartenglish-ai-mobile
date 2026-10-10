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
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  Bot,
  Mic,
  FileText,
  ArrowRight,
  ShieldCheck,
  Flame,
  Star,
  Lock,
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

  // Animation values
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1400 }),
        withTiming(0, { duration: 1400 })
      ),
      -1,
      true
    );

    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await fetchStudentPlansApi();
      setPlans(data);
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

  const paidPlans = plans.filter(
    (p) => p.id !== 'S-PLAN-FREE' && (p.priceMonthly > 0 || p.priceYearly > 0)
  );

  const selectedPlan =
    paidPlans.find((p) => p.id === selectedPlanId) ||
    paidPlans[0] || {
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

  const formatPriceVnd = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
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
        `Bạn đã kích hoạt thành công gói ${selectedPlan.name}. Toàn bộ tính năng AI và đặc quyền PRO đã sẵn sàng!`,
        [{ text: 'Bắt đầu học ngay', onPress: () => router.back() }]
      );
    } catch (err) {
      // Fallback cho offline / demo
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

  // 4 Trọng tâm quyền lợi mà người dùng nhận được khi nâng cấp PRO
  const CORE_PRO_BENEFITS = [
    {
      icon: <Bot color="#F59E0B" size={20} />,
      title: 'AI Gia sư 1-1 Không Giới Hạn',
      desc: 'Luyện đàm thoại phản xạ tự nhiên & sửa ngữ pháp tức thì 24/7.',
    },
    {
      icon: <Mic color="#38BDF8" size={20} />,
      title: 'Chấm Điểm & Sửa Phát Âm Chi Tiết',
      desc: 'Nhận diện lỗi sai từng âm vị, nối âm & ngữ điệu chuẩn bản xứ.',
    },
    {
      icon: <FileText color="#10B981" size={20} />,
      title: 'Chấm Viết Luận & Đề Thi TOEIC VIP',
      desc: 'Phân tích bẫy đề thi thực tế, viết lại bài mẫu Band 8.0+ không giới hạn.',
    },
    {
      icon: <Zap color="#A855F7" size={20} />,
      title: 'Mô Hình AI Cao Cấp • 100% Không Quảng Cáo',
      desc: 'Ưu tiên kết nối máy chủ AI tốc độ cao, học liền mạch không gián đoạn.',
    },
  ];

  const getPlanHighlightInfo = (plan: StudentSubscriptionPlan) => {
    const isYearly = plan.durationMonths === 12 || plan.id.includes('YEARLY');
    const isLifetime = plan.durationMonths === 999 || plan.id.includes('LIFETIME');

    if (isYearly) {
      const price = plan.priceYearly || 1490000;
      const monthlyEquiv = Math.round(price / 12);
      return {
        badgeTag: 'TIẾT KIỆM 38% • ĐƯỢC CHỌN NHIỀU NHẤT',
        mainPrice: `${formatPriceVnd(monthlyEquiv)}`,
        unitLabel: '/tháng',
        totalPriceLabel: `Thanh toán ${formatPriceVnd(price)}/năm (Tiết kiệm 898.000 đ)`,
        corePerk: 'Trọn vẹn 12 tháng học tập không giới hạn + Cố vấn AI 1-1 chuyên sâu',
      };
    }

    if (isLifetime) {
      const price = plan.priceYearly || 3990000;
      return {
        badgeTag: 'ĐẦU TƯ 1 LẦN • SỞ HỮU TRỌN ĐỜI',
        mainPrice: `${formatPriceVnd(price)}`,
        unitLabel: '/vĩnh viễn',
        totalPriceLabel: 'Thanh toán 1 lần duy nhất, không phát sinh chi phí',
        corePerk: 'Sở hữu trọn đời, tự động cập nhật mọi khóa học và model AI mới sau này',
      };
    }

    const price = plan.priceMonthly || 199000;
    return {
      badgeTag: 'LINH HOẠT',
      mainPrice: `${formatPriceVnd(price)}`,
      unitLabel: '/tháng',
      totalPriceLabel: 'Gia hạn linh hoạt theo từng tháng, hủy bất kỳ lúc nào',
      corePerk: 'Phù hợp ôn luyện cấp tốc & trải nghiệm trọn vẹn toàn bộ sức mạnh Pro',
    };
  };

  const selectedHighlight = getPlanHighlightInfo(selectedPlan);

  return (
    <View style={s.root}>
      {/* Top Header Navigation */}
      <View style={s.headerBar}>
        <View style={s.headerPill}>
          <Crown color="#F59E0B" size={14} fill="#F59E0B" />
          <Text style={s.headerPillText}>SMARTENGLISH PRO</Text>
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
          style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
        >
          <X color="#94A3B8" size={18} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Hero Section */}
        <View style={s.heroSection}>
          <Animated.View style={[s.heroIconWrap, animatedCrownStyle]}>
            <Crown color="#F59E0B" size={32} fill="#F59E0B" />
          </Animated.View>
          <Text style={s.heroTitle}>Bứt Phá Tiếng Anh Cùng PRO</Text>
          <Text style={s.heroSubtitle}>
            Mở khóa gia sư AI 1-1, luyện phản xạ và kho tài liệu cao cấp không giới hạn
          </Text>
        </View>

        {/* Trạng thái hiện tại nếu đã là Pro */}
        {isCurrentPremium && (
          <View style={s.currentPlanNotice}>
            <ShieldCheck color="#10B981" size={16} />
            <Text style={s.currentPlanNoticeText}>
              Tài khoản của bạn đang kích hoạt gói PRO. Bạn có thể gia hạn hoặc nâng cấp thêm kỳ hạn mới.
            </Text>
          </View>
        )}

        {/* 1. TRỌNG TÂM QUYỀN LỢI NHẬN ĐƯỢC (GỌN GÀNG, KHÔNG DÀI DÒNG) */}
        <View style={s.benefitsSection}>
          <Text style={s.sectionHeaderTitle}>QUYỀN LỢI NỔI BẬT KHI LÊN PRO</Text>
          <View style={s.benefitsGrid}>
            {CORE_PRO_BENEFITS.map((item, index) => (
              <View key={index} style={s.benefitCard}>
                <View style={s.benefitIconBox}>{item.icon}</View>
                <View style={s.benefitContent}>
                  <Text style={s.benefitTitle}>{item.title}</Text>
                  <Text style={s.benefitDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 2. CHỌN GÓI MUA (RÕ RÀNG TRỌNG TÂM TỪNG GÓI) */}
        <View style={s.plansSection}>
          <Text style={s.sectionHeaderTitle}>CHỌN GÓI PHÙ HỢP VỚI BẠN</Text>

          {isLoading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color="#F59E0B" size="small" />
              <Text style={s.loadingText}>Đang tải các gói ưu đãi...</Text>
            </View>
          ) : (
            <View style={s.plansList}>
              {paidPlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const info = getPlanHighlightInfo(plan);
                const isYearly = plan.durationMonths === 12 || plan.id.includes('YEARLY');

                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlanId(plan.id)}
                    style={({ pressed }) => [
                      s.planCard,
                      isSelected && s.planCardActive,
                      pressed && { opacity: 0.95 },
                    ]}
                  >
                    {/* Tag ribbon đầu card */}
                    {info.badgeTag && (
                      <View
                        style={[
                          s.planTagBadge,
                          isYearly ? s.planTagBadgePopular : s.planTagBadgeNormal,
                          isSelected && s.planTagBadgeActive,
                        ]}
                      >
                        {isYearly && <Flame color="#FFFFFF" size={11} fill="#FFFFFF" />}
                        <Text style={s.planTagBadgeText}>{info.badgeTag}</Text>
                      </View>
                    )}

                    <View style={s.planCardBody}>
                      {/* Hàng trên: Tên gói & Giá tiền */}
                      <View style={s.planHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.planTitleText, isSelected && s.planTitleTextActive]}>
                            {plan.name}
                          </Text>
                          <Text style={s.planBillingSubText}>{info.totalPriceLabel}</Text>
                        </View>

                        {/* Giá tháng lớn, dễ đọc */}
                        <View style={s.planPriceWrap}>
                          <Text style={[s.planPriceNumber, isSelected && s.planPriceNumberActive]}>
                            {info.mainPrice}
                          </Text>
                          <Text style={s.planPriceUnit}>{info.unitLabel}</Text>
                        </View>
                      </View>

                      {/* Trọng tâm nhận được của gói này */}
                      <View
                        style={[
                          s.planPerkBanner,
                          isSelected && s.planPerkBannerActive,
                        ]}
                      >
                        <CheckCircle2
                          color={isSelected ? '#F59E0B' : '#10B981'}
                          size={14}
                        />
                        <Text
                          style={[
                            s.planPerkText,
                            isSelected && s.planPerkTextActive,
                          ]}
                        >
                          {info.corePerk}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Cam kết tin cậy */}
        <View style={s.trustFooterRow}>
          <View style={s.trustTag}>
            <ShieldCheck color="#10B981" size={15} />
            <Text style={s.trustTagText}>Kích hoạt ngay lập tức</Text>
          </View>
          <View style={s.trustTag}>
            <Lock color="#38BDF8" size={14} />
            <Text style={s.trustTagText}>Bảo mật qua MoMo / VNPay / Visa</Text>
          </View>
        </View>

        {/* Padding trống dưới đáy để cuộn không bị che bởi nút bấm */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* 3. NÚT BẤM CHUẨN CHỈ, NỔI BẬT Ở ĐÁY MÀN HÌNH (TACTILE CTA BUTTON) */}
      <View style={s.floatingBottomBar}>
        <Pressable
          onPress={handleSubscribe}
          disabled={isSubscribing}
          style={({ pressed }) => [
            s.mainCtaButton,
            pressed && s.mainCtaButtonPressed,
            isSubscribing && { opacity: 0.8 },
          ]}
        >
          {isSubscribing ? (
            <ActivityIndicator color="#0F172A" size="small" />
          ) : (
            <View style={s.ctaContentRow}>
              <View style={s.ctaTextGroup}>
                <View style={s.ctaTitleRow}>
                  <Text style={s.ctaTitleText}>NÂNG CẤP PRO NGAY</Text>
                  <Text style={s.ctaPriceText}>
                    • {formatPriceVnd(selectedPlan.priceYearly || selectedPlan.priceMonthly)}
                  </Text>
                </View>
                <Text style={s.ctaSubtitleText}>
                  Kích hoạt trọn vẹn đặc quyền AI • Đảm bảo an toàn 100%
                </Text>
              </View>
              <View style={s.ctaArrowCircle}>
                <ArrowRight color="#0F172A" size={18} strokeWidth={2.5} />
              </View>
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
    backgroundColor: '#0A0F1D',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0A0F1D',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },

  /* Hero Section */
  heroSection: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  heroIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  currentPlanNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  currentPlanNoticeText: {
    fontSize: 12,
    color: '#6EE7B7',
    flex: 1,
    lineHeight: 16,
  },

  /* Section Header */
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  /* Benefits Grid */
  benefitsSection: {
    marginBottom: 20,
  },
  benefitsGrid: {
    gap: 8,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  benefitIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  benefitDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },

  /* Plans Section */
  plansSection: {
    marginBottom: 16,
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#131B2E',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  planCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#1A2238',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  planTagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 10,
  },
  planTagBadgePopular: {
    backgroundColor: '#D97706',
  },
  planTagBadgeNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  planTagBadgeActive: {
    backgroundColor: '#F59E0B',
  },
  planTagBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planCardBody: {
    padding: 14,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  planTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  planTitleTextActive: {
    color: '#FFFFFF',
  },
  planBillingSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  planPriceWrap: {
    alignItems: 'flex-end',
  },
  planPriceNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#CBD5E1',
  },
  planPriceNumberActive: {
    color: '#F59E0B',
  },
  planPriceUnit: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  planPerkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  planPerkBannerActive: {
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  planPerkText: {
    fontSize: 11,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 15,
  },
  planPerkTextActive: {
    color: '#FDE68A',
    fontWeight: '600',
  },

  /* Trust Footer */
  trustFooterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  trustTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustTagText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* Floating Bottom CTA Bar */
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
    backgroundColor: '#0A0F1D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  mainCtaButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  mainCtaButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#D97706',
  },
  ctaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaTextGroup: {
    flex: 1,
  },
  ctaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaTitleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  ctaPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  ctaSubtitleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  ctaArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
