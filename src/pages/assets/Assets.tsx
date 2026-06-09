import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockAssets = [
  { id: 'AST-001', name: 'Tractor Mahindra 575 DI', category: 'Machinery', purchaseDate: '10/05/2023', cost: 650000, value: 585000, location: 'Farm Hub A', status: 'Active' },
  { id: 'AST-002', name: 'Cold Storage Unit', category: 'Infrastructure', purchaseDate: '20/11/2022', cost: 1200000, value: 1050000, location: 'Main Godown', status: 'Active' },
  { id: 'AST-003', name: 'Office Computers', category: 'IT Equipment', purchaseDate: '15/01/2024', cost: 85000, value: 80000, location: 'Head Office', status: 'Active' },
];

export function Assets() {
  const [assets] = useState(mockAssets);
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Asset Register</h1>
          <p className="text-sm text-gray-500 mt-1">Manage fixed assets, machinery, and track depreciation.</p>
        </div>
        <button 
          onClick={() => navigate('/assets/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Categories</option>
              <option value="Machinery">Machinery</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Vehicles">Vehicles</option>
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(assets, 'Assets')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Asset Details</th>
                <th className="font-medium p-4 border-b border-gray-200">Category & Location</th>
                <th className="font-medium p-4 border-b border-gray-200">Purchase Date</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Original Cost (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Current Value (₹)</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200 shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{asset.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900">{asset.category}</div>
                    <div className="text-xs text-gray-500">{asset.location}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{asset.purchaseDate}</td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">{asset.cost.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-sm font-medium text-gray-900 font-mono text-right">{asset.value.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Asset">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600 transition-colors" title="Scrap / Delete Asset">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {assets.length} of {assets.length} entries
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
