import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  locationData?: any | null;
}

export function LocationForm({ isOpen, onClose, onSave, locationData }: LocationFormProps) {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    Name: '',
    Description: '',
    Address: '',
    Status: 'Active'
  });

  useEffect(() => {
    if (locationData) {
      setFormData({
        Name: locationData.Name || '',
        Description: locationData.Description || '',
        Address: locationData.Address || '',
        Status: locationData.Status || 'Active'
      });
    } else {
      setFormData({
        Name: '',
        Description: '',
        Address: '',
        Status: 'Active'
      });
    }
  }, [locationData, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany?.id) return;

    try {
      const payload = {
        CompanyId: activeCompany.id,
        ...formData,
      };

      const url = locationData?.Id || locationData?.id
        ? `/api/data/locations/${locationData.Id || locationData.id}`
        : '/api/data/locations';
        
      const method = locationData?.Id || locationData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.username || '' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSave();
      } else {
        const err = await response.json();
        alert('Failed to save location: ' + err.error);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-semibold text-gray-900">
            {locationData ? 'Edit Location' : 'New Location'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.Name}
              onChange={(e) => handleInputChange('Name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Main Warehouse"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.Description}
              onChange={(e) => handleInputChange('Description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Short description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.Address}
              onChange={(e) => handleInputChange('Address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Physical address of the location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.Status}
              onChange={(e) => handleInputChange('Status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              {locationData ? 'Save Changes' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
