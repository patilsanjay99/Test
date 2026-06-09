import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Download, Landmark, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ChartOfAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/v1/data/Accounts');
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      await fetch(`/api/v1/data/Accounts/${id}`, { method: 'DELETE' });
      fetchAccounts();
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all general ledger accounts and opening balances.</p>
        </div>
        <button 
          onClick={() => navigate('/accounting/accounts/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Types</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Account Code & Name</th>
                <th className="font-medium p-4 border-b border-gray-200">Account Group</th>
                <th className="font-medium p-4 border-b border-gray-200">Account Type</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Current Balance</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500">No records found</td></tr>
              ) : accounts.map((account) => (
                <tr key={account.Id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200 shrink-0">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{account.Name}</div>
                        <div className="text-xs text-gray-500 font-mono">{account.AccountCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{account.AccountGroup || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      account.AccountType === 'Asset' ? 'bg-blue-100 text-blue-700' :
                      account.AccountType === 'Liability' ? 'bg-red-100 text-red-700' :
                      account.AccountType === 'Equity' ? 'bg-purple-100 text-purple-700' :
                      account.AccountType === 'Revenue' ? 'bg-green-100 text-green-700' :
                      account.AccountType === 'Expense' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {account.AccountType || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900 font-mono text-right">
                    {account.OpeningBalance ? account.OpeningBalance.toLocaleString('en-IN') : '0'} <span className="text-gray-500 text-xs font-sans">{account.BalanceType || 'Dr'}</span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(account.Id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {accounts.length} entries
        </div>
      </div>
    </div>
  );
}
