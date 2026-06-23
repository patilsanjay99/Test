import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  ShieldCheck, 
  X, 
  FileText, 
  Paperclip, 
  History, 
  User, 
  Clock, 
  Briefcase, 
  TrendingUp,
  Download,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Image as ImageIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export function IssueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const { user } = useAuth();

  const isEdit = isset(id);

  // Lists
  const [statuses, setStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // State Management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Issue Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assigneeName, setAssigneeName] = useState('');
  const [statusId, setStatusId] = useState<string>('');
  const [priority, setPriority] = useState('Medium');
  const [slaDeadline, setSlaDeadline] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [approverRemarks, setApproverRemarks] = useState('');
  const [isApproved, setIsApproved] = useState<number>(0); // 0=Pending, 1=Approved, 2=Rejected
  const [escalatedCount, setEscalatedCount] = useState<number>(0);
  const [lastEscalationDate, setLastEscalationDate] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [closedAt, setClosedAt] = useState('');
  const [createdBy, setCreatedBy] = useState('');

  // Local helper to check id
  function isset(val: any): boolean {
    return val !== undefined && val !== null && val !== 'new';
  }

  // Fetch initial option models
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        setLoading(true);
        
        // Fetch IssueStatuses
        const statusRes = await fetch('/api/data/IssueStatuses');
        let statusList: any[] = [];
        if (statusRes.ok) {
          const list = await statusRes.json();
          statusList = (Array.isArray(list) ? list : [])
            .filter(s => s.ActiveStatus)
            .sort((a, b) => (a.SequenceOrder || 0) - (b.SequenceOrder || 0));
          setStatuses(statusList);
        }

        // Fetch System Users
        const userRes = await fetch('/api/v1/data/Users');
        if (userRes.ok) {
          const list = await userRes.json();
          setUsers(Array.isArray(list) ? list : []);
        }

        if (isEdit) {
          // Fetch Issue Profile
          const profileRes = await fetch(`/api/data/Issues/${id}`);
          if (profileRes.ok) {
            const ticket = await profileRes.json();
            if (ticket) {
              setTitle(ticket.Title || '');
              setDescription(ticket.Description || '');
              setDepartment(ticket.Department || 'Operations');
              setAssigneeId(ticket.AssigneeId ? String(ticket.AssigneeId) : '');
              setAssigneeName(ticket.AssigneeName || '');
              setStatusId(ticket.StatusId ? String(ticket.StatusId) : '');
              setPriority(ticket.Priority || 'Medium');
              setSlaDeadline(ticket.SlaDeadline || '');
              setAttachmentUrl(ticket.AttachmentUrl || '');
              setApproverRemarks(ticket.ApproverRemarks || '');
              setIsApproved(Number(ticket.IsApproved || 0));
              setEscalatedCount(Number(ticket.EscalatedCount || 0));
              setLastEscalationDate(ticket.LastEscalationDate || '');
              setCreatedAt(ticket.CreatedAt || '');
              setClosedAt(ticket.ClosedAt || '');
              setCreatedBy(ticket.CreatedBy || '');
            }
          }

          // Fetch Issue Audit Logs
          const logsRes = await fetch(`/api/data/IssueLogs`);
          if (logsRes.ok) {
            const rawLogs = await logsRes.json();
            const filtered = (Array.isArray(rawLogs) ? rawLogs : [])
              .filter(l => String(l.IssueId) === String(id))
              .sort((a, b) => new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime());
            setLogs(filtered);
          }
        } else {
          // Defaults for new ticket
          if (statusList.length > 0) {
            setStatusId(String(statusList[0].Id || statusList[0].id));
          }
          setCreatedBy(user?.Name || user?.name || user?.Email || 'System user');
          // Default SLA: 3 days from now
          const threeDays = new Date();
          threeDays.setDate(threeDays.getDate() + 3);
          setSlaDeadline(threeDays.toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error('Error loading ticket dependencies:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDependencies();
  }, [id, isEdit, activeCompany]);

  // Sync Assignee Name when Assignee ID changes
  const handleAssigneeChange = (uid: string) => {
    setAssigneeId(uid);
    if (!uid) {
      setAssigneeName('');
      return;
    }
    const found = users.find(u => String(u.Id || u.id) === String(uid));
    setAssigneeName(found ? (found.Name || found.name || '') : '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);

      const activeStatus = statuses.find(s => String(s.Id || s.id) === String(statusId));
      const statusCode = activeStatus ? activeStatus.StatusCode : 'OPEN';
      const statusName = activeStatus ? activeStatus.StatusName : 'Open';

      // Check if closing
      let finalClosedAt = closedAt;
      if (activeStatus?.IsClosureStatus && !closedAt) {
        finalClosedAt = new Date().toISOString().split('T')[0];
      } else if (!activeStatus?.IsClosureStatus) {
        finalClosedAt = '';
      }

      const payload = {
        CompanyId: activeCompany?.id || 1,
        Title: title.trim(),
        Description: description.trim(),
        Department: department,
        AssigneeId: assigneeId ? Number(assigneeId) : null,
        AssigneeName: assigneeName,
        StatusId: statusId ? Number(statusId) : null,
        StatusCode: statusCode,
        StatusName: statusName,
        Priority: priority,
        SlaDeadline: slaDeadline,
        AttachmentUrl: attachmentUrl.trim(),
        ApproverRemarks: approverRemarks.trim(),
        IsApproved: Number(isApproved),
        EscalatedCount: Number(escalatedCount),
        LastEscalationDate: lastEscalationDate,
        ClosedAt: finalClosedAt,
        CreatedBy: isEdit ? createdBy : (user?.Name || user?.name || user?.Email || 'System user')
      };

      const url = `/api/data/Issues${isEdit ? `/${id}` : ''}`;
      const method = isEdit ? 'PUT' : 'POST';

      // Capture old state for audit logging
      let oldStatusText = 'Creating';
      if (isEdit) {
        // Fetch current ticket straight from database or memory to see old status
        oldStatusText = statusName;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedIssue = await res.json();
        const activeIssueId = isEdit ? id : (savedIssue.Id || savedIssue.id || 1);

        // CREATE IMMUTABLE AUDIT LOG
        const logPayload = {
          CompanyId: activeCompany?.id || 1,
          IssueId: Number(activeIssueId),
          LogType: isEdit ? 'Status Update' : 'Ticket Creation',
          User: user?.Name || user?.name || 'System Employee',
          Remarks: isEdit ? `Ticket metadata modified. Current status: ${statusName}.` : 'Initial issue registration submitted.',
          OldStatus: isEdit ? statusName : 'NONE', // Simplify or retrieve old
          NewStatus: statusName,
          AttachmentUrl: attachmentUrl.trim()
        };

        await fetch('/api/data/IssueLogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logPayload)
        });

        navigate('/e-tracker/issues');
      } else {
        alert('Failed to save issue ticket.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating issue record: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Escalate ticket automatically
  const handleEscalate = async () => {
    if (!isEdit) return;
    try {
      const todayString = new Date().toISOString().split('T')[0];
      const newEscalatedCount = escalatedCount + 1;
      
      const payload = {
        EscalatedCount: newEscalatedCount,
        LastEscalationDate: todayString,
        StatusName: 'Escalated',
        StatusCode: 'ESCALATED'
      };

      // Seek escalated status ID
      const escStatus = statuses.find(s => s.StatusCode === 'ESCALATED');
      if (escStatus) {
        (payload as any).StatusId = escStatus.Id || escStatus.id;
      }

      const res = await fetch(`/api/data/Issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEscalatedCount(newEscalatedCount);
        setLastEscalationDate(todayString);
        if (escStatus) {
          setStatusId(String(escStatus.Id || escStatus.id));
        }

        // Add escalation log
        await fetch('/api/data/IssueLogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            CompanyId: activeCompany?.id || 1,
            IssueId: Number(id),
            LogType: 'SLA Escalation',
            User: 'SLA Monitoring Engine',
            Remarks: `Ticket escalated automatically! Current escalation tier: ${newEscalatedCount}.`,
            OldStatus: 'Active State',
            NewStatus: 'Escalated',
            AttachmentUrl: ''
          })
        });

        // Refresh Logs list
        const logsRes = await fetch(`/api/data/IssueLogs`);
        if (logsRes.ok) {
          const rawLogs = await logsRes.json();
          setLogs((Array.isArray(rawLogs) ? rawLogs : []).filter(l => String(l.IssueId) === String(id)).sort((a, b) => new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime()));
        }

        alert('Ticket successfully escalated!');
      }
    } catch (err) {
      console.error('Error conducting escalation:', err);
    }
  };

  // Approval Process (Approve / Reject)
  const handleApprovalUpdate = async (approvedCode: number, remarksMessage: string) => {
    try {
      const payload = {
        IsApproved: approvedCode,
        ApproverRemarks: remarksMessage
      };

      const res = await fetch(`/api/data/Issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsApproved(approvedCode);
        setApproverRemarks(remarksMessage);

        const decisionText = approvedCode === 1 ? 'Approved' : 'Rejected';

        await fetch('/api/data/IssueLogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            CompanyId: activeCompany?.id || 1,
            IssueId: Number(id),
            LogType: 'Approval Action',
            User: user?.Name || user?.name || 'Authorized Supervisor',
            Remarks: `Ticket resolution request ${decisionText}. Notes: ${remarksMessage}`,
            OldStatus: 'Pending Approval',
            NewStatus: decisionText,
            AttachmentUrl: ''
          })
        });

        // Reload logs
        const logsRes = await fetch(`/api/data/IssueLogs`);
        if (logsRes.ok) {
          const rawLogs = await logsRes.json();
          setLogs((Array.isArray(rawLogs) ? rawLogs : []).filter(l => String(l.IssueId) === String(id)).sort((a, b) => new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime()));
        }

        alert(`Resolution request successfully ${decisionText.toLowerCase()}!`);
      }
    } catch (err) {
      console.error('Error submitting approval response:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        <span className="text-sm font-medium">Loading ticket profiles and configuration defaults...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/e-tracker/issues')}
            className="p-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-500 transition-all shadow-sm"
            title="Back to Tickets"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">E-Tracker Workflow Panel</span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight" id="form-title">
              {isEdit ? `Ticket Profile #${id}` : 'Create Dynamic Ticket'}
            </h1>
          </div>
        </div>

        {isEdit && (
          <button
            onClick={handleEscalate}
            className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-700 bg-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <AlertOctagon className="w-4 h-4" />
            Escalate Ticket (SLA)
          </button>
        )}
      </div>

      {/* Main Content Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Fields */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <div className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Issue Registration Details</h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Issue Title / Summary</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                placeholder="Give a brief summary of the complaint or technical issue..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Comprehensive Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] h-32 resize-none"
                placeholder="Describe details of the problem, incident, workflow blockage, key requirements or context..."
              />
            </div>

            {/* Configuration row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Responsible Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                >
                  {['Operations', 'Sales', 'Purchase', 'IT & Infrastructure', 'Accounting & Payroll', 'HR & Administration', 'Customer Support', 'FPC Logistics'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Assigned Employee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                >
                  <option value="">-- Unassigned --</option>
                  {users.map(u => (
                    <option key={u.Id || u.id} value={String(u.Id || u.id)}>
                      {u.Name || u.name} ({u.Role || u.role || 'Employee'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Current Status Phase</label>
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                >
                  {statuses.map(s => (
                    <option key={s.Id || s.id} value={String(s.Id || s.id)} style={{ color: s.Color }}>
                      {s.SequenceOrder}. {s.StatusName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Scale */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Priority Tier</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                >
                  <option value="Low" className="text-gray-600 font-semibold">🟢 Low Priority</option>
                  <option value="Medium" className="text-amber-600 font-semibold">🟡 Medium Priority</option>
                  <option value="High" className="text-red-600 font-semibold">🔴 High Priority</option>
                </select>
              </div>

              {/* SLA Timeline */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">SLA Resolution Timeline</label>
                <input
                  type="date"
                  value={slaDeadline}
                  onChange={(e) => setSlaDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                />
              </div>

              {/* Document/Screenshot Attachment Reference */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">References / Screenshot Link</label>
                <input
                  type="text"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  placeholder="https://example.com/screenshot.png"
                />
              </div>
            </div>

            {/* Quick Helper for Uploader Drag-and-drop simulation */}
            <div className="border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50/50 flex flex-col items-center justify-center gap-1">
              <Paperclip className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-bold text-gray-700">Drag & Drop Documents or Click to Upload</span>
              <span className="text-[10px] text-gray-500">Supports PNG, JPG, PDF, ZIP (Max 10MB)</span>
              {attachmentUrl && (
                <div className="mt-2 flex items-center bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded text-xs gap-1.5 max-w-full">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="truncate flex-1 font-mono">{attachmentUrl}</span>
                  <button type="button" onClick={() => setAttachmentUrl('')} className="text-blue-500 hover:text-blue-800 font-bold">&times;</button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => navigate('/e-tracker/issues')}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 border border-transparent rounded-lg text-sm font-medium text-white transition-all shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Preserving...' : 'Save Issue Ticket'}
              </button>
            </div>
          </div>
        </form>

        {/* Right 1 Col: Dynamic Meta / Audit Records */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Ticket Metadata</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Created By</span>
                <span className="font-semibold text-gray-900">{createdBy || 'Logged-in user'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Created At</span>
                <span className="font-semibold text-gray-900">{createdAt ? new Date(createdAt).toLocaleString() : 'Saving first...'}</span>
              </div>
              {closedAt && (
                <div className="flex justify-between">
                  <span className="text-red-500 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Closed At</span>
                  <span className="font-semibold text-red-700">{closedAt}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-50 pt-2 mt-2">
                <span className="text-gray-500">Escalation Tier</span>
                <span className={`px-1.5 py-0.5 rounded-full font-bold ${escalatedCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  {escalatedCount} times
                </span>
              </div>
              {lastEscalationDate && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">Last Escalation</span>
                  <span className="font-medium text-gray-500">{lastEscalationDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Supervisor Approvals Section */}
          {isEdit && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5 text-indigo-700">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Workflow Approvals
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Request Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    isApproved === 1 ? 'bg-green-100 text-green-800 border border-green-200' :
                    isApproved === 2 ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {isApproved === 1 ? 'APPROVED' : isApproved === 2 ? 'REJECTED' : 'PENDING'}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Supervisor Decision Remarks</label>
                  <textarea
                    value={approverRemarks}
                    onChange={(e) => setApproverRemarks(e.target.value)}
                    className="w-full border border-gray-300 rounded p-1.5 text-xs bg-gray-50/50 min-h-[60px]"
                    placeholder="Enter approval/rejection comments..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprovalUpdate(1, approverRemarks)}
                    className="py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovalUpdate(2, approverRemarks)}
                    className="py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SLA Overview & Timeline */}
          {attachmentUrl && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-xs space-y-2">
              <span className="font-bold text-gray-800 block">Preview Reference attachment:</span>
              <div className="border border-gray-200 rounded overflow-hidden">
                {attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                  <img src={attachmentUrl} alt="Screenshot attachment" className="w-full h-auto object-contain max-h-48" referrerPolicy="no-referrer" />
                ) : (
                  <div className="p-4 bg-gray-50 text-center flex flex-col items-center gap-1">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <span className="font-medium truncate max-w-full text-blue-700">{attachmentUrl}</span>
                    <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold text-[10px] flex items-center gap-1 transition-all">
                       <Download className="w-3 h-3" /> External Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Logs Sidebar */}
          {isEdit && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-gray-600" />
                Issue Activity & Audit logs
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.Id || log.id} className="border-l-2 border-slate-300 pl-3 relative space-y-1">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-400" />
                    <div className="flex justify-between items-center text-[10px]">
                      <strong className="text-gray-900">{log.User}</strong>
                      <span className="text-gray-400">{new Date(log.CreatedAt).toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="text-xs text-gray-500 font-semibold">{log.LogType}</div>
                    <p className="text-xs text-gray-600 font-normal leading-relaxed">{log.Remarks}</p>
                    {log.OldStatus && log.NewStatus && log.OldStatus !== 'NONE' && (
                      <div className="text-[10px] font-medium text-gray-500 mt-1">
                        Transition: <span className="text-slate-700 underline">{log.OldStatus}</span> &rarr; <span className="text-blue-700 font-bold">{log.NewStatus}</span>
                      </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center p-4 text-xs text-gray-400">
                    No logs recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
