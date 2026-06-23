import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, FolderTree } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function AccountGroupForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { activeCompany } = useAppContext();
  
  const [formData, setFormData] = useState({
    GroupName: '',
    GroupType: 'Asset'
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      fetch(`/api/v1/data/AccountGroups/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setFormData({
              GroupName: data.GroupName || '',
              GroupType: data.GroupType || 'Asset'
            });
            setIsDefault(data.IsDefault === 1 || data.IsDefault === true);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch group", err);
          setLoading(false);
        });
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.GroupName) return alert("Group Name is required.");
    try {
      setSaving(true);
      const url = isEditing ? `/api/v1/data/AccountGroups/${id}` : '/api/v1/data/AccountGroups';
      const method = isEditing ? 'PUT' : 'POST';
      const payload: any = { ...formData };
      
      if (!isEditing) {
        payload.CompanyId = activeCompany?.id || null;
        payload.IsDefault = 0;
      }
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      navigate('/master/groups');
    } catch(e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/master/groups')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEditing ? 'Edit Account Group' : 'New Account Group'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? 'Update group details.' : 'Create a new general ledger account group.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/master/groups')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || isDefault}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Group'}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden">
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
            <FolderTree className="w-5 h-5" />
          </div>
          <h2 className="">Group Details {isDefault && '(Default Group - Cannot Edit)'}</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Group Name <span className="text-red-500">*</span></label>
            <input
              name="GroupName"
              value={formData.GroupName}
              onChange={handleChange}
              disabled={isDefault}
              className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
              placeholder="e.g. Current Assets"
            />
          </div>
          <div className="space-y-2 col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Category Type</label>
            <select
              name="GroupType"
              value={formData.GroupType}
              onChange={handleChange}
              disabled={isDefault}
              className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
            >
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
