import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  Clock, 
  Paperclip, 
  UserPlus, 
  CheckSquare, 
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  Inbox,
  User,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export function IssuesList() {
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const { user, hasPermission } = useAuth();
  const { t, language } = useLanguage();

  // Data States
  const [issues, setIssues] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');

  const fetchIssuesAndMetadata = async () => {
    try {
      setLoading(true);

      // Fetch Issues
      const resIssues = await fetch('/api/data/Issues');
      let issuesData: any[] = [];
      if (resIssues.ok) {
        const data = await resIssues.json();
        issuesData = Array.isArray(data) ? data : [];
      }

      // Fetch Statuses
      const resStatuses = await fetch('/api/data/IssueStatuses');
      if (resStatuses.ok) {
        const data = await resStatuses.json();
        setStatuses((Array.isArray(data) ? data : []).sort((a, b) => (a.SequenceOrder || 0) - (b.SequenceOrder || 0)));
      }

      // Fetch Users
      const resUsers = await fetch('/api/v1/data/Users');
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(Array.isArray(data) ? data : []);
      }

      setIssues(issuesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuesAndMetadata();
  }, [activeCompany]);

  // Is ticket delayed (SLA Breached)?
  const isSlaBreached = (ticket: any) => {
    if (!ticket.SlaDeadline) return false;
    // Check if status is a closed status.
    const matchingStatus = statuses.find(s => String(s.Id || s.id) === String(ticket.StatusId));
    if (matchingStatus?.IsClosureStatus || ticket.ClosedAt) return false;

    const deadline = new Date(ticket.SlaDeadline);
    const today = new Date();
    // Strip time
    today.setHours(0,0,0,0);
    deadline.setHours(0,0,0,0);

    return today.getTime() > deadline.getTime();
  };

  // Delete Issue
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this ticket and all audit trails? This is irreversible.')) return;
    try {
      const res = await fetch(`/api/data/Issues/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Also delete matching logs
        const logsRes = await fetch('/api/data/IssueLogs');
        if (logsRes.ok) {
          const rawLogs = await logsRes.json();
          const parsedLogs = Array.isArray(rawLogs) ? rawLogs : [];
          for (const log of parsedLogs) {
            if (String(log.IssueId) === String(id)) {
              await fetch(`/api/data/IssueLogs/${log.Id || log.id}`, { method: 'DELETE' });
            }
          }
        }
        fetchIssuesAndMetadata();
      } else {
        alert('Failed to delete ticket.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fast-assign assignee
  const handleFastAssign = async (issueId: number, name: string, uid: string) => {
    try {
      const payload = {
        AssigneeId: String(uid) === "" ? null : Number(uid),
        AssigneeName: name
      };

      const res = await fetch(`/api/data/Issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetch('/api/data/IssueLogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            CompanyId: activeCompany?.id || 1,
            IssueId: issueId,
            LogType: 'Assignment Updated',
            User: user?.Name || user?.name || 'System Supervisor',
            Remarks: String(uid) === "" ? 'Ticket unassigned.' : `Ticket assigned to employee: ${name}.`,
          })
        });
        fetchIssuesAndMetadata();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filters application
  const filteredIssues = issues.filter(ticket => {
    // Role based filtering: If the user is an Employee/ordinary user, they only see their assigned tickets or tickets they created
    const userRole = (user?.Role || user?.role || 'Employee').toString().trim().toUpperCase();
    const isAdminOrManager = ['SUPER ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER', 'HR'].includes(userRole);
    
    if (!isAdminOrManager) {
      const isAssignedToMe = (ticket.AssigneeId && String(ticket.AssigneeId) === String(user?.Id || user?.id)) || 
                             (ticket.AssigneeName && user?.Name && ticket.AssigneeName.toLowerCase() === user.Name.toLowerCase());
      const isCreatedByMe = (ticket.CreatedBy && user?.Name && ticket.CreatedBy.toLowerCase() === user.Name.toLowerCase()) || 
                            (ticket.CreatedBy && user?.Email && ticket.CreatedBy.toLowerCase() === user.Email.toLowerCase()) ||
                            (ticket.CreatedBy && user?.email && ticket.CreatedBy.toLowerCase() === user.email.toLowerCase());
      if (!isAssignedToMe && !isCreatedByMe) {
        return false;
      }
    }

    // Search filter
    const matchesSearch = 
      ticket.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.AssigneeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(ticket.Id || ticket.id).includes(searchTerm);

    // Status filter
    const matchesStatus = selectedStatus === 'ALL' || String(ticket.StatusId) === selectedStatus;

    // Priority filter
    const matchesPriority = selectedPriority === 'ALL' || ticket.Priority === selectedPriority;

    // Dept filter
    const matchesDept = selectedDepartment === 'ALL' || ticket.Department === selectedDepartment;

    // SLA Delay filter
    const matchesDelay = !showDelayedOnly || isSlaBreached(ticket);

    return matchesSearch && matchesStatus && matchesPriority && matchesDept && matchesDelay;
  });

  // Sort application
  const sortedIssues = [...filteredIssues].sort((a,b) => {
    if (sortBy === 'date_desc') {
      return new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime();
    }
    if (sortBy === 'date_asc') {
      return new Date(a.CreatedAt || 0).getTime() - new Date(b.CreatedAt || 0).getTime();
    }
    if (sortBy === 'priority_desc') {
      const priorityWeight: any = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return (priorityWeight[b.Priority] || 0) - (priorityWeight[a.Priority] || 0);
    }
    if (sortBy === 'title') {
      return (a.Title || '').localeCompare(b.Title || '');
    }
    return 0;
  });

  const translateDept = (deptName: string) => {
    const mapEnToMr: Record<string, string> = {
      'Operations': 'ऑपरेशन्स',
      'Sales': 'विक्री',
      'Purchase': 'खरेदी',
      'IT & Infrastructure': 'आयटी आणि इन्फ्रा',
      'Accounting & Payroll': 'अकाउंटिंग आणि पेरोल',
      'HR & Administration': 'एचआर आणि प्रशासन',
      'Customer Support': 'ग्राहक सहाय्य',
      'FPC Logistics': 'लॉजिस्टिक्स'
    };
    const mapEnToHi: Record<string, string> = {
      'Operations': 'संचालन',
      'Sales': 'बिक्री',
      'Purchase': 'खरीद',
      'IT & Infrastructure': 'आईटी और इन्फ्रा',
      'Accounting & Payroll': 'लेखा और पेरोल',
      'HR & Administration': 'एचआर और प्रशासन',
      'Customer Support': 'ग्राहक सहायता',
      'FPC Logistics': 'लॉजिस्टिक्स'
    };
    if (language === 'mr') return mapEnToMr[deptName] || deptName;
    if (language === 'hi') return mapEnToHi[deptName] || deptName;
    return deptName;
  };

  const translatePriority = (priority: string) => {
    const mapEnToMr: Record<string, string> = {
      'High': 'उच्च (High)',
      'Medium': 'मध्यम (Medium)',
      'Low': 'कमी (Low)'
    };
    const mapEnToHi: Record<string, string> = {
      'High': 'उच्च (High)',
      'Medium': 'मध्यम (Medium)',
      'Low': 'कम (Low)'
    };
    if (language === 'mr') return mapEnToMr[priority] || priority;
    if (language === 'hi') return mapEnToHi[priority] || priority;
    return priority;
  };

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" id="ptrack-title-icon" />
            {t('eTracker.issuesTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('eTracker.issuesSubtitle')}</p>
        </div>
        {hasPermission('/e-tracker/issues', 'add') && (
          <button
            onClick={() => navigate('/e-tracker/issues/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm shrink-0 self-start md:self-auto"
            id="btn-new-ticket"
          >
            <Plus className="w-4 h-4" />
            {t('eTracker.createTicket')}
          </button>
        )}
      </div>

      {/* Advanced Filters Bento Grid */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          <Filter className="w-4 h-4 text-gray-500" />
          {t('eTracker.filterSegment')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Summary */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('eTracker.freeSearch')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder={t('eTracker.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-1.5 w-full border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                id="search-issues-list"
              />
            </div>
          </div>

          {/* Department filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('eTracker.responsibilityArea')}</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{t('eTracker.allDepartments')}</option>
              {['Operations', 'Sales', 'Purchase', 'IT & Infrastructure', 'Accounting & Payroll', 'HR & Administration', 'Customer Support', 'FPC Logistics'].map(d => (
                <option key={d} value={d}>{translateDept(d)}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('eTracker.lifecyclePhase')}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{t('eTracker.allStatuses')}</option>
              {statuses.map(s => (
                <option key={s.Id || s.id} value={String(s.Id || s.id)}>{s.StatusName}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('eTracker.priorityWeight')}</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{t('eTracker.allPriorities')}</option>
              <option value="High">🔴 {translatePriority('High')}</option>
              <option value="Medium">🟡 {translatePriority('Medium')}</option>
              <option value="Low">🟢 {translatePriority('Low')}</option>
            </select>
          </div>
        </div>

        {/* Bottom Sorting and Toggle Switches */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-50 text-xs">
          <div className="flex items-center gap-4">
            {/* Sorting */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">{t('eTracker.sortBy')}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-none bg-transparent hover:underline hover:text-blue-600 font-bold outline-none cursor-pointer p-0 text-gray-700"
              >
                <option value="date_desc">{t('eTracker.newestFirst')}</option>
                <option value="date_asc">{t('eTracker.oldestFirst')}</option>
                <option value="priority_desc">{t('eTracker.highestPriority')}</option>
                <option value="title">{t('eTracker.alphabetical')}</option>
              </select>
            </div>

            {/* Delay Switcher */}
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-red-600 text-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={showDelayedOnly}
                onChange={(e) => setShowDelayedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="font-semibold text-xs">{t('eTracker.delayedSlaOnly')}</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchIssuesAndMetadata} 
              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all flex items-center gap-1 text-[11px]"
              title="Refresh tickets board"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {language === 'mr' ? 'रीलोड लिस्ट' : language === 'hi' ? 'रीलोड लिस्ट' : 'Reload List'}
            </button>
            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-bold">
              {sortedIssues.length} {language === 'mr' ? 'तिकीट जुळत आहे' : language === 'hi' ? 'टिकट मेल खा रहे हैं' : 'matches'}
            </span>
          </div>
        </div>
      </div>

      {/* Tickets Explorer Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm font-medium">{t('eTracker.loadingDashboard')}</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="table-etracker-tickets">
              <thead>
                <tr className="bg-gray-50/50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 border-b border-gray-200">{t('eTracker.id')}</th>
                  <th className="p-4 border-b border-gray-200">{t('eTracker.summary')}</th>
                  <th className="p-4 border-b border-gray-200 md:w-36">{t('eTracker.responsibilityArea')}</th>
                  <th className="p-4 border-b border-gray-200 text-center">{t('eTracker.status')}</th>
                  <th className="p-4 border-b border-gray-200 text-center">{t('eTracker.priority')}</th>
                  <th className="p-4 border-b border-gray-200">{t('eTracker.assignee')}</th>
                  <th className="p-4 border-b border-gray-200">{t('eTracker.deadline')}</th>
                  <th className="p-4 border-b border-gray-200 text-right">{t('eTracker.actionsLabel') || t('eTracker.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {sortedIssues.map((ticket) => {
                  const delayed = isSlaBreached(ticket);
                  const matchingStatus = statuses.find(s => String(s.Id || s.id) === String(ticket.StatusId));
                  const badgeColor = matchingStatus?.Color || '#3B82F6';

                  return (
                    <tr key={ticket.Id || ticket.id} className={`hover:bg-gray-50/25 transition-all ${delayed ? 'bg-red-50/10' : ''}`}>
                      {/* ID tag */}
                      <td className="p-4 font-mono font-bold text-gray-500">
                        #{ticket.Id || ticket.id}
                      </td>

                      {/* Ticket Info */}
                      <td className="p-4 max-w-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => navigate(`/e-tracker/issues/${ticket.Id || ticket.id}`)}
                              className="font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors block text-sm"
                            >
                              {ticket.Title}
                            </span>
                            {ticket.AttachmentUrl && ticket.AttachmentUrl !== '[]' && (
                              <span title="Contains document or screenshot attachment" className="flex items-center">
                                <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              </span>
                            )}
                            {Number(ticket.IsApproved) === 1 && (
                              <span className="bg-green-100 hover:bg-green-200 text-green-700 text-[9px] px-1.5 py-0.2 rounded font-extrabold shadow-sm shrink-0 uppercase tracking-widest">
                                {language === 'mr' ? 'मंजूर' : language === 'hi' ? 'स्वीकृत' : 'Approved'}
                              </span>
                            )}
                            {Number(ticket.IsApproved) === 2 && (
                              <span className="bg-red-100 hover:bg-red-200 text-red-700 text-[9px] px-1.5 py-0.2 rounded font-extrabold shadow-sm shrink-0 uppercase tracking-widest">
                                {language === 'mr' ? 'नाकारले' : language === 'hi' ? 'अस्वीकृत' : 'Rejected'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 max-w-[320px]">{ticket.Description}</p>
                          <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1.5">
                            <span>{language === 'mr' ? 'तक्रारदार' : language === 'hi' ? 'शिकायतकर्ता' : 'Author'}: {ticket.CreatedBy || 'Unknown'}</span>
                            <span>&bull;</span>
                            <span>{language === 'mr' ? 'तारीख' : language === 'hi' ? 'दिनांक' : 'Logged'}: {ticket.CreatedAt ? new Date(ticket.CreatedAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                          {translateDept(ticket.Department || 'Operations')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span 
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm"
                          style={{ 
                            backgroundColor: `${badgeColor}12`, 
                            color: badgeColor, 
                            borderColor: `${badgeColor}40` 
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: badgeColor }} />
                          {ticket.StatusName || 'Open'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          ticket.Priority === 'High' ? 'bg-red-100 text-red-800' :
                          ticket.Priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.Priority === 'High' ? `🔴 ${translatePriority('High')}` : ticket.Priority === 'Medium' ? `🟡 ${translatePriority('Medium')}` : `🟢 ${translatePriority('Low')}`}
                        </span>
                      </td>

                      {/* Dynamic user inline assigner */}
                      <td className="p-4 min-w-[130px]">
                        <select
                          value={ticket.AssigneeId ? String(ticket.AssigneeId) : ""}
                          onChange={(e) => {
                            const selectedUid = e.target.value;
                            const found = users.find(u => String(u.Id || u.id) === selectedUid);
                            const name = found ? (found.Name || found.name || "") : "";
                            handleFastAssign(ticket.Id || ticket.id, name, selectedUid);
                          }}
                          className="w-full text-xs border border-gray-200 hover:border-gray-300 rounded p-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[150px] font-medium text-gray-700"
                        >
                          <option value="">{t('eTracker.unassigned')}</option>
                          {users.map(u => (
                            <option key={u.Id || u.id} value={String(u.Id || u.id)}>
                              {u.Name || u.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* SLA Timelines */}
                      <td className="p-4 text-xs font-medium">
                        {ticket.SlaDeadline ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className={delayed ? "text-red-600 font-extrabold flex items-center gap-0.5" : "text-gray-700 font-bold"}>
                                {delayed && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                                {new Date(ticket.SlaDeadline).toLocaleDateString()}
                              </span>
                            </div>
                            {delayed ? (
                              <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded-full inline-block border border-red-100 animate-pulse">{t('eTracker.slaBreached')}</span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-semibold block">{language === 'mr' ? 'उर्वरित वेळ योग्य' : language === 'hi' ? 'शेष समय ठीक है' : 'Remaining time ok'}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('/e-tracker/issues', 'edit') && (
                            <button
                              onClick={() => navigate(`/e-tracker/issues/${ticket.Id || ticket.id}`)}
                              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-blue-600 transition-colors"
                              title="Edit Ticket Details"
                              id={`btn-edit-ticket-${ticket.Id || ticket.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('/e-tracker/issues', 'delete') && (
                            <button
                              onClick={() => handleDelete(ticket.Id || ticket.id)}
                              className="p-1.5 hover:bg-red-50 rounded-md text-gray-500 hover:text-red-600 transition-colors"
                              title="Purge Ticket Records"
                              id={`btn-delete-ticket-${ticket.Id || ticket.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedIssues.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                      <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
                      <div>
                        <span className="font-extrabold text-sm block text-gray-800">{t('eTracker.noTicketsFound')}</span>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {language === 'mr' ? 'वर दिलेले फिल्टर बदला किंवा नवीन तिकीट तयार करा.' : language === 'hi' ? 'ऊपर दिए गए फ़िल्टर बदलें या नया टिकट बनाएं।' : 'Adjust selected filter variables above or open a new problem ticket.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
