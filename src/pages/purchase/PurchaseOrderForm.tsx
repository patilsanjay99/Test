import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { formatDateForInput } from '../../lib/utils';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { AutocompleteCombobox } from '../../components/AutocompleteCombobox';

interface OrderLine {
  id: string;
  item: string;
  itemId?: number;
  hsn: string;
  qty: number;
  rate: number;
  discount: number;
  gstRate: number;
  unit?: string;
}

export function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { activeCompany, activeFinancialYear } = useAppContext();
  
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [requiredByDate, setRequiredByDate] = useState('');
  const [status, setStatus] = useState<string>('Pending');
  const [remarks, setRemarks] = useState<string>('');
  const [terms, setTerms] = useState<string>('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [lines, setLines] = useState<OrderLine[]>([
    { id: '1', item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18, unit: '' }
  ]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/Vendors?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => [])
    ]).then(([invItems, vends]) => {
      setInventoryItems(Array.isArray(invItems) ? invItems : []);
      setVendors(Array.isArray(vends) ? vends : []);
    }).catch(console.error);

    if (activeCompany?.id && !isEditing) {
      fetch(`/api/data/Companies?Id=${activeCompany.id}`)
        .then(res => res.json())
        .then(data => {
          const company = Array.isArray(data) ? data[0] : data;
          if (company && company.DefaultPurchaseOrderTerms) {
            setTerms(company.DefaultPurchaseOrderTerms);
          }
        })
        .catch(console.error);
    }
  }, [activeCompany?.id, isEditing]);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      fetch(`/api/v1/data/PurchaseOrders/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSelectedVendorId(String(data.VendorId || ''));
            setPoDate(formatDateForInput(data.OrderDate || ''));
            setRequiredByDate(formatDateForInput(data.RequiredByDate || ''));
            setStatus(data.Status || 'Pending');
            setRemarks(data.Remarks || '');
            setTerms(data.Terms || '');
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
          console.error("Failed to fetch purchase order", err);
          setLoading(false);
        });
    }
  }, [id, isEditing]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18, unit: '' }]);
  };

  const updateLine = (id: string, field: keyof OrderLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const selectItem = (id: string, item: any) => {
    const buyingRate = item.BuyingPrice !== undefined && item.BuyingPrice !== null ? Number(item.BuyingPrice) : (item.buyingprice !== undefined && item.buyingprice !== null ? Number(item.buyingprice) : (item.UnitPrice || item.unitPrice || 0));
    setLines(lines.map(l => l.id === id ? { 
      ...l, 
      item: item.Name || item.name, 
      itemId: item.Id || item.id || item.ID,
      rate: buyingRate,
      hsn: item.ItemCode || item.itemCode || '',
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
      const selVend = vendors.find(v => String(v.Vendor_ID || v.id) === String(selectedVendorId));
      const vendorName = selVend ? selVend.Vendor_NAME : '';

      const payload = {
        CompanyId: activeCompany?.id || null,
        VendorId: selectedVendorId,
        VendorName: vendorName,
        OrderDate: poDate,
        RequiredByDate: requiredByDate,
        TotalAmount: totals.grandTotal,
        Status: status,
        Remarks: remarks,
        Terms: terms,
        ItemsData: JSON.stringify(lines),
        FinancialYearId: activeFinancialYear?.id || null
      };

      const url = isEditing ? `/api/data/PurchaseOrders/${id}` : '/api/data/PurchaseOrders';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save purchase order");
      }

      navigate('/purchase/orders');
    } catch(e: any) {
      alert(e.message || "Failed to save purchase order.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Purchase Order Data...</div>;
  }

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/purchase/orders')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Edit' : 'Create'} Purchase Order</h1>
            <p className="text-sm text-gray-500 mt-1">{isEditing ? 'Modify existing' : 'Issue a new'} PO to a vendor for procurement.</p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> PURCHASE ORDER MASTER
        </div>

        {/* Section 1: General Info */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Purchase Order General Information
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

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  PO Date <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <div className="w-full max-w-[180px]">
                    <CustomDatePicker required value={poDate} onChange={setPoDate} className="w-full font-mono !py-1" />
                  </div>
                </div>
              </div>
              
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

            {/* Right Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-[#8faad8] min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Required By
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <div className="w-full max-w-[180px]">
                    <CustomDatePicker value={requiredByDate} onChange={setRequiredByDate} className="w-full font-mono !py-1" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Status
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch bg-[#f1f5f9]">
                <div className="bg-[#f1f5f9] px-4 py-3 sm:col-span-1 border-r border-[#8faad8]" />
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center" />
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
            <div className="border border-[#8faad8] rounded overflow-hidden min-w-[760px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-gray-800 text-xs font-bold uppercase tracking-wider border-b border-blue-900">
                    <th className="p-3 border-r border-blue-900">Item Details</th>
                    <th className="p-3 w-28 border-r border-blue-900 text-center">HSN</th>
                    <th className="p-3 w-32 border-r border-blue-900 text-center">Qty</th>
                    <th className="p-3 w-20 border-r border-blue-900 text-center">Unit</th>
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
                        <td className="p-2 border-r border-blue-900">
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
                        <td className="p-2 border-r border-blue-900">
                          <input 
                            type="text" 
                            value={line.hsn}
                            placeholder="HSN"
                            onChange={e => updateLine(line.id, 'hsn', e.target.value)}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-center"
                          />
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

        {/* Section 3: Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-t border-blue-900">
          <div>
            <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
              III. Terms & Conditions
            </div>
            <div className="p-3 bg-white h-24">
              <textarea 
                rows={2}
                placeholder="Standard PO terms apply..."
                value={terms}
                onChange={e => setTerms(e.target.value)}
                className="w-full h-full px-3 py-1.5 border border-[#cbd5e1] focus:border-[#8faad8] focus:ring-1 focus:ring-blue-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block font-sans"
              ></textarea>
            </div>
          </div>
          <div>
            <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
              IV. Remarks / Notes
            </div>
            <div className="p-3 bg-white h-24">
              <textarea 
                rows={2}
                placeholder="Add any internal remarks..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full h-full px-3 py-1.5 border border-[#cbd5e1] focus:border-[#8faad8] focus:ring-1 focus:ring-blue-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block font-sans"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/purchase/orders')}
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
            {saving ? 'SAVING...' : 'CONFIRM PO'}
          </button>
        </div>
      </form>
    </div>
  );
}
