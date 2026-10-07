using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH(N'[Users]', N'AvatarUrl') IS NULL
                BEGIN
                    ALTER TABLE [Users] ADD [AvatarUrl] nvarchar(500) NULL;
                END;

                IF COL_LENGTH(N'[Users]', N'DateOfBirth') IS NULL
                BEGIN
                    ALTER TABLE [Users] ADD [DateOfBirth] datetime2 NULL;
                END;

                IF COL_LENGTH(N'[Users]', N'PhoneNumber') IS NULL
                BEGIN
                    ALTER TABLE [Users] ADD [PhoneNumber] nvarchar(30) NULL;
                END;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH(N'[Users]', N'AvatarUrl') IS NOT NULL
                BEGIN
                    ALTER TABLE [Users] DROP COLUMN [AvatarUrl];
                END;

                IF COL_LENGTH(N'[Users]', N'DateOfBirth') IS NOT NULL
                BEGIN
                    ALTER TABLE [Users] DROP COLUMN [DateOfBirth];
                END;

                IF COL_LENGTH(N'[Users]', N'PhoneNumber') IS NOT NULL
                BEGIN
                    ALTER TABLE [Users] DROP COLUMN [PhoneNumber];
                END;");
        }
    }
}
