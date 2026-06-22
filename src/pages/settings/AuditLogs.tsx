import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { CustomDatePicker } from '../../components/CustomDatePicker';

interface AuditLog {
  id: number;
  timestamp: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  CompanyId: number;
}

export function AuditLogs({ companyId, hideHeader }: { companyId: number, hideHeader?: boolean }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [menuName, setMenuName] = useState('');
  const [userQuery, setUserQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data/audit_logs?CompanyId=${companyId}`);
      if (res.ok) {
        let data = await res.json();
        
        // Frontend filtering (to mimic backend filter for simplicity)
        if (fromDate) {
           data = data.filter((log: any) => new Date(log.timestamp) >= new Date(fromDate));
        }
        if (toDate) {
           data = data.filter((log: any) => new Date(log.timestamp) <= new Date(toDate + 'T23:59:59'));
        }
        if (menuName) {
           data = data.filter((log: any) => log.entity_type.toLowerCase().includes(menuName.toLowerCase()));
        }
        if (userQuery) {
           data = data.filter((log: any) => log.user_id.toLowerCase().includes(userQuery.toLowerCase()));
        }

        // Sort by timestamp DESC
        data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [companyId, fromDate, toDate]);

  const formatActionDetails = (action: string, detailsStr: string, recordId?: number) => {
    if (!detailsStr) return 'Success';
    try {
      const details = JSON.parse(detailsStr);
      if (action === 'UPDATE' && details.old && details.new) {
        const changes = [];
        for (const key in details.new) {
          const oldVal = details.old[key];
          const newVal = details.new[key];
          
          const oldValStr = oldVal === null || oldVal === undefined ? '' : String(oldVal);
          const newValStr = newVal === null || newVal === undefined ? '' : String(newVal);

          if (oldValStr !== newValStr && key !== 'id' && key !== 'updated_at' && key !== 'created_at' && key !== 'added_on') {
            const isOldEmpty = oldValStr.trim() === '';
            const isNewEmpty = newValStr.trim() === '';
            
            if (isOldEmpty && !isNewEmpty) {
              changes.push(`Added '${newVal}' in ${key}`);
            } else if (!isOldEmpty && !isNewEmpty) {
              changes.push(`${key} changed from '${oldVal}' to '${newVal}'`);
            } else if (!isOldEmpty && isNewEmpty) {
              changes.push(`Cleared ${key} (was '${oldVal}')`);
            }
          }
        }
        if (changes.length > 0) return changes.join(' | ');
        return 'No fields modified';
      } else if (action === 'CREATE') {
        let createdId = recordId;
        if (details.id) {
          createdId = details.id;
        } else if (details.Id) {
          createdId = details.Id;
        }

        const nameFieldOptions = ['CustomerName', 'VendorName', 'MemberName', 'ItemName', 'AccountName', 'LedgerName', 'Name', 'FullName'];
        const noFieldOptions = ['InvoiceNo', 'VoucherNo', 'ReceiptNo', 'OrderNo', 'PONo', 'SalesOrderNo', 'DocumentNo'];

        let additionalInfo = '';
        for (const field of noFieldOptions) {
          if (details[field]) {
            additionalInfo = `${field}: ${details[field]}`;
            break;
          }
        }
        
        if (!additionalInfo) {
          for (const field of nameFieldOptions) {
            if (details[field]) {
              additionalInfo = `Name: ${details[field]}`;
              break;
            }
          }
        }

        let idInfo = createdId ? `id ${createdId}` : '';
        let combinedInfo = [idInfo, additionalInfo].filter(Boolean).join(' and ');

        if (combinedInfo) {
          return `Created record successfully with ${combinedInfo}`;
        }
        return `Created record successfully`;
      } else if (action === 'DELETE') {
        const fields = Object.entries(details || {})
          .filter(([k, v]) => k !== 'id' && k !== 'created_at' && k !== 'updated_at' && v !== null && v !== undefined && String(v).trim() !== '')
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        return `Deleted record` + (fields ? ` (${fields})` : '');
      }
      return JSON.stringify(details);
    } catch (e) {
      return detailsStr;
    }
  };

  return (
    <div className={hideHeader ? "bg-white" : "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"}>
      {!hideHeader && (
      <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div>
           <h2 className="text-lg font-semibold text-gray-900">Activity History</h2>
           <p className="text-xs text-gray-500 mt-1">Track all successful actions across the system</p>
        </div>
        <div className="flex gap-2 items-center text-sm font-medium text-gray-500">
           <button onClick={fetchLogs} className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600">
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
           <span className="ml-2 hidden sm:inline"><span className="text-blue-600 font-semibold">History</span></span>
        </div>
      </div>
      )}
      
      <div className={hideHeader ? "p-4" : "p-4 md:p-6"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-gray-50/30 p-4 border border-gray-200 rounded-lg mb-6">
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">From Date</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                    <CustomDatePicker 
                        value={fromDate} 
                        onChange={setFromDate} 
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">To Date</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                    <CustomDatePicker 
                        value={toDate} 
                        onChange={setToDate} 
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu Name</label>
                <input type="text" placeholder="All Menus" value={menuName} onChange={(e) => setMenuName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User</label>
                <input type="text" placeholder="All Users" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={fetchLogs} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-colors w-full h-[38px]">
                <Search className="w-4 h-4" /> SEARCH
            </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
               <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-200">
                   <tr>
                       <th className="px-4 md:px-6 py-4">Date & Time</th>
                       <th className="px-4 md:px-6 py-4">User</th>
                       <th className="px-4 md:px-6 py-4">Menu</th>
                       <th className="px-4 md:px-6 py-4 w-1/2 min-w-[300px]">Action Details</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                   {logs.length > 0 ? logs.map(log => {
                       return (
                           <tr key={log.id} className="hover:bg-gray-50/50">
                               <td className="px-4 md:px-6 py-4 whitespace-nowrap text-gray-900 font-medium text-xs lg:text-sm">
                                   {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                               </td>
                               <td className="px-4 md:px-6 py-4">
                                   <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                                           {log.user_id.charAt(0).toUpperCase()}
                                       </div>
                                       <span className="font-medium text-gray-900 whitespace-nowrap">{log.user_id}</span>
                                   </div>
                               </td>
                               <td className="px-4 md:px-6 py-4">
                                   <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                                       {log.entity_type}
                                   </span>
                               </td>
                               <td className="px-4 md:px-6 py-4 text-gray-600 text-sm">
                                   <div className="flex items-start gap-2">
                                       <span className="font-semibold text-gray-800 uppercase tracking-wide text-xs mt-0.5 shrink-0">{log.action}</span>
                                       <span className="break-words line-clamp-3 hover:line-clamp-none">{formatActionDetails(log.action, log.details, log.entity_id)}</span>
                                   </div>
                               </td>
                           </tr>
                       )
                   }) : (
                       <tr>
                           <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                               No recent activity to show
                           </td>
                       </tr>
                   )}
               </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
