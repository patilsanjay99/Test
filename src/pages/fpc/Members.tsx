import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';

export function Members() {
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();

  useEffect(() => {
    fetch(`/api/data/FPCMembers?CompanyId=${activeCompany?.id || ''}`)
      .then(res => res.json())
      .then(data => {
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, [activeCompany?.id]);

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        const response = await fetch(`/api/data/FPCMembers/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setMembers(members.filter(m => (m.Id ?? m.id) !== id));
        } else {
          const errData = await response.json().catch(() => ({}));
          alert(errData.error || 'Could not delete the member.');
        }
      } catch (err: any) {
        console.error(err);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      (m.FarmerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.MemberId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.Village || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesVillage = selectedVillage ? m.Village === selectedVillage : true;
    
    return matchesSearch && matchesVillage;
  });

  // Get unique list of villages for selector
  const villages = Array.from(new Set(members.map(m => m.Village).filter(Boolean))) as string[];

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">FPC Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage farmer shareholders, their land details, and share equity.</p>
        </div>
        <div className="flex gap-3">
          {hasPermission('/fpc/members', 'add') && (
<button 
            onClick={() => navigate('/fpc/members/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button> )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID or village..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]"
            >
              <option value="">All Villages</option>
              {villages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(filteredMembers, 'FPC_Members')}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Member Info</th>
                <th className="font-medium p-4 border-b border-gray-200">Village</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Land Holding</th>
                <th className="font-medium p-4 border-b border-gray-200 text-center">Shares</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Share Value</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => {
                const mid = member.Id ?? member.id;
                return (
                  <tr key={mid} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.FarmerName}</div>
                          <div className="text-xs text-gray-500">S/o: {member.FatherSpouse || '—'} • {member.MemberId || `FPC-M-${mid}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{member.Village || '—'}</td>
                    <td className="p-4 text-sm text-gray-900 font-mono text-right">{member.LandHolding ? `${member.LandHolding} Acres` : '0 Acres'}</td>
                    <td className="p-4 text-sm font-medium text-gray-900 text-center">
                      {member.SharesAllocated || 0}
                    </td>
                    <td className="p-4 text-sm text-gray-900 font-mono text-right">
                      ₹{((member.SharesAllocated || 0) * (member.FaceValue || 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasPermission('/fpc/members', 'edit') && (
                        <button 
                          onClick={() => navigate(`/fpc/members/${mid}`)}
                          className="text-gray-400 hover:text-blue-600 transition-colors" 
                          title="Edit Member"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        )}
                      {hasPermission('/fpc/members', 'delete') && (
                        <button 
                          onClick={() => handleDelete(mid)}
                          className="text-gray-400 hover:text-red-600 transition-colors" 
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No matching members found. Add or adjust criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {filteredMembers.length} of {filteredMembers.length} entries
        </div>
      </div>
    </div>
  );
}
