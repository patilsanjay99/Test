import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../lib/utils';

export function SalesReturnPrint() {
  const { id } = useParams();
  const { activeCompany } = useAppContext();
  const navigate = useNavigate();

  const [salesReturn, setSalesReturn] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturnDetails = async () => {
      try {
        const res = await fetch(`/api/v1/data/SalesReturns/${id}`);
        if (!res.ok) throw new Error('Return document not found');
        const data = await res.json();
        setSalesReturn(data);
        
        if (data.CustomerId) {
          const custRes = await fetch(`/api/v1/data/Customers/${data.CustomerId}`);
          if (custRes.ok) {
            setCustomer(await custRes.json());
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchReturnDetails();
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-sans">Loading credit note details...</div>;
  if (!salesReturn) return <div className="p-8 text-center text-red-500 font-sans">Sales Return / Credit Note not found.</div>;

  let lines = [];
  try {
    lines = salesReturn.ItemsData ? JSON.parse(salesReturn.ItemsData) : [];
  } catch (e) {
    console.error("Error parsing items", e);
  }

  if (lines.length === 0 && salesReturn.TotalAmount) {
    lines = [{ id: '1', item: 'Returned Goods - Details in original invoice', qty: 1, rate: salesReturn.TotalAmount, reason: salesReturn.Remarks || 'N/A' }];
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full pb-12 print:pb-0 print:m-0 print:max-w-none print:w-full select-none font-sans">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      
      {/* Controls - Hidden during print */}
      <div className="print:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-4">
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 flex items-center gap-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print Credit Note
        </button>
      </div>

      {/* Printable Area */}
      <div className="bg-white border border-gray-300 print:border-none p-8 sm:p-12 print:p-10 min-h-[1056px] print:min-h-0 print:h-[100vh] print:max-h-[100vh] print:overflow-hidden w-full mx-auto relative text-black text-sm box-border flex flex-col">
        {/* Header */}
        <div className="text-center border-b border-gray-300 pb-4 mb-6 relative min-h-[60px] flex items-center justify-center flex-col">
          {activeCompany?.LogoUrl && (
            <div className="absolute left-0 top-0 bottom-0 flex items-center pr-4">
              <img src={activeCompany.LogoUrl} alt="Logo" className="max-h-16 max-w-[200px] object-contain" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight uppercase text-rose-700">CREDIT NOTE</h1>
          <p className="text-xs text-gray-500 uppercase font-semibold">Issued on receipt of returned goods</p>
        </div>

        <div className="flex justify-between items-start mb-8 gap-8">
          {/* Company Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1 text-slate-800">{activeCompany?.name || 'Your Company Name'}</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{activeCompany?.address || 'Company Address'}</p>
            {activeCompany?.gstNumber && <p className="mt-2"><span className="font-semibold">GSTIN:</span> {activeCompany.gstNumber}</p>}
            {activeCompany?.panNumber && <p><span className="font-semibold">PAN:</span> {activeCompany.panNumber}</p>}
          </div>
          
          {/* Return Document Meta */}
          <div className="flex-1 text-right">
            <div className="grid grid-cols-[140px_1fr] gap-y-1 gap-x-4 text-left inline-grid w-full max-w-[340px] ml-auto pb-4">
              <span className="font-semibold text-gray-600 border-r border-gray-300 pr-2">Credit Note No:</span>
              <span className="font-bold text-slate-800 whitespace-nowrap">{salesReturn.ReturnNumber || 'DRAFT'}</span>
              
              <span className="font-semibold text-gray-600 border-r border-gray-300 pr-2 pt-1">Return Date:</span>
              <span className="pt-1">{formatDate(salesReturn.ReturnDate)}</span>

              {salesReturn.OriginalInvoiceNumber && (
                <>
                  <span className="font-semibold text-gray-600 border-r border-gray-300 pr-2 pt-1">Original Invoice:</span>
                  <span className="pt-1 text-rose-600 font-bold">{salesReturn.OriginalInvoiceNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-8 border border-gray-300 rounded-md p-4 bg-gray-50 print:bg-transparent print:border-t print:border-b print:border-l-0 print:border-r-0 print:rounded-none">
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2">Customer Details:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-base text-slate-800">{customer?.CustomerName || customer?.Customer_NAME || customer?.Name || 'Walk-in Customer'}</p>
              {customer?.Address && <p className="text-gray-600 whitespace-pre-wrap mt-1">{customer.Address}</p>}
            </div>
            <div className="md:text-right">
              {(customer?.GSTINNo || customer?.GSTIN) && <p><span className="font-semibold text-gray-600">GSTIN:</span> {customer?.GSTINNo || customer?.GSTIN}</p>}
              {(customer?.PANNo || customer?.PAN) && <p><span className="font-semibold text-gray-600">PAN:</span> {customer?.PANNo || customer?.PAN}</p>}
              {(customer?.PhoneNo || customer?.ContactNo) && <p><span className="font-semibold text-gray-600">Tel:</span> {customer?.PhoneNo || customer?.ContactNo}</p>}
            </div>
          </div>
        </div>

        {/* Table representation */}
        <div className="flex-1">
          <table className="w-full text-left border border-gray-300 rounded overflow-hidden">
            <thead>
              <tr className="bg-slate-100 border-b border-gray-300 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="p-3">#</th>
                <th className="p-3">Returned Item Description</th>
                <th className="p-3">Return Reason</th>
                <th className="p-3 text-right">Return Qty</th>
                <th className="p-3 text-right">Rate (₹)</th>
                <th className="p-3 text-right">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lines.map((line: any, idx: number) => {
                const total = (line.qty || 0) * (line.rate || 0);
                return (
                  <tr key={line.id || idx} className="hover:bg-slate-50">
                    <td className="p-3 text-gray-500 font-mono">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-800">{line.item}</td>
                    <td className="p-3 text-gray-600 text-xs">{line.reason || salesReturn.Remarks || 'No specified damage'}</td>
                    <td className="p-3 text-right font-mono font-medium">{line.qty}</td>
                    <td className="p-3 text-right font-mono">₹{parseFloat(line.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono font-bold">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Totals */}
        <div className="mt-8 flex justify-between items-start pt-6 border-t border-gray-300 gap-8">
          <div className="flex-1">
            <h4 className="font-bold text-gray-700 text-xs uppercase mb-1">Remarks & Declarations:</h4>
            <p className="text-gray-500 text-xs leading-relaxed max-w-md">
              {salesReturn.Remarks || "This credit note constitutes a formal acknowledgement of returned merchandise and associated account credit. This document represents a double-entry balance adjustment in the company's ledger."}
            </p>
          </div>
          <div className="w-80">
            <div className="border border-gray-300 rounded-md p-4 bg-slate-50 print:bg-transparent">
              <div className="flex justify-between items-center text-sm font-bold text-rose-800">
                <span>Credit Value (INR):</span>
                <span className="text-lg font-black font-mono">
                  ₹{(salesReturn.TotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-16 flex justify-between items-center px-4">
          <div className="text-center w-48">
            <div className="border-b border-gray-400 h-12 w-full"></div>
            <p className="text-xs text-gray-500 mt-2 font-semibold uppercase">Customer Sig.</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-gray-400 h-12 w-full"></div>
            <p className="text-xs text-gray-500 mt-2 font-semibold uppercase">Authorized Officer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
