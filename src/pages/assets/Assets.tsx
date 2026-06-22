import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, formatDate } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';

export function Assets() {
  const { hasPermission } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();

  // Fetch real assets from backend
  useEffect(() => {
    if (!activeCompany?.id) return;
    setLoading(true);
    fetch(`/api/v1/data/Assets?CompanyId=${activeCompany.id}`)
      .then(res => res.json())
      .then(data => {
        setAssets(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Error fetching assets:', err);
      })
      .finally(() => setLoading(false));
  }, [activeCompany?.id]);

  // Handle asset deletion
  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to Scrap / Delete this asset?')) {
      try {
        const response = await fetch(`/api/v1/data/Assets/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setAssets(prev => prev.filter(a => (a.Id ?? a.id) !== id));
        } else {
          alert('Could not delete the asset.');
        }
      } catch (err: any) {
        console.error(err);
        alert(`Error: ${err.message}`);
      }
    }
  };

  // Filter assets based on search and category
  const filteredAssets = assets.filter(item => {
    const name = (item.Name ?? item.name ?? '').toLowerCase();
    const code = (item.AssetCode ?? item.assetcode ?? '').toLowerCase();
    const category = (item.Category ?? item.category ?? '').toLowerCase();
    const location = (item.Location ?? item.location ?? '').toLowerCase();

    const matchesSearch = 
      name.includes(searchTerm.toLowerCase()) || 
      code.includes(searchTerm.toLowerCase()) || 
      category.includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase());

    const itemCategory = item.Category ?? item.category ?? '';
    const matchesCategory = selectedCategory 
      ? itemCategory.toLowerCase() === selectedCategory.toLowerCase() 
      : true;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Asset Register</h1>
          <p className="text-sm text-gray-500 mt-1">Manage fixed assets, machinery, and track depreciation.</p>
        </div>
        {hasPermission('/assets', 'add') && (
<button 
          onClick={() => navigate('/assets/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Machinery">Machinery</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Furniture">Furniture</option>
            </select>
            <button 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2 cursor-pointer" 
              onClick={() => {
                const cleanExportList = filteredAssets.map(item => ({
                  'Asset Code': item.AssetCode ?? item.assetcode ?? '',
                  'Asset Name': item.Name ?? item.name ?? '',
                  'Category': item.Category ?? item.category ?? '',
                  'Location': item.Location ?? item.location ?? '',
                  'Purchase Date': formatDate(item.PurchaseDate ?? item.purchasedate ?? ''),
                  'Original Cost': parseFloat(item.Cost ?? item.cost ?? 0),
                  'Current Value': parseFloat(item.Value ?? item.value ?? 0),
                  'Depreciation Method': item.DeprMethod ?? item.deprmethod ?? 'WDV',
                  'Depreciation Rate (%)': parseFloat(item.DeprRate ?? item.deprrate ?? 0),
                  'Status': item.Status ?? item.status ?? 'Active',
                  'Notes': item.Notes ?? item.notes ?? '',
                }));
                exportToCSV(cleanExportList, 'Assets');
              }}
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span>Loading asset records...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium">No assets found</p>
              <p className="text-xs text-gray-400 mt-1">Try adapting your filters or create a new asset record.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="font-medium p-4 border-b border-gray-200">Asset Details</th>
                  <th className="font-medium p-4 border-b border-gray-200">Category</th>
                  <th className="font-medium p-4 border-b border-gray-200">Location</th>
                  <th className="font-medium p-4 border-b border-gray-200">Purchase Date</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Original Cost (₹)</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Current Value (₹)</th>
                  <th className="font-medium p-4 border-b border-gray-200">Status</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAssets.map((item) => {
                  const dbId = item.Id ?? item.id;
                  const name = item.Name ?? item.name ?? 'Unnamed Asset';
                  const code = item.AssetCode ?? item.assetcode ?? `AST-${dbId}`;
                  const category = item.Category ?? item.category ?? 'N/A';
                  const location = item.Location ?? item.location ?? 'N/A';
                  const dateRaw = item.PurchaseDate ?? item.purchasedate ?? '';
                  const originalCost = parseFloat(item.Cost ?? item.cost ?? 0);
                  const currentValue = parseFloat(item.Value ?? item.value ?? 0);
                  const status = item.Status ?? item.status ?? 'Active';

                  return (
                    <tr key={dbId} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200 shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500 font-mono">{code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-900">
                        {category}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <div className="font-medium text-gray-800">{location}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-mono">{formatDate(dateRaw)}</td>
                      <td className="p-4 text-sm text-gray-900 font-mono text-right">
                        {originalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900 font-mono text-right">
                        {currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          status === 'Active' ? 'bg-green-100 text-green-700' :
                          status === 'Maintenance' ? 'bg-amber-100 text-amber-700' :
                          status === 'Scrapped' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          {hasPermission('/assets', 'edit') && (
                            <button 
                              onClick={() => navigate(`/assets/${dbId}`)}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded cursor-pointer" 
                              title="Edit Asset"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            )}
                          {hasPermission('/assets', 'delete') && (
                            <button 
                              onClick={() => handleDelete(dbId)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer" 
                              title="Scrap / Delete Asset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {filteredAssets.length} of {filteredAssets.length} entries
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-300 cursor-not-allowed" disabled>Prev</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-blue-50 text-blue-600 font-medium border-blue-200">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-not-allowed" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
