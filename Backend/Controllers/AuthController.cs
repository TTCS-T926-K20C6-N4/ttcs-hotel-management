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
        // Kiểm tra dữ liệu
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Vui lòng nhập đầy đủ Email và mật khẩu."
            });
        }

        // Chuẩn hóa email
        var email = request.Email.Trim().ToLower();

        // Tìm tài khoản
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

        // Kiểm tra tài khoản còn hoạt động
        if (!user.IsActive)
        {
            return StatusCode(403, new
            {
                message = "Tài khoản đã bị vô hiệu hóa."
            });
        }

        // ==========================================
        // KIỂM TRA MẬT KHẨU
        // ==========================================
        var passwordCorrect =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

        if (!passwordCorrect)
        {
            // Không đếm số lần sai
            // Không khóa tài khoản
            return Unauthorized(new
            {
                message = "Email hoặc mật khẩu không chính xác."
            });
        }

        // ==========================================
        // ĐĂNG NHẬP ĐÚNG -> TẠO SESSION
        // ==========================================

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

        // ==========================================
        // TẠO JWT
        // ==========================================
        var token = _tokenService.CreateToken(user);

        // ==========================================
        // TRẢ KẾT QUẢ
        // ==========================================
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
    public IActionResult GetCurrentUser()
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

        var email =
            HttpContext.Session.GetString("UserEmail");

        var fullName =
            HttpContext.Session.GetString("UserName");

        var role =
            HttpContext.Session.GetString("UserRole");

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
        HttpContext.Session.Clear();

        return Ok(new
        {
            message = "Đăng xuất thành công."
        });
    }
}