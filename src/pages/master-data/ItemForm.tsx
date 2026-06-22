import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Briefcase, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function ItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    Name: '',
    ItemCode: '',
    Category: 'Seeds',
    Unit: 'kg',
    Status: 'Active',
    LocationId: '',
    IsSalesItem: 'Yes',
    SellingPriceMembers: '',
    SellingPriceNonMembers: '',
    BuyingPrice: '',
    HSNCode: '',
    SGST: '0',
    CGST: '0',
    IGST: '0',
    MinStock: '0',
    MaxCapacity: '0',
    Quantity: '0'
  });

  // Fetch item details if editing a record
  useEffect(() => {
    if (activeCompany?.id) {
       fetch(`/api/data/locations?CompanyId=${activeCompany.id}`)
         .then(res => res.json())
         .then(data => setLocations(Array.isArray(data) ? data : []))
         .catch(console.error);
    }
  
    if (id) {
      setLoading(true);
      fetch(`/api/v1/data/InventoryItems/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setFormData({
              Name: data.Name ?? data.name ?? '',
              ItemCode: data.ItemCode ?? data.itemcode ?? '',
              Category: data.Category ?? data.category ?? 'Seeds',
              Unit: data.Unit ?? data.unit ?? 'kg',
              Status: data.Status ?? data.status ?? 'Active',
              LocationId: data.Location !== undefined && data.Location !== null ? String(data.Location) : (data.location !== undefined && data.location !== null ? String(data.location) : ''),
              IsSalesItem: data.IsSalesItem ?? data.issalesitem ?? 'Yes',
              SellingPriceMembers: String(data.SellingPriceMembers ?? data.sellingpricemembers ?? data.UnitPrice ?? data.unitprice ?? ''),
              SellingPriceNonMembers: String(data.SellingPriceNonMembers ?? data.sellingpricenonmembers ?? ''),
              BuyingPrice: String(data.BuyingPrice ?? data.buyingprice ?? ''),
              HSNCode: data.HSNCode ?? data.hsncode ?? data.HSN ?? '',
              SGST: String(data.SGST ?? data.sgst ?? '0'),
              CGST: String(data.CGST ?? data.cgst ?? '0'),
              IGST: String(data.IGST ?? data.igst ?? '0'),
              MinStock: String(data.MinStock ?? data.minstock ?? '0'),
              MaxCapacity: String(data.MaxCapacity ?? data.maxcapacity ?? '0'),
              Quantity: String(data.Quantity ?? data.quantity ?? '0')
            });
          }
        })
        .catch(err => {
          console.error('Error fetching item details:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Name) return alert('Item Name is required');

    const sellingPriceVal = parseFloat(formData.SellingPriceMembers) || 0;
    
    // Auto-generate a sleek Item Code if none is supplied
    const finalItemCode = formData.ItemCode.trim() 
      ? formData.ItemCode.trim() 
      : `ITM-${Date.now().toString().slice(-4)}`;

    const payload = {
      CompanyId: activeCompany?.id || 1,
      Name: formData.Name,
      ItemCode: finalItemCode,
      Category: formData.Category,
      Unit: formData.Unit,
      Status: formData.Status,
      Location: formData.LocationId,
      IsSalesItem: formData.IsSalesItem,
      UnitPrice: sellingPriceVal, // KeepUnitPrice equal to Member Selling Price for consistency
      SellingPriceMembers: sellingPriceVal,
      SellingPriceNonMembers: parseFloat(formData.SellingPriceNonMembers) || 0,
      BuyingPrice: parseFloat(formData.BuyingPrice) || 0,
      HSNCode: formData.HSNCode,
      SGST: parseFloat(formData.SGST) || 0,
      CGST: parseFloat(formData.CGST) || 0,
      IGST: parseFloat(formData.IGST) || 0,
      MinStock: parseFloat(formData.MinStock) || 0,
      MaxCapacity: parseFloat(formData.MaxCapacity) || 0,
      Quantity: parseFloat(formData.Quantity) || 0
    };

    try {
      setSaving(true);

      const queryParam = activeCompany?.id ? `?CompanyId=${activeCompany.id}` : '';
      const existingRes = await fetch(`/api/v1/data/InventoryItems${queryParam}`);
      if (existingRes.ok) {
          const existing = await existingRes.json();
          const duplicate = existing.find((item: any) => 
               item.Name?.trim().toLowerCase() === formData.Name.trim().toLowerCase() && 
               String(item.Id) !== String(id || '') && String(item.ID) !== String(id || '')
          );
          if (duplicate) {
              alert("Item Name already exists. Please choose a different name.");
              setSaving(false);
              return;
          }
      }

      const url = id ? `/api/v1/data/InventoryItems/${id}` : '/api/v1/data/InventoryItems';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate('/master/items');
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Error: ${errData.error || response.statusText || 'Unable to save item master details'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="max-w-full mx-auto px-4 lg:px-8 w-full py-20 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <span>Loading item master details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/items')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {id ? 'Edit Item Master' : 'Add Item Master'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {id ? 'Modify standard item properties and settings.' : 'Register a new stock inventory item or service.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#f1f5f9] border border-[#8faad8] rounded shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-2.5 px-4 text-center font-bold text-lg tracking-wider uppercase border-b border-blue-900">
          ITEM MASTER
        </div>

        {/* Outer Excel-like grid border layer */}
        <div className="p-0.5 bg-[#8faad8] flex flex-col divide-y divide-[#8faad8] ">
          
          {/* Row 1: Item Category & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Item Category
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <select 
                  value={formData.Category}
                  onChange={(e) => handleInputChange('Category', e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer text-gray-900 font-medium"
                >
                  <option value="Seeds">Seeds</option>
                  <option value="Fertilizers">Fertilizers</option>
                  <option value="Pesticides">Pesticides</option>
                  <option value="Machinery">Machinery</option>
                  <option value="Services">Services</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8] md:border-l-0">
                Status
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <select 
                  value={formData.Status}
                  onChange={(e) => handleInputChange('Status', e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer text-gray-900 font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Item Name */}
          <div className="grid grid-cols-1">
            <div className="grid grid-cols-6">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8] col-span-2 md:col-span-1">
                Item Name
              </div>
              <div className="col-span-4 md:col-span-5 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  required
                  type="text" 
                  value={formData.Name}
                  onChange={(e) => handleInputChange('Name', e.target.value)}
                  placeholder="e.g. Tractor Parts Group A" 
                  className="w-full px-2.5 py-1.5 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium" 
                />
              </div>
            </div>
          </div>

          {/* Row 3: Item Location */}
          <div className="grid grid-cols-1">
            <div className="grid grid-cols-6">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8] col-span-2 md:col-span-1">
                Item Location
              </div>
              <div className="col-span-4 md:col-span-5 bg-[#f1f5f9] p-1 flex items-center">
                <select 
                  value={formData.LocationId}
                  onChange={(e) => handleInputChange('LocationId', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium" 
                >
                  <option value="">- Select Default Location -</option>
                  {locations.filter(l => l.Status === 'Active').map(l => (
                    <option key={l.Id || l.id} value={l.Id || l.id}>{l.Name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 4: Measurement Unit(UOM) & Is Sales Item */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Measurement Unit(UOM)
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="text" 
                  placeholder="e.g. kg / bags"
                  value={formData.Unit}
                  onChange={(e) => handleInputChange('Unit', e.target.value)}
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-semibold" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Is Sales Item
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <select 
                  value={formData.IsSalesItem}
                  onChange={(e) => handleInputChange('IsSalesItem', e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer text-gray-900 font-medium"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 5: Selling Price (Members) & Selling Price (Non Members) */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Selling Price (Members)
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.SellingPriceMembers}
                  onChange={(e) => handleInputChange('SellingPriceMembers', e.target.value)}
                  placeholder="0.00" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Selling Price (Non Members)
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.SellingPriceNonMembers}
                  onChange={(e) => handleInputChange('SellingPriceNonMembers', e.target.value)}
                  placeholder="0.00" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Row 6: Buying Price & HSN Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Buying Price
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.BuyingPrice}
                  onChange={(e) => handleInputChange('BuyingPrice', e.target.value)}
                  placeholder="0.00" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                HSN Code/SAC No.
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="text" 
                  value={formData.HSNCode}
                  onChange={(e) => handleInputChange('HSNCode', e.target.value)}
                  placeholder="Code" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Row 7: SGST % & CGST % */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                S.G.S.T. (%)
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.SGST}
                  onChange={(e) => handleInputChange('SGST', e.target.value)}
                  placeholder="e.g. 9" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                C.G.S.T. (%)
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.CGST}
                  onChange={(e) => handleInputChange('CGST', e.target.value)}
                  placeholder="e.g. 9" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Row 8: IGST % & Item Custom SKU option */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                I.G.S.T. (%)
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.IGST}
                  onChange={(e) => handleInputChange('IGST', e.target.value)}
                  placeholder="e.g. 18" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Item Code / SKU
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="text" 
                  value={formData.ItemCode}
                  onChange={(e) => handleInputChange('ItemCode', e.target.value)}
                  placeholder="Auto-generated if empty" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono uppercase" 
                />
              </div>
            </div>
          </div>

          {/* Row 9: Min Stock & Max Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-[#8faad8]">
            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Min. Stock
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.MinStock}
                  onChange={(e) => handleInputChange('MinStock', e.target.value)}
                  placeholder="0" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8]">
                Max. capacity
              </div>
              <div className="col-span-2 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.MaxCapacity}
                  onChange={(e) => handleInputChange('MaxCapacity', e.target.value)}
                  placeholder="0" 
                  className="w-2/3 px-2.5 py-1 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Row 10: Current In Stock (Fallback / Opening Quantity Helper) */}
          <div className="grid grid-cols-1">
            <div className="grid grid-cols-6">
              <div className="bg-[#f1f5f9] px-3 py-2.5 flex items-center font-semibold text-gray-950 text-xs uppercase border-r border-[#8faad8] col-span-2 md:col-span-1">
                Immediate Stock
              </div>
              <div className="col-span-4 md:col-span-5 bg-[#f1f5f9] p-1 flex items-center">
                <input 
                  type="number" 
                  step="any"
                  value={formData.Quantity}
                  onChange={(e) => handleInputChange('Quantity', e.target.value)}
                  placeholder="Current existing quantity" 
                  className="w-1/4 px-2.5 py-1.5 border border-[#8faad8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900 font-medium font-mono" 
                />
              </div>
            </div>
          </div>

        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/items')}
            disabled={saving}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-xs cursor-pointer disabled:opacity-50"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING...' : 'SAVE DETAILS'}
          </button>
        </div>
      </form>
    </div>
  );
}
