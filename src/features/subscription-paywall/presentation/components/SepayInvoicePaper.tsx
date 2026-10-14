import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Copy, ShieldCheck, Check } from 'lucide-react-native';
import {
  convertVNDToWords,
  formatFullDateParts,
  formatDateStr,
  maskEmail,
} from '../../utils/currencyWords';

export interface SepayInvoiceOrder {
  id: number | string;
  orderCode?: string;
  planName?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
  invoiceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerTaxCode?: string;
  customerAddress?: string;
  companyName?: string;
  refundStatus?: string;
}

interface SepayInvoicePaperProps {
  order: SepayInvoiceOrder;
  fallbackDisplayName?: string;
  fallbackEmail?: string;
}

export const SepayInvoicePaper: React.FC<SepayInvoicePaperProps> = ({
  order,
  fallbackDisplayName,
  fallbackEmail,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFullEmail, setShowFullEmail] = useState(false);

  const isPaid =
    (order.status || '').toLowerCase() === 'success' ||
    (order.status || '').toLowerCase() === 'completed';
  const dateParts = formatFullDateParts(order.createdAt);
  const trackingCode = `SEPAY-${order.orderCode || order.id}`;
  const invoiceNoStr =
    order.invoiceNumber || order.orderCode || String(order.id).padStart(7, '0');

  const rawEmail = order.customerEmail || fallbackEmail || 'student@smartenglish.vn';
  const displayEmail = showFullEmail ? rawEmail : maskEmail(rawEmail);

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    Alert.alert(
      'Mã tra cứu hóa đơn',
      `Mã tra cứu: ${code}\n\nBạn có thể dùng mã này để đối soát hoặc tra cứu trực tuyến tính hợp lệ của hóa đơn trên cổng SePay eInvoice.`
    );
    setTimeout(() => {
      setCopiedCode(null);
    }, 3000);
  };

  return (
    <View style={styles.paper}>
      {/* 1. Header Đơn Vị Bán Hàng & Mẫu Số Ký Hiệu */}
      <View style={styles.headerRow}>
        {/* Bên Bán */}
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.sellerName}>
            HỆ THỐNG GIÁO DỤC CÔNG NGHỆ SMARTENGLISH AI
          </Text>
          <Text style={styles.sellerInfo}>
            MST: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>03XXXXXXXX</Text>
          </Text>
          <Text style={styles.sellerInfo}>
            Địa chỉ: Tòa nhà Innovation Hub, TP. Hồ Chí Minh
          </Text>
          <Text style={styles.sellerInfo}>
            Hotline: 1900 XXXX • Email: billing@smartenglish.vn
          </Text>
          <Text style={styles.sellerInfo}>
            Thanh toán: Cổng VietQR Napas 24/7 (Đối tác SePay)
          </Text>
        </View>

        {/* Mẫu số, Ký hiệu, Số HĐ */}
        <View style={styles.metaBox}>
          <Text style={styles.metaItem}>
            Mẫu số: <Text style={styles.metaBold}>2 - HĐ BÁN HÀNG</Text>
          </Text>
          <Text style={styles.metaItem}>
            Ký hiệu: <Text style={styles.metaBold}>SE/26E</Text>
          </Text>
          <Text style={styles.metaItem}>
            Số (No.): <Text style={styles.metaMono}>{invoiceNoStr}</Text>
          </Text>
          <View
            style={[
              styles.statusTag,
              isPaid ? styles.statusTagPaid : styles.statusTagPending,
            ]}
          >
            <Text
              style={[
                styles.statusTagText,
                isPaid ? styles.statusTagTextPaid : styles.statusTagTextPending,
              ]}
            >
              {isPaid ? 'BẢN THỂ HIỆN HỢP PHÁP' : 'BẢN NHÁP (DRAFT)'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Tiêu Đề Hóa Đơn & Ngày Tháng Năm */}
      <View style={styles.titleBlock}>
        <Text style={styles.titleMain}>HÓA ĐƠN BÁN HÀNG</Text>
        <Text style={styles.titleSub}>(SALES INVOICE)</Text>
        <Text style={styles.dateLine}>
          Ngày (Date) <Text style={styles.dateBold}>{dateParts.day}</Text> tháng (month){' '}
          <Text style={styles.dateBold}>{dateParts.month}</Text> năm (year){' '}
          <Text style={styles.dateBold}>{dateParts.year}</Text>
        </Text>

        {/* Box Mã Tra Cứu SePay */}
        <View style={styles.trackingBadgeRow}>
          <Text style={styles.trackingBadgeLabel}>Mã tra cứu SePay:</Text>
          <Text style={styles.trackingBadgeValue}>{trackingCode}</Text>
          <Pressable
            onPress={() => handleCopyCode(trackingCode)}
            style={styles.copyMiniBtn}
          >
            <Copy color="#0284C7" size={11} />
            <Text style={styles.copyMiniBtnText}>
              {copiedCode === trackingCode ? 'Đã sao chép' : 'Sao chép'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 3. Thông Tin Người Mua Hàng (Buyer) */}
      <View style={styles.buyerCard}>
        <Text style={styles.buyerCardTitle}>THÔNG TIN NGƯỜI MUA HÀNG (BUYER):</Text>
        <View style={styles.buyerGrid}>
          <Text style={styles.buyerText}>
            Họ tên:{' '}
            <Text style={{ fontWeight: 'bold' }}>
              {order.customerName || fallbackDisplayName || 'Học viên SmartEnglish'}
            </Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.buyerText}>Email: {displayEmail}</Text>
            <Pressable
              onPress={() => setShowFullEmail(!showFullEmail)}
              style={{ marginLeft: 6, paddingVertical: 2, paddingHorizontal: 4 }}
            >
              <Text style={{ fontSize: 10, color: '#0284C7', textDecorationLine: 'underline' }}>
                {showFullEmail ? 'Ẩn' : 'Hiện'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.buyerText}>
            Hình thức thanh toán:{' '}
            <Text style={{ fontWeight: '600', color: '#059669' }}>
              VietQR Napas 24/7 (SePay)
            </Text>
          </Text>
          <Text style={styles.buyerText}>
            Đơn vị tiền tệ: <Text style={{ fontWeight: 'bold' }}>VND (Việt Nam Đồng)</Text>
          </Text>
        </View>
      </View>

      {/* 4. Bảng Dịch Vụ */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, { width: 30, textAlign: 'center' }]}>STT</Text>
          <Text style={[styles.thText, { flex: 1 }]}>Tên dịch vụ / Gói học</Text>
          <Text style={[styles.thText, { width: 38, textAlign: 'center' }]}>ĐVT</Text>
          <Text style={[styles.thText, { width: 30, textAlign: 'center' }]}>SL</Text>
          <Text style={[styles.thText, { width: 78, textAlign: 'right' }]}>Thành tiền</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={[styles.tdText, { width: 30, textAlign: 'center', color: '#64748B' }]}>1</Text>
          <View style={{ flex: 1, paddingRight: 4 }}>
            <Text style={styles.itemName}>
              {order.planName || 'Gói Học Viên Premium'}
            </Text>
            <Text style={styles.itemDesc}>
              Mở khóa Antigravity AI, Luyện nói & Lộ trình cá nhân hóa
            </Text>
          </View>
          <Text style={[styles.tdText, { width: 38, textAlign: 'center', color: '#64748B' }]}>Gói</Text>
          <Text style={[styles.tdText, { width: 30, textAlign: 'center', color: '#64748B' }]}>1</Text>
          <Text style={[styles.tdText, { width: 78, textAlign: 'right', fontWeight: 'bold', color: '#0F172A' }]}>
            {(order.amount || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>

        <View style={styles.taxRow}>
          <Text style={{ fontSize: 10, color: '#64748B', fontStyle: 'italic' }}>
            * Dịch vụ phần mềm đào tạo trực tuyến thuộc đối tượng không chịu thuế GTGT (TT 219/2013/TT-BTC)
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng (Total):</Text>
          <Text style={styles.totalVal}>
            {(order.amount || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </View>

      {/* 5. Số Tiền Viết Bằng Chữ */}
      <View style={styles.wordsBox}>
        <Text style={styles.wordsText}>
          <Text style={{ fontWeight: 'bold', fontStyle: 'normal', color: '#0F172A' }}>
            Số tiền viết bằng chữ (Amount in words):{' '}
          </Text>
          {convertVNDToWords(order.amount)}
        </Text>
      </View>

      {/* 6. Chữ Ký Số & Con Dấu Mộc Đơn Vị Bán Hàng Chuẩn NĐ 123 */}
      <View style={styles.sellerSignSection}>
        <View style={styles.sellerSignContainer}>
          <Text style={styles.signRoleTitle}>Người bán hàng</Text>
          <Text style={styles.signRoleSub}>(Ký số điện tử & Đóng dấu mộc)</Text>

          <View style={styles.sellerStampBox}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ShieldCheck color="#059669" size={13} />
                <Text style={styles.signValidTitle}>Chữ ký có hiệu lực</Text>
              </View>
              <Text style={styles.signActor} numberOfLines={1}>
                Ký bởi: SMARTENGLISH AI
              </Text>
              <Text style={styles.signMst}>MST: 03XXXXXXXX</Text>
              <Text style={styles.signDate}>
                Ký ngày: {formatDateStr(order.createdAt)}
              </Text>
              <Text style={styles.signLegalNotice}>
                Chứng thư số CA hợp pháp theo NĐ 123/2020/NĐ-CP
              </Text>
            </View>
            <View style={styles.bigCheckWrapper}>
              <Text style={styles.bigCheckMark}>✓</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 7. Footer Pháp Lý */}
      <View style={styles.legalFooter}>
        <Text style={styles.legalItalic}>
          (Cần kiểm tra, đối chiếu khi lập, giao, nhận hóa đơn)
        </Text>
        <Text style={styles.legalBrand}>
          Giải pháp hóa đơn điện tử an toàn kết nối SePay eInvoice Napas 24/7
        </Text>
        <Text style={styles.legalPortal}>
          Tra cứu trực tuyến tại:{' '}
          <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>
            https://sepay.vn/tra-cuu-hoa-don-dien-tu
          </Text>
        </Text>
        <Text style={styles.legalTracking}>
          Mã tra cứu: <Text style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{trackingCode}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sellerName: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0369A1',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  sellerInfo: {
    fontSize: 9.5,
    color: '#475569',
    lineHeight: 14,
  },
  metaBox: {
    minWidth: 120,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 6,
    alignItems: 'flex-start',
  },
  metaItem: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 2,
  },
  metaBold: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  metaMono: {
    fontWeight: 'bold',
    color: '#0284C7',
    fontFamily: 'monospace',
  },
  statusTag: {
    marginTop: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusTagPending: {
    backgroundColor: '#FEF3C7',
  },
  statusTagText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  statusTagTextPaid: {
    color: '#15803D',
  },
  statusTagTextPending: {
    color: '#B45309',
  },
  titleBlock: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleMain: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  titleSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  dateLine: {
    fontSize: 10,
    color: '#334155',
  },
  dateBold: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  trackingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  trackingBadgeLabel: {
    fontSize: 9.5,
    color: '#0369A1',
    fontWeight: '600',
  },
  trackingBadgeValue: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#0284C7',
  },
  copyMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: '#E0F2FE',
    borderRadius: 4,
  },
  copyMiniBtnText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  buyerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buyerCardTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  buyerGrid: {
    gap: 2,
  },
  buyerText: {
    fontSize: 10,
    color: '#334155',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  thText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tdText: {
    fontSize: 10,
  },
  itemName: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  itemDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  taxRow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F0F9FF',
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369A1',
  },
  totalVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0284C7',
  },
  wordsBox: {
    padding: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    marginBottom: 8,
  },
  wordsText: {
    fontSize: 9.5,
    color: '#92400E',
    fontStyle: 'italic',
  },
  sellerSignSection: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  sellerSignContainer: {
    width: '60%',
    alignItems: 'center',
  },
  signRoleTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  signRoleSub: {
    fontSize: 8.5,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  sellerStampBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 10,
    padding: 6,
    width: '100%',
    alignItems: 'center',
  },
  signValidTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
  },
  signActor: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  signMst: {
    fontSize: 8,
    color: '#475569',
  },
  signDate: {
    fontSize: 8,
    color: '#475569',
  },
  signLegalNotice: {
    fontSize: 7.5,
    color: '#059669',
    marginTop: 1,
  },
  bigCheckWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigCheckMark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  legalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    alignItems: 'center',
    gap: 1,
  },
  legalItalic: {
    fontSize: 8,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  legalBrand: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#475569',
  },
  legalPortal: {
    fontSize: 8,
    color: '#64748B',
  },
  legalTracking: {
    fontSize: 8,
    color: '#64748B',
  },
});
