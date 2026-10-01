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
[HttpPost]
public async Task<IActionResult> CreateRoom(Room room)
{
    if (string.IsNullOrWhiteSpace(room.RoomNumber))
    {
        return BadRequest(new { message = "Vui lòng nhập số phòng." });
    }

    var roomTypeExists = await _db.RoomTypes
        .AnyAsync(rt => rt.Id == room.RoomTypeId);

    if (!roomTypeExists)
    {
        return BadRequest(new { message = "Thể loại phòng không tồn tại." });
    }

    var roomNumberExists = await _db.Rooms
        .AnyAsync(r => r.RoomNumber == room.RoomNumber);

    if (roomNumberExists)
    {
        return BadRequest(new { message = "Số phòng đã tồn tại." });
    }

    var newRoom = new Room
    {
        RoomNumber = room.RoomNumber.Trim(),
        Floor = room.Floor <= 0 ? 1 : room.Floor,
        RoomTypeId = room.RoomTypeId,
        Status = room.Status,
        Note = room.Note
    };

    _db.Rooms.Add(newRoom);
    await _db.SaveChangesAsync();

    await _db.Entry(newRoom)
        .Reference(r => r.RoomType)
        .LoadAsync();

    return Ok(newRoom);
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