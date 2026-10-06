import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  Send,
  Image as ImageIcon,
  Paperclip,
  Download,
  FileText,
  Clock,
  ChevronDown,
  ArrowRight,
  Pin,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatabaseLoader } from '@/src/components/ui/DatabaseLoader';
import { cleanAvatarUrl } from '../screens/SocialFeedScreen';
import {
  ChatConversationDto,
  ChatMessageDto,
  fetchConversationMessagesApi,
  sendMessageApi,
  markConversationAsReadApi,
} from '../../data/socialApi';

interface ChatDetailModalProps {
  visible: boolean;
  conversation: ChatConversationDto | null;
  currentUserId: number;
  currentUserName: string;
  currentUserAvatar?: string;
  onClose: () => void;
  onConversationUpdated?: (convId: string, lastMsg: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onViewImage?: (url: string) => void;
}

export const ChatDetailModal: React.FC<ChatDetailModalProps> = ({
  visible,
  conversation,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
  onConversationUpdated,
  onNavigateToPost,
  onViewImage,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);

  const convId = conversation?.id;

  // ─── 1. Load messages & Mark as read ───
  const loadMessages = useCallback(async (isInitial = false) => {
    if (!convId) return;
    try {
      if (isInitial) setLoading(true);
      const data = await fetchConversationMessagesApi(convId);
      if (Array.isArray(data)) {
        setMessages((prev) => {
          // Chỉ scroll khi có tin nhắn mới
          if (data.length > prev.length && !isInitial) {
            setTimeout(() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
          return data;
        });
      }
      // Đánh dấu đã đọc
      markConversationAsReadApi(convId, currentUserId).catch(() => {});
    } catch (err) {
      console.warn('loadMessages error:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [convId, currentUserId]);

  useEffect(() => {
    if (visible && convId) {
      loadMessages(true);
      setVisibleCount(30);

      // Realtime polling sync every 2.5 seconds when chat room is active
      const timer = setInterval(() => {
        loadMessages(false);
      }, 2500);

      return () => clearInterval(timer);
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [visible, convId, loadMessages]);

  // ─── 2. Send Text Message ───
  const handleSendText = async () => {
    if (!inputText.trim() || !convId || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessageDto = {
      id: tempId,
      conversationId: convId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      type: 'TEXT',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

    try {
      const sent = await sendMessageApi(convId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        content: text,
        type: 'TEXT',
      });

      if (sent) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? sent : m)));
        onConversationUpdated?.(convId, text);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn.');
    } finally {
      setIsSending(false);
    }
  };

  // ─── 3. Send Image Attachment ───
  const handlePickImage = async () => {
    if (!convId || isSending) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

        setIsSending(true);
        const tempId = `temp-img-${Date.now()}`;
        const tempMsg: ChatMessageDto = {
          id: tempId,
          conversationId: convId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          type: 'IMAGE',
          attachmentUrl: imageUri,
          content: '[Hình ảnh]',
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

        const sent = await sendMessageApi(convId, {
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          content: '[Hình ảnh]',
          type: 'IMAGE',
          attachmentUrl: imageUri,
        });

        if (sent) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? sent : m)));
          onConversationUpdated?.(convId, '[Hình ảnh]');
        }
      }
    } catch (err) {
      console.warn('Pick image error:', err);
      Alert.alert('Lỗi', 'Không thể gửi hình ảnh.');
    } finally {
      setIsSending(false);
    }
  };

  // ─── 4. Send Document File ───
  const handlePickDocument = async () => {
    if (!convId || isSending) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const sizeStr = `${((file.size || 0) / 1024).toFixed(1)} KB`;

        setIsSending(true);
        const tempId = `temp-file-${Date.now()}`;
        const tempMsg: ChatMessageDto = {
          id: tempId,
          conversationId: convId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          type: 'FILE',
          attachmentName: file.name,
          attachmentSize: sizeStr,
          attachmentUrl: file.uri,
          content: `[Tệp đính kèm] ${file.name}`,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

        const sent = await sendMessageApi(convId, {
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          content: `[Tệp đính kèm] ${file.name}`,
          type: 'FILE',
          attachmentName: file.name,
          attachmentSize: sizeStr,
          attachmentUrl: file.uri,
        });

        if (sent) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? sent : m)));
          onConversationUpdated?.(convId, `[Tệp] ${file.name}`);
        }
      }
    } catch (err) {
      console.warn('Pick document error:', err);
      Alert.alert('Lỗi', 'Không thể gửi tệp đính kèm.');
    } finally {
      setIsSending(false);
    }
  };

  if (!conversation) return null;

  const isGroup = conversation.type === 'GROUP';
  const headerAvatarUrl = cleanAvatarUrl(
    conversation.avatar,
    isGroup
      ? 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
  );

  // Pagination slice
  const displayedMessages =
    messages.length > visibleCount
      ? messages.slice(messages.length - visibleCount)
      : messages;

  const hasMoreOldMessages = messages.length > visibleCount;

  // Helpers for date separators & time formatting
  const formatMsgTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    } catch {
      return '';
    }
  };

  const getDateSeparatorLabel = (currDateStr?: string, prevDateStr?: string) => {
    if (!currDateStr) return null;
    const curr = new Date(currDateStr);
    if (prevDateStr) {
      const prev = new Date(prevDateStr);
      if (
        curr.getFullYear() === prev.getFullYear() &&
        curr.getMonth() === prev.getMonth() &&
        curr.getDate() === prev.getDate()
      ) {
        return null; // Same day, no separator needed
      }
    }

    const today = new Date();
    const isToday =
      curr.getFullYear() === today.getFullYear() &&
      curr.getMonth() === today.getMonth() &&
      curr.getDate() === today.getDate();

    if (isToday) return 'Hôm nay';

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      curr.getFullYear() === yesterday.getFullYear() &&
      curr.getMonth() === yesterday.getMonth() &&
      curr.getDate() === yesterday.getDate();

    if (isYesterday) return 'Hôm qua';

    return `${curr.getDate().toString().padStart(2, '0')}/${(curr.getMonth() + 1).toString().padStart(2, '0')}/${curr.getFullYear()}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <X color="#0F172A" size={22} />
          </Pressable>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {conversation.name || (isGroup ? 'Nhóm chung' : 'Trực tiếp')}
            </Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatusText}>
                {isGroup
                  ? `${conversation.members?.length || 15} thành viên · Hoạt động`
                  : 'Trực tuyến'}
              </Text>
            </View>
          </View>

          <Image source={{ uri: headerAvatarUrl }} style={styles.headerAvatar} />
        </View>

        {/* Messages Body */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <DatabaseLoader size="sm" message="Đang tải tin nhắn..." />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            style={styles.messageScroll}
            contentContainerStyle={styles.messageScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Load Older Messages Button */}
            {hasMoreOldMessages && (
              <Pressable
                onPress={() => setVisibleCount((prev) => prev + 30)}
                style={styles.loadOlderBtn}
              >
                <Clock color="#64748B" size={13} />
                <Text style={styles.loadOlderText}>
                  Xem tin nhắn cũ hơn ({messages.length - visibleCount} tin nhắn)
                </Text>
              </Pressable>
            )}

            {displayedMessages.length === 0 ? (
              <View style={styles.emptyMessagesWrap}>
                <Text style={styles.emptyMessagesText}>
                  Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên! 👋
                </Text>
              </View>
            ) : (
              displayedMessages.map((msg, index) => {
                const isMe = msg.senderId === currentUserId;
                const prevMsg = index > 0 ? displayedMessages[index - 1] : null;
                const nextMsg = index < displayedMessages.length - 1 ? displayedMessages[index + 1] : null;

                // ─── 1. Date Separator ───
                const dateLabel = getDateSeparatorLabel(msg.createdAt, prevMsg?.createdAt);

                // ─── 2. Avatar & Sender Name Grouping Logic (Web Style) ───
                // Check previous msg to know if this is FIRST in sequence
                let isSameSenderAsPrev = false;
                let isPrevWithin30Mins = false;
                if (prevMsg) {
                  isSameSenderAsPrev = prevMsg.senderId === msg.senderId;
                  if (isSameSenderAsPrev && msg.createdAt && prevMsg.createdAt) {
                    const diff = new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
                    isPrevWithin30Mins = diff < 30 * 60 * 1000;
                  }
                }
                const isFirstOfSequence = !isSameSenderAsPrev || !isPrevWithin30Mins;

                // Check next msg to know if this is LAST in sequence (show avatar here)
                let isSameSenderAsNext = false;
                let isNextWithin30Mins = false;
                if (nextMsg) {
                  isSameSenderAsNext = nextMsg.senderId === msg.senderId;
                  if (isSameSenderAsNext && msg.createdAt && nextMsg.createdAt) {
                    const diff = new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime();
                    isNextWithin30Mins = diff < 30 * 60 * 1000;
                  }
                }
                const isLastOfSequence = !isSameSenderAsNext || !isNextWithin30Mins;

                const isSharedPost = msg.type === 'SHARE_POST' || Boolean(msg.sharedPost);
                const isImage = msg.type === 'IMAGE' || (msg.attachmentUrl && !msg.attachmentName);
                const isFile = msg.type === 'FILE' || Boolean(msg.attachmentName);

                return (
                  <View key={msg.id || `msg-${index}`}>
                    {/* Date separator pill */}
                    {dateLabel && (
                      <View style={styles.dateSeparatorWrap}>
                        <View style={styles.dateSeparatorPill}>
                          <Text style={styles.dateSeparatorText}>{dateLabel}</Text>
                        </View>
                      </View>
                    )}

                    <View
                      style={[
                        styles.bubbleRow,
                        isMe ? styles.bubbleRowMe : styles.bubbleRowOther,
                        isLastOfSequence ? { marginBottom: 8 } : { marginBottom: 2.5 },
                      ]}
                    >
                      {/* Sender Avatar (only show on LAST message of sequence for OTHER) */}
                      {!isMe && (
                        isLastOfSequence ? (
                          <Image
                            source={{ uri: cleanAvatarUrl(msg.senderAvatar) }}
                            style={styles.senderAvatar}
                          />
                        ) : (
                          <View style={styles.senderAvatarSpacer} />
                        )
                      )}

                      <View style={[styles.bubbleCol, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        {/* Sender Name (only show on FIRST message of sequence in GROUP) */}
                        {isGroup && !isMe && isFirstOfSequence && (
                          <Text style={styles.senderNameLabel}>
                            {msg.senderName || 'Người gửi'}
                          </Text>
                        )}

                        {/* Bubble Container */}
                        <View
                          style={[
                            styles.bubble,
                            isMe ? styles.bubbleMe : styles.bubbleOther,
                          ]}
                        >
                          {/* Shared Post Card Attachment */}
                          {isSharedPost && msg.sharedPost && (
                            <Pressable
                              onPress={() => {
                                if (msg.sharedPost?.postId) {
                                  onClose();
                                  onNavigateToPost?.(msg.sharedPost.postId);
                                }
                              }}
                              style={[
                                styles.sharedPostCard,
                                isMe ? styles.sharedPostCardMe : styles.sharedPostCardOther,
                              ]}
                            >
                              <View style={styles.sharedPostHeader}>
                                <Image
                                  source={{ uri: cleanAvatarUrl(msg.sharedPost.authorAvatar) }}
                                  style={styles.sharedPostAvatar}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.sharedPostAuthor, isMe && { color: '#FFFFFF' }]} numberOfLines={1}>
                                    {msg.sharedPost.authorName || 'Người dùng'}
                                  </Text>
                                  <Text style={[styles.sharedPostSub, isMe && { color: '#CBD5E1' }]}>
                                    • Bài viết cộng đồng
                                  </Text>
                                </View>
                                <View style={styles.sharedPostBadge}>
                                  <Text style={styles.sharedPostBadgeText}>Xem →</Text>
                                </View>
                              </View>

                              <Text
                                style={[styles.sharedPostExcerpt, isMe && { color: '#E2E8F0' }]}
                                numberOfLines={2}
                              >
                                "{msg.sharedPost.content}"
                              </Text>

                              {msg.sharedPost.imageUrl && (
                                <Image
                                  source={{ uri: cleanAvatarUrl(msg.sharedPost.imageUrl) }}
                                  style={styles.sharedPostImg}
                                  resizeMode="cover"
                                />
                              )}
                            </Pressable>
                          )}

                          {/* Image Attachment */}
                          {isImage && msg.attachmentUrl && (
                            <Pressable
                              onPress={() => onViewImage?.(msg.attachmentUrl!)}
                              style={styles.imageAttachWrap}
                            >
                              <Image
                                source={{ uri: msg.attachmentUrl }}
                                style={styles.imageAttach}
                                resizeMode="cover"
                              />
                            </Pressable>
                          )}

                          {/* File Attachment */}
                          {isFile && (
                            <View style={[styles.fileCard, isMe ? styles.fileCardMe : styles.fileCardOther]}>
                              <View style={styles.fileIconBox}>
                                <FileText color="#DC2626" size={18} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.fileName, isMe && { color: '#FFFFFF' }]} numberOfLines={1}>
                                  {msg.attachmentName || 'Tài liệu đính kèm'}
                                </Text>
                                <Text style={[styles.fileSize, isMe && { color: '#CBD5E1' }]}>
                                  {msg.attachmentSize || 'Tệp tài liệu'}
                                </Text>
                              </View>
                              <Download color={isMe ? '#FFFFFF' : '#64748B'} size={16} />
                            </View>
                          )}

                          {/* Text Message Content (if not just preview) */}
                          {msg.content && !isSharedPost && !isImage && (
                            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                              {msg.content}
                            </Text>
                          )}

                          {/* Message Time and Read status */}
                          <View style={styles.bubbleFooter}>
                            <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
                              {formatMsgTime(msg.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Action buttons: Image & File */}
          <Pressable onPress={handlePickImage} style={styles.attachBtn} hitSlop={6}>
            <ImageIcon color="#64748B" size={21} />
          </Pressable>

          <Pressable onPress={handlePickDocument} style={styles.attachBtn} hitSlop={6}>
            <Paperclip color="#64748B" size={21} />
          </Pressable>

          {/* Text Input */}
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendText}
          />

          {/* Send Button */}
          <Pressable
            onPress={handleSendText}
            disabled={!inputText.trim() || isSending}
            style={[
              styles.sendBtn,
              (!inputText.trim() || isSending) && styles.sendBtnDisabled,
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send color="#FFFFFF" size={17} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  headerStatusText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CBD5E1',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageScroll: {
    flex: 1,
  },
  messageScrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexGrow: 1,
  },
  loadOlderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
    gap: 6,
  },
  loadOlderText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyMessagesWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyMessagesText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  dateSeparatorWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateSeparatorPill: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E1',
    marginBottom: 1,
  },
  senderAvatarSpacer: {
    width: 30,
  },
  bubbleCol: {
    maxWidth: '78%',
  },
  senderNameLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  bubbleMe: {
    backgroundColor: '#0F2C59',
    borderBottomRightRadius: 3,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 3,
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextMe: {
    color: '#FFFFFF',
  },
  bubbleTextOther: {
    color: '#0F172A',
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 9.5,
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.65)',
  },
  bubbleTimeOther: {
    color: '#94A3B8',
  },
  sharedPostCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 4,
  },
  sharedPostCardMe: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  sharedPostCardOther: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  sharedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sharedPostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sharedPostAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sharedPostSub: {
    fontSize: 10,
    color: '#64748B',
  },
  sharedPostBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sharedPostBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  sharedPostExcerpt: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 6,
  },
  sharedPostImg: {
    width: '100%',
    height: 90,
    borderRadius: 8,
  },
  imageAttachWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  imageAttach: {
    width: 200,
    height: 140,
    borderRadius: 12,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 8,
    gap: 8,
    marginBottom: 4,
    minWidth: 180,
  },
  fileCardMe: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fileCardOther: {
    backgroundColor: '#F1F5F9',
  },
  fileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  fileSize: {
    fontSize: 10,
    color: '#64748B',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  attachBtn: {
    padding: 6,
    borderRadius: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    maxHeight: 90,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
