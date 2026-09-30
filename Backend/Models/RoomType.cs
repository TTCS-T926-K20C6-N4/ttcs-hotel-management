using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class RoomType
{
    public int Id { get; set; }

    [Required]
    [StringLength(80)]
    public string Name { get; set; } = "";

    [Range(typeof(decimal), "0.01", "999999999999.99")]
    public decimal PricePerNight { get; set; }

    [Range(1, 100)]
    public int Capacity { get; set; } = 2;

    [StringLength(500)]
    public string? Description { get; set; }

    public List<Room> Rooms { get; set; } = new();
}