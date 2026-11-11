import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Search,
  X,
  FileCheck2,
  Check,
  Clock,
  RotateCcw,
  FileText,
} from 'lucide-react-native';
import { apiClient } from '@/src/core/api/client';
import { useAuthStore } from '@/src/core/flows/authStore';
import { SepayInvoicePaper } from '../components/SepayInvoicePaper';

export interface OrderItem {
  id: number | string;
  orderCode?: string;
  plan?: string;
  planName?: string;
  amount?: number;
  status?: string;
  gateway?: string;
  createdAt?: string;
  expiresAt?: string;
  invoiceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerTaxCode?: string;
  customerAddress?: string;
  companyName?: string;
  refundStatus?: string;
  refundReason?: string;
}

export const StudentInvoicesScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialOrderId?: string }>();
  const { currentUser } = useAuthStore();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Bộ lọc & Tìm kiếm
  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID' | 'PENDING' | 'REFUNDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

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

      const targetId = params.initialOrderId;
      if (targetId) {
        const found = list.find(
          (o: OrderItem) => String(o.id) === String(targetId) || o.orderCode === String(targetId)
        );
        if (found) {
          setSelectedOrder(found);
        }
      }
    } catch (e) {
      console.warn('Lỗi lấy danh sách hóa đơn:', e);
    } finally {
      setLoading(false);
    }
  };

  // Chuẩn hóa tên gói cho học viên để tránh bị lẫn tên Gói Giảng Viên
  const resolvePlanName = (ord: OrderItem): string => {
    const raw = ord.planName || '';
    const isStudentUser = !currentUser?.role?.includes('TEACHER');
    const isLowPrice = typeof ord.amount === 'number' && ord.amount <= 50000;

    if ((isStudentUser || isLowPrice) && (raw.includes('Giảng Viên') || raw.includes('Teacher') || !raw)) {
      return 'Gói Học Viên Pro';
    }
    return raw || 'Gói Học Viên Pro';
  };

  // Lọc danh sách theo tab & từ khóa
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
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
      const planNameDisplay = resolvePlanName(ord).toLowerCase();
      return (
        (ord.orderCode && ord.orderCode.toLowerCase().includes(q)) ||
        planNameDisplay.includes(q) ||
        (ord.invoiceNumber && ord.invoiceNumber.toLowerCase().includes(q)) ||
        String(ord.id).includes(q)
      );
    });
  }, [orders, activeTab, searchQuery, currentUser]);

  const counts = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let refunded = 0;
    orders.forEach((o) => {
      const st = (o.status || '').toLowerCase();
      if (o.refundStatus === 'APPROVED' || o.refundStatus === 'PENDING_REVIEW' || st === 'refunded') {
        refunded++;
      } else if (st === 'success' || st === 'completed') {
        paid++;
      } else if (st === 'pending') {
        pending++;
      }
    });
    return { paid, pending, refunded, total: orders.length };
  }, [orders]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${mins} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleBack = () => {
    if (selectedOrder) {
      setSelectedOrder(null);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {selectedOrder ? 'Chi tiết hóa đơn' : 'Hóa đơn điện tử'}
        </Text>

        <TouchableOpacity
          onPress={loadOrders}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0284C7" />
          ) : (
            <RotateCcw size={18} color="#64748B" />
          )}
        </TouchableOpacity>
      </View>

      {/* Nội dung chính */}
      {selectedOrder ? (
        /* Xem chi tiết tờ hóa đơn */
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => setSelectedOrder(null)}
            style={styles.backToListBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#0284C7" />
            <Text style={styles.backToListText}>Danh sách hóa đơn</Text>
          </TouchableOpacity>

          <SepayInvoicePaper
            order={{
              ...selectedOrder,
              planName: resolvePlanName(selectedOrder),
            }}
            fallbackDisplayName={currentUser?.display_name || undefined}
            fallbackEmail={currentUser?.email}
          />
        </ScrollView>
      ) : (
        /* Danh sách hóa đơn (Đã bỏ 4 ô stat theo yêu cầu) */
        <View style={styles.container}>
          {/* Thanh tìm kiếm */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search color="#94A3B8" size={18} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm theo mã đơn, mã hóa đơn..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X color="#94A3B8" size={16} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Bộ lọc tab */}
          <View style={styles.tabsRow}>
            {[
              { key: 'ALL', label: `Tất cả (${counts.total})` },
              { key: 'PAID', label: `Đã thanh toán (${counts.paid})` },
              { key: 'PENDING', label: `Chờ quét (${counts.pending})` },
              { key: 'REFUNDED', label: `Hoàn tiền (${counts.refunded})` },
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Danh sách các hóa đơn */}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading && orders.length === 0 ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#0284C7" />
              </View>
            ) : filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox}>
                  <FileText color="#94A3B8" size={32} />
                </View>
                <Text style={styles.emptyTitle}>Chưa có hóa đơn nào</Text>
              </View>
            ) : (
              filteredOrders.map((ord) => {
                const st = (ord.status || '').toLowerCase();
                const isPaid = st === 'success' || st === 'completed';
                const isRefunded =
                  st === 'refunded' ||
                  ord.refundStatus === 'APPROVED' ||
                  ord.refundStatus === 'PENDING_REVIEW';
                const isPending = st === 'pending';
                const isCancelled = st === 'cancelled' || st === 'expired';

                return (
                  <Pressable
                    key={ord.id}
                    onPress={() => setSelectedOrder(ord)}
                    style={styles.orderCard}
                  >
                    {/* Header Thẻ: Mã Đơn + Số tiền */}
                    <View style={styles.orderHeaderRow}>
                      <View style={styles.orderCodeGroup}>
                        <View style={styles.orderIconBox}>
                          <FileCheck2 color="#0284C7" size={16} />
                        </View>
                        <View>
                          <Text style={styles.orderCodeText}>
                            {ord.orderCode || `INV-${ord.id}`}
                          </Text>
                          <Text style={styles.orderSeriesText}>Ký hiệu: SE/26E</Text>
                        </View>
                      </View>

                      <View style={styles.orderAmountGroup}>
                        <Text style={styles.orderAmountText}>
                          {(ord.amount || 0).toLocaleString('vi-VN')} đ
                        </Text>
                        {isRefunded ? (
                          <View style={[styles.statusBadge, styles.badgeRefunded]}>
                            <Text style={[styles.statusBadgeText, styles.textRefunded]}>
                              ĐÃ HOÀN TIỀN
                            </Text>
                          </View>
                        ) : isPaid ? (
                          <View style={[styles.statusBadge, styles.badgePaid]}>
                            <Check color="#059669" size={11} strokeWidth={3} />
                            <Text style={[styles.statusBadgeText, styles.textPaid]}>
                              ĐÃ THANH TOÁN
                            </Text>
                          </View>
                        ) : isPending ? (
                          <View style={[styles.statusBadge, styles.badgePending]}>
                            <Clock color="#D97706" size={11} />
                            <Text style={[styles.statusBadgeText, styles.textPending]}>
                              CHỜ QUÉT QR
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, styles.badgeCancelled]}>
                            <Text style={[styles.statusBadgeText, styles.textCancelled]}>
                              {isCancelled ? 'ĐÃ HỦY' : st.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Tên gói dịch vụ */}
                    <Text style={styles.planNameText}>{resolvePlanName(ord)}</Text>

                    {/* Footer Thẻ: Ngày tạo + Xem chi tiết */}
                    <View style={styles.orderFooterRow}>
                      <Text style={styles.orderDateText}>{formatDate(ord.createdAt)}</Text>
                      <Text style={styles.viewDetailText}>Xem hóa đơn điện tử →</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  backToListText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#0284C7',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  centerLoading: {
    paddingTop: 60,
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderCodeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderSeriesText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  orderAmountGroup: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284C7',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgePaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  textPaid: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  textPending: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  badgeRefunded: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  textRefunded: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991B1B',
  },
  badgeCancelled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  textCancelled: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  planNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 8,
  },
  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  orderDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
