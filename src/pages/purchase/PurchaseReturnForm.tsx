import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReturnLine {
  id: string;
  item: string;
  qty: number;
  rate: number;
  reason: string;
}

export function PurchaseReturnForm() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<ReturnLine[]>([
    { id: '1', item: '', qty: 1, rate: 0, reason: '' }
  ]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item: '', qty: 1, rate: 0, reason: '' }]);
  };

  const updateLine = (id: string, field: keyof ReturnLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const calculateTotals = () => {
    let grandTotal = 0;
    lines.forEach(line => {
      grandTotal += line.qty * line.rate;
    });
    return { grandTotal };
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/purchase/returns')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Purchase Return</h1>
            <p className="text-sm text-gray-500 mt-1">Book a return to vendor against an invoice.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Save Draft
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Process Debit Note
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Vendor</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Select Vendor...</option>
              <option value="1">Agri Seeds Ltd (VEN-001)</option>
              <option value="2">FarmTech Solutions (VEN-002)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Original Invoice</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Select Invoice...</option>
              <option value="1">PI-2024-001</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Return Date</label>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="font-medium p-3">Item details</th>
                <th className="font-medium p-3 w-48">Reason</th>
                <th className="font-medium p-3 w-32 text-right">Return Qty</th>
                <th className="font-medium p-3 w-32 text-right">Rate (₹)</th>
                <th className="font-medium p-3 w-32 text-right">Valuation</th>
                <th className="font-medium p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line) => {
                const total = line.qty * line.rate;
                return (
                  <tr key={line.id} className="group hover:bg-gray-50/50">
                    <td className="p-3">
                      <input 
                        type="text" 
                        placeholder="Search item..." 
                        value={line.item}
                        onChange={e => updateLine(line.id, 'item', e.target.value)}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-sm outline-none transition-all"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        placeholder="Defective, Excess..."
                        value={line.reason}
                        onChange={e => updateLine(line.id, 'reason', e.target.value)}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-sm outline-none transition-all"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="1"
                        value={line.qty || ''}
                        onChange={e => updateLine(line.id, 'qty', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-sm outline-none text-right transition-all font-mono"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0"
                        value={line.rate || ''}
                        onChange={e => updateLine(line.id, 'rate', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-sm outline-none text-right transition-all font-mono"
                      />
                    </td>
                    <td className="p-3 text-right font-medium text-gray-900 font-mono text-sm">
                      {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => removeLine(line.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 p-1"
                        disabled={lines.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-start">
          <button 
            onClick={addLine}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>

          <div className="w-72 bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
             <div className="pt-2 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Debit Note Val</span>
              <span className="text-lg font-bold text-gray-900 font-mono">
                ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
