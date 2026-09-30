using Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260930120000_AddRoomTypes")]
public partial class AddRoomTypes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "RoomTypes",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                PricePerNight = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: false),
                Capacity = table.Column<int>(type: "int", nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RoomTypes", roomType => roomType.Id);
                table.CheckConstraint(
                    "CK_RoomTypes_PricePerNight_Positive",
                    "[PricePerNight] > 0");
                table.CheckConstraint(
                    "CK_RoomTypes_Capacity_Positive",
                    "[Capacity] >= 1");
            });

        migrationBuilder.CreateIndex(
            name: "IX_RoomTypes_Name",
            table: "RoomTypes",
            column: "Name",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "RoomTypes");
    }
}