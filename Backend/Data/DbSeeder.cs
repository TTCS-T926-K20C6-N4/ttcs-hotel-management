using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Danh sách loại phòng mặc định dùng chung cho cả nhóm
        var defaultRoomTypes = new List<RoomType>
        {
            new RoomType
            {
                Name = "Phòng Standard",
                PricePerNight = 500000m,
                Capacity = 2,
                Description = "Phòng tiêu chuẩn dành cho 2 người"
            },
            new RoomType
            {
                Name = "Phòng Deluxe",
                PricePerNight = 800000m,
                Capacity = 2,
                Description = "Phòng cao cấp dành cho 2 người"
            },
            new RoomType
            {
                Name = "Phòng VIP",
                PricePerNight = 1200000m,
                Capacity = 2,
                Description = "Phòng VIP với tiện nghi cao cấp"
            },
            new RoomType
            {
                Name = "Phòng Family",
                PricePerNight = 1500000m,
                Capacity = 4,
                Description = "Phòng gia đình dành cho tối đa 4 người"
            }
        };

        foreach (var roomType in defaultRoomTypes)
        {
            var exists = await context.RoomTypes
                .AnyAsync(rt => rt.Name == roomType.Name);

            if (!exists)
            {
                context.RoomTypes.Add(roomType);
            }
        }

        await context.SaveChangesAsync();
    }
}