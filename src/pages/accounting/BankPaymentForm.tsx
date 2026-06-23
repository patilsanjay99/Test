import React, { useState, useEffect, useMemo } from 'react';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Calendar, DollarSign, Edit, AlertCircle, Hash } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface Account {
  Id: number;
  id?: number;
  Name: string;
  AccountGroup: string;
  AccountType: string;
}

export function BankPaymentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { activeCompany, activeFinancialYear } = useAppContext();
  const companyId = activeCompany?.id ? Number(activeCompany.id) : 1;
  const financialYearId = activeFinancialYear?.id ? Number(activeFinancialYear.id) : 1;

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [voucherNo, setVoucherNo] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState('');
  const [referenceDate, setReferenceDate] = useState('');
  const [narration, setNarration] = useState('');

  useEffect(() => {
    fetchRequiredData();
  }, [companyId, id]);

  const fetchRequiredData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const accRes = await fetch(`/api/v1/data/Accounts?CompanyId=${companyId}`);
      if (!accRes.ok) throw new Error('Failed to load chart of accounts lookup details.');
      const accData = await accRes.json();
      setAccounts(accData);

      const bankAcc = accData.find((acc: any) => 
        acc.AccountGroup === 'Bank Accounts' || 
        acc.AccountGroup === 'Bank OD A/c' ||
        acc.Name.toLowerCase().includes('bank')
      );
      if (bankAcc) {
        setBankAccountId(Number(bankAcc.Id || bankAcc.id));
      }

      if (isEditMode) {
        const payRes = await fetch(`/api/v1/data/BankPayments/${id}`);
        if (payRes.ok) {
          const voucher = await payRes.json();
          setVoucherNo(voucher.VoucherNo || '');
          if (voucher.PaymentDate) setPaymentDate(voucher.PaymentDate.split('T')[0]);
          setBankAccountId(Number(voucher.BankAccountId));
          setAccountId(Number(voucher.AccountId));
          setAmount(Number(voucher.Amount));
          setReferenceNo(voucher.ReferenceNo || '');
          if (voucher.ReferenceDate) setReferenceDate(voucher.ReferenceDate.split('T')[0]);
          setNarration(voucher.Narration || '');
        } else {
          setErrorMsg('Failed to retrieve the requested Bank Payment Voucher details.');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'An error occurred while initializing form dependencies.');
    } finally {
      setLoading(false);
    }
  };

  const bankAccounts = useMemo(() => {
    return accounts.filter(acc => 
      acc.AccountGroup === 'Bank Accounts' || 
      acc.AccountGroup === 'Bank OD A/c' || 
      acc.Name.toLowerCase().includes('bank')
    );
  }, [accounts]);

  const generalAccounts = useMemo(() => accounts, [accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!paymentDate) {
      setErrorMsg('Voucher Date is a mandatory parameter.');
      return;
    }
    if (!bankAccountId) {
      setErrorMsg('Please select a valid Bank Account (Credit source).');
      return;
    }
    if (!accountId) {
      setErrorMsg('Please select a valid debit ledger account.');
      return;
    }
    if (bankAccountId === accountId) {
      setErrorMsg('Debit Account and Credit Account cannot be the same.');
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
        VoucherNo: voucherNo || undefined,
        PaymentDate: paymentDate,
        BankAccountId: Number(bankAccountId),
        AccountId: Number(accountId),
        Amount: Number(amount),
        ReferenceNo: referenceNo,
        ReferenceDate: referenceDate || undefined,
        Narration: narration,
        Status: 'Posted'
      };

      const url = isEditMode ? `/api/v1/data/BankPayments/${id}` : `/api/v1/data/BankPayments`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/accounting/bank-payments');
      } else {
        const responseData = await res.json().catch(() => ({}));
        setErrorMsg(responseData.error || 'Server rejected voucher parameters.');
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
        <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-2" />
        <p>Pre-loading account hierarchies...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/accounting/bank-payments')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bank Payments
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          {isEditMode ? <Edit className="h-6 w-6 text-amber-500" /> : <Save className="h-6 w-6 text-blue-600" />}
          {isEditMode ? 'Modify Bank Payment Voucher' : 'Record Bank Payment Voucher'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode 
            ? 'Update the recorded bank settlement values, ledger assignments, and references.' 
            : 'Fill out details to commit a bank payment posted instantly to ledger balances.'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2 text-sm font-medium">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Voucher Date <span className="text-red-500">*</span>
            </label>
            <CustomDatePicker value={paymentDate} onChange={setPaymentDate} className="" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Voucher No. Sequence
            </label>
            <input
              type="text"
              placeholder="Auto-generated using sequence prefix"
              disabled={!isEditMode}
              value={voucherNo}
              onChange={e => setVoucherNo(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm bg-gray-200 text-gray-500 cursor-not-allowed font-mono focus:outline-none"
            />
            {!isEditMode && (
              <span className="text-[10px] text-gray-400">
                Leave empty to generate automatically.
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Bank Account (Credited) <span className="text-red-500">*</span>
            </label>
            <select
              value={bankAccountId}
              onChange={e => setBankAccountId(Number(e.target.value))}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
            >
              <option value="">-- Choose Account --</option>
              {bankAccounts.map(acc => (
                <option key={acc.Id || acc.id} value={acc.Id || acc.id}>
                  {acc.Name} ({acc.AccountGroup})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Debit Account (Paid To) <span className="text-red-500">*</span>
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(Number(e.target.value))}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
            >
              <option value="">-- Choose Account --</option>
              {generalAccounts.map(acc => (
                <option key={acc.Id || acc.id} value={acc.Id || acc.id}>
                  {acc.Name} - {acc.AccountGroup}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2 bg-gray-50 p-6 rounded-xl border border-gray-100 mt-2">
            <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Payment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-lg">₹</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                required
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-4 border border-gray-200 rounded-lg text-xl font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 text-gray-400" />
              Reference / Cheque No.
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              placeholder="Cheque/UTR/Trans ID"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Reference Date
            </label>
            <CustomDatePicker value={referenceDate} onChange={setReferenceDate} className="" />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Narration / Description Form
            </label>
            <textarea
              value={narration}
              onChange={e => setNarration(e.target.value)}
              rows={3}
              placeholder="Enter comprehensive transaction descriptions..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/accounting/bank-payments')}
            className="px-5 py-2.5 border border-gray-300 hover:border-gray-400 rounded-lg text-sm text-gray-700 font-semibold bg-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-sm flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {saveLoading ? (
              <><Loader2 className="animate-spin h-4 w-4" /> Committing...</>
            ) : (
              <><Save className="h-4 w-4" /> {isEditMode ? 'Update Voucher' : 'Post Bank Payment'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
