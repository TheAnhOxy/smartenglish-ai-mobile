import { apiClient, getCurrentUserId } from '@/src/core/api/client';

export interface GamificationDashboard {
  userId: number;
  level: number;
  xpTotal: number;
  xpThisWeek: number;
  xpNextLevel: number;
  coins: number;
  gems: number;
  hearts: number;
  streakCurrent: number;
  streakLongest: number;
  streakFreezeCount: number;
  leagueLevel: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  descriptionVi: string;
  iconUrl?: string;
  emojiIcon?: string;
  isEarned: boolean;
  earnedAt?: string;
  category?: string;
}

export interface DailyQuestItem {
  id: string;
  questType: string;
  titleVi: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  gemsReward: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface DailyQuestResponse {
  date: string;
  quests: DailyQuestItem[];
  motivationalMessage?: string;
}

export interface ShopItem {
  id: string;
  itemType: string;
  name: string;
  descriptionVi: string;
  costGems: number;
  costCoins: number;
  iconUrl?: string;
}

/**
 * GET /api/v1/learning/gamification/dashboard
 */
export const fetchGamificationDashboard = async (userId?: string): Promise<GamificationDashboard | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>('/api/v1/learning/gamification/dashboard');
    const data = response.data?.data || response.data;
    return data || null;
  } catch (err) {
    console.warn('[Gamification] fetchGamificationDashboard error:', err);
    return null;
  }
};

/**
 * GET /api/v1/learning/gamification/badges
 */
export const fetchBadgesApi = async (userId?: string): Promise<BadgeItem[]> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>('/api/v1/learning/gamification/badges');
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      return data.map((b: any) => ({
        id: String(b.id || ''),
        name: b.name || b.nameVi || '',
        descriptionVi: b.descriptionVi || b.description || '',
        iconUrl: b.iconUrl || undefined,
        emojiIcon: b.emojiIcon || undefined,
        isEarned: Boolean(b.isEarned || b.earned),
        earnedAt: b.earnedAt || undefined,
        category: b.category || undefined
      }));
    }
  } catch (err) {
    console.warn('[Gamification] fetchBadgesApi error:', err);
  }
  return [];
};

/**
 * GET /api/v1/learning/gamification/daily-quests
 */
export const fetchDailyQuestsApi = async (userId?: string): Promise<DailyQuestResponse | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>('/api/v1/learning/gamification/daily-quests');
    const data = response.data?.data || response.data;
    if (data) {
      return {
        date: data.date || new Date().toISOString().split('T')[0],
        quests: Array.isArray(data.quests || data.dailyQuests)
          ? (data.quests || data.dailyQuests).map((q: any) => ({
              id: String(q.id || ''),
              questType: q.questType || q.type || '',
              titleVi: q.titleVi || q.title || 'Nhiệm vụ ngày',
              targetCount: q.targetCount || 1,
              currentCount: q.currentCount || q.progress || 0,
              xpReward: q.xpReward || 0,
              gemsReward: q.gemsReward || 0,
              isCompleted: Boolean(q.isCompleted || q.completed),
              isClaimed: Boolean(q.isClaimed || q.claimed)
            }))
          : [],
        motivationalMessage: data.motivationalMessage || undefined
      };
    }
  } catch (err) {
    console.warn('[Gamification] fetchDailyQuestsApi error:', err);
  }
  return null;
};

/**
 * POST /api/v1/learning/gamification/daily-quests/{id}/claim
 */
export const claimDailyQuestRewardApi = async (questId: string, userId?: string): Promise<GamificationDashboard | null> => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.post<any>(
      `/api/v1/learning/gamification/daily-quests/${questId}/claim`
    );
    return response.data?.data || response.data || null;
  } catch (err: any) {
    console.warn('[Gamification] claimDailyQuestRewardApi error:', err?.response?.data || err.message);
    throw err;
  }
};

/**
 * GET /api/v1/learning/gamification/shop/items
 */
export const fetchShopItemsApi = async (): Promise<ShopItem[]> => {
  const response = await apiClient.get<any>('/api/v1/learning/gamification/shop/items');
  const data = response.data?.data ?? response.data;
  if (!Array.isArray(data)) return [];
  return data.map((item: any) => ({
    id: String(item.itemId ?? item.id ?? ''),
    itemType: item.itemType ?? '',
    name: item.nameVi ?? item.name ?? '',
    descriptionVi: item.descriptionVi ?? '',
    costGems: Number(item.priceGems ?? 0),
    costCoins: Number(item.priceCoins ?? 0),
    iconUrl: item.iconUrl || undefined,
  }));
};

/**
 * POST /api/v1/learning/gamification/shop/buy — trả về bảng chỉ số mới (coin, số vật phẩm)
 */
export const buyShopItemApi = async (itemId: string, quantity: number = 1): Promise<GamificationDashboard | null> => {
  const response = await apiClient.post<any>('/api/v1/learning/gamification/shop/buy', { itemId, quantity });
  return response.data?.data ?? response.data ?? null;
};

/**
 * GET /api/v1/learning/gamification/leaderboard
 */
export const fetchLeaderboardApi = async (userId?: string) => {
  const uid = userId || getCurrentUserId();
  try {
    const response = await apiClient.get<any>('/api/v1/learning/gamification/leaderboard');
    return response.data?.data || response.data || null;
  } catch (err) {
    console.warn('[Gamification] fetchLeaderboardApi error:', err);
    return null;
  }
};
