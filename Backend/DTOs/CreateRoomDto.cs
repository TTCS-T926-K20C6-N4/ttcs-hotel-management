using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Backend.DTOs;

public class CreateRoomDto
{
    [Required]
    [MaxLength(20)]
    public string RoomNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string RoomType { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(1, 20)]
    public int Capacity { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    // File ảnh người dùng chọn từ máy
    public IFormFile? Image { get; set; }

    [Required]
    public string Status { get; set; } = "Available";
}