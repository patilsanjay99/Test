import React, { useState } from 'react';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CompanyForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Name: '',
    GSTIN: '',
    PAN: '',
    City: '',
    State: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.Name) return alert('Company Name is required');
    try {
      setSaving(true);
      await fetch('/api/v1/data/Companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      navigate('/master/company');
    } catch(e) {
      alert('Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/master/company')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Company</h1>
            <p className="text-sm text-gray-500 mt-1">Add a new FPC entity to the system.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/master/company')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Company'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" /> Basic Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
              <input type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} placeholder="e.g. AgriCorp FPC Ltd" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">GST Number</label>
              <input type="text" value={formData.GSTIN} onChange={e => setFormData({...formData, GSTIN: e.target.value})} placeholder="e.g. 27AABCA1234K1Z1" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white uppercase font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">PAN Number</label>
              <input type="text" value={formData.PAN} onChange={e => setFormData({...formData, PAN: e.target.value})} placeholder="e.g. AABCA1234K" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white uppercase font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">City</label>
              <input type="text" value={formData.City} onChange={e => setFormData({...formData, City: e.target.value})} placeholder="e.g. Pune" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">State</label>
              <input type="text" value={formData.State} onChange={e => setFormData({...formData, State: e.target.value})} placeholder="e.g. Maharashtra" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
