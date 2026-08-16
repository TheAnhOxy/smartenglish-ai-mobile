import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, Briefcase, Plane, GraduationCap, Coffee, Plus, Filter } from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';

export const DecksScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  const mockDecks = [
    {
      id: 'd-1',
      name: 'Business Idioms',
      count: 120,
      icon: Briefcase,
      color: 'bg-amber-100 text-amber-600',
      ringColor: '#FFC93C',
      progressPct: 65
    },
    {
      id: 'd-2',
      name: 'Travel Phrases',
      count: 45,
      icon: Plane,
      color: 'bg-cyan-100 text-cyan-600',
      ringColor: '#00BCD4',
      progressPct: 80
    },
    {
      id: 'd-3',
      name: 'IELTS Core Vocab',
      count: 300,
      icon: GraduationCap,
      color: 'bg-red-100 text-red-600',
      ringColor: '#FF6B35',
      progressPct: 40
    },
    {
      id: 'd-4',
      name: 'Slang & Casual',
      count: 80,
      icon: Coffee,
      color: 'bg-[#EDE9FE] text-[#7C3AED]',
      ringColor: '#7C3AED',
      progressPct: 0
    }
  ];

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    alert(`Đã tạo bộ thẻ "${newDeckName}" thành công!`);
    setNewDeckName('');
    setShowCreateModal(false);
  };

  return (
    <ScrollView className="flex-1 bg-[#F8FAF9] pt-12 px-6" showsVerticalScrollIndicator={false}>
      {/* Top Header Bar */}
      <View className="flex-row justify-between items-center mb-6">
        <Image
          source={{
            uri: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'
          }}
          className="w-10 h-10 rounded-full border border-gray-200"
        />

        <Text className="text-xl font-extrabold text-[#9A2C00] tracking-tight">SmartEnglish AI</Text>

        <Pressable
          onPress={() => router.push('/(student)/profile/premium' as any)}
          className="w-10 h-10 rounded-full bg-orange-50 justify-center items-center active:bg-orange-100"
        >
          <Zap color="#C23B00" size={22} fill="#C23B00" />
        </Pressable>
      </View>

      {/* Section Title */}
      <View className="flex-row justify-between items-end mb-6">
        <View>
          <Text className="text-3xl font-extrabold text-[#1E293B] tracking-tight">My Decks</Text>
          <Text className="text-xs text-neutralGray mt-1 font-medium">Keep the momentum going!</Text>
        </View>

        <Pressable onPress={() => alert('Lọc bộ thẻ...')} className="flex-row items-center gap-1">
          <Filter color="#0284C7" size={14} />
          <Text className="text-xs font-bold text-[#0284C7]">Filter</Text>
        </Pressable>
      </View>

      {/* Decks 2x2 Grid + Create Card */}
      <View className="flex-row flex-wrap justify-between gap-y-4 mb-12">
        {mockDecks.map((deck) => {
          const IconComp = deck.icon;
          return (
            <Pressable
              key={deck.id}
              onPress={() => router.push(`/(student)/review/decks/${deck.id}/study` as any)}
              className="w-[47.5%] bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative active:bg-gray-50 justify-between min-h-[170px]"
            >
              {/* Top Row: Icon Container & Circular Progress Indicator */}
              <View className="flex-row justify-between items-start">
                <View className={`w-12 h-12 rounded-2xl ${deck.color.split(' ')[0]} justify-center items-center`}>
                  <IconComp color={deck.ringColor} size={22} />
                </View>

                {/* Progress Ring Simulation */}
                <View className="w-8 h-8 rounded-full border-2 border-gray-100 justify-center items-center relative">
                  <View
                    className="w-full h-full rounded-full border-2 absolute"
                    style={{ borderColor: deck.ringColor, opacity: deck.progressPct > 0 ? 1 : 0.2 }}
                  />
                  <Text className="text-[9px] font-bold text-neutralGray">{deck.progressPct}%</Text>
                </View>
              </View>

              {/* Bottom Info: Title & Cards Count */}
              <View className="mt-4">
                <Text className="text-base font-bold text-[#1E293B] leading-5 mb-1" numberOfLines={2}>
                  {deck.name}
                </Text>
                <Text className="text-xs font-medium text-neutralGray">{deck.count} Cards</Text>
              </View>
            </Pressable>
          );
        })}

        {/* Create Deck Dashed Card */}
        <Pressable
          onPress={() => setShowCreateModal(true)}
          className="w-[47.5%] min-h-[170px] rounded-3xl border-2 border-dashed border-[#D6C5B8] items-center justify-center p-4 active:bg-orange-50/50"
        >
          <View className="w-14 h-14 rounded-2xl bg-[#EDE9FE]/60 justify-center items-center mb-3">
            <Plus color="#475569" size={28} />
          </View>
          <Text className="text-sm font-bold text-[#4E3B31]">Create Deck</Text>
        </Pressable>
      </View>

      {/* Create Deck Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white p-6 rounded-3xl w-full border border-gray-100 shadow-2xl">
            <Text className="text-xl font-bold text-neutralInk mb-1">Tạo Bộ Thẻ Flashcard Mới</Text>
            <Text className="text-xs text-neutralGray mb-4">Nhập tên bộ thẻ để bắt đầu thêm từ vựng</Text>

            <TextInput
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder="VD: Từ Vựng Chuyên Nành IT..."
              className="bg-surface p-4 rounded-2xl border border-gray-200 text-sm font-medium mb-6 text-neutralInk"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowCreateModal(false)}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 items-center"
              >
                <Text className="font-semibold text-neutralInk text-sm">Hủy</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateDeck}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF6B35] items-center shadow-md"
              >
                <Text className="text-white font-bold text-sm">Tạo Bộ Thẻ</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
