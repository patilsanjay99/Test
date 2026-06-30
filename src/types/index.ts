export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'HR' | 'Project Manager' | 'Accountant' | 'Employee';
}

export interface Company {
  id: string;
  name: string;
  gstNumber: string;
  panNumber: string;
  address?: string;
  defaultQuotationTerms?: string;
  defaultSalesOrderTerms?: string;
  defaultSalesInvoiceTerms?: string;
  LogoUrl?: string;
  StateCode?: string;
  StateName?: string;
}

// Define other core types here as the app expands
export interface MenuItem {
  title: string;
  path: string;
  icon: any; // Lucide icon component
  submenu?: MenuItem[];
}
