-- ====================================================================
-- AUTO SCRIPT FOR NEWLY ADDED COLUMNS - LOCAL SQL SERVER DB
-- Target Table: dbo.InventoryItems
-- Run this script in SQL Server Management Studio (SSMS) on SANJAY database
-- ====================================================================

-- 1. Create table if it does not exist already
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.InventoryItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CompanyId INT NULL,
        ItemCode NVARCHAR(50) NULL,
        Name NVARCHAR(255) NOT NULL,
        Category NVARCHAR(100) NULL,
        Quantity INT DEFAULT 0,
        Unit NVARCHAR(50) NULL,
        UnitPrice DECIMAL(18,2) DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(50) DEFAULT 'Active',
        Location NVARCHAR(255) NULL,
        IsSalesItem NVARCHAR(50) DEFAULT 'Yes',
        SellingPriceMembers DECIMAL(18,2) DEFAULT 0,
        SellingPriceNonMembers DECIMAL(18,2) DEFAULT 0,
        BuyingPrice DECIMAL(18,2) DEFAULT 0,
        HSNCode NVARCHAR(100) NULL,
        SGST DECIMAL(18,2) DEFAULT 0,
        CGST DECIMAL(18,2) DEFAULT 0,
        IGST DECIMAL(18,2) DEFAULT 0,
        MinStock DECIMAL(18,2) DEFAULT 0,
        MaxCapacity DECIMAL(18,2) DEFAULT 0
    );
    PRINT '✅ Table dbo.InventoryItems created successfully.';
END
ELSE
BEGIN
    -- 2. Add newly added columns automatically if the table already existed from earlier versions
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'Status')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD Status NVARCHAR(50) DEFAULT 'Active';
        PRINT 'Added column [Status]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'Location')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD Location NVARCHAR(255) NULL;
        PRINT 'Added column [Location]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'IsSalesItem')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD IsSalesItem NVARCHAR(50) DEFAULT 'Yes';
        PRINT 'Added column [IsSalesItem]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'SellingPriceMembers')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD SellingPriceMembers DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [SellingPriceMembers]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'SellingPriceNonMembers')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD SellingPriceNonMembers DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [SellingPriceNonMembers]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'BuyingPrice')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD BuyingPrice DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [BuyingPrice]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'HSNCode')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD HSNCode NVARCHAR(100) NULL;
        PRINT 'Added column [HSNCode]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'SGST')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD SGST DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [SGST]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'CGST')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD CGST DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [CGST]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'IGST')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD IGST DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [IGST]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'MinStock')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD MinStock DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [MinStock]';
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'MaxCapacity')
    BEGIN
        ALTER TABLE dbo.InventoryItems ADD MaxCapacity DECIMAL(18,2) DEFAULT 0;
        PRINT 'Added column [MaxCapacity]';
    END;

    PRINT '✅ All newly added columns verified and/or created.';
END
GO
