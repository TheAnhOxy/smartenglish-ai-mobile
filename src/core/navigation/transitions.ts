import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';

type TabScreenOptions = Extract<
  NonNullable<ComponentProps<typeof Tabs>['screenOptions']>,
  { sceneStyleInterpolator?: unknown }
>;

/**
 * Chuyển màn trong thanh tab (gồm cả các màn chi tiết là tab ẩn):
 * màn mới trượt nhẹ vào + mờ dần + phóng nhẹ từ 0.97, chạy bằng lò xo ở native driver.
 * progress: -1 (màn bên trái) → 0 (đang hiện) → 1 (màn bên phải).
 */
export const tabSceneTransition: Pick<TabScreenOptions, 'sceneStyleInterpolator' | 'transitionSpec'> = {
  sceneStyleInterpolator: ({ current }) => ({
    sceneStyle: {
      opacity: current.progress.interpolate({ inputRange: [-1, -0.6, 0, 0.6, 1], outputRange: [0, 0.4, 1, 0.4, 0] }),
      transform: [
        { translateX: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [-36, 0, 36] }) },
        { scale: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.97, 1, 0.97] }) },
      ],
    },
  }),
  transitionSpec: {
    animation: 'spring',
    config: { stiffness: 320, damping: 32, mass: 0.9, overshootClamping: true },
  },
};
