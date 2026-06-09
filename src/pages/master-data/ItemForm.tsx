import React, { useState } from 'react';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ItemForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Name: '',
    ItemCode: '',
    Category: '',
    Unit: 'kg',
    UnitPrice: 0,
    Quantity: 0
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.Name) return alert('Item Name is required');
    try {
      setSaving(true);
      await fetch('/api/v1/data/InventoryItems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      navigate('/master/items');
    } catch(e) {
      alert('Error saving item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/master/items')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Item</h1>
            <p className="text-sm text-gray-500 mt-1">Add a new product or service to the master catalog.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/master/items')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" /> General Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Item Name <span className="text-red-500">*</span></label>
              <input type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} placeholder="e.g. Premium Wheat Seeds" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Item Code / SKU</label>
              <input type="text" value={formData.ItemCode} onChange={e => setFormData({...formData, ItemCode: e.target.value})} placeholder="e.g. ITM-004" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white uppercase font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Category...</option>
                <option value="Seeds">Seeds</option>
                <option value="Fertilizers">Fertilizers</option>
                <option value="Pesticides">Pesticides</option>
                <option value="Machinery">Machinery</option>
                <option value="Services">Services</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Unit of Measure (UoM)</label>
              <select value={formData.Unit} onChange={e => setFormData({...formData, Unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="kg">Kilograms (kg)</option>
                <option value="Bag">Bag</option>
                <option value="Ltr">Liters (Ltr)</option>
                <option value="Pcs">Pieces (Pcs)</option>
                <option value="Box">Box</option>
              </select>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 pt-4">Tax & Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">HSN / SAC Code <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. 1001" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">GST Rate (%)</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="0">0% (Nil Rated / Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Selling Price (₹)</label>
              <input type="number" value={formData.UnitPrice} onChange={e => setFormData({...formData, UnitPrice: parseFloat(e.target.value) || 0})} placeholder="0.00" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Purchase Cost (₹)</label>
              <input type="number" placeholder="0.00" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 pt-4">Inventory Preferences</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <div>
                <span className="text-sm font-medium text-gray-900 block group-hover:text-blue-600 transition-colors">Track Inventory for this item</span>
                <span className="text-xs text-gray-500 block">Uncheck for services or non-stock items</span>
              </div>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7 pt-2">
               <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Opening Stock (Qty)</label>
                <input type="number" value={formData.Quantity} onChange={e => setFormData({...formData, Quantity: parseInt(e.target.value) || 0})} placeholder="0" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Reorder Level</label>
                <input type="number" placeholder="0" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
