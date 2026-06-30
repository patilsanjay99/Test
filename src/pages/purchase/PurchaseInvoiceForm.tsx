import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { formatDateForInput } from '../../lib/utils';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { AutocompleteCombobox } from '../../components/AutocompleteCombobox';

interface InvoiceLine {
  id: string;
  item: string;
  itemId?: number;
  locationId?: number | string;
  hsn: string;
  qty: number;
  rate: number;
  discount: number;
  gstRate: number;
  moisture?: string | number;
  unit?: string;
}

export function PurchaseInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { activeCompany, activeFinancialYear } = useAppContext();
  
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [vendorBillNo, setVendorBillNo] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [lines, setLines] = useState<InvoiceLine[]>([
    { id: '1', item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18, moisture: '', unit: '' }
  ]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/Vendors?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/data/locations?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => [])
    ]).then(([invItems, vends, locs]) => {
      setInventoryItems(Array.isArray(invItems) ? invItems : []);
      setVendors(Array.isArray(vends) ? vends : []);
      setLocations(Array.isArray(locs) ? locs : []);
    }).catch(console.error);
  }, [activeCompany?.id]);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      fetch(`/api/v1/data/PurchaseInvoices/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSelectedVendorId(String(data.VendorId || ''));
            setVendorBillNo(data.VendorBillNo || '');
            setInvoiceDate(formatDateForInput(data.InvoiceDate || ''));
            setRemarks(data.Remarks || '');
            if (data.ItemsData) {
              try {
                const parsed = JSON.parse(data.ItemsData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setLines(parsed);
                }
              } catch (e) {
                console.error("Failed to parse items data");
              }
            }
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch invoice", err);
          setLoading(false);
        });
    }
  }, [id, isEditing]);

  useEffect(() => {
    const fromPo = new URLSearchParams(window.location.search).get('fromPo');
    if (fromPo && !isEditing) {
      setLoading(true);
      fetch(`/api/v1/data/PurchaseOrders/${fromPo}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSelectedVendorId(String(data.VendorId || ''));
            setRemarks(`Converted from Purchase Order: ${data.OrderNumber || ''}. ${data.Remarks || ''}`);
            if (data.ItemsData) {
              try {
                const parsed = JSON.parse(data.ItemsData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // Re-map IDs to prevent duplicate keys
                  const mapped = parsed.map((item: any) => ({
                    ...item,
                    id: Math.random().toString()
                  }));
                  setLines(mapped);
                }
              } catch (e) {
                console.error("Failed to parse items data");
              }
            }
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch purchase order", err);
          setLoading(false);
        });
    }
  }, [isEditing]);

  const getGstRateForItem = (item: any, vendorId: string) => {
    if (!item) return 18;
    const selVend = vendors.find(v => String(v.Vendor_ID || v.Id || v.id) === String(vendorId));
    const compState = String(activeCompany?.StateCode || '').trim().toLowerCase();
    const vendState = selVend ? String(selVend.state_code || selVend.StateCode || selVend.stateCode || '').trim().toLowerCase() : '';
    const isWithinState = !selVend || !activeCompany || (compState === vendState);

    if (isWithinState) {
      const sgst = item.SGST !== undefined && item.SGST !== null ? Number(item.SGST) : (item.sgst !== undefined && item.sgst !== null ? Number(item.sgst) : 0);
      const cgst = item.CGST !== undefined && item.CGST !== null ? Number(item.CGST) : (item.cgst !== undefined && item.cgst !== null ? Number(item.cgst) : 0);
      return sgst + cgst;
    } else {
      const igst = item.IGST !== undefined && item.IGST !== null ? Number(item.IGST) : (item.igst !== undefined && item.igst !== null ? Number(item.igst) : 0);
      return igst;
    }
  };

  useEffect(() => {
    if (!selectedVendorId || vendors.length === 0 || inventoryItems.length === 0) return;
    setLines(prevLines => {
      let changed = false;
      const updated = prevLines.map(line => {
        if (!line.itemId) return line;
        const matchedItem = inventoryItems.find(item => String(item.Id || item.id || item.ID) === String(line.itemId));
        if (matchedItem) {
          const newGst = getGstRateForItem(matchedItem, selectedVendorId);
          const matchedUnit = matchedItem.Unit || matchedItem.unit || '';
          if (line.gstRate !== newGst || line.unit !== matchedUnit) {
            changed = true;
            return { ...line, gstRate: newGst, unit: matchedUnit };
          }
        }
        return line;
      });
      return changed ? updated : prevLines;
    });
  }, [selectedVendorId, vendors, inventoryItems, activeCompany?.StateCode]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18, moisture: '', unit: '' }]);
  };

  const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const selectItem = (id: string, item: any) => {
    const buyingRate = item.BuyingPrice !== undefined && item.BuyingPrice !== null ? Number(item.BuyingPrice) : (item.buyingprice !== undefined && item.buyingprice !== null ? Number(item.buyingprice) : (item.UnitPrice || item.unitPrice || 0));
    const gstRate = getGstRateForItem(item, selectedVendorId);
    setLines(lines.map(l => l.id === id ? { 
      ...l, 
      item: item.Name || item.name, 
      itemId: item.Id || item.id || item.ID,
      rate: buyingRate,
      gstRate: gstRate,
      hsn: item.ItemCode || item.itemCode || '',
      moisture: '',
      unit: item.Unit || item.unit || ''
    } : l));
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    lines.forEach(line => {
      const gross = line.qty * line.rate;
      const discount = (gross * line.discount) / 100;
      const taxable = gross - discount;
      const gst = (taxable * line.gstRate) / 100;

      subtotal += taxable;
      totalDiscount += discount;
      totalGst += gst;
    });

    const rawGrandTotal = subtotal + totalGst;
    const grandTotal = Math.round(rawGrandTotal);
    const roundedOff = grandTotal - rawGrandTotal;

    return { subtotal, totalDiscount, totalGst, grandTotal, roundedOff };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    if (!selectedVendorId) return alert("Please select a vendor.");
    try {
      setSaving(true);
      const selVend = vendors.find(v => String(v.Vendor_ID) === String(selectedVendorId));
      const vendorName = selVend ? selVend.Vendor_NAME : '';

      const payload = {
        CompanyId: activeCompany?.id || null,
        VendorId: selectedVendorId,
        VendorName: vendorName,
        VendorBillNo: vendorBillNo,
        InvoiceDate: invoiceDate,
        TotalAmount: totals.grandTotal,
        Status: 'Paid', // or Pending based on logic
        Remarks: remarks,
        ItemsData: JSON.stringify(lines),
        FinancialYearId: activeFinancialYear?.id || null
      };

      const url = isEditing ? `/api/data/PurchaseInvoices/${id}` : '/api/data/PurchaseInvoices';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save invoice");
      }

      navigate('/purchase/invoices');
    } catch(e: any) {
      alert(e.message || "Failed to save invoice.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Invoice Data...</div>;
  }

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/purchase/invoices')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Edit' : 'Book'} Purchase Invoice</h1>
            <p className="text-sm text-gray-500 mt-1">{isEditing ? 'Edit existing' : 'Book a'} vendor bill into the system.</p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> PURCHASE INVOICE MASTER
        </div>

        {/* Section 1: General Info */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Invoice General Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Vendor Name <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <AutocompleteCombobox
                    options={vendors.map(v => ({
                      value: String(v.Vendor_ID || v.id || ''),
                      label: `${v.Vendor_NAME || ''}${v.registration_no ? ` (${v.registration_no})` : ''}`,
                      sublabel: v.Vendor_address || v.Address || undefined
                    }))}
                    value={selectedVendorId}
                    onChange={setSelectedVendorId}
                    placeholder="Search/Select Vendor..."
                    required={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Vendor Bill No <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input required value={vendorBillNo} onChange={e => setVendorBillNo(e.target.value)} type="text" placeholder="e.g. INV-10023" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Bill Date <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <div className="w-full max-w-[180px]">
                    <CustomDatePicker required value={invoiceDate} onChange={setInvoiceDate} className="w-full font-mono !py-1" />
                  </div>
                </div>
              </div>
              
              {/* Safe Alignment Row for Right Column matching Left Column Row Height */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch bg-[#f1f5f9]">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Financial Year
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <span className="inline-block bg-[#cbd5e1]/40 border border-[#8faad8] rounded px-3 py-1 font-mono text-xs font-bold text-slate-700 tracking-wide select-none">
                    {activeFinancialYear?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Lines Details */}
        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            II. Line Item Specifications
          </div>

          <div className="p-4 bg-white overflow-x-auto">
            <div className="border border-[#8faad8] rounded overflow-hidden min-w-[1000px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-gray-800 text-xs font-bold uppercase tracking-wider border-b border-blue-900">
                    <th className="p-3 w-96 border-r border-blue-900">Item Details</th>
                    <th className="p-3 w-28 border-r border-blue-900 text-center">Moisture %</th>
                    <th className="p-3 w-56 border-r border-blue-900">Location</th>
                    <th className="p-3 w-32 text-center border-r border-blue-900">Qty</th>
                    <th className="p-3 w-20 text-center border-r border-blue-900">Unit</th>
                    <th className="p-3 w-28 text-right border-r border-blue-900">Rate (₹)</th>
                    <th className="p-3 w-20 text-right border-r border-blue-900">Disc (%)</th>
                    <th className="p-3 w-24 text-center border-r border-blue-900">GST (%)</th>
                    <th className="p-3 w-32 text-right border-r border-blue-900">Total Amt</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8faad8]">
                  {lines.map((line) => {
                    const taxable = (line.qty * line.rate) * (1 - line.discount / 100);
                    const total = taxable * (1 + line.gstRate / 100);
                    
                    return (
                      <tr key={line.id} className="bg-white hover:bg-slate-50">
                        <td className="p-2 w-96 border-r border-blue-900">
                          <AutocompleteCombobox
                            options={inventoryItems.map(item => ({
                              value: String(item.Name || item.name || ''),
                              label: item.Name || item.name || '',
                              sublabel: item.Code || item.ItemCode ? `Code: ${item.Code || item.ItemCode}` : undefined
                            }))}
                            value={line.item}
                            onChange={(val) => {
                              updateLine(line.id, 'item', val);
                              const item = inventoryItems.find(i => (i.Name || i.name) === val);
                              if (item) {
                                selectItem(line.id, item);
                              }
                            }}
                            placeholder="Select item..."
                            required={true}
                          />
                        </td>
                        <td className="p-2 w-28 border-r border-blue-900">
                          <input 
                            type="text" 
                            value={line.moisture || ''}
                            placeholder="Moisture %"
                            onChange={e => updateLine(line.id, 'moisture', e.target.value)}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-center text-xs"
                          />
                        </td>
                        <td className="p-2 w-56 border-r border-blue-900">
                          <select 
                            value={line.locationId || ''}
                            onChange={(e) => updateLine(line.id, 'locationId', e.target.value ? e.target.value : undefined)}
                            className="w-full pl-2 pr-6 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer text-xs font-semibold text-slate-800"
                          >
                            <option value="">-Select-</option>
                            {locations.filter(loc => loc.Status === 'Active').map(loc => (
                              <option key={loc.Id || loc.id} value={loc.Id || loc.id}>{loc.Name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 w-32 border-r border-blue-900">
                          <input 
                            required
                            type="number" 
                            min="1"
                            value={line.qty || ''}
                            onChange={e => updateLine(line.id, 'qty', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-center font-bold text-gray-800"
                          />
                        </td>
                        <td className="p-2 w-20 border-r border-blue-900">
                          <input 
                            type="text" 
                            disabled
                            value={line.unit || ''}
                            placeholder="Unit"
                            className="w-full px-1 py-1.5 border border-gray-300 rounded text-xs bg-gray-100 text-center font-semibold text-gray-700 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 border-r border-blue-900">
                          <input 
                            required
                            type="number" 
                            min="0"
                            step="any"
                            value={line.rate || ''}
                            onChange={e => updateLine(line.id, 'rate', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-right font-semibold"
                          />
                        </td>
                        <td className="p-2 border-r border-blue-900">
                          <input 
                            type="number" 
                            min="0" max="100"
                            value={line.discount || ''}
                            onChange={e => updateLine(line.id, 'discount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-right"
                          />
                        </td>
                        <td className="p-2 border-r border-blue-900">
                          <select 
                            value={line.gstRate}
                            onChange={e => updateLine(line.id, 'gstRate', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer text-center font-bold"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm border-r border-blue-900 bg-slate-50">
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          <button 
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            disabled={lines.length === 1}
                            title="Remove Row"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="p-2 bg-[#f8fafc] border-t-2 border-blue-900 flex justify-between items-center">
                <button 
                  type="button"
                  onClick={addLine}
                  className="text-sm font-bold text-blue-800 hover:text-blue-900 flex items-center gap-1 transition-colors px-3 py-1 bg-white border border-[#cbd5e1] hover:border-[#8faad8] rounded"
                >
                  <Plus className="w-4 h-4" /> ADD ROW LINE
                </button>

                <div className="w-80 bg-slate-100 border border-[#8faad8] rounded-lg p-3 space-y-2 mt-1 mr-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Gross Subtotal:</span>
                    <span className="font-mono text-slate-950">₹{(totals.subtotal + totals.totalDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-xs font-bold text-green-700 bg-green-100/50 px-1 rounded">
                        <span>Total Disc Allotted:</span>
                        <span className="font-mono">-₹{totals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Taxable Subtotal:</span>
                        <span className="font-mono text-slate-950">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>GST Outflow:</span>
                    <span className="font-mono text-slate-950">₹{totals.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {Math.abs(totals.roundedOff) > 0.001 && (
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Rounded Off:</span>
                      <span className="font-mono text-slate-950">₹{totals.roundedOff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-blue-900 flex justify-between items-center bg-emerald-100/30 px-1 rounded">
                    <span className="font-bold text-emerald-950 text-sm">Grand Total (₹):</span>
                    <span className="text-base font-black text-emerald-900 font-mono">
                      ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Remarks */}
        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            III. Remarks / Internal Narration
          </div>
          <div className="p-3 bg-white">
            <textarea 
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Additional notes for internal database records..."
              className="w-full px-3 py-2 border border-[#cbd5e1] focus:border-[#8faad8] focus:ring-1 focus:ring-blue-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block font-sans"
            ></textarea>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/purchase/invoices')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING...' : (isEditing ? 'UPDATE INVOICE' : 'BOOK INVOICE')}
          </button>
        </div>
      </form>
    </div>
  );
}
