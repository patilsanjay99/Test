import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Building2, ShieldCheck, Landmark, Image } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function CompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { refreshCompanies } = useAppContext();
  const [formData, setFormData] = useState({
    Name: '',
    PhoneNo: '',
    Address: '',
    EmailID: '',
    ContactPerson: '',
    BusinessDetails: '',
    GSTIN: '',
    PAN: '',
    City: '',
    State: '',
    RegistrationNo: '',
    AadharCardNo: '',
    TANNo: '',
    CINNo: '',
    StateCode: '',
    TaxRange: '',
    Division: '',
    BankName: '',
    BankBranch: '',
    AccountNumber: '',
    AccountType: 'Savings',
    BankAddress: '',
    MICRCode: '',
    IFSCCode: '',
    LogoUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/v1/data/Companies/${id}`)
        .then(res => res.json())
        .then(data => {
          const sanitizedData: any = {};
          for (const key in data) {
            sanitizedData[key] = data[key] === null ? '' : data[key];
          }
          const actualLogo = sanitizedData.LogoUrl || sanitizedData.logoUrl || sanitizedData.logourl || sanitizedData.logo || '';
          setFormData(prev => ({
            ...prev,
            ...sanitizedData,
            LogoUrl: actualLogo
          }));
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = async () => {
    if (!formData.Name) return alert('Company Name is required');
    try {
      setSaving(true);
      const url = id ? `/api/v1/data/Companies/${id}` : '/api/v1/data/Companies';
      const method = id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        let errText = await response.text();
        try { errText = JSON.parse(errText).error || errText; } catch(e) {}
        throw new Error(errText);
      }
      refreshCompanies();
      navigate('/master/company');
    } catch(e: any) {
      console.error(e);
      alert(`Error saving: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12">
      {loading && <div className="p-8 text-center text-gray-500">Loading company details...</div>}
      {!loading && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8 select-none">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => navigate('/master/company')}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Master</h1>
                <p className="text-sm text-gray-500 mt-1">Configure company, tax, and bank accounts.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Main Form container */}
            <div className="space-y-8">
              {/* Section 1: General Details */}
              <div className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden">
            <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
              <Building2 className="w-5 h-5" /> General company Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
              {/* Left Side */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Company Name <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input required type="text" name="Name" value={formData.Name} onChange={handleChange} placeholder="Enter company name" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Phone No.
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="PhoneNo" value={formData.PhoneNo} onChange={handleChange} placeholder="Contact number" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    E-mail ID
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="email" name="EmailID" value={formData.EmailID} onChange={handleChange} placeholder="Email address" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Contact Person
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="ContactPerson" value={formData.ContactPerson} onChange={handleChange} placeholder="Primary contact name" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Business Details
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="BusinessDetails" value={formData.BusinessDetails} onChange={handleChange} placeholder="Nature of business" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Address, City, State
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-1 gap-2 items-center">
                    <input type="text" name="Address" value={formData.Address} onChange={handleChange} placeholder="Address" className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] mb-0.5" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" name="City" value={formData.City} onChange={handleChange} placeholder="City" className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                      <input type="text" name="State" value={formData.State} onChange={handleChange} placeholder="State" className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tax Identification Details */}
          <div className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden">
            <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5" /> TAX IDENTIFICATION DETAILS
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
              {/* Left Side */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Registration No.
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="RegistrationNo" value={formData.RegistrationNo} onChange={handleChange} placeholder="Reg. number" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    GSTIN No.
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="GSTIN" value={formData.GSTIN} onChange={handleChange} placeholder="Enter GSTIN" className="w-full max-w-[280px] px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-semibold uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Aadhar Card No.
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="AadharCardNo" value={formData.AadharCardNo} onChange={handleChange} placeholder="Enter Aadhar Card No." className="w-full max-w-[240px] px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    PAN No.
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="PAN" value={formData.PAN} onChange={handleChange} placeholder="Enter PAN No." className="w-full max-w-[200px] px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-semibold uppercase" />
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    TAN No.
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="TANNo" value={formData.TANNo} onChange={handleChange} placeholder="Enter TAN No." className="w-full max-w-[240px] px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-semibold uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    CIN No.
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="CINNo" value={formData.CINNo} onChange={handleChange} placeholder="Enter CIN" className="w-full max-w-[280px] px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-semibold uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    State Code
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="StateCode" value={formData.StateCode} onChange={handleChange} placeholder="State code" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Range / Division
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                    <input type="text" name="TaxRange" value={formData.TaxRange} onChange={handleChange} placeholder="Tax Range" className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                    <input type="text" name="Division" value={formData.Division} onChange={handleChange} placeholder="Division" className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Bank Details */}
          <div className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden">
            <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
              <Landmark className="w-5 h-5" /> Bank Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
              {/* Left Side */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Account Type
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <select name="AccountType" value={formData.AccountType} onChange={handleChange} className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer">
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                      <option value="Overdraft">Overdraft</option>
                      <option value="Cash Credit">Cash Credit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Bank Name
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="BankName" value={formData.BankName} onChange={handleChange} placeholder="Bank name" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Bank Branch
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="BankBranch" value={formData.BankBranch} onChange={handleChange} placeholder="Branch name" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Account Number
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="AccountNumber" value={formData.AccountNumber} onChange={handleChange} placeholder="A/C number" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    MICR & IFSC Code
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                    <input type="text" name="MICRCode" value={formData.MICRCode} onChange={handleChange} placeholder="MICR Code" className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono uppercase" />
                    <input type="text" name="IFSCCode" value={formData.IFSCCode} onChange={handleChange} placeholder="IFSC Code" className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Bank Address
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input type="text" name="BankAddress" value={formData.BankAddress} onChange={handleChange} placeholder="Corporate address" className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

            </div> {/* End Main Form container */}
            {/* Section 4: Company Logo */}
            <div className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden">
              <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
                <Image className="w-5 h-5" /> Company Logo
              </div>
              <div className="p-6 flex flex-col items-center">
                <div 
                  className="w-full max-w-sm border-2 border-dashed border-[#cbd5e1] rounded-lg p-4 flex flex-col justify-center items-center cursor-pointer hover:bg-white transition-colors h-40 relative overflow-hidden bg-[#f4fbf4]"
                >
                  <input 
                    type="file" 
                    accept="image/png, image/svg+xml, image/jpeg"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert("File size exceeds 2MB limit.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                           if (typeof evt.target?.result === 'string') {
                              setFormData(prev => ({ ...prev, LogoUrl: evt.target!.result as string }));
                           }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {formData.LogoUrl ? (
                     <img src={formData.LogoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain pointer-events-none" />
                  ) : (
                     <div className="flex flex-col items-center pointer-events-none text-[#64748b]">
                       <span className="text-3xl font-light text-[#0b8a1c]">+</span>
                       <span className="text-sm font-bold uppercase tracking-wide mt-2 text-[#0b8a1c]">UPLOAD LOGO</span>
                       <span className="text-xs text-[#94a3b8] mt-1 font-normal text-center">
                         Transparent PNG or SVG<br/>(Max 2MB)
                       </span>
                     </div>
                  )}
                </div>
                {formData.LogoUrl && (
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, LogoUrl: '' }))}
                    className="text-sm text-red-500 hover:underline mt-3 font-medium"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons at footer */}
          <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3 mt-4">
            <button 
              type="button"
              onClick={() => navigate('/master/company')}
              className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              CANCEL
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Company'}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
