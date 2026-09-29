using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================================
// DATABASE - SQL SERVER
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
// JWT AUTHENTICATION
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
    options.IdleTimeout = TimeSpan.FromMinutes(30);

    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;

    options.Cookie.SameSite = SameSiteMode.Lax;

    options.Cookie.SecurePolicy =
        CookieSecurePolicy.SameAsRequest;
});

// =====================================
// CORS
// Cho phép cả 5173 và 5174
// =====================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
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
// CORS
// =====================================
app.UseCors("AllowFrontend");

// =====================================
// STATIC FILES
// QUAN TRỌNG CHO ẢNH PHÒNG
// wwwroot/uploads/rooms/...
// =====================================
app.UseStaticFiles();

// =====================================
// SESSION
// =====================================
app.UseSession();

// =====================================
// AUTHENTICATION + AUTHORIZATION
// =====================================
app.UseAuthentication();
app.UseAuthorization();

// =====================================
// CONTROLLERS
// =====================================
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