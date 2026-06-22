import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { formatDateForInput } from '../../lib/utils';

interface ReturnLine {
  id: string;
  item: string;
  itemId?: number;
  locationId?: number | string;
  qty: number;
  rate: number;
  reason: string;
}

export function PurchaseReturnForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const { activeCompany, activeFinancialYear } = useAppContext();
  
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  // Form states
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [originalInvoiceNo, setOriginalInvoiceNo] = useState<string>('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('Draft');
  const [returnNumber, setReturnNumber] = useState('');
  
  const [lines, setLines] = useState<ReturnLine[]>([
    { id: '1', item: '', qty: 1, rate: 0, reason: '' }
  ]);
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Load masters: Inventory, Vendors, Invoices
  useEffect(() => {
    if (!activeCompany) return;
    
    Promise.all([
      fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany.id}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/Vendors?CompanyId=${activeCompany.id}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/PurchaseInvoices?CompanyId=${activeCompany.id}`).then(res => res.json()).catch(() => []),
      fetch(`/api/data/locations?CompanyId=${activeCompany.id}`).then(res => res.json()).catch(() => [])
    ]).then(([invResult, vendResult, invList, locResult]) => {
      setInventoryItems(Array.isArray(invResult) ? invResult : []);
      setVendors(Array.isArray(vendResult) ? vendResult : []);
      setInvoices(Array.isArray(invList) ? invList : []);
      setLocations(Array.isArray(locResult) ? locResult : []);
    }).catch(console.error);
  }, [activeCompany?.id]);

  // If editing, load the specific purchase return record
  useEffect(() => {
    if (isEditing && activeCompany) {
      setLoading(true);
      fetch(`/api/v1/data/PurchaseReturns/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSelectedVendorId(data.VendorId ? String(data.VendorId) : '');
            setOriginalInvoiceNo(data.OriginalInvoiceNumber || '');
            setReturnDate(formatDateForInput(data.ReturnDate || ''));
            setRemarks(data.Remarks || '');
            setStatus(data.Status || 'Draft');
            setReturnNumber(data.ReturnNumber || '');
            
            if (data.ItemsData) {
              try {
                const parsed = JSON.parse(data.ItemsData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setLines(parsed.map((l, index) => ({
                    id: l.id || String(index + 1),
                    item: l.item || '',
                    itemId: l.itemId,
                    qty: Number(l.qty) || 0,
                    rate: Number(l.rate) || 0,
                    reason: l.reason || '',
                    locationId: l.locationId ? l.locationId : undefined
                  })));
                }
              } catch (e) {
                console.error("Error parsing items JSON", e);
              }
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, activeCompany?.id]);

  // Auto-fill vendor when an original invoice is chosen
  const handleInvoiceChange = (invNo: string) => {
    setOriginalInvoiceNo(invNo);
    if (!invNo) return;

    // Find purchase invoice
    const foundInvoice = invoices.find(inv => inv.InvoiceNumber === invNo);
    if (foundInvoice) {
      setSelectedVendorId(foundInvoice.VendorId ? String(foundInvoice.VendorId) : '');
      
      // Smart Prefill Option: If return lines are currently empty or untouched, prefill with invoice items!
      if (foundInvoice.ItemsData) {
        try {
          const parsedItems = JSON.parse(foundInvoice.ItemsData);
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            setLines(parsedItems.map((line: any, i: number) => ({
              id: String(i + 1),
              item: line.item || '',
              itemId: line.itemId,
              locationId: line.locationId ? line.locationId : undefined,
              qty: Number(line.qty) || 1,
              rate: Number(line.rate) || 0,
              reason: 'Defective / Return'
            })));
          }
        } catch (e) {
          console.error("Error auto-prefilling invoice lines inside return form", e);
        }
      }
    }
  };

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item: '', qty: 1, rate: 0, reason: '' }]);
  };

  const updateLine = (lineId: string, field: keyof ReturnLine, value: any) => {
    setLines(lines.map(l => l.id === lineId ? { ...l, [field]: value } : l));
  };

  const selectItem = (lineId: string, itemObj: any) => {
    const buyingRate = itemObj.BuyingPrice !== undefined && itemObj.BuyingPrice !== null ? Number(itemObj.BuyingPrice) : (itemObj.buyingprice !== undefined && itemObj.buyingprice !== null ? Number(itemObj.buyingprice) : (itemObj.PurchaseUnitPrice || itemObj.UnitPurchasePrice || itemObj.PurchasePrice || itemObj.UnitPrice || itemObj.unitPrice || 0));
    setLines(lines.map(l => l.id === lineId ? { 
      ...l, 
      item: itemObj.Name || itemObj.name, 
      itemId: itemObj.Id || itemObj.id || itemObj.ID,
      rate: buyingRate
    } : l));
  };

  const removeLine = (lineId: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== lineId));
    }
  };

  const calculateTotals = () => {
    let grandTotal = 0;
    lines.forEach(line => {
      grandTotal += (line.qty || 0) * (line.rate || 0);
    });
    return { grandTotal };
  };

  const totals = calculateTotals();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) {
      return alert("Please select a vendor.");
    }
    
    // Validate rows
    const invalidLine = lines.find(l => !l.item.trim());
    if (invalidLine) {
      return alert("Please select or specify a valid item name for all custom return row lines.");
    }

    try {
      setSaving(true);
      
      const payload: any = {
        CompanyId: activeCompany?.id || null,
        FinancialYearId: activeFinancialYear?.id || null,
        VendorId: parseInt(selectedVendorId, 10),
        OriginalInvoiceNumber: originalInvoiceNo,
        TotalAmount: totals.grandTotal,
        Status: status,
        Remarks: remarks,
        ReturnDate: returnDate,
        ItemsData: JSON.stringify(lines)
      };

      if (isEditing) {
        payload.ReturnNumber = returnNumber;
      }

      const url = isEditing ? `/api/v1/data/PurchaseReturns/${id}` : '/api/v1/data/PurchaseReturns';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Could not save database record");
      }

      navigate('/purchase/returns');
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to commit record updates.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Return Record Details...</div>;
  }

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/purchase/returns')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEditing ? `Edit Purchase Return - ${returnNumber}` : 'Create Purchase Return'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Book a dynamic return to vendor linked with original invoices and purchase line-items.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> DEBIT NOTE / PURCHASE RETURN MASTER
        </div>

        {/* Section 1: General Info */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Return Header details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Original Invoice
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    value={originalInvoiceNo}
                    onChange={e => handleInvoiceChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer font-semibold text-gray-800"
                  >
                    <option value="">Select Invoice (Optional)...</option>
                    {invoices.map(inv => (
                      <option key={inv.Id || inv.id} value={inv.InvoiceNumber}>
                        {inv.InvoiceNumber} - {inv.VendorName} (₹{inv.TotalAmount?.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch font-sans">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Vendor Name <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center col-span-2">
                  <select 
                    required
                    value={selectedVendorId}
                    onChange={e => setSelectedVendorId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.Vendor_ID || v.id || v.Id} value={v.Vendor_ID || v.id || v.Id}>
                        {v.Vendor_NAME} {v.PAN ? `(PAN: ${v.PAN})` : ''}
                      </option>
                    ))}
                  </select>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Return Date <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <div className="w-full max-w-[180px]">
                    <CustomDatePicker required value={returnDate} onChange={setReturnDate} className="w-full font-mono !py-1" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Debit Note Status
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer font-bold text-gray-700"
                  >
                    <option value="Draft">Draft (Voucher Mode)</option>
                    <option value="Processed">Processed (Direct Post to General Ledger)</option>
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
                    <th className="p-3 w-48 border-r border-blue-900 text-center">Location</th>
                    <th className="p-3 w-40 border-r border-blue-900 text-center">Reason</th>
                    <th className="p-3 w-32 border-r border-blue-900 text-center">Return Qty</th>
                    <th className="p-3 w-32 text-right border-r border-blue-900">Rate (₹)</th>
                    <th className="p-3 w-40 text-right border-r border-blue-900">Valuation</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8faad8]">
                  {lines.map((line) => {
                    const total = (line.qty || 0) * (line.rate || 0);
                    
                    return (
                      <tr key={line.id} className="bg-white hover:bg-slate-50">
                        <td className="p-2 border-r border-blue-900">
                          <input 
                            required
                            type="text" 
                            list={`items-${line.id}`}
                            placeholder="Select or type item..." 
                            value={line.item}
                            onChange={e => {
                              const val = e.target.value;
                              updateLine(line.id, 'item', val);
                              const found = inventoryItems.find(i => (i.Name || i.name) === val);
                              if (found) {
                                selectItem(line.id, found);
                              }
                            }}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                          />
                          <datalist id={`items-${line.id}`}>
                            {inventoryItems.map(item => (
                              <option key={item.Id || item.id || item.ID} value={item.Name || item.name} />
                            ))}
                          </datalist>
                        </td>
                        <td className="p-2 w-48 border-r border-blue-900">
                          <select
                            value={line.locationId || ''}
                            onChange={(e) => updateLine(line.id, 'locationId', e.target.value ? e.target.value : undefined)}
                            className="w-full pl-2 pr-6 py-1.5 border border-[#8faad8] rounded text-[#1e293b] font-semibold text-xs focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                          >
                            <option value="">-Select-</option>
                            {locations.filter(loc => loc.Status === 'Active').map(loc => (
                              <option key={loc.Id || loc.id} value={loc.Id || loc.id}>{loc.Name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 border-r border-blue-900 font-sans">
                          <input 
                            type="text" 
                            placeholder="Defective, Excess..."
                            value={line.reason}
                            onChange={e => updateLine(line.id, 'reason', e.target.value)}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-center"
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
                        <td className="p-2 border-r border-blue-900">
                          <input 
                            required
                            type="number" 
                            min="0"
                            value={line.rate || ''}
                            onChange={e => updateLine(line.id, 'rate', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-right font-semibold"
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm border-r border-blue-900 bg-slate-50">
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center col-span-1">
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
                  <div className="pt-2 flex justify-between items-center bg-emerald-100/30 px-1 rounded">
                    <span className="font-bold text-emerald-950 text-sm">Grand Valuation (₹):</span>
                    <span className="text-base font-black text-emerald-900 font-mono text-right">
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
            III. Remarks / Narration Details
          </div>
          <div className="p-3 bg-white">
            <textarea 
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Enter details / reason for debit note (defects, price discrepancies, excess stock, etc.)..."
              className="w-full px-3 py-2 border border-[#cbd5e1] focus:border-[#8faad8] focus:ring-1 focus:ring-blue-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block font-sans"
            ></textarea>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/purchase/returns')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'PROCESSING...' : (isEditing ? 'UPDATE DEBIT NOTE' : 'PROCESS DEBIT NOTE')}
          </button>
        </div>
      </form>
    </div>
  );
}
