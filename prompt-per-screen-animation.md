# Prompt riêng cho từng màn hình — Loxera (Expo 57 + Reanimated + Skia)

Dùng chung với `prompt-redesign-loxera-animation.md` (theme, tech stack, nguyên
tắc chống vibe AI). File này đi sâu vào choreography animation cho TỪNG màn
hình cụ thể, đủ chi tiết để đưa thẳng vào Claude Code / Cursor và ra kết quả
mượt ngay từ lần đầu, không cần chỉnh qua lại nhiều lần.

Mỗi prompt đều theo cấu trúc: **Mục đích màn hình → Layout → Animation lúc vào
màn hình (entrance) → Animation khi tương tác → Animation lúc rời màn hình**.
Đây là thứ hay bị bỏ sót khiến animation "cụt" — làm ra animation vào nhưng
quên animation ra, khiến chuyển màn bị giật.

---

## 1. Login / Onboarding

```
Thiết kế lại LoginScreen.tsx cho app Loxera bằng Expo SDK 57 + Reanimated 3 +
Skia, theo theme đã định nghĩa ở theme/colors.ts.

LAYOUT:
- Không dùng hero minh họa 3D + emoji. Thay bằng 1 vùng nền Skia Canvas cao
  ~40% màn hình phía trên: mesh-gradient 2 màu (primary #2F27CE và accent
  #433BFF) di chuyển rất chậm dạng blob mềm (dùng Skia RadialGradient + 2-3
  hình tròn blur di chuyển bằng SharedValue, loop ~18-22s, KHÔNG dùng linear
  loop đều — dùng sin/cos để quỹ đạo tự nhiên hơn).
- Logo "Loxera" đặt ở góc trên trái vùng gradient, chữ trắng, weight 700.
- Phần form nằm trên nền surface, bo góc lớn phía trên (radius 28), đè lên
  vùng gradient khoảng 60px để tạo cảm giác 1 khối liền mạch (giống pattern
  bottom-sheet, không phải 2 khối tách rời).
- Segment "Học viên / Giáo viên" dạng pill switcher, indicator chạy bằng
  Reanimated `layout` animation (không phải conditional render đổi màu tức
  thì).

ENTRANCE (khi màn hình mount):
- Gradient Canvas fade-in 400ms.
- Logo: translateY từ -12 → 0 + opacity 0→1, spring damping 20, delay 100ms.
- Form: translateY từ 24 → 0 + opacity 0→1, spring damping 18, delay 220ms
  (đi sau logo, cảm giác nội dung "trồi lên" chứ không xuất hiện đồng loạt).
- Input fields và nút social login: stagger 40ms mỗi item, dùng Reanimated
  `entering={FadeInDown.delay(idx * 40).springify()}`.

TƯƠNG TÁC:
- Focus input: border color animate từ `border` → `primary` bằng
  `withTiming(200ms)`, kèm shadow nhẹ nổi lên (`shadowOpacity` 0 → 0.08).
- Bấm nút "Đăng nhập": scale 1 → 0.97 khi press-in (withSpring stiffness 300),
  trở lại 1 khi press-out; nếu loading, icon mũi tên thay bằng small spinner
  Skia (vòng tròn arc quay đều, KHÔNG dùng ActivityIndicator mặc định của
  RN vì sẽ phá vỡ style hệ thống đã xây).
- Đổi segment Học viên/Giáo viên: indicator pill trượt bằng
  `useAnimatedStyle` + `withSpring`, không dùng crossfade.
- Sai mật khẩu: input shake nhẹ ngang (translateX ±6, 3 lần, 300ms tổng,
  dùng `withSequence`), border chuyển sang `danger`.

RỜI MÀN HÌNH (khi đăng nhập thành công, trước khi navigate sang Home):
- Toàn bộ form fade-out + scale-down nhẹ (0.98) trong 200ms trước khi
  navigation.replace, để tránh cảm giác "cắt cảnh" đột ngột.
```

---

## 2. Home Dashboard

```
Thiết kế lại HomeScreen.tsx.

LAYOUT: giữ cấu trúc đã thống nhất màu ở bản trước (streak strip, continue
card, feature grid, word of the day, daily challenge) nhưng giờ thêm animation
thật cho từng khối thay vì static.

ENTRANCE:
- Header (avatar + tên) fade-in tại chỗ, không di chuyển (đây là phần "chào
  hỏi", di chuyển nhiều sẽ rối mắt ngay đầu màn hình).
- Streak/XP strip: XP bar fill từ 0 → giá trị thật bằng `withTiming(800ms,
  Easing.out(Easing.cubic))`, CHẠY MỖI LẦN vào lại Home (không chỉ lần đầu) —
  đây là điểm nhấn cảm xúc chính của dashboard.
- Feature grid: stagger reveal 50ms/item, translateY 16→0.
- Word of the day card và Daily challenge card: xuất hiện sau feature grid
  100ms, dùng `entering={FadeInUp.springify().damping(16)}`.

STREAK RING (thay số "15 ngày" dạng chữ bằng Skia ring nhỏ 32x32 cạnh icon
lửa):
- Vẽ bằng Skia `Path` + `Skia.PathEffect` dash chạy theo % streak trong tuần
  (vd 5/7 ngày = 71% vòng tròn), stroke có LinearGradient từ accent →
  primary. Animate stroke từ 0 → giá trị thật bằng `useDerivedValue` khi
  màn hình focus (dùng `useFocusEffect` của React Navigation để retrigger).

TƯƠNG TÁC:
- Nhấn feature card: scale 0.97 + độ sáng nền tăng nhẹ khi press, dùng
  `Pressable` với `style={({pressed}) => ...}` kết hợp Reanimated cho phần
  scale để mượt hơn animation CSS-in-JS thường.
- Kéo để refresh: thay RefreshControl mặc định bằng custom indicator Skia
  (vòng tròn nhỏ vẽ dần theo khoảng cách kéo, dùng `PanGestureHandler` +
  `interpolate` khoảng kéo → % vẽ).
- Card "Từ vựng hôm nay": nút loa phát âm có hiệu ứng pulse lan toả 1 lần
  (giống sóng âm, vẽ bằng Skia 2 vòng tròn opacity giảm dần bán kính tăng
  dần trong 500ms) mỗi khi bấm.

CHUYỂN MÀN HÌNH:
- Khi bấm "Continue" card, dùng Shared Element Transition (react-navigation
  + reanimated shared values) để card phóng to lấp đầy màn hình kế tiếp,
  KHÔNG dùng slide-from-right mặc định — vì đây là hành động "đi tiếp" một
  luồng, không phải "mở trang mới".
```

---

## 3. Learning Path (bản đồ Unit kiểu Duolingo)

```
Thiết kế lại LearningPathScreen.tsx.

LAYOUT: giữ dạng bản đồ dọc các Unit hình tròn nối nhau bằng đường path, chia
theo Chương (section header sticky khi scroll qua).

ENTRANCE:
- Đường Path nối các Unit vẽ bằng Skia (không phải SVG như bản web trước),
  dùng `Skia.Path` polyline qua toạ độ tâm các Unit, animate bằng
  `PathEffect.MakeDash` + trim tăng dần từ 0 → 100% trong 900ms khi màn hình
  mount, easing `Easing.out(Easing.cubic)` — cảm giác "con đường đang được
  vẽ ra trước mắt bạn".
- Từng Unit node xuất hiện SAU KHI đường path vẽ tới vị trí nó (không xuất
  hiện đồng loạt cùng lúc) — dùng `useAnimatedReaction` theo dõi
  progress path để trigger scale-in (0.6→1, spring) của từng node đúng lúc
  đường vẽ chạm tới.
- Section header "Chương 1/2..." fade+slide từ trái, không cần chờ path.

TRẠNG THÁI UNIT:
- Unit đã hoàn thành: có dấu check, màu `success`, KHÔNG animate liên tục
  (tĩnh, vì đã xong).
- Unit đang active ("Start Here"): pulse vô hạn rất nhẹ — scale 1↔1.035,
  2000ms, `withRepeat(withSequence(withTiming(1.035),withTiming(1)),-1,true)`
  — đủ để mắt nhận ra nhưng không gây phân tâm khi nhìn lâu.
- Unit chưa mở khoá: giảm opacity 0.4, không animate.
- Bubble "Start Here!" / tooltip mô tả Unit: xuất hiện bằng scale từ điểm
  neo tại Unit (transform-origin tại node, không phải center màn hình),
  spring damping 14 để hơi nảy — tạo cảm giác "bật ra" tự nhiên như speech
  bubble thật.

TƯƠNG TÁC:
- Bấm vào Unit: toàn bộ node khác dim nhẹ (opacity 0.5, 150ms) để lấy focus
  vào node được chọn trước khi bottom-sheet chi tiết Unit trượt lên.
- Bottom sheet dùng gesture kéo xuống để đóng (Reanimated + Gesture Handler),
  có "rubber-band" effect khi kéo quá đà rồi bật lại.
```

---

## 4. Flashcard (ôn tập SRS)

```
Thiết kế lại FlashcardScreen.tsx — đây là màn hình NÊN cảm giác "vật lý" nhất
trong app vì thao tác chính là vuốt thẻ bài, giống lật thẻ giấy thật.

CƠ CHẾ:
- Dùng `Gesture.Pan()` từ react-native-gesture-handler kết hợp Reanimated:
  - translateX thẻ đi theo ngón tay 1:1.
  - rotateZ interpolate theo translateX (vd translateX ±150 → rotate ±12deg),
    tạo cảm giác thẻ "nghiêng" khi kéo giống Tinder/thẻ bài thật.
  - Khi thả tay: nếu |translationX| > ngưỡng (vd 120px) → animate thẻ bay hẳn
    ra khỏi màn hình theo hướng vuốt (`withTiming` nhanh 200ms) rồi mount thẻ
    tiếp theo; nếu chưa đủ xa → `withSpring` kéo thẻ về vị trí giữa (damping
    thấp hơn bình thường, ~12, để có chút "đàn hồi" rõ rệt, đúng cảm giác
    "chưa đủ quyết đoán thì thẻ kéo bạn lại").
  - 2 overlay màu mờ dần hiện ra 2 bên khi kéo (đỏ nhạt bên trái = "Chưa
    thuộc", xanh lá nhạt bên phải = "Thuộc"), opacity interpolate theo
    |translationX|/threshold.
- Lật thẻ xem nghĩa: dùng `rotateY` (không phải rotateX) qua `withTiming`
  400ms kết hợp `interpolate` để ẩn mặt sau khi góc quay > 90deg (dùng
  `backfaceVisibility: 'hidden'` — lưu ý set đúng để không bị lộ chữ ngược).
- Thẻ TIẾP THEO nằm phía sau, scale 0.94 + opacity 0.6, animate lên scale 1 +
  opacity 1 khi thẻ trên cùng bay đi — tạo cảm giác xếp chồng thật (deck of
  cards), không phải thẻ mới "pop" vào từ hư không.

PROGRESS:
- Thanh "Thẻ 4/4" phía trên đổi bằng Skia progress bar mảnh, animate mượt mỗi
  khi chuyển thẻ, có glow nhẹ ở đầu thanh bằng blur Skia khi đang fill.
```

---

## 5. Speaking AI (luyện nói, ghi âm, so khớp giọng)

```
Thiết kế lại SpeakingScreen.tsx.

WAVEFORM (phần quan trọng nhất, quyết định cảm giác "app thật" hay "demo"):
- Dùng Skia Canvas vẽ 2 waveform xếp chồng mờ:
  1. "Target" (giọng mẫu): waveform TĨNH nhưng có hiệu ứng "quét sáng" chạy
     qua 1 lần khi màn hình mount (giống preview âm thanh trên Voice Memo
     của iOS) — dải gradient sáng chạy từ trái sang phải trong 600ms.
  2. "Your Voice": khi đang ghi âm (`expo-av` Recording với
     `setOnRecordingStatusUpdate` lấy `metering` real-time), waveform vẽ
     bằng các thanh dọc animate height theo giá trị dB thật, KHÔNG dùng giá
     trị random giả lập — map dB (-160 → 0) sang chiều cao 4-40px bằng
     `interpolate`, cập nhật qua `useSharedValue` set trực tiếp trong
     callback (chạy trên JS thread, throttle ~10fps để không giật máy yếu).
- Nút Mic khi đang ghi âm: pulse ra sóng tròn lan toả (Skia, 2-3 vòng lệch
  pha nhau 400ms, opacity giảm dần bán kính tăng dần), dừng ngay và bật hiệu
  ứng "hoàn tất" (scale bounce 1→1.15→1) khi nhả tay.

SO SÁNH KẾT QUẢ:
- Sau khi ghi âm xong, hiện % khớp giọng bằng số chạy count-up + màu đổi dần
  theo ngưỡng (đỏ <50%, vàng 50-75%, xanh lá >75%) bằng `interpolateColor`
  của Reanimated theo giá trị đang count-up — màu và số đổi ĐỒNG BỘ theo
  cùng 1 animated value, không phải 2 animation tách rời dễ lệch nhịp.
```

---

## 6. Quiz (tuỳ chỉnh + làm bài)

```
Thiết kế lại QuizSetupScreen.tsx và QuizPlayScreen.tsx.

QUIZ SETUP:
- Các chip loại câu hỏi / chủ đề: khi chọn, dùng `layout` animation cho
  border + background đổi màu, kèm icon check scale-in nhanh (150ms).
- Slider độ khó: thumb có shadow động đổi theo vị trí kéo (kéo càng gần
  "Khó" thì glow màu `danger` nhạt dần hiện ra quanh thumb, kéo gần "Dễ" thì
  glow màu `success`) — dùng `interpolateColor` theo % vị trí slider.

QUIZ PLAY:
- Chuyển câu hỏi: câu cũ trượt trái + fade out, câu mới trượt từ phải + fade
  in, dùng `Layout` transition kết hợp `exiting`/`entering` của Reanimated,
  KHÔNG dùng crossfade đơn thuần vì sẽ mất cảm giác "tiến tới câu tiếp theo".
- Chọn đáp án ĐÚNG: option đó scale nhẹ (1.02) + border/background chuyển
  `success`, đồng thời các option còn lại dim (opacity 0.5) — feedback tức
  thì trong 150ms, sau đó mới auto-chuyển câu sau 600-800ms (đủ thời gian
  não kịp ghi nhận đúng/sai, không quá nhanh gây hụt hẫng, không quá chậm
  gây sốt ruột).
- Chọn đáp án SAI: option đó rung ngang nhẹ (shake, giống input sai ở màn
  Login) + chuyển `danger`, đồng thời đáp án ĐÚNG tự động highlight
  `success` để người học thấy ngay câu trả lời chuẩn.
- Progress dots trên cùng: dot của câu đã trả lời chuyển từ rỗng → đầy bằng
  scale+color animate, dot hiện tại có viền pulse nhẹ.
```

---

## 7. Stats / Tiến độ

```
Thiết kế lại StatsScreen.tsx.

RADAR CHART KỸ NĂNG (Từ vựng/Nghe/Nói/Đọc/Ngữ pháp):
- Vẽ hoàn toàn bằng Skia: lưới ngũ giác nền tĩnh (`Path` màu `border`), vùng
  dữ liệu là `Path` polygon nối 5 điểm theo điểm số, fill bằng
  `LinearGradient` nhạt màu `primary`, stroke đậm hơn viền ngoài.
- Animate: khi màn hình focus, polygon "phồng ra" từ tâm (0% mỗi trục) đến
  giá trị thật, 700ms, `Easing.out(Easing.cubic)`, dùng `useDerivedValue`
  tính toạ độ 5 điểm theo % animate thay vì animate cả Path object (animate
  toạ độ điểm mượt hơn nhiều so với animate d-string của Path).

BIỂU ĐỒ THỜI GIAN HỌC/NGÀY (7 cột dọc):
- Mỗi cột animate height từ 0 → giá trị thật, stagger 60ms/cột, dùng
  `withDelay(i * 60, withTiming(...))`.
- Cột của ngày hôm nay (đang active) có gradient khác biệt (primary→accent)
  thay vì màu neutral như các cột khác — đây là cách "nhấn" bằng màu tiết
  chế, chỉ 1 phần tử khác biệt trên cả biểu đồ.

TAB "Tiến Độ / Phân Tích AI / Xếp Hạng":
- Chuyển tab: nội dung fade+slide theo hướng tab được chọn nằm bên nào (trái
  hay phải so với tab hiện tại) để hướng chuyển động khớp trực giác người
  dùng, không cố định 1 hướng cho mọi lần chuyển.
```

---

## 8. AI Tutor Chat

```
Thiết kế lại ChatScreen.tsx.

BONG BÓNG CHAT:
- Tin nhắn mới (cả của AI và user) xuất hiện bằng scale từ 0.9→1 + opacity
  0→1 + translateY nhẹ 8px→0, spring damping 16, transform-origin tại góc
  dưới của bong bóng (phía gần input) để cảm giác "nảy ra từ chỗ mình gõ".
- AI đang trả lời: hiện 3 dot "typing indicator" animate bằng
  `withRepeat(withSequence(...))` lệch pha nhau 150ms/dot (dot nảy lên-xuống
  nhẹ, không phải chỉ đổi opacity) — đây là chi tiết nhỏ nhưng rất hay bị
  làm ẩu, ảnh hưởng lớn tới cảm giác "app thật".
- Khi AI trả lời xong, thay typing indicator bằng nội dung thật: crossfade
  150ms, KHÔNG để 2 thứ tồn tại cùng lúc dù chỉ 1 frame.

GỢI Ý CÂU HỎI (quick reply chips):
- Xuất hiện dạng carousel ngang, stagger scale-in từ trái sang phải 40ms/chip
  khi vào màn hình hoặc sau khi AI trả lời xong 1 câu.
- Bấm 1 chip: chip đó scale-down rồi biến mất (bay lên nhập vào ô input) —
  hiệu ứng "được gửi đi" thay vì chỉ biến mất đột ngột.
```

---

## 9. Settings

```
Thiết kế lại SettingsScreen.tsx — màn hình này ít cần animation "wow", ưu tiên
CẢM GIÁC MƯỢT của những control tưởng nhỏ nhặt:

- Toggle switch: dùng custom component thay vì `Switch` mặc định của RN nếu
  cần khớp màu theme chính xác — animate track color bằng `interpolateColor`,
  knob dịch chuyển bằng `withSpring` (không phải withTiming, vì toggle cần
  cảm giác "tách" dứt khoát hơn là trượt đều).
- Card chọn giao diện Sáng/Tối/Tự động: card được chọn có viền `primary` +
  scale 1.02, chuyển đổi mượt bằng `layout` animation, KHÔNG chớp tắt đột
  ngột giữa các lựa chọn.
- Slider tốc độ phát âm / cỡ chữ: thumb có haptic feedback nhẹ
  (`expo-haptics` `impactAsync(Light)`) mỗi khi đi qua 1 mốc chia, kết hợp
  animate giá trị hiển thị (1.0x, 1.2x...) bằng `useAnimatedReaction` để số
  luôn khớp chính xác vị trí thumb, không lag 1 frame so với ngón tay.
```

---

## Nhắc lại nguyên tắc xuyên suốt khi build từng màn hình trên

1. Mọi threshold thời gian animation (150ms/200ms/400ms...) là điểm khởi đầu
   hợp lý — nhưng hãy tinh chỉnh bằng cảm nhận thực tế khi chạy trên máy thật,
   không copy số cứng nhắc.
2. Ưu tiên `withSpring` cho bất kỳ chuyển động nào mô phỏng vật thể có khối
   lượng (thẻ bài, nút bấm, bottom sheet). Dùng `withTiming` cho chuyển động
   trừu tượng (progress bar, fade, color).
3. Luôn animate CẢ chiều vào lẫn chiều ra — 1 UI thiếu animation exit sẽ luôn
   trông "cụt" dù animation entrance có đẹp đến đâu.
4. Test animation với "Reduce Motion" bật trong Settings hệ điều hành —
   dùng `AccessibilityInfo.isReduceMotionEnabled()` để tắt các animation
   trang trí (không tắt animation truyền tải thông tin, ví dụ progress vẫn
   cần fill tới đúng %, chỉ bỏ phần nảy/lặp vô hạn).
