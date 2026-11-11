import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, X } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useAuthStore } from '@/src/core/flows/authStore';
import { cancelPlanAndRequestRefundApi } from '../../data/subscriptionApi';

interface CancelPlanSheetProps {
  visible: boolean;
  onClose: () => void;
  onCancelled: () => void;
}

const EMPTY = { reason: '', bankName: '', accountNumber: '', accountHolderName: '' };

/** Huỷ gói ngay + yêu cầu hoàn tiền. Tiền hoàn được quản trị viên xác nhận thủ công, email báo cho người dùng. */
export const CancelPlanSheet: React.FC<CancelPlanSheetProps> = ({ visible, onClose, onCancelled }) => {
  const insets = useSafeAreaInsets();
  const updateCurrentUser = useAuthStore((s) => s.updateCurrentUser);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof EMPTY) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const close = () => {
    if (submitting) return;
    setForm(EMPTY);
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountHolderName.trim()) {
      setError('Nhập đủ thông tin tài khoản nhận hoàn tiền');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await cancelPlanAndRequestRefundApi({
        reason: form.reason.trim() || undefined,
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        accountHolderName: form.accountHolderName.trim().toUpperCase(),
      });
      updateCurrentUser({ plan: 'free' });
      setForm(EMPTY);
      onCancelled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể huỷ gói');
    } finally {
      setSubmitting(false);
    }
  };

  const fields: { key: keyof typeof EMPTY; label: string; placeholder?: string; numeric?: boolean }[] = [
    { key: 'reason', label: 'Lý do (không bắt buộc)' },
    { key: 'bankName', label: 'Ngân hàng', placeholder: 'VD: Vietcombank' },
    { key: 'accountNumber', label: 'Số tài khoản', numeric: true },
    { key: 'accountHolderName', label: 'Chủ tài khoản', placeholder: 'VD: NGUYEN VAN A' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/40">
        <View className="bg-white dark:bg-darkCard rounded-t-3xl px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-neutralInk dark:text-white">Huỷ gói & hoàn tiền</Text>
            <Pressable onPress={close} hitSlop={10} accessibilityLabel="Đóng">
              <X size={20} color={AppColors.neutralGray} />
            </Pressable>
          </View>

          <View className="flex-row gap-2 bg-warning/10 rounded-xl p-3 mb-3">
            <AlertTriangle size={16} color={AppColors.warning} />
            <Text className="flex-1 text-xs text-neutralInk dark:text-white leading-5">
              Gói bị huỷ ngay. Tiền được hoàn về tài khoản sau khi quản trị viên xác nhận.
            </Text>
          </View>

          {fields.map(({ key, label, placeholder, numeric }) => (
            <View key={key} className="mb-3">
              <Text className="text-xs font-semibold text-neutralGray mb-1">{label}</Text>
              <TextInput
                value={form[key]}
                onChangeText={set(key)}
                placeholder={placeholder}
                placeholderTextColor={AppColors.neutralGray}
                keyboardType={numeric ? 'number-pad' : 'default'}
                autoCapitalize={key === 'accountHolderName' ? 'characters' : 'sentences'}
                editable={!submitting}
                className="h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-neutralInk dark:text-white"
              />
            </View>
          ))}

          {error ? <Text className="text-xs text-error mb-2">{error}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={submitting}
            className="h-12 rounded-2xl bg-error items-center justify-center mt-1"
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-bold text-sm">Huỷ gói</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
