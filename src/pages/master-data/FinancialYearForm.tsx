import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export function FinancialYearForm() {
  const navigate = useNavigate();
  const { activeCompany, refreshFinancialYears } = useAppContext();
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
      
      refreshFinancialYears();
      navigate('/master/financial-years');
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
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/financial-years')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">Financial Year Master</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase">
          CREATE FINANCIAL YEAR MASTER
        </div>

        {/* Form Master Grid Box */}
        <div className="grid grid-cols-1">
          
          {/* Row 1: Financial Year Label */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              Financial Year Label <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <input 
                required 
                type="text" 
                name="FinancialYear" 
                placeholder="e.g. 2024-2025" 
                value={formData.FinancialYear} 
                onChange={handleChange} 
                className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
              />
            </div>
          </div>

          {/* Row 2: From Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              From Date (dd/mm/yyyy) <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <CustomDatePicker 
                required 
                value={formData.FromDate} 
                onChange={(val) => setFormData(prev => ({ ...prev, FromDate: val }))} 
                className="w-full"
              />
            </div>
          </div>

          {/* Row 3: To Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              To Date (dd/mm/yyyy) <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <CustomDatePicker 
                required 
                value={formData.ToDate} 
                onChange={(val) => setFormData(prev => ({ ...prev, ToDate: val }))} 
                className="w-full"
              />
            </div>
          </div>

          {/* Row 4: Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              Status
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <select 
                name="Status" 
                value={formData.Status} 
                onChange={handleChange} 
                className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/financial-years')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] bg-white transition-colors text-sm"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Financial Year'}
          </button>
        </div>
      </form>
    </div>
  );
}
