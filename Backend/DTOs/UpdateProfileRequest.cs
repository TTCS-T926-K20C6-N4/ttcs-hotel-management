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
    [Phone]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }
}
