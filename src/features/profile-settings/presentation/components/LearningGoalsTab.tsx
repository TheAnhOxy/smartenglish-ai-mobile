import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Target, BookOpen, Zap, Globe, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const CEFR_LEVELS = [
  { level: 'A1', title: 'Mới bắt đầu' },
  { level: 'A2', title: 'Sơ cấp' },
  { level: 'B1', title: 'Trung cấp' },
  { level: 'B2', title: 'Trung cao cấp' },
  { level: 'C1', title: 'Cao cấp' },
  { level: 'C2', title: 'Thành thạo' },
];

export const TARGET_GOALS = [
  'Giao tiếp tự tin',
  'IELTS 6.5+',
  'TOEIC 750+',
  'Phỏng vấn xin việc',
  'Du học & Định cư',
  'Tiếng Anh du lịch',
];

export const DAILY_XP_OPTIONS = [
  { xp: 10, label: '10 XP', desc: 'Nhẹ nhàng' },
  { xp: 20, label: '20 XP', desc: 'Vừa sức' },
  { xp: 30, label: '30 XP', desc: 'Chuẩn' },
  { xp: 50, label: '50 XP', desc: 'Nghiêm túc' },
  { xp: 100, label: '100 XP', desc: 'Siêu cao thủ' },
];

interface LearningGoalsTabProps {
  cefrLevel: string;
  setCefrLevel: (val: string) => void;
  targetGoal: string;
  setTargetGoal: (val: string) => void;
  dailyGoalXp: number;
  setDailyGoalXp: (val: number) => void;
  uiLanguage: string;
  setUiLanguage: (val: string) => void;
  handleSave: () => void;
  isSaving: boolean;
}

export const LearningGoalsTab: React.FC<LearningGoalsTabProps> = ({
  cefrLevel,
  setCefrLevel,
  targetGoal,
  setTargetGoal,
  dailyGoalXp,
  setDailyGoalXp,
  uiLanguage,
  setUiLanguage,
  handleSave,
  isSaving,
}) => {
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      {/* CEFR Level Card */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <Target color="#0284C7" size={18} />
          <Text className="text-sm font-bold text-gray-800">Trình độ CEFR hiện tại</Text>
        </View>

        <View className="flex-row flex-wrap gap-2.5">
          {CEFR_LEVELS.map((item) => {
            const isSelected = cefrLevel.toUpperCase() === item.level;
            return (
              <Pressable
                key={item.level}
                onPress={() => setCefrLevel(item.level)}
                className={`w-[31%] py-3 px-2 rounded-2xl border items-center ${
                  isSelected
                    ? 'bg-[#0284C7] border-[#0284C7] shadow-sm'
                    : 'bg-gray-50 border-gray-200 active:bg-gray-100'
                }`}
              >
                <Text className={`text-base font-extrabold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {item.level}
                </Text>
                <Text className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-sky-100' : 'text-gray-500'}`}>
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Target Goal Card */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <BookOpen color="#0EA5E9" size={18} />
          <Text className="text-sm font-bold text-gray-800">Mục tiêu học tập</Text>
        </View>

        <View className="flex-row flex-wrap gap-2 mb-3">
          {TARGET_GOALS.map((goal) => {
            const isSelected = targetGoal === goal;
            return (
              <Pressable
                key={goal}
                onPress={() => setTargetGoal(goal)}
                className={`px-3.5 py-2 rounded-full border ${
                  isSelected ? 'bg-[#00BCD4] border-[#00BCD4]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                  {goal}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={targetGoal}
          onChangeText={setTargetGoal}
          placeholder="Hoặc nhập mục tiêu riêng của bạn..."
          placeholderTextColor="#9CA3AF"
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 font-medium"
        />
      </View>

      {/* Daily XP Goal */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <Zap color="#F59E0B" size={18} fill="#F59E0B" />
          <Text className="text-sm font-bold text-gray-800">Mục tiêu XP mỗi ngày</Text>
        </View>

        <View className="gap-2.5">
          {DAILY_XP_OPTIONS.map((item) => {
            const isSelected = dailyGoalXp === item.xp;
            return (
              <Pressable
                key={item.xp}
                onPress={() => setDailyGoalXp(item.xp)}
                className={`p-3.5 rounded-2xl border flex-row justify-between items-center ${
                  isSelected ? 'bg-amber-50 border-amber-400' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-7 h-7 rounded-xl justify-center items-center ${
                      isSelected ? 'bg-amber-500' : 'bg-gray-200'
                    }`}
                  >
                    <Zap color={isSelected ? '#FFFFFF' : '#6B7280'} size={14} />
                  </View>
                  <Text className={`text-sm font-bold ${isSelected ? 'text-amber-900' : 'text-gray-800'}`}>
                    {item.label}
                  </Text>
                  <Text className="text-xs text-gray-500 font-medium">({item.desc})</Text>
                </View>
                {isSelected && <Check color="#D97706" size={18} strokeWidth={3} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Language Selection */}
      <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
        <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <Globe color="#10B981" size={18} />
          <Text className="text-sm font-bold text-gray-800">Ngôn ngữ ứng dụng</Text>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setUiLanguage('vi')}
            className={`flex-1 py-3 rounded-2xl border items-center ${
              uiLanguage === 'vi' ? 'bg-[#0D3B73] border-[#0D3B73]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Text className={`text-xs font-bold ${uiLanguage === 'vi' ? 'text-white' : 'text-gray-800'}`}>
              Tiếng Việt 🇻🇳
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setUiLanguage('en')}
            className={`flex-1 py-3 rounded-2xl border items-center ${
              uiLanguage === 'en' ? 'bg-[#0D3B73] border-[#0D3B73]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Text className={`text-xs font-bold ${uiLanguage === 'en' ? 'text-white' : 'text-gray-800'}`}>
              English 🇬🇧
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom Save Button */}
      <Pressable
        onPress={handleSave}
        disabled={isSaving}
        className="bg-[#0D3B73] py-4 rounded-2xl items-center shadow-md active:bg-[#0a2f5c] flex-row justify-center gap-2 mb-8"
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Check color="#FFFFFF" size={18} strokeWidth={3} />
            <Text className="text-sm font-bold text-white">Lưu Thiết Lập Học Tập</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};
