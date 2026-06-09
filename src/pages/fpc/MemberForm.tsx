import React from 'react';
import { ArrowLeft, Save, Users, MapPin, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MemberForm() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/fpc/members')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Member</h1>
            <p className="text-sm text-gray-500 mt-1">Register a new farmer shareholder into the FPC.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Save Details
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" /> Personal Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. Ramesh Patel" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Father/Husband Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. Suresh Patel" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
              <input type="tel" placeholder="+91" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Aadhaar Number</label>
              <input type="text" placeholder="XXXX XXXX XXXX" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 pt-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" /> Address Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-sm font-medium text-gray-700">Address Line 1</label>
              <input type="text" placeholder="House No, Street..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Village</label>
              <input type="text" placeholder="e.g. Paldi" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Gram Panchayat</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Block/Tehsil</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">District</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">State</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">PIN Code</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 pt-4 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-gray-400" /> Farming & Share Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 border-b border-gray-100 pb-2">Land Information</h3>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Land Holding (Acres)</label>
                <input type="number" step="0.1" placeholder="0.0" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Irrigation Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select...</option>
                  <option value="Irrigated">Irrigated</option>
                  <option value="Rainfed">Rainfed</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Major Crops Grown</label>
                <input type="text" placeholder="e.g. Wheat, Cotton" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>

            <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 border-b border-blue-100 pb-2">Share Capital</h3>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Number of Shares Allocated</label>
                <input type="number" min="0" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Face Value per Share (₹)</label>
                <input type="number" min="0" defaultValue="100" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
              </div>
              <div className="pt-2 flex justify-between items-center group">
                <span className="text-sm font-medium text-gray-700">Total Share Amount</span>
                <span className="text-lg font-bold text-gray-900 font-mono">₹0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
