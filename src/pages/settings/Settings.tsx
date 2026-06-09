import React, { useState } from 'react';
import { Save, Building2, Receipt, Shield, Bell, Database, Download, Code } from 'lucide-react';
import JSZip from 'jszip';

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  const handleDownloadSQL = () => {
    const sqlContent = `-- Krishi ERP FPC Management System - Complete Database Script & Data
-- Generated: ${new Date().toISOString()}
-- Platform: Microsoft SQL Server

-- ==========================================
-- 1. SCHEMA DEFINITIONS (TABLES)
-- ==========================================

CREATE TABLE Companies (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    CIN NVARCHAR(50),
    GSTIN NVARCHAR(50),
    PAN NVARCHAR(50),
    City NVARCHAR(100),
    State NVARCHAR(100),
    Address NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255),
    Phone NVARCHAR(50),
    Role NVARCHAR(50),
    Status NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE InventoryItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    ItemCode NVARCHAR(50),
    Name NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100),
    Quantity INT DEFAULT 0,
    Unit NVARCHAR(50),
    UnitPrice DECIMAL(18,2) DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Accounts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    AccountCode NVARCHAR(50),
    Name NVARCHAR(255) NOT NULL,
    AccountGroup NVARCHAR(100),
    AccountType NVARCHAR(50),
    OpeningBalance DECIMAL(18,2) DEFAULT 0,
    BalanceType NVARCHAR(10),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE FPCMembers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    MemberId NVARCHAR(50),
    FarmerName NVARCHAR(255) NOT NULL,
    Village NVARCHAR(100),
    LandHolding DECIMAL(10,2),
    JoinDate DATE
);

CREATE TABLE FinancialYears (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    FinancialYear NVARCHAR(50),
    FromDate DATETIME,
    ToDate DATETIME,
    Status NVARCHAR(50) DEFAULT 'Active',
    CONSTRAINT UQ_FinancialYear_Company UNIQUE (FinancialYear, CompanyId)
);

CREATE TABLE Customers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    CustomerName NVARCHAR(255) NOT NULL,
    RegistrationNo NVARCHAR(100),
    Address NVARCHAR(MAX),
    OpeningBalance DECIMAL(18,2) DEFAULT 0,
    ContactPerson NVARCHAR(100),
    PhoneNo NVARCHAR(50),
    EmailID NVARCHAR(255),
    StateCode NVARCHAR(50),
    Range NVARCHAR(100),
    Division NVARCHAR(100),
    GSTINNo NVARCHAR(50),
    AadharCardNo NVARCHAR(50),
    TANNo NVARCHAR(50),
    PANNo NVARCHAR(50),
    CINNo NVARCHAR(50),
    Commissionrate DECIMAL(18,2) DEFAULT 0,
    AccountingCircle NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE ShareCapital (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MemberId INT FOREIGN KEY REFERENCES FPCMembers(Id),
    CertificateNo NVARCHAR(50),
    Shares INT,
    Amount DECIMAL(18,2),
    IssueDate DATE
);

CREATE TABLE Loans (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    FinancialYearId INT NULL,
    MemberId INT FOREIGN KEY REFERENCES FPCMembers(Id),
    LoanType NVARCHAR(100),
    PrincipalAmount DECIMAL(18,2),
    Outstanding DECIMAL(18,2),
    DisbursementDate DATE
);

CREATE TABLE SalesInvoices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    FinancialYearId INT NULL,
    InvoiceNumber NVARCHAR(50),
    CustomerId INT FOREIGN KEY REFERENCES Customers(Id),
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50),
    InvoiceDate DATE
);

CREATE TABLE PurchaseOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    FinancialYearId INT NULL,
    OrderNumber NVARCHAR(50),
    VendorId INT,
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50),
    OrderDate DATE
);

CREATE TABLE PurchaseInvoices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NULL FOREIGN KEY REFERENCES Companies(Id),
    FinancialYearId INT NULL,
    InvoiceNumber NVARCHAR(50),
    VendorId INT,
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50),
    InvoiceDate DATE
);

CREATE TABLE StockAdjustments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AdjustmentNumber NVARCHAR(50),
    ItemId INT FOREIGN KEY REFERENCES InventoryItems(Id),
    AdjustmentType NVARCHAR(50),
    QuantityChanged INT,
    Reason NVARCHAR(255),
    AdjustmentDate DATE
);

CREATE TABLE Assets (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AssetCode NVARCHAR(50),
    Name NVARCHAR(255),
    Category NVARCHAR(100),
    PurchaseDate DATE,
    Cost DECIMAL(18,2),
    CurrentValue DECIMAL(18,2),
    Status NVARCHAR(50)
);

CREATE TABLE JournalEntries (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EntryNumber NVARCHAR(50),
    Reference NVARCHAR(255),
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50),
    EntryDate DATE
);

-- ==========================================
-- 2. INDEXES
-- ==========================================
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_InventoryItems_ItemCode ON InventoryItems(ItemCode);
CREATE INDEX IX_Accounts_AccountCode ON Accounts(AccountCode);
CREATE INDEX IX_FPCMembers_MemberId ON FPCMembers(MemberId);
CREATE INDEX IX_SalesInvoices_InvoiceNumber ON SalesInvoices(InvoiceNumber);
CREATE INDEX IX_SalesInvoices_InvoiceDate ON SalesInvoices(InvoiceDate);
CREATE INDEX IX_PurchaseOrders_OrderNumber ON PurchaseOrders(OrderNumber);
CREATE INDEX IX_PurchaseInvoices_InvoiceNumber ON PurchaseInvoices(InvoiceNumber);

-- ==========================================
-- 3. MASTER DATA INSERTS
-- ==========================================

SET IDENTITY_INSERT Companies ON;
INSERT INTO Companies (Id, Name, CIN, GSTIN, PAN, City, State, Address) VALUES 
(1, 'Vidarbha Agro Farmer Producer Company', 'U01100MH2021PTC123456', '27AAACB1234C1Z5', 'AAACB1234C', 'Nagpur', 'Maharashtra', 'Nagpur, Maharashtra');
SET IDENTITY_INSERT Companies OFF;

SET IDENTITY_INSERT Users ON;
INSERT INTO Users (Id, CompanyId, Name, Email, Phone, Role, Status) VALUES 
(1, 1, 'Sanjay Kumar', 'admin@fpc.com', '9876543210', 'Super Admin', 'Active'),
(2, 1, 'Anita Desai', 'anita.d@fpc.com', '9876543211', 'HR', 'Active');
SET IDENTITY_INSERT Users OFF;

SET IDENTITY_INSERT InventoryItems ON;
INSERT INTO InventoryItems (Id, ItemCode, Name, Category, Quantity, Unit, UnitPrice) VALUES
(1, 'ITM-001', 'Urea Fertilizer 50kg', 'Fertilizers', 250, 'Bags', 266.00),
(2, 'ITM-002', 'Premium Wheat Seeds', 'Seeds', 500, 'kg', 120.00);
SET IDENTITY_INSERT InventoryItems OFF;

SET IDENTITY_INSERT Accounts ON;
INSERT INTO Accounts (Id, AccountCode, Name, AccountGroup, AccountType, OpeningBalance, BalanceType) VALUES 
(1, '1001', 'Cash in Hand', 'Current Assets', 'Asset', 25000.00, 'Dr'),
(2, '1002', 'HDFC Bank C/A', 'Bank Accounts', 'Asset', 450000.00, 'Dr'),
(3, '2001', 'Share Capital', 'Capital Account', 'Equity', 500000.00, 'Cr'),
(4, '3001', 'Sales Revenue', 'Direct Incomes', 'Revenue', 1200000.00, 'Cr'),
(5, '4001', 'Purchases', 'Direct Expenses', 'Expense', 800000.00, 'Dr');
SET IDENTITY_INSERT Accounts OFF;
`;
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fpc-database-script-full.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    try {
      setIsGeneratingZip(true);
      const response = await fetch('/api/v1/export/source_v2');
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fpc-source-code.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download source code', e);
      alert('Failed to download zip');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure global application parameters and preferences.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation/Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col p-2 space-y-1">
             <button 
               onClick={() => setActiveTab('general')}
               className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
             >
               <Building2 className="w-4 h-4" /> General Parameters
             </button>
             <button 
               onClick={() => setActiveTab('tax')}
               className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'tax' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
             >
               <Receipt className="w-4 h-4" /> Tax & Finance
             </button>
             <button 
               onClick={() => setActiveTab('security')}
               className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
             >
               <Shield className="w-4 h-4" /> Security & Access
             </button>
             <button 
               onClick={() => setActiveTab('notifications')}
               className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
             >
               <Bell className="w-4 h-4" /> Notifications
             </button>
             <button 
               onClick={() => setActiveTab('backup')}
               className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'backup' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
             >
               <Database className="w-4 h-4" /> Backup & Restore
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">General Parameters</h2>
                  <p className="text-xs text-gray-500 mt-1">Basic software operational settings.</p>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Financial Year Start</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="apr-mar">1st April to 31st March (India)</option>
                        <option value="jan-dec">1st January to 31st December</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Date Format</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024/12/31)</option>
                      </select>
                    </div>

                     <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Currency Symbol</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="INR">₹ (INR - Indian Rupee)</option>
                        <option value="USD">$ (USD - US Dollar)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Timezone</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="IST">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">Sequence / Prefix Configuration</h2>
                  <p className="text-xs text-gray-500 mt-1">Configure auto-generated numbering prefixes.</p>
                </div>
                <div className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Sales Invoice</label>
                      <div className="flex">
                        <input type="text" defaultValue="INV/" className="w-20 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center uppercase" />
                        <input type="text" defaultValue="2024-25" className="flex-1 px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md text-sm bg-gray-50 text-gray-500" readOnly />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Purchase Order</label>
                      <div className="flex">
                        <input type="text" defaultValue="PO/" className="w-20 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center uppercase" />
                        <input type="text" defaultValue="2024-25" className="flex-1 px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md text-sm bg-gray-50 text-gray-500" readOnly />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Receipt Voucher</label>
                      <div className="flex">
                        <input type="text" defaultValue="RV/" className="w-20 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center uppercase" />
                        <input type="text" defaultValue="2024-25" className="flex-1 px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md text-sm bg-gray-50 text-gray-500" readOnly />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'tax' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Tax & Finance Settings</h2>
                <p className="text-xs text-gray-500 mt-1">Configure GST, TDS, and other reporting parameters.</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 text-center py-8">Tax configuration options will appear here.</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Security & Access Control</h2>
                <p className="text-xs text-gray-500 mt-1">Manage user roles, permissions, and security policies.</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 text-center py-8">Role based access controls will appear here.</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                <p className="text-xs text-gray-500 mt-1">Configure email, SMS, and in-app alert templates.</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 text-center py-8">Notification channels and templates will appear here.</p>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">Database & Scripts Download</h2>
                  <p className="text-xs text-gray-500 mt-1">Download database schemas, scripts, and complete data backups for local deployment.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        Complete Database Script & Data
                      </h3>
                      <p className="text-xs text-gray-500 max-w-lg leading-relaxed">
                        Downloads the complete SQL database script. Includes schema definitions (tables, relations), stored procedures, constraints, and current live data (Point-in-time) for direct restoration.
                      </p>
                    </div>
                    <button 
                      onClick={handleDownloadSQL}
                      className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download SQL Script
                    </button>
                  </div>
                  
                  <div className="flex items-start justify-between border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50/30 transition-colors">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Code className="w-4 h-4 text-green-600" />
                        Complete Source Code (End-to-End)
                      </h3>
                      <p className="text-xs text-gray-500 max-w-lg leading-relaxed">
                        Downloads a comprehensive ZIP file containing the full project source code. Fully configured to run locally with your local SQL Server instance.
                      </p>
                    </div>
                    <button 
                      onClick={handleDownloadZip}
                      disabled={isGeneratingZip}
                      className={`shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium transition-colors ${isGeneratingZip ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Download className={`w-4 h-4 ${isGeneratingZip ? 'animate-bounce' : ''}`} />
                      {isGeneratingZip ? 'Generating ZIP...' : 'Download Source ZIP'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">Cloud Auto-Backup</h2>
                  <p className="text-xs text-gray-500 mt-1">Configure automated daily backups to secure cloud storage.</p>
                </div>
                <div className="p-6">
                   <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-3">
                       <div className="relative inline-block w-11 h-6 select-none bg-blue-600 rounded-full transition-colors cursor-pointer">
                         <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform translate-x-5"></span>
                       </div>
                       <span className="text-sm font-medium text-gray-900">Enable automated daily backups</span>
                     </div>
                     <p className="text-xs text-gray-500 pl-14">Next backup scheduled for: Today at 23:59 IST</p>
                   </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
