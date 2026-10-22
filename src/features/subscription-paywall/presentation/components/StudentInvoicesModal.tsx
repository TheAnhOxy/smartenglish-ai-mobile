import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import {
  FileCheck2,
  X,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Check,
} from 'lucide-react-native';
import { apiClient, getCurrentUserId } from '@/src/core/api/client';
import { useAuthStore } from '@/src/core/flows/authStore';
import {
  formatDateStr,
  isWithin7Days,
} from '../../utils/currencyWords';
import { SepayInvoicePaper, SepayInvoiceOrder } from './SepayInvoicePaper';
import { RefundRequestModal } from './RefundRequestModal';

export interface OrderItem extends SepayInvoiceOrder {
  expiresAt?: string;
  qrUrl?: string;
}

interface StudentInvoicesModalProps {
  visible: boolean;
  onClose: () => void;
  initialOrderId?: number | string | null;
}

export const StudentInvoicesModal: React.FC<StudentInvoicesModalProps> = ({
  visible,
  onClose,
  initialOrderId,
}) => {
  const { currentUser } = useAuthStore();
  const userId = currentUser?.id || getCurrentUserId();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Bộ lọc & Tìm kiếm chuẩn SePay eInvoice
  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID' | 'PENDING' | 'REFUNDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // State cho form Yêu cầu hoàn tiền (Refund)
  const [showRefundForm, setShowRefundForm] = useState(false);

  useEffect(() => {
    if (visible) {
      loadOrders();
    }
  }, [visible, userId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/api/v1/payment/user/orders');
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setOrders(list);

      if (initialOrderId) {
        const found = list.find(
          (o: OrderItem) => String(o.id) === String(initialOrderId) || o.orderCode === String(initialOrderId)
        );
        if (found) {
          selectOrder(found);
        }
      }
    } catch (e) {
      console.warn('Lỗi lấy danh sách hóa đơn:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: OrderItem) => {
    setSelectedOrder(order);
    setShowRefundForm(false);
  };

  // Lọc danh sách theo tab & từ khóa tìm kiếm
  const filteredOrders = orders.filter((ord) => {
    const st = (ord.status || '').toLowerCase();
    const isPaid = st === 'success' || st === 'completed';
    const isRefunded =
      st === 'refunded' ||
      ord.refundStatus === 'APPROVED' ||
      ord.refundStatus === 'PENDING_REVIEW';
    const isPending = st === 'pending';

    let matchTab = true;
    if (activeTab === 'PAID') matchTab = isPaid && !isRefunded;
    else if (activeTab === 'PENDING') matchTab = isPending;
    else if (activeTab === 'REFUNDED') matchTab = isRefunded;

    if (!matchTab) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (ord.orderCode && ord.orderCode.toLowerCase().includes(q)) ||
      (ord.planName && ord.planName.toLowerCase().includes(q)) ||
      (ord.invoiceNumber && ord.invoiceNumber.toLowerCase().includes(q)) ||
      String(ord.id).includes(q)
    );
  });

  // Thống kê nhanh
  const paidCount = orders.filter(
    (o) => (o.status || '').toLowerCase() === 'success' || (o.status || '').toLowerCase() === 'completed'
  ).length;
  const pendingCount = orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length;
  const refundedCount = orders.filter(
    (o) =>
      (o.status || '').toLowerCase() === 'refunded' ||
      o.refundStatus === 'APPROVED' ||
      o.refundStatus === 'PENDING_REVIEW'
  ).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Modal */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconBox}>
                <FileCheck2 color="#0284C7" size={20} />
              </View>
              <View>
                <Text style={styles.title}>Quản Lý Hóa Đơn Điện Tử</Text>
                <Text style={styles.subtitle}>
                  Chuẩn hóa đơn điện tử SePay eInvoice Napas 24/7
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color="#64748B" size={18} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text style={{ fontSize: 13, color: '#64748B' }}>Đang nạp danh sách giao dịch & hóa đơn...</Text>
              </View>
            ) : selectedOrder ? (
              /* ========================================================================= */
              /* CHI TIẾT HÓA ĐƠN ĐIỆN TỬ                                                  */
              /* ========================================================================= */
              <View style={{ paddingBottom: 28 }}>
                {/* Nút quay lại danh sách */}
                <Pressable
                  onPress={() => setSelectedOrder(null)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
                >
                  <Text style={{ fontSize: 13, color: '#0284C7', fontWeight: 'bold' }}>
                    ← Quay lại danh sách hóa đơn
                  </Text>
                </Pressable>

                {/* KHUNG GIẤY HÓA ĐƠN SEPAY EINVOICE */}
                <SepayInvoicePaper
                  order={selectedOrder}
                  fallbackDisplayName={currentUser?.display_name || undefined}
                  fallbackEmail={currentUser?.email || undefined}
                />

                {/* Phần Nghiệp Vụ Hoàn Tiền Cam Kết 7 Ngày (Money-Back Guarantee) */}
                <View style={{ marginTop: 18 }}>
                  {selectedOrder.status === 'refunded' || selectedOrder.refundStatus === 'APPROVED' ? (
                    <View style={styles.refundedNotice}>
                      <CheckCircle2 color="#059669" size={18} />
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#065F46' }}>
                        Giao dịch này đã được hoàn tiền thành công.
                      </Text>
                    </View>
                  ) : selectedOrder.refundStatus === 'PENDING_REVIEW' || selectedOrder.status === 'PROCESSING' ? (
                    <View style={styles.pendingRefundNotice}>
                      <Clock color="#D97706" size={18} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#92400E' }}>
                          Đang chờ duyệt hoàn tiền
                        </Text>
                        <Text style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
                          Yêu cầu hoàn tiền của bạn đang được Ban Quản Trị đối soát ngân hàng.
                        </Text>
                      </View>
                    </View>
                  ) : isWithin7Days(selectedOrder.createdAt) ? (
                    !showRefundForm ? (
                      <Pressable
                        onPress={() => setShowRefundForm(true)}
                        style={styles.requestRefundBtn}
                      >
                        <RotateCcw color="#EF4444" size={16} />
                        <Text style={styles.requestRefundBtnText}>
                          Yêu cầu hoàn tiền (Chính sách cam kết trong 7 ngày)
                        </Text>
                      </Pressable>
                    ) : (
                      <RefundRequestModal
                        orderId={selectedOrder.id}
                        userId={userId}
                        orderCode={selectedOrder.orderCode}
                        amount={selectedOrder.amount}
                        onClose={() => setShowRefundForm(false)}
                        onSuccess={(updated) => {
                          setShowRefundForm(false);
                          setSelectedOrder((prev) => (prev ? { ...prev, ...updated, refundStatus: 'PENDING_REVIEW' } : null));
                          loadOrders();
                        }}
                      />
                    )
                  ) : (
                    <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>
                      Đơn hàng đã qua thời hạn 7 ngày cam kết hoàn tiền.
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              /* ========================================================================= */
              /* GIAO DIỆN QUẢN LÝ DANH SÁCH HÓA ĐƠN CHUẨN SEPAY EINVOICE                  */
              /* ========================================================================= */
              <View style={{ paddingBottom: 24 }}>
                {/* 1. Thẻ Thống Kê Tổng Quan */}
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNum}>{orders.length}</Text>
                    <Text style={styles.statLabel}>Tổng hóa đơn</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#10B981', borderLeftWidth: 3 }]}>
                    <Text style={[styles.statNum, { color: '#059669' }]}>{paidCount}</Text>
                    <Text style={styles.statLabel}>Đã thanh toán</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }]}>
                    <Text style={[styles.statNum, { color: '#D97706' }]}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Chờ quét QR</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#EF4444', borderLeftWidth: 3 }]}>
                    <Text style={[styles.statNum, { color: '#DC2626' }]}>{refundedCount}</Text>
                    <Text style={styles.statLabel}>Đã hoàn tiền</Text>
                  </View>
                </View>

                {/* 2. Thanh Tìm Kiếm Đơn Hàng / Hóa Đơn */}
                <View style={styles.searchBar}>
                  <Search color="#64748B" size={16} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Tìm theo mã đơn, mã hóa đơn (INV)..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <X color="#94A3B8" size={14} />
                    </Pressable>
                  )}
                </View>

                {/* 3. Tab Chuyển Đổi Trạng Thái */}
                <View style={styles.tabRow}>
                  {[
                    { key: 'ALL', label: `Tất cả (${orders.length})` },
                    { key: 'PAID', label: `Hợp lệ (${paidCount})` },
                    { key: 'PENDING', label: `Chờ (${pendingCount})` },
                    { key: 'REFUNDED', label: `Hoàn (${refundedCount})` },
                  ].map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key as any)}
                        style={[styles.tabBtn, active && styles.tabBtnActive]}
                      >
                        <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* 4. Danh Sách Thẻ Hóa Đơn */}
                {filteredOrders.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconBox}>
                      <FileCheck2 color="#94A3B8" size={32} />
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có hóa đơn nào</Text>
                    <Text style={styles.emptySubtitle}>
                      {searchQuery
                        ? 'Không tìm thấy hóa đơn khớp với từ khóa tìm kiếm.'
                        : 'Khi bạn nâng cấp gói học qua SePay VietQR, hóa đơn hợp pháp sẽ được tự động lưu trữ tại đây.'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    {filteredOrders.map((ord) => {
                      const st = (ord.status || '').toLowerCase();
                      const isPaid = st === 'success' || st === 'completed';
                      const isExpired = st === 'expired';
                      const isCancelled = st === 'cancelled';
                      const isPending = st === 'pending';
                      const isRefunded =
                        st === 'refunded' ||
                        ord.refundStatus === 'APPROVED' ||
                        ord.refundStatus === 'PENDING_REVIEW';
                      const isUserActive =
                        currentUser?.plan?.includes('premium') || currentUser?.plan === 'lifetime';

                      return (
                        <Pressable
                          key={ord.id}
                          onPress={() => selectOrder(ord)}
                          style={styles.sepayOrderCard}
                        >
                          {/* Header Thẻ: Mã Đơn + Badge Trạng Thái + Giá */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={styles.sepayCardIcon}>
                                <FileCheck2 color="#0284C7" size={17} />
                              </View>
                              <View>
                                <Text style={styles.sepayCardOrderCode}>
                                  {ord.orderCode || `ORD-${ord.id}`}
                                </Text>
                                <Text style={styles.sepayCardSeries}>Ký hiệu: SE/26E</Text>
                              </View>
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.sepayCardAmount}>
                                {(ord.amount || 0).toLocaleString('vi-VN')} đ
                              </Text>
                              {isRefunded ? (
                                <View style={[styles.sepayCardBadge, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                                  <RotateCcw color="#DC2626" size={10} />
                                  <Text style={[styles.sepayCardBadgeText, { color: '#991B1B' }]}>
                                    {ord.refundStatus === 'PENDING_REVIEW' ? 'ĐANG DUYỆT HOÀN' : 'ĐÃ HOÀN TIỀN'}
                                  </Text>
                                </View>
                              ) : isPaid ? (
                                <View style={[styles.sepayCardBadge, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
                                  <Check color="#059669" size={11} strokeWidth={3} />
                                  <Text style={[styles.sepayCardBadgeText, { color: '#065F46' }]}>ĐÃ THANH TOÁN</Text>
                                </View>
                              ) : isUserActive && isPending ? (
                                <View style={[styles.sepayCardBadge, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                                  <Text style={[styles.sepayCardBadgeText, { color: '#64748B' }]}>ĐÃ HỦY (ĐÃ CÓ GÓI)</Text>
                                </View>
                              ) : isExpired ? (
                                <View style={[styles.sepayCardBadge, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                                  <Text style={[styles.sepayCardBadgeText, { color: '#64748B' }]}>ĐÃ HẾT HẠN</Text>
                                </View>
                              ) : isCancelled ? (
                                <View style={[styles.sepayCardBadge, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                                  <Text style={[styles.sepayCardBadgeText, { color: '#64748B' }]}>ĐÃ HỦY</Text>
                                </View>
                              ) : (
                                <View style={[styles.sepayCardBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                                  <Clock color="#D97706" size={10} />
                                  <Text style={[styles.sepayCardBadgeText, { color: '#92400E' }]}>CHỜ THANH TOÁN</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Body Thẻ: Tên Gói & Cổng Thanh Toán */}
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.sepayCardPlanName}>
                              {ord.planName || 'Gói Học Viên Premium'}
                            </Text>
                          </View>

                          {/* Footer Thẻ: Ngày giờ & CTA */}
                          <View style={styles.sepayCardFooter}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Calendar color="#94A3B8" size={12} />
                              <Text style={styles.sepayCardDate}>{formatDateStr(ord.createdAt)}</Text>
                            </View>
                            <Text style={styles.sepayCardCta}>
                              Xem hóa đơn điện tử →
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    padding: 0,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0284C7',
  },
  tabBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  sepayOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sepayCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sepayCardOrderCode: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sepayCardSeries: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  sepayCardAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284C7',
    marginBottom: 3,
  },
  sepayCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  sepayCardBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  sepayCardPlanName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  sepayCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sepayCardDate: {
    fontSize: 10.5,
    color: '#64748B',
  },
  sepayCardCta: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  refundedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 12,
  },
  pendingRefundNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
  },
  requestRefundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  requestRefundBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
});
