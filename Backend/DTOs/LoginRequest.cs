using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class LoginRequest
{
    [Required(ErrorMessage = "Vui lòng nhập Email")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập Password")]
    public string Password { get; set; } = string.Empty;
}