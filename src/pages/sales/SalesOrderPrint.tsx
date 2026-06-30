import { useAuth } from '../../context/AuthContext';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../lib/utils';

export function SalesOrderPrint() {
  const { hasPermission } = useAuth();
  const { id } = useParams();
  const { activeCompany } = useAppContext();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/data/SalesOrders`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const ord = Array.isArray(data) ? data.find((o: any) => o.Id == id) : null;
        if (!ord) throw new Error('Not found');
        setOrder(ord);
        
        // Fetch customer info
        if (ord.CustomerId) {
          const custRes = await fetch(`/api/data/Customers?CompanyId=${activeCompany.id}`);
          if (custRes.ok) {
            const customers = await custRes.json();
            const cust = Array.isArray(customers) ? customers.find((c: any) => c.Id == ord.CustomerId) : null;
            if (cust) setCustomer(cust);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id && activeCompany?.id) {
      fetchOrder();
    }
  }, [id, activeCompany?.id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found.</div>;

  let lines = [];
  try {
    lines = order.ItemsData ? JSON.parse(order.ItemsData) : [];
  } catch (e) {}

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full pb-12 print:pb-0 print:m-0 print:max-w-none print:w-full">
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
      <div className="print:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 flex items-center gap-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Order
        </button>
      </div>

      {/* Printable Area */}
      <div className="bg-white border border-gray-300 print:border-none p-8 sm:p-12 print:p-10 min-h-[1056px] print:min-h-0 print:h-[100vh] print:max-h-[100vh] print:overflow-hidden w-full mx-auto relative text-black text-sm box-border flex flex-col">
        {/* Header */}
        <div className="text-center border-b border-gray-300 pb-4 mb-6 relative min-h-[60px] flex items-center justify-center">
          {activeCompany?.LogoUrl && (
            <div className="absolute left-0 top-0 bottom-0 flex items-center pr-4">
              <img src={activeCompany.LogoUrl} alt="Logo" className="max-h-16 max-w-[200px] object-contain" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight uppercase">SALES ORDER</h1>
        </div>

        <div className="flex justify-between items-start mb-8 gap-8">
          {/* Company Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{activeCompany?.name || 'Your Company Name'}</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{activeCompany?.address || 'Company Address Line 1\nCity, State, ZIP'}</p>
          </div>
          
          {/* Order Meta */}
          <div className="flex-1 text-right">
            <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1 text-left inline-grid w-full max-w-[320px] ml-auto">
              <span className="font-semibold text-gray-600 border-r border-gray-300 mr-4">Order No:</span>
              <span className="font-bold whitespace-nowrap">{order.OrderNumber || 'N/A'}</span>
              
              <span className="font-semibold text-gray-600 border-r border-gray-300 mr-4 mt-2">Date:</span>
              <span className="mt-2">{formatDate(order.OrderDate)}</span>
            </div>
          </div>
        </div>

        {/* Billed To */}
        <div className="mb-8 border border-gray-300 rounded-md p-4 bg-gray-50 print:bg-transparent print:border-t print:border-b print:border-l-0 print:border-r-0 print:rounded-none">
          <h3 className="text-sm font-bold uppercase text-gray-700 mb-2 border-b border-gray-200 pb-1 inline-block">Billed To:</h3>
          <p className="font-bold text-lg">{customer?.CustomerName || 'Cash Sale'}</p>
          <p className="text-gray-600 mt-1 whitespace-pre-wrap">{customer?.Address || ''}</p>
        </div>

        {/* Items Table */}
        {(() => {
          let calculatedSubtotal = 0;
          let calculatedTax = 0;
          let calculatedDiscount = 0;

          lines.forEach((line: any) => {
            const gross = (line.qty || 1) * (line.rate || 0);
            const discAmount = gross * ((line.discount || 0) / 100);
            const taxAmount = (gross - discAmount) * ((line.gstRate || 0) / 100);
            
            calculatedSubtotal += (gross - discAmount);
            calculatedTax += taxAmount;
            calculatedDiscount += discAmount;
          });

          const grandTotalRaw = calculatedSubtotal + calculatedTax;
          const grandTotalRounded = Math.round(grandTotalRaw);
          const roundedOff = grandTotalRounded - grandTotalRaw;

          return (
            <>
              <table className="w-full mb-8 border-collapse">
                <thead>
                  <tr className="border-y border-gray-300 bg-gray-50 print:bg-transparent">
                    <th className="py-3 px-2 text-left font-bold w-12 border-x border-gray-300">#</th>
                    <th className="py-3 px-2 text-left font-bold border-x border-gray-300">Item Description</th>
                    <th className="py-3 px-2 text-center font-bold w-24 border-x border-gray-300">HSN/SAC</th>
                    <th className="py-3 px-2 text-right font-bold w-20 border-x border-gray-300">Qty</th>
                    <th className="py-3 px-2 text-right font-bold w-28 border-x border-gray-300">Rate (₹)</th>
                    <th className="py-3 px-2 text-right font-bold w-24 border-x border-gray-300">Disc %</th>
                    <th className="py-3 px-2 text-right font-bold w-24 border-x border-gray-300">GST %</th>
                    <th className="py-3 px-2 text-right font-bold w-32 border-x border-gray-300">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line: any, index: number) => {
                    const gross = (line.qty || 1) * (line.rate || 0);
                    const discAmount = gross * ((line.discount || 0) / 100);
                    const taxAmount = (gross - discAmount) * ((line.gstRate || 0) / 100);
                    const totalAmount = (gross - discAmount) + taxAmount;
                    
                    return (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-3 px-2 text-left border-x border-gray-300">{index + 1}</td>
                        <td className="py-3 px-2 text-left border-x border-gray-300">{line.item || 'Item'}</td>
                        <td className="py-3 px-2 text-center border-x border-gray-300">{line.hsn || '-'}</td>
                        <td className="py-3 px-2 text-right border-x border-gray-300">{line.qty || 0}</td>
                        <td className="py-3 px-2 text-right border-x border-gray-300">{(line.rate || 0).toFixed(2)}</td>
                        <td className="py-3 px-2 text-right border-x border-gray-300">{line.discount ? line.discount + '%' : '-'}</td>
                        <td className="py-3 px-2 text-right border-x border-gray-300">{line.gstRate ? line.gstRate + '%' : '-'}</td>
                        <td className="py-3 px-2 text-right font-medium border-x border-gray-300">{totalAmount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Gross Subtotal:</span>
                    <span className="font-bold">
                      {(calculatedSubtotal + calculatedDiscount).toFixed(2)}
                    </span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <>
                      <div className="flex justify-between py-2 border-b border-gray-200 text-green-700">
                        <span className="font-medium">Total Discount:</span>
                        <span className="font-bold">
                          -{calculatedDiscount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Taxable Subtotal:</span>
                        <span className="font-bold">
                          {calculatedSubtotal.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Tax/GST:</span>
                    <span className="font-bold">
                      {calculatedTax.toFixed(2)}
                    </span>
                  </div>
                  {Math.abs(roundedOff) > 0.001 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Rounded Off:</span>
                      <span className="font-bold">
                        {roundedOff.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-b-2 border-gray-800 text-lg">
                    <span className="font-bold">Total (₹):</span>
                    <span className="font-bold">{grandTotalRounded.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Terms & Conditions */}
        {order.TermsAndConditions && (
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase text-gray-700 mb-2 border-b border-gray-200 pb-1 inline-block">Terms & Conditions:</h3>
            <div className="text-gray-600 space-y-1 text-xs whitespace-pre-wrap">{order.TermsAndConditions}</div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-auto w-full text-center text-xs text-gray-500 print:block pt-8">
          <p>Thank you for your business.</p>
        </div>
      </div>
    </div>
  );
}
