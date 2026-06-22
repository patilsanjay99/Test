import { exportToCSV, formatDate } from '../../lib/utils';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Eye, RotateCcw, X, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function PurchaseReturns() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();

  const [returns, setReturns] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal for view/preview detail
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);

  useEffect(() => {
    if (activeCompany) {
      fetchData();
    }
  }, [activeCompany?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Load returns
      const returnsRes = await fetch(`/api/v1/data/PurchaseReturns?CompanyId=${activeCompany?.id || ''}`);
      const returnsData = await returnsRes.json();
      const returnsList = Array.isArray(returnsData) ? returnsData : [];

      // Load vendors
      const vendorsRes = await fetch(`/api/v1/data/Vendors?CompanyId=${activeCompany?.id || ''}`);
      const vendorsData = await vendorsRes.json();
      const vendorsList = Array.isArray(vendorsData) ? vendorsData : [];

      setReturns(returnsList);
      setVendors(vendorsList);
    } catch (e) {
      console.error("Error loading purchase returns data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this purchase return/debit note?")) {
      try {
        await fetch(`/api/v1/data/PurchaseReturns/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error("Error deleting return record", err);
      }
    }
  };

  const handleProcessDebitNote = async (ret: any) => {
    if (window.confirm(`Process Debit Note ${ret.ReturnNumber}? This will lock the return and post it.`)) {
      try {
        const updated = { ...ret, Status: 'Processed' };
        // Delete fields we don't want to save to the main record
        delete updated.id;
        delete updated.Id;

        const res = await fetch(`/api/v1/data/PurchaseReturns/${ret.Id || ret.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        if (res.ok) {
          fetchData();
        } else {
          alert("Failed to process Debit Note");
        }
      } catch (err) {
        console.error("Error processing debit note", err);
      }
    }
  };

  const getVendorName = (vendorId: any) => {
    const v = vendors.find(vend => String(vend.Vendor_ID || vend.id || vend.Id) === String(vendorId));
    return v ? (v.VendorName || v.Vendor_NAME || v.Name) : 'Unknown Vendor';
  };

  const getVendorPlace = (vendorId: any) => {
    const v = vendors.find(vend => String(vend.Vendor_ID || vend.id || vend.Id) === String(vendorId));
    return v ? (v.City || v.CITY || v.BillingCity || '-') : '-';
  };

  // Filter returns based on search
  const filteredReturns = returns.filter(ret => {
    const vName = getVendorName(ret.VendorId).toLowerCase();
    const vPlace = getVendorPlace(ret.VendorId).toLowerCase();
    const retNo = (ret.ReturnNumber || '').toLowerCase();
    const invNo = (ret.OriginalInvoiceNumber || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    return vName.includes(query) || retNo.includes(query) || invNo.includes(query) || vPlace.includes(query);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6 print:p-0 print:m-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Purchase Returns / Debit Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor debit notes and returns securely.</p>
        </div>
        {hasPermission('/purchase/returns', 'add') && (
          <button 
            onClick={() => navigate('/purchase/returns/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Return
          </button>
        )}
      </div>

      <div className={`bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden print:border-none print:shadow-none ${selectedReturn ? 'print:hidden' : ''}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 print:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search returns (Number, Invoice, Vendor)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(returns, 'PurchaseReturns')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-500">
              Loading Purchase Returns...
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No purchase returns recorded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200">
                  <th className="font-semibold p-4">Return No</th>
                  <th className="font-semibold p-4">Date</th>
                  <th className="font-semibold p-4">Orig. Invoice</th>
                  <th className="font-semibold p-4">Vendor</th>
                  <th className="font-semibold p-4">Place</th>
                  <th className="font-semibold p-4 text-right">Amount (₹)</th>
                  <th className="font-semibold p-4 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReturns.map((ret) => (
                  <tr key={ret.Id || ret.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 text-sm font-medium text-blue-600">{ret.ReturnNumber || `PR-${ret.Id || ret.id}`}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {ret.ReturnDate ? formatDate(ret.ReturnDate) : 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-mono">{ret.OriginalInvoiceNumber || 'N/A'}</td>
                    <td className="p-4 text-sm text-gray-900 font-medium">
                      {getVendorName(ret.VendorId)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {getVendorPlace(ret.VendorId)}
                    </td>
                    <td className="p-4 text-sm text-gray-900 font-mono text-right font-bold">
                      ₹{(ret.TotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-3 print:hidden opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {ret.Status !== 'Processed' && (
                        <button 
                          onClick={() => handleProcessDebitNote(ret)}
                          className="text-gray-400 hover:text-green-600 transition-colors" 
                          title="Process Debit Note (Post to Ledger)"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedReturn(ret)}
                        className="text-gray-400 hover:text-blue-600 transition-colors" 
                        title="View & Print Debit Note"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {hasPermission('/purchase', 'edit') && ret.Status !== 'Processed' && (
                        <button 
                          onClick={() => navigate(`/purchase/returns/${ret.Id || ret.id}`)}
                          className="text-gray-400 hover:text-amber-600 transition-colors" 
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('/purchase', 'delete') && (
                        <button 
                          onClick={() => handleDelete(ret.Id || ret.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors" 
                          title="Delete"
                        >
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
      </div>

      {/* DETAILED VIEW MODAL */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto flex items-center justify-center p-4 z-50 animate-fade-in print:bg-white print:static print:inset-auto print:overflow-visible print:p-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:rounded-none print:max-h-none print:w-full">
            {/* Modal Actions Header */}
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
              <h3 className="text-lg font-bold text-gray-900">Debit Note Details</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <button 
                  onClick={() => setSelectedReturn(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-white print:p-10 font-sans">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-rose-700 tracking-wider">DEBIT NOTE</h2>
                  <p className="text-sm font-semibold text-gray-600 mt-1 font-mono">
                    Note No: {selectedReturn.ReturnNumber || `PR-${selectedReturn.Id}`}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Date: {selectedReturn.ReturnDate ? formatDate(selectedReturn.ReturnDate) : ''}
                  </p>
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-bold text-gray-900 uppercase">{activeCompany?.name || 'Corporation Ltd'}</h1>
                  <p className="text-xs text-gray-500 mt-1 col-span-2">GSTIN: {activeCompany?.gstNumber || 'N/A'} | PAN: {activeCompany?.panNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="bg-slate-50/50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-500 uppercase tracking-wide text-xs mb-2">Debited To:</h4>
                  <p className="font-bold text-gray-900 text-base">{getVendorName(selectedReturn.VendorId)}</p>
                  <p className="text-gray-600 mt-1">Vendor Account Reference: VEN-{selectedReturn.VendorId}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-500 uppercase tracking-wide text-xs mb-2">Reference Info:</h4>
                  <table className="w-full text-left col-span-2 text-xs">
                    <tbody>
                      <tr>
                        <td className="py-1 font-semibold text-gray-500">Original Invoice No:</td>
                        <td className="py-1 text-right font-bold text-gray-900">{selectedReturn.OriginalInvoiceNumber || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-gray-500">Document Status:</td>
                        <td className="py-1 text-right font-black uppercase text-crimson-800">
                          <span className={`text-xs ml-auto ${selectedReturn.Status === 'Processed' ? 'text-green-600' : 'text-amber-600'}`}>
                            {selectedReturn.Status || 'Draft'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-gray-700 text-xs uppercase tracking-wide border-b-2 border-slate-300 font-bold">
                      <th className="p-3 border-r border-slate-300">Line Sl No.</th>
                      <th className="p-3 border-r border-slate-300">Item Specification</th>
                      <th className="p-3 border-r border-slate-300 text-center">Return Qty</th>
                      <th className="p-3 border-r border-slate-300 text-right">Rate (₹)</th>
                      <th className="p-3 text-right">Valuation (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {(() => {
                      try {
                        const items = JSON.parse(selectedReturn.ItemsData || '[]');
                        if (items.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-gray-500">No items specified.</td>
                            </tr>
                          );
                        }
                        return items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                            <td className="p-3 border-r border-slate-200">
                              <span className="font-semibold text-gray-900 block">{item.item}</span>
                              {item.reason && <span className="text-xs text-rose-600 font-medium block mt-0.5">Reason: {item.reason}</span>}
                            </td>
                            <td className="p-3 border-r border-slate-200 text-center font-mono">{item.qty}</td>
                            <td className="p-3 border-r border-slate-200 text-right font-mono">₹{parseFloat(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono font-bold text-gray-900">
                              ₹{(parseFloat(item.rate) * parseFloat(item.qty)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ));
                      } catch (err) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-red-500">Error rendering items list.</td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-800">
                      <td colSpan={4} className="p-3 text-right text-sm">Grand Valuation:</td>
                      <td className="p-3 text-right font-mono text-base font-black text-rose-700">
                        ₹{(selectedReturn.TotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedReturn.Remarks && (
                <div className="bg-slate-50 p-4 rounded-lg border border-gray-100 text-xs">
                  <h4 className="font-bold text-gray-500 uppercase mb-1">Remarks / Explanation:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReturn.Remarks}</p>
                </div>
              )}

              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-300 pt-3">
                  <div className="font-bold text-gray-700 uppercase">Received By (Authorized Signatory)</div>
                </div>
                <div className="border-t border-slate-300 pt-3 text-right pr-6">
                  <div className="font-bold text-gray-700 uppercase">Prepared By ({activeCompany?.name || 'Corporation Ltd'})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
