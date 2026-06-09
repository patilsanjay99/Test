import Database from 'better-sqlite3';
import path from 'path';

// Connect to SQLite DB in the root of the project
const dbPath = path.join(process.cwd(), 'fpc_database.sqlite');
const db = new Database(dbPath);

// Initialize tables if they don't exist
const initSql = `
CREATE TABLE IF NOT EXISTS Companies (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    GSTIN TEXT,
    PAN TEXT,
    City TEXT,
    State TEXT,
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
    PrincipalAmount REAL,
    Outstanding REAL,
    DisbursementDate TEXT
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
    Commissionrate REAL,
    AccountingCircle TEXT,
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

// Add CompanyId to all standard tables
addColumnIfNotExists('Users', 'CompanyId', 'INTEGER');
addColumnIfNotExists('InventoryItems', 'CompanyId', 'INTEGER');
addColumnIfNotExists('Accounts', 'CompanyId', 'INTEGER');
addColumnIfNotExists('FPCMembers', 'CompanyId', 'INTEGER');
addColumnIfNotExists('Loans', 'CompanyId', 'INTEGER');
addColumnIfNotExists('SalesInvoices', 'CompanyId', 'INTEGER');

// Add FinancialYearId to transaction tables
addColumnIfNotExists('Loans', 'FinancialYearId', 'INTEGER');
addColumnIfNotExists('SalesInvoices', 'FinancialYearId', 'INTEGER');

// Add default company if not exists
const firstCompany = db.prepare("SELECT * FROM Companies LIMIT 1").get();
if (!firstCompany) {
  const compInfo = db.prepare("INSERT INTO Companies (Name, PAN, GSTIN) VALUES ('AgriCorp FPC Ltd', 'AABCA1234K', '27AABCA1234K1Z1')").run();
  
  db.prepare("INSERT INTO FinancialYears (FinancialYear, CompanyId, FromDate, ToDate) VALUES (?, ?, ?, ?)").run('2023-2024', compInfo.lastInsertRowid, '2023-04-01', '2024-03-31');
  db.prepare("INSERT INTO FinancialYears (FinancialYear, CompanyId, FromDate, ToDate) VALUES (?, ?, ?, ?)").run('2024-2025', compInfo.lastInsertRowid, '2024-04-01', '2025-03-31');
}

export default db;
