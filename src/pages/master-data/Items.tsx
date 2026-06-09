import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Items() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/v1/data/InventoryItems');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await fetch(`/api/v1/data/InventoryItems/${id}`, { method: 'DELETE' });
      fetchItems();
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Items Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage products, services, HSN codes, and pricing.</p>
        </div>
        <button 
          onClick={() => navigate('/master/items/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Item Name & Code</th>
                <th className="font-medium p-4 border-b border-gray-200">Category</th>
                <th className="font-medium p-4 border-b border-gray-200">HSN & GST</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Selling Price</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">In Stock</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                 <tr><td colSpan={6} className="p-4 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                 <tr><td colSpan={6} className="p-4 text-center text-sm text-gray-500">No records found</td></tr>
              ) : items.map((item) => (
                <tr key={item.Id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.Name}</div>
                        <div className="text-xs text-gray-500 font-mono">{item.ItemCode || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{item.Category || '-'}</td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900 font-mono">-</div>
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">
                    ₹{item.UnitPrice || 0} <span className="text-gray-500 text-xs font-sans">/ {item.Unit || 'kg'}</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900 text-right">
                    {item.Quantity || 0} <span className="text-gray-500 font-normal">{item.Unit || ''}</span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Item">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.Id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete Item">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {items.length} entries
        </div>
      </div>
    </div>
  );
}
