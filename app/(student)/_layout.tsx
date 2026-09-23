import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { GraduationCap, BarChart2, Home, Bot, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme/colors';

export default function StudentTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const tabBarHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 8
        }
      }}
    >
      {/* 5 Main Bottom Tabs matching design */}
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Lộ trình',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-10 h-7 rounded-xl items-center justify-center ${focused ? 'bg-sky-50' : 'bg-transparent'}`}>
              <GraduationCap color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-10 h-7 rounded-xl items-center justify-center ${focused ? 'bg-sky-50' : 'bg-transparent'}`}>
              <BarChart2 color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-12 h-7 rounded-2xl items-center justify-center ${focused ? 'bg-[#0284C7]' : 'bg-transparent'}`}>
              <Home color={focused ? '#FFFFFF' : color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Trợ lý AI',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-10 h-7 rounded-xl items-center justify-center ${focused ? 'bg-sky-50' : 'bg-transparent'}`}>
              <Bot color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-10 h-7 rounded-xl items-center justify-center ${focused ? 'bg-sky-50' : 'bg-transparent'}`}>
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          )
        }}
      />

      {/* Hide Non-Tab Subroutes from Bottom Navigation Bar */}
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="profile/premium" options={{ href: null }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
      <Tabs.Screen name="league" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="daily-challenge" options={{ href: null }} />
      <Tabs.Screen name="feed" options={{ href: null }} />
      <Tabs.Screen name="iot" options={{ href: null }} />
      <Tabs.Screen name="knowledge-gap" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="referral" options={{ href: null }} />
      <Tabs.Screen name="shop" options={{ href: null }} />

      {/* Nested folder subroutes */}
      <Tabs.Screen name="classes/index" options={{ href: null }} />
      <Tabs.Screen name="classes/join" options={{ href: null }} />
      <Tabs.Screen name="classes/[classId]/index" options={{ href: null }} />
      <Tabs.Screen name="classes/[classId]/assignments" options={{ href: null }} />

      <Tabs.Screen name="lesson/[id]" options={{ href: null }} />

      <Tabs.Screen name="practice/scan/index" options={{ href: null }} />
      <Tabs.Screen name="practice/scan/result" options={{ href: null }} />
      <Tabs.Screen name="practice/scan/[wordId]" options={{ href: null }} />
      <Tabs.Screen name="practice/speaking/index" options={{ href: null }} />
      <Tabs.Screen name="practice/speaking/ipa" options={{ href: null }} />
      <Tabs.Screen name="practice/speaking/single-practice" options={{ href: null }} />
      <Tabs.Screen name="practice/speaking/detailed-feedback" options={{ href: null }} />
      <Tabs.Screen name="practice/speaking/unit-roleplay" options={{ href: null }} />
      <Tabs.Screen name="practice/speaking/roleplay/index" options={{ href: null }} />
      <Tabs.Screen name="practice/speaking/roleplay/[scenarioId]" options={{ href: null }} />
      <Tabs.Screen name="practice/writing/index" options={{ href: null }} />
      <Tabs.Screen name="practice/writing/editor" options={{ href: null }} />
      <Tabs.Screen name="practice/writing/analysis" options={{ href: null }} />
      <Tabs.Screen name="practice/writing/compare" options={{ href: null }} />
      <Tabs.Screen name="practice/chatbot/index" options={{ href: null }} />
      <Tabs.Screen name="practice/chatbot/[conversationId]" options={{ href: null }} />
      <Tabs.Screen name="practice/quiz/index" options={{ href: null }} />
      <Tabs.Screen name="practice/quiz/play" options={{ href: null }} />
      <Tabs.Screen name="practice/quiz/result" options={{ href: null }} />
      <Tabs.Screen name="practice/quiz/[quizId]" options={{ href: null }} />
      <Tabs.Screen name="practice/exam/[examId]" options={{ href: null }} />
      <Tabs.Screen name="practice/exam/result" options={{ href: null }} />
      <Tabs.Screen name="practice/reading/[passageId]" options={{ href: null }} />
      <Tabs.Screen name="practice/reading/generate" options={{ href: null }} />
      <Tabs.Screen name="practice/listening/[audioId]" options={{ href: null }} />

      <Tabs.Screen name="review/index" options={{ href: null }} />
      <Tabs.Screen name="review/decks/index" options={{ href: null }} />
      <Tabs.Screen name="review/decks/[deckId]/study" options={{ href: null }} />
      <Tabs.Screen name="review/topics" options={{ href: null }} />
      <Tabs.Screen name="review/manage" options={{ href: null }} />
    </Tabs>
  );
}
