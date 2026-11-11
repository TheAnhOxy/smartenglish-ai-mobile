import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Coins, ShieldCheck, ShoppingBag } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { withLoginRequired } from '@/src/core/components/GuestLoginPrompt';
import { buyShopItemApi, fetchGamificationDashboard, fetchShopItemsApi, ShopItem } from '../../data/gamificationApi';
import { BackButton } from '@/src/core/components/BackButton';

const notify = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

/** Cửa hàng đổi Coin lấy vật phẩm — danh sách, giá và số dư đều lấy từ Learning Service. */
const ShopContent = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const itemsQuery = useQuery({ queryKey: ['shop-items'], queryFn: fetchShopItemsApi });
  const statsQuery = useQuery({ queryKey: ['gamification-dashboard'], queryFn: () => fetchGamificationDashboard() });

  const coins = statsQuery.data?.coins ?? 0;
  const freezeOwned = statsQuery.data?.streakFreezeCount ?? 0;

  const handleBuy = async (item: ShopItem) => {
    if (buyingId) return;
    if (coins < item.costCoins) {
      notify('Chưa đủ Coin', `Cần ${item.costCoins} Coin, bạn đang có ${coins} Coin. Hoàn thành bài học để nhận thêm Coin.`);
      return;
    }
    setBuyingId(item.id);
    try {
      const updated = await buyShopItemApi(item.id, 1);
      if (updated) queryClient.setQueryData(['gamification-dashboard'], updated);
      await queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      notify('Đã mua', `Bạn đã nhận 1 "${item.name}".`);
    } catch (err: any) {
      notify('Không mua được', err?.response?.data?.message || 'Vui lòng thử lại sau.');
    } finally {
      setBuyingId(null);
    }
  };

  const loading = itemsQuery.isLoading || statsQuery.isLoading;
  const failed = itemsQuery.isError;
  const items = itemsQuery.data ?? [];

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>Cửa hàng</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 16 }}>
        <View style={s.balanceCard}>
          <View style={s.balanceItem}>
            <Coins size={18} color={colors.coin} />
            <Text style={s.balanceValue}>{coins.toLocaleString('vi-VN')}</Text>
            <Text style={s.balanceLabel}>Coin hiện có</Text>
          </View>
          <View style={s.divider} />
          <View style={s.balanceItem}>
            <ShieldCheck size={18} color={colors.primary} />
            <Text style={s.balanceValue}>{freezeOwned}</Text>
            <Text style={s.balanceLabel}>Bảo vệ chuỗi đang có</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.state}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : failed ? (
          <View style={s.state}>
            <AlertCircle size={24} color={colors.danger} />
            <Text style={s.stateText}>Không tải được cửa hàng</Text>
            <Pressable onPress={() => itemsQuery.refetch()} style={s.retryBtn}>
              <Text style={s.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={s.state}>
            <ShoppingBag size={24} color={colors.textFaint} />
            <Text style={s.stateText}>Cửa hàng chưa có vật phẩm</Text>
          </View>
        ) : (
          items.map((item) => {
            const buying = buyingId === item.id;
            return (
              <View key={item.id} style={s.itemCard}>
                <View style={s.itemIcon}>
                  <ShieldCheck size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Text style={s.itemDesc}>{item.descriptionVi}</Text>
                  <Pressable
                    onPress={() => handleBuy(item)}
                    disabled={buying}
                    style={[s.buyBtn, buying && { opacity: 0.6 }]}
                    accessibilityLabel={`Mua ${item.name} với giá ${item.costCoins} Coin`}
                  >
                    {buying ? <ActivityIndicator size="small" color={colors.coinDeep} /> : <Coins size={14} color={colors.coinDeep} />}
                    <Text style={s.buyText}>{item.costCoins.toLocaleString('vi-VN')} Coin</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export const ShopScreen = withLoginRequired(ShopContent);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 12 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
  },
  balanceItem: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { width: 1, height: 36, backgroundColor: colors.border },
  balanceValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  balanceLabel: { fontSize: 12, color: colors.textSoft },
  state: { paddingVertical: 32, alignItems: 'center', gap: 8 },
  stateText: { fontSize: 13, color: colors.textSoft },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  itemCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  itemIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemDesc: { fontSize: 13, color: colors.textSoft, lineHeight: 18 },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: colors.coinSoft,
    borderWidth: 1,
    borderColor: colors.coinBorder,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  buyText: { fontSize: 12, fontWeight: '700', color: colors.coinDeep },
});
