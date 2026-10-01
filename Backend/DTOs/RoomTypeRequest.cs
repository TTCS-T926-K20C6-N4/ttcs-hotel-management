using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class RoomTypeRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên thể loại phòng.")]
    [StringLength(100, ErrorMessage = "Tên thể loại phòng không vượt quá 100 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [Range(0, 1000000000, ErrorMessage = "Giá phòng mỗi đêm phải lớn hơn hoặc bằng 0.")]
    public decimal PricePerNight { get; set; }

    [Range(1, 50, ErrorMessage = "Sức chứa phòng phải từ 1 đến 50 người.")]
    public int Capacity { get; set; } = 2;

    [StringLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự.")]
    public string? Description { get; set; }
}
