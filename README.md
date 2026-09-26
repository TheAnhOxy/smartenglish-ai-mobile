# SmartEnglish AI — Mobile Application (Lexora)

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020.svg?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![NativeWind](https://img.shields.io/badge/NativeWind-v4%20(Tailwind)-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://nativewind.dev)
[![Reanimated](https://img.shields.io/badge/Reanimated-v4-FF4B4B.svg?style=flat-square)](https://docs.swmansion.com/react-native-reanimated/)
[![Skia](https://img.shields.io/badge/Shopify-React%20Native%20Skia-E84393.svg?style=flat-square)](https://shopify.github.io/react-native-skia/)

Repository chứa toàn bộ mã nguồn **Mobile Application (tên gọi: Lexora)** của đồ án tốt nghiệp *Hệ thống học tập tiếng Anh thông minh tích hợp trí tuệ nhân tạo (SmartEnglish AI)*.

Ứng dụng được xây dựng trên nền tảng **React Native 0.86 / React 19** với **Expo SDK 57**, sử dụng kiến trúc phân tầng kết hợp **Expo Router (File-based Routing)**, đồ họa hiệu năng cao với **Shopify Skia** và **Reanimated 4**, hỗ trợ cả 2 nhóm người dùng: **Học viên (Student)** và **Giáo viên đồng hành (Teacher Companion)**.

---

## 1. Vị trí trong Hệ sinh thái SmartEnglish AI

Hệ thống SmartEnglish AI bao gồm 3 repository chính hoạt động gắn kết với nhau:

```
┌────────────────────────────────┐            ┌────────────────────────────────┐
│   SmartEnglish Admin Web       │            │   SmartEnglish Mobile App      │
│  (React 19 + Vite 8 + Tailwind)│            │  (Expo 57 + RN 0.86 + Skia)    │
│  • Quản lý học liệu, từ vựng   │            │  • Lộ trình học leo tháp       │
│  • AI Content Studio (Gemini)  │            │  • Luyện phát âm AI (IPA)      │
│  • Phê duyệt giáo trình        │            │  • Chấm bài viết AI & Chatbot  │
│  • Quản lý người dùng, gói cước│            │  • Flashcard SRS, Game hóa     │
└───────────────┬────────────────┘            └───────────────┬────────────────┘
                │ HTTP REST (JSON / Upload)                   │ HTTP REST (Gateway)
                ▼                                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SmartEnglish AI Backend Microservices                     │
│                  (Spring Boot 3 + Java 17 + Docker Compose)                  │
│                                                                              │
│  [Port 8080] API Gateway (Điểm đón request duy nhất, Rate Limiter, Route)    │
│  ├── [Port 8081] auth-service       : Xác thực JWT, User Profiles, RBAC      │
│  ├── [Port 8082] content-service    : Khóa học, Bài học, Từ vựng, AI Content │
│  ├── [Port 8083] learning-service   : Tiến độ học tập, SRS, Tháp leo bài     │
│  ├── [Port 8084] ai-practice-service: Chấm phát âm IPA, Viết AI, Hội thoại   │
│  ├── [Port 8085] payment-service    : Đăng ký gói VIP, Paywall, Lịch sử GD   │
│  ├── [Port 8086] notif-service      : Thông báo nhắc học, cảnh báo Streak    │
│  ├── [Port 8087] teacher-service    : Quản lý lớp học, giao bài tập học sinh │
│  └── [Port 8088] social-service     : Mạng xã hội học tập, thảo luận         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mối liên hệ nghiệp vụ chặt chẽ:
1. **Với Web Admin (`smartenglish-admin`)**:
   - Khi Admin hoặc Giáo viên tạo bài học mới (Từ vựng, Bài đọc, Bài nghe, Bài kiểm tra) hoặc sử dụng **AI Content Studio** để sinh học liệu và nhấn **Duyệt (Approved)**, nội dung sẽ xuất hiện ngay lập tức trên Mobile App cho học viên học.
   - Khi Giáo viên được Admin phê duyệt tài khoản trên Web Admin, họ có thể đăng nhập vào phân hệ **Teacher Companion** trên ứng dụng di động để theo dõi lớp học và giao bài tập cho học sinh.
2. **Với Backend Microservices (`smartenglish-ai-backend`)**:
   - Mobile tương tác **100% qua API Gateway (Port 8080)** — tự động gắn JWT Bearer Token, tự động thích ứng địa chỉ mạng khi chạy trên máy thật, máy ảo hoặc qua tunnel internet ngrok.
   - Các tác vụ AI nặng (Chấm phát âm theo bảng ngữ âm quốc tế IPA, chấm điểm luận văn CEFR, sinh phản hồi hội thoại) được xử lý tập trung tại `ai-practice-service` và `content-service` rồi phản hồi siêu tốc về Mobile.

---

## 2. Công nghệ & Thư viện chủ đạo (Tech Stack)

| Lĩnh vực | Công nghệ / Thư viện | Vai trò trong dự án |
|---|---|---|
| **Core Framework** | **React Native 0.86**, **React 19.2**, **Expo SDK 57** | Nền tảng ứng dụng di động đa nền tảng (iOS, Android, Web Preview) |
| **Routing & Navigation** | **Expo Router v4 (`expo-router`)** | Điều hướng theo tệp (File-based Routing), Typed Routes, Nested Stack/Tabs |
| **Styling & Design System** | **NativeWind v4** (Tailwind CSS v3 engine) | Thiết kế giao diện hiện đại, bảng màu trực quan, hỗ trợ Dark / Light mode |
| **Animation & Visuals** | **Reanimated 4**, **Shopify Skia**, **Lottie** | Mesh-gradient canvas nền, micro-animations, chuyển động lò xo (spring physics) mượt mà 60–120 FPS |
| **State Management** | **Zustand v5** | Quản lý trạng thái gọn nhẹ: `authStore`, `streakStore`, `speakingQuotaStore`, `gamificationStore` |
| **Data Fetching & Cache** | **TanStack React Query v5**, **Axios** | Quản lý server state, auto-refetch, cache dữ liệu học tập thông minh |
| **Offline Storage** | **Expo SQLite**, **MMKV**, `expo-file-system` | Lưu trữ Flashcards học từ vựng ngoại tuyến, thuật toán lặp lại ngắt quãng (SRS) |
| **Audio & Media** | **Expo Audio**, **Expo AV**, **Expo Speech** | Ghi âm phát âm giọng người học, phát âm mẫu bản xứ giọng Anh-Anh / Anh-Mỹ |
| **Phần cứng & IoT** | **react-native-nfc-manager**, **Vision Camera** | Chạm thẻ NFC để mở bài học nhanh (Tap-to-Learn), quét tài liệu qua camera |

---

## 3. Các chức năng chính trên Ứng dụng Di động

### 3.1. Phân hệ Học viên (Student Experience)

- **Trang chủ & Gamification Dashboard (`/(student)/home`)**:
  - Theo dõi **Daily Streak** (ngọn lửa chuỗi ngày học), Trái tim sinh mệnh, Điểm kinh nghiệm (EXP), Đá quý.
  - Lộ trình bài học gợi ý theo trình độ hiện tại, nhiệm vụ hàng ngày (Daily Quests).
- **Lộ trình học leo tháp (`/(student)/learn`)**:
  - Bản đồ học tập chia theo Chapter/Unit dạng đảo học tập (Island Climbing Path).
  - Tích hợp các bài học leo tầng: Từ vựng cốt lõi, Ngữ pháp ứng dụng, Phát âm chuẩn, Bài đọc hiểu ngắn và Quiz củng cố.
- **Phòng luyện tập trí tuệ nhân tạo (AI Practice Lab - `/(student)/practice/*`)**:
  - 🎙️ **AI Speaking**: Thu âm câu nói, hệ thống phân tích phổ âm thanh và chấm điểm phát âm theo từng âm tiết (Phonemes / IPA), độ trôi chảy (Fluency) và trọng âm (Stress).
  - ✍️ **AI Writing**: Soạn thảo bài viết theo đề tài IELTS/TOEIC, AI sửa lỗi ngữ pháp chi tiết theo từng dòng, gợi ý nâng cấp từ vựng B2 lên C1/C2.
  - 💬 **AI Roleplay Chatbot**: Nhập vai trò chuyện thời gian thực theo tình huống thực tế (Phỏng vấn xin việc, Đặt phòng khách sạn, Thuyết trình kinh doanh) với Trợ lý AI Teacher Cáo.
  - 📷 **AI Scan (Vision OCR)**: Chụp hoặc tải ảnh trang sách/tài liệu tiếng Anh để dịch thuật song ngữ và tự động trích xuất các từ vựng mới vào kho cá nhân.
- **Bộ thẻ Flashcard SRS thông minh (`/(student)/review/*`)**:
  - Áp dụng thuật toán **Spaced Repetition (SuperMemo SM-2)** giúp học viên ôn tập đúng thời điểm vàng trước khi quên.
  - Hoạt động mượt mà cả khi **không có kết nối mạng (Offline)** nhờ cơ sở dữ liệu cục bộ SQLite.
- **Tính năng Đấu trường & Xã hội (`/(student)/league`, `/(student)/feed`)**:
  - Bảng xếp hạng thi đua tuần theo phân hạng (Đồng, Bạc, Vàng, Kim Cương).
  - Mạng xã hội nội bộ: Đăng bài chia sẻ mẹo học, bài viết hay, tương tác bình luận với cộng đồng.
- **Tính năng Phần cứng / IoT độc đáo (`/(student)/iot`)**:
  - Tích hợp **NFC Tap-to-Learn**: Người học chạm điện thoại vào thẻ thông minh hoặc góc bàn học để kích hoạt ngay bài ôn từ vựng của ngày hôm đó.

### 3.2. Phân hệ Giáo viên đồng hành (Teacher Companion - `/(teacher-companion)/*`)

- Người dùng có vai trò Giáo viên có thể chuyển đổi chế độ xem ngay trên ứng dụng:
  - Xem danh sách lớp học đang phụ trách.
  - Theo dõi tỷ lệ chuyên cần, tiến độ hoàn thành bài tập của từng học viên.
  - Nhận thông báo nộp bài và phản hồi bài làm của học sinh.

### 3.3. Phân hệ Gói cước & Paywall (`/(student)/shop`)

- Gói thành viên **VIP / Premium**: Mở khóa không giới hạn lượt chấm phát âm AI, tạo đề thi TOEIC không giới hạn, lộ trình học cá nhân hóa.
- Tích hợp cổng thanh toán bảo mật liên kết với `payment-service`.

---

## 4. Cấu trúc thư mục mã nguồn

Dự án áp dụng mô hình kết hợp giữa **Feature-Driven Architecture** và **Expo Router**:

```
smartenglish-ai-mobile/
├── app/                                 # Cấu trúc định tuyến (Expo Router Pages)
│   ├── (auth)/                          # Nhóm màn hình Đăng nhập, Đăng ký, Quên MK
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (student)/                       # Toàn bộ màn hình dành cho Học viên
│   │   ├── _layout.tsx                  # Bottom Navigation Bar chính
│   │   ├── home.tsx                     # Trang chủ tổng quan & Streak
│   │   ├── learn.tsx                    # Bản đồ lộ trình học tập leo tháp
│   │   ├── feed.tsx                     # Bảng tin cộng đồng
│   │   ├── shop.tsx                     # Cửa hàng vật phẩm & Paywall VIP
│   │   ├── profile.tsx                  # Thông tin cá nhân & cài đặt
│   │   ├── practice/                    # Các module phòng luyện AI
│   │   │   ├── speaking/                # Luyện phát âm AI
│   │   │   ├── writing/                 # Chấm bài viết AI
│   │   │   ├── chatbot/                 # Chatbot nhập vai AI
│   │   │   ├── scan/                    # Quét camera OCR
│   │   │   ├── reading/                 # Đọc hiểu học liệu
│   │   │   └── quiz/                    # Làm bài kiểm tra trắc nghiệm
│   │   ├── review/                      # Ôn tập Flashcard SRS
│   │   ├── league.tsx                   # Bảng xếp hạng thi đua
│   │   └── iot.tsx                      # NFC Tap-to-Learn
│   ├── (teacher-companion)/             # Phân hệ dành riêng cho Giáo viên
│   │   └── classes/                     # Lớp học phụ trách & chấm bài
│   ├── _layout.tsx                      # Root layout, Theme Provider, Splash Screen
│   └── index.tsx                        # Điểm khởi động & điều hướng auth
│
├── src/                                 # Mã nguồn nghiệp vụ (Business Logic)
│   ├── core/                            # Tầng cốt lõi dùng chung toàn app
│   │   ├── api/
│   │   │   └── client.ts                # Axios Client, Auto Gateway URL Resolver
│   │   ├── db/
│   │   │   └── srsEngine.ts             # Thuật toán lặp lại ngắt quãng SM-2
│   │   ├── flows/
│   │   │   └── authStore.ts             # Quản lý JWT & phiên đăng nhập
│   │   └── theme/                       # Hệ thống màu, typography, Skia styles
│   │
│   └── features/                        # Từng tính năng độc lập (Clean Architecture)
│       ├── ai-speaking/                 # Ghi âm, waveform, gọi AI chấm điểm IPA
│       ├── ai-writing/                  # Trình soạn thảo & phân tích bài luận
│       ├── ai-chatbot/                  # Giao diện hội thoại & stream tin nhắn
│       ├── ai-scan/                     # Xử lý ảnh & Vision OCR
│       ├── flashcard-srs/               # Bộ thẻ ghi nhớ từ vựng lật mặt 3D
│       ├── learning-path/               # Tháp bài học và tiến trình học
│       ├── gamification/                # Streak, EXP, level, bảng xếp hạng
│       ├── social-feed/                 # Bài viết, bình luận, tương tác
│       └── subscription-paywall/        # Gói cước nâng cấp
│
├── assets/                              # Hình ảnh, font chữ, âm thanh, biểu tượng
├── app.json                             # Cấu hình Expo, App Icon, Splash, Permissions
├── package.json                         # Dependencies & Scripts
├── tailwind.config.js                   # Cấu hình NativeWind styling
└── tsconfig.json                        # Cấu hình TypeScript
```

---

## 5. Cơ chế kết nối API Gateway thông minh (Smart Gateway Routing)

Một trong những ưu điểm nổi bật của ứng dụng là cơ chế tự động nhận diện và cấu hình địa chỉ Backend Gateway trong [src/core/api/client.ts](file:///c:/ANew/K9_2026/KLTN/Project/smartenglish-ai-mobile/src/core/api/client.ts):

1. **Khi chạy trên Web Browser**: Tự động kết nối `http://localhost:8080`.
2. **Khi chỉ định biến môi trường (`EXPO_PUBLIC_API_URL`)**: Ưu tiên sử dụng URL này (thích hợp với URL Public ngrok HTTPS khi test trên điện thoại thật ngoài đường).
3. **Khi chạy trên Máy ảo Android Emulator**: Tự động chuyển về `http://10.0.2.2:8080`.
4. **Khi chạy Expo Go qua Wi-Fi LAN**: Tự động bóc tách IP máy tính phát triển từ `hostUri` của Expo để thiết bị thật có thể gọi trực tiếp Backend trên máy tính mà không cần cấu hình thủ công!

---

## 6. Hướng dẫn cài đặt & Khởi chạy ứng dụng

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản 20.x trở lên.
- **Trình quản lý gói**: `npm` hoặc `yarn`.
- **Thiết bị chạy**:
  - Điện thoại thật cài sẵn ứng dụng **Expo Go** (tải trên App Store hoặc Google Play).
  - Hoặc máy ảo **Android Studio Emulator** / **iOS Simulator**.
- **Backend Microservices**: Đảm bảo cụm Docker Backend (`api-gateway` port 8080) đang hoạt động.

### Bước 1: Cài đặt thư viện dependencies
```bash
cd smartenglish-ai-mobile
npm install
```

### Bước 2: Thiết lập biến môi trường
Tạo file `.env` ở thư mục gốc (hoặc chỉnh sửa từ mẫu có sẵn):

```env
# URL trỏ tới API Gateway (hoặc dùng link ngrok nếu test từ xa qua 4G)
EXPO_PUBLIC_API_URL=http://localhost:8080

# Cấu hình cổng chạy Metro Bundler
PORT=9000
RCT_METRO_PORT=9000
EXPO_PACKAGER_PORT=9000
```

> **Mẹo test nhanh với ngrok (cho thiết bị thật qua 4G / khác mạng Wi-Fi):**
> Chạy lệnh `ngrok http 8080` trên máy tính, sau đó copy đường dẫn `https://xxxx.ngrok-free.dev` dán vào `EXPO_PUBLIC_API_URL`.

### Bước 3: Khởi động ứng dụng

- **Khởi chạy thông thường (chọn thiết bị quét mã QR):**
  ```bash
  npm run start
  ```
- **Khởi chạy chế độ Tunnel (khi mạng Wi-Fi chặn kết nối nội bộ LAN):**
  ```bash
  npm run tunnel
  ```
- **Mở trực tiếp trên máy ảo Android:**
  ```bash
  npm run android
  ```
- **Mở trực tiếp trên máy ảo iOS (macOS):**
  ```bash
  npm run ios
  ```
- **Mở bản xem trước trên Web:**
  ```bash
  npm run web
  ```

---

## 7. Tài khoản kiểm thử mẫu (Test Accounts)

Liên hệ TheAnhOXY để được cấp tài khoản thử nghiệm

---

## 8. Tác giả & Giấy phép
- **Đồ án tốt nghiệp**: Hệ thống học tập tiếng Anh thông minh tích hợp trí tuệ nhân tạo (SmartEnglish AI).
- **Giấy phép**: MIT License — Xem chi tiết tại [LICENSE](LICENSE).
