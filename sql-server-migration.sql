-- sql-server-migration.sql
-- Run this script in your local SQL Server to add the new Company Master columns

ALTER TABLE Companies ADD PhoneNo NVARCHAR(100) NULL;
ALTER TABLE Companies ADD Address NVARCHAR(MAX) NULL;
ALTER TABLE Companies ADD EmailID NVARCHAR(255) NULL;
ALTER TABLE Companies ADD ContactPerson NVARCHAR(150) NULL;
ALTER TABLE Companies ADD BusinessDetails NVARCHAR(MAX) NULL;

ALTER TABLE Companies ADD RegistrationNo NVARCHAR(100) NULL;
ALTER TABLE Companies ADD AadharCardNo NVARCHAR(50) NULL;
ALTER TABLE Companies ADD TANNo NVARCHAR(50) NULL;
ALTER TABLE Companies ADD CINNo NVARCHAR(50) NULL;
ALTER TABLE Companies ADD StateCode NVARCHAR(50) NULL;
ALTER TABLE Companies ADD TaxRange NVARCHAR(100) NULL;
ALTER TABLE Companies ADD Division NVARCHAR(100) NULL;

ALTER TABLE Companies ADD BankName NVARCHAR(150) NULL;
ALTER TABLE Companies ADD BankBranch NVARCHAR(150) NULL;
ALTER TABLE Companies ADD AccountNumber NVARCHAR(100) NULL;
ALTER TABLE Companies ADD AccountType NVARCHAR(50) NULL;
ALTER TABLE Companies ADD BankAddress NVARCHAR(MAX) NULL;
ALTER TABLE Companies ADD MICRCode NVARCHAR(50) NULL;
ALTER TABLE Companies ADD IFSCCode NVARCHAR(50) NULL;

-- Dynamic Terms on Company Master
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'DefaultQuotationTerms') ALTER TABLE Companies ADD DefaultQuotationTerms NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'DefaultSalesOrderTerms') ALTER TABLE Companies ADD DefaultSalesOrderTerms NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'DefaultSalesInvoiceTerms') ALTER TABLE Companies ADD DefaultSalesInvoiceTerms NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND name = 'DefaultPurchaseOrderTerms') ALTER TABLE Companies ADD DefaultPurchaseOrderTerms NVARCHAR(MAX) NULL;

GO
