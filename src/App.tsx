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
import { Locations } from './pages/master-data/Locations';
import { Units } from './pages/master-data/Units';
import { Vendors } from './pages/master-data/Vendors';
import { BankForm } from './pages/master-data/BankForm';
import { Banks } from './pages/master-data/Banks';
import { VendorForm } from './pages/master-data/VendorForm';
import { FinancialYears } from './pages/master-data/FinancialYears';
import { FinancialYearForm } from './pages/master-data/FinancialYearForm';
import { Members } from './pages/fpc/Members';
import { MemberForm } from './pages/fpc/MemberForm';
import { MemberRegister } from './pages/fpc/MemberRegister';
import { Shares } from './pages/fpc/Shares';
import { ShareForm } from './pages/fpc/ShareForm';
import { Loans } from './pages/fpc/Loans';
import { LoanForm } from './pages/fpc/LoanForm';
import { SalesInvoices } from './pages/sales/SalesInvoices';
import { SalesInvoiceForm } from './pages/sales/SalesInvoiceForm';
import { InvoicePrint } from './pages/sales/InvoicePrint';
import { QuotationPrint } from './pages/sales/QuotationPrint';
import { SalesOrderPrint } from './pages/sales/SalesOrderPrint';
import { SalesQuotations } from './pages/sales/SalesQuotations';
import { SalesQuotationForm } from './pages/sales/SalesQuotationForm';
import { SalesOrders } from './pages/sales/SalesOrders';
import { SalesOrderForm } from './pages/sales/SalesOrderForm';
import { SalesReturns } from './pages/sales/SalesReturns';
import { SalesReturnForm } from './pages/sales/SalesReturnForm';
import { SalesReturnPrint } from './pages/sales/SalesReturnPrint';
import { PurchaseOrders } from './pages/purchase/PurchaseOrders';
import { PurchaseOrderForm } from './pages/purchase/PurchaseOrderForm';
import { PurchaseOrderPrint } from './pages/purchase/PurchaseOrderPrint';
import { PurchaseInvoices } from './pages/purchase/PurchaseInvoices';
import { PurchaseInvoiceForm } from './pages/purchase/PurchaseInvoiceForm';
import { PurchaseReturns } from './pages/purchase/PurchaseReturns';
import { PurchaseReturnForm } from './pages/purchase/PurchaseReturnForm';
import { StockSummary } from './pages/inventory/StockSummary';
import { StockLedger } from './pages/inventory/StockLedger';
import { StockAdjustments } from './pages/inventory/StockAdjustments';
import { StockAdjustmentForm } from './pages/inventory/StockAdjustmentForm';
import { Assets } from './pages/assets/Assets';
import { AssetForm } from './pages/assets/AssetForm';
import { BankAccountTypes } from './pages/master-data/BankAccountTypes';
import { SystemRoles } from './pages/master-data/SystemRoles';
import { AccountGroups } from './pages/accounting/AccountGroups';
import { AccountGroupForm } from './pages/accounting/AccountGroupForm';
import { ChartOfAccounts } from './pages/accounting/ChartOfAccounts';
import { AccountForm } from './pages/accounting/AccountForm';
import { BulkUpload } from './pages/master-data/BulkUpload';
import { JournalEntries } from './pages/accounting/JournalEntries';
import { JournalEntryForm } from './pages/accounting/JournalEntryForm';
import { CashPayments } from './pages/accounting/CashPayments';
import { CashPaymentForm } from './pages/accounting/CashPaymentForm';
import { BankPayments } from './pages/accounting/BankPayments';
import { BankPaymentForm } from './pages/accounting/BankPaymentForm';
import { BankReceipts } from './pages/accounting/BankReceipts';
import { BankReceiptForm } from './pages/accounting/BankReceiptForm';
import { CashReceipts } from './pages/accounting/CashReceipts';
import { CashReceiptForm } from './pages/accounting/CashReceiptForm';
import { Reports } from './pages/reports/Reports';
import { Settings } from './pages/settings/Settings';
import { UserManual } from './pages/settings/UserManual';
import { ETrackerDashboard } from './pages/e-tracker/ETrackerDashboard';
import { IssuesList } from './pages/e-tracker/IssuesList';
import { IssueForm } from './pages/e-tracker/IssueForm';
import { IssueStatusesList } from './pages/e-tracker/IssueStatusesList';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';

// Placeholder for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full text-gray-400 text-lg">
    {title} Module - Coming Soon
  </div>
);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
    <AppProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route index element={<Dashboard />} />

            <Route path="master">
              <Route path="company" element={<Company />} />
              <Route path="company/new" element={<CompanyForm />} />
              <Route path="company/:id" element={<CompanyForm />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/new" element={<CustomerForm />} />
              <Route path="customers/:id" element={<CustomerForm />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="vendors/new" element={<VendorForm />} />
              <Route path="vendors/:id" element={<VendorForm />} />
              <Route path="banks" element={<Banks />} />
              <Route path="banks/new" element={<BankForm />} />
              <Route path="banks/:id" element={<BankForm />} />
              <Route path="locations" element={<Locations />} />
              <Route path="units" element={<Units />} />
              <Route path="financial-years" element={<FinancialYears />} />
              <Route path="financial-years/new" element={<FinancialYearForm />} />
              <Route path="users" element={<Users />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="users/:id" element={<UserForm />} />
              <Route path="system-roles" element={<SystemRoles />} />
              <Route path="bank-account-types" element={<BankAccountTypes />} />
              <Route path="items" element={<Items />} />
              <Route path="items/new" element={<ItemForm />} />
              <Route path="items/:id" element={<ItemForm />} />
              <Route path="groups" element={<AccountGroups />} />
              <Route path="groups/new" element={<AccountGroupForm />} />
              <Route path="groups/:id" element={<AccountGroupForm />} />
              <Route path="accounts" element={<ChartOfAccounts />} />
              <Route path="accounts/new" element={<AccountForm />} />
              <Route path="accounts/:id" element={<AccountForm />} />
              <Route path="bulk-upload" element={<BulkUpload />} />
            </Route>
            <Route path="fpc">
              <Route path="members" element={<Members />} />
              <Route path="members/new" element={<MemberForm />} />
              <Route path="members/:id" element={<MemberForm />} />
              <Route path="register" element={<MemberRegister />} />
              <Route path="shares" element={<Shares />} />
              <Route path="shares/new" element={<ShareForm />} />
              <Route path="loans" element={<Loans />} />
              <Route path="loans/new" element={<LoanForm />} />
            </Route>
            <Route path="sales">
            <Route path="quotations" element={<SalesQuotations />} />
            <Route path="quotations/new" element={<SalesQuotationForm />} />
            <Route path="quotations/:id" element={<SalesQuotationForm />} />
            <Route path="quotations/:id/print" element={<QuotationPrint />} />
            <Route path="orders" element={<SalesOrders />} />
            <Route path="orders/new" element={<SalesOrderForm />} />
            <Route path="orders/:id" element={<SalesOrderForm />} />
            <Route path="orders/:id/print" element={<SalesOrderPrint />} />
            <Route path="invoices" element={<SalesInvoices />} />
            <Route path="invoices/new" element={<SalesInvoiceForm />} />
            <Route path="invoices/:id" element={<SalesInvoiceForm />} />
            <Route path="invoices/:id/print" element={<InvoicePrint />} />
            <Route path="returns" element={<SalesReturns />} />
            <Route path="returns/new" element={<SalesReturnForm />} />
            <Route path="returns/:id" element={<SalesReturnForm />} />
            <Route path="returns/:id/print" element={<SalesReturnPrint />} />
          </Route>
          <Route path="purchase">
            <Route path="orders" element={<PurchaseOrders />} />
            <Route path="orders/new" element={<PurchaseOrderForm />} />
            <Route path="orders/:id" element={<PurchaseOrderForm />} />
            <Route path="orders/:id/print" element={<PurchaseOrderPrint />} />
            <Route path="invoices" element={<PurchaseInvoices />} />
            <Route path="invoices/new" element={<PurchaseInvoiceForm />} />
            <Route path="invoices/:id" element={<PurchaseInvoiceForm />} />
            <Route path="returns" element={<PurchaseReturns />} />
            <Route path="returns/new" element={<PurchaseReturnForm />} />
            <Route path="returns/:id" element={<PurchaseReturnForm />} />
          </Route>
            <Route path="inventory">
              <Route path="summary" element={<StockSummary />} />
              <Route path="ledger" element={<StockLedger />} />
              <Route path="adjustments" element={<StockAdjustments />} />
              <Route path="adjustments/new" element={<StockAdjustmentForm />} />
              <Route path="adjustments/:id" element={<StockAdjustmentForm />} />
            </Route>
            <Route path="assets">
              <Route index element={<Assets />} />
              <Route path="new" element={<AssetForm />} />
              <Route path=":id" element={<AssetForm />} />
            </Route>
            <Route path="accounting">
              <Route path="journal" element={<JournalEntries />} />
              <Route path="journal/new" element={<JournalEntryForm />} />
              <Route path="journal/:id" element={<JournalEntryForm />} />
              <Route path="payments" element={<CashPayments />} />
              <Route path="payments/new" element={<CashPaymentForm />} />
              <Route path="payments/:id" element={<CashPaymentForm />} />
              <Route path="bank-payments" element={<BankPayments />} />
              <Route path="bank-payments/new" element={<BankPaymentForm />} />
              <Route path="bank-payments/:id" element={<BankPaymentForm />} />
              <Route path="bank-receipts" element={<BankReceipts />} />
              <Route path="bank-receipts/new" element={<BankReceiptForm />} />
              <Route path="bank-receipts/:id" element={<BankReceiptForm />} />
              <Route path="receipts" element={<CashReceipts />} />
              <Route path="receipts/new" element={<CashReceiptForm />} />
              <Route path="receipts/:id" element={<CashReceiptForm />} />
            </Route>
            <Route path="reports">
              <Route index element={<Reports />} />
            </Route>
            <Route path="e-tracker">
              <Route index element={<ETrackerDashboard />} />
              <Route path="issues" element={<IssuesList />} />
              <Route path="issues/:id" element={<IssueForm />} />
              <Route path="statuses" element={<IssueStatusesList />} />
            </Route>
            <Route path="settings" element={<Settings />} />
            <Route path="user-manual" element={<UserManual />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </LanguageProvider>
    </AppProvider>
    </AuthProvider>
  );
}
