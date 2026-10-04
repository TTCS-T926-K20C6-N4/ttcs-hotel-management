using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

/// <summary>Thông tin có thể chỉnh sửa của một phòng khách sạn.</summary>
public sealed record UpdateRoomRequest
{
    [Required, StringLength(50)]
    public required string RoomNumber { get; init; }

    [Range(1, int.MaxValue)]
    public int Floor { get; init; }

    [Range(1, int.MaxValue)]
    public int RoomTypeId { get; init; }

    [MaxLength(2000)]
    public string? Note { get; init; }

    [MaxLength(500)]
    public string? ImageUrl { get; init; }
}
