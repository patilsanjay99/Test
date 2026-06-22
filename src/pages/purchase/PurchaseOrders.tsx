import { exportToCSV, formatDate } from '../../lib/utils';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Eye, FileText, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function PurchaseOrders() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/data/PurchaseOrders?CompanyId=${activeCompany?.id || ''}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching purchase orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompany) {
      fetchOrders();
    }
  }, [activeCompany?.id]);

  const handleDelete = async (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this purchase order?")) {
      try {
        const res = await fetch(`/api/v1/data/PurchaseOrders/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchOrders();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to delete");
        }
      } catch (e) {
        console.error("Delete error", e);
      }
    }
  };

  const handleConvertToInvoice = async (order: any) => {
    // Redirect to Purchase Invoices creation page with PO query param so it populates automatically
    const orderId = order.Id || order.id || order.ID;
    navigate(`/purchase/invoices/new?fromPo=${orderId}`);
  };

  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase();
    const orderNum = (o.OrderNumber || '').toLowerCase();
    const vendor = (o.VendorName || '').toLowerCase();
    const remarks = (o.Remarks || '').toLowerCase();
    return orderNum.includes(query) || vendor.includes(query) || remarks.includes(query);
  });

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor orders and track procurements.</p>
        </div>
        {hasPermission('/purchase/orders', 'add') && ( 
          <button 
            onClick={() => navigate('/purchase/orders/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create PO
          </button> 
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search purchase orders..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" 
              onClick={() => exportToCSV(orders, 'PurchaseOrders')}
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">PO No</th>
                <th className="font-medium p-4 border-b border-gray-200">Date</th>
                <th className="font-medium p-4 border-b border-gray-200">Vendor</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Amount (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-sm text-gray-500">Loading purchase orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-sm text-gray-500">No purchase orders found</td>
                </tr>
              ) : filteredOrders.map((ord) => {
                const poId = ord.Id || ord.id || ord.ID;
                const dateStr = formatDate(ord.OrderDate || ord.Date || ord.poDate);
                const vendorName = ord.VendorName || ord.Vendor_NAME || ord.vendor;
                const amt = parseFloat(ord.TotalAmount || ord.amount || 0);
                const status = ord.Status || 'Pending';

                return (
                  <tr key={poId} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 text-sm font-medium text-blue-600">{ord.OrderNumber || ord.id}</td>
                    <td className="p-4 text-sm text-gray-600">{dateStr}</td>
                    <td className="p-4 text-sm text-gray-900 font-medium">{vendorName}</td>
                    <td className="p-4 text-sm text-gray-900 font-mono text-right">
                      {amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        status === 'Received' ? 'bg-green-100 text-green-700' : 
                        status === 'Confirmed' ? 'bg-blue-100 text-blue-700' : 
                        status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/purchase/orders/${poId}/print`)} 
                        className="text-gray-400 hover:text-indigo-650 transition-colors" 
                        title="Print Purchase Order"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {status !== 'Received' && (
                        <button 
                          onClick={() => handleConvertToInvoice(ord)}
                          className="text-gray-400 hover:text-green-600 transition-colors" 
                          title="Convert to Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('/purchase/orders', 'edit') && (
                        <button 
                          onClick={() => navigate(`/purchase/orders/${poId}`)} 
                          className="text-gray-400 hover:text-blue-600 transition-colors" 
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('/purchase/orders', 'delete') && (
                        <button 
                          onClick={() => handleDelete(poId)} 
                          className="text-gray-400 hover:text-red-600 transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {filteredOrders.length} entries
        </div>
      </div>
    </div>
  );
}
