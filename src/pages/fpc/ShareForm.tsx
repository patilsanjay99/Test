import React, { useState } from 'react';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ShareForm() {
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState('Allotment');

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/fpc/shares')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Share Transaction</h1>
            <p className="text-sm text-gray-500 mt-1">Record share allotment, transfer, or surrender.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white transition-colors">
            Cancel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Save Transaction
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" /> Transaction Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Transaction Type <span className="text-red-500">*</span></label>
              <select 
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Allotment">Share Allotment (New Issue)</option>
                <option value="Transfer">Share Transfer (Between Members)</option>
                <option value="Surrender">Share Surrender (Cancelled)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Transaction Date <span className="text-red-500">*</span></label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                {transactionType === 'Transfer' ? 'From Member (Transferor)' : 'To Member'} <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Member...</option>
                <option value="1">Ramesh Patel (FPC-M-001)</option>
                <option value="2">Santosh Kumar (FPC-M-002)</option>
              </select>
            </div>

            {transactionType === 'Transfer' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">To Member (Transferee) <span className="text-red-500">*</span></label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select Target Member...</option>
                  <option value="1">Ramesh Patel (FPC-M-001)</option>
                  <option value="2">Santosh Kumar (FPC-M-002)</option>
                  <option value="3">Anita Devi (FPC-M-003)</option>
                </select>
              </div>
            )}
          </div>

          <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-5 mt-6">
            <h3 className="font-medium text-gray-900 border-b border-blue-100 pb-3 mb-4">Share Capital Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Number of Shares <span className="text-red-500">*</span></label>
                <input type="number" min="1" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Face Value / Share (₹)</label>
                <input type="number" min="0" defaultValue="100" readOnly className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm font-mono text-gray-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Total Value (₹)</label>
                <input type="number" readOnly placeholder="0.00" className="w-full px-3 py-2 border border-transparent bg-transparent rounded-md text-lg font-bold text-gray-900 font-mono outline-none" />
              </div>

              {transactionType !== 'Transfer' && (
                <>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-sm font-medium text-gray-700">Starting Certificate/Folio</label>
                    <input type="text" placeholder="Auto-generated" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Distinctive Numbers</label>
                    <div className="flex items-center gap-3">
                      <input type="text" placeholder="From" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      <span className="text-gray-400">to</span>
                      <input type="text" placeholder="To" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-1.5 mt-6 border-t border-gray-100 pt-6">
            <label className="text-sm font-medium text-gray-700 block">Board Resolution References / Remarks</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              placeholder="e.g. Approved in board meeting dated..."
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
