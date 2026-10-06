import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Check,
  Plus,
  Heart,
  MessageSquare,
  Share2,
  Trophy,
  BookOpen,
  Clock,
  Globe,
  Users,
  History,
  Image as ImageIcon,
  Smile,
  Flame,
  Award,
  ChevronDown,
  X,
  MessageCircle,
  Sparkles,
  Send,
  UserCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/core/flows/authStore';
import { DatabaseLoader } from '@/src/components/ui/DatabaseLoader';
import { apiClient } from '@/src/core/api/client';
import {
  CommunityPostDto,
  ChatConversationDto,
  ChatMessageDto,
  FriendshipRequestDto,
  fetchCommunityPostsApi,
  createCommunityPostApi,
  togglePostLikeApi,
  fetchUserConversationsApi,
  fetchConversationMessagesApi,
  sendMessageApi,
  createDirectConversationApi,
  fetchFriendRequestsApi,
  fetchSentFriendRequestsApi,
  fetchFriendsApi,
  respondFriendRequestApi,
} from '../../data/socialApi';
import { PostImageViewerModal } from '../components/PostImageViewerModal';
import { PostCommentModal } from '../components/PostCommentModal';
import { SharePostModal } from '../components/SharePostModal';
import { ChatDetailModal } from '../components/ChatDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ActiveTab = 'feed' | 'messages' | 'requests';

interface SocialTabItem {
  key: ActiveTab;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const SOCIAL_TABS: SocialTabItem[] = [
  { key: 'feed', label: 'Cộng Đồng', icon: Globe },
  { key: 'messages', label: 'Tin Nhắn', icon: MessageCircle },
  { key: 'requests', label: 'Lời Mời', icon: UserPlus },
];

export const cleanAvatarUrl = (
  url?: string | null,
  fallback = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  const trimmed = url.trim();
  const mdMatch = trimmed.match(/\((https?:\/\/[^\)]+)\)/);
  if (mdMatch) return mdMatch[1];
  const urlMatch = trimmed.match(/https?:\/\/[^\s\)\'\"\]]+/);
  if (urlMatch) return urlMatch[0];
  return fallback;
};

const TEACHERS_LIST = [
  {
    id: 2,
    name: 'Thầy John Smith',
    role: 'Senior Instructor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
  {
    id: 3,
    name: 'Cô Hoàng Thị Mai',
    role: 'IELTS Speaking C2',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
  },
  {
    id: 1,
    name: 'Quản trị viên',
    role: 'Hỗ trợ học viên 24/7',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  },
];

export const SocialFeedScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const chatScrollRef = useRef<ScrollView>(null);

  const currentUserId = Number(currentUser?.id) || 1;
  const currentUserName = currentUser?.display_name || 'Học viên SmartEnglish';
  const currentUserAvatar = cleanAvatarUrl(currentUser?.avatar_url);
  const currentUserRole = (currentUser?.role || 'STUDENT').toUpperCase();

  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [feedSubTab, setFeedSubTab] = useState<'explore' | 'following'>('explore');
  const [requestsSubTab, setRequestsSubTab] = useState<'pending' | 'suggestions' | 'sent'>('pending');

  const [searchQuery, setSearchQuery] = useState('');

  // ─── 1. Feed State ───
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // ─── 2. Messages & Chat State ───
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversation, setActiveConversation] = useState<ChatConversationDto | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // ─── 3. Requests State ───
  const [pendingRequests, setPendingRequests] = useState<FriendshipRequestDto[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendshipRequestDto[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // ─── 4. Modals State ───
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [viewingImageCaption, setViewingImageCaption] = useState<string | null>(null);
  const [viewingImageAuthor, setViewingImageAuthor] = useState<string | null>(null);
  const [commentingPost, setCommentingPost] = useState<CommunityPostDto | null>(null);
  const [sharingPost, setSharingPost] = useState<CommunityPostDto | null>(null);

  // ─── Load Real Feed Posts ───
  const loadPosts = useCallback(async () => {
    try {
      const data = await fetchCommunityPostsApi(0, 20);
      setPosts(data);
      const initialLikes = new Set<string>();
      data.forEach((p: CommunityPostDto) => {
        if (p.likedUserIds && p.likedUserIds.includes(currentUserId)) {
          initialLikes.add(p.id);
        }
      });
      setLikedPostIds(initialLikes);
    } catch (err) {
      console.warn('loadPosts error:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, [currentUserId]);

  // ─── Load Real Conversations (Always includes Community Group) ───
  const loadConversations = useCallback(async () => {
    try {
      let list = await fetchUserConversationsApi(currentUserId);

      // Đảm bảo Nhóm học tập chung luôn hiển thị để học viên giao lưu cùng thầy cô
      const hasGroup = list.some((c) => c.type === 'GROUP' || c.id === '6aa25b62dedd11425c017e6a');
      if (!hasGroup) {
        try {
          const groupRes = await apiClient.get<any>('/api/v1/social/conversations/6aa25b62dedd11425c017e6a');
          const groupData = groupRes.data?.data || groupRes.data;
          if (groupData && groupData.id) {
            list = [groupData, ...list];
          }
        } catch {
          // Bỏ qua nếu không lấy được nhóm
        }
      }

      setConversations(list);
    } catch (err) {
      console.warn('loadConversations error:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUserId]);

  // ─── Load Real Friend Requests ───
  const loadRequests = useCallback(async () => {
    try {
      const [pending, sent, friends] = await Promise.all([
        fetchFriendRequestsApi(currentUserId),
        fetchSentFriendRequestsApi(currentUserId),
        fetchFriendsApi(currentUserId),
      ]);
      setPendingRequests(pending);
      setSentRequests(sent);
      setFriendsList(friends);
    } catch (err) {
      console.warn('loadRequests error:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadPosts();
    loadConversations();
    loadRequests();
  }, [loadPosts, loadConversations, loadRequests]);

  // Realtime Polling for Outside Conversations List
  useEffect(() => {
    if (activeTab === 'messages') {
      const timer = setInterval(() => {
        loadConversations();
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [activeTab, loadConversations]);



  const handleCommentAdded = (postId: string, newComment: any) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentCount = p.commentsCount ?? (p.comments ? p.comments.length : 0);
          return {
            ...p,
            commentsCount: currentCount + 1,
            comments: [...(p.comments || []), newComment],
          };
        }
        return p;
      })
    );
  };

  const handleNavigateToPost = (postId: string) => {
    setActiveConversation(null);
    setActiveTab('feed');
    const target = posts.find((p) => p.id === postId);
    if (target) {
      Alert.alert(
        'Đã chuyển đến bài viết',
        `Bài viết của ${target.authorName || 'Người dùng'}:\n"${target.content.slice(0, 80)}..."`
      );
    }
  };

  const formatLastMessage = (conv: ChatConversationDto) => {
    const raw = conv.lastMessage;
    if (!raw || raw === 'Bắt đầu cuộc trò chuyện') return 'Bắt đầu cuộc trò chuyện...';

    const isMe = conv.lastMessageSenderId === currentUserId;
    const isGroup = conv.type === 'GROUP';
    const prefix = isMe
      ? 'Bạn: '
      : isGroup && conv.lastMessageSenderName
      ? `${conv.lastMessageSenderName}: `
      : '';

    if (raw.startsWith('[Hình ảnh]')) return `${prefix}📷 [Hình ảnh]`;
    if (raw.startsWith('[Chia sẻ bài viết]') || raw.includes('chia sẻ một bài viết'))
      return `${prefix}🔗 [Đã chia sẻ một bài viết]`;
    if (raw.startsWith('[Tệp đính kèm]') || raw.startsWith('[Tệp]')) {
      const fileName = raw.replace(/^\[Tệp( đính kèm)?\]\s*/, '').trim();
      return fileName ? `${prefix}📄 [Tệp] ${fileName}` : `${prefix}📄 [Tệp đính kèm]`;
    }
    return `${prefix}${raw}`;
  };

  // ─── Action: Toggle Like ───
  const handleToggleLike = async (postId: string) => {
    const isCurrentlyLiked = likedPostIds.has(postId);
    const newLiked = !isCurrentlyLiked;

    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (newLiked) next.add(postId);
      else next.delete(postId);
      return next;
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentCount = p.likesCount || 0;
          return {
            ...p,
            likesCount: newLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
            likedUserIds: newLiked
              ? [...(p.likedUserIds || []), currentUserId]
              : (p.likedUserIds || []).filter((uid: number) => uid !== currentUserId),
          };
        }
        return p;
      })
    );

    await togglePostLikeApi(postId, currentUserId);
  };

  // ─── Action: Create Real Post ───
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung bài viết trước khi đăng.');
      return;
    }
    setIsSubmittingPost(true);
    try {
      const created = await createCommunityPostApi({
        authorId: currentUserId,
        authorName: currentUserName,
        authorEmail: currentUser?.email || undefined,
        authorAvatar: currentUserAvatar,
        authorRole: currentUserRole === 'TEACHER' ? 'Giáo viên' : currentUserRole === 'ADMIN' ? 'Quản trị viên' : 'Học viên',
        authorTitle: currentUserRole === 'TEACHER' ? 'Giáo viên SmartEnglish AI' : 'Thành viên SmartEnglish',
        content: newPostContent.trim(),
        tags: selectedTag ? [selectedTag] : ['SmartEnglish'],
      });

      if (created) {
        setPosts((prev) => [created, ...prev]);
        Alert.alert('Thành công', 'Bài viết của bạn đã được đăng lên cộng đồng! 🎉');
      } else {
        await loadPosts();
      }
      setNewPostContent('');
      setSelectedTag(null);
      setShowCreateModal(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể đăng bài viết lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // ─── Action: Open Real Chat ───
  const handleOpenConversation = async (conv: ChatConversationDto) => {
    setActiveConversation(conv);
    setLoadingMessages(true);
    try {
      const msgs = await fetchConversationMessagesApi(conv.id);
      setChatMessages(msgs);
    } catch {
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ─── Action: Quick Message Teacher ───
  const handleStartTeacherChat = async (teacher: typeof TEACHERS_LIST[0]) => {
    try {
      setLoadingConversations(true);
      const conv = await createDirectConversationApi({
        myId: currentUserId,
        myName: currentUserName,
        myAvatar: currentUserAvatar,
        friendId: teacher.id,
        friendName: teacher.name,
        friendAvatar: teacher.avatar,
      });
      if (conv) {
        await loadConversations();
        await handleOpenConversation(conv);
      }
    } catch {
      Alert.alert('Thông báo', 'Không thể kết nối trò chuyện với giáo viên lúc này.');
    } finally {
      setLoadingConversations(false);
    }
  };

  // ─── Action: Send Real Message ───
  const handleSendMessage = async () => {
    if (!chatInputText.trim() || !activeConversation || isSendingMessage) return;
    const text = chatInputText.trim();
    setChatInputText('');
    setIsSendingMessage(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessageDto = {
      id: tempId,
      conversationId: activeConversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      type: 'TEXT',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, tempMsg]);

    try {
      const sent = await sendMessageApi(activeConversation.id, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        content: text,
        type: 'TEXT',
      });

      if (sent) {
        setChatMessages((prev) => prev.map((m) => (m.id === tempId ? sent : m)));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch {
      Alert.alert('Lỗi', 'Gửi tin nhắn không thành công.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // ─── Action: Respond Friend Request ───
  const handleAcceptRequest = async (friendshipId: string) => {
    const ok = await respondFriendRequestApi({
      friendshipId,
      currentUserId,
      accept: true,
    });
    if (ok) {
      setPendingRequests((prev) =>
        prev.map((r) => (r.id === friendshipId ? { ...r, status: 'ACCEPTED' } : r))
      );
      loadRequests();
      loadConversations();
    } else {
      Alert.alert('Lỗi', 'Không thể xử lý yêu cầu kết bạn lúc này.');
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    const ok = await respondFriendRequestApi({
      friendshipId,
      currentUserId,
      accept: false,
    });
    if (ok) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    }
  };

  // ─── Helper: Format Time ───
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'Vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const displayedPosts = posts.filter((p) => {
    if (feedSubTab === 'following') {
      const roleUpper = (p.authorRole || '').toUpperCase();
      return roleUpper.includes('GIÁO') || roleUpper.includes('TEACHER') || roleUpper.includes('ADMIN');
    }
    return true;
  });

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const lastMsg = (c.lastMessage || '').toLowerCase();
    return name.includes(q) || lastMsg.includes(q);
  });

  return (
    <View style={s.root}>
      {/* Community Main Navigation Bar — Capsule Track matching Learn tab */}
      <View style={[s.switcherBar, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
        <View style={s.topNavRow}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(student)/home');
              }
            }}
            hitSlop={10}
            style={s.backBtn}
          >
            <ArrowLeft size={20} color="#334155" strokeWidth={2.5} />
          </Pressable>

          <View style={s.capsuleTrack}>
            {SOCIAL_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const IconComp = tab.icon;
            const pendingCount =
              tab.key === 'requests'
                ? pendingRequests.filter((r) => r.status === 'PENDING').length
                : 0;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[s.tabBtn, isActive ? s.tabBtnActive : s.tabBtnInactive]}
              >
                {isActive && (
                  <LinearGradient
                    colors={['#1E1B4B', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.activePillBackground}
                  />
                )}
                <View style={s.tabContentRow}>
                  <View style={{ position: 'relative' }}>
                    <IconComp
                      size={17}
                      color={isActive ? '#FFFFFF' : '#64748B'}
                    />
                    {pendingCount > 0 && !isActive && (
                      <View style={s.tabBadgeDot} />
                    )}
                  </View>
                  {isActive && (
                    <Text
                      style={[s.tabLabel, s.tabLabelActive]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  )}
                  {pendingCount > 0 && isActive && (
                    <View style={s.tabBadgeCount}>
                      <Text style={s.tabBadgeCountText}>{pendingCount}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
        </View>
      </View>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: BẢNG TIN CỘNG ĐỒNG (FEED REAL DATA) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <View style={{ flex: 1 }}>
          <View style={s.subTabsRow}>
            <Pressable
              onPress={() => setFeedSubTab('explore')}
              style={[s.subTabItem, feedSubTab === 'explore' && s.subTabItemActive]}
            >
              <Text style={[s.subTabText, feedSubTab === 'explore' && s.subTabTextActive]}>
                Khám phá
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFeedSubTab('following')}
              style={[s.subTabItem, feedSubTab === 'following' && s.subTabItemActive]}
            >
              <Text style={[s.subTabText, feedSubTab === 'following' && s.subTabTextActive]}>
                Giáo viên & Quản trị
              </Text>
            </Pressable>
          </View>

          {loadingPosts ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <DatabaseLoader size="sm" message="Đang tải..." />
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {displayedPosts.length === 0 ? (
                <View style={s.emptyBox}>
                  <Globe color="#94A3B8" size={40} />
                  <Text style={s.emptyTitle}>Chưa có bài viết nào</Text>
                  <Text style={s.emptySub}>Hãy là người đầu tiên chia sẻ cảm nghĩ hoặc tài liệu nhé!</Text>
                </View>
              ) : (
                displayedPosts.map((post, index) => {
                  const isLiked = likedPostIds.has(post.id);
                  const isTeacher = (post.authorRole || '').toUpperCase().includes('GIÁO') || (post.authorRole || '').toUpperCase().includes('TEACHER');
                  const isAdmin = (post.authorRole || '').toUpperCase().includes('QUẢN') || (post.authorRole || '').toUpperCase().includes('ADMIN');

                  return (
                    <Animated.View
                      key={post.id || `post-${index}`}
                      entering={FadeInDown.delay(index * 60)}
                      style={s.postCard}
                    >
                      <View style={s.postHeader}>
                        {post.authorAvatar ? (
                          <Image
                            source={{ uri: cleanAvatarUrl(post.authorAvatar) }}
                            style={s.postAvatar}
                          />
                        ) : (
                          <View style={s.avatarLetterBg}>
                            <Text style={s.avatarLetter}>
                              {(post.authorName || 'S').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={s.postAuthor}>{post.authorName || 'Người dùng SmartEnglish'}</Text>
                          <Text style={s.postTime}>{formatTimeAgo(post.createdAt)}</Text>
                        </View>

                        {isTeacher && (
                          <View style={s.badgeSharedDeck}>
                            <BookOpen color="#0369A1" size={12} />
                            <Text style={s.badgeSharedDeckText}>Giáo viên</Text>
                          </View>
                        )}
                        {isAdmin && (
                          <View style={s.badgeAchievement}>
                            <Award color="#B45309" size={12} />
                            <Text style={s.badgeAchievementText}>Quản trị viên</Text>
                          </View>
                        )}
                      </View>

                      <Text style={s.postContent}>{post.content}</Text>

                      {post.mediaUrl && (
                        <Pressable
                          onPress={() => {
                            setViewingImageUrl(cleanAvatarUrl(post.mediaUrl));
                            setViewingImageCaption(post.mediaCaption || post.content);
                            setViewingImageAuthor(post.authorName || null);
                          }}
                          style={s.achievementGraphicBox}
                        >
                          <Image
                            source={{ uri: cleanAvatarUrl(post.mediaUrl) }}
                            style={s.achievementGraphicImg}
                            resizeMode="cover"
                          />
                          {post.mediaCaption && (
                            <View style={s.achievementOverlay}>
                              <Text style={s.achievementSub}>{post.mediaCaption}</Text>
                            </View>
                          )}
                        </Pressable>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <View style={s.tagsRow}>
                          {post.tags.map((t: string, tIdx: number) => (
                            <View key={tIdx} style={s.tagPill}>
                              <Text style={s.tagPillText}>#{t}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={s.postFooter}>
                        <Pressable onPress={() => handleToggleLike(post.id)} style={s.actionBtn}>
                          <Heart
                            color={isLiked ? '#EF4444' : '#64748B'}
                            fill={isLiked ? '#EF4444' : 'none'}
                            size={18}
                          />
                          <Text style={[s.actionText, isLiked && { color: '#EF4444', fontWeight: '700' }]}>
                            {post.likesCount || 0}
                          </Text>
                        </Pressable>

                        <Pressable onPress={() => setCommentingPost(post)} style={s.actionBtn}>
                          <MessageSquare color="#64748B" size={18} />
                          <Text style={s.actionText}>
                            {post.commentsCount ?? (post.comments ? post.comments.length : 0)}
                          </Text>
                        </Pressable>

                        <Pressable onPress={() => setSharingPost(post)} style={s.actionBtn}>
                          <Share2 color="#64748B" size={18} />
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })
              )}
              <View style={{ height: 80 }} />
            </ScrollView>
          )}

          <Pressable onPress={() => setShowCreateModal(true)} style={s.fabBtn}>
            <Plus color="#FFFFFF" size={26} />
          </Pressable>
        </View>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: TIN NHẮN (MESSAGES SYSTEM) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Search Box */}
          <View style={s.searchBox}>
            <Search color="#94A3B8" size={18} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm kiếm tin nhắn, bạn học..."
              placeholderTextColor="#94A3B8"
              style={s.searchInput}
            />
          </View>

          {loadingConversations ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <DatabaseLoader size="sm" message="Đang tải..." />
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1, backgroundColor: '#FFFFFF' }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ paddingHorizontal: 16, marginBottom: 4, marginTop: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>
                  Hội thoại ({filteredConversations.length})
                </Text>
              </View>

              {filteredConversations.length === 0 ? (
                <View style={s.emptyBox}>
                  <MessageCircle color="#94A3B8" size={40} />
                  <Text style={s.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
                  <Text style={s.emptySub}>
                    Hãy bắt đầu trao đổi bài tập hoặc giải đáp thắc mắc cùng bạn bè nhé!
                  </Text>
                </View>
              ) : (
                filteredConversations.map((conv, idx) => {
                  const isGroup = conv.type === 'GROUP';
                  const displayName = conv.name || (isGroup ? 'Nhóm học tập IELTS 7.0+' : 'Bạn học SmartEnglish');
                  const avatarUrl = cleanAvatarUrl(
                    conv.avatar,
                    isGroup
                      ? 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200'
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                  );

                  return (
                    <Animated.View
                      key={conv.id || idx}
                      entering={FadeInRight.delay(idx * 40)}
                      style={s.chatItemWrapper}
                    >
                      <Pressable
                        onPress={() => handleOpenConversation(conv)}
                        style={({ pressed }) => [
                          s.chatItemPressable,
                          pressed && s.chatItemPressed,
                        ]}
                      >
                        <View style={s.chatItemRow}>
                          {/* Avatar with bottom-right online dot intersecting circle */}
                          <View style={s.chatAvatarWrap}>
                            <Image source={{ uri: avatarUrl }} style={s.chatAvatar} />
                            <View style={s.chatOnlineDot} />
                          </View>

                          {/* Info: Row 1 (Name + Time) & Row 2 (Last Msg + Unread) */}
                          <View style={s.chatInfoWrap}>
                            <View style={s.chatNameRow}>
                              <Text style={s.chatNameText} numberOfLines={1} ellipsizeMode="tail">
                                {displayName}
                              </Text>
                              <Text style={s.chatTimeText}>{formatTimeAgo(conv.lastMessageAt)}</Text>
                            </View>

                            <View style={s.chatLastMsgRow}>
                              <Text
                                style={[
                                  s.chatLastMsgText,
                                  (conv.unreadCount || 0) > 0 && s.chatLastMsgUnread,
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {formatLastMessage(conv)}
                              </Text>
                              {(conv.unreadCount || 0) > 0 && (
                                <View style={s.chatUnreadBadge}>
                                  <Text style={s.chatUnreadText}>{conv.unreadCount}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: LỜI MỜI KẾT BẠN (REQUESTS REAL DATA) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <View style={{ flex: 1 }}>
          <View style={s.reqHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.reqTitle}>Lời mời kết bạn</Text>
              <View style={s.reqBadgeCount}>
                <Text style={s.reqBadgeCountText}>
                  {pendingRequests.filter((r) => r.status === 'PENDING').length}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={loadRequests}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <History color="#4F46E5" size={16} />
              <Text style={s.reqHistoryText}>Làm mới</Text>
            </Pressable>
          </View>

          <View style={s.chipsRow}>
            <Pressable
              onPress={() => setRequestsSubTab('pending')}
              style={[s.chipPill, requestsSubTab === 'pending' && s.chipPillActive]}
            >
              <Text style={[s.chipPillText, requestsSubTab === 'pending' && s.chipPillTextActive]}>
                Đang chờ ({pendingRequests.filter((r) => r.status === 'PENDING').length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRequestsSubTab('suggestions')}
              style={[s.chipPill, requestsSubTab === 'suggestions' && s.chipPillActive]}
            >
              <Text style={[s.chipPillText, requestsSubTab === 'suggestions' && s.chipPillTextActive]}>
                Bạn bè ({friendsList.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRequestsSubTab('sent')}
              style={[s.chipPill, requestsSubTab === 'sent' && s.chipPillActive]}
            >
              <Text style={[s.chipPillText, requestsSubTab === 'sent' && s.chipPillTextActive]}>
                Đã gửi ({sentRequests.length})
              </Text>
            </Pressable>
          </View>

          {loadingRequests ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <DatabaseLoader size="sm" message="Đang tải..." />
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {requestsSubTab === 'pending' && (
                pendingRequests.length === 0 ? (
                  <View style={s.emptyBox}>
                    <UserCheck color="#94A3B8" size={40} />
                    <Text style={s.emptyTitle}>Không có lời mời nào</Text>
                    <Text style={s.emptySub}>Hiện tại bạn không có lời mời kết bạn nào đang chờ.</Text>
                  </View>
                ) : (
                  pendingRequests.map((req, idx) => (
                    <Animated.View key={req.id || idx} entering={FadeInDown.delay(idx * 60)} style={s.reqCard}>
                      {req.status === 'ACCEPTED' ? (
                        <View style={s.acceptedCardInner}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <View style={{ position: 'relative' }}>
                              <Image
                                source={{ uri: cleanAvatarUrl(req.requesterAvatar) }}
                                style={s.reqAvatar}
                              />
                              <View style={s.acceptedCheckBadge}>
                                <Check color="#FFFFFF" size={10} strokeWidth={3} />
                              </View>
                            </View>
                            <View>
                              <Text style={s.reqName}>{req.requesterName}</Text>
                              <Text style={s.acceptedSuccessText}>Đã trở thành bạn bè!</Text>
                            </View>
                          </View>

                          <Pressable
                            onPress={() => setActiveTab('messages')}
                            style={s.chatWithFriendBtn}
                          >
                            <MessageCircle color="#4F46E5" size={16} />
                            <Text style={s.chatWithFriendBtnText}>Nhắn tin</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <View style={{ position: 'relative' }}>
                              <Image
                                source={{ uri: cleanAvatarUrl(req.requesterAvatar) }}
                                style={s.reqAvatar}
                              />
                              <View style={[s.onlineStatusDot, { backgroundColor: '#22C55E' }]} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.reqName}>{req.requesterName}</Text>
                              <Text style={s.reqLevelSub}>Học viên SmartEnglish</Text>
                              <Text style={s.reqTimeText}>{formatTimeAgo(req.createdAt)}</Text>
                            </View>
                          </View>

                          <View style={s.reqDualActionRow}>
                            <Pressable
                              onPress={() => handleAcceptRequest(req.id)}
                              style={s.acceptBtn}
                            >
                              <Text style={s.acceptBtnText}>Chấp nhận</Text>
                            </Pressable>

                            <Pressable
                              onPress={() => handleDeclineRequest(req.id)}
                              style={s.declineBtn}
                            >
                              <Text style={s.declineBtnText}>Từ chối</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </Animated.View>
                  ))
                )
              )}

              {requestsSubTab === 'suggestions' && (
                friendsList.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Users color="#94A3B8" size={40} />
                    <Text style={s.emptyTitle}>Chưa có bạn bè</Text>
                    <Text style={s.emptySub}>Kết nối với các bạn học viên khác để cùng nhau tiến bộ!</Text>
                  </View>
                ) : (
                  friendsList.map((f, idx) => {
                    const friendName = f.requesterId === currentUserId ? f.addresseeName : f.requesterName;
                    const friendAvatar = f.requesterId === currentUserId ? f.addresseeAvatar : f.requesterAvatar;
                    return (
                      <Animated.View key={f.id || idx} entering={FadeInDown.delay(idx * 60)} style={s.reqCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Image
                            source={{ uri: cleanAvatarUrl(friendAvatar) }}
                            style={s.reqAvatar}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={s.reqName}>{friendName || 'Bạn học'}</Text>
                            <Text style={s.reqLevelSub}>Đã kết nối bạn bè</Text>
                            <Text style={s.reqTimeText}>{formatTimeAgo(f.createdAt)}</Text>
                          </View>
                          <Pressable
                            onPress={() => setActiveTab('messages')}
                            style={{
                              backgroundColor: '#EEF2FF',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 12,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <MessageCircle color="#4F46E5" size={15} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>Nhắn tin</Text>
                          </Pressable>
                        </View>
                      </Animated.View>
                    );
                  })
                )
              )}

              {requestsSubTab === 'sent' && (
                sentRequests.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Send color="#94A3B8" size={40} />
                    <Text style={s.emptyTitle}>Không có yêu cầu đã gửi</Text>
                    <Text style={s.emptySub}>Bạn chưa gửi lời mời kết bạn nào.</Text>
                  </View>
                ) : (
                  sentRequests.map((sReq, idx) => (
                    <Animated.View key={sReq.id || idx} entering={FadeInDown.delay(idx * 60)} style={s.reqCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Image
                          source={{ uri: cleanAvatarUrl(sReq.requesterAvatar) }}
                          style={s.reqAvatar}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={s.reqName}>{sReq.addresseeName || 'Người nhận'}</Text>
                          <Text style={s.reqLevelSub}>Đang chờ phản hồi...</Text>
                          <Text style={s.reqTimeText}>{formatTimeAgo(sReq.createdAt)}</Text>
                        </View>
                        <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>Đang chờ</Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))
                )
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: TẠO BÀI VIẾT THẬT (CREATE REAL POST) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal visible={showCreateModal} animationType="slide" transparent={false}>
        <View style={s.modalRoot}>
          <View style={[s.modalHeader, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Text style={s.modalCancelText}>Hủy</Text>
            </Pressable>
            <Text style={s.modalTitle}>Tạo bài viết</Text>
            <Pressable
              onPress={handleCreatePost}
              disabled={isSubmittingPost}
              style={[s.modalSubmitBtn, isSubmittingPost && { opacity: 0.6 }]}
            >
              {isSubmittingPost ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={s.modalSubmitText}>Đăng</Text>
              )}
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <View style={s.createUserRow}>
              <Image source={{ uri: currentUserAvatar }} style={s.createAvatar} />
              <View>
                <Text style={s.createAuthorName}>{currentUserName}</Text>
                <View style={s.privacyDropdownBtn}>
                  <Globe color="#475569" size={12} />
                  <Text style={s.privacyDropdownText}>Công khai cộng đồng</Text>
                  <ChevronDown color="#475569" size={12} />
                </View>
              </View>
            </View>

            <TextInput
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
              placeholder="Bạn muốn chia sẻ điều gì về lộ trình học hôm nay?"
              placeholderTextColor="#94A3B8"
              style={s.createTextInput}
              autoFocus
            />

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 10 }}>
                Chủ đề bài viết
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {['IELTS_Tips', 'WritingTips', 'Vocabulary', 'Speaking', 'Achievement'].map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    style={[
                      s.tagSelectBtn,
                      selectedTag === tag && s.tagSelectBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        s.tagSelectBtnText,
                        selectedTag === tag && s.tagSelectBtnTextActive,
                      ]}
                    >
                      #{tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={s.sectionWrap}>
              <View style={s.sectionHeaderRow}>
                <Trophy color="#D97706" size={16} />
                <Text style={s.sectionHeaderTitle}>Khoe thành tích gần đây</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <Pressable
                  onPress={() => {
                    setNewPostContent((prev) => `${prev}\n🔥 Tôi vừa hoàn thành chuỗi streak 30 ngày học liên tục trên SmartEnglish AI!`.trim());
                    setSelectedTag('Achievement');
                  }}
                  style={s.achieveCard}
                >
                  <View style={s.achieveIconBg}><Flame color="#F97316" size={20} /></View>
                  <View>
                    <Text style={s.achieveCardTitle}>Chuỗi 30 Ngày</Text>
                    <Text style={s.achieveCardSub}>Chạm để đính kèm vào bài viết</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setNewPostContent((prev) => `${prev}\n🏆 Mình vừa đạt mục tiêu B2 sau bài thi Toeic Placement Test!`.trim());
                    setSelectedTag('Achievement');
                  }}
                  style={s.achieveCard}
                >
                  <View style={[s.achieveIconBg, { backgroundColor: '#FEF3C7' }]}><Award color="#D97706" size={20} /></View>
                  <View>
                    <Text style={s.achieveCardTitle}>Chinh phục B2</Text>
                    <Text style={s.achieveCardSub}>Chạm để đính kèm vào bài viết</Text>
                  </View>
                </Pressable>
              </ScrollView>
            </View>

            <View style={s.sectionWrap}>
              <View style={s.sectionHeaderRow}>
                <BookOpen color="#4F46E5" size={16} />
                <Text style={s.sectionHeaderTitle}>Chia sẻ bộ thẻ từ vựng</Text>
              </View>

              <View style={s.deckGridRow}>
                <Pressable
                  onPress={() => {
                    setNewPostContent((prev) => `${prev}\n📚 Mình vừa chia sẻ bộ thẻ IELTS Vocabulary 2024 (50 từ vựng cốt lõi), mời các bạn cùng ôn luyện!`.trim());
                    setSelectedTag('Vocabulary');
                  }}
                  style={s.deckCard}
                >
                  <View style={s.deckHeaderRow}>
                    <View style={s.deckIconBox}><Sparkles color="#4F46E5" size={16} /></View>
                    <View style={s.deckCountBadge}><Text style={s.deckCountText}>50 từ</Text></View>
                  </View>
                  <Text style={s.deckTitle}>IELTS Vocabulary 2024</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setNewPostContent((prev) => `${prev}\n💬 Chia sẻ bộ từ vựng Giao tiếp hàng ngày (120 từ phản xạ nhanh), chúc các bạn học tốt!`.trim());
                    setSelectedTag('Vocabulary');
                  }}
                  style={s.deckCard}
                >
                  <View style={s.deckHeaderRow}>
                    <View style={[s.deckIconBox, { backgroundColor: '#D1FAE5' }]}><MessageCircle color="#10B981" size={16} /></View>
                    <View style={s.deckCountBadge}><Text style={s.deckCountText}>120 từ</Text></View>
                  </View>
                  <Text style={s.deckTitle}>Giao tiếp hàng ngày</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={s.createBottomBar}>
            <Pressable style={s.toolIconBtn}><ImageIcon color="#10B981" size={22} /></Pressable>
            <Pressable style={s.toolIconBtn}><Smile color="#F59E0B" size={22} /></Pressable>
            <Pressable style={s.toolIconBtn}><Trophy color="#D97706" size={22} /></Pressable>
            <Pressable style={s.toolIconBtn}><BookOpen color="#4F46E5" size={22} /></Pressable>
          </View>
        </View>
      </Modal>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: CHI TIẾT CUỘC TRÒ CHUYỆN (FULL REALTIME + AVATAR GROUPING + ATTACHMENTS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <ChatDetailModal
        visible={Boolean(activeConversation)}
        conversation={activeConversation}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        onClose={() => setActiveConversation(null)}
        onConversationUpdated={(convId, lastMsg) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    lastMessage: lastMsg,
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 0,
                  }
                : c
            )
          );
        }}
        onNavigateToPost={handleNavigateToPost}
        onViewImage={(url) => {
          setViewingImageUrl(url);
          setViewingImageCaption(null);
          setViewingImageAuthor('Hình ảnh đính kèm');
        }}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: XEM ẢNH BÀI VIẾT PHÓNG TO */}
      {/* ───────────────────────────────────────────────────────────── */}
      <PostImageViewerModal
        visible={Boolean(viewingImageUrl)}
        imageUrl={viewingImageUrl}
        caption={viewingImageCaption}
        authorName={viewingImageAuthor || undefined}
        onClose={() => setViewingImageUrl(null)}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: BÌNH LUẬN BÀI VIẾT */}
      {/* ───────────────────────────────────────────────────────────── */}
      <PostCommentModal
        visible={Boolean(commentingPost)}
        post={commentingPost}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        currentUserRole={currentUserRole}
        onClose={() => setCommentingPost(null)}
        onCommentAdded={handleCommentAdded}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: CHIA SẺ BÀI VIẾT (COPY LINK & GỬI VÀO HỘI THOẠI) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <SharePostModal
        visible={Boolean(sharingPost)}
        post={sharingPost}
        conversations={conversations}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        onClose={() => setSharingPost(null)}
        onPostShared={() => {
          loadConversations();
        }}
        onOpenConversation={(conv) => {
          handleOpenConversation(conv);
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAF9' },
  switcherBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  capsuleTrack: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 20,
    position: 'relative',
  },
  tabBtn: {
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tabBtnActive: {
    flex: 1.6,
  },
  tabBtnInactive: {
    flex: 1,
  },
  activePillBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  tabBadgeCount: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  tabBadgeCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 20,
  },
  subTabItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabItemActive: { borderBottomColor: '#1E3A5F' },
  subTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  subTabTextActive: { fontWeight: '800', color: '#1E3A5F' },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  avatarLetterBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#818CF8', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  postAuthor: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  postTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 1 },
  badgeAchievement: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeAchievementText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  badgeSharedDeck: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeSharedDeckText: { fontSize: 10, fontWeight: '700', color: '#0369A1' },
  postContent: { fontSize: 13.5, color: '#334155', lineHeight: 21, fontWeight: '400', marginBottom: 12 },
  achievementGraphicBox: { height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  achievementGraphicImg: { width: '100%', height: '100%' },
  achievementOverlay: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  achievementSub: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tagPill: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagPillText: { fontSize: 11, fontWeight: '600', color: '#4F46E5' },
  postFooter: { flexDirection: 'row', gap: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  // Empty State
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19 },

  // Teachers quick row
  teachersSectionWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  teachersSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  teachersRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  teacherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  teacherAvatarWrap: { position: 'relative' },
  teacherAvatar: { width: 34, height: 34, borderRadius: 17 },
  teacherOnlineDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#22C55E', position: 'absolute', bottom: 0, right: 0, borderWidth: 1.5, borderColor: '#FFFFFF' },
  teacherNameText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  teacherRoleText: { fontSize: 10, color: '#64748B' },
  teacherChatIconBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },

  // Messages & Chat Styles
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1E293B' },
  chatItemWrapper: {
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  chatItemPressable: {
    borderRadius: 8,
  },
  chatItemPressed: {
    backgroundColor: '#F8FAFC',
  },
  chatItemRow: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatarWrap: {
    position: 'relative',
    width: 52,
    height: 52,
    marginRight: 14,
    flexShrink: 0,
  },
  chatAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E2E8F0' },
  chatOnlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  chatInfoWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'center',
  },
  chatNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
  },
  chatTimeText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
    flexShrink: 0,
  },
  chatLastMsgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMsgText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  chatLastMsgUnread: { color: '#0F172A', fontWeight: '700' },
  chatUnreadBadge: {
    backgroundColor: '#2563EB',
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    flexShrink: 0,
  },
  chatUnreadText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },

  // Chat Detail Modal Styles
  chatDetailHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  chatDetailName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  chatDetailStatus: { fontSize: 11, color: '#64748B', marginTop: 2 },
  chatDetailAvatar: { width: 38, height: 38, borderRadius: 19 },
  chatBubbleWrap: { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  chatBubbleWrapMe: { justifyContent: 'flex-end' },
  chatBubbleWrapOther: { justifyContent: 'flex-start' },
  chatBubbleSenderAvatar: { width: 28, height: 28, borderRadius: 14, marginBottom: 2 },
  chatBubble: { maxWidth: '78%', padding: 12, borderRadius: 18 },
  chatBubbleMe: { backgroundColor: '#4F46E5', borderBottomRightRadius: 4 },
  chatBubbleOther: { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  chatBubbleSenderName: { fontSize: 11, fontWeight: '700', color: '#4F46E5', marginBottom: 2 },
  chatBubbleText: { fontSize: 13.5, lineHeight: 19 },
  chatBubbleTextMe: { color: '#FFFFFF' },
  chatBubbleTextOther: { color: '#1E293B' },
  chatBubbleTime: { fontSize: 9.5, marginTop: 4, alignSelf: 'flex-end' },
  chatBubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  chatBubbleTimeOther: { color: '#94A3B8' },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#1E293B',
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Requests Section Styles
  reqHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 14, marginBottom: 12 },
  reqTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  reqBadgeCount: { backgroundColor: '#4F46E5', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  reqBadgeCountText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  reqHistoryText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  chipPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  chipPillActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipPillText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  chipPillTextActive: { color: '#FFFFFF' },
  reqCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reqAvatar: { width: 48, height: 48, borderRadius: 24 },
  onlineStatusDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#FFFFFF' },
  reqName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  reqLevelSub: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  reqTimeText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  reqDualActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptBtn: { flex: 1, backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  declineBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  declineBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  acceptedCardInner: { backgroundColor: '#F0F9FF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  acceptedCheckBadge: { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center' },
  acceptedSuccessText: { fontSize: 12, fontWeight: '700', color: '#0EA5E9', marginTop: 2 },
  chatWithFriendBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#C7D2FE' },
  chatWithFriendBtnText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },

  // Create Post Modal Styles
  modalRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  modalSubmitBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 100 },
  modalSubmitText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  createUserRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  createAvatar: { width: 44, height: 44, borderRadius: 22 },
  createAuthorName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  privacyDropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  privacyDropdownText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  createTextInput: { fontSize: 15, color: '#1E293B', height: 100, textAlignVertical: 'top', marginBottom: 16 },
  tagSelectBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  tagSelectBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  tagSelectBtnText: { fontSize: 11.5, fontWeight: '600', color: '#64748B' },
  tagSelectBtnTextActive: { color: '#4F46E5', fontWeight: '700' },
  sectionWrap: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  achieveCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', marginRight: 10, width: 220 },
  achieveIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' },
  achieveCardTitle: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  achieveCardSub: { fontSize: 10, color: '#B45309', marginTop: 1 },
  deckGridRow: { flexDirection: 'row', gap: 10 },
  deckCard: { flex: 1, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  deckHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  deckIconBox: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  deckCountBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  deckCountText: { fontSize: 9, fontWeight: '700', color: '#64748B' },
  deckTitle: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  createBottomBar: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 20 },
  toolIconBtn: { padding: 4 },
});
