import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Calculator } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { formatDateForInput } from '../../lib/utils';
import { CustomDatePicker } from '../../components/CustomDatePicker';

interface InvoiceLine {
  id: string;
  item: string;
  itemId?: number;
  locationId?: number | string;
  supplierId?: string;
  supplierName?: string;
  purchaseInvoiceId?: string;
  purchaseInvoiceNo?: string;
  purchaseLineId?: string;
  maxQty?: number;
  hsn: string;
  qty: number;
  rate: number;
  discount: number;
  gstRate: number;
}

export function SalesInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { activeCompany, activeFinancialYear } = useAppContext();
  const [lines, setLines] = useState<InvoiceLine[]>([
    { id: '1', item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18 }
  ]);
  const [originalLines, setOriginalLines] = useState<InvoiceLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/Customers?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/data/locations?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/inventory/lots?companyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => [])
    ]).then(([invItems, custs, locs, activeLots]) => {
      setInventoryItems(Array.isArray(invItems) ? invItems : []);
      setCustomers(Array.isArray(custs) ? custs : []);
      setLocations(Array.isArray(locs) ? locs : []);
      setLots(Array.isArray(activeLots) ? activeLots : []);
    }).catch(console.error);
  }, [activeCompany?.id]);

  useEffect(() => {
    if (isEditing) {
      setLoadingInitial(true);
      fetch(`/api/v1/data/SalesInvoices/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setCustomerId(String(data.CustomerId || ''));
            setInvoiceDate(formatDateForInput(data.InvoiceDate || ''));
            if (data.ItemsData) {
              try {
                const parsed = JSON.parse(data.ItemsData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setLines(parsed);
                  setOriginalLines(parsed);
                }
              } catch (e) {
              }
            }
          }
          setLoadingInitial(false);
        })
        .catch(err => {
          setLoadingInitial(false);
        });
    }
  }, [id, isEditing]);

  const getGstRateForItem = (item: any, custId: string) => {
    if (!item) return 18;
    const selCust = customers.find(c => String(c.Id || c.id) === String(custId));
    const compState = String(activeCompany?.StateCode || '').trim().toLowerCase();
    const custState = selCust ? String(selCust.StateCode || selCust.stateCode || selCust.state_code || '').trim().toLowerCase() : '';
    const isWithinState = !selCust || !activeCompany || (compState === custState);

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
    if (!customerId || customers.length === 0 || inventoryItems.length === 0) return;
    setLines(prevLines => {
      let changed = false;
      const updated = prevLines.map(line => {
        if (!line.itemId) return line;
        const matchedItem = inventoryItems.find(item => String(item.Id || item.id || item.ID) === String(line.itemId));
        if (matchedItem) {
          const newGst = getGstRateForItem(matchedItem, customerId);
          if (line.gstRate !== newGst) {
            changed = true;
            return { ...line, gstRate: newGst };
          }
        }
        return line;
      });
      return changed ? updated : prevLines;
    });
  }, [customerId, customers, inventoryItems, activeCompany?.StateCode]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18 }]);
  };

  const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
    setLines(lines.map(l => {
        if (l.id !== id) return l;
        const newL = { ...l, [field]: value };
        if (field === 'itemId') {
            newL.locationId = '';
            newL.supplierId = '';
            newL.supplierName = '';
            newL.purchaseInvoiceId = '';
            newL.purchaseInvoiceNo = '';
            newL.purchaseLineId = '';
            newL.maxQty = 0;
            newL.qty = 1;
        } else if (field === 'locationId') {
            newL.supplierId = '';
            newL.supplierName = '';
            newL.purchaseInvoiceId = '';
            newL.purchaseInvoiceNo = '';
            newL.purchaseLineId = '';
            newL.maxQty = 0;
            newL.qty = 1;
        } else if (field === 'supplierName') {
            newL.purchaseInvoiceId = '';
            newL.purchaseInvoiceNo = '';
            newL.purchaseLineId = '';
            newL.maxQty = 0;
            newL.qty = 1;
        }
        return newL;
    }));
  };

  const selectItem = (id: string, item: any) => {
    const gstRate = getGstRateForItem(item, customerId);
    setLines(lines.map(l => l.id === id ? { 
      ...l, 
      item: item.Name, 
      itemId: item.Id,
      rate: item.UnitPrice || 0,
      gstRate: gstRate,
      hsn: item.ItemCode || '',
      locationId: '',
      supplierName: '',
      purchaseInvoiceId: '',
      purchaseInvoiceNo: '',
      purchaseLineId: '',
      maxQty: 0
    } : l));
  };

  const selectPurchaseLot = (id: string, lot: any) => {
      const originalLine = originalLines.find(ol => ol.id === id && String(ol.purchaseInvoiceId) === String(lot.purchaseInvoiceId));
      const adjustedBalance = Number(lot.balance) + (originalLine ? Number(originalLine.qty || 0) : 0);
      setLines(lines.map(l => l.id === id ? {
          ...l,
          purchaseInvoiceId: lot.purchaseInvoiceId,
          purchaseInvoiceNo: lot.purchaseInvoiceNo,
          purchaseLineId: lot.purchaseLineId,
          maxQty: adjustedBalance,
          qty: 1
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

    return { subtotal, totalDiscount, totalGst, grandTotal: subtotal + totalGst };
  };

  const totals = calculateTotals();

  const handleSave = async (status: string) => {
    if (!customerId) return alert("Please select a customer.");
    
    // Validate quantities
    for (const l of lines) {
        if (l.maxQty !== undefined && l.qty > l.maxQty) {
            return alert(`Quantity for ${l.item} exceeds maximum available (${l.maxQty}) for the selected lot.`);
        }
    }

    try {
      setSaving(true);
      const url = isEditing ? `/api/v1/data/SalesInvoices/${id}` : '/api/v1/data/SalesInvoices';
      const method = isEditing ? 'PUT' : 'POST';

      const payload: any = {
        CustomerId: customerId,
        CompanyId: activeCompany?.id || null,
        FinancialYearId: activeFinancialYear?.id || null,
        TotalAmount: totals.grandTotal,
        Status: status,
        InvoiceDate: invoiceDate,
        ItemsData: JSON.stringify(lines)
      };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      navigate('/sales/invoices');
    } catch(e) {
      alert("Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return <div className="p-8 text-center text-gray-500">Loading invoice data...</div>;
  }

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/sales/invoices')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Sales Invoice</h1>
            <p className="text-sm text-gray-500 mt-1">Generate a new tax invoice for sales.</p>
          </div>
        </div>
      </div>

      <form 
        onSubmit={(e) => { 
          e.preventDefault(); 
          handleSave('Paid'); 
        }} 
        className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block"
      >
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> SALES INVOICE MASTER
        </div>

        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Invoice Header Details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Customer <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    required
                    value={customerId} 
                    onChange={e => setCustomerId(e.target.value)} 
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.Id} value={c.Id}>{c.CustomerName || c.Customer_NAME}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Invoice Date <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <div className="w-full max-w-[180px]">
                    <CustomDatePicker required value={invoiceDate} onChange={setInvoiceDate} className="w-full font-mono !py-1" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Payment Terms
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer">
                    <option>Net 0 (Immediate)</option>
                    <option>Net 15</option>
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
          </div>
        </div>

        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            II. Line Item Specifications
          </div>
          <div className="p-4 bg-white overflow-x-auto">
            <div className="border border-[#8faad8] rounded overflow-hidden min-w-[1100px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-gray-800 text-xs font-bold uppercase tracking-wider border-b border-blue-900">
                    <th className="p-3 border-r border-blue-900 min-w-[200px]">Item</th>
                    <th className="p-3 w-48 border-r border-blue-900">Location</th>
                    <th className="p-3 w-40 border-r border-blue-900">Supplier</th>
                    <th className="p-3 w-40 border-r border-blue-900">Pur. Inv</th>
                    <th className="p-3 w-32 text-center border-r border-blue-900">Qty {isEditing ? '' : '(Max)'}</th>
                    <th className="p-3 w-24 text-right border-r border-blue-900">Rate</th>
                    <th className="p-3 w-16 text-right border-r border-blue-900">Disc %</th>
                    <th className="p-3 w-20 text-center border-r border-blue-900">GST %</th>
                    <th className="p-3 w-28 text-right border-r border-blue-900">Total</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8faad8]">
                  {lines.map((line) => {
                    const taxable = (line.qty * line.rate) * (1 - line.discount / 100);
                    const total = taxable * (1 + line.gstRate / 100);
                    
                    const itemLots = lots.filter(l => String(l.itemId) === String(line.itemId));
                    const availableLocationIds = Array.from(new Set(itemLots.map(l => String(l.locationId))));
                    const locationLots = itemLots.filter(l => String(l.locationId) === String(line.locationId));
                    const availableSuppliers = Array.from(new Set(locationLots.map(l => l.vendorName)));
                    const supplierLots = locationLots.filter(l => l.vendorName === line.supplierName);
                    
                    const currentLot = supplierLots.find(l => String(l.purchaseInvoiceId) === String(line.purchaseInvoiceId));
                    const currentOriginalLine = originalLines.find(ol => ol.id === line.id && String(ol.purchaseInvoiceId) === String(line.purchaseInvoiceId));
                    const calculatedMaxQty = currentLot ? (Number(currentLot.balance) + (currentOriginalLine ? Number(currentOriginalLine.qty || 0) : 0)) : (line.maxQty || 0);

                    return (
                      <tr key={line.id} className="bg-white hover:bg-slate-50">
                        <td className="p-2 border-r border-blue-900">
                          <input 
                            required
                            type="text" 
                            list={`items-${line.id}`}
                            placeholder="Select item..." 
                            value={line.item}
                            onChange={e => {
                               updateLine(line.id, 'item', e.target.value);
                               const item = inventoryItems.find(i => (i.Name || i.name) === e.target.value);
                               if (item) selectItem(line.id, item);
                            }}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-xs focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                          />
                          <datalist id={`items-${line.id}`}>
                            {inventoryItems.map(item => (
                              <option key={item.Id} value={item.Name} />
                            ))}
                          </datalist>
                        </td>
                        <td className="p-2 w-48 border-r border-blue-900">
                          <select 
                            required
                            value={line.locationId || ''}
                            onChange={(e) => updateLine(line.id, 'locationId', e.target.value)}
                            className="w-full pl-2 pr-6 py-1.5 border border-[#8faad8] rounded text-[#1e293b] font-semibold text-xs focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                          >
                            <option value="">-Location-</option>
                            {locations.filter(loc => availableLocationIds.includes(String(loc.Id)) || (isEditing && String(loc.Id) === String(line.locationId))).map(loc => (
                              <option key={loc.Id} value={loc.Id}>{loc.Name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 border-r border-blue-900">
                          <select 
                            required
                            value={line.supplierName || ''}
                            onChange={(e) => updateLine(line.id, 'supplierName', e.target.value)}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-xs focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                          >
                            <option value="">-Supplier-</option>
                            {availableSuppliers.map(s => (
                              <option key={s as string} value={s as string}>{s as string}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 border-r border-blue-900">
                          <select 
                            required
                            value={line.purchaseInvoiceId || ''}
                            onChange={(e) => {
                               const lot = supplierLots.find(l => String(l.purchaseInvoiceId) === e.target.value);
                               if (lot) selectPurchaseLot(line.id, lot);
                            }}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-xs focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                          >
                            <option value="">-Invoice-</option>
                            {supplierLots.map(l => {
                              const oLine = originalLines.find(ol => ol.id === line.id && String(ol.purchaseInvoiceId) === String(l.purchaseInvoiceId));
                              const adjBal = Number(l.balance) + (oLine ? Number(oLine.qty || 0) : 0);
                              return (
                                <option key={l.purchaseInvoiceId} value={l.purchaseInvoiceId}>{l.purchaseInvoiceNo} (Bal:{adjBal}, ₹{l.rate})</option>
                              );
                            })}
                            {isEditing && !supplierLots.find(l => String(l.purchaseInvoiceId) === String(line.purchaseInvoiceId)) && line.purchaseInvoiceId && (
                                <option value={line.purchaseInvoiceId}>{line.purchaseInvoiceNo}</option>
                            )}
                          </select>
                        </td>
                        <td className="p-2 w-32 border-r border-blue-900 relative">
                          <input 
                            required
                            type="number" 
                            min="1"
                            max={calculatedMaxQty || undefined}
                            value={line.qty || ''}
                            onChange={e => {
                                let val = Number(e.target.value);
                                if (calculatedMaxQty && val > calculatedMaxQty && !isEditing) val = calculatedMaxQty;
                                updateLine(line.id, 'qty', val);
                            }}
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
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-right"
                          />
                        </td>
                        <td className="p-2 border-r border-blue-900">
                          <input 
                            type="number" 
                            min="0" max="100"
                            value={line.discount || ''}
                            onChange={e => updateLine(line.id, 'discount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono text-right"
                          />
                        </td>
                        <td className="p-2 border-r border-blue-900">
                          <select 
                            value={line.gstRate}
                            onChange={e => updateLine(line.id, 'gstRate', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer text-center font-bold"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900 text-sm border-r border-blue-900 bg-slate-50">
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
                  className="text-sm font-bold text-blue-800 flex items-center gap-1 transition-colors px-3 py-1 bg-white border border-[#cbd5e1] rounded"
                >
                  <Plus className="w-4 h-4" /> ADD ROW LINE
                </button>

                <div className="w-80 bg-slate-100 border border-[#8faad8] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono text-slate-950">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-2 border-t border-blue-900 flex justify-between items-center bg-emerald-100/30 px-1 rounded">
                    <span className="font-bold text-emerald-950 text-sm">Grand Total (₹):</span>
                    <span className="text-base font-black text-emerald-900 font-mono">
                      ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            disabled={saving}
            onClick={() => navigate('/sales/invoices')}
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
            {saving ? 'SAVING...' : 'SAVE & PUBLISH'}
          </button>
        </div>
      </form>
    </div>
  );
}
