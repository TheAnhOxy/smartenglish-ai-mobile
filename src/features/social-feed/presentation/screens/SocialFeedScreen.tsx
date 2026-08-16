import React, { useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSocialFeedQuery } from '../../application/useSocialFeed';
import { CreatePostModal } from './CreatePostModal';

export const SocialFeedScreen = () => {
  const router = useRouter();
  const { data: posts, isLoading } = useSocialFeedQuery();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <View className="flex-1 bg-surface pt-14 px-6 pb-6">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-neutralInk">Cộng Đồng Học Viên 🌐</Text>
          <Text className="text-xs text-neutralGray mt-0.5">Chia sẻ cột mốc & truyền cảm hứng cùng nhau</Text>
        </View>

        <Pressable
          onPress={() => setShowCreateModal(true)}
          className="bg-primary px-3.5 py-1.5 rounded-full shadow-sm"
        >
          <Text className="text-xs font-bold text-white">+ Đăng Bài</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#FF6B35" size="large" />
      ) : (
        <FlatList
          data={posts || []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-cardWhite p-5 rounded-2xl border border-gray-100 mb-4 shadow-sm">
              <View className="flex-row items-center gap-3 mb-3">
                <Image source={{ uri: item.user_avatar }} className="w-10 h-10 rounded-full bg-gray-200" />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-neutralInk">{item.user_name}</Text>
                  <Text className="text-[10px] text-neutralGray">{item.created_at}</Text>
                </View>
              </View>

              <View className="bg-secondary/10 p-3 rounded-xl border border-secondary/20 mb-3">
                <Text className="text-xs font-bold text-secondary">{item.milestone_title}</Text>
              </View>

              <Text className="text-xs text-neutralInk leading-5 mb-4">{item.content}</Text>

              <View className="flex-row gap-4 border-t border-gray-100 pt-3">
                <Pressable className="flex-row items-center gap-1.5">
                  <Text className="text-sm">❤️</Text>
                  <Text className="text-xs text-neutralGray font-medium">{item.likes_count}</Text>
                </Pressable>
                <Pressable className="flex-row items-center gap-1.5">
                  <Text className="text-sm">💬</Text>
                  <Text className="text-xs text-neutralGray font-medium">{item.comments_count}</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <CreatePostModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </View>
  );
};
