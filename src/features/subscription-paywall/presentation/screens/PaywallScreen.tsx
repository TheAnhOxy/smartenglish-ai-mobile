import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
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
  Receipt,
  Tag,
  Gift,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';
import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import {
  fetchStudentPlansApi,
  subscribeToPlanApi,
  validateCouponApi,
  StudentSubscriptionPlan,
} from '@/src/features/subscription-paywall/data/subscriptionApi';
import { SepayVietQrPaymentModal } from '../components/SepayVietQrPaymentModal';
import { CancelPlanSheet } from '../components/CancelPlanSheet';
import { isLowerThanCurrent } from '../../application/planRank';
import { AppColors } from '@/src/core/theme/colors';
import { hasActivePremium } from '@/src/core/utils/plan';

export const PaywallScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { currentUser, updateCurrentUser } = useAuthStore();

  const [plans, setPlans] = useState<StudentSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('S-PLAN-YEARLY');
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelPlan, setShowCancelPlan] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSepayModalOpen, setIsSepayModalOpen] = useState(false);
  const [sepayOrder, setSepayOrder] = useState<any>(null);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);
  const [activeInvoiceOrderId, setActiveInvoiceOrderId] = useState<string | number | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    finalPrice: number;
    message: string;
    discountValue: number;
  } | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

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

  // Gói đang dùng hoặc thấp hơn gói đang dùng → không cho đăng ký (tránh hạ cấp từ gói VIP)
  const isPlanLocked = (planId: string) => isPlanCurrent(planId) || isLowerThanCurrent(planId, currentUser?.plan);

  const isPlanCurrent = (planId: string) => {
    if (!currentUser?.plan) return false;
    if (currentUser.plan === 'premium_monthly' && planId.includes('MONTHLY')) return true;
    if (currentUser.plan === 'premium_yearly' && planId.includes('YEARLY')) return true;
    if (currentUser.plan === 'lifetime' && planId.includes('LIFETIME')) return true;
    return false;
  };

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchStudentPlansApi();
      if (!data || data.length === 0) {
        setLoadError('Không tải được thông tin gói');
        return;
      }
      setPlans(data);
      const available = data.filter((p) => p.id !== 'S-PLAN-FREE' && !isPlanCurrent(p.id));
      if (available.length > 0) {
        const promoMonthly = available.find((p) => p.id === 'S-PLAN-MONTHLY' || p.priceMonthly === 20000);
        if (promoMonthly) {
          setSelectedPlanId(promoMonthly.id);
        } else {
          const popular = available.find((p) => p.isPopular);
          setSelectedPlanId(popular ? popular.id : available[0].id);
        }
      } else if (data.length > 0) {
        setSelectedPlanId(data[0].id);
      }
    } catch (e) {
      console.warn('Failed to load plans:', e);
      setLoadError('Không tải được thông tin gói');
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
      id: 'S-PLAN-MONTHLY',
      name: 'Học Viên Pro Tháng',
      badge: 'Ưu đãi 20k',
      priceMonthly: 20000,
      priceYearly: 0,
      durationMonths: 1,
      isPopular: false,
      isActive: true,
      quotas: { chat: 9999, speaking: 9999, writing: 9999, scan: 9999, maxClasses: 9999 },
      features: [],
    };

  const isCurrentPremium =
    hasActivePremium(currentUser);

  const formatPriceVnd = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const getPlanBasePrice = (plan: StudentSubscriptionPlan) => {
    return plan.priceYearly > 0 ? plan.priceYearly : plan.priceMonthly;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      setVoucherError('Vui lòng nhập mã ưu đãi');
      return;
    }
    try {
      setIsValidatingVoucher(true);
      setVoucherError(null);
      const basePrice = getPlanBasePrice(selectedPlan);
      const res = await validateCouponApi(voucherCodeInput, basePrice);
      if (res.valid) {
        setAppliedVoucher({
          code: res.code,
          discountAmount: res.discountAmount,
          finalPrice: res.finalPrice,
          message: res.message,
          discountValue: res.discountValue,
        });
        Alert.alert('Áp dụng mã thành công', res.message);
      } else {
        setVoucherError(res.message || 'Mã ưu đãi không hợp lệ');
        Alert.alert('Không hợp lệ', res.message || 'Mã ưu đãi không hợp lệ hoặc đã hết hạn');
      }
    } catch (e: any) {
      setVoucherError('Lỗi kiểm tra mã ưu đãi');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setVoucherError(null);
  };

  // Tự động tính lại voucher khi người dùng đổi gói
  useEffect(() => {
    if (appliedVoucher) {
      const basePrice = getPlanBasePrice(selectedPlan);
      validateCouponApi(appliedVoucher.code, basePrice).then((res) => {
        if (res.valid) {
          setAppliedVoucher({
            code: res.code,
            discountAmount: res.discountAmount,
            finalPrice: res.finalPrice,
            message: res.message,
            discountValue: res.discountValue,
          });
        }
      });
    }
  }, [selectedPlanId]);

  const handleSubscribe = async () => {
    if (isPlanCurrent(selectedPlan.id)) {
      Alert.alert('Thông báo', 'Bạn đang sử dụng gói này rồi. Khi gói kết thúc, bạn có thể gia hạn tiếp.');
      return;
    }
    try {
      setIsSubscribing(true);
      const numericPlanId = selectedPlan.id.includes('LIFETIME')
        ? 4
        : selectedPlan.id.includes('YEARLY')
        ? 3
        : 2;
      const cycle = selectedPlan.durationMonths >= 12 ? 'YEARLY' : 'MONTHLY';
      
      const rawUid = currentUser?.id || getCurrentUserId();
      const parsedUid = Number(rawUid);
      const safeUserId = !isNaN(parsedUid) && parsedUid > 0 ? parsedUid : 3;

      const customerName = currentUser?.display_name || 'Học viên SmartEnglish';
      const customerEmail = currentUser?.email && currentUser.email.includes('@')
        ? currentUser.email
        : 'student.theanh@gmail.com';

      const res = await apiClient.post<any>(
        '/api/v1/payment/subscriptions/subscribe',
        {
          planId: numericPlanId,
          planCode: selectedPlan.id,
          paymentMethod: 'SEPAY',
          billingCycle: cycle,
          customerName: customerName,
          customerEmail: customerEmail,
          voucherCode: appliedVoucher?.code || undefined,
        }
      );

      const data = res.data?.data || res.data;
      const latestOrder = data?.latestOrder || {};

      setSepayOrder({
        id: latestOrder.id,
        orderCode: latestOrder.orderCode || `SEAI${Date.now() % 100000}`,
        amount:
          latestOrder.amount ||
          (appliedVoucher
            ? appliedVoucher.finalPrice
            : selectedPlan.priceYearly > 0
            ? selectedPlan.priceYearly
            : selectedPlan.priceMonthly),
        planName: selectedPlan.name,
        qrUrl: latestOrder.qrUrl,
        expiresAt: latestOrder.expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        bankName: 'MB Bank (Ngân hàng TMCP Quân Đội)',
        bankCode: 'MB',
        accountNumber: '0963684871',
        accountName: 'NGUYEN TUAN ANH',
      });
      setIsSepayModalOpen(true);
    } catch (err: any) {
      console.error('Lỗi kết nối tạo đơn SePay:', err?.response?.data || err?.message || err);
      Alert.alert(
        'Lỗi tạo đơn thanh toán',
        err?.response?.data?.message || 'Không thể khởi tạo đơn hàng thanh toán trên máy chủ. Vui lòng kiểm tra lại kết nối mạng và thử lại.'
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  const handlePaymentSuccess = (paidOrder: any) => {
    const newPlan =
      selectedPlan.durationMonths >= 12
        ? 'premium_yearly'
        : selectedPlan.durationMonths === 999
        ? 'lifetime'
        : 'premium_monthly';

    updateCurrentUser({ plan: newPlan as any });
  };

  // 4 Trọng tâm quyền lợi mà người dùng nhận được khi nâng cấp PRO
  const CORE_PRO_BENEFITS = [
    {
      icon: <Bot color="#D97706" size={20} strokeWidth={2.2} />,
      bg: '#FEF3C7',
      borderColor: '#FDE68A',
      title: 'AI Gia sư 1-1 Không Giới Hạn',
      desc: 'Luyện đàm thoại phản xạ tự nhiên & sửa ngữ pháp tức thì 24/7.',
    },
    {
      icon: <Mic color="#0284C7" size={20} strokeWidth={2.2} />,
      bg: '#E0F2FE',
      borderColor: '#BAE6FD',
      title: 'Chấm Điểm & Sửa Phát Âm Chi Tiết',
      desc: 'Nhận diện lỗi sai từng âm vị, nối âm & ngữ điệu chuẩn bản xứ.',
    },
    {
      icon: <FileText color="#16A34A" size={20} strokeWidth={2.2} />,
      bg: '#DCFCE7',
      borderColor: '#BBF7D0',
      title: 'Chấm Viết Luận & Đề Thi TOEIC VIP',
      desc: 'Phân tích bẫy đề thi thực tế, viết lại bài mẫu Band 8.0+ không giới hạn.',
    },
    {
      icon: <Zap color="#9333EA" size={20} strokeWidth={2.2} />,
      bg: '#F3E8FF',
      borderColor: '#E9D5FF',
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
        icon: <Crown color="#D97706" size={22} strokeWidth={2.3} />,
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        badgeTag: 'Bán chạy nhất',
        subtitle: 'Tiết kiệm nhất cho năm học',
        mainPrice: `${formatPriceVnd(monthlyEquiv)}`,
        unitLabel: '/tháng',
        originalPrice: '2.388.000 đ',
        discountPercent: '38%',
        totalPriceLabel: `Thanh toán ${formatPriceVnd(price)}/năm`,
        corePerk: 'Trọn vẹn 12 tháng học tập không giới hạn + Cố vấn AI 1-1 chuyên sâu',
        features: [
          'Toàn bộ tính năng Pro trọn vẹn 12 tháng',
          'Kho đề thi TOEIC & Mock Test cập nhật liên tục',
          'Chấm phát âm & sửa lỗi chi tiết từng âm vị',
          '100% Không có quảng cáo làm phiền',
        ],
      };
    }

    if (isLifetime) {
      const price = plan.priceYearly || 3990000;
      return {
        icon: <Sparkles color="#7C3AED" size={22} strokeWidth={2.3} />,
        iconBg: '#F3E8FF',
        iconBorder: '#E9D5FF',
        badgeTag: 'Đầu tư 1 lần',
        subtitle: 'Sở hữu trọn đời vĩnh viễn',
        mainPrice: `${formatPriceVnd(price)}`,
        unitLabel: '/trọn đời',
        originalPrice: null,
        discountPercent: null,
        totalPriceLabel: 'Thanh toán 1 lần duy nhất, không phát sinh chi phí',
        corePerk: 'Sở hữu trọn đời, tự động cập nhật mọi khóa học và model AI mới sau này',
        features: [
          'Sở hữu vĩnh viễn không giới hạn thời gian',
          'Tự động cập nhật mọi model AI và tài liệu mới',
          'Gia sư AI 1-1 đồng hành suốt đời',
          '100% Không có quảng cáo làm phiền',
        ],
      };
    }

    const price = plan.priceMonthly || 20000;
    return {
      icon: <Zap color="#0284C7" size={22} strokeWidth={2.3} />,
      iconBg: '#E0F2FE',
      iconBorder: '#BAE6FD',
      badgeTag: 'Ưu đãi 20k',
      subtitle: 'Bán chạy nhất • Ưu đãi trải nghiệm',
      mainPrice: `${formatPriceVnd(price)}`,
      unitLabel: '/tháng',
      originalPrice: '199.000 đ',
      discountPercent: '90%',
      totalPriceLabel: 'Ưu đãi trải nghiệm học tập 1 tháng chỉ 20.000 đ',
      corePerk: 'Phù hợp ôn luyện cấp tốc & trải nghiệm trọn vẹn toàn bộ sức mạnh Pro',
      features: [
        'AI Gia sư 1-1 Không Giới Hạn (Chat & Voice)',
        'Chấm Điểm & Sửa Phát Âm Chi Tiết Từng Âm Vị',
        'Chấm Viết Luận & Đề Thi TOEIC VIP Không Giới Hạn',
        '100% Không có quảng cáo làm phiền',
      ],
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(student)/profile/invoices' as any)}
            style={s.invoiceHeaderBtn}
          >
            <Receipt color="#0284C7" size={14} />
            <Text style={s.invoiceHeaderBtnText}>Hóa đơn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X color="#475569" size={18} />
          </TouchableOpacity>
        </View>
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
            <Text style={s.currentPlanNoticeText}>Bạn đang dùng gói PRO</Text>
            <Pressable onPress={() => setShowCancelPlan(true)} hitSlop={8}>
              <Text style={{ color: AppColors.error, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }}>
                Huỷ gói
              </Text>
            </Pressable>
          </View>
        )}

        {/* 1. TRỌNG TÂM QUYỀN LỢI NHẬN ĐƯỢC (GỌN GÀNG, KHÔNG DÀI DÒNG) */}
        <View style={s.benefitsSection}>
          <Text style={s.sectionHeaderTitle}>QUYỀN LỢI NỔI BẬT KHI LÊN PRO</Text>
          <View style={s.benefitsGrid}>
            {CORE_PRO_BENEFITS.map((item, index) => (
              <View key={index} style={s.benefitCard}>
                <View style={[s.benefitIconBox, { backgroundColor: item.bg, borderColor: item.borderColor, borderWidth: 1.5 }]}>
                  {item.icon}
                </View>
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
          ) : loadError && paidPlans.length === 0 ? (
            <View style={[s.loadingBox, { paddingVertical: 28 }]}>
              <Text style={[s.loadingText, { color: '#DC2626', fontWeight: '700', marginBottom: 12 }]}>
                Không tải được thông tin gói
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={loadPlans}
                style={{ backgroundColor: '#0284C7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.plansList}>
              {paidPlans.map((plan) => {
                const isCurrentPlan = isPlanCurrent(plan.id);
                const isLocked = isPlanLocked(plan.id);
                const isSelected = !isLocked && selectedPlanId === plan.id;
                const info = getPlanHighlightInfo(plan);
                const isPromo = plan.id.includes('MONTHLY') || plan.priceMonthly === 20000;
                const topBadgeText = isCurrentPlan ? 'Đang hoạt động' : info.badgeTag;

                return (
                  <View key={plan.id} style={s.planCardWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.88}
                      disabled={isLocked}
                      onPress={() => {
                        if (!isLocked) {
                          setSelectedPlanId(plan.id);
                        }
                      }}
                      style={[
                        s.planCard,
                        isSelected && s.planCardActive,
                        isLocked && s.planCardCurrent,
                      ]}
                    >
                      {/* Header Row: Icon box (như card quyền lợi) + Tên gói & Subtitle + Radio circle / Active badge */}
                      <View style={s.planCardHeaderRow}>
                        <View
                          style={[
                            s.planIconBox,
                            {
                              backgroundColor: isCurrentPlan ? '#E2E8F0' : info.iconBg,
                              borderColor: isCurrentPlan ? '#CBD5E1' : info.iconBorder,
                              borderWidth: 1.5,
                            },
                          ]}
                        >
                          {info.icon}
                        </View>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <View
                              style={[
                                s.topCenterPill,
                                isCurrentPlan
                                  ? s.topCenterPillCurrent
                                  : isPromo
                                  ? s.topCenterPillPromo
                                  : isSelected
                                  ? s.topCenterPillActive
                                  : s.topCenterPillDefault,
                              ]}
                            >
                              <Text style={s.topCenterPillText}>{topBadgeText}</Text>
                            </View>
                          </View>
                          <Text style={[s.planTitleText, isSelected && s.planTitleTextActive]}>
                            {plan.name}
                          </Text>
                          <Text style={s.planSubtitleText}>{info.subtitle}</Text>
                        </View>

                        {/* Selection checkmark / Current plan badge */}
                        <View style={{ justifyContent: 'center' }}>
                          {isCurrentPlan ? (
                            <View style={s.currentPlanBadge}>
                              <Check color="#059669" size={12} strokeWidth={3} />
                              <Text style={s.currentPlanBadgeText}>Đang dùng</Text>
                            </View>
                          ) : isSelected ? (
                            <View style={s.selectedCheckCircle}>
                              <Check color="#FFFFFF" size={13} strokeWidth={3} />
                            </View>
                          ) : (
                            <View style={s.unselectedCircle} />
                          )}
                        </View>
                      </View>

                      {/* Giá tiền */}
                      <View style={s.planPriceSection}>
                        <View style={s.priceMainRow}>
                          <Text style={s.planPriceNumber}>{info.mainPrice}</Text>
                          <Text style={s.planPriceUnit}>{info.unitLabel}</Text>
                          {info.discountPercent && (
                            <View style={s.discountBadge}>
                              <Text style={s.discountBadgeText}>GIẢM {info.discountPercent}</Text>
                            </View>
                          )}
                        </View>

                        {info.originalPrice && (
                          <View style={s.discountRow}>
                            <Text style={s.originalPriceText}>Giá gốc: {info.originalPrice}</Text>
                            {info.totalPriceLabel && (
                              <Text style={s.totalBillingText}> • {info.totalPriceLabel}</Text>
                            )}
                          </View>
                        )}
                      </View>

                      {/* Thông báo nếu là gói đang dùng */}
                      {isCurrentPlan ? (
                        <View style={s.currentPlanNoticeBox}>
                          <ShieldCheck color="#059669" size={14} />
                          <Text style={s.currentPlanNoticeBoxText}>
                            Gói cước đang có hiệu lực trên tài khoản. Bạn có thể gia hạn khi gói kết thúc.
                          </Text>
                        </View>
                      ) : (
                        /* Danh sách tính năng bao gồm - Soft nested card, KHÔNG có đường gạch ngang cắt qua */
                        <View style={[s.featuresBox, isSelected && s.featuresBoxActive]}>
                          <Text style={s.featuresBoxTitle}>ĐẶC QUYỀN NỔI BẬT:</Text>
                          <View style={s.featuresList}>
                            {info.features.map((feature, fIdx) => (
                              <View key={fIdx} style={s.featureRow}>
                                <View style={[s.featureCheckIcon, isSelected && s.featureCheckIconActive]}>
                                  <Check
                                    color={isSelected ? '#0284C7' : '#10B981'}
                                    size={12}
                                    strokeWidth={2.8}
                                  />
                                </View>
                                <Text style={[s.featureText, isSelected && s.featureTextActive]}>{feature}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        
        {/* 2.5. KHỐI NHẬP MÃ ƯU ĐÃI / VOUCHER */}
        <View style={s.voucherSection}>
          <View style={s.voucherHeaderRow}>
            <View style={s.voucherIconPill}>
              <Gift color="#0284C7" size={16} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.voucherHeaderTitle}>Mã ưu đãi / Voucher</Text>
              <Text style={s.voucherHeaderSubtitle}>
                Nhập mã giới thiệu giáo viên hoặc voucher để nhận ưu đãi
              </Text>
            </View>
          </View>

          {appliedVoucher ? (
            <View style={s.appliedVoucherBox}>
              <View style={s.appliedVoucherLeft}>
                <CheckCircle2 color="#059669" size={18} strokeWidth={2.3} />
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.appliedVoucherCode}>{appliedVoucher.code}</Text>
                    <View style={s.appliedDiscountBadge}>
                      <Text style={s.appliedDiscountBadgeText}>
                        GIẢM {appliedVoucher.discountValue}%
                      </Text>
                    </View>
                  </View>
                  <Text style={s.appliedVoucherDiscount}>
                    Tiết kiệm {formatPriceVnd(appliedVoucher.discountAmount)} • Còn {formatPriceVnd(appliedVoucher.finalPrice)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleRemoveVoucher}
                style={s.removeVoucherBtn}
                activeOpacity={0.7}
              >
                <X color="#64748B" size={14} />
                <Text style={s.removeVoucherBtnText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.voucherInputGroup}>
              <View style={s.voucherInputWrapper}>
                <Tag color="#94A3B8" size={16} />
                <TextInput
                  value={voucherCodeInput}
                  onChangeText={(txt) => {
                    setVoucherCodeInput(txt);
                    setVoucherError(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="Nhập mã (VD: VIP99, TEST90...)"
                  placeholderTextColor="#94A3B8"
                  style={s.voucherTextInput}
                />
              </View>
              <TouchableOpacity
                onPress={handleApplyVoucher}
                disabled={isValidatingVoucher || !voucherCodeInput.trim()}
                style={[
                  s.applyVoucherBtn,
                  (!voucherCodeInput.trim() || isValidatingVoucher) && s.applyVoucherBtnDisabled,
                ]}
                activeOpacity={0.8}
              >
                {isValidatingVoucher ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.applyVoucherBtnText}>Áp dụng</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {voucherError && (
            <Text style={s.voucherErrorText}>{voucherError}</Text>
          )}
        </View>

        {/* 3. BẢNG SO SÁNH HẠN MỨC & QUYỀN LỢI CHI TIẾT */}
        <View style={s.comparisonSection}>
          <Text style={s.sectionHeaderTitle}>BẢNG SO SÁNH HẠN MỨC & QUYỀN LỢI</Text>
          <Text style={s.comparisonSubtitle}>
            So sánh chi tiết hạn mức Quota giữa gói Miễn Phí và các gói Nâng Cấp Pro
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tableScroll}>
            <View style={s.tableContainer}>
              {/* Table Header */}
              <View style={s.tableHeaderRow}>
                <Text style={[s.tableTh, { width: 140 }]}>Tính năng / Quyền lợi</Text>
                <Text style={[s.tableTh, { width: 100, textAlign: 'center' }]}>Gói Miễn Phí</Text>
                <Text style={[s.tableTh, { width: 110, textAlign: 'center', color: '#DC2626' }]}>Pro Tháng (20k)</Text>
                <Text style={[s.tableTh, { width: 110, textAlign: 'center', color: '#D97706' }]}>Pro Năm (1.490k)</Text>
                <Text style={[s.tableTh, { width: 115, textAlign: 'center', color: '#7C3AED' }]}>Trọn Đời (Lifetime)</Text>
              </View>

              {/* Rows */}
              {[
                { name: 'AI Chatbot hội thoại thông minh', free: '15 tin nhắn / ngày', pro: '∞ Không giới hạn' },
                { name: 'Luyện nói & Chấm phát âm IPA', free: '10 câu / ngày', pro: '∞ Không giới hạn' },
                { name: 'Chấm viết luận Writing', free: '2 bài / tuần', pro: '∞ Không giới hạn' },
                { name: 'Quét ảnh giải bài tập AI', free: '5 ảnh / ngày', pro: '∞ Không giới hạn' },
                { name: 'Tham gia lớp học của giáo viên', free: 'Tối đa 3 lớp', pro: '∞ Không giới hạn' },
                { name: 'Kho đề thi TOEIC & Mock Test', free: 'Đề thi cơ bản', pro: '100% Đầy đủ đề mới' },
                { name: 'Trải nghiệm không quảng cáo', free: '—', pro: '✓ Có' },
              ].map((row, rIdx) => (
                <View key={rIdx} style={[s.tableRow, rIdx % 2 === 1 && s.tableRowAlt]}>
                  <Text style={[s.tableTdName, { width: 140 }]}>{row.name}</Text>
                  <Text style={[s.tableTd, { width: 100, color: '#64748B' }]}>{row.free}</Text>
                  <Text style={[s.tableTd, { width: 110, color: '#059669', fontWeight: '700' }]}>{row.pro}</Text>
                  <Text style={[s.tableTd, { width: 110, color: '#059669', fontWeight: '700' }]}>{row.pro}</Text>
                  <Text style={[s.tableTd, { width: 115, color: '#059669', fontWeight: '700' }]}>{row.pro}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Cam kết tin cậy */}
        <View style={s.trustFooterRow}>
          <View style={s.trustTag}>
            <ShieldCheck color="#10B981" size={15} />
            <Text style={s.trustTagText}>Kích hoạt ngay lập tức</Text>
          </View>
          <View style={s.trustTag}>
            <Lock color="#0284C7" size={14} />
            <Text style={s.trustTagText}>Bảo mật qua VietQR Napas 24/7</Text>
          </View>
        </View>

        {/* Padding trống dưới đáy để cuộn không bị che bởi nút bấm */}
        <View style={{ height: 110 }} />
      </ScrollView>

      <CancelPlanSheet
        visible={showCancelPlan}
        onClose={() => setShowCancelPlan(false)}
        onCancelled={() => {
          setShowCancelPlan(false);
          Alert.alert('Đã huỷ gói', 'Email xác nhận hoàn tiền đã được gửi tới bạn.');
          loadPlans();
        }}
      />

      {/* 3. NÚT BẤM CHUẨN CHỈ, NỔI BẬT Ở ĐÁY MÀN HÌNH (TACTILE CTA BUTTON) */}
      <View style={s.floatingBottomBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubscribe}
          disabled={isSubscribing || isPlanLocked(selectedPlan.id)}
          style={[
            s.mainCtaButton,
            isPlanLocked(selectedPlan.id) && s.mainCtaButtonDisabled,
          ]}
        >
          {isSubscribing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : isPlanLocked(selectedPlan.id) ? (
            <View style={s.ctaContentRow}>
              <View style={s.ctaTextGroup}>
                <View style={s.ctaTitleRow}>
                  <Text style={s.ctaTitleText}>
                    {isPlanCurrent(selectedPlan.id) ? 'GÓI ĐANG SỬ DỤNG' : 'THẤP HƠN GÓI HIỆN TẠI'}
                  </Text>
                </View>
                <Text style={s.ctaSubtitleText}>Chỉ có thể nâng cấp lên gói cao hơn</Text>
              </View>
              <View style={[s.ctaArrowCircle, { backgroundColor: '#E2E8F0' }]}>
                <Check color="#059669" size={18} strokeWidth={2.5} />
              </View>
            </View>
          ) : (
            <View style={s.ctaContentRow}>
              <View style={s.ctaTextGroup}>
                <View style={s.ctaTitleRow}>
                  <Text style={s.ctaTitleText}>NÂNG CẤP PRO NGAY</Text>
                  {appliedVoucher ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={[s.ctaPriceText, { textDecorationLine: 'line-through', opacity: 0.6, fontSize: 11 }]}>
                        {formatPriceVnd(selectedPlan.priceYearly || selectedPlan.priceMonthly)}
                      </Text>
                      <Text style={[s.ctaPriceText, { color: '#FDE047', fontWeight: '900' }]}>
                        • {formatPriceVnd(appliedVoucher.finalPrice)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={s.ctaPriceText}>
                      • {formatPriceVnd(selectedPlan.priceYearly || selectedPlan.priceMonthly)}
                    </Text>
                  )}
                </View>
                <Text style={s.ctaSubtitleText}>
                  {appliedVoucher
                    ? `Tiết kiệm ${formatPriceVnd(appliedVoucher.discountAmount)} • Quét VietQR nhận gói ngay`
                    : 'Kích hoạt trọn vẹn đặc quyền AI • Đảm bảo an toàn 100%'}
                </Text>
              </View>
              <View style={s.ctaArrowCircle}>
                <ArrowRight color="#0284C7" size={18} strokeWidth={2.5} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Thanh toán VietQR Napas 24/7 (SePay) */}
      <SepayVietQrPaymentModal
        visible={isSepayModalOpen}
        onClose={() => setIsSepayModalOpen(false)}
        order={sepayOrder}
        onSuccess={handlePaymentSuccess}
        onOpenInvoice={(ord) => {
          setIsSepayModalOpen(false);
          router.push({
            pathname: '/(student)/profile/invoices' as any,
            params: { initialOrderId: String(ord?.id || ord?.orderCode || '') },
          });
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Solid slate-100 background so white cards have high contrast
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  invoiceHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  invoiceHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  /* Hero Section */
  heroSection: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 16,
    fontWeight: '500',
  },

  currentPlanNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    marginBottom: 18,
  },
  currentPlanNoticeText: {
    fontSize: 12.5,
    color: '#065F46',
    flex: 1,
    lineHeight: 18,
    fontWeight: '700',
  },

  /* Section Header */
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },

  /* Benefits Grid */
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsGrid: {
    gap: 10,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  benefitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  benefitDesc: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2.5,
    lineHeight: 16,
    fontWeight: '500',
  },

  /* Plans Section */
  plansSection: {
    marginBottom: 20,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  plansList: {
    gap: 12,
  },
  planCardWrapper: {
    marginBottom: 14,
  },
  topCenterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  topCenterPillCurrent: {
    backgroundColor: '#0284C7',
  },
  topCenterPillPromo: {
    backgroundColor: '#E11D48',
  },
  topCenterPillActive: {
    backgroundColor: '#0284C7',
  },
  topCenterPillDefault: {
    backgroundColor: '#475569',
  },
  topCenterPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD5E1', // clear high-contrast border
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  planCardActive: {
    borderColor: '#0284C7', // thick brand blue border
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  planCardCurrent: {
    backgroundColor: '#F8FAFC',
    borderColor: '#94A3B8',
    borderWidth: 1.5,
    opacity: 0.85,
    elevation: 1,
  },
  planCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  planIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitleText: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  planTitleTextActive: {
    color: '#0369A1',
  },
  selectedCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  currentPlanBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  planSubtitleText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  planPriceSection: {
    marginTop: 10,
    marginBottom: 6,
  },
  priceMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  planPriceNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  planPriceUnit: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  originalPriceText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  totalBillingText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#DC2626',
  },
  currentPlanNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  currentPlanNoticeBoxText: {
    fontSize: 11.5,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  featuresBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  featuresBoxActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BAE6FD',
  },
  featuresBoxTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  featuresList: {
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheckIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCheckIconActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  featureText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
  },
  featureTextActive: {
    color: '#0F172A',
    fontWeight: '600',
  },

  /* Trust Footer */
  trustFooterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  trustTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 1,
  },
  trustTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  /* Floating Bottom CTA Bar */
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  mainCtaButton: {
    backgroundColor: '#0284C7',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    elevation: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainCtaButtonDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  mainCtaButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#0369A1',
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
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ctaPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#BAE6FD',
  },
  ctaSubtitleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E0F2FE',
    marginTop: 2,
  },
    comparisonSection: {
    marginBottom: 20,
  },
  comparisonSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    marginTop: -8,
  },
  tableScroll: {
    marginHorizontal: -4,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableTh: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tableTdName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    paddingRight: 8,
  },
  tableTd: {
    fontSize: 11,
    textAlign: 'center',
    color: '#475569',
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
  voucherSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  voucherIconPill: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  voucherHeaderSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  voucherInputGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  voucherInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 44,
  },
  voucherTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  applyVoucherBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyVoucherBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  applyVoucherBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  appliedVoucherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 12,
  },
  appliedVoucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appliedVoucherCode: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  appliedDiscountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  appliedDiscountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  appliedVoucherDiscount: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    fontWeight: '500',
  },
  removeVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  removeVoucherBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  voucherErrorText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 4,
  },
});
