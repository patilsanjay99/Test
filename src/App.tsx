import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Company } from './pages/master-data/Company';
import { CompanyForm } from './pages/master-data/CompanyForm';
import { Users } from './pages/master-data/Users';
import { UserForm } from './pages/master-data/UserForm';
import { Items } from './pages/master-data/Items';
import { ItemForm } from './pages/master-data/ItemForm';
import { Customers } from './pages/master-data/Customers';
import { CustomerForm } from './pages/master-data/CustomerForm';
import { FinancialYears } from './pages/master-data/FinancialYears';
import { FinancialYearForm } from './pages/master-data/FinancialYearForm';
import { Members } from './pages/fpc/Members';
import { MemberForm } from './pages/fpc/MemberForm';
import { Shares } from './pages/fpc/Shares';
import { ShareForm } from './pages/fpc/ShareForm';
import { Loans } from './pages/fpc/Loans';
import { LoanForm } from './pages/fpc/LoanForm';
import { SalesInvoices } from './pages/sales/SalesInvoices';
import { SalesInvoiceForm } from './pages/sales/SalesInvoiceForm';
import { SalesQuotations } from './pages/sales/SalesQuotations';
import { SalesQuotationForm } from './pages/sales/SalesQuotationForm';
import { SalesOrders } from './pages/sales/SalesOrders';
import { SalesOrderForm } from './pages/sales/SalesOrderForm';
import { SalesReturns } from './pages/sales/SalesReturns';
import { SalesReturnForm } from './pages/sales/SalesReturnForm';
import { PurchaseOrders } from './pages/purchase/PurchaseOrders';
import { PurchaseOrderForm } from './pages/purchase/PurchaseOrderForm';
import { PurchaseInvoices } from './pages/purchase/PurchaseInvoices';
import { PurchaseInvoiceForm } from './pages/purchase/PurchaseInvoiceForm';
import { PurchaseReturns } from './pages/purchase/PurchaseReturns';
import { PurchaseReturnForm } from './pages/purchase/PurchaseReturnForm';
import { StockLedger } from './pages/inventory/StockLedger';
import { StockAdjustments } from './pages/inventory/StockAdjustments';
import { StockAdjustmentForm } from './pages/inventory/StockAdjustmentForm';
import { Assets } from './pages/assets/Assets';
import { AssetForm } from './pages/assets/AssetForm';
import { ChartOfAccounts } from './pages/accounting/ChartOfAccounts';
import { AccountForm } from './pages/accounting/AccountForm';
import { JournalEntries } from './pages/accounting/JournalEntries';
import { JournalEntryForm } from './pages/accounting/JournalEntryForm';
import { Reports } from './pages/reports/Reports';
import { Settings } from './pages/settings/Settings';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';

// Placeholder for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full text-gray-400 text-lg">
    {title} Module - Coming Soon
  </div>
);

export default function App() {
  return (
    <AppProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="master">
              <Route path="company" element={<Company />} />
              <Route path="company/new" element={<CompanyForm />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/new" element={<CustomerForm />} />
              <Route path="financial-years" element={<FinancialYears />} />
              <Route path="financial-years/new" element={<FinancialYearForm />} />
              <Route path="users" element={<Users />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="items" element={<Items />} />
              <Route path="items/new" element={<ItemForm />} />
            </Route>
            <Route path="fpc">
              <Route path="members" element={<Members />} />
              <Route path="members/new" element={<MemberForm />} />
              <Route path="shares" element={<Shares />} />
              <Route path="shares/new" element={<ShareForm />} />
              <Route path="loans" element={<Loans />} />
              <Route path="loans/new" element={<LoanForm />} />
            </Route>
            <Route path="sales">
            <Route path="quotations" element={<SalesQuotations />} />
            <Route path="quotations/new" element={<SalesQuotationForm />} />
            <Route path="orders" element={<SalesOrders />} />
            <Route path="orders/new" element={<SalesOrderForm />} />
            <Route path="invoices" element={<SalesInvoices />} />
            <Route path="invoices/new" element={<SalesInvoiceForm />} />
            <Route path="returns" element={<SalesReturns />} />
            <Route path="returns/new" element={<SalesReturnForm />} />
          </Route>
          <Route path="purchase">
            <Route path="orders" element={<PurchaseOrders />} />
            <Route path="orders/new" element={<PurchaseOrderForm />} />
            <Route path="invoices" element={<PurchaseInvoices />} />
            <Route path="invoices/new" element={<PurchaseInvoiceForm />} />
            <Route path="returns" element={<PurchaseReturns />} />
            <Route path="returns/new" element={<PurchaseReturnForm />} />
          </Route>
            <Route path="inventory">
              <Route path="ledger" element={<StockLedger />} />
              <Route path="adjustments" element={<StockAdjustments />} />
              <Route path="adjustments/new" element={<StockAdjustmentForm />} />
            </Route>
            <Route path="assets">
              <Route index element={<Assets />} />
              <Route path="new" element={<AssetForm />} />
            </Route>
            <Route path="accounting">
              <Route path="accounts" element={<ChartOfAccounts />} />
              <Route path="accounts/new" element={<AccountForm />} />
              <Route path="journal" element={<JournalEntries />} />
              <Route path="journal/new" element={<JournalEntryForm />} />
            </Route>
            <Route path="reports">
              <Route index element={<Reports />} />
            </Route>
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </LanguageProvider>
    </AppProvider>
  );
}
