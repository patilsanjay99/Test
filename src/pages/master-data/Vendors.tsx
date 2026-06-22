import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function Vendors() {
  const { hasPermission } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();

  useEffect(() => {
    fetch(`/api/v1/data/Vendors?CompanyId=${activeCompany?.id || ''}`)
      .then(res => res.json())
      .then(data => setVendors(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [activeCompany?.id]);

  const getVendorId = (c: any) => c.Vendor_ID ?? c.Vendor_Id ?? c.id ?? c.Id;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        const res = await fetch(`/api/v1/data/Vendors/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setVendors(vendors.filter(v => (getVendorId(v) || '').toString() !== id.toString()));
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || 'Failed to delete record.');
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredVendors = vendors.filter(v => {
    const val = (v.Vendor_NAME || '').toLowerCase();
    return val.includes(searchTerm.toLowerCase());
  });

  return (
    <div id="vendor_list_wrapper" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vendor Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor records, tax info, and opening balances.</p>
        </div>
        {hasPermission('/master/vendors', 'add') && ( <button 
          id="btn_add_vendor"
          onClick={() => navigate('/master/vendors/new')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search vendors..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f4fbf4] border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4">GSTIN No.</th>
                <th className="px-6 py-4 text-right">Opening Bal.</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 pb-20">
              {filteredVendors.map((c) => {
                const vid = getVendorId(c);
                return (
                  <tr key={vid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{c.Vendor_NAME}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{c.registration_no || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{c.contact_person || '-'}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{c.phone_no || c.email_id || '-'}</div>
                    </td>
                    <td className="px-6 py-4">{c.state_code || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{c.GSTIN || '-'}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium">₹{c.opening_balance?.toLocaleString() || '0'}</td>
                    <td className="px-6 py-4 text-center space-x-2">
                      {hasPermission('/master/vendors', 'edit') && ( <button 
                        onClick={() => navigate(`/master/vendors/${vid}`)}
                        className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded-md hover:bg-green-50"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button> )}
                      {hasPermission('/master/vendors', 'delete') && ( <button 
                        onClick={() => handleDelete(vid.toString())} 
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button> )}
                    </td>
                  </tr>
                );
              })}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-900">No vendors found</p>
                      <p className="mt-1">Add your first vendor to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
