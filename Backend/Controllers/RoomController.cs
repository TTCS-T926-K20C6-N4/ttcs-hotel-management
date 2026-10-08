using Backend.Data;
using Backend.DTOs;
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
public async Task<IActionResult> GetRooms([FromQuery] RoomStatus? status = null, CancellationToken cancellationToken = default)
{
    var query = _db.Rooms.AsNoTracking();

    if (status.HasValue)
    {
        query = query.Where(r => r.Status == status.Value);
    }

    var rooms = await query
        .Select(r => new
        {
            id = r.Id,
            roomNumber = r.RoomNumber,
            floor = r.Floor,
            roomTypeId = r.RoomTypeId,
            roomType = r.RoomType == null ? null : new
            {
                id = r.RoomType.Id,
                name = r.RoomType.Name,
                pricePerNight = r.RoomType.PricePerNight,
                capacity = r.RoomType.Capacity
            },
            status = r.Status,
            note = r.Note,
            imageUrl = r.ImageUrl
        })
        .ToListAsync(cancellationToken);

    return Ok(rooms);
}
[HttpGet("{id:int}")]
public async Task<IActionResult> GetRoomById(int id, CancellationToken cancellationToken)
{
    var room = await _db.Rooms
        .AsNoTracking()
        .Where(r => r.Id == id)
        .Select(r => new
        {
            id = r.Id,
            roomNumber = r.RoomNumber,
            floor = r.Floor,
            roomTypeId = r.RoomTypeId,
            roomType = r.RoomType == null ? null : new
            {
                id = r.RoomType.Id,
                name = r.RoomType.Name,
                pricePerNight = r.RoomType.PricePerNight,
                capacity = r.RoomType.Capacity
            },
            status = r.Status,
            note = r.Note,
            imageUrl = r.ImageUrl
        })
        .FirstOrDefaultAsync(cancellationToken);

    if (room == null)
    {
        return NotFound(new { message = "Không tìm thấy phòng." });
    }

    return Ok(room);
}

[HttpGet("status-count")]
public async Task<IActionResult> GetRoomStatusCount()
{
    var counts = await _db.Rooms
        .GroupBy(r => r.Status)
        .Select(g => new
        {
            status = g.Key,
            count = g.Count()
        })
        .ToListAsync();

    var result = Enum.GetValues<RoomStatus>()
        .Select(status => new
        {
            status = (int)status,
            statusName = status.ToString(),
            displayName = status switch
            {
                RoomStatus.Available => "Phòng trống",
                RoomStatus.Occupied => "Đang có khách",
                RoomStatus.Maintenance => "Bảo trì",
                RoomStatus.Reserved => "Đã đặt trước",
                _ => status.ToString()
            },
            count = counts
                .Where(x => x.status == status)
                .Select(x => x.count)
                .FirstOrDefault()
        });

    return Ok(result);
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

[HttpPost("upload-image")]
public async Task<IActionResult> UploadRoomImage([FromForm] IFormFile image)
{
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

[HttpPut("{id:int}")]
public async Task<IActionResult> UpdateRoom(
    int id,
    [FromBody] UpdateRoomRequest request,
    CancellationToken cancellationToken)
{
    var room = await _db.Rooms.FindAsync([id], cancellationToken);
    if (room == null)
    {
        return NotFound(new { message = "Không tìm thấy phòng cần cập nhật." });
    }

    var roomNumber = request.RoomNumber.Trim();
    if (string.IsNullOrWhiteSpace(roomNumber))
    {
        return BadRequest(new { message = "Vui lòng nhập số phòng." });
    }

    var roomNumberExists = await _db.Rooms
        .AnyAsync(
            r => r.Id != id && r.RoomNumber.ToLower() == roomNumber.ToLower(),
            cancellationToken);
    if (roomNumberExists)
    {
        return BadRequest(new { message = "Số phòng đã tồn tại." });
    }

    var roomTypeExists = await _db.RoomTypes
        .AnyAsync(rt => rt.Id == request.RoomTypeId, cancellationToken);
    if (!roomTypeExists)
    {
        return BadRequest(new { message = "Thể loại phòng không tồn tại." });
    }

    room.RoomNumber = roomNumber;
    room.Floor = request.Floor;
    room.RoomTypeId = request.RoomTypeId;
    room.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
    room.ImageUrl = request.ImageUrl;

    await _db.SaveChangesAsync(cancellationToken);

    return Ok(new
    {
        id = room.Id,
        roomNumber = room.RoomNumber,
        floor = room.Floor,
        roomTypeId = room.RoomTypeId,
        status = room.Status,
        note = room.Note,
        imageUrl = room.ImageUrl,
        message = "Cập nhật thông tin phòng thành công."
    });
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
    public async Task<IActionResult> GetRoomTypes([FromQuery] string? search = null)
    {
        var query = _db.RoomTypes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(rt => rt.Name.ToLower().Contains(keyword) || 
                                     (rt.Description != null && rt.Description.ToLower().Contains(keyword)));
        }

        var roomTypes = await query
            .Select(rt => new
            {
                rt.Id,
                rt.Name,
                rt.PricePerNight,
                rt.Capacity,
                rt.Description,
                TotalRooms = rt.Rooms.Count(),
                AvailableRooms = rt.Rooms.Count(r => r.Status == RoomStatus.Available),
                OccupiedRooms = rt.Rooms.Count(r => r.Status == RoomStatus.Occupied)
            })
            .OrderBy(rt => rt.Id)
            .ToListAsync();

        return Ok(roomTypes);
    }

    [HttpGet("room-types/{id}")]
    public async Task<IActionResult> GetRoomTypeById(int id)
    {
        var roomType = await _db.RoomTypes
            .AsNoTracking()
            .Where(rt => rt.Id == id)
            .Select(rt => new
            {
                rt.Id,
                rt.Name,
                rt.PricePerNight,
                rt.Capacity,
                rt.Description,
                TotalRooms = rt.Rooms.Count,
                AvailableRooms = rt.Rooms.Count(r => r.Status == RoomStatus.Available),
                OccupiedRooms = rt.Rooms.Count(r => r.Status == RoomStatus.Occupied),
                Rooms = rt.Rooms.Select(r => new
                {
                    r.Id,
                    r.RoomNumber,
                    r.Floor,
                    Status = (int)r.Status,
                    StatusName = r.Status == RoomStatus.Available ? "Phòng trống" :
                                 r.Status == RoomStatus.Occupied ? "Đang có khách" :
                                 r.Status == RoomStatus.Maintenance ? "Bảo trì" : "Đã đặt trước",
                    r.Note,
                    r.ImageUrl
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (roomType == null)
        {
            return NotFound(new { message = "Không tìm thấy thể loại phòng." });
        }

        return Ok(roomType);
    }

    [HttpPost("room-types")]
    public async Task<IActionResult> CreateRoomType([FromBody] RoomTypeRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault();
            return BadRequest(new { message = errors ?? "Dữ liệu không hợp lệ." });
        }

        var trimmedName = request.Name.Trim();
        var exists = await _db.RoomTypes.AnyAsync(rt => rt.Name.ToLower() == trimmedName.ToLower());
        if (exists)
        {
            return BadRequest(new { message = $"Thể loại phòng '{trimmedName}' đã tồn tại trong hệ thống." });
        }

        var roomType = new RoomType
        {
            Name = trimmedName,
            PricePerNight = request.PricePerNight,
            Capacity = request.Capacity,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
        };

        _db.RoomTypes.Add(roomType);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRoomTypeById), new { id = roomType.Id }, new
        {
            id = roomType.Id,
            name = roomType.Name,
            pricePerNight = roomType.PricePerNight,
            capacity = roomType.Capacity,
            description = roomType.Description,
            totalRooms = 0,
            availableRooms = 0,
            occupiedRooms = 0,
            message = "Thêm thể loại phòng thành công."
        });
    }

    [HttpPut("room-types/{id}")]
    public async Task<IActionResult> UpdateRoomType(int id, [FromBody] RoomTypeRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault();
            return BadRequest(new { message = errors ?? "Dữ liệu không hợp lệ." });
        }

        var existingRoomType = await _db.RoomTypes.FindAsync(id);
        if (existingRoomType == null)
        {
            return NotFound(new { message = "Không tìm thấy thể loại phòng cần cập nhật." });
        }

        var trimmedName = request.Name.Trim();
        var duplicate = await _db.RoomTypes
            .AnyAsync(rt => rt.Id != id && rt.Name.ToLower() == trimmedName.ToLower());
        if (duplicate)
        {
            return BadRequest(new { message = $"Tên thể loại phòng '{trimmedName}' đã được sử dụng." });
        }

        existingRoomType.Name = trimmedName;
        existingRoomType.PricePerNight = request.PricePerNight;
        existingRoomType.Capacity = request.Capacity;
        existingRoomType.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = existingRoomType.Id,
            name = existingRoomType.Name,
            pricePerNight = existingRoomType.PricePerNight,
            capacity = existingRoomType.Capacity,
            description = existingRoomType.Description,
            message = "Cập nhật thể loại phòng thành công."
        });
    }

    [HttpDelete("room-types/{id}")]
    public async Task<IActionResult> DeleteRoomType(int id)
    {
        var roomType = await _db.RoomTypes
            .Include(rt => rt.Rooms)
            .FirstOrDefaultAsync(rt => rt.Id == id);

        if (roomType == null)
        {
            return NotFound(new { message = "Không tìm thấy thể loại phòng." });
        }

        if (roomType.Rooms.Count > 0)
        {
            return BadRequest(new
            {
                message = $"Không thể xóa thể loại phòng '{roomType.Name}' vì đang có {roomType.Rooms.Count} phòng liên kết. Vui lòng chuyển hoặc xóa các phòng trước."
            });
        }

        _db.RoomTypes.Remove(roomType);
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Đã xóa thể loại phòng '{roomType.Name}' thành công." });
    }
}