import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Scale } from 'lucide-react';
import { UnitForm } from './UnitForm';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function Units() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const [units, setUnits] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUnits = async () => {
    try {
      const companyId = activeCompany?.id || '';
      const response = await fetch(`/api/data/Units?CompanyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [activeCompany]);

  const handleDelete = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this Unit of Measurement?')) {
      return;
    }
    try {
      const response = await fetch(`/api/data/Units/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchUnits();
      } else {
        const err = await response.json();
        alert('Failed to delete unit: ' + (err.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error deleting unit:', err);
      alert('Error deleting unit');
    }
  };

  const filteredUnits = units.filter(u =>
    u.Code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Units of Measurement</h1>
          <p className="text-sm text-gray-500 mt-1">Manage standard product measurement units (UOM)</p>
        </div>
        {hasPermission('/master/units', 'add') && (
          <button
            onClick={() => {
              setSelectedUnit(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Unit
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-8 text-center text-gray-500 flex flex-col items-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
               Loading Units...
             </div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="font-medium p-4 border-b border-gray-200 text-xs text-gray-500 uppercase">Unit Code</th>
                <th className="font-medium p-4 border-b border-gray-200 text-xs text-gray-500 uppercase">Unit Name</th>
                <th className="font-medium p-4 border-b border-gray-200 text-xs text-gray-500 uppercase">Description</th>
                <th className="font-medium p-4 border-b border-gray-200 text-xs text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUnits.map((u) => (
                <tr key={u.Id || u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mr-3 font-bold text-xs">
                        {u.Code}
                      </div>
                      <span className="font-semibold text-gray-900">{u.Code}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-medium">
                    {u.Name}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {u.Description || '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {hasPermission('/master/units', 'edit') && (
                        <button
                          onClick={() => {
                            setSelectedUnit(u);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('/master/units', 'delete') && (
                        <button
                          onClick={() => handleDelete(u.Id || u.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUnits.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No units found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <UnitForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedUnit(null);
        }}
        onSave={() => {
          setIsFormOpen(false);
          setSelectedUnit(null);
          fetchUnits();
        }}
        unitData={selectedUnit}
      />
    </div>
  );
}
