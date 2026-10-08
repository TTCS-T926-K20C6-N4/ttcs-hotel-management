using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================================
// DATABASE
// =====================================
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    );
});

// =====================================
// CONTROLLERS
// =====================================
builder.Services.AddControllers();

// =====================================
// TOKEN SERVICE
// =====================================
builder.Services.AddScoped<TokenService>();

// =====================================
// JWT
// =====================================
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key chưa được cấu hình."
    );

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    builder.Configuration["Jwt:Issuer"],

                ValidAudience =
                    builder.Configuration["Jwt:Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    )
            };
    });

builder.Services.AddAuthorization();

// =====================================
// SESSION
// =====================================
builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    // Session hết hạn sau 30 phút không hoạt động
    options.IdleTimeout = TimeSpan.FromMinutes(30);

    // JavaScript không được đọc cookie Session
    options.Cookie.HttpOnly = true;

    // Cookie cần thiết cho hệ thống
    options.Cookie.IsEssential = true;

    // Frontend localhost:5173 gọi Backend localhost:5097
    options.Cookie.SameSite = SameSiteMode.Lax;

    // Đang chạy HTTP localhost
    options.Cookie.SecurePolicy =
        CookieSecurePolicy.SameAsRequest;

    // QUAN TRỌNG:
    // Không đặt MaxAge/Expires.
    // Đây là session cookie.
    // Đóng phiên trình duyệt thì cookie không được lưu lâu dài.
});

// =====================================
// CORS
// =====================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()

            // Bắt buộc để gửi cookie Session
            .AllowCredentials();
    });
});

// =====================================
// OPEN API
// =====================================
builder.Services.AddOpenApi();

var app = builder.Build();

// =====================================
// DEVELOPMENT
// =====================================
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// =====================================
// MIDDLEWARE
// =====================================

// Hiện đang dùng HTTP localhost
// app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

// Cho phép truy cập file tĩnh trong wwwroot
// Ví dụ: /uploads/rooms/abc.jpg
app.UseStaticFiles();

// Phải có trước khi Controller sử dụng HttpContext.Session
app.UseSession();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// =====================================
// SEED ADMIN TEST
// =====================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

   db.Database.Migrate();

// Tạo dữ liệu mặc định dùng chung cho cả nhóm
await DbSeeder.SeedAsync(db);

if (!db.Users.Any(u => u.Email == "admin@hotel.com"))
    {
        var admin = new User
        {
            Email = "admin@hotel.com",
            FullName = "Administrator",
            Role = "Admin",
            IsActive = true,

            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    "Admin@123"
                ),

            FailedLoginAttempts = 0,
            LockoutEnd = null,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(admin);
        db.SaveChanges();

        Console.WriteLine(
            "Đã tạo tài khoản Admin test."
        );
    }

    if (!db.RoomTypes.Any())
    {
        var standard = new RoomType
        {
            Name = "Phòng Tiêu Chuẩn (Standard)",
            PricePerNight = 350000m,
            Capacity = 2,
            Description = "Phòng tiêu chuẩn tiện nghi cơ bản, giường đôi 1m6, máy lạnh, wifi tốc độ cao, phòng tắm riêng khép kín."
        };

        var superior = new RoomType
        {
            Name = "Phòng Cao Cấp (Superior)",
            PricePerNight = 550000m,
            Capacity = 2,
            Description = "Thiết kế hiện đại, ban công thoáng mát ngắm phố, giường Queen 1m8, smart TV, minibar, bữa sáng miễn phí."
        };

        var deluxe = new RoomType
        {
            Name = "Phòng Sang Trọng (Deluxe)",
            PricePerNight = 850000m,
            Capacity = 3,
            Description = "Không gian rộng rãi 35m2, cửa sổ kính lớn view thành phố, bồn tắm nằm cao cấp, sofa thư giãn, trang thiết bị nhập khẩu."
        };

        var suite = new RoomType
        {
            Name = "Phòng Gia Đình (Family Suite)",
            PricePerNight = 1200000m,
            Capacity = 4,
            Description = "2 phòng ngủ liên thông (1 giường King + 2 giường đơn), khu vực tiếp khách riêng, thích hợp cho gia đình có trẻ nhỏ."
        };

        var vip = new RoomType
        {
            Name = "Phòng Tổng Thống (Presidential VIP)",
            PricePerNight = 2500000m,
            Capacity = 4,
            Description = "Căn hộ tầng cao nhất, tầm nhìn panorama 360 độ, nội thất phong cách hoàng gia sang trọng, quầy bar và bàn làm việc riêng."
        };

        db.RoomTypes.AddRange(standard, superior, deluxe, suite, vip);
        db.SaveChanges();

        if (!db.Rooms.Any())
        {
            db.Rooms.AddRange(
                new Room { RoomNumber = "101", Floor = 1, RoomTypeId = standard.Id, Status = RoomStatus.Available, Note = "Gần thang máy", ImageUrl = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80" },
                new Room { RoomNumber = "102", Floor = 1, RoomTypeId = standard.Id, Status = RoomStatus.Occupied, Note = "Khách thuê dài hạn", ImageUrl = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80" },
                new Room { RoomNumber = "201", Floor = 2, RoomTypeId = superior.Id, Status = RoomStatus.Available, Note = "Hướng Đông Nam mát mẻ", ImageUrl = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80" },
                new Room { RoomNumber = "202", Floor = 2, RoomTypeId = superior.Id, Status = RoomStatus.Occupied, Note = "Đặt qua Agoda", ImageUrl = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80" },
                new Room { RoomNumber = "301", Floor = 3, RoomTypeId = deluxe.Id, Status = RoomStatus.Available, Note = "Tầng cao view đẹp", ImageUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80" },
                new Room { RoomNumber = "302", Floor = 3, RoomTypeId = deluxe.Id, Status = RoomStatus.Reserved, Note = "Check-in chiều nay", ImageUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80" },
                new Room { RoomNumber = "401", Floor = 4, RoomTypeId = suite.Id, Status = RoomStatus.Available, Note = "Phòng gia đình tiện nghi", ImageUrl = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80" },
                new Room { RoomNumber = "501", Floor = 5, RoomTypeId = vip.Id, Status = RoomStatus.Available, Note = "Penthouse VIP sang trọng bậc nhất", ImageUrl = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80" }
            );
            db.SaveChanges();
        }

        Console.WriteLine("Đã seed dữ liệu mẫu thể loại phòng và phòng thành công.");
    }
}

// =====================================
// RUN
// =====================================
app.Run();