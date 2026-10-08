# Hệ Thống Quản Lý Khách Sạn (Hotel Management System)

Dự án môn Thực tập cơ sở (TTCS) - Hệ thống phần mềm quản lý phòng, đặt phòng và vận hành khách sạn.

---

## 📑 Mục lục
1. [Kiến trúc & Công nghệ](#-kiến-trúc--công-nghệ)
2. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
3. [Tài khoản & Phân quyền](#-tài-khoản--phân-quyền)
4. [Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
5. [Quy trình Git & Đồng bộ mã nguồn](#-quy-trình-git--đồng-bộ-mã-nguồn)

---

## 🛠 Kiến trúc & Công nghệ

- **Backend:**
  - Nền tảng: ASP.NET Core Web API (.NET 8+)
  - Cơ sở dữ liệu: Microsoft SQL Server (LocalDB / SQL Server Express)
  - ORM: Entity Framework Core (Code-First)
  - Xác thực: Session-based Cookie & BCrypt Password Hashing, JWT Token Service
  - Cổng chạy mặc định: `http://localhost:5097` (Swagger: `http://localhost:5097/swagger`)

- **Frontend:**
  - Nền tảng: React 19 + Vite
  - Định tuyến: React Router DOM v7
  - Linter: Oxlint
  - Cổng chạy mặc định: `http://localhost:5173`

---

## 📂 Cấu trúc thư mục

```text
ttcs-hotel-management/
├── Backend/                            # Mã nguồn ASP.NET Core Web API
│   ├── Controllers/                    # API Endpoints
│   │   ├── AuthController.cs           # Đăng nhập, đăng ký, phiên đăng nhập, hồ sơ
│   │   ├── BookingController.cs        # Nghiệp vụ đặt phòng, thuê phòng, trả phòng
│   │   └── RoomController.cs           # Nghiệp vụ quản lý phòng và loại phòng
│   ├── Data/                           # Tầng dữ liệu & DB Context
│   │   ├── AppDbContext.cs             # Entity Framework DbContext
│   │   └── DbSeeder.cs                 # Khởi tạo dữ liệu mẫu (Loại phòng mặc định)
│   ├── DTOs/                           # Data Transfer Objects (Request / Response)
│   ├── Migrations/                     # Lịch sử EF Core Migrations
│   ├── Models/                         # Định nghĩa thực thể (User, Room, RoomType, Booking...)
│   ├── Services/                       # Nghiệp vụ bổ trợ (TokenService, v.v.)
│   ├── appsettings.json                # Cấu hình Connection String, JWT, Log
│   ├── Backend.csproj                  # File cấu hình dự án .NET
│   └── Program.cs                      # Điểm khởi chạy, cấu hình Middleware & Seed Data
│
├── Frontend/                           # Mã nguồn Giao diện React
│   ├── src/
│   │   ├── assets/                     # Hình ảnh, icons, tài nguyên tĩnh
│   │   ├── components/                 # Các component dùng chung (Sidebar, Modal, ...)
│   │   ├── layouts/                    # Layout khung ứng dụng (MainLayout)
│   │   ├── pages/                      # Các màn hình chức năng
│   │   │   ├── Home.jsx                # Trang chủ / Dashboard
│   │   │   ├── RoomList.jsx            # Danh sách phòng & trạng thái
│   │   │   ├── AddRoom.jsx             # Thêm phòng mới
│   │   │   ├── EditRoom.jsx            # Chỉnh sửa thông tin phòng
│   │   │   ├── RoomTypes.jsx           # Quản lý thể loại phòng
│   │   │   ├── RentRoom.jsx            # Giao diện đặt / thuê phòng
│   │   │   ├── Checkout.jsx            # Trả phòng & thanh toán
│   │   │   ├── RoomMap.jsx             # Sơ đồ phòng trực quan
│   │   │   ├── RoomStatus.jsx          # Thống kê trạng thái phòng
│   │   │   ├── Profile.jsx             # Thông tin cá nhân
│   │   │   ├── ChangePassword.jsx      # Đổi mật khẩu
│   │   │   ├── Login.jsx               # Đăng nhập
│   │   │   └── Register.jsx            # Đăng ký tài khoản
│   │   ├── services/                   # Module gọi API (api.js, roomStatus.js)
│   │   ├── App.jsx                     # Định tuyến chính & Protected Routes
│   │   └── main.jsx                    # Điểm render React
│   ├── package.json                    # Cấu hình thư viện NPM
│   └── vite.config.js                  # Cấu hình Vite
│
└── README.md                           # Tài liệu hướng dẫn dự án
```

---

## 👥 Tài khoản & Phân quyền

Hệ thống quản lý tài khoản qua bảng `Users` với mã hóa mật khẩu **BCrypt**. Có cơ chế khóa tài khoản 15 phút nếu nhập sai mật khẩu quá 5 lần liên tiếp.

### 1. Tài khoản mặc định hệ thống (Tự động Seed khi chạy Backend)

| Vai trò (Role) | Email | Mật khẩu | Quyền hạn & Mô tả |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hotel.com` | `Admin@123` | **Quản trị viên:** Toàn quyền quản lý phòng, loại phòng, tạo mới/sửa/xóa phòng, sơ đồ khách sạn, xem báo cáo thống kê, vận hành thuê/trả phòng. |

*(Tài khoản Admin trên được tự động khởi tạo trong `Backend/Program.cs` nếu chưa tồn tại trong cơ sở dữ liệu).*

### 2. Các quyền trong hệ thống

- **`Admin` (Quản trị viên):**
  - Quản lý danh mục loại phòng (thêm, cập nhật giá, tiện nghi).
  - Quản lý danh sách phòng (thêm phòng, sửa phòng, xóa phòng).
  - Quản lý quy trình thuê phòng, nhận phòng và trả phòng (Check-out).
  - Quản lý hồ sơ cá nhân và đổi mật khẩu.
- **`Staff` (Nhân viên lễ tân):**
  - Được định nghĩa mặc định trong model `User` (`Role = "Staff"`).
  - Thực hiện tiếp nhận khách, cho thuê phòng, đổi trạng thái phòng và trả phòng.
- **`User` (Khách hàng / Người dùng thông thường):**
  - Khi người dùng đăng ký tài khoản mới qua form `/register`, tài khoản sẽ tự động được gán quyền `User`.

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### Điều kiện tiên quyết
- [.NET SDK 8.0 trở lên](https://dotnet.microsoft.com/download)
- [Node.js (v18 trở lên)](https://nodejs.org/) & `npm`
- [SQL Server](https://www.microsoft.com/sql-server) hoặc SQL Server LocalDB (đi kèm Visual Studio)

---

### Bước 1: Khởi chạy Backend (.NET API)

1. Mở cửa sổ Terminal thứ nhất và di chuyển vào thư mục `Backend`:
   ```powershell
   cd d:\ttcs-hotel-management\Backend
   ```

2. Kiểm tra chuỗi kết nối trong [Backend/appsettings.json](file:///d:/ttcs-hotel-management/Backend/appsettings.json):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=HotelManagementDb;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```
   *(Nếu bạn dùng SQL Server Express hoặc phiên bản có tài khoản/mật khẩu, hãy sửa lại connection string phù hợp).*

3. Cập nhật cơ sở dữ liệu (tự động tạo database và bảng):
   ```powershell
   dotnet ef database update
   ```
   *(Lưu ý: Ngay cả khi không chạy lệnh này, `Program.cs` cũng đã cấu hình `db.Database.Migrate()` tự động chạy khi khởi động).*

4. Chạy Backend Web API:
   ```powershell
   dotnet run --launch-profile http
   ```
   - API lắng nghe tại: `http://localhost:5097`
   - Tài liệu Swagger UI: `http://localhost:5097/swagger`

---

### Bước 2: Khởi chạy Frontend (React + Vite)

1. Mở cửa sổ Terminal thứ hai và di chuyển vào thư mục `Frontend`:
   ```powershell
   cd d:\ttcs-hotel-management\Frontend
   ```

2. Cài đặt các thư viện phụ thuộc (nếu là lần đầu tải dự án về):
   ```powershell
   npm install
   ```

3. Chạy giao diện phát triển:
   ```powershell
   npm run dev
   ```

4. Truy cập giao diện tại: `http://localhost:5173`
   - Đăng nhập bằng tài khoản: `admin@hotel.com` / `Admin@123`

---

## 🔄 Quy trình Git & Đồng bộ mã nguồn

### Kiểm tra trạng thái code từ GitHub

Để kiểm tra xem bạn đã lấy code mới nhất của cả nhóm về máy hay chưa:

1. Lấy thông tin mới nhất từ remote GitHub:
   ```powershell
   git fetch origin
   ```

2. Xem sự khác biệt giữa nhánh máy bạn và nhánh `origin/main`:
   ```powershell
   git log HEAD..origin/main --oneline
   ```
   - Nếu lệnh xuất ra danh sách các commit -> **Mã nguồn ở máy bạn ĐANG CŨ hơn GitHub**.
   - Nếu lệnh không xuất ra dòng nào -> Mã nguồn máy bạn đã bắt kịp `origin/main`.

### Cách cập nhật mã nguồn mới nhất về máy

1. Chuyển về nhánh `main` và kéo code mới:
   ```powershell
   git checkout main
   git pull origin main
   ```

2. Cập nhật code mới nhất từ `main` vào nhánh tính năng bạn đang làm:
   ```powershell
   git checkout feature/filter-rooms-by-status
   git merge main
   ```
   *(Nếu có xung đột conflict, giải quyết các file conflict rồi tiến hành commit).*
