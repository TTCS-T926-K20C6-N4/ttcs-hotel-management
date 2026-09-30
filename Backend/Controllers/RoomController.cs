using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.Data.SqlClient;
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

    [HttpPost("room-types")]
    public async Task<IActionResult> CreateRoomType(
        [FromBody] CreateRoomTypeRequest request)
    {
        if (HttpContext.Session.GetString("IsLoggedIn") != "true")
        {
            return Unauthorized(new { message = "Bạn chưa đăng nhập." });
        }

        var role = HttpContext.Session.GetString("UserRole");
        if (role is not ("Admin" or "Manager"))
        {
            return StatusCode(403, new
            {
                message = "Bạn không có quyền tạo loại phòng."
            });
        }

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Tên loại phòng là bắt buộc." });
        }

        if (await _db.RoomTypes.AnyAsync(roomType => roomType.Name == name))
        {
            return Conflict(new { message = "Tên loại phòng đã tồn tại." });
        }

        var roomType = new RoomType
        {
            Name = name,
            PricePerNight = request.PricePerNight,
            Capacity = request.Capacity,
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim()
        };

        _db.RoomTypes.Add(roomType);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { message = "Tên loại phòng đã tồn tại." });
        }

        return Created(
            $"/api/rooms/room-types/{roomType.Id}",
            new
            {
                message = "Tạo loại phòng thành công.",
                data = roomType
            });
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