import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthContextType {
  user: any | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (module: string, action?: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage or session
    const storedUser = localStorage.getItem('fpc_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
            setUser(data.user);
            localStorage.setItem('fpc_user', JSON.stringify(data.user));
            return true;
        }
      }
      
      // Fallback for hardcoded admin if API setup is incomplete
      if (email === 'admin@fpc.com' && pass === 'admin123') {
           const adminUser = { id: 1, Name: 'Super Admin', Role: 'Super Admin', email: email };
           setUser(adminUser);
           localStorage.setItem('fpc_user', JSON.stringify(adminUser));
           return true; 
      }
      
      return false;
    } catch(e) {
       console.error(e);
       // Fallback for hardcoded admin if server is unreachable
       if (email === 'admin@fpc.com' && pass === 'admin123') {
           const adminUser = { id: 1, Name: 'Super Admin', Role: 'Super Admin', email: email };
           setUser(adminUser);
           localStorage.setItem('fpc_user', JSON.stringify(adminUser));
           return true; 
       }
       return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fpc_user');
  };

  const hasRole = (role: string) => {
     return user?.role === role || user?.Role === role;
  };
  
  const hasPermission = (path: string, action?: string) => {
     if (user?.role === 'Super Admin' || user?.Role === 'Super Admin') return true;
     
     if (path === '/') return true; // dashboard accessible to all

     const defaultPermissions: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }> = {
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

       // Demand Management
       'Demand Management: Demand Enquiry': { view: true, add: true, edit: true, delete: true },
       'Demand Management: Demand Forecasting': { view: true, add: false, edit: false, delete: false },
       'Demand Management: Farmer Planning': { view: true, add: true, edit: true, delete: true },
       'Demand Management: Demand Aggregation': { view: true, add: false, edit: false, delete: false },
       'Demand Management: Market Intelligence': { view: true, add: false, edit: false, delete: false },

       'FPC Management: FPC Members': { view: true, add: true, edit: true, delete: false },
       'FPC Management: Member Register': { view: true, add: false, edit: false, delete: false },
       'FPC Management: Share Management': { view: true, add: true, edit: true, delete: false },
       'FPC Management: Loan Management': { view: true, add: true, edit: true, delete: false },

       // Sales
       'Sales: Sales Quotations': { view: true, add: false, edit: false, delete: false },
       'Sales: Sales Orders': { view: true, add: false, edit: false, delete: false },
       'Sales: Sales Invoices': { view: true, add: false, edit: false, delete: false },
       'Sales: Sales Returns': { view: true, add: false, edit: false, delete: false },

       // Purchase
       'Purchase: Purchase Orders': { view: true, add: false, edit: false, delete: false },
       'Purchase: Purchase Invoices': { view: true, add: false, edit: false, delete: false },
       'Purchase: Purchase Returns': { view: true, add: false, edit: false, delete: false },

       // Inventory
       'Inventory: Stock Summary': { view: true, add: false, edit: false, delete: false },
       'Inventory: Stock Ledger': { view: true, add: false, edit: false, delete: false },
       'Inventory: Stock Adjustments': { view: true, add: false, edit: false, delete: false },

       // Assets
       'Assets: Asset Register': { view: true, add: false, edit: false, delete: false },

       // Accounting
       'Accounting: Journal Entries': { view: true, add: false, edit: false, delete: false },
       'Accounting: Cash Payments': { view: true, add: false, edit: false, delete: false },
       'Accounting: Bank Payments': { view: true, add: false, edit: false, delete: false },
       'Accounting: Cash Receipts': { view: true, add: false, edit: false, delete: false },
       'Accounting: Bank Receipts': { view: true, add: false, edit: false, delete: false },


       // MIS & Reports
       'MIS & Reports: MIS & Reports': { view: true, add: false, edit: false, delete: false },

       // E-Tracker
       'E-Tracker: Dashboard': { view: true, add: false, edit: false, delete: false },
       'E-Tracker: Ticket Management': { view: true, add: true, edit: true, delete: true },
       'E-Tracker: Status Configuration': { view: true, add: true, edit: true, delete: true },

       // Settings
       'Settings: Settings': { view: true, add: true, edit: true, delete: true },
     };

     try {
       const perms = localStorage.getItem('fpc_role_permissions');
       const rawRole = user?.role || user?.Role || '';
       const role = rawRole.toString().trim().toUpperCase();
       
       let rolePerms: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }> | null = null;
       
       if (perms) {
         const parsedPerms = JSON.parse(perms);
         const foundKey = Object.keys(parsedPerms).find(k => k.trim().toUpperCase() === role);
         if (foundKey) {
           rolePerms = parsedPerms[foundKey];
         }
       }
       
       let key: string | null = null;
       
       // Map paths to keys defined in Settings.tsx
       if (path.startsWith('/master/company')) key = 'Company Master: Company Details';
       else if (path.startsWith('/master/financial-years')) key = 'Company Master: Financial Years';
       else if (path.startsWith('/master/customers')) key = 'Company Master: Customer Details';
       else if (path.startsWith('/master/vendors')) key = 'Company Master: Vendor Details';
       else if (path.startsWith('/master/banks')) key = 'Company Master: Bank Details';
       else if (path.startsWith('/master/bank-account-types')) key = 'Company Master: A/c Types';
       else if (path.startsWith('/master/users')) key = 'Company Master: Users & Roles';
       else if (path.startsWith('/master/system-roles')) key = 'Company Master: System Roles';
       else if (path.startsWith('/master/locations')) key = 'Company Master: Locations';
       else if (path.startsWith('/master/units')) key = 'Company Master: Units';
       else if (path.startsWith('/master/items')) key = 'Company Master: Item Details';
       else if (path.startsWith('/master/groups')) key = 'Company Master: Account Groups';
       else if (path.startsWith('/master/accounts')) key = 'Company Master: Chart of Accounts';
       else if (path.startsWith('/master/bulk-upload')) key = 'Company Master: Bulk Upload';
       
       else if (path.startsWith('/fpc/dashboard')) key = 'HRMS & Payroll: Dashboard';
       else if (path.startsWith('/fpc/members')) key = 'HRMS & Payroll: Employee Lifecycle';
       else if (path.startsWith('/fpc/attendance')) key = 'HRMS & Payroll: Attendance & Timesheets';
       else if (path.startsWith('/fpc/leaves')) key = 'HRMS & Payroll: Leave Management';
       else if (path.startsWith('/fpc/payroll')) key = 'HRMS & Payroll: Payroll & Payslips';
       else if (path.startsWith('/fpc/register')) key = 'HRMS & Payroll: Member Register';
       else if (path.startsWith('/fpc/shares')) key = 'HRMS & Payroll: Share Management';
       else if (path.startsWith('/fpc/loans')) key = 'HRMS & Payroll: Loan Management';
       else if (path.startsWith('/fpc/reports')) key = 'HRMS & Payroll: Reports';
       else if (path.startsWith('/fpc')) key = 'HRMS & Payroll: Dashboard';
       
       else if (path.startsWith('/sales') && path.includes('quotations')) key = 'CRM & Sales: Sales Quotations';
       else if (path.startsWith('/sales') && path.includes('orders')) key = 'CRM & Sales: Sales Orders';
       else if (path.startsWith('/sales') && path.includes('invoices')) key = 'CRM & Sales: Sales Invoices';
       else if (path.startsWith('/sales') && path.includes('returns')) key = 'CRM & Sales: Sales Returns';
       
       else if (path.startsWith('/purchase') && path.includes('orders')) key = 'Purchase: Purchase Orders';
       else if (path.startsWith('/purchase') && path.includes('invoices')) key = 'Purchase: Purchase Invoices';
       else if (path.startsWith('/purchase') && path.includes('returns')) key = 'Purchase: Purchase Returns';
       
       else if (path.startsWith('/inventory') && path.includes('summary')) key = 'Inventory: Stock Summary';
       else if (path.startsWith('/inventory') && path.includes('ledger')) key = 'Inventory: Stock Ledger';
       else if (path.startsWith('/inventory') && path.includes('adjustments')) key = 'Inventory: Stock Adjustments';
       
       else if (path.startsWith('/assets')) key = 'Assets: Asset Register';
       
       else if (path.startsWith('/accounting') && path.includes('journal')) key = 'Accounting: Journal Entries';
       else if (path.startsWith('/accounting') && path.includes('bank-payments')) key = 'Accounting: Bank Payments';
       else if (path.startsWith('/accounting') && path.includes('payments')) key = 'Accounting: Cash Payments';
       else if (path.startsWith('/accounting') && path.includes('bank-receipts')) key = 'Accounting: Bank Receipts';
       else if (path.startsWith('/accounting') && path.includes('receipts')) key = 'Accounting: Cash Receipts';
       
       else if (path.startsWith('/projects/dashboard')) key = 'Projects: Dashboard';
       else if (path.startsWith('/projects/listing')) key = 'Projects: Project Listing';
       else if (path.startsWith('/projects/tasks')) key = 'Projects: Task Board';
       else if (path.startsWith('/projects/gantt')) key = 'Projects: Gantt Chart';
       else if (path.startsWith('/projects/timesheets')) key = 'Projects: Timesheets';
       else if (path.startsWith('/projects/reports')) key = 'Projects: Project Reports';
       else if (path.startsWith('/projects')) key = 'Projects: Dashboard';

       else if (path.startsWith('/manufacturing/dashboard')) key = 'Manufacturing: Dashboard';
       else if (path.startsWith('/manufacturing/orders')) key = 'Manufacturing: Work Orders';
       else if (path.startsWith('/manufacturing/bom')) key = 'Manufacturing: Bill of Materials (BOM)';
       else if (path.startsWith('/manufacturing/planning')) key = 'Manufacturing: Production Planning';
       else if (path.startsWith('/manufacturing/quality')) key = 'Manufacturing: Quality Control';
       else if (path.startsWith('/manufacturing/reports')) key = 'Manufacturing: Manufacturing Reports';
       else if (path.startsWith('/manufacturing')) key = 'Manufacturing: Dashboard';

       else if (path.startsWith('/hospital/dashboard')) key = 'Hospital: Dashboard';
       else if (path.startsWith('/hospital/patients')) key = 'Hospital: Patient Registration';
       else if (path.startsWith('/hospital/doctors')) key = 'Hospital: Doctor Scheduling';
       else if (path.startsWith('/hospital/ipd-opd')) key = 'Hospital: IPD/OPD Management';
       else if (path.startsWith('/hospital/billing')) key = 'Hospital: Billing & Invoicing';
       else if (path.startsWith('/hospital/lab')) key = 'Hospital: Laboratory & Radiology';
       else if (path.startsWith('/hospital/pharmacy')) key = 'Hospital: Pharmacy Inventory';
       else if (path.startsWith('/hospital/reports')) key = 'Hospital: Hospital Reports';
       else if (path.startsWith('/hospital')) key = 'Hospital: Dashboard';

       else if (path.startsWith('/school-erp/dashboard')) key = 'School ERP: Dashboard';
       else if (path.startsWith('/school-erp/admission')) key = 'School ERP: Student Admission';
       else if (path.startsWith('/school-erp/calendar')) key = 'School ERP: Academic Calendar';
       else if (path.startsWith('/school-erp/attendance')) key = 'School ERP: Attendance Tracker';
       else if (path.startsWith('/school-erp/fees')) key = 'School ERP: Fee Management';
       else if (path.startsWith('/school-erp/exams')) key = 'School ERP: Examination & Grading';
       else if (path.startsWith('/school-erp/transport')) key = 'School ERP: Transport & Hostel';
       else if (path.startsWith('/school-erp/reports')) key = 'School ERP: School Reports';
       else if (path.startsWith('/school-erp')) key = 'School ERP: Dashboard';

       else if (path.startsWith('/compliance/dashboard')) key = 'Compliance: Dashboard';
       else if (path.startsWith('/compliance/audit')) key = 'Compliance: Audit Checklist';
       else if (path.startsWith('/compliance/filings')) key = 'Compliance: Regulatory Filings';
       else if (path.startsWith('/compliance/documents')) key = 'Compliance: Document Control';
       else if (path.startsWith('/compliance/risk')) key = 'Compliance: Risk Assessment';
       else if (path.startsWith('/compliance/reports')) key = 'Compliance: Compliance Reports';
       else if (path.startsWith('/compliance')) key = 'Compliance: Dashboard';

       else if (path.startsWith('/reports')) key = 'MIS & Reports: MIS & Reports';
       else if (path.startsWith('/e-tracker/issues')) key = 'Issue Tracker: Ticket Management';
       else if (path.startsWith('/e-tracker/statuses')) key = 'Issue Tracker: Status Configuration';
       else if (path.startsWith('/e-tracker')) key = 'Issue Tracker: Dashboard';
       else if (path.startsWith('/settings')) key = 'Settings & RBAC: Settings & RBAC';
       else if (path.startsWith('/user-manual')) return true;

       if (key) {
         const modulePerms = (rolePerms && rolePerms[key] !== undefined) 
           ? rolePerms[key] 
           : defaultPermissions[key];

         if (modulePerms) {
           if (action) {
             return modulePerms[action as 'view' | 'add' | 'edit' | 'delete'] === true;
           }
           return modulePerms.view === true;
         }
       }
     } catch (e) {
       console.error("error parsing permissions checking", e);
     }
     
     return false; 
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
