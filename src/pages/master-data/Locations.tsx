import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, MapPin } from 'lucide-react';
import { LocationForm } from './LocationForm';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function Locations() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const [locations, setLocations] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    if (!activeCompany?.id) return;
    try {
      const response = await fetch(`/api/data/locations?CompanyId=${activeCompany.id}`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [activeCompany]);

  const filteredLocations = locations.filter(loc =>
    loc.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.Description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Locations / Godowns</h1>
          <p className="text-sm text-gray-500 mt-1">Manage physical locations for inventory storage</p>
        </div>
        {hasPermission('Masters: Locations', 'add') && (
          <button
            onClick={() => {
              setSelectedLocation(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-8 text-center text-gray-500 flex flex-col items-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
               Loading...
             </div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="font-medium p-4 border-b border-gray-200">Name</th>
                <th className="font-medium p-4 border-b border-gray-200">Description</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLocations.map((loc) => (
                <tr key={loc.Id || loc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">{loc.Name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    <div className="text-sm">{loc.Description || '-'}</div>
                    {loc.Address && <div className="text-xs text-gray-400 mt-1">{loc.Address}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      loc.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {loc.Status || 'Active'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       {hasPermission('Masters: Locations', 'edit') && (
                        <button
                          onClick={() => {
                            setSelectedLocation(loc);
                            setIsFormOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLocations.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No locations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <LocationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedLocation(null);
        }}
        onSave={() => {
          setIsFormOpen(false);
          setSelectedLocation(null);
          fetchLocations();
        }}
        locationData={selectedLocation}
      />
    </div>
  );
}
