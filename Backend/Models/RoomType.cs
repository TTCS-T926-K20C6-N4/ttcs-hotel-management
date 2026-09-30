namespace Backend.Models;

public class RoomType
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    public decimal PricePerNight { get; set; }

    public int Capacity { get; set; } = 2;

    public string? Description { get; set; }

    public List<Room> Rooms { get; set; } = new();
}