using Backend.Models;

namespace Backend.Services;

public static class Mapper
{
    public static object ToDto(Booking b)
    {
        return new
        {
            id = b.Id,
            code = b.Code,

            roomId = b.RoomId,
            roomNumber = b.Room?.RoomNumber ?? "",
            roomTypeId = b.Room?.RoomTypeId,
            roomTypeName = b.Room?.RoomType?.Name ?? "",

            customerId = b.CustomerId,
            customerName = b.Customer?.FullName ?? "",
            customerPhone = b.Customer?.Phone ?? "",
            customerEmail = b.Customer?.Email,
            customerIdCard = b.Customer?.IdCard,
            customerAddress = b.Customer?.Address,

            guestCount = b.GuestCount,

            checkInDate = b.CheckInDate,
            expectedCheckOutDate = b.ExpectedCheckOutDate,
            actualCheckOutDate = b.ActualCheckOutDate,

            pricePerNight = b.PricePerNight,

            nights = b.Nights,

            status = b.Status.ToString(),
            statusText = StatusText(b.Status),

            note = b.Note,

            roomAmount = b.Status == BookingStatus.CheckedIn
                ? b.AccruedRoomAmount
                : b.SubTotal,

            serviceAmount = b.ServiceTotal,

            services = b.Services.Select(s => new
            {
                id = s.Id,
                bookingId = s.BookingId,
                name = s.Name,
                price = s.Price,
                quantity = s.Quantity,
                usedAt = s.UsedAt
            }),

            invoices = b.Invoices.Select(i => new
            {
                id = i.Id,
                code = i.Code,
                bookingId = i.BookingId,
                roomAmount = i.RoomAmount,
                serviceAmount = i.ServiceAmount,
                discount = i.Discount,
                totalAmount = i.TotalAmount,
                createdAt = i.CreatedAt,
                createdBy = i.CreatedBy
            })
        };
    }

    public static string StatusText(RoomStatus status)
    {
        return status switch
        {
            RoomStatus.Available => "Trống",
            RoomStatus.Occupied => "Đang thuê",
            RoomStatus.Maintenance => "Bảo trì",
            RoomStatus.Reserved => "Đã đặt",
            _ => status.ToString()
        };
    }

    public static string StatusText(BookingStatus status)
    {
        return status switch
        {
            BookingStatus.Booked => "Đã đặt",
            BookingStatus.CheckedIn => "Đang ở",
            BookingStatus.CheckedOut => "Đã trả phòng",
            BookingStatus.Cancelled => "Đã hủy",
            _ => status.ToString()
        };
    }
}
