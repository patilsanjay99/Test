import React, { useState } from 'react';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UserForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Name: '',
    Email: '',
    Phone: '',
    Role: 'Employee',
    Status: 'Active'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.Name) return alert('Name is required');
    try {
      setSaving(true);
      await fetch('/api/v1/data/Users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      navigate('/master/users');
    } catch(e) {
      alert('Error saving user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/master/users')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create User</h1>
            <p className="text-sm text-gray-500 mt-1">Add a new user to the system and configure access.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/master/users')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} placeholder="e.g. John Doe" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} placeholder="john.doe@company.com" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Phone Mobile (Optional)</label>
              <input type="tel" value={formData.Phone} onChange={e => setFormData({...formData, Phone: e.target.value})} placeholder="+91 98765 43210" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 pt-4">Role & Access</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 block">System Role</label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={formData.Role} onChange={e => setFormData({...formData, Role: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer">
                  <option value="Employee">Employee (Basic Access)</option>
                  <option value="HR">HR Manager</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Admin">System Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">Determines module access and permissions.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Account Status</label>
              <select value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-gray-700">Initial Password</label>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-medium">Automatic Password Generation</p>
                <p className="text-sm text-yellow-700 mt-1">A secure password will be generated and emailed to the user upon creation. They will be prompted to change it on their first login.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
