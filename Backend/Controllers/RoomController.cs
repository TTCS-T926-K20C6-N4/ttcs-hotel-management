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

    // GET /api/rooms
    // Danh sách phòng phục vụ Backlog #5
    [HttpGet]
    public async Task<IActionResult> GetRooms()
    {
        var rooms = await _db.Rooms
            .AsNoTracking()
            .OrderBy(r => r.Floor)
            .ThenBy(r => r.RoomNumber)
            .Select(r => new
            {
                r.Id,

                // Mã phòng
                r.RoomNumber,

                // Trạng thái phòng
                Status = r.Status.ToString(),

                // Booking hiện tại của phòng
                CurrentBooking = _db.Bookings
                    .Where(b =>
                        b.RoomId == r.Id &&
                        b.Status == BookingStatus.CheckedIn)
                    .OrderByDescending(b => b.CheckInDate)
                    .Select(b => new
                    {
                        // Giờ vào
                        CheckIn = b.CheckInDate,

                        // Giờ ra
                        CheckOut = b.ActualCheckOutDate
                                   ?? b.ExpectedCheckOutDate
                    })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(rooms);
    }
}