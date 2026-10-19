# CRM Stage Gate Rule Frontend Project (TypeScript + React + Tailwind CSS)

Dự án Frontend minh họa tính năng **Điều kiện chuyển giai đoạn cơ hội bán hàng (Pipeline Gate Rules)** cho Giám đốc kinh doanh theo đúng yêu cầu:

1. **Ràng buộc điều kiện**: Không cho chuyển Stage nếu thiếu điều kiện (VD: phải có cuộc gặp ghi nhận).
2. **Thông báo rõ ràng**: Hiển thị popup modal liệt kê chính xác điều kiện thỏa/thiếu.
3. **Quyền ghi đè (Override)**: Cho phép Trưởng nhóm / Giám đốc ghi đè kèm lý do bắt buộc.

## Hướng dẫn chạy dự án với VS Code

1. Giải nén file zip.
2. Mở thư mục dự án bằng **VS Code**.
3. Mở Terminal trong VS Code (`Ctrl + ~` hoặc `Cmd + ~`) và cài đặt thư viện:
   ```bash
   npm install
   ```
4. Khởi chạy dự án:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt theo địa chỉ `http://localhost:5173`.
