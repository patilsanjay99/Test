import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart2, 
  TrendingUp, 
  PieChart, 
  Users, 
  Package, 
  Landmark, 
  ArrowRight
} from 'lucide-react';
import { exportToCSV } from '../../lib/utils';

const reportCategories = [
  {
    title: 'Financial Reports',
    icon: Landmark,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    reports: [
      { name: 'Balance Sheet', description: 'Financial position at a specific point in time' },
      { name: 'Profit & Loss Statement', description: 'Revenues, costs, and expenses over a specific period' },
      { name: 'Trial Balance', description: 'Closing balances of all ledger accounts' },
    ]
  },
  {
    title: 'Sales & Purchase',
    icon: TrendingUp,
    color: 'bg-green-50 text-green-600 border-green-100',
    reports: [
      { name: 'Sales Register', description: 'List of all sales invoices' }
    ]
  },
  {
    title: 'Inventory Reports',
    icon: Package,
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    reports: [
      { name: 'Stock Summary', description: 'Current available stock for all items' }
    ]
  },
  {
    title: 'FPC Specific',
    icon: Users,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    reports: [
      { name: 'Member Register', description: 'List of all farmer members and their details' }
    ]
  }
];

export function Reports() {
  const [selectedReport, setSelectedReport] = React.useState<{ name: string; description: string } | null>(null);
  
  // Real data state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/data/Accounts').then(r => r.json()),
      fetch('/api/v1/data/InventoryItems').then(r => r.json()),
      fetch('/api/v1/data/SalesInvoices').then(r => r.json()),
      fetch('/api/v1/data/FPCMembers').then(r => r.json()),
    ]).then(([acc, inv, sls, mem]) => {
      setAccounts(Array.isArray(acc) ? acc : []);
      setInventory(Array.isArray(inv) ? inv : []);
      setSales(Array.isArray(sls) ? sls : []);
      setMembers(Array.isArray(mem) ? mem : []);
    }).catch(console.error);
  }, []);

  const generateData = (reportName: string) => {
    switch (reportName) {
      case 'Balance Sheet': {
        const assets = accounts.filter(a => a.AccountType === 'Asset').map(a => ({ account: a.Name, amount: parseFloat(a.OpeningBalance) || 0 }));
        const liab = accounts.filter(a => a.AccountType === 'Liability').map(a => ({ account: a.Name, amount: parseFloat(a.OpeningBalance) || 0 }));
        const equity = accounts.filter(a => a.AccountType === 'Equity').map(a => ({ account: a.Name, amount: parseFloat(a.OpeningBalance) || 0 }));
        
        // Calculate Net Profit
        const revSum = accounts.filter(a => a.AccountType === 'Revenue').reduce((acc, a) => acc + (parseFloat(a.OpeningBalance) || 0), 0);
        const expSum = accounts.filter(a => a.AccountType === 'Expense').reduce((acc, a) => acc + (parseFloat(a.OpeningBalance) || 0), 0);
        const netProfit = revSum - expSum;

        if (netProfit > 0) {
           equity.push({ account: 'Retained Earnings (Net Profit)', amount: netProfit });
        } else if (netProfit < 0) {
           equity.push({ account: 'Retained Earnings (Net Loss)', amount: netProfit });
        }

        return { assets, liabilitiesAndEquity: [...liab, ...equity] };
      }
      case 'Profit & Loss Statement': {
        const revenues = accounts.filter(a => a.AccountType === 'Revenue').map(a => ({ account: a.Name, amount: parseFloat(a.OpeningBalance) || 0 }));
        const expenses = accounts.filter(a => a.AccountType === 'Expense').map(a => ({ account: a.Name, amount: parseFloat(a.OpeningBalance) || 0 }));
        
        const revSum = revenues.reduce((acc, a) => acc + a.amount, 0);
        const expSum = expenses.reduce((acc, a) => acc + a.amount, 0);
        const netProfit = revSum - expSum;

        return { revenues, expenses, netProfit, total: Math.max(revSum, expSum + Math.max(0, netProfit), revSum + Math.max(0, -netProfit)) };
      }
      case 'Trial Balance':
        return accounts.map(a => ({
          Account: a.Name,
          Type: a.AccountType,
          Debit: a.BalanceType === 'Dr' ? (parseFloat(a.OpeningBalance) || 0) : 0,
          Credit: a.BalanceType === 'Cr' ? (parseFloat(a.OpeningBalance) || 0) : 0,
        }));
      case 'Sales Register':
        return sales.map(s => ({
          InvoiceNo: s.InvoiceNumber,
          Customer: s.CustomerName,
          Amount: s.TotalAmount,
          Date: s.InvoiceDate ? new Date(s.InvoiceDate).toLocaleDateString('en-GB') : '-',
          Status: s.Status
        }));
      case 'Stock Summary':
        return inventory.map(i => ({
          ItemCode: i.ItemCode,
          Name: i.Name,
          Category: i.Category,
          Quantity: i.Quantity,
          Unit: i.Unit,
          Value: (i.Quantity || 0) * (i.UnitPrice || 0)
        }));
      case 'Member Register':
        return members.map(m => ({
          MemberId: m.MemberCode,
          Name: m.Name,
          Phone: m.Phone,
          Village: m.Village,
          Status: m.Status,
          JoinDate: m.JoinDate ? new Date(m.JoinDate).toLocaleDateString('en-GB') : '-'
        }));
      default:
        return [];
    }
  };

  const currentData = selectedReport ? generateData(selectedReport.name) : null;

  const handleExport = () => {
    if (!selectedReport || !currentData) return;
    if (Array.isArray(currentData)) {
      exportToCSV(currentData, selectedReport.name);
    } else {
      alert("Please export simple table reports currently. Balance Sheet export is coming soon.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6 pb-12 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">MIS & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and export comprehensive business intelligence reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category, idx) => {
          const Icon = category.icon;
          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${category.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
              </div>
              <div className="p-2 flex-1">
                <ul className="divide-y divide-gray-50">
                  {category.reports.map((report, rIdx) => (
                    <li key={rIdx}>
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group flex items-start justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {report.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {report.description}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors mt-1" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {selectedReport && currentData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedReport.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedReport.description}</p>
              </div>
            </div>
            
            <div className="p-0 flex-1 overflow-auto bg-gray-50 flex flex-col">
              {selectedReport.name === 'Balance Sheet' ? (
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-0 border border-gray-200 bg-white shadow-sm">
                    <div className="border-r border-gray-200">
                      <h3 className="font-bold text-sm border-b border-gray-200 p-3 bg-gray-50 uppercase tracking-wider text-gray-700 text-center">Capital & Liabilities</h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {(currentData as any).liabilitiesAndEquity.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className="p-3">{row.account}</td>
                              <td className="p-3 text-right font-medium">{(row.amount as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
                            <td className="p-3">Total</td>
                            <td className="p-3 text-right text-blue-700">
                              {((currentData as any).liabilitiesAndEquity.reduce((acc: number, val: any) => acc + val.amount, 0) as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm border-b border-gray-200 p-3 bg-gray-50 uppercase tracking-wider text-gray-700 text-center">Assets</h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {(currentData as any).assets.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className="p-3">{row.account}</td>
                              <td className="p-3 text-right font-medium">{(row.amount as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
                            <td className="p-3">Total</td>
                            <td className="p-3 text-right text-blue-700">
                              {((currentData as any).assets.reduce((acc: number, val: any) => acc + val.amount, 0) as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              ) : selectedReport.name === 'Profit & Loss Statement' ? (
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-0 border border-gray-200 bg-white shadow-sm">
                    <div className="border-r border-gray-200">
                      <h3 className="font-bold text-sm border-b border-gray-200 p-3 bg-gray-50 uppercase tracking-wider text-gray-700 text-center">Particulars (Expenses)</h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {(currentData as any).expenses.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className="p-3">{row.account}</td>
                              <td className="p-3 text-right font-medium">{(row.amount as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                            </tr>
                          ))}
                          {(currentData as any).netProfit > 0 && (
                            <tr className="border-b border-gray-100 text-green-700 font-semibold hover:bg-green-50">
                               <td className="p-3">Net Profit</td>
                               <td className="p-3 text-right">{(currentData as any).netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
                            <td className="p-3">Total</td>
                            <td className="p-3 text-right text-blue-700">
                              {((currentData as any).total as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm border-b border-gray-200 p-3 bg-gray-50 uppercase tracking-wider text-gray-700 text-center">Particulars (Incomes)</h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {(currentData as any).revenues.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className="p-3">{row.account}</td>
                              <td className="p-3 text-right font-medium">{(row.amount as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                            </tr>
                          ))}
                          {(currentData as any).netProfit < 0 && (
                            <tr className="border-b border-gray-100 text-red-700 font-semibold hover:bg-red-50">
                               <td className="p-3">Net Loss</td>
                               <td className="p-3 text-right">{Math.abs((currentData as any).netProfit).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
                            <td className="p-3">Total</td>
                            <td className="p-3 text-right text-blue-700">
                              {((currentData as any).total as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              ) : Array.isArray(currentData) && currentData.length > 0 ? (
                <div className="min-w-full inline-block align-middle">
                  <div className="overflow-hidden bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-200">
                        <tr>
                          {Object.keys(currentData[0]).map((header, i) => (
                            <th key={i} scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              {header.replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {currentData.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                            {Object.keys(row).map((header, colIndex) => (
                              <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {typeof row[header] === 'number' 
                                  ? row[header].toLocaleString('en-IN') 
                                  : row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-16 flex flex-col items-center justify-center text-center bg-white">
                  <BarChart2 className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No data available for this report.</p>
                  <p className="text-gray-400 text-sm mt-2">Check back after adding records to the system.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Close
              </button>
              <button 
                onClick={handleExport}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
