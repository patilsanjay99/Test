import { exportToCSV } from '../../lib/utils';
import React from 'react';
import { Plus, Search, Edit2, Trash2, Download, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quotations = [
  { id: 'QT-2024-001', date: '01/03/2024', customer: 'Ramesh Patel', amount: 45000, status: 'Accepted' },
  { id: 'QT-2024-002', date: '05/03/2024', customer: 'Agro Retailers', amount: 125000, status: 'Draft' },
  { id: 'QT-2024-003', date: '10/03/2024', customer: 'Suresh Kumar', amount: 32000, status: 'Sent' },
];

export function SalesQuotations() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Quotations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage estimates and quotes before converting to orders.</p>
        </div>
        <button 
          onClick={() => navigate('/sales/quotations/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Quotation
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search quotations..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white">
              Filter
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(quotations, 'SalesQuotations')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Quote No</th>
                <th className="font-medium p-4 border-b border-gray-200">Date</th>
                <th className="font-medium p-4 border-b border-gray-200">Customer</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Amount (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotations.map((qt) => (
                <tr key={qt.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 text-sm font-medium text-blue-600">{qt.id}</td>
                  <td className="p-4 text-sm text-gray-600">{qt.date}</td>
                  <td className="p-4 text-sm text-gray-900 font-medium">{qt.customer}</td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">{qt.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      qt.status === 'Accepted' ? 'bg-green-100 text-green-700' : 
                      qt.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {qt.status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-green-600 transition-colors" title="Convert to Order">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="View PDF">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to 3 of 3 entries
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-300 cursor-not-allowed" disabled>Prev</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-blue-50 text-blue-600 font-medium border-blue-200">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-not-allowed" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
