using Backend.Data;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;

    public AuthController(
        AppDbContext context,
        TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    // ==========================================
    // POST: /api/auth/register
    // ĐĂNG KÝ TÀI KHOẢN
    // ==========================================
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            return BadRequest(new
            {
                message = "Vui lòng nhập đầy đủ thông tin."
            });
        }

        if (request.Password != request.ConfirmPassword)
        {
            return BadRequest(new
            {
                message = "Mật khẩu xác nhận không khớp."
            });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new
            {
                message = "Mật khẩu phải có ít nhất 6 ký tự."
            });
        }

        var email = request.Email.Trim().ToLower();

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "Email này đã được đăng ký."
            });
        }

        var passwordHash =
            BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new Backend.Models.User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = passwordHash,
            Role = "User",
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Đăng ký tài khoản thành công.",
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role
            }
        });
    }

    // ==========================================
    // POST: /api/auth/login
    // ĐĂNG NHẬP
    // ==========================================
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Vui lòng nhập đầy đủ Email và mật khẩu."
            });
        }

        var email = request.Email.Trim().ToLower();

        var user = await _context.Users
            .FirstOrDefaultAsync(
                u => u.Email.ToLower() == email
            );

        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Email hoặc mật khẩu không chính xác."
            });
        }

        if (!user.IsActive)
        {
            return StatusCode(403, new
            {
                message = "Tài khoản đã bị vô hiệu hóa."
            });
        }

        var passwordCorrect =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

        if (!passwordCorrect)
        {
            return Unauthorized(new
            {
                message = "Email hoặc mật khẩu không chính xác."
            });
        }

        // Tạo Session
        HttpContext.Session.SetString(
            "IsLoggedIn",
            "true"
        );

        HttpContext.Session.SetInt32(
            "UserId",
            user.Id
        );

        HttpContext.Session.SetString(
            "UserEmail",
            user.Email
        );

        HttpContext.Session.SetString(
            "UserName",
            user.FullName ?? ""
        );

        HttpContext.Session.SetString(
            "UserRole",
            user.Role ?? ""
        );

        // Tạo JWT
        var token = _tokenService.CreateToken(user);

        return Ok(new
        {
            message = "Đăng nhập thành công.",

            token,

            user = new
            {
                user.Id,
                user.Email,
                user.FullName,
                user.Role
            }
        });
    }

    // ==========================================
    // GET: /api/auth/me
    // KIỂM TRA SESSION
    // ==========================================
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var isLoggedIn =
            HttpContext.Session.GetString("IsLoggedIn");

        if (isLoggedIn != "true")
        {
            return Unauthorized(new
            {
                isLoggedIn = false,
                message = "Bạn chưa đăng nhập."
            });
        }

        var userId =
            HttpContext.Session.GetInt32("UserId");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy tài khoản."
            });
        }

        return Ok(new
        {
            isLoggedIn = true,

            user = new
            {
                id = user.Id,
                email = user.Email,
                fullName = user.FullName,
                dateOfBirth = user.DateOfBirth,
                phoneNumber = user.PhoneNumber,
                avatarUrl = user.AvatarUrl,
                role = user.Role
            }
        });
    }

    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var isLoggedIn = HttpContext.Session.GetString("IsLoggedIn");
        var userId = HttpContext.Session.GetInt32("UserId");

        if (isLoggedIn != "true" || userId == null)
        {
            return Unauthorized(new { message = "Bạn chưa đăng nhập." });
        }

        if (request == null ||
            string.IsNullOrWhiteSpace(request.FullName) ||
            request.DateOfBirth == default ||
            string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin bắt buộc." });
        }

        if (request.DateOfBirth > DateTime.UtcNow)
        {
            return BadRequest(new { message = "Ngày sinh không được lớn hơn ngày hiện tại." });
        }

        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy tài khoản." });
        }

        user.FullName = request.FullName.Trim();
        user.DateOfBirth = request.DateOfBirth;
        user.PhoneNumber = request.PhoneNumber.Trim();
        user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
        await _context.SaveChangesAsync();

        HttpContext.Session.SetString("UserName", user.FullName);
        HttpContext.Session.SetString("UserPhoneNumber", user.PhoneNumber);
        HttpContext.Session.SetString("UserAvatarUrl", user.AvatarUrl ?? "");

        return Ok(new
        {
            message = "Thông tin cá nhân đã được cập nhật thành công.",
            user = new
            {
                user.Id,
                user.Email,
                user.FullName,
                user.DateOfBirth,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Role
            }
        });
    }

    [HttpPost("profile/avatar")]
    public async Task<IActionResult> UploadProfileAvatar([FromForm] IFormFile avatar)
    {
        if (avatar == null || avatar.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn hình ảnh." });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(avatar.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension) || avatar.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP, tối đa 5 MB." });
        }

        var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "profiles");
        Directory.CreateDirectory(uploadFolder);
        var fileName = $"{Guid.NewGuid():N}{extension}";
        await using var stream = new FileStream(Path.Combine(uploadFolder, fileName), FileMode.Create);
        await avatar.CopyToAsync(stream);

        return Ok(new { avatarUrl = $"/uploads/profiles/{fileName}" });
    }

    // ==========================================
    // POST: /api/auth/change-password
    // ĐỔI MẬT KHẨU
    // ==========================================
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request)
    {
        // Kiểm tra người dùng đã đăng nhập chưa
        var isLoggedIn =
            HttpContext.Session.GetString("IsLoggedIn");

        var userId =
            HttpContext.Session.GetInt32("UserId");

        if (isLoggedIn != "true" || userId == null)
        {
            return Unauthorized(new
            {
                message = "Bạn chưa đăng nhập."
            });
        }

        // Kiểm tra dữ liệu
        if (request == null ||
            string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            return BadRequest(new
            {
                message = "Vui lòng nhập đầy đủ thông tin."
            });
        }

        // Mật khẩu mới tối thiểu 6 ký tự
        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new
            {
                message = "Mật khẩu mới phải có ít nhất 6 ký tự."
            });
        }

        // Kiểm tra xác nhận mật khẩu
        if (request.NewPassword != request.ConfirmPassword)
        {
            return BadRequest(new
            {
                message = "Xác nhận mật khẩu mới không khớp."
            });
        }

        // Tìm tài khoản đang đăng nhập
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy tài khoản."
            });
        }

        // Kiểm tra mật khẩu hiện tại
        var currentPasswordCorrect =
            BCrypt.Net.BCrypt.Verify(
                request.CurrentPassword,
                user.PasswordHash
            );

        if (!currentPasswordCorrect)
        {
            return BadRequest(new
            {
                message = "Mật khẩu hiện tại không chính xác."
            });
        }

        // Không cho dùng lại mật khẩu hiện tại
        var sameAsCurrentPassword =
            BCrypt.Net.BCrypt.Verify(
                request.NewPassword,
                user.PasswordHash
            );

        if (sameAsCurrentPassword)
        {
            return BadRequest(new
            {
                message = "Mật khẩu mới phải khác mật khẩu hiện tại."
            });
        }

        // Hash mật khẩu mới
        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword
            );

        // Lưu xuống database
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Đổi mật khẩu thành công."
        });
    }

    // ==========================================
    // POST: /api/auth/logout
    // ĐĂNG XUẤT
    // ==========================================
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();

        return Ok(new
        {
            message = "Đăng xuất thành công."
        });
    }
[HttpPost("forgot-password")]
public async Task<IActionResult> ForgotPassword(
    [FromBody] ForgotPasswordRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Email))
    {
        return BadRequest(new
        {
            message = "Vui lòng nhập email."
        });
    }

    var email = request.Email.Trim();

    var user = await _context.Users
        .FirstOrDefaultAsync(
            u => u.Email == email
        );

    if (user == null)
    {
        return NotFound(new
        {
            message = "Email chưa được đăng ký."
        });
    }

    return Ok(new
    {
        message = "Email hợp lệ."
    });
}
[HttpPost("reset-password")]
public async Task<IActionResult> ResetPassword(
    [FromBody] ResetPasswordRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Email))
    {
        return BadRequest(new
        {
            message = "Email không hợp lệ."
        });
    }

    if (string.IsNullOrWhiteSpace(request.NewPassword))
    {
        return BadRequest(new
        {
            message = "Vui lòng nhập mật khẩu mới."
        });
    }

    if (request.NewPassword.Length < 6)
    {
        return BadRequest(new
        {
            message = "Mật khẩu phải có ít nhất 6 ký tự."
        });
    }

    var email = request.Email.Trim();

    var user = await _context.Users
        .FirstOrDefaultAsync(
            u => u.Email == email
        );

    if (user == null)
    {
        return NotFound(new
        {
            message = "Không tìm thấy tài khoản."
        });
    }

    user.PasswordHash =
        BCrypt.Net.BCrypt.HashPassword(
            request.NewPassword
        );

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Đổi mật khẩu thành công."
    });
}
}