import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockMembers = [
  { id: 'FPC-M-001', name: 'Ramesh Patel', fatherName: 'Suresh Patel', village: 'Paldi', land: '5.5 Acres', shares: 10, status: 'Active' },
  { id: 'FPC-M-002', name: 'Santosh Kumar', fatherName: 'Ram Kumar', village: 'Kheda', land: '2.0 Acres', shares: 5, status: 'Active' },
  { id: 'FPC-M-003', name: 'Anita Devi', fatherName: 'Mohan Lal', village: 'Dholka', land: '3.2 Acres', shares: 10, status: 'Pending' },
];

export function Members() {
  const [members] = useState(mockMembers);
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">FPC Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage farmer shareholders, their land details, and share equity.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors shadow-sm">
            Import Members
          </button>
          <button 
            onClick={() => navigate('/fpc/members/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID or village..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Villages</option>
              <option value="Paldi">Paldi</option>
              <option value="Kheda">Kheda</option>
              <option value="Dholka">Dholka</option>
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2" onClick={() => exportToCSV(members, 'Members')}>
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
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500">S/o: {member.fatherName} • {member.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{member.village}</td>
                  <td className="p-4 text-sm text-gray-900 font-mono text-right">{member.land}</td>
                  <td className="p-4 text-sm font-medium text-gray-900 text-center">
                    {member.shares}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Share Certificate">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Member">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600 transition-colors" title="Remove Member">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {members.length} of {members.length} entries
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-300 cursor-not-allowed" disabled>Prev</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-blue-50 text-blue-600 font-medium border-blue-200">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-not-allowed" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
