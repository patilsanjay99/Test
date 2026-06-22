import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, FileText, ArrowRightLeft, RefreshCw, BookOpen, List, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, formatDate } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';

export function Shares() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  
  const [shares, setShares] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState<'transactions' | 'register'>('transactions');

  const fetchData = async () => {
    try {
      setLoading(true);
      const companyId = activeCompany?.id || '';
      
      const [sharesRes, membersRes] = await Promise.all([
        fetch(`/api/v1/data/ShareTransactions?CompanyId=${companyId}`),
        fetch(`/api/v1/data/FPCMembers?CompanyId=${companyId}`)
      ]);
      
      const sharesData = await sharesRes.json();
      const membersData = await membersRes.json();
      
      setShares(Array.isArray(sharesData) ? sharesData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (err) {
      console.error("Error fetching shares or members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCompany?.id]);

  const handleEdit = (id: string) => {
    navigate(`/fpc/shares/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            await fetch(`/api/v1/data/ShareTransactions/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            console.error("Error deleting transaction:", err);
        }
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCompany?.id]);

  const getMemberLabel = (mId: any) => {
    if (!mId) return '—';
    const m = members.find(x => String(x.Id ?? x.id) === String(mId));
    if (!m) return `Member #${mId}`;
    return `${m.FarmerName} (${m.MemberId || `FPC-M-${m.Id ?? m.id}`})`;
  };

  const getTransactionCode = (tx: any) => {
    const idStr = String(tx.Id ?? tx.id).padStart(3, '0');
    let year = '2026';
    const dateVal = tx.TransactionDate || '';
    if (dateVal) {
      const match = dateVal.match(/^(\d{4})/);
      if (match) {
        year = match[1];
      } else {
        const parts = dateVal.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          year = parts[2];
        } else {
          const partsDash = dateVal.split('-');
          if (partsDash.length === 3 && partsDash[0].length === 4) {
            year = partsDash[0];
          }
        }
      }
    }
    return `SH-${year}-${idStr}`;
  };

  const filteredShares = shares.filter(sh => {
    const code = getTransactionCode(sh);
    const mLabel = getMemberLabel(sh.MemberId);
    const targetLabel = sh.ToMemberId ? getMemberLabel(sh.ToMemberId) : '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      code.toLowerCase().includes(searchLower) ||
      mLabel.toLowerCase().includes(searchLower) ||
      targetLabel.toLowerCase().includes(searchLower) ||
      (sh.Remarks || '').toLowerCase().includes(searchLower) ||
      (sh.remarks || '').toLowerCase().includes(searchLower);

    const typeVal = sh.TransactionType || sh.transactiontype;
    const matchesType = selectedType ? typeVal === selectedType : true;

    return matchesSearch && matchesType;
  });

  const membersWithShares = members.filter(m => (m.SharesAllocated || m.sharesallocated || 0) > 0);
  const filteredRegister = membersWithShares.filter(m => {
    const name = m.FarmerName || '';
    const code = m.MemberId || '';
    const village = m.Village || '';
    const searchLower = searchTerm.toLowerCase();
    return name.toLowerCase().includes(searchLower) || code.toLowerCase().includes(searchLower) || village.toLowerCase().includes(searchLower);
  });

  const handleExport = () => {
    if (viewMode === 'transactions') {
      const exportData = filteredShares.map(sh => ({
        'Transaction ID': getTransactionCode(sh),
        'Date': formatDate(sh.TransactionDate),
        'Type': sh.TransactionType,
        'Member': getMemberLabel(sh.MemberId),
        'To Member (Transfer)': sh.TransactionType === 'Transfer' ? getMemberLabel(sh.ToMemberId) : 'N/A',
        'No. of Shares': sh.Shares,
        'Face Value': sh.FaceValue || 100,
        'Total Amount (₹)': sh.TotalAmount,
        'Starting Folio': sh.StartingFolio || '—',
        'Folio From': sh.FolioFrom || '—',
        'Folio To': sh.FolioTo || '—',
        'Remarks': sh.Remarks || sh.remarks || '',
        'Status': sh.Status || 'Completed'
      }));
      exportToCSV(exportData, 'Share_Transactions');
    } else {
      const exportData = filteredRegister.map(m => ({
        'Member Code': m.MemberId || `FPC-M-${m.Id ?? m.id}`,
        'Member Name': m.FarmerName,
        'Village': m.Village || '—',
        'Land Holding (Acres)': m.LandHolding || 0,
        'Shares Allocated': m.SharesAllocated || 0,
        'Face Value (₹)': m.FaceValue || 100,
        'Total Value (₹)': (m.SharesAllocated || 0) * (m.FaceValue || 100)
      }));
      exportToCSV(exportData, 'Share_Register');
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {viewMode === 'transactions' ? 'Share Transactions' : 'Share Register'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === 'transactions' 
              ? 'Manage share allotments, transfers, and equity capital.' 
              : 'Review member-wise share ledgers, capital specifications, and equity allocations.'}
          </p>
        </div>
        <div className="flex gap-3">
          {hasPermission('/fpc/shares', 'add') && (
            <React.Fragment>
              <button 
                onClick={() => setViewMode(viewMode === 'transactions' ? 'register' : 'transactions')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors shadow-sm flex items-center gap-2"
              >
                {viewMode === 'transactions' ? (
                  <>
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Share Register
                  </>
                ) : (
                  <>
                    <List className="w-4 h-4 text-blue-600" />
                    View Transactions
                  </>
                )}
              </button>
              <button 
                onClick={() => navigate('/fpc/shares/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Transaction
              </button>
            </React.Fragment>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={viewMode === 'transactions' ? "Search transactions..." : "Search member register..."} 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            {viewMode === 'transactions' && (
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]"
              >
                <option value="">All Types</option>
                <option value="Allotment">Allotment</option>
                <option value="Transfer">Transfer</option>
                <option value="Surrender">Surrender</option>
              </select>
            )}
            <button 
              onClick={handleExport}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button 
              onClick={fetchData}
              title="Refresh Data"
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-500 transition-colors bg-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-sm text-gray-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span>Fetching secure tables on local database server...</span>
            </div>
          ) : viewMode === 'transactions' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="font-medium p-4 border-b border-gray-200">Transaction ID & Date</th>
                  <th className="font-medium p-4 border-b border-gray-200">Member Details</th>
                  <th className="font-medium p-4 border-b border-gray-200">Type</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">No. of Shares</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Amount (₹)</th>
                  <th className="font-medium p-4 border-b border-gray-200">Folio & From/To</th>
                  <th className="font-medium p-4 border-b border-gray-200">Remarks</th>
                  <th className="font-medium p-4 border-b border-gray-200">Status</th>
                  <th className="font-medium p-4 border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredShares.map((share) => {
                  const txType = share.TransactionType || share.transactiontype;
                  const sharesCount = share.Shares || share.shares || 0;
                  const amtVal = share.TotalAmount || share.totalamount || 0;
                  const remarksVal = share.Remarks || share.remarks || '—';
                  const dateStr = formatDate(share.TransactionDate || share.transactiondate);
                  
                  return (
                    <tr key={share.Id ?? share.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            txType === 'Allotment' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                            txType === 'Transfer' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {txType === 'Allotment' ? <FileText className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{getTransactionCode(share)}</div>
                            <div className="text-xs text-gray-500">{dateStr}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-900 font-medium whitespace-normal">
                        {txType === 'Transfer' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-400">From:</span>
                            <span>{getMemberLabel(share.MemberId)}</span>
                            <span className="text-xs text-slate-400">To:</span>
                            <span className="text-blue-600">{getMemberLabel(share.ToMemberId)}</span>
                          </div>
                        ) : txType === 'Surrender' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-400">Surrendered by:</span>
                            <span>{getMemberLabel(share.MemberId)}</span>
                          </div>
                        ) : (
                          <span>{getMemberLabel(share.MemberId)}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          txType === 'Allotment' ? 'bg-blue-50 text-blue-700' :
                          txType === 'Transfer' ? 'bg-purple-50 text-purple-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {txType}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900 text-right">
                        {sharesCount}
                      </td>
                      <td className="p-4 text-sm text-gray-900 font-mono text-right font-semibold">
                        ₹{(amtVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {txType !== 'Transfer' ? (
                          <div className="space-y-0.5">
                            <div>Folio: {share.StartingFolio || share.startingfolio || '—'}</div>
                            <div>Nos: {share.FolioFrom || share.foliofrom || '—'} - {share.FolioTo || share.folioto || '—'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not applicable</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-500 max-w-xs truncate" title={remarksVal}>
                        {remarksVal}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {share.Status || share.status || 'Completed'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                           {hasPermission('/fpc/shares', 'edit') && (
                             <button onClick={() => handleEdit(share.Id ?? share.id)} className="text-blue-500 hover:text-blue-700 p-1">
                               <Edit2 className="w-4 h-4" />
                             </button>
                           )}
                           {hasPermission('/fpc/shares', 'delete') && (
                             <button onClick={() => handleDelete(share.Id ?? share.id)} className="text-red-500 hover:text-red-700 p-1">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredShares.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 text-sm">
                      No matching transactions recorded. Use the "New Transaction" button to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="font-medium p-4 border-b border-gray-200">Member Details</th>
                  <th className="font-medium p-4 border-b border-gray-200">Village</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-center">Allocated Shares</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Face Value (₹)</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Total Equity Capital (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegister.map((m) => {
                  const sharesAllocated = m.SharesAllocated || m.sharesallocated || 0;
                  const fValue = m.FaceValue || m.facevalue || 100;
                  const totalEstVal = sharesAllocated * fValue;
                  
                  return (
                    <tr key={m.Id ?? m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="text-sm font-semibold text-gray-900">{m.FarmerName}</div>
                        <div className="text-xs text-gray-500">Code: {m.MemberId || `FPC-M-${m.Id ?? m.id}`} • Phone: {m.Phone || m.phone || '—'}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{m.Village || m.village || '—'}</td>
                      <td className="p-4 text-sm font-semibold text-gray-900 text-center">
                        {sharesAllocated}
                      </td>
                      <td className="p-4 text-sm text-gray-600 text-right font-mono">
                        ₹{(fValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm text-emerald-700 font-bold text-right font-mono">
                        ₹{(totalEstVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {filteredRegister.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                      No members exist with allocated shares in this company.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {viewMode === 'transactions' ? filteredShares.length : filteredRegister.length} of {viewMode === 'transactions' ? filteredShares.length : filteredRegister.length} entries
        </div>
      </div>
    </div>
  );
}
