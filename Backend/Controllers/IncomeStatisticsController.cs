
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/statistics")]
[Authorize(Roles = "Admin")]
public class IncomeStatisticsController : ControllerBase
{
    private const int FirstSupportedYear = 2022;
    private const int LastSupportedYear = 2026;

    private readonly AppDbContext _db;

    public IncomeStatisticsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("income")]
    public async Task<IActionResult> GetIncome([FromQuery] int? year)
    {
        var currentYear = LastSupportedYear;
        var selectedYear = year ?? currentYear;

        if (selectedYear < FirstSupportedYear || selectedYear > currentYear)
        {
            return BadRequest(new { message = "Năm thống kê không hợp lệ." });
        }

        var years = Enumerable.Range(
                FirstSupportedYear,
                LastSupportedYear - FirstSupportedYear + 1)
            .OrderByDescending(value => value)
            .ToList();

        var startDate = new DateTime(selectedYear, 1, 1);
        var endDate = startDate.AddYears(1);

        var invoices = await _db.Invoices
            .AsNoTracking()
            .Where(i => i.CreatedAt >= startDate
                     && i.CreatedAt < endDate)
            .Select(i => new
{
    i.Id,
    i.Code,
    i.CreatedAt,
    i.TotalAmount,

    RoomNumber = i.Booking != null && i.Booking.Room != null
        ? i.Booking.Room.RoomNumber
        : "",

    CustomerName = i.Booking != null && i.Booking.Customer != null
        ? i.Booking.Customer.FullName
        : "",

    CustomerPhone = i.Booking != null && i.Booking.Customer != null
        ? i.Booking.Customer.Phone
        : "",

    CheckInDate = i.Booking != null
        ? (DateTime?)i.Booking.CheckInDate
        : null,

    CheckOutDate = i.Booking != null
        ? i.Booking.ActualCheckOutDate
        : null
})
            .ToListAsync();

        var months = Enumerable.Range(1, 12)
            .Select(month => new
            {
                month,
                totalAmount = invoices
                    .Where(i => i.CreatedAt.Month == month)
                    .Sum(i => i.TotalAmount)
            })
            .ToList();

               return Ok(new
        {
            year = selectedYear,
            years,
            months,
            totalAmount = months.Sum(m => m.totalAmount),
            invoiceDetails = invoices
                .OrderByDescending(i => i.CreatedAt)
                .ToList()
        });
    }
}
