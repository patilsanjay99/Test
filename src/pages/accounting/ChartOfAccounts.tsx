import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Landmark, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function ChartOfAccounts() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const companyId = activeCompany?.id || '';
      const res = await fetch(`/api/v1/data/Accounts?CompanyId=${companyId}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/v1/sync-accounts', { method: 'POST' });
      if (res.ok) {
        await fetchAccounts();
      } else {
        alert('Failed to synchronize Accounts.');
      }
    } catch (err: any) {
      alert('Error during sync: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [activeCompany?.id]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        const res = await fetch(`/api/v1/data/Accounts/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchAccounts();
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || 'Failed to delete record.');
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    const name = acc.Name || '';
    const code = acc.AccountCode || '';
    const grp = acc.AccountGroup || '';
    const type = acc.AccountType || '';

    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          grp.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !selectedType || type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Details</h1>
          <p className="text-sm text-gray-500 mt-1">Manage general ledger accounts and opening balances.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm bg-white"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Re-sync Accounts'}
          </button>
          {hasPermission('/master/accounts', 'add') && ( <button 
            onClick={() => navigate('/master/accounts/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Account
          </button> )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]"
            >
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
                <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500 w-full">Loading...</td></tr>
              ) : filteredAccounts.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500 w-full">No records found</td></tr>
              ) : filteredAccounts.map((account) => {
                const accId = account.Id || account.id || account.ID;
                return (
                  <tr key={accId} className="hover:bg-gray-50 transition-colors group">
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
                      {account.OpeningBalance ? parseFloat(account.OpeningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} <span className="text-gray-500 text-xs font-sans">{account.BalanceType || 'Dr'}</span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasPermission('/master/accounts', 'edit') && ( <button 
                        onClick={() => navigate(`/master/accounts/${accId}`)}
                        className="text-gray-400 hover:text-blue-600 transition-colors" 
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button> )}
                      {hasPermission('/master/accounts', 'delete') && ( <button 
                        onClick={() => handleDelete(accId)} 
                        className="text-gray-400 hover:text-red-600 transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button> )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {filteredAccounts.length} of {accounts.length} entries
        </div>
      </div>
    </div>
  );
}
