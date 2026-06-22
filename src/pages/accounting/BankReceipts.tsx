import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { Plus, Search, Edit2, Trash2, Printer, X, Landmark, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export interface BankReceipt {
  Id?: number;
  id?: number;
  CompanyId: number;
  FinancialYearId: number;
  VoucherNo: string;
  ReceiptDate: string;
  BankAccountId: number;
  AccountId: number;
  Amount: number;
  ReferenceNo: string;
  ReferenceDate: string;
  Narration: string;
  Status?: string;
}

interface Account {
  Id: number;
  id?: number;
  Name: string;
  AccountGroup: string;
}

export function formatDateDMY(dateInput: string | null | undefined): string {
  if (!dateInput) return '';
  try {
    const rawStr = String(dateInput).split('T')[0];
    const parts = rawStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      } else if (parts[2].length === 4) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
  } catch (err) {
  }
  return String(dateInput);
}

export function BankReceipts() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();
  const companyId = activeCompany?.id ? Number(activeCompany.id) : 1;

  const [receipts, setReceipts] = useState<BankReceipt[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [printReceipt, setPrintReceipt] = useState<BankReceipt | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLookupAndReceipts();
  }, [companyId]);

  const fetchLookupAndReceipts = async () => {
    setLoading(true);
    try {
      const accountsRes = await fetch(`/api/v1/data/Accounts?CompanyId=${companyId}`);
      if (accountsRes.ok) {
        const accData = await accountsRes.json();
        setAccounts(accData);
      }

      const receiptsRes = await fetch(`/api/v1/data/BankReceipts?CompanyId=${companyId}`);
      if (receiptsRes.ok) {
        const recData = await receiptsRes.json();
        const filtered = recData.filter((p: any) => Number(p.CompanyId ?? p.companyid ?? 0) === companyId);
        setReceipts(filtered);
      }
    } catch (err) {
      console.error('Error fetching bank receipts data:', err);
    } finally {
      setLoading(false);
    }
  };

  const accountMap = useMemo(() => {
    const map = new Map<number, string>();
    accounts.forEach(acc => {
      const idStr = acc.Id || acc.id;
      if (idStr) map.set(Number(idStr), acc.Name);
    });
    return map;
  }, [accounts]);

  const canAdd = hasPermission('Accounting: Bank Receipts', 'add') || hasPermission('Accounting', 'add');
  const canEdit = hasPermission('Accounting: Bank Receipts', 'edit') || hasPermission('Accounting', 'edit');
  const canDelete = hasPermission('Accounting: Bank Receipts', 'delete') || hasPermission('Accounting', 'delete');

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bank receipt? This will also remove its corresponding general ledger journal postings.')) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/data/BankReceipts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReceipts(prev => prev.filter(p => (p.Id ?? p.id) !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Error: ${err.error || 'Failed to delete receipt voucher.'}`);
      }
    } catch (e: any) {
      alert(`Network Error: ${e.message}`);
    }
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter(p => {
      if (startDate && p.ReceiptDate < startDate) return false;
      if (endDate && p.ReceiptDate > endDate) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const voucherNo = (p.VoucherNo || '').toLowerCase();
        const refNo = (p.ReferenceNo || '').toLowerCase();
        const narration = (p.Narration || '').toLowerCase();
        const amountStr = String(p.Amount);
        
        const debitAccName = (accountMap.get(p.BankAccountId) || '').toLowerCase();
        const creditAccName = (accountMap.get(p.AccountId) || '').toLowerCase();

        return voucherNo.includes(term) || 
               refNo.includes(term) || 
               narration.includes(term) || 
               amountStr.includes(term) || 
               debitAccName.includes(term) || 
               creditAccName.includes(term);
      }

      return true;
    });
  }, [receipts, startDate, endDate, searchTerm, accountMap]);

  const handlePrint = (p: BankReceipt) => {
    setPrintReceipt(p);
  };

  const executeSystemPrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    
    const printWindow = window.open('', '', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Bank Receipt Voucher</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body { font-family: sans-serif; padding: 20px; }
              @media print {
                @page { size: auto; margin: 0mm; }
                body { margin: 15mm; padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-emerald-600" />
            Bank Receipt Vouchers
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Record, configure prefixes, and post bank receipts to Ledger accounts.
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => navigate('/accounting/bank-receipts/new')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Bank Receipt
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-semibold text-gray-600">Search Voucher</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Voucher No, Account, Ref No..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            From Date
          </label>
          <CustomDatePicker value={startDate} onChange={setStartDate} className="" />
        </div>

        <div className="w-full md:w-48 space-y-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            To Date
          </label>
          <CustomDatePicker value={endDate} onChange={setEndDate} className="" />
        </div>

        {(startDate || endDate || searchTerm) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 font-medium whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
            <p>Loading bank receipt records...</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Landmark className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-base font-medium">No Bank Receipts Recorded</p>
            <p className="text-sm mt-1">Try expanding your search parameters or log a new Bank Receipt.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <th className="py-4 px-6">Voucher No</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Received In (Bank)</th>
                  <th className="py-4 px-6">Received From (Credit)</th>
                  <th className="py-4 px-6">Ref No.</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {filteredReceipts.map(p => {
                  const receiptId = p.Id ?? p.id;
                  const formattedDate = formatDateDMY(p.ReceiptDate);
                  
                  return (
                    <tr key={receiptId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-mono font-medium text-emerald-700">{p.VoucherNo}</td>
                      <td className="py-4 px-6 font-semibold">{formattedDate}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {accountMap.get(p.BankAccountId) || `Bank (${p.BankAccountId})`}
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-medium">
                        {accountMap.get(p.AccountId) || `Account (${p.AccountId})`}
                      </td>
                      <td className="py-4 px-6 text-gray-500">{p.ReferenceNo || '-'}</td>
                      <td className="py-4 px-6 text-right font-bold text-gray-900">₹{p.Amount.toFixed(2)}</td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePrint(p)}
                            title="Print Voucher"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => navigate(`/accounting/bank-receipts/${receiptId}`)}
                              title="Edit Voucher"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => receiptId && handleDelete(receiptId)}
                              title="Delete Voucher"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {printReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Printer className="h-5 w-5 text-gray-500" />
                Voucher Print Preview
              </h3>
              <button
                onClick={() => setPrintReceipt(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
              <div ref={printRef} className="bg-white border-2 border-dashed border-gray-300 p-8 rounded-lg shadow-sm">
                <div className="text-center pb-6 border-b-2 border-gray-900">
                  <h4 className="text-xl font-bold uppercase tracking-wider text-gray-900">
                    {activeCompany?.name || 'FPC Organization'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {activeCompany?.address || 'Registered Corporate Office, India'}
                  </p>
                  <div className="inline-block mt-3 px-6 py-1 bg-gray-900 text-white rounded text-xs font-bold uppercase tracking-widest">
                    Bank Receipt Voucher
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-b border-gray-200 text-sm text-gray-800">
                  <div>
                    <span className="text-gray-500 text-xs block font-semibold uppercase">Voucher Number</span>
                    <strong className="font-mono text-emerald-700 text-base">{printReceipt.VoucherNo}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-xs block font-semibold uppercase">Date</span>
                    <strong className="text-base">{formatDateDMY(printReceipt.ReceiptDate)}</strong>
                  </div>
                </div>

                <div className="py-6 border-b border-gray-200 space-y-4">
                  <div className="flex justify-between text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs block font-semibold uppercase">Received In (Bank Account)</span>
                      <strong className="text-gray-900 text-base">
                        {accountMap.get(printReceipt.BankAccountId) || `Bank Account (${printReceipt.BankAccountId})`}
                      </strong>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-500 text-xs block font-semibold uppercase">Received From (Credited Account)</span>
                      <strong className="text-gray-900 text-base">
                        {accountMap.get(printReceipt.AccountId) || `Account (${printReceipt.AccountId})`}
                      </strong>
                    </div>
                  </div>

                  {printReceipt.ReferenceNo && (
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-gray-500 text-xs block font-semibold uppercase">Reference/Cheque No.</span>
                        <strong className="text-gray-900 text-base">{printReceipt.ReferenceNo}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 text-xs block font-semibold uppercase">Reference Date</span>
                        <strong className="text-gray-900 text-base">{formatDateDMY(printReceipt.ReferenceDate) || '-'}</strong>
                      </div>
                    </div>
                  )}

                  {printReceipt.Narration && (
                    <div className="bg-gray-50 p-3 rounded rounded-lg border border-gray-100 text-sm mt-3">
                      <span className="text-gray-500 text-xs block font-semibold uppercase mb-1">Narration / Description</span>
                      <p className="text-gray-700 italic">" {printReceipt.Narration} "</p>
                    </div>
                  )}
                </div>

                <div className="py-4 flex justify-between items-center border-b-2 border-gray-900">
                  <span className="text-gray-900 font-bold uppercase text-xs tracking-wider">Total Amount Received</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900">₹{printReceipt.Amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-16 text-center text-xs text-gray-600 font-medium">
                  <div className="border-t border-gray-400 pt-2 text-gray-900">Prepared By</div>
                  <div className="border-t border-gray-400 pt-2 text-gray-900">Verified By</div>
                  <div className="border-t border-gray-400 pt-2 text-gray-900">Authorized Signatory</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setPrintReceipt(null)}
                className="px-4 py-2 border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-600 hover:text-gray-800 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={executeSystemPrint}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-sm flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Trigger Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
