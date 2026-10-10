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

export const fetchCommunityPostsApi = async (page = 0, size = 10, search = '', tag = ''): Promise<CommunityPostDto[]> => {
  try {
    let url = `/api/v1/social/posts?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;

    const res = await apiClient.get<any>(url);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchCommunityPostsApi failed:', err);
  }
  return [];
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
export const togglePostLikeApi = async (postId: string, userId: number): Promise<boolean> => {
  try {
    await apiClient.post(`/api/v1/social/posts/${postId}/like?userId=${userId}`);
    return true;
  } catch (err) {
    console.warn('[SocialApi] togglePostLikeApi error:', err);
    return false;
  }
};

export const addPostCommentApi = async (postId: string, payload: {
  authorId: number;
  authorName: string;
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

export const fetchUserConversationsApi = async (userId: number): Promise<ChatConversationDto[]> => {
  try {
    const res = await apiClient.get<any>(`/api/v1/social/conversations?userId=${userId}`);
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

export const fetchConversationMessagesApi = async (conversationId: string, userId?: number): Promise<ChatMessageDto[]> => {
  try {
    const url = userId
      ? `/api/v1/social/conversations/${conversationId}/messages?userId=${userId}`
      : `/api/v1/social/conversations/${conversationId}/messages`;
    const res = await apiClient.get<any>(url);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      messagesCacheMap.set(conversationId, data);
      return data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchConversationMessagesApi failed:', err);
  }
  return messagesCacheMap.get(conversationId) || [];
};

export const sendMessageApi = async (conversationId: string, payload: {
  senderId: number;
  senderName: string;
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
      `/api/v1/social/conversations/${conversationId}/messages?userId=${payload.senderId}`,
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

export const markConversationAsReadApi = async (conversationId: string, userId: number): Promise<boolean> => {
  try {
    await apiClient.post(`/api/v1/social/conversations/${conversationId}/read?userId=${userId}`);
    return true;
  } catch (err) {
    console.warn('[SocialApi] markConversationAsReadApi error:', err);
    return false;
  }
};

export const sharePostToConversationApi = async (
  conversationId: string,
  params: {
    senderId: number;
    senderName: string;
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
      `/api/v1/social/conversations/${conversationId}/messages/${messageId}/reactions?userId=${userId}&reactionType=${encodeURIComponent(reactionType)}`
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
  userId: number
): Promise<boolean> => {
  try {
    await apiClient.post(`/api/v1/social/conversations/${conversationId}/messages/${messageId}/recall?userId=${userId}`);
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
      `/api/v1/social/conversations/${conversationId}/typing?isTyping=${isTyping}&userId=${userId}&userName=${encodeURIComponent(userName)}`
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
  myId: number;
  myName: string;
  myAvatar?: string;
  friendId: number;
  friendName: string;
  friendAvatar?: string;
}): Promise<ChatConversationDto | null> => {
  try {
    const query = new URLSearchParams({
      myId: String(params.myId),
      myName: params.myName,
      myAvatar: params.myAvatar || '',
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

export const fetchFriendRequestsApi = async (userId: number): Promise<FriendshipRequestDto[]> => {
  try {
    const res = await apiClient.get<any>(`/api/v1/social/friends/requests?userId=${userId}`);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchFriendRequestsApi failed:', err);
  }
  return [];
};

export const fetchSentFriendRequestsApi = async (userId: number): Promise<FriendshipRequestDto[]> => {
  try {
    const res = await apiClient.get<any>(`/api/v1/social/friends/sent-requests?userId=${userId}`);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchSentFriendRequestsApi failed:', err);
  }
  return [];
};

export const fetchFriendsApi = async (userId: number): Promise<any[]> => {
  try {
    const res = await apiClient.get<any>(`/api/v1/social/friends?userId=${userId}`);
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
  currentUserId: number;
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
  requesterId: number;
  requesterName?: string;
  requesterAvatar?: string;
  addresseeId: number;
  addresseeName?: string;
  addresseeAvatar?: string;
}): Promise<any> => {
  try {
    const res = await apiClient.post('/api/v1/social/friends/request', payload);
    return res.data?.data || res.data || null;
  } catch (err) {
    console.warn('[SocialApi] sendFriendRequestApi error:', err);
    throw err;
  }
};

export const sendPresenceHeartbeatApi = async (userId: number): Promise<number[]> => {
  try {
    const res = await apiClient.post<any>(`/api/v1/social/presence/heartbeat?userId=${userId}`);
    const data = res.data?.onlineUserIds || res.data?.data;
    if (Array.isArray(data)) {
      return data.map(Number);
    }
  } catch (err) {
    // ignore
  }
  return [];
};

export const sendPresenceOfflineApi = async (userId: number): Promise<void> => {
  try {
    await apiClient.post(`/api/v1/social/presence/offline?userId=${userId}`);
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

