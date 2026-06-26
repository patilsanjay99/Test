import express from "express";
import "dotenv/config";
import sql from "mssql";
import path from "path";
import fs from "fs";
import { installLotsApi, applySalesInvoiceToLots, revertSalesInvoiceFromLots } from "./server-lots-logic";
import { createServer as createViteServer } from "vite";
import JSZip from "jszip";

// Load MSSQL variables
let mssqlPool: any = null;

// Fallback to SQLite (still imported for cloud / fallback usage)
import sqliteDb from "./server-db.js";

async function ensureTableCreatedInMSSQL(tableName: string) {
  if (!mssqlPool) return;
  const lowerName = tableName.toLowerCase();
  if (lowerName === "purchasereturns") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading PurchaseReturns table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseReturns]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.PurchaseReturns (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                FinancialYearId INT NULL,
                ReturnNumber NVARCHAR(50) NULL,
                VendorId INT NULL,
                OriginalInvoiceNumber NVARCHAR(50) NULL,
                TotalAmount DECIMAL(18,2) DEFAULT 0,
                Status NVARCHAR(50) DEFAULT 'Draft',
                ReturnDate NVARCHAR(50) NULL,
                ItemsData NVARCHAR(MAX) NULL,
                Remarks NVARCHAR(MAX) NULL
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseReturns]') AND name = 'ItemsData') ALTER TABLE dbo.PurchaseReturns ADD ItemsData NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseReturns]') AND name = 'OriginalInvoiceNumber') ALTER TABLE dbo.PurchaseReturns ADD OriginalInvoiceNumber NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseReturns]') AND name = 'Remarks') ALTER TABLE dbo.PurchaseReturns ADD Remarks NVARCHAR(MAX) NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: PurchaseReturns table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create PurchaseReturns table:", err.message);
    }
  } else if (lowerName === "purchaseorders") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading PurchaseOrders table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseOrders]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.PurchaseOrders (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                FinancialYearId INT NULL,
                OrderNumber NVARCHAR(50) NULL,
                VendorId INT NULL,
                VendorName NVARCHAR(255) NULL,
                TotalAmount DECIMAL(18,2) DEFAULT 0,
                Status NVARCHAR(50) DEFAULT 'Draft',
                OrderDate NVARCHAR(50) NULL,
                RequiredByDate NVARCHAR(50) NULL,
                ItemsData NVARCHAR(MAX) NULL,
                Remarks NVARCHAR(MAX) NULL,
                Terms NVARCHAR(MAX) NULL
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseOrders]') AND name = 'ItemsData') ALTER TABLE dbo.PurchaseOrders ADD ItemsData NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseOrders]') AND name = 'RequiredByDate') ALTER TABLE dbo.PurchaseOrders ADD RequiredByDate NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseOrders]') AND name = 'VendorName') ALTER TABLE dbo.PurchaseOrders ADD VendorName NVARCHAR(255) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseOrders]') AND name = 'Remarks') ALTER TABLE dbo.PurchaseOrders ADD Remarks NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseOrders]') AND name = 'Terms') ALTER TABLE dbo.PurchaseOrders ADD Terms NVARCHAR(MAX) NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: PurchaseOrders table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create PurchaseOrders table:", err.message);
    }
  } else if (lowerName === "cashpayments") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading CashPayments table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.CashPayments (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                FinancialYearId INT NULL,
                VoucherNo NVARCHAR(50) NULL,
                PaymentDate NVARCHAR(50) NULL,
                CashAccountId INT NULL,
                AccountId INT NULL,
                Amount DECIMAL(18,2) DEFAULT 0,
                Narration NVARCHAR(MAX) NULL,
                Status NVARCHAR(50) DEFAULT 'Posted'
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'CompanyId') ALTER TABLE dbo.CashPayments ADD CompanyId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'FinancialYearId') ALTER TABLE dbo.CashPayments ADD FinancialYearId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'VoucherNo') ALTER TABLE dbo.CashPayments ADD VoucherNo NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'PaymentDate') ALTER TABLE dbo.CashPayments ADD PaymentDate NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'CashAccountId') ALTER TABLE dbo.CashPayments ADD CashAccountId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'AccountId') ALTER TABLE dbo.CashPayments ADD AccountId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'Amount') ALTER TABLE dbo.CashPayments ADD Amount DECIMAL(18,2) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'Narration') ALTER TABLE dbo.CashPayments ADD Narration NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'Status') ALTER TABLE dbo.CashPayments ADD Status NVARCHAR(50) NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: CashPayments table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create CashPayments table:", err.message);
    }
  } else if (lowerName === "bankpayments") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading BankPayments table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.BankPayments (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                FinancialYearId INT NULL,
                VoucherNo NVARCHAR(50) NULL,
                PaymentDate NVARCHAR(50) NULL,
                BankAccountId INT NULL,
                AccountId INT NULL,
                Amount DECIMAL(18,2) NULL,
                ReferenceNo NVARCHAR(100) NULL,
                ReferenceDate NVARCHAR(50) NULL,
                Narration NVARCHAR(MAX) NULL,
                Status NVARCHAR(50) DEFAULT 'Posted'
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'CompanyId') ALTER TABLE dbo.BankPayments ADD CompanyId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'FinancialYearId') ALTER TABLE dbo.BankPayments ADD FinancialYearId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'VoucherNo') ALTER TABLE dbo.BankPayments ADD VoucherNo NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'PaymentDate') ALTER TABLE dbo.BankPayments ADD PaymentDate NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'BankAccountId') ALTER TABLE dbo.BankPayments ADD BankAccountId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'AccountId') ALTER TABLE dbo.BankPayments ADD AccountId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'Amount') ALTER TABLE dbo.BankPayments ADD Amount DECIMAL(18,2) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'ReferenceNo') ALTER TABLE dbo.BankPayments ADD ReferenceNo NVARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'ReferenceDate') ALTER TABLE dbo.BankPayments ADD ReferenceDate NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'Narration') ALTER TABLE dbo.BankPayments ADD Narration NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankPayments]') AND name = 'Status') ALTER TABLE dbo.BankPayments ADD Status NVARCHAR(50) NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: BankPayments table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create BankPayments table:", err.message);
    }
  } else if (lowerName === "bankreceipts") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading BankReceipts table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.BankReceipts (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                FinancialYearId INT NULL,
                VoucherNo NVARCHAR(50) NULL,
                ReceiptDate NVARCHAR(50) NULL,
                BankAccountId INT NULL,
                AccountId INT NULL,
                Amount DECIMAL(18,2) NULL,
                ReferenceNo NVARCHAR(100) NULL,
                ReferenceDate NVARCHAR(50) NULL,
                Narration NVARCHAR(MAX) NULL,
                Status NVARCHAR(50) DEFAULT 'Posted'
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'CompanyId') ALTER TABLE dbo.BankReceipts ADD CompanyId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'FinancialYearId') ALTER TABLE dbo.BankReceipts ADD FinancialYearId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'VoucherNo') ALTER TABLE dbo.BankReceipts ADD VoucherNo NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'ReceiptDate') ALTER TABLE dbo.BankReceipts ADD ReceiptDate NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'BankAccountId') ALTER TABLE dbo.BankReceipts ADD BankAccountId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'AccountId') ALTER TABLE dbo.BankReceipts ADD AccountId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'Amount') ALTER TABLE dbo.BankReceipts ADD Amount DECIMAL(18,2) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'ReferenceNo') ALTER TABLE dbo.BankReceipts ADD ReferenceNo NVARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'ReferenceDate') ALTER TABLE dbo.BankReceipts ADD ReferenceDate NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'Narration') ALTER TABLE dbo.BankReceipts ADD Narration NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankReceipts]') AND name = 'Status') ALTER TABLE dbo.BankReceipts ADD Status NVARCHAR(50) NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: BankReceipts table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create BankReceipts table:", err.message);
    }
  } else if (lowerName === "cashreceipts") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading CashReceipts table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.CashReceipts (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                FinancialYearId INT NULL,
                VoucherNo NVARCHAR(50) NULL,
                ReceiptDate NVARCHAR(50) NULL,
                CashAccountId INT NULL,
                AccountId INT NULL,
                Amount DECIMAL(18,2) DEFAULT 0,
                Narration NVARCHAR(MAX) NULL,
                Status NVARCHAR(50) DEFAULT 'Posted'
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'CompanyId') ALTER TABLE dbo.CashReceipts ADD CompanyId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'FinancialYearId') ALTER TABLE dbo.CashReceipts ADD FinancialYearId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'VoucherNo') ALTER TABLE dbo.CashReceipts ADD VoucherNo NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'ReceiptDate') ALTER TABLE dbo.CashReceipts ADD ReceiptDate NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'CashAccountId') ALTER TABLE dbo.CashReceipts ADD CashAccountId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'AccountId') ALTER TABLE dbo.CashReceipts ADD AccountId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'Amount') ALTER TABLE dbo.CashReceipts ADD Amount DECIMAL(18,2) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'Narration') ALTER TABLE dbo.CashReceipts ADD Narration NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashReceipts]') AND name = 'Status') ALTER TABLE dbo.CashReceipts ADD Status NVARCHAR(50) NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: CashReceipts table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create CashReceipts table:", err.message);
    }
  } else if (lowerName === "bankaccounttypes") {
    try {
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BankAccountTypes]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.BankAccountTypes (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                TypeName NVARCHAR(255) NOT NULL,
                IsDefault BIT DEFAULT 0,
                CreatedAt DATETIME DEFAULT GETDATE()
            );
            
            INSERT INTO dbo.BankAccountTypes (TypeName, IsDefault) VALUES 
            ('Savings', 1), ('Current', 1), ('OD', 1), ('CC', 1);
        END
      `);
      console.log("✅ Auto-recovery successful: BankAccountTypes table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create BankAccountTypes table:", err.message);
    }
  } else if (lowerName === "systemroles") {
    try {
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemRoles]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.SystemRoles (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                RoleName NVARCHAR(255) NOT NULL,
                IsDefault BIT DEFAULT 0,
                CreatedAt DATETIME DEFAULT GETDATE()
            );
            
            INSERT INTO dbo.SystemRoles (RoleName, IsDefault) VALUES 
            ('Employee', 1), ('HR', 1), ('Accountant', 1), ('Super Admin', 1);
        END
      `);
      console.log("✅ Auto-recovery successful: SystemRoles table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create SystemRoles table:", err.message);
    }
  } else if (lowerName === "bankaccounts") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading BankAccounts table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.BankAccounts (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                BankName NVARCHAR(255) NULL,
                Branch NVARCHAR(255) NULL,
                Address NVARCHAR(MAX) NULL,
                AccountNo NVARCHAR(100) NULL,
                AccountType NVARCHAR(50) NULL,
                IFSCCode NVARCHAR(50) NULL,
                MICRCode NVARCHAR(50) NULL,
                AccountGroup NVARCHAR(255) NULL,
                OpeningBalance DECIMAL(18,2) DEFAULT 0,
                BalanceType NVARCHAR(20) DEFAULT 'Dr',
                AccountId INT NULL,
                CreatedAt DATETIME DEFAULT GETDATE()
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'CompanyId') ALTER TABLE dbo.BankAccounts ADD CompanyId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'BankName') ALTER TABLE dbo.BankAccounts ADD BankName NVARCHAR(255) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'Branch') ALTER TABLE dbo.BankAccounts ADD Branch NVARCHAR(255) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'Address') ALTER TABLE dbo.BankAccounts ADD Address NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'AccountNo') ALTER TABLE dbo.BankAccounts ADD AccountNo NVARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'AccountType') ALTER TABLE dbo.BankAccounts ADD AccountType NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'IFSCCode') ALTER TABLE dbo.BankAccounts ADD IFSCCode NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'MICRCode') ALTER TABLE dbo.BankAccounts ADD MICRCode NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'AccountGroup') ALTER TABLE dbo.BankAccounts ADD AccountGroup NVARCHAR(255) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'OpeningBalance') ALTER TABLE dbo.BankAccounts ADD OpeningBalance DECIMAL(18,2) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'BalanceType') ALTER TABLE dbo.BankAccounts ADD BalanceType NVARCHAR(20) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankAccounts]') AND name = 'AccountId') ALTER TABLE dbo.BankAccounts ADD AccountId INT NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: BankAccounts table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create BankAccounts table:", err.message);
    }
  } else if (lowerName === "issues") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading Issues table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.Issues (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                Title NVARCHAR(255) NOT NULL,
                Description NVARCHAR(MAX) NULL,
                Department NVARCHAR(100) NULL,
                AssigneeId INT NULL,
                AssigneeName NVARCHAR(255) NULL,
                StatusId INT NULL,
                StatusCode NVARCHAR(50) NULL,
                StatusName NVARCHAR(100) NULL,
                Priority NVARCHAR(50) NULL,
                SlaDeadline NVARCHAR(50) NULL,
                EscalatedCount INT DEFAULT 0,
                LastEscalationDate NVARCHAR(50) NULL,
                CreatedBy NVARCHAR(255) NULL,
                AttachmentUrl NVARCHAR(MAX) NULL,
                ApproverRemarks NVARCHAR(MAX) NULL,
                IsApproved INT DEFAULT 0,
                CreatedAt DATETIME DEFAULT GETDATE(),
                ClosedAt NVARCHAR(50) NULL
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'EscalatedCount') ALTER TABLE dbo.Issues ADD EscalatedCount INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'LastEscalationDate') ALTER TABLE dbo.Issues ADD LastEscalationDate NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'ClosedAt') ALTER TABLE dbo.Issues ADD ClosedAt NVARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'CreatedBy') ALTER TABLE dbo.Issues ADD CreatedBy NVARCHAR(255) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'AttachmentUrl') ALTER TABLE dbo.Issues ADD AttachmentUrl NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'ApproverRemarks') ALTER TABLE dbo.Issues ADD ApproverRemarks NVARCHAR(MAX) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'IsApproved') ALTER TABLE dbo.Issues ADD IsApproved INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'CompanyId') ALTER TABLE dbo.Issues ADD CompanyId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'AssigneeId') ALTER TABLE dbo.Issues ADD AssigneeId INT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'StatusId') ALTER TABLE dbo.Issues ADD StatusId INT NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: Issues table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create Issues table:", err.message);
    }
  } else if (lowerName === "issuestatuses") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading IssueStatuses table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.IssueStatuses (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL DEFAULT 1,
                StatusName NVARCHAR(100) NOT NULL,
                StatusCode NVARCHAR(50) NOT NULL,
                SequenceOrder INT NOT NULL,
                Color NVARCHAR(20) NULL,
                IsFinalStatus INT DEFAULT 0,
                IsEditable INT DEFAULT 1,
                IsClosureStatus INT DEFAULT 0,
                IsReopenAllowed INT DEFAULT 0,
                ActiveStatus INT DEFAULT 1
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'CompanyId') ALTER TABLE dbo.IssueStatuses ADD CompanyId INT NULL DEFAULT 1;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'IsFinalStatus') ALTER TABLE dbo.IssueStatuses ADD IsFinalStatus INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'IsEditable') ALTER TABLE dbo.IssueStatuses ADD IsEditable INT DEFAULT 1;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'IsClosureStatus') ALTER TABLE dbo.IssueStatuses ADD IsClosureStatus INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'IsReopenAllowed') ALTER TABLE dbo.IssueStatuses ADD IsReopenAllowed INT DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'ActiveStatus') ALTER TABLE dbo.IssueStatuses ADD ActiveStatus INT DEFAULT 1;
        END
      `);
      console.log("✅ Auto-recovery successful: IssueStatuses table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create IssueStatuses table:", err.message);
    }
  } else if (lowerName === "issuelogs") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading IssueLogs table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[IssueLogs]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.IssueLogs (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL DEFAULT 1,
                IssueId INT NOT NULL,
                LogType NVARCHAR(50) NULL,
                [User] NVARCHAR(255) NULL,
                Remarks NVARCHAR(MAX) NULL,
                OldStatus NVARCHAR(100) NULL,
                NewStatus NVARCHAR(100) NULL,
                AttachmentUrl NVARCHAR(MAX) NULL,
                CreatedAt DATETIME DEFAULT GETDATE()
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueLogs]') AND name = 'CompanyId') ALTER TABLE dbo.IssueLogs ADD CompanyId INT NULL DEFAULT 1;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueLogs]') AND name = 'AttachmentUrl') ALTER TABLE dbo.IssueLogs ADD AttachmentUrl NVARCHAR(MAX) NULL;
        END
      `);
      console.log("✅ Auto-recovery successful: IssueLogs table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create IssueLogs table:", err.message);
    }
  } else if (lowerName === "units") {
    try {
      console.log("🛠️ Dynamic Auto-recovery: Creating/upgrading Units table in MS SQL...");
      await mssqlPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Units]') AND type in (N'U'))
        BEGIN
            CREATE TABLE dbo.Units (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CompanyId INT NULL,
                Code NVARCHAR(50) NOT NULL,
                Name NVARCHAR(255) NOT NULL,
                Description NVARCHAR(MAX) NULL
            );
        END
        
        IF NOT EXISTS (SELECT * FROM dbo.Units)
        BEGIN
            INSERT INTO dbo.Units (Code, Name, Description) VALUES
            ('NOS', 'Numbers', 'Count of individual items'),
            ('KGS', 'Kilograms', 'Weight in kilograms'),
            ('MTR', 'Meters', 'Length in meters'),
            ('PCS', 'Pieces', 'Count of pieces'),
            ('BOX', 'Boxes', 'Box packaging'),
            ('LTR', 'Liters', 'Volume in liters'),
            ('TON', 'Tons', 'Weight in metric tons'),
            ('BAG', 'Bags', 'Bag packaging'),
            ('PAC', 'Packets', 'Packet packaging'),
            ('SET', 'Sets', 'Set of items');
        END
      `);
      console.log("✅ Auto-recovery successful: Units table created/upgraded.");
    } catch (err: any) {
      console.error("❌ Auto-recovery failed to create Units table:", err.message);
    }
  }
}

async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  if (mssqlPool) {
    // Basic substitution of ? into @p0, @p1 for simple queries
    let mssqlQuery = query;
    const request = mssqlPool.request();
    for (let i = 0; i < params.length; i++) {
      mssqlQuery = mssqlQuery.replace('?', `@p${i}`);
      let val = params[i];
      if (val === '') {
         val = null;
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
        if (dmyMatch) {
          val = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
        }
      }
      request.input(`p${i}`, val);
    }
    // Fix LIMIT syntax for MSSQL if easy
    if (mssqlQuery.includes('LIMIT 12')) {
       mssqlQuery = mssqlQuery.replace('SELECT ', 'SELECT TOP 12 ').replace('LIMIT 12', '');
    }
    // Fix sqlite strftime to MSSQL format
    if (mssqlQuery.includes("strftime('%Y-%m', InvoiceDate)")) {
       mssqlQuery = mssqlQuery.replace(/strftime\('%Y-%m', InvoiceDate\)/g, "SUBSTRING(CONVERT(varchar(10), InvoiceDate, 120), 1, 7)");
    }

    try {
        const result = await request.query(mssqlQuery);
        return result.recordset || [];
    } catch (e: any) {
      if (e.message && e.message.toLowerCase().includes("purchasereturns")) {
         await ensureTableCreatedInMSSQL("PurchaseReturns");
         try {
             const retryRequest = mssqlPool.request();
             for (let i = 0; i < params.length; i++) {
                 let val = params[i];
                 if (val === '') val = null;
                 if (typeof val === 'string') {
                   const trimmed = val.trim();
                   const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
                   if (dmyMatch) {
                     val = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
                   }
                  }
                  retryRequest.input(`p${i}`, val);
             }
             const retryResult = await retryRequest.query(mssqlQuery);
             return retryResult.recordset || [];
         } catch (retryErr: any) {
             console.error("MSSQL Retry Query Error:", retryErr, mssqlQuery);
             throw retryErr;
         }
      }
      if (e.message && e.message.toLowerCase().includes("purchaseorders")) {
         await ensureTableCreatedInMSSQL("PurchaseOrders");
         try {
             const retryRequest = mssqlPool.request();
             for (let i = 0; i < params.length; i++) {
                 let val = params[i];
                 if (val === '') val = null;
                 if (typeof val === 'string') {
                   const trimmed = val.trim();
                   const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
                   if (dmyMatch) {
                     val = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
                   }
                  }
                  retryRequest.input(`p${i}`, val);
             }
             const retryResult = await retryRequest.query(mssqlQuery);
             return retryResult.recordset || [];
         } catch (retryErr: any) {
             console.error("MSSQL Retry Query Error (PurchaseOrders):", retryErr, mssqlQuery);
             throw retryErr;
         }
      }
      if (e.message && e.message.toLowerCase().includes("cashpayments")) {
         await ensureTableCreatedInMSSQL("CashPayments");
         try {
             const retryRequest = mssqlPool.request();
             for (let i = 0; i < params.length; i++) {
                 let val = params[i];
                 if (val === '') val = null;
                 if (typeof val === 'string') {
                   const trimmed = val.trim();
                   const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
                   if (dmyMatch) {
                     val = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
                   }
                  }
                  retryRequest.input(`p${i}`, val);
             }
             const retryResult = await retryRequest.query(mssqlQuery);
             return retryResult.recordset || [];
         } catch (retryErr: any) {
             console.error("MSSQL Retry Query Error (CashPayments):", retryErr, mssqlQuery);
             throw retryErr;
         }
      }
      if (e.message && e.message.toLowerCase().includes("cashreceipts")) {
         await ensureTableCreatedInMSSQL("CashReceipts");
         try {
             const retryRequest = mssqlPool.request();
             for (let i = 0; i < params.length; i++) {
                 let val = params[i];
                 if (val === '') val = null;
                 if (typeof val === 'string') {
                   const trimmed = val.trim();
                   const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
                   if (dmyMatch) {
                     val = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
                   }
                  }
                  retryRequest.input(`p${i}`, val);
             }
             const retryResult = await retryRequest.query(mssqlQuery);
             return retryResult.recordset || [];
         } catch (retryErr: any) {
             console.error("MSSQL Retry Query Error (CashReceipts):", retryErr, mssqlQuery);
             throw retryErr;
         }
      }
      console.error("MSSQL Query Error:", e, mssqlQuery);
      throw e;
    }
  } else {
    // SQLite execution
    const qUpper = query.trim().toUpperCase();
    if (qUpper.startsWith('INSERT') || qUpper.startsWith('UPDATE') || qUpper.startsWith('DELETE') || qUpper.startsWith('CREATE') || qUpper.startsWith('ALTER') || qUpper.startsWith('DROP')) {
        const info = sqliteDb.prepare(query).run(...params);
        return [{ id: info.lastInsertRowid, changes: info.changes }];
    } else {
        return sqliteDb.prepare(query).all(...params) as any[];
    }
  }
}

async function executeGet(query: string, params: any[] = []): Promise<any> {
    const rows = await executeQuery(query, params);
    return rows[0];
}

async function startServer() {
  if (process.env.DB_SERVER) {
    try {
      const mssqlConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
        database: process.env.DB_NAME,
        options: {
          encrypt: process.env.DB_ENCRYPT === 'true',
          trustServerCertificate: true,
          instanceName: process.env.DB_INSTANCE || undefined,
          cryptoCredentialsDetails: {
            minVersion: 'TLSv1',
            ciphers: 'DEFAULT@SECLEVEL=1'
          }
        }
      };
      mssqlPool = await sql.connect(mssqlConfig);
      console.log("✅ Custom MS SQL Connection Initialized to", process.env.DB_SERVER);
      
      // Auto-migrate newly added columns
      try {
          const migrationQuery = `
          -- Audit Logs Table 
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[audit_logs]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.audit_logs (
                  id INT IDENTITY(1,1) PRIMARY KEY,
                  timestamp DATETIME DEFAULT GETDATE() NULL,
                  user_id NVARCHAR(255) NULL,
                  action NVARCHAR(100) NOT NULL,
                  entity_type NVARCHAR(100) NOT NULL,
                  entity_id INT NOT NULL,
                  details NVARCHAR(MAX) NULL,
                  FinancialYearId INT NULL,
                  CompanyId INT DEFAULT 1 NULL
              );
          END
          
          -- Fix existing columns in case they were added with wrong case
          IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[audit_logs]') AND name = 'companyid')
          BEGIN
              EXEC sp_rename 'dbo.audit_logs.companyid', 'CompanyId', 'COLUMN';
          END
          
          IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[audit_logs]') AND name = 'FinancialYearid')
          BEGIN
              EXEC sp_rename 'dbo.audit_logs.FinancialYearid', 'FinancialYearId', 'COLUMN';
          END

          -- Verification checks for each column 
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[audit_logs]') AND name = 'FinancialYearId') ALTER TABLE audit_logs ADD FinancialYearId INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[audit_logs]') AND name = 'CompanyId') ALTER TABLE audit_logs ADD CompanyId INT NULL;

          -- DocumentSequences Table Migration
           IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentSequences]') AND type in (N'U'))
           BEGIN
               CREATE TABLE dbo.DocumentSequences (
                   Id INT IDENTITY(1,1) PRIMARY KEY,
                   CompanyId INT NULL,
                   DocumentType NVARCHAR(100) NULL,
                   Prefix NVARCHAR(100) NULL,
                   SequenceNumber INT DEFAULT 1,
                   FinancialYear NVARCHAR(50) NULL
               );
           END

           -- Companies Column Migrations
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'PhoneNo') ALTER TABLE Companies ADD PhoneNo NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'Address') ALTER TABLE Companies ADD Address NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'EmailID') ALTER TABLE Companies ADD EmailID NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'ContactPerson') ALTER TABLE Companies ADD ContactPerson NVARCHAR(150) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'BusinessDetails') ALTER TABLE Companies ADD BusinessDetails NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'RegistrationNo') ALTER TABLE Companies ADD RegistrationNo NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'AadharCardNo') ALTER TABLE Companies ADD AadharCardNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'TANNo') ALTER TABLE Companies ADD TANNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'CINNo') ALTER TABLE Companies ADD CINNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'StateCode') ALTER TABLE Companies ADD StateCode NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'TaxRange') ALTER TABLE Companies ADD TaxRange NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'Division') ALTER TABLE Companies ADD Division NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'BankName') ALTER TABLE Companies ADD BankName NVARCHAR(150) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'BankBranch') ALTER TABLE Companies ADD BankBranch NVARCHAR(150) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'AccountNumber') ALTER TABLE Companies ADD AccountNumber NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'AccountType') ALTER TABLE Companies ADD AccountType NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'BankAddress') ALTER TABLE Companies ADD BankAddress NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'MICRCode') ALTER TABLE Companies ADD MICRCode NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'IFSCCode') ALTER TABLE Companies ADD IFSCCode NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'DefaultQuotationTerms') ALTER TABLE Companies ADD DefaultQuotationTerms NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'DefaultSalesOrderTerms') ALTER TABLE Companies ADD DefaultSalesOrderTerms NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'DefaultSalesInvoiceTerms') ALTER TABLE Companies ADD DefaultSalesInvoiceTerms NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'DefaultPurchaseOrderTerms') ALTER TABLE Companies ADD DefaultPurchaseOrderTerms NVARCHAR(MAX) NULL;

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'LogoUrl') ALTER TABLE Companies ADD LogoUrl NVARCHAR(MAX) NULL;

          -- Customers Table & Column Migrations
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.Customers (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  CustomerName NVARCHAR(255) NOT NULL,
                  CreatedAt DATETIME DEFAULT GETDATE()
              );
          END

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'CompanyId') ALTER TABLE Customers ADD CompanyId INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'CustomerName') ALTER TABLE Customers ADD CustomerName NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'PhoneNo') ALTER TABLE Customers ADD PhoneNo NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'Address') ALTER TABLE Customers ADD Address NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'EmailID') ALTER TABLE Customers ADD EmailID NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'ContactPerson') ALTER TABLE Customers ADD ContactPerson NVARCHAR(150) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'BusinessDetails') ALTER TABLE Customers ADD BusinessDetails NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'RegistrationNo') ALTER TABLE Customers ADD RegistrationNo NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'AadharCardNo') ALTER TABLE Customers ADD AadharCardNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'TANNo') ALTER TABLE Customers ADD TANNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'CINNo') ALTER TABLE Customers ADD CINNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'PANNo') ALTER TABLE Customers ADD PANNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'GSTINNo') ALTER TABLE Customers ADD GSTINNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'StateCode') ALTER TABLE Customers ADD StateCode NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'Range') ALTER TABLE Customers ADD Range NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'Division') ALTER TABLE Customers ADD Division NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'Commissionrate') ALTER TABLE Customers ADD Commissionrate NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'AccountingCircle') ALTER TABLE Customers ADD AccountingCircle NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'OpeningBalance') ALTER TABLE Customers ADD OpeningBalance DECIMAL(18,2) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND name = 'Place') ALTER TABLE Customers ADD Place NVARCHAR(255) NULL;

          -- Customers Commissionrate conversion to alphanumeric
          IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Customers]') AND type in (N'U'))
          BEGIN
              EXEC sp_executesql N'
              BEGIN TRY
                  -- Find and drop default constraints
                  DECLARE @sql NVARCHAR(MAX) = N'''';
                  SELECT @sql += N''ALTER TABLE dbo.Customers DROP CONSTRAINT ['' + d.name + ''];'' + CHAR(13)
                  FROM sys.default_constraints d
                  INNER JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
                  WHERE c.object_id = OBJECT_ID(N''dbo.Customers'') AND LOWER(c.name) = ''commissionrate'';
                  
                  IF @sql <> '''' EXEC sp_executesql @sql;

                  -- Find and drop check constraints
                  SET @sql = N'''';
                  SELECT @sql += N''ALTER TABLE dbo.Customers DROP CONSTRAINT ['' + cc.name + ''];'' + CHAR(13)
                  FROM sys.check_constraints cc
                  INNER JOIN sys.columns c ON cc.parent_column_id = c.column_id AND cc.parent_object_id = c.object_id
                  WHERE cc.parent_object_id = OBJECT_ID(N''dbo.Customers'') AND LOWER(c.name) = ''commissionrate'';
                  
                  IF @sql <> '''' EXEC sp_executesql @sql;

                  -- Find and drop indexes
                  SET @sql = N'''';
                  SELECT @sql += N''DROP INDEX ['' + i.name + ''] ON dbo.Customers;'' + CHAR(13)
                  FROM sys.indexes i
                  INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                  INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                  WHERE i.object_id = OBJECT_ID(N''dbo.Customers'') AND LOWER(c.name) = ''commissionrate'';
                  
                  IF @sql <> '''' EXEC sp_executesql @sql;

                  BEGIN TRY
                      ALTER TABLE dbo.Customers ALTER COLUMN Commissionrate NVARCHAR(255) NULL;
                      PRINT ''Successfully altered Customers.Commissionrate to NVARCHAR'';
                  END TRY
                  BEGIN CATCH
                      PRINT ''Direct alter of Customers.Commissionrate failed: '' + ERROR_MESSAGE() + ''. Attempting drop-and-add fallback...'';
                      BEGIN TRY
                          ALTER TABLE dbo.Customers DROP COLUMN Commissionrate;
                          ALTER TABLE dbo.Customers ADD Commissionrate NVARCHAR(255) NULL;
                          PRINT ''Successfully dropped and added Customers.Commissionrate'';
                      END TRY
                      BEGIN CATCH
                          PRINT ''Drop-and-add fallback for Customers.Commissionrate failed: '' + ERROR_MESSAGE();
                      END CATCH
                  END CATCH
              END TRY
              BEGIN CATCH
                  PRINT ''Main Customers migration wrapper failed: '' + ERROR_MESSAGE();
              END CATCH
              ';
          END

          -- Locations Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Locations]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.Locations (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  Name NVARCHAR(255) NOT NULL,
                  Description NVARCHAR(MAX) NULL,
                  Address NVARCHAR(MAX) NULL,
                  Status NVARCHAR(50) DEFAULT 'Active',
                  CreatedAt DATETIME DEFAULT GETDATE()
              );
          END

          -- Locations Fields verification
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Locations]') AND name = 'Status') ALTER TABLE Locations ADD Status NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Locations]') AND name = 'Address') ALTER TABLE Locations ADD Address NVARCHAR(MAX) NULL;

          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.Vendors (
                  COMPANYID INT NULL,
                  Vendor_ID INT IDENTITY(1,1) PRIMARY KEY,
                  Vendor_NAME NVARCHAR(255) NULL,
                  Vendor_address NVARCHAR(MAX) NULL,
                  business_details NVARCHAR(MAX) NULL,
                  contact_person NVARCHAR(50) NULL,
                  phone_no NVARCHAR(50) NULL,
                  email_id NVARCHAR(50) NULL,
                  registration_no NVARCHAR(50) NULL,
                  opening_balance NUMERIC(18,2) NULL,
                  GSTIN NVARCHAR(50) NULL,
                  aadhar_no NVARCHAR(50) NULL,
                  pan_no NVARCHAR(50) NULL,
                  tan_no NVARCHAR(50) NULL,
                  cin_no NVARCHAR(50) NULL,
                  state_code NCHAR(2) NULL,
                  Range NVARCHAR(50) NULL,
                  Division NVARCHAR(50) NULL,
                  Commissionrate NVARCHAR(50) NULL,
                  circle NVARCHAR(50) NULL,
                  payment_note NVARCHAR(500) NULL,
                  state_id INT NULL,
                  state_name NVARCHAR(50) NULL,
                  ISACTIVE CHAR(1) DEFAULT 'Y' NULL,
                  Added_On DATETIME DEFAULT GETDATE() NOT NULL,
                  ADDED_BY INT NULL,
                  Modify_On DATETIME NULL,
                  MODIFY_BY INT NULL
              );
          END

          -- Verification checks for each column in case Vendors existed but was missing columns
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'COMPANYID') ALTER TABLE Vendors ADD COMPANYID INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'Vendor_NAME') ALTER TABLE Vendors ADD Vendor_NAME NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'Vendor_address') ALTER TABLE Vendors ADD Vendor_address NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'business_details') ALTER TABLE Vendors ADD business_details NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'contact_person') ALTER TABLE Vendors ADD contact_person NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'phone_no') ALTER TABLE Vendors ADD phone_no NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'email_id') ALTER TABLE Vendors ADD email_id NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'registration_no') ALTER TABLE Vendors ADD registration_no NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'opening_balance') ALTER TABLE Vendors ADD opening_balance NUMERIC(18,2) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'GSTIN') ALTER TABLE Vendors ADD GSTIN NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'aadhar_no') ALTER TABLE Vendors ADD aadhar_no NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'pan_no') ALTER TABLE Vendors ADD pan_no NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'tan_no') ALTER TABLE Vendors ADD tan_no NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'cin_no') ALTER TABLE Vendors ADD cin_no NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'state_code') ALTER TABLE Vendors ADD state_code NCHAR(2) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'Range') ALTER TABLE Vendors ADD Range NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'Division') ALTER TABLE Vendors ADD Division NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'Commissionrate') ALTER TABLE Vendors ADD Commissionrate NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'circle') ALTER TABLE Vendors ADD circle NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'payment_note') ALTER TABLE Vendors ADD payment_note NVARCHAR(500) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'state_id') ALTER TABLE Vendors ADD state_id INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'state_name') ALTER TABLE Vendors ADD state_name NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'ISACTIVE') ALTER TABLE Vendors ADD ISACTIVE CHAR(1) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'Added_On') ALTER TABLE Vendors ADD Added_On DATETIME NOT NULL DEFAULT GETDATE();
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'ADDED_BY') ALTER TABLE Vendors ADD ADDED_BY INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'Modify_On') ALTER TABLE Vendors ADD Modify_On DATETIME NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'MODIFY_BY') ALTER TABLE Vendors ADD MODIFY_BY INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'Place') ALTER TABLE Vendors ADD Place NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND name = 'FPCMemberId') ALTER TABLE Vendors ADD FPCMemberId INT NULL;

          -- Widen exist column definitions to fully prevent MS SQL "String or binary data would be truncated" issues
          IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND type in (N'U'))
          BEGIN
              BEGIN TRY
                  ALTER TABLE Vendors ALTER COLUMN Vendor_NAME NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN Vendor_address NVARCHAR(MAX) NULL;
                  ALTER TABLE Vendors ALTER COLUMN business_details NVARCHAR(MAX) NULL;
                  ALTER TABLE Vendors ALTER COLUMN contact_person NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN phone_no NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN email_id NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN registration_no NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN GSTIN NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN aadhar_no NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN pan_no NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN tan_no NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN cin_no NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN state_code NVARCHAR(50) NULL;
                  ALTER TABLE Vendors ALTER COLUMN Range NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN Division NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN circle NVARCHAR(255) NULL;
                  ALTER TABLE Vendors ALTER COLUMN payment_note NVARCHAR(MAX) NULL;
                  ALTER TABLE Vendors ALTER COLUMN state_name NVARCHAR(255) NULL;
              END TRY
              BEGIN CATCH
                  -- Ignore column alterations errors to allow downstream migrations to succeed
                  PRINT 'Skipped some Vendor column widenings';
              END CATCH
          END

          -- Vendors Commissionrate conversion to alphanumeric
          IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Vendors]') AND type in (N'U'))
          BEGIN
              EXEC sp_executesql N'
              BEGIN TRY
                  -- Find and drop default constraints
                  DECLARE @sql NVARCHAR(MAX) = N'''';
                  SELECT @sql += N''ALTER TABLE dbo.Vendors DROP CONSTRAINT ['' + d.name + ''];'' + CHAR(13)
                  FROM sys.default_constraints d
                  INNER JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
                  WHERE c.object_id = OBJECT_ID(N''dbo.Vendors'') AND LOWER(c.name) = ''commissionrate'';
                  
                  IF @sql <> '''' EXEC sp_executesql @sql;

                  -- Find and drop check constraints
                  SET @sql = N'''';
                  SELECT @sql += N''ALTER TABLE dbo.Vendors DROP CONSTRAINT ['' + cc.name + ''];'' + CHAR(13)
                  FROM sys.check_constraints cc
                  INNER JOIN sys.columns c ON cc.parent_column_id = c.column_id AND cc.parent_object_id = c.object_id
                  WHERE cc.parent_object_id = OBJECT_ID(N''dbo.Vendors'') AND LOWER(c.name) = ''commissionrate'';
                  
                  IF @sql <> '''' EXEC sp_executesql @sql;

                  -- Find and drop indexes
                  SET @sql = N'''';
                  SELECT @sql += N''DROP INDEX ['' + i.name + ''] ON dbo.Vendors;'' + CHAR(13)
                  FROM sys.indexes i
                  INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                  INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                  WHERE i.object_id = OBJECT_ID(N''dbo.Vendors'') AND LOWER(c.name) = ''commissionrate'';
                  
                  IF @sql <> '''' EXEC sp_executesql @sql;

                  BEGIN TRY
                      ALTER TABLE dbo.Vendors ALTER COLUMN Commissionrate NVARCHAR(255) NULL;
                      PRINT ''Successfully altered Vendors.Commissionrate to NVARCHAR'';
                  END TRY
                  BEGIN CATCH
                      PRINT ''Direct alter of Vendors.Commissionrate failed: '' + ERROR_MESSAGE() + ''. Attempting drop-and-add fallback...'';
                      BEGIN TRY
                          ALTER TABLE dbo.Vendors DROP COLUMN Commissionrate;
                          ALTER TABLE dbo.Vendors ADD Commissionrate NVARCHAR(255) NULL;
                          PRINT ''Successfully dropped and added Vendors.Commissionrate'';
                      END TRY
                      BEGIN CATCH
                          PRINT ''Drop-and-add fallback for Vendors.Commissionrate failed: '' + ERROR_MESSAGE();
                      END CATCH
                  END CATCH
              END TRY
              BEGIN CATCH
                  PRINT ''Main Vendors migration wrapper failed: '' + ERROR_MESSAGE();
              END CATCH
              ';
          END

          -- FPCMembers Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.FPCMembers (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  MemberId NVARCHAR(50) NULL,
                  FarmerName NVARCHAR(255) NOT NULL,
                  JoinDate NVARCHAR(50) NULL
              );
          END

          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'CompanyId') ALTER TABLE FPCMembers ADD CompanyId INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'MemberId') ALTER TABLE FPCMembers ADD MemberId NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'FarmerName') ALTER TABLE FPCMembers ADD FarmerName NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'FatherSpouse') ALTER TABLE FPCMembers ADD FatherSpouse NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'Gender') ALTER TABLE FPCMembers ADD Gender NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'DOB') ALTER TABLE FPCMembers ADD DOB NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'Phone') ALTER TABLE FPCMembers ADD Phone NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'AadharNo') ALTER TABLE FPCMembers ADD AadharNo NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'Address') ALTER TABLE FPCMembers ADD Address NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'Village') ALTER TABLE FPCMembers ADD Village NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'Panchayat') ALTER TABLE FPCMembers ADD Panchayat NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'Tehsil') ALTER TABLE FPCMembers ADD Tehsil NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'District') ALTER TABLE FPCMembers ADD District NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'State') ALTER TABLE FPCMembers ADD State NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'Place') ALTER TABLE FPCMembers ADD Place NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'PINCode') ALTER TABLE FPCMembers ADD PINCode NVARCHAR(50) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'LandHolding') ALTER TABLE FPCMembers ADD LandHolding DECIMAL(18,2) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'IrrigationType') ALTER TABLE FPCMembers ADD IrrigationType NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'MajorCrops') ALTER TABLE FPCMembers ADD MajorCrops NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'SharesAllocated') ALTER TABLE FPCMembers ADD SharesAllocated INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'FaceValue') ALTER TABLE FPCMembers ADD FaceValue DECIMAL(18,2) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'ShareAmount') ALTER TABLE FPCMembers ADD ShareAmount DECIMAL(18,2) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[FPCMembers]') AND name = 'JoinDate') ALTER TABLE FPCMembers ADD JoinDate NVARCHAR(50) NULL;

          -- ShareTransactions Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ShareTransactions]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.ShareTransactions (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  TransactionType NVARCHAR(100) NULL,
                  TransactionDate NVARCHAR(50) NULL,
                  MemberId INT NULL,
                  ToMemberId INT NULL,
                  Shares INT NULL,
                  FaceValue DECIMAL(18,2) NULL,
                  TotalAmount DECIMAL(18,2) NULL,
                  StartingFolio NVARCHAR(255) NULL,
                  FolioFrom NVARCHAR(255) NULL,
                  FolioTo NVARCHAR(255) NULL,
                  Remarks NVARCHAR(MAX) NULL,
                  Status NVARCHAR(50) DEFAULT 'Completed'
              );
          END
          
          -- Loans Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.Loans (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  FinancialYearId INT NULL,
                  MemberId INT NULL,
                  LoanType NVARCHAR(100) NULL,
                  DisbursementDate NVARCHAR(50) NULL,
                  PrincipalAmount DECIMAL(18,2) NULL,
                  InterestRate DECIMAL(18,2) NULL,
                  Tenure INT NULL,
                  TotalInterestPayable DECIMAL(18,2) NULL,
                  TotalPayable DECIMAL(18,2) NULL,
                  Outstanding DECIMAL(18,2) NULL,
                  CollateralRemarks NVARCHAR(MAX) NULL,
                  Status NVARCHAR(50) DEFAULT 'Active'
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'CompanyId') ALTER TABLE dbo.Loans ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'FinancialYearId') ALTER TABLE dbo.Loans ADD FinancialYearId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'MemberId') ALTER TABLE dbo.Loans ADD MemberId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'LoanType') ALTER TABLE dbo.Loans ADD LoanType NVARCHAR(100) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'DisbursementDate') ALTER TABLE dbo.Loans ADD DisbursementDate NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'PrincipalAmount') ALTER TABLE dbo.Loans ADD PrincipalAmount DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'InterestRate') ALTER TABLE dbo.Loans ADD InterestRate DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'Tenure') ALTER TABLE dbo.Loans ADD Tenure INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'TotalInterestPayable') ALTER TABLE dbo.Loans ADD TotalInterestPayable DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'TotalPayable') ALTER TABLE dbo.Loans ADD TotalPayable DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'Outstanding') ALTER TABLE dbo.Loans ADD Outstanding DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'CollateralRemarks') ALTER TABLE dbo.Loans ADD CollateralRemarks NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Loans]') AND name = 'Status') ALTER TABLE dbo.Loans ADD Status NVARCHAR(50) NULL;
          END

          -- LoanRepayments Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.LoanRepayments (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  LoanId INT NULL,
                  MemberId INT NULL,
                  RepaymentDate NVARCHAR(50) NULL,
                  AmountPaid DECIMAL(18,2) NULL,
                  PrincipalPaid DECIMAL(18,2) NULL,
                  InterestPaid DECIMAL(18,2) NULL,
                  Remarks NVARCHAR(MAX) NULL
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND name = 'CompanyId') ALTER TABLE dbo.LoanRepayments ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND name = 'LoanId') ALTER TABLE dbo.LoanRepayments ADD LoanId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND name = 'MemberId') ALTER TABLE dbo.LoanRepayments ADD MemberId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND name = 'RepaymentDate') ALTER TABLE dbo.LoanRepayments ADD RepaymentDate NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND name = 'AmountPaid') ALTER TABLE dbo.LoanRepayments ADD AmountPaid DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND name = 'PrincipalPaid') ALTER TABLE dbo.LoanRepayments ADD PrincipalPaid DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND name = 'InterestPaid') ALTER TABLE dbo.LoanRepayments ADD InterestPaid DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LoanRepayments]') AND name = 'Remarks') ALTER TABLE dbo.LoanRepayments ADD Remarks NVARCHAR(MAX) NULL;
          END

          -- Assets Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.Assets (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  AssetCode NVARCHAR(50) NULL,
                  Name NVARCHAR(255) NOT NULL,
                  Category NVARCHAR(100) NULL,
                  Location NVARCHAR(255) NULL,
                  PurchaseDate NVARCHAR(50) NULL,
                  Cost DECIMAL(18,2) NULL,
                  Value DECIMAL(18,2) NULL,
                  DeprMethod NVARCHAR(50) NULL,
                  DeprRate DECIMAL(18,2) NULL,
                  Notes NVARCHAR(MAX) NULL,
                  Status NVARCHAR(50) DEFAULT 'Active'
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'CompanyId') ALTER TABLE dbo.Assets ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'AssetCode') ALTER TABLE dbo.Assets ADD AssetCode NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Name') ALTER TABLE dbo.Assets ADD Name NVARCHAR(255) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Category') ALTER TABLE dbo.Assets ADD Category NVARCHAR(100) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Location') ALTER TABLE dbo.Assets ADD Location NVARCHAR(255) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'PurchaseDate') ALTER TABLE dbo.Assets ADD PurchaseDate NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Cost') ALTER TABLE dbo.Assets ADD Cost DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Value') ALTER TABLE dbo.Assets ADD Value DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'DeprMethod') ALTER TABLE dbo.Assets ADD DeprMethod NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'DeprRate') ALTER TABLE dbo.Assets ADD DeprRate DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Notes') ALTER TABLE dbo.Assets ADD Notes NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Status') ALTER TABLE dbo.Assets ADD Status NVARCHAR(50) NULL;
          END

          -- InventoryItems Table & Column Migrations
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
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'CompanyId') ALTER TABLE dbo.InventoryItems ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'ItemCode') ALTER TABLE dbo.InventoryItems ADD ItemCode NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'Name') ALTER TABLE dbo.InventoryItems ADD Name NVARCHAR(255) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'Category') ALTER TABLE dbo.InventoryItems ADD Category NVARCHAR(100) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'Quantity') ALTER TABLE dbo.InventoryItems ADD Quantity INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'Unit') ALTER TABLE dbo.InventoryItems ADD Unit NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'UnitPrice') ALTER TABLE dbo.InventoryItems ADD UnitPrice DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'Status') ALTER TABLE dbo.InventoryItems ADD Status NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'Location') ALTER TABLE dbo.InventoryItems ADD Location NVARCHAR(255) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'IsSalesItem') ALTER TABLE dbo.InventoryItems ADD IsSalesItem NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'SellingPriceMembers') ALTER TABLE dbo.InventoryItems ADD SellingPriceMembers DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'SellingPriceNonMembers') ALTER TABLE dbo.InventoryItems ADD SellingPriceNonMembers DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'BuyingPrice') ALTER TABLE dbo.InventoryItems ADD BuyingPrice DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'HSNCode') ALTER TABLE dbo.InventoryItems ADD HSNCode NVARCHAR(100) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'SGST') ALTER TABLE dbo.InventoryItems ADD SGST DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'CGST') ALTER TABLE dbo.InventoryItems ADD CGST DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'IGST') ALTER TABLE dbo.InventoryItems ADD IGST DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'MinStock') ALTER TABLE dbo.InventoryItems ADD MinStock DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'MaxCapacity') ALTER TABLE dbo.InventoryItems ADD MaxCapacity DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[InventoryItems]') AND name = 'UnitId') ALTER TABLE dbo.InventoryItems ADD UnitId INT NULL;
          END

          -- Units Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Units]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.Units (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  Code NVARCHAR(50) NOT NULL,
                  Name NVARCHAR(255) NOT NULL,
                  Description NVARCHAR(MAX) NULL
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Units]') AND name = 'CompanyId') ALTER TABLE dbo.Units ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Units]') AND name = 'Code') ALTER TABLE dbo.Units ADD Code NVARCHAR(50) NOT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Units]') AND name = 'Name') ALTER TABLE dbo.Units ADD Name NVARCHAR(255) NOT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Units]') AND name = 'Description') ALTER TABLE dbo.Units ADD Description NVARCHAR(MAX) NULL;
          END

          -- Seed 10 default units if none exist
          IF NOT EXISTS (SELECT * FROM dbo.Units)
          BEGIN
              INSERT INTO dbo.Units (Code, Name, Description) VALUES
              ('NOS', 'Numbers', 'Count of individual items'),
              ('KGS', 'Kilograms', 'Weight in kilograms'),
              ('MTR', 'Meters', 'Length in meters'),
              ('PCS', 'Pieces', 'Count of pieces'),
              ('BOX', 'Boxes', 'Box packaging'),
              ('LTR', 'Liters', 'Volume in liters'),
              ('TON', 'Tons', 'Weight in metric tons'),
              ('BAG', 'Bags', 'Bag packaging'),
              ('PAC', 'Packets', 'Packet packaging'),
              ('SET', 'Sets', 'Set of items');
          END

          -- JournalEntries Table Migration
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
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'CompanyId') ALTER TABLE dbo.JournalEntries ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'EntryNumber') ALTER TABLE dbo.JournalEntries ADD EntryNumber NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'Reference') ALTER TABLE dbo.JournalEntries ADD Reference NVARCHAR(255) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'Narration') ALTER TABLE dbo.JournalEntries ADD Narration NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'TotalAmount') ALTER TABLE dbo.JournalEntries ADD TotalAmount DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'Status') ALTER TABLE dbo.JournalEntries ADD Status NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalEntries]') AND name = 'EntryDate') ALTER TABLE dbo.JournalEntries ADD EntryDate NVARCHAR(50) NULL;
          END

          -- JournalLines Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.JournalLines (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  JournalEntryId INT NULL,
                  AccountId INT NULL,
                  Description NVARCHAR(255) NULL,
                  Debit DECIMAL(18,2) DEFAULT 0,
                  Credit DECIMAL(18,2) DEFAULT 0,
                  CreatedAt DATETIME DEFAULT GETDATE()
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'JournalEntryId') ALTER TABLE dbo.JournalLines ADD JournalEntryId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'AccountId') ALTER TABLE dbo.JournalLines ADD AccountId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'Description') ALTER TABLE dbo.JournalLines ADD Description NVARCHAR(255) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'Debit') ALTER TABLE dbo.JournalLines ADD Debit DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[JournalLines]') AND name = 'Credit') ALTER TABLE dbo.JournalLines ADD Credit DECIMAL(18,2) NULL;
          END

          -- SalesInvoices Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesInvoices]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.SalesInvoices (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  FinancialYearId INT NULL,
                  InvoiceNumber NVARCHAR(50) NULL,
                  CustomerId INT NULL,
                  TotalAmount DECIMAL(18,2) DEFAULT 0,
                  Status NVARCHAR(50) DEFAULT 'Draft',
                  InvoiceDate NVARCHAR(50) NULL,
                  ItemsData NVARCHAR(MAX) NULL
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesInvoices]') AND name = 'ItemsData') ALTER TABLE dbo.SalesInvoices ADD ItemsData NVARCHAR(MAX) NULL;
          END

          -- SalesReturns Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesReturns]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.SalesReturns (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  FinancialYearId INT NULL,
                  ReturnNumber NVARCHAR(50) NULL,
                  CustomerId INT NULL,
                  OriginalInvoiceNumber NVARCHAR(50) NULL,
                  TotalAmount DECIMAL(18,2) DEFAULT 0,
                  Status NVARCHAR(50) DEFAULT 'Draft',
                  ReturnDate NVARCHAR(50) NULL,
                  ItemsData NVARCHAR(MAX) NULL,
                  Remarks NVARCHAR(MAX) NULL
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesReturns]') AND name = 'ItemsData') ALTER TABLE dbo.SalesReturns ADD ItemsData NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesReturns]') AND name = 'OriginalInvoiceNumber') ALTER TABLE dbo.SalesReturns ADD OriginalInvoiceNumber NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesReturns]') AND name = 'Remarks') ALTER TABLE dbo.SalesReturns ADD Remarks NVARCHAR(MAX) NULL;
          END

          -- SalesQuotations Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesQuotations]') AND type in (N'U'))
          BEGIN
              PRINT 'Creating table SalesQuotations';
              CREATE TABLE [dbo].[SalesQuotations] (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  FinancialYearId INT NULL,
                  QuotationNumber NVARCHAR(50) NULL,
                  CustomerId INT NULL,
                  TotalAmount DECIMAL(18,2) DEFAULT 0,
                  Status NVARCHAR(50) DEFAULT 'Draft',
                  QuotationDate NVARCHAR(50) NULL,
                  ValidUntil NVARCHAR(50) NULL,
                  Remarks NVARCHAR(MAX) NULL,
                  ItemsData NVARCHAR(MAX) NULL,
                  TermsAndConditions NVARCHAR(MAX) NULL
              );
          END
          ELSE
          BEGIN
              PRINT 'Table SalesQuotations already exists';
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesQuotations]') AND name = 'ItemsData') ALTER TABLE [dbo].[SalesQuotations] ADD ItemsData NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesQuotations]') AND name = 'Remarks') ALTER TABLE [dbo].[SalesQuotations] ADD Remarks NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesQuotations]') AND name = 'TermsAndConditions') ALTER TABLE [dbo].[SalesQuotations] ADD TermsAndConditions NVARCHAR(MAX) NULL;
          END

          -- SalesOrders Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesOrders]') AND type in (N'U'))
          BEGIN
              PRINT 'Creating table SalesOrders';
              CREATE TABLE [dbo].[SalesOrders] (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  FinancialYearId INT NULL,
                  OrderNumber NVARCHAR(50) NULL,
                  QuotationNo NVARCHAR(100) NULL,
                  CustomerId INT NULL,
                  TotalAmount DECIMAL(18,2) DEFAULT 0,
                  Status NVARCHAR(50) DEFAULT 'Draft',
                  OrderDate NVARCHAR(50) NULL,
                  ExpectedDelivery NVARCHAR(50) NULL,
                  Remarks NVARCHAR(MAX) NULL,
                  ItemsData NVARCHAR(MAX) NULL,
                  TermsAndConditions NVARCHAR(MAX) NULL
              );
          END
          ELSE
          BEGIN
              PRINT 'Table SalesOrders already exists';
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesOrders]') AND name = 'ItemsData') ALTER TABLE [dbo].[SalesOrders] ADD ItemsData NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesOrders]') AND name = 'Remarks') ALTER TABLE [dbo].[SalesOrders] ADD Remarks NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesOrders]') AND name = 'TermsAndConditions') ALTER TABLE [dbo].[SalesOrders] ADD TermsAndConditions NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SalesOrders]') AND name = 'QuotationNo') ALTER TABLE [dbo].[SalesOrders] ADD QuotationNo NVARCHAR(100) NULL;
          END

          -- PurchaseInvoices Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseInvoices]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.PurchaseInvoices (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  FinancialYearId INT NULL,
                  InvoiceNumber NVARCHAR(50) NULL,
                  VendorId INT NULL,
                  VendorName NVARCHAR(255) NULL,
                  VendorBillNo NVARCHAR(100) NULL,
                  TotalAmount DECIMAL(18,2) DEFAULT 0,
                  Status NVARCHAR(50) DEFAULT 'Draft',
                  InvoiceDate NVARCHAR(50) NULL,
                  Remarks NVARCHAR(MAX) NULL,
                  ItemsData NVARCHAR(MAX) NULL
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseInvoices]') AND name = 'ItemsData') ALTER TABLE dbo.PurchaseInvoices ADD ItemsData NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseInvoices]') AND name = 'VendorName') ALTER TABLE dbo.PurchaseInvoices ADD VendorName NVARCHAR(255) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseInvoices]') AND name = 'VendorBillNo') ALTER TABLE dbo.PurchaseInvoices ADD VendorBillNo NVARCHAR(100) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseInvoices]') AND name = 'Remarks') ALTER TABLE dbo.PurchaseInvoices ADD Remarks NVARCHAR(MAX) NULL;
          END

          -- PurchaseReturns Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseReturns]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.PurchaseReturns (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  FinancialYearId INT NULL,
                  ReturnNumber NVARCHAR(50) NULL,
                  VendorId INT NULL,
                  OriginalInvoiceNumber NVARCHAR(50) NULL,
                  TotalAmount DECIMAL(18,2) DEFAULT 0,
                  Status NVARCHAR(50) DEFAULT 'Draft',
                  ReturnDate NVARCHAR(50) NULL,
                  ItemsData NVARCHAR(MAX) NULL,
                  Remarks NVARCHAR(MAX) NULL
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseReturns]') AND name = 'ItemsData') ALTER TABLE dbo.PurchaseReturns ADD ItemsData NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseReturns]') AND name = 'OriginalInvoiceNumber') ALTER TABLE dbo.PurchaseReturns ADD OriginalInvoiceNumber NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PurchaseReturns]') AND name = 'Remarks') ALTER TABLE dbo.PurchaseReturns ADD Remarks NVARCHAR(MAX) NULL;
          END

          -- StockAdjustments Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[StockAdjustments]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.StockAdjustments (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  AdjustmentNo NVARCHAR(50) NULL,
                  AdjustmentDate NVARCHAR(50) NULL,
                  AdjustmentType NVARCHAR(50) NULL,
                  Reason NVARCHAR(MAX) NULL,
                  Status NVARCHAR(50) DEFAULT 'Draft',
                  ItemsData NVARCHAR(MAX) NULL,
                  CreatedAt DATETIME DEFAULT GETDATE()
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockAdjustments]') AND name = 'CompanyId') ALTER TABLE dbo.StockAdjustments ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockAdjustments]') AND name = 'AdjustmentNo') ALTER TABLE dbo.StockAdjustments ADD AdjustmentNo NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockAdjustments]') AND name = 'AdjustmentDate') ALTER TABLE dbo.StockAdjustments ADD AdjustmentDate NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockAdjustments]') AND name = 'AdjustmentType') ALTER TABLE dbo.StockAdjustments ADD AdjustmentType NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockAdjustments]') AND name = 'Reason') ALTER TABLE dbo.StockAdjustments ADD Reason NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockAdjustments]') AND name = 'Status') ALTER TABLE dbo.StockAdjustments ADD Status NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[StockAdjustments]') AND name = 'ItemsData') ALTER TABLE dbo.StockAdjustments ADD ItemsData NVARCHAR(MAX) NULL;
          END

          -- AccountGroups Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AccountGroups]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.AccountGroups (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  GroupName NVARCHAR(150) NOT NULL,
                  GroupType NVARCHAR(50) NULL,
                  IsDefault BIT DEFAULT 0,
                  CreatedAt DATETIME DEFAULT GETDATE()
              );
          END

          -- Seed Default Account Groups
          DECLARE @Groups TABLE (GroupName NVARCHAR(150), GroupType NVARCHAR(50));
          INSERT INTO @Groups (GroupName, GroupType) VALUES 
          ('Capital Account', 'Equity'),
          ('Reserves & Surplus', 'Equity'),
          ('Current Assets', 'Asset'),
          ('Bank Accounts', 'Asset'),
          ('Cash-in-Hand', 'Asset'),
          ('Fixed Assets', 'Asset'),
          ('Stock-in-Hand', 'Asset'),
          ('Opening Stock', 'Asset'),
          ('Closing Stock', 'Asset'),
          ('Investments', 'Asset'),
          ('Sundry Debtors', 'Asset'),
          ('Current Liabilities', 'Liability'),
          ('Sundry Creditors', 'Liability'),
          ('Duties & Taxes', 'Liability'),
          ('Loans (Liability)', 'Liability'),
          ('Provisions', 'Liability'),
          ('Sales Accounts', 'Revenue'),
          ('Direct Incomes', 'Revenue'),
          ('Indirect Incomes', 'Revenue'),
          ('Purchase Accounts', 'Expense'),
          ('Direct Expenses', 'Expense'),
          ('Indirect Expenses', 'Expense');

          INSERT INTO dbo.AccountGroups (GroupName, GroupType, IsDefault)
          SELECT GroupName, GroupType, 1 
          FROM @Groups g
          WHERE NOT EXISTS (
              SELECT 1 FROM dbo.AccountGroups ag 
              WHERE ag.GroupName = g.GroupName AND ag.IsDefault = 1
          );

          -- Accounts Table Migration
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
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'CompanyId') ALTER TABLE dbo.Accounts ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'AccountCode') ALTER TABLE dbo.Accounts ADD AccountCode NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'Name') ALTER TABLE dbo.Accounts ADD Name NVARCHAR(255) NOT NULL DEFAULT '';
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'AccountGroup') ALTER TABLE dbo.Accounts ADD AccountGroup NVARCHAR(150) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'AccountType') ALTER TABLE dbo.Accounts ADD AccountType NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'OpeningBalance') ALTER TABLE dbo.Accounts ADD OpeningBalance DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'BalanceType') ALTER TABLE dbo.Accounts ADD BalanceType NVARCHAR(10) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'Place') ALTER TABLE dbo.Accounts ADD Place NVARCHAR(255) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Accounts]') AND name = 'FPCMemberId') ALTER TABLE dbo.Accounts ADD FPCMemberId INT NULL;
          END

          -- CashPayments Table Migration
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.CashPayments (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  FinancialYearId INT NULL,
                  VoucherNo NVARCHAR(50) NULL,
                  PaymentDate NVARCHAR(50) NULL,
                  CashAccountId INT NULL,
                  AccountId INT NULL,
                  Amount DECIMAL(18,2) DEFAULT 0,
                  Narration NVARCHAR(MAX) NULL,
                  Status NVARCHAR(50) DEFAULT 'Posted'
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'CompanyId') ALTER TABLE dbo.CashPayments ADD CompanyId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'FinancialYearId') ALTER TABLE dbo.CashPayments ADD FinancialYearId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'VoucherNo') ALTER TABLE dbo.CashPayments ADD VoucherNo NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'PaymentDate') ALTER TABLE dbo.CashPayments ADD PaymentDate NVARCHAR(50) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'CashAccountId') ALTER TABLE dbo.CashPayments ADD CashAccountId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'AccountId') ALTER TABLE dbo.CashPayments ADD AccountId INT NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'Amount') ALTER TABLE dbo.CashPayments ADD Amount DECIMAL(18,2) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'Narration') ALTER TABLE dbo.CashPayments ADD Narration NVARCHAR(MAX) NULL;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CashPayments]') AND name = 'Status') ALTER TABLE dbo.CashPayments ADD Status NVARCHAR(50) NULL;
          END

          -- IssueStatuses Table
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.IssueStatuses (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL DEFAULT 1,
                  StatusName NVARCHAR(100) NOT NULL,
                  StatusCode NVARCHAR(50) NOT NULL,
                  SequenceOrder INT NOT NULL,
                  Color NVARCHAR(20) NULL,
                  IsFinalStatus INT DEFAULT 0,
                  IsEditable INT DEFAULT 1,
                  IsClosureStatus INT DEFAULT 0,
                  IsReopenAllowed INT DEFAULT 0,
                  ActiveStatus INT DEFAULT 1
              );
          END
          ELSE
          BEGIN
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'CompanyId') ALTER TABLE dbo.IssueStatuses ADD CompanyId INT NULL DEFAULT 1;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'IsFinalStatus') ALTER TABLE dbo.IssueStatuses ADD IsFinalStatus INT DEFAULT 0;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'IsEditable') ALTER TABLE dbo.IssueStatuses ADD IsEditable INT DEFAULT 1;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'IsClosureStatus') ALTER TABLE dbo.IssueStatuses ADD IsClosureStatus INT DEFAULT 0;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'IsReopenAllowed') ALTER TABLE dbo.IssueStatuses ADD IsReopenAllowed INT DEFAULT 0;
              IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[IssueStatuses]') AND name = 'ActiveStatus') ALTER TABLE dbo.IssueStatuses ADD ActiveStatus INT DEFAULT 1;
          END

          -- Issues Table
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.Issues (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL,
                  Title NVARCHAR(255) NOT NULL,
                  Description NVARCHAR(MAX) NULL,
                  Department NVARCHAR(100) NULL,
                  AssigneeId INT NULL,
                  AssigneeName NVARCHAR(255) NULL,
                  StatusId INT NULL,
                  StatusCode NVARCHAR(50) NULL,
                  StatusName NVARCHAR(100) NULL,
                  Priority NVARCHAR(50) NULL,
                  SlaDeadline NVARCHAR(50) NULL,
                  EscalatedCount INT DEFAULT 0,
                  LastEscalationDate NVARCHAR(50) NULL,
                  CreatedBy NVARCHAR(255) NULL,
                  AttachmentUrl NVARCHAR(MAX) NULL,
                  ApproverRemarks NVARCHAR(MAX) NULL,
                  IsApproved INT DEFAULT 0,
                  CreatedAt DATETIME DEFAULT GETDATE(),
                  ClosedAt NVARCHAR(50) NULL
              );
          END

          -- IssueLogs Table
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[IssueLogs]') AND type in (N'U'))
          BEGIN
              CREATE TABLE dbo.IssueLogs (
                  Id INT IDENTITY(1,1) PRIMARY KEY,
                  CompanyId INT NULL DEFAULT 1,
                  IssueId INT NOT NULL,
                  LogType NVARCHAR(50) NULL,
                  [User] NVARCHAR(255) NULL,
                  Remarks NVARCHAR(MAX) NULL,
                  OldStatus NVARCHAR(100) NULL,
                  NewStatus NVARCHAR(100) NULL,
                  AttachmentUrl NVARCHAR(MAX) NULL,
                  CreatedAt DATETIME DEFAULT GETDATE()
              );
          END
          `;
          
          // Robust, self-healing migration: Execute migrations section-by-section (per table)
          // so that if any individual table has schema/data issues, it doesn't block other updates!
          const sections = migrationQuery.split(/(?=--\s+[A-Za-z0-9_]+\s+Table\s+)/i);
          for (let section of sections) {
              const trimmed = section.trim();
              if (!trimmed) continue;
              const firstLine = trimmed.split('\n')[0] || '';
              try {
                  await mssqlPool.request().query(trimmed);
                  console.log(`✅ Custom MS SQL Migration: ${firstLine} succeeded`);
              } catch (sectionErr: any) {
                  console.warn(`⚠️ Custom MS SQL Migration Warning for: ${firstLine}`, sectionErr.message);
              }
          }
          console.log("✅ Custom MS SQL Migrations Completed");
      } catch (err: any) {
          console.error("❌ MS SQL Migration Failed: ", err.message);
      }

    } catch (err: any) {
      console.error("❌ MS SQL Connection Failed: ", err.message || err);
      if (err.message && (err.message.includes("ECONNRESET") || err.message.includes("Connection lost"))) {
        console.log(`
=============================================================================
⚠️ DIAGNOSIS FOR MS SQL "ECONNRESET" OR "CONNECTION LOST" ERROR:
This connection termination happens when the remote host resets the connection.
Please inspect and verify the following potential causes:

1. FIREWALL OR IP WHITELISTING:
   Your cloud-hosted server (188.241.62.103) likely blocks external connections.
   👉 ACTION: Ensure your current public IP is whitelisted in your server's 
      firewall or database host firewall rules.

2. INCORRECT PORT CONFIGURATION (8443):
   You configured port "8443". However, 8443 is typically an HTTPS/web-panel port.
   If a SQL client sends TDS packets to a web server, the web server fails to
   recognize it and closes the socket immediately (causing ECONNRESET).
   👉 ACTION: Verify if SQL Server is actually configured to listen on port 8443,
      or if you should use the standard SQL Server port: 1433.

3. SSL/TLS ENCRYPTION STRATEGY:
   Many cloud DBs (especially managed setups) strictly mandate encryption.
   👉 ACTION: Try setting DB_ENCRYPT="true" in your local .env file.
=============================================================================
        `);
      }
    }
  }

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Method override middleware for environments that block PUT/DELETE (like some IIS hosts)
  app.use((req, res, next) => {
    if (req.method === 'POST') {
      const methodOverride = req.headers['x-http-method-override'] || req.query._method;
      if (methodOverride) {
        req.method = (methodOverride as string).toUpperCase();
      }
    }
    next();
  });

  // CORS Middleware
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // === API ROUTES ===
  const apiRouter = express.Router();
  
  async function logAuditAction(userId: string, action: string, entityType: string, entityId: number, details: any, financialYearId: number | null, companyId: number | null) {
      if (!userId) userId = 'System Admin';
      const detailsStr = details ? JSON.stringify(details) : null;
      try {
          if (mssqlPool) {
              const request = mssqlPool.request();
              request.input('userId', userId);
              request.input('action', action);
              request.input('entityType', entityType);
              request.input('entityId', entityId);
              request.input('details', detailsStr);
              request.input('fyId', financialYearId);
              request.input('companyId', companyId || 1);
              await request.query(`
                  INSERT INTO dbo.audit_logs (user_id, action, entity_type, entity_id, details, FinancialYearId, CompanyId)
                  VALUES (@userId, @action, @entityType, @entityId, @details, @fyId, @companyId)
              `);
          } else {
              sqliteDb.prepare(`
                  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, FinancialYearId, CompanyId) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)
              `).run(userId, action, entityType, entityId, detailsStr, financialYearId, companyId || 1);
          }
      } catch (err) {
          console.error("Failed to log audit action:", err);
      }
  }

  apiRouter.use((req, res, next) => {
    console.log("API ROUTE HIT:", req.method, req.url);
    next();
});

  
  apiRouter.post("/auth/login", async (req, res) => {
      try {
          const { email, password } = req.body;
          if (mssqlPool) {
              const result = await mssqlPool.request()
                  .input('email', sql.NVarChar, email)
                  .query('SELECT * FROM Users WHERE Email = @email OR Name = @email'); // allowing name optionally
              
              if (result.recordset.length > 0) {
                  const dbUser = result.recordset[0];
                  const dbPassword = dbUser.Password || (dbUser.Email === 'admin@fpc.com' ? 'admin123' : 'welcome123');
                  if (dbPassword === password) {
                      res.json({ success: true, user: dbUser });
                  } else {
                      res.status(401).json({ error: "Invalid password" });
                  }
              } else {
                  res.status(401).json({ error: "Invalid credentials" });
              }
          } else {
              // SQLite
              const userRow = sqliteDb.prepare("SELECT * FROM Users WHERE Email = ? OR Name = ?").get(email, email) as any;
              if (userRow) {
                  const dbPassword = userRow.Password || (userRow.Email === 'admin@fpc.com' ? 'admin123' : 'welcome123');
                  if (dbPassword === password) {
                      res.json({ success: true, user: userRow });
                  } else {
                      res.status(401).json({ error: "Invalid password" });
                  }
              } else {
                  // Fallback superadmin creation in API
                  if (email === 'admin@fpc.com' && password === 'admin123') {
                      res.json({ success: true, user: { Name: 'Super Admin', Role: 'Super Admin', Email: 'admin@fpc.com' }});
                  } else {
                      res.status(401).json({ error: "Invalid credentials" });
                  }
              }
          }
      } catch (err: any) {
          console.error(err);
          res.status(500).json({ error: "Server error", message: err.message });
      }
  });

  apiRouter.post("/auth/change-password", async (req, res) => {
      try {
          const { userId, email, currentPassword, newPassword } = req.body;
          if (!email || !currentPassword || !newPassword) {
              return res.status(400).json({ error: "Missing required fields" });
          }
          let userRow: any = null;
          if (mssqlPool) {
              const result = await mssqlPool.request()
                  .input('email', sql.NVarChar, email)
                  .query('SELECT * FROM Users WHERE Email = @email OR Name = @email');
              if (result.recordset.length > 0) {
                  userRow = result.recordset[0];
              }
          } else {
              userRow = sqliteDb.prepare("SELECT * FROM Users WHERE Email = ? OR Name = ?").get(email, email) as any;
          }

          if (!userRow) {
              // Special case for default hardcoded Super Admin fallback if not in DB yet
              if (email === 'admin@fpc.com') {
                  userRow = { Id: 1, Name: 'Super Admin', Role: 'Super Admin', Email: 'admin@fpc.com', Password: 'admin123' };
              } else {
                  return res.status(401).json({ error: "User not found" });
              }
          }

          const dbPassword = userRow.Password || (userRow.Email === 'admin@fpc.com' ? 'admin123' : 'welcome123');
          if (dbPassword !== currentPassword) {
              return res.status(401).json({ error: "Incorrect current password" });
          }

          if (mssqlPool) {
              try {
                  await mssqlPool.request()
                      .input('password', sql.NVarChar, newPassword)
                      .input('id', sql.Int, userRow.Id || userRow.ID || userRow.id || userId)
                      .query('UPDATE Users SET Password = @password WHERE Id = @id');
              } catch (alterErr: any) {
                  await mssqlPool.request().query('ALTER TABLE Users ADD Password NVARCHAR(255) NULL');
                  await mssqlPool.request()
                      .input('password', sql.NVarChar, newPassword)
                      .input('id', sql.Int, userRow.Id || userRow.ID || userRow.id || userId)
                      .query('UPDATE Users SET Password = @password WHERE Id = @id');
              }
          } else {
              try {
                  sqliteDb.prepare("UPDATE Users SET Password = ? WHERE Id = ?").run(newPassword, userRow.Id);
              } catch (e: any) {
                  sqliteDb.prepare("INSERT OR REPLACE INTO Users (Id, Name, Email, Role, Status, Password) VALUES (?, ?, ?, ?, ?, ?)").run(
                      userRow.Id || 1, userRow.Name, userRow.Email, userRow.Role, 'Active', newPassword
                  );
              }
          }

          res.json({ success: true, message: "Password updated successfully" });
      } catch (err: any) {
          console.error(err);
          res.status(500).json({ error: "Server error", message: err.message });
      }
  });
  
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", service: "FPC_Accounting_API", version: "1.0.0" });
  });

  apiRouter.get("/export/test", (req, res) => {
    res.json({ status: "test_ok" });
  });

  apiRouter.get("/export/source_v2", async (req, res) => {
    try {
      const zip = new JSZip();
      
      const addFilesToZip = (dir: string, zipFolder: JSZip) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          // Exclude any developer temporary build tools/scripts or database runtimes
          if (
            ['node_modules', 'dist', '.git', 'package-lock.json', 'fpc_database.sqlite', 'fpc_database.sqlite-journal'].includes(file) || 
            file.endsWith('.zip') || 
            file.endsWith('.txt') || 
            file.startsWith('fix-') || 
            file.startsWith('test-') || 
            file.startsWith('tools') || 
            file.startsWith('fetch')
          ) continue;
          
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            addFilesToZip(filePath, zipFolder.folder(file)!);
          } else {
            zipFolder.file(file, fs.readFileSync(filePath));
          }
        }
      };

      addFilesToZip(process.cwd(), zip);
      
      res.attachment('fpc-source-code.zip');
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      res.send(buffer);
    } catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  apiRouter.get("/export/deployment", async (req, res) => {
    try {
      const zip = new JSZip();
      const distPath = path.join(process.cwd(), 'dist');
      
      // Verify production build exists
      if (!fs.existsSync(distPath)) {
        throw new Error('Static/Server production build not found. Please compile the applet first.');
      }

      // 1. Add files under dist/ recursively
      const addDirToZip = (dirPath: string, zipFolder: JSZip) => {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            addDirToZip(filePath, zipFolder.folder(file)!);
          } else {
            zipFolder.file(file, fs.readFileSync(filePath));
          }
        }
      };
      
      addDirToZip(distPath, zip.folder('dist')!);
      
      // 2. Import package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        zip.file('package.json', fs.readFileSync(packageJsonPath));
      }
      
      // 3. Import .env.example
      const envExamplePath = path.join(process.cwd(), '.env.example');
      if (fs.existsSync(envExamplePath)) {
        zip.file('.env.example', fs.readFileSync(envExamplePath));
      }

      // 4. Create root server.js entrypoint for web control panels (cPanel Node.js Selector, Plesk, Phusion Passenger, PM2)
      let rootServerJsContent = '';
      if (fs.existsSync(path.join(process.cwd(), 'server.js'))) {
        rootServerJsContent = fs.readFileSync(path.join(process.cwd(), 'server.js'), 'utf8');
      } else {
        rootServerJsContent = `// Root entrypoint for Cloud Hosting Panels (e.g. cPanel, Plesk, Phusion Passenger, Heroku, PM2, Render, IIS node)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '3000';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const compiledServerJs = path.join(__dirname, 'dist', 'server.js');
const compiledServerCjs = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(compiledServerCjs)) {
  console.log('🚀 Loading compiled production server (CJS) from:', compiledServerCjs);
  require('./dist/server.cjs');
} else if (fs.existsSync(compiledServerJs)) {
  console.log('🚀 Loading compiled production server (ESM) from:', compiledServerJs);
  import('./dist/server.js').catch(err => {
    console.error('❌ Failed to dynamically import ./dist/server.js:', err);
    process.exit(1);
  });
} else {
  console.error('\\n❌ ERROR: Compiled server bundle not found at ./dist/server.js or ./dist/server.cjs');
  console.error('👉 Did you forget to build the application first? Run: npm run build\\n');
  process.exit(1);
}
`;
      }
      zip.file('server.js', rootServerJsContent);

      // Create web.config entrypoint specifically for IIS/Plesk Windows Hosting
      let webConfigContent = '';
      if (fs.existsSync(path.join(process.cwd(), 'web.config'))) {
        webConfigContent = fs.readFileSync(path.join(process.cwd(), 'web.config'), 'utf8');
      } else {
        webConfigContent = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="LogFile" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^[a-zA-Z0-9_\\\\-]+\\.js\\.logs\\\\/\\d+\\.txt$" />
        </rule>
        <rule name="StaticContent" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" />
          </conditions>
          <action type="None" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="node_modules" />
          <add segment="node_modules" />
          <remove segment="src" />
          <add segment="src" />
        </hiddenSegments>
      </requestFiltering>
    </security>
    <directoryBrowse enabled="false" />
  </system.webServer>
</configuration>
`;
      }
      zip.file('web.config', webConfigContent);
      
      // 5. Create README_DEPLOY.md with clean configuration and run guide
      const readmeContent = `# Vidarbha Agro FPC Accounting System - Clean Cloud Deployment Guide

This package contains the complete pre-compiled production build of your React application and bundled Express backend server. No build/compilation tooling (such as Vite, TypeScript, or esbuild) is required on your server or hosting provider.

## Package Structure
* \`dist/\` - Pre-compiled React frontend and the unified backend server.
  * \`index.html\` - Web application browser entry point.
  * \`assets/\` - Pre-bundled client styling, javascript, CSS, and fonts.
  * \`server.cjs\` - Compiled and optimized backend Node.js Express server.
* \`server.js\` - ROOT ENTRYPOINT wrapper. Bootstraps and executes \`dist/server.cjs\`. Perfect for cPanel Node App Selector!
* \`package.json\` - NPM dependencies.
* \`.env.example\` - Database and credentials settings template.

---

## 🛠️ CRITICAL TROUBLESHOOTING: WHY AMI I GETTING A BLANK SCREEN / 404 FOR "/api/" CALLS?

If your browser loads but displays a blank screen or shows "UNEXPECTED TOKEN < ... IS NOT VALID JSON" coupled with **404 (Not Found)** for paths starting with \`/api/\` (e.g., \`/api/data/Companies\` or \`/api/v1/auth/login\`), it indicates:
> **The static web server is serving files from \`dist/\` directly, but the Node.js Express server is NOT running, OR requests are not being proxied to it!**
> Because there is no active Node.JS backend running, the static web server handles \`/api\` calls by serving your static \`index.html\` as a fallback. This triggers the JSON parsing failure.

### Here is how to fix it on different hosting environments:

### METHOD A: cPanel / Plesk shared Node hosting panel (e.g. Hostinger, GoDaddy, Namecheap etc.)
1. Login to your cPanel or custom hosting panel.
2. Search/click on **"Setup Node.js App"** (Phusion Passenger manager).
3. Click **"Create Application"**:
   - **Node.js version**: Choose 18, 20 or 22.
   - **Application Mode**: Production
   - **Application root**: Enter the folder path where you extracted this zip (should contain \`package.json\`, \`server.js\`, etc.)
   - **Application URL**: Select \`fpcerp.nicetyagrofoods.com\` (or your domain).
   - **Application startup file**: Enter **\`server.js\`** (this is the root file we auto-generated for you).
4. Click **Create** / **Start App**.
5. Scroll down to "Environment variables" in the Node App page, and add your database settings (see "Environment Setup" below).
6. Click **Run JS Command** or go to SSH terminal inside that folder and run:
   \`\`\`bash
   npm install --omit=dev
   \`\`\`
7. Click **Restart App** at the top. The server will automatically connect to your database and handle backend requests and static files smoothly on that domain!

---

### METHOD B: VPS (DigitalOcean, Linode, AWS EC2, Hostinger VPS, Ubuntu Server)
If you are running on a virtual private server, you must start the Node process and configure Nginx or Apache as a reverse proxy:

1. **PM2 Process Manager**: Run the server securely in the background:
   \`\`\`bash
   npm install -g pm2
   pm2 start server.js --name "fpc-erp-backend"
   pm2 save
   pm2 startup
   \`\`\`
2. **Nginx Reverse Proxy Configuration**: Ensure Nginx routes all incoming web requests to the Node server on port 3000:
   \`\`\`nginx
   server {
       listen 80;
       server_name fpcerp.nicetyagrofoods.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   \`\`\`

---

## 🔑 ENVIRONMENT SETUP (.env file in application root)
Create a file named \`.env\` in the same directory as \`package.json\`:

\`\`\`env
# Node environment
NODE_ENV="production"
PORT=3000

# MS SQL Server Details
DB_SERVER="188.241.62.103"
DB_NAME="FPCAccDB"
DB_USER="dbuser"
DB_PASSWORD="Fpc@2026#123"
DB_ENCRYPT="false"  # Change to true if your hosting requires SSL/TLS encrypted connection
\`\`\`
`;
      zip.file('README_DEPLOY.md', readmeContent);
      
      res.attachment('fpc-cloud-deployment-package.zip');
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      res.send(buffer);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  });

  // Helper functions to handle varying primary keys, company IDs, and data type coercion
  const NUMERIC_COLUMNS = new Set([
    'id', 'companyid', 'financialyearid', 'memberid', 'customerid', 'vendorid', 'vendor_id',
    'principalamount', 'outstanding', 'totalamount', 'quantity', 'unitprice', 'openingbalance',
    'added_by', 'modify_by', 'state_id', 'sharesallocated', 'facevalue', 
    'shareamount', 'landholding', 'tomemberid', 'shares',
    'interestrate', 'tenure', 'totalinterestpayable', 'totalpayable', 'amountpaid', 'loanid',
    'principalpaid', 'interestpaid', 'cost', 'value', 'deprrate', 'depreciationrate',
    'sellingpricemembers', 'sellingpricenonmembers', 'buyingprice', 'sgst', 'cgst', 'igst', 'minstock', 'maxcapacity',
    'journalentryid', 'accountid', 'debit', 'credit'
  ]);

  async function adjustLoanOutstanding(repayment: any) {
    try {
      const loanId = repayment.LoanId || repayment.loanid ? parseInt(repayment.LoanId || repayment.loanid, 10) : null;
      // Deduct only Principal amount from balance loan amount (default to amountpaid if not specified)
      const principalPaid = parseFloat(repayment.PrincipalPaid || repayment.principalpaid || repayment.AmountPaid || repayment.amountpaid || '0');
      
      if (!loanId || isNaN(principalPaid) || principalPaid <= 0) return;

      const lRows = await executeQuery(`SELECT Outstanding, TotalPayable, PrincipalAmount FROM Loans WHERE Id = ?`, [loanId]);
      if (lRows.length === 0) return;

      const currentOutstanding = parseFloat(lRows[0].Outstanding || lRows[0].outstanding || '0');
      const newOutstanding = Math.max(0, currentOutstanding - principalPaid);
      const newStatus = newOutstanding <= 0 ? 'Closed' : 'Active';

      await executeQuery(`UPDATE Loans SET Outstanding = ?, Status = ? WHERE id = ?`, [newOutstanding, newStatus, loanId]);
    } catch (err) {
      console.error("Failed to adjust loan outstanding:", err);
    }
  }

  async function syncAccountForEntity(table: string, data: any, companyId: any, id: any) {
      if (table.toLowerCase() === 'fpcmembers') {
          // Do NOT create duplicate FPC-${id} accounts.
          // FPC members are automatically synced to Vendors, which creates/updates a clean single VEN-${vendorId} account.
          return;
      }

      let resolvedCompanyId = companyId || data?.CompanyId || data?.COMPANYID || data?.companyid || data?.COMPANY_ID;
      if (resolvedCompanyId) {
          resolvedCompanyId = parseInt(String(resolvedCompanyId), 10);
      }
      let resolvedId = id || data?.Id || data?.id || data?.ID || data?.Vendor_ID;
      if (resolvedId) {
          resolvedId = parseInt(String(resolvedId), 10);
      }

      console.log(`[DEBUG syncAccountForEntity] Start table=${table}, companyId=${companyId}, resolved=${resolvedCompanyId}, id=${resolvedId}`);
      if (!resolvedCompanyId || isNaN(resolvedCompanyId) || !resolvedId || isNaN(resolvedId)) {
          console.log(`[DEBUG syncAccountForEntity] Skipping sync: invalid companyId or id`);
          return;
      }
      
      let accountName = '';
      let accountCode = '';
      let accountGroup = '';
      let accountType = '';
      let balanceType = '';
      let openingBal = parseFloat(data?.OpeningBalance || data?.opening_balance || data?.openingBalance || 0) || 0;
      let place = data?.Place || data?.place || data?.Vendor_address || data?.Customer_address || '';

      if (table.toLowerCase() === 'customers') {
          accountName = data?.CustomerName || data?.CustomerName || data?.Name || data?.customername;
          accountCode = `CUST-${resolvedId}`;
          accountGroup = 'Sundry Debtors';
          accountType = 'Asset';
          balanceType = 'Dr';
      } else if (table.toLowerCase() === 'vendors') {
          accountName = data?.Vendor_NAME || data?.VendorName || data?.Vendor_Name || data?.Name || data?.vendorname;
          accountCode = `VEN-${resolvedId}`;
          accountGroup = 'Sundry Creditors';
          accountType = 'Liability';
          balanceType = 'Cr';
      }

      console.log(`[DEBUG syncAccountForEntity] accountName=${accountName}, accountGroup=${accountGroup}`);
      if (!accountName) return;

      const isFpc = table.toLowerCase() === 'fpcmembers';
      let fpcIdValue = isFpc ? resolvedId : null;
      if (!isFpc && table.toLowerCase() === 'vendors') {
          fpcIdValue = data?.FPCMemberId || data?.fpcmemberid || data?.FPCMemberID || null;
      }

      try {
          const existing = await executeQuery(`SELECT * FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [accountCode, resolvedCompanyId]);
          console.log(`[DEBUG syncAccountForEntity] existing=`, existing);
          if (existing && existing.length > 0) {
              await executeQuery(`UPDATE Accounts SET Name = ?, OpeningBalance = ?, Place = ?, FPCMemberId = ? WHERE AccountCode = ? AND CompanyId = ?`, [accountName, openingBal, place, fpcIdValue, accountCode, resolvedCompanyId]);
          } else {
              console.log(`[DEBUG syncAccountForEntity] Running INSERT...`);
              await executeQuery(`INSERT INTO Accounts (CompanyId, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType, Place, FPCMemberId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                  [resolvedCompanyId, accountCode, accountName, accountGroup, accountType, openingBal, balanceType, place, fpcIdValue]);
              console.log(`[DEBUG syncAccountForEntity] INSERT complete!`);
          }
      } catch (e: any) {
          console.error("Error syncing account:", e);
      }
  }

  async function syncAccountForBank(data: any, companyId: any, id: any) {
      let resolvedCompanyId = companyId || data?.CompanyId || data?.COMPANYID || data?.companyid || data?.Company_Id;
      if (resolvedCompanyId) {
          resolvedCompanyId = parseInt(String(resolvedCompanyId), 10);
      }
      let resolvedId = id || data?.Id || data?.id || data?.ID || data?.BankAccountId;
      if (resolvedId) {
          resolvedId = parseInt(String(resolvedId), 10);
      }

      console.log(`[DEBUG syncAccountForBank] Start companyId=${companyId}, resolved=${resolvedCompanyId}, id=${resolvedId}`);
      if (!resolvedCompanyId || isNaN(resolvedCompanyId) || !resolvedId || isNaN(resolvedId)) {
          console.log(`[DEBUG syncAccountForBank] Skipping sync: invalid companyId or id`);
          return;
      }
      
      const accountName = `${data.BankName || 'Bank'} - ${data.AccountNo || ''}`;
      const accountCode = `BANK-${resolvedId}`;
      const accountGroup = data.AccountGroup || 'Bank Accounts';
      
      let accountType = 'Asset';
      if (accountGroup.toLowerCase().includes('od') || accountGroup.toLowerCase().includes('overdraft') || accountGroup.toLowerCase().includes('liability')) {
          accountType = 'Liability';
      }

      const balanceType = data.BalanceType || 'Dr';
      const openingBal = parseFloat(data.OpeningBalance) || 0;
      const place = data.Branch || '';

      if (!accountName) return;

      try {
          const existing = await executeQuery(`SELECT * FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [accountCode, resolvedCompanyId]);
          if (existing && existing.length > 0) {
              await executeQuery(`UPDATE Accounts SET Name = ?, AccountGroup = ?, AccountType = ?, OpeningBalance = ?, BalanceType = ?, Place = ? WHERE AccountCode = ? AND CompanyId = ?`, 
                  [accountName, accountGroup, accountType, openingBal, balanceType, place, accountCode, resolvedCompanyId]);
              
              const actId = existing[0].Id || existing[0].id;
              await executeQuery(`UPDATE BankAccounts SET AccountId = ? WHERE Id = ?`, [actId, resolvedId]);
          } else {
              await executeQuery(`INSERT INTO Accounts (CompanyId, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType, Place) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                  [resolvedCompanyId, accountCode, accountName, accountGroup, accountType, openingBal, balanceType, place]);
              
              const newAcc = await executeQuery(`SELECT Id FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [accountCode, resolvedCompanyId]);
              if (newAcc && newAcc.length > 0) {
                  const actId = newAcc[0].Id || newAcc[0].id;
                  await executeQuery(`UPDATE BankAccounts SET AccountId = ? WHERE Id = ?`, [actId, resolvedId]);
              }
          }
      } catch (e) {
          console.error("Error syncing bank account to general accounting ledger:", e);
      }
  }

  function formatSqlDate(dateStr: any): string {
      if (!dateStr || typeof dateStr !== 'string') return new Date().toISOString().split('T')[0];
      const trimmed = dateStr.trim();
      const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
      if (dmyMatch) {
         return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
      }
      return trimmed;
  }

  async function syncPurchaseInvoiceToJournal(data: any, companyId: any, invoiceId: any) {
      if (!companyId || !invoiceId) return;
      try {
          const vendorId = data.VendorId;
          if (!vendorId) return;
          const vendorAccountCode = `VEN-${vendorId}`;
          const vendorAccResult = await executeQuery(`SELECT * FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [vendorAccountCode, companyId]);
          let vendorAccountId = null;
          if (vendorAccResult && vendorAccResult.length > 0) {
              vendorAccountId = vendorAccResult[0].Id || vendorAccResult[0].id;
          } else {
              // Wait, the account MUST exist since we just synced vendors, but if not we can't create journal entry
              return;
          }

          const purchasesAccResult = await executeQuery(`SELECT * FROM Accounts WHERE Name = 'Purchases' AND CompanyId = ?`, [companyId]);
          let purchasesAccountId = null;
          if (purchasesAccResult && purchasesAccResult.length > 0) {
              purchasesAccountId = purchasesAccResult[0].Id || purchasesAccResult[0].id;
          } else {
              const accCode = '4001';
              await executeQuery(`INSERT INTO Accounts (CompanyId, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType) VALUES (?, ?, ?, ?, ?, 0, ?)`, 
                [companyId, accCode, 'Purchases', 'Direct Expenses', 'Expense', 'Dr']);
              
              const pAcc = await executeQuery(`SELECT * FROM Accounts WHERE Name = 'Purchases' AND CompanyId = ?`, [companyId]);
              if (pAcc && pAcc.length > 0) {
                 purchasesAccountId = pAcc[0].Id || pAcc[0].id;
              }
          }

          if (!purchasesAccountId) return;

          const amount = parseFloat(data.TotalAmount) || 0;
          if (amount <= 0) return;

          const entryNumber = data.InvoiceNumber || `PI-${invoiceId}`;
          const entryDate = formatSqlDate(data.InvoiceDate);
          const ref = `PI-${invoiceId}`;

          const existingJe = await executeQuery(`SELECT * FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          
          let journalEntryId = null;
          if (existingJe && existingJe.length > 0) {
              journalEntryId = existingJe[0].Id || existingJe[0].id;
              await executeQuery(`UPDATE JournalEntries SET TotalAmount = ?, EntryDate = ?, EntryNumber = ? WHERE Id = ?`, [amount, entryDate, entryNumber, journalEntryId]);
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [journalEntryId]);
          } else {
              if (mssqlPool) {
                  const jeResult = await mssqlPool.request().query(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) OUTPUT INSERTED.Id VALUES (${companyId}, '${entryNumber}', '${ref}', 'Being purchase invoice booked', ${amount}, 'Posted', '${entryDate}')`);
                  journalEntryId = jeResult.recordset[0].Id;
              } else {
                  const info = sqliteDb.prepare(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(companyId, entryNumber, ref, 'Being purchase invoice booked', amount, 'Posted', entryDate);
                  journalEntryId = info.lastInsertRowid;
              }
          }

          if (mssqlPool) {
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${purchasesAccountId}, 'Purchase', ${amount}, 0)`);
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${vendorAccountId}, 'Vendor balance', 0, ${amount})`);
          } else {
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, purchasesAccountId, 'Purchase', amount, 0);
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, vendorAccountId, 'Vendor balance', 0, amount);
          }

      } catch (e) {
          console.error("Error syncing purchase invoice to journal", e);
      }
  }

  async function syncSalesInvoiceToJournal(data: any, companyId: any, invoiceId: any) {
      if (!companyId || !invoiceId) return;
      try {
          const customerId = data.CustomerId;
          if (!customerId) return;
          const customerAccountCode = `CUST-${customerId}`;
          const customerAccResult = await executeQuery(`SELECT * FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [customerAccountCode, companyId]);
          let customerAccountId = null;
          if (customerAccResult && customerAccResult.length > 0) {
              customerAccountId = customerAccResult[0].Id || customerAccResult[0].id;
          } else {
              return;
          }

          const salesAccResult = await executeQuery(`SELECT * FROM Accounts WHERE Name = 'Sales' AND CompanyId = ?`, [companyId]);
          let salesAccountId = null;
          if (salesAccResult && salesAccResult.length > 0) {
              salesAccountId = salesAccResult[0].Id || salesAccResult[0].id;
          } else {
              const accCode = '3001';
              await executeQuery(`INSERT INTO Accounts (CompanyId, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType) VALUES (?, ?, ?, ?, ?, 0, ?)`, 
                [companyId, accCode, 'Sales', 'Direct Incomes', 'Revenue', 'Cr']);
              
              const sAcc = await executeQuery(`SELECT * FROM Accounts WHERE Name = 'Sales' AND CompanyId = ?`, [companyId]);
              if (sAcc && sAcc.length > 0) {
                 salesAccountId = sAcc[0].Id || sAcc[0].id;
              }
          }

          if (!salesAccountId) return;

          const amount = parseFloat(data.TotalAmount) || 0;
          if (amount <= 0) return;

          const entryNumber = data.InvoiceNumber || `SI-${invoiceId}`;
          const entryDate = formatSqlDate(data.InvoiceDate);
          const ref = `SI-${invoiceId}`;

          const existingJe = await executeQuery(`SELECT * FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          
          let journalEntryId = null;
          if (existingJe && existingJe.length > 0) {
              journalEntryId = existingJe[0].Id || existingJe[0].id;
              await executeQuery(`UPDATE JournalEntries SET TotalAmount = ?, EntryDate = ?, EntryNumber = ? WHERE Id = ?`, [amount, entryDate, entryNumber, journalEntryId]);
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [journalEntryId]);
          } else {
              if (mssqlPool) {
                  const jeResult = await mssqlPool.request().query(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) OUTPUT INSERTED.Id VALUES (${companyId}, '${entryNumber}', '${ref}', 'Being sales invoice booked', ${amount}, 'Posted', '${entryDate}')`);
                  journalEntryId = jeResult.recordset[0].Id;
              } else {
                  const info = sqliteDb.prepare(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(companyId, entryNumber, ref, 'Being sales invoice booked', amount, 'Posted', entryDate);
                  journalEntryId = info.lastInsertRowid;
              }
          }

          if (mssqlPool) {
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${customerAccountId}, 'Customer balance', ${amount}, 0)`);
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${salesAccountId}, 'Sales', 0, ${amount})`);
          } else {
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, customerAccountId, 'Customer balance', amount, 0);
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, salesAccountId, 'Sales', 0, amount);
          }

      } catch (e) {
          console.error("Error syncing sales invoice to journal", e);
      }
  }

  async function unsyncInvoiceFromJournal(refPrefix: string, invoiceId: any, companyId: any) {
      if (!companyId || !invoiceId) return;
      try {
          const ref = `${refPrefix}-${invoiceId}`;
          const entries = await executeQuery(`SELECT Id FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          for (const entry of entries) {
              const id = entry.Id || entry.id;
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [id]);
              await executeQuery(`DELETE FROM JournalEntries WHERE Id = ?`, [id]);
          }
      } catch (e) {
          console.error(`Error unsyncing ${refPrefix} invoice from journal`, e);
      }
  }

  async function syncSalesReturnToJournal(data: any, companyId: any, returnId: any) {
      if (!companyId || !returnId) return;
      try {
          const customerId = data.CustomerId;
          if (!customerId) return;
          const customerAccountCode = `CUST-${customerId}`;
          const customerAccResult = await executeQuery(`SELECT * FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [customerAccountCode, companyId]);
          let customerAccountId = null;
          if (customerAccResult && customerAccResult.length > 0) {
              customerAccountId = customerAccResult[0].Id || customerAccResult[0].id;
          } else {
              return;
          }

          const salesAccResult = await executeQuery(`SELECT * FROM Accounts WHERE Name = 'Sales' AND CompanyId = ?`, [companyId]);
          let salesAccountId = null;
          if (salesAccResult && salesAccResult.length > 0) {
              salesAccountId = salesAccResult[0].Id || salesAccResult[0].id;
          } else {
              const accCode = '3001';
              await executeQuery(`INSERT INTO Accounts (CompanyId, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType) VALUES (?, ?, ?, ?, ?, 0, ?)`, 
                [companyId, accCode, 'Sales', 'Direct Incomes', 'Revenue', 'Cr']);
              
              const sAcc = await executeQuery(`SELECT * FROM Accounts WHERE Name = 'Sales' AND CompanyId = ?`, [companyId]);
              if (sAcc && sAcc.length > 0) {
                  salesAccountId = sAcc[0].Id || sAcc[0].id;
              }
          }

          if (!salesAccountId) return;

          const amount = parseFloat(data.TotalAmount) || 0;
          if (amount <= 0) return;

          const entryNumber = data.ReturnNumber || `SR-${returnId}`;
          const entryDate = formatSqlDate(data.ReturnDate);
          const ref = `SR-${returnId}`;

          const existingJe = await executeQuery(`SELECT * FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          
          let journalEntryId = null;
          if (existingJe && existingJe.length > 0) {
              journalEntryId = existingJe[0].Id || existingJe[0].id;
              await executeQuery(`UPDATE JournalEntries SET TotalAmount = ?, EntryDate = ?, EntryNumber = ? WHERE Id = ?`, [amount, entryDate, entryNumber, journalEntryId]);
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [journalEntryId]);
          } else {
              if (mssqlPool) {
                   const jeResult = await mssqlPool.request().query(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) OUTPUT INSERTED.Id VALUES (${companyId}, '${entryNumber}', '${ref}', 'Being sales return credit note booked', ${amount}, 'Posted', '${entryDate}')`);
                   journalEntryId = jeResult.recordset[0].Id;
              } else {
                   const info = sqliteDb.prepare(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(companyId, entryNumber, ref, 'Being sales return credit note booked', amount, 'Posted', entryDate);
                   journalEntryId = info.lastInsertRowid;
              }
          }

          if (mssqlPool) {
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${salesAccountId}, 'Sales Returns', ${amount}, 0)`);
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${customerAccountId}, 'Customer balance (CR)', 0, ${amount})`);
          } else {
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, salesAccountId, 'Sales Returns', amount, 0);
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, customerAccountId, 'Customer balance (CR)', 0, amount);
          }

      } catch (e) {
          console.error("Error syncing sales return to journal", e);
      }
  }

  async function syncPurchaseReturnToJournal(data: any, companyId: any, returnId: any) {
      if (!companyId || !returnId) return;
      try {
          const vendorId = data.VendorId;
          if (!vendorId) return;
          const vendorAccountCode = `VEN-${vendorId}`;
          const vendorAccResult = await executeQuery(`SELECT * FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [vendorAccountCode, companyId]);
          let vendorAccountId = null;
          if (vendorAccResult && vendorAccResult.length > 0) {
              vendorAccountId = vendorAccResult[0].Id || vendorAccResult[0].id;
          } else {
              return;
          }

          const purchasesAccResult = await executeQuery(`SELECT * FROM Accounts WHERE Name = 'Purchases' AND CompanyId = ?`, [companyId]);
          let purchasesAccountId = null;
          if (purchasesAccResult && purchasesAccResult.length > 0) {
              purchasesAccountId = purchasesAccResult[0].Id || purchasesAccResult[0].id;
          } else {
              const accCode = '4001';
              await executeQuery(`INSERT INTO Accounts (CompanyId, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType) VALUES (?, ?, ?, ?, ?, 0, ?)`, 
                [companyId, accCode, 'Purchases', 'Direct Expenses', 'Expense', 'Dr']);
              
              const pAcc = await executeQuery(`SELECT * FROM Accounts WHERE Name = 'Purchases' AND CompanyId = ?`, [companyId]);
              if (pAcc && pAcc.length > 0) {
                  purchasesAccountId = pAcc[0].Id || pAcc[0].id;
              }
          }

          if (!purchasesAccountId) return;

          const amount = parseFloat(data.TotalAmount) || 0;
          if (amount <= 0) return;

          const entryNumber = data.ReturnNumber || `PR-${returnId}`;
          const entryDate = formatSqlDate(data.ReturnDate);
          const ref = `PR-${returnId}`;

          const existingJe = await executeQuery(`SELECT * FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          
          let journalEntryId = null;
          if (existingJe && existingJe.length > 0) {
              journalEntryId = existingJe[0].Id || existingJe[0].id;
              await executeQuery(`UPDATE JournalEntries SET TotalAmount = ?, EntryDate = ?, EntryNumber = ? WHERE Id = ?`, [amount, entryDate, entryNumber, journalEntryId]);
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [journalEntryId]);
          } else {
              if (mssqlPool) {
                   const jeResult = await mssqlPool.request().query(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) OUTPUT INSERTED.Id VALUES (${companyId}, '${entryNumber}', '${ref}', 'Being purchase return debit note booked', ${amount}, 'Posted', '${entryDate}')`);
                   journalEntryId = jeResult.recordset[0].Id;
              } else {
                   const info = sqliteDb.prepare(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(companyId, entryNumber, ref, 'Being purchase return debit note booked', amount, 'Posted', entryDate);
                   journalEntryId = info.lastInsertRowid;
              }
          }

          if (mssqlPool) {
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${vendorAccountId}, 'Vendor balance (DR)', ${amount}, 0)`);
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${purchasesAccountId}, 'Purchase Returns', 0, ${amount})`);
          } else {
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, vendorAccountId, 'Vendor balance (DR)', amount, 0);
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, purchasesAccountId, 'Purchase Returns', 0, amount);
          }

      } catch (e) {
          console.error("Error syncing purchase return to journal", e);
      }
  }

  async function syncCashPaymentToJournal(data: any, companyId: any, paymentId: any) {
      if (!companyId || !paymentId) return;
      try {
          const amount = parseFloat(data.Amount) || 0;
          if (amount <= 0) return;

          const entryNumber = data.VoucherNo || `CP-${paymentId}`;
          const entryDate = formatSqlDate(data.PaymentDate);
          const ref = `CP-${paymentId}`;

          const existingJe = await executeQuery(`SELECT * FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          
          let journalEntryId = null;
          if (existingJe && existingJe.length > 0) {
              journalEntryId = existingJe[0].Id || existingJe[0].id;
              await executeQuery(`UPDATE JournalEntries SET TotalAmount = ?, EntryDate = ?, EntryNumber = ? WHERE Id = ?`, [amount, entryDate, entryNumber, journalEntryId]);
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [journalEntryId]);
          } else {
              if (mssqlPool) {
                   const jeResult = await mssqlPool.request().query(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) OUTPUT INSERTED.Id VALUES (${companyId}, '${entryNumber}', '${ref}', '${data.Narration || 'Cash Payment'}', ${amount}, 'Posted', '${entryDate}')`);
                   journalEntryId = jeResult.recordset[0].Id;
              } else {
                   const info = sqliteDb.prepare(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(companyId, entryNumber, ref, data.Narration || 'Cash Payment', amount, 'Posted', entryDate);
                   journalEntryId = info.lastInsertRowid;
              }
          }

          if (!journalEntryId) return;

                  if (mssqlPool) {
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${data.AccountId}, '${data.Narration || 'Cash Payment'}', ${amount}, 0)`);
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${data.CashAccountId}, '${data.Narration || 'Cash Payment'}', 0, ${amount})`);
          } else {
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, data.AccountId, data.Narration || 'Cash Payment', amount, 0);
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, data.CashAccountId, data.Narration || 'Cash Payment', 0, amount);
          }
      } catch (e) {
          console.error("Error syncing cash payment to journal", e);
      }
  }

  async function syncBankPaymentToJournal(data: any, companyId: any, paymentId: any) {
      if (!companyId || !paymentId) return;
      try {
          const amount = parseFloat(data.Amount) || 0;
          if (amount <= 0) return;

          const entryNumber = data.VoucherNo || `BP-${paymentId}`;
          const entryDate = formatSqlDate(data.PaymentDate);
          const ref = `BP-${paymentId}`;

          const existingJe = await executeQuery(`SELECT * FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          
          let journalEntryId = null;
          if (existingJe && existingJe.length > 0) {
              journalEntryId = existingJe[0].Id || existingJe[0].id;
              await executeQuery(`UPDATE JournalEntries SET TotalAmount = ?, EntryDate = ?, EntryNumber = ? WHERE Id = ?`, [amount, entryDate, entryNumber, journalEntryId]);
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [journalEntryId]);
          } else {
              if (mssqlPool) {
                   const jeResult = await mssqlPool.request().query(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) OUTPUT INSERTED.Id VALUES (${companyId}, '${entryNumber}', '${ref}', '${data.Narration || 'Bank Payment'}', ${amount}, 'Posted', '${entryDate}')`);
                   journalEntryId = jeResult.recordset[0].Id;
              } else {
                   const info = sqliteDb.prepare(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(companyId, entryNumber, ref, data.Narration || 'Bank Payment', amount, 'Posted', entryDate);
                   journalEntryId = info.lastInsertRowid;
              }
          }

          if (!journalEntryId) return;

          if (mssqlPool) {
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${data.AccountId}, '${data.Narration || 'Bank Payment'}', ${amount}, 0)`);
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${data.BankAccountId}, '${data.Narration || 'Bank Payment'}', 0, ${amount})`);
          } else {
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, data.AccountId, data.Narration || 'Bank Payment', amount, 0);
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, data.BankAccountId, data.Narration || 'Bank Payment', 0, amount);
          }
      } catch (e) {
          console.error("Error syncing bank payment to journal", e);
      }
  }

  async function syncBankReceiptToJournal(data: any, companyId: any, receiptId: any) {
      if (!companyId || !receiptId) return;
      try {
          const amount = parseFloat(data.Amount) || 0;
          if (amount <= 0) return;

          const entryNumber = data.VoucherNo || `BR-${receiptId}`;
          const entryDate = formatSqlDate(data.ReceiptDate);
          const ref = `BR-${receiptId}`;

          const existingJe = await executeQuery(`SELECT * FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          
          let journalEntryId = null;
          if (existingJe && existingJe.length > 0) {
              journalEntryId = existingJe[0].Id || existingJe[0].id;
              await executeQuery(`UPDATE JournalEntries SET TotalAmount = ?, EntryDate = ?, EntryNumber = ? WHERE Id = ?`, [amount, entryDate, entryNumber, journalEntryId]);
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [journalEntryId]);
          } else {
              if (mssqlPool) {
                   const jeResult = await mssqlPool.request().query(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) OUTPUT INSERTED.Id VALUES (${companyId}, '${entryNumber}', '${ref}', '${data.Narration || 'Bank Receipt'}', ${amount}, 'Posted', '${entryDate}')`);
                   journalEntryId = jeResult.recordset[0].Id;
              } else {
                   const info = sqliteDb.prepare(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(companyId, entryNumber, ref, data.Narration || 'Bank Receipt', amount, 'Posted', entryDate);
                   journalEntryId = info.lastInsertRowid;
              }
          }

          if (!journalEntryId) return;

          if (mssqlPool) {
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${data.BankAccountId}, '${data.Narration || 'Bank Receipt'}', ${amount}, 0)`);
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${data.AccountId}, '${data.Narration || 'Bank Receipt'}', 0, ${amount})`);
          } else {
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, data.BankAccountId, data.Narration || 'Bank Receipt', amount, 0);
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, data.AccountId, data.Narration || 'Bank Receipt', 0, amount);
          }
      } catch (e) {
          console.error("Error syncing bank receipt to journal", e);
      }
  }

  async function syncCashReceiptToJournal(data: any, companyId: any, receiptId: any) {
      if (!companyId || !receiptId) return;
      try {
          const amount = parseFloat(data.Amount) || 0;
          if (amount <= 0) return;

          const entryNumber = data.VoucherNo || `CR-${receiptId}`;
          const entryDate = formatSqlDate(data.ReceiptDate);
          const ref = `CR-${receiptId}`;

          const existingJe = await executeQuery(`SELECT * FROM JournalEntries WHERE Reference = ? AND CompanyId = ?`, [ref, companyId]);
          
          let journalEntryId = null;
          if (existingJe && existingJe.length > 0) {
              journalEntryId = existingJe[0].Id || existingJe[0].id;
              await executeQuery(`UPDATE JournalEntries SET TotalAmount = ?, EntryDate = ?, EntryNumber = ? WHERE Id = ?`, [amount, entryDate, entryNumber, journalEntryId]);
              await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [journalEntryId]);
          } else {
              if (mssqlPool) {
                   const jeResult = await mssqlPool.request().query(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) OUTPUT INSERTED.Id VALUES (${companyId}, '${entryNumber}', '${ref}', '${data.Narration || 'Cash Receipt'}', ${amount}, 'Posted', '${entryDate}')`);
                   journalEntryId = jeResult.recordset[0].Id;
              } else {
                   const info = sqliteDb.prepare(`INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(companyId, entryNumber, ref, data.Narration || 'Cash Receipt', amount, 'Posted', entryDate);
                   journalEntryId = info.lastInsertRowid;
              }
          }

          if (!journalEntryId) return;

          // Debit Cash Account (CashAccountId), Credit Target Account (AccountId)
          if (mssqlPool) {
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${data.CashAccountId}, '${data.Narration || 'Cash Receipt'}', ${amount}, 0)`);
              await mssqlPool.request().query(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (${journalEntryId}, ${data.AccountId}, '${data.Narration || 'Cash Receipt'}', 0, ${amount})`);
          } else {
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, data.CashAccountId, data.Narration || 'Cash Receipt', amount, 0);
              sqliteDb.prepare(`INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`).run(journalEntryId, data.AccountId, data.Narration || 'Cash Receipt', 0, amount);
          }
      } catch (e) {
          console.error("Error syncing cash receipt to journal", e);
      }
  }

  async function updateMemberShares(memberId: number, count: number, action: 'add' | 'subtract') {
    const mRows = await executeQuery(`SELECT SharesAllocated, FaceValue FROM FPCMembers WHERE Id = ?`, [memberId]);
    if (mRows.length === 0) return;
    const currentShares = parseInt(mRows[0].SharesAllocated || mRows[0].sharesallocated || '0', 10);
    const faceValue = parseFloat(mRows[0].FaceValue || mRows[0].facevalue || '100');
    
    let newShares = currentShares;
    if (action === 'add') {
      newShares += count;
    } else {
      newShares = Math.max(0, currentShares - count);
    }
    const newAmount = newShares * faceValue;
    
    await executeQuery(`UPDATE FPCMembers SET SharesAllocated = ?, ShareAmount = ? WHERE Id = ?`, [newShares, newAmount, memberId]);
  }

  async function adjustMemberShares(transaction: any) {
    try {
      const type = transaction.TransactionType || transaction.transactiontype;
      const sharesNum = parseInt(transaction.Shares || transaction.shares, 10);
      const mId = transaction.MemberId || transaction.memberid ? parseInt(transaction.MemberId || transaction.memberid, 10) : null;
      const toMId = transaction.ToMemberId || transaction.tomemberid ? parseInt(transaction.ToMemberId || transaction.tomemberid, 10) : null;
      
      if (isNaN(sharesNum) || sharesNum <= 0) return;

      if (type === 'Allotment' && mId) {
        await updateMemberShares(mId, sharesNum, 'add');
      } else if (type === 'Transfer' && mId && toMId) {
        await updateMemberShares(mId, sharesNum, 'subtract');
        await updateMemberShares(toMId, sharesNum, 'add');
      } else if (type === 'Surrender' && mId) {
        await updateMemberShares(mId, sharesNum, 'subtract');
      }
    } catch (err) {
      console.error("Failed to adjust member shares:", err);
    }
  }

  async function syncFPCMemberToVendor(data: any, companyId: any) {
    try {
      if (!data) return;
      
      const resolvedCompanyId = companyId || data.CompanyId || data.COMPANYID || data.companyid || null;
      const farmerName = data.FarmerName || data.farmername || '';
      if (!farmerName) {
        console.log("[syncFPCMemberToVendor] FarmerName is empty. Skipping vendor sync.");
        return;
      }
      
      const memberId = data.MemberId || data.memberid || '';
      const fpcMemberId = data.Id || data.id || data.ID || null;
      
      // Look up if a vendor already exists
      let existingVendor = null;
      if (fpcMemberId) {
        // Find by FPCMemberId first (most reliable!)
        const rows = await executeQuery(
          `SELECT * FROM Vendors WHERE FPCMemberId = ? AND (COMPANYID = ? OR COMPANYID IS NULL)`, 
          [fpcMemberId, resolvedCompanyId]
        );
        if (rows && rows.length > 0) {
          existingVendor = rows[0];
        }
      }
      
      if (!existingVendor && memberId) {
        // Find by registration_no (which stores FPC Member ID)
        const rows = await executeQuery(
          `SELECT * FROM Vendors WHERE registration_no = ? AND (COMPANYID = ? OR COMPANYID IS NULL)`, 
          [memberId, resolvedCompanyId]
        );
        if (rows && rows.length > 0) {
          existingVendor = rows[0];
        }
      }
      
      if (!existingVendor) {
        // Fallback to name match
        const nameRows = await executeQuery(
          `SELECT * FROM Vendors WHERE Vendor_NAME = ? AND (COMPANYID = ? OR COMPANYID IS NULL)`, 
          [farmerName, resolvedCompanyId]
        );
        if (nameRows && nameRows.length > 0) {
          existingVendor = nameRows[0];
        }
      }
      
      // Build address
      const addrParts = [
        data.Address || data.address,
        data.Village || data.village,
        data.Panchayat || data.panchayat,
        data.Tehsil || data.tehsil,
        data.District || data.district,
        data.PINCode || data.pincode || data.PINcode || data.PinCode
      ].filter(Boolean);
      const vendorAddress = addrParts.join(', ');
      
      // Build business details with available FPC member columns
      const bizParts = [];
      if (data.MajorCrops || data.majorcrops) {
        bizParts.push(`Major Crops: ${data.MajorCrops || data.majorcrops}`);
      }
      if (data.LandHolding !== undefined && data.LandHolding !== null && data.LandHolding !== '') {
        bizParts.push(`Land Holding: ${data.LandHolding} Acres`);
      }
      if (data.IrrigationType || data.irrigationtype) {
        bizParts.push(`Irrigation: ${data.IrrigationType || data.irrigationtype}`);
      }
      if (data.FatherSpouse || data.fatherspouse) {
        bizParts.push(`Father/Spouse Name: ${data.FatherSpouse || data.fatherspouse}`);
      }
      if (data.SharesAllocated !== undefined && data.SharesAllocated !== null && data.SharesAllocated !== '') {
        bizParts.push(`FPC Shares: ${data.SharesAllocated} (Value: ₹${data.ShareAmount || 0})`);
      }
      const businessDetails = bizParts.length > 0 ? bizParts.join('\n') : 'FPC Member';

      const getStateCode = (stateName: string) => {
          if (!stateName) return '';
          const clean = stateName.toLowerCase().trim();
          if (clean.includes('maharashtra') || clean === 'mh' || clean === '27') return '27';
          if (clean.includes('gujarat') || clean === 'gj' || clean === '24') return '24';
          if (clean.includes('madhya pradesh') || clean === 'mp' || clean === '23') return '23';
          if (clean.includes('karnataka') || clean === 'ka' || clean === '29') return '29';
          if (clean.includes('goa') || clean === 'ga' || clean === '30') return '30';
          if (clean.includes('andhra pradesh') || clean === 'ap' || clean === '37') return '37';
          if (clean.includes('telangana') || clean === 'tg' || clean === 'ts' || clean === '36') return '36';
          if (clean.includes('rajasthan') || clean === 'rj' || clean === '08') return '08';
          if (clean.includes('delhi') || clean === 'dl' || clean === '07') return '07';
          if (clean.includes('uttar pradesh') || clean === 'up' || clean === '09') return '09';
          if (clean.includes('punjab') || clean === 'pb' || clean === '03') return '03';
          if (clean.includes('haryana') || clean === 'hr' || clean === '06') return '06';
          if (clean.includes('tamil nadu') || clean === 'tn' || clean === '33') return '33';
          if (clean.includes('west bengal') || clean === 'wb' || clean === '19') return '19';
          if (clean.includes('kerala') || clean === 'kl' || clean === '32') return '32';
          if (/^\d{2}$/.test(clean)) return clean;
          return '';
      };
      
      const phoneNo = data.Phone || data.phone || '';
      const aadharNo = data.AadharNo || data.aadhar_no || data.aadharno || '';
      const stateName = data.State || data.state || '';
      const stateCode = getStateCode(stateName);
      const place = data.Village || data.village || data.Place || data.place || '';
      
      if (existingVendor) {
        // Update existing vendor
        const vId = existingVendor.Vendor_ID || existingVendor.Vendor_Id || existingVendor.vendor_id || existingVendor.Id || existingVendor.id || existingVendor.ID;
        console.log(`[syncFPCMemberToVendor] Updating matched Vendor with Vendor_ID = ${vId}`);
        await executeQuery(
          `UPDATE Vendors SET 
            Vendor_NAME = ?, 
            registration_no = ?, 
            Vendor_address = ?, 
            Place = ?, 
            phone_no = ?, 
            aadhar_no = ?, 
            contact_person = ?, 
            state_name = ?, 
            state_code = ?, 
            business_details = ?, 
            ISACTIVE = 'Y',
            FPCMemberId = ?
           WHERE Vendor_ID = ?`,
          [
            farmerName, 
            memberId, 
            vendorAddress, 
            place, 
            phoneNo, 
            aadharNo, 
            farmerName, 
            stateName, 
            stateCode, 
            businessDetails, 
            fpcMemberId,
            vId
          ]
        );
        // Also trigger account sync for this updated vendor!
        // Retrieve full updated vendor row to be sure
        const updatedVendors = await executeQuery(`SELECT * FROM Vendors WHERE Vendor_ID = ?`, [vId]);
        if (updatedVendors && updatedVendors.length > 0) {
            await syncAccountForEntity('vendors', updatedVendors[0], resolvedCompanyId, vId);
        }
      } else {
        // Add new vendor
        console.log(`[syncFPCMemberToVendor] Inserting a new Vendor for FPC member ${farmerName}`);
        
        let insertedVendorId = null;
        if (mssqlPool) {
            const request = mssqlPool.request();
            request.input('COMPANYID', resolvedCompanyId);
            request.input('Vendor_NAME', farmerName);
            request.input('registration_no', memberId);
            request.input('Vendor_address', vendorAddress);
            request.input('Place', place);
            request.input('phone_no', phoneNo);
            request.input('aadhar_no', aadharNo);
            request.input('contact_person', farmerName);
            request.input('state_name', stateName);
            request.input('state_code', stateCode);
            request.input('business_details', businessDetails);
            request.input('ISACTIVE', 'Y');
            request.input('FPCMemberId', fpcMemberId);
            
            const result = await request.query(`
                INSERT INTO Vendors (COMPANYID, Vendor_NAME, registration_no, Vendor_address, Place, phone_no, aadhar_no, contact_person, state_name, state_code, business_details, ISACTIVE, FPCMemberId)
                OUTPUT INSERTED.Vendor_ID
                VALUES (@COMPANYID, @Vendor_NAME, @registration_no, @Vendor_address, @Place, @phone_no, @aadhar_no, @contact_person, @state_name, @state_code, @business_details, 'Y', @FPCMemberId)
            `);
            if (result.recordset && result.recordset.length > 0) {
                insertedVendorId = result.recordset[0].Vendor_ID;
            }
        } else {
            const result = sqliteDb.prepare(`
                INSERT INTO Vendors (COMPANYID, Vendor_NAME, registration_no, Vendor_address, Place, phone_no, aadhar_no, contact_person, state_name, state_code, business_details, ISACTIVE, FPCMemberId)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', ?)
            `).run(resolvedCompanyId, farmerName, memberId, vendorAddress, place, phoneNo, aadharNo, farmerName, stateName, stateCode, businessDetails, fpcMemberId);
            insertedVendorId = result.lastInsertRowid;
        }
        
        if (insertedVendorId) {
            const newVendors = await executeQuery(`SELECT * FROM Vendors WHERE Vendor_ID = ?`, [insertedVendorId]);
            if (newVendors && newVendors.length > 0) {
                await syncAccountForEntity('vendors', newVendors[0], resolvedCompanyId, insertedVendorId);
            }
        }
      }
    } catch (e) {
      console.error("Error in syncFPCMemberToVendor:", e);
    }
  }

  function normalizeValueForBind(colName: string, val: any): any {
    if (val === '' || val === undefined || val === null) {
      return null;
    }
    if (NUMERIC_COLUMNS.has(colName.toLowerCase())) {
      if (typeof val === 'string') {
        const parsed = Number(val);
        if (!isNaN(parsed)) {
          return parsed;
        }
        return null;
      }
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
      if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
      }
    }
    return val;
  }

  // Real API - Dashboard Stats
  apiRouter.get("/dashboard/stats", async (req, res) => {
    try {
      const companyId = req.query.CompanyId || 1;
      let totalSalesVal = 0;
      let receivablesVal = 0;
      let membersCountVal = 0;
      let inventoryVal = 0;
      const realRevenueData: any[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // 1. Members count
      try {
        const countRow = await executeGet("SELECT COUNT(*) as count FROM FPCMembers WHERE CompanyId = ? OR CompanyId IS NULL", [companyId]);
        membersCountVal = countRow ? (countRow.count || countRow.COUNT || 0) : 0;
      } catch (e) {
        console.error("Error getting members count:", e);
      }

      // 2. Receivables Logic (True Accounting Balance)
      try {
        const opBalRows = await executeQuery("SELECT SUM(OpeningBalance) as sumOp FROM Accounts WHERE AccountGroup = 'Sundry Debtors' AND (CompanyId = ? OR CompanyId IS NULL)", [companyId]);
        let opBal = parseFloat(opBalRows[0]?.sumOp || opBalRows[0]?.sumop || 0) || 0;

        const journalRows = await executeQuery(`
          SELECT SUM(jl.Debit) as sumDebit, SUM(jl.Credit) as sumCredit 
          FROM JournalLines jl 
          JOIN JournalEntries je ON jl.JournalEntryId = je.Id OR jl.JournalEntryId = je.id
          JOIN Accounts a ON jl.AccountId = a.Id OR jl.AccountId = a.id
          WHERE a.AccountGroup = 'Sundry Debtors' AND je.CompanyId = ?
        `, [companyId]);
        
        let jDebit = parseFloat(journalRows[0]?.sumDebit || journalRows[0]?.sumdebit || 0) || 0;
        let jCredit = parseFloat(journalRows[0]?.sumCredit || journalRows[0]?.sumcredit || 0) || 0;
        
        receivablesVal = opBal + jDebit - jCredit;
      } catch (err) {
        console.error("Error calculating true receivables", err);
      }

      // 3. Sales Stats
      try {
        const salesRows = await executeQuery("SELECT TotalAmount, Status, InvoiceDate FROM SalesInvoices WHERE CompanyId = ?", [companyId]);
        for (const row of salesRows) {
          const amt = parseFloat(row.TotalAmount || row.totalamount || 0);
          if (!isNaN(amt)) {
            totalSalesVal += amt;
          }
        }

        // Helper to parse dates (handles YYYY-MM-DD and DD/MM/YYYY, etc)
        const parseChartDate = (dateStr: string) => {
          if (!dateStr) return null;
          // if DD/MM/YYYY or DD-MM-YYYY
          if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(dateStr)) {
            const parts = dateStr.substring(0, 10).split(/[\/\-]/);
            if (parts[2].length === 4) { // ensuring it is not YYYY-MM-DD
               return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            }
          }
          // YYYY-MM-DD or other valid date
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) return dateObj;
          return null;
        };

        // Group Sales & Collections by Month in JS
        const monthlyMap = new Map<string, { sales: number; collections: number; purchases: number }>();
        for (const s of salesRows) {
          const dVal = s.InvoiceDate || s.invoicedate;
          const tVal = parseFloat(s.TotalAmount || s.totalamount || 0);
          if (dVal && !isNaN(tVal)) {
            const dateObj = parseChartDate(dVal);
            if (dateObj) {
              const m = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
              if (!monthlyMap.has(m)) monthlyMap.set(m, { sales: 0, collections: 0, purchases: 0 });
              monthlyMap.get(m)!.sales += tVal;
            }
          }
        }
        
        // Also fetch collections (BankReceipts & CashReceipts)
        try {
          const crRows = await executeQuery("SELECT Amount, ReceiptDate FROM CashReceipts WHERE CompanyId = ?", [companyId]);
          for (const r of crRows) {
            const dVal = r.ReceiptDate || r.receiptdate;
            const amt = parseFloat(r.Amount || r.amount || 0);
            if (dVal && !isNaN(amt)) {
              const dateObj = parseChartDate(dVal);
              if (dateObj) {
                const m = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyMap.has(m)) monthlyMap.set(m, { sales: 0, collections: 0, purchases: 0 });
                monthlyMap.get(m)!.collections += amt;
              }
            }
          }
          const brRows = await executeQuery("SELECT Amount, ReceiptDate FROM BankReceipts WHERE CompanyId = ?", [companyId]);
          for (const r of brRows) {
            const dVal = r.ReceiptDate || r.receiptdate;
            const amt = parseFloat(r.Amount || r.amount || 0);
            if (dVal && !isNaN(amt)) {
              const dateObj = parseChartDate(dVal);
              if (dateObj) {
                const m = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyMap.has(m)) monthlyMap.set(m, { sales: 0, collections: 0, purchases: 0 });
                monthlyMap.get(m)!.collections += amt;
              }
            }
          }
          
          const pRows = await executeQuery("SELECT TotalAmount, InvoiceDate FROM PurchaseInvoices WHERE CompanyId = ?", [companyId]);
          for (const s of pRows) {
            const dVal = s.InvoiceDate || s.invoicedate;
            const tVal = parseFloat(s.TotalAmount || s.totalamount || 0);
            if (dVal && !isNaN(tVal)) {
              const dateObj = parseChartDate(dVal);
              if (dateObj) {
                const m = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyMap.has(m)) monthlyMap.set(m, { sales: 0, collections: 0, purchases: 0 });
                monthlyMap.get(m)!.purchases += tVal;
              }
            }
          }
        } catch (pe) {
          console.error("Error fetching receipts/purchases for chart", pe);
        }

        const sortedMonths = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12);

        for (const sMonth of sortedMonths) {
          const parts = sMonth.month.split('-');
          if (parts.length === 2) {
            const monthIndex = parseInt(parts[1], 10) - 1;
            realRevenueData.push({
              name: `${monthNames[monthIndex]} ${parts[0].slice(2)}`,
              sales: sMonth.sales,
              collections: sMonth.collections,
              purchases: sMonth.purchases
            });
          }
        }
      } catch (e) {
        console.error("Error calculating sales/receivables stats:", e);
      }

      // 3. Inventory value
      try {
        const invRows = await executeQuery("SELECT Id, Quantity, UnitPrice FROM InventoryItems WHERE CompanyId = ? OR CompanyId IS NULL", [companyId]);
        const sales = await executeQuery("SELECT ItemsData, Status FROM SalesInvoices WHERE CompanyId = ?", [companyId]);
        const purchases = await executeQuery("SELECT ItemsData, Status FROM PurchaseInvoices WHERE CompanyId = ?", [companyId]);
        const adjustments = await executeQuery("SELECT ItemsData, Status, AdjustmentType FROM StockAdjustments WHERE CompanyId = ?", [companyId]);
        const salesReturns = await executeQuery("SELECT ItemsData, Status FROM SalesReturns WHERE CompanyId = ?", [companyId]);
        const purchaseReturns = await executeQuery("SELECT ItemsData, Status FROM PurchaseReturns WHERE CompanyId = ?", [companyId]);

        for (const i of invRows) {
           let inward = 0;
           let outward = 0;
           
           const processItems = (records: any[], isInward: boolean) => {
             records.forEach(r => {
               if (r.Status === 'Draft' || r.Status === 'Cancelled') return;
               let itemsData: any[] = [];
               try { itemsData = JSON.parse(r.ItemsData || r.itemsdata || '[]'); } catch(e) {}
               const line = itemsData.find(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
               if (line) {
                 const qty = parseFloat(line.qty || line.Quantity) || 0;
                 if (isInward) inward += qty;
                 else outward += qty;
               }
             });
           };

           processItems(purchases, true);
           processItems(sales, false);
           processItems(salesReturns, true);
           processItems(purchaseReturns, false);

           adjustments.forEach(a => {
             if (a.Status === 'Draft' || a.Status === 'Cancelled') return;
             let itemsData: any[] = [];
             try { itemsData = JSON.parse(a.ItemsData || a.itemsdata || '[]'); } catch(e) {}
             const line = itemsData.find(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
             if (line) {
               const qty = parseFloat(line.qty || line.Quantity) || 0;
               if (a.AdjustmentType === 'Quantity Addition') inward += qty;
               else if (a.AdjustmentType === 'Quantity Reduction') outward += qty;
             }
           });

           const openingStock = parseFloat(i.Quantity || i.quantity || 0) || 0;
           const closingStock = openingStock + inward - outward;
           const price = parseFloat(i.UnitPrice || i.unitprice || 0) || 0;
           
           inventoryVal += (closingStock * price);
        }
      } catch (e) {
        console.error("Error calculating inventory stats:", e);
      }

      const defaultRevenueData = [
        { name: 'Jan', sales: 0, collections: 0, purchases: 0 },
        { name: 'Feb', sales: 0, collections: 0, purchases: 0 },
        { name: 'Mar', sales: 0, collections: 0, purchases: 0 },
      ];

      res.json({
          totalSales: totalSalesVal,
          receivables: receivablesVal,
          members: membersCountVal,
          inventoryValue: inventoryVal,
          revenueData: realRevenueData.length > 0 ? realRevenueData : defaultRevenueData
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Helper functions to handle varying primary keys and company IDs
  function getPrimaryKeyColumn(table: string): string {
    const lower = table.toLowerCase();
    if (lower === 'vendors') {
      return 'Vendor_ID';
    }
    return 'Id';
  }

  function getCompanyIdColumn(table: string): string {
    const lower = table.toLowerCase();
    if (lower === 'vendors') {
      return 'COMPANYID';
    }
    return 'CompanyId';
  }

  // Journal entries endpoints
  apiRouter.get("/journal", async (req, res) => {
    try {
      const companyId = req.query.CompanyId ? parseInt(req.query.CompanyId as string, 10) : 1;
      const rows = await executeQuery(
        `SELECT * FROM JournalEntries WHERE CompanyId = ? ORDER BY EntryDate DESC, Id DESC`,
        [companyId]
      );
      res.json(rows);
    } catch (err: any) {
      console.error("Error fetching journals:", err);
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.get("/journal/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const headers = await executeQuery(`SELECT * FROM JournalEntries WHERE Id = ?`, [id]);
      if (headers.length === 0) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      const lines = await executeQuery(`SELECT * FROM JournalLines WHERE JournalEntryId = ? ORDER BY Id ASC`, [id]);
      res.json({
        ...headers[0],
        lines
      });
    } catch (err: any) {
      console.error("Error fetching journal entry details:", err);
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post("/journal", async (req, res) => {
    try {
      const { CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate, lines } = req.body;
      
      let finalEntryNumber = EntryNumber;
      if (!finalEntryNumber || !finalEntryNumber.trim()) {
        const yr = new Date(EntryDate || Date.now()).getFullYear().toString().slice(-2);
        const countRows = await executeQuery(
          `SELECT COUNT(*) as count FROM JournalEntries WHERE CompanyId = ? AND EntryNumber LIKE ?`,
          [CompanyId || 1, `JV-${yr}-%`]
        );
        const countVal = countRows[0]?.count || countRows[0]?.COUNT || 0;
        finalEntryNumber = `JV-${yr}-${String(countVal + 1).padStart(3, '0')}`;
      }

      await executeQuery(
        `INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          CompanyId || 1,
          finalEntryNumber,
          Reference || null,
          Narration || null,
          parseFloat(TotalAmount) || 0,
          Status || 'Draft',
          EntryDate || null
        ]
      );

      const maxRows = await executeQuery(
        `SELECT MAX(Id) AS Id FROM JournalEntries WHERE CompanyId = ? AND EntryNumber = ?`,
        [CompanyId || 1, finalEntryNumber]
      );
      const journalId = maxRows[0]?.Id || maxRows[0]?.id || maxRows[0]?.id_max || maxRows[0]?.ID;
      if (!journalId) {
        throw new Error("Unable to retrieve inserted Journal Entry Id");
      }

      if (Array.isArray(lines)) {
        for (const line of lines) {
          await executeQuery(
            `INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`,
            [
              journalId,
              line.AccountId ? parseInt(line.AccountId, 10) : null,
              line.Description || null,
              parseFloat(line.Debit) || 0,
              parseFloat(line.Credit) || 0
            ]
          );
        }
      }

      res.status(201).json({ success: true, id: journalId, EntryNumber: finalEntryNumber });
    } catch (err: any) {
      console.error("Error creating journal entry:", err);
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.put("/journal/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate, lines } = req.body;

      await executeQuery(
        `UPDATE JournalEntries SET CompanyId = ?, EntryNumber = ?, Reference = ?, Narration = ?, TotalAmount = ?, Status = ?, EntryDate = ? WHERE Id = ?`,
        [
          CompanyId || 1,
          EntryNumber,
          Reference || null,
          Narration || null,
          parseFloat(TotalAmount) || 0,
          Status || 'Draft',
          EntryDate || null,
          id
        ]
      );

      await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [id]);

      if (Array.isArray(lines)) {
        for (const line of lines) {
          await executeQuery(
            `INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit) VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              line.AccountId ? parseInt(line.AccountId, 10) : null,
              line.Description || null,
              parseFloat(line.Debit) || 0,
              parseFloat(line.Credit) || 0
            ]
          );
        }
      }

      res.json({ success: true, id });
    } catch (err: any) {
      console.error("Error updating journal entry:", err);
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.delete("/journal/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await executeQuery(`DELETE FROM JournalLines WHERE JournalEntryId = ?`, [id]);
      await executeQuery(`DELETE FROM JournalEntries WHERE Id = ?`, [id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting journal entry:", err);
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post("/cleanup/transactions", async (req, res) => {
    try {
      // Clean up transactional data but preserve configuration and state master data (IssueStatuses is explicitly excluded)
      const trxTables = [
        'audit_logs', 'ShareTransactions', 'LoanRepayments', 'JournalLines', 'JournalEntries',
        'CashReceipts', 'CashPayments', 'BankReceipts', 'BankPayments', 'SalesReturns',
        'SalesInvoices', 'SalesOrders', 'SalesQuotations', 'PurchaseReturns', 'PurchaseInvoices',
        'PurchaseOrders', 'StockAdjustments', 'Issues', 'IssueLogs'
      ];
      for (const table of trxTables) {
        try { await executeQuery(`DELETE FROM ${table}`); } catch(e) { console.error('Error cleaning '+table, e); }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to cleanup transactions:", error);
      res.status(500).json({ error: "Failed to cleanup transactions" });
    }
  });

  apiRouter.post("/cleanup/master", async (req, res) => {
    try {
      // Clean up transactional data (IssueStatuses is explicitly excluded)
      const trxTables = [
        'audit_logs', 'ShareTransactions', 'LoanRepayments', 'JournalLines', 'JournalEntries',
        'CashReceipts', 'CashPayments', 'BankReceipts', 'BankPayments', 'SalesReturns',
        'SalesInvoices', 'SalesOrders', 'SalesQuotations', 'PurchaseReturns', 'PurchaseInvoices',
        'PurchaseOrders', 'StockAdjustments', 'Issues', 'IssueLogs'
      ];
      for (const table of trxTables) {
        try { await executeQuery(`DELETE FROM ${table}`); } catch(e) { console.error('Error cleaning '+table, e); }
      }
      
      // Clean up standard master tables (preserving IssueStatuses configuration)
      const masterTables = [
        'Customers', 'Locations', 'Vendors', 'FPCMembers', 'Loans', 'Assets', 'InventoryItems', 'BankAccounts'
      ];
      for (const table of masterTables) {
        try { await executeQuery(`DELETE FROM ${table}`); } catch(e) { console.error('Error cleaning '+table, e); }
      }

      try {
        await executeQuery(`
          DELETE FROM Accounts 
          WHERE Name NOT LIKE '%Cash in Hand%' 
          AND Name NOT LIKE '%Share Capital%' 
          AND Name NOT LIKE '%Purchases%' 
          AND Name NOT LIKE '%Sales%'
        `);
      } catch(e) { console.error('Failed to clean Accounts', e); }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to cleanup master:", error);
      res.status(500).json({ error: "Failed to cleanup master data" });
    }
  });

  // Dynamic CRUD endpoint for tables
  apiRouter.post("/sync-accounts", async (req, res) => {
    try {
        const companies = await executeQuery(`SELECT Id FROM Companies`);
        for (const comp of companies) {
            const cid = comp.Id;
            const customers = await executeQuery(`SELECT * FROM Customers WHERE CompanyId = ? OR CompanyId IS NULL`, [cid]);
            for (const c of customers) {
               await syncAccountForEntity('customers', c, cid, c.Id);
            }
            
            const vendors = await executeQuery(`SELECT * FROM Vendors WHERE COMPANYID = ? OR CompanyId = ? OR COMPANYID IS NULL OR CompanyId IS NULL`, [cid, cid]);
            for (const v of vendors) {
               await syncAccountForEntity('vendors', v, cid, v.Vendor_ID || v.Id);
            }

            const members = await executeQuery(`SELECT * FROM FPCMembers WHERE CompanyId = ? OR CompanyId IS NULL`, [cid]);
            for (const m of members) {
               // Sync FPC members to Vendors and create/update single VEN- account
               await syncFPCMemberToVendor(m, cid);
            }

            const pinvoices = await executeQuery(`SELECT * FROM PurchaseInvoices WHERE CompanyId = ? OR CompanyId IS NULL`, [cid]);
            for (const pinv of pinvoices) {
               await syncPurchaseInvoiceToJournal(pinv, cid, pinv.Id || pinv.id);
            }

            const sinvoices = await executeQuery(`SELECT * FROM SalesInvoices WHERE CompanyId = ? OR CompanyId IS NULL`, [cid]);
            for (const sinv of sinvoices) {
               await syncSalesInvoiceToJournal(sinv, cid, sinv.Id || sinv.id);
            }
        }

        // Self-Healing: Merge any old 'FPC-%' accounts that have transactions/references into their correct corresponding synced 'VEN-%' accounts.
        try {
            console.log("🔄 Starting self-healing merge of FPC-% accounts to VEN-% accounts...");
            const fpcAccounts = await executeQuery(`SELECT * FROM Accounts WHERE AccountCode LIKE 'FPC-%'`);
            for (const fpcAcc of fpcAccounts) {
                const fpcAccId = fpcAcc.Id || fpcAcc.id || fpcAcc.ID;
                const fpcCode = fpcAcc.AccountCode || fpcAcc.accountcode || '';
                const memberIdStr = fpcCode.replace('FPC-', '');
                const memberId = parseInt(memberIdStr, 10);
                if (isNaN(memberId)) continue;

                // 1. Find linked vendor record for this memberId
                const vendors = await executeQuery(`SELECT * FROM Vendors WHERE FPCMemberId = ?`, [memberId]);
                if (vendors && vendors.length > 0) {
                    const vendor = vendors[0];
                    const vendorId = vendor.Vendor_ID || vendor.Vendor_Id || vendor.vendor_id || vendor.Id || vendor.id || vendor.ID;
                    if (vendorId) {
                        // 2. Find the corresponding Vendor account (VEN-xx)
                        const companyId = fpcAcc.CompanyId || fpcAcc.companyid || null;
                        const venAccs = await executeQuery(
                            `SELECT * FROM Accounts WHERE AccountCode = ? AND (CompanyId = ? OR CompanyId IS NULL)`,
                            [`VEN-${vendorId}`, companyId]
                        );
                        if (venAccs && venAccs.length > 0) {
                            const venAccId = venAccs[0].Id || venAccs[0].id || venAccs[0].ID;
                            if (venAccId && venAccId !== fpcAccId) {
                                console.log(`🔗 Merging Account ${fpcCode} (ID: ${fpcAccId}) into VEN-${vendorId} (ID: ${venAccId})...`);
                                
                                // Point all referencing transactions to the new/correct vendor ledger account
                                await executeQuery(`UPDATE JournalLines SET AccountId = ? WHERE AccountId = ?`, [venAccId, fpcAccId]);
                                try { await executeQuery(`UPDATE CashReceipts SET AccountId = ? WHERE AccountId = ?`, [venAccId, fpcAccId]); } catch (e) {}
                                try { await executeQuery(`UPDATE CashPayments SET AccountId = ? WHERE AccountId = ?`, [venAccId, fpcAccId]); } catch (e) {}
                                try { await executeQuery(`UPDATE BankReceipts SET AccountId = ? WHERE AccountId = ?`, [venAccId, fpcAccId]); } catch (e) {}
                                try { await executeQuery(`UPDATE BankPayments SET AccountId = ? WHERE AccountId = ?`, [venAccId, fpcAccId]); } catch (e) {}
                                
                                console.log(`✅ Successfully merged transactions. Safe to delete old duplicate FPC account ${fpcCode}.`);
                            }
                        }
                    }
                }
            }
        } catch (mergeErr: any) {
            console.error("Failed during self-healing FPC account merge:", mergeErr.message);
        }

        // Clean up old duplicate FPC accounts that are not used in JournalLines
        try {
            await executeQuery(`
                DELETE FROM Accounts 
                WHERE AccountCode LIKE 'FPC-%' 
                AND Id NOT IN (SELECT DISTINCT AccountId FROM JournalLines WHERE AccountId IS NOT NULL)
            `);
            console.log("✅ Cleaned up old duplicate FPC accounts from the Accounts table.");
        } catch (cleanErr: any) {
            console.error("Failed to cleanup duplicate FPC accounts:", cleanErr.message);
        }

        res.json({ success: true });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
  });

  async function ensureDefaultAccountsForCompany(companyId: number) {
    try {
       const checkQuery = `SELECT COUNT(*) as cnt FROM Accounts WHERE CompanyId = ?`;
       const result = await executeQuery(checkQuery, [companyId]);
       const count = result && result[0] ? (result[0].cnt || result[0].CNT || 0) : 0;
       if (count === 0) {
           console.log(`[Auto-Seed] No chart of accounts found for companyId ${companyId}. Seeding default accounts...`);
           const defaultAccounts = [
               { code: '1001', name: 'Cash in Hand', group: 'Cash-in-Hand', type: 'Asset', bal: 10000, btype: 'Dr' },
               { code: '1002', name: 'State Bank of India', group: 'Bank Accounts', type: 'Asset', bal: 500000, btype: 'Dr' },
               { code: '3001', name: 'Share Capital', group: 'Capital Account', type: 'Equity', bal: 510000, btype: 'Cr' },
               { code: '4001', name: 'Sales Account', group: 'Sales Accounts', type: 'Revenue', bal: 0, btype: 'Cr' },
               { code: '5001', name: 'Purchase Account', group: 'Purchase Accounts', type: 'Expense', bal: 0, btype: 'Dr' },
               { code: '5002', name: 'Salary & Wages', group: 'Indirect Expenses', type: 'Expense', bal: 0, btype: 'Dr' },
               { code: '5003', name: 'Office Rent', group: 'Indirect Expenses', type: 'Expense', bal: 0, btype: 'Dr' },
               { code: '5004', name: 'General Expenses', group: 'Indirect Expenses', type: 'Expense', bal: 0, btype: 'Dr' }
           ];
           for (const item of defaultAccounts) {
               await executeQuery(
                   `INSERT INTO Accounts (CompanyId, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                   [companyId, item.code, item.name, item.group, item.type, item.bal, item.btype]
               );
           }
           console.log(`[Auto-Seed] Seeding of default accounts completed successfully for companyId ${companyId}.`);
       }
    } catch (err: any) {
       console.error(`[Auto-Seed Error] Failed to seed default accounts for companyId ${companyId}:`, err.message);
    }
  }

  apiRouter.get("/data/:table", async (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const companyId = req.query.CompanyId;
      const financialYearId = req.query.FinancialYearId;

      if (table.toLowerCase() === 'accounts' && companyId && companyId !== 'null' && companyId !== 'undefined' && companyId !== '') {
          const parsedCompanyId = parseInt(String(companyId), 10);
          if (!isNaN(parsedCompanyId)) {
              await ensureDefaultAccountsForCompany(parsedCompanyId);
          }
      }
      
      let query = `SELECT * FROM ${table}`;
      const params: any[] = [];
      const conditions: string[] = [];

      const pkCol = getPrimaryKeyColumn(table);
      const companyCol = getCompanyIdColumn(table);

      if (companyId && companyId !== 'null' && companyId !== 'undefined' && companyId !== '') {
         const parsedCompanyId = parseInt(String(companyId), 10);
         if (!isNaN(parsedCompanyId)) {
             conditions.push(`${companyCol} = ?`);
             params.push(parsedCompanyId);
         }
      }
      if (financialYearId && financialYearId !== 'null' && financialYearId !== 'undefined' && financialYearId !== '') {
         const parsedFYId = parseInt(String(financialYearId), 10);
         if (!isNaN(parsedFYId)) {
             conditions.push(`FinancialYearId = ?`);
             params.push(parsedFYId);
         }
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }
      
      query += ` ORDER BY ${pkCol} DESC`;
      
      let rows;
      try {
        rows = await executeQuery(query, params);
      } catch (innerE: any) {
        const isTableMissing = innerE.message && (
          innerE.message.includes(`Invalid object name '${table}'`) ||
          (innerE.message.toLowerCase().includes("invalid object name") && innerE.message.toLowerCase().includes(table.toLowerCase()))
        );
        if (isTableMissing) {
            console.log(`[Auto-Heal-Get] Table '${table}' missing. Creating...`);
            await ensureTableCreatedInMSSQL(table);
            rows = await executeQuery(query, params);
        } else {
            throw innerE;
        }
      }
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get("/data/:table/:id", async (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const id = req.params.id;
      const pkCol = getPrimaryKeyColumn(table);
      
      let searchId: any = id;
      const pkColLower = pkCol.toLowerCase();
      if (pkColLower === 'id' || pkColLower === 'vendor_id') {
         const parsedId = parseInt(id, 10);
         if (!isNaN(parsedId)) {
             searchId = parsedId;
         }
      }

      let rows;
      try {
        rows = await executeQuery(`SELECT * FROM ${table} WHERE ${pkCol} = ?`, [searchId]);
      } catch (innerE: any) {
        const isTableMissing = innerE.message && (
          innerE.message.includes(`Invalid object name '${table}'`) ||
          (innerE.message.toLowerCase().includes("invalid object name") && innerE.message.toLowerCase().includes(table.toLowerCase()))
        );
        if (isTableMissing) {
            console.log(`[Auto-Heal-GetId] Table '${table}' missing. Creating...`);
            await ensureTableCreatedInMSSQL(table);
            rows = await executeQuery(`SELECT * FROM ${table} WHERE ${pkCol} = ?`, [searchId]);
        } else {
            throw innerE;
        }
      }
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  apiRouter.post("/data/:table", async (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const data = req.body;
      if (data.LogoUrl && typeof data.LogoUrl === 'string' && data.LogoUrl.startsWith('ENC:')) {
          data.LogoUrl = decodeURIComponent(data.LogoUrl.substring(4));
      }
      console.log("DEBUG: Incoming data for table " + table + ":", JSON.stringify({ ...data, LogoUrl: data.LogoUrl ? '...' : undefined }));
      console.log("DEBUG: CHECKING CONDITION:", table.toLowerCase() === 'salesquotations', !data.QuotationNumber);
      
      if (table.toLowerCase() === 'users') {
          if (!data.Password || !data.Password.trim()) {
              data.Password = 'welcome123';
          }
      }
      if (table.toLowerCase() === 'cashpayments' && !data.VoucherNo) {
          try {
              const fyResult = await executeQuery("SELECT FinancialYear FROM FinancialYears WHERE Id = ?", [data.FinancialYearId]);
              const fy = fyResult[0]?.FinancialYear || "2026-2027";
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'PaymentVouchers' AND FinancialYear = ?", [data.CompanyId, fy]);
              let prefix = seq[0]?.Prefix || "PV";
              prefix = prefix.replace(/\/+$/, ""); // normalize prefix
              
              const lastResult = await executeQuery("SELECT VoucherNo FROM CashPayments WHERE FinancialYearId = ? ORDER BY Id DESC", [data.FinancialYearId]);
              
              let nextSeq = 1;
              if (lastResult.length > 0) {
                  const lastInv = lastResult[0].VoucherNo;
                  if (lastInv) {
                      const parts = lastInv.split('/');
                      if (parts.length > 0) {
                          const lastPart = parts[parts.length - 1];
                          const parseNum = parseInt(lastPart, 10);
                          if (!isNaN(parseNum)) {
                              nextSeq = parseNum + 1;
                          }
                      }
                  }
              }
              
              data.VoucherNo = `${prefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating cash payment voucher number", e);
          }
      }

      if (table.toLowerCase() === 'cashreceipts' && !data.VoucherNo) {
          try {
              const fyResult = await executeQuery("SELECT FinancialYear FROM FinancialYears WHERE Id = ?", [data.FinancialYearId]);
              const fy = fyResult[0]?.FinancialYear || "2026-2027";
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'ReceiptVouchers' AND FinancialYear = ?", [data.CompanyId, fy]);
              let prefix = seq[0]?.Prefix || "RV";
              prefix = prefix.replace(/\/+$/, ""); // normalize prefix
              
              const lastResult = await executeQuery("SELECT VoucherNo FROM CashReceipts WHERE FinancialYearId = ? ORDER BY Id DESC", [data.FinancialYearId]);
              
              let nextSeq = 1;
              if (lastResult.length > 0) {
                  const lastInv = lastResult[0].VoucherNo;
                  if (lastInv) {
                      const parts = lastInv.split('/');
                      if (parts.length > 0) {
                          const lastPart = parts[parts.length - 1];
                          const parseNum = parseInt(lastPart, 10);
                          if (!isNaN(parseNum)) {
                              nextSeq = parseNum + 1;
                          }
                      }
                  }
              }
              
              data.VoucherNo = `${prefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating cash receipt voucher number", e);
          }
      }

      if (table.toLowerCase() === 'bankpayments' && !data.VoucherNo) {
          try {
              const fyResult = await executeQuery("SELECT FinancialYear FROM FinancialYears WHERE Id = ?", [data.FinancialYearId]);
              const fy = fyResult[0]?.FinancialYear || "2026-2027";
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'BankPayments' AND FinancialYear = ?", [data.CompanyId, fy]);
              let prefix = seq[0]?.Prefix || "BP";
              prefix = prefix.replace(/\/+$/, ""); // normalize prefix
              
              const lastResult = await executeQuery("SELECT VoucherNo FROM BankPayments WHERE FinancialYearId = ? ORDER BY Id DESC", [data.FinancialYearId]);
              
              let nextSeq = 1;
              if (lastResult.length > 0) {
                  const lastInv = lastResult[0].VoucherNo;
                  if (lastInv) {
                      const parts = lastInv.split('/');
                      if (parts.length > 0) {
                          const lastPart = parts[parts.length - 1];
                          const parseNum = parseInt(lastPart, 10);
                          if (!isNaN(parseNum)) {
                              nextSeq = parseNum + 1;
                          }
                      }
                  }
              }
              
              data.VoucherNo = `${prefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating bank payment voucher number", e);
          }
      }

      if (table.toLowerCase() === 'bankreceipts' && !data.VoucherNo) {
          try {
              const fyResult = await executeQuery("SELECT FinancialYear FROM FinancialYears WHERE Id = ?", [data.FinancialYearId]);
              const fy = fyResult[0]?.FinancialYear || "2026-2027";
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'BankReceipts' AND FinancialYear = ?", [data.CompanyId, fy]);
              let prefix = seq[0]?.Prefix || "BR";
              prefix = prefix.replace(/\/+$/, ""); // normalize prefix
              
              const lastResult = await executeQuery("SELECT VoucherNo FROM BankReceipts WHERE FinancialYearId = ? ORDER BY Id DESC", [data.FinancialYearId]);
              
              let nextSeq = 1;
              if (lastResult.length > 0) {
                  const lastInv = lastResult[0].VoucherNo;
                  if (lastInv) {
                      const parts = lastInv.split('/');
                      if (parts.length > 0) {
                          const lastPart = parts[parts.length - 1];
                          const parseNum = parseInt(lastPart, 10);
                          if (!isNaN(parseNum)) {
                              nextSeq = parseNum + 1;
                          }
                      }
                  }
              }
              
              data.VoucherNo = `${prefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating bank receipt voucher number", e);
          }
      }

      if (table.toLowerCase() === 'salesinvoices' && !data.InvoiceNumber) {
          try {
              const fyResult = await executeQuery("SELECT FinancialYear FROM FinancialYears WHERE Id = ?", [data.FinancialYearId]);
              const fy = fyResult[0]?.FinancialYear || "2026-2027";
              
              const seqQuery = "SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'SalesInvoices' AND FinancialYear = ?";
              const seq = await executeQuery(seqQuery, [data.CompanyId, fy]);
              const prefix = (seq && seq[0]?.Prefix) || "INV/";
              const basePrefix = prefix.split('/')[0];
              
              const lastInvoiceResult = await executeQuery("SELECT InvoiceNumber FROM SalesInvoices WHERE FinancialYearId = ? ORDER BY Id DESC", [data.FinancialYearId]);
              
              let nextSeq = 1;
              if (lastInvoiceResult && lastInvoiceResult.length > 0) {
                  const lastInv = lastInvoiceResult[0].InvoiceNumber;
                  if (lastInv) {
                      const parts = lastInv.split('/');
                      if (parts.length >= 1) {
                          const lastNum = parseInt(parts[parts.length-1], 10);
                          if (!isNaN(lastNum)) nextSeq = lastNum + 1;
                      }
                  }
              }
              
              data.InvoiceNumber = `${basePrefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating sales invoice number", e);
          }
      }

      if (table.toLowerCase() === 'salesquotations' && !data.QuotationNumber) {
          try {
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'SalesQuotations'", [data.CompanyId]);
              const prefix = (seq && seq[0]?.Prefix) || "QT/";
              
              const lastResult = await executeQuery("SELECT QuotationNumber FROM SalesQuotations WHERE CompanyId = ? ORDER BY Id DESC", [data.CompanyId]);
              
              let nextSeq = 1;
              if (lastResult && lastResult.length > 0) {
                  const lastInv = lastResult[0].QuotationNumber;
                  if (lastInv) {
                    const parts = lastInv.split('/');
                    const lastNum = parseInt(parts[parts.length-1], 10);
                    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
                  }
              }
              const basePrefix = prefix.split('/')[0];
              data.QuotationNumber = `${basePrefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating quotation number", e);
          }
      }

      if (table.toLowerCase() === 'salesorders' && !data.OrderNumber) {
          try {
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'SalesOrders'", [data.CompanyId]);
              const prefix = (seq && seq[0]?.Prefix) || "SO/";
              
              const lastResult = await executeQuery("SELECT OrderNumber FROM SalesOrders WHERE CompanyId = ? ORDER BY Id DESC", [data.CompanyId]);
              
              let nextSeq = 1;
              if (lastResult && lastResult.length > 0) {
                  const lastOrd = lastResult[0].OrderNumber;
                  if (lastOrd) {
                    const parts = lastOrd.split('/');
                    const lastNum = parseInt(parts[parts.length-1], 10);
                    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
                  }
              }
              const basePrefix = prefix.split('/')[0];
              data.OrderNumber = `${basePrefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating sales order number", e);
          }
      }

      if (table.toLowerCase() === 'purchaseorders' && !data.OrderNumber) {
          try {
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'PurchaseOrders'", [data.CompanyId]);
              const prefix = (seq && seq[0]?.Prefix) || "PO/";
              
              const lastResult = await executeQuery("SELECT OrderNumber FROM PurchaseOrders WHERE CompanyId = ? ORDER BY Id DESC", [data.CompanyId]);
              
              let nextSeq = 1;
              if (lastResult && lastResult.length > 0) {
                  const lastOrd = lastResult[0].OrderNumber;
                  if (lastOrd) {
                    const parts = lastOrd.split('/');
                    const lastNum = parseInt(parts[parts.length-1], 10);
                    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
                  }
              }
              const basePrefix = prefix.split('/')[0];
              data.OrderNumber = `${basePrefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating purchase order number", e);
          }
      }

      if (table.toLowerCase() === 'salesreturns' && !data.ReturnNumber) {
          try {
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'SalesReturns'", [data.CompanyId]);
              const prefix = (seq && seq[0]?.Prefix) || "SR/";
              
              const lastResult = await executeQuery("SELECT ReturnNumber FROM SalesReturns WHERE CompanyId = ? ORDER BY Id DESC", [data.CompanyId]);
              
              let nextSeq = 1;
              if (lastResult && lastResult.length > 0) {
                  const lastRet = lastResult[0].ReturnNumber;
                  if (lastRet) {
                    const parts = lastRet.split('/');
                    const lastNum = parseInt(parts[parts.length-1], 10);
                    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
                  }
              }
              const basePrefix = prefix.split('/')[0];
              data.ReturnNumber = `${basePrefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating sales return number", e);
          }
      }

      if (table.toLowerCase() === 'purchasereturns' && !data.ReturnNumber) {
          try {
              const seq = await executeQuery("SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'PurchaseReturns'", [data.CompanyId]);
              const prefix = (seq && seq[0]?.Prefix) || "PR/";
              
              const lastResult = await executeQuery("SELECT ReturnNumber FROM PurchaseReturns WHERE CompanyId = ? ORDER BY Id DESC", [data.CompanyId]);
              
              let nextSeq = 1;
              if (lastResult && lastResult.length > 0) {
                  const lastRet = lastResult[0].ReturnNumber;
                  if (lastRet) {
                    const parts = lastRet.split('/');
                    const lastNum = parseInt(parts[parts.length-1], 10);
                    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
                  }
              }
              const basePrefix = prefix.split('/')[0];
              data.ReturnNumber = `${basePrefix}/${String(nextSeq).padStart(3, '0')}`;
          } catch (e) {
              console.error("Error generating purchase return number", e);
          }
      }

      if (table.toLowerCase() === 'purchaseinvoices' && !data.InvoiceNumber) {
          try {
              console.log("DEBUG: Generating Invoice for:", { fyId: data.FinancialYearId, coId: data.CompanyId });
              if (data.FinancialYearId === undefined || data.CompanyId === undefined) {
                console.log("DEBUG: Cannot generate InvoiceNumber: Missing FY (" + data.FinancialYearId + ") or CompanyId (" + data.CompanyId + ")");
              } else {
                  console.log("DEBUG: Proceeding with FY=" + data.FinancialYearId + ", Co=" + data.CompanyId);
                  const fyResult = await executeQuery("SELECT FinancialYear FROM FinancialYears WHERE Id = ?", [data.FinancialYearId]);
                  console.log("DEBUG: FY Result:", fyResult);
                  const fy = (fyResult && fyResult[0]?.FinancialYear) || "2026-2027";
                  
                  const seqQuery = "SELECT Prefix FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = 'PurchaseInvoices' AND FinancialYear = ?";
                  console.log("DEBUG: Running Seq Query:", seqQuery, [data.CompanyId, fy]);
                  const seq = await executeQuery(seqQuery, [data.CompanyId, fy]);
                  console.log("DEBUG: Seq Result:", seq);
                  const prefix = (seq && seq[0]?.Prefix) || "PI/";
                  const basePrefix = prefix.split('/')[0];
                  
                  const lastInvQuery = "SELECT InvoiceNumber FROM PurchaseInvoices WHERE FinancialYearId = ? ORDER BY Id DESC";
                  console.log("DEBUG: Running LastInv Query:", lastInvQuery, [data.FinancialYearId]);
                  const lastInvoiceResult = await executeQuery(lastInvQuery, [data.FinancialYearId]);
                  console.log("DEBUG: Last Invoice Result:", lastInvoiceResult);
                  
                  let nextSeq = 1;
                  if (lastInvoiceResult && lastInvoiceResult.length > 0) {
                      const lastInv = lastInvoiceResult[0].InvoiceNumber;
                      if (lastInv) {
                        const parts = lastInv.split('/');
                        if (parts.length >= 1) { 
                           const lastNum = parseInt(parts[parts.length-1], 10);
                           if (!isNaN(lastNum)) nextSeq = lastNum + 1;
                        }
                      }
                  }
                  
                  data.InvoiceNumber = `${basePrefix}/${String(nextSeq).padStart(3, '0')}`;
                  console.log("DEBUG: Generated Invoice Number:", data.InvoiceNumber);
              }
          } catch (e) {
              console.error("Error generating purchase invoice number", e);
          }
      }
      
      console.log("DEBUG: Final data before insert:", JSON.stringify(data));

      const keys = Object.keys(data);
      const values = Object.values(data);
      
      if (keys.length === 0) return res.status(400).json({ error: "Empty body" });

      const pkCol = getPrimaryKeyColumn(table);

      // --- Duplicate Prevention and Upsert Interceptor ---
      const tableLower = table.toLowerCase();
      const resolvedCid = data.CompanyId || data.COMPANYID || data.companyid || data.Company_Id || null;
      let existingRecord = null;
      
      if (tableLower === 'fpcmembers') {
          const farmerName = data.FarmerName || data.farmername || '';
          if (farmerName) {
              existingRecord = await executeGet(
                  `SELECT Id, id, ID FROM FPCMembers WHERE LOWER(TRIM(FarmerName)) = ? AND (CompanyId = ? OR CompanyId IS NULL OR (CompanyId IS NULL AND ? IS NULL))`,
                  [farmerName.trim().toLowerCase(), resolvedCid, resolvedCid]
              );
          }
      } else if (tableLower === 'vendors') {
          const vendorName = data.Vendor_NAME || data.VendorName || data.vendorname || '';
          if (vendorName) {
              existingRecord = await executeGet(
                  `SELECT Vendor_ID, Vendor_Id, Id, id FROM Vendors WHERE (LOWER(TRIM(Vendor_NAME)) = ? OR LOWER(TRIM(VendorName)) = ?) AND (COMPANYID = ? OR CompanyId = ? OR COMPANYID IS NULL OR CompanyId IS NULL)`,
                  [vendorName.trim().toLowerCase(), vendorName.trim().toLowerCase(), resolvedCid, resolvedCid]
              );
          }
      } else if (tableLower === 'customers') {
          const customerName = data.CustomerName || data.Name || data.customername || '';
          if (customerName) {
              existingRecord = await executeGet(
                  `SELECT Id, id FROM Customers WHERE (LOWER(TRIM(CustomerName)) = ? OR LOWER(TRIM(Name)) = ?) AND (CompanyId = ? OR CompanyId IS NULL)`,
                  [customerName.trim().toLowerCase(), customerName.trim().toLowerCase(), resolvedCid]
              );
          }
      }

      if (existingRecord) {
          const existingId = existingRecord.Id || existingRecord.id || existingRecord.ID || existingRecord.Vendor_ID || existingRecord.Vendor_Id;
          console.log(`[Duplicate Interceptor] Found existing record in ${table} with ID ${existingId}. Seamlessly upserting instead.`);
          
          // Let's perform an UPDATE instead of INSERT on the existing ID
          const updateKeys = Object.keys(data).filter(k => {
              const kl = k.toLowerCase();
              return kl !== 'id' && kl !== 'vendor_id' && kl !== 'createdat' && kl !== 'added_on';
          });
          
          if (mssqlPool) {
              const request = mssqlPool.request();
              const setClauses = [];
              for (let i = 0; i < updateKeys.length; i++) {
                  setClauses.push(`[${updateKeys[i]}] = @p${i}`);
                  const normalizedVal = normalizeValueForBind(updateKeys[i], data[updateKeys[i]]);
                  request.input(`p${i}`, normalizedVal);
              }
              request.input('id', existingId);
              const sqlQuery = `UPDATE [dbo].[${table}] SET ${setClauses.join(', ')} WHERE [${pkCol}] = @id`;
              await request.query(sqlQuery);
          } else {
              const setClauses = updateKeys.map(k => `${k} = ?`).join(', ');
              const updateValues = updateKeys.map(k => data[k]);
              updateValues.push(existingId);
              sqliteDb.prepare(`UPDATE ${table} SET ${setClauses} WHERE ${pkCol} = ?`).run(...updateValues);
          }
          
          // Execute post-save synchronization hooks
          if (tableLower === 'customers' || tableLower === 'vendors' || tableLower === 'fpcmembers') {
              await syncAccountForEntity(table, data, resolvedCid, existingId);
              if (tableLower === 'fpcmembers') {
                  const fullDataWithId = { ...data, Id: existingId };
                  await syncFPCMemberToVendor(fullDataWithId, resolvedCid);
              }
          }
          
          await logAuditAction("System Admin", "UPSERT_ON_POST_DUPLICATE", table, existingId, data, data.FinancialYearId || null, resolvedCid);
          
          return res.json({ id: existingId, ...data });
      }
      // --- End Duplicate Interceptor ---

      let insertedId = null;
      if (mssqlPool) {
          let attempt = 0;
          const maxAttempts = 15;
          let success = false;
          let lastError = null;
          const tableLower = table.toLowerCase();

          // Pre-emptively ensure essential tables exist in MSSQL
          if (tableLower === "purchaseorders") {
              await ensureTableCreatedInMSSQL("PurchaseOrders");
          } else if (tableLower === "purchasereturns") {
              await ensureTableCreatedInMSSQL("PurchaseReturns");
          } else if (tableLower === "bankaccounts") {
              await ensureTableCreatedInMSSQL("BankAccounts");
          } else if (tableLower === "issuestatuses") {
              await ensureTableCreatedInMSSQL("IssueStatuses");
          } else if (tableLower === "issues") {
              await ensureTableCreatedInMSSQL("Issues");
          } else if (tableLower === "issuelogs") {
              await ensureTableCreatedInMSSQL("IssueLogs");
          }

          while (attempt < maxAttempts && !success) {
              attempt++;
              try {
                  const request = mssqlPool.request();
                  const colNames = [];
                  const paramNames = [];
                  for (let i = 0; i < keys.length; i++) {
                      colNames.push(`[${keys[i]}]`);
                      paramNames.push(`@p${i}`);
                      
                      const normalizedVal = normalizeValueForBind(keys[i], values[i]);
                      request.input(`p${i}`, normalizedVal);
                  }
                  const sqlQuery = `INSERT INTO [dbo].[${table}] (${colNames.join(', ')}) OUTPUT INSERTED.[${pkCol}] VALUES (${paramNames.join(', ')})`;
                  const result = await request.query(sqlQuery);
                  if (result.recordset && result.recordset.length > 0) {
                      const row = result.recordset[0];
                      insertedId = row[pkCol] || row.Id || row.ID || row.id || Object.values(row)[0];
                  }
                  success = true;
              } catch (err: any) {
                  lastError = err;
                  const errMsg = err.message || "";
                  console.log(`[Auto-Heal-Post] DB Error encountered for table '${table}': ${errMsg}`);

                  // Handle missing table error
                  if (errMsg.toLowerCase().includes("invalid object name") && errMsg.toLowerCase().includes(tableLower)) {
                      await ensureTableCreatedInMSSQL(table);
                      continue;
                  }

                  // Handle missing column error
                  const matchError = errMsg.match(/Invalid column name '([^']+)'/i);
                  if (matchError && matchError[1]) {
                      const colName = matchError[1];
                      console.log(`[Auto-Heal-Post] Missing column '${colName}' detected. Adding dynamically (attempt ${attempt}/${maxAttempts})...`);
                      try {
                          await mssqlPool.request().query(`ALTER TABLE [dbo].[${table}] ADD [${colName}] NVARCHAR(MAX) NULL`);
                          console.log(`[Auto-Heal-Post] Column '${colName}' added successfully to '[dbo].[${table}]'. Retrying insert...`);
                          continue;
                      } catch (healErr: any) {
                          console.error(`[Auto-Heal-Post] Failed to dynamically add missing column '${colName}':`, healErr.message);
                          throw err;
                      }
                  } else {
                      throw err;
                  }
              }
          }
          if (!success && lastError) {
              throw lastError;
          }
      } else {
          const placeholders = keys.map(() => '?').join(', ');
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
          const info = sqliteDb.prepare(sql).run(...values);
          insertedId = info.lastInsertRowid;
      }

      if (table.toLowerCase() === 'sharetransactions') {
          try {
              await adjustMemberShares({ ...data, Id: insertedId });
          } catch (err) {
              console.error("Error executing adjustMemberShares in POST handler:", err);
          }
      }

      if (table.toLowerCase() === 'loanrepayments') {
          try {
              await adjustLoanOutstanding({ ...data, Id: insertedId });
          } catch (err) {
              console.error("Error executing adjustLoanOutstanding in POST handler:", err);
          }
      }

      if (table.toLowerCase() === 'customers' || table.toLowerCase() === 'vendors' || table.toLowerCase() === 'fpcmembers') {
          const resolvedCid = data.CompanyId || data.COMPANYID || data.companyid || data.Company_Id;
          await syncAccountForEntity(table, data, resolvedCid, insertedId);
          if (table.toLowerCase() === 'fpcmembers') {
              const fullDataWithId = { ...data, Id: insertedId };
              await syncFPCMemberToVendor(fullDataWithId, resolvedCid);
          }
      }

      if (table.toLowerCase() === 'bankaccounts') {
          const resolvedCid = data.CompanyId || data.COMPANYID || data.companyid || data.Company_Id;
          await syncAccountForBank(data, resolvedCid, insertedId);
      }

      if (table.toLowerCase() === 'purchaseinvoices') {
          await syncPurchaseInvoiceToJournal(data, data.CompanyId, insertedId);
      }

      if (table.toLowerCase() === 'salesinvoices') {
          await syncSalesInvoiceToJournal(data, data.CompanyId, insertedId);
      }

      if (table.toLowerCase() === 'salesreturns') {
          await syncSalesReturnToJournal(data, data.CompanyId, insertedId);
      }

      if (table.toLowerCase() === 'purchasereturns') {
          await syncPurchaseReturnToJournal(data, data.CompanyId, insertedId);
      }

      if (table.toLowerCase() === 'cashpayments') {
          await syncCashPaymentToJournal(data, data.CompanyId, insertedId);
      }

      if (table.toLowerCase() === 'cashreceipts') {
          await syncCashReceiptToJournal(data, data.CompanyId, insertedId);
      }

      if (table.toLowerCase() === 'bankpayments') {
          await syncBankPaymentToJournal(data, data.CompanyId, insertedId);
      }

      if (table.toLowerCase() === 'bankreceipts') {
          await syncBankReceiptToJournal(data, data.CompanyId, insertedId);
      }

      await logAuditAction("System Admin", "CREATE", table, insertedId || 0, data, data.FinancialYearId || null, data.CompanyId || null);

      if (table.toLowerCase() === 'salesinvoices' && data.Status !== 'Cancelled' && data.Status !== 'Draft') {
          await applySalesInvoiceToLots(data, executeQuery);
      }

      res.json({ id: insertedId, ...data });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put("/data/:table/:id", async (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const id = req.params.id;
      const data = req.body;
      if (data.LogoUrl && typeof data.LogoUrl === 'string' && data.LogoUrl.startsWith('ENC:')) {
          data.LogoUrl = decodeURIComponent(data.LogoUrl.substring(4));
      }
      console.log(`[PUT /data/${table}/${id}] keys len: ${Object.keys(data).length}, LogoUrl starts with: `, data.LogoUrl ? data.LogoUrl.substring(0, 15) : undefined);
      const pkCol = getPrimaryKeyColumn(table);
      const syncTables = new Set([
        'customers', 'vendors', 'fpcmembers', 'bankaccounts',
        'purchaseinvoices', 'salesinvoices', 'salesreturns', 'purchasereturns',
        'cashpayments', 'cashreceipts', 'bankpayments', 'bankreceipts'
      ]);
      const keys = Object.keys(data).filter(k => {
          const lower = k.toLowerCase();
          return lower !== 'id' && lower !== pkCol.toLowerCase() && lower !== 'createdat' && lower !== 'added_on';
      }); // exclude Id, primary key, and Created/Added date from update
      
      let bindId_old: any = id;
      if (pkCol.toLowerCase() === 'id' || pkCol.toLowerCase() === 'vendor_id') {
          const parsedId = parseInt(id, 10);
          if (!isNaN(parsedId)) bindId_old = parsedId;
      }
      const oldRow = await executeGet(`SELECT * FROM ${table} WHERE ${pkCol} = ?`, [bindId_old]);
      
      if (keys.length === 0) return res.status(400).json({ error: "Empty body" });

      if (mssqlPool) {
          let attempt = 0;
          const maxAttempts = 15;
          let success = false;
          let lastError = null;
          const tableLower = table.toLowerCase();

          // Ensure table created or check columns
          if (tableLower === "purchaseorders") {
              await ensureTableCreatedInMSSQL("PurchaseOrders");
          } else if (tableLower === "purchasereturns") {
              await ensureTableCreatedInMSSQL("PurchaseReturns");
          } else if (tableLower === "cashpayments") {
              await ensureTableCreatedInMSSQL("CashPayments");
          } else if (tableLower === "bankpayments") {
              await ensureTableCreatedInMSSQL("BankPayments");
          } else if (tableLower === "bankreceipts") {
              await ensureTableCreatedInMSSQL("BankReceipts");
          } else if (tableLower === "cashreceipts") {
              await ensureTableCreatedInMSSQL("CashReceipts");
          } else if (tableLower === "bankaccounts") {
              await ensureTableCreatedInMSSQL("BankAccounts");
          } else if (tableLower === "issuestatuses") {
              await ensureTableCreatedInMSSQL("IssueStatuses");
          } else if (tableLower === "issues") {
              await ensureTableCreatedInMSSQL("Issues");
          } else if (tableLower === "issuelogs") {
              await ensureTableCreatedInMSSQL("IssueLogs");
          }

          while (attempt < maxAttempts && !success) {
              attempt++;
              try {
                  const request = mssqlPool.request();
                  const setClauses = [];
                  for (let i = 0; i < keys.length; i++) {
                      setClauses.push(`[${keys[i]}] = @p${i}`);
                      
                      const normalizedVal = normalizeValueForBind(keys[i], data[keys[i]]);
                      request.input(`p${i}`, normalizedVal);
                  }
                  
                  let bindId: any = id;
                  const pkColLower = pkCol.toLowerCase();
                  if (pkColLower === 'id' || pkColLower === 'vendor_id') {
                      const parsedId = parseInt(id, 10);
                      if (!isNaN(parsedId)) {
                          bindId = parsedId;
                      }
                  }
                  request.input('id', bindId);
                  
                  const sqlQuery = `UPDATE [dbo].[${table}] SET ${setClauses.join(', ')} WHERE [${pkCol}] = @id`;
                  await request.query(sqlQuery);
                  success = true;
                  await logAuditAction("System Admin", "UPDATE", table, typeof bindId_old === 'number' ? bindId_old : parseInt(id, 10) || 0, { old: oldRow, new: data }, data.FinancialYearId || oldRow?.FinancialYearId || null, data.CompanyId || oldRow?.CompanyId || null);
                  res.json({ success: true });
                  if (!syncTables.has(tableLower)) return;
              } catch (err: any) {
                  lastError = err;
                  const errMsg = err.message || "";
                  console.log(`[Auto-Heal-Put] DB Error encountered for table '${table}': ${errMsg}`);

                  // Handle missing table error
                  if (errMsg.toLowerCase().includes("invalid object name") && errMsg.toLowerCase().includes(tableLower)) {
                      await ensureTableCreatedInMSSQL(table);
                      continue;
                  }

                  // Handle missing column error
                  const matchError = errMsg.match(/Invalid column name '([^']+)'/i);
                  if (matchError && matchError[1]) {
                      const colName = matchError[1];
                      console.log(`[Auto-Heal-Put] Missing column '${colName}' detected. Adding dynamically (attempt ${attempt}/${maxAttempts})...`);
                      try {
                          await mssqlPool.request().query(`ALTER TABLE [dbo].[${table}] ADD [${colName}] NVARCHAR(MAX) NULL`);
                          console.log(`[Auto-Heal-Put] Column '${colName}' added successfully to '[dbo].[${table}]'. Retrying update...`);
                          continue;
                      } catch (healErr: any) {
                          console.error(`[Auto-Heal-Put] Failed to dynamically add missing column '${colName}':`, healErr.message);
                          throw err;
                      }
                  } else {
                      throw err;
                  }
              }
          }
          if (!success && lastError) {
              throw lastError;
          }
      } else {
          try {
              const setClauses = keys.map(k => `${k} = ?`).join(', ');
              const values = keys.map(k => data[k]);
              values.push(bindId_old);
              sqliteDb.prepare(`UPDATE ${table} SET ${setClauses} WHERE ${pkCol} = ?`).run(...values);
              await logAuditAction("System Admin", "UPDATE", table, typeof bindId_old === 'number' ? bindId_old : parseInt(id, 10) || 0, { old: oldRow, new: data }, data.FinancialYearId || oldRow?.FinancialYearId || null, data.CompanyId || oldRow?.CompanyId || null);
              res.json({ success: true });
              if (!syncTables.has(table.toLowerCase())) return;
          } catch(e) {
              console.error("Sqlite update error", e);
              throw e;
          }
      }

      let fullRow = { ...data };
      try {
          const rowsRes = await executeQuery(`SELECT * FROM ${table} WHERE ${pkCol} = ?`, [bindId_old]);
          if (rowsRes && rowsRes.length > 0) fullRow = { ...rowsRes[0], ...data };
      } catch (e) {
          console.error("Error fetching full row for sync", e);
      }

      if (table.toLowerCase() === 'customers' || table.toLowerCase() === 'vendors' || table.toLowerCase() === 'fpcmembers') {
          const resolvedCid = fullRow.CompanyId || fullRow.COMPANYID || fullRow.companyid || fullRow.Company_Id;
          await syncAccountForEntity(table, fullRow, resolvedCid, id);
          if (table.toLowerCase() === 'fpcmembers') {
              await syncFPCMemberToVendor(fullRow, resolvedCid);
          }
      }

      if (table.toLowerCase() === 'bankaccounts') {
          const resolvedCid = fullRow.CompanyId || fullRow.COMPANYID || fullRow.companyid || fullRow.Company_Id;
          await syncAccountForBank(fullRow, resolvedCid, id);
      }

      if (table.toLowerCase() === 'purchaseinvoices') {
          await syncPurchaseInvoiceToJournal(fullRow, fullRow.CompanyId, id);
      }

      if (table.toLowerCase() === 'salesinvoices') {
          if (oldRow && oldRow.Status !== 'Cancelled' && oldRow.Status !== 'Draft') {
              await revertSalesInvoiceFromLots(oldRow, executeQuery);
          }
          if (fullRow.Status !== 'Cancelled' && fullRow.Status !== 'Draft') {
              await applySalesInvoiceToLots(fullRow, executeQuery);
          }
          await syncSalesInvoiceToJournal(fullRow, fullRow.CompanyId, id);
      }

      if (table.toLowerCase() === 'salesreturns') {
          await syncSalesReturnToJournal(fullRow, fullRow.CompanyId, id);
      }

      if (table.toLowerCase() === 'purchasereturns') {
          await syncPurchaseReturnToJournal(fullRow, fullRow.CompanyId, id);
      }

      if (table.toLowerCase() === 'cashpayments') {
          await syncCashPaymentToJournal(fullRow, fullRow.CompanyId, id);
      }

      if (table.toLowerCase() === 'cashreceipts') {
          await syncCashReceiptToJournal(fullRow, fullRow.CompanyId, id);
      }

      if (table.toLowerCase() === 'bankpayments') {
          await syncBankPaymentToJournal(fullRow, fullRow.CompanyId, id);
      }

      if (table.toLowerCase() === 'bankreceipts') {
          await syncBankReceiptToJournal(fullRow, fullRow.CompanyId, id);
      }

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete("/data/:table/:id", async (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const id = req.params.id;
      const pkCol = getPrimaryKeyColumn(table);

      // Dependency validation
      const tableLower = table.toLowerCase();
      if (tableLower === 'customermaster') {
          const usesSI = await executeGet(`SELECT count(*) as cnt FROM SalesInvoices WHERE CustomerId = ?`, [id]);
          if (usesSI && usesSI.cnt > 0) return res.status(400).json({ error: "Cannot delete customer: used in Sales Invoices" });
          const usesSR = await executeGet(`SELECT count(*) as cnt FROM SalesReturns WHERE CustomerId = ?`, [id]);
          if (usesSR && usesSR.cnt > 0) return res.status(400).json({ error: "Cannot delete customer: used in Sales Returns" });
      }
      if (tableLower === 'vendormaster') {
          const usesPI = await executeGet(`SELECT count(*) as cnt FROM PurchaseInvoices WHERE VendorId = ?`, [id]);
          if (usesPI && usesPI.cnt > 0) return res.status(400).json({ error: "Cannot delete vendor: used in Purchase Invoices" });
          const usesPR = await executeGet(`SELECT count(*) as cnt FROM PurchaseReturns WHERE VendorId = ?`, [id]);
          if (usesPR && usesPR.cnt > 0) return res.status(400).json({ error: "Cannot delete vendor: used in Purchase Returns" });
      }
      if (tableLower === 'accounts') {
          const uses = await executeGet(`SELECT count(*) as cnt FROM JournalLines WHERE AccountId = ?`, [id]);
          if (uses && uses.cnt > 0) return res.status(400).json({ error: "Cannot delete account: used in Journal Entries" });
      }
      if (tableLower === 'inventoryitems') {
          const searchPattern = `%"itemId":${id}%`;
          const usesS = await executeGet(`SELECT count(*) as cnt FROM SalesInvoices WHERE ItemsData LIKE ?`, [searchPattern]);
          if (usesS && usesS.cnt > 0) return res.status(400).json({ error: "Cannot delete item: used in Sales Invoices" });
          const usesP = await executeGet(`SELECT count(*) as cnt FROM PurchaseInvoices WHERE ItemsData LIKE ?`, [searchPattern]);
          if (usesP && usesP.cnt > 0) return res.status(400).json({ error: "Cannot delete item: used in Purchase Invoices" });
      }

      if (tableLower === 'fpcmembers') {
          // Check share transactions (MemberId or ToMemberId)
          const stCount = await executeGet(`SELECT count(*) as cnt FROM ShareTransactions WHERE MemberId = ? OR ToMemberId = ?`, [id, id]);
          if (stCount && stCount.cnt > 0) return res.status(400).json({ error: "Cannot delete FPC Member: used in Share Transactions." });

          // Check loans
          const loanCount = await executeGet(`SELECT count(*) as cnt FROM Loans WHERE MemberId = ?`, [id]);
          if (loanCount && loanCount.cnt > 0) return res.status(400).json({ error: "Cannot delete FPC Member: used in Loans." });

          // Check loan repayments
          const repayCount = await executeGet(`SELECT count(*) as cnt FROM LoanRepayments WHERE MemberId = ?`, [id]);
          if (repayCount && repayCount.cnt > 0) return res.status(400).json({ error: "Cannot delete FPC Member: used in Loan Repayments." });

          // Check FPC Member own account used in Journal entries
          const fpcAccount = await executeGet(`SELECT Id FROM Accounts WHERE AccountCode = ?`, [`FPC-${id}`]);
          if (fpcAccount) {
              const fpcJournalCount = await executeGet(`SELECT count(*) as cnt FROM JournalLines WHERE AccountId = ?`, [fpcAccount.Id || fpcAccount.id]);
              if (fpcJournalCount && fpcJournalCount.cnt > 0) {
                  return res.status(400).json({ error: "Cannot delete FPC Member: associated Account has Journal entries." });
              }
          }

          // Check linked Vendor and its usage
          const linkedVendor = await executeGet(`SELECT * FROM Vendors WHERE FPCMemberId = ?`, [id]);
          if (linkedVendor) {
              const vendorDbId = linkedVendor.Vendor_ID || linkedVendor.Vendor_Id || linkedVendor.vendor_id || linkedVendor.Id || linkedVendor.id;
              
              const piCount = await executeGet(`SELECT count(*) as cnt FROM PurchaseInvoices WHERE VendorId = ?`, [vendorDbId]);
              if (piCount && piCount.cnt > 0) return res.status(400).json({ error: "Cannot delete FPC Member: synced Vendor has Purchase Invoices." });

              const prCount = await executeGet(`SELECT count(*) as cnt FROM PurchaseReturns WHERE VendorId = ?`, [vendorDbId]);
              if (prCount && prCount.cnt > 0) return res.status(400).json({ error: "Cannot delete FPC Member: synced Vendor has Purchase Returns." });

              // Check purchase orders
              try {
                  const poCount = await executeGet(`SELECT count(*) as cnt FROM PurchaseOrders WHERE VendorId = ?`, [vendorDbId]);
                  if (poCount && poCount.cnt > 0) return res.status(400).json({ error: "Cannot delete FPC Member: synced Vendor is used in Purchase Orders." });
              } catch (e) {
                  // Map table absence
              }

              // Check vendor account journal lines
              const vendorAccount = await executeGet(`SELECT Id FROM Accounts WHERE AccountCode = ?`, [`VEN-${vendorDbId}`]);
              if (vendorAccount) {
                  const vendJournalCount = await executeGet(`SELECT count(*) as cnt FROM JournalLines WHERE AccountId = ?`, [vendorAccount.Id || vendorAccount.id]);
                  if (vendJournalCount && vendJournalCount.cnt > 0) {
                      return res.status(400).json({ error: "Cannot delete FPC Member: synced Vendor Account has Journal entries." });
                  }
              }
          }
      }
      
      const record = await executeGet(`SELECT * FROM ${table} WHERE ${pkCol} = ?`, [id]);
      if (record) {
          if (table.toLowerCase() === 'salesinvoices') {
              if (record.Status !== 'Cancelled' && record.Status !== 'Draft') {
                  await revertSalesInvoiceFromLots(record, executeQuery);
              }
              await unsyncInvoiceFromJournal('SI', id, record.CompanyId);
          }
          if (table.toLowerCase() === 'purchaseinvoices') await unsyncInvoiceFromJournal('PI', id, record.CompanyId);
          if (table.toLowerCase() === 'salesreturns') await unsyncInvoiceFromJournal('SR', id, record.CompanyId);
          if (table.toLowerCase() === 'purchasereturns') await unsyncInvoiceFromJournal('PR', id, record.CompanyId);
          if (table.toLowerCase() === 'cashpayments') await unsyncInvoiceFromJournal('CP', id, record.CompanyId);
          if (table.toLowerCase() === 'cashreceipts') await unsyncInvoiceFromJournal('CR', id, record.CompanyId);
          if (table.toLowerCase() === 'bankpayments') await unsyncInvoiceFromJournal('BP', id, record.CompanyId);
          if (table.toLowerCase() === 'bankreceipts') await unsyncInvoiceFromJournal('BR', id, record.CompanyId);
          
          if (table.toLowerCase() === 'bankaccounts') {
              const accountCode = `BANK-${id}`;
              const companyId = record.CompanyId || record.companyid;
              if (companyId) {
                  await executeQuery(`DELETE FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [accountCode, companyId]);
              }
          }

          if (table.toLowerCase() === 'fpcmembers') {
              const companyId = record.CompanyId || record.companyid;
              // 1. Delete associated account (FPC-${id})
              if (companyId) {
                  await executeQuery(`DELETE FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [`FPC-${id}`, companyId]);
              } else {
                  await executeQuery(`DELETE FROM Accounts WHERE AccountCode = ?`, [`FPC-${id}`]);
              }

              // 2. Find linked vendor and delete its account and vendor master record
              const linkedVendor = await executeGet(`SELECT * FROM Vendors WHERE FPCMemberId = ?`, [id]);
              if (linkedVendor) {
                  const vendorDbId = linkedVendor.Vendor_ID || linkedVendor.Vendor_Id || linkedVendor.vendor_id || linkedVendor.Id || linkedVendor.id;
                  
                  // Delete linked vendor's account (VEN-${vendorDbId})
                  if (companyId) {
                      await executeQuery(`DELETE FROM Accounts WHERE AccountCode = ? AND CompanyId = ?`, [`VEN-${vendorDbId}`, companyId]);
                  } else {
                      await executeQuery(`DELETE FROM Accounts WHERE AccountCode = ?`, [`VEN-${vendorDbId}`]);
                  }

                  // Delete linked vendor
                  await executeQuery(`DELETE FROM Vendors WHERE FPCMemberId = ?`, [id]);
              }
          }
      }

      if (mssqlPool) {
          try {
             const request = mssqlPool.request();
             
             let bindId: any = id;
             const pkColLower = pkCol.toLowerCase();
             if (pkColLower === 'id' || pkColLower === 'vendor_id') {
                 const parsedId = parseInt(id, 10);
                 if (!isNaN(parsedId)) {
                     bindId = parsedId;
                 }
             }
             request.input('id', bindId);
             
             await request.query(`DELETE FROM ${table} WHERE ${pkCol} = @id`);
             await logAuditAction("System Admin", "DELETE", table, typeof bindId === 'number' ? bindId : parseInt(id, 10) || 0, record, record?.FinancialYearId || null, record?.CompanyId || null);
             res.json({ success: true });
          } catch (err: any) {
              if (err.message && err.message.toLowerCase().includes("purchasereturns")) {
                  await ensureTableCreatedInMSSQL("PurchaseReturns");
                  const request = mssqlPool.request();
                  let bindId: any = id;
                  const pkColLower = pkCol.toLowerCase();
                  if (pkColLower === 'id' || pkColLower === 'vendor_id') {
                      const parsedId = parseInt(id, 10);
                      if (!isNaN(parsedId)) {
                          bindId = parsedId;
                      }
                  }
                  request.input('id', bindId);
                  
                  await request.query(`DELETE FROM ${table} WHERE ${pkCol} = @id`);
                  res.json({ success: true });
              } else if (err.message && err.message.toLowerCase().includes("purchaseorders")) {
                  await ensureTableCreatedInMSSQL("PurchaseOrders");
                  const request = mssqlPool.request();
                  let bindId: any = id;
                  const pkColLower = pkCol.toLowerCase();
                  if (pkColLower === 'id' || pkColLower === 'vendor_id') {
                      const parsedId = parseInt(id, 10);
                      if (!isNaN(parsedId)) {
                          bindId = parsedId;
                      }
                  }
                  request.input('id', bindId);
                  
                  await request.query(`DELETE FROM ${table} WHERE ${pkCol} = @id`);
                  res.json({ success: true });
              } else {
                  throw err;
              }
          }
      } else {
         let bindId: any = id;
         const pkColLower = pkCol.toLowerCase();
         if (pkColLower === 'id' || pkColLower === 'vendor_id') {
             const parsedId = parseInt(id, 10);
             if (!isNaN(parsedId)) bindId = parsedId;
         }
         sqliteDb.prepare(`DELETE FROM ${table} WHERE ${pkCol} = ?`).run(bindId);
         await logAuditAction("System Admin", "DELETE", table, typeof bindId === 'number' ? bindId : parseInt(id, 10) || 0, record, record?.FinancialYearId || null, record?.CompanyId || null);
         res.json({ success: true });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.get("/document-sequences/:companyId", async (req, res) => {
      try {
          const companyId = req.params.companyId;
          const sequences = await executeQuery(`SELECT * FROM DocumentSequences WHERE CompanyId = ?`, [companyId]);
          res.json(sequences);
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  apiRouter.post("/document-sequences", async (req, res) => {
      try {
          const { CompanyId, DocumentType, Prefix, FinancialYear } = req.body;
          
          if (mssqlPool) {
              await mssqlPool.request()
                  .input('CompanyId', sql.Int, CompanyId || 1)
                  .input('DocumentType', sql.NVarChar, DocumentType)
                  .input('Prefix', sql.NVarChar, Prefix)
                  .input('FinancialYear', sql.NVarChar, FinancialYear || '2026-2027')
                  .query(`
                    DELETE FROM DocumentSequences 
                    WHERE CompanyId = @CompanyId AND DocumentType = @DocumentType AND FinancialYear = @FinancialYear;
                    INSERT INTO DocumentSequences (CompanyId, DocumentType, Prefix, FinancialYear) 
                    VALUES (@CompanyId, @DocumentType, @Prefix, @FinancialYear)
                  `);
          } else {
              sqliteDb.prepare(`DELETE FROM DocumentSequences WHERE CompanyId = ? AND DocumentType = ? AND FinancialYear = ?`).run(CompanyId, DocumentType, FinancialYear);
              sqliteDb.prepare(`INSERT INTO DocumentSequences (CompanyId, DocumentType, Prefix, FinancialYear) VALUES (?, ?, ?, ?)`).run(CompanyId, DocumentType, Prefix, FinancialYear);
          }
          
          res.json({ success: true });
      } catch (err: any) {
          console.error("Error saving sequence:", err);
          res.status(500).json({ error: err.message });
      }
  });

  // Custom API for Journal Entries with lines
  apiRouter.get("/journal/:id", async (req, res) => {
    try {
      const id = req.params.id;
      let journal: any = null;
      let lines: any[] = [];

      if (mssqlPool) {
        const reqHeader = mssqlPool.request();
        reqHeader.input('id', parseInt(id, 10));
        const headResult = await reqHeader.query("SELECT * FROM JournalEntries WHERE Id = @id");
        if (headResult.recordset.length === 0) {
          return res.status(404).json({ error: "Journal entry not found" });
        }
        journal = headResult.recordset[0];

        const reqLines = mssqlPool.request();
        reqLines.input('journalId', parseInt(id, 10));
        const linesResult = await reqLines.query("SELECT * FROM JournalLines WHERE JournalEntryId = @journalId");
        lines = linesResult.recordset;
      } else {
        const headResult = sqliteDb.prepare("SELECT * FROM JournalEntries WHERE Id = ?").get(id);
        if (!headResult) {
          return res.status(404).json({ error: "Journal entry not found" });
        }
        journal = headResult;
        lines = sqliteDb.prepare("SELECT * FROM JournalLines WHERE JournalEntryId = ?").all(id);
      }

      res.json({ ...journal, lines });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/journal", async (req, res) => {
    try {
      const data = req.body;
      const { CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate, lines } = data;

      let insertedId: any = null;

      if (mssqlPool) {
        const reqHeader = mssqlPool.request();
        reqHeader.input('CompanyId', CompanyId ? parseInt(CompanyId, 10) : null);
        reqHeader.input('EntryNumber', EntryNumber || '');
        reqHeader.input('Reference', Reference || '');
        reqHeader.input('Narration', Narration || '');
        reqHeader.input('TotalAmount', TotalAmount ? parseFloat(TotalAmount) : 0);
        reqHeader.input('Status', Status || 'Draft');
        reqHeader.input('EntryDate', EntryDate || '');

        const headResult = await reqHeader.query(`
          INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate)
          OUTPUT INSERTED.Id
          VALUES (@CompanyId, @EntryNumber, @Reference, @Narration, @TotalAmount, @Status, @EntryDate)
        `);
        insertedId = headResult.recordset[0].Id;

        if (Array.isArray(lines)) {
          for (const line of lines) {
            const reqLine = mssqlPool.request();
            reqLine.input('JournalEntryId', insertedId);
            reqLine.input('AccountId', line.AccountId ? parseInt(line.AccountId, 10) : null);
            reqLine.input('Description', line.Description || '');
            reqLine.input('Debit', line.Debit ? parseFloat(line.Debit) : 0);
            reqLine.input('Credit', line.Credit ? parseFloat(line.Credit) : 0);
            await reqLine.query(`
              INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit)
              VALUES (@JournalEntryId, @AccountId, @Description, @Debit, @Credit)
            `);
          }
        }
      } else {
        const info = sqliteDb.prepare(`
          INSERT INTO JournalEntries (CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          CompanyId ? parseInt(CompanyId, 10) : null,
          EntryNumber || '',
          Reference || '',
          Narration || '',
          TotalAmount ? parseFloat(TotalAmount) : 0,
          Status || 'Draft',
          EntryDate || ''
        );
        insertedId = info.lastInsertRowid;

        if (Array.isArray(lines)) {
          const insertLine = sqliteDb.prepare(`
            INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const line of lines) {
            insertLine.run(
              insertedId,
              line.AccountId ? parseInt(line.AccountId, 10) : null,
              line.Description || '',
              line.Debit ? parseFloat(line.Debit) : 0,
              line.Credit ? parseFloat(line.Credit) : 0
            );
          }
        }
      }

      res.json({ success: true, id: insertedId });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.put("/journal/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;
      const { CompanyId, EntryNumber, Reference, Narration, TotalAmount, Status, EntryDate, lines } = data;

      if (mssqlPool) {
        const reqHeader = mssqlPool.request();
        reqHeader.input('id', parseInt(id, 10));
        reqHeader.input('CompanyId', CompanyId ? parseInt(CompanyId, 10) : null);
        reqHeader.input('EntryNumber', EntryNumber || '');
        reqHeader.input('Reference', Reference || '');
        reqHeader.input('Narration', Narration || '');
        reqHeader.input('TotalAmount', TotalAmount ? parseFloat(TotalAmount) : 0);
        reqHeader.input('Status', Status || 'Draft');
        reqHeader.input('EntryDate', EntryDate || '');

        await reqHeader.query(`
          UPDATE JournalEntries
          SET CompanyId = @CompanyId, EntryNumber = @EntryNumber, Reference = @Reference,
              Narration = @Narration, TotalAmount = @TotalAmount, Status = @Status, EntryDate = @EntryDate
          WHERE Id = @id
        `);

        // Delete existing lines
        const deleteReq = mssqlPool.request();
        deleteReq.input('id', parseInt(id, 10));
        await deleteReq.query("DELETE FROM JournalLines WHERE JournalEntryId = @id");

        if (Array.isArray(lines)) {
          for (const line of lines) {
            const reqLine = mssqlPool.request();
            reqLine.input('JournalEntryId', parseInt(id, 10));
            reqLine.input('AccountId', line.AccountId ? parseInt(line.AccountId, 10) : null);
            reqLine.input('Description', line.Description || '');
            reqLine.input('Debit', line.Debit ? parseFloat(line.Debit) : 0);
            reqLine.input('Credit', line.Credit ? parseFloat(line.Credit) : 0);
            await reqLine.query(`
              INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit)
              VALUES (@JournalEntryId, @AccountId, @Description, @Debit, @Credit)
            `);
          }
        }
      } else {
        sqliteDb.prepare(`
          UPDATE JournalEntries
          SET CompanyId = ?, EntryNumber = ?, Reference = ?, Narration = ?, TotalAmount = ?, Status = ?, EntryDate = ?
          WHERE Id = ?
        `).run(
          CompanyId ? parseInt(CompanyId, 10) : null,
          EntryNumber || '',
          Reference || '',
          Narration || '',
          TotalAmount ? parseFloat(TotalAmount) : 0,
          Status || 'Draft',
          EntryDate || '',
          id
        );

        sqliteDb.prepare("DELETE FROM JournalLines WHERE JournalEntryId = ?").run(id);

        if (Array.isArray(lines)) {
          const insertLine = sqliteDb.prepare(`
            INSERT INTO JournalLines (JournalEntryId, AccountId, Description, Debit, Credit)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const line of lines) {
            insertLine.run(
              id,
              line.AccountId ? parseInt(line.AccountId, 10) : null,
              line.Description || '',
              line.Debit ? parseFloat(line.Debit) : 0,
              line.Credit ? parseFloat(line.Credit) : 0
            );
          }
        }
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete("/journal/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (mssqlPool) {
        const deleteLines = mssqlPool.request();
        deleteLines.input('id', parseInt(id, 10));
        await deleteLines.query("DELETE FROM JournalLines WHERE JournalEntryId = @id");

        const deleteHeader = mssqlPool.request();
        deleteHeader.input('id', parseInt(id, 10));
        await deleteHeader.query("DELETE FROM JournalEntries WHERE Id = @id");
      } else {
        sqliteDb.prepare("DELETE FROM JournalLines WHERE JournalEntryId = ?").run(id);
        sqliteDb.prepare("DELETE FROM JournalEntries WHERE Id = ?").run(id);
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  installLotsApi(apiRouter, executeQuery);
  app.use("/api", apiRouter);
  app.use("/api/v1", apiRouter);

  // === VITE MIDDLEWARE SETUP ===
  let isDevMode = process.env.NODE_ENV !== "production";
  
  // If we are running the compiled dist bundle, always run in production mode
  if (typeof __filename !== "undefined" && (__filename.endsWith('server.cjs') || __filename.includes('dist'))) {
    isDevMode = false;
  }

  if (isDevMode) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteError) {
      console.warn("⚠️ Failed to boot Vite development server, falling back to compiled production serving:", viteError);
      isDevMode = false;
    }
  }

  if (!isDevMode) {
    // Production serving - Robust resolution of dist path
    let distPath = path.join(process.cwd(), 'dist');
    
    // In compiled CJS dist/server.cjs, __dirname refers to <root>/dist. We look there first:
    if (typeof __dirname !== 'undefined') {
      const parentDir = path.join(__dirname, '..');
      const compiledDistPath = __dirname; // since server.cjs is in dist, __dirname is the dist folder itself!
      const siblingDistPath = path.join(parentDir, 'dist');
      
      if (fs.existsSync(compiledDistPath) && fs.existsSync(path.join(compiledDistPath, 'index.html'))) {
        distPath = compiledDistPath;
      } else if (fs.existsSync(siblingDistPath) && fs.existsSync(path.join(siblingDistPath, 'index.html'))) {
        distPath = siblingDistPath;
      }
    }

    if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
      console.log("Serving static production assets from:", distPath);
      app.use(express.static(distPath, {
        etag: false,
        lastModified: false,
        setHeaders: (res, filePath) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        }
      }));
      app.get('*', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.error(`❌ CRITICAL: 'dist' directory not found (attempted matching: "${distPath}")! Production web server cannot serve static assets.`);
    }
  }

  const listenPortOrPath = typeof PORT === "string" && isNaN(Number(PORT)) ? PORT : Number(PORT);
  
  const onListen = async () => {
    console.log(`Server running on: ${PORT}`);
    console.log("=========================================");
    console.log("DATABASE CONNECTION INFO:");
    if (mssqlPool) {
        console.log(`✅ CONNECTED TO LOCAL MS SQL SERVER! (DB_SERVER="${process.env.DB_SERVER}")`);
        console.log(`Using Database: ${process.env.DB_NAME}`);
    } else if (process.env.DB_SERVER) {
        console.log(`⚠️ Detected MS SQL settings in .env (DB_SERVER="${process.env.DB_SERVER}") but connection failed!`);
        console.log(`Check your .env credentials and ensure SQL Server is running and accessible from where you started node.`);
        console.log(`Using built-in SQLite (fpc_database.sqlite) as a fallback.`);
    } else {
        console.log("Using built-in SQLite (fpc_database.sqlite). No DB_SERVER detected in .env.");
    }
    console.log("=========================================");

    // Post-startup trigger to ensure ledgers are correctly synced
    try {
        setTimeout(async () => {
             const syncPort = typeof listenPortOrPath === "number" ? listenPortOrPath : 3000;
             fetch(`http://127.0.0.1:${syncPort}/api/v1/sync-accounts`, { method: 'POST' })
             .then(r => r.json())
             .then(data => console.log('Auto-sync completed on startup:', data))
             .catch(e => console.error('Auto-sync failed on startup:', e));

             // 2. ONE-TIME LOCATION ASSIGNMENT
             try {
                 const locations = await executeQuery('SELECT * FROM Locations ORDER BY Id ASC');
                 if (locations && locations.length > 0) {
                     const firstLocId = locations[0].Id || locations[0].id;
                     console.log(`Setting default locationId to ${firstLocId} where missing...`);
                     
                     if (process.env.DB_TYPE === 'mssql' || true) {
                         await executeQuery(`UPDATE InventoryItems SET Location = ? WHERE Location IS NULL OR Location = '' OR Location = '0'`, [firstLocId]);
                     }
                     
                     const tables = ['SalesInvoices', 'PurchaseInvoices', 'SalesReturns', 'PurchaseReturns', 'StockAdjustments'];
                     for (const table of tables) {
                         const rows = await executeQuery(`SELECT Id, ItemsData FROM ${table}`);
                         for (const row of rows) {
                             if (row.ItemsData) {
                                 let changed = false;
                                 try {
                                     const items = JSON.parse(row.ItemsData);
                                     if (Array.isArray(items)) {
                                         for (const item of items) {
                                             if (!item.locationId && !item.LocationId) {
                                                  item.locationId = firstLocId;
                                                  changed = true;
                                             }
                                         }
                                         if (changed) {
                                             if (process.env.DB_TYPE === 'mssql' || true) {
                                                 await executeQuery(`UPDATE ${table} SET ItemsData = ? WHERE Id = ?`, [JSON.stringify(items), row.Id || row.id]);
                                             }
                                         }
                                     }
                                 } catch(e) {}
                             }
                         }
                     }
                     console.log('Location assignment completed successfully.');
                 }
             } catch(e) {
                 console.log('Failed to assign initial locations:', e);
             }
        }, 5000);
    } catch (e) {
        console.error(e);
    }
  };

  if (typeof listenPortOrPath === "number") {
    app.listen(listenPortOrPath, "0.0.0.0", onListen);
  } else {
    app.listen(listenPortOrPath as any, onListen);
  }
}

startServer().catch((e) => {
  console.error("Failed to start server", e);
  process.exit(1);
});
