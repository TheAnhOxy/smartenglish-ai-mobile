import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { GraduationCap, BarChart2, Home, Bot, User } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { useTabBounce } from '@/src/hooks/useTabBounce';

// AnimatedTabIcon: icon nảy lên khi tab active
type AnimatedTabIconProps = { focused: boolean; children: React.ReactNode };
function AnimatedTabIcon({ focused, children }: AnimatedTabIconProps) {
  const { animatedStyle } = useTabBounce(focused);
  return <Animated.View style={[tabStyles.iconWrap, animatedStyle]}>{children}</Animated.View>;
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 32, height: 28 },
});

export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.1,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 12,
          paddingTop: 6,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 16,
        },
      }}
    >
      {/* 5 Main Bottom Tabs — AnimatedTabIcon với bounce spring */}
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Lộ trình',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <GraduationCap color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <BarChart2 color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <Home color={color} size={24} strokeWidth={focused ? 2.5 : 1.8} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Trợ lý',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <Bot color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </AnimatedTabIcon>
          ),
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
