import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Landmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function BankAccountTypes() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const [types, setTypes] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [typeName, setTypeName] = useState('');

  const fetchTypes = async () => {
    try {
      const response = await fetch(`/api/data/BankAccountTypes`);
      if (response.ok) {
        const data = await response.json();
        setTypes(data);
      }
    } catch (error) {
      console.error('Error fetching bank account types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [activeCompany]);

  const handleSave = async () => {
    if (!typeName.trim()) return;
    try {
      const payload = {
        CompanyId: activeCompany?.id || null,
        TypeName: typeName.trim(),
        IsDefault: 0
      };
      
      const res = await fetch(`/api/data/BankAccountTypes${selectedType ? `/${selectedType.Id || selectedType.id}` : ''}`, {
        method: selectedType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsFormOpen(false);
        setTypeName('');
        setSelectedType(null);
        fetchTypes();
      }
    } catch (error) {
      console.error('Error saving bank account type:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this A/c Type?')) return;
    try {
      const res = await fetch(`/api/data/BankAccountTypes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTypes();
    } catch (error) {
       console.error('Error deleting bank account type:', error);
    }
  };

  const filteredTypes = types.filter(t => t.TypeName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bank Account Types</h1>
          <p className="text-sm text-gray-500 mt-1">Manage A/c Types in Bank Master</p>
        </div>
        <button
          onClick={() => {
            setSelectedType(null);
            setTypeName('');
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Type
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search types..."
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
                <th className="font-medium p-4 border-b border-gray-200">Type Name</th>
                <th className="font-medium p-4 border-b border-gray-200">Default</th>
                <th className="font-medium p-4 border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTypes.map((t) => (
                <tr key={t.Id || t.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Landmark className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{t.TypeName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {t.IsDefault ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Yes</span> : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <button
                         onClick={() => {
                           setSelectedType(t);
                           setTypeName(t.TypeName);
                           setIsFormOpen(true);
                         }}
                         className="p-1 hover:bg-gray-100 rounded transition-colors"
                       >
                         <Edit2 className="w-4 h-4 text-gray-500" />
                       </button>
                       {!t.IsDefault && (
                         <button
                           onClick={() => handleDelete(t.Id || t.id)}
                           className="p-1 hover:bg-red-50 rounded transition-colors"
                         >
                           <Trash2 className="w-4 h-4 text-red-500" />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTypes.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">No bank account types found.</td>
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedType ? 'Edit A/c Type' : 'Add A/c Type'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type Name</label>
                  <input
                    type="text"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Current Account"
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
                  disabled={!typeName.trim()}
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
