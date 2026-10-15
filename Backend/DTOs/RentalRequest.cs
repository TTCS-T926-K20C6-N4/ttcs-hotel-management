using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public class RentalRequest
{
    public int RoomId { get; set; }

    public int? CustomerId { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^0[35789][0-9]{8}$", ErrorMessage = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.")]
    [MaxLength(10)]
    public string CustomerPhone { get; set; } = string.Empty;

    public string? CustomerEmail { get; set; }

    [RegularExpression(@"^(?:[0-9]{9}|[0-9]{12})$", ErrorMessage = "CMND phải gồm 9 chữ số hoặc CCCD phải gồm 12 chữ số.")]
    public string? CustomerIdCard { get; set; }

    public string? CustomerAddress { get; set; }

    public int GuestCount { get; set; } = 1;

    public DateTime CheckInDate { get; set; }

    public DateTime? ExpectedCheckOutDate { get; set; }

    public string? Note { get; set; }
}
