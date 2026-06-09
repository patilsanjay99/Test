import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function FinancialYears() {
  const [financialYears, setFinancialYears] = useState<any[]>([]);
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();

  useEffect(() => {
    if (activeCompany) {
      fetch(`/api/v1/data/FinancialYears?CompanyId=${activeCompany.id}`)
        .then(res => res.json())
        .then(data => setFinancialYears(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [activeCompany?.id]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this financial year?')) {
      await fetch(`/api/v1/data/FinancialYears/${id}`, { method: 'DELETE' });
      setFinancialYears(financialYears.filter(f => f.Id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Years</h1>
          <p className="text-sm text-gray-500 mt-1">Manage financial years for the selected company.</p>
        </div>
        <button 
          onClick={() => navigate('/master/financial-years/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Financial Year
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Financial Year</th>
                <th className="px-6 py-4">From Date</th>
                <th className="px-6 py-4">To Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 pb-20">
              {financialYears.map((f) => (
                <tr key={f.Id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{f.FinancialYear}</div>
                  </td>
                  <td className="px-6 py-4">{new Date(f.FromDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{new Date(f.ToDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {f.Status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => handleDelete(f.Id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {financialYears.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <p className="font-medium text-gray-900">No financial years found</p>
                      <p className="mt-1">Add your first financial year to get started.</p>
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
