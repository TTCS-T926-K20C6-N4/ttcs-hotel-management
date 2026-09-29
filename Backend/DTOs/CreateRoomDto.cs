using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateRoomDto
{
    [Required]
    public string RoomNumber { get; set; } = string.Empty;

    [Required]
    public string RoomType { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(1, 20)]
    public int Capacity { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }
}