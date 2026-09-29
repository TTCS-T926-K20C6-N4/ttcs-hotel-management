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
    // POST: /api/auth/login
    // ĐĂNG NHẬP
    // ==========================================
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        // ======================================
        // KIỂM TRA DỮ LIỆU
        // ======================================

        if (request == null ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng nhập đầy đủ Email và mật khẩu."
            });
        }

        // ======================================
        // CHUẨN HÓA EMAIL
        // ======================================

        var email =
            request.Email.Trim().ToLower();

        // ======================================
        // TÌM USER
        // ======================================

        var user = await _context.Users
            .FirstOrDefaultAsync(
                u => u.Email.ToLower() == email
            );

        // Không tìm thấy tài khoản
        if (user == null)
        {
            return Unauthorized(new
            {
                message =
                    "Email hoặc mật khẩu không chính xác."
            });
        }

        // ======================================
        // KIỂM TRA TÀI KHOẢN HOẠT ĐỘNG
        // ======================================

        if (!user.IsActive)
        {
            return StatusCode(403, new
            {
                message =
                    "Tài khoản đã bị vô hiệu hóa."
            });
        }

        // ======================================
        // KIỂM TRA TÀI KHOẢN ĐANG BỊ KHÓA
        // ======================================

        if (user.LockoutEnd.HasValue &&
            user.LockoutEnd.Value > DateTime.UtcNow)
        {
            var remaining =
                user.LockoutEnd.Value -
                DateTime.UtcNow;

            return StatusCode(423, new
            {
                message =
                    "Tài khoản đang bị khóa. " +
                    "Vui lòng thử lại sau.",

                remainingMinutes =
                    Math.Ceiling(
                        remaining.TotalMinutes
                    )
            });
        }

        // ======================================
        // NẾU THỜI GIAN KHÓA ĐÃ HẾT
        // ======================================

        if (user.LockoutEnd.HasValue &&
            user.LockoutEnd.Value <= DateTime.UtcNow)
        {
            user.LockoutEnd = null;

            user.FailedLoginAttempts = 0;

            await _context.SaveChangesAsync();
        }

        // ======================================
        // KIỂM TRA PASSWORD BẰNG BCRYPT
        // ======================================

        var passwordCorrect =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

        // ======================================
        // PASSWORD SAI
        // ======================================

        if (!passwordCorrect)
        {
            user.FailedLoginAttempts++;

            // Sai đủ 5 lần
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockoutEnd =
                    DateTime.UtcNow.AddMinutes(15);

                user.FailedLoginAttempts = 0;

                await _context.SaveChangesAsync();

                return StatusCode(423, new
                {
                    message =
                        "Bạn đã nhập sai mật khẩu 5 lần. " +
                        "Tài khoản bị khóa trong 15 phút."
                });
            }

            await _context.SaveChangesAsync();

            return Unauthorized(new
            {
                message =
                    "Email hoặc mật khẩu không chính xác.",

                remainingAttempts =
                    5 - user.FailedLoginAttempts
            });
        }

        // ======================================
        // PASSWORD ĐÚNG
        // ======================================

        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        await _context.SaveChangesAsync();

        // ======================================
        // TẠO SESSION
        // ======================================

        // Lưu trạng thái đăng nhập
        HttpContext.Session.SetString(
            "IsLoggedIn",
            "true"
        );

        // Lưu ID người đăng nhập
        HttpContext.Session.SetInt32(
            "UserId",
            user.Id
        );

        // Lưu Email
        HttpContext.Session.SetString(
            "UserEmail",
            user.Email
        );

        // Lưu họ tên
        HttpContext.Session.SetString(
            "UserName",
            user.FullName ?? ""
        );

        // Lưu quyền
        HttpContext.Session.SetString(
            "UserRole",
            user.Role ?? ""
        );

        // ======================================
        // TẠO JWT
        // ======================================

        var token =
            _tokenService.CreateToken(user);

        // ======================================
        // ĐĂNG NHẬP THÀNH CÔNG
        // ======================================

        return Ok(new
        {
            message =
                "Đăng nhập thành công.",

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
    // KIỂM TRA NGƯỜI DÙNG ĐÃ LOGIN CHƯA
    // ==========================================
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var isLoggedIn =
            HttpContext.Session.GetString(
                "IsLoggedIn"
            );

        // Chưa đăng nhập hoặc Session hết hạn
        if (isLoggedIn != "true")
        {
            return Unauthorized(new
            {
                isLoggedIn = false,

                message =
                    "Bạn chưa đăng nhập."
            });
        }

        // ======================================
        // LẤY THÔNG TIN TỪ SESSION
        // ======================================

        var userId =
            HttpContext.Session.GetInt32(
                "UserId"
            );

        var email =
            HttpContext.Session.GetString(
                "UserEmail"
            );

        var fullName =
            HttpContext.Session.GetString(
                "UserName"
            );

        var role =
            HttpContext.Session.GetString(
                "UserRole"
            );

        return Ok(new
        {
            isLoggedIn = true,

            user = new
            {
                id = userId,
                email,
                fullName,
                role
            }
        });
    }

    // ==========================================
    // POST: /api/auth/logout
    // ĐĂNG XUẤT
    // ==========================================
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Xóa toàn bộ Session
        HttpContext.Session.Clear();

        return Ok(new
        {
            message =
                "Đăng xuất thành công."
        });
    }
}