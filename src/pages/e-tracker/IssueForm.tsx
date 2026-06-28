import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export function IssueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const { user, hasPermission } = useAuth();

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
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [approverRemarks, setApproverRemarks] = useState('');
  const [isApproved, setIsApproved] = useState<number>(0); // 0=Pending, 1=Approved, 2=Rejected
  const [escalatedCount, setEscalatedCount] = useState<number>(0);
  const [lastEscalationDate, setLastEscalationDate] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [closedAt, setClosedAt] = useState('');
  const [createdBy, setCreatedBy] = useState('');

  // Camera integration state and refs
  const [showCamera, setShowCamera] = useState(false);
  const [capturedFlash, setCapturedFlash] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setAttachmentUrls(prev => [...prev, base64Image]);
        
        // Show flash animation for capturing confirmation
        setCapturedFlash(true);
        setTimeout(() => setCapturedFlash(false), 800);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
              
              let parsedUrls: string[] = [];
              const rawUrl = ticket.AttachmentUrl || '';
              if (rawUrl) {
                try {
                  parsedUrls = JSON.parse(rawUrl);
                  if (!Array.isArray(parsedUrls)) parsedUrls = [rawUrl];
                } catch (e) {
                  parsedUrls = [rawUrl];
                }
              }
              setAttachmentUrls(parsedUrls);

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
        AttachmentUrl: JSON.stringify(attachmentUrls),
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
          AttachmentUrl: JSON.stringify(attachmentUrls)
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

  if (!hasPermission('/e-tracker/issues', isEdit ? 'edit' : 'add')) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-full border border-red-100">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-1">You do not have permission to {isEdit ? 'edit' : 'create'} support tickets.</p>
        </div>
        <button
          onClick={() => navigate('/e-tracker/issues')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all animate-pulse"
        >
          Go Back
        </button>
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
            </div>

            {/* Document/Screenshot Attachment Reference */}
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  Array.from(e.dataTransfer.files).forEach(file => {
                    if (file.size > 10 * 1024 * 1024) {
                      alert(`File ${file.name} exceeds 10MB limit.`);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        setAttachmentUrls(prev => [...prev, ev.target!.result as string]);
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`md:col-span-2 border border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 relative transition-all cursor-pointer ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01] shadow-md' 
                  : 'border-gray-300 bg-gray-50/50 hover:bg-gray-100/80 hover:border-blue-400'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    Array.from(e.target.files).forEach(file => {
                      if (file.size > 10 * 1024 * 1024) {
                        alert(`File ${file.name} exceeds 10MB limit.`);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setAttachmentUrls(prev => [...prev, ev.target!.result as string]);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                  }
                }}
              />
              <div className="flex items-center gap-3 pointer-events-none">
                <Paperclip className="w-6 h-6 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">Drag & Drop Documents or Click to Upload</span>
                  <span className="text-xs text-gray-500">Supports PNG, JPG, PDF, ZIP (Max 10MB)</span>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening file picker
                    startCamera();
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-700 rounded-md flex items-center justify-center gap-2 transition-all font-semibold text-xs shadow-sm cursor-pointer relative z-10 hover:shadow"
                >
                  <Camera className="w-4 h-4 text-blue-500" />
                  Capture from Camera
                </button>
              </div>
            </div>

            {/* List Uploaded Files */}
            {attachmentUrls.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Attached Files</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachmentUrls.map((url, idx) => {
                    const canDelete = !isEdit || createdBy === (user?.Name || user?.name || user?.Email) || user?.Role === 'Admin' || user?.role === 'Admin' || user?.Role === 'Supervisor' || user?.role === 'Supervisor' || user?.Role === 'Manager' || user?.role === 'Manager';
                    return (
                      <div key={idx} className="flex items-center bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-xs gap-2">
                        <ImageIcon className="w-4 h-4 shrink-0 text-blue-500" />
                        <span className="truncate flex-1 font-mono text-[11px]">
                          {url.startsWith('data:image') ? `Camera_Capture_${idx + 1}.jpg` : url}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setAttachmentUrls(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 font-bold shrink-0 p-1 hover:bg-red-50 rounded"
                            title="Delete Attachment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Camera View Modal/Section */}
            {showCamera && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-600" />
                      Multi-Image Camera Capture
                    </h3>
                    <button type="button" onClick={stopCamera} className="text-gray-500 hover:text-gray-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                    {capturedFlash && (
                      <div className="absolute inset-0 bg-white/90 z-20 pointer-events-none transition-all duration-150 animate-pulse" />
                    )}
                  </div>

                  {/* Captured Previews inside Modal */}
                  {attachmentUrls.filter(u => u.startsWith('data:image')).length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-gray-500 block">
                        Captured Photos ({attachmentUrls.filter(u => u.startsWith('data:image')).length}):
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                        {attachmentUrls.filter(u => u.startsWith('data:image')).map((url, idx) => (
                          <div key={idx} className="relative w-12 h-12 rounded border border-gray-200 overflow-hidden shrink-0 shadow-sm bg-gray-50">
                            <img src={url} alt={`Capture ${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setAttachmentUrls(prev => prev.filter(item => item !== url));
                              }}
                              className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white p-0.5 rounded-bl shadow"
                              title="Remove Photo"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
                    <span className="text-xs text-blue-600 font-semibold animate-pulse">
                      Stream active. Keep capturing photos as needed.
                    </span>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={captureImage}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform rounded-lg text-sm font-semibold text-white flex items-center gap-2 shadow-sm"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 active:scale-95 transition-transform rounded-lg text-sm font-semibold text-white flex items-center gap-1 shadow-sm"
                      >
                        Finish & Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

          {/* Reference Previews */}
          {attachmentUrls.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-xs space-y-3">
              <span className="font-bold text-gray-800 block">Preview Reference Attachments:</span>
              <div className="grid grid-cols-1 gap-4">
                {attachmentUrls.map((url, idx) => (
                  <div key={idx} className="border border-gray-200 rounded overflow-hidden">
                    {(url.match(/\.(jpeg|jpg|gif|png)$/i) != null || url.startsWith('data:image/')) ? (
                      <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-auto object-contain max-h-48" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="p-4 bg-gray-50 text-center flex flex-col items-center gap-1">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <span className="font-medium truncate max-w-full text-blue-700">{url}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold text-[10px] flex items-center gap-1 transition-all">
                           <Download className="w-3 h-3" /> External Document
                        </a>
                      </div>
                    )}
                  </div>
                ))}
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
