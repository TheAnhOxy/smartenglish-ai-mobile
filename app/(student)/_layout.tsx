import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { GraduationCap, BarChart2, Home, Bot, User } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';

export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#06B6D4',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 5
        }
      }}
    >
      {/* 5 Main Bottom Tabs matching design image */}
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size || 22} />
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size || 22} />
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#06B6D4' : 'transparent',
                paddingHorizontal: focused ? 14 : 0,
                paddingVertical: focused ? 6 : 0,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Home color={focused ? '#FFFFFF' : color} size={22} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Trợ lý',
          tabBarIcon: ({ color, size }) => <Bot color={color} size={size || 22} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size || 22} />
        }}
      />

      {/* Hide Non-Tab Subroutes from Bottom Navigation Bar */}
      <Tabs.Screen name="profile/premium" options={{ href: null }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
      <Tabs.Screen name="practice" options={{ href: null }} />
      <Tabs.Screen name="review" options={{ href: null }} />
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
      <Tabs.Screen name="practice/quiz/[quizId]" options={{ href: null }} />
      <Tabs.Screen name="practice/exam/[examId]" options={{ href: null }} />
      <Tabs.Screen name="practice/exam/result" options={{ href: null }} />
      <Tabs.Screen name="practice/reading/[passageId]" options={{ href: null }} />
      <Tabs.Screen name="practice/reading/generate" options={{ href: null }} />
      <Tabs.Screen name="practice/listening/[audioId]" options={{ href: null }} />

      <Tabs.Screen name="review/decks/index" options={{ href: null }} />
      <Tabs.Screen name="review/decks/[deckId]/study" options={{ href: null }} />
      <Tabs.Screen name="review/topics" options={{ href: null }} />
      <Tabs.Screen name="review/manage" options={{ href: null }} />
    </Tabs>
  );
}
