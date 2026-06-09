import React, { useState } from 'react';
import { ArrowLeft, Save, SlidersHorizontal, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdjustmentItem {
  id: string;
  itemCode: string;
  itemName: string;
  uom: string;
  currentStr: number;
  newQty: number;
}

export function StockAdjustmentForm() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdjustmentItem[]>([
    { id: '1', itemCode: 'ITM-001', itemName: 'Premium Wheat Seeds', uom: 'kg', currentStr: 500, newQty: 495 }
  ]);

  const updateItemQty = (id: string, newQty: number) => {
    setItems(items.map(item => item.id === id ? { ...item, newQty } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), itemCode: '', itemName: '', uom: '-', currentStr: 0, newQty: 0 }]);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/inventory/adjustments')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Stock Adjustment</h1>
            <p className="text-sm text-gray-500 mt-1">Record physical verifications and manual stock corrections.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Save Adjustment
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-400" /> Adjustment Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-sm font-medium text-gray-700">Adjustment Type <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Quantity">Quantity Adjustment</option>
                <option value="Value">Value Adjustment</option>
              </select>
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-sm font-medium text-gray-700">Reason / Reference</label>
              <input type="text" placeholder="e.g. Physical inventory count mismatch..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 block">Adjust Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="font-medium p-3 w-1/3">Item Details</th>
                    <th className="font-medium p-3 text-right">Current Qty</th>
                    <th className="font-medium p-3 text-right">New Qty</th>
                    <th className="font-medium p-3 text-right">Diff</th>
                    <th className="font-medium p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="p-3">
                        {item.itemCode ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                            <span className="text-xs text-gray-500 font-mono">{item.itemCode}</span>
                          </div>
                        ) : (
                          <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white">
                            <option value="">Select Item...</option>
                            <option value="ITM-001">Premium Wheat Seeds</option>
                            <option value="ITM-002">Urea Fertilizer 50kg</option>
                          </select>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-600 text-right font-mono">
                        {item.currentStr} <span className="text-xs font-sans text-gray-400">{item.uom}</span>
                      </td>
                      <td className="p-3 text-right">
                        <input 
                          type="number" 
                          value={item.newQty || ''}
                          onChange={(e) => updateItemQty(item.id, Number(e.target.value))}
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono" 
                        />
                      </td>
                      <td className={`p-3 text-sm font-medium text-right font-mono ${
                        (item.newQty - item.currentStr) > 0 ? 'text-green-600' :
                        (item.newQty - item.currentStr) < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {(item.newQty - item.currentStr) > 0 ? '+' : ''}{(item.newQty - item.currentStr) || 0}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Remove Item">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <button 
                  onClick={addItem}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
