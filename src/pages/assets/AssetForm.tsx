import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Briefcase } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate, formatDateForInput } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export function AssetForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    Name: '',
    Category: '',
    AssetCode: '',
    Location: '',
    Status: 'Active',
    PurchaseDate: new Date().toISOString().split('T')[0],
    DeprMethod: 'WDV',
    Cost: '',
    DeprRate: '15',
    Notes: ''
  });

  // Fetch asset details if editing a record
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/v1/data/Assets/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setFormData({
              Name: data.Name ?? data.name ?? '',
              Category: data.Category ?? data.category ?? '',
              AssetCode: data.AssetCode ?? data.assetcode ?? '',
              Location: data.Location ?? data.location ?? '',
              Status: data.Status ?? data.status ?? 'Active',
              PurchaseDate: formatDateForInput(data.PurchaseDate ?? data.purchasedate ?? ''),
              DeprMethod: data.DeprMethod ?? data.deprmethod ?? 'WDV',
              Cost: String(data.Cost ?? data.cost ?? ''),
              DeprRate: String(data.DeprRate ?? data.deprrate ?? '15'),
              Notes: data.Notes ?? data.notes ?? ''
            });
          }
        })
        .catch(err => {
          console.error('Error fetching asset details:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Name) return alert('Asset name is required');
    if (!formData.Category) return alert('Asset category is required');
    if (!formData.PurchaseDate) return alert('Purchase date is required');
    if (!formData.Cost) return alert('Purchase cost is required');

    const costNum = parseFloat(formData.Cost) || 0;
    const deprRateNum = parseFloat(formData.DeprRate) || 0;
    
    // Auto-calculate current value (or inherit original cost on creation)
    const valueNum = costNum;

    // Convert date format to dd/MM/yyyy as requested
    const savedDateStr = formatDate(formData.PurchaseDate);

    // If making a new asset, auto-generate a sleek asset code if left blank
    const assetCodeValue = formData.AssetCode.trim() 
      ? formData.AssetCode.trim() 
      : `AST-${Date.now().toString().slice(-4)}`;

    const payload = {
      CompanyId: activeCompany?.id || 1,
      Name: formData.Name,
      Category: formData.Category,
      AssetCode: assetCodeValue,
      Location: formData.Location,
      Status: formData.Status,
      PurchaseDate: savedDateStr,
      DeprMethod: formData.DeprMethod,
      Cost: costNum,
      Value: valueNum,
      DeprRate: deprRateNum,
      Notes: formData.Notes
    };

    try {
      setSaving(true);
      const url = id ? `/api/v1/data/Assets/${id}` : '/api/v1/data/Assets';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate('/assets');
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Error: ${errData.error || response.statusText || 'Unable to save asset'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="max-w-full mx-auto px-4 lg:px-8 w-full py-20 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <span>Loading asset details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/assets')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {id ? 'Edit Asset' : 'Add New Asset'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {id ? 'Modify asset specifications and settings.' : 'Register a new fixed asset or machinery into the system.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <Briefcase className="w-5 h-5" /> ASSET MASTER REGISTRATION
        </div>

        {/* Section 1: Asset Info */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Asset General Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Asset Name <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Tractor Mahindra 575 DI" 
                    value={formData.Name}
                    onChange={(e) => handleInputChange('Name', e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Asset Category <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    required 
                    value={formData.Category}
                    onChange={(e) => handleInputChange('Category', e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="">Select Category...</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="IT Equipment">IT Equipment</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Asset ID / Code
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input 
                    type="text" 
                    placeholder="Auto-generated if left empty" 
                    value={formData.AssetCode}
                    onChange={(e) => handleInputChange('AssetCode', e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] uppercase font-mono" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Location / Status
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                  <input 
                    type="text" 
                    placeholder="Godown / Location" 
                    value={formData.Location}
                    onChange={(e) => handleInputChange('Location', e.target.value)}
                    className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                  />
                  <select 
                    value={formData.Status}
                    onChange={(e) => handleInputChange('Status', e.target.value)}
                    className="w-full px-3 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="Active">Active / In Use</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Scrapped">Scrapped</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Financial & Depreciation Details */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            II. Financial & Depreciation Settings
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Purchase Date (dd/mm/yyyy) <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <CustomDatePicker 
                    required 
                    value={formData.PurchaseDate}
                    onChange={(val) => handleInputChange('PurchaseDate', val)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Depr. Method
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    value={formData.DeprMethod}
                    onChange={(e) => handleInputChange('DeprMethod', e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="WDV">Written Down Value (WDV)</option>
                    <option value="SLM">Straight Line Method (SLM)</option>
                    <option value="None">No Depreciation</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Purchase Cost (₹) <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input 
                    required 
                    type="number" 
                    step="any"
                    min="0" 
                    placeholder="0.00" 
                    value={formData.Cost}
                    onChange={(e) => handleInputChange('Cost', e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Depr. Rate (%)
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input 
                    type="number" 
                    step="any"
                    min="0" 
                    max="100" 
                    placeholder="e.g. 15" 
                    value={formData.DeprRate}
                    onChange={(e) => handleInputChange('DeprRate', e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notes */}
        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            III. Additional Notes & Metadata
          </div>
          <div className="p-3 bg-white">
            <textarea 
              rows={3}
              placeholder="Serial numbers, warranty information, or condition details..."
              value={formData.Notes}
              onChange={(e) => handleInputChange('Notes', e.target.value)}
              className="w-full px-3 py-2 border border-[#cbd5e1] focus:border-[#8faad8] focus:ring-1 focus:ring-blue-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block font-sans"
            ></textarea>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/assets')}
            disabled={saving}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm cursor-pointer disabled:opacity-50"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING...' : 'SAVE DETAILS'}
          </button>
        </div>
      </form>
    </div>
  );
}
