using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class UpdateProfileRequest
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public DateTime DateOfBirth { get; set; }

    [Required]
    [RegularExpression(@"^0[35789][0-9]{8}$", ErrorMessage = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.")]
    [MaxLength(10)]
    public string PhoneNumber { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }
}
