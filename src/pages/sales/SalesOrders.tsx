import { exportToCSV } from '../../lib/utils';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Eye, FileText, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function SalesOrders() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (activeCompany?.id) {
       fetch(`/api/data/SalesOrders?CompanyId=${activeCompany.id}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                // Fetch customer details to map name/place
                fetch(`/api/data/Customers?CompanyId=${activeCompany.id}`)
                .then(res => res.json())
                .then(customers => {
                   const mappedData = data.map(ord => {
                       const customer = Array.isArray(customers) ? customers.find(c => c.Id === ord.CustomerId) : null;
                       return {
                           ...ord,
                           CustomerName: customer?.CustomerName || 'Unknown',
                           CustomerPlace: customer?.Place || '-'
                       };
                   });
                   setOrders(mappedData);
                })
                .catch(() => setOrders(data));
            } else {
                setOrders([]);
            }
        })
        .catch(console.error);
    }
  }, [activeCompany?.id]);

  const deleteOrder = async (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      await fetch(`/api/data/SalesOrders/${id}`, { method: 'DELETE' });
      setOrders(orders.filter(o => o.Id !== id));
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage confirmed customer orders and track fulfillment.</p>
        </div>
        {hasPermission('/sales/orders', 'add') && ( <button 
          onClick={() => navigate('/sales/orders/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white">
              Filter
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(orders, 'SalesOrders')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Order No</th>
                <th className="font-medium p-4 border-b border-gray-200">Date</th>
                <th className="font-medium p-4 border-b border-gray-200">Customer</th>
                <th className="font-medium p-4 border-b border-gray-200">Place</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Amount (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((ord) => (
                <tr key={ord.Id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 text-sm font-medium text-blue-600">{ord.OrderNumber}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {ord.OrderDate ? (
                      ord.OrderDate.includes('-') 
                        ? ord.OrderDate.split('-').reverse().join('/') 
                        : ord.OrderDate
                    ) : '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-medium">{ord.CustomerName || '-'}</td>
                  <td className="p-4 text-sm text-gray-600">{ord.CustomerPlace || '-'}</td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">{parseFloat(ord.TotalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      ord.Status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                      ord.Status === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ord.Status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 transition-opacity">
                    <button className="text-gray-400 hover:text-green-600 transition-colors" title="Convert to Invoice">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="View PDF" onClick={() => navigate(`/sales/orders/${ord.Id}/print`)}>
                      <Printer className="w-4 h-4" />
                    </button>
                    {hasPermission('/sales', 'edit') && (
                      <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit" onClick={() => navigate(`/sales/orders/${ord.Id}`)}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      )}
                    {hasPermission('/sales', 'delete') && (
                      <button className="text-gray-400 hover:text-red-600 transition-colors" title="Delete" onClick={() => deleteOrder(ord.Id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {orders.length} entries
        </div>
      </div>
    </div>
  );
}
