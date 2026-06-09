import React, { useState } from 'react';
import { Plus, Search, Edit2, Download, SlidersHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockAdjustments = [
  { id: 'ADJ-2024-001', date: '01/03/2024', type: 'Quantity Addition', reason: 'Found extra in warehouse', status: 'Approved' },
  { id: 'ADJ-2024-002', date: '05/03/2024', type: 'Quantity Reduction', reason: 'Damaged goods', status: 'Approved' },
  { id: 'ADJ-2024-003', date: '10/03/2024', type: 'Value Adjustment', reason: 'Price correction', status: 'Draft' },
];

export function StockAdjustments() {
  const [adjustments] = useState(mockAdjustments);
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Adjustments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage manual stock quantity and value corrections.</p>
        </div>
        <button 
          onClick={() => navigate('/inventory/adjustments/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Adjustment
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by ID or reason..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(adjustments, 'StockAdjustments')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Adjustment No & Date</th>
                <th className="font-medium p-4 border-b border-gray-200">Adjustment Type</th>
                <th className="font-medium p-4 border-b border-gray-200">Reason</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {adjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        adj.type === 'Quantity Addition' ? 'bg-green-50 text-green-600 border border-green-100' :
                        adj.type === 'Quantity Reduction' ? 'bg-red-50 text-red-600 border border-red-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {adj.type === 'Quantity Addition' ? <ArrowDownRight className="w-4 h-4" /> :
                         adj.type === 'Quantity Reduction' ? <ArrowUpRight className="w-4 h-4" /> :
                         <SlidersHorizontal className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">{adj.id}</div>
                        <div className="text-xs text-gray-500">{adj.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-900">{adj.type}</td>
                  <td className="p-4 text-sm text-gray-600">{adj.reason}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      adj.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {adj.status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {adjustments.length} of {adjustments.length} entries
        </div>
      </div>
    </div>
  );
}
