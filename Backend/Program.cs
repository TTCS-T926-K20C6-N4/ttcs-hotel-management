using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
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

    // Không cho JavaScript đọc cookie Session
    options.Cookie.HttpOnly = true;

    options.Cookie.IsEssential = true;

    // Phù hợp khi chạy localhost
    options.Cookie.SameSite = SameSiteMode.Lax;

    // Hiện tại đang chạy HTTP localhost
    options.Cookie.SecurePolicy =
        CookieSecurePolicy.SameAsRequest;
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

            // Cho phép React gửi cookie Session
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

// Tạm thời không redirect HTTPS khi chạy localhost HTTP
// app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

// Session phải được kích hoạt trước Controllers
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

    // Tự động áp dụng Migration
    db.Database.Migrate();

    // Tạo tài khoản Admin nếu chưa tồn tại
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
// PHẢI LÀ DÒNG CUỐI
// =====================================
app.Run();