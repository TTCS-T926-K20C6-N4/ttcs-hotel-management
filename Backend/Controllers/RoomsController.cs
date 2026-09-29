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

    public RoomsController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/rooms
    [HttpPost]
    public async Task<IActionResult> CreateRoom(CreateRoomDto dto)
    {
        // Không cho phép trùng số phòng
        bool roomExists = await _context.Rooms
            .AnyAsync(r => r.RoomNumber == dto.RoomNumber);

        if (roomExists)
        {
            return BadRequest(new
            {
                message = "Số phòng đã tồn tại."
            });
        }

        var room = new Room
        {
            RoomNumber = dto.RoomNumber,
            RoomType = dto.RoomType,
            Price = dto.Price,
            Capacity = dto.Capacity,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            Status = "Available"
        };

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Thêm phòng thành công.",
            room
        });
    }
}