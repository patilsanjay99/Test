import React from 'react';
import { ArrowLeft, Save, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AssetForm() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/assets')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Asset</h1>
            <p className="text-sm text-gray-500 mt-1">Register a new fixed asset or machinery into the system.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Save Asset
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-400" /> Asset Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Asset Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. Tractor Mahindra 575 DI" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Asset ID / Code</label>
              <input type="text" placeholder="e.g. AST-004" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white uppercase font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Asset Category <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Category...</option>
                <option value="Machinery">Machinery</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="IT Equipment">IT Equipment</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Location / Godown</label>
              <input type="text" placeholder="e.g. Farm Hub A" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Active">Active / In Use</option>
                <option value="Maintenance">Under Maintenance</option>
                <option value="Scrapped">Scrapped</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 pt-4">Financial & Depreciation Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Purchase Date <span className="text-red-500">*</span></label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Purchase Cost (₹) <span className="text-red-500">*</span></label>
              <input type="number" min="0" placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Depreciation Method</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="WDV">Written Down Value (WDV)</option>
                <option value="SLM">Straight Line Method (SLM)</option>
                <option value="None">No Depreciation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Depreciation Rate (%)</label>
              <input type="number" min="0" max="100" placeholder="e.g. 15" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
            </div>
          </div>
          
          <div className="space-y-1.5 pt-4 border-t border-gray-100">
            <label className="text-sm font-medium text-gray-700 block">Additional Notes</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              placeholder="Serial numbers, warranty information, or condition details..."
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
