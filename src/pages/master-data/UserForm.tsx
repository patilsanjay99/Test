import React, { useState } from 'react';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [formData, setFormData] = useState({
    Name: '',
    Email: '',
    Phone: '',
    Role: 'Employee',
    Status: 'Active'
  });
  const [saving, setSaving] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`/api/data/SystemRoles`);
        if (res.ok) {
          const roles = await res.json();
          setAvailableRoles(roles);
          if (roles.length > 0 && !id && !roles.find((r: any) => r.RoleName === formData.Role)) {
            setFormData(prev => ({ ...prev, Role: roles[0].RoleName }));
          }
        }
      } catch(e) {}
    };
    fetchRoles();
  }, [id]);

  React.useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const res = await fetch(`/api/v1/data/Users/${id}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              Name: data.Name || '',
              Email: data.Email || '',
              Phone: data.Phone || '',
              Role: data.Role || 'Employee',
              Status: data.Status || 'Active'
            });
          }
        } catch (e) {
          console.error("Error loading user:", e);
        }
      };
      fetchUser();
    }
  }, [id]);

  const handleSave = async () => {
    if (!formData.Name) return alert('Name is required');
    
    const emailEntered = formData.Email.trim() !== '';
    const phoneEntered = formData.Phone.trim() !== '';

    if (!emailEntered && !phoneEntered) {
      return alert('Either Email Address or Phone Mobile (10 digits) is required.');
    }

    if (emailEntered) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.Email.trim())) {
        return alert('Please enter a valid Email Address.');
      }
    }

    if (phoneEntered) {
      const cleanPhone = formData.Phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return alert('Phone Mobile must be exactly 10 digits (e.g. 9876543210).');
      }
    }

    try {
      setSaving(true);
      const existingRes = await fetch(`/api/v1/data/Users`);
      if (existingRes.ok) {
          const existing = await existingRes.json();
          const duplicate = existing.find((item: any) => 
               item.Name?.trim().toLowerCase() === formData.Name.trim().toLowerCase()
          );
          if (duplicate && String(duplicate.Id) !== id) {
              alert("User Name already exists. Please choose a different name.");
              setSaving(false);
              return;
          }
      }

      const url = isEdit ? `/api/v1/data/Users/${id}` : '/api/v1/data/Users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        navigate('/master/users');
      } else {
        alert('Error saving user');
      }
    } catch(e) {
      alert('Error saving user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/master/users')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Master</h1>
            <p className="text-sm text-gray-500 mt-1">Configure user accounts and system access.</p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase">
          {isEdit ? 'UPDATE USER MASTER' : 'CREATE USER MASTER'}
        </div>

        {/* Form Master Grid Box */}
        <div className="grid grid-cols-1">
          
          {/* Row 1: Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              Full Name <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <input 
                required
                type="text" 
                value={formData.Name} 
                onChange={e => setFormData({...formData, Name: e.target.value})} 
                placeholder="e.g. John Doe" 
                className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
              />
            </div>
          </div>

          {/* Row 2: Email Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              Email Address <span className="text-gray-500 font-normal text-xs ml-1">(Required if Mobile empty)</span>
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <input 
                type="email" 
                value={formData.Email} 
                onChange={e => setFormData({...formData, Email: e.target.value})} 
                placeholder="john.doe@company.com" 
                className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
              />
            </div>
          </div>

          {/* Row 3: Phone Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              Phone Mobile <span className="text-gray-500 font-normal text-xs ml-1">(10 digits, Required if Email empty)</span>
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <input 
                type="tel" 
                value={formData.Phone} 
                onChange={e => setFormData({...formData, Phone: e.target.value})} 
                placeholder="e.g. 9876543210" 
                className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
              />
            </div>
          </div>

          {/* Row 4: System Role */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              System Role
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <select 
                value={formData.Role} 
                onChange={e => setFormData({...formData, Role: e.target.value})} 
                className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
              >
                {availableRoles.map(r => (
                  <option key={r.Id || r.id} value={r.RoleName}>{r.RoleName}</option>
                ))}
                {availableRoles.length === 0 && (
                  <>
                    <option value="Employee">Employee (Basic Access)</option>
                    <option value="HR">HR Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Admin">System Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Row 5: Account Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
            <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
              Account Status
            </div>
            <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
              <select 
                value={formData.Status} 
                onChange={e => setFormData({...formData, Status: e.target.value})} 
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
            onClick={() => navigate('/master/users')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SAVING...' : (isEdit ? 'UPDATE USER' : 'SAVE USER')}
          </button>
        </div>
      </form>
    </div>
  );
}
