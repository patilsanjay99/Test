import { useAuth } from '../../context/AuthContext';
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../lib/utils';

export function InvoicePrint() {
  const { hasPermission } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'sales';
  const { activeCompany } = useAppContext();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const table = type === 'sales' ? 'SalesInvoices' : 'PurchaseInvoices';
        const res = await fetch(`/api/v1/data/${table}/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setInvoice(data);
        
        // Fetch customer or vendor info
        if (data.CustomerId) {
          const custRes = await fetch(`/api/v1/data/Customers/${data.CustomerId}`);
          if (custRes.ok) {
            setCustomer(await custRes.json());
          }
        } else if (data.VendorId) {
          const venRes = await fetch(`/api/v1/data/Accounts/${data.VendorId}`);
          if (venRes.ok) {
            setCustomer(await venRes.json());
          }
        }
      } catch (err) {
        console.error(err);
        if (type === 'purchase') {
          // Fallback mocked data for Purchase Invoices since they are frontend only
          setInvoice({
            InvoiceNumber: id,
            InvoiceDate: new Date().toLocaleDateString('en-GB'),
            TotalAmount: 125000,
            Status: 'Pending'
          });
          setCustomer({ CustomerName: 'Mock Vendor / Supplier' });
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchInvoice();
    }
  }, [id, type]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading invoice details...</div>;
  if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found.</div>;

  let lines = [];
  try {
    lines = invoice.ItemsData ? JSON.parse(invoice.ItemsData) : [];
  } catch (e) {}

  if (lines.length === 0 && invoice.TotalAmount) {
     lines = [{ id: 1, item: 'General Goods/Services', hsn: '', qty: 1, rate: invoice.TotalAmount, discount: 0, gstRate: 0 }];
  }

  const handlePrint = () => {
    window.print();
  };

  const invoiceTitle = type === 'sales' ? 'TAX INVOICE' : 'PURCHASE INVOICE';
  const partyTitle = type === 'sales' ? 'Billed To:' : 'Billed By:';

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
          <Printer className="w-4 h-4" /> Print Invoice
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
          <h1 className="text-2xl font-bold tracking-tight uppercase">{invoiceTitle}</h1>
        </div>

        <div className="flex justify-between items-start mb-8 gap-8">
          {/* Company Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{activeCompany?.name || 'Your Company Name'}</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{activeCompany?.address || 'Company Address Line 1\nCity, State, ZIP'}</p>
            {activeCompany?.gstNumber && <p className="mt-2"><span className="font-semibold">GSTIN:</span> {activeCompany.gstNumber}</p>}
            {activeCompany?.panNumber && <p><span className="font-semibold">PAN:</span> {activeCompany.panNumber}</p>}
          </div>
          
          {/* Invoice Meta */}
          <div className="flex-1 text-right">
            <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1 text-left inline-grid w-full max-w-[320px] ml-auto">
              <span className="font-semibold text-gray-600 border-r border-gray-300 mr-4">Invoice No:</span>
              <span className="font-bold whitespace-nowrap">{invoice.InvoiceNumber || invoice.BillNumber || 'N/A'}</span>
              
              <span className="font-semibold text-gray-600 border-r border-gray-300 mr-4 mt-2">Date:</span>
              <span className="mt-2">{formatDate(invoice.InvoiceDate || invoice.BillDate)}</span>
            </div>
          </div>
        </div>

        {/* Billed To */}
        <div className="mb-8 border border-gray-300 rounded-md p-4 bg-gray-50 print:bg-transparent print:border-t print:border-b print:border-l-0 print:border-r-0 print:rounded-none">
          <h3 className="text-sm font-bold uppercase text-gray-700 mb-2 border-b border-gray-200 pb-1 inline-block">{partyTitle}</h3>
          <p className="font-bold text-lg">{customer?.CustomerName || customer?.Name || 'Cash Sale'}</p>
          <p className="text-gray-600 mt-1 whitespace-pre-wrap">{customer?.Address || ''}</p>
          {(customer?.RegistrationNo || customer?.GSTIN) && <p className="mt-2"><span className="font-semibold">GSTIN:</span> {customer?.RegistrationNo || customer?.GSTIN}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="border-y border-gray-300 bg-gray-50 print:bg-transparent">
              <th className="py-3 px-2 text-left font-bold w-12 border-x border-gray-300">#</th>
              <th className="py-3 px-2 text-left font-bold border-x border-gray-300">Item Description</th>
              <th className="py-3 px-2 text-center font-bold w-24 border-x border-gray-300">HSN/SAC</th>
              <th className="py-3 px-2 text-right font-bold w-20 border-x border-gray-300">Qty</th>
              <th className="py-3 px-2 text-right font-bold w-28 border-x border-gray-300">Rate (₹)</th>
              <th className="py-3 px-2 text-right font-bold w-24 border-x border-gray-300">Discount</th>
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
                  <td className="py-3 px-2 text-left border-x border-gray-300">
                    <div>{line.item || 'Item'}</div>
                    {line.moisture ? (
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        Moisture: {line.moisture}%
                      </div>
                    ) : null}
                  </td>
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
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Subtotal:</span>
              <span className="font-bold">
                {invoice.TotalAmount ? (invoice.TotalAmount * 0.82).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Tax/GST:</span>
              <span className="font-bold">
                {invoice.TotalAmount ? (invoice.TotalAmount * 0.18).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b-2 border-gray-800 text-lg">
              <span className="font-bold">Total (₹):</span>
              <span className="font-bold">{invoice.TotalAmount ? Number(invoice.TotalAmount).toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        {activeCompany?.defaultSalesInvoiceTerms && (
          <div className="mt-8 mb-4">
            <h3 className="text-sm font-bold uppercase text-gray-700 mb-1.5 border-b border-gray-200 pb-0.5 inline-block">Terms & Conditions:</h3>
            <div className="text-gray-600 space-y-1 text-xs whitespace-pre-wrap">{activeCompany.defaultSalesInvoiceTerms}</div>
          </div>
        )}
        
        {/* Signatures */}
        <div className="mt-20 flex justify-between px-8">
          <div className="text-center">
            <div className="w-48 border-t border-gray-400 pt-2 font-medium">Customer Authorization</div>
            <p className="text-xs text-gray-500 mt-1">Sign & Stamp</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-gray-400 pt-2 font-medium text-right">For {activeCompany?.name || 'Company'}</div>
            <p className="text-xs text-gray-500 mt-1 text-right">Authorized Signatory</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto w-full text-center text-xs text-gray-500 print:block pt-8">
          <p>Thank you for your business.</p>
          <p>This is a computer-generated invoice.</p>
        </div>
      </div>
    </div>
  );
}
