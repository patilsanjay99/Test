import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Leaf, Calculator, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { AutocompleteCombobox } from '../../components/AutocompleteCombobox';

export function LoanForm() {
  const navigate = useNavigate();
  const { activeCompany } = useAppContext();

  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [memberId, setMemberId] = useState('');
  const [loanType, setLoanType] = useState('');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [tenure, setTenure] = useState<number>(0);
  const [collateralRemarks, setCollateralRemarks] = useState('');

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
    if (activeCompany?.id) {
      fetchMembers();
    }
  }, [activeCompany?.id]);

  const calculateInterest = () => {
    if (amount > 0 && rate > 0 && tenure > 0) {
      const monthlyRate = (rate / 12) / 100;
      if (monthlyRate <= 0) return 0;
      
      const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
      
      let balance = amount;
      let totalInterest = 0;
      for (let i = 1; i <= tenure; i++) {
        const interest = balance * monthlyRate;
        let principal = emi - interest;
        if (principal > balance || i === tenure) {
          principal = balance;
        }
        totalInterest += interest;
        balance = balance - principal;
      }
      return Number(totalInterest.toFixed(2));
    }
    return 0;
  };

  const interestAmount = calculateInterest();
  const totalPayable = amount + interestAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberId) {
      alert("Please select a member.");
      return;
    }

    if (!loanType) {
      alert("Please select a loan type.");
      return;
    }

    if (amount <= 0) {
      alert("Principal amount must be greater than 0.");
      return;
    }

    if (rate < 0) {
      alert("Annual interest rate cannot be negative.");
      return;
    }

    if (tenure <= 0) {
      alert("Tenure must be at least 1 month.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        CompanyId: activeCompany?.id ? parseInt(activeCompany.id, 10) : null,
        MemberId: parseInt(memberId, 10),
        LoanType: loanType,
        DisbursementDate: disbursementDate,
        PrincipalAmount: amount,
        InterestRate: rate,
        Tenure: tenure,
        TotalInterestPayable: interestAmount,
        TotalPayable: totalPayable,
        Outstanding: amount, // Defaults to full principal amount
        CollateralRemarks: collateralRemarks,
        Status: 'Active'
      };

      const response = await fetch('/api/v1/data/Loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to record loan application");
      }

      navigate('/fpc/loans');
    } catch (err: any) {
      console.error(err);
      alert(`Error saving loan: ${err.message}`);
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
            onClick={() => navigate('/fpc/loans')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600 focus:outline-[#8faad8] focus:ring-2 focus:ring-blue-500"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Issue New Loan</h1>
            <p className="text-sm text-gray-500 mt-1">Disburse a loan to an associated farmer/member.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden block">
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2">
          <Leaf className="w-5 h-5" /> LOAN APPLICATION MASTER
        </div>

        {/* Section 1: Member Info */}
        <div className="border-b border-blue-900">
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            I. Loan Application Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Member/Farmer <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  {loadingMembers ? (
                    <span className="text-xs text-gray-400 flex items-center gap-1.5 pl-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading members...
                    </span>
                  ) : (
                    <AutocompleteCombobox
                      options={members.map(m => {
                        const mid = m.Id ?? m.id;
                        return {
                          value: String(mid),
                          label: `${m.FarmerName || ''} (${m.MemberId || `M-${mid}`})`,
                          sublabel: m.Village ? `Village: ${m.Village}` : undefined
                        };
                      })}
                      value={memberId}
                      onChange={setMemberId}
                      placeholder="Search/Select Member..."
                      required={true}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b md:border-b-0 border-blue-900 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Disbursal Date (dd/mm/yyyy) <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <CustomDatePicker 
                    required 
                    value={disbursementDate}
                    onChange={setDisbursementDate}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[48px] items-stretch">
                <div className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]">
                  Loan Type <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center">
                  <select 
                    required 
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] cursor-pointer"
                  >
                    <option value="">Select Loan Type...</option>
                    <option value="Kisan Credit (KCC)">Kisan Credit (KCC)</option>
                    <option value="Equipment Loan">Equipment Loan</option>
                    <option value="Crop Loan">Crop Loan</option>
                    <option value="Livestock Loan">Livestock Loan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Repayment Financial Details */}
        <div className="border-b border-blue-900">
          <div className="bg-emerald-50 px-4 py-2 font-bold text-emerald-900 border-b border-blue-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-[#0b8a1c]" /> Financials & Repayment Structure
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-blue-900 border-collapse">
            <div className="flex flex-col col-span-1 min-h-[48px] items-stretch grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2 flex items-center font-bold text-slate-800 text-xs border-r border-[#8faad8] label">
                Principal (₹) <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="bg-[#f1f5f9] p-1 col-span-2 flex items-center">
                <input 
                  required 
                  type="number" 
                  min="1" 
                  step="any"
                  placeholder="0.00" 
                  value={amount || ''} 
                  onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))} 
                  className="w-full px-2 py-1 border border-[#8faad8] rounded text-sm font-mono font-semibold text-slate-800 bg-[#f4fbf4] focus:outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col col-span-1 min-h-[48px] items-stretch grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2 flex items-center font-bold text-slate-800 text-xs border-r border-[#8faad8] label">
                Annual Rate (%) <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="bg-[#f1f5f9] p-1 col-span-2 flex items-center">
                <input 
                  required 
                  type="number" 
                  min="0" 
                  step="any" 
                  placeholder="0.0" 
                  value={rate || ''} 
                  onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))} 
                  className="w-full px-2 py-1 border border-[#8faad8] rounded text-sm font-mono font-semibold text-slate-800 bg-[#f4fbf4] focus:outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col col-span-1 min-h-[48px] items-stretch grid grid-cols-3">
              <div className="bg-[#f1f5f9] px-3 py-2 flex items-center font-bold text-slate-800 text-xs border-r border-blue-900 label">
                Tenure (Months) <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="bg-[#f1f5f9] p-1 col-span-2 flex items-center">
                <input 
                  required 
                  type="number" 
                  min="1" 
                  placeholder="0" 
                  value={tenure || ''} 
                  onChange={(e) => setTenure(Math.max(0, parseInt(e.target.value, 10) || 0))} 
                  className="w-full px-2 py-1 border border-[#8faad8] rounded text-sm font-mono font-semibold text-slate-800 bg-[#f4fbf4] focus:outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white border-2 border-emerald-600 rounded-lg shadow-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-bold text-slate-700">Total Interest Payable:</span>
                <span className="text-base font-mono font-bold text-amber-700">
                  ₹{interestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
                <span className="text-sm font-bold text-emerald-950">Grand Total Payable:</span>
                <span className="text-xl font-mono font-black text-emerald-900">
                  ₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Collateral Remarks */}
        <div>
          <div className="bg-[#e2e8f0] px-4 py-2 font-bold text-[#1e293b] border-b border-blue-900 text-xs tracking-wider uppercase">
            III. Collateral Security & Remarks
          </div>
          <div className="p-3 bg-white">
            <textarea 
              rows={3}
              value={collateralRemarks}
              onChange={(e) => setCollateralRemarks(e.target.value)}
              placeholder="e.g. Hypothecation of tractor..."
              className="w-full px-3 py-2 border border-[#cbd5e1] focus:border-[#8faad8] focus:ring-1 focus:ring-blue-500 rounded text-sm focus:outline-none bg-[#f4fbf4] block font-sans"
            ></textarea>
          </div>
        </div>

        {/* Action buttons at footer */}
        <div className="bg-[#f1f5f9] border-t-2 border-blue-900 p-4 flex justify-end gap-3">
          <button 
            type="button"
            disabled={saving}
            onClick={() => navigate('/fpc/loans')}
            className="px-4 py-2 border border-[#8faad8] rounded font-bold text-[#1e293b] hover:bg-[#cbd5e1] transition-colors bg-white text-sm"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#0b8a1c] hover:bg-[#097016] text-white px-5 py-2 rounded font-bold border border-blue-900 flex items-center gap-2 transition-colors uppercase text-sm"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                SAVING...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                ISSUE LOAN
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
