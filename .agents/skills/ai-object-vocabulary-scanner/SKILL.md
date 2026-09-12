---
name: ai-object-vocabulary-scanner
description: >-
  Agent AI chuyên gia xử lý tính năng quét ảnh camera nhận diện vật thể,
  trích xuất từ vựng tiếng Anh, khoanh vùng bounding box đa màu sắc, giới hạn 5 vật thể
  và tự động lưu vào bộ thẻ Flashcard cá nhân.
---

# Agent AI Chuyên Gia Quét Ảnh & Sinh Từ Vựng Tiếng Anh (AI Object Vocabulary Scanner Agent)

Skill này định nghĩa Agent AI chuyên biệt dành cho tính năng chụp ảnh/tải ảnh nhận diện vật thể, sinh từ vựng tiếng Anh kèm phiên âm IPA, khoanh vùng các khung hình vuông đa màu sắc trực quan, và lưu dữ liệu vào hệ thống bộ thẻ Flashcard cá nhân.

---

## 🎯 Mục Tiêu & Quy Tắc Hoạt Động Của Agent AI

1. **Nhận Diện Vật Thể Thực Tế Tốc Độ Cao**:
   - Sử dụng các model Gemini Vision chính thức (`gemini-1.5-flash`, `gemini-1.5-flash-8b`, `gemini-1.5-pro`).
   - Thời gian phản hồi mục tiêu: **< 2 giây**.
2. **Quy Tắc Giới Hạn Tối Đa 5 Vật Thể**:
   - Bắt buộc chỉ chọn lọc **tối đa 5 vật thể nổi bật nhất** thực sự có trong bức ảnh chụp.
   - Tuyệt đối không tự bịa (hallucinate) hoặc trả về các từ không liên quan tới bức ảnh.
3. **Khoanh Vùng Đa Màu Sắc Tương Ứng (Multi-Color Bounding Boxes)**:
   - Mỗi vật thể được gán 1 màu sắc nét riêng biệt (Cyan `#00F2FE`, Amber `#FF9F1C`, Emerald `#10B981`, Purple `#A855F7`, Rose `#F43F5E`).
   - Viền khung khoanh vùng trên ảnh và thẻ từ vựng tương ứng bên dưới phải mang **cùng một tông màu và số thứ tự (#1, #2, #3)**.
4. **Đồng Bộ Dữ Liệu Bộ Thẻ Cá Nhân (Flashcard Deck Sync)**:
   - Cho phép chọn lưu từng từ hoặc bấm "Lưu Tất Cả Thẻ" vào các bộ thẻ cá nhân (`Daily Conversation`, `Business English`, `Travel & Leisure`, `AI Scanned Words`).
   - Hỗ trợ khởi tạo bộ thẻ mới trực tiếp ngay trong giao diện lưu.
5. **Giao Diện Camera Quét Tối Giản (Minimalist Scanner UI)**:
   - Loại bỏ các text chỉ số kỹ thuật và nhãn thừa không cần thiết.
   - Khung ngắm camera **đứng yên hoàn toàn**, chỉ có tia laser radar quét qua lại.

---

## 🏗️ Kiến Trúc Xử Lý Dữ Liệu (Data Architecture)

```
[ Camera Chụp Ảnh / Chọn Ảnh Thư Viện ]
                   │
                   ▼
       [ analyzeImageWithGemini ]
 (gemini-1.5-flash / Tối đa 5 vật thể)
                   │
                   ▼
       [ ScanResultScreen ]
(Vẽ khung màu chữ nhật bao quanh vật thể + Ô thẻ đồng bộ màu)
                   │
                   ▼
  [ SaveWordSheetModal / useDeckStore ]
   (Lưu từ vựng vào bộ thẻ cá nhân)
```

---

## 📌 Hướng Dẫn Sử Dụng

- Agent AI này tự động kích hoạt khi có các yêu cầu liên quan đến nâng cấp camera quét ảnh, tối ưu prompt Gemini Vision nhận diện đồ vật, khoanh vùng bounding box, hoặc quản lý bộ thẻ từ vựng Flashcard.
