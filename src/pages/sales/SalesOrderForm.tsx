import React, { useState, useEffect } from 'react';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { AutocompleteCombobox } from '../../components/AutocompleteCombobox';
import { ArrowLeft, Save, Plus, Trash2, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

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

export function SalesOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany, activeFinancialYear } = useAppContext();
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesQuotations, setSalesQuotations] = useState<any[]>([]);
  const [quotationNo, setQuotationNo] = useState('');
  const [loadMessage, setLoadMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [lines, setLines] = useState<OrderLine[]>([
    { id: '1', item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18, unit: '' }
  ]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLoadQuotation = (qNo: string) => {
    setLoadMessage(null);
    if (!qNo) return;

    const found = salesQuotations.find(
      q => (q.QuotationNumber || '').trim().toLowerCase() === qNo.trim().toLowerCase()
    );

    if (found) {
      if (found.CustomerId) {
        setSelectedCustomer(found.CustomerId);
      }
      if (found.ItemsData) {
        try {
          const items = JSON.parse(found.ItemsData);
          if (Array.isArray(items)) {
            setLines(items);
          }
        } catch (err) {
          console.error("Failed to parse quotation lines", err);
        }
      }
      if (found.TermsAndConditions) {
        setTermsAndConditions(found.TermsAndConditions);
      }
      setLoadMessage({ text: `Successfully loaded details from Quotation: ${found.QuotationNumber}`, isError: false });
    } else {
      setLoadMessage({ text: `Quotation number "${qNo}" not found.`, isError: true });
    }
  };

  useEffect(() => {
    if (activeCompany?.id) {
        fetch(`/api/data/InventoryItems?CompanyId=${activeCompany.id}`)
          .then(res => res.json())
          .then(data => setInventoryItems(Array.isArray(data) ? data : []))
          .catch(console.error);

        fetch(`/api/data/Customers?CompanyId=${activeCompany.id}`)
          .then(res => res.json())
          .then(data => setCustomers(Array.isArray(data) ? data : []))
          .catch(console.error);

        fetch(`/api/data/SalesQuotations?CompanyId=${activeCompany.id}`)
          .then(res => res.json())
          .then(data => setSalesQuotations(Array.isArray(data) ? data : []))
          .catch(console.error);
        
        if (id) {
          fetch(`/api/data/SalesOrders?CompanyId=${activeCompany.id}`)
            .then(res => res.json())
            .then(data => {
                const order = Array.isArray(data) ? data.find(q => q.Id == id) : null;
                if (order) {
                   setOrderNumber(order.OrderNumber || '');
                   setQuotationNo(order.QuotationNo || '');
                   setSelectedCustomer(order.CustomerId);
                   setOrderDate(order.OrderDate.split('/').reverse().join('-'));
                   setExpectedDelivery(order.ExpectedDelivery ? order.ExpectedDelivery.split('/').reverse().join('-') : '');
                   if (order.ItemsData) setLines(JSON.parse(order.ItemsData));
                   setTermsAndConditions(order.TermsAndConditions || '');
                }
            })
            .catch(console.error);
        } else {
             // Fetch default terms
             fetch(`/api/data/Companies?Id=${activeCompany.id}`)
              .then(res => res.json())
              .then(data => {
                  const company = Array.isArray(data) ? data[0] : data;
                  if (company && company.DefaultSalesOrderTerms) {
                      setTermsAndConditions(company.DefaultSalesOrderTerms);
                  }
              })
              .catch(console.error);
        }
    }
  }, [activeCompany?.id, id]);

  const saveOrder = async () => {
    setSaving(true);
    const totals = calculateTotals();
    const formatDate = (d: string) => {
        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    const data = {
        CompanyId: activeCompany?.id,
        FinancialYearId: activeFinancialYear?.id,
        CustomerId: selectedCustomer,
        OrderDate: formatDate(orderDate),
        ExpectedDelivery: formatDate(expectedDelivery),
        TotalAmount: totals.grandTotal,
        Status: 'Draft',
        ItemsData: JSON.stringify(lines),
        Remarks: '',
        TermsAndConditions: termsAndConditions,
        OrderNumber: orderNumber,
        QuotationNo: quotationNo
    };

    try {
        const url = id ? `/api/data/SalesOrders/${id}` : '/api/data/SalesOrders';
        const method = id ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to save order");
        navigate('/sales/orders');
    } catch (e) {
        alert("Failed to save order.");
        console.error(e);
    } finally {
        setSaving(false);
    }
  };

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item: '', hsn: '', qty: 1, rate: 0, discount: 0, gstRate: 18, unit: '' }]);
  };

  const updateLine = (id: string, field: keyof OrderLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const selectItem = (id: string, item: any) => {
    setLines(lines.map(l => l.id === id ? { 
      ...l, 
      item: item.Name || item.name, 
      itemId: item.Id || item.id || item.ID,
      rate: item.UnitPrice || item.unitPrice || 0,
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

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/sales/orders')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{id ? `Edit Order - ${orderNumber}` : 'Create Order'}</h1>
            <p className="text-sm text-gray-500 mt-1">Prepare a{id ? 'n' : ' new'} estimate for a prospective sale.</p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveOrder(); }} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" /> SALES ORDER MASTER
        </div>

        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Order Header details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f2fcf2] px-4 py-3 flex flex-col justify-center font-bold text-[#0b8a1c] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  <span className="flex items-center gap-1">Ref Quotation No</span>
                  <span className="text-[10px] text-gray-500 font-normal italic">(Optional)</span>
                </div>
                <div className="bg-[#f2fcf2] p-1.5 sm:col-span-2 flex flex-col justify-center gap-1">
                  <div className="flex gap-1.5 w-full">
                    <div className="flex-1">
                      <AutocompleteCombobox
                        options={salesQuotations.map(q => ({
                          value: String(q.QuotationNumber || ''),
                          label: q.QuotationNumber || '',
                          sublabel: `Date: ${q.QuotationDate || '-'}, Amt: ₹${q.TotalAmount || 0}`
                        }))}
                        value={quotationNo}
                        onChange={(val) => {
                          setQuotationNo(val);
                        }}
                        placeholder="Type or Select Quotation..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadQuotation(quotationNo)}
                      className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-1.5 rounded uppercase border border-green-900 transition-all shadow-sm flex items-center"
                    >
                      Load
                    </button>
                  </div>
                  {loadMessage && (
                    <span className={`text-[11px] font-semibold ${loadMessage.isError ? 'text-red-600' : 'text-green-700'}`}>
                      {loadMessage.text}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Customer <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <AutocompleteCombobox
                    options={customers.map(c => ({
                      value: String(c.Id || c.id || ''),
                      label: c.CustomerName || c.Customer_NAME || c.Name || '',
                      sublabel: c.Place ? `Place: ${c.Place}` : undefined
                    }))}
                    value={selectedCustomer}
                    onChange={setSelectedCustomer}
                    placeholder="Search/Select Customer..."
                    required={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Order Date <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <div className="w-full max-w-[180px]">
                    <CustomDatePicker required value={orderDate} onChange={setOrderDate} className="w-full font-mono !py-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Expected Delivery <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <div className="w-full max-w-[180px]">
                    <CustomDatePicker required value={expectedDelivery} onChange={setExpectedDelivery} className="w-full font-mono !py-1" />
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

        {/* Section 3: Terms & Conditions */}
        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            III. Terms & Conditions
          </div>
          <div className="p-3 bg-white">
            <textarea 
              rows={3}
              placeholder="Terms and conditions..."
              value={termsAndConditions}
              onChange={e => setTermsAndConditions(e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] focus:border-[#8faad8] focus:ring-1 focus:ring-blue-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block font-sans"
            ></textarea>
          </div>
        </div>

        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/sales/orders')}
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
            {saving ? 'SAVING...' : (id ? 'UPDATE ORDER' : 'CONFIRM ORDER')}
          </button>
        </div>
      </form>
    </div>
  );
}
