import React, { useState } from 'react';
import { ArrowLeft, Save, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AccountForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Name: '',
    AccountCode: '',
    AccountGroup: '',
    AccountType: 'Asset',
    OpeningBalance: 0,
    BalanceType: 'Dr'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.Name) return alert('Account Name is required');
    try {
      setSaving(true);
      await fetch('/api/v1/data/Accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      navigate('/accounting/accounts');
    } catch(e) {
      alert('Error saving account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/accounting/accounts')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-sm text-gray-500 mt-1">Add a new general ledger account.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/accounting/accounts')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Account'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-gray-400" /> Account Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Account Name <span className="text-red-500">*</span></label>
              <input type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} placeholder="e.g. Cash in Hand" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Account Code</label>
              <input type="text" value={formData.AccountCode} onChange={e => setFormData({...formData, AccountCode: e.target.value})} placeholder="e.g. 1001" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Account Group <span className="text-red-500">*</span></label>
              <select value={formData.AccountGroup} onChange={e => setFormData({...formData, AccountGroup: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Group...</option>
                <option value="Current Assets">Current Assets</option>
                <option value="Bank Accounts">Bank Accounts</option>
                <option value="Capital Account">Capital Account</option>
                <option value="Direct Incomes">Direct Incomes</option>
                <option value="Direct Expenses">Direct Expenses</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Account Type</label>
              <select value={formData.AccountType} onChange={e => setFormData({...formData, AccountType: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Opening Balance</label>
              <div className="flex">
                <input type="number" value={formData.OpeningBalance} onChange={e => setFormData({...formData, OpeningBalance: parseFloat(e.target.value) || 0})} placeholder="0.00" className="flex-1 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                <select value={formData.BalanceType} onChange={e => setFormData({...formData, BalanceType: e.target.value})} className="w-20 px-2 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-l-0">
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
