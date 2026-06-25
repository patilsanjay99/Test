import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface UnitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  unitData?: any | null;
}

export function UnitForm({ isOpen, onClose, onSave, unitData }: UnitFormProps) {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    Code: '',
    Name: '',
    Description: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unitData) {
      setFormData({
        Code: unitData.Code || '',
        Name: unitData.Name || '',
        Description: unitData.Description || ''
      });
    } else {
      setFormData({
        Code: '',
        Name: '',
        Description: ''
      });
    }
    setError('');
  }, [unitData, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Code.trim() || !formData.Name.trim()) {
      setError('Code and Name are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const companyId = activeCompany?.id || null;
      
      // Fetch existing units to perform client-side duplicate validation of Code (case-insensitive)
      const res = await fetch(`/api/data/Units?CompanyId=${companyId || ''}`);
      if (res.ok) {
        const existingUnits = await res.json();
        const codeMatch = existingUnits.find((u: any) => 
          u.Code?.trim().toLowerCase() === formData.Code.trim().toLowerCase() && 
          u.Id !== unitData?.Id && u.id !== unitData?.id
        );
        if (codeMatch) {
          setError(`A unit with Code "${formData.Code.toUpperCase()}" already exists.`);
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        CompanyId: companyId,
        Code: formData.Code.toUpperCase().trim(),
        Name: formData.Name.trim(),
        Description: formData.Description.trim()
      };

      const url = unitData?.Id || unitData?.id
        ? `/api/data/Units/${unitData.Id || unitData.id}`
        : '/api/data/Units';
        
      const method = unitData?.Id || unitData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.username || ''
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSave();
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to save unit.');
      }
    } catch (err: any) {
      console.error('Error saving unit:', err);
      setError('An error occurred while saving the unit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-semibold text-gray-900">
            {unitData ? 'Edit Unit of Measurement' : 'New Unit of Measurement'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.Code}
              onChange={(e) => handleInputChange('Code', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase placeholder-gray-400 text-sm font-semibold"
              placeholder="e.g. NOS, KGS, MTR, PCS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.Name}
              onChange={(e) => handleInputChange('Name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400"
              placeholder="e.g. Numbers, Kilograms, Meters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              disabled={isSubmitting}
              value={formData.Description}
              onChange={(e) => handleInputChange('Description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400"
              rows={3}
              placeholder="Description of the Unit of Measurement"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
