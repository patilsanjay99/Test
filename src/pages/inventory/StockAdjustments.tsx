import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Download, SlidersHorizontal, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, formatDate } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';

export function StockAdjustments() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdjustments = () => {
    Promise.all([
      fetch(`/api/v1/data/StockAdjustments?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/data/locations?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => [])
    ]).then(([adjData, locData]) => {
      setAdjustments(Array.isArray(adjData) ? adjData : []);
      setLocations(Array.isArray(locData) ? locData : []);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchAdjustments();
  }, [activeCompany?.id]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      await fetch(`/api/v1/data/StockAdjustments/${id}`, { method: 'DELETE' });
      fetchAdjustments();
    }
  };

  const filteredAdjustments = adjustments.filter(adj => {
    const term = searchTerm.toLowerCase();
    const adjNo = (adj.AdjustmentNo || '').toLowerCase();
    const reason = (adj.Reason || '').toLowerCase();
    return adjNo.includes(term) || reason.includes(term);
  });

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Adjustments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage manual stock quantity and value corrections.</p>
        </div>
        {hasPermission('/inventory/adjustments', 'add') && ( <button 
          onClick={() => navigate('/inventory/adjustments/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Adjustment
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by ID or reason..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(filteredAdjustments, 'StockAdjustments')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Adjustment No & Date</th>
                <th className="font-medium p-4 border-b border-gray-200">Adjustment Type</th>
                <th className="font-medium p-4 border-b border-gray-200">Reason</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Quantity</th>
                <th className="font-medium p-4 border-b border-gray-200">Location</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAdjustments.map((adj) => {
                // Calculate Total Quantity and gather unique Locations from ItemsData
                let totalQty = 0;
                const locNames = new Set<string>();
                try {
                  const items = JSON.parse(adj.ItemsData || '[]');
                  if (Array.isArray(items)) {
                    items.forEach(item => {
                      totalQty += Number(item.qty || item.Quantity || 0);
                      const locId = item.locationId || item.LocationId;
                      if (locId) {
                        const loc = locations.find(l => String(l.Id || l.id) === String(locId));
                        if (loc) locNames.add(loc.Name);
                      }
                    });
                  }
                } catch (e) {}

                const locStr = locNames.size > 0 ? Array.from(locNames).join(', ') : '-';

                return (
                <tr key={adj.Id || adj.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border 
                        ${adj.AdjustmentType === 'Quantity Addition' ? 'bg-green-50 text-green-600 border-green-100' :
                        adj.AdjustmentType === 'Quantity Reduction' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {adj.AdjustmentType === 'Quantity Addition' ? <ArrowDownRight className="w-4 h-4" /> :
                         adj.AdjustmentType === 'Quantity Reduction' ? <ArrowUpRight className="w-4 h-4" /> :
                         <SlidersHorizontal className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">{adj.AdjustmentNo}</div>
                        <div className="text-xs text-gray-500">{formatDate(adj.AdjustmentDate)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-900">{adj.AdjustmentType}</td>
                  <td className="p-4 text-sm text-gray-600">{adj.Reason}</td>
                  <td className="p-4 text-sm font-mono text-gray-900 text-right">{totalQty}</td>
                  <td className="p-4 text-sm text-gray-600">{locStr}</td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasPermission('/inventory/adjustments', 'edit') && ( <button 
                      onClick={() => navigate(`/inventory/adjustments/${adj.Id || adj.id}`)}
                      className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button> )}
                    {hasPermission('/inventory/adjustments', 'delete') && ( <button 
                      onClick={() => handleDelete(adj.Id || adj.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button> )}
                  </td>
                </tr>
              )})}
              {filteredAdjustments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                    No adjustments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {filteredAdjustments.length} of {filteredAdjustments.length} entries
        </div>
      </div>
    </div>
  );
}
