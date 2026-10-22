import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { X, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { apiClient } from '@/src/core/api/client';

interface RefundRequestModalProps {
  orderId: number | string;
  userId: number | string;
  orderCode?: string;
  amount?: number;
  onSuccess: (updatedOrder: any) => void;
  onClose: () => void;
}

export const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  orderId,
  userId,
  orderCode,
  amount,
  onSuccess,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field touch / error states
  const [touched, setTouched] = useState({
    reason: false,
    bankName: false,
    accountNumber: false,
    accountHolderName: false,
  });

  const errors = {
    reason:
      !reason.trim()
        ? 'Vui lòng nhập lý do yêu cầu hoàn tiền'
        : reason.trim().length < 5
        ? 'Lý do hoàn tiền phải từ 5 ký tự trở lên'
        : null,
    bankName: !bankName.trim() ? 'Vui lòng nhập tên ngân hàng thụ hưởng' : null,
    accountNumber:
      !accountNumber.trim()
        ? 'Vui lòng nhập số tài khoản nhận tiền hoàn'
        : !/^[0-9A-Za-z]{6,30}$/.test(accountNumber.trim())
        ? 'Số tài khoản phải gồm 6 - 30 ký tự số/chữ'
        : null,
    accountHolderName:
      !accountHolderName.trim()
        ? 'Vui lòng nhập tên chủ tài khoản thụ hưởng'
        : accountHolderName.trim().length < 2
        ? 'Tên chủ tài khoản quá ngắn'
        : null,
  };

  const isFormValid =
    !errors.reason && !errors.bankName && !errors.accountNumber && !errors.accountHolderName;

  const handleSubmit = async () => {
    setTouched({
      reason: true,
      bankName: true,
      accountNumber: true,
      accountHolderName: true,
    });

    if (!isFormValid) {
      Alert.alert('Thông tin chưa hợp lệ', 'Vui lòng kiểm tra lại các trường có dấu sao đỏ (*)');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiClient.post<any>(
        `/api/v1/payment/orders/${orderId}/request-refund`,
        {
          reason: reason.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolderName: accountHolderName.trim().toUpperCase(),
        }
      );
      const updated = res.data?.data || res.data;
      Alert.alert(
        'Đã gửi yêu cầu hoàn tiền thành công',
        `Mã đơn: ${orderCode || orderId}\nSố tiền hoàn: ${(amount || 0).toLocaleString('vi-VN')} đ\n\nYêu cầu của bạn đã được chuyển tới Ban Quản Trị đối soát SePay. Tiền sẽ được hoàn trả về tài khoản ${accountNumber.trim()} trong 24-48 giờ làm việc.`
      );
      onSuccess(updated);
    } catch (err: any) {
      Alert.alert(
        'Không thể gửi yêu cầu hoàn tiền',
        err?.response?.data?.message || 'Đơn hàng không đủ điều kiện hoặc đã quá hạn 7 ngày cam kết hoàn tiền.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <RotateCcw color="#DC2626" size={17} />
          <Text style={styles.title}>YÊU CẦU HOÀN TIỀN (7 NGÀY)</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <X color="#64748B" size={18} />
        </Pressable>
      </View>

      <View style={styles.policyNotice}>
        <ShieldCheck color="#0369A1" size={16} style={{ marginTop: 1 }} />
        <Text style={styles.policyNoticeText}>
          Chính sách SmartEnglish AI cam kết hoàn tiền 100% trong vòng 7 ngày kể từ lúc thanh toán.
          Vui lòng cung cấp chính xác số tài khoản ngân hàng để đối soát.
        </Text>
      </View>

      {/* Field 1: Reason */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Lý do hoàn tiền</Text>
          <Text style={styles.required}>*</Text>
        </View>
        <TextInput
          value={reason}
          onChangeText={setReason}
          onBlur={() => setTouched((p) => ({ ...p, reason: true }))}
          placeholder="Ví dụ: Đổi mục tiêu học tập, mua nhầm gói..."
          placeholderTextColor="#94A3B8"
          style={[styles.input, touched.reason && errors.reason ? styles.inputError : null]}
        />
        {touched.reason && errors.reason && (
          <Text style={styles.errorText}>{errors.reason}</Text>
        )}
      </View>

      {/* Field 2: Bank Name */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Ngân hàng nhận tiền hoàn</Text>
          <Text style={styles.required}>*</Text>
        </View>
        <TextInput
          value={bankName}
          onChangeText={setBankName}
          onBlur={() => setTouched((p) => ({ ...p, bankName: true }))}
          placeholder="Ví dụ: MB Bank, Vietcombank, Techcombank, BIDV..."
          placeholderTextColor="#94A3B8"
          style={[styles.input, touched.bankName && errors.bankName ? styles.inputError : null]}
        />
        {touched.bankName && errors.bankName && (
          <Text style={styles.errorText}>{errors.bankName}</Text>
        )}
      </View>

      {/* Field 3: Account Number */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Số tài khoản thụ hưởng</Text>
          <Text style={styles.required}>*</Text>
        </View>
        <TextInput
          value={accountNumber}
          onChangeText={setAccountNumber}
          onBlur={() => setTouched((p) => ({ ...p, accountNumber: true }))}
          placeholder="Chỉ nhập số, ví dụ: 0963684871"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          style={[
            styles.input,
            styles.monoInput,
            touched.accountNumber && errors.accountNumber ? styles.inputError : null,
          ]}
        />
        {touched.accountNumber && errors.accountNumber && (
          <Text style={styles.errorText}>{errors.accountNumber}</Text>
        )}
      </View>

      {/* Field 4: Account Holder Name */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Tên chủ tài khoản (In hoa không dấu)</Text>
          <Text style={styles.required}>*</Text>
        </View>
        <TextInput
          value={accountHolderName}
          onChangeText={(v) => setAccountHolderName(v.toUpperCase())}
          onBlur={() => setTouched((p) => ({ ...p, accountHolderName: true }))}
          placeholder="Ví dụ: NGUYEN VAN A"
          placeholderTextColor="#94A3B8"
          autoCapitalize="characters"
          style={[
            styles.input,
            touched.accountHolderName && errors.accountHolderName ? styles.inputError : null,
          ]}
        />
        {touched.accountHolderName && errors.accountHolderName && (
          <Text style={styles.errorText}>{errors.accountHolderName}</Text>
        )}
      </View>

      {/* Submit Button */}
      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting || (Object.values(touched).some(Boolean) && !isFormValid)}
        style={[
          styles.submitBtn,
          Object.values(touched).some(Boolean) && !isFormValid ? styles.submitBtnDisabled : null,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Xác nhận gửi yêu cầu hoàn tiền</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    padding: 16,
    marginTop: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  required: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  monoInput: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 3,
    marginLeft: 2,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
