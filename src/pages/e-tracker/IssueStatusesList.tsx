import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Settings, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function IssueStatusesList() {
  const { activeCompany } = useAppContext();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [statusName, setStatusName] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [sequenceOrder, setSequenceOrder] = useState<number>(1);
  const [color, setColor] = useState('#3B82F6');
  const [isFinalStatus, setIsFinalStatus] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [isClosureStatus, setIsClosureStatus] = useState(false);
  const [isReopenAllowed, setIsReopenAllowed] = useState(false);
  const [activeStatus, setActiveStatus] = useState(true);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/data/IssueStatuses`);
      if (response.ok) {
        const data = await response.json();
        const sorted = (Array.isArray(data) ? data : []).sort((a, b) => (a.SequenceOrder || 0) - (b.SequenceOrder || 0));
        setStatuses(sorted);
      }
    } catch (error) {
      console.error('Error fetching issue statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [activeCompany]);

  const handleNameChange = (val: string) => {
    setStatusName(val);
    // Auto generate status code in uppercase, replaces spaces with underscores
    setStatusCode(val.trim().toUpperCase().replace(/\s+/g, '_'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusName.trim() || !statusCode.trim()) return;

    try {
      const payload = {
        CompanyId: activeCompany?.id || 1,
        StatusName: statusName.trim(),
        StatusCode: statusCode.trim(),
        SequenceOrder: Number(sequenceOrder),
        Color: color,
        IsFinalStatus: isFinalStatus ? 1 : 0,
        IsEditable: isEditable ? 1 : 0,
        IsClosureStatus: isClosureStatus ? 1 : 0,
        IsReopenAllowed: isReopenAllowed ? 1 : 0,
        ActiveStatus: activeStatus ? 1 : 0
      };

      const id = selectedStatus?.Id || selectedStatus?.id;
      const url = `/api/data/IssueStatuses${id ? `/${id}` : ''}`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsFormOpen(false);
        resetForm();
        fetchStatuses();
      } else {
        const errData = await res.json();
        alert('Failed to save: ' + (errData.error || 'Server error'));
      }
    } catch (error: any) {
      console.error('Error saving status:', error);
      alert('Error saving status: ' + error.message);
    }
  };

  const resetForm = () => {
    setSelectedStatus(null);
    setStatusName('');
    setStatusCode('');
    // Auto set next sequence order
    const nextOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.SequenceOrder || 0)) + 1 : 1;
    setSequenceOrder(nextOrder);
    setColor('#3B82F6');
    setIsFinalStatus(false);
    setIsEditable(true);
    setIsClosureStatus(false);
    setIsReopenAllowed(false);
    setActiveStatus(true);
  };

  const handleEdit = (status: any) => {
    setSelectedStatus(status);
    setStatusName(status.StatusName);
    setStatusCode(status.StatusCode);
    setSequenceOrder(status.SequenceOrder || 1);
    setColor(status.Color || '#3B82F6');
    setIsFinalStatus(!!status.IsFinalStatus);
    setIsEditable(!!status.IsEditable);
    setIsClosureStatus(!!status.IsClosureStatus);
    setIsReopenAllowed(!!status.IsReopenAllowed);
    setActiveStatus(!!status.ActiveStatus);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this issue status? Existing issues using this status may be impacted.')) return;
    try {
      const res = await fetch(`/api/data/IssueStatuses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStatuses();
      } else {
        alert('Failed to delete issue status');
      }
    } catch (error) {
      console.error('Error deleting issue status:', error);
    }
  };

  const filteredStatuses = statuses.filter(s => 
    s.StatusName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.StatusCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" id="status-master-icon" />
            Issue Status Master
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure and manage dynamic, sequence-controlled lifecycle phases for tickets</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm shrink-0 self-start md:self-auto"
          id="btn-add-status"
        >
          <Plus className="w-4 h-4" />
          Add Custom Status
        </button>
      </div>

      {/* Main Grid */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search statuses by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              id="search-status-input"
            />
          </div>
          <button 
            onClick={fetchStatuses} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all self-end md:self-auto flex items-center gap-1 text-xs"
            title="Reload table"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm font-medium">Fetching Status Master records...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="table-status-master">
              <thead>
                <tr className="bg-gray-50/50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 border-b border-gray-200">Sequence</th>
                  <th className="p-4 border-b border-gray-200">Status Info</th>
                  <th className="p-4 border-b border-gray-200 text-center">Badge Preview</th>
                  <th className="p-4 border-b border-gray-200">Rules & Configuration</th>
                  <th className="p-4 border-b border-gray-200 text-center">Active</th>
                  <th className="p-4 border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredStatuses.map((s, idx) => (
                  <tr key={s.Id || s.id} className="hover:bg-gray-50/25 transition-all">
                    {/* Sequence Order */}
                    <td className="p-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          {s.SequenceOrder}
                        </span>
                      </div>
                    </td>

                    {/* Status Info */}
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-gray-900">{s.StatusName}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">{s.StatusCode}</div>
                      </div>
                    </td>

                    {/* Badge Preview */}
                    <td className="p-4 text-center">
                      <span 
                        className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border shadow-sm transition-all"
                        style={{ 
                          backgroundColor: `${s.Color}15`, 
                          color: s.Color, 
                          borderColor: `${s.Color}50` 
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: s.Color }}></span>
                        {s.StatusName}
                      </span>
                    </td>

                    {/* Rules & Configuration */}
                    <td className="p-4 text-xs font-medium text-gray-600 space-y-1">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${s.IsFinalStatus ? 'bg-indigo-500' : 'bg-gray-300'}`}></span>
                          <span>Final state: <strong className="text-gray-900">{s.IsFinalStatus ? 'Yes' : 'No'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${s.IsEditable ? 'bg-green-500' : 'bg-rose-500'}`}></span>
                          <span>Editable: <strong className="text-gray-900">{s.IsEditable ? 'Yes' : 'No'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${s.IsClosureStatus ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                          <span>Closure: <strong className="text-gray-900">{s.IsClosureStatus ? 'Yes' : 'No'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${s.IsReopenAllowed ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
                          <span>Reopen ok: <strong className="text-gray-900">{s.IsReopenAllowed ? 'Yes' : 'No'}</strong></span>
                        </div>
                      </div>
                    </td>

                    {/* Active */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        s.ActiveStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {s.ActiveStatus ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-blue-600 transition-all"
                          title="Edit configuration"
                          id={`btn-edit-status-${s.Id || s.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.Id || s.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-md text-gray-500 hover:text-red-600 transition-all"
                          title="Delete status"
                          id={`btn-delete-status-${s.Id || s.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStatuses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No status master records match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Info Block */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
        <Settings className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-blue-900">Configurable SLA & Workflow Rules:</span>
          These statuses directly populate the status controllers inside individual Issue profiles. Mark closure statuses safely to allow metrics calculations to capture closure duration. Only statuses marked with <strong>Reopen Allowed</strong> support transition back from final statuses!
        </div>
      </div>

      {/* Entry / Edit Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900" id="dialog-status-title">
                {selectedStatus ? 'Modify Custom Status Config' : 'Define New Custom Status'}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="text-gray-400 hover:text-gray-600 font-bold hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Status Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1">Status Name</label>
                  <input
                    type="text"
                    required
                    value={statusName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. Under Technical Review"
                    autoFocus
                  />
                </div>

                {/* Status Code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1">Status Code (Auto)</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={statusCode}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-600 font-mono focus:ring-0 outline-none cursor-not-allowed"
                    placeholder="UNDER_TECHNICAL_REVIEW"
                  />
                </div>

                {/* Sequence Order */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1">Sequence Order</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sequenceOrder}
                    onChange={(e) => setSequenceOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                {/* Color Coordinate */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-widest mb-1">Color Palette</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer p-0.5 shrink-0"
                    />
                    <div className="flex-1 grid grid-cols-6 gap-1">
                      {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#047857', '#DC2626', '#ED4899', '#B91C1C'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-full h-8 rounded border transition-transform hover:scale-105 ${color === c ? 'ring-2 ring-blue-500 scale-105 border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Rule Switches */}
              <div className="border-t border-gray-100 pt-4 mt-6 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Behavior & Transition Rules</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Final Status */}
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100">
                    <input
                      type="checkbox"
                      checked={isFinalStatus}
                      onChange={(e) => setIsFinalStatus(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Is Final State</span>
                      <span className="text-[10px] text-gray-500">Lock further processing on ticket</span>
                    </div>
                  </label>

                  {/* Is Editable */}
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100">
                    <input
                      type="checkbox"
                      checked={isEditable}
                      onChange={(e) => setIsEditable(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Is Editable</span>
                      <span className="text-[10px] text-gray-500">Allow users to modify ticket fields</span>
                    </div>
                  </label>

                  {/* Is Closure Status */}
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100">
                    <input
                      type="checkbox"
                      checked={isClosureStatus}
                      onChange={(e) => setIsClosureStatus(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Is Closure State</span>
                      <span className="text-[10px] text-gray-500">Stop resolution timers and close SLAs</span>
                    </div>
                  </label>

                  {/* Is Reopen Allowed */}
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100">
                    <input
                      type="checkbox"
                      checked={isReopenAllowed}
                      onChange={(e) => setIsReopenAllowed(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Reopen Allowed</span>
                      <span className="text-[10px] text-gray-500">Tickets in this state can be reopened</span>
                    </div>
                  </label>

                  {/* Active Status */}
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer col-span-2 transition-all border border-transparent hover:border-gray-100">
                    <input
                      type="checkbox"
                      checked={activeStatus}
                      onChange={(e) => setActiveStatus(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Active Status</span>
                      <span className="text-[10px] text-gray-500">Permit this status to be used or selected in live issue profiles</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit / actions */}
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 border border-transparent rounded-lg text-sm font-medium text-white transition-all shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
