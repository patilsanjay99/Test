import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function FinancialYearForm() {
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const [formData, setFormData] = useState({
    FinancialYear: '',
    FromDate: '',
    ToDate: '',
    Status: 'Active'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) {
      alert("Please create or select an active company first.");
      return;
    }
    if (!formData.FinancialYear) {
      alert("Financial Year Label is required.");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/v1/data/FinancialYears', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, CompanyId: activeCompany.id })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server error');
      }
      
      // Need to force refresh AppContext if we wanted, but reload or moving routes is enough
      // To properly refresh context, we would need a refresh function in context,
      // but navigating usually re-fetches if we have it built in. 
      // Temporary simple reload to ensure context picks up the new FY:
      window.location.href = '/master/financial-years';
    } catch(err: any) {
      alert("Failed to save financial year: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/master/financial-years')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add Financial Year</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="col-span-full space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Financial Year Label *</label>
            <input required type="text" name="FinancialYear" placeholder="e.g. 2024-2025" value={formData.FinancialYear} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
            <p className="text-xs text-gray-500">Company formatting will be applied based on your active company.</p>
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">From Date</label>
            <input required type="date" name="FromDate" value={formData.FromDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">To Date</label>
            <input required type="date" name="ToDate" value={formData.ToDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select name="Status" value={formData.Status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/financial-years')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 text-gray-700 bg-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Financial Year'}
          </button>
        </div>
      </form>
    </div>
  );
}
