import { exportToCSV, formatDate } from '../../lib/utils';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Eye, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function SalesInvoices() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const [resInvoices, resCustomers] = await Promise.all([
        fetch(`/api/v1/data/SalesInvoices?CompanyId=${activeCompany?.id || ''}`),
        fetch(`/api/v1/data/Customers?CompanyId=${activeCompany?.id || ''}`)
      ]);
      const dataInvoices = await resInvoices.json();
      const dataCustomers = await resCustomers.json();
      
      setInvoices(Array.isArray(dataInvoices) ? dataInvoices : []);
      setCustomers(Array.isArray(dataCustomers) ? dataCustomers : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [activeCompany?.id]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await fetch(`/api/v1/data/SalesInvoices/${id}`, { method: 'DELETE' });
      fetchInvoices();
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage billing, taxation, and customer invoices.</p>
        </div>
        {hasPermission('/sales/invoices', 'add') && (
<button 
          onClick={() => navigate('/sales/invoices/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-[#f4fbf4]"
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
                <th className="font-medium p-4 border-b border-gray-200">Customer Name</th>
                <th className="font-medium p-4 border-b border-gray-200">Place</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Amount (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-sm text-gray-500">No records found</td></tr>
              ) : invoices.map((inv) => {
                const customer = customers.find(c => String(c.Id || c.id) === String(inv.CustomerId));
                return (
                <tr key={inv.Id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 text-sm font-medium text-blue-600">{inv.InvoiceNumber}</td>
                  <td className="p-4 text-sm text-gray-600">{formatDate(inv.InvoiceDate)}</td>
                  <td className="p-4 text-sm text-gray-900 font-medium">
                    {customer ? (customer.CustomerName || customer.Customer_NAME || customer.Name) : '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {customer ? (customer.City || customer.CITY || customer.BillingCity || '-') : '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">{inv.TotalAmount ? (typeof inv.TotalAmount === 'string' ? parseFloat(inv.TotalAmount) : inv.TotalAmount).toLocaleString('en-IN') : '0'}</td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => navigate(`/sales/invoices/${inv.Id}/print?type=sales`)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Print Invoice">
                      <Printer className="w-4 h-4" />
                    </button>
                    {hasPermission('/sales/invoices', 'edit') && (
                      <button onClick={() => navigate(`/sales/invoices/${inv.Id}`)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Invoice">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      )}
                    {hasPermission('/sales/invoices', 'delete') && (
                      <button onClick={() => handleDelete(inv.Id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      )}
                  </td>
                </tr>
              )})}
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
