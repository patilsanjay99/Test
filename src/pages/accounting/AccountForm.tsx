import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Landmark } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function AccountForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useAppContext();
  const [formData, setFormData] = useState({
    Name: '',
    AccountCode: '',
    AccountGroup: '',
    AccountType: 'Asset',
    OpeningBalance: 0,
    BalanceType: 'Dr',
    Place: ''
  });
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Groups
    fetch(`/api/v1/data/AccountGroups`)
      .then(res => res.json())
      .then(data => {
        const companyId = activeCompany?.id || '';
        const companySpecific = data.filter((g: any) => g.IsDefault === 1 || String(g.CompanyId) === String(companyId));
        setGroups(companySpecific);
      })
      .catch(console.error);

    if (id) {
      const loadAccount = async () => {
        try {
          const res = await fetch(`/api/v1/data/Accounts/${id}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              Name: data.Name || '',
              AccountCode: data.AccountCode || '',
              AccountGroup: data.AccountGroup || '',
              AccountType: data.AccountType || 'Asset',
              OpeningBalance: data.OpeningBalance ? parseFloat(data.OpeningBalance) : 0,
              BalanceType: data.BalanceType || 'Dr',
              Place: data.Place || ''
            });
          }
        } catch (e) {
          console.error("Error fetching account details:", e);
        }
      };
      loadAccount();
    }
  }, [id]);

  const handleSave = async () => {
    if (!formData.Name) return alert('Account Name is required');
    if (!formData.AccountGroup) return alert('Account Group is required');
    try {
      setSaving(true);

      const queryParam = activeCompany?.id ? `?CompanyId=${activeCompany.id}` : '';
      const existingRes = await fetch(`/api/v1/data/Accounts${queryParam}`);
      if (existingRes.ok) {
          const existing = await existingRes.json();
          const duplicate = existing.find((item: any) => 
               item.Name?.trim().toLowerCase() === formData.Name.trim().toLowerCase() && 
               String(item.Id) !== String(id || '') && String(item.ID) !== String(id || '')
          );
          if (duplicate) {
              alert("Account Name already exists. Please choose a different name.");
              setSaving(false);
              return;
          }
      }

      const url = id ? `/api/v1/data/Accounts/${id}` : '/api/v1/data/Accounts';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          CompanyId: activeCompany?.id || 1
        })
      });

      if (!response.ok) {
        throw new Error('Response is not OK');
      }

      navigate('/master/accounts');
    } catch(e) {
      alert('Error saving account details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/accounts')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {id ? 'Edit Account' : 'Create Account'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {id ? 'Modify general ledger account parameters.' : 'Add a new general ledger account.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <Landmark className="w-5 h-5" /> {id ? 'EDIT GENERAL LEDGER ACCOUNT' : 'GENERAL LEDGER ACCOUNT MASTER'}
        </div>

        {/* Section 1: Account Details */}
        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Account Configuration
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8] border-b border-blue-900">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Account Name <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input required type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} placeholder="e.g. Cash in Hand" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Account Group <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select required value={formData.AccountGroup} onChange={e => {
                    const grp = groups.find(g => g.GroupName === e.target.value);
                    if (grp) {
                      setFormData({...formData, AccountGroup: e.target.value, AccountType: grp.GroupType || 'Asset'});
                    } else {
                      setFormData({...formData, AccountGroup: e.target.value});
                    }
                  }} className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer">
                    <option value="">Select Group...</option>
                    {groups.map((g, i) => (
                      <option key={i} value={g.GroupName}>{g.GroupName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Account Code
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input type="text" value={formData.AccountCode} onChange={e => setFormData({...formData, AccountCode: e.target.value})} placeholder="e.g. 1001" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Place
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input type="text" value={formData.Place} onChange={e => setFormData({...formData, Place: e.target.value})} placeholder="e.g. Surat" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Account Type
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select value={formData.AccountType} onChange={e => setFormData({...formData, AccountType: e.target.value})} className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer">
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            II. Accounting Opening Balances
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Opening Balance
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center gap-1.5">
                  <input type="number" value={formData.OpeningBalance} onChange={e => setFormData({...formData, OpeningBalance: parseFloat(e.target.value) || 0})} placeholder="0.00" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" />
                  <select value={formData.BalanceType} onChange={e => setFormData({...formData, BalanceType: e.target.value})} className="w-24 px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-bold cursor-pointer">
                    <option value="Dr">Dr</option>
                    <option value="Cr">Cr</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex flex-col bg-[#f8fafc] p-4 text-xs font-semibold text-[#64748b] justify-center items-start">
              * Ensure to select correct balance type (Dr/Cr) matching with the type of ledger account group category.
            </div>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/accounts')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm disabled:opacity-55"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING...' : 'SAVE DETAILS'}
          </button>
        </div>
      </form>
    </div>
  );
}
