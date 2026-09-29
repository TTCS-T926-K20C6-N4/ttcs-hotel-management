using Backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ========================
// DATABASE - SQL SERVER
// ========================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ========================
// CONTROLLERS
// ========================
builder.Services.AddControllers();

// ========================
// CORS - CHO PHÉP FRONTEND
// ========================
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
            .AllowAnyMethod();
    });
});

// ========================
// OPEN API
// ========================
builder.Services.AddOpenApi();

var app = builder.Build();

// ========================
// DEVELOPMENT
// ========================
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ========================
// CORS
// ========================
app.UseCors("AllowFrontend");

// ========================
// HTTPS
// ========================
app.UseHttpsRedirection();

// ========================
// STATIC FILES
// Cho phép truy cập ảnh trong wwwroot
// Ví dụ:
// /uploads/rooms/room.jpg
// ========================
app.UseStaticFiles();

// ========================
// CONTROLLERS
// ========================
app.MapControllers();

// ========================
// RUN
// ========================
app.Run();