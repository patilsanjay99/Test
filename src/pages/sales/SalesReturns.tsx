import { exportToCSV, formatDate } from '../../lib/utils';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Eye, RotateCcw, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function SalesReturns() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany, activeFinancialYear } = useAppContext();
  const [returns, setReturns] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReturnsAndCustomers = async () => {
    try {
      const companyId = activeCompany?.id || '';
      const [retRes, custRes] = await Promise.all([
        fetch(`/api/v1/data/SalesReturns?CompanyId=${companyId}`),
        fetch(`/api/v1/data/Customers?CompanyId=${companyId}`)
      ]);
      const retData = await retRes.json();
      const custData = await custRes.json();

      let filteredReturns = Array.isArray(retData) ? retData : [];
      if (activeFinancialYear?.id) {
        filteredReturns = filteredReturns.filter((r: any) => String(r.FinancialYearId) === String(activeFinancialYear.id));
      }
      setReturns(filteredReturns);
      setCustomers(Array.isArray(custData) ? custData : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnsAndCustomers();
  }, [activeCompany?.id, activeFinancialYear?.id]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this sales return?')) {
      await fetch(`/api/v1/data/SalesReturns/${id}`, { method: 'DELETE' });
      fetchReturnsAndCustomers();
    }
  };

  const getCustomerName = (customerId: any) => {
    const cust = customers.find(c => String(c.Id) === String(customerId) || String(c.id) === String(customerId));
    return cust ? (cust.CustomerName || cust.Customer_NAME || cust.Name) : 'Unknown Customer';
  };

  const getCustomerPlace = (customerId: any) => {
    const cust = customers.find(c => String(c.Id) === String(customerId) || String(c.id) === String(customerId));
    return cust ? (cust.City || cust.CITY || cust.BillingCity || '-') : '-';
  };

  const filteredReturns = returns.filter(ret => {
    const searchLower = searchTerm.toLowerCase();
    const returnNo = (ret.ReturnNumber || '').toLowerCase();
    const origInvoice = (ret.OriginalInvoiceNumber || '').toLowerCase();
    const customerName = getCustomerName(ret.CustomerId).toLowerCase();
    const place = getCustomerPlace(ret.CustomerId).toLowerCase();

    return returnNo.includes(searchLower) || 
           origInvoice.includes(searchLower) || 
           customerName.includes(searchLower) ||
           place.includes(searchLower);
  });

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6 select-none font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Returns</h1>
          <p className="text-sm text-gray-500 mt-1">Manage return items against sales invoices and issue credit notes.</p>
        </div>
        {hasPermission('/sales/returns', 'add') && ( <button 
          onClick={() => navigate('/sales/returns/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          id="btn-create-return"
        >
          <Plus className="w-4 h-4" />
          Create Return
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden" id="card-returns-list">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search returns..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-[#f4fbf4]"
              id="search-returns-input"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white cursor-pointer" onClick={() => fetchReturnsAndCustomers()}>
              Refresh
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2 cursor-pointer" onClick={() => exportToCSV(filteredReturns.map(r => ({ ...r, Customer: getCustomerName(r.CustomerId) })), 'SalesReturns')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading sales returns...</div>
          ) : filteredReturns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No sales returns found.</div>
          ) : (
            <table className="w-full text-left border-collapse" id="tbl-returns">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="font-medium p-4 border-b border-gray-200">Return No</th>
                  <th className="font-medium p-4 border-b border-gray-200">Date</th>
                  <th className="font-medium p-4 border-b border-gray-200">Orig. Invoice</th>
                  <th className="font-medium p-4 border-b border-gray-200">Customer</th>
                  <th className="font-medium p-4 border-b border-gray-200">Place</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Amount (₹)</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReturns.map((ret) => (
                  <tr key={ret.Id || ret.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 text-sm font-medium text-blue-600">{ret.ReturnNumber || `Draft` }</td>
                    <td className="p-4 text-sm text-gray-600">{formatDate(ret.ReturnDate) || '-'}</td>
                    <td className="p-4 text-sm text-gray-600">{ret.OriginalInvoiceNumber || '-'}</td>
                    <td className="p-4 text-sm text-gray-900 font-medium">{getCustomerName(ret.CustomerId)}</td>
                    <td className="p-4 text-sm text-gray-600">{getCustomerPlace(ret.CustomerId)}</td>
                    <td className="p-4 text-sm text-gray-900 font-mono text-right">{(ret.TotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/sales/returns/${ret.Id || ret.id}/print`)} className="text-gray-400 hover:text-green-600 transition-colors cursor-pointer" title="Print Return Receipt" id={`btn-print-${ret.Id || ret.id}`}>
                        <Printer className="w-4 h-4" />
                      </button>
                      {hasPermission('/sales/returns', 'edit') && (
                        <button onClick={() => navigate(`/sales/returns/${ret.Id || ret.id}`)} className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Edit Return" id={`btn-edit-${ret.Id || ret.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('/sales/returns', 'delete') && (
                        <button onClick={() => handleDelete(ret.Id || ret.id)} className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer" title="Delete Return" id={`btn-del-${ret.Id || ret.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {filteredReturns.length} entries
        </div>
      </div>
    </div>
  );
}
