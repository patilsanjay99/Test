import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileText, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export function ShareForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { activeCompany } = useAppContext();

  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [transactionType, setTransactionType] = useState('Allotment');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [memberId, setMemberId] = useState('');
  const [toMemberId, setToMemberId] = useState('');
  const [numShares, setNumShares] = useState<number>(0);
  const faceValue = 100;
  const totalValue = numShares * faceValue;

  const [startingFolio, setStartingFolio] = useState('');
  const [folioFrom, setFolioFrom] = useState('');
  const [folioTo, setFolioTo] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const res = await fetch(`/api/v1/data/FPCMembers?CompanyId=${activeCompany?.id || ''}`);
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load members:", err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
    
    if (id) {
        const fetchTransaction = async () => {
            try {
                const res = await fetch(`/api/v1/data/ShareTransactions/${id}`);
                const data = await res.json();
                if (data) {
                    setTransactionType(data.TransactionType || data.transactiontype || 'Allotment');
                    setTransactionDate(data.TransactionDate ? data.TransactionDate.split('T')[0] : new Date().toISOString().split('T')[0]);
                    setMemberId(String(data.MemberId || data.memberid || ''));
                    setToMemberId(String(data.ToMemberId || data.tomemberid || ''));
                    setNumShares(data.Shares || data.shares || 0);
                    setStartingFolio(data.StartingFolio || data.startingfolio || '');
                    setFolioFrom(data.FolioFrom || data.foliofrom || '');
                    setFolioTo(data.FolioTo || data.folioto || '');
                    setRemarks(data.Remarks || data.remarks || '');
                }
            } catch (err) {
                console.error("Failed to load transaction:", err);
            }
        };
        fetchTransaction();
    }
  }, [id, activeCompany?.id]);

  // Adjust From/To numbers automatically when shares amount changes, e.g. starting value
  useEffect(() => {
    if (numShares > 0 && startingFolio && !isNaN(Number(startingFolio))) {
      const fromNum = Number(startingFolio);
      setFolioFrom(String(fromNum));
      setFolioTo(String(fromNum + numShares - 1));
    }
  }, [numShares, startingFolio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberId) {
      alert("Please select a member.");
      return;
    }

    if (transactionType === 'Transfer' && !toMemberId) {
      alert("Please select a destination member for the share transfer.");
      return;
    }

    if (transactionType === 'Transfer' && memberId === toMemberId) {
      alert("Source and destination members for share transfer cannot be the same.");
      return;
    }

    if (numShares <= 0) {
      alert("Number of shares must be greater than 0.");
      return;
    }

    // Checking if transfer/surrender member has enough shares
    const sourceMember = members.find(m => String(m.Id ?? m.id) === String(memberId));
    if (sourceMember && (transactionType === 'Transfer' || transactionType === 'Surrender')) {
      const currentAllocation = sourceMember.SharesAllocated || sourceMember.sharesallocated || 0;
      if (currentAllocation < numShares) {
        alert(`Insufficient shares! Selected member currently holds ${currentAllocation} shares, but you tried to transaction ${numShares} shares.`);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        CompanyId: activeCompany?.id ? parseInt(activeCompany.id, 10) : null,
        TransactionType: transactionType,
        TransactionDate: transactionDate,
        MemberId: parseInt(memberId, 10),
        ToMemberId: transactionType === 'Transfer' ? parseInt(toMemberId, 10) : null,
        Shares: numShares,
        FaceValue: faceValue,
        TotalAmount: totalValue,
        StartingFolio: transactionType !== 'Transfer' ? startingFolio : null,
        FolioFrom: transactionType !== 'Transfer' ? folioFrom : null,
        FolioTo: transactionType !== 'Transfer' ? folioTo : null,
        Remarks: remarks,
        Status: 'Completed'
      };

      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/v1/data/ShareTransactions/${id}` : '/api/v1/data/ShareTransactions';
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to record share transaction");
      }

      navigate('/fpc/shares');
    } catch (err: any) {
      console.error(err);
      alert(`Error saving transaction: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col space-y-6 pb-12 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/fpc/shares')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{id ? 'Edit' : 'New'} Share Transaction</h1>
            <p className="text-sm text-gray-500 mt-1">Record share allotment, transfer, or surrender.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" /> SHARE TRANSACTION MASTER
        </div>

        {/* Section 1: Transaction Details */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Transaction Header Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Transaction Type <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    required
                    value={transactionType}
                    onChange={(e) => {
                      setTransactionType(e.target.value);
                      setMemberId('');
                      setToMemberId('');
                    }}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="Allotment">Share Allotment (New Issue)</option>
                    <option value="Transfer">Share Transfer (Between Members)</option>
                    <option value="Surrender">Share Surrender (Cancelled)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:border-b-0 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  {transactionType === 'Transfer' ? 'From Member' : 'To Member'} <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  {loadingMembers ? (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading members...
                    </span>
                  ) : (
                    <select 
                      required 
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                    >
                      <option value="">Select Member...</option>
                      {members.map(m => {
                        const mid = m.Id ?? m.id;
                        const sharesCount = m.SharesAllocated || m.sharesallocated || 0;
                        return (
                          <option key={mid} value={mid}>
                            {m.FarmerName} ({m.MemberId || `M-${mid}`}) {transactionType !== 'Allotment' ? `[Has ${sharesCount} shares]` : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Transaction Date (dd/mm/yyyy) <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <CustomDatePicker 
                    required 
                    value={transactionDate}
                    onChange={setTransactionDate}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  {transactionType === 'Transfer' ? 'To Member *' : '-'}
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  {transactionType === 'Transfer' ? (
                    loadingMembers ? (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading targets...
                      </span>
                    ) : (
                      <select 
                        required 
                        value={toMemberId}
                        onChange={(e) => setToMemberId(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                      >
                        <option value="">Select Target...</option>
                        {members.map(m => {
                          const mid = m.Id ?? m.id;
                          return (
                            <option key={mid} value={mid} disabled={String(mid) === String(memberId)}>
                              {m.FarmerName} ({m.MemberId || `M-${mid}`})
                            </option>
                          );
                        })}
                      </select>
                    )
                  ) : (
                    <span className="text-xs text-slate-400 pl-3">
                      {transactionType === 'Surrender' ? 'Not applicable for surrender' : 'Not applicable for allotment'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Capital Details */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            II. Share Capital Specifications
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-blue-900 border-collapse">
            <div className="flex flex-col col-span-1 min-h-[48px] items-stretch grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2 flex items-center font-bold text-slate-800 text-xs border-r border-[#8faad8]">
                No. of Shares <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="bg-[#f1f5f9] p-1 col-span-2 flex items-center">
                <input 
                  required 
                  type="number" 
                  min="1" 
                  placeholder="0" 
                  value={numShares || ''} 
                  onChange={(e) => setNumShares(Math.max(0, parseInt(e.target.value, 10) || 0))} 
                  className="w-full px-2 py-1 border border-[#8faad8] rounded text-sm font-mono font-semibold text-slate-800 bg-[#f4fbf4] focus:outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col col-span-1 min-h-[48px] items-stretch grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2 flex items-center font-bold text-slate-800 text-xs border-r border-[#8faad8]">
                Face Value (₹)
              </div>
              <div className="bg-[#f1f5f9] p-1 col-span-2 flex items-center">
                <input 
                  required 
                  type="number" 
                  value={faceValue} 
                  readOnly 
                  className="w-full px-2 py-1 border border-[#cbd5e1] rounded text-sm font-mono font-semibold text-gray-500 bg-gray-100 cursor-not-allowed outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col col-span-1 min-h-[48px] items-stretch grid grid-cols-2">
              <div className="bg-[#f1f5f9] px-3 py-2 flex items-center font-bold text-slate-800 text-xs border-r border-blue-900">
                Total Capital
              </div>
              <div className="bg-[#f1f5f9] p-1 flex items-center pl-3">
                <span className="text-base font-mono font-bold text-slate-900">
                  ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {transactionType !== 'Transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Starting Folio
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <input 
                    type="text" 
                    value={startingFolio}
                    onChange={(e) => setStartingFolio(e.target.value)}
                    placeholder="Folio Reference" 
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  From / To Nos
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                  <input 
                    type="text" 
                    value={folioFrom}
                    onChange={(e) => setFolioFrom(e.target.value)}
                    placeholder="From" 
                    className="w-full px-2 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                  />
                  <input 
                    type="text" 
                    value={folioTo}
                    onChange={(e) => setFolioTo(e.target.value)}
                    placeholder="To" 
                    className="w-full px-2 py-1 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] font-mono" 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Notes */}
        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            III. Board Resolution References & Remarks
          </div>
          <div className="p-3 bg-white">
            <textarea 
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Approved in board meeting dated..."
              className="w-full px-3 py-2 border border-[#cbd5e1] focus:border-[#8faad8] focus:ring-1 focus:ring-blue-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block font-sans"
            ></textarea>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            disabled={saving}
            onClick={() => navigate('/fpc/shares')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm disabled:opacity-50"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm disabled:opacity-75"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                SAVING...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                RECORD TRANSACTION
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
