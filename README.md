# CLB Bóng chày HUST – Web đóng quỹ

Website quản lý đóng quỹ thành viên, xây dựng bằng React + Vite + Tailwind CSS.

## Chạy project

```bash
npm install
npm run dev
```

Mở URL Vite cung cấp (thường là http://localhost:5173).

- `/#/app` – giao diện **Thành viên**
- `/#/admin` – giao diện **Admin** (có mật khẩu)

## Mật khẩu Admin

Mặc định: **`admin123`**

Đổi mật khẩu trong file `src/context/AppContext.jsx` (hàm `loginAdmin`).

## Phân quyền

| Vai trò | Quyền |
|--------|------|
| **Thành viên** | Xem khoản quỹ, quét VietQR, tải biên lai, gửi chờ duyệt. **Không** tự xác nhận đã đóng. |
| **Admin** | Đăng nhập bằng mật khẩu → xem danh sách chờ duyệt, xem ảnh biên lai, Duyệt / Từ chối, thống kê, xuất CSV. |

## Luồng thanh toán

1. Thành viên chọn **Đóng quỹ** → hiện VietQR + nội dung CK.
2. Thành viên tải **ảnh biên lai** (bắt buộc) → bấm **Gửi biên lai & Chờ Admin duyệt**.
3. Trạng thái chuyển thành **Chờ duyệt** (`awaiting`).
4. Admin đăng nhập → xem biên lai → **Duyệt** (thành Đã đóng) hoặc **Từ chối** (thành viên nộp lại).

## Cấu hình tài khoản nhận quỹ

Sửa `src/config.js`:

```js
export const BANK = {
  BANK_ID: 'SHB',
  ACCOUNT_NO: '2112076868',
  ACCOUNT_NAME: 'CLB BONG CHAY HUST',
  TEMPLATE: 'compact2',
};
```

## Dữ liệu

Demo lưu trong `localStorage` trình duyệt. Triển khai thật nên dùng Supabase/PostgreSQL + đăng nhập thật.
# hro
