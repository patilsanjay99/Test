import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export function MemberForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useAppContext();

  const [formData, setFormData] = useState({
    FarmerName: '',
    FatherSpouse: '',
    Gender: '',
    DOB: '',
    Phone: '',
    AadharNo: '',
    Address: '',
    Village: '',
    Panchayat: '',
    Tehsil: '',
    District: '',
    State: '',
    PINCode: '',
    LandHolding: 0,
    IrrigationType: '',
    MajorCrops: '',
    SharesAllocated: 0,
    FaceValue: 100,
    MemberId: '',
    JoinDate: ''
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/v1/data/FPCMembers/${id}`)
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
    if (!formData.FarmerName) return alert("Farmer Full Name is required.");
    try {
      setSaving(true);
      const queryParam = activeCompany?.id ? `?CompanyId=${activeCompany.id}` : '';
      const existingRes = await fetch(`/api/v1/data/FPCMembers${queryParam}`);
      if (existingRes.ok) {
          const existing = await existingRes.json();
          const duplicate = existing.find((item: any) => 
               item.FarmerName?.trim().toLowerCase() === formData.FarmerName.trim().toLowerCase() && 
               String(item.Id) !== String(id || '') && String(item.ID) !== String(id || '')
          );
          if (duplicate) {
              alert("Farmer Name already exists. Please choose a different name.");
              setSaving(false);
              return;
          }
      }

      const url = id ? `/api/v1/data/FPCMembers/${id}` : '/api/v1/data/FPCMembers';
      const method = id ? 'PUT' : 'POST';
      
      const calculatedShareAmount = (formData.SharesAllocated || 0) * (formData.FaceValue || 0);
      const generatedMemberId = formData.MemberId || `FPC-M-${Date.now().toString().slice(-4)}`;
      const currentJoinDate = formData.JoinDate || new Date().toISOString().split('T')[0];

      const payload = {
        ...formData,
        CompanyId: activeCompany?.id || null,
        ShareAmount: calculatedShareAmount,
        MemberId: generatedMemberId,
        JoinDate: currentJoinDate
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errText = await response.text();
        try { errText = JSON.parse(errText).error || errText; } catch(ex) {}
        throw new Error(errText);
      }
      navigate('/fpc/members');
    } catch (err: any) {
      alert(`Error saving member details: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const totalShareAmt = (formData.SharesAllocated || 0) * (formData.FaceValue || 100);

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/fpc/members')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {id ? 'Edit FPC Member Details' : 'FPC Member Registration'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {id ? 'Modify farmer shareholder details in the local database.' : 'Register a new farmer shareholder into the FPC.'}
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-[#8faad8] rounded-lg p-12 text-center text-gray-500 shadow-md animate-pulse font-semibold">
          Loading farmer member details...
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSave} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
          {/* Green Title Header */}
          <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
            <Users className="w-5 h-5" /> MEMBER DETAIL MASTER
          </div>

          {/* Section 1: Personal Details */}
          <div className="border-b border-blue-900">
            <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
              I. Personal Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
              {/* Left Column */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Full Name <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input 
                      required 
                      type="text" 
                      name="FarmerName"
                      value={formData.FarmerName}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Patel" 
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Father/Husband <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input 
                      required 
                      type="text" 
                      name="FatherSpouse"
                      value={formData.FatherSpouse}
                      onChange={handleChange}
                      placeholder="e.g. Suresh Patel" 
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Gender / DOB (dd/mm/yyyy)
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                    <select 
                      name="Gender"
                      value={formData.Gender}
                      onChange={handleChange}
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <CustomDatePicker 
                      value={formData.DOB}
                      onChange={(val) => setFormData(prev => ({ ...prev, DOB: val }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Mobile No. / Aadhar No. <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-[1fr_1.5fr] gap-2 items-center">
                    <input 
                      required 
                      type="tel" 
                      name="Phone"
                      value={formData.Phone}
                      onChange={handleChange}
                      placeholder="Mobile" 
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                    />
                    <input 
                      type="text" 
                      name="AadharNo"
                      value={formData.AadharNo}
                      onChange={handleChange}
                      placeholder="Aadhaar No" 
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Address Details */}
          <div className="border-b border-blue-900">
            <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
              II. Address Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
              {/* Left Column */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Address Line
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input 
                      type="text" 
                      name="Address"
                      value={formData.Address}
                      onChange={handleChange}
                      placeholder="House No, Street..." 
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Village / Panchayat
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                    <input 
                      type="text" 
                      name="Village"
                      value={formData.Village}
                      onChange={handleChange}
                      placeholder="Village" 
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                    <input 
                      type="text" 
                      name="Panchayat"
                      value={formData.Panchayat}
                      onChange={handleChange}
                      placeholder="Panchayat" 
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Tehsil / District
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                    <input 
                      type="text" 
                      name="Tehsil"
                      value={formData.Tehsil}
                      onChange={handleChange}
                      placeholder="Tehsil" 
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                    <input 
                      type="text" 
                      name="District"
                      value={formData.District}
                      onChange={handleChange}
                      placeholder="District" 
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    State & PIN Code
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                    <input 
                      type="text" 
                      name="State"
                      value={formData.State}
                      onChange={handleChange}
                      placeholder="State" 
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                    <input 
                      type="text" 
                      name="PINCode"
                      value={formData.PINCode}
                      onChange={handleChange}
                      placeholder="PIN Code" 
                      className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Farming & Share Details */}
          <div>
            <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
              III. Farming & Share Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
              {/* Left Column: Land Info */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Land holding (Acres)
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input 
                      type="number" 
                      step="any" 
                      name="LandHolding"
                      value={formData.LandHolding || ''}
                      onChange={handleChange}
                      placeholder="0.0" 
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-[#cbd5e1] min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Irrigation Type
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <select 
                      name="IrrigationType"
                      value={formData.IrrigationType}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                    >
                      <option value="">Select...</option>
                      <option value="Irrigated">Irrigated</option>
                      <option value="Rainfed">Rainfed</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Major Crops
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input 
                      type="text" 
                      name="MajorCrops"
                      value={formData.MajorCrops}
                      onChange={handleChange}
                      placeholder="e.g. Wheat, Cotton" 
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Share Info */}
              <div className="flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Allocated Shares
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input 
                      type="number" 
                      min="0" 
                      name="SharesAllocated"
                      value={formData.SharesAllocated || ''}
                      onChange={handleChange}
                      placeholder="0" 
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-[#cbd5e1] min-h-[48px] items-stretch">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Face Value per Share (₹)
                  </div>
                  <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                    <input 
                      type="number" 
                      min="0" 
                      name="FaceValue"
                      value={formData.FaceValue}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch bg-emerald-50/50">
                  <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                    Total Share Amt (₹)
                  </div>
                  <div className="bg-[#f1f5f9] px-4 py-3 sm:col-span-2 flex items-center font-mono font-extrabold text-lg text-emerald-800">
                    ₹{totalShareAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons at footer */}
          <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => navigate('/fpc/members')}
              className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm"
              disabled={saving}
            >
              CANCEL
            </button>
            <button 
              type="submit"
              className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm"
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'SAVING...' : 'SAVE DETAILS'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
