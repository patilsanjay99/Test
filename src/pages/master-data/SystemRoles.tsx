import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function SystemRoles() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const [roles, setRoles] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleName, setRoleName] = useState('');

  const fetchRoles = async () => {
    try {
      const response = await fetch(`/api/data/SystemRoles`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching system roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [activeCompany]);

  const handleSave = async () => {
    if (!roleName.trim()) return;
    try {
      const payload = {
        CompanyId: activeCompany?.id || null,
        RoleName: roleName.trim(),
        IsDefault: 0
      };
      
      const res = await fetch(`/api/data/SystemRoles${selectedRole ? `/${selectedRole.Id || selectedRole.id}` : ''}`, {
        method: selectedRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsFormOpen(false);
        setRoleName('');
        setSelectedRole(null);
        fetchRoles();
      }
    } catch (error) {
      console.error('Error saving system role:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this System Role?')) return;
    try {
      const res = await fetch(`/api/data/SystemRoles/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRoles();
    } catch (error) {
       console.error('Error deleting system role:', error);
    }
  };

  const filteredRoles = roles.filter(r => r.RoleName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage System Roles for User Master</p>
        </div>
        <button
          onClick={() => {
            setSelectedRole(null);
            setRoleName('');
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="font-medium p-4 border-b border-gray-200">Role Name</th>
                <th className="font-medium p-4 border-b border-gray-200">Default</th>
                <th className="font-medium p-4 border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRoles.map((r) => (
                <tr key={r.Id || r.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{r.RoleName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {r.IsDefault ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Yes</span> : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <button
                         onClick={() => {
                           setSelectedRole(r);
                           setRoleName(r.RoleName);
                           setIsFormOpen(true);
                         }}
                         className="p-1 hover:bg-gray-100 rounded transition-colors"
                       >
                         <Edit2 className="w-4 h-4 text-gray-500" />
                       </button>
                       {!r.IsDefault && (
                         <button
                           onClick={() => handleDelete(r.Id || r.id)}
                           className="p-1 hover:bg-red-50 rounded transition-colors"
                         >
                           <Trash2 className="w-4 h-4 text-red-500" />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">No system roles found.</td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedRole ? 'Edit System Role' : 'Add System Role'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Employee"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!roleName.trim()}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
