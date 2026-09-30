using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateRoomTypeRequest
{
    [Required(ErrorMessage = "Tên loại phòng là bắt buộc.")]
    [StringLength(80, ErrorMessage = "Tên loại phòng không được vượt quá 80 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "999999999999.99", ErrorMessage = "Giá mỗi đêm phải lớn hơn 0.")]
    public decimal PricePerNight { get; set; }

    [Range(1, 100, ErrorMessage = "Số người tối đa phải từ 1 đến 100.")]
    public int Capacity { get; set; }

    [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự.")]
    public string? Description { get; set; }
}