
using Backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/statistics")]
public class IncomeStatisticsController : ControllerBase
{
    private readonly AppDbContext _db;

    public IncomeStatisticsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("income")]
    public async Task<IActionResult> GetIncome()
    {
        int year = DateTime.Now.Year;

        var startDate = new DateTime(year, 1, 1);
        var endDate = startDate.AddYears(1);

        var invoices = await _db.Invoices
            .AsNoTracking()
            .Where(i => i.CreatedAt >= startDate
                     && i.CreatedAt < endDate)
            .Select(i => new
            {
                i.CreatedAt,
                i.TotalAmount
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
            year,
            months,
            totalAmount = months.Sum(m => m.totalAmount)
        });
    }
}
