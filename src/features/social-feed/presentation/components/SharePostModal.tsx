import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, Search, Send, Link2, Check, ArrowRight } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cleanAvatarUrl } from '../screens/SocialFeedScreen';
import {
  CommunityPostDto,
  ChatConversationDto,
  sharePostToConversationApi,
} from '../../data/socialApi';

interface SharePostModalProps {
  visible: boolean;
  post: CommunityPostDto | null;
  conversations: ChatConversationDto[];
  currentUserId: number;
  currentUserName: string;
  currentUserAvatar?: string;
  onClose: () => void;
  onPostShared: (conversationId: string, updatedConversation?: ChatConversationDto) => void;
  onOpenConversation: (conv: ChatConversationDto) => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  visible,
  post,
  conversations,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
  onPostShared,
  onOpenConversation,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const postUrl = `https://smartenglish.edu.vn/community#post-${post.id}`;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      Alert.alert('Thành công', 'Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
    } catch {
      Alert.alert('Thông báo', `Liên kết bài viết:\n${postUrl}`);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (c.name || '').toLowerCase();
    return name.includes(q);
  });

  const handleSendPostToConversation = async () => {
    if (!selectedConvId) {
      Alert.alert('Thông báo', 'Vui lòng chọn một cuộc trò chuyện để chia sẻ bài viết.');
      return;
    }

    const targetConv = conversations.find((c) => c.id === selectedConvId);
    if (!targetConv) return;

    setIsSending(true);
    try {
      await sharePostToConversationApi(selectedConvId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        postInfo: {
          postId: post.id,
          authorName: post.authorName || 'Người dùng SmartEnglish',
          authorAvatar: post.authorAvatar,
          authorRole: post.authorRole,
          content: post.content,
          imageUrl: post.mediaUrl || undefined,
        },
      });

      Alert.alert(
        'Thành công',
        `Đã chia sẻ bài viết vào cuộc trò chuyện "${targetConv.name || 'Hội thoại'}". Bạn có muốn mở cuộc trò chuyện ngay không?`,
        [
          {
            text: 'Đóng',
            style: 'cancel',
            onPress: () => {
              onPostShared(selectedConvId);
              onClose();
            },
          },
          {
            text: 'Mở cuộc trò chuyện ngay',
            style: 'default',
            onPress: () => {
              onPostShared(selectedConvId);
              onClose();
              onOpenConversation(targetConv);
            },
          },
        ]
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể chia sẻ bài viết vào lúc này.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 14) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chia sẻ bài viết</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <X color="#64748B" size={20} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Post Preview Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              {cleanAvatarUrl(post.authorAvatar) ? (
                <Image
                  source={{ uri: cleanAvatarUrl(post.authorAvatar) }}
                  style={styles.previewAvatar}
                />
              ) : (
                <View style={[styles.previewAvatar, { backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#4F46E5' }}>
                    {(post.authorName || 'U').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.previewAuthor}>{post.authorName || 'Người dùng'}</Text>
                <Text style={styles.previewRole}>{post.authorRole || 'Bài viết cộng đồng'}</Text>
              </View>
            </View>
            <Text style={styles.previewContent} numberOfLines={3}>
              "{post.content}"
            </Text>
            {post.mediaUrl ? (
              <Image
                source={{ uri: post.mediaUrl }}
                style={styles.previewImg}
                resizeMode="cover"
              />
            ) : null}
          </View>

          {/* Copy URL Row */}
          <View style={styles.copyRow}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Link2 color="#2563EB" size={18} />
              <Text style={styles.copyUrlText} numberOfLines={1}>
                {postUrl}
              </Text>
            </View>
            <Pressable onPress={handleCopyLink} style={styles.copyBtn}>
              {copied ? <Check color="#16A34A" size={15} /> : <Link2 color="#2563EB" size={15} />}
              <Text style={[styles.copyBtnText, copied && { color: '#16A34A' }]}>
                {copied ? 'Đã chép' : 'Sao chép link'}
              </Text>
            </Pressable>
          </View>

          {/* Destination Selection Label */}
          <Text style={styles.sectionLabel}>
            Hoặc gửi vào cuộc trò chuyện / nhóm học tập:
          </Text>

          {/* Search Bar */}
          <View style={styles.searchBox}>
            <Search color="#94A3B8" size={16} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm theo tên bạn bè hoặc nhóm..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          {/* Conversations List */}
          <View style={styles.convListWrap}>
            {filteredConversations.length === 0 ? (
              <View style={styles.emptyConv}>
                <Text style={styles.emptyConvText}>Không tìm thấy cuộc trò chuyện phù hợp</Text>
              </View>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                const isGroup = conv.type === 'GROUP';
                const avatar = cleanAvatarUrl(conv.avatar);

                return (
                  <Pressable
                    key={conv.id}
                    onPress={() => setSelectedConvId(conv.id)}
                    style={[
                      styles.convItem,
                      isSelected && styles.convItemSelected,
                    ]}
                  >
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.convAvatar} />
                    ) : (
                      <View style={[styles.convAvatar, { backgroundColor: isGroup ? '#EDE9FE' : '#EEF2FF', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: isGroup ? '#7C3AED' : '#4F46E5' }}>
                          {(conv.name || 'U').trim().charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.convName} numberOfLines={1}>
                        {conv.name || (isGroup ? 'Nhóm chung' : 'Bạn học')}
                      </Text>
                      <Text style={styles.convType}>
                        {isGroup ? 'Nhóm trò chuyện' : 'Trò chuyện 1-1'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && <Check color="#FFFFFF" size={14} />}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Footer Action */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </Pressable>

          <Pressable
            onPress={handleSendPostToConversation}
            disabled={!selectedConvId || isSending}
            style={[
              styles.confirmBtn,
              (!selectedConvId || isSending) && styles.confirmBtnDisabled,
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send color="#FFFFFF" size={16} />
                <Text style={styles.confirmBtnText}>Gửi bài viết</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  previewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  previewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewRole: {
    fontSize: 11,
    color: '#64748B',
  },
  previewContent: {
    fontSize: 12.5,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 8,
  },
  previewImg: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 10,
  },
  copyUrlText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  copyBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  convListWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    maxHeight: 240,
  },
  emptyConv: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyConvText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  convItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  convAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  convName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  convType: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
