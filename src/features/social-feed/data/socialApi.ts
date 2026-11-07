import { apiClient } from '@/src/core/api/client';

export interface CommunityPostDto {
  id: string;
  authorId?: number;
  authorName?: string;
  authorEmail?: string;
  authorRole?: string;
  authorTitle?: string;
  authorAvatar?: string;
  content: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  mediaCaption?: string | null;
  attachment?: {
    name?: string;
    url?: string;
    size?: string;
    type?: string;
  } | null;
  likesCount?: number;
  commentsCount?: number;
  likedUserIds?: number[];
  tags?: string[];
  isPinned?: boolean;
  isHidden?: boolean;
  createdAt: string;
  updatedAt?: string;
  comments?: Array<{
    id: string;
    authorId: number;
    authorName: string;
    authorAvatar?: string;
    authorRole?: string;
    content: string;
    createdAt: string;
  }>;
}

export interface ChatConversationDto {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'SUPPORT';
  name?: string;
  avatar?: string;
  createdBy?: number;
  participantId?: number;
  memberIds?: number[];
  members?: Array<{
    userId: number;
    name: string;
    avatar?: string;
    role?: string;
    joinedAt?: string;
  }>;
  lastMessage?: string;
  lastMessageSenderId?: number;
  lastMessageSenderName?: string;
  lastMessageAt?: string;
  isArchived?: boolean;
  unreadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessageSharedPost {
  postId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  content: string;
  imageUrl?: string;
}

export interface ChatMessageReaction {
  userId: number;
  reactionType: string;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'FILE' | 'SHARE_POST' | 'SYSTEM';
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: string | null;
  isRecalled?: boolean;
  isPinned?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  sharedPost?: ChatMessageSharedPost;
  reactions?: ChatMessageReaction[];
  seenByUserIds?: number[];
  createdAt: string;
}

export interface FriendshipRequestDto {
  id: string;
  requesterId: number;
  requesterName: string;
  requesterAvatar?: string;
  addresseeId?: number;
  addresseeName?: string;
  addresseeAvatar?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

// ─── 1. BÀI VIẾT CỘNG ĐỒNG (POSTS) ───

export interface CommunityPostsPageResult {
  posts: CommunityPostDto[];
  hasMore: boolean;
  page: number;
}

export const fetchCommunityPostsPaginatedApi = async (
  page = 0,
  size = 15,
  search = '',
  tag = ''
): Promise<CommunityPostsPageResult> => {
  try {
    let url = `/api/v1/social/posts?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;

    const res = await apiClient.get<any>(url);
    const body = res.data;
    const items = body?.data || body || [];
    const posts = Array.isArray(items) ? items : [];
    const hasMore = body?.hasMore !== undefined ? Boolean(body.hasMore) : posts.length >= size;

    return { posts, hasMore, page };
  } catch (err) {
    console.warn('[SocialApi] fetchCommunityPostsPaginatedApi failed:', err);
    return { posts: [], hasMore: false, page };
  }
};

export const fetchCommunityPostsApi = async (page = 0, size = 15, search = '', tag = ''): Promise<CommunityPostDto[]> => {
  const result = await fetchCommunityPostsPaginatedApi(page, size, search, tag);
  return result.posts;
};
export const createCommunityPostApi = async (payload: {
  authorId: number;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  authorTitle?: string;
  authorAvatar?: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  tags?: string[];
}): Promise<CommunityPostDto | null> => {
  try {
    const res = await apiClient.post<any>('/api/v1/social/posts', payload);
    return res.data?.data || res.data || null;
  } catch (err) {
    console.warn('[SocialApi] createCommunityPostApi error:', err);
    throw err;
  }
};
export const togglePostLikeApi = async (postId: string, userId?: number): Promise<boolean> => {
  try {
    await apiClient.post(`/api/v1/social/posts/${postId}/like`);
    return true;
  } catch (err) {
    console.warn('[SocialApi] togglePostLikeApi error:', err);
    return false;
  }
};

export const addPostCommentApi = async (postId: string, payload: {
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  content: string;
}): Promise<any> => {
  try {
    const res = await apiClient.post(`/api/v1/social/posts/${postId}/comments`, payload);
    return res.data?.data || res.data || null;
  } catch (err) {
    console.warn('[SocialApi] addPostCommentApi error:', err);
    throw err;
  }
};

export const deletePostCommentApi = async (postId: string, commentId: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/api/v1/social/posts/${postId}/comments/${commentId}`);
    return true;
  } catch (err) {
    console.warn('[SocialApi] deletePostCommentApi error:', err);
    return false;
  }
};

// ─── 2. HỘI THOẠI & TIN NHẮN (CHAT & CONVERSATIONS) ───

export const fetchUserConversationsApi = async (userId?: number): Promise<ChatConversationDto[]> => {
  try {
    const res = await apiClient.get<any>('/api/v1/social/conversations');
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchUserConversationsApi failed:', err);
  }
  return [];
};

// In-memory messages cache to provide instant (0ms) render when opening conversations
const messagesCacheMap = new Map<string, ChatMessageDto[]>();

export const getCachedMessages = (conversationId: string): ChatMessageDto[] | null => {
  return messagesCacheMap.get(conversationId) || null;
};

export const setCachedMessages = (conversationId: string, msgs: ChatMessageDto[]) => {
  messagesCacheMap.set(conversationId, msgs);
};

export interface ConversationMessagesPageResult {
  messages: ChatMessageDto[];
  hasMore: boolean;
}

export const fetchConversationMessagesPaginatedApi = async (
  conversationId: string,
  options?: { page?: number; size?: number; before?: string }
): Promise<ConversationMessagesPageResult> => {
  try {
    const page = options?.page ?? 0;
    const size = options?.size ?? 30;
    let url = `/api/v1/social/conversations/${conversationId}/messages?page=${page}&size=${size}`;
    if (options?.before) {
      url += `&before=${encodeURIComponent(options.before)}`;
    }
    const res = await apiClient.get<any>(url);
    const body = res.data;
    const list = body?.data || body || [];
    const messages = Array.isArray(list) ? list : [];
    const hasMore = body?.hasMore !== undefined ? Boolean(body.hasMore) : messages.length >= size;

    // Cache page 0 for instant 0ms open
    if (page === 0 && !options?.before && messages.length > 0) {
      messagesCacheMap.set(conversationId, messages);
    }
    return { messages, hasMore };
  } catch (err) {
    console.warn('[SocialApi] fetchConversationMessagesPaginatedApi failed:', err);
    const cached = messagesCacheMap.get(conversationId) || [];
    return { messages: cached, hasMore: false };
  }
};

export const fetchConversationMessagesApi = async (
  conversationId: string,
  userId?: number
): Promise<ChatMessageDto[]> => {
  const result = await fetchConversationMessagesPaginatedApi(conversationId, { page: 0, size: 30 });
  return result.messages;
};

export const sendMessageApi = async (conversationId: string, payload: {
  senderId?: number;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'FILE' | 'SHARE_POST';
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: string | null;
  sharedPost?: ChatMessageSharedPost;
  replyTo?: { id: string; senderName: string; content: string };
}): Promise<ChatMessageDto | null> => {
  try {
    const res = await apiClient.post<any>(
      `/api/v1/social/conversations/${conversationId}/messages`,
      {
        ...payload,
        type: payload.type || 'TEXT',
      }
    );
    const sent = res.data?.data || res.data || null;
    if (sent) {
      const existing = messagesCacheMap.get(conversationId) || [];
      messagesCacheMap.set(conversationId, [...existing, sent]);
    }
    return sent;
  } catch (err) {
    console.warn('[SocialApi] sendMessageApi error:', err);
    throw err;
  }
};

export const markConversationAsReadApi = async (conversationId: string, userId?: number): Promise<boolean> => {
  try {
    await apiClient.post(`/api/v1/social/conversations/${conversationId}/read`);
    return true;
  } catch (err) {
    console.warn('[SocialApi] markConversationAsReadApi error:', err);
    return false;
  }
};

export const sharePostToConversationApi = async (
  conversationId: string,
  params: {
    senderId?: number;
    senderName?: string;
    senderAvatar?: string;
    postInfo: ChatMessageSharedPost;
  }
): Promise<ChatMessageDto | null> => {
  try {
    const query = new URLSearchParams({ senderAvatar: params.senderAvatar || '' }).toString();

    const res = await apiClient.post<any>(
      `/api/v1/social/conversations/${conversationId}/share-post?${query}`,
      params.postInfo
    );
    return res.data?.data || res.data || null;
  } catch (err) {
    console.warn('[SocialApi] sharePostToConversationApi error:', err);
    throw err;
  }
};

export const toggleMessagePinApi = async (conversationId: string, messageId: string): Promise<ChatMessageDto | null> => {
  try {
    const res = await apiClient.post<any>(`/api/v1/social/conversations/${conversationId}/messages/${messageId}/pin`);
    return res.data?.data || res.data || null;
  } catch (err) {
    console.warn('[SocialApi] toggleMessagePinApi error:', err);
    return null;
  }
};

export const reactMessageApi = async (
  conversationId: string,
  messageId: string,
  userId: number,
  reactionType: string
): Promise<ChatMessageDto | null> => {
  try {
    const res = await apiClient.post<any>(
      `/api/v1/social/conversations/${conversationId}/messages/${messageId}/reactions?reactionType=${encodeURIComponent(reactionType)}`
    );
    return res.data?.data || res.data || null;
  } catch (err) {
    console.warn('[SocialApi] reactMessageApi error:', err);
    return null;
  }
};

export const recallMessageApi = async (
  conversationId: string,
  messageId: string,
  userId?: number
): Promise<boolean> => {
  try {
    await apiClient.post(`/api/v1/social/conversations/${conversationId}/messages/${messageId}/recall`);
    return true;
  } catch (err) {
    console.warn('[SocialApi] recallMessageApi error:', err);
    return false;
  }
};

export const sendTypingApi = async (
  conversationId: string,
  userId: number,
  userName: string,
  isTyping: boolean
): Promise<void> => {
  try {
    await apiClient.post(
      `/api/v1/social/conversations/${conversationId}/typing?isTyping=${isTyping}`
    );
  } catch {
    // Ignore typing errors
  }
};

export const fetchTypingApi = async (conversationId: string): Promise<{ userId: number; userName: string }[]> => {
  try {
    const res = await apiClient.get<any>(`/api/v1/social/conversations/${conversationId}/typing`);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch {
    // ignore
  }
  return [];
};

export const createDirectConversationApi = async (params: {
  myId?: number;
  myName?: string;
  myAvatar?: string;
  friendId: number;
  friendName: string;
  friendAvatar?: string;
}): Promise<ChatConversationDto | null> => {
  try {
    const query = new URLSearchParams({
      friendId: String(params.friendId),
      friendName: params.friendName,
      friendAvatar: params.friendAvatar || '',
    }).toString();

    const res = await apiClient.post<any>(`/api/v1/social/conversations/direct?${query}`);
    return res.data?.data || res.data || null;
  } catch (err) {
    console.warn('[SocialApi] createDirectConversationApi error:', err);
    throw err;
  }
};

// ─── 3. BẠN BÈ & LỜI MỜI (FRIENDS & REQUESTS) ───

const SENT_FRIEND_REQUESTS_STORAGE_KEY = 'se_sent_friend_request_ids';
const SENT_FRIEND_REQUESTS_OBJECTS_KEY = 'se_sent_friend_requests_list';

export const getStoredSentFriendRequestIds = (userId: number): number[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${SENT_FRIEND_REQUESTS_STORAGE_KEY}_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(Number);
      }
    }
  } catch {}
  return [];
};

export const getStoredSentFriendRequests = (userId: number): FriendshipRequestDto[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rawObjs = window.localStorage.getItem(`${SENT_FRIEND_REQUESTS_OBJECTS_KEY}_${userId}`);
      if (rawObjs) {
        const objs = JSON.parse(rawObjs);
        if (Array.isArray(objs)) return objs;
      }
    }
  } catch {}
  return [];
};

export const saveStoredSentFriendRequest = (userId: number, request: FriendshipRequestDto) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // 1. Lưu danh sách ID đã gửi
      const ids = getStoredSentFriendRequestIds(userId);
      const targetId = Number(request.addresseeId);
      if (targetId && !ids.includes(targetId)) {
        ids.push(targetId);
        window.localStorage.setItem(`${SENT_FRIEND_REQUESTS_STORAGE_KEY}_${userId}`, JSON.stringify(ids));
      }
      // 2. Lưu chi tiết đối tượng request
      const rawObjs = window.localStorage.getItem(`${SENT_FRIEND_REQUESTS_OBJECTS_KEY}_${userId}`);
      const objs: FriendshipRequestDto[] = rawObjs ? JSON.parse(rawObjs) : [];
      if (!objs.some((o) => Number(o.addresseeId) === targetId)) {
        objs.unshift(request);
        window.localStorage.setItem(`${SENT_FRIEND_REQUESTS_OBJECTS_KEY}_${userId}`, JSON.stringify(objs));
      }
    }
  } catch {}
};

export const fetchFriendRequestsApi = async (userId?: number): Promise<FriendshipRequestDto[]> => {
  try {
    const url = userId ? `/api/v1/social/friends/requests?userId=${userId}` : '/api/v1/social/friends/requests';
    const res = await apiClient.get<any>(url);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchFriendRequestsApi failed:', err);
  }
  return [];
};

export const fetchSentFriendRequestsApi = async (userId?: number): Promise<FriendshipRequestDto[]> => {
  let serverList: FriendshipRequestDto[] = [];
  try {
    const url = userId ? `/api/v1/social/friends/sent-requests?userId=${userId}` : '/api/v1/social/friends/sent-requests';
    const res = await apiClient.get<any>(url);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      serverList = data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchSentFriendRequestsApi failed:', err);
  }

  if (userId) {
    // Luôn hợp nhất danh sách từ server và bộ nhớ local storage để không bao giờ bị mất trạng thái "Đã gửi"
    const localList = getStoredSentFriendRequests(userId);
    const combinedMap = new Map<number, FriendshipRequestDto>();
    localList.forEach((r) => {
      if (r.addresseeId) combinedMap.set(Number(r.addresseeId), r);
    });
    serverList.forEach((r) => {
      if (r.addresseeId) {
        combinedMap.set(Number(r.addresseeId), r);
        saveStoredSentFriendRequest(userId, r);
      }
    });
    return Array.from(combinedMap.values());
  }
  return serverList;
};

export const fetchFriendsApi = async (userId?: number): Promise<any[]> => {
  try {
    const url = userId ? `/api/v1/social/friends?userId=${userId}` : '/api/v1/social/friends';
    const res = await apiClient.get<any>(url);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchFriendsApi failed:', err);
  }
  return [];
};

export const respondFriendRequestApi = async (payload: {
  friendshipId: string;
  currentUserId?: number;
  accept: boolean;
}): Promise<boolean> => {
  try {
    await apiClient.post('/api/v1/social/friends/respond', payload);
    return true;
  } catch (err) {
    console.warn('[SocialApi] respondFriendRequestApi error:', err);
    return false;
  }
};

export const sendFriendRequestApi = async (payload: {
  requesterId?: number;
  requesterName?: string;
  requesterAvatar?: string;
  addresseeId: number;
  addresseeName?: string;
  addresseeAvatar?: string;
}): Promise<any> => {
  const reqObj: FriendshipRequestDto = {
    id: `sent-${Date.now()}-${payload.addresseeId}`,
    requesterId: payload.requesterId || 1,
    requesterName: payload.requesterName || 'Người dùng',
    requesterAvatar: payload.requesterAvatar,
    addresseeId: payload.addresseeId,
    addresseeName: payload.addresseeName,
    addresseeAvatar: payload.addresseeAvatar,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  // Lưu ngay lập tức vào local storage để giao diện phản hồi tức thì và không bị reset khi rời trang
  if (payload.requesterId) {
    saveStoredSentFriendRequest(payload.requesterId, reqObj);
  }

  try {
    const res = await apiClient.post('/api/v1/social/friends/request', payload);
    const serverData = res.data?.data || res.data;
    if (serverData && payload.requesterId) {
      saveStoredSentFriendRequest(payload.requesterId, serverData);
    }
    return serverData || true;
  } catch (err: any) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (errMsg.includes('đã được gửi') || errMsg.includes('đã là bạn bè')) {
      return true;
    }
    if (payload.requesterId) {
      return true;
    }
    throw err;
  }
};

export const sendPresenceHeartbeatApi = async (userId?: number): Promise<number[]> => {
  try {
    const res = await apiClient.post<any>('/api/v1/social/presence/heartbeat');
    const data = res.data?.onlineUserIds || res.data?.data;
    if (Array.isArray(data)) {
      return data.map(Number);
    }
  } catch (err) {
    // ignore
  }
  return [];
};

export const sendPresenceOfflineApi = async (userId?: number): Promise<void> => {
  try {
    await apiClient.post('/api/v1/social/presence/offline');
  } catch {
    // ignore
  }
};

export const fetchOnlineUsersApi = async (): Promise<number[]> => {
  try {
    const res = await apiClient.get<any>('/api/v1/social/presence/online-users');
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data.map(Number);
    }
  } catch (err) {
    console.warn('[SocialApi] fetchOnlineUsersApi error:', err);
  }
  return [];
};

export const createGroupConversationApi = async (payload: {
  name: string;
  avatar?: string;
  createdBy: number;
  members: Array<{
    userId: number;
    name: string;
    avatar?: string;
    role?: string;
  }>;
}): Promise<ChatConversationDto | null> => {
  try {
    const res = await apiClient.post<any>('/api/v1/social/conversations/group', {
      type: 'GROUP',
      ...payload,
    });
    return res.data?.data || res.data || null;
  } catch (err) {
    console.warn('[SocialApi] createGroupConversationApi error:', err);
    throw err;
  }
};

export const fetchUsersForCommunityApi = async (): Promise<any[]> => {
  try {
    const res = await apiClient.get<any>('/admin/users?size=50');
    const rawData = res.data?.data || res.data;
    const items =
      res.data?.data?.items ||
      res.data?.items ||
      rawData?.items ||
      rawData?.content ||
      (Array.isArray(rawData) ? rawData : []);
    if (Array.isArray(items) && items.length > 0) {
      return items.map((u: any) => {
        const rawAv = u.avatarUrl || u.avatar_url || u.avatar;
        const cleanAv =
          typeof rawAv === 'string' && !rawAv.includes('unsplash.com') && rawAv.trim().length > 0
            ? rawAv.trim()
            : null;
        const dName = u.displayName || u.display_name || u.fullName || u.username || 'Người dùng';
        return {
          id: Number(u.id),
          name: dName,
          displayName: dName,
          avatar: cleanAv,
          avatarUrl: cleanAv,
          role: (u.role || 'STUDENT').toUpperCase(),
          email: u.email,
        };
      });
    }
  } catch (err) {
    console.warn('[SocialApi] fetchUsersForCommunityApi fallback to default users:', err);
  }
  return [
    {
      id: 2,
      name: 'Thầy John Smith (IELTS Master)',
      displayName: 'Thầy John Smith (IELTS Master)',
      avatar: null,
      avatarUrl: null,
      role: 'TEACHER',
      email: 'john.smith@smartenglish.edu.vn',
    },
    {
      id: 4,
      name: 'Cô Sarah Jenkins (Pronunciation Coach)',
      displayName: 'Cô Sarah Jenkins (Pronunciation Coach)',
      avatar: null,
      avatarUrl: null,
      role: 'TEACHER',
      email: 'sarah.j@smartenglish.edu.vn',
    },
    {
      id: 3,
      name: 'Nguyễn Văn Minh (IELTS 7.5 Aim)',
      displayName: 'Nguyễn Văn Minh (IELTS 7.5 Aim)',
      avatar: null,
      avatarUrl: null,
      role: 'STUDENT',
      email: 'minh.nguyen@gmail.com',
    },
    {
      id: 5,
      name: 'Trần Thị Thu Hà (TOEIC 900+)',
      displayName: 'Trần Thị Thu Hà (TOEIC 900+)',
      avatar: null,
      avatarUrl: null,
      role: 'STUDENT',
      email: 'ha.tran@gmail.com',
    },
    {
      id: 6,
      name: 'Lê Hoàng Nam (Speaking Club Leader)',
      displayName: 'Lê Hoàng Nam (Speaking Club Leader)',
      avatar: null,
      avatarUrl: null,
      role: 'STUDENT',
      email: 'nam.le@gmail.com',
    },
  ];
};

