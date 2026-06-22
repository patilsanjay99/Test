import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, FolderTree } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function AccountGroups() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const [accountGroups, setAccountGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const companyId = activeCompany?.id || '';
      // Also fetch default groups where CompanyId is null
      const res = await fetch(`/api/v1/data/AccountGroups`);
      const data = await res.json();
      const companySpecific = data.filter((g: any) => g.IsDefault === 1 || String(g.CompanyId) === String(companyId));
      setAccountGroups(Array.isArray(companySpecific) ? companySpecific : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [activeCompany?.id]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      await fetch(`/api/v1/data/AccountGroups/${id}`, { method: 'DELETE' });
      fetchRecord();
    }
  };

  const filteredGroups = accountGroups.filter(g => {
    const name = g.GroupName || '';
    const type = g.GroupType || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || type.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6 select-none font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Groups</h1>
          <p className="text-sm text-gray-500 mt-1">Manage master account groups.</p>
        </div>
        {hasPermission('/master/groups', 'add') && ( <button
          onClick={() => navigate('/master/groups/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New Group</span>
        </button> )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-[#f4fbf4]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading account groups...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 top-0 sticky z-10 border-b border-gray-200 drop-shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Group Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Group Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Is Default</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FolderTree className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No account groups found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => (
                    <tr key={g.Id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-gray-900">{g.GroupName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                           {g.GroupType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {g.IsDefault === 1 || g.IsDefault === true ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {hasPermission('/master/groups', 'edit') && ( <button onClick={() => navigate(`/master/groups/${g.Id}`)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button> )}
                          {(!g.IsDefault && hasPermission('/master/groups', 'delete')) && (
                            <button onClick={() => handleDelete(g.Id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
