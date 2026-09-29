using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public RoomsController(
        AppDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    // GET: api/rooms
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Room>>> GetRooms()
    {
        var rooms = await _context.Rooms
            .OrderBy(r => r.RoomNumber)
            .ToListAsync();

        return Ok(rooms);
    }

    // POST: api/rooms
    [HttpPost]
    public async Task<ActionResult<Room>> CreateRoom(
        [FromForm] CreateRoomDto dto)
    {
        // Kiểm tra số phòng đã tồn tại
        var roomExists = await _context.Rooms
            .AnyAsync(r => r.RoomNumber == dto.RoomNumber);

        if (roomExists)
        {
            return BadRequest(new
            {
                message = "Số phòng đã tồn tại."
            });
        }

        string? imageUrl = null;

        // Nếu người dùng có chọn ảnh
        if (dto.Image != null && dto.Image.Length > 0)
        {
            // Kiểm tra loại file
            var allowedExtensions = new[]
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            };

            var extension =
                Path.GetExtension(dto.Image.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new
                {
                    message = "Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WEBP."
                });
            }

            // Giới hạn 5 MB
            if (dto.Image.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    message = "Ảnh không được lớn hơn 5 MB."
                });
            }

            // Backend/wwwroot/uploads/rooms
            var uploadFolder = Path.Combine(
                _environment.WebRootPath,
                "uploads",
                "rooms"
            );

            Directory.CreateDirectory(uploadFolder);

            // Tạo tên file riêng để tránh trùng
            var fileName =
                $"{Guid.NewGuid()}{extension}";

            var filePath = Path.Combine(
                uploadFolder,
                fileName
            );

            // Lưu ảnh
            await using (var stream =
                new FileStream(filePath, FileMode.Create))
            {
                await dto.Image.CopyToAsync(stream);
            }

            // Đường dẫn lưu vào SQL Server
            imageUrl = $"/uploads/rooms/{fileName}";
        }

        var room = new Room
        {
            RoomNumber = dto.RoomNumber,
            RoomType = dto.RoomType,
            Price = dto.Price,
            Capacity = dto.Capacity,
            Description = dto.Description,
            ImageUrl = imageUrl,
            Status = dto.Status
        };

        _context.Rooms.Add(room);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetRooms),
            new { id = room.Id },
            room
        );
    }
}