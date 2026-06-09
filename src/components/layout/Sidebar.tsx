import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Package, 
  Wallet, 
  Landmark,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MenuItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

function Database(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems: MenuItem[] = [
    { title: t('sidebar.dashboard'), path: '/', icon: LayoutDashboard },
    { 
      title: t('sidebar.masterData'), 
      path: '/master', 
      icon: Database,
      submenu: [
        { title: t('sidebar.companyDetails'), path: '/master/company', icon: Building2 },
        { title: t('sidebar.financialYears'), path: '/master/financial-years', icon: Calendar },
        { title: t('sidebar.customerDetails'), path: '/master/customers', icon: Users },
        { title: t('sidebar.usersRoles'), path: '/master/users', icon: Users },
        { title: t('sidebar.itemsProducts'), path: '/master/items', icon: Package },
      ]
    },
    { 
      title: t('sidebar.fpcManagement'), 
      path: '/fpc', 
      icon: Users,
      submenu: [
        { title: t('sidebar.fpcMembers'), path: '/fpc/members', icon: Users },
        { title: t('sidebar.shareManagement'), path: '/fpc/shares', icon: FileText },
        { title: t('sidebar.loanManagement'), path: '/fpc/loans', icon: Wallet },
      ]
    },
    { 
      title: t('sidebar.sales'), 
      path: '/sales', 
      icon: ShoppingCart,
      submenu: [
        { title: t('sidebar.salesQuotations'), path: '/sales/quotations', icon: FileText },
        { title: t('sidebar.salesOrders'), path: '/sales/orders', icon: ShoppingCart },
        { title: t('sidebar.salesInvoices'), path: '/sales/invoices', icon: Receipt },
        { title: t('sidebar.salesReturns'), path: '/sales/returns', icon: FileText }
      ]
    },
    { 
      title: t('sidebar.purchase'), 
      path: '/purchase', 
      icon: Receipt,
      submenu: [
        { title: t('sidebar.purchaseOrders'), path: '/purchase/orders', icon: ShoppingCart },
        { title: t('sidebar.purchaseInvoices'), path: '/purchase/invoices', icon: Receipt },
        { title: t('sidebar.purchaseReturns'), path: '/purchase/returns', icon: FileText }
      ]
    },
    { 
      title: t('sidebar.inventory'), 
      path: '/inventory', 
      icon: Package,
      submenu: [
        { title: t('sidebar.stockLedger'), path: '/inventory/ledger', icon: Package },
        { title: t('sidebar.stockAdjustments'), path: '/inventory/adjustments', icon: Package }
      ]
    },
    { 
      title: t('sidebar.assets'), 
      path: '/assets', 
      icon: Briefcase,
      submenu: [
        { title: t('sidebar.assetRegister'), path: '/assets', icon: Briefcase }
      ]
    },
    { 
      title: t('sidebar.accounting'), 
      path: '/accounting', 
      icon: Landmark,
      submenu: [
        { title: t('sidebar.chartOfAccounts'), path: '/accounting/accounts', icon: Landmark },
        { title: t('sidebar.journalEntries'), path: '/accounting/journal', icon: Landmark }
      ]
    },
    { title: t('sidebar.reports'), path: '/reports', icon: FileText },
    { title: t('sidebar.settings'), path: '/settings', icon: Settings },
  ];

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950 font-bold text-xl tracking-tight text-white gap-2">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span>{t('app.title')}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => (
            <div key={item.title}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive(item.path) || expandedItems[item.title] 
                        ? "bg-slate-800 text-white" 
                        : "hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      {item.title}
                    </div>
                    {expandedItems[item.title] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedItems[item.title] && (
                    <div className="mt-1 space-y-1 pl-10 pr-3">
                      {item.submenu.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive }) => cn(
                            "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isActive 
                              ? "bg-blue-600 text-white" 
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          )}
                        >
                          {sub.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.title}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 font-medium text-sm px-3 py-2">
           <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0">
             SA
           </div>
           <div className="truncate">
             <div className="text-white truncate">Super Admin</div>
             <div className="text-xs text-slate-500 truncate">admin@fpc.com</div>
           </div>
        </div>
      </div>
    </div>
  );
}
