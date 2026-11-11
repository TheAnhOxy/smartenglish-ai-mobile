// Khối điểm của màn kết quả: nền navy, pháo giấy, cúp bật lên, điểm và XP đếm dần.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Award, Sparkles, Trophy, Target } from '@/src/components/ds/icons';
import { PulseRing, feedback } from '@/src/components/ds';
import { ds, dsFont, dsRadius, dsShadow, dsSize } from '@/src/theme/ds';

interface ResultCelebrationHeroProps {
  label: string;
  score: number;
  maxLabel: string;
  badgeText: string;
  xpEarned: number;
  passed: boolean;
}

const CONFETTI_COLORS = [ds.amber, ds.sky, ds.green, '#F472B6', ds.white, '#FCD34D'];

/** Đếm số từ 0 đến target bằng requestAnimationFrame */
function useCount(target: number, durationMs: number, delayMs = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const timer = setTimeout(() => {
      const step = (t: number) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / durationMs);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs]);
  return value;
}

const ConfettiPiece: React.FC<{ index: number; width: number; height: number }> = ({ index, width, height }) => {
  const v = useRef(new Animated.Value(0)).current;
  const cfg = useMemo(
    () => ({
      x: ((index * 37) % 100) / 100,
      drift: ((index * 53) % 40) - 20,
      delay: (index * 70) % 900,
      dur: 1800 + ((index * 131) % 1200),
      rot: (index % 2 ? 1 : -1) * (180 + ((index * 47) % 360)),
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      w: 6 + (index % 3) * 2,
      h: index % 4 === 0 ? 6 + (index % 3) * 2 : 12,
      round: index % 4 === 0,
    }),
    [index],
  );
  useEffect(() => {
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: cfg.dur,
      delay: cfg.delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [v, cfg]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -16,
        left: cfg.x * width,
        width: cfg.w,
        height: cfg.h,
        borderRadius: cfg.round ? cfg.w : 2,
        backgroundColor: cfg.color,
        opacity: v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height + 20] }) },
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, cfg.drift] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${cfg.rot}deg`] }) },
        ],
      }}
    />
  );
};

export const ResultCelebrationHero: React.FC<ResultCelebrationHeroProps> = ({ label, score, maxLabel, badgeText, xpEarned, passed }) => {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const pop = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const shownScore = useCount(Math.max(0, Math.round(score)), 1100, 350);
  const shownXp = useCount(Math.max(0, Math.round(xpEarned)), 900, 900);

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 14, delay: 120 }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(1600),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    const t = setTimeout(() => (passed ? feedback.fanfare() : feedback.success()), 250);
    return () => {
      loop.stop();
      clearTimeout(t);
    };
  }, [pop, shine, passed]);

  return (
    <View style={st.card} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={[st.dot, { width: 200, height: 200, right: -70, top: -90 }]} />
      <View style={[st.dot, { width: 120, height: 120, left: -50, bottom: -60 }]} />
      {passed && box.w > 0
        ? Array.from({ length: 28 }, (_, i) => <ConfettiPiece key={i} index={i} width={box.w} height={box.h} />)
        : null}

      <View style={st.badgeWrap}>
        <PulseRing size={84} color={passed ? ds.amber : ds.sky} />
        <Animated.View
          style={[
            st.badge,
            { backgroundColor: passed ? ds.amber : ds.sky, borderBottomColor: passed ? ds.amberDeep : ds.btn },
            {
              transform: [
                { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
              ],
            },
          ]}
        >
          {passed ? <Trophy color={ds.ink} size={40} fill={ds.white} /> : <Target color={ds.ink} size={40} fill={ds.white} />}
          <Animated.View
            pointerEvents="none"
            style={[
              st.shine,
              { transform: [{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-70, 70] }) }, { rotate: '20deg' }] },
            ]}
          />
        </Animated.View>
      </View>

      <Text style={st.label}>{label}</Text>
      <View style={st.scoreRow}>
        <Text style={st.score}>{shownScore}</Text>
        <Text style={st.max}>{maxLabel}</Text>
      </View>

      <View style={st.badgeRow}>
        <View style={st.pill}>
          <Award color={ds.skyLight} size={16} />
          <Text style={st.pillText}>{badgeText}</Text>
        </View>
        {xpEarned > 0 ? (
          <View style={[st.pill, st.pillXp]}>
            <Sparkles color={ds.ink} size={16} />
            <Text style={[st.pillText, { color: ds.ink }]}>+{shownXp} XP</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const st = StyleSheet.create({
  card: {
    backgroundColor: ds.ink,
    borderRadius: dsRadius.xl,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    ...dsShadow.lift,
  },
  dot: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(14,165,233,0.16)' },
  badgeWrap: { width: 88, height: 92, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    overflow: 'hidden',
  },
  shine: { position: 'absolute', width: 18, height: 120, backgroundColor: 'rgba(255,255,255,0.45)' },
  label: {
    fontFamily: dsFont.bold,
    fontSize: dsSize.xs,
    color: ds.skyLight,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  score: { fontFamily: dsFont.displayHeavy, fontSize: 56, color: ds.white, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  max: { fontFamily: dsFont.semibold, fontSize: dsSize.lg, color: ds.onInk, marginLeft: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ds.onInkFaint,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillXp: { backgroundColor: ds.amber },
  pillText: { fontFamily: dsFont.bold, fontSize: dsSize.xs, color: ds.white },
});
