import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Shield, MoreVertical, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockUsers = [
  { id: '1', name: 'Sanjay Kumar', email: 'admin@fpc.com', role: 'Super Admin', status: 'Active', lastLogin: '15/03/2024 09:30 AM' },
  { id: '2', name: 'Anita Desai', email: 'anita.d@fpc.com', role: 'HR', status: 'Active', lastLogin: '14/03/2024 10:15 AM' },
  { id: '3', name: 'Ramesh Patel', email: 'ramesh.p@fpc.com', role: 'Accountant', status: 'Inactive', lastLogin: '01/03/2024 04:45 PM' },
];

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/data/Users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system access, roles, and security policies.</p>
        </div>
        <button 
          onClick={() => navigate('/master/users/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="HR">HR</option>
              <option value="Accountant">Accountant</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">User</th>
                <th className="font-medium p-4 border-b border-gray-200">Role</th>
                <th className="font-medium p-4 border-b border-gray-200">Status</th>
                <th className="font-medium p-4 border-b border-gray-200">Last Login</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-500">No records found</td></tr>
              ) : users.map((user) => (
                <tr key={user.Id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm tracking-tight border border-blue-200 shrink-0">
                        {user.Name ? user.Name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.Name}</div>
                        <div className="text-xs text-gray-500">{user.Email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">{user.Role}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.Status || 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Reset Password">
                      <Key className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit User">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {users.length} of {users.length} entries
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
