import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart as ChartIcon, 
  Layers, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Briefcase, 
  ShieldAlert, 
  UserPlus, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sliders,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

export function ETrackerDashboard() {
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const { t, language } = useLanguage();

  // Metrics States
  const [issues, setIssues] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Issues fetching
      const resIssues = await fetch('/api/data/Issues');
      let issuesData: any[] = [];
      if (resIssues.ok) {
        const data = await resIssues.json();
        issuesData = Array.isArray(data) ? data : [];
      }

      // Statuses fetching
      const resStatuses = await fetch('/api/data/IssueStatuses');
      let statusesData: any[] = [];
      if (resStatuses.ok) {
        const data = await resStatuses.json();
        statusesData = Array.isArray(data) ? data : [];
      }

      setIssues(issuesData);
      setStatuses(statusesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeCompany]);

  // SLA breach checker
  const isSlaBreached = (ticket: any) => {
    if (!ticket.SlaDeadline) return false;
    const matchingStatus = statuses.find(s => String(s.Id || s.id) === String(ticket.StatusId));
    if (matchingStatus?.IsClosureStatus || ticket.ClosedAt) return false;

    const deadline = new Date(ticket.SlaDeadline);
    const today = new Date();
    today.setHours(0,0,0,0);
    deadline.setHours(0,0,0,0);

    return today.getTime() > deadline.getTime();
  };

  // KPI Calculations
  const totalCount = issues.length;
  
  const openCount = issues.filter(ticket => {
    const matchingStatus = statuses.find(s => String(s.Id || s.id) === String(ticket.StatusId));
    return !matchingStatus?.IsClosureStatus && !ticket.ClosedAt;
  }).length;

  const resolvedCount = issues.filter(ticket => {
    const matchingStatus = statuses.find(s => String(s.Id || s.id) === String(ticket.StatusId));
    return matchingStatus?.IsClosureStatus || !!ticket.ClosedAt;
  }).length;

  const delayedCount = issues.filter(isSlaBreached).length;

  // Chart Data Generation (Department distribution)
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
      'Sales': 'ब्री',
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

  const departments = ['Operations', 'Sales', 'Purchase', 'IT & Infrastructure', 'Accounting & Payroll', 'HR & Administration', 'Customer Support', 'FPC Logistics'];
  const departmentData = departments.map(d => {
    const subset = issues.filter(ticket => ticket.Department === d);
    const openInDept = subset.filter(ticket => {
      const ms = statuses.find(s => String(s.Id || s.id) === String(ticket.StatusId));
      return !ms?.IsClosureStatus && !ticket.ClosedAt;
    }).length;

    return {
      name: translateDept(d),
      Total: subset.length,
      Active: openInDept
    };
  });

  // Priority division (Donut/Pie Chart)
  const priorities = ['High', 'Medium', 'Low'];
  const colors_priorityMap: any = { 
    'High': '#EF4444', 'Medium': '#F59E0B', 'Low': '#10B981',
    'उच्च (High)': '#EF4444', 'मध्यम (Medium)': '#F59E0B', 'कमी (Low)': '#10B981',
    'कम (Low)': '#10B981'
  };
  const priorityData = priorities.map(p => {
    return {
      name: translatePriority(p),
      value: issues.filter(ticket => ticket.Priority === p).length
    };
  }).filter(p => p.value > 0);

  // Status mapping
  const statusSummaryData = statuses.map(s => {
    return {
      name: s.StatusName,
      Count: issues.filter(ticket => String(ticket.StatusId) === String(s.id || s.Id)).length
    };
  }).filter(s => s.Count > 0);

  // High priority / Delayed issues subset
  const immediateActionsList = issues
    .filter(ticket => ticket.Priority === 'High' || isSlaBreached(ticket))
    .filter(ticket => {
      const ms = statuses.find(s => String(s.Id || s.id) === String(ticket.StatusId));
      return !ms?.IsClosureStatus && !ticket.ClosedAt;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" id="ptrack-dash-icon" />
            {t('eTracker.analyticsTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('eTracker.analyticsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/e-tracker/issues')}
            className="px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 transition-all flex items-center gap-1 shadow-sm"
          >
            {t('eTracker.issuesLedger')}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={fetchDashboardData} 
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-all shadow-sm"
            title="Reload metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2 shadow-sm">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm font-semibold">{t('eTracker.loadingDashboard')}</span>
        </div>
      ) : (
        <>
          {/* Dynamic KPI bento row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="etracker-kpis">
            {/* Total Issues */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between transition-all hover:scale-[1.01]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t('eTracker.totalComplaints')}</span>
                <div className="text-2xl font-extrabold text-gray-900 leading-none">{totalCount}</div>
                <span className="text-[10px] text-gray-400 block font-semibold">{t('eTracker.loggedLifespans')}</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            {/* Active Tickets */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between transition-all hover:scale-[1.01]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t('eTracker.unresolvedActive')}</span>
                <div className="text-2xl font-extrabold text-amber-600 leading-none">{openCount}</div>
                <span className="text-[10px] text-gray-400 block font-semibold">{t('eTracker.underActiveProcessing')}</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* SLA Breaches */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between transition-all hover:scale-[1.01]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t('eTracker.slaBreached')}</span>
                <div className="text-2xl font-extrabold text-red-600 leading-none animate-pulse">{delayedCount}</div>
                <span className="text-[10px] text-red-600 block font-extrabold">{t('eTracker.requiresImmediate')}</span>
              </div>
              <div className="p-3 bg-red-50 text-red-500 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Resolved Tickets */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between transition-all hover:scale-[1.01]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t('eTracker.resolvedClosed')}</span>
                <div className="text-2xl font-extrabold text-green-600 leading-none">{resolvedCount}</div>
                <span className="text-[10px] text-gray-400 block font-semibold">{t('eTracker.completedCycle')}</span>
              </div>
              <div className="p-3 bg-green-50 text-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Analytical Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Accountability (Bar chart) */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{t('eTracker.deptDivision')}</h3>
                  <p className="text-[11px] text-gray-400">{t('eTracker.divisionSubtitle')}</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">{t('eTracker.barSummary')}</span>
              </div>
              <div className="h-64">
                {isMounted && (
                  <ResponsiveContainer width="109%" height={240} style={{ marginLeft: '-5%' }}>
                    <BarChart data={departmentData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                      <XAxis dataKey="name" stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#98A2B3" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: '#F2F4F7' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="Total" fill="#3B82F6" name="Total Tickets" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Active" fill="#F59E0B" name="Active Actions" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Priority division (Pie Chart) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{t('eTracker.priorityDivision')}</h3>
                  <p className="text-[11px] text-gray-400">{t('eTracker.segmentationSubtitle')}</p>
                </div>
                <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">{t('eTracker.donut')}</span>
              </div>
              <div className="h-44 flex items-center justify-center relative">
                {isMounted && priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Tooltip />
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {priorityData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={colors_priorityMap[entry.name] || '#6B7280'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : !isMounted ? null : (
                  <span className="text-xs text-gray-400">Empty Priority Matrix</span>
                )}
                {/* Center text for donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-gray-900 leading-none">{totalCount}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-gray-50 pt-3">
                {priorities.map(p => {
                  const count = issues.filter(t => t.Priority === p).length;
                  const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(0) : 0;
                  return (
                    <div key={p}>
                      <span className="text-gray-400 font-medium block">{translatePriority(p)}</span>
                      <strong className="text-gray-900 flex items-center justify-center gap-0.5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: colors_priorityMap[p] }} />
                        {count} ({pct}%)
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Flow Distribution Map (Dynamic Line/Area trend) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Workflow Stack counts</h3>
                  <p className="text-[11px] text-gray-400">Cumulative load inside active statuses</p>
                </div>
                <span className="bg-green-50 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">Active Stages</span>
              </div>
              <div className="h-56">
                {isMounted && statusSummaryData.length > 0 ? (
                  <ResponsiveContainer width="109%" height={210} style={{ marginLeft: '-5%' }}>
                    <AreaChart data={statusSummaryData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                      <XAxis dataKey="name" stroke="#98A2B3" fontSize={10} tickLine={false} />
                      <YAxis stroke="#98A2B3" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Count" stroke="#10B981" fill="#10B98115" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : !isMounted ? null : (
                  <div className="p-12 text-center text-gray-400 text-xs"> No status summaries logged.</div>
                )}
              </div>
            </div>

            {/* Urgent / Escalated / SLA Breached Tickets actions list (Immediate view) */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 text-red-700 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
                    {t('eTracker.immediateActions')}
                  </h3>
                  <p className="text-[11px] text-gray-400">{t('eTracker.criticalAlertsSubtitle')}</p>
                </div>
                <button
                  onClick={() => navigate('/e-tracker/issues')}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {immediateActionsList.map(ticket => {
                  const delayed = isSlaBreached(ticket);
                  return (
                    <div 
                      key={ticket.Id || ticket.id} 
                      className="border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 p-3 rounded-lg flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-2">
                          <span 
                            onClick={() => navigate(`/e-tracker/issues/${ticket.Id || ticket.id}`)}
                            className="font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors block text-sm"
                          >
                            {ticket.Title}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400">#{ticket.Id || ticket.id}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                          <span>{ticket.Department}</span>
                          <span>&bull;</span>
                          <span className="text-amber-600">Assignee: {ticket.AssigneeName || 'None'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {delayed ? (
                          <span className="bg-red-100 border border-red-200 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest animate-pulse">SLA Delayed</span>
                        ) : (
                          <span className="bg-red-50 border border-red-100 text-red-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">CRITICAL</span>
                        )}
                        <button
                          onClick={() => navigate(`/e-tracker/issues/${ticket.Id || ticket.id}`)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {immediateActionsList.length === 0 && (
                  <div className="text-center p-8 bg-gray-50 border-dashed border-2 border-gray-100 rounded-lg text-gray-500 text-xs flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <span className="font-extrabold block text-gray-800">Operational SLA compliant!</span>
                      <span className="text-gray-400 mt-0.5 block">No high-priority or delayed tickets are pending unresolved.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
