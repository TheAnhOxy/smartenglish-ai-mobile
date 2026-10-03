# Project: SmartEnglish AI Lexora (Mobile)

> Ứng dụng học tiếng Anh AI-first trên React Native + Expo.
> Đọc docs Expo chính xác tại: https://docs.expo.dev/versions/v57.0.0/

---

## Stack

| Lớp | Thư viện / Phiên bản |
|---|---|
| Framework | React Native `0.86.3` + Expo SDK `~57` |
| Ngôn ngữ | TypeScript `~6.0`, strict mode |
| Navigation | Expo Router `~57` (file-based, typed routes) |
| State | Zustand `^5` (auth, role gate) + TanStack Query `^5` (server state) |
| Styling | NativeWind `^4` (Tailwind `^3.4`) + theme tokens (`src/core/theme/colors.ts`) |
| Animation | React Native Reanimated `^4.5` + Gesture Handler `~2.32` |
| HTTP | Axios (`apiClient` tập trung tại `src/core/api/client.ts`) |
| Local DB | Expo SQLite `~57`, MMKV `^4` |
| Media | expo-av, expo-audio, expo-speech, expo-image-picker, VisionCamera `^5` |
| AI / Skia | `@shopify/react-native-skia ^2.6`, Lottie `~7.3` |
| Validation | Zod `^4` |

**Backend gateway**: `EXPO_PUBLIC_API_URL` (ngrok hoặc LAN `http://<IP>:8080`)
Web local: `http://localhost:8080` | Android Emulator: `http://10.0.2.2:8080`

---

## Cấu trúc thư mục

```
smartenglish-ai-mobile/
├── app/                        # Expo Router routes (file = route)
│   ├── (auth)/                 # Stack auth: login, register, forgot-password
│   ├── (student)/              # Tab/Stack cho student role
│   ├── (teacher-companion)/    # Stack cho teacher companion role
│   ├── _layout.tsx             # Root layout: providers, fonts, splash
│   └── index.tsx               # Redirect theo role (authStore)
│
├── src/
│   ├── core/
│   │   ├── api/client.ts       # Axios instance + interceptors JWT + business-error
│   │   ├── flows/
│   │   │   ├── authStore.ts    # Zustand: accessToken, currentUser, logout
│   │   │   └── roleGateStore.ts
│   │   ├── theme/colors.ts     # Design tokens — KHÔNG hardcode màu ngoài file này
│   │   ├── components/         # Shared UI nhỏ (Button, Input, Badge...)
│   │   ├── services/           # Cross-feature services
│   │   ├── data/               # Static data / mock
│   │   └── db/                 # SQLite helpers
│   │
│   ├── features/               # 1 folder = 1 bounded context
│   │   ├── auth/               # application/ · data/ · presentation/
│   │   ├── home-dashboard/
│   │   ├── ai-practice/
│   │   ├── ai-speaking/
│   │   ├── ai-writing/
│   │   ├── ai-chatbot/
│   │   ├── ai-scan/            # VisionCamera + object vocab scanner
│   │   ├── flashcard-srs/      # Spaced-repetition
│   │   ├── quiz-exam/
│   │   ├── reading-listening/
│   │   ├── learning-path/
│   │   ├── gamification/
│   │   ├── social-feed/
│   │   ├── notifications/
│   │   ├── onboarding/
│   │   ├── profile-settings/
│   │   ├── class-membership/
│   │   ├── subscription-paywall/
│   │   ├── teacher-companion/
│   │   └── referral-iot/       # NFC referral
│   │
│   ├── hooks/                  # Global custom hooks
│   │   ├── useCountUp.ts
│   │   ├── usePressSpring.ts
│   │   └── useStaggerReveal.ts
│   └── theme/
│
├── assets/
├── constants/
├── components/                 # Legacy shared components
├── .agents/skills/
└── AGENTS.md
```

### Cấu trúc bên trong mỗi feature

```
features/<name>/
├── application/    # use-cases, hooks TanStack Query, business logic
├── data/           # API calls, repositories, mappers
└── presentation/   # screens/, components/ riêng của feature
```

---

## Quy tắc code

### TypeScript
- **Không dùng `any`** — dùng `unknown` hoặc generic
- Props component phải có type rõ ràng (interface hoặc type alias)
- Strict mode bật (`tsconfig.json`)

### Lists & Scroll
- Danh sách dài → `FlatList` hoặc `FlashList`, **không** `ScrollView + .map()`
- Luôn có `keyExtractor` và `renderItem` bọc `useCallback`

### UX & Platform
- Xử lý `SafeAreaView` / `useSafeAreaInsets` cho mọi screen
- Test cả iOS và Android — ghi rõ nếu behaviour khác nhau
- `KeyboardAvoidingView` với `behavior` đúng platform (`padding` iOS, `height` Android)
- Mọi màn hình có **đủ 4 trạng thái**: `loading`, `empty`, `error`, `success`

### Thiết kế & Theme
- **Không hardcode màu hay spacing** — dùng token từ `src/core/theme/colors.ts` và Tailwind class
- Dark mode (`userInterfaceStyle: "automatic"`) — thiết kế cả hai mode
- Dùng Reanimated cho animation, không dùng Animated API cũ

### API & Data
- Mọi HTTP call qua `apiClient` (`src/core/api/client.ts`) — **không tạo axios instance thứ hai**
- Server state → TanStack Query
- Client/UI state → Zustand stores
- JWT tự động đính kèm bởi interceptor

### Navigation
- Routes qua Expo Router, typed routes bật
- Bảo vệ route: kiểm tra `authStore.accessToken` trong `app/_layout.tsx`

---

## Lệnh chạy

```bash
npx expo start --port 9000      # Dev (mọi platform)
npm run tunnel                  # Tunnel ngrok
npm run android                 # Android
npm run ios                     # iOS
npm run web                     # Web
npm run lint                    # Lint
```

---

## Biến môi trường

| Biến | Mô tả |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL backend gateway (ngrok / LAN IP) |
| `PORT` | Metro port (default 9000) |

---

## Quy trình với Agent

| Tình huống | Skill cần dùng |
|---|---|
| Bắt đầu tính năng mới | `brainstorming` → `writing-plans` |
| Thực thi plan | `executing-plans` |
| Có lỗi khó tìm | `systematic-debugging` |
| Viết test trước | `test-driven-development` |
| Trước khi báo xong | `verification-before-completion` |
| Code review | `requesting-code-review` / `receiving-code-review` |
| Thiết kế UI | `design-taste-frontend` |
| Chạy nhiều task song song | `dispatching-parallel-agents` |
| Nâng cấp RN/Expo | `upgrading-react-native` |
| Best practices RN | `react-native-best-practices` |

---

## Skills đã cài (`.agents/skills/`)

### obra/superpowers (15 skills)
`brainstorming` · `writing-plans` · `executing-plans` · `systematic-debugging` ·
`test-driven-development` · `verification-before-completion` · `requesting-code-review` ·
`receiving-code-review` · `dispatching-parallel-agents` · `subagent-driven-development` ·
`finishing-a-development-branch` · `using-git-worktrees` · `using-superpowers` ·
`diagnosing-superpowers` · `writing-skills`

### callstackincubator/agent-skills (10 skills)
`react-native-best-practices` · `upgrading-react-native` · `assess-react-native-migration` ·
`react-native-brownfield-migration` · `react-native-tv-best-practices` · `react-navigation` ·
`create-react-native-library` · `github-actions` · `writing-user-docs` · `validate-skills`

### Leonxlnx/taste-skill (1 skill)
`design-taste-frontend`

### Custom skills (dự án — có sẵn)
`ai-object-vocabulary-scanner` · `ai-speaking-pronunciation-tutor`
