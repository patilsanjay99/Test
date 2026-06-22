import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Landmark, Building2, MapPin, Hash, IndianRupee } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function BankForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { activeCompany } = useAppContext();
  const companyId = activeCompany?.id ? Number(activeCompany.id) : 1;

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [address, setAddress] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [ifscCode, setIfscCode] = useState('');
  const [micrCode, setMicrCode] = useState('');
  const [accountGroup, setAccountGroup] = useState('Bank Accounts');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [balanceType, setBalanceType] = useState('Dr');

  const [availableAccountTypes, setAvailableAccountTypes] = useState<any[]>([]);

  useEffect(() => {
    if (isEditMode) {
      fetchBank();
    }
    fetchAccountTypes();
  }, [id]);

  const fetchAccountTypes = async () => {
    try {
      const res = await fetch(`/api/data/BankAccountTypes`);
      if (res.ok) {
        const types = await res.json();
        setAvailableAccountTypes(types);
        if (types.length > 0 && !isEditMode) {
            setAccountType(prev => types.find((t: any) => t.TypeName === prev) ? prev : types[0].TypeName);
        }
      }
    } catch(e) {}
  };

  useEffect(() => {
     if (accountType === 'CC' || accountType === 'OD') {
         setAccountGroup('Bank OD A/c');
     } else {
         setAccountGroup('Bank Accounts');
     }
  }, [accountType]);

  const fetchBank = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/data/BankAccounts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBankName(data.BankName || '');
        setBranch(data.Branch || '');
        setAddress(data.Address || '');
        setAccountNo(data.AccountNo || '');
        setAccountType(data.AccountType || 'Savings');
        setIfscCode(data.IFSCCode || '');
        setMicrCode(data.MICRCode || '');
        setAccountGroup(data.AccountGroup || 'Bank Accounts');
        setOpeningBalance(Number(data.OpeningBalance) || 0);
        setBalanceType(data.BalanceType || 'Dr');
      } else {
        setErrorMsg('Failed to load bank account details.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!bankName.trim() || !accountNo.trim()) {
      setErrorMsg('Bank Name and Account Number are mandatory.');
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        CompanyId: companyId,
        BankName: bankName,
        Branch: branch,
        Address: address,
        AccountNo: accountNo,
        AccountType: accountType,
        IFSCCode: ifscCode,
        MICRCode: micrCode,
        AccountGroup: accountGroup,
        OpeningBalance: openingBalance,
        BalanceType: balanceType,
      };

      const url = isEditMode ? `/api/v1/data/BankAccounts/${id}` : '/api/v1/data/BankAccounts';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/master/banks');
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to save bank details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600 mb-2" />
        <p>Loading bank account details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/master/banks')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bank Accounts
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-emerald-600" />
          {isEditMode ? 'Edit Bank Account' : 'Add Bank Account'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode ? 'Update bank details and ledger mappings.' : 'Create a new bank account and register its general ledger representation automatically.'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm text-sm">
        
        {/* Basic Details Section */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             <Building2 className="h-5 w-5 text-gray-400" /> Bank Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Bank Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Branch Name</label>
              <input
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="e.g. Main Branch, Pune"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1"><MapPin className="h-3 w-3" /> Branch Address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             <Hash className="h-5 w-5 text-gray-400" /> Account Identifiers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">A/c Type</label>
              <select
                value={accountType}
                onChange={e => setAccountType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-medium text-gray-800"
              >
                 {availableAccountTypes.map(t => (
                   <option key={t.Id || t.id} value={t.TypeName}>{t.TypeName}</option>
                 ))}
                 {/* Fallbacks if DB is empty */}
                 {availableAccountTypes.length === 0 && (
                     <>
                         <option value="Savings">Savings Account</option>
                         <option value="Current">Current Account</option>
                         <option value="OD">Overdraft (OD)</option>
                         <option value="CC">Cash Credit (CC)</option>
                         <option value="Loan">Loan Account</option>
                     </>
                 )}
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Account Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={accountNo}
                onChange={e => setAccountNo(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-base tracking-widest text-emerald-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">IFSC Code</label>
              <input
                type="text"
                value={ifscCode}
                onChange={e => setIfscCode(e.target.value.toUpperCase())}
                placeholder="SBIN0001234"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">MICR Code</label>
              <input
                type="text"
                value={micrCode}
                onChange={e => setMicrCode(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Account Group (System)</label>
              <input
                type="text"
                value={accountGroup}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>

        {/* Financial Setup */}
        <div className="p-6">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             <IndianRupee className="h-5 w-5 text-gray-400" /> Opening Balance
          </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Opening Balance Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingBalance || ''}
                    onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg text-emerald-900"
                  />
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Balance Mode</label>
                <select
                  value={balanceType}
                  onChange={e => setBalanceType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Dr">Debit (Dr) - Asset/Deposit</option>
                  <option value="Cr">Credit (Cr) - Overdraft/Liability</option>
                </select>
             </div>
           </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={() => navigate('/master/banks')}
            className="px-5 py-2.5 border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-600 hover:text-gray-800 transition font-semibold bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveLoading}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saveLoading ? (
              <><Loader2 className="animate-spin h-4 w-4" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Bank Account</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
