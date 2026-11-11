import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Paperclip, X } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';
import { useSubmitAssignment } from '../../application/useClassMembership';
import { uploadSubmissionFileApi, type ClassAssignmentDTO, type PickedFile } from '../../data/classApi';

interface SubmitAssignmentSheetProps {
  classId: string | number;
  assignment: ClassAssignmentDTO | null;
  onClose: () => void;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Nộp bài cho bài tập không gắn học liệu hệ thống (giáo viên tải file đề lên hoặc bài tự luận):
 * học viên nhập bài làm và/hoặc đính kèm file (ảnh chụp bài viết tay, PDF, Word...).
 */
export const SubmitAssignmentSheet: React.FC<SubmitAssignmentSheetProps> = ({ classId, assignment, onClose }) => {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useSubmitAssignment(classId);
  const busy = uploading || isPending;

  const reset = () => {
    setText('');
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'audio/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.size != null && asset.size > MAX_FILE_BYTES) {
      setError('File vượt quá 10MB');
      return;
    }
    setError(null);
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, webFile: asset.file });
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    const content = text.trim();
    if (!content && !file) {
      setError('Nhập bài làm hoặc đính kèm file');
      return;
    }
    setError(null);
    try {
      let attachmentUrl: string | undefined;
      if (file) {
        setUploading(true);
        attachmentUrl = await uploadSubmissionFileApi(file);
        setUploading(false);
      }
      await mutateAsync({
        assignmentId: assignment.id,
        payload: {
          submissionText: content || undefined,
          attachmentUrl,
          attachmentName: file?.name,
        },
      });
      reset();
      onClose();
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Không thể nộp bài');
    }
  };

  return (
    <Modal visible={!!assignment} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/40"
      >
        <View
          className="bg-white dark:bg-darkCard rounded-t-3xl px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="flex-1 mr-3 text-base font-bold text-neutralInk dark:text-white" numberOfLines={1}>
              {assignment?.title}
            </Text>
            <Pressable onPress={handleClose} hitSlop={10} accessibilityLabel="Đóng" className="p-1 rounded-full">
              <X size={20} color={AppColors.neutralGray} />
            </Pressable>
          </View>

          {assignment?.instructions ? (
            <Text className="text-xs text-neutralGray mb-3 leading-5">{assignment.instructions}</Text>
          ) : null}

          {assignment?.attachmentUrl ? (
            <Pressable
              onPress={() => Linking.openURL(assignment.attachmentUrl as string).catch(() => {})}
              className="flex-row items-center gap-2 bg-surface dark:bg-darkBg rounded-xl px-3 py-2 mb-3"
            >
              <FileText size={14} color={AppColors.secondary} />
              <Text className="text-xs font-semibold text-neutralInk dark:text-white flex-1" numberOfLines={1}>
                {assignment.attachmentName || 'Đề bài của giáo viên'}
              </Text>
            </Pressable>
          ) : null}

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nhập bài làm"
            placeholderTextColor={AppColors.neutralGray}
            multiline
            textAlignVertical="top"
            editable={!busy}
            className="min-h-[120px] max-h-[240px] rounded-2xl border border-gray-200 dark:border-gray-700 p-3 text-sm text-neutralInk dark:text-white"
          />

          {file ? (
            <View className="flex-row items-center gap-2 bg-surface dark:bg-darkBg rounded-xl px-3 py-2 mt-2">
              <Paperclip size={14} color={AppColors.secondary} />
              <Text className="text-xs text-neutralInk dark:text-white flex-1" numberOfLines={1}>
                {file.name}
              </Text>
              <Pressable onPress={() => setFile(null)} hitSlop={8} accessibilityLabel="Bỏ file" disabled={busy}>
                <X size={14} color={AppColors.neutralGray} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickFile}
              disabled={busy}
              className="flex-row items-center gap-2 self-start mt-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <Paperclip size={14} color={AppColors.neutralGray} />
              <Text className="text-xs font-semibold text-neutralGray">Đính kèm file</Text>
            </Pressable>
          )}

          {assignment?.status === 'Đã nộp' ? (
            <Text className="text-[11px] text-neutralGray mt-2">Nộp lại sẽ thay thế bài đã nộp trước đó</Text>
          ) : null}

          {error ? <Text className="text-xs text-error mt-2">{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            className="mt-4 h-12 rounded-2xl bg-primary items-center justify-center flex-row active:bg-primaryDark"
            style={{ opacity: busy ? 0.7 : 1 }}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <Text className="text-white font-bold text-sm ml-2">
              {assignment?.status === 'Đã nộp' ? 'Nộp lại' : 'Nộp bài'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
