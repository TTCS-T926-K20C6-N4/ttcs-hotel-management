using System.Security.Claims;

using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Backend.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingController : ControllerBase
{
   private readonly AppDbContext _db;

    private int? CurrentUserId => int.TryParse(
        User.FindFirstValue(ClaimTypes.NameIdentifier),
        out var userId) ? userId : null;

public BookingController(AppDbContext db)
{
    _db = db;
}
    // =========================================================
    // GET /api/bookings?status=
    // Danh sách lượt thuê phòng
    // =========================================================
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetBookings([FromQuery] string? status)
    {
        var query = _db.Bookings
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Include(b => b.Customer)
            .Include(b => b.Services)
            .Include(b => b.Invoices)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<BookingStatus>(status, true, out var st))
        {
            query = query.Where(b => b.Status == st);
        }

        var bookings = await query
            .OrderByDescending(b => b.CheckInDate)
            .ThenByDescending(b => b.Id)
            .ToListAsync();

        return Ok(bookings.Select(Mapper.ToDto));
    }

    // =========================================================
    // GET /api/bookings/active
    // Danh sách khách đang lưu trú
    // =========================================================
    [Authorize(Roles = "Admin")]
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveBookings()
    {
        var bookings = await _db.Bookings
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Include(b => b.Customer)
            .Include(b => b.Services)
            .Include(b => b.Invoices)
            .Where(b => b.Status == BookingStatus.CheckedIn)
            .OrderBy(b => b.Room!.RoomNumber)
            .ToListAsync();

        return Ok(bookings.Select(Mapper.ToDto));
    }

    [Authorize(Roles = "User")]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyBookings()
    {
        if (CurrentUserId is not int userId)
            return Forbid();

        var bookings = await _db.Bookings
            .Include(booking => booking.Room)
                .ThenInclude(room => room!.RoomType)
            .Include(booking => booking.Customer)
            .Include(booking => booking.Services)
            .Include(booking => booking.Invoices)
            .Where(booking => booking.UserId == userId)
            .OrderByDescending(booking => booking.CheckInDate)
            .ThenByDescending(booking => booking.Id)
            .ToListAsync();

        return Ok(bookings.Select(Mapper.ToDto));
    }

    [Authorize(Roles = "User")]
    [HttpPut("{id:int}/room")]
    public async Task<IActionResult> UpdateMyBookedRoom(
        int id,
        [FromBody] UpdateBookedRoomRequest request)
    {
        if (CurrentUserId is not int userId)
            return Forbid();

        var booking = await _db.Bookings
            .Include(item => item.Room)
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        if (booking?.Room is null)
            return NotFound(new { message = "Không tìm thấy phòng đã đặt của tài khoản này." });

        if (booking.Status != BookingStatus.Booked)
            return BadRequest(new { message = "Chỉ có thể cập nhật phòng trước khi nhận phòng." });

        var roomNumber = request.RoomNumber.Trim();
        if (string.IsNullOrWhiteSpace(roomNumber))
            return BadRequest(new { message = "Vui lòng nhập số phòng." });

        var duplicateRoomNumber = await _db.Rooms
            .AnyAsync(room => room.Id != booking.RoomId && room.RoomNumber == roomNumber);

        if (duplicateRoomNumber)
            return BadRequest(new { message = "Số phòng đã tồn tại." });

        var roomType = await _db.RoomTypes
            .FirstOrDefaultAsync(item => item.Id == request.RoomTypeId);

        if (roomType is null)
            return BadRequest(new { message = "Thể loại phòng không tồn tại." });

        if (booking.GuestCount > roomType.Capacity)
            return BadRequest(new { message = "Thể loại phòng mới không đủ sức chứa cho số khách đã đặt." });

        booking.Room.RoomNumber = roomNumber;
        booking.Room.Floor = request.Floor;
        booking.Room.RoomTypeId = roomType.Id;
        booking.Room.RoomType = roomType;
        booking.PricePerNight = roomType.PricePerNight;
        booking.Room.Note = request.Note?.Trim();
        booking.Room.ImageUrl = request.ImageUrl ?? booking.Room.ImageUrl;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật thông tin phòng thành công.",
            bookingId = booking.Id,
            roomId = booking.Room.Id,
            roomNumber = booking.Room.RoomNumber,
            floor = booking.Room.Floor,
            roomTypeId = booking.Room.RoomTypeId,
            note = booking.Room.Note,
            imageUrl = booking.Room.ImageUrl
        });
    }

    [Authorize(Roles = "User")]
    [HttpPost("{id:int}/room-image")]
    public async Task<IActionResult> UploadMyBookedRoomImage(
        int id,
        [FromForm] IFormFile image)
    {
        if (CurrentUserId is not int userId)
            return Forbid();

        var booking = await _db.Bookings
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        if (booking is null)
            return NotFound(new { message = "Không tìm thấy lượt đặt phòng của tài khoản này." });

        if (booking.Status != BookingStatus.Booked)
            return BadRequest(new { message = "Chỉ có thể cập nhật ảnh trước khi nhận phòng." });

        if (image is null || image.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn hình ảnh." });

        if (image.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Hình ảnh không được vượt quá 5 MB." });

        var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
        if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(extension))
            return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP." });

        var uploadFolder = Path.Combine(
            Directory.GetCurrentDirectory(), "wwwroot", "uploads", "rooms");
        Directory.CreateDirectory(uploadFolder);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await image.CopyToAsync(stream);
        }

        return Ok(new { imageUrl = $"/uploads/rooms/{fileName}" });
    }

    // =========================================================
    // GET /api/bookings/{id}
    // Chi tiết một lượt thuê
    // =========================================================
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetBooking(int id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Include(b => b.Customer)
            .Include(b => b.Services)
            .Include(b => b.Invoices)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return NotFound();

        if (!User.IsInRole("Admin") && booking.UserId != CurrentUserId)
            return Forbid();

        return Ok(Mapper.ToDto(booking));
    }

    // =========================================================
    // POST /api/bookings
    // Cho thuê phòng
    // =========================================================
    [HttpPost]
    public async Task<IActionResult> CreateBooking(
        [FromBody] RentalRequest req)
    {
        var bookingOwnerId = User.IsInRole("Admin")
            ? (int?)null
            : CurrentUserId;

        if (!User.IsInRole("Admin") && bookingOwnerId is null)
            return Forbid();

        var room = await _db.Rooms
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.Id == req.RoomId);

        if (room is null)
        {
            return BadRequest(new
            {
                message = "Phòng không tồn tại."
            });
        }

        if (room.Status != RoomStatus.Available)
        {
            return BadRequest(new
            {
                message =
                    $"Phòng {room.RoomNumber} hiện không trống ({Mapper.StatusText(room.Status)})."
            });
        }

        if (string.IsNullOrWhiteSpace(req.CustomerName) ||
            string.IsNullOrWhiteSpace(req.CustomerPhone))
        {
            return BadRequest(new
            {
                message = "Tên và số điện thoại khách hàng là bắt buộc."
            });
        }

        if (req.ExpectedCheckOutDate.HasValue &&
            req.ExpectedCheckOutDate.Value.Date < req.CheckInDate.Date)
        {
            return BadRequest(new
            {
                message = "Ngày trả phòng phải sau ngày nhận phòng."
            });
        }

        // -----------------------------------------------------
        // Tìm khách cũ theo ID hoặc số điện thoại
        // Nếu chưa có thì tạo khách mới
        // -----------------------------------------------------
        Customer? customer = null;

        if (req.CustomerId is > 0)
        {
            customer = await _db.Customers
                .FindAsync(req.CustomerId.Value);
        }

        customer ??= await _db.Customers
            .FirstOrDefaultAsync(
                c => c.Phone == req.CustomerPhone.Trim());

        if (customer is null)
        {
            customer = new Customer
            {
                FullName = req.CustomerName.Trim(),
                Phone = req.CustomerPhone.Trim(),
                Email = req.CustomerEmail?.Trim(),
                IdCard = req.CustomerIdCard?.Trim(),
                Address = req.CustomerAddress?.Trim()
            };

            _db.Customers.Add(customer);

            await _db.SaveChangesAsync();
        }

        // -----------------------------------------------------
        // Tạo mã booking
        // -----------------------------------------------------
        var nextCode = await _db.Bookings.CountAsync() + 1001;

        var booking = new Booking
        {
            Code = $"BK{nextCode}",

            RoomId = room.Id,

            CustomerId = customer.Id,

            UserId = bookingOwnerId,

            GuestCount =
                req.GuestCount <= 0
                    ? 1
                    : req.GuestCount,

            CheckInDate =
                req.CheckInDate == default
                    ? DateTime.Today
                    : req.CheckInDate.Date,

            ExpectedCheckOutDate =
                req.ExpectedCheckOutDate?.Date,

            PricePerNight =
                room.RoomType?.PricePerNight ?? 0,

            Status = User.IsInRole("Admin")
                ? BookingStatus.CheckedIn
                : BookingStatus.Booked,

            Note = req.Note?.Trim()
        };

        // Đưa phòng sang trạng thái đang thuê
        room.Status = User.IsInRole("Admin")
            ? RoomStatus.Occupied
            : RoomStatus.Reserved;

        _db.Bookings.Add(booking);

        await _db.SaveChangesAsync();

        // -----------------------------------------------------
        // Load lại booking đầy đủ thông tin
        // -----------------------------------------------------
        booking = await _db.Bookings
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Include(b => b.Customer)
            .Include(b => b.Services)
            .Include(b => b.Invoices)
            .FirstAsync(b => b.Id == booking.Id);

        return Created(
            $"/api/bookings/{booking.Id}",
            Mapper.ToDto(booking)
        );
    }

    // =========================================================
    // POST /api/bookings/{id}/services
    // Thêm dịch vụ phát sinh
    // =========================================================
    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/services")]
    public async Task<IActionResult> AddService(
        int id,
        [FromBody] AddServiceRequest req)
    {
        var booking = await _db.Bookings
            .Include(b => b.Services)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return NotFound();

        if (booking.Status != BookingStatus.CheckedIn)
        {
            return BadRequest(new
            {
                message =
                    "Chỉ thêm dịch vụ cho lượt thuê đang hoạt động."
            });
        }

        if (string.IsNullOrWhiteSpace(req.Name) ||
            req.Price < 0 ||
            req.Quantity <= 0)
        {
            return BadRequest(new
            {
                message = "Thông tin dịch vụ không hợp lệ."
            });
        }

        booking.Services.Add(new BookingService
        {
            Name = req.Name.Trim(),
            Price = req.Price,
            Quantity = req.Quantity,
            UsedAt = DateTime.Now
        });

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã thêm dịch vụ."
        });
    }

    // =========================================================
    // DELETE /api/bookings/services/{serviceId}
    // Xóa dịch vụ phát sinh
    // =========================================================
    [Authorize(Roles = "Admin")]
    [HttpDelete("services/{serviceId:int}")]
    public async Task<IActionResult> DeleteService(int serviceId)
    {
        var service = await _db.BookingServices
            .FindAsync(serviceId);

        if (service is null)
            return NotFound();

        _db.BookingServices.Remove(service);

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã xoá dịch vụ."
        });
    }

    // =========================================================
    // POST /api/bookings/{id}/checkout
    // Trả phòng + lập hóa đơn
    // =========================================================
    [Authorize(Roles = "Admin")]
    [HttpPost("{id:int}/checkout")]
    public async Task<IActionResult> Checkout(
        int id,
        [FromBody] CheckoutRequest req)
    {
        var booking = await _db.Bookings
            .Include(b => b.Room)
            .Include(b => b.Services)
            .Include(b => b.Invoices)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return NotFound();

        if (booking.Status != BookingStatus.CheckedIn)
        {
            return BadRequest(new
            {
                message =
                    "Lượt thuê này không ở trạng thái đang ở."
            });
        }

        // -----------------------------------------------------
        // Cập nhật trạng thái lượt thuê
        // -----------------------------------------------------
        booking.ActualCheckOutDate = DateTime.Today;

        booking.Status = BookingStatus.CheckedOut;

        // Đưa phòng về trạng thái trống
        if (booking.Room is not null)
        {
            booking.Room.Status = RoomStatus.Available;
        }

        // -----------------------------------------------------
        // Tính tiền
        // -----------------------------------------------------
        var roomAmount = booking.SubTotal;

        var serviceAmount = booking.ServiceTotal;

        var discount =
            req.Discount < 0
                ? 0
                : req.Discount;

        var total =
            roomAmount +
            serviceAmount -
            discount;

        if (total < 0)
            total = 0;

        // -----------------------------------------------------
        // Tạo hóa đơn
        // -----------------------------------------------------
        var nextInvoice =
            await _db.Invoices.CountAsync() + 1;

        var invoice = new Invoice
        {
            Code = $"HD{nextInvoice:0000}",

            BookingId = booking.Id,

            RoomAmount = roomAmount,

            ServiceAmount = serviceAmount,

            Discount = discount,

            TotalAmount = total,

            CreatedAt = DateTime.Now,

            CreatedBy = User.Identity?.Name ?? "system"
        };

        _db.Invoices.Add(invoice);

        await _db.SaveChangesAsync();

        // -----------------------------------------------------
        // Load lại booking đầy đủ
        // -----------------------------------------------------
        var full = await _db.Bookings
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Include(b => b.Customer)
            .Include(b => b.Services)
            .Include(b => b.Invoices)
            .FirstAsync(b => b.Id == booking.Id);

        return Ok(Mapper.ToDto(full));
    }

    // =========================================================
    // DELETE /api/bookings/{id}
    // Hủy lượt thuê
    // =========================================================
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> CancelBooking(int id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Room)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return NotFound();

        if (booking.Status == BookingStatus.CheckedOut)
        {
            return BadRequest(new
            {
                message =
                    "Không thể xoá lượt thuê đã trả phòng (đã có hoá đơn)."
            });
        }

        if (booking.Room is not null &&
            booking.Status == BookingStatus.CheckedIn)
        {
            booking.Room.Status = RoomStatus.Available;
        }

        booking.Status = BookingStatus.Cancelled;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã huỷ lượt thuê."
        });
    }
}
