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
}

// =====================================
// RUN
// =====================================
app.Run();