using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public class UpdateBookedRoomRequest
{
    [Required]
    [MaxLength(30)]
    public string RoomNumber { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Floor { get; set; }

    [Range(1, int.MaxValue)]
    public int RoomTypeId { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }

    public string? ImageUrl { get; set; }
}