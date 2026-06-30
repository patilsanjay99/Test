import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, BookOpen, Loader2, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { AutocompleteCombobox } from '../../components/AutocompleteCombobox';

interface Account {
  Id: number;
  id?: number;
  AccountCode: string;
  Name: string;
  AccountGroup?: string;
  AccountType?: string;
}

interface JournalLine {
  id: string; // React temporary list key
  AccountId: string;
  Description: string;
  Debit: number;
  Credit: number;
}

export function JournalEntryForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Holds specific entry id when editing
  const { activeCompany } = useAppContext();
  const companyId = activeCompany?.id || 1;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Form fields
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [journalNo, setJournalNo] = useState<string>('');
  const [narration, setNarration] = useState<string>('');
  const [status, setStatus] = useState<string>('Draft');

  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', AccountId: '', Description: '', Debit: 0, Credit: 0 },
    { id: '2', AccountId: '', Description: '', Debit: 0, Credit: 0 }
  ]);

  // Load ledger accounts dynamically
  useEffect(() => {
    fetch(`/api/v1/data/Accounts?CompanyId=${companyId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch accounts');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize accounts key casing
          const normalized: Account[] = data.map(acc => ({
            Id: acc.Id ?? acc.id ?? 0,
            AccountCode: acc.AccountCode ?? acc.accountcode ?? '',
            Name: acc.Name ?? acc.name ?? '',
            AccountGroup: acc.AccountGroup ?? acc.accountgroup ?? '',
            AccountType: acc.AccountType ?? acc.accounttype ?? ''
          }));
          setAccounts(normalized);
        } else {
          // Smart fallback standard accounts if none exist in db
          setAccounts([
            { Id: 1, AccountCode: '1001', Name: 'Cash in Hand' },
            { Id: 2, AccountCode: '1002', Name: 'HDFC Bank C/A' },
            { Id: 3, AccountCode: '2001', Name: 'Share Capital' },
            { Id: 4, AccountCode: '3001', Name: 'Sales Revenue' },
            { Id: 5, AccountCode: '4001', Name: 'Purchases' }
          ]);
        }
      })
      .catch(err => {
        console.error('Error fetching accounts:', err);
        // Fallback
        setAccounts([
          { Id: 1, AccountCode: '1001', Name: 'Cash in Hand' },
          { Id: 2, AccountCode: '1002', Name: 'HDFC Bank C/A' },
          { Id: 3, AccountCode: '2001', Name: 'Share Capital' },
          { Id: 4, AccountCode: '3001', Name: 'Sales Revenue' },
          { Id: 5, AccountCode: '4001', Name: 'Purchases' }
        ]);
      });
  }, [companyId]);

  // Load existing journal entry if ID is supplied
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/v1/journal/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load journal details');
          return res.json();
        })
        .then(data => {
          if (data) {
            if (data.Reference && data.Reference.startsWith('CP-')) {
              const cpId = data.Reference.split('-')[1];
              if (cpId) {
                navigate(`/accounting/payments/${cpId}`);
                return;
              }
            }
            setEntryDate(data.EntryDate ? data.EntryDate.split('T')[0] : '');
            setReferenceNo(data.Reference ?? '');
            setJournalNo(data.EntryNumber ?? '');
            setNarration(data.Narration ?? '');
            setStatus(data.Status ?? 'Draft');
            
            if (Array.isArray(data.lines) && data.lines.length > 0) {
              const formattedLines: JournalLine[] = data.lines.map((l: any, idx: number) => ({
                id: String(idx + 1),
                AccountId: String(l.AccountId ?? l.accountid ?? ''),
                Description: l.Description ?? l.description ?? '',
                Debit: parseFloat(l.Debit ?? l.debit) || 0,
                Credit: parseFloat(l.Credit ?? l.credit) || 0
              }));
              setLines(formattedLines);
            }
          }
        })
        .catch(err => {
          console.error("Error loaded journal record:", err);
          alert(`Error loading journal entry info: ${err.message}`);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const updateLine = (idStr: string, field: keyof JournalLine, value: string | number) => {
    setLines(lines.map(line => {
      if (line.id === idStr) {
        const newLine = { ...line, [field]: value };
        // Clean counterpart element so a line is either Debit OR Credit
        if (field === 'Debit' && Number(value) > 0) newLine.Credit = 0;
        if (field === 'Credit' && Number(value) > 0) newLine.Debit = 0;
        return newLine;
      }
      return line;
    }));
  };

  const removeLine = (idStr: string) => {
    if (lines.length <= 2) {
      alert("A standard journal transaction must contain at least 2 entry lines.");
      return;
    }
    setLines(lines.filter(line => line.id !== idStr));
  };

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), AccountId: '', Description: '', Debit: 0, Credit: 0 }]);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.Debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.Credit) || 0), 0);
  const diff = Math.round((totalDebit - totalCredit) * 100) / 100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entryDate) {
      return alert("Transaction Date is required.");
    }
    if (lines.some(l => !l.AccountId)) {
      return alert("All listed journal lines must have a selected ledger account.");
    }
    if (totalDebit === 0) {
      return alert("Journal entry details cannot have a total value of 0.");
    }
    if (diff !== 0) {
      return alert(`Debits and Credits are unbalanced. Difference of ₹${Math.abs(diff).toFixed(2)} must be resolved.`);
    }

    const payload = {
      CompanyId: companyId,
      EntryNumber: journalNo,
      Reference: referenceNo,
      Narration: narration,
      TotalAmount: totalDebit,
      Status: status,
      EntryDate: entryDate,
      lines: lines.map(l => ({
        AccountId: l.AccountId,
        Description: l.Description,
        Debit: l.Debit,
        Credit: l.Credit
      }))
    };

    try {
      setSaving(true);
      const url = id ? `/api/v1/journal/${id}` : '/api/v1/journal';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate('/accounting/journal');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Error: ${errorData.error || response.statusText || 'Unable to save Journal Entry detail records.'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Network connection error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-full mx-auto px-4 lg:px-8 w-full py-20 text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <span>Loading Journal details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/accounting/journal')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {id ? 'Edit Journal Entry' : 'New Journal Entry'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a balanced double-entry accounting record.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#8faad8] rounded shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-2.5 px-4 text-center font-bold text-lg tracking-wider uppercase border-b border-blue-900 flex items-center justify-center gap-2">
          <BookOpen className="w-5 h-5" /> JOURNAL ENTRY MASTER
        </div>

        {/* Outer Excel-like grid border layer */}
        <div className="p-0.5 bg-[#8faad8] flex flex-col divide-y divide-[#8faad8] ">
          
          {/* Row 1: Date & Journal No */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Date (dd/mm/yyyy) <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <CustomDatePicker 
                  required 
                  value={entryDate}
                  onChange={setEntryDate}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Journal No
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="text" 
                  value={journalNo}
                  onChange={(e) => setJournalNo(e.target.value)}
                  placeholder="Auto-generated if blank" 
                  className="w-full px-2.5 py-1.5 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f1f5f9] text-gray-500 font-bold font-mono" 
                  disabled={!!id} // Immutable for edit cases
                />
              </div>
            </div>
          </div>

          {/* Row 2: Reference Code & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Reference No
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="text" 
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. Inv#102, Cash Deposit" 
                  className="w-full px-2.5 py-1 text-xs border border-[#8faad8] rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-semibold font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Status
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer text-gray-900 font-semibold"
                >
                  <option value="Draft">Draft</option>
                  <option value="Posted">Posted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Narration / General Notes */}
          <div className="grid grid-cols-1">
            <div className="grid grid-cols-6">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8] col-span-2 md:col-span-1">
                Narration / Notes
              </div>
              <div className="col-span-4 md:col-span-5 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="text" 
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="Provide transaction narration/notes description here..." 
                  className="w-full px-2.5 py-1.5 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-semibold" 
                />
              </div>
            </div>
          </div>

        </div>

        {/* Section 2: Account Ledger Lines Grid */}
        <div className="border-t-2 border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase flex justify-between items-center ">
            <span>II. Journal Lines</span>
            {diff !== 0 ? (
              <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                Difference: ₹{Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : totalDebit > 0 ? (
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-300">
                Balanced (₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </span>
            ) : null}
          </div>

          <div className="p-4 bg-white">
            <div className="border border-[#8faad8] rounded overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-gray-900 text-xs font-bold uppercase tracking-wider border-b border-blue-900">
                    <th className="p-2.5 w-1/3 border-r border-blue-900">Account <span className="text-red-500">*</span></th>
                    <th className="p-2.5 border-r border-blue-900">Description</th>
                    <th className="p-2.5 text-right w-40 border-r border-blue-900">Debit (₹)</th>
                    <th className="p-2.5 text-right w-40 border-r border-blue-900">Credit (₹)</th>
                    <th className="p-2.5 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8faad8]">
                  {lines.map((line) => (
                    <tr key={line.id} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="p-2 border-r border-blue-900">
                        <AutocompleteCombobox
                          options={accounts.map(acc => ({
                            value: String(acc.Id || acc.id || ''),
                            label: `${acc.AccountCode ? `${acc.AccountCode} - ` : ''}${acc.Name || ''}`,
                            sublabel: acc.AccountGroup
                          }))}
                          value={line.AccountId}
                          onChange={(val) => updateLine(line.id, 'AccountId', val)}
                          placeholder="Search Account..."
                          required={true}
                        />
                      </td>
                      <td className="p-2 border-r border-blue-900">
                         <input 
                          type="text" 
                          value={line.Description}
                          onChange={(e) => updateLine(line.id, 'Description', e.target.value)}
                          placeholder="Line description"
                          className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium" 
                        />
                      </td>
                      <td className="p-2 border-r border-blue-900">
                        <input 
                          type="number" 
                          min="0"
                          step="any"
                          value={line.Debit || ''}
                          onChange={(e) => updateLine(line.id, 'Debit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono font-semibold text-slate-800" 
                        />
                      </td>
                      <td className="p-2 border-r border-blue-900">
                        <input 
                          type="number" 
                          min="0"
                          step="any"
                          value={line.Credit || ''}
                          onChange={(e) => updateLine(line.id, 'Credit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono font-semibold text-slate-800" 
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          type="button"
                          onClick={() => removeLine(line.id)} 
                          className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer" 
                          title="Remove Line"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold border-t-2 border-blue-900">
                    <td colSpan={2} className="p-2.5 text-right text-gray-800 text-xs border-r border-blue-900">Totals:</td>
                    <td className="p-2.5 text-right text-gray-950 font-mono text-sm border-r border-blue-900 font-bold">
                      ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-right text-gray-950 font-mono text-sm border-r border-blue-900 font-bold">
                      ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-center"></td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2 bg-[#f8fafc] border-t border-blue-900">
                <button 
                  type="button"
                  onClick={addLine}
                  className="text-xs font-bold text-blue-800 hover:text-blue-900 flex items-center gap-1 transition-colors px-3 py-1 bg-white border border-[#cbd5e1] hover:border-[#8faad8] rounded shadow-sm hover:shadow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD ROW LINE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/accounting/journal')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-xs cursor-pointer"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving || diff !== 0 || totalDebit === 0}
            className={`px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-xs cursor-pointer ${
              diff === 0 && totalDebit > 0 
                ? 'bg-[#0b8a1c] hover:bg-[#097016] text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SAVING...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                POST ENTRY
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
