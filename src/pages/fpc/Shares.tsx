import React, { useState } from 'react';
import { Plus, Search, Edit2, Download, FileText, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockShares = [
  { id: 'SH-2024-001', date: '10/01/2024', member: 'Ramesh Patel (FPC-M-001)', type: 'Allotment', shares: 10, amount: 1000, status: 'Completed' },
  { id: 'SH-2024-002', date: '15/01/2024', member: 'Santosh Kumar (FPC-M-002)', type: 'Allotment', shares: 5, amount: 500, status: 'Completed' },
  { id: 'SH-2024-003', date: '20/02/2024', member: 'Anita Devi (FPC-M-003)', type: 'Transfer', shares: 5, amount: 500, status: 'Pending' },
];

export function Shares() {
  const [shares] = useState(mockShares);
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Share Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage share allotments, transfers, and equity capital.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors shadow-sm">
            Share Register
          </button>
          <button 
            onClick={() => navigate('/fpc/shares/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by transaction ID or member..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Types</option>
              <option value="Allotment">Allotment</option>
              <option value="Transfer">Transfer</option>
              <option value="Surrender">Surrender</option>
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(shares, 'Shares')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Transaction ID & Date</th>
                <th className="font-medium p-4 border-b border-gray-200">Member</th>
                <th className="font-medium p-4 border-b border-gray-200">Type</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">No. of Shares</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Amount (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shares.map((share) => (
                <tr key={share.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        share.type === 'Allotment' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
                      }`}>
                        {share.type === 'Allotment' ? <FileText className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{share.id}</div>
                        <div className="text-xs text-gray-500">{share.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-medium">{share.member}</td>
                  <td className="p-4 text-sm text-gray-600">{share.type}</td>
                  <td className="p-4 text-sm font-medium text-gray-900 text-right">
                    {share.shares}
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">{share.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      share.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {share.status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {share.status !== 'Completed' && (
                      <button className="text-gray-400 hover:text-green-600 transition-colors" title="Approve Transaction">
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Download Certificate / Receipt">
                      <Download className="w-4 h-4" />
                    </button>
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
          Showing 1 to {shares.length} of {shares.length} entries
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
