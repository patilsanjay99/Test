import React, { useState } from 'react';
import { ArrowLeft, Save, Leaf, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LoanForm() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [tenure, setTenure] = useState<number>(0);

  const calculateInterest = () => {
    if (amount > 0 && rate > 0 && tenure > 0) {
      // Simple Interest for example
      const interest = (amount * rate * (tenure / 12)) / 100;
      return interest;
    }
    return 0;
  };

  const interestAmount = calculateInterest();
  const totalPayable = amount + interestAmount;

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/fpc/loans')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Issue New Loan</h1>
            <p className="text-sm text-gray-500 mt-1">Disburse a loan to an associated farmer/member.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Issue Loan
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-gray-400" /> Loan Application Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Member/Farmer <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Member...</option>
                <option value="1">Ramesh Patel (FPC-M-001)</option>
                <option value="2">Santosh Kumar (FPC-M-002)</option>
                <option value="3">Anita Devi (FPC-M-003)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Loan Type <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Loan Type...</option>
                <option value="crop">Crop Loan</option>
                <option value="kcc">Kisan Credit Card (KCC)</option>
                <option value="equipment">Farm Equipment Loan</option>
                <option value="livestock">Livestock Loan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Disbursal Date <span className="text-red-500">*</span></label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>

          <div className="border border-green-100 bg-green-50/30 rounded-lg p-5 mt-6">
            <h3 className="font-medium text-gray-900 border-b border-green-100 pb-3 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-green-600" />
              Financials & Repayment Structure
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Principal Amount (₹) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0.00" 
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Interest Rate (Annual %)<span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  placeholder="0.0" 
                  value={rate || ''}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Tenure (In Months) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  min="1" 
                  placeholder="0" 
                  value={tenure || ''}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-white border border-green-100 rounded-md shadow-sm">
               <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">Total Interest Payable:</span>
                  <span className="text-sm font-mono font-medium text-amber-600">
                    ₹{interestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
               </div>
               <div className="flex justify-between items-center py-1 border-t md:border-t-0 md:border-l border-gray-100 md:pl-4">
                  <span className="text-sm font-medium text-gray-900">Total Amount Payable:</span>
                  <span className="text-lg font-mono font-bold text-gray-900">
                    ₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
               </div>
            </div>
          </div>
          
          <div className="space-y-1.5 mt-6 border-t border-gray-100 pt-6">
            <label className="text-sm font-medium text-gray-700 block">Collateral / Remarks</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              placeholder="e.g. Hypothecation of tractor..."
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
