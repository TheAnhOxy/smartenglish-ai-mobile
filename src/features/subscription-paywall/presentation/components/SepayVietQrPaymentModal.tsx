import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  CheckCircle2,
  Copy,
  Check,
  X,
  Clock,
  ShieldCheck,
  Building2,
  Sparkles,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react-native';
import { apiClient } from '@/src/core/api/client';
import { useQueryClient } from '@tanstack/react-query';

export interface SepayOrderData {
  id?: number | string;
  orderCode?: string;
  amount?: number;
  amountFinal?: number;
  planName?: string;
  qrUrl?: string;
  expiresAt?: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

interface SepayVietQrPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  order: SepayOrderData | null;
  onSuccess: (order: SepayOrderData) => void;
  onOpenInvoice?: (order: SepayOrderData) => void;
}

export const SepayVietQrPaymentModal: React.FC<SepayVietQrPaymentModalProps> = ({
  visible,
  onClose,
  order,
  onSuccess,
  onOpenInvoice,
}) => {
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const calculateRemainingSeconds = () => {
    if (order?.expiresAt) {
      const diff = Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    return 10 * 60; // Chuẩn hóa 10 phút
  };

  const [timeLeft, setTimeLeft] = useState(calculateRemainingSeconds);

  useEffect(() => {
    if (visible) {
      setTimeLeft(calculateRemainingSeconds());
    }
  }, [visible, order]);

  const pollIntervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const orderCode = order?.orderCode || '';
  const amount = Number(order?.amount || order?.amountFinal || 20000);
  const planName = order?.planName || 'Gói Học Viên Premium';
  const bankName = order?.bankName || 'MB Bank (Ngân hàng TMCP Quân Đội)';
  const bankCode = order?.bankCode || 'MB';
  const accountNumber = order?.accountNumber || '0963684871';
  const accountName = order?.accountName || 'NGUYEN TUAN ANH';

  const qrUrl =
    order?.qrUrl ||
    `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${encodeURIComponent(
      orderCode
    )}&template=compact`;

  useEffect(() => {
    if (!visible || !orderCode || isSuccess) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setIsSuccess(false);

    // Polling API kiểm tra trạng thái đơn hàng
    const checkStatus = async () => {
      try {
        setIsChecking(true);
        const res = await apiClient.get<any>(`/api/v1/payment/orders/${orderCode}/status`);
        const data = res.data?.data !== undefined ? res.data.data : res.data;
        if (data?.isSuccess || data?.status === 'SUCCESS' || data?.status === 'completed') {
          handleSuccess();
        }
      } catch (err) {
        // Tiếp tục kiểm tra âm thầm
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 2500);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, orderCode, isSuccess]);

  const handleSuccess = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsSuccess(true);
    try {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
    } catch {}
    if (order) {
      onSuccess(order);
    }
  };

  const copyToClipboard = async (text: string, fieldKey: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      Alert.alert('Sao chép', `Nội dung: ${text}`);
    }
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBadge}>
                <Building2 color="#0284C7" size={18} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Thanh Toán VietQR Napas 24/7</Text>
                <Text style={styles.headerSubtitle}>Tự động kích hoạt qua SePay Gateway</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color="#64748B" size={20} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {isSuccess ? (
              /* Màn hình thông báo Thanh toán thành công */
              <View style={styles.successContainer}>
                <View style={styles.successIconBox}>
                  <CheckCircle2 color="#10B981" size={54} />
                </View>
                <Text style={styles.successTitle}>Thanh Toán Thành Công! 🎉</Text>
                <Text style={styles.successSubtitle}>
                  Đã nhận tiền chuyển khoản cho gói <Text style={{ fontWeight: 'bold' }}>{planName}</Text>. Toàn bộ tính năng AI và đặc quyền PRO của bạn đã được kích hoạt ngay lập tức!
                </Text>

                <View style={styles.successInvoiceCard}>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Mã đơn hàng:</Text>
                    <Text style={styles.invoiceValMono}>{orderCode}</Text>
                  </View>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Số tiền:</Text>
                    <Text style={styles.invoiceValHighlight}>
                      {amount.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Trạng thái:</Text>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>✓ ĐÃ KÍCH HOẠT PRO</Text>
                    </View>
                  </View>
                </View>

                <View style={{ gap: 10, width: '100%', marginTop: 20 }}>
                  {onOpenInvoice && (
                    <Pressable
                      onPress={() => {
                        onClose();
                        onOpenInvoice(order || {});
                      }}
                      style={styles.invoiceBtn}
                    >
                      <FileCheck2 color="#0284C7" size={18} />
                      <Text style={styles.invoiceBtnText}>Xem & Lưu Hóa Đơn Điện Tử</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={onClose} style={styles.startBtn}>
                    <Sparkles color="#FFFFFF" size={18} />
                    <Text style={styles.startBtnText}>Bắt đầu học ngay</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Màn hình Quét mã QR thanh toán */
              <View style={styles.paymentContainer}>
                {/* Timer Bar */}
                <View style={styles.timerBar}>
                  <View style={styles.timerLeft}>
                    <Clock color={timeLeft === 0 ? '#E11D48' : '#D97706'} size={15} />
                    <Text style={[styles.timerText, timeLeft === 0 && { color: '#E11D48', fontWeight: 'bold' }]}>
                      {timeLeft === 0 ? 'Đã hết hạn (15 phút)' : `Hạn thanh toán: ${formatTimer(timeLeft)}`}
                    </Text>
                  </View>
                  {timeLeft > 0 ? (
                    <View style={styles.checkingBadge}>
                      <ActivityIndicator size="small" color="#0284C7" />
                      <Text style={styles.checkingText}>Đang chờ chuyển khoản</Text>
                    </View>
                  ) : (
                    <View style={[styles.checkingBadge, { backgroundColor: '#FEE2E2', borderColor: '#FECDD3' }]}>
                      <Text style={[styles.checkingText, { color: '#E11D48', fontWeight: 'bold' }]}>Hết hiệu lực</Text>
                    </View>
                  )}
                </View>

                {/* Plan Info Badge */}
                <View style={styles.planInfoBar}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitleText}>{planName}</Text>
                    <Text style={styles.planCodeText}>Mã giao dịch: {orderCode}</Text>
                  </View>
                  <Text style={styles.planAmountText}>
                    {amount.toLocaleString('vi-VN')} đ
                  </Text>
                </View>

                {/* QR Code Container */}
                <View style={styles.qrWrapper}>
                  <Image
                    source={{ uri: qrUrl }}
                    style={[styles.qrImage, timeLeft === 0 && { opacity: 0.2 }]}
                    resizeMode="contain"
                  />
                  {timeLeft === 0 && (
                    <View style={styles.expiredOverlay}>
                      <AlertTriangle color="#E11D48" size={32} />
                      <Text style={styles.expiredTitle}>Mã QR đã hết hạn</Text>
                      <Text style={styles.expiredDesc}>
                        Vui lòng đóng và thực hiện lại giao dịch mới để nhận mã thanh toán mới.
                      </Text>
                    </View>
                  )}
                  <Text style={styles.qrHint}>
                    {timeLeft === 0
                      ? 'Giao dịch đã kết thúc thời gian hiệu lực.'
                      : 'Mở ứng dụng Ngân hàng bất kỳ hoặc Ví điện tử quét mã QR phía trên để chuyển khoản tự động'}
                  </Text>
                </View>

                {/* Bank Details Table */}
                <View style={styles.bankTable}>
                  <Text style={styles.bankTableHeading}>HOẶC CHUYỂN KHOẢN THỦ CÔNG</Text>

                  {/* Ngân hàng */}
                  <View style={styles.bankRow}>
                    <Text style={styles.bankRowLabel}>Ngân hàng</Text>
                    <Text style={styles.bankRowVal}>{bankName}</Text>
                  </View>

                  {/* Số tài khoản */}
                  <View style={styles.bankRow}>
                    <Text style={styles.bankRowLabel}>Số tài khoản</Text>
                    <View style={styles.bankValWithCopy}>
                      <Text style={styles.bankValHighlight}>{accountNumber}</Text>
                      <Pressable
                        onPress={() => copyToClipboard(accountNumber, 'acc')}
                        style={styles.copyBtn}
                      >
                        {copiedField === 'acc' ? (
                          <Check color="#10B981" size={14} />
                        ) : (
                          <Copy color="#0284C7" size={14} />
                        )}
                        <Text style={styles.copyBtnText}>
                          {copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Chủ tài khoản */}
                  <View style={styles.bankRow}>
                    <Text style={styles.bankRowLabel}>Chủ tài khoản</Text>
                    <Text style={styles.bankRowVal}>{accountName}</Text>
                  </View>

                  {/* Số tiền */}
                  <View style={styles.bankRow}>
                    <Text style={styles.bankRowLabel}>Số tiền</Text>
                    <View style={styles.bankValWithCopy}>
                      <Text style={styles.bankValAmount}>
                        {amount.toLocaleString('vi-VN')} đ
                      </Text>
                      <Pressable
                        onPress={() => copyToClipboard(String(amount), 'amount')}
                        style={styles.copyBtn}
                      >
                        {copiedField === 'amount' ? (
                          <Check color="#10B981" size={14} />
                        ) : (
                          <Copy color="#0284C7" size={14} />
                        )}
                        <Text style={styles.copyBtnText}>
                          {copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Nội dung CK */}
                  <View style={[styles.bankRow, styles.lastBankRow]}>
                    <Text style={styles.bankRowLabel}>Nội dung CK</Text>
                    <View style={styles.bankValWithCopy}>
                      <Text style={styles.bankValOrderCode}>{orderCode}</Text>
                      <Pressable
                        onPress={() => copyToClipboard(orderCode, 'code')}
                        style={[styles.copyBtn, styles.copyBtnHighlight]}
                      >
                        {copiedField === 'code' ? (
                          <Check color="#FFFFFF" size={14} />
                        ) : (
                          <Copy color="#FFFFFF" size={14} />
                        )}
                        <Text style={[styles.copyBtnText, { color: '#FFFFFF' }]}>
                          {copiedField === 'code' ? 'Đã chép' : 'Sao chép'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Important Notice */}
                <View style={styles.noticeBox}>
                  <ShieldCheck color="#D97706" size={18} style={{ marginTop: 2 }} />
                  <Text style={styles.noticeText}>
                    <Text style={{ fontWeight: 'bold' }}>Lưu ý quan trọng:</Text> Vui lòng nhập chính xác nội dung chuyển khoản <Text style={{ fontWeight: 'bold', color: '#0284C7' }}>{orderCode}</Text> để hệ thống tự động nhận diện và kích hoạt trong vòng 3-10 giây.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.footerCancelBtn}>
              <Text style={styles.footerCancelText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  paymentContainer: {
    paddingBottom: 20,
  },
  timerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 12,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    color: '#92400E',
  },
  checkingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  checkingText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  planInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  planTitleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  planCodeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  planAmountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0284C7',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  expiredTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E11D48',
    marginTop: 6,
  },
  expiredDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  qrHint: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  bankTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  bankTableHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  lastBankRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  bankRowLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 90,
  },
  bankRowVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  bankValWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  bankValHighlight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284C7',
    fontFamily: 'monospace',
  },
  bankValAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  bankValOrderCode: {
    fontSize: 14,
    fontWeight: '900',
    color: '#D97706',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyBtnHighlight: {
    backgroundColor: '#0284C7',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
  },
  noticeText: {
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 17,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  successInvoiceCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  invoiceValMono: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    fontFamily: 'monospace',
  },
  invoiceValHighlight: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#059669',
  },
  paidBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065F46',
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingVertical: 12,
    borderRadius: 14,
  },
  invoiceBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 13,
    borderRadius: 14,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  footerCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});
