using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomController : ControllerBase
{
    private readonly AppDbContext _db;

   public RoomController(AppDbContext db)
{
    _db = db;
}

[HttpGet]
public async Task<IActionResult> GetRooms()
{
    var rooms = await _db.Rooms
        .Include(r => r.RoomType)
        .ToListAsync();

    return Ok(rooms);
}

[HttpDelete("{id}")]
public async Task<IActionResult> DeleteRoom(int id)
    {
        var room = await _db.Rooms.FindAsync(id);

        if (room == null)
{
    return NotFound(new { message = "Không tìm thấy phòng." });
}

if (room.Status == RoomStatus.Occupied)
{
    return BadRequest(new { message = "Không thể xóa phòng đang cho thuê." });
}

_db.Rooms.Remove(room);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Xóa phòng thành công." });
    }

    [HttpGet("room-types")]
    public async Task<IActionResult> GetRoomTypes()
    {
        var roomTypes = await _db.RoomTypes.ToListAsync();
        return Ok(roomTypes);
    }

    [HttpGet("room-types/{id}")]
    public async Task<IActionResult> GetRoomTypeById(int id)
    {
        var roomType = await _db.RoomTypes.FindAsync(id);
        if (roomType == null)
        {
            return NotFound(new { message = "Không tìm thấy thể loại phòng." });
        }
        return Ok(roomType);
    }

    [HttpPut("room-types/{id}")]
    public async Task<IActionResult> UpdateRoomType(int id, RoomType updatedRoomType)
    {
        if (id != updatedRoomType.Id)
        {
            return BadRequest(new { message = "ID thể loại phòng không trùng khớp." });
        }

        var existingRoomType = await _db.RoomTypes.FindAsync(id);
        if (existingRoomType == null)
        {
            return NotFound(new { message = "Không tìm thấy thể loại phòng cần cập nhật." });
        }

        existingRoomType.Name = updatedRoomType.Name;
        existingRoomType.PricePerNight = updatedRoomType.PricePerNight;
        existingRoomType.Capacity = updatedRoomType.Capacity;
        existingRoomType.Description = updatedRoomType.Description;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Cập nhật thể loại phòng thành công.", data = existingRoomType });
    }
}