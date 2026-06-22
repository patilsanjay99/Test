import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function Customers() {
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();

  useEffect(() => {
    fetch(`/api/data/Customers?CompanyId=${activeCompany?.id || ''}`)
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [activeCompany?.id]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const res = await fetch(`/api/data/Customers/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setCustomers(customers.filter(c => (c.Id || c.id || c.ID || '').toString() !== id.toString()));
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || 'Failed to delete record.');
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer details and master records.</p>
        </div>
        {hasPermission('/master/customers', 'add') && ( <button 
          onClick={() => navigate('/master/customers/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button> )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full pl-9 pr-4 py-2 bg-[#f4fbf4] border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4">GSTIN No.</th>
                <th className="px-6 py-4 text-right">Opening Bal.</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 pb-20">
              {customers.map((c) => (
                <tr key={c.Id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{c.CustomerName}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{c.RegistrationNo || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{c.ContactPerson || '-'}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{c.PhoneNo || c.EmailID || '-'}</div>
                  </td>
                  <td className="px-6 py-4">{c.StateCode || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{c.GSTINNo || '-'}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium">₹{c.OpeningBalance?.toLocaleString() || '0'}</td>
                  <td className="px-6 py-4 text-center space-x-2">
                    {hasPermission('/master/customers', 'edit') && ( <button 
                      onClick={() => navigate(`/master/customers/${c.Id || c.id || c.ID}`)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button> )}
                    {hasPermission('/master/customers', 'delete') && ( <button 
                      onClick={() => handleDelete((c.Id || c.id || c.ID || '').toString())} 
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button> )}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-900">No customers found</p>
                      <p className="mt-1">Add your first customer to get started.</p>
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
