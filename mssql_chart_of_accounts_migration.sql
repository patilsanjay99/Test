-- ====================================================================
-- AUTO SCRIPT FOR CREATE AND MIGRATE TABLES & COLUMNS FOR CHART OF ACCOUNTS (Accounts Table)
-- Database compatibility: SQL Server / Azure SQL DB / Local MSSQL
-- Run this script in SQL Server Management Studio (SSMS) on your local SQL Server Database (e.g. SANJAY).
-- ====================================================================

PRINT 'Starting migration to add Chart of Accounts (Accounts table) ...';

-- 1. Create table dbo.Accounts if it does not exist already
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.Accounts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CompanyId INT NULL,
        AccountCode NVARCHAR(50) NULL,
        Name NVARCHAR(255) NOT NULL,
        AccountGroup NVARCHAR(150) NULL,
        AccountType NVARCHAR(50) NULL,
        OpeningBalance DECIMAL(18,2) DEFAULT 0,
        BalanceType NVARCHAR(10) DEFAULT 'Dr',
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Table [dbo].[Accounts] created successfully.';
END
ELSE
BEGIN
    -- Add columns sequentially if the table existed but lacks some columns
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'CompanyId')
    BEGIN
        ALTER TABLE dbo.Accounts ADD CompanyId INT NULL;
        PRINT 'Added column [CompanyId] to dbo.Accounts';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'AccountCode')
    BEGIN
        ALTER TABLE dbo.Accounts ADD AccountCode NVARCHAR(50) NULL;
        PRINT 'Added column [AccountCode] to dbo.Accounts';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'Name')
    BEGIN
        ALTER TABLE dbo.Accounts ADD Name NVARCHAR(255) NOT NULL DEFAULT '';
        PRINT 'Added column [Name] to dbo.Accounts';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'AccountGroup')
    BEGIN
        ALTER TABLE dbo.Accounts ADD AccountGroup NVARCHAR(150) NULL;
        PRINT 'Added column [AccountGroup] to dbo.Accounts';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'AccountType')
    BEGIN
        ALTER TABLE dbo.Accounts ADD AccountType NVARCHAR(50) NULL;
        PRINT 'Added column [AccountType] to dbo.Accounts';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'OpeningBalance')
    BEGIN
        ALTER TABLE dbo.Accounts ADD OpeningBalance DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [OpeningBalance] to dbo.Accounts';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'BalanceType')
    BEGIN
        ALTER TABLE dbo.Accounts ADD BalanceType NVARCHAR(10) DEFAULT 'Dr';
        PRINT 'Added column [BalanceType] to dbo.Accounts';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'Place')
    BEGIN
        ALTER TABLE dbo.Accounts ADD Place NVARCHAR(255) NULL;
        PRINT 'Added column [Place] to dbo.Accounts';
    END;

    PRINT '✅ Table [dbo].[Accounts] is up to date.';
END;

-- Seed some standard ledger accounts if table is empty
IF (SELECT COUNT(*) FROM dbo.Accounts) = 0
BEGIN
    INSERT INTO dbo.Accounts (CompanyId, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType)
    VALUES 
    (1, '1001', 'Cash in Hand', 'Current Assets', 'Asset', 10000.00, 'Dr'),
    (1, '1002', 'State Bank of India', 'Bank Accounts', 'Asset', 500000.00, 'Dr'),
    (1, '3001', 'Share Capital', 'Capital Account', 'Equity', 510000.00, 'Cr'),
    (1, '4001', 'Fertilizer Sales', 'Direct Incomes', 'Revenue', 0.00, 'Cr'),
    (1, '5001', 'Seed Purchase Account', 'Direct Expenses', 'Expense', 0.00, 'Dr');
    PRINT '✅ Standard ledger accounts seeded successfully.';
END;

PRINT 'Migration process completed.';
GO
