import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { GraduationCap, Star, BookOpen, Crown, Lock, Check, Sparkles, ChevronRight, Play } from 'lucide-react-native';
import { MOCK_CURRICULUM, UnitNode } from '../../data/curriculumData';
import { useAuthStore } from '@/src/core/flows/authStore';

export const LearningPathScreen = () => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isPremium = currentUser?.plan !== 'free';

  const [selectedUnit, setSelectedUnit] = useState<UnitNode | null>(null);

  const handleNodePress = (unit: UnitNode) => {
    if (unit.is_premium && !isPremium) {
      router.push('/(student)/profile/premium' as any);
      return;
    }
    setSelectedUnit(unit);
  };

  const handleStartLesson = (unitId: string) => {
    setSelectedUnit(null);
    router.push(`/(student)/lesson/${unitId}` as any);
  };

  return (
    <View className="flex-1 bg-[#F8FAF9] pt-14 px-5 pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-xs font-bold text-secondary uppercase tracking-wider mb-0.5">
              Lộ Trình Học Phản Xạ
            </Text>
            <Text className="text-2xl font-bold text-neutralInk">Chương & Bài Học</Text>
          </View>

          {!isPremium && (
            <Pressable
              onPress={() => router.push('/(student)/profile/premium' as any)}
              className="bg-accent/20 border border-accent/40 px-3 py-1.5 rounded-full flex-row items-center gap-1 active:bg-accent/30"
            >
              <Crown color="#FFA726" size={14} />
              <Text className="text-xs font-bold text-amber-700">Mở Khóa All 👑</Text>
            </Pressable>
          )}
        </View>

        {/* Chapters Accordion / List */}
        {MOCK_CURRICULUM.map((chapter) => (
          <View key={chapter.id} className="mb-8">
            {/* Chapter Header Banner */}
            <View
              className={`p-4 rounded-2xl mb-6 flex-row justify-between items-center shadow-sm ${
                chapter.is_premium
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 bg-[#FF9800]'
                  : 'bg-[#4F46E5]'
              }`}
            >
              <View className="flex-1 mr-2">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-xs font-bold text-white/80 uppercase">
                    Chương {chapter.chapter_number}
                  </Text>
                  {chapter.is_premium && (
                    <View className="bg-amber-400 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-extrabold text-neutralInk">PREMIUM 👑</Text>
                    </View>
                  )}
                </View>
                <Text className="text-base font-bold text-white">{chapter.title_vi}</Text>
              </View>
            </View>

            {/* Units Path Nodes (Serpentine Layout) */}
            <View className="items-center px-4">
              {chapter.units.map((unit, index) => {
                const isCompleted = unit.status === 'completed';
                const isCurrent = unit.status === 'current';
                const isLocked = unit.is_premium && !isPremium;

                // Alternating node alignment: 0 -> center, 1 -> right, 2 -> center, 3 -> left
                const alignStyle =
                  index % 4 === 0
                    ? 'self-center'
                    : index % 4 === 1
                    ? 'self-end mr-8'
                    : index % 4 === 2
                    ? 'self-center'
                    : 'self-start ml-8';

                return (
                  <View key={unit.id} className={`my-5 relative items-center w-full`}>
                    {/* Floating "Start Here!" Badge for Current Active Node */}
                    {isCurrent && (
                      <View className="absolute -top-10 items-center z-20">
                        <View className="bg-[#FF6B35] px-3.5 py-1.5 rounded-xl shadow-md flex-row items-center gap-1">
                          <Text className="text-xs font-extrabold text-white">Start Here!</Text>
                        </View>
                        {/* Little triangle arrow */}
                        <View className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#FF6B35]" />
                      </View>
                    )}

                    <View className={`flex-row items-center gap-4 ${alignStyle}`}>
                      {/* Node Interactive Circle Button */}
                      <Pressable
                        onPress={() => handleNodePress(unit)}
                        className={`w-20 h-20 rounded-full justify-center items-center relative shadow-lg active:scale-95 ${
                          isCompleted
                            ? 'bg-[#0F7173] border-4 border-[#0F7173]/30'
                            : isCurrent
                            ? 'bg-[#FF6B35] border-8 border-[#FF6B35]/30 shadow-primary/50'
                            : isLocked
                            ? 'bg-gray-300 border-4 border-gray-200'
                            : 'bg-white border-4 border-[#0F7173]'
                        }`}
                      >
                        {isCompleted ? (
                          <Star color="#FFFFFF" size={32} fill="#FFFFFF" />
                        ) : isCurrent ? (
                          <GraduationCap color="#FFFFFF" size={36} />
                        ) : isLocked ? (
                          <Crown color="#64748B" size={28} />
                        ) : (
                          <BookOpen color="#0F7173" size={28} />
                        )}

                        {/* Completed Checkmark Badge */}
                        {isCompleted && (
                          <View className="w-6 h-6 rounded-full bg-[#FFC93C] justify-center items-center absolute -bottom-1 -right-1 border-2 border-white shadow-sm">
                            <Check color="#1E293B" size={14} strokeWidth={3} />
                          </View>
                        )}

                        {/* Premium Crown Badge */}
                        {unit.is_premium && (
                          <View className="w-6 h-6 rounded-full bg-amber-500 justify-center items-center absolute -top-1 -right-1 border-2 border-white shadow-sm">
                            <Crown color="#FFFFFF" size={12} />
                          </View>
                        )}
                      </Pressable>

                      {/* Side Info Banner Card for Active/Selected Units */}
                      {isCurrent ? (
                        <View className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-md max-w-[200px]">
                          <Text className="text-xs font-bold text-neutralInk mb-1">{unit.title_vi}</Text>
                          <Text className="text-[11px] text-neutralGray leading-4 line-clamp-2">
                            {unit.description_vi}
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-xs font-bold text-neutralInk text-center mt-1">
                          {unit.title_vi.split(':')[0]}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Unit Detail Modal */}
      <Modal visible={!!selectedUnit} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          {selectedUnit && (
            <View className="bg-white p-6 rounded-3xl w-full border border-gray-100 shadow-2xl">
              <View className="flex-row justify-between items-start mb-3">
                <View className="bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                  <Text className="text-xs font-bold text-secondary">
                    {selectedUnit.is_premium ? 'Gói Premium 👑' : 'Miễn Phí'}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedUnit(null)} className="p-1">
                  <Text className="text-base font-bold text-gray-400">✕</Text>
                </Pressable>
              </View>

              <Text className="text-xl font-bold text-neutralInk mb-1">{selectedUnit.title_vi}</Text>
              <Text className="text-xs text-neutralGray mb-4">{selectedUnit.title_en}</Text>
              <Text className="text-xs text-neutralInk leading-5 mb-6 bg-surface p-3 rounded-xl">
                {selectedUnit.description_vi}
              </Text>

              <View className="bg-surface p-3.5 rounded-2xl mb-6 flex-row justify-between items-center">
                <View>
                  <Text className="text-xs text-neutralGray">Tiến độ bài học</Text>
                  <Text className="text-sm font-bold text-neutralInk">
                    {selectedUnit.completed_lessons} / {selectedUnit.total_lessons} Bài hoàn thành
                  </Text>
                </View>
                <View className="bg-primary/20 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-primary">+{selectedUnit.xp_reward} XP</Text>
                </View>
              </View>

              <Pressable
                onPress={() => handleStartLesson(selectedUnit.id)}
                className="bg-[#4F46E5] py-4 rounded-2xl flex-row justify-center items-center gap-2 shadow-md active:bg-[#4338CA]"
              >
                <Play color="#FFFFFF" size={18} fill="#FFFFFF" />
                <Text className="text-white font-bold text-base">Bắt Đầu Học Ngay ➔</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};
