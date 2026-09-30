using Backend.Data;
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

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Xóa phòng thành công." });
    }
}