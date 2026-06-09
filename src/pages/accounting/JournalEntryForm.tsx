import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface JournalLine {
  id: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export function JournalEntryForm() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', accountId: '', description: '', debit: 0, credit: 0 },
    { id: '2', accountId: '', description: '', debit: 0, credit: 0 }
  ]);

  const updateLine = (id: string, field: keyof JournalLine, value: string | number) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const newLine = { ...line, [field]: value };
        // Clear counterpart if we are typing in debit or credit
        if (field === 'debit' && Number(value) > 0) newLine.credit = 0;
        if (field === 'credit' && Number(value) > 0) newLine.debit = 0;
        return newLine;
      }
      return line;
    }));
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), accountId: '', description: '', debit: 0, credit: 0 }]);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const diff = totalDebit - totalCredit;

  return (
    <div className="max-w-5xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/accounting/journal')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Journal Entry</h1>
            <p className="text-sm text-gray-500 mt-1">Create a double-entry accounting record.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm ${
              diff === 0 && totalDebit > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={diff !== 0 || totalDebit === 0}
          >
            <Save className="w-4 h-4" />
            Post Entry
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-400" /> General Info
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Journal No</label>
              <input type="text" placeholder="Auto-generated" className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500 font-mono" readOnly />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Reference</label>
              <input type="text" placeholder="e.g. Inv#102, Cash Deposit" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Notes / Narration</label>
            <input type="text" placeholder="Description of the transaction..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900 block">Journal Lines</h3>
              {diff !== 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                  Difference: ₹{Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="font-medium p-3 w-1/3">Account <span className="text-red-500">*</span></th>
                    <th className="font-medium p-3">Description</th>
                    <th className="font-medium p-3 text-right w-36">Debit (₹)</th>
                    <th className="font-medium p-3 text-right w-36">Credit (₹)</th>
                    <th className="font-medium p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line) => (
                    <tr key={line.id} className="bg-white">
                      <td className="p-2">
                        <select 
                          value={line.accountId}
                          onChange={(e) => updateLine(line.id, 'accountId', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="">Select Account...</option>
                          <option value="1">1001 - Cash in Hand</option>
                          <option value="2">1002 - HDFC Bank C/A</option>
                          <option value="3">3001 - Sales Revenue</option>
                          <option value="4">4001 - Purchases</option>
                        </select>
                      </td>
                      <td className="p-2">
                         <input 
                          type="text" 
                          value={line.description}
                          onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                          placeholder="Line description"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white" 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          min="0"
                          value={line.debit || ''}
                          onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono" 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          min="0"
                          value={line.credit || ''}
                          onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono" 
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeLine(line.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Remove Line">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={2} className="p-3 text-right text-gray-700 text-sm">Totals:</td>
                    <td className="p-3 text-right text-gray-900 font-mono text-sm border-t border-gray-200">
                      ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-gray-900 font-mono text-sm border-t border-gray-200">
                      ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 border-t border-gray-200"></td>
                  </tr>
                </tbody>
              </table>
              <div className="p-3 bg-white border-t border-gray-200">
                <button 
                  onClick={addLine}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Line
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
