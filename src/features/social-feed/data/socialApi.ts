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

export const fetchConversationMessagesApi = async (conversationId: string): Promise<ChatMessageDto[]> => {
  try {
    const res = await apiClient.get<any>(`/api/v1/social/conversations/${conversationId}/messages`);
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('[SocialApi] fetchConversationMessagesApi failed:', err);
  }
  return [];
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
    const res = await apiClient.post<any>(`/api/v1/social/conversations/${conversationId}/messages`, {
      ...payload,
      type: payload.type || 'TEXT',
    });
    return res.data?.data || res.data || null;
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
    const query = new URLSearchParams({
      senderId: String(params.senderId),
      senderName: params.senderName,
      senderAvatar: params.senderAvatar || '',
    }).toString();

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
      `/api/v1/social/conversations/${conversationId}/messages/${messageId}/reactions?userId=${userId}&reactionType=${reactionType}`
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
      `/api/v1/social/conversations/${conversationId}/typing?userId=${userId}&userName=${encodeURIComponent(userName)}&isTyping=${isTyping}`
    );
  } catch {
    // Ignore typing errors
  }
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
  requesterName: string;
  requesterAvatar?: string;
  addresseeId: number;
  addresseeName: string;
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
