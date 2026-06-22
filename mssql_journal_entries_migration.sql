-- ====================================================================
-- AUTO SCRIPT FOR NEWLY ADDED TABLES & COLUMNS FOR JOURNAL ENTRIES
-- Database compatibility: SQL Server / Azure SQL DB / Local MSSQL
-- Run this script in SQL Server Management Studio (SSMS) on SANJAY database
-- ====================================================================

PRINT 'Starting migration to add JournalEntries and JournalLines...';

-- 1. Create table dbo.JournalEntries if it does not exist already
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.JournalEntries (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CompanyId INT NULL,
        EntryNumber NVARCHAR(50) NULL,
        Reference NVARCHAR(255) NULL,
        Narration NVARCHAR(MAX) NULL,
        TotalAmount DECIMAL(18,2) DEFAULT 0,
        Status NVARCHAR(50) DEFAULT 'Draft',
        EntryDate NVARCHAR(50) NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Table [dbo].[JournalEntries] created successfully.';
END
ELSE
BEGIN
    -- Add columns sequentially if the table existed
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'CompanyId')
    BEGIN
        ALTER TABLE dbo.JournalEntries ADD CompanyId INT NULL;
        PRINT 'Added column [CompanyId] to dbo.JournalEntries';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'EntryNumber')
    BEGIN
        ALTER TABLE dbo.JournalEntries ADD EntryNumber NVARCHAR(50) NULL;
        PRINT 'Added column [EntryNumber] to dbo.JournalEntries';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'Reference')
    BEGIN
        ALTER TABLE dbo.JournalEntries ADD Reference NVARCHAR(255) NULL;
        PRINT 'Added column [Reference] to dbo.JournalEntries';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'Narration')
    BEGIN
        ALTER TABLE dbo.JournalEntries ADD Narration NVARCHAR(MAX) NULL;
        PRINT 'Added column [Narration] to dbo.JournalEntries';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'TotalAmount')
    BEGIN
        ALTER TABLE dbo.JournalEntries ADD TotalAmount DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [TotalAmount] to dbo.JournalEntries';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'Status')
    BEGIN
        ALTER TABLE dbo.JournalEntries ADD Status NVARCHAR(50) DEFAULT 'Draft';
        PRINT 'Added column [Status] to dbo.JournalEntries';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'EntryDate')
    BEGIN
        ALTER TABLE dbo.JournalEntries ADD EntryDate NVARCHAR(50) NULL;
        PRINT 'Added column [EntryDate] to dbo.JournalEntries';
    END;
END;

-- 2. Create table dbo.JournalLines if it does not exist already
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.JournalLines (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        JournalEntryId INT NULL FOREIGN KEY REFERENCES dbo.JournalEntries(Id) ON DELETE CASCADE,
        AccountId INT NULL,
        Description NVARCHAR(255) NULL,
        Debit DECIMAL(18,2) DEFAULT 0,
        Credit DECIMAL(18,2) DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Table [dbo].[JournalLines] created successfully with foreign key constraint and cascade deletion.';
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'JournalEntryId')
    BEGIN
        ALTER TABLE dbo.JournalLines ADD JournalEntryId INT NULL;
        PRINT 'Added column [JournalEntryId] to dbo.JournalLines';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'AccountId')
    BEGIN
        ALTER TABLE dbo.JournalLines ADD AccountId INT NULL;
        PRINT 'Added column [AccountId] to dbo.JournalLines';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'Description')
    BEGIN
        ALTER TABLE dbo.JournalLines ADD Description NVARCHAR(255) NULL;
        PRINT 'Added column [Description] to dbo.JournalLines';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'Debit')
    BEGIN
        ALTER TABLE dbo.JournalLines ADD Debit DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [Debit] to dbo.JournalLines';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'Credit')
    BEGIN
        ALTER TABLE dbo.JournalLines ADD Credit DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [Credit] to dbo.JournalLines';
    END;
END;

-- Add optional custom index for faster balance auditing
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = N'IX_JournalLines_JournalEntryId')
BEGIN
    CREATE INDEX IX_JournalLines_JournalEntryId ON dbo.JournalLines(JournalEntryId);
    PRINT '✅ Index [IX_JournalLines_JournalEntryId] created.';
END;

PRINT '🎉 Journal entries SQL schema migration completed successfully!';
GO
