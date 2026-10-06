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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Send, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cleanAvatarUrl } from '../screens/SocialFeedScreen';
import { addPostCommentApi, CommunityPostDto } from '../../data/socialApi';

interface PostCommentModalProps {
  visible: boolean;
  post: CommunityPostDto | null;
  currentUserId: number;
  currentUserName: string;
  currentUserAvatar?: string;
  currentUserRole?: string;
  onClose: () => void;
  onCommentAdded: (postId: string, newComment: any) => void;
}

export const PostCommentModal: React.FC<PostCommentModalProps> = ({
  visible,
  post,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserRole,
  onClose,
  onCommentAdded,
}) => {
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!post) return null;

  const comments = Array.isArray(post.comments) ? post.comments : [];

  const formatCommentTime = (dateStr?: string) => {
    if (!dateStr) return 'Vừa xong';
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'Vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return 'Vừa xong';
    }
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    try {
      const roleText =
        currentUserRole === 'TEACHER'
          ? 'Giáo viên'
          : currentUserRole === 'ADMIN'
          ? 'Quản trị viên'
          : 'Học viên';

      const res = await addPostCommentApi(post.id, {
        authorId: currentUserId,
        authorName: currentUserName,
        authorAvatar: currentUserAvatar,
        authorRole: roleText,
        content: text,
      });

      const newCommentObj = {
        id: res?.id || `comment-${Date.now()}`,
        authorId: currentUserId,
        authorName: currentUserName,
        authorAvatar: currentUserAvatar,
        authorRole: roleText,
        content: text,
        createdAt: new Date().toISOString(),
      };

      onCommentAdded(post.id, newCommentObj);
      setCommentText('');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể gửi bình luận lúc này. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <View style={styles.headerTitleWrap}>
            <MessageSquare color="#0F172A" size={18} />
            <Text style={styles.headerTitle}>
              Bình luận ({comments.length})
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <X color="#64748B" size={20} />
          </Pressable>
        </View>

        {/* Post brief context */}
        <View style={styles.postContextBox}>
          <Text style={styles.postContextAuthor} numberOfLines={1}>
            Bài viết của {post.authorName || 'Người dùng'}
          </Text>
          <Text style={styles.postContextText} numberOfLines={2}>
            "{post.content}"
          </Text>
        </View>

        {/* Comment list */}
        <ScrollView
          style={styles.commentList}
          contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {comments.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Chưa có bình luận nào</Text>
              <Text style={styles.emptySub}>
                Hãy là người đầu tiên chia sẻ suy nghĩ về bài viết này nhé!
              </Text>
            </View>
          ) : (
            comments.map((c: any, idx: number) => {
              const isTeacher = (c.authorRole || '').toUpperCase().includes('GIÁO') || (c.authorRole || '').toUpperCase().includes('TEACHER');
              const isAdmin = (c.authorRole || '').toUpperCase().includes('QUẢN') || (c.authorRole || '').toUpperCase().includes('ADMIN');

              return (
                <View key={c.id || `c-${idx}`} style={styles.commentItem}>
                  <Image
                    source={{ uri: cleanAvatarUrl(c.authorAvatar) }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentBubble}>
                    <View style={styles.commentHeaderRow}>
                      <Text style={styles.commentAuthorName} numberOfLines={1}>
                        {c.authorName || 'Thành viên'}
                      </Text>
                      {isTeacher && (
                        <View style={styles.badgeTeacher}>
                          <Text style={styles.badgeTeacherText}>Giáo viên</Text>
                        </View>
                      )}
                      {isAdmin && (
                        <View style={styles.badgeAdmin}>
                          <Text style={styles.badgeAdminText}>Quản trị viên</Text>
                        </View>
                      )}
                      <Text style={styles.commentTime}>
                        {formatCommentTime(c.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{c.content}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Image
            source={{ uri: currentUserAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
            style={styles.inputMyAvatar}
          />
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Viết câu trả lời hoặc thảo luận..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
            multiline
            maxLength={1000}
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim() || submitting}
            style={[
              styles.sendBtn,
              (!commentText.trim() || submitting) && styles.sendBtnDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send color="#FFFFFF" size={16} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  postContextBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  postContextAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  postContextText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  commentList: {
    flex: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CBD5E1',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeTeacher: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  badgeTeacherText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeAdmin: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  badgeAdminText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  commentContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  inputMyAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
