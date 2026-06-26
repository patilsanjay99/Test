import path from 'path';
import { createRequire } from 'module';

// Safely initialize custom dynamic require loader for ESM / CommonJS hybrid runtime
let sqliteRequire: any;
try {
  if (typeof require !== 'undefined') {
    sqliteRequire = require;
  } else {
    const metaUrl = (typeof import.meta !== 'undefined' && import.meta && import.meta.url)
      ? import.meta.url
      : (typeof __filename !== 'undefined' ? `file://${__filename}` : '');
    if (metaUrl) {
      sqliteRequire = createRequire(metaUrl);
    } else {
      sqliteRequire = createRequire(path.join(process.cwd(), 'server-db.ts'));
    }
  }
} catch (err) {
  console.error('⚠️ Failed to initialize sqliteRequire adapter:', err);
}

// Connect to SQLite DB in the root of the project
const dbPath = path.join(process.cwd(), 'fpc_database.sqlite');
let db: any;
let realDb: any = null;

try {
  // Use dynamically loaded requirement loader safely
  const Database = sqliteRequire ? sqliteRequire('better-sqlite3') : null;
  if (Database) {
    realDb = new Database(dbPath);
  } else {
    console.warn('⚠️ No available sqliteRequire adapter found.');
  }
} catch (err: any) {
  console.error('⚠️ Failed to load better-sqlite3 module (native compilation failed or not installed). If using MS SQL, this can be ignored.', err.message);
}

// Create a safe wrapper proxy for db
db = {
  prepare: (sql: string) => {
    if (realDb) {
      try {
        return realDb.prepare(sql);
      } catch (e: any) {
        console.error(`Error in SQL prepare: ${sql}`, e);
        return {
          all: (...params: any[]) => { throw e; },
          get: (...params: any[]) => { throw e; },
          run: (...params: any[]) => { throw e; }
        };
      }
    }
    return {
      all: (...params: any[]) => {
        console.error(`❌ SQLite is not available. Query: ${sql}`);
        return [];
      },
      get: (...params: any[]) => {
        console.error(`❌ SQLite is not available. Query: ${sql}`);
        return null;
      },
      run: (...params: any[]) => {
        console.error(`❌ SQLite is not available. Query: ${sql}`);
        return { lastInsertRowid: 1, changes: 0 };
      }
    };
  },
  exec: (sql: string) => {
    if (realDb) {
      try {
        return realDb.exec(sql);
      } catch (e: any) {
        console.error(`Error in SQL exec: ${sql}`, e);
      }
    } else {
      console.error(`❌ SQLite is not available. Exec: ${sql}`);
    }
  }
};

try {
  
  // Initialize tables if they don't exist
  const initSql = `
  CREATE TABLE IF NOT EXISTS Companies (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      GSTIN TEXT,
      PAN TEXT,
      City TEXT,
      State TEXT,
      LogoUrl TEXT,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    Name TEXT NOT NULL,
    Email TEXT,
    Phone TEXT,
    Role TEXT,
    Status TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS InventoryItems (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    ItemCode TEXT,
    Name TEXT NOT NULL,
    Category TEXT,
    Quantity INTEGER DEFAULT 0,
    Unit TEXT,
    UnitPrice REAL DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Accounts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    AccountCode TEXT,
    Name TEXT NOT NULL,
    AccountGroup TEXT,
    AccountType TEXT,
    OpeningBalance REAL DEFAULT 0,
    BalanceType TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AccountGroups (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    GroupName TEXT NOT NULL,
    GroupType TEXT,
    IsDefault INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS FPCMembers (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    MemberId TEXT,
    FarmerName TEXT,
    Village TEXT,
    LandHolding REAL,
    JoinDate TEXT
);

CREATE TABLE IF NOT EXISTS Loans (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    MemberId INTEGER,
    LoanType TEXT,
    DisbursementDate TEXT,
    PrincipalAmount REAL,
    InterestRate REAL,
    Tenure INTEGER,
    TotalInterestPayable REAL,
    TotalPayable REAL,
    Outstanding REAL,
    CollateralRemarks TEXT,
    Status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS LoanRepayments (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    LoanId INTEGER,
    MemberId INTEGER,
    RepaymentDate TEXT,
    AmountPaid REAL,
    PrincipalPaid REAL,
    InterestPaid REAL,
    Remarks TEXT
);

CREATE TABLE IF NOT EXISTS SalesInvoices (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    InvoiceNumber TEXT,
    CustomerId INTEGER,
    TotalAmount REAL,
    Status TEXT,
    InvoiceDate TEXT
);

CREATE TABLE IF NOT EXISTS SalesReturns (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    ReturnNumber TEXT,
    CustomerId INTEGER,
    OriginalInvoiceNumber TEXT,
    TotalAmount REAL,
    Status TEXT,
    ReturnDate TEXT,
    ItemsData TEXT,
    Remarks TEXT
);

CREATE TABLE IF NOT EXISTS PurchaseReturns (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    ReturnNumber TEXT,
    VendorId INTEGER,
    OriginalInvoiceNumber TEXT,
    TotalAmount REAL,
    Status TEXT,
    ReturnDate TEXT,
    ItemsData TEXT,
    Remarks TEXT
);

CREATE TABLE IF NOT EXISTS ShareTransactions (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    TransactionType TEXT,
    TransactionDate TEXT,
    MemberId INTEGER,
    ToMemberId INTEGER,
    Shares INTEGER,
    FaceValue REAL,
    TotalAmount REAL,
    StartingFolio TEXT,
    FolioFrom TEXT,
    FolioTo TEXT,
    Remarks TEXT,
    Status TEXT DEFAULT 'Completed'
);

CREATE TABLE IF NOT EXISTS FinancialYears (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYear TEXT,
    FromDate TEXT,
    ToDate TEXT,
    Status TEXT DEFAULT 'Active',
    UNIQUE(FinancialYear, CompanyId)
);

CREATE TABLE IF NOT EXISTS Customers (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    CustomerName TEXT NOT NULL,
    RegistrationNo TEXT,
    Address TEXT,
    OpeningBalance REAL DEFAULT 0,
    ContactPerson TEXT,
    PhoneNo TEXT,
    EmailID TEXT,
    StateCode TEXT,
    Range TEXT,
    Division TEXT,
    GSTINNo TEXT,
    AadharCardNo TEXT,
    TANNo TEXT,
    PANNo TEXT,
    CINNo TEXT,
    Commissionrate TEXT,
    AccountingCircle TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Vendors (
    COMPANYID INTEGER,
    Vendor_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Vendor_NAME TEXT,
    Vendor_address TEXT,
    business_details TEXT,
    contact_person TEXT,
    phone_no TEXT,
    email_id TEXT,
    registration_no TEXT,
    opening_balance REAL DEFAULT 0,
    GSTIN TEXT,
    aadhar_no TEXT,
    pan_no TEXT,
    tan_no TEXT,
    cin_no TEXT,
    state_code TEXT,
    Range TEXT,
    Division TEXT,
    Commissionrate TEXT,
    circle TEXT,
    payment_note TEXT,
    state_id INTEGER,
    state_name TEXT,
    ISACTIVE TEXT DEFAULT 'Y',
    Added_On DATETIME DEFAULT CURRENT_TIMESTAMP,
    ADDED_BY INTEGER,
    Modify_On DATETIME,
    MODIFY_BY INTEGER
);

CREATE TABLE IF NOT EXISTS Locations (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    Name TEXT NOT NULL,
    Description TEXT,
    Address TEXT,
    Status TEXT DEFAULT 'Active',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Assets (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    AssetCode TEXT,
    Name TEXT NOT NULL,
    Category TEXT,
    Location TEXT,
    PurchaseDate TEXT,
    Cost REAL DEFAULT 0,
    Value REAL DEFAULT 0,
    DeprMethod TEXT,
    DeprRate REAL DEFAULT 0,
    Notes TEXT,
    Status TEXT DEFAULT 'Active',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS JournalEntries (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER NULL,
    EntryNumber TEXT NULL,
    Reference TEXT NULL,
    Narration TEXT NULL,
    TotalAmount REAL DEFAULT 0,
    Status TEXT DEFAULT 'Draft',
    EntryDate TEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS JournalLines (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    JournalEntryId INTEGER NULL,
    AccountId INTEGER NULL,
    Description TEXT NULL,
    Debit REAL DEFAULT 0,
    Credit REAL DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS DocumentSequences (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    DocumentType TEXT,
    Prefix TEXT,
    SequenceNumber INTEGER DEFAULT 1,
    FinancialYear TEXT,
    UNIQUE(CompanyId, DocumentType, FinancialYear)
);

CREATE TABLE IF NOT EXISTS CashPayments (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    VoucherNo TEXT,
    PaymentDate TEXT,
    CashAccountId INTEGER,
    AccountId INTEGER,
    Amount REAL,
    Narration TEXT,
    Status TEXT DEFAULT 'Posted'
);

CREATE TABLE IF NOT EXISTS BankPayments (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    VoucherNo TEXT,
    PaymentDate TEXT,
    BankAccountId INTEGER,
    AccountId INTEGER,
    Amount REAL,
    ReferenceNo TEXT,
    ReferenceDate TEXT,
    Narration TEXT,
    Status TEXT DEFAULT 'Posted'
);

CREATE TABLE IF NOT EXISTS BankReceipts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    VoucherNo TEXT,
    ReceiptDate TEXT,
    BankAccountId INTEGER,
    AccountId INTEGER,
    Amount REAL,
    ReferenceNo TEXT,
    ReferenceDate TEXT,
    Narration TEXT,
    Status TEXT DEFAULT 'Posted'
);

CREATE TABLE IF NOT EXISTS CashReceipts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    VoucherNo TEXT,
    ReceiptDate TEXT,
    CashAccountId INTEGER,
    AccountId INTEGER,
    Amount REAL,
    Narration TEXT,
    Status TEXT DEFAULT 'Posted'
);

CREATE TABLE IF NOT EXISTS BankAccounts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    BankName TEXT NOT NULL,
    Branch TEXT,
    Address TEXT,
    AccountNo TEXT NOT NULL,
    AccountType TEXT,
    IFSCCode TEXT,
    MICRCode TEXT,
    AccountGroup TEXT DEFAULT 'Bank Accounts',
    OpeningBalance REAL DEFAULT 0,
    BalanceType TEXT DEFAULT 'Dr',
    AccountId INTEGER,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS BankAccountTypes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    TypeName TEXT NOT NULL,
    IsDefault INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS SystemRoles (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    RoleName TEXT NOT NULL,
    IsDefault INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(initSql);

// Add missing columns to existing tables using PRAGMA table_info or simply trying to add them
const addColumnIfNotExists = (tableName: string, columnName: string, columnDef: string) => {
  const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
  if (!tableInfo.find(c => c.name === columnName) && tableInfo.length > 0) {
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    } catch (e) {
      console.log(`Could not add column ${columnName} to ${tableName}`);
    }
  }
};

addColumnIfNotExists('Companies', 'PhoneNo', 'TEXT');
addColumnIfNotExists('Companies', 'Address', 'TEXT');
addColumnIfNotExists('Companies', 'EmailID', 'TEXT');
addColumnIfNotExists('Companies', 'ContactPerson', 'TEXT');
addColumnIfNotExists('Companies', 'BusinessDetails', 'TEXT');
addColumnIfNotExists('Companies', 'RegistrationNo', 'TEXT');
addColumnIfNotExists('Companies', 'AadharCardNo', 'TEXT');
addColumnIfNotExists('Companies', 'TANNo', 'TEXT');
addColumnIfNotExists('Companies', 'CINNo', 'TEXT');
addColumnIfNotExists('Companies', 'StateCode', 'TEXT');
addColumnIfNotExists('Companies', 'TaxRange', 'TEXT');
addColumnIfNotExists('Companies', 'Division', 'TEXT');
addColumnIfNotExists('Companies', 'BankName', 'TEXT');
addColumnIfNotExists('Companies', 'BankBranch', 'TEXT');
addColumnIfNotExists('Companies', 'AccountNumber', 'TEXT');
addColumnIfNotExists('Companies', 'AccountType', 'TEXT');
addColumnIfNotExists('Companies', 'BankAddress', 'TEXT');
addColumnIfNotExists('Companies', 'MICRCode', 'TEXT');
addColumnIfNotExists('Companies', 'IFSCCode', 'TEXT');
addColumnIfNotExists('Companies', 'DefaultQuotationTerms', 'TEXT');
addColumnIfNotExists('Companies', 'DefaultSalesOrderTerms', 'TEXT');
addColumnIfNotExists('Companies', 'DefaultSalesInvoiceTerms', 'TEXT');
addColumnIfNotExists('Companies', 'DefaultPurchaseOrderTerms', 'TEXT');
addColumnIfNotExists('Customers', 'Place', 'TEXT');
addColumnIfNotExists('Vendors', 'Place', 'TEXT');
addColumnIfNotExists('Accounts', 'Place', 'TEXT');
addColumnIfNotExists('Accounts', 'FPCMemberId', 'INTEGER');
addColumnIfNotExists('Customers', 'BusinessDetails', 'TEXT');
addColumnIfNotExists('FPCMembers', 'Place', 'TEXT');

// Add Vendors columns checks if already exists
addColumnIfNotExists('Vendors', 'COMPANYID', 'INTEGER');
addColumnIfNotExists('Vendors', 'Vendor_NAME', 'TEXT');
addColumnIfNotExists('Vendors', 'Vendor_address', 'TEXT');
addColumnIfNotExists('Vendors', 'business_details', 'TEXT');
addColumnIfNotExists('Vendors', 'contact_person', 'TEXT');
addColumnIfNotExists('Vendors', 'phone_no', 'TEXT');
addColumnIfNotExists('Vendors', 'email_id', 'TEXT');
addColumnIfNotExists('Vendors', 'registration_no', 'TEXT');
addColumnIfNotExists('Vendors', 'opening_balance', 'REAL DEFAULT 0');
addColumnIfNotExists('Vendors', 'GSTIN', 'TEXT');
addColumnIfNotExists('Vendors', 'aadhar_no', 'TEXT');
addColumnIfNotExists('Vendors', 'pan_no', 'TEXT');
addColumnIfNotExists('Vendors', 'tan_no', 'TEXT');
addColumnIfNotExists('Vendors', 'cin_no', 'TEXT');
addColumnIfNotExists('Vendors', 'state_code', 'TEXT');
addColumnIfNotExists('Vendors', 'Range', 'TEXT');
addColumnIfNotExists('Vendors', 'Division', 'TEXT');
addColumnIfNotExists('Vendors', 'Commissionrate', 'TEXT');
addColumnIfNotExists('Vendors', 'circle', 'TEXT');
addColumnIfNotExists('Vendors', 'payment_note', 'TEXT');
addColumnIfNotExists('Vendors', 'state_id', 'INTEGER');
addColumnIfNotExists('Vendors', 'state_name', 'TEXT');
addColumnIfNotExists('Vendors', 'ISACTIVE', 'TEXT DEFAULT \'Y\'');
addColumnIfNotExists('Vendors', 'Added_On', 'DATETIME');
addColumnIfNotExists('Vendors', 'ADDED_BY', 'INTEGER');
addColumnIfNotExists('Vendors', 'Modify_On', 'DATETIME');
addColumnIfNotExists('Vendors', 'MODIFY_BY', 'INTEGER');
addColumnIfNotExists('Vendors', 'FPCMemberId', 'INTEGER');

// Add CompanyId to all standard tables
addColumnIfNotExists('Users', 'CompanyId', 'INTEGER');
addColumnIfNotExists('Users', 'Password', "TEXT DEFAULT 'welcome123'");
addColumnIfNotExists('InventoryItems', 'CompanyId', 'INTEGER');
addColumnIfNotExists('InventoryItems', 'Status', 'TEXT DEFAULT \'Active\'');
addColumnIfNotExists('InventoryItems', 'Location', 'TEXT');
addColumnIfNotExists('InventoryItems', 'IsSalesItem', 'TEXT DEFAULT \'Yes\'');
addColumnIfNotExists('InventoryItems', 'SellingPriceMembers', 'REAL DEFAULT 0');
addColumnIfNotExists('InventoryItems', 'SellingPriceNonMembers', 'REAL DEFAULT 0');
addColumnIfNotExists('InventoryItems', 'BuyingPrice', 'REAL DEFAULT 0');
addColumnIfNotExists('InventoryItems', 'HSNCode', 'TEXT');
addColumnIfNotExists('InventoryItems', 'SGST', 'REAL DEFAULT 0');
addColumnIfNotExists('InventoryItems', 'CGST', 'REAL DEFAULT 0');
addColumnIfNotExists('InventoryItems', 'IGST', 'REAL DEFAULT 0');
addColumnIfNotExists('InventoryItems', 'MinStock', 'REAL DEFAULT 0');
addColumnIfNotExists('InventoryItems', 'MaxCapacity', 'REAL DEFAULT 0');
addColumnIfNotExists('Accounts', 'BalanceType', 'TEXT');
addColumnIfNotExists('AccountGroups', 'CompanyId', 'INTEGER');

// Add default groups
try {
  const defaultGroups = [
      { name: 'Capital Account', type: 'Equity' },
      { name: 'Reserves & Surplus', type: 'Equity' },
      { name: 'Current Assets', type: 'Asset' },
      { name: 'Bank Accounts', type: 'Asset' },
      { name: 'Cash-in-Hand', type: 'Asset' },
      { name: 'Fixed Assets', type: 'Asset' },
      { name: 'Stock-in-Hand', type: 'Asset' },
      { name: 'Opening Stock', type: 'Asset' },
      { name: 'Closing Stock', type: 'Asset' },
      { name: 'Investments', type: 'Asset' },
      { name: 'Sundry Debtors', type: 'Asset' },
      { name: 'Current Liabilities', type: 'Liability' },
      { name: 'Sundry Creditors', type: 'Liability' },
      { name: 'Duties & Taxes', type: 'Liability' },
      { name: 'Loans (Liability)', type: 'Liability' },
      { name: 'Provisions', type: 'Liability' },
      { name: 'Sales Accounts', type: 'Revenue' },
      { name: 'Direct Incomes', type: 'Revenue' },
      { name: 'Indirect Incomes', type: 'Revenue' },
      { name: 'Purchase Accounts', type: 'Expense' },
      { name: 'Direct Expenses', type: 'Expense' },
      { name: 'Indirect Expenses', type: 'Expense' }
  ];
  
  const checkGroup = db.prepare("SELECT COUNT(*) as cnt FROM AccountGroups WHERE GroupName = ? AND IsDefault = 1");
  const insertGroup = db.prepare("INSERT INTO AccountGroups (GroupName, GroupType, IsDefault) VALUES (?, ?, 1)");
  
  defaultGroups.forEach(g => {
      const res = checkGroup.get(g.name);
      if (res && res.cnt === 0) {
          insertGroup.run(g.name, g.type);
      }
  });
} catch(e) {
  console.log('Error seeding default groups in SQLite', e);
}

addColumnIfNotExists('FPCMembers', 'CompanyId', 'INTEGER');
addColumnIfNotExists('FPCMembers', 'FatherSpouse', 'TEXT');
addColumnIfNotExists('FPCMembers', 'Gender', 'TEXT');
addColumnIfNotExists('FPCMembers', 'DOB', 'TEXT');
addColumnIfNotExists('FPCMembers', 'Phone', 'TEXT');
addColumnIfNotExists('FPCMembers', 'AadharNo', 'TEXT');
addColumnIfNotExists('FPCMembers', 'Address', 'TEXT');
addColumnIfNotExists('FPCMembers', 'Panchayat', 'TEXT');
addColumnIfNotExists('FPCMembers', 'Tehsil', 'TEXT');
addColumnIfNotExists('FPCMembers', 'District', 'TEXT');
addColumnIfNotExists('FPCMembers', 'State', 'TEXT');
addColumnIfNotExists('FPCMembers', 'PINCode', 'TEXT');
addColumnIfNotExists('FPCMembers', 'IrrigationType', 'TEXT');
addColumnIfNotExists('FPCMembers', 'MajorCrops', 'TEXT');
addColumnIfNotExists('FPCMembers', 'SharesAllocated', 'INTEGER DEFAULT 0');
addColumnIfNotExists('FPCMembers', 'FaceValue', 'REAL DEFAULT 100');
addColumnIfNotExists('FPCMembers', 'ShareAmount', 'REAL DEFAULT 0');
addColumnIfNotExists('Loans', 'CompanyId', 'INTEGER');
addColumnIfNotExists('SalesInvoices', 'CompanyId', 'INTEGER');
addColumnIfNotExists('SalesInvoices', 'ItemsData', 'TEXT');

// Add FinancialYearId to transaction tables
addColumnIfNotExists('Loans', 'FinancialYearId', 'INTEGER');
addColumnIfNotExists('Loans', 'DisbursementDate', 'TEXT');
addColumnIfNotExists('Loans', 'InterestRate', 'REAL');
addColumnIfNotExists('Loans', 'Tenure', 'INTEGER');
addColumnIfNotExists('Loans', 'TotalInterestPayable', 'REAL');
addColumnIfNotExists('Loans', 'TotalPayable', 'REAL');
addColumnIfNotExists('Loans', 'CollateralRemarks', 'TEXT');
addColumnIfNotExists('Loans', 'Status', 'TEXT DEFAULT \'Active\'');
addColumnIfNotExists('LoanRepayments', 'PrincipalPaid', 'REAL');
addColumnIfNotExists('LoanRepayments', 'InterestPaid', 'REAL');
addColumnIfNotExists('SalesInvoices', 'FinancialYearId', 'INTEGER');

// Assume PurchaseInvoices table exists or might be created, add there too if we have it
db.exec(`
CREATE TABLE IF NOT EXISTS PurchaseInvoices (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    InvoiceNumber TEXT,
    VendorId INTEGER,
    VendorName TEXT,
    VendorBillNo TEXT,
    TotalAmount REAL,
    Status TEXT,
    InvoiceDate TEXT,
    Remarks TEXT,
    ItemsData TEXT
);

CREATE TABLE IF NOT EXISTS PurchaseOrders (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    OrderNumber TEXT,
    VendorId INTEGER,
    VendorName TEXT,
    TotalAmount REAL,
    Status TEXT,
    OrderDate TEXT,
    RequiredByDate TEXT,
    ItemsData TEXT,
    Remarks TEXT,
    Terms TEXT
);

CREATE TABLE IF NOT EXISTS SalesQuotations (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    QuotationNumber TEXT,
    CustomerId INTEGER,
    TotalAmount REAL,
    Status TEXT DEFAULT 'Draft',
    QuotationDate TEXT,
    ExpiryDate TEXT,
    Remarks TEXT,
    ItemsData TEXT,
    TermsAndConditions TEXT
);

CREATE TABLE IF NOT EXISTS SalesOrders (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER,
    FinancialYearId INTEGER,
    OrderNumber TEXT,
    QuotationNo TEXT,
    CustomerId INTEGER,
    TotalAmount REAL,
    Status TEXT DEFAULT 'Draft',
    OrderDate TEXT,
    ExpectedDelivery TEXT,
    Remarks TEXT,
    ItemsData TEXT,
    TermsAndConditions TEXT
);
`);

try {
  addColumnIfNotExists('PurchaseInvoices', 'ItemsData', 'TEXT');
  addColumnIfNotExists('PurchaseInvoices', 'VendorName', 'TEXT');
  addColumnIfNotExists('PurchaseInvoices', 'VendorBillNo', 'TEXT');
  addColumnIfNotExists('PurchaseInvoices', 'Remarks', 'TEXT');
} catch(e) {}


// Ensure Assets table and columns are fully created in case the table was manually omitted or corrupted
try {
  addColumnIfNotExists('Assets', 'CompanyId', 'INTEGER');
  addColumnIfNotExists('Assets', 'AssetCode', 'TEXT');
  addColumnIfNotExists('Assets', 'Name', 'TEXT');
  addColumnIfNotExists('Assets', 'Category', 'TEXT');
  addColumnIfNotExists('Assets', 'Location', 'TEXT');
  addColumnIfNotExists('Assets', 'PurchaseDate', 'TEXT');
  addColumnIfNotExists('Assets', 'Cost', 'REAL DEFAULT 0');
  addColumnIfNotExists('Assets', 'Value', 'REAL DEFAULT 0');
  addColumnIfNotExists('Assets', 'DeprMethod', 'TEXT');
  addColumnIfNotExists('Assets', 'DeprRate', 'REAL DEFAULT 0');
  addColumnIfNotExists('Assets', 'Notes', 'TEXT');
  addColumnIfNotExists('Assets', 'Status', 'TEXT DEFAULT \'Active\'');
} catch(e) {}

try {
  addColumnIfNotExists('SalesReturns', 'CompanyId', 'INTEGER');
  addColumnIfNotExists('SalesReturns', 'FinancialYearId', 'INTEGER');
  addColumnIfNotExists('SalesReturns', 'ReturnNumber', 'TEXT');
  addColumnIfNotExists('SalesReturns', 'CustomerId', 'INTEGER');
  addColumnIfNotExists('SalesReturns', 'OriginalInvoiceNumber', 'TEXT');
  addColumnIfNotExists('SalesReturns', 'TotalAmount', 'REAL DEFAULT 0');
  addColumnIfNotExists('SalesReturns', 'Status', 'TEXT DEFAULT \'Draft\'');
  addColumnIfNotExists('SalesReturns', 'ReturnDate', 'TEXT');
  addColumnIfNotExists('SalesReturns', 'ItemsData', 'TEXT');
  addColumnIfNotExists('SalesReturns', 'Remarks', 'TEXT');
} catch(e) {}

try {
  addColumnIfNotExists('PurchaseReturns', 'CompanyId', 'INTEGER');
  addColumnIfNotExists('PurchaseReturns', 'FinancialYearId', 'INTEGER');
  addColumnIfNotExists('PurchaseReturns', 'ReturnNumber', 'TEXT');
  addColumnIfNotExists('PurchaseReturns', 'VendorId', 'INTEGER');
  addColumnIfNotExists('PurchaseReturns', 'OriginalInvoiceNumber', 'TEXT');
  addColumnIfNotExists('PurchaseReturns', 'TotalAmount', 'REAL DEFAULT 0');
  addColumnIfNotExists('PurchaseReturns', 'Status', 'TEXT DEFAULT \'Draft\'');
  addColumnIfNotExists('PurchaseReturns', 'ReturnDate', 'TEXT');
  addColumnIfNotExists('PurchaseReturns', 'ItemsData', 'TEXT');
  addColumnIfNotExists('PurchaseReturns', 'Remarks', 'TEXT');
} catch(e) {}


try {
  addColumnIfNotExists('Companies', 'LogoUrl', 'TEXT');
} catch(e) {}

try {
  addColumnIfNotExists('SalesOrders', 'QuotationNo', 'TEXT');
  addColumnIfNotExists('SalesOrders', 'CompanyId', 'INTEGER');
  addColumnIfNotExists('SalesOrders', 'FinancialYearId', 'INTEGER');
  addColumnIfNotExists('SalesOrders', 'OrderNumber', 'TEXT');
  addColumnIfNotExists('SalesOrders', 'CustomerId', 'INTEGER');
  addColumnIfNotExists('SalesOrders', 'TotalAmount', 'REAL DEFAULT 0');
  addColumnIfNotExists('SalesOrders', 'Status', 'TEXT DEFAULT \'Draft\'');
  addColumnIfNotExists('SalesOrders', 'OrderDate', 'TEXT');
  addColumnIfNotExists('SalesOrders', 'ExpectedDelivery', 'TEXT');
  addColumnIfNotExists('SalesOrders', 'Remarks', 'TEXT');
  addColumnIfNotExists('SalesOrders', 'ItemsData', 'TEXT');
  addColumnIfNotExists('SalesOrders', 'TermsAndConditions', 'TEXT');
} catch(e) {}

try {
  addColumnIfNotExists('SalesQuotations', 'CompanyId', 'INTEGER');
  addColumnIfNotExists('SalesQuotations', 'FinancialYearId', 'INTEGER');
  addColumnIfNotExists('SalesQuotations', 'QuotationNumber', 'TEXT');
  addColumnIfNotExists('SalesQuotations', 'CustomerId', 'INTEGER');
  addColumnIfNotExists('SalesQuotations', 'TotalAmount', 'REAL DEFAULT 0');
  addColumnIfNotExists('SalesQuotations', 'Status', 'TEXT DEFAULT \'Draft\'');
  addColumnIfNotExists('SalesQuotations', 'QuotationDate', 'TEXT');
  addColumnIfNotExists('SalesQuotations', 'ExpiryDate', 'TEXT');
  addColumnIfNotExists('SalesQuotations', 'Remarks', 'TEXT');
  addColumnIfNotExists('SalesQuotations', 'ItemsData', 'TEXT');
  addColumnIfNotExists('SalesQuotations', 'TermsAndConditions', 'TEXT');
} catch(e) {}

// Add default company if not exists
const firstCompany = db.prepare("SELECT * FROM Companies LIMIT 1").get();
if (!firstCompany) {
  const compInfo = db.prepare("INSERT INTO Companies (Name, PAN, GSTIN) VALUES ('AgriCorp FPC Ltd', 'AABCA1234K', '27AABCA1234K1Z1')").run();
  
  db.prepare("INSERT INTO FinancialYears (FinancialYear, CompanyId, FromDate, ToDate) VALUES (?, ?, ?, ?)").run('2023-2024', compInfo.lastInsertRowid, '2023-04-01', '2024-03-31');
  db.prepare("INSERT INTO FinancialYears (FinancialYear, CompanyId, FromDate, ToDate) VALUES (?, ?, ?, ?)").run('2024-2025', compInfo.lastInsertRowid, '2024-04-01', '2025-03-31');
}

const checkType = db.prepare("SELECT COUNT(*) as cnt FROM BankAccountTypes");
if ((checkType.get() as any).cnt === 0) {
    const acctTypes = ['Savings', 'Current', 'OD', 'CC'];
    const insertType = db.prepare("INSERT INTO BankAccountTypes (TypeName, IsDefault) VALUES (?, 1)");
    for (const t of acctTypes) insertType.run(t);
}

const checkRole = db.prepare("SELECT COUNT(*) as cnt FROM SystemRoles");
if ((checkRole.get() as any).cnt === 0) {
    const roles = ['Employee', 'HR', 'Accountant', 'Super Admin'];
    const insertRole = db.prepare("INSERT INTO SystemRoles (RoleName, IsDefault) VALUES (?, 1)");
    for (const r of roles) insertRole.run(r);
}

// Initialize E-Tracker Tables
db.exec(`
CREATE TABLE IF NOT EXISTS IssueStatuses (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER DEFAULT 1,
    StatusName TEXT NOT NULL,
    StatusCode TEXT NOT NULL,
    SequenceOrder INTEGER NOT NULL,
    Color TEXT,
    IsFinalStatus INTEGER DEFAULT 0,
    IsEditable INTEGER DEFAULT 1,
    IsClosureStatus INTEGER DEFAULT 0,
    IsReopenAllowed INTEGER DEFAULT 0,
    ActiveStatus INTEGER DEFAULT 1
);
`);

// Migrate existing sqlite tables if they are missing newer columns
try {
    db.exec(`ALTER TABLE IssueStatuses ADD COLUMN IsReopenAllowed INTEGER DEFAULT 0`);
} catch (e) {}
try {
    db.exec(`ALTER TABLE IssueStatuses ADD COLUMN ActiveStatus INTEGER DEFAULT 1`);
} catch (e) {}

db.exec(`
CREATE TABLE IF NOT EXISTS Issues (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER DEFAULT 1,
    Title TEXT NOT NULL,
    Description TEXT,
    Department TEXT,
    AssigneeId INTEGER,
    AssigneeName TEXT,
    StatusId INTEGER,
    StatusCode TEXT,
    StatusName TEXT,
    Priority TEXT,
    SlaDeadline TEXT,
    EscalatedCount INTEGER DEFAULT 0,
    LastEscalationDate TEXT,
    CreatedBy TEXT,
    AttachmentUrl TEXT,
    ApproverRemarks TEXT,
    IsApproved INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ClosedAt TEXT
);

CREATE TABLE IF NOT EXISTS IssueLogs (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanyId INTEGER DEFAULT 1,
    IssueId INTEGER,
    LogType TEXT,
    User TEXT,
    Remarks TEXT,
    OldStatus TEXT,
    NewStatus TEXT,
    AttachmentUrl TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Seed default statuses if count is zero
const checkCount = db.prepare("SELECT COUNT(*) as cnt FROM IssueStatuses").get();
if (checkCount && (checkCount as any).cnt === 0) {
    const defaultStatuses = [
        { name: 'Open', code: 'OPEN', order: 1, color: '#3B82F6', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'Assigned', code: 'ASSIGNED', order: 2, color: '#8B5CF6', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'In Progress', code: 'IN_PROGRESS', order: 3, color: '#F59E0B', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'Pending Approval', code: 'PENDING_APPROVAL', order: 4, color: '#EC4899', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'Waiting for User', code: 'WAITING_USER', order: 5, color: '#6B7280', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'Under Review', code: 'UNDER_REVIEW', order: 6, color: '#14B8A6', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'Resolved', code: 'RESOLVED', order: 7, color: '#10B981', final: 0, editable: 1, closure: 1, reopen: 1, active: 1 },
        { name: 'Reopened', code: 'REOPENED', order: 8, color: '#EF4444', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'Escalated', code: 'ESCALATED', order: 9, color: '#DC2626', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'On Hold', code: 'ON_HOLD', order: 10, color: '#F59E0B', final: 0, editable: 1, closure: 0, reopen: 0, active: 1 },
        { name: 'Closed', code: 'CLOSED', order: 11, color: '#047857', final: 1, editable: 0, closure: 1, reopen: 1, active: 1 },
        { name: 'Cancelled', code: 'CANCELLED', order: 12, color: '#B91C1C', final: 1, editable: 0, closure: 1, reopen: 0, active: 1 },
    ];
    const insertStatus = db.prepare(`
        INSERT INTO IssueStatuses 
        (CompanyId, StatusName, StatusCode, SequenceOrder, Color, IsFinalStatus, IsEditable, IsClosureStatus, IsReopenAllowed, ActiveStatus) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of defaultStatuses) {
        insertStatus.run(s.name, s.code, s.order, s.color, s.final, s.editable, s.closure, s.reopen, s.active);
    }
}

} catch (err: any) {
  console.error('Failed to initialize SQLite Db (possibly malformed). If using MS SQL, this can be ignored.', err.message);
  db = { prepare: () => ({ all: () => [], get: () => null, run: () => ({ lastInsertRowid: 1 }) }), exec: () => {} };
}

export default db;
