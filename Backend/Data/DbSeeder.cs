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

        var defaultRoomTypeNames = defaultRoomTypes
            .Select(roomType => roomType.Name)
            .ToArray();
        var roomTypes = await context.RoomTypes
            .Where(roomType => defaultRoomTypeNames.Contains(roomType.Name))
            .ToListAsync();
        var roomTypesByName = roomTypes
            .GroupBy(roomType => roomType.Name)
            .ToDictionary(group => group.Key, group => group.First());

        var defaultRooms = new[]
        {
            new { Number = "101", Floor = 1, Type = "Phòng Standard", Image = 1 },
            new { Number = "102", Floor = 1, Type = "Phòng Standard", Image = 2 },
            new { Number = "103", Floor = 1, Type = "Phòng Standard", Image = 3 },
            new { Number = "104", Floor = 1, Type = "Phòng Deluxe", Image = 4 },
            new { Number = "105", Floor = 1, Type = "Phòng Deluxe", Image = 5 },
            new { Number = "201", Floor = 2, Type = "Phòng Standard", Image = 6 },
            new { Number = "202", Floor = 2, Type = "Phòng Standard", Image = 7 },
            new { Number = "203", Floor = 2, Type = "Phòng Standard", Image = 8 },
            new { Number = "204", Floor = 2, Type = "Phòng Deluxe", Image = 9 },
            new { Number = "205", Floor = 2, Type = "Phòng Deluxe", Image = 10 },
            new { Number = "301", Floor = 3, Type = "Phòng VIP", Image = 1 },
            new { Number = "302", Floor = 3, Type = "Phòng VIP", Image = 2 },
            new { Number = "303", Floor = 3, Type = "Phòng VIP", Image = 3 },
            new { Number = "304", Floor = 3, Type = "Phòng Family", Image = 4 },
            new { Number = "305", Floor = 3, Type = "Phòng Family", Image = 5 }
        };

        var existingRooms = await context.Rooms.ToListAsync();
        var roomsByNumber = existingRooms
            .GroupBy(room => room.RoomNumber, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First(),
                StringComparer.OrdinalIgnoreCase);

        foreach (var defaultRoom in defaultRooms)
        {
            var imageUrl = $"/images/default-rooms/room-{defaultRoom.Image:D2}.jpg";
            if (roomsByNumber.TryGetValue(defaultRoom.Number, out var existingRoom))
            {
                if (string.IsNullOrWhiteSpace(existingRoom.ImageUrl))
                {
                    existingRoom.ImageUrl = imageUrl;
                }

                continue;
            }

            context.Rooms.Add(new Room
            {
                RoomNumber = defaultRoom.Number,
                Floor = defaultRoom.Floor,
                RoomTypeId = roomTypesByName[defaultRoom.Type].Id,
                Status = RoomStatus.Available,
                Note = "Phòng mẫu",
                ImageUrl = imageUrl
            });
        }

        await context.SaveChangesAsync();
    }
}