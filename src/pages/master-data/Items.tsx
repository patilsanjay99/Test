import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function Items() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const companyId = activeCompany?.id || '';
      const res = await fetch(`/api/v1/data/InventoryItems?CompanyId=${companyId}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      
      const locRes = await fetch(`/api/data/locations?CompanyId=${companyId}`);
      const locData = await locRes.json();
      setLocations(Array.isArray(locData) ? locData : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeCompany?.id]);

  const getLocationName = (id: any, fbLocation: any) => {
    if (id) {
       const l = locations.find(loc => String(loc.Id || loc.id) === String(id));
       if (l) return l.Name;
    }
    return fbLocation || '-';
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const res = await fetch(`/api/v1/data/InventoryItems/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchItems();
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || 'Failed to delete record.');
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredItems = items.filter(item => {
    const name = (item.Name || item.name || '').toLowerCase();
    const code = (item.ItemCode || item.itemcode || '').toLowerCase();
    const cat = (item.Category || item.category || '').toLowerCase();
    const loc = (item.Location || item.location || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || code.includes(search) || cat.includes(search) || loc.includes(search);
  });

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Items Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage products, services, HSN codes, and pricing.</p>
        </div>
        {hasPermission('/master/items', 'add') && (
<button 
          onClick={() => navigate('/master/items/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-[#f4fbf4]"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Item Name & Code</th>
                <th className="font-medium p-4 border-b border-gray-200">Category</th>
                <th className="font-medium p-4 border-b border-gray-200">Location</th>
                <th className="font-medium p-4 border-b border-gray-200">HSN & Taxes</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Selling Price (Mem / Non-Mem)</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Stock (Min / Max)</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                 <tr><td colSpan={7} className="p-4 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : filteredItems.length === 0 ? (
                 <tr><td colSpan={7} className="p-4 text-center text-sm text-gray-500">No records found</td></tr>
              ) : filteredItems.map((item) => (
                <tr key={item.Id || item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.Name || item.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{item.ItemCode || item.itemcode || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div>{item.Category || item.category || '-'}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div className="font-medium text-gray-800">{getLocationName(item.LocationId || item.locationId || item.Location || item.location, item.Location || item.location)}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 font-mono">
                    <div>{item.HSNCode || item.hsncode || item.HSN || '-'}</div>
                    <div className="text-xs text-gray-400">
                      S:{item.SGST || 0}% / C:{item.CGST || 0}%
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">
                    <div>₹{item.SellingPriceMembers ?? item.sellingpricemembers ?? item.UnitPrice ?? item.unitprice ?? 0} <span className="text-xs text-gray-500">/ ₹{item.SellingPriceNonMembers ?? item.sellingpricenonmembers ?? 0}</span></div>
                    <div className="text-xs text-gray-400">Buying: ₹{item.BuyingPrice ?? item.buyingprice ?? 0}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">
                    <div className="font-medium text-blue-600">{item.Quantity || 0} {item.Unit || 'kg'}</div>
                    <div className="text-xs text-gray-400">Min: {item.MinStock ?? 0} / Max: {item.MaxCapacity ?? 0}</div>
                  </td>
                  <td className="p-4 text-sm text-right">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      (item.Status || item.status) === 'Inactive' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {item.Status || item.status || 'Active'}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasPermission('/master/items', 'edit') && (
                      <button 
                        onClick={() => navigate(`/master/items/${item.Id || item.id}`)}
                        className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" 
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      )}
                    {hasPermission('/master/items', 'delete') && (
                      <button 
                        onClick={() => handleDelete(item.Id || item.id)} 
                        className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer" 
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {filteredItems.length} of {items.length} entries
        </div>
      </div>
    </div>
  );
}
