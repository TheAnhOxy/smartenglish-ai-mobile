import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  sendPresenceHeartbeatApi,
  sendPresenceOfflineApi,
  fetchOnlineUsersApi,
  createGroupConversationApi,
  sendFriendRequestApi,
  fetchUsersForCommunityApi,
  markConversationAsReadApi,
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
  fallback = ''
): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  let s = url.trim();
  if (s.includes('unsplash.com')) return fallback;
  const mdMatch = s.match(/\((https?:\/\/[^\s)]+)\)/) || s.match(/(https?:\/\/[^\s\])]+)/);
  if (mdMatch) s = mdMatch[1];
  if (s.includes('unsplash.com')) return fallback;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('/')) {
    return s;
  }
  return fallback;
};

const TEACHERS_LIST = [
  {
    id: 2,
    name: 'Thầy John Smith',
    role: 'Senior Instructor',
    avatar: undefined,
  },
  {
    id: 3,
    name: 'Cô Hoàng Thị Mai',
    role: 'IELTS Speaking C2',
    avatar: undefined,
  },
  {
    id: 1,
    name: 'Quản trị viên',
    role: 'Hỗ trợ học viên 24/7',
    avatar: undefined,
  },
];

export const SocialFeedScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const chatScrollRef = useRef<ScrollView>(null);

  const currentUserId = Number(currentUser?.id) || 1;
  const currentUserName = currentUser?.display_name || 'Học viên SmartEnglish';
  const currentUserAvatar = cleanAvatarUrl(currentUser?.avatar_url) || undefined;
  const currentUserRole = (currentUser?.role || 'STUDENT').toUpperCase();

  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [feedSubTab, setFeedSubTab] = useState<'explore' | 'following'>('explore');
  const [requestsSubTab, setRequestsSubTab] = useState<'pending' | 'suggestions' | 'friends' | 'sent'>('pending');

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
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  // ─── 3. Requests State ───
  const [pendingRequests, setPendingRequests] = useState<FriendshipRequestDto[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendshipRequestDto[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // ─── 4. Community Users & Group Creation State ───
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<Set<number>>(new Set());
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<Set<number>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [sendingFriendRequestId, setSendingFriendRequestId] = useState<number | null>(null);

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
          const groupRes = await apiClient.get<any>(`/api/v1/social/conversations/6aa25b62dedd11425c017e6a?userId=${currentUserId}`);
          const groupData = groupRes.data?.data || groupRes.data;
          if (groupData && groupData.id) {
            list = [groupData, ...list];
          }
        } catch {
          // Bỏ qua nếu không lấy được nhóm
        }
      }

      setConversations(list);
      // Preload messages cho 5 cuộc hội thoại đầu để khi nhấn vào mở tức thì 0ms, không lag/chờ tải
      if (Array.isArray(list) && list.length > 0) {
        list.slice(0, 5).forEach((conv) => {
          if (conv.id) {
            fetchConversationMessagesApi(conv.id, currentUserId).catch(() => {});
          }
        });
      }
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
      setSentRequestIds(new Set(sent.map((s: any) => Number(s.addresseeId))));
    } catch (err) {
      console.warn('loadRequests error:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [currentUserId]);

  // ─── Load Real Community Users ───
  const loadCommunityUsers = useCallback(async () => {
    try {
      const users = await fetchUsersForCommunityApi();
      setCommunityUsers(users);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadConversations();
    loadRequests();
    loadCommunityUsers();
  }, [loadPosts, loadConversations, loadRequests, loadCommunityUsers]);

  // Realtime Polling for Conversations List & Friend Requests
  useEffect(() => {
    const timer = setInterval(() => {
      loadConversations();
      loadRequests();
    }, 3000);
    return () => clearInterval(timer);
  }, [loadConversations, loadRequests]);

  // ─── Realtime Presence: Heartbeat & Online Users Sync ───
  useEffect(() => {
    if (!currentUserId) return;
    let active = true;

    const syncPresence = async () => {
      try {
        const [onlineList] = await Promise.all([
          fetchOnlineUsersApi(),
          sendPresenceHeartbeatApi(currentUserId),
        ]);
        if (!active) return;
        const newSet = new Set<number>(onlineList);
        newSet.add(currentUserId);
        setOnlineUserIds(newSet);
      } catch {
        // ignore
      }
    };

    syncPresence();
    const presenceTimer = setInterval(syncPresence, 3000);

    return () => {
      active = false;
      clearInterval(presenceTimer);
      sendPresenceOfflineApi(currentUserId).catch(() => {});
    };
  }, [currentUserId]);



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
    const isGroup = conv.type === 'GROUP';
    const otherMember = !isGroup
      ? conv.members?.find((m) => Number(m.userId) !== currentUserId)
      : null;
    const otherUserId = Number(
      otherMember?.userId ||
        (!isGroup ? conv.memberIds?.find((id) => Number(id) !== currentUserId) : null) ||
        conv.participantId
    );
    const matchedUser = otherUserId
      ? communityUsers.find((u: any) => Number(u.id) === otherUserId)
      : null;

    const resolvedAvatar = isGroup
      ? cleanAvatarUrl(conv.avatar)
      : (cleanAvatarUrl(matchedUser?.avatarUrl || matchedUser?.avatar_url || matchedUser?.avatar) ||
         cleanAvatarUrl(otherMember?.avatar) ||
         cleanAvatarUrl(conv.avatar));

    const resolvedConv: ChatConversationDto = {
      ...conv,
      name: isGroup
        ? (conv.name || 'Nhóm học tập IELTS 7.0+')
        : (matchedUser?.displayName || matchedUser?.display_name || matchedUser?.name || otherMember?.name || conv.name || 'Bạn học SmartEnglish'),
      avatar: resolvedAvatar || undefined,
    };

    setActiveConversation(resolvedConv);
    // Realtime reset unread count ngay lập tức trên UI
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
    markConversationAsReadApi(conv.id, currentUserId);
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
      const matchedTeacher = communityUsers.find((u: any) => Number(u.id) === teacher.id);
      const teacherAvatar = cleanAvatarUrl(matchedTeacher?.avatarUrl || matchedTeacher?.avatar) || undefined;
      const conv = await createDirectConversationApi({
        myId: currentUserId,
        myName: currentUserName,
        myAvatar: currentUserAvatar,
        friendId: teacher.id,
        friendName: matchedTeacher?.displayName || matchedTeacher?.name || teacher.name,
        friendAvatar: teacherAvatar || '',
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

  // ─── Action: Open Chat with Friend / Accepted Friend ───
  const handleChatWithAcceptedFriend = async (friendId: number, friendName: string, friendAvatar?: string) => {
    try {
      const cleanFriendId = Number(friendId);
      const cleanFriendName = (friendName || '').trim() || 'Bạn học';

      // 1. Check if conversation already exists in state
      const existing = conversations.find((c) => {
        if (c.type === 'GROUP') return false;
        const otherId = Number(
          c.members?.find((m) => Number(m.userId) !== currentUserId)?.userId ||
          c.memberIds?.find((id) => Number(id) !== currentUserId) ||
          c.participantId
        );
        return otherId === cleanFriendId;
      });

      if (existing) {
        setActiveTab('messages');
        await handleOpenConversation(existing);
        return;
      }

      // 2. Otherwise create/fetch via direct conversation endpoint
      const matchedFriend = communityUsers.find((u: any) => Number(u.id) === cleanFriendId);
      const cleanFriendAvatar = cleanAvatarUrl(matchedFriend?.avatarUrl || matchedFriend?.avatar) || cleanAvatarUrl(friendAvatar) || undefined;
      const conv = await createDirectConversationApi({
        myId: currentUserId,
        myName: currentUserName,
        myAvatar: currentUserAvatar,
        friendId: cleanFriendId,
        friendName: matchedFriend?.displayName || matchedFriend?.name || cleanFriendName,
        friendAvatar: cleanFriendAvatar || '',
      });

      if (conv) {
        setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
        setActiveTab('messages');
        await handleOpenConversation(conv);
      } else {
        await loadConversations();
        setActiveTab('messages');
      }
    } catch (e) {
      console.warn('handleChatWithAcceptedFriend error:', e);
      Alert.alert('Thông báo', 'Không thể mở cuộc trò chuyện lúc này. Vui lòng thử lại sau.');
    }
  };

  // ─── Action: Respond Friend Request ───
  const handleAcceptRequest = async (req: FriendshipRequestDto) => {
    const ok = await respondFriendRequestApi({
      friendshipId: req.id,
      currentUserId,
      accept: true,
    });
    if (ok) {
      setPendingRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'ACCEPTED' } : r))
      );
      
      // Ngay lập tức tạo/lấy hội thoại 1-1 và đưa lên đầu danh sách conversations trên mobile
      try {
        const conv = await createDirectConversationApi({
          myId: currentUserId,
          myName: currentUserName,
          myAvatar: currentUserAvatar,
          friendId: req.requesterId,
          friendName: req.requesterName,
          friendAvatar: req.requesterAvatar,
        });
        if (conv) {
          setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
        }
      } catch (err) {
        console.warn('Lỗi tự động kết nối hội thoại:', err);
      }

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

  // ─── Action: Gửi lời mời kết bạn Realtime ───
  const handleSendFriendRequest = async (targetUser: any) => {
    const targetId = Number(targetUser.id);
    if (!targetId || sendingFriendRequestId === targetId) return;
    setSendingFriendRequestId(targetId);
    try {
      const ok = await sendFriendRequestApi({
        requesterId: currentUserId,
        requesterName: currentUserName,
        requesterAvatar: currentUserAvatar,
        addresseeId: targetId,
        addresseeName: targetUser.display_name || targetUser.fullName || targetUser.name || 'Người dùng',
        addresseeAvatar: targetUser.avatar_url || targetUser.avatar,
      });
      if (ok) {
        setSentRequestIds((prev) => new Set(prev).add(targetId));
        const newSentReq: FriendshipRequestDto = {
          id: `sent-${Date.now()}`,
          requesterId: currentUserId,
          requesterName: currentUserName,
          requesterAvatar: currentUserAvatar,
          addresseeId: targetId,
          addresseeName: targetUser.display_name || targetUser.fullName || targetUser.name || 'Người dùng',
          addresseeAvatar: targetUser.avatar_url || targetUser.avatar,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        setSentRequests((prev) => [newSentReq, ...prev]);
        Alert.alert('Thành công', `Đã gửi lời mời kết bạn đến ${targetUser.display_name || targetUser.fullName || targetUser.name || 'người dùng'}!`);
      } else {
        Alert.alert('Thông báo', 'Không thể gửi lời mời kết bạn lúc này hoặc bạn đã gửi trước đó.');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi lời mời kết bạn.');
    } finally {
      setSendingFriendRequestId(null);
    }
  };

  const existingFriendUserIds = new Set<number>([
    currentUserId,
    ...friendsList.map((f: any) =>
      Number(f.requesterId === currentUserId ? f.addresseeId : f.requesterId)
    ),
    ...pendingRequests.map((r: any) => Number(r.requesterId)),
  ]);

  const communitySuggestions = communityUsers.filter(
    (u: any) => !existingFriendUserIds.has(Number(u.id))
  );

  // Danh sách ứng viên thêm vào nhóm (bạn bè + người dùng khác)
  const candidateGroupMembers = [
    ...friendsList.map((f: any) => {
      const isReq = f.requesterId === currentUserId;
      return {
        id: Number(isReq ? f.addresseeId : f.requesterId),
        name: isReq ? f.addresseeName : f.requesterName,
        avatar: isReq ? f.addresseeAvatar : f.requesterAvatar,
        role: 'Bạn bè',
      };
    }),
    ...communityUsers
      .filter(
        (u: any) =>
          Number(u.id) !== currentUserId &&
          !friendsList.some(
            (f: any) =>
              Number(f.requesterId === currentUserId ? f.addresseeId : f.requesterId) ===
              Number(u.id)
          )
      )
      .map((u: any) => ({
        id: Number(u.id),
        name: u.display_name || u.fullName || u.name || 'Người dùng',
        avatar: u.avatar_url || u.avatar,
        role: u.role === 'TEACHER' ? 'Giáo viên' : 'Học viên',
      })),
  ];

  // ─── Action: Tạo nhóm trò chuyện Realtime ───
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên nhóm.');
      return;
    }
    if (selectedGroupMemberIds.size === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 thành viên để tạo nhóm.');
      return;
    }
    setIsCreatingGroup(true);
    try {
      const selectedMembers = candidateGroupMembers
        .filter((m) => selectedGroupMemberIds.has(m.id))
        .map((m) => ({
          userId: m.id,
          name: m.name,
          avatar: m.avatar,
          role: 'MEMBER',
        }));

      const newGroupConv = await createGroupConversationApi({
        name: groupName.trim(),
        createdBy: currentUserId,
        avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200',
        members: [
          {
            userId: currentUserId,
            name: currentUserName,
            avatar: currentUserAvatar,
            role: 'ADMIN',
          },
          ...selectedMembers,
        ],
      });
      if (newGroupConv) {
        setConversations((prev) => [newGroupConv, ...prev.filter((c) => c.id !== newGroupConv.id)]);
        setShowCreateGroupModal(false);
        setGroupName('');
        setSelectedGroupMemberIds(new Set());
        Alert.alert('Thành công', 'Đã tạo nhóm trò chuyện thành công! 🎉');
        handleOpenConversation(newGroupConv);
      } else {
        Alert.alert('Lỗi', 'Không thể tạo nhóm trò chuyện lúc này.');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo nhóm.');
    } finally {
      setIsCreatingGroup(false);
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

  const filteredConversations = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter((c: any) => {
      const isGroup = c.type === 'GROUP';
      const otherMember = !isGroup ? c.members?.find((m: any) => Number(m.userId) !== currentUserId) : null;
      const otherUserId = Number(
        otherMember?.userId ||
          (!isGroup ? c.memberIds?.find((id: any) => Number(id) !== currentUserId) : null) ||
          c.participantId
      );
      const matchedUser = otherUserId ? communityUsers.find((u: any) => Number(u.id) === otherUserId) : null;
      const name = (
        isGroup
          ? (c.name || 'Nhóm học tập IELTS 7.0+')
          : (matchedUser?.displayName || matchedUser?.display_name || matchedUser?.name || otherMember?.name || c.name || '')
      ).toLowerCase();
      const lastMsg = (c.lastMessage || '').toLowerCase();
      return name.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery, currentUserId, communityUsers]);

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
            const badgeCount =
              tab.key === 'requests'
                ? pendingRequests.filter((r) => r.status === 'PENDING').length
                : tab.key === 'messages'
                ? conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
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
                    {badgeCount > 0 && !isActive && (
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
                  {badgeCount > 0 && isActive && (
                    <View style={s.tabBadgeCount}>
                      <Text style={s.tabBadgeCountText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
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
                        {cleanAvatarUrl(post.authorAvatar) ? (
                          <Image
                            source={{ uri: cleanAvatarUrl(post.authorAvatar)! }}
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
                            setViewingImageUrl(post.mediaUrl!);
                            setViewingImageCaption(post.mediaCaption || post.content);
                            setViewingImageAuthor(post.authorName || null);
                          }}
                          style={s.achievementGraphicBox}
                        >
                          <Image
                            source={{ uri: post.mediaUrl }}
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
              <View style={{ paddingHorizontal: 16, marginBottom: 8, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>
                  Hội thoại ({filteredConversations.length})
                </Text>
                <Pressable
                  onPress={() => setShowCreateGroupModal(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#EEF2FF',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12,
                    gap: 5,
                  }}
                >
                  <Users size={14} color="#4F46E5" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>+ Tạo nhóm</Text>
                </Pressable>
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
                filteredConversations.map((conv: any, idx: number) => {
                  const isGroup = conv.type === 'GROUP';
                  const otherMember = !isGroup
                    ? conv.members?.find((m: any) => Number(m.userId) !== currentUserId)
                    : null;
                  const otherUserId = Number(
                    otherMember?.userId ||
                      (!isGroup ? conv.memberIds?.find((id: any) => Number(id) !== currentUserId) : null) ||
                      conv.participantId
                  );
                  const matchedUser = otherUserId
                    ? communityUsers.find((u: any) => Number(u.id) === otherUserId)
                    : null;

                  const displayName = isGroup
                    ? (conv.name || 'Nhóm học tập IELTS 7.0+')
                    : (matchedUser?.displayName || matchedUser?.display_name || matchedUser?.name || otherMember?.name || conv.name || 'Bạn học SmartEnglish');

                  const rawAvatar = isGroup
                    ? cleanAvatarUrl(conv.avatar)
                    : (cleanAvatarUrl(matchedUser?.avatarUrl || matchedUser?.avatar_url || matchedUser?.avatar) ||
                       cleanAvatarUrl(otherMember?.avatar) ||
                       cleanAvatarUrl(conv.avatar));

                  const hasRealAvatar = Boolean(rawAvatar);
                  const initialLetter = (displayName || 'U').trim().charAt(0).toUpperCase();

                  const roleLabel = isGroup
                    ? `Nhóm (${conv.memberIds?.length || conv.members?.length || 2} thành viên)`
                    : (matchedUser?.role === 'teacher' || matchedUser?.role === 'TEACHER'
                      ? 'Giáo viên'
                      : matchedUser?.role === 'admin' || matchedUser?.role === 'ADMIN'
                      ? 'Quản trị viên'
                      : otherMember?.role || 'Học viên');

                  const isOnline = isGroup
                    ? (() => {
                        const otherMemberIds = (
                          conv.members?.map((m: any) => Number(m.userId)) ||
                          conv.memberIds?.map(Number) ||
                          []
                        ).filter((id: number) => id && id !== currentUserId && !isNaN(id));
                        return otherMemberIds.some((id: number) => onlineUserIds.has(id));
                      })()
                    : (() => {
                        const otherUserId = Number(
                          conv.members?.find((m: any) => Number(m.userId) !== currentUserId)?.userId ||
                            conv.memberIds?.find((id: any) => Number(id) !== currentUserId) ||
                            conv.participantId
                        );
                        return Boolean(otherUserId && onlineUserIds.has(otherUserId));
                      })();

                  const unreadNum = Number(conv.unreadCount || (conv as any).unread || 0);
                  const isUnread = unreadNum > 0;

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
                          isUnread && { backgroundColor: '#F8FAFC' },
                          pressed && s.chatItemPressed,
                        ]}
                      >
                        <View style={s.chatItemRow}>
                          {/* Avatar with monogram letter fallback matching Web & bottom-right online dot */}
                          <View style={s.chatAvatarWrap}>
                            {hasRealAvatar && rawAvatar ? (
                              <Image source={{ uri: rawAvatar }} style={s.chatAvatar} />
                            ) : (
                              <View
                                style={[
                                  s.chatAvatar,
                                  {
                                    backgroundColor: isGroup ? '#EDE9FE' : roleLabel === 'Giáo viên' ? '#FEF3C7' : roleLabel === 'Quản trị viên' ? '#FFE4E6' : '#EEF2FF',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: isGroup ? '#DDD6FE' : roleLabel === 'Giáo viên' ? '#FDE68A' : roleLabel === 'Quản trị viên' ? '#FECDD3' : '#C7D2FE',
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    fontSize: 20,
                                    fontWeight: '800',
                                    color: isGroup ? '#7C3AED' : roleLabel === 'Giáo viên' ? '#D97706' : roleLabel === 'Quản trị viên' ? '#E11D48' : '#4F46E5',
                                  }}
                                >
                                  {initialLetter}
                                </Text>
                              </View>
                            )}
                            {isOnline && <View style={s.chatOnlineDot} />}
                          </View>

                          {/* Info: Row 1 (Name + Role + Time) & Row 2 (Last Msg + Unread) */}
                          <View style={s.chatInfoWrap}>
                            <View style={s.chatNameRow}>
                              <Text
                                style={[
                                  s.chatNameText,
                                  isUnread && { fontWeight: '800', color: '#0F172A' },
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {displayName}
                              </Text>
                              <Text style={s.chatTimeText}>
                                {formatTimeAgo(conv.lastMessageAt)}
                              </Text>
                            </View>

                            <View style={s.chatLastMsgRow}>
                              <Text
                                style={[
                                  s.chatLastMsgText,
                                  isUnread && { color: '#0F172A', fontWeight: '800' },
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {formatLastMessage(conv)}
                              </Text>
                              {isUnread && (
                                <View style={s.chatUnreadBadge}>
                                  <Text style={s.chatUnreadText}>{unreadNum}</Text>
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

          <View style={{ marginBottom: 14 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
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
                  Gợi ý kết bạn ({communitySuggestions.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setRequestsSubTab('friends')}
                style={[s.chipPill, requestsSubTab === 'friends' && s.chipPillActive]}
              >
                <Text style={[s.chipPillText, requestsSubTab === 'friends' && s.chipPillTextActive]}>
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
            </ScrollView>
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
                  pendingRequests.map((req, idx) => {
                    const reqAv = cleanAvatarUrl(req.requesterAvatar);
                    const reqInit = (req.requesterName || 'U').trim().charAt(0).toUpperCase();

                    return (
                    <Animated.View key={req.id || idx} entering={FadeInDown.delay(idx * 60)} style={s.reqCard}>
                      {req.status === 'ACCEPTED' ? (
                        <View style={s.acceptedCardInner}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <View style={{ position: 'relative' }}>
                              {reqAv ? (
                                <Image
                                  source={{ uri: reqAv }}
                                  style={s.reqAvatar}
                                />
                              ) : (
                                <View style={[s.reqAvatar, { backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE' }]}>
                                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#4F46E5' }}>{reqInit}</Text>
                                </View>
                              )}
                              <View style={s.acceptedCheckBadge}>
                                <Check color="#FFFFFF" size={10} strokeWidth={3} />
                              </View>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.reqName}>{req.requesterName}</Text>
                              <Text style={s.acceptedSuccessText}>Đã trở thành bạn bè!</Text>
                            </View>
                          </View>

                          <Pressable
                            onPress={() => handleChatWithAcceptedFriend(req.requesterId, req.requesterName, req.requesterAvatar)}
                            style={s.chatWithFriendBtn}
                          >
                            <MessageCircle color="#4F46E5" size={16} />
                            <Text style={s.chatWithFriendBtnText}>Nhắn tin ngay</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <View style={{ position: 'relative' }}>
                              {reqAv ? (
                                <Image
                                  source={{ uri: reqAv }}
                                  style={s.reqAvatar}
                                />
                              ) : (
                                <View style={[s.reqAvatar, { backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE' }]}>
                                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#4F46E5' }}>{reqInit}</Text>
                                </View>
                              )}
                              {onlineUserIds.has(Number(req.requesterId)) && (
                                <View style={s.onlineStatusDot} />
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.reqName}>{req.requesterName}</Text>
                              <Text style={s.reqLevelSub}>Học viên SmartEnglish</Text>
                              <Text style={s.reqTimeText}>{formatTimeAgo(req.createdAt)}</Text>
                            </View>
                          </View>

                          <View style={s.reqDualActionRow}>
                            <Pressable
                              onPress={() => handleAcceptRequest(req)}
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
                  );
                  })
                )
              )}

              {requestsSubTab === 'suggestions' && (
                communitySuggestions.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Users color="#94A3B8" size={40} />
                    <Text style={s.emptyTitle}>Chưa có gợi ý phù hợp</Text>
                    <Text style={s.emptySub}>Mọi người trong cộng đồng đều đã là bạn bè hoặc đang chờ phản hồi!</Text>
                  </View>
                ) : (
                  communitySuggestions.map((u, idx) => {
                    const uId = Number(u.id);
                    const isOnline = onlineUserIds.has(uId);
                    const isSent = sentRequestIds.has(uId);
                    const uName = u.display_name || u.fullName || u.name || 'Học viên SmartEnglish';
                    const uAvatar = cleanAvatarUrl(u.avatar_url || u.avatar);
                    const uInit = (uName || 'U').trim().charAt(0).toUpperCase();
                    const uRole = (u.role || '').toUpperCase();
                    const uRoleText = uRole === 'TEACHER' ? 'Giáo viên SmartEnglish AI' : 'Học viên tích cực';

                    return (
                      <Animated.View key={uId || idx} entering={FadeInDown.delay(idx * 50)} style={s.reqCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ position: 'relative' }}>
                            {uAvatar ? (
                              <Image
                                source={{ uri: uAvatar }}
                                style={s.reqAvatar}
                              />
                            ) : (
                              <View style={[s.reqAvatar, { backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE' }]}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4F46E5' }}>{uInit}</Text>
                              </View>
                            )}
                            {isOnline && (
                              <View style={s.onlineStatusDot} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.reqName}>{uName}</Text>
                            <Text style={s.reqLevelSub}>{uRoleText}</Text>
                            {isOnline && (
                              <Text style={{ fontSize: 10, color: '#16A34A', fontWeight: '700', marginTop: 2 }}>
                                Đang online
                              </Text>
                            )}
                          </View>
                          {isSent ? (
                            <View
                              style={{
                                backgroundColor: '#F1F5F9',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Check color="#64748B" size={14} strokeWidth={2.5} />
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
                                Đã gửi
                              </Text>
                            </View>
                          ) : (
                            <Pressable
                              onPress={() => handleSendFriendRequest(u)}
                              disabled={sendingFriendRequestId === uId}
                              style={{
                                backgroundColor: '#4F46E5',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                opacity: sendingFriendRequestId === uId ? 0.6 : 1,
                              }}
                            >
                              {sendingFriendRequestId === uId ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <>
                                  <UserPlus color="#FFFFFF" size={14} strokeWidth={2.5} />
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                                    Kết bạn
                                  </Text>
                                </>
                              )}
                            </Pressable>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })
                )
              )}

              {requestsSubTab === 'friends' && (
                friendsList.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Users color="#94A3B8" size={40} />
                    <Text style={s.emptyTitle}>Chưa có bạn bè</Text>
                    <Text style={s.emptySub}>Kết nối với các bạn học viên khác để cùng nhau tiến bộ!</Text>
                  </View>
                ) : (
                  friendsList.map((f, idx) => {
                    const isReq = Number(f.requesterId) === currentUserId;
                    const friendId = Number(isReq ? f.addresseeId : f.requesterId);
                    const friendName = isReq ? f.addresseeName : f.requesterName;
                    const friendAvatar = isReq ? f.addresseeAvatar : f.requesterAvatar;
                    const isOnline = onlineUserIds.has(friendId);

                    const fAv = cleanAvatarUrl(friendAvatar);
                    const fInit = (friendName || 'U').trim().charAt(0).toUpperCase();

                    return (
                      <Animated.View key={f.id || idx} entering={FadeInDown.delay(idx * 50)} style={s.reqCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ position: 'relative' }}>
                            {fAv ? (
                              <Image
                                source={{ uri: fAv }}
                                style={s.reqAvatar}
                              />
                            ) : (
                              <View style={[s.reqAvatar, { backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE' }]}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4F46E5' }}>{fInit}</Text>
                              </View>
                            )}
                            {isOnline && (
                              <View style={s.onlineStatusDot} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.reqName}>{friendName || 'Bạn học'}</Text>
                            <Text style={s.reqLevelSub}>Đã kết nối bạn bè</Text>
                            <Text style={s.reqTimeText}>{formatTimeAgo(f.createdAt)}</Text>
                          </View>
                          <Pressable
                            onPress={() => handleChatWithAcceptedFriend(friendId, friendName || 'Bạn học', friendAvatar)}
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
                  sentRequests.map((sReq, idx) => {
                    const sReqAv = cleanAvatarUrl(sReq.addresseeAvatar || sReq.requesterAvatar);
                    const sReqInit = (sReq.addresseeName || 'U').trim().charAt(0).toUpperCase();

                    return (
                      <Animated.View key={sReq.id || idx} entering={FadeInDown.delay(idx * 60)} style={s.reqCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          {sReqAv ? (
                            <Image
                              source={{ uri: sReqAv }}
                              style={s.reqAvatar}
                            />
                          ) : (
                            <View style={[s.reqAvatar, { backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE' }]}>
                              <Text style={{ fontSize: 16, fontWeight: '700', color: '#4F46E5' }}>{sReqInit}</Text>
                            </View>
                          )}
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
                    );
                  })
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
      {(() => {
        const isGroup = activeConversation?.type === 'GROUP';
        const activeConvIsOnline = Boolean(
          activeConversation &&
            (isGroup
              ? (
                  activeConversation.members?.map((m) => Number(m.userId)) ||
                  activeConversation.memberIds?.map(Number) ||
                  []
                )
                  .filter((id) => id && id !== currentUserId && !isNaN(id))
                  .some((id) => onlineUserIds.has(id))
              : (() => {
                  const otherUserId = Number(
                    activeConversation.members?.find((m) => Number(m.userId) !== currentUserId)?.userId ||
                      activeConversation.memberIds?.find((id) => Number(id) !== currentUserId)
                  );
                  return Boolean(otherUserId && onlineUserIds.has(otherUserId));
                })())
        );

        return (
          <ChatDetailModal
            visible={Boolean(activeConversation)}
            conversation={activeConversation}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            communityUsers={communityUsers}
            isOnline={activeConvIsOnline}
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
        );
      })()}

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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: TẠO NHÓM TRÒ CHUYỆN REALTIME */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal visible={showCreateGroupModal} animationType="slide" transparent={false}>
        <View style={s.modalRoot}>
          <View style={[s.modalHeader, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
            <Pressable
              onPress={() => {
                setShowCreateGroupModal(false);
                setGroupName('');
                setSelectedGroupMemberIds(new Set());
              }}
            >
              <Text style={s.modalCancelText}>Hủy</Text>
            </Pressable>
            <Text style={s.modalTitle}>Tạo nhóm trò chuyện</Text>
            <Pressable
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || selectedGroupMemberIds.size === 0 || isCreatingGroup}
              style={[
                s.modalSubmitBtn,
                (!groupName.trim() || selectedGroupMemberIds.size === 0 || isCreatingGroup) && {
                  opacity: 0.5,
                },
              ]}
            >
              {isCreatingGroup ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={s.modalSubmitText}>Tạo</Text>
              )}
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {/* Tên nhóm */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 8 }}>
                Tên nhóm trò chuyện *
              </Text>
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Ví dụ: Nhóm luyện nói IELTS 7.0+, Ôn tập từ vựng..."
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: '#1E293B',
                }}
              />
            </View>

            {/* Chọn thành viên */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>
                  Thêm thành viên ({selectedGroupMemberIds.size} đã chọn)
                </Text>
                {selectedGroupMemberIds.size > 0 && (
                  <Pressable onPress={() => setSelectedGroupMemberIds(new Set())}>
                    <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>Bỏ chọn tất cả</Text>
                  </Pressable>
                )}
              </View>

              {candidateGroupMembers.length === 0 ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <Users color="#94A3B8" size={36} />
                  <Text style={{ color: '#64748B', fontSize: 13, marginTop: 8 }}>
                    Chưa có bạn bè hay thành viên nào để thêm vào nhóm.
                  </Text>
                </View>
              ) : (
                candidateGroupMembers.map((member) => {
                  const isSelected = selectedGroupMemberIds.has(member.id);
                  const isOnline = onlineUserIds.has(member.id);
                  return (
                    <Pressable
                      key={member.id}
                      onPress={() => {
                        setSelectedGroupMemberIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(member.id)) {
                            next.delete(member.id);
                          } else {
                            next.add(member.id);
                          }
                          return next;
                        });
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 14,
                        backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isSelected ? '#C7D2FE' : '#F1F5F9',
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={{ position: 'relative' }}>
                          {cleanAvatarUrl(member.avatar) ? (
                            <Image
                              source={{ uri: cleanAvatarUrl(member.avatar)! }}
                              style={{ width: 42, height: 42, borderRadius: 21 }}
                            />
                          ) : (
                            <View
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 21,
                                backgroundColor: '#EEF2FF',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#C7D2FE',
                              }}
                            >
                              <Text style={{ fontSize: 16, fontWeight: '700', color: '#4F46E5' }}>
                                {(member.name || 'U').trim().charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          {isOnline && (
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 9999,
                                backgroundColor: '#10B981',
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                borderWidth: 2,
                                borderColor: '#FFFFFF',
                                zIndex: 2,
                              }}
                            />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: isSelected ? '700' : '600',
                              color: '#1E293B',
                            }}
                            numberOfLines={1}
                          >
                            {member.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                            {member.role}
                          </Text>
                        </View>
                      </View>

                      {/* Checkbox */}
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#4F46E5' : '#CBD5E1',
                          backgroundColor: isSelected ? '#4F46E5' : 'transparent',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {isSelected && <Check color="#FFFFFF" size={13} strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  teacherOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
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
    borderRadius: 9999,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 1,
    right: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1,
    elevation: 2,
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
    backgroundColor: '#EF4444',
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
  onlineStatusDot: {
    width: 13,
    height: 13,
    borderRadius: 9999,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 1,
    right: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
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
