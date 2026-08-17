import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Menu,
  Search,
  UserPlus,
  UserCheck,
  Check,
  Plus,
  Heart,
  MessageSquare,
  Share2,
  Trophy,
  BookOpen,
  HelpCircle,
  Clock,
  Globe,
  Users,
  User,
  History,
  Image as ImageIcon,
  Smile,
  Flame,
  Award,
  ChevronDown,
  X,
  MessageCircle,
  Sparkles,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '@/src/core/flows/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ActiveTab = 'feed' | 'friends' | 'requests';

export const SocialFeedScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [feedSubTab, setFeedSubTab] = useState<'explore' | 'following'>('explore');
  const [friendsSubTab, setFriendsSubTab] = useState<'all' | 'requests' | 'suggestions'>('all');
  const [requestsSubTab, setRequestsSubTab] = useState<'pending' | 'suggestions' | 'sent'>('pending');

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Likes state tracking for feed posts
  const [likesCount, setLikesCount] = useState<Record<string, { count: number; liked: boolean }>>({
    p1: { count: 124, liked: false },
    p2: { count: 89, liked: false },
    p3: { count: 12, liked: false },
    p4: { count: 45, liked: false },
  });

  const toggleLike = (id: string) => {
    setLikesCount((prev) => {
      const current = prev[id] || { count: 0, liked: false };
      return {
        ...prev,
        [id]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked,
        },
      };
    });
  };

  // Mock Friends List for Screenshot 1
  const [friendsList, setFriendsList] = useState([
    { id: 'f1', name: 'Nguyen Van A', level: 'B2 Intermediate', status: 'none', avatar: 'https://i.pravatar.cc/100?img=5' },
    { id: 'f2', name: 'Tran Thi B', level: 'C1 Advanced', status: 'sent', avatar: 'https://i.pravatar.cc/100?img=12' },
    { id: 'f3', name: 'Le Van C', level: 'A2 Elementary', status: 'friends', avatar: 'https://i.pravatar.cc/100?img=9' },
  ]);

  // Mock Requests List for Screenshot 2
  const [requestsList, setRequestsList] = useState([
    { id: 'r1', name: 'Nguyễn Văn A', level: 'Level B1 · 12 bạn chung', time: 'Vừa gửi 5 phút trước', isOnline: true, status: 'pending', avatar: 'https://i.pravatar.cc/100?img=33' },
    { id: 'r2', name: 'Trần Thị B', level: 'Level A2 · 3 bạn chung', time: '2 giờ trước', isOnline: false, status: 'pending', avatar: 'https://i.pravatar.cc/100?img=20' },
    { id: 'r3', name: 'Lê Minh C', level: 'Đã trở thành bạn bè!', time: '', isOnline: true, status: 'accepted', avatar: 'https://i.pravatar.cc/100?img=15' },
  ]);

  const handleAcceptRequest = (id: string) => {
    setRequestsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'accepted', level: 'Đã trở thành bạn bè!' } : r))
    );
  };

  const handleDeclineRequest = (id: string) => {
    setRequestsList((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <View style={s.root}>
      {/* Top Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Pressable onPress={() => router.back()} style={s.headerIconBtn}>
            <Menu color="#1E3A5F" size={22} />
          </Pressable>
          <Text style={s.headerTitle}>SmartEnglish AI</Text>
        </View>

        <Image
          source={{
            uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
          }}
          style={s.headerAvatar}
        />
      </View>

      {/* Community Main Navigation Bar */}
      <View style={s.navRow}>
        <Pressable
          onPress={() => setActiveTab('feed')}
          style={[s.navBtn, activeTab === 'feed' && s.navBtnActive]}
        >
          <Globe color={activeTab === 'feed' ? '#FFFFFF' : '#64748B'} size={15} />
          <Text style={[s.navBtnText, activeTab === 'feed' && s.navBtnTextActive]}>
            Cộng Đồng
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('friends')}
          style={[s.navBtn, activeTab === 'friends' && s.navBtnActive]}
        >
          <Users color={activeTab === 'friends' ? '#FFFFFF' : '#64748B'} size={15} />
          <Text style={[s.navBtnText, activeTab === 'friends' && s.navBtnTextActive]}>
            Bạn Bè
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('requests')}
          style={[s.navBtn, activeTab === 'requests' && s.navBtnActive]}
        >
          <UserPlus color={activeTab === 'requests' ? '#FFFFFF' : '#64748B'} size={15} />
          <Text style={[s.navBtnText, activeTab === 'requests' && s.navBtnTextActive]}>
            Lời Mời
          </Text>
          <View style={s.badgeRed}><Text style={s.badgeRedText}>3</Text></View>
        </Pressable>
      </View>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SCREENSHOT 3: BẢNG TIN CỘNG ĐỒNG (FEED) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <View style={{ flex: 1 }}>
          {/* Sub-tabs: Khám phá / Đang theo dõi */}
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
                Đang theo dõi
              </Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Post 1: Linh Nguyen - Achievement */}
            <Animated.View entering={FadeInDown.delay(100)} style={s.postCard}>
              <View style={s.postHeader}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?img=33' }} style={s.postAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={s.postAuthor}>Linh Nguyen</Text>
                  <Text style={s.postTime}>2 hours ago</Text>
                </View>
                <View style={s.badgeAchievement}>
                  <Trophy color="#B45309" size={12} />
                  <Text style={s.badgeAchievementText}>Achievement</Text>
                </View>
              </View>

              <Text style={s.postContent}>
                Just finished my 30-day streak on SmartEnglish! 🎉 I can finally watch movies without subtitles. Consistency really is key. Next goal: C1 level!
              </Text>

              {/* Achievement Banner Graphic */}
              <View style={s.achievementGraphicBox}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600' }}
                  style={s.achievementGraphicImg}
                />
                <View style={s.achievementOverlay}>
                  <Text style={s.achievementTitle}>ConnectWell</Text>
                  <Text style={s.achievementSub}>🏆 30 DAY STREAK!</Text>
                </View>
              </View>

              {/* Actions Footer */}
              <View style={s.postFooter}>
                <Pressable onPress={() => toggleLike('p1')} style={s.actionBtn}>
                  <Heart
                    color={likesCount.p1?.liked ? '#EF4444' : '#64748B'}
                    fill={likesCount.p1?.liked ? '#EF4444' : 'none'}
                    size={18}
                  />
                  <Text style={[s.actionText, likesCount.p1?.liked && { color: '#EF4444' }]}>
                    {likesCount.p1?.count}
                  </Text>
                </Pressable>

                <Pressable style={s.actionBtn}>
                  <MessageSquare color="#64748B" size={18} />
                  <Text style={s.actionText}>18</Text>
                </Pressable>

                <Pressable style={s.actionBtn}>
                  <Share2 color="#64748B" size={18} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Post 2: Teacher Mark - Shared Deck */}
            <Animated.View entering={FadeInDown.delay(200)} style={s.postCard}>
              <View style={s.postHeader}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={s.postAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={s.postAuthor}>Teacher Mark</Text>
                  <Text style={s.postTime}>5 hours ago</Text>
                </View>
                <View style={s.badgeSharedDeck}>
                  <BookOpen color="#0369A1" size={12} />
                  <Text style={s.badgeSharedDeckText}>Shared Deck</Text>
                </View>
              </View>

              <Text style={s.postContent}>
                I've compiled a new flashcard deck for IELTS Academic Writing Task 1 vocabulary. It covers trends, comparisons, and processes. Hope this helps your preparation!
              </Text>

              <View style={s.postFooter}>
                <Pressable onPress={() => toggleLike('p2')} style={s.actionBtn}>
                  <Heart
                    color={likesCount.p2?.liked ? '#EF4444' : '#64748B'}
                    fill={likesCount.p2?.liked ? '#EF4444' : 'none'}
                    size={18}
                  />
                  <Text style={[s.actionText, likesCount.p2?.liked && { color: '#EF4444' }]}>
                    {likesCount.p2?.count}
                  </Text>
                </Pressable>

                <Pressable style={s.actionBtn}>
                  <MessageSquare color="#64748B" size={18} />
                  <Text style={s.actionText}>5</Text>
                </Pressable>

                <Pressable style={s.actionBtn}>
                  <Share2 color="#64748B" size={18} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Post 3: Tran Minh - Question */}
            <Animated.View entering={FadeInDown.delay(300)} style={s.postCard}>
              <View style={s.postHeader}>
                <View style={s.avatarLetterBg}><Text style={s.avatarLetter}>T</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.postAuthor}>Tran Minh</Text>
                  <Text style={s.postTime}>Yesterday</Text>
                </View>
                <View style={s.badgeQuestion}>
                  <HelpCircle color="#0D9488" size={12} />
                  <Text style={s.badgeQuestionText}>Question</Text>
                </View>
              </View>

              <Text style={s.postContent}>
                What's the difference between "affect" and "effect"? I keep making mistakes in my essays. Any easy way to remember?
              </Text>

              <View style={s.postFooter}>
                <Pressable onPress={() => toggleLike('p3')} style={s.actionBtn}>
                  <Heart
                    color={likesCount.p3?.liked ? '#EF4444' : '#64748B'}
                    fill={likesCount.p3?.liked ? '#EF4444' : 'none'}
                    size={18}
                  />
                  <Text style={[s.actionText, likesCount.p3?.liked && { color: '#EF4444' }]}>
                    {likesCount.p3?.count}
                  </Text>
                </Pressable>

                <Pressable style={s.actionBtn}>
                  <MessageSquare color="#64748B" size={18} />
                  <Text style={s.actionText}>24</Text>
                </Pressable>

                <Pressable style={s.actionBtn}>
                  <Share2 color="#64748B" size={18} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Post 4: Hoa Le - Study Log */}
            <Animated.View entering={FadeInDown.delay(400)} style={s.postCard}>
              <View style={s.postHeader}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?img=5' }} style={s.postAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={s.postAuthor}>Hoa Le</Text>
                  <Text style={s.postTime}>2 days ago</Text>
                </View>
                <View style={s.badgeStudyLog}>
                  <Clock color="#475569" size={12} />
                  <Text style={s.badgeStudyLogText}>Study Log</Text>
                </View>
              </View>

              <Text style={s.postContent}>
                Completed Chapter 4 of the Grammar module today. The AI tutor really helped clarify the passive voice rules. Feeling confident!
              </Text>

              <View style={s.postFooter}>
                <Pressable onPress={() => toggleLike('p4')} style={s.actionBtn}>
                  <Heart
                    color={likesCount.p4?.liked ? '#EF4444' : '#64748B'}
                    fill={likesCount.p4?.liked ? '#EF4444' : 'none'}
                    size={18}
                  />
                  <Text style={[s.actionText, likesCount.p4?.liked && { color: '#EF4444' }]}>
                    {likesCount.p4?.count}
                  </Text>
                </Pressable>

                <Pressable style={s.actionBtn}>
                  <MessageSquare color="#64748B" size={18} />
                  <Text style={s.actionText}>3</Text>
                </Pressable>

                <Pressable style={s.actionBtn}>
                  <Share2 color="#64748B" size={18} />
                </Pressable>
              </View>
            </Animated.View>

            <View style={{ height: 80 }} />
          </ScrollView>

          {/* Floating Action Button (FAB) + */}
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={s.fabBtn}
          >
            <Plus color="#FFFFFF" size={26} />
          </Pressable>
        </View>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SCREENSHOT 1: BẠN BÈ & TÌM KIẾM (FRIENDS LIST) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'friends' && (
        <View style={{ flex: 1 }}>
          {/* Search Box */}
          <View style={s.searchBox}>
            <Search color="#94A3B8" size={18} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm bạn theo tên hoặc số điện thoại..."
              placeholderTextColor="#94A3B8"
              style={s.searchInput}
            />
          </View>

          {/* Filter Sub-tabs */}
          <View style={s.friendsFilterRow}>
            <Pressable
              onPress={() => setFriendsSubTab('all')}
              style={[s.friendsFilterTab, friendsSubTab === 'all' && s.friendsFilterTabActive]}
            >
              <Text style={[s.friendsFilterText, friendsSubTab === 'all' && s.friendsFilterTextActive]}>
                Bạn bè
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFriendsSubTab('requests')}
              style={[s.friendsFilterTab, friendsSubTab === 'requests' && s.friendsFilterTabActive]}
            >
              <Text style={[s.friendsFilterText, friendsSubTab === 'requests' && s.friendsFilterTextActive]}>
                Lời mời
              </Text>
              <View style={s.badgeRedSmall}><Text style={s.badgeRedSmallText}>3</Text></View>
            </Pressable>

            <Pressable
              onPress={() => setFriendsSubTab('suggestions')}
              style={[s.friendsFilterTab, friendsSubTab === 'suggestions' && s.friendsFilterTabActive]}
            >
              <Text style={[s.friendsFilterText, friendsSubTab === 'suggestions' && s.friendsFilterTextActive]}>
                Gợi ý
              </Text>
            </Pressable>
          </View>

          {/* Friends Cards Matching Screenshot 1 */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {friendsList.map((friend) => (
              <Animated.View key={friend.id} entering={FadeInRight.delay(100)} style={s.friendCard}>
                <Image source={{ uri: friend.avatar }} style={s.friendAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={s.friendName}>{friend.name}</Text>
                  <View style={s.friendLevelBadge}>
                    <Text style={s.friendLevelText}>{friend.level}</Text>
                  </View>
                </View>

                {friend.status === 'none' && (
                  <Pressable
                    onPress={() => {
                      setFriendsList((prev) =>
                        prev.map((f) => (f.id === friend.id ? { ...f, status: 'sent' } : f))
                      );
                    }}
                    style={s.addFriendBtn}
                  >
                    <UserPlus color="#FFFFFF" size={16} />
                    <Text style={s.addFriendBtnText}>Kết bạn</Text>
                  </Pressable>
                )}

                {friend.status === 'sent' && (
                  <View style={s.sentFriendBtn}>
                    <UserCheck color="#64748B" size={16} />
                    <Text style={s.sentFriendBtnText}>Đã gửi</Text>
                  </View>
                )}

                {friend.status === 'friends' && (
                  <View style={s.isFriendBtn}>
                    <Check color="#0EA5E9" size={16} />
                    <Text style={s.isFriendBtnText}>Bạn bè</Text>
                  </View>
                )}
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SCREENSHOT 2: LỜI MỜI KẾT BẠN (FRIEND REQUESTS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <View style={{ flex: 1 }}>
          {/* Header Title Row */}
          <View style={s.reqHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.reqTitle}>Lời mời kết bạn</Text>
              <View style={s.reqBadgeCount}><Text style={s.reqBadgeCountText}>3</Text></View>
            </View>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <History color="#4F46E5" size={16} />
              <Text style={s.reqHistoryText}>Lịch sử</Text>
            </Pressable>
          </View>

          {/* Filter Chips */}
          <View style={s.chipsRow}>
            <Pressable
              onPress={() => setRequestsSubTab('pending')}
              style={[s.chipPill, requestsSubTab === 'pending' && s.chipPillActive]}
            >
              <Text style={[s.chipPillText, requestsSubTab === 'pending' && s.chipPillTextActive]}>
                Đang chờ (3)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRequestsSubTab('suggestions')}
              style={[s.chipPill, requestsSubTab === 'suggestions' && s.chipPillActive]}
            >
              <Text style={[s.chipPillText, requestsSubTab === 'suggestions' && s.chipPillTextActive]}>
                Gợi ý
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRequestsSubTab('sent')}
              style={[s.chipPill, requestsSubTab === 'sent' && s.chipPillActive]}
            >
              <Text style={[s.chipPillText, requestsSubTab === 'sent' && s.chipPillTextActive]}>
                Đã gửi
              </Text>
            </Pressable>
          </View>

          {/* Requests Cards List Matching Screenshot 2 */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {requestsList.map((req) => (
              <Animated.View key={req.id} entering={FadeInDown.delay(100)} style={s.reqCard}>
                {req.status === 'accepted' ? (
                  /* Accepted State Card */
                  <View style={s.acceptedCardInner}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <View style={{ position: 'relative' }}>
                        <Image source={{ uri: req.avatar }} style={s.reqAvatar} />
                        <View style={s.acceptedCheckBadge}>
                          <Check color="#FFFFFF" size={10} strokeWidth={3} />
                        </View>
                      </View>
                      <View>
                        <Text style={s.reqName}>{req.name}</Text>
                        <Text style={s.acceptedSuccessText}>Đã trở thành bạn bè!</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => router.push('/(student)/assistant' as any)}
                      style={s.chatWithFriendBtn}
                    >
                      <MessageCircle color="#4F46E5" size={16} />
                      <Text style={s.chatWithFriendBtnText}>Nhắn tin</Text>
                    </Pressable>
                  </View>
                ) : (
                  /* Pending Request Card */
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <View style={{ position: 'relative' }}>
                        <Image source={{ uri: req.avatar }} style={s.reqAvatar} />
                        <View
                          style={[
                            s.onlineStatusDot,
                            { backgroundColor: req.isOnline ? '#22C55E' : '#94A3B8' },
                          ]}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.reqName}>{req.name}</Text>
                        <Text style={s.reqLevelSub}>{req.level}</Text>
                        {req.time ? <Text style={s.reqTimeText}>{req.time}</Text> : null}
                      </View>
                    </View>

                    {/* Dual Action Buttons */}
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
            ))}
          </ScrollView>
        </View>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SCREENSHOT 4: TẠO BÀI VIẾT MỚI (CREATE POST MODAL) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal visible={showCreateModal} animationType="slide" transparent={false}>
        <View style={s.modalRoot}>
          {/* Modal Header */}
          <View style={s.modalHeader}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Text style={s.modalCancelText}>Hủy</Text>
            </Pressable>
            <Text style={s.modalTitle}>Tạo bài viết</Text>
            <Pressable
              onPress={() => {
                alert('Đã đăng bài viết thành công lên cộng đồng! 🎉');
                setShowCreateModal(false);
              }}
              style={s.modalSubmitBtn}
            >
              <Text style={s.modalSubmitText}>Đăng</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {/* User Info & Privacy Dropdown */}
            <View style={s.createUserRow}>
              <Image
                source={{
                  uri: currentUser?.avatar_url || 'https://i.pravatar.cc/100?img=33',
                }}
                style={s.createAvatar}
              />
              <View>
                <Text style={s.createAuthorName}>{currentUser?.display_name || 'Nguyễn Văn A'}</Text>
                <View style={s.privacyDropdownBtn}>
                  <Globe color="#475569" size={12} />
                  <Text style={s.privacyDropdownText}>Công khai</Text>
                  <ChevronDown color="#475569" size={12} />
                </View>
              </View>
            </View>

            {/* Post Input */}
            <TextInput
              multiline
              placeholder="Bạn đang nghĩ gì về quá trình học hôm nay?"
              placeholderTextColor="#94A3B8"
              style={s.createTextInput}
            />

            {/* Section 1: Khoe thành tích gần đây */}
            <View style={s.sectionWrap}>
              <View style={s.sectionHeaderRow}>
                <Trophy color="#D97706" size={16} />
                <Text style={s.sectionHeaderTitle}>Khoe thành tích gần đây</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <View style={s.achieveCard}>
                  <View style={s.achieveIconBg}><Flame color="#F97316" size={20} /></View>
                  <View>
                    <Text style={s.achieveCardTitle}>Chuỗi 30 Ngày</Text>
                    <Text style={s.achieveCardSub}>Hoàn thành bài tập liên tục</Text>
                  </View>
                </View>

                <View style={s.achieveCard}>
                  <View style={[s.achieveIconBg, { backgroundColor: '#FEF3C7' }]}><Award color="#D97706" size={20} /></View>
                  <View>
                    <Text style={s.achieveCardTitle}>Chinh phục B2</Text>
                    <Text style={s.achieveCardSub}>Đạt điểm Placement Test</Text>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Section 2: Chia sẻ bộ thẻ của bạn */}
            <View style={s.sectionWrap}>
              <View style={s.sectionHeaderRow}>
                <BookOpen color="#4F46E5" size={16} />
                <Text style={s.sectionHeaderTitle}>Chia sẻ bộ thẻ của bạn</Text>
              </View>

              <View style={s.deckGridRow}>
                <View style={s.deckCard}>
                  <View style={s.deckHeaderRow}>
                    <View style={s.deckIconBox}><Sparkles color="#4F46E5" size={16} /></View>
                    <View style={s.deckCountBadge}><Text style={s.deckCountText}>50 từ</Text></View>
                  </View>
                  <Text style={s.deckTitle}>IELTS Vocabulary 2024</Text>
                </View>

                <View style={s.deckCard}>
                  <View style={s.deckHeaderRow}>
                    <View style={[s.deckIconBox, { backgroundColor: '#D1FAE5' }]}><MessageCircle color="#10B981" size={16} /></View>
                    <View style={s.deckCountBadge}><Text style={s.deckCountText}>120 từ</Text></View>
                  </View>
                  <Text style={s.deckTitle}>Giao tiếp hàng ngày</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Attachment Toolbar */}
          <View style={s.createBottomBar}>
            <Pressable style={s.toolIconBtn}><ImageIcon color="#10B981" size={22} /></Pressable>
            <Pressable style={s.toolIconBtn}><Smile color="#F59E0B" size={22} /></Pressable>
            <Pressable style={s.toolIconBtn}><Trophy color="#D97706" size={22} /></Pressable>
            <Pressable style={s.toolIconBtn}><BookOpen color="#4F46E5" size={22} /></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAF9' },
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBtn: { padding: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E3A5F' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#0EA5E9' },
  navRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  navBtnActive: { backgroundColor: '#4F46E5' },
  navBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  navBtnTextActive: { color: '#FFFFFF' },
  badgeRed: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 100 },
  badgeRedText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
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
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
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
  badgeQuestion: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeQuestionText: { fontSize: 10, fontWeight: '700', color: '#0D9488' },
  badgeStudyLog: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeStudyLogText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  postContent: { fontSize: 13, color: '#334155', lineHeight: 20, fontWeight: '400', marginBottom: 12 },
  achievementGraphicBox: { height: 160, borderRadius: 20, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  achievementGraphicImg: { width: '100%', height: '100%' },
  achievementOverlay: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  achievementTitle: { fontSize: 11, fontWeight: '700', color: '#93C5FD' },
  achievementSub: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  postFooter: { flexDirection: 'row', gap: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  // Friends Section Styles (Screenshot 1)
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1E293B' },
  friendsFilterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  friendsFilterTab: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6 },
  friendsFilterTabActive: { borderBottomColor: '#4F46E5' },
  friendsFilterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  friendsFilterTextActive: { fontWeight: '800', color: '#4F46E5' },
  badgeRedSmall: { backgroundColor: '#EF4444', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  badgeRedSmallText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  friendCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendAvatar: { width: 44, height: 44, borderRadius: 22 },
  friendName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 3 },
  friendLevelBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  friendLevelText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  addFriendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addFriendBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  sentFriendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  sentFriendBtnText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  isFriendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  isFriendBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

  // Requests Section Styles (Screenshot 2)
  reqHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 14, marginBottom: 12 },
  reqTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
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
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reqAvatar: { width: 48, height: 48, borderRadius: 24 },
  onlineStatusDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#FFFFFF' },
  reqName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  reqLevelSub: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  reqTimeText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  reqDualActionRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  declineBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  declineBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  acceptedCardInner: { backgroundColor: '#F0F9FF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  acceptedCheckBadge: { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center' },
  acceptedSuccessText: { fontSize: 12, fontWeight: '700', color: '#0EA5E9', marginTop: 2 },
  chatWithFriendBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#C7D2FE' },
  chatWithFriendBtnText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },

  // Create Post Modal Styles (Screenshot 4)
  modalRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    paddingTop: 48,
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
  modalSubmitBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100 },
  modalSubmitText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  createUserRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  createAvatar: { width: 44, height: 44, borderRadius: 22 },
  createAuthorName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  privacyDropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  privacyDropdownText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  createTextInput: { fontSize: 15, color: '#1E293B', height: 110, textAlignVertical: 'top', marginBottom: 20 },
  sectionWrap: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  achieveCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', marginRight: 10, width: 200 },
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
