import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Minus, Plus, Volume1, Volume2, VolumeX } from 'lucide-react-native';
import { playSound } from '@/src/components/ds/feedback';
import { ds, dsRadius } from '@/src/theme/ds';
import { useBgmStore, VOLUME_STEP } from '@/src/core/services/backgroundMusic';

interface SoundControlProps {
  /** 'compact': nút nhỏ trên nền tối (màn đăng nhập). 'full': kèm thanh mức âm lượng (Cài đặt). */
  variant?: 'compact' | 'full';
}

const LEVELS = Math.round(1 / VOLUME_STEP);

/** Tắt/bật âm thanh và giảm/tăng âm lượng (nhạc nền + hiệu ứng bấm). */
export const SoundControl: React.FC<SoundControlProps> = ({ variant = 'full' }) => {
  const enabled = useBgmStore((s) => s.enabled);
  const volume = useBgmStore((s) => s.volume);
  const setEnabled = useBgmStore((s) => s.setEnabled);
  const stepVolume = useBgmStore((s) => s.stepVolume);

  const dark = variant === 'compact';
  const iconColor = dark ? ds.white : ds.ink;
  const mutedColor = dark ? ds.onInk : ds.faint;
  const VolumeIcon = !enabled ? VolumeX : volume >= 0.6 ? Volume2 : Volume1;
  const activeLevels = enabled ? Math.round(volume / VOLUME_STEP) : 0;

  const step = (direction: 1 | -1) => {
    stepVolume(direction);
    // Nghe thử mức mới (playSound tự im khi đang tắt tiếng)
    playSound('tap', 0.8);
  };

  return (
    <View style={[s.wrap, dark ? s.wrapDark : s.wrapLight]}>
      <Pressable
        onPress={() => setEnabled(!enabled)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={enabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
        style={[s.btn, dark && s.btnDark, !enabled && (dark ? s.mutedDark : s.mutedLight)]}
      >
        <VolumeIcon size={dark ? 16 : 18} color={enabled ? iconColor : ds.red} />
      </Pressable>

      <Pressable
        onPress={() => step(-1)}
        disabled={!enabled}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Giảm âm lượng"
        style={[s.btn, dark && s.btnDark, !enabled && s.disabled]}
      >
        <Minus size={dark ? 15 : 17} color={enabled ? iconColor : mutedColor} />
      </Pressable>

      {variant === 'full' ? (
        <View style={s.levels} accessibilityLabel={`Âm lượng ${activeLevels} trên ${LEVELS}`}>
          {Array.from({ length: LEVELS }, (_, i) => (
            <View
              key={i}
              style={[s.bar, { height: 8 + i * 3 }, i < activeLevels ? s.barOn : s.barOff]}
            />
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => step(1)}
        disabled={enabled && volume >= 1}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Tăng âm lượng"
        style={[s.btn, dark && s.btnDark, enabled && volume >= 1 && s.disabled]}
      >
        <Plus size={dark ? 15 : 17} color={iconColor} />
      </Pressable>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: dsRadius.full, padding: 3 },
  wrapLight: { backgroundColor: ds.bg, borderWidth: 1, borderColor: ds.line },
  wrapDark: { backgroundColor: ds.onInkFaint, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  btn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.card },
  btnDark: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'transparent' },
  mutedLight: { backgroundColor: ds.redSoft },
  mutedDark: { backgroundColor: 'rgba(255,255,255,0.9)' },
  disabled: { opacity: 0.4 },
  levels: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingHorizontal: 6, height: 24 },
  bar: { width: 5, borderRadius: 2 },
  barOn: { backgroundColor: ds.btn },
  barOff: { backgroundColor: ds.line },
});
