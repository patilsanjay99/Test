import { exportToCSV } from '../../lib/utils';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SalesInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/v1/data/SalesInvoices');
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await fetch(`/api/v1/data/SalesInvoices/${id}`, { method: 'DELETE' });
      fetchInvoices();
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage billing, taxation, and customer invoices.</p>
        </div>
        <button 
          onClick={() => navigate('/sales/invoices/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white">
              Filter
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(invoices, 'SalesInvoices')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Invoice No</th>
                <th className="font-medium p-4 border-b border-gray-200">Date</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Amount (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500">No records found</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.Id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 text-sm font-medium text-blue-600">{inv.InvoiceNumber}</td>
                  <td className="p-4 text-sm text-gray-600">{inv.InvoiceDate}</td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">{inv.TotalAmount ? inv.TotalAmount.toLocaleString('en-IN') : '0'}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      inv.Status === 'Paid' ? 'bg-green-100 text-green-700' : 
                      inv.Status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {inv.Status || 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(inv.Id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {invoices.length} entries
        </div>
      </div>
    </div>
  );
}
