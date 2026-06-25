import React, { useState, useEffect } from 'react';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { formatDateForInput } from '../../lib/utils';

interface ReturnLine {
  id: string;
  item: string;
  itemId?: number;
  locationId?: number | string;
  qty: number;
  rate: number;
  reason: string;
  unit?: string;
}

export function SalesReturnForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { activeCompany, activeFinancialYear } = useAppContext();
  
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [customerId, setCustomerId] = useState('');
  const [originalInvoiceNo, setOriginalInvoiceNo] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('Processed');
  
  const [lines, setLines] = useState<ReturnLine[]>([
    { id: '1', item: '', qty: 1, rate: 0, reason: '', unit: '' }
  ]);
  
  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cid = activeCompany?.id || '';
    Promise.all([
      fetch(`/api/v1/data/InventoryItems?CompanyId=${cid}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/Customers?CompanyId=${cid}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/SalesInvoices?CompanyId=${cid}`).then(res => res.json()).catch(() => []),
      fetch(`/api/data/locations?CompanyId=${cid}`).then(res => res.json()).catch(() => [])
    ]).then(([items, custs, invoices, locs]) => {
      setInventoryItems(Array.isArray(items) ? items : []);
      setCustomers(Array.isArray(custs) ? custs : []);
      setSalesInvoices(Array.isArray(invoices) ? invoices : []);
      setLocations(Array.isArray(locs) ? locs : []);
    }).catch(console.error);
  }, [activeCompany?.id]);

  useEffect(() => {
    if (isEditing) {
      setLoadingInitial(true);
      fetch(`/api/v1/data/SalesReturns/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setCustomerId(String(data.CustomerId || ''));
            setOriginalInvoiceNo(String(data.OriginalInvoiceNumber || ''));
            setReturnDate(formatDateForInput(data.ReturnDate || ''));
            setRemarks(data.Remarks || '');
            setStatus(data.Status || 'Processed');
            
            if (data.ItemsData) {
              try {
                const parsed = JSON.parse(data.ItemsData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setLines(parsed);
                }
              } catch (e) {
                console.error("Failed to parse return items data", e);
              }
            }
          }
          setLoadingInitial(false);
        })
        .catch(err => {
          console.error("Failed to fetch sales return", err);
          setLoadingInitial(false);
        });
    }
  }, [id, isEditing]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item: '', qty: 1, rate: 0, reason: '', unit: '' }]);
  };

  const updateLine = (lineId: string, field: keyof ReturnLine, value: any) => {
    setLines(lines.map(l => l.id === lineId ? { ...l, [field]: value } : l));
  };

  const selectItem = (lineId: string, item: any) => {
    setLines(lines.map(l => l.id === lineId ? { 
      ...l, 
      item: item.Name || item.name, 
      itemId: item.Id || item.id || item.ID,
      rate: item.UnitPrice || item.unitPrice || 0,
      unit: item.Unit || item.unit || ''
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
    if (!customerId) return alert("Please select a customer.");
    
    try {
      setSaving(true);
      const url = isEditing ? `/api/v1/data/SalesReturns/${id}` : '/api/v1/data/SalesReturns';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        CustomerId: Number(customerId),
        OriginalInvoiceNumber: originalInvoiceNo,
        ReturnDate: returnDate,
        TotalAmount: totals.grandTotal,
        CompanyId: activeCompany?.id || null,
        FinancialYearId: activeFinancialYear?.id || null,
        Status: status,
        ItemsData: JSON.stringify(lines),
        Remarks: remarks
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Save operation failed');
      }

      navigate('/sales/returns');
    } catch (e: any) {
      console.error(e);
      alert("Failed to save sales return: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerChange = (custVal: string) => {
    setCustomerId(custVal);
    // Optionally pre-populate or filter invoices for this customer
  };

  if (loadingInitial) {
    return <div className="p-8 text-center text-gray-500 font-sans">Loading sales return data...</div>;
  }

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/sales/returns')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Edit Sales Return' : 'Create Sales Return'}</h1>
            <p className="text-sm text-gray-500 mt-1">Book a return against an invoice to adjust stock and accounts.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> SALES RETURN MASTER
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
                  Customer <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    required
                    value={customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                    id="select-customer"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.Id || c.id} value={c.Id || c.id}>
                        {c.CustomerName || c.Customer_NAME || c.Name} {c.PANNo || c.PAN ? `(${c.PANNo || c.PAN})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Original Invoice <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    required
                    value={originalInvoiceNo}
                    onChange={(e) => setOriginalInvoiceNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                    id="select-original-invoice"
                  >
                    <option value="">Select Invoice...</option>
                    {/* Only show invoices for current customer if one is selected, else show all */}
                    {salesInvoices
                      .filter(inv => !customerId || String(inv.CustomerId) === String(customerId))
                      .map(inv => (
                        <option key={inv.Id || inv.id} value={inv.InvoiceNumber}>
                          {inv.InvoiceNumber} (₹{parseFloat(inv.TotalAmount).toLocaleString('en-IN')})
                        </option>
                      ))}
                    {/* Fallback support for manually typing invoice number */}
                    {originalInvoiceNo && !salesInvoices.some(inv => inv.InvoiceNumber === originalInvoiceNo) && (
                      <option value={originalInvoiceNo}>{originalInvoiceNo}</option>
                    )}
                  </select>
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
                    <CustomDatePicker 
                      required 
                      value={returnDate} 
                      onChange={setReturnDate} 
                      className="w-full font-mono !py-1" 
                    />
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
          </div>
        </div>

        {/* Section Extra: Remarks & Status */}
        <div className="border-b border-blue-900">
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Remarks / Notes
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="E.g. Damaged during shipment, size mismatch"
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Status
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Processed">Processed</option>
                  </select>
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
            <div className="border border-[#8faad8] rounded overflow-hidden min-w-[760px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-gray-800 text-xs font-bold uppercase tracking-wider border-b border-blue-900">
                    <th className="p-3 border-r border-blue-900">Item Details</th>
                    <th className="p-3 w-48 border-r border-blue-900">Location</th>
                    <th className="p-3 w-40 border-r border-blue-900">Reason</th>
                    <th className="p-3 w-32 border-r border-blue-900 text-center">Return Qty</th>
                    <th className="p-3 w-20 border-r border-blue-900 text-center">Unit</th>
                    <th className="p-3 w-32 text-right border-r border-blue-900">Rate (₹)</th>
                    <th className="p-3 w-32 text-right border-r border-blue-900">Valuation</th>
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
                              const item = inventoryItems.find(i => (i.Name || i.name) === val);
                              if (item) {
                                selectItem(line.id, item);
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
                        <td className="p-2 border-r border-blue-900">
                          <input 
                            type="text" 
                            placeholder="Damage, Quality..."
                            value={line.reason}
                            onChange={e => updateLine(line.id, 'reason', e.target.value)}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
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
                            value={line.rate || ''}
                            onChange={e => updateLine(line.id, 'rate', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-right font-semibold"
                          />
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
                  className="text-sm font-bold text-blue-800 hover:text-blue-900 flex items-center gap-1 transition-colors px-3 py-1 bg-white border border-[#cbd5e1] hover:border-[#8faad8] rounded cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> ADD ROW LINE
                </button>

                <div className="w-80 bg-slate-100 border border-[#8faad8] rounded-lg p-3 space-y-2 mt-1 mr-1">
                  <div className="pt-1 flex justify-between items-center bg-emerald-100/30 px-1 rounded">
                    <span className="font-bold text-slate-700 text-xs">Total Return Value (₹):</span>
                    <span className="text-base font-black text-emerald-900 font-mono">
                      ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/sales/returns')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm cursor-pointer"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'PROCESSING...' : 'PROCESS RETURN & NOTE'}
          </button>
        </div>
      </form>
    </div>
  );
}
