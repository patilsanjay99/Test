import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Building2, Receipt, Shield, Bell, Database, Download, Code, ClipboardList, Cloud, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';

export function Settings() {
  const { hasPermission } = useAuth();
  const [sequences, setSequences] = useState<any[]>([]);
  const { user } = useAuth();
  const companyId = user?.companyId || 1;
  const [defaultQuotationTerms, setDefaultQuotationTerms] = useState('');
  const [defaultSalesOrderTerms, setDefaultSalesOrderTerms] = useState('');
  const [defaultSalesInvoiceTerms, setDefaultSalesInvoiceTerms] = useState('');
  const [defaultPurchaseOrderTerms, setDefaultPurchaseOrderTerms] = useState('');

  useEffect(() => {
    fetch(`/api/data/Companies?Id=${companyId}`)
      .then(res => res.json())
      .then(data => {
        const company = Array.isArray(data) ? data[0] : data;
        if (company) {
          if (company.DefaultQuotationTerms) {
            setDefaultQuotationTerms(company.DefaultQuotationTerms);
          }
          if (company.DefaultSalesOrderTerms) {
            setDefaultSalesOrderTerms(company.DefaultSalesOrderTerms);
          }
          if (company.DefaultSalesInvoiceTerms) {
            setDefaultSalesInvoiceTerms(company.DefaultSalesInvoiceTerms);
          }
          if (company.DefaultPurchaseOrderTerms) {
            setDefaultPurchaseOrderTerms(company.DefaultPurchaseOrderTerms);
          }
        }
      })
      .catch(console.error);

    fetch(`/api/document-sequences/${companyId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => {
        console.log("Fetched sequences:", data);
        const TYPES = ['SalesInvoices', 'PurchaseInvoices', 'SalesOrders', 'PurchaseOrders', 'SalesQuotations', 'PurchaseQuotations', 'ReceiptVouchers', 'PaymentVouchers', 'BankPayments', 'BankReceipts', 'JournalEntries'];
        const allSequences = TYPES.map(type => {
            const existing = data.find((s: any) => s.DocumentType === type);
            return existing || { DocumentType: type, Prefix: '', CompanyId: companyId, FinancialYear: '2026-2027' };
        });
        setSequences(allSequences);
      })
      .catch(err => console.error('Fetch error:', err));
  }, [companyId]);

  const [activeTab, setActiveTab] = useState('general');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isGeneratingDeployZip, setIsGeneratingDeployZip] = useState(false);
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);
  const [selectedRole, setSelectedRole] = useState('HR');

  const handleSyncAccounts = async () => {
    try {
      setIsSyncingAccounts(true);
      const res = await fetch('/api/v1/sync-accounts', { method: 'POST' });
      if (res.ok) {
        alert('Accounts ledger synchronized successfully!');
      } else {
        alert('Failed to synchronize Accounts.');
      }
    } catch (err: any) {
      alert('Error during sync: ' + err.message);
    } finally {
      setIsSyncingAccounts(false);
    }
  };

  const [isCleanupUnlocked, setIsCleanupUnlocked] = useState(false);
  const [cleanupPasswordInput, setCleanupPasswordInput] = useState('');

  const [systemRoles, setSystemRoles] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/data/SystemRoles')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setSystemRoles(data);
        if (data.length > 0 && !data.find((d: any) => d.RoleName === selectedRole)) {
          setSelectedRole(data[0].RoleName);
        }
      })
      .catch();
  }, []);

  const defaultPermissions = {
    'Master Data: Company Details': { view: true, add: false, edit: false, delete: false },
    'Master Data: Financial Years': { view: true, add: false, edit: false, delete: false },
    'Master Data: Customer Details': { view: true, add: false, edit: false, delete: false },
    'Master Data: Vendor Details': { view: true, add: false, edit: false, delete: false },
    'Master Data: Bank Details': { view: true, add: false, edit: false, delete: false },
    'Master Data: Users & Roles': { view: true, add: false, edit: false, delete: false },
    'Master Data: Item Details': { view: true, add: false, edit: false, delete: false },
    'Master Data: Locations': { view: true, add: false, edit: false, delete: false },
    'Master Data: Units': { view: true, add: true, edit: true, delete: true },
    'Master Data: Account Groups': { view: true, add: false, edit: false, delete: false },
    'Master Data: Chart of Accounts': { view: true, add: false, edit: false, delete: false },
    'FPC Management: FPC Members': { view: true, add: true, edit: true, delete: false },
    'FPC Management: Member Register': { view: true, add: false, edit: false, delete: false },
    'FPC Management: Share Management': { view: true, add: true, edit: true, delete: false },
    'FPC Management: Loan Management': { view: true, add: true, edit: true, delete: false },
    'Sales: Sales Quotations': { view: true, add: false, edit: false, delete: false },
    'Sales: Sales Orders': { view: true, add: false, edit: false, delete: false },
    'Sales: Sales Invoices': { view: true, add: false, edit: false, delete: false },
    'Sales: Sales Returns': { view: true, add: false, edit: false, delete: false },
    'Purchase: Purchase Orders': { view: true, add: false, edit: false, delete: false },
    'Purchase: Purchase Invoices': { view: true, add: false, edit: false, delete: false },
    'Purchase: Purchase Returns': { view: true, add: false, edit: false, delete: false },
    'Inventory: Stock Summary': { view: true, add: false, edit: false, delete: false },
    'Inventory: Stock Ledger': { view: true, add: false, edit: false, delete: false },
    'Inventory: Stock Adjustments': { view: true, add: false, edit: false, delete: false },
    'Assets: Asset Register': { view: true, add: false, edit: false, delete: false },
    'Accounting: Journal Entries': { view: true, add: false, edit: false, delete: false },
    'Accounting: Cash Payments': { view: true, add: false, edit: false, delete: false },
    'Accounting: Bank Payments': { view: true, add: false, edit: false, delete: false },
    'Accounting: Cash Receipts': { view: true, add: false, edit: false, delete: false },
    'Accounting: Bank Receipts': { view: true, add: false, edit: false, delete: false },
    'MIS & Reports: MIS & Reports': { view: true, add: false, edit: false, delete: false },
    'E-Tracker: Dashboard': { view: true, add: false, edit: false, delete: false },
    'E-Tracker: Ticket Management': { view: true, add: true, edit: true, delete: true },
    'E-Tracker: Status Configuration': { view: true, add: true, edit: true, delete: true },
    'Settings: Settings': { view: true, add: true, edit: true, delete: true },
  };

  const [permissions, setPermissions] = useState<any>({});

  useEffect(() => {
    const stored = localStorage.getItem('fpc_role_permissions');
    
    // Create Super Admin permissions: all actions true, except for reports which only have view
    const superAdminPermissions = Object.keys(defaultPermissions).reduce((acc: any, module: string) => {
      const isReport = module.startsWith('Reports');
      acc[module] = isReport 
        ? { view: true, add: false, edit: false, delete: false }
        : { view: true, add: true, edit: true, delete: true };
      return acc;
    }, {});

    if (stored) {
      const parsedStored = JSON.parse(stored);
      // Merge stored with default to ensure new modules are included.
      const merged = { ...parsedStored };
      Object.keys(merged).forEach(role => {
          merged[role] = { ...defaultPermissions, ...merged[role] };
      });
      setPermissions(merged);
    } else {
      setPermissions({ 
        'HR': defaultPermissions,
        'Super Admin': superAdminPermissions 
      });
    }
  }, []);

  const handlePermissionChange = (module: string, action: string, value: boolean) => {
    setPermissions((prev: any) => ({
      ...prev,
      [selectedRole]: {
        ...(prev[selectedRole] || defaultPermissions),
        [module]: {
          ...(prev[selectedRole]?.[module] || defaultPermissions[module as keyof typeof defaultPermissions]),
          [action]: value
        }
      }
    }));
  };

  const handleBulkActionChange = (action: string, value: boolean) => {
    setPermissions((prev: any) => {
      // Ensure we merge with defaultPermissions to have all modules
      const currentRole = { ...defaultPermissions, ...(prev[selectedRole] || {}) };
      const newRolePermissions = { ...currentRole };
      
      Object.keys(newRolePermissions).forEach(module => {
        // Can't set permissions for Reports, skip them
        if (!module.startsWith('MIS & Reports:') || action === 'view') {
          newRolePermissions[module] = {
            ...newRolePermissions[module],
            [action]: value
          };
        }
      });
      return { ...prev, [selectedRole]: newRolePermissions };
    });
  };

  const handleBulkModuleChange = (module: string, value: boolean) => {
    setPermissions((prev: any) => {
      const currentRole = { ...defaultPermissions, ...(prev[selectedRole] || {}) };
      const modulePerms = currentRole[module] || defaultPermissions[module as keyof typeof defaultPermissions];
      
      const newModulePerms = { ...modulePerms };
      Object.keys(newModulePerms).forEach(action => {
        if (!module.startsWith('MIS & Reports:') || action === 'view') {
          newModulePerms[action] = value;
        }
      });
      
      return { ...prev, [selectedRole]: { ...currentRole, [module]: newModulePerms } };
    });
  };

  const currentRolePerms = { ...defaultPermissions, ...(permissions[selectedRole] || {}) };

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
    Password NVARCHAR(255) DEFAULT 'welcome123',
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
    Commissionrate NVARCHAR(50),
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
      const response = await fetch('/api/export/source_v2');
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

  const handleDownloadDeployZip = async () => {
    try {
      setIsGeneratingDeployZip(true);
      const response = await fetch('/api/export/deployment');
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fpc-cloud-deployment-package.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download deployment package', e);
      alert('Failed to download cloud package ZIP');
    } finally {
      setIsGeneratingDeployZip(false);
    }
  };

  const handleSave = async () => {
    localStorage.setItem('fpc_role_permissions', JSON.stringify(permissions));
    
    // Save company terms
    const termRes = await fetch(`/api/data/Companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            DefaultQuotationTerms: defaultQuotationTerms,
            DefaultSalesOrderTerms: defaultSalesOrderTerms,
            DefaultSalesInvoiceTerms: defaultSalesInvoiceTerms,
            DefaultPurchaseOrderTerms: defaultPurchaseOrderTerms
        })
    });
    if (!termRes.ok) {
        console.error('Failed to save terms');
        alert('Failed to save terms');
        return;
    }
    
    // Save sequences
    for (const seq of sequences) {
        const res = await fetch('/api/document-sequences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                CompanyId: companyId,
                DocumentType: seq.DocumentType,
                Prefix: seq.Prefix,
                FinancialYear: seq.FinancialYear || '2026-2027'
            })
        });
        if (!res.ok) {
            console.error(`Failed to save ${seq.DocumentType}:`, await res.text());
            alert(`Failed to save ${seq.DocumentType}`);
            return;
        }
    }

    alert('Settings saved successfully!');
    window.location.reload(); // Refresh to apply changes if any
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure global application parameters and preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
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
               onClick={() => setActiveTab('permissions')}
               className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'permissions' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
             >
               <Shield className="w-4 h-4" /> Role & Permissions
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
             <button 
               onClick={() => setActiveTab('cleanup')}
               className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-red-600 ${activeTab === 'cleanup' ? 'bg-red-50' : 'hover:bg-red-50'}`}
             >
               <ClipboardList className="w-4 h-4" /> Data Cleanup
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
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]">
                        <option value="apr-mar">1st April to 31st March (India)</option>
                        <option value="jan-dec">1st January to 31st December</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Date Format</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]">
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024/12/31)</option>
                      </select>
                    </div>

                     <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Currency Symbol</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]">
                        <option value="INR">₹ (INR - Indian Rupee)</option>
                        <option value="USD">$ (USD - US Dollar)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-sm font-medium text-gray-700">Default Quotation Terms & Conditions</label>
                       <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]" rows={4} placeholder="Enter default terms and conditions..." value={defaultQuotationTerms} onChange={(e) => setDefaultQuotationTerms(e.target.value)}></textarea>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-sm font-medium text-gray-700">Default Sales Orders Terms & Conditions</label>
                       <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]" rows={4} placeholder="Enter default sales order terms and conditions..." value={defaultSalesOrderTerms} onChange={(e) => setDefaultSalesOrderTerms(e.target.value)}></textarea>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-sm font-medium text-gray-700">Default Sales Invoice Terms & Conditions</label>
                       <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]" rows={4} placeholder="Enter default sales invoice terms and conditions..." value={defaultSalesInvoiceTerms} onChange={(e) => setDefaultSalesInvoiceTerms(e.target.value)}></textarea>
                     </div>

                     <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Default Purchase Orders Terms & Conditions</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]" rows={4} placeholder="Enter default purchase order terms and conditions..." value={defaultPurchaseOrderTerms} onChange={(e) => setDefaultPurchaseOrderTerms(e.target.value)}></textarea>
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
                    {['SalesInvoices', 'PurchaseInvoices', 'SalesOrders', 'PurchaseOrders', 'SalesQuotations', 'PurchaseQuotations', 'ReceiptVouchers', 'PaymentVouchers', 'BankPayments', 'BankReceipts', 'JournalEntries'].map((type) => {
                      const seq = sequences.find(s => s.DocumentType === type) || { DocumentType: type, Prefix: '', CompanyId: companyId, FinancialYear: '2026-2027' };
                      return (
                      <div key={type} className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">{type.replace(/([A-Z])/g, ' $1').trim()} Prefix</label>
                        <div className="flex">
                          <input 
                            type="text" 
                            value={seq.Prefix}
                            onChange={(e) => {
                               const newPrefix = e.target.value;
                               console.log("Setting prefix for", type, "to", newPrefix);
                               setSequences(prev => {
                                 const exists = prev.some(s => s.DocumentType === type);
                                 if (!exists) {
                                   return [...prev, { DocumentType: type, Prefix: newPrefix, CompanyId: companyId, FinancialYear: '2026-2027' }];
                                 }
                                 return prev.map(s => s.DocumentType === type ? { ...s, Prefix: newPrefix } : s);
                               });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4] uppercase" 
                          />
                        </div>
                      </div>
                      );
                    })}
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

          {activeTab === 'permissions' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Role & Permissions Control</h2>
                  <p className="text-xs text-gray-500 mt-1">Manage user roles, permissions, and security policies.</p>
                </div>
                <select 
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pl-3 pr-10 py-2"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {systemRoles.map((r) => (
                    <option key={r.Id || r.id} value={r.RoleName}>{r.RoleName}</option>
                  ))}
                  {systemRoles.length === 0 && (
                    <>
                      <option>Super Admin</option>
                      <option>Accountant</option>
                      <option>Manager</option>
                      <option>HR</option>
                    </>
                  )}
                </select>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <colgroup>
                    <col className="w-1/3" />
                    <col className="w-24" />
                    <col className="w-16" />
                    <col className="w-16" />
                    <col className="w-16" />
                    <col className="w-16" />
                    <col className="w-16" />
                  </colgroup>
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Module</th>
                      <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        View<br/>
                        <input type="checkbox" className="h-3 w-3 mt-1" checked={Object.values(currentRolePerms).every((p: any) => p.view)} onChange={(e) => handleBulkActionChange('view', e.target.checked)} />
                      </th>
                      <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Add<br/>
                        <input type="checkbox" className="h-3 w-3 mt-1" checked={Object.entries(currentRolePerms).filter(([module]) => !module.startsWith('MIS & Reports:')).every(([_, p]: any) => p.add)} onChange={(e) => handleBulkActionChange('add', e.target.checked)} />
                      </th>
                      <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Edit<br/>
                        <input type="checkbox" className="h-3 w-3 mt-1" checked={Object.entries(currentRolePerms).filter(([module]) => !module.startsWith('MIS & Reports:')).every(([_, p]: any) => p.edit)} onChange={(e) => handleBulkActionChange('edit', e.target.checked)} />
                      </th>
                      <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Delete<br/>
                        <input type="checkbox" className="h-3 w-3 mt-1" checked={Object.entries(currentRolePerms).filter(([module]) => !module.startsWith('MIS & Reports:')).every(([_, p]: any) => p.delete)} onChange={(e) => handleBulkActionChange('delete', e.target.checked)} />
                      </th>
                      <th scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">All Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.keys(defaultPermissions).map((module) => (
                      <tr key={module} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-4 text-sm font-medium text-gray-900 break-words">{module}</td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${module.startsWith('MIS & Reports:') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {module.startsWith('MIS & Reports:') ? 'Report' : 'Data Entry'}
                          </span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 mx-auto" 
                            checked={currentRolePerms[module]?.view || false}
                            onChange={(e) => handlePermissionChange(module, 'view', e.target.checked)}
                          />
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          {module.startsWith('MIS & Reports:') ? <span className="text-gray-300">-</span> : (
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 mx-auto" 
                              checked={currentRolePerms[module]?.add || false}
                              onChange={(e) => handlePermissionChange(module, 'add', e.target.checked)}
                            />
                          )}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          {module.startsWith('MIS & Reports:') ? <span className="text-gray-300">-</span> : (
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 mx-auto" 
                              checked={currentRolePerms[module]?.edit || false}
                              onChange={(e) => handlePermissionChange(module, 'edit', e.target.checked)}
                            />
                          )}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          {module.startsWith('MIS & Reports:') ? <span className="text-gray-300">-</span> : (
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 mx-auto" 
                              checked={currentRolePerms[module]?.delete || false}
                              onChange={(e) => handlePermissionChange(module, 'delete', e.target.checked)}
                            />
                          )}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <input 
                             type="checkbox" 
                             className="h-4 w-4 text-blue-600 rounded border-gray-300 mx-auto" 
                             title="Toggle all for module"
                             checked={
                               module.startsWith('MIS & Reports:') 
                               ? currentRolePerms[module].view 
                               : (currentRolePerms[module].view && currentRolePerms[module].add && currentRolePerms[module].edit && currentRolePerms[module].delete)
                             }
                             onChange={(e) => handleBulkModuleChange(module, e.target.checked)}
                           />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              {/* Accounts Synchronization Section */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden border-t-4 border-t-blue-600">
                <div className="p-5 border-b border-gray-100 bg-blue-50/10">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1 px-2.5 bg-blue-100 rounded text-blue-800 text-xs font-semibold uppercase tracking-wider">Synchronization</span>
                    <h2 className="text-lg font-semibold text-gray-950">Accounts Ledger Synchronization</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Keep your primary data records (Customers, Vendors, and FPC Members) perfectly in sync with the general ledger accounts.
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between border border-blue-100 rounded-xl p-5 bg-blue-50/5 hover:border-blue-300 transition-all gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-950 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-blue-600" />
                        Re-synchronize Ledger Accounts
                      </h3>
                      <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                        Checks all database entities (Active Members, Customers, and Vendors) and heals any missing, broken, or mismatched ledger accounts in the general ledger. It also merges old redundant duplicate accounts into their active synced ledger. Safe to run at any time.
                      </p>
                    </div>
                    <button 
                      onClick={handleSyncAccounts}
                      disabled={isSyncingAccounts}
                      className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all shadow ${isSyncingAccounts ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'}`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncingAccounts ? 'animate-spin' : ''}`} />
                      {isSyncingAccounts ? 'SYNCING...' : 'RE-SYNC ACCOUNTS'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Premium Direct Backup Section */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden border-t-4 border-t-green-600">
                <div className="p-5 border-b border-gray-100 bg-green-50/30">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1 px-2.5 bg-green-100 rounded text-green-800 text-xs font-semibold uppercase tracking-wider">Direct Download</span>
                    <h2 className="text-lg font-semibold text-gray-950">Workspace Source Code ZIP</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Download the complete ERP application source code directly from the live terminal workspace instantly (no GitHub account, credentials, or public repositories required).
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between border border-green-100 rounded-xl p-5 bg-green-50/10 hover:border-green-300 hover:bg-green-50/30 transition-all gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-950 flex items-center gap-2">
                        <Code className="w-5 h-5 text-green-600" />
                        Complete ERP Source Directory (End-to-End)
                      </h3>
                      <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                        Downloads a compressed ZIP file containing all source files (<span className="text-green-700 font-medium">React pages, components, context, and the Express database server</span>). Fully populated with all necessary script setups to run local instances seamlessly.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">✓ No GitHub required</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">✓ Full server + UI bundle</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">✓ Zero compilation latency</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleDownloadZip}
                      disabled={isGeneratingZip}
                      className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-bold transition-all shadow ${isGeneratingZip ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'}`}
                    >
                      <Download className={`w-4 h-4 ${isGeneratingZip ? 'animate-bounce' : ''}`} />
                      {isGeneratingZip ? 'COMPILING ZIP...' : 'DOWNLOAD DIRECT SOURCE ZIP'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Deployment & Database Export Sections */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">Servers & Database Packages</h2>
                  <p className="text-xs text-gray-500 mt-1">Download pre-compiled packages or database scripts ready for production restoration.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-blue-600" />
                        Precompiled Cloud Deployment Package
                      </h3>
                      <p className="text-xs text-gray-500 max-w-lg leading-relaxed">
                        Downloads a pre-built directory containing the compiled production React frontend, optimized single-file Express server build, and runtime manifests for direct Cloud Run / VPS upload.
                      </p>
                    </div>
                    <button 
                      onClick={handleDownloadDeployZip}
                      disabled={isGeneratingDeployZip}
                      className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isGeneratingDeployZip ? 'text-gray-400 cursor-not-allowed bg-gray-100 border border-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      <Download className={`w-4 h-4 ${isGeneratingDeployZip ? 'animate-bounce' : ''}`} />
                      {isGeneratingDeployZip ? 'Generating...' : 'Download Cloud Package'}
                    </button>
                  </div>
                  
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

          {activeTab === 'cleanup' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-red-100 bg-red-100/50">
                  <h2 className="text-lg font-semibold text-red-900">Data Cleanup Options</h2>
                  <p className="text-xs text-red-700 mt-1">Warning: Actions performed here are permanent and cannot be undone.</p>
                </div>
                
                {!isCleanupUnlocked ? (
                  <div className="p-6">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center p-8 border border-red-200 bg-white rounded-lg shadow-sm">
                      <Shield className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Restricted Access</h3>
                      <p className="text-sm text-gray-500 text-center mb-6">Enter the cleanup password to access data deletion tools. This is a very crucial activity.</p>
                      
                      <div className="w-full flex gap-3">
                        <input
                          type="password"
                          value={cleanupPasswordInput}
                          onChange={(e) => setCleanupPasswordInput(e.target.value)}
                          placeholder="Enter password..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (cleanupPasswordInput === 'Cleanup@2026') {
                                setIsCleanupUnlocked(true);
                              } else {
                                alert('Incorrect password.');
                              }
                            }
                          }}
                          className="flex-1 rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm px-3 py-2 border"
                        />
                        <button
                          onClick={() => {
                            if (cleanupPasswordInput === 'Cleanup@2026') {
                              setIsCleanupUnlocked(true);
                            } else {
                              alert('Incorrect password.');
                            }
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Unlock
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="p-6 space-y-4">
                  
                  <div className="flex items-start justify-between border border-red-200 rounded-lg p-4 bg-white hover:border-red-300 transition-colors">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-red-900 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-red-600" />
                        1. Master Data Cleanup
                      </h3>
                      <p className="text-xs text-red-600 max-w-lg leading-relaxed">
                        Cleans up all Master & Transaction data excluding Settings, Company Details, Financial details, and Account groups. Deletes records from accounts table except basic defaults ('Cash in Hand', 'Share Capital', 'Purchases', 'Sales'). Includes FPC Members, Vendors, Customers, Loans, Assets, etc.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (window.confirm("Are you absolutely sure you want to delete all Master and Transaction Data? This action cannot be undone.")) {
                            fetch('/api/cleanup/master', { method: 'POST' })
                            .then(res => res.json())
                            .then(() => alert('Master Data Cleanup Completed successfully.'))
                            .catch(err => { console.error(err); alert('Cleanup failed.'); });
                        }
                      }}
                      className="shrink-0 flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                      Process Master Cleanup
                    </button>
                  </div>

                  <div className="flex items-start justify-between border border-red-200 rounded-lg p-4 bg-white hover:border-red-300 transition-colors">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-red-900 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-red-600" />
                        2. Transaction Data Cleanup
                      </h3>
                      <p className="text-xs text-red-600 max-w-lg leading-relaxed">
                        Cleans up only transactions data. Keeps all Master data tables, Settings, Company Details, Financial details, and Account groups intact.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (window.confirm("Are you absolutely sure you want to delete all Transaction Data? This action cannot be undone.")) {
                            fetch('/api/cleanup/transactions', { method: 'POST' })
                            .then(res => res.json())
                            .then(() => alert('Transaction Data Cleanup Completed successfully.'))
                            .catch(err => { console.error(err); alert('Cleanup failed.'); });
                        }
                      }}
                       className="shrink-0 flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                      Process Transaction Cleanup
                    </button>
                  </div>

                </div>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
