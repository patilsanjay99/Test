import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Download, BookOpen, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { exportToCSV } from '../../lib/utils';

// Helper to format dates strictly as dd/MM/yyyy across the application
export function formatDateDMY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const rawStr = String(dateInput).split('T')[0]; // strip time if any
    const parts = rawStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // yyyy-MM-dd
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      } else {
        // dd-MM-yyyy or mm-dd-yyyy
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return String(dateInput);
  } catch (err) {
    return String(dateInput);
  }
}

interface JournalEntry {
  Id: number;
  id?: number;
  CompanyId: number;
  EntryNumber: string;
  Reference: string | null;
  Narration: string | null;
  TotalAmount: number;
  Status: string;
  EntryDate: string;
}

export function JournalEntries() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const companyId = activeCompany?.id || 1;

  const fetchJournalEntries = () => {
    setLoading(true);
    fetch(`/api/v1/journal?CompanyId=${companyId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch journal entries');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setEntries(data);
        }
      })
      .catch(err => {
        console.error('Error fetching journals:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJournalEntries();
  }, [companyId]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This will permanently remove its debit/credit line details.')) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/journal/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEntries(prev => prev.filter(item => (item.Id ?? item.id) !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Error deleting journal entry: ${err.error || res.statusText || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryNum = (entry.EntryNumber || '').toLowerCase();
      const refOrNarr = `${entry.Reference || ''} ${entry.Narration || ''}`.toLowerCase();
      const matchesSearch = entryNum.includes(searchTerm.toLowerCase()) || refOrNarr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || entry.Status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, searchTerm, statusFilter]);

  // Pagination
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredEntries.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / entriesPerPage));

  // CSV Export
  const handleExport = () => {
    const dataToExport = filteredEntries.map(e => ({
      'Entry No': e.EntryNumber,
      'Date': formatDateDMY(e.EntryDate),
      'Reference': e.Reference || '',
      'Narration': e.Narration || '',
      'Total Amount': e.TotalAmount,
      'Status': e.Status
    }));
    exportToCSV(dataToExport, `Journal_Entries_${activeCompany?.name?.replace(/\s+/g, '_') || 'Company'}`);
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Journal Entries</h1>
          <p className="text-sm text-gray-500 mt-1">Record and manage double-entry accounting journals.</p>
        </div>
        {hasPermission('/accounting/journal', 'add') && (
<button 
          onClick={() => navigate('/accounting/journal/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Journal Entry
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Controls Section */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50/50 gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search entries..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-[#f4fbf4] text-gray-800"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer text-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="Posted">Posted</option>
              <option value="Draft">Draft</option>
            </select>
            <button 
              onClick={handleExport}
              disabled={filteredEntries.length === 0}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button 
              onClick={fetchJournalEntries}
              title="Refresh List"
              className="p-2 border border-value border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors bg-white cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Table Body */}
        <div className="flex-1 overflow-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span>Loading Journal Entries...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-semibold">No journal entries found</p>
              <p className="text-sm mt-1">Get started by creating your first transactional record.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="font-semibold p-4 border-b border-gray-200">Entry No & Date</th>
                  <th className="font-semibold p-4 border-b border-gray-200">Reference / Notes</th>
                  <th className="font-semibold p-4 border-b border-gray-200 text-right">Total Amount (₹)</th>
                  <th className="font-semibold p-4 border-b border-gray-200">Status</th>
                  <th className="font-semibold p-4 border-b border-gray-200 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedEntries.map((entry) => {
                  const idVal = entry.Id ?? entry.id ?? 0;
                  return (
                    <tr key={idVal} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 font-mono">
                              {entry.EntryNumber}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {formatDateDMY(entry.EntryDate)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-800 font-medium">
                          {entry.Reference || <span className="text-gray-400 italic">No reference</span>}
                        </div>
                        {entry.Narration && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-sm" title={entry.Narration}>
                            {entry.Narration}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-900 font-mono font-bold text-right">
                        {(entry.TotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          entry.Status === 'Posted' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {entry.Status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {hasPermission('/accounting/journal', 'edit') && (
                            <button 
                              onClick={() => {
                                if (entry.Reference && entry.Reference.startsWith('CP-')) {
                                  const cpId = entry.Reference.split('-')[1];
                                  navigate(`/accounting/payments/${cpId}`);
                                } else {
                                  navigate(`/accounting/journal/${idVal}`);
                                }
                              }}
                              className="text-gray-500 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                              title="Edit Entry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('/accounting/journal', 'delete') && (
                            <button 
                              onClick={() => handleDelete(idVal)}
                              className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors cursor-pointer" 
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 gap-2">
          <div>
            Showing {filteredEntries.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredEntries.length)} of {filteredEntries.length} entries
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs font-semibold"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded text-xs font-bold cursor-pointer ${
                  currentPage === i + 1 
                    ? 'bg-blue-50 border-blue-300 text-blue-600' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
