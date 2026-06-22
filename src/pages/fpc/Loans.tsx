import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Download, Leaf, Calendar, CreditCard, RefreshCw, X, Printer, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export function Loans() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();

  // Navigation & Tabs
  const [viewMode, setViewMode] = useState<'loans' | 'repayments'>('loans');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Repayment Modal State
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayRemarks, setRepayRemarks] = useState('');
  const [repaySaving, setRepaySaving] = useState(false);
  const [repayPrincipal, setRepayPrincipal] = useState<number>(0);
  const [repayInterest, setRepayInterest] = useState<number>(0);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedScheduleLoan, setSelectedScheduleLoan] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const companyId = activeCompany?.id || '';

      // Fetch Loans
      const loansRes = await fetch(`/api/v1/data/Loans?CompanyId=${companyId}`);
      const loansData = await loansRes.json();

      // Fetch Members
      const membersRes = await fetch(`/api/v1/data/FPCMembers?CompanyId=${companyId}`);
      const membersData = await membersRes.json();

      // Fetch Repayments
      const repRes = await fetch(`/api/v1/data/LoanRepayments?CompanyId=${companyId}`);
      const repData = await repRes.json();

      setLoans(Array.isArray(loansData) ? loansData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setRepayments(Array.isArray(repData) ? repData : []);
    } catch (err) {
      console.error("Failed to fetch loans data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompany?.id) {
      fetchData();
    }
  }, [activeCompany?.id]);

  // Create lookup maps
  const memberMap = new Map<number, any>();
  members.forEach(m => {
    const mid = m.Id ?? m.id;
    if (mid) memberMap.set(Number(mid), m);
  });

  const loanMap = new Map<number, any>();
  loans.forEach(l => {
    const lid = l.Id ?? l.id;
    if (lid) loanMap.set(Number(lid), l);
  });

  // Unique Loan Code Generator (e.g. LN-2024-001)
  const getLoanCode = (loan: any) => {
    const idVal = loan.Id ?? loan.id ?? 1;
    const idStr = String(idVal).padStart(3, '0');
    let year = '2026';
    const dateVal = loan.DisbursementDate || loan.disbursementdate || '';
    if (dateVal) {
      const match = dateVal.match(/^(\d{4})/);
      if (match) {
        year = match[1];
      } else {
        const parts = dateVal.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          year = parts[2];
        } else {
          const partsDash = dateVal.split('-');
          if (partsDash.length === 3 && partsDash[0].length === 4) {
            year = partsDash[0];
          }
        }
      }
    }
    return `LN-${year}-${idStr}`;
  };

  // Convert dates to dd/MM/yyyy layout
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) { // yyyy-MM-dd
            return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
          }
        }
        return dateStr;
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Record repayment handler
  const openRepaymentModal = (loan: any) => {
    setSelectedLoan(loan);
    const balance = parseFloat(loan.Outstanding ?? loan.outstanding ?? 0);
    
    // Retrieve principal amount, rate, tenure
    const p = parseFloat(loan.PrincipalAmount ?? loan.principalamount ?? 0);
    const r = parseFloat(loan.InterestRate ?? loan.interestrate ?? 0);
    const n = parseInt(loan.Tenure ?? loan.tenure ?? 1);
    
    const monthlyRate = (r / 12) / 100;
    let emi = 0;
    if (monthlyRate > 0) {
      emi = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    } else {
      emi = p / n;
    }
    
    // Default payment to a single month's EMI or the remaining outstanding balance plus current interest
    const interestComponent = balance * monthlyRate;
    const maxInstallment = balance + interestComponent;
    const defaultAmountVal = Math.min(emi, maxInstallment);
    const defaultAmount = defaultAmountVal > 0 ? String(Number(defaultAmountVal.toFixed(2))) : String(balance || '');

    setRepayAmount(defaultAmount);
    setRepayRemarks('');
    setRepayDate(new Date().toISOString().split('T')[0]);
    setIsRepayModalOpen(true);

    // Initial breakdown calculation
    const val = parseFloat(defaultAmount);
    if (!isNaN(val) && val > 0) {
      const interestPart = Math.min(val, interestComponent);
      const principalPart = Math.max(0, val - interestPart);
      setRepayPrincipal(Number(principalPart.toFixed(2)));
      setRepayInterest(Number(interestPart.toFixed(2)));
    } else {
      setRepayPrincipal(0);
      setRepayInterest(0);
    }
  };

  const handleRepayAmountChange = (valStr: string) => {
    setRepayAmount(valStr);
    const val = parseFloat(valStr);
    if (selectedLoan && !isNaN(val) && val > 0) {
      const balance = parseFloat(selectedLoan.Outstanding ?? selectedLoan.outstanding ?? 0);
      const r = parseFloat(selectedLoan.InterestRate ?? selectedLoan.interestrate ?? 0);
      const monthlyRate = (r / 12) / 100;
      
      const interestComponent = balance * monthlyRate;
      const interestPart = Math.min(val, interestComponent);
      const principalPart = Math.max(0, val - interestPart);
      
      setRepayPrincipal(Number(principalPart.toFixed(2)));
      setRepayInterest(Number(interestPart.toFixed(2)));
    } else {
      setRepayPrincipal(0);
      setRepayInterest(0);
    }
  };

  const submitRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const parsedAmount = parseFloat(repayAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    const loanOutstanding = parseFloat(selectedLoan.Outstanding ?? selectedLoan.outstanding ?? 0);
    // Deduct only Principal amount from balance loan amount (Outstanding represents remaining principal or printable loan dues)
    if (repayPrincipal > loanOutstanding) {
      if (!confirm(`Warning: Calculated principal portion (₹${repayPrincipal}) is greater than outstanding balance (₹${loanOutstanding}). Do you wish to continue?`)) {
        return;
      }
    }

    try {
      setRepaySaving(true);
      const payload = {
        CompanyId: activeCompany?.id ? parseInt(activeCompany.id, 10) : null,
        LoanId: parseInt(selectedLoan.Id ?? selectedLoan.id, 10),
        MemberId: parseInt(selectedLoan.MemberId ?? selectedLoan.memberid, 10),
        RepaymentDate: repayDate,
        AmountPaid: parsedAmount,
        PrincipalPaid: repayPrincipal,
        InterestPaid: repayInterest,
        Remarks: repayRemarks || 'Repayment recorded'
      };

      const response = await fetch('/api/v1/data/LoanRepayments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to post repayment");
      }

      setIsRepayModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(`Error recording payment: ${err.message}`);
    } finally {
      setRepaySaving(false);
    }
  };

  // Filter lists based on Search & Status
  const filteredLoans = loans.filter(l => {
    const loanCode = getLoanCode(l).toLowerCase();
    const type = (l.LoanType || l.loantype || '').toLowerCase();
    
    // Member details lookup
    const mId = l.MemberId ?? l.memberid;
    const memberObj = mId ? memberMap.get(Number(mId)) : null;
    const name = (memberObj?.FarmerName || '').toLowerCase();

    const matchesSearch = loanCode.includes(searchTerm.toLowerCase()) || 
                          type.includes(searchTerm.toLowerCase()) || 
                          name.includes(searchTerm.toLowerCase());

    const statusVal = String(l.Status || l.status || 'Active').toLowerCase();
    const filterVal = statusFilter.toLowerCase();
    const matchesStatus = statusFilter ? statusVal === filterVal : true;

    return matchesSearch && matchesStatus;
  });

  const filteredRepayments = repayments.filter(r => {
    // Lookup associated details
    const lId = r.LoanId ?? r.loanid;
    const loanObj = lId ? loanMap.get(Number(lId)) : null;
    const loanCode = loanObj ? getLoanCode(loanObj).toLowerCase() : '';
    const type = loanObj ? (loanObj.LoanType || loanObj.loantype || '').toLowerCase() : '';

    const mId = r.MemberId ?? r.memberid;
    const memberObj = mId ? memberMap.get(Number(mId)) : null;
    const name = (memberObj?.FarmerName || '').toLowerCase();
    const code = (memberObj?.MemberId || '').toLowerCase();

    const matchesSearch = loanCode.includes(searchTerm.toLowerCase()) || 
                          type.includes(searchTerm.toLowerCase()) || 
                          name.includes(searchTerm.toLowerCase()) ||
                          code.includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleExport = () => {
    if (viewMode === 'loans') {
      const exportData = filteredLoans.map(l => {
        const m = memberMap.get(Number(l.MemberId ?? l.memberid));
        return {
          'Loan ID': getLoanCode(l),
          'Disbursal Date': formatDate(l.DisbursementDate || l.disbursementdate),
          'Member/Farmer Name': m?.FarmerName || 'N/A',
          'Member Code': m?.MemberId || 'N/A',
          'Loan Type': l.LoanType || l.loantype,
          'Principal Amount (₹)': l.PrincipalAmount ?? l.principalamount,
          'Rate (%)': l.InterestRate ?? l.interestrate,
          'Tenure (Months)': l.Tenure ?? l.tenure,
          'Total Payable (₹)': l.TotalPayable ?? l.totalpayable,
          'Outstanding Balance (₹)': l.Outstanding ?? l.outstanding,
          'Status': l.Status || l.status || 'Active'
        };
      });
      exportToCSV(exportData, 'FPC_Loans_Register');
    } else {
      const exportData = filteredRepayments.map(r => {
        const m = memberMap.get(Number(r.MemberId ?? r.memberid));
        const loanObj = loanMap.get(Number(r.LoanId ?? r.loanid));
        return {
          'Repayment ID': r.Id ?? r.id,
          'Payment Date': formatDate(r.RepaymentDate || r.repaymentdate),
          'Loan Code': loanObj ? getLoanCode(loanObj) : 'N/A',
          'Member/Farmer Name': m?.FarmerName || 'N/A',
          'Member Code': m?.MemberId || 'N/A',
          'Amount Paid (₹)': r.AmountPaid ?? r.amountpaid,
          'Remarks': r.Remarks ?? r.remarks
        };
      });
      exportToCSV(exportData, 'FPC_Repayments_Register');
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6 select-none font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Loan Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage member loan disbursements, repayments, and outstanding balances.</p>
        </div>
        <div className="flex gap-3">
          {hasPermission('/fpc/loans', 'add') && (
            <React.Fragment>
              <button 
                onClick={() => setViewMode(viewMode === 'loans' ? 'repayments' : 'loans')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors shadow-sm ${
                  viewMode === 'repayments' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' 
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700 bg-white'
                }`}
              >
                {viewMode === 'loans' ? 'Repayment Register' : 'Loans Register'}
              </button>
              {hasPermission('/fpc/loans', 'add') && (
                <button 
                  onClick={() => navigate('/fpc/loans/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Issue New Loan
                </button>
              )}
            </React.Fragment>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Search header panel */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={viewMode === 'loans' ? "Search by Loan ID, type, or farmer name..." : "Search by Loan ID, farmer name, or member code..."}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-[#f4fbf4] text-gray-900"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            {viewMode === 'loans' && (
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4] text-gray-900"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            )}
            <button 
              onClick={handleExport}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        
        {/* Table representation */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span>Loading loan ledger information...</span>
            </div>
          ) : viewMode === 'loans' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="font-medium p-4 border-b border-gray-200">Loan ID & Date</th>
                  <th className="font-medium p-4 border-b border-gray-200">Member/Farmer</th>
                  <th className="font-medium p-4 border-b border-gray-200">Loan Type</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Principal (₹)</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Balance Due (₹)</th>
                  <th className="font-medium p-4 border-b border-gray-200">Status</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400 text-sm">
                      No disbursed loans recorded.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const mId = loan.MemberId ?? loan.memberid;
                    const m = mId ? memberMap.get(Number(mId)) : null;
                    const isClosed = (loan.Status ?? loan.status ?? 'Active').toLowerCase() === 'closed';
                    const outstandingAmt = parseFloat(loan.Outstanding ?? loan.outstanding ?? 0);

                    return (
                      <tr key={loan.Id ?? loan.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shrink-0">
                              <Leaf className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 font-mono">{getLoanCode(loan)}</div>
                              <div className="text-xs text-gray-500">{formatDate(loan.DisbursementDate || loan.disbursementdate)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">{m?.FarmerName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{m?.MemberId || `Member ID: ${mId}`}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{loan.LoanType || loan.loantype}</td>
                        <td className="p-4 text-sm text-gray-900 text-right font-medium">
                          {(parseFloat(loan.PrincipalAmount ?? loan.principalamount ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-4 text-sm font-bold text-right ${isClosed ? 'text-gray-500' : 'text-red-600'}`}>
                          {outstandingAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            isClosed 
                              ? 'bg-gray-100 text-gray-600 border border-gray-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {loan.Status || loan.status || 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setSelectedScheduleLoan(loan);
                                setIsScheduleModalOpen(true);
                              }}
                              className="px-2 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-xs font-bold flex items-center gap-1 transition-colors uppercase cursor-pointer shadow-sm"
                              title="Repayment Schedule"
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              SCHEDULE
                            </button>
                            {!isClosed && hasPermission('/fpc/loans', 'add') && (
                              <button 
                                onClick={() => openRepaymentModal(loan)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors uppercase cursor-pointer shadow-sm"
                                title="Record Repayment"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                PAY
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            // Repayment Register Tab
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="font-medium p-4 border-b border-gray-200">Date of Payment</th>
                  <th className="font-medium p-4 border-b border-gray-200">Loan Code</th>
                  <th className="font-medium p-4 border-b border-gray-200">Farmer/Member</th>
                  <th className="font-medium p-4 border-b border-gray-200 text-right">Amount Paid (₹)</th>
                  <th className="font-medium p-4 border-b border-gray-200">Remarks / Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRepayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">
                      No repayment transactions posted.
                    </td>
                  </tr>
                ) : (
                  filteredRepayments.map((rep) => {
                    const lId = rep.LoanId ?? rep.loanid;
                    const mId = rep.MemberId ?? rep.memberid;
                    const memberObj = mId ? memberMap.get(Number(mId)) : null;
                    const loanObj = lId ? loanMap.get(Number(lId)) : null;

                    return (
                      <tr key={rep.Id ?? rep.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm text-gray-900 font-medium">
                          {formatDate(rep.RepaymentDate || rep.repaymentdate)}
                        </td>
                        <td className="p-4 text-sm font-mono text-blue-700 font-bold">
                          {loanObj ? getLoanCode(loanObj) : `LN-ID-${lId}`}
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-semibold text-gray-900">{memberObj?.FarmerName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{memberObj?.MemberId || `ID: ${mId}`}</div>
                        </td>
                        <td className="p-4 text-sm text-emerald-700 font-black text-right">
                          {(parseFloat(rep.AmountPaid ?? rep.amountpaid ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-sm text-gray-600 max-w-sm truncate" title={rep.Remarks ?? rep.remarks}>
                          {rep.Remarks ?? rep.remarks}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Table footer paging details */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {viewMode === 'loans' ? filteredLoans.length : filteredRepayments.length} of {viewMode === 'loans' ? filteredLoans.length : filteredRepayments.length} entries
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-300 cursor-not-allowed" disabled>Prev</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-blue-50 text-blue-600 font-medium border-blue-200">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-not-allowed" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* Modern floating glassmorphic slide-in dialog for recording repayments */}
      {isRepayModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-lg border-2 border-slate-900 shadow-2xl max-w-md w-full overflow-hidden block">
            {/* Modal Header */}
            <div className="bg-emerald-700 text-white font-bold py-3 px-4 uppercase tracking-wider flex items-center justify-between border-b-2 border-slate-900">
              <span className="flex items-center gap-1.5"><CreditCard className="w-5 h-5" /> RECORD REPAYMENT</span>
              <button 
                type="button" 
                onClick={() => setIsRepayModalOpen(false)}
                className="hover:bg-emerald-800 p-1 rounded-full text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details Section */}
            <div className="p-4 bg-emerald-50/50 border-b border-emerald-200 text-xs text-emerald-950 grid grid-cols-2 gap-y-2">
              <div>
                <span className="font-semibold text-emerald-800">Loan Reference:</span>
                <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">{getLoanCode(selectedLoan)}</p>
              </div>
              <div>
                <span className="font-semibold text-emerald-800">Loan Type:</span>
                <p className="font-medium text-slate-800 mt-0.5">{selectedLoan.LoanType || selectedLoan.loantype}</p>
              </div>
              <div className="col-span-2 border-t border-emerald-200/50 pt-2 mt-1">
                <span className="font-semibold text-emerald-800">Farmer/Member Name:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {memberMap.get(Number(selectedLoan.MemberId ?? selectedLoan.memberid))?.FarmerName || 'N/A'}
                </p>
              </div>
              <div className="col-span-2 bg-white border border-emerald-200 p-2 rounded-md flex justify-between items-center mt-2">
                <span className="font-bold text-slate-700">Outstanding Balance:</span>
                <span className="font-mono text-sm font-black text-red-600">
                  ₹{(parseFloat(selectedLoan.Outstanding ?? selectedLoan.outstanding ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Form Input fields */}
            <form onSubmit={submitRepayment} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Repayment Date (dd/mm/yyyy) <span className="text-red-500">*</span>
                </label>
                <CustomDatePicker
                  value={repayDate}
                  onChange={setRepayDate}
                  className="w-full bg-[#f4fbf4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Amount Paid (Installment Amount) (₹) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={repayAmount}
                  onChange={(e) => handleRepayAmountChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-[#f4fbf4]"
                />
              </div>

              {/* Principal & Interest Component Breakdown */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Principal Component:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">₹{repayPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Interest Component:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">₹{repayInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Dynamic Live Balance computation */}
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-600 block font-medium">New Principal Balance:</span>
                  <span className="text-slate-400 line-through">₹{(parseFloat(selectedLoan.Outstanding ?? selectedLoan.outstanding ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">Estimated</span>
                  <span className="font-mono font-black text-blue-700 block text-sm mt-0.5">
                    ₹{Math.max(0, parseFloat(selectedLoan.Outstanding ?? selectedLoan.outstanding ?? 0) - repayPrincipal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Remarks / Description
                </label>
                <textarea 
                  rows={2}
                  maxLength={200}
                  placeholder="e.g. Cleared 1st EMI installment"
                  value={repayRemarks}
                  onChange={(e) => setRepayRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:ring-1 focus:ring-emerald-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block text-gray-900"
                ></textarea>
              </div>

              {/* Action actions */}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsRepayModalOpen(false)}
                  disabled={repaySaving}
                  className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-200 transition-colors bg-white text-xs uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={repaySaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-bold flex items-center gap-1 transition-colors uppercase text-xs"
                >
                  {repaySaving ? (
                    <>
                      <RefreshCw className="w-3 animate-spin" />
                      SUBMITTING...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      Submit Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern sliding schedule details overlay modal */}
      {isScheduleModalOpen && selectedScheduleLoan && (() => {
        const p = parseFloat(selectedScheduleLoan.PrincipalAmount ?? selectedScheduleLoan.principalamount ?? 0);
        const r = parseFloat(selectedScheduleLoan.InterestRate ?? selectedScheduleLoan.interestrate ?? 0);
        const n = parseInt(selectedScheduleLoan.Tenure ?? selectedScheduleLoan.tenure ?? 1);
        
        const monthlyRate = (r / 12) / 100;
        let emi = 0;
        if (monthlyRate > 0) {
          emi = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
        } else {
          emi = p / n;
        }

        const disbDate = selectedScheduleLoan.DisbursementDate || selectedScheduleLoan.disbursementdate || '';

        // Generate schedule records array
        const scheduleRows = [];
        let runningPrincipalBal = p;
        let cumulativeInterest = 0;

        for (let i = 1; i <= n; i++) {
          const interestAmount = runningPrincipalBal * monthlyRate;
          let principalAmount = emi - interestAmount;
          
          if (principalAmount > runningPrincipalBal || i === n) {
            principalAmount = runningPrincipalBal;
          }
          
          const installmentAmount = principalAmount + interestAmount;
          cumulativeInterest += interestAmount;
          runningPrincipalBal = Math.max(0, runningPrincipalBal - principalAmount);
          
          // Compute Date Offset
          let d = new Date();
          if (disbDate) {
            if (disbDate.includes('/')) {
              const parts = disbDate.split('/');
              if (parts.length === 3) {
                d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              }
            } else {
              d = new Date(disbDate);
            }
          }
          if (isNaN(d.getTime())) {
            d = new Date();
          }
          d.setMonth(d.getMonth() + i);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const dueDateStr = `${day}/${month}/${year}`;

          scheduleRows.push({
            installmentNo: i,
            dueDate: dueDateStr,
            installmentAmount,
            principalAmount,
            interestAmount,
            balanceOutstanding: runningPrincipalBal
          });
        }

        const totalPayable = p + cumulativeInterest;

        const mId = selectedScheduleLoan.MemberId ?? selectedScheduleLoan.memberid;
        const memberObj = mId ? memberMap.get(Number(mId)) : null;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border-2 border-slate-900 shadow-2xl max-w-2xl w-full overflow-hidden block">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white font-bold py-3 px-4 uppercase tracking-wider flex items-center justify-between border-b-2 border-slate-900">
                <span className="flex items-center gap-1.5"><Calendar className="w-5 h-5 text-blue-400" /> AMORTIZATION REPAYMENT SCHEDULE</span>
                <button 
                  type="button" 
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="hover:bg-slate-800 p-1 rounded-full text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loan parameters overview drawer metadata */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">Loan ID:</span>
                  <p className="font-mono font-black text-sm text-slate-900 mt-0.5">{getLoanCode(selectedScheduleLoan)}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">Farmer Name:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{memberObj?.FarmerName || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">Disbursal Date:</span>
                  <p className="font-medium text-slate-800 mt-0.5">{formatDate(disbDate)}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">Loan Status:</span>
                  <p className="mt-0.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                      (selectedScheduleLoan.Status ?? selectedScheduleLoan.status ?? 'Active').toLowerCase() === 'closed'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedScheduleLoan.Status || selectedScheduleLoan.status || 'Active'}
                    </span>
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-3 col-span-2 sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase">Principal:</span>
                    <p className="font-extrabold text-sm text-slate-900 mt-0.5">₹{p.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase">Interest Rate:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{r}% p.a. (Reducing)</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase">Tenure:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{n} Months</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase">Total Payable:</span>
                    <p className="font-extrabold text-sm text-blue-700 mt-0.5">₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200">
                    <tr className="text-slate-600 font-bold uppercase tracking-wider">
                      <th className="p-3 text-center">Inst #</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Installment (₹)</th>
                      <th className="p-3 text-right font-light">Principal (₹)</th>
                      <th className="p-3 text-right font-light">Interest (₹)</th>
                      <th className="p-3 text-right font-bold">Outstanding Bal (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduleRows.map((row) => (
                      <tr key={row.installmentNo} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center font-bold text-slate-500">{row.installmentNo}</td>
                        <td className="p-3 font-mono font-medium text-slate-700">{row.dueDate}</td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {row.installmentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {row.principalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {row.interestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-extrabold text-blue-900 font-mono">
                          {row.balanceOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal footer close & Export actions */}
              <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      const p = parseFloat(selectedScheduleLoan.PrincipalAmount ?? selectedScheduleLoan.principalamount ?? 0);
                      const r = parseFloat(selectedScheduleLoan.InterestRate ?? selectedScheduleLoan.interestrate ?? 0);
                      const n = parseInt(selectedScheduleLoan.Tenure ?? selectedScheduleLoan.tenure ?? 1);
                      const disbDate = selectedScheduleLoan.DisbursementDate || selectedScheduleLoan.disbursementdate || '';
                      const loanId = getLoanCode(selectedScheduleLoan);
                      const farmerName = memberObj?.FarmerName || 'N/A';
                      const status = selectedScheduleLoan.Status || selectedScheduleLoan.status || 'Active';

                      let rowsHtml = '';
                      scheduleRows.forEach((row: any) => {
                        rowsHtml += `
                          <tr>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${row.installmentNo}</td>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">${row.dueDate}</td>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold;">${row.installmentAmount.toFixed(2)}</td>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${row.principalAmount.toFixed(2)}</td>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${row.interestAmount.toFixed(2)}</td>
                            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; color: #1e3a8a;">${row.balanceOutstanding.toFixed(2)}</td>
                          </tr>
                        `;
                      });

                      const html = `
                        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                        <head>
                          <meta charset="utf-8">
                          <!--[if gte mso 9]>
                          <xml>
                            <x:ExcelWorkbook>
                              <x:ExcelWorksheets>
                                <x:ExcelWorksheet>
                                  <x:Name>Schedule</x:Name>
                                  <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                  </x:WorksheetOptions>
                                </x:ExcelWorksheet>
                              </x:ExcelWorksheets>
                            </x:ExcelWorkbook>
                          </xml>
                          <![endif]-->
                          <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #334155; }
                            .header-title { font-size: 18px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 5px; }
                            .subtitle { font-size: 11px; color: #64748b; margin-bottom: 20px; }
                            .meta-table { border-collapse: collapse; margin-bottom: 20px; width: 100%; font-size: 11px; }
                            .meta-table td { padding: 6px 10px; border: 1px solid #cbd5e1; }
                            .meta-label { font-weight: bold; color: #475569; background-color: #f1f5f9; }
                            .schedule-table { border-collapse: collapse; width: 100%; font-size: 11px; border: 1px solid #cbd5e1; }
                            .schedule-table th { background-color: #0f172a; color: white; font-weight: bold; padding: 10px; text-align: left; }
                          </style>
                        </head>
                        <body>
                          <div class="header-title">Amortization Repayment Schedule</div>
                          <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-IN')}</div>
                          
                          <table class="meta-table">
                            <tr>
                              <td class="meta-label">Loan ID</td>
                              <td>${loanId}</td>
                              <td class="meta-label">Farmer Name</td>
                              <td>${farmerName}</td>
                            </tr>
                            <tr>
                              <td class="meta-label">Disbursal Date</td>
                              <td>${formatDate(disbDate)}</td>
                              <td class="meta-label">Loan Status</td>
                              <td>${status}</td>
                            </tr>
                            <tr>
                              <td class="meta-label">Principal Amount</td>
                              <td style="font-weight: bold;">₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td class="meta-label">Interest Rate</td>
                              <td>${r}% p.a. (Reducing)</td>
                            </tr>
                            <tr>
                              <td class="meta-label">Tenure (Months)</td>
                              <td>${n}</td>
                              <td class="meta-label">Total Payable</td>
                              <td style="font-weight: bold; color: #1e40af;">₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </table>

                          <table class="schedule-table">
                            <thead>
                              <tr style="background-color: #0f172a; color: white;">
                                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">Inst #</th>
                                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Due Date</th>
                                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">Installment (₹)</th>
                                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">Principal (₹)</th>
                                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">Interest (₹)</th>
                                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">Outstanding Bal (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${rowsHtml}
                            </tbody>
                          </table>
                        </body>
                        </html>
                      `;

                      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Loan_Schedule_${loanId || 'Export'}.xls`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded uppercase tracking-wider shadow flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export to Excel
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      const p = parseFloat(selectedScheduleLoan.PrincipalAmount ?? selectedScheduleLoan.principalamount ?? 0);
                      const r = parseFloat(selectedScheduleLoan.InterestRate ?? selectedScheduleLoan.interestrate ?? 0);
                      const n = parseInt(selectedScheduleLoan.Tenure ?? selectedScheduleLoan.tenure ?? 1);
                      const disbDate = selectedScheduleLoan.DisbursementDate || selectedScheduleLoan.disbursementdate || '';
                      const loanId = getLoanCode(selectedScheduleLoan);
                      const farmerName = memberObj?.FarmerName || 'N/A';
                      const status = selectedScheduleLoan.Status || selectedScheduleLoan.status || 'Active';

                      let rowsHtml = '';
                      scheduleRows.forEach((row: any) => {
                        rowsHtml += `
                          <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #475569;">${row.installmentNo}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${row.dueDate}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">₹${row.installmentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">₹${row.principalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">₹${row.interestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1e40af; font-family: monospace;">₹${row.balanceOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        `;
                      });

                      const printHtml = `
                        <html>
                        <head>
                          <title></title>
                          <style>
                            @page {
                              size: auto;
                              margin: 0;
                            }
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                              color: #1e293b;
                              margin: 15mm 20mm;
                              line-height: 1.5;
                            }
                            .header {
                              display: flex;
                              justify-content: space-between;
                              align-items: center;
                              border-bottom: 3px solid #0f172a;
                              padding-bottom: 15px;
                              margin-bottom: 25px;
                            }
                            .title {
                              font-size: 22px;
                              font-weight: 800;
                              color: #0f172a;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                            }
                            .meta-grid {
                              display: grid;
                              grid-template-columns: repeat(4, 1fr);
                              gap: 15px;
                              background-color: #f8fafc;
                              border: 1px solid #e2e8f0;
                              border-radius: 8px;
                              padding: 15px;
                              margin-bottom: 30px;
                              font-size: 13px;
                            }
                            .meta-box {
                              margin-bottom: 10px;
                            }
                            .meta-box span {
                              font-weight: 600;
                              color: #64748b;
                              font-size: 11px;
                              text-transform: uppercase;
                              display: block;
                              margin-bottom: 2px;
                            }
                            .meta-box p {
                              margin: 0;
                              font-size: 14px;
                              font-weight: 700;
                              color: #0f172a;
                            }
                            .table-title {
                              font-size: 15px;
                              font-weight: 700;
                              text-transform: uppercase;
                              margin-bottom: 12px;
                              color: #334155;
                              letter-spacing: 0.5px;
                            }
                            table {
                              width: 100%;
                              border-collapse: collapse;
                              font-size: 12px;
                            }
                            th {
                              background-color: #0f172a;
                              color: white;
                              font-weight: bold;
                              text-transform: uppercase;
                              padding: 12px 10px;
                              text-align: left;
                            }
                            tr:nth-child(even) {
                              background-color: #f8fafc;
                            }
                            @media print {
                              .no-print { display: none; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <div class="title">Amortization Repayment Schedule</div>
                            <div style="font-size: 11px; color: #64748b; text-align: right; font-weight: 600;">
                              Generated: ${new Date().toLocaleDateString('en-IN')}
                            </div>
                          </div>

                          <div class="meta-grid">
                            <div class="meta-box">
                              <span>Loan ID</span>
                              <p>${loanId}</p>
                            </div>
                            <div class="meta-box">
                              <span>Farmer Name</span>
                              <p>${farmerName}</p>
                            </div>
                            <div class="meta-box">
                              <span>Disbursal Date</span>
                              <p>${formatDate(disbDate)}</p>
                            </div>
                            <div class="meta-box">
                              <span>Loan Status</span>
                              <p>${status}</p>
                            </div>
                            <div class="meta-box">
                              <span>Principal Amount</span>
                              <p>₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div class="meta-box">
                              <span>Interest Rate</span>
                              <p>${r}% p.a. (Reducing)</p>
                            </div>
                            <div class="meta-box">
                              <span>Tenure</span>
                              <p>${n} Months</p>
                            </div>
                            <div class="meta-box">
                              <span>Total Payable Amount</span>
                              <p style="color: #1e40af;">₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>

                          <div class="table-title">Installment Directives</div>
                          <table>
                            <thead>
                              <tr>
                                <th style="text-align: center; width: 60px;">Inst #</th>
                                <th>Due Date</th>
                                <th style="text-align: right;">Installment (₹)</th>
                                <th style="text-align: right;">Principal (₹)</th>
                                <th style="text-align: right;">Interest (₹)</th>
                                <th style="text-align: right;">Outstanding Bal (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${rowsHtml}
                            </tbody>
                          </table>

                          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
                            <div>* This is a computer-generated amortization statement. No signature required.</div>
                            <div>Page 1 of 1</div>
                          </div>

                          <script>
                            window.addEventListener('load', () => {
                              setTimeout(() => {
                                window.print();
                              }, 500);
                            });
                          </script>
                        </body>
                        </html>
                      `;

                      const iframe = document.createElement('iframe');
                      iframe.style.position = 'fixed';
                      iframe.style.width = '0px';
                      iframe.style.height = '0px';
                      iframe.style.border = 'none';
                      document.body.appendChild(iframe);

                      const doc = iframe.contentWindow?.document || iframe.contentDocument;
                      if (doc) {
                        doc.open();
                        doc.write(printHtml);
                        doc.close();
                      }

                      setTimeout(() => {
                        document.body.removeChild(iframe);
                      }, 10000);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider shadow flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print PDF
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded uppercase tracking-wider shadow cursor-pointer transition-colors"
                >
                  Close Schedule
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
