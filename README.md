# Hệ thống quản lý khách sạn

Ứng dụng quản lý khách sạn gồm giao diện web React và API ASP.NET Core. Backend lưu dữ liệu bằng SQLite; không cần cài đặt máy chủ cơ sở dữ liệu riêng.

## Công nghệ

- Frontend: React, Vite
- Backend: ASP.NET Core 9, Entity Framework Core
- Cơ sở dữ liệu: SQLite

## Yêu cầu

Cài đặt các công cụ sau trên Windows:

- **Git** nếu bạn cần tải mã nguồn bằng lệnh `git clone`.
- **.NET 9 SDK** (không chỉ .NET Runtime).
- **Node.js 20.19.x hoặc mới hơn trong nhánh 20.x, hoặc Node.js 22.12 trở lên**, kèm npm.
- **PowerShell** hoặc Windows Terminal.

Kiểm tra các công cụ đã sẵn sàng bằng PowerShell:

```powershell
dotnet --list-sdks
node --version
npm --version
```

## Tải mã nguồn

Mở PowerShell hoặc Windows Terminal tại thư mục nơi bạn muốn lưu dự án, sau đó chạy:

```powershell
git clone https://github.com/TTCS-T926-K20C6-N4/ttcs-hotel-management.git
cd .\ttcs-hotel-management
```

Các bước chạy bên dưới được thực hiện từ thư mục `ttcs-hotel-management` vừa tải về. Nếu đã tải mã nguồn dưới dạng ZIP, giải nén rồi mở terminal tại thư mục dự án thay vì chạy `git clone`.

## Chạy dự án

Mở **PowerShell** hoặc **Windows Terminal** tại thư mục gốc của dự án, rồi mở **hai terminal** (hai cửa sổ hoặc hai tab). Chạy các lệnh bên dưới trực tiếp trong terminal; không cần dùng nút Run trong VS Code hoặc mở quyền Administrator. Giữ cả hai terminal mở trong khi sử dụng ứng dụng.

### 1. Khởi động backend

Trong terminal thứ nhất, chạy:

```powershell
cd Backend
dotnet run
```

`dotnet run` sẽ tự restore package khi cần. Đợi đến khi backend chạy tại `http://localhost:5097`.

Backend tự tạo và khởi tạo database SQLite tại `Backend\hotelmanagement.db` khi database chưa có. Dữ liệu mặc định bao gồm các loại phòng và tài khoản quản trị mẫu; không cần chạy lệnh migration riêng.

### 2. Khởi động frontend

Trong terminal thứ hai, chạy:

```powershell
cd Frontend
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, thông thường là `http://localhost:5173`.

> **Lần đầu chạy trên máy mới:** nếu chưa cài package frontend, chạy `npm ci` trong thư mục `Frontend` trước. Các lần chạy sau chỉ cần `npm run dev`.

> Frontend được cấu hình gọi API tại `http://localhost:5097`, và backend chỉ cho phép kết nối từ frontend tại `http://localhost:5173`. Nếu cổng `5173` đang được sử dụng, hãy dừng ứng dụng đang chiếm cổng đó trước khi chạy frontend để tránh lỗi kết nối hoặc CORS.

## Đăng nhập

Nếu tài khoản quản trị mẫu chưa tồn tại trong database, backend sẽ tạo tài khoản sau khi khởi động:

| Trường | Giá trị |
| --- | --- |
| Email | `admin@hotel.com` |
| Mật khẩu | `Admin@123` |

Nếu database đã có tài khoản này với mật khẩu khác, hãy dùng mật khẩu hiện có hoặc đăng ký tài khoản khác trên giao diện.

## Dừng ứng dụng

Trong từng terminal đang chạy frontend và backend, nhấn `Ctrl+C` để dừng ứng dụng.

## Xử lý sự cố thường gặp

- **`dotnet` không được nhận diện:** cài .NET 9 SDK rồi mở lại VS Code/Terminal.
- **`npm` hoặc `node` không được nhận diện:** cài Node.js phiên bản đáp ứng yêu cầu rồi mở lại VS Code/Terminal.
- **Lỗi không kết nối được API hoặc lỗi CORS:** xác nhận backend đang chạy tại `http://localhost:5097` và frontend tại `http://localhost:5173`.
- **Cổng đang được sử dụng:** dừng phiên chạy cũ trong terminal của phiên đó, rồi chạy lại backend hoặc frontend.
- **Lỗi cài package frontend:** kiểm tra kết nối Internet rồi chạy `npm ci` trong thư mục `Frontend`.
