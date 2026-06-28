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
       if (path.startsWith('/master/company')) key = 'Master Data: Company Details';
       else if (path.startsWith('/master/financial-years')) key = 'Master Data: Financial Years';
       else if (path.startsWith('/master/customers')) key = 'Master Data: Customer Details';
       else if (path.startsWith('/master/vendors')) key = 'Master Data: Vendor Details';
       else if (path.startsWith('/master/banks')) key = 'Master Data: Bank Details';
       else if (path.startsWith('/master/users')) key = 'Master Data: Users & Roles';
       else if (path.startsWith('/master/locations')) key = 'Master Data: Locations';
       else if (path.startsWith('/master/items')) key = 'Master Data: Item Details';
       else if (path.startsWith('/master/units')) key = 'Master Data: Units';
       else if (path.startsWith('/master/groups')) key = 'Master Data: Account Groups';
       else if (path.startsWith('/master/accounts')) key = 'Master Data: Chart of Accounts';
       else if (path.startsWith('/fpc/members')) key = 'FPC Management: FPC Members';
       else if (path.startsWith('/fpc/register')) key = 'FPC Management: Member Register';
       else if (path.startsWith('/fpc/shares')) key = 'FPC Management: Share Management';
       else if (path.startsWith('/fpc/loans')) key = 'FPC Management: Loan Management';
       else if (path.startsWith('/sales') && path.includes('quotations')) key = 'Sales: Sales Quotations';
       else if (path.startsWith('/sales') && path.includes('orders')) key = 'Sales: Sales Orders';
       else if (path.startsWith('/sales') && path.includes('invoices')) key = 'Sales: Sales Invoices';
       else if (path.startsWith('/sales') && path.includes('returns')) key = 'Sales: Sales Returns';
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
       else if (path.startsWith('/reports')) key = 'MIS & Reports: MIS & Reports';
       else if (path.startsWith('/e-tracker/issues')) key = 'E-Tracker: Ticket Management';
       else if (path.startsWith('/e-tracker/statuses')) key = 'E-Tracker: Status Configuration';
       else if (path.startsWith('/e-tracker')) key = 'E-Tracker: Dashboard';
       else if (path.startsWith('/settings')) key = 'Settings: Settings';
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
