import React, { useState, useEffect, useMemo } from 'react';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Calendar, DollarSign, Edit, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface Account {
  Id: number;
  id?: number;
  Name: string;
  AccountGroup: string;
  AccountType: string;
}

export function CashPaymentForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode
  const isEditMode = !!id;

  const { activeCompany, activeFinancialYear } = useAppContext();
  const companyId = activeCompany?.id ? Number(activeCompany.id) : 1;
  const financialYearId = activeFinancialYear?.id ? Number(activeFinancialYear.id) : 1;

  // Form State
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Voucher state fields
  const [voucherNo, setVoucherNo] = useState(''); // Will auto-generate on POST if empty
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashAccountId, setCashAccountId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(0);
  const [narration, setNarration] = useState('');

  // Load lookup accounts & existing voucher details if editing
  useEffect(() => {
    fetchRequiredData();
  }, [companyId, id]);

  const fetchRequiredData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Accounts
      const accRes = await fetch(`/api/v1/data/Accounts?CompanyId=${companyId}`);
      if (!accRes.ok) throw new Error('Failed to load chart of accounts lookup details.');
      const accData = await accRes.json();
      setAccounts(accData);

      // Auto pre-select standard cash accountant if any exists
      const cashAcc = accData.find((acc: any) => 
        acc.AccountGroup === 'Cash-in-Hand' || 
        acc.Name.toLowerCase().includes('cash in hand') ||
        acc.Name.toLowerCase().includes('cash')
      );
      if (cashAcc) {
        setCashAccountId(Number(cashAcc.Id || cashAcc.id));
      }

      // 2. Fetch existing Cash Payment if edit mode
      if (isEditMode) {
        const payRes = await fetch(`/api/v1/data/CashPayments/${id}`);
        if (payRes.ok) {
          const voucher = await payRes.json();
          setVoucherNo(voucher.VoucherNo || '');
          if (voucher.PaymentDate) {
            setPaymentDate(voucher.PaymentDate.split('T')[0]);
          }
          setCashAccountId(Number(voucher.CashAccountId));
          setAccountId(Number(voucher.AccountId));
          setAmount(Number(voucher.Amount));
          setNarration(voucher.Narration || '');
        } else {
          setErrorMsg('Failed to retrieve the requested Cash Payment Voucher details.');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'An error occurred while initializing form dependencies.');
    } finally {
      setLoading(false);
    }
  };

  // Grouped Accounts for user guidance
  const cashAccounts = useMemo(() => {
    // Return Cash-in-Hand or Bank accounts
    return accounts.filter(acc => 
      acc.AccountGroup === 'Cash-in-Hand' || 
      acc.AccountGroup === 'Bank Accounts' || 
      acc.Name.toLowerCase().includes('cash') || 
      acc.Name.toLowerCase().includes('bank')
    );
  }, [accounts]);

  const generalAccounts = useMemo(() => {
    // All accounts are selectable for debiting
    return accounts;
  }, [accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!paymentDate) {
      setErrorMsg('Voucher Date is a mandatory parameter.');
      return;
    }
    if (!cashAccountId) {
      setErrorMsg('Please select a valid Cash Account (Credit source).');
      return;
    }
    if (!accountId) {
      setErrorMsg('Please select a valid debit ledger account.');
      return;
    }
    if (cashAccountId === accountId) {
      setErrorMsg('Debit Account and Credit Account cannot express the same ledger identity.');
      return;
    }
    if (!amount || amount <= 0) {
      setErrorMsg('Voucher transaction Amount must be positive (> 0).');
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        CompanyId: companyId,
        FinancialYearId: financialYearId,
        VoucherNo: voucherNo || undefined, // will auto-gen on server side if empty
        PaymentDate: paymentDate,
        CashAccountId: Number(cashAccountId),
        AccountId: Number(accountId),
        Amount: Number(amount),
        Narration: narration,
        Status: 'Posted'
      };

      const url = isEditMode 
        ? `/api/v1/data/CashPayments/${id}`
        : `/api/v1/data/CashPayments`;
        
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/accounting/payments');
      } else {
        const responseData = await res.json().catch(() => ({}));
        setErrorMsg(responseData.error || 'Server rejected voucher parameters. Check SQL constraints.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network loss or database connectivity failed.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600 mb-2" />
        <p>Pre-loading account hierarchies...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* breadcrumb menu backlink */}
      <button
        id="btn-back-to-payments"
        onClick={() => navigate('/accounting/payments')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cash Payments
      </button>

      {/* header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          {isEditMode ? <Edit className="h-6 w-6 text-amber-500" /> : <Save className="h-6 w-6 text-emerald-600" />}
          {isEditMode ? 'Modify Cash Payment Voucher' : 'Record Cash Payment Voucher'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode 
            ? 'Update the recorded transaction values, ledger assignments, and descriptions.' 
            : 'Fill out details to commit a certified direct cash settlement posted instantly to ledger balances.'}
        </p>
      </div>

      {/* Alert Panel */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2 text-sm font-medium">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Card Form container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Voucher Date Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Voucher Date <span className="text-red-500">*</span>
            </label>
            <CustomDatePicker value={paymentDate} onChange={setPaymentDate} className="" />
          </div>

          {/* Manual Voucher Number Sequence override */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Voucher No. Sequence
            </label>
            <input
              id="input-voucher-no"
              type="text"
              placeholder="Auto-generated using sequence prefix"
              disabled={!isEditMode}
              value={voucherNo}
              onChange={e => setVoucherNo(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed font-mono focus:outline-none"
            />
            {!isEditMode && (
              <span className="text-[10px] text-gray-400">
                Leaves empty to generate automatically according to general sequencer parameters.
              </span>
            )}
          </div>

          {/* Cash Account selection (Credit) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Credit Account (Paid From) <span className="text-red-500">*</span>
            </label>
            <select
              id="select-cash-account"
              value={cashAccountId}
              onChange={e => setCashAccountId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-medium"
            >
              <option value="">-- Choose Cash Ledger Account --</option>
              {cashAccounts.map(acc => {
                const accId = acc.Id || acc.id;
                return (
                  <option key={accId} value={accId}>
                    {acc.Name} ({acc.AccountGroup})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Target Account Selection (Debit) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Debit Account (Paid To) <span className="text-red-500">*</span>
            </label>
            <select
              id="select-debit-account"
              value={accountId}
              onChange={e => setAccountId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-medium text-gray-900"
            >
              <option value="">-- Choose General Ledger Account --</option>
              {generalAccounts.map(acc => {
                const accId = acc.Id || acc.id;
                return (
                  <option key={accId} value={accId}>
                    {acc.Name} ({acc.AccountGroup})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Amount field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-gray-400" />
              Voucher Total Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              id="input-voucher-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount || ''}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-base font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Empty spacer block to maintain two-column balance */}
          <div className="hidden md:block"></div>

          {/* Narration Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Payment Description / Narration
            </label>
            <textarea
              id="input-voucher-narration"
              rows={3}
              placeholder="Provide a clear, detailed narration here describing the purpose of this cash outflow..."
              value={narration}
              onChange={e => setNarration(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            id="btn-cancel-form"
            type="button"
            onClick={() => navigate('/accounting/payments')}
            className="px-5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-600 hover:text-gray-800 transition font-semibold"
          >
            Cancel
          </button>
          <button
            id="btn-submit-form"
            type="submit"
            disabled={saveLoading}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saveLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                {isEditMode ? 'Updating Voucher...' : 'Saving Voucher...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode ? 'Update Voucher' : 'Confirm & Post Voucher'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
