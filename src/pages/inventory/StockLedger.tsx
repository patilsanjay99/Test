import { exportToCSV } from '../../lib/utils';
import React, { useState } from 'react';
import { Search, Download, Package, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';

const mockLedger = [
  { itemCode: 'ITM-001', itemName: 'Premium Wheat Seeds', category: 'Seeds', uom: 'kg', openingStock: 200, inward: 400, outward: 100, closingStock: 500 },
  { itemCode: 'ITM-002', itemName: 'Urea Fertilizer 50kg', category: 'Fertilizers', uom: 'Bag', openingStock: 50, inward: 250, outward: 100, closingStock: 200 },
  { itemCode: 'ITM-003', itemName: 'Pesticide XYZ 1L', category: 'Pesticides', uom: 'Ltr', openingStock: 20, inward: 50, outward: 20, closingStock: 50 },
];

export function StockLedger() {
  const [ledger] = useState(mockLedger);

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time inventory balances and stock summaries.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by item code or name..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Categories</option>
              <option value="Seeds">Seeds</option>
              <option value="Fertilizers">Fertilizers</option>
              <option value="Pesticides">Pesticides</option>
            </select>
            <button
              onClick={() => exportToCSV(ledger, 'StockLedger')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Item Details</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Opening Stock</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right text-green-600">Inward <ArrowDownRight className="w-3 h-3 inline" /></th>
                <th className="font-medium p-4 border-b border-gray-200 text-right text-red-600">Outward <ArrowUpRight className="w-3 h-3 inline" /></th>
                <th className="font-medium p-4 border-b border-gray-200 text-right text-blue-600">Closing Stock</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ledger.map((item) => (
                <tr key={item.itemCode} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-xs text-gray-500 font-mono">{item.itemCode} • {item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 text-right font-mono">
                    {item.openingStock} <span className="text-gray-400 font-sans text-xs">{item.uom}</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-green-600 text-right font-mono">
                    +{item.inward} <span className="text-green-400 font-sans text-xs">{item.uom}</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-red-600 text-right font-mono">
                    -{item.outward} <span className="text-red-400 font-sans text-xs">{item.uom}</span>
                  </td>
                  <td className="p-4 text-sm font-bold text-blue-700 text-right font-mono">
                    {item.closingStock} <span className="text-blue-500 font-sans text-xs font-normal">{item.uom}</span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs font-medium" title="View Transaction History">
                      <History className="w-4 h-4" /> History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {ledger.length} of {ledger.length} items
        </div>
      </div>
    </div>
  );
}
