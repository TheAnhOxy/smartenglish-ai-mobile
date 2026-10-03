# UI Refresh Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Nang cap visual layer cua Home Screen + Tab Bar len phong cach Playful & Premium voi gradient cards, bounce tab animation, glassmorphism, va bo icon AI du thua.

**Architecture:** Them src/theme/gradients.ts va 2 hooks moi (useTabBounce, usePulseRing). Apply vao Tab Bar layout roi HomeScreen. Khong cham logic/routing.

**Tech Stack:** Reanimated 4.5, expo-linear-gradient (co san), expo-blur (can kiem tra), NativeWind, TypeScript strict.

**Spec:** docs/superpowers/specs/2026-09-30-ui-refresh-phase1-design.md

## Global Constraints
- RN 0.86.3, Expo SDK 57
- TypeScript strict, khong any
- Khong sua logic/API/state/routing
- Khong xoa LoxeraFoxMascot
- expo-linear-gradient da co trong package.json

## Task 1: Gradient Tokens
Files: CREATE src/theme/gradients.ts, MODIFY src/theme/index.ts (+1 dong export)
- [ ] Tao src/theme/gradients.ts: cardGradients {scan, flashcard, chat, quiz}, heroGradient, cardShadowColors
- [ ] Export tu src/theme/index.ts: export * from ./gradients
- [ ] tsc --noEmit: 0 errors
- [ ] git commit -m "feat(theme): add gradient palette"

## Task 2: Hook useTabBounce
Files: CREATE src/hooks/useTabBounce.ts
- [ ] useTabBounce(focused: boolean) -> { animatedStyle }
      focused=true: scale 1->1.15, translateY 0->-4 (spring.bouncy)
      focused=false: nguoc lai
- [ ] tsc --noEmit: 0 errors
- [ ] git commit -m "feat(hooks): add useTabBounce"

## Task 3: Hook usePulseRing
Files: CREATE src/hooks/usePulseRing.ts
- [ ] usePulseRing(active: boolean) -> { ringStyle }
      active=true: opacity/scale withRepeat infinite
      active=false: opacity -> 0
- [ ] tsc --noEmit: 0 errors
- [ ] git commit -m "feat(hooks): add usePulseRing"

## Task 4: Tab Bar Glassmorphism + Bounce
Files: MODIFY app/(student)/_layout.tsx
- [ ] Kiem tra expo-blur co trong node_modules khong
- [ ] Tao AnimatedTabIcon({ focused, children }) su dung useTabBounce(focused)
- [ ] Thay 5 tab icon wrapper bang AnimatedTabIcon
- [ ] Cap nhat tabBarStyle: borderTopWidth:0, shadow tren, background rgba(255,255,255,0.88)
- [ ] Neu co expo-blur: them tabBarBackground BlurView intensity=85
- [ ] Verify bounce khi switch tab
- [ ] git commit -m "feat(nav): tab bar glassmorphism + bounce animation"

## Task 5: Hero Banner LinearGradient
Files: MODIFY HomeScreen.tsx (phan hero lines ~137-166)
- [ ] Import LinearGradient tu expo-linear-gradient
- [ ] Import heroGradient, cardGradients, cardShadowColors tu @/src/theme
- [ ] Wrap hero bang LinearGradient: colors=heroGradient, start={x:0,y:0}, end={x:1,y:0}
- [ ] Tach style heroBanner -> heroBannerWrapper + heroBannerGradient
- [ ] Sua copy: "AI Smart Scanner" -> "Tinh nang noi bat", hero title bo chu "AI"
- [ ] tsc --noEmit: 0 errors
- [ ] git commit -m "feat(home): hero LinearGradient + remove AI copy"

## Task 6: Grid Cards Gradient
Files: MODIFY HomeScreen.tsx (phan gridRow lines ~168-236)
- [ ] Tao GradientCardProps type va GradientCard component inline
      Layout: AnimatedPressable > LinearGradient icon container > Text label
- [ ] Thay 4 card bang GradientCard voi mau tuong ung:
      scan=cardGradients.scan, flashcard=cardGradients.flashcard,
      chat=cardGradients.chat, quiz=cardGradients.quiz
      icon color='#FFFFFF'
- [ ] Spring scale 4 cards: 0.97 -> 0.93
- [ ] Xoa styles cu: gridIconCircle, gridCardTextWrap, gridCardTitle, gridCardSub
- [ ] tsc --noEmit: 0 errors
- [ ] git commit -m "feat(home): gradient grid cards per-card colors"

## Task 7: Header Polish + XP Count-up + Daily Word
Files: MODIFY HomeScreen.tsx
- [ ] Import usePulseRing tu @/src/hooks/usePulseRing
- [ ] Avatar pulse ring: wrap Image trong View relative, them Animated.View absolute voi ringStyle
- [ ] Greeting theo gio: gio<12 "Buoi sang" / gio<18 "Buoi chieu" / "Buoi toi" + emoji
- [ ] XP count-up: kiem tra useCountUp signature, dung animatedXp thay raw value
- [ ] Daily word: xoa Sparkles icon trong dailyTag, fontSize wordText 28->32
- [ ] tsc --noEmit: 0 errors
- [ ] git commit -m "feat(home): pulse ring + greeting emoji + XP count-up + daily word polish"

## Task 8: Verification
- [ ] Doc .agents/skills/verification-before-completion/SKILL.md
- [ ] npx tsc --noEmit: 0 errors
- [ ] Checklist: 4 gradient cards, tab bounce, hero gradient, bo AI badge, pulse ring, XP count-up, scale 0.93, SafeArea OK, navigation OK
- [ ] git commit -m "chore: UI refresh phase 1 complete"
