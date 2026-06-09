import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function CustomerForm() {
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const [formData, setFormData] = useState({
    CustomerName: '',
    RegistrationNo: '',
    Address: '',
    OpeningBalance: 0,
    ContactPerson: '',
    PhoneNo: '',
    EmailID: '',
    StateCode: '',
    Range: '',
    Division: '',
    GSTINNo: '',
    AadharCardNo: '',
    TANNo: '',
    PANNo: '',
    CINNo: '',
    Commissionrate: 0,
    AccountingCircle: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.CustomerName) return alert("Customer name is required.");
    try {
      setSaving(true);
      await fetch('/api/v1/data/Customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, CompanyId: activeCompany?.id || null })
      });
      navigate('/master/customers');
    } catch(err) {
      alert("Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/master/customers')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Customer</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="col-span-full pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
             <h2 className="text-base font-semibold text-gray-900 bg-green-600/10 text-green-700 px-3 py-1 rounded w-fit">Customer Master</h2>
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Customer Name *</label>
            <input required type="text" name="CustomerName" value={formData.CustomerName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Registration No.</label>
            <input type="text" name="RegistrationNo" value={formData.RegistrationNo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>

          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <textarea name="Address" value={formData.Address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50 h-[84px] resize-none"></textarea>
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Opening Balance</label>
            <input type="number" name="OpeningBalance" value={formData.OpeningBalance || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>

          <div className="col-span-full pt-4 pb-2 mb-2 border-y border-gray-100">
             <h2 className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded">Business Details</h2>
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Contact Person</label>
            <input type="text" name="ContactPerson" value={formData.ContactPerson} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Phone No.</label>
            <input type="text" name="PhoneNo" value={formData.PhoneNo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>

          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">E-mail ID</label>
            <input type="email" name="EmailID" value={formData.EmailID} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>
          
          <div className="col-span-full pt-4 pb-2 mb-2 border-y border-gray-100">
             <h2 className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded">Business Zone Details</h2>
          </div>

          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">State Code</label>
            <input type="text" name="StateCode" value={formData.StateCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Range</label>
            <input type="text" name="Range" value={formData.Range} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Division</label>
            <input type="text" name="Division" value={formData.Division} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Commissionrate</label>
            <input type="number" name="Commissionrate" value={formData.Commissionrate || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Accounting Circle</label>
            <input type="text" name="AccountingCircle" value={formData.AccountingCircle} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>

          <div className="col-span-full pt-4 pb-2 mb-2 border-y border-gray-100">
             <h2 className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded">Tax Identification Details</h2>
          </div>
          
          <div className="col-span-1 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">GSTIN No.</label>
            <input type="text" name="GSTINNo" value={formData.GSTINNo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
          </div>

          <div className="col-span-1 space-y-1.5 grid grid-cols-2 gap-4">
             <div>
               <label className="text-sm font-medium text-gray-700">Aadhar Card No.</label>
               <input type="text" name="AadharCardNo" value={formData.AadharCardNo} onChange={handleChange} className="w-full mt-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
             </div>
             <div>
               <label className="text-sm font-medium text-gray-700">PAN No.</label>
               <input type="text" name="PANNo" value={formData.PANNo} onChange={handleChange} className="w-full mt-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
             </div>
          </div>
          
          <div className="col-span-1 space-y-1.5 grid grid-cols-2 gap-4">
             <div>
                <label className="text-sm font-medium text-gray-700">TAN No.</label>
                <input type="text" name="TANNo" value={formData.TANNo} onChange={handleChange} className="w-full mt-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
             </div>
             <div>
                <label className="text-sm font-medium text-gray-700">CIN No.</label>
                <input type="text" name="CINNo" value={formData.CINNo} onChange={handleChange} className="w-full mt-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-amber-50" />
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/customers')}
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
            {saving ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
