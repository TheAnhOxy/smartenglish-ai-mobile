import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Animated, StyleSheet } from 'react-native';
import { GraduationCap, BarChart2, Home, Bot, User } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { useTabBounce } from '@/src/hooks/useTabBounce';
import { useRoleGateStore } from '@/src/core/flows/roleGateStore';
import { useAuthStore } from '@/src/core/flows/authStore';
import { tabSceneTransition } from '@/src/core/navigation/transitions';
import { isDarkTheme } from '@/src/theme/themeMode';
import { useThemeSwitching } from '@/src/theme/useThemeMode';

// AnimatedTabIcon: icon nảy lên khi tab active
type AnimatedTabIconProps = { focused: boolean; children: React.ReactNode };
function AnimatedTabIcon({ focused, children }: AnimatedTabIconProps) {
  const { animatedStyle } = useTabBounce(focused);
  return <Animated.View style={[tabStyles.iconWrap, animatedStyle]}>{children}</Animated.View>;
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 32, height: 28 },
});

// Màn chi tiết: ẩn nút trên thanh tab nhưng vẫn điều hướng tới được.
// Không dùng `href: null`: từ expo-router 58 nó thành `hidden: true`, và tab ẩn đang mở sẽ bị đẩy về tab đầu (Trang chủ).
const hiddenTabButton = () => null;
const hideTabOptions = {
  tabBarButton: hiddenTabButton,
  tabBarItemStyle: { display: 'none' as const },
  tabBarStyle: { display: 'none' as const },
  // Chỉ màn chi tiết có hiệu ứng: trượt nhẹ + mờ dần + phóng nhẹ (lò xo, native driver)
  ...tabSceneTransition,
};

export default function StudentTabsLayout() {
  // Vừa đổi Sáng/Tối: màn chi tiết không chạy hiệu ứng trượt khi app quay lại đúng màn đang mở
  const switching = useThemeSwitching();
  const hideOptions = switching ? { ...hideTabOptions, sceneStyleInterpolator: undefined, transitionSpec: undefined, animation: 'none' as const } : hideTabOptions;
  const { hasPermission, syncRolePermissions } = useRoleGateStore();

  useEffect(() => {
    syncRolePermissions();
  }, [syncRolePermissions]);

  const canLearnOrQuiz = hasPermission('learn_courses') || hasPermission('take_quiz_exam');
  const isLoggedIn = useAuthStore((st) => !!st.currentUser);

  return (
    <Tabs
      // Các màn chi tiết là tab ẩn: phải nhớ lịch sử để nút quay lại về đúng màn trước, không nhảy về tab đầu
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // Chuyển giữa các tab chính: tức thì, không hiệu ứng
        animation: 'none',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.1,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          // Tối: viền mảnh tách thanh tab khỏi nội dung (bóng không thấy trên nền tối)
          borderTopWidth: isDarkTheme() ? 1 : 0,
          borderTopColor: colors.border,
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
        name="learn"
        options={{
          title: 'Lộ trình',
          href: canLearnOrQuiz ? undefined : null,
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
          href: isLoggedIn ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <BarChart2 color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Trợ lý',
          // Không đặt ở thanh tab: vào từ lối tắt "Hội thoại AI" ở Trang chủ, màn chat có nút quay lại
          tabBarButton: hiddenTabButton,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
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
      <Tabs.Screen name="profile/classes" options={hideOptions} />
      <Tabs.Screen name="profile/edit" options={hideOptions} />
      <Tabs.Screen name="profile/invoices" options={hideOptions} />
      <Tabs.Screen name="profile/premium" options={hideOptions} />
      <Tabs.Screen name="profile/settings" options={hideOptions} />
      <Tabs.Screen name="profile/sessions" options={hideOptions} />
      <Tabs.Screen name="league" options={hideOptions} />
      <Tabs.Screen name="analytics" options={hideOptions} />
      <Tabs.Screen name="daily-challenge" options={hideOptions} />
      <Tabs.Screen name="feed" options={hideOptions} />
      <Tabs.Screen name="iot" options={hideOptions} />
      <Tabs.Screen name="knowledge-gap" options={hideOptions} />
      <Tabs.Screen name="notifications" options={hideOptions} />
      <Tabs.Screen name="referral" options={hideOptions} />
      <Tabs.Screen name="shop" options={hideOptions} />

      {/* Nested folder subroutes */}
      <Tabs.Screen name="classes/index" options={hideOptions} />
      <Tabs.Screen name="classes/join" options={hideOptions} />
      <Tabs.Screen name="classes/[classId]/index" options={hideOptions} />
      <Tabs.Screen name="classes/[classId]/assignments" options={hideOptions} />

      <Tabs.Screen name="lesson/[id]" options={hideOptions} />

      <Tabs.Screen name="practice/scan/index" options={hideOptions} />
      <Tabs.Screen name="practice/scan/result" options={hideOptions} />
      <Tabs.Screen name="practice/scan/[wordId]" options={hideOptions} />
      <Tabs.Screen name="practice/speaking/index" options={hideOptions} />
      <Tabs.Screen name="practice/speaking/ipa" options={hideOptions} />
      <Tabs.Screen name="practice/speaking/single-practice" options={hideOptions} />
      <Tabs.Screen name="practice/speaking/detailed-feedback" options={hideOptions} />
      <Tabs.Screen name="practice/speaking/unit-roleplay" options={hideOptions} />
      <Tabs.Screen name="practice/speaking/roleplay/index" options={hideOptions} />
      <Tabs.Screen name="practice/speaking/roleplay/[scenarioId]" options={hideOptions} />
      <Tabs.Screen name="practice/writing/index" options={hideOptions} />
      <Tabs.Screen name="practice/writing/editor" options={hideOptions} />
      <Tabs.Screen name="practice/writing/analysis" options={hideOptions} />
      <Tabs.Screen name="practice/writing/compare" options={hideOptions} />
      <Tabs.Screen name="practice/chatbot/index" options={hideOptions} />
      <Tabs.Screen name="practice/chatbot/[conversationId]" options={hideOptions} />
      <Tabs.Screen name="practice/quiz/index" options={hideOptions} />
      <Tabs.Screen name="practice/quiz/play" options={hideOptions} />
      <Tabs.Screen name="practice/quiz/result" options={hideOptions} />
      <Tabs.Screen name="practice/quiz/[quizId]" options={hideOptions} />
      <Tabs.Screen name="practice/exam/[examId]" options={hideOptions} />
      <Tabs.Screen name="practice/exam/result" options={hideOptions} />
      <Tabs.Screen name="practice/reading/index" options={hideOptions} />
      <Tabs.Screen name="practice/reading/[passageId]" options={hideOptions} />
      <Tabs.Screen name="practice/reading/generate" options={hideOptions} />
      <Tabs.Screen name="practice/listening/index" options={hideOptions} />
      <Tabs.Screen name="practice/listening/[audioId]" options={hideOptions} />


      <Tabs.Screen name="placement/index" options={hideOptions} />
      <Tabs.Screen name="placement/test" options={hideOptions} />
      <Tabs.Screen name="placement/result" options={hideOptions} />
      <Tabs.Screen name="courses/index" options={hideOptions} />
      <Tabs.Screen name="courses/[courseId]" options={hideOptions} />

      <Tabs.Screen name="review/index" options={hideOptions} />
      <Tabs.Screen name="review/due" options={hideOptions} />
      <Tabs.Screen name="review/decks/index" options={hideOptions} />
      <Tabs.Screen name="review/decks/[deckId]/study" options={hideOptions} />
      <Tabs.Screen name="review/topics" options={hideOptions} />
      <Tabs.Screen name="review/manage" options={hideOptions} />
    </Tabs>
  );
}
