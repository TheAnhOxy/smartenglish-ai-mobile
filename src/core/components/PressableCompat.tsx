import React, { forwardRef, useState } from 'react';
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
} from 'react-native';

/**
 * Pressable hỗ trợ đúng `style` / `children` dạng hàm `({ pressed }) => ...`.
 *
 * Lý do: Pressable của react-native được NativeWind bọc lại; với bọc đó style dạng hàm KHÔNG được áp dụng
 * (đo thực tế trên iOS + Android trong Modal): nút micro mất kích thước/nền (vô hình nhưng vẫn bấm được),
 * hàng `flexDirection: 'row'` thành cột làm thẻ bị kéo dài cả màn hình, nút quay lại mất khung.
 * Ở đây tự theo dõi trạng thái nhấn và tính style/children thành giá trị thường trước khi truyền xuống.
 */
export const Pressable = forwardRef<React.ComponentRef<typeof RNPressable>, PressableProps>(({ style, children, onPressIn, onPressOut, ...rest }, ref) => {
  const [pressed, setPressed] = useState(false);
  const state = { pressed, hovered: false } as PressableStateCallbackType;
  const resolvedStyle = typeof style === 'function' ? style(state) : style;
  const resolvedChildren = typeof children === 'function' ? children(state) : children;
  return (
    <RNPressable
      ref={ref}
      {...rest}
      style={resolvedStyle}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        onPressOut?.(e);
      }}
    >
      {resolvedChildren}
    </RNPressable>
  );
});

Pressable.displayName = 'PressableCompat';
