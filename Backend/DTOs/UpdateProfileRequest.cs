using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public sealed record UpdateProfileRequest
{
    [Required, StringLength(100)]
    public required string FullName { get; init; }

    [Required]
    public DateOnly? DateOfBirth { get; init; }

    [Required, StringLength(20)]
    public required string Phone { get; init; }
}