import { useAuth } from '../../context/AuthContext';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../lib/utils';

export function PurchaseOrderPrint() {
  const { hasPermission } = useAuth();
  const { id } = useParams();
  const { activeCompany } = useAppContext();
  const companyRec = activeCompany as any;
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/v1/data/PurchaseOrders`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const ord = Array.isArray(data) ? data.find((o: any) => {
          const matchedId = o.Id || o.id || o.ID;
          return String(matchedId) === String(id);
        }) : null;
        
        if (!ord) throw new Error('Not found');
        setOrder(ord);
        
        // Fetch vendor info
        if (ord.VendorId) {
          const vendRes = await fetch(`/api/v1/data/Vendors?CompanyId=${companyRec?.id || ''}`);
          if (vendRes.ok) {
            const vendorsList = await vendRes.json();
            const vend = Array.isArray(vendorsList) ? vendorsList.find((v: any) => {
              const vId = v.Vendor_ID || v.id || v.Id || v.ID;
              return String(vId) === String(ord.VendorId);
            }) : null;
            if (vend) setVendor(vend);
          }
        }
      } catch (err) {
        console.error("Error fetching purchase order details for printing", err);
      } finally {
        setLoading(false);
      }
    };
    if (id && companyRec?.id) {
      fetchOrder();
    }
  }, [id, companyRec?.id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading purchase order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Purchase Order not found.</div>;

  let lines: any[] = [];
  try {
    lines = order.ItemsData ? JSON.parse(order.ItemsData) : [];
  } catch (e) {
    console.error("Error parsing items data", e);
  }

  const handlePrint = () => {
    window.print();
  };

  // Compute total tax, taxable subtotal
  let taxableSubtotal = 0;
  let totalGstAmount = 0;
  let computedGrandTotal = 0;

  lines.forEach((line: any) => {
    const qty = parseFloat(line.qty) || 0;
    const rate = parseFloat(line.rate) || 0;
    const discountPercent = parseFloat(line.discount) || 0;
    const gstRatePercent = parseFloat(line.gstRate) || 0;

    const gross = qty * rate;
    const discount = (gross * discountPercent) / 100;
    const taxable = gross - discount;
    const gst = (taxable * gstRatePercent) / 100;

    taxableSubtotal += taxable;
    totalGstAmount += gst;
  });
  computedGrandTotal = taxableSubtotal + totalGstAmount;

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full pb-12 print:pb-0 print:m-0 print:max-w-none print:w-full">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: white !important;
          }
          .print-no-border {
             border: none !important;
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
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Purchase Order
        </button>
      </div>

      {/* Printable Area */}
      <div className="bg-white border border-gray-300 print:border-none p-8 sm:p-12 print:p-0 min-h-[1056px] print:min-h-0 w-full mx-auto relative text-black text-sm box-border flex flex-col">
        {/* Header Ribbon / Border */}
        <div className="border-b-4 border-green-700 pb-4 mb-6 flex justify-between items-end relative">
          <div className="flex items-center gap-4">
            {activeCompany?.LogoUrl && (
              <img src={activeCompany.LogoUrl} alt="Logo" className="max-h-16 max-w-[200px] object-contain" />
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-green-800 uppercase">PURCHASE ORDER</h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Authorized Procurements & Order Form</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">{companyRec?.name || 'Your Company Name'}</h2>
            <p className="text-xs text-gray-500">GSTIN: {companyRec?.GSTIN || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Company Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2 border-b border-green-100 pb-1">Issued By:</h3>
            <p className="font-bold text-base text-gray-900">{companyRec?.name || 'Your Company Name'}</p>
            {companyRec?.address && (
              <p className="text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{companyRec.address}</p>
            )}
            <div className="mt-2 space-y-0.5 text-xs text-gray-500">
              {companyRec?.PhoneNo && <p>Phone: {companyRec.PhoneNo}</p>}
              {companyRec?.EmailID && <p>Email: {companyRec.EmailID}</p>}
              {companyRec?.CINNo && <p>CIN: {companyRec.CINNo}</p>}
              {companyRec?.PAN && <p>PAN: {companyRec.PAN}</p>}
            </div>
          </div>
          
          {/* Purchase Order Details */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 print:bg-transparent print:border-none print:p-0 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2 border-b border-green-100 pb-1">PO Details:</h3>
              <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1.5 text-sm">
                <span className="font-semibold text-gray-500">PO Number:</span>
                <span className="font-bold text-green-800 font-mono">{order.OrderNumber || order.id || 'N/A'}</span>
                
                <span className="font-semibold text-gray-500">Order Date:</span>
                <span className="font-medium">{formatDate(order.OrderDate || order.poDate)}</span>

                <span className="font-semibold text-gray-500">Required By:</span>
                <span className="font-medium">{order.RequiredByDate ? formatDate(order.RequiredByDate) : 'Immediate'}</span>

                <span className="font-semibold text-gray-500">PO Status:</span>
                <span>
                  <span className="font-bold uppercase text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 print:border print:border-amber-800">
                    {order.Status || 'Pending'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor/Supplier Details */}
        <div className="mb-8 border border-gray-200 rounded-lg p-5 bg-slate-50/50 print:bg-transparent print:border-l-0 print:border-r-0 print:rounded-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2 border-b border-green-100 pb-1 inline-block">Vendor / Supplier:</h3>
          <p className="font-bold text-lg text-gray-900">{vendor?.Vendor_NAME || order.VendorName || 'N/A'}</p>
          <p className="text-gray-650 mt-1 whitespace-pre-wrap leading-relaxed">
            {vendor?.Vendor_address || 'Address not listed'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-3 pt-3 border-t border-gray-200/50 text-xs text-gray-500">
            <div>
              {vendor?.contact_person && <p><strong className="text-gray-700">Contact Person:</strong> {vendor.contact_person}</p>}
              {vendor?.phone_no && <p><strong className="text-gray-700">Phone:</strong> {vendor.phone_no}</p>}
              {vendor?.email_id && <p><strong className="text-gray-700">Email:</strong> {vendor.email_id}</p>}
            </div>
            <div>
              {vendor?.GSTIN && <p><strong className="text-gray-700">GSTIN:</strong> <span className="font-mono">{vendor.GSTIN}</span></p>}
              {vendor?.pan_no && <p><strong className="text-gray-700">PAN No:</strong> <span className="font-mono">{vendor.pan_no}</span></p>}
              {vendor?.state_code && <p><strong className="text-gray-700">State / Code:</strong> {vendor.state_name || ''} ({vendor.state_code})</p>}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="flex-1">
          <table className="w-full mb-8 border-collapse">
            <thead>
              <tr className="border-y-2 border-green-800 bg-green-50/50 print:bg-transparent">
                <th className="py-2.5 px-2 text-left font-bold w-12 text-green-900 border-b border-green-800">#</th>
                <th className="py-2.5 px-2 text-left font-bold text-green-900 border-b border-green-800">Item Name & Description</th>
                <th className="py-2.5 px-2 text-center font-bold w-24 text-green-900 border-b border-green-800">HSN/SAC</th>
                <th className="py-2.5 px-2 text-right font-bold w-20 text-green-900 border-b border-green-800">Qty</th>
                <th className="py-2.5 px-2 text-right font-bold w-28 text-green-900 border-b border-green-800">Rate (₹)</th>
                <th className="py-2.5 px-2 text-right font-bold w-20 text-green-900 border-b border-green-800">GST %</th>
                <th className="py-2.5 px-2 text-right font-bold w-32 text-green-900 border-b border-green-800">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line: any, index: number) => {
                const qty = parseFloat(line.qty) || 0;
                const rate = parseFloat(line.rate) || 0;
                const discountPercent = parseFloat(line.discount) || 0;
                const gstRatePercent = parseFloat(line.gstRate) || 0;

                const gross = qty * rate;
                const discount = (gross * discountPercent) / 100;
                const taxable = gross - discount;
                const gst = (taxable * gstRatePercent) / 100;
                const totalItemAmount = taxable + gst;

                return (
                  <tr key={line.id || index} className="border-b border-gray-200">
                    <td className="py-3 px-2 text-left text-gray-600 font-mono">{index + 1}</td>
                    <td className="py-3 px-2 text-left">
                      <div className="font-bold text-gray-900">{line.item || 'Item'}</div>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600 font-mono">{line.hsn || '-'}</td>
                    <td className="py-3 px-2 text-right font-semibold font-mono">{qty}</td>
                    <td className="py-3 px-2 text-right font-mono">{rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-2 text-right text-gray-600 font-mono">{gstRatePercent}%</td>
                    <td className="py-3 px-2 text-right font-bold font-mono">
                      {totalItemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Computations and grand totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-1.5 border-t border-gray-300 pt-3">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Taxable Amount (₹):</span>
                <span className="font-mono">{taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>GST Outflow (₹):</span>
                <span className="font-mono">{totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-green-800 text-lg bg-green-50/50 px-2 rounded print:p-0 print:bg-transparent">
                <span className="font-bold text-green-900">Grand Total:</span>
                <span className="font-black text-green-800 font-mono">
                  ₹{computedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions Section */}
        {order.Terms && (
          <div className="mb-8 border border-green-200 rounded-lg p-4 bg-emerald-50/20 print:border-none print:p-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-2 border-b border-green-100 pb-1">Terms & Conditions / Guidelines:</h3>
            <div className="text-gray-700 text-xs whitespace-pre-wrap leading-relaxed font-sans">{order.Terms}</div>
          </div>
        )}

        {/* Remarks Section */}
        {order.Remarks && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Remarks / Notes:</h3>
            <p className="text-gray-700 text-xs italic">{order.Remarks}</p>
          </div>
        )}

        {/* Signatures Area */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <div className="flex justify-between items-center text-center">
            <div className="w-48">
              <div className="border-b border-gray-300 h-12"></div>
              <p className="text-xs font-medium text-gray-500 mt-2">Prepared By</p>
            </div>
            <div className="w-48">
              <div className="border-b border-gray-300 h-12"></div>
              <p className="text-xs font-medium text-gray-500 mt-2">Checked By</p>
            </div>
            <div className="w-48">
              <div className="border-b border-green-700 h-12"></div>
              <p className="text-xs font-bold text-green-800 mt-2 font-sans uppercase">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer info (only layout page count etc.) */}
        <div className="mt-auto pt-8 w-full text-center text-xs text-gray-400">
          <p>This is a computer-generated document, requiring authorized execution where specified.</p>
        </div>
      </div>
    </div>
  );
}
