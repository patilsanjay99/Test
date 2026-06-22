import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export interface BankAccount {
  Id?: number;
  id?: number;
  CompanyId: number;
  BankName: string;
  Branch: string;
  Address: string;
  AccountNo: string;
  AccountType: string;
  IFSCCode: string;
  MICRCode: string;
  AccountGroup: string;
  OpeningBalance: number;
  BalanceType: string;
}

export function Banks() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const companyId = activeCompany?.id ? Number(activeCompany.id) : 1;

  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBanks();
  }, [companyId]);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/data/BankAccounts?CompanyId=${companyId}`);
      if (res.ok) {
        let data = await res.json();
        // Fallback filter
        data = data.filter((b: any) => Number(b.CompanyId ?? b.companyid ?? 0) === companyId);
        setBanks(data);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bank account? Its associated ledger account will also be removed.')) return;
    try {
      const res = await fetch(`/api/v1/data/BankAccounts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBanks(banks.filter(b => (b.Id ?? b.id) !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Error: ${err.error || 'Failed to delete data'}`);
      }
    } catch (e: any) {
      alert(`Network Error: ${e.message}`);
    }
  };

  const filteredBanks = banks.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchesName = (b.BankName || '').toLowerCase().includes(term);
    const matchesAccount = (b.AccountNo || '').toLowerCase().includes(term);
    const matchesBranch = (b.Branch || '').toLowerCase().includes(term);
    return matchesName || matchesAccount || matchesBranch;
  });

  // Fallback to broad accounting config permission or specific
  const canAdd = hasPermission('Accounting: Config', 'add') || hasPermission('Company: Manage', 'add');
  const canEdit = hasPermission('Accounting: Config', 'edit') || hasPermission('Company: Manage', 'edit');
  const canDelete = hasPermission('Accounting: Config', 'delete') || hasPermission('Company: Manage', 'delete');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-emerald-600" />
          Bank Accounts
        </h1>
        {canAdd && (
          <button
            onClick={() => navigate('/master/banks/new')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Details
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Bank name, Branch, or Account No..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading bank details...</div>
        ) : filteredBanks.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Landmark className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-base font-medium text-gray-600">No bank accounts found</p>
            <p className="text-sm mt-1">Add a new bank account to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-6">Bank Name</th>
                  <th className="py-3 px-6">Account No.</th>
                  <th className="py-3 px-6">Branch</th>
                  <th className="py-3 px-6">IFSC Code</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6 text-right">Opening Bal.</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBanks.map(b => {
                  const bId = b.Id ?? b.id;
                  return (
                    <tr key={bId} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-3 px-6 text-sm font-medium text-gray-900">{b.BankName}</td>
                      <td className="py-3 px-6 text-sm text-gray-600 font-mono">{b.AccountNo}</td>
                      <td className="py-3 px-6 text-sm text-gray-600">{b.Branch || '-'}</td>
                      <td className="py-3 px-6 text-sm text-gray-600 font-mono">{b.IFSCCode || '-'}</td>
                      <td className="py-3 px-6 text-sm text-gray-600">{b.AccountType || '-'}</td>
                      <td className="py-3 px-6 text-sm font-bold text-gray-900 text-right">
                        ₹{Number(b.OpeningBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {b.BalanceType}
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button
                              onClick={() => navigate(`/master/banks/${bId}`)}
                              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-md transition"
                              title="Edit Bank"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => bId && handleDelete(bId)}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition"
                              title="Delete Bank"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
