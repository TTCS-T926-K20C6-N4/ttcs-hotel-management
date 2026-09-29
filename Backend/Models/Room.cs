using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Room
{
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string RoomNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string RoomType { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Range(1, 20)]
    public int Capacity { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    [Required]
    public string Status { get; set; } = "Available";
}