namespace Backend.Dtos;

public class RentalRequest
{
    public int RoomId { get; set; }

    public int? CustomerId { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public string? CustomerEmail { get; set; }

    public string? CustomerIdCard { get; set; }

    public string? CustomerAddress { get; set; }

    public int GuestCount { get; set; } = 1;

    public DateTime CheckInDate { get; set; }

    public DateTime? ExpectedCheckOutDate { get; set; }

    public string? Note { get; set; }
}
