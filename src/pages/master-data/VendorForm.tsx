import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function VendorForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useAppContext();
  
  const [formData, setFormData] = useState({
    COMPANYID: null as number | null,
    Vendor_NAME: '',
    registration_no: '',
    Vendor_address: '',
    opening_balance: 0,
    business_details: '',
    contact_person: '',
    phone_no: '',
    email_id: '',
    GSTIN: '',
    aadhar_no: '',
    pan_no: '',
    tan_no: '',
    cin_no: '',
    state_code: '',
    Range: '',
    Division: '',
    Commissionrate: '',
    circle: '',
    payment_note: '',
    state_id: null as number | null,
    state_name: '',
    ISACTIVE: 'Y',
    Place: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/v1/data/Vendors/${id}`)
        .then(res => res.json())
        .then(data => {
          const sanitizedData: any = {};
          for (const key in data) {
            sanitizedData[key] = data[key] === null ? '' : data[key];
          }
          setFormData(prev => ({
            ...prev,
            ...sanitizedData
          }));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Vendor_NAME) return alert("Vendor Name is required.");
    try {
      setSaving(true);

      const queryParam = activeCompany?.id ? `?COMPANYID=${activeCompany.id}` : '';
      const existingRes = await fetch(`/api/v1/data/Vendors${queryParam}`);
      if (existingRes.ok) {
          const existing = await existingRes.json();
          const duplicate = existing.find((item: any) => {
               const itemId = item.Vendor_ID ?? item.Vendor_Id ?? item.vendor_id ?? item.id ?? item.Id ?? item.ID;
               return item.Vendor_NAME?.trim().toLowerCase() === formData.Vendor_NAME.trim().toLowerCase() && 
                      String(itemId) !== String(id || '');
          });
          if (duplicate) {
              alert("Vendor Name already exists. Please choose a different name.");
              setSaving(false);
              return;
          }
      }

      const url = id ? `/api/v1/data/Vendors/${id}` : '/api/v1/data/Vendors';
      const method = id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, COMPANYID: activeCompany?.id || null })
      });
      if (!response.ok) {
        let errText = await response.text();
        try { errText = JSON.parse(errText).error || errText; } catch(e) {}
        throw new Error(errText);
      }
      navigate('/master/vendors');
    } catch(err: any) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master/vendors')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {id ? 'Edit Vendor Details' : 'Add New Vendor'}
          </h1>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm animate-pulse">
          Loading vendor information...
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden transition-all duration-300">
          
          {/* Main Title Header Banner with elegant emerald gradient */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white py-4 px-6 text-center font-bold text-lg tracking-wider uppercase shadow-md flex items-center justify-center gap-2 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Vendor Master File
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
 
          {/* Form Master Grid Box */}
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
            
            {/* LEFT COLUMN */}
            <div className="flex flex-col">
              
              {/* Row 1: Vendor Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Vendor Name <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    required 
                    type="text" 
                    name="Vendor_NAME" 
                    value={formData.Vendor_NAME} 
                    onChange={handleChange} 
                    placeholder="Enter full vendor or company name"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 1.1: Place */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Place
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="Place" 
                    value={formData.Place} 
                    onChange={handleChange} 
                    placeholder="E.g., City, Town or Region"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 2: Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[72px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Address
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <textarea 
                    name="Vendor_address" 
                    value={formData.Vendor_address} 
                    onChange={handleChange} 
                    rows={2}
                    placeholder="Enter office, warehouse or billing address"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all resize-none placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 3: Business Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b-0 lg:border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Business Details
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="business_details" 
                    value={formData.business_details} 
                    onChange={handleChange} 
                    placeholder="Nature of principal business activity"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
 
            </div>
 
            {/* RIGHT COLUMN */}
            <div className="flex flex-col">
              
              {/* Row 1: Registration No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Registration No.
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="registration_no" 
                    maxLength={20}
                    value={formData.registration_no} 
                    onChange={handleChange} 
                    placeholder="Enter Registration No."
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold tracking-wide text-slate-800 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 2: Opening Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Opening Balance
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <div className="relative flex items-center w-full max-w-[280px]">
                    <span className="absolute left-3 text-slate-500 font-bold text-sm">₹</span>
                    <input 
                      type="number" 
                      name="opening_balance" 
                      value={formData.opening_balance || ''} 
                      onChange={handleChange} 
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 bg-[#fcfcfc] border border-slate-300 rounded-md py-1.5 text-sm font-mono font-bold text-slate-800 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Contact Person
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="contact_person" 
                    value={formData.contact_person} 
                    onChange={handleChange} 
                    placeholder="Enter name of representative"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Row 4.5: Phone No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Phone No.
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="phone_no" 
                    maxLength={15}
                    value={formData.phone_no || ''} 
                    onChange={handleChange} 
                    placeholder="Enter contact phone number"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 5: Email ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b-0 lg:border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  E-mail ID
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="email" 
                    name="email_id" 
                    value={formData.email_id} 
                    onChange={handleChange} 
                    placeholder="e.g. suppliers@company.com"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
 
            </div>
 
          </div>

          {/* Tax & Business Zone Details Grid Box - Ensures perfect horizontal alignment of banners and fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-slate-200 border-t border-slate-200">
            
            {/* LEFT COLUMN - TAX DETAILS */}
            <div className="flex flex-col">
              
              {/* Row 6: Tax Identification Details HEADER BANNER */}
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white py-2.5 px-5 font-bold text-xs tracking-wider uppercase border-b border-slate-100 text-left select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>
                Tax Identification Details
              </div>
 
              {/* Row 7: GSTIN No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  GSTIN No.
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="GSTIN" 
                    maxLength={15}
                    value={formData.GSTIN} 
                    onChange={handleChange} 
                    placeholder="Enter GSTIN"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold tracking-wider text-slate-800 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all uppercase placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 8: Aadhar Card No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Aadhar Card No.
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="aadhar_no" 
                    maxLength={12}
                    value={formData.aadhar_no} 
                    onChange={handleChange} 
                    placeholder="Enter Aadhar Card No."
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold tracking-widest text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 8.5: PAN No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  PAN No.
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="pan_no" 
                    maxLength={10}
                    value={formData.pan_no} 
                    onChange={handleChange} 
                    placeholder="Enter PAN No."
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold tracking-wide text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all uppercase placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 9: TAN No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  TAN No.
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="tan_no" 
                    maxLength={20}
                    value={formData.tan_no} 
                    onChange={handleChange} 
                    placeholder="Enter TAN No."
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold tracking-wide text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all uppercase placeholder-slate-400"
                  />
                </div>
              </div>
 
              {/* Row 9.5: CIN No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b-0 border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  CIN No.
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="cin_no" 
                    maxLength={21}
                    value={formData.cin_no} 
                    onChange={handleChange} 
                    placeholder="Enter CIN"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold tracking-wide text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all uppercase placeholder-slate-400"
                  />
                </div>
              </div>
 
            </div>
 
            {/* RIGHT COLUMN - BUSINESS ZONE DETAILS */}
            <div className="flex flex-col">
 
              {/* Row 4: Business Zone Details HEADER BANNER */}
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white py-2.5 px-5 font-bold text-xs tracking-wider uppercase border-b border-slate-100 text-left select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>
                Business Zone Details
              </div>
              {/* Row 5: State Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  State Code
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="state_code" 
                    value={formData.state_code} 
                    onChange={handleChange} 
                    placeholder="2-digit State Reference"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
  
              {/* Row 6: Range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Range
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="Range" 
                    value={formData.Range} 
                    onChange={handleChange} 
                    placeholder="Enter tax jurisdiction range"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
  
              {/* Row 7: Division */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Division
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="Division" 
                    value={formData.Division} 
                    onChange={handleChange} 
                    placeholder="E.g., Dev-I or Dev-II"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
  
              {/* Row 8: Commissionerate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Commissionerate
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="Commissionrate" 
                    maxLength={30}
                    value={formData.Commissionrate} 
                    onChange={handleChange} 
                    placeholder="Enter Commissionerate"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
  
              {/* Row 9: Accounting Circle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 sm:border-b-0 min-h-[52px] items-stretch">
                <div className="bg-slate-50/75 px-5 py-3.5 flex items-center font-bold text-[#334155] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100 select-none">
                  Accounting Circle
                </div>
                <div className="p-2 sm:col-span-2 flex items-center bg-white">
                  <input 
                    type="text" 
                    name="circle" 
                    value={formData.circle} 
                    onChange={handleChange} 
                    placeholder="Corporate accounting unit code"
                    className="w-full max-w-[280px] bg-[#fcfcfc] border border-slate-300 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>
              </div>
 
            </div>
 
          </div>
 
          {/* Action buttons at footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3 select-none">
            <button 
              type="button"
              onClick={() => navigate('/master/vendors')}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-bold transition-all duration-150 active:scale-95 shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-150 active:scale-95 shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Vendor Master'}
            </button>
          </div>
 
        </form>
      )}
    </div>
  );
}
