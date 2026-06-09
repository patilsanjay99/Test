import React, { useState } from 'react';
import { Plus, Search, Edit2, Download, Leaf, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockLoans = [
  { id: 'LN-2024-001', date: '01/02/2024', member: 'Ramesh Patel', type: 'Kisan Credit (KCC)', amount: 50000, balance: 45000, status: 'Active' },
  { id: 'LN-2024-002', date: '15/02/2024', member: 'Santosh Kumar', type: 'Equipment Loan', amount: 120000, balance: 120000, status: 'Active' },
  { id: 'LN-2024-003', date: '05/03/2024', member: 'Anita Devi', type: 'Crop Loan', amount: 30000, balance: 0, status: 'Closed' },
];

export function Loans() {
  const [loans] = useState(mockLoans);
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Loan Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage member loan disbursements, repayments, and outstanding balances.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors shadow-sm">
            Repayment Register
          </button>
          <button 
            onClick={() => navigate('/fpc/loans/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Issue New Loan
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by loan ID or member name..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(loans, 'Loans')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Loan ID & Date</th>
                <th className="font-medium p-4 border-b border-gray-200">Member</th>
                <th className="font-medium p-4 border-b border-gray-200">Loan Type</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Principal (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Balance Due (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shrink-0">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">{loan.id}</div>
                        <div className="text-xs text-gray-500">{loan.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-medium">{loan.member}</td>
                  <td className="p-4 text-sm text-gray-600">{loan.type}</td>
                  <td className="p-4 text-sm text-gray-900 text-right">{loan.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-sm text-red-600 font-medium text-right">
                    {loan.balance.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      loan.status === 'Active' ? 'bg-blue-100 text-blue-700' : 
                      loan.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-green-600 transition-colors" title="Record Repayment">
                      <CreditCard className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Schedule">
                      <Calendar className="w-4 h-4" />
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
          Showing 1 to {loans.length} of {loans.length} entries
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
