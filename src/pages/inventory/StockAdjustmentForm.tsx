import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, SlidersHorizontal, Trash2, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { formatDateForInput } from '../../lib/utils';
import { CustomDatePicker } from '../../components/CustomDatePicker';

interface AdjustmentItem {
  id: string;
  itemId: string;
  locationId?: number | string;
  itemName: string;
  uom: string;
  currentStr: number;
  newQty: number;
}

export function StockAdjustmentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id) && id !== 'new';
  const { activeCompany, activeFinancialYear } = useAppContext();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [type, setType] = useState('Quantity Addition');
  const [items, setItems] = useState<AdjustmentItem[]>([
    { id: '1', itemId: '', itemName: '', uom: '-', currentStr: 0, newQty: 0 }
  ]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/data/locations?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => [])
    ]).then(([itemsData, locsData]) => {
      setInventoryItems(Array.isArray(itemsData) ? itemsData : []);
      setLocations(Array.isArray(locsData) ? locsData : []);
    }).catch(console.error);

    if (isEditing) {
      fetch(`/api/v1/data/StockAdjustments/${id}`)
        .then(res => res.json())
        .then(data => {
          setDate(formatDateForInput(data.AdjustmentDate) || new Date().toISOString().split('T')[0]);
          setReason(data.Reason || '');
          setType(data.AdjustmentType || 'Quantity Addition');
          let parsedItems = [];
          try {
            parsedItems = JSON.parse(data.ItemsData || '[]');
          } catch(e) {}
          if (parsedItems.length > 0) {
            setItems(parsedItems.map((pi: any, idx: number) => ({
              id: String(idx + 1),
              itemId: String(pi.itemId),
              locationId: pi.locationId ? pi.locationId : undefined,
              itemName: pi.itemName || '',
              uom: pi.uom || '-',
              currentStr: Number(pi.currentStr) || 0,
              newQty: Number(pi.newQty) || 0
            })));
          }
        })
        .catch(console.error);
    }
  }, [id, isEditing, activeCompany?.id]);

  const updateItemQty = (rowId: string, newQty: number) => {
    setItems(items.map(item => item.id === rowId ? { ...item, newQty } : item));
  };

  const selectItemForLine = (rowId: string, itemData: any) => {
    setItems(items.map(l => l.id === rowId ? {
      ...l,
      itemId: String(itemData.Id || itemData.id),
      itemName: itemData.Name,
      uom: itemData.Unit || '-',
      currentStr: Number(itemData.Quantity) || 0,
    } : l));
  };

  const removeItem = (rowId: string) => {
    setItems(items.filter(item => item.id !== rowId));
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), itemId: '', itemName: '', uom: '-', currentStr: 0, newQty: 0 }]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      const itemsData = items.filter(t => t.itemId).map(t => ({
        itemId: t.itemId,
        locationId: t.locationId ? t.locationId : undefined,
        itemName: t.itemName,
        uom: t.uom,
        currentStr: t.currentStr,
        newQty: t.newQty,
        qty: Math.abs(t.newQty - t.currentStr), // For ledger calculations
        Quantity: Math.abs(t.newQty - t.currentStr)
      }));

      const payload = {
        CompanyId: activeCompany?.id,
        AdjustmentDate: date,
        Reason: reason,
        AdjustmentType: type,
        Status: 'Approved',
        ItemsData: JSON.stringify(itemsData),
        AdjustmentNo: isEditing ? undefined : `ADJ-${new Date().getTime()}`
      };

      const url = isEditing ? `/api/v1/data/StockAdjustments/${id}` : '/api/v1/data/StockAdjustments';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/inventory/adjustments');
      } else {
        const errorData = await res.json();
        alert(`Failed to save: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving Stock Adjustment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/inventory/adjustments')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Edit' : 'New'} Stock Adjustment</h1>
            <p className="text-sm text-gray-500 mt-1">Record physical verifications and manual stock corrections.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <SlidersHorizontal className="w-5 h-5" /> STOCK ADJUSTMENT MASTER
        </div>

        {/* Section 1: General Info */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Adjustment Header Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch font-sans">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Adjustment Date <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <div className="w-full max-w-[180px]">
                    <CustomDatePicker required value={date} onChange={setDate} className="w-full font-mono !py-1" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Reason / Ref
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Physical inventory count mismatch..." className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Adjustment Type <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select required value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer">
                    <option value="Quantity Addition">Quantity Addition</option>
                    <option value="Quantity Reduction">Quantity Reduction</option>
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

        {/* Section 2: Items Table */}
        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            II. Affected Items & Qty
          </div>

          <div className="p-4 bg-white">
            <div className="border border-[#8faad8] rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-gray-800 text-xs font-bold uppercase tracking-wider border-b border-blue-900">
                    <th className="p-3 border-r border-blue-900">Item Details</th>
                    <th className="p-3 w-48 border-r border-blue-900 text-center">Location</th>
                    <th className="p-3 text-center w-36 border-r border-blue-900">Current Qty</th>
                    <th className="p-3 text-center w-36 border-r border-blue-900">New Qty</th>
                    <th className="p-3 text-right w-36 border-r border-blue-900">Difference</th>
                    <th className="p-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8faad8]">
                  {items.map((item) => (
                    <tr key={item.id} className="bg-white hover:bg-slate-50">
                      <td className="p-2 border-r border-blue-900">
                        <select 
                          value={item.itemId}
                          onChange={(e) => {
                            const itm = inventoryItems.find(i => String(i.Id || i.id) === e.target.value);
                            if (itm) selectItemForLine(item.id, itm);
                          }}
                          className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                        >
                           <option value="">Select Item...</option>
                           {inventoryItems.map(inv => (
                             <option key={inv.Id || inv.id} value={inv.Id || inv.id}>{inv.Name}</option>
                           ))}
                        </select>
                      </td>
                      <td className="p-2 w-48 border-r border-blue-900 font-sans">
                        <select 
                          value={item.locationId || ''}
                          onChange={(e) => setItems(prev => prev.map(p => p.id === item.id ? { ...p, locationId: e.target.value ? e.target.value : undefined } : p))}
                          className="w-full pl-2 pr-6 py-1.5 border border-[#8faad8] rounded text-[#1e293b] font-semibold text-xs focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                        >
                          <option value="">-Select-</option>
                          {locations.filter(loc => loc.Status === 'Active').map(loc => (
                            <option key={loc.Id || loc.id} value={loc.Id || loc.id}>{loc.Name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-sm text-gray-700 text-center font-mono font-bold border-r border-blue-900 bg-slate-50">
                        {item.currentStr} <span className="text-xs font-sans text-gray-400 font-normal">{item.uom}</span>
                      </td>
                      <td className="p-2 border-r border-blue-900">
                        <input 
                          type="number" 
                          value={item.newQty || ''}
                          onChange={(e) => updateItemQty(item.id, Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-[#8faad8] rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono font-bold text-gray-800" 
                        />
                      </td>
                      <td className={`p-3 text-sm font-bold text-right font-mono border-r border-blue-900 ${
                        (item.newQty - item.currentStr) > 0 ? 'text-green-700 bg-green-50/50' :
                        (item.newQty - item.currentStr) < 0 ? 'text-red-700 bg-red-50/50' : 'text-gray-500 bg-slate-50'
                      }`}>
                        {(item.newQty - item.currentStr) > 0 ? '+' : ''}{(item.newQty - item.currentStr) || 0}
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          type="button"
                          onClick={() => removeItem(item.id)} 
                          className="text-gray-400 hover:text-red-600 transition-colors p-1" 
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2 bg-[#f8fafc] border-t-2 border-blue-900">
                <button 
                  type="button"
                  onClick={addItem}
                  className="text-sm font-bold text-blue-800 hover:text-blue-900 flex items-center gap-1 transition-colors px-3 py-1 bg-white border border-[#cbd5e1] hover:border-[#8faad8] rounded"
                >
                  <Plus className="w-4 h-4" /> ADD ROW LINE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/inventory/adjustments')}
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
            {saving ? 'SAVING...' : 'SAVE DETAILS'}
          </button>
        </div>
      </form>
    </div>
  );
}
