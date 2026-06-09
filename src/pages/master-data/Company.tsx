import { exportToCSV } from '../../lib/utils';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Company() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/v1/data/Companies');
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      await fetch(`/api/v1/data/Companies/${id}`, { method: 'DELETE' });
      fetchCompanies();
    }
  };

  const filtered = companies.filter(c => 
    c.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.GSTIN?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage multiple FPC entities within the system.</p>
        </div>
        <button 
          onClick={() => navigate('/master/company/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search companies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 flex items-center gap-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white" onClick={() => exportToCSV(companies, 'Company')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Company Name</th>
                <th className="font-medium p-4 border-b border-gray-200">GST Number</th>
                <th className="font-medium p-4 border-b border-gray-200">PAN Number</th>
                <th className="font-medium p-4 border-b border-gray-200">City</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-sm text-gray-500">No records found</td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.Id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 text-sm font-medium text-gray-900">{c.Name}</td>
                  <td className="p-4 text-sm text-gray-600 font-mono">{c.GSTIN}</td>
                  <td className="p-4 text-sm text-gray-600 font-mono">{c.PAN}</td>
                  <td className="p-4 text-sm text-gray-600">{c.City}</td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.Id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing {filtered.length} entries
        </div>
      </div>
    </div>
  );
}
