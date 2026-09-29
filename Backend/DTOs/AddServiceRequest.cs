namespace Backend.Dtos;

public class AddServiceRequest
{
    public string Name { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int Quantity { get; set; } = 1;
}
