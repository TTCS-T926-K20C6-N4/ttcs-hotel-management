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

    private bool IsAdmin() => string.Equals(
        HttpContext.Session.GetString("UserRole"),
        "Admin",
        StringComparison.OrdinalIgnoreCase);

    private ObjectResult AdminOnly() => StatusCode(403, new
    {
        message = "Chỉ quản trị viên mới có quyền quản lý phòng."
    });

   public RoomController(AppDbContext db)
{
    _db = db;
}

[HttpGet]
public async Task<IActionResult> GetRooms()
{
    var rooms = await _db.Rooms
        .Select(room => new
        {
            id = room.Id,
            roomNumber = room.RoomNumber,
            floor = room.Floor,
            roomTypeId = room.RoomTypeId,
            status = room.Status,
            note = room.Note,
            imageUrl = room.ImageUrl,
            roomType = room.RoomType == null ? null : new
            {
                id = room.RoomType.Id,
                name = room.RoomType.Name,
                pricePerNight = room.RoomType.PricePerNight,
                capacity = room.RoomType.Capacity
            }
        })
        .ToListAsync();

    return Ok(rooms);
}

[HttpGet("{id:int}")]
public async Task<IActionResult> GetRoomById(int id)
{
    var room = await _db.Rooms
        .Include(r => r.RoomType)
        .FirstOrDefaultAsync(r => r.Id == id);

    if (room == null)
    {
        return NotFound(new { message = "Không tìm thấy phòng." });
    }

    return Ok(new
    {
        id = room.Id,
        roomNumber = room.RoomNumber,
        floor = room.Floor,
        roomTypeId = room.RoomTypeId,
        status = room.Status,
        note = room.Note,
        imageUrl = room.ImageUrl,
        roomType = room.RoomType == null ? null : new
        {
            id = room.RoomType.Id,
            name = room.RoomType.Name,
            pricePerNight = room.RoomType.PricePerNight,
            capacity = room.RoomType.Capacity
        }
    });
}

[HttpPost]
public async Task<IActionResult> CreateRoom(Room room)
{
    if (!IsAdmin()) return AdminOnly();

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

    var roomNumber = room.RoomNumber.Trim();

    var roomNumberExists = await _db.Rooms
        .AnyAsync(r => r.RoomNumber == roomNumber);

    if (roomNumberExists)
    {
        return BadRequest(new { message = "Số phòng đã tồn tại." });
    }

    var newRoom = new Room
    {
        RoomNumber = roomNumber,
        Floor = room.Floor <= 0 ? 1 : room.Floor,
        RoomTypeId = room.RoomTypeId,
        Status = room.Status,
        Note = room.Note,
        ImageUrl = room.ImageUrl
    };

    _db.Rooms.Add(newRoom);
    await _db.SaveChangesAsync();

    return Ok(new
    {
        id = newRoom.Id,
        roomNumber = newRoom.RoomNumber,
        floor = newRoom.Floor,
        roomTypeId = newRoom.RoomTypeId,
        status = newRoom.Status,
        note = newRoom.Note,
        imageUrl = newRoom.ImageUrl
    });
}

[HttpPut("{id:int}")]
public async Task<IActionResult> UpdateRoom(int id, Room updatedRoom)
{
    if (!IsAdmin()) return AdminOnly();

    var room = await _db.Rooms.FindAsync(id);

    if (room == null)
    {
        return NotFound(new { message = "Không tìm thấy phòng." });
    }

    var roomNumber = updatedRoom.RoomNumber?.Trim();
    if (string.IsNullOrWhiteSpace(roomNumber))
    {
        return BadRequest(new { message = "Vui lòng nhập số phòng." });
    }

    if (updatedRoom.Floor < 1)
    {
        return BadRequest(new { message = "Tầng phải là số nguyên lớn hơn hoặc bằng 1." });
    }

    if (!Enum.IsDefined(updatedRoom.Status))
    {
        return BadRequest(new { message = "Trạng thái phòng không hợp lệ." });
    }

    var roomNumberExists = await _db.Rooms
        .AnyAsync(r => r.Id != id && r.RoomNumber == roomNumber);

    if (roomNumberExists)
    {
        return BadRequest(new { message = "Số phòng đã tồn tại." });
    }

    var roomTypeExists = await _db.RoomTypes
        .AnyAsync(rt => rt.Id == updatedRoom.RoomTypeId);

    if (!roomTypeExists)
    {
        return BadRequest(new { message = "Thể loại phòng không tồn tại." });
    }

    room.RoomNumber = roomNumber;
    room.Floor = updatedRoom.Floor;
    room.RoomTypeId = updatedRoom.RoomTypeId;
    room.Status = updatedRoom.Status;
    room.Note = updatedRoom.Note;
    room.ImageUrl = updatedRoom.ImageUrl ?? room.ImageUrl;

    await _db.SaveChangesAsync();

    return Ok(new
    {
        id = room.Id,
        roomNumber = room.RoomNumber,
        floor = room.Floor,
        roomTypeId = room.RoomTypeId,
        status = room.Status,
        note = room.Note,
        imageUrl = room.ImageUrl
    });
}

[HttpPost("upload-image")]
public async Task<IActionResult> UploadRoomImage([FromForm] IFormFile image)
{
    if (!IsAdmin()) return AdminOnly();

    if (image == null || image.Length == 0)
    {
        return BadRequest(new { message = "Vui lòng chọn hình ảnh." });
    }

    if (image.Length > 5 * 1024 * 1024)
    {
        return BadRequest(new { message = "Hình ảnh không được vượt quá 5 MB." });
    }

    var allowedExtensions = new[]
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    var extension = Path.GetExtension(image.FileName).ToLowerInvariant();

    if (!allowedExtensions.Contains(extension))
    {
        return BadRequest(new
        {
            message = "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP."
        });
    }

    var uploadFolder = Path.Combine(
        Directory.GetCurrentDirectory(),
        "wwwroot",
        "uploads",
        "rooms"
    );

    Directory.CreateDirectory(uploadFolder);

    var fileName = $"{Guid.NewGuid():N}{extension}";
    var filePath = Path.Combine(uploadFolder, fileName);

    await using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await image.CopyToAsync(stream);
    }

    var imageUrl = $"/uploads/rooms/{fileName}";

    return Ok(new { imageUrl });
}

[HttpDelete("{id}")]
public async Task<IActionResult> DeleteRoom(int id)
    {
    if (!IsAdmin()) return AdminOnly();

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
        if (!IsAdmin()) return AdminOnly();

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