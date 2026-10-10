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
  Pin,
  Reply,
  Copy,
  RotateCcw,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatabaseLoader } from '@/src/components/ui/DatabaseLoader';
import { cleanAvatarUrl } from '../screens/SocialFeedScreen';
import {
  ChatConversationDto,
  ChatMessageDto,
  fetchConversationMessagesApi,
  sendMessageApi,
  markConversationAsReadApi,
  toggleMessagePinApi,
  reactMessageApi,
  recallMessageApi,
  sendTypingApi,
  fetchTypingApi,
  getCachedMessages,
} from '../../data/socialApi';

interface ChatDetailModalProps {
  visible: boolean;
  conversation: ChatConversationDto | null;
  currentUserId: number;
  currentUserName: string;
  currentUserAvatar?: string;
  communityUsers?: any[];
  onClose: () => void;
  onConversationUpdated?: (convId: string, lastMsg: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onViewImage?: (url: string) => void;
  isOnline?: boolean;
}

const REACTIONS = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'LOVE', emoji: '❤️' },
  { type: 'HAHA', emoji: '😂' },
  { type: 'WOW', emoji: '😮' },
  { type: 'SAD', emoji: '😢' },
  { type: 'ANGRY', emoji: '😡' },
];

export const ChatDetailModal: React.FC<ChatDetailModalProps> = ({
  visible,
  conversation,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  communityUsers,
  onClose,
  onConversationUpdated,
  onNavigateToPost,
  onViewImage,
  isOnline = false,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitiallyScrolled = useRef(false);

  const convId = conversation?.id;
  const initialCached = convId ? getCachedMessages(convId) : null;
  const [messages, setMessages] = useState<ChatMessageDto[]>(initialCached || []);
  const [loading, setLoading] = useState(!initialCached || initialCached.length === 0);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);

  // Advanced features state
  const [replyingTo, setReplyingTo] = useState<ChatMessageDto | null>(null);
  const [selectedMsgForAction, setSelectedMsgForAction] = useState<ChatMessageDto | null>(null);
  const [activeTypingUsers, setActiveTypingUsers] = useState<{ userId: number; userName: string }[]>([]);

  // ─── 1. Load messages & Mark as read ───
  const loadMessages = useCallback(async (isInitial = false) => {
    if (!convId) return;
    try {
      if (isInitial && messages.length === 0) setLoading(true);
      const data = await fetchConversationMessagesApi(convId, currentUserId);
      if (Array.isArray(data)) {
        setMessages((prev) => {
          const hasNew = data.length > prev.length;
          if (hasNew || !hasInitiallyScrolled.current) {
            setTimeout(() => {
              scrollRef.current?.scrollToEnd({ animated: hasInitiallyScrolled.current });
              hasInitiallyScrolled.current = true;
            }, 60);
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
  }, [convId, currentUserId, messages.length]);

  // ─── 2. Polling for messages and typing indicators ───
  useEffect(() => {
    if (visible && convId) {
      hasInitiallyScrolled.current = false;
      const cachedMsgs = getCachedMessages(convId);
      if (cachedMsgs && cachedMsgs.length > 0) {
        setMessages(cachedMsgs);
        setLoading(false);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: false });
          hasInitiallyScrolled.current = true;
        }, 50);
      }
      loadMessages(!cachedMsgs || cachedMsgs.length === 0);
      setVisibleCount(40);

      // Realtime polling sync for messages every 2.0s
      const msgTimer = setInterval(() => {
        loadMessages(false);
      }, 2000);

      // Realtime polling sync for typing every 1.5s
      const typingTimer = setInterval(async () => {
        const typers = await fetchTypingApi(convId);
        setActiveTypingUsers(typers.filter((t) => Number(t.userId) !== currentUserId));
      }, 1500);

      return () => {
        clearInterval(msgTimer);
        clearInterval(typingTimer);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTypingApi(convId, currentUserId, currentUserName, false).catch(() => {});
      };
    } else {
      setReplyingTo(null);
      setSelectedMsgForAction(null);
      setActiveTypingUsers([]);
    }
  }, [visible, convId, loadMessages, currentUserId, currentUserName]);

  // ─── 3. Handle Typing in TextInput ───
  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!convId) return;

    sendTypingApi(convId, currentUserId, currentUserName, true).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingApi(convId, currentUserId, currentUserName, false).catch(() => {});
    }, 2500);
  };

  // ─── 4. Send Text Message (Supports Reply) ───
  const handleSendText = async () => {
    if (!inputText.trim() || !convId || isSending) return;
    const text = inputText.trim();
    const currentReply = replyingTo;

    setInputText('');
    setReplyingTo(null);
    setIsSending(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingApi(convId, currentUserId, currentUserName, false).catch(() => {});

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessageDto = {
      id: tempId,
      conversationId: convId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      type: 'TEXT',
      content: text,
      replyTo: currentReply
        ? {
            id: currentReply.id,
            senderName: currentReply.senderName,
            content:
              currentReply.type === 'IMAGE'
                ? '[Hình ảnh]'
                : currentReply.type === 'FILE'
                ? '[Tệp]'
                : currentReply.content,
          }
        : undefined,
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
        replyTo: currentReply
          ? {
              id: currentReply.id,
              senderName: currentReply.senderName,
              content:
                currentReply.type === 'IMAGE'
                  ? '[Hình ảnh]'
                  : currentReply.type === 'FILE'
                  ? '[Tệp]'
                  : currentReply.content,
            }
          : undefined,
      });

      if (sent) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? sent : m)));
        onConversationUpdated?.(convId, text);
      }
    } catch {
      Alert.alert('Lỗi', 'Gửi tin nhắn không thành công.');
    } finally {
      setIsSending(false);
    }
  };

  // ─── 5. Pick Image ───
  const handlePickImage = async () => {
    if (!convId || isSending) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập ảnh trong cài đặt.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsSending(true);

        const imageUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

        const tempId = `temp-img-${Date.now()}`;
        const tempMsg: ChatMessageDto = {
          id: tempId,
          conversationId: convId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          type: 'IMAGE',
          content: '[Hình ảnh]',
          attachmentUrl: imageUri,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

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
      Alert.alert('Lỗi', 'Không thể chọn ảnh.');
    } finally {
      setIsSending(false);
    }
  };

  // ─── 6. Pick Document ───
  const handlePickDocument = async () => {
    if (!convId || isSending) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsSending(true);

        const sizeStr = file.size
          ? `${(file.size / 1024).toFixed(1)} KB`
          : 'Tài liệu';

        const tempId = `temp-doc-${Date.now()}`;
        const tempMsg: ChatMessageDto = {
          id: tempId,
          conversationId: convId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          type: 'FILE',
          content: `[Tệp đính kèm] ${file.name}`,
          attachmentName: file.name,
          attachmentSize: sizeStr,
          attachmentUrl: file.uri,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

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

  // ─── 7. Actions: Pin, Reaction, Recall ───
  const handleTogglePin = async (messageId: string) => {
    if (!convId) return;
    try {
      const updated = await toggleMessagePinApi(convId, messageId);
      if (updated) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isPinned: !m.isPinned } : m))
        );
      }
    } catch {
      Alert.alert('Thông báo', 'Không thể thay đổi trạng thái ghim lúc này.');
    }
  };

  const handleReact = async (messageId: string, reactionType: string) => {
    if (!convId) return;
    setSelectedMsgForAction(null);
    try {
      const updated = await reactMessageApi(convId, messageId, currentUserId, reactionType);
      if (updated) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      }
    } catch {
      // ignore
    }
  };

  const handleRecall = async (messageId: string) => {
    if (!convId) return;
    try {
      const ok = await recallMessageApi(convId, messageId, currentUserId);
      if (ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isRecalled: true, content: 'Tin nhắn đã được thu hồi', attachmentUrl: undefined }
              : m
          )
        );
      }
    } catch {
      Alert.alert('Thông báo', 'Không thể thu hồi tin nhắn lúc này.');
    }
  };

  if (!conversation) return null;

  const isGroup = conversation.type === 'GROUP';
  const otherMember = !isGroup
    ? conversation.members?.find((m) => Number(m.userId) !== currentUserId)
    : null;
  const otherUserId = Number(
    otherMember?.userId ||
      (!isGroup ? conversation.memberIds?.find((id) => Number(id) !== currentUserId) : null)
  );
  const matchedUser = otherUserId && communityUsers
    ? communityUsers.find((u: any) => Number(u.id) === otherUserId)
    : null;

  const headerTitle =
    conversation.name ||
    (isGroup ? 'Nhóm học tập' : matchedUser?.displayName || matchedUser?.name || otherMember?.name || 'Bạn học SmartEnglish');

  const rawHeaderAvatar = isGroup
    ? cleanAvatarUrl(conversation.avatar)
    : (cleanAvatarUrl(matchedUser?.avatarUrl || matchedUser?.avatar) ||
       cleanAvatarUrl(conversation.avatar) ||
       cleanAvatarUrl(otherMember?.avatar));

  const hasRealHeaderAvatar = Boolean(rawHeaderAvatar);
  const headerInitialLetter = (headerTitle || 'U').trim().charAt(0).toUpperCase();

  // Pagination slice
  const displayedMessages =
    messages.length > visibleCount
      ? messages.slice(messages.length - visibleCount)
      : messages;

  const hasMoreOldMessages = messages.length > visibleCount;

  // Active pinned message in room
  const pinnedMessage = messages.find((m) => m.isPinned);

  // Time & separator helpers
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
        return null;
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

  // Helper to aggregate reaction badges on message bubble
  const renderReactionBadges = (msg: ChatMessageDto, isMe: boolean) => {
    if (!msg.reactions || msg.reactions.length === 0) return null;
    const counts: { [type: string]: number } = {};
    msg.reactions.forEach((r) => {
      counts[r.reactionType] = (counts[r.reactionType] || 0) + 1;
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) return null;

    return (
      <View style={[styles.reactionBadgeWrap, isMe ? { left: 4 } : { right: 4 }]}>
        {entries.map(([rType, count]) => {
          const rObj = REACTIONS.find((r) => r.type === rType);
          return (
            <View key={rType} style={styles.reactionBadge}>
              <Text style={styles.reactionBadgeEmoji}>{rObj?.emoji || '👍'}</Text>
              {count > 1 && <Text style={styles.reactionBadgeCount}>{count}</Text>}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
              {headerTitle}
            </Text>
            <View style={styles.headerStatusRow}>
              {isOnline ? (
                <>
                  <View style={styles.onlineDot} />
                  <Text style={styles.headerStatusText}>
                    {isGroup
                      ? `${conversation.members?.length || 15} thành viên · Hoạt động`
                      : 'Đang trực tuyến'}
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.onlineDot, { backgroundColor: '#94A3B8' }]} />
                  <Text style={styles.headerStatusText}>
                    {isGroup ? `${conversation.members?.length || 15} thành viên` : 'Ngoại tuyến'}
                  </Text>
                </>
              )}
            </View>
          </View>

          <View style={{ position: 'relative' }}>
            {hasRealHeaderAvatar && rawHeaderAvatar ? (
              <Image source={{ uri: rawHeaderAvatar }} style={styles.headerAvatar} />
            ) : (
              <View
                style={[
                  styles.headerAvatar,
                  {
                    backgroundColor: isGroup ? '#EDE9FE' : '#EEF2FF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isGroup ? '#DDD6FE' : '#C7D2FE',
                  },
                ]}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: isGroup ? '#7C3AED' : '#4F46E5' }}>
                  {headerInitialLetter}
                </Text>
              </View>
            )}
            {isOnline && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0.5,
                  right: 0.5,
                  width: 11,
                  height: 11,
                  borderRadius: 9999,
                  backgroundColor: '#10B981',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  zIndex: 2,
                }}
              />
            )}
          </View>
        </View>

        {/* Pinned Message Sticky Banner */}
        {pinnedMessage && (
          <View style={styles.pinnedBanner}>
            <Pin size={13} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={styles.pinnedBannerText} numberOfLines={1}>
              <Text style={{ fontWeight: '700' }}>Đã ghim: </Text>
              {pinnedMessage.type === 'IMAGE'
                ? '[Hình ảnh]'
                : pinnedMessage.type === 'FILE'
                ? `[Tệp] ${pinnedMessage.attachmentName || ''}`
                : pinnedMessage.content}
            </Text>
            <Pressable onPress={() => handleTogglePin(pinnedMessage.id)} hitSlop={8}>
              <Text style={styles.unpinText}>Bỏ ghim</Text>
            </Pressable>
          </View>
        )}

        {/* Messages Body */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <DatabaseLoader size="sm" message="Đang tải tin nhắn..." />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            onContentSizeChange={() => {
              if (!hasInitiallyScrolled.current && messages.length > 0) {
                scrollRef.current?.scrollToEnd({ animated: false });
                hasInitiallyScrolled.current = true;
              }
            }}
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
                const nextMsg =
                  index < displayedMessages.length - 1 ? displayedMessages[index + 1] : null;

                const dateLabel = getDateSeparatorLabel(msg.createdAt, prevMsg?.createdAt);

                let isSameSenderAsPrev = false;
                let isPrevWithin30Mins = false;
                if (prevMsg) {
                  isSameSenderAsPrev = prevMsg.senderId === msg.senderId;
                  if (isSameSenderAsPrev && msg.createdAt && prevMsg.createdAt) {
                    const diff =
                      new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
                    isPrevWithin30Mins = diff < 30 * 60 * 1000;
                  } else {
                    isPrevWithin30Mins = true;
                  }
                }
                const isFirstOfSequence = !isSameSenderAsPrev || !isPrevWithin30Mins;

                let isSameSenderAsNext = false;
                let isNextWithin30Mins = false;
                if (nextMsg) {
                  isSameSenderAsNext = nextMsg.senderId === msg.senderId;
                  if (isSameSenderAsNext && msg.createdAt && nextMsg.createdAt) {
                    const diff =
                      new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime();
                    isNextWithin30Mins = diff < 30 * 60 * 1000;
                  } else {
                    isNextWithin30Mins = true;
                  }
                }
                const isLastOfSequence = !isSameSenderAsNext || !isNextWithin30Mins;

                const isImage = msg.type === 'IMAGE' || (Boolean(msg.attachmentUrl) && !msg.attachmentName);
                const isFile = msg.type === 'FILE' || (Boolean(msg.attachmentUrl) && Boolean(msg.attachmentName));
                const isSharedPost = msg.type === 'SHARE_POST' || Boolean(msg.sharedPost);

                return (
                  <View key={msg.id || index}>
                    {dateLabel && (
                      <View style={styles.dateSeparatorWrap}>
                        <Text style={styles.dateSeparatorText}>{dateLabel}</Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.messageRow,
                        isMe ? styles.messageRowMe : styles.messageRowOther,
                        isLastOfSequence ? styles.messageRowLast : styles.messageRowNormal,
                      ]}
                    >
                      {/* Avatar on other's last message of sequence */}
                      {!isMe && (
                        isLastOfSequence ? (
                          (() => {
                            const senderMatchedUser = msg.senderId && communityUsers
                              ? communityUsers.find((u: any) => Number(u.id) === Number(msg.senderId))
                              : null;
                            const senderAvatar = !isGroup
                              ? (rawHeaderAvatar || cleanAvatarUrl(senderMatchedUser?.avatarUrl || senderMatchedUser?.avatar) || cleanAvatarUrl(msg.senderAvatar))
                              : (cleanAvatarUrl(senderMatchedUser?.avatarUrl || senderMatchedUser?.avatar) || cleanAvatarUrl(msg.senderAvatar));
                            const senderName = msg.senderName || senderMatchedUser?.displayName || senderMatchedUser?.name || headerTitle;
                            const senderInitial = (senderName || 'U').trim().charAt(0).toUpperCase();

                            return senderAvatar ? (
                              <Image
                                source={{ uri: senderAvatar }}
                                style={styles.senderAvatar}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.senderAvatar,
                                  {
                                    backgroundColor: '#EEF2FF',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#C7D2FE',
                                  },
                                ]}
                              >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#4F46E5' }}>
                                  {senderInitial}
                                </Text>
                              </View>
                            );
                          })()
                        ) : (
                          <View style={styles.avatarSpacer} />
                        )
                      )}

                      <View
                        style={[
                          styles.bubbleWrap,
                          isMe ? styles.bubbleWrapMe : styles.bubbleWrapOther,
                        ]}
                      >
                        {/* Sender Name in group */}
                        {!isMe && isGroup && isFirstOfSequence && (
                          <Text style={styles.senderNameLabel}>{msg.senderName}</Text>
                        )}

                        {/* CASE 1: STANDALONE CLEAN IMAGE (No text, no wrapper frame) */}
                        {isImage && msg.attachmentUrl ? (
                          <Pressable
                            onPress={() => onViewImage?.(msg.attachmentUrl!)}
                            onLongPress={() => setSelectedMsgForAction(msg)}
                            style={styles.cleanImageCard}
                          >
                            <Image
                              source={{ uri: msg.attachmentUrl }}
                              style={styles.cleanImage}
                              resizeMode="cover"
                            />
                            <View style={styles.cleanImageBadge}>
                              {msg.isPinned && (
                                <Pin size={10} color="#FDE047" style={{ marginRight: 3 }} />
                              )}
                              <Text style={styles.cleanImageBadgeTime}>
                                {formatMsgTime(msg.createdAt)}
                              </Text>
                            </View>
                            {renderReactionBadges(msg, isMe)}
                          </Pressable>
                        ) : (
                          /* CASE 2: REGULAR BUBBLE / FILE / SHARED POST */
                          <Pressable
                            onLongPress={() => setSelectedMsgForAction(msg)}
                            style={[
                              styles.bubble,
                              isMe ? styles.bubbleMe : styles.bubbleOther,
                            ]}
                          >
                            {/* Reply Quote Preview inside bubble */}
                            {msg.replyTo && (
                              <View
                                style={[
                                  styles.replyQuoteBox,
                                  isMe ? styles.replyQuoteBoxMe : styles.replyQuoteBoxOther,
                                ]}
                              >
                                <Text style={styles.replyQuoteAuthor}>{msg.replyTo.senderName}</Text>
                                <Text
                                  style={[styles.replyQuoteText, isMe && { color: '#E2E8F0' }]}
                                  numberOfLines={1}
                                >
                                  {msg.replyTo.content}
                                </Text>
                              </View>
                            )}

                            {/* Shared Post Card */}
                            {isSharedPost && msg.sharedPost && (
                              <Pressable
                                onPress={() => onNavigateToPost?.(msg.sharedPost!.postId)}
                                style={[
                                  styles.sharedPostCard,
                                  isMe ? styles.sharedPostCardMe : styles.sharedPostCardOther,
                                ]}
                              >
                                <View style={styles.sharedPostHeader}>
                                  {Boolean(cleanAvatarUrl(msg.sharedPost.authorAvatar)) && (
                                    <Image
                                      source={{ uri: cleanAvatarUrl(msg.sharedPost.authorAvatar) }}
                                      style={styles.sharedPostAvatar}
                                    />
                                  )}
                                  <View style={{ flex: 1 }}>
                                    <Text
                                      style={[styles.sharedPostAuthor, isMe && { color: '#FFFFFF' }]}
                                    >
                                      {msg.sharedPost.authorName}
                                    </Text>
                                    <Text
                                      style={[styles.sharedPostSub, isMe && { color: '#93C5FD' }]}
                                    >
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

                                {Boolean(msg.sharedPost.imageUrl) && (
                                  <Image
                                    source={{ uri: msg.sharedPost.imageUrl }}
                                    style={styles.sharedPostImg}
                                    resizeMode="cover"
                                  />
                                )}
                              </Pressable>
                            )}

                            {/* File Card (Clean document attachment without duplicated text) */}
                            {isFile && (
                              <View
                                style={[
                                  styles.fileCard,
                                  isMe ? styles.fileCardMe : styles.fileCardOther,
                                ]}
                              >
                                <View style={styles.fileIconBox}>
                                  <FileText color="#DC2626" size={18} />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[styles.fileName, isMe && { color: '#FFFFFF' }]}
                                    numberOfLines={1}
                                  >
                                    {msg.attachmentName || 'Tài liệu đính kèm'}
                                  </Text>
                                  <Text
                                    style={[styles.fileSize, isMe && { color: '#CBD5E1' }]}
                                  >
                                    {msg.attachmentSize || 'Tệp tài liệu'}
                                  </Text>
                                </View>
                                <Download color={isMe ? '#FFFFFF' : '#64748B'} size={16} />
                              </View>
                            )}

                            {/* Text Content (Suppressed if duplicate file/image label) */}
                            {msg.content &&
                              !isSharedPost &&
                              !isFile &&
                              !msg.content.startsWith('[Tệp đính kèm]') &&
                              !msg.content.startsWith('[Hình ảnh]') && (
                                <Text
                                  style={[
                                    styles.bubbleText,
                                    isMe ? styles.bubbleTextMe : styles.bubbleTextOther,
                                    msg.isRecalled && { fontStyle: 'italic', opacity: 0.75 },
                                  ]}
                                >
                                  {msg.content}
                                </Text>
                              )}

                            {/* Message Time and Pinned indicator */}
                            <View style={styles.bubbleFooter}>
                              {msg.isPinned && (
                                <Pin size={10} color="#F59E0B" style={{ marginRight: 3 }} />
                              )}
                              <Text
                                style={[
                                  styles.bubbleTime,
                                  isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther,
                                ]}
                              >
                                {formatMsgTime(msg.createdAt)}
                              </Text>
                            </View>

                            {renderReactionBadges(msg, isMe)}
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* Dynamic Typing Indicator */}
            {activeTypingUsers.length > 0 && (
              <View style={styles.typingIndicatorRow}>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDotWrap}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </View>
                  <Text style={styles.typingText}>
                    {activeTypingUsers[0].userName || 'Ai đó'} đang soạn tin nhắn...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Reply Preview Bar above Input */}
        {replyingTo && (
          <View style={styles.replyingBar}>
            <View style={styles.replyingLeftBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replyingToTitle}>Đang trả lời {replyingTo.senderName}</Text>
              <Text style={styles.replyingToExcerpt} numberOfLines={1}>
                {replyingTo.type === 'IMAGE'
                  ? '📷 [Hình ảnh]'
                  : replyingTo.type === 'FILE'
                  ? '📄 [Tệp đính kèm]'
                  : replyingTo.content}
              </Text>
            </View>
            <Pressable onPress={() => setReplyingTo(null)} hitSlop={10}>
              <X size={16} color="#64748B" />
            </Pressable>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable onPress={handlePickImage} style={styles.attachBtn} hitSlop={6}>
            <ImageIcon color="#64748B" size={21} />
          </Pressable>

          <Pressable onPress={handlePickDocument} style={styles.attachBtn} hitSlop={6}>
            <Paperclip color="#64748B" size={21} />
          </Pressable>

          <TextInput
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendText}
          />

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

        {/* Message Action Sheet Modal (Long Press) */}
        <Modal
          visible={Boolean(selectedMsgForAction)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMsgForAction(null)}
        >
          <Pressable
            style={styles.actionSheetOverlay}
            onPress={() => setSelectedMsgForAction(null)}
          >
            <View style={styles.actionSheetContainer}>
              {/* Reaction Emojis Row */}
              <View style={styles.emojiReactionRow}>
                {REACTIONS.map((r) => (
                  <Pressable
                    key={r.type}
                    onPress={() => handleReact(selectedMsgForAction!.id, r.type)}
                    style={styles.emojiBtn}
                  >
                    <Text style={{ fontSize: 26 }}>{r.emoji}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionSheetMenu}>
                <Pressable
                  onPress={() => {
                    const msg = selectedMsgForAction!;
                    setSelectedMsgForAction(null);
                    handleTogglePin(msg.id);
                  }}
                  style={styles.actionSheetItem}
                >
                  <Pin size={18} color="#4F46E5" />
                  <Text style={styles.actionSheetItemText}>
                    {selectedMsgForAction?.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const msg = selectedMsgForAction!;
                    setSelectedMsgForAction(null);
                    setReplyingTo(msg);
                  }}
                  style={styles.actionSheetItem}
                >
                  <Reply size={18} color="#4F46E5" />
                  <Text style={styles.actionSheetItemText}>Trả lời</Text>
                </Pressable>

                {Boolean(selectedMsgForAction?.content) && (
                  <Pressable
                    onPress={() => {
                      Clipboard.setStringAsync(selectedMsgForAction!.content);
                      setSelectedMsgForAction(null);
                      Alert.alert('Thành công', 'Đã sao chép tin nhắn vào bộ nhớ tạm');
                    }}
                    style={styles.actionSheetItem}
                  >
                    <Copy size={18} color="#4F46E5" />
                    <Text style={styles.actionSheetItemText}>Sao chép nội dung</Text>
                  </Pressable>
                )}

                {selectedMsgForAction?.senderId === currentUserId &&
                  !selectedMsgForAction?.isRecalled && (
                    <Pressable
                      onPress={() => {
                        const msg = selectedMsgForAction!;
                        setSelectedMsgForAction(null);
                        handleRecall(msg.id);
                      }}
                      style={[styles.actionSheetItem, { borderBottomWidth: 0 }]}
                    >
                      <RotateCcw size={18} color="#EF4444" />
                      <Text style={[styles.actionSheetItemText, { color: '#EF4444' }]}>
                        Thu hồi tin nhắn
                      </Text>
                    </Pressable>
                  )}
              </View>
            </View>
          </Pressable>
        </Modal>
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
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 9999,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  headerStatusText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  pinnedBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#92400E',
    fontWeight: '500',
  },
  unpinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 8,
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  loadOlderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 14,
  },
  loadOlderText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyMessagesWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyMessagesText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  dateSeparatorWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 3,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageRowNormal: {
    marginBottom: 2,
  },
  messageRowLast: {
    marginBottom: 8,
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 2,
  },
  avatarSpacer: {
    width: 28,
    marginRight: 6,
  },
  bubbleWrap: {
    maxWidth: '78%',
  },
  bubbleWrapMe: {
    alignItems: 'flex-end',
  },
  bubbleWrapOther: {
    alignItems: 'flex-start',
  },
  senderNameLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    marginLeft: 4,
  },
  // Clean standalone image (no background color or borders)
  cleanImageCard: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  cleanImage: {
    width: 220,
    height: 200,
    borderRadius: 16,
  },
  cleanImageBadge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cleanImageBadgeTime: {
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Normal bubble
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    position: 'relative',
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
    marginTop: 3,
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
  // Reply quote block inside message bubble
  replyQuoteBox: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 3,
    marginBottom: 6,
    borderRadius: 4,
  },
  replyQuoteBoxMe: {
    borderLeftColor: '#60A5FA',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  replyQuoteBoxOther: {
    borderLeftColor: '#4F46E5',
    backgroundColor: '#F1F5F9',
  },
  replyQuoteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  replyQuoteText: {
    fontSize: 11,
    color: '#475569',
  },
  // Shared Post Card
  sharedPostCard: {
    borderRadius: 12,
    padding: 9,
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
    marginBottom: 5,
  },
  sharedPostAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  sharedPostAuthor: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  sharedPostSub: {
    fontSize: 9.5,
    color: '#64748B',
  },
  sharedPostBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sharedPostBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  sharedPostExcerpt: {
    fontSize: 11.5,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 15,
    marginBottom: 5,
  },
  sharedPostImg: {
    width: '100%',
    height: 85,
    borderRadius: 8,
  },
  // Clean file attachment card
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 8,
    gap: 8,
    marginBottom: 2,
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
    fontSize: 9.5,
    color: '#64748B',
  },
  // Reaction Badges pill
  reactionBadgeWrap: {
    position: 'absolute',
    bottom: -9,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    gap: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    zIndex: 10,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reactionBadgeEmoji: {
    fontSize: 12,
  },
  reactionBadgeCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  // Typing Indicator Bubble
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  typingDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4F46E5',
  },
  typingText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#475569',
  },
  // Replying Bar Preview above input
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
  },
  replyingLeftBar: {
    width: 3,
    height: 28,
    borderRadius: 1.5,
    backgroundColor: '#4F46E5',
    marginRight: 8,
  },
  replyingToTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
  replyingToExcerpt: {
    fontSize: 11,
    color: '#475569',
  },
  // Input Bar
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
  // Action Sheet on long-press
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  actionSheetContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  emojiReactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  emojiBtn: {
    padding: 4,
  },
  actionSheetMenu: {
    paddingTop: 4,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  actionSheetItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
});
