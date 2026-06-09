import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderLine {
  id: string;
  item: string;
  hsn: string;
  qty: number;
  rate: number;
  discount: number;
  gstRate: number;
}

export function SalesOrderForm() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<OrderLine[]>([
    { id: '1', item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18 }
  ]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18 }]);
  };

  const updateLine = (id: string, field: keyof OrderLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    lines.forEach(line => {
      const gross = line.qty * line.rate;
      const discount = (gross * line.discount) / 100;
      const taxable = gross - discount;
      const gst = (taxable * line.gstRate) / 100;

      subtotal += taxable;
      totalDiscount += discount;
      totalGst += gst;
    });

    return { subtotal, totalDiscount, totalGst, grandTotal: subtotal + totalGst };
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/sales/orders')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Sales Order</h1>
            <p className="text-sm text-gray-500 mt-1">Confirm an order before dispatch and invoicing.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Save Draft
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Confirm Order
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Customer</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Select Customer...</option>
              <option value="1">Ramesh Patel (CUST-001)</option>
              <option value="2">Kisan Traders (CUST-002)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Order Date</label>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Expected Delivery</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="font-medium p-3">Item Details</th>
                <th className="font-medium p-3 w-24">HSN</th>
                <th className="font-medium p-3 w-24 text-right">Qty</th>
                <th className="font-medium p-3 w-32 text-right">Rate (₹)</th>
                <th className="font-medium p-3 w-24 text-right">Disc (%)</th>
                <th className="font-medium p-3 w-24 text-right">GST (%)</th>
                <th className="font-medium p-3 w-32 text-right">Amount</th>
                <th className="font-medium p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line) => {
                const taxable = (line.qty * line.rate) * (1 - line.discount / 100);
                const total = taxable * (1 + line.gstRate / 100);
                
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
                        value={line.hsn}
                        onChange={e => updateLine(line.id, 'hsn', e.target.value)}
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
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={line.discount || ''}
                        onChange={e => updateLine(line.id, 'discount', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-sm outline-none text-right transition-all font-mono"
                      />
                    </td>
                    <td className="p-3">
                      <select 
                        value={line.gstRate}
                        onChange={e => updateLine(line.id, 'gstRate', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-sm outline-none text-right transition-all appearance-none cursor-pointer"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
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
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal (Taxable)</span>
              <span className="font-mono text-gray-900">{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span className="font-mono">-{totals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total GST</span>
              <span className="font-mono text-gray-900">{totals.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Grand Total</span>
              <span className="text-lg font-bold text-gray-900 font-mono">
                ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <label className="text-sm font-medium text-gray-700 block mb-2">Delivery Instructions</label>
          <textarea 
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder="Delivery address or special instructions..."
          ></textarea>
        </div>
      </div>
    </div>
  );
}
