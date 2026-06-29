import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
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
  Calendar,
  MapPin,
  Upload,
  Shield,
  ClipboardList,
  LogOut,
  BookOpen,
  Scale,
  TrendingUp,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MenuItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

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
  const { t, language, setLanguage } = useLanguage();
  const { hasPermission, user, logout } = useAuth();
  const { 
    activeCompany, 
    companies, 
    setActiveCompany, 
    activeFinancialYear, 
    setActiveFinancialYear, 
    financialYears,
    isMobileMenuOpen, 
    setIsMobileMenuOpen 
  } = useAppContext();

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
        { title: t('sidebar.vendorDetails'), path: '/master/vendors', icon: Users },
        { title: t('sidebar.bankDetails'), path: '/master/banks', icon: Landmark },
        { title: 'A/c Types', path: '/master/bank-account-types', icon: Landmark },
        { title: t('sidebar.usersRoles'), path: '/master/users', icon: Users },
        { title: 'System Roles', path: '/master/system-roles', icon: Shield },
        { title: t('sidebar.locations'), path: '/master/locations', icon: MapPin },
        { title: t('sidebar.unitsOfMeasurement'), path: '/master/units', icon: Scale },
        { title: t('sidebar.itemsProducts'), path: '/master/items', icon: Package },
        { title: t('sidebar.accountGroups'), path: '/master/groups', icon: Landmark },
        { title: t('sidebar.chartOfAccounts'), path: '/master/accounts', icon: Landmark },
        { title: t('sidebar.bulkUpload'), path: '/master/bulk-upload', icon: Upload },
      ]
    },
    { 
      title: t('sidebar.demandManagement'), 
      path: '/demand', 
      icon: ShoppingCart, // Re-using an appropriate icon or import something better like Activity
      submenu: [
        { title: t('sidebar.demandEnquiry'), path: '/demand/enquiry', icon: ClipboardList },
        { title: t('sidebar.demandForecasting'), path: '/demand/forecasting', icon: TrendingUp },
        { title: t('sidebar.farmerPlanning'), path: '/demand/farmer-planning', icon: Users },
        { title: t('sidebar.demandAggregation'), path: '/demand/aggregation', icon: Package },
        { title: t('sidebar.marketIntelligence'), path: '/demand/intelligence', icon: Activity },
      ]
    },
    { 
      title: t('sidebar.fpcManagement'), 
      path: '/fpc', 
      icon: Users,
      submenu: [
        { title: t('sidebar.hrmsDashboard'), path: '/fpc/dashboard', icon: LayoutDashboard },
        { title: t('sidebar.fpcMembers'), path: '/fpc/members', icon: Users },
        { title: t('sidebar.attendanceTimesheets'), path: '/fpc/attendance', icon: Calendar },
        { title: t('sidebar.leaveManagement'), path: '/fpc/leaves', icon: ClipboardList },
        { title: t('sidebar.payrollPayslips'), path: '/fpc/payroll', icon: Wallet },
        { title: t('sidebar.memberRegister'), path: '/fpc/register', icon: Users },
        { title: t('sidebar.shareManagement'), path: '/fpc/shares', icon: FileText },
        { title: t('sidebar.loanManagement'), path: '/fpc/loans', icon: Wallet },
        { title: t('sidebar.hrmsReports'), path: '/fpc/reports', icon: FileText },
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
        { title: t('sidebar.stockSummary'), path: '/inventory/summary', icon: Package },
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
        { title: t('sidebar.journalEntries'), path: '/accounting/journal', icon: Landmark },
        { title: t('sidebar.cashPayments'), path: '/accounting/payments', icon: Wallet },
        { title: t('sidebar.bankPayments'), path: '/accounting/bank-payments', icon: Wallet },
        { title: t('sidebar.cashReceipts'), path: '/accounting/receipts', icon: Wallet },
        { title: t('sidebar.bankReceipts'), path: '/accounting/bank-receipts', icon: Wallet }
      ]
    },
    { 
      title: t('sidebar.eTracker'), 
      path: '/e-tracker', 
      icon: ClipboardList,
      submenu: [
        { title: t('sidebar.eTrackerDashboard'), path: '/e-tracker', icon: LayoutDashboard },
        { title: t('sidebar.eTrackerIssues'), path: '/e-tracker/issues', icon: Briefcase },
        { title: t('sidebar.eTrackerStatuses'), path: '/e-tracker/statuses', icon: Settings }
      ]
    },
    { title: t('sidebar.reports'), path: '/reports', icon: FileText },
    { title: t('sidebar.settings'), path: '/settings', icon: Settings },
    { title: t('sidebar.userManual'), path: '/user-manual', icon: BookOpen },
  ];

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const hasParentPermission = (path: string) => {
    if (user?.role === 'Super Admin' || user?.Role === 'Super Admin') return true;
    // Allow access if any submenu item is accessible
    const submenu = menuItems.find(item => item.path === path)?.submenu;
    if (submenu) {
        return submenu.some(sub => hasPermission(sub.path));
    }
    return hasPermission(path);
  };
  
  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={cn(
        "bg-slate-900 text-slate-300 flex flex-col h-full shrink-0 z-50 transition-transform duration-300 ease-in-out print:hidden",
        "fixed inset-y-0 left-0 w-64 transform lg:static lg:translate-x-0 lg:w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:-translate-x-0"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950 font-bold text-xl tracking-tight text-white gap-2">
          {activeCompany?.LogoUrl ? (
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center overflow-hidden shrink-0">
               <img src={activeCompany.LogoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="truncate">{t('app.title')}</span>
        </div>
        
        {/* Mobile only Company, FY and Language selector */}
        <div className="md:hidden flex flex-col px-4 py-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company</label>
              <select 
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-2.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={activeCompany?.id || ''}
                onChange={(e) => {
                  const comp = companies.find(c => c.id === e.target.value);
                  if (comp) setActiveCompany(comp);
                }}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financial Year</label>
                <select 
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-2.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={activeFinancialYear?.id || ''}
                  onChange={(e) => {
                    const fy = financialYears.find(f => f.id === e.target.value);
                    if (fy) setActiveFinancialYear(fy);
                  }}
                >
                  {financialYears.map(fy => (
                    <option key={fy.id} value={fy.id}>{fy.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Language</label>
                <select 
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-md px-2.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'mr' | 'hi')}
                >
                  <option value="en">English</option>
                  <option value="mr">मराठी</option>
                  <option value="hi">हिंदी</option>
                </select>
              </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-1 px-3">
            {menuItems
              .map(item => ({
                ...item,
                submenu: item.submenu?.filter(sub => hasPermission(sub.path))
              }))
              .filter(item => hasParentPermission(item.path))
              .map((item) => (
              <div key={item.title}>
                {item.submenu && item.submenu.length > 0 ? (
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
                            onClick={() => setIsMobileMenuOpen(false)}
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
                    onClick={() => setIsMobileMenuOpen(false)}
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
        
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/30">
          <div className="flex items-center gap-3 px-3 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0 font-bold border border-slate-600">
              {(user?.Name || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="truncate flex-1">
              <div className="text-white font-medium text-sm truncate">{user?.Name || user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.Email || user?.email || 'admin@fpc.com'}</div>
            </div>
          </div>
          <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-red-950/40 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-900/60 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer"
              title="Log out"
              id="btn-sidebar-logout"
          >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
