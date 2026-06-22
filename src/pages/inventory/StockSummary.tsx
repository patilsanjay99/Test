import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { Search, Download, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { exportToCSV } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';

export function StockSummary() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const [items, setItems] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hideZeroBalance, setHideZeroBalance] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const companyId = activeCompany?.id || '';
      try {
        const [invRes, salesRes, purRes, adjRes, sRetRes, pRetRes] = await Promise.all([
          fetch(`/api/v1/data/InventoryItems?CompanyId=${companyId}`),
          fetch(`/api/v1/data/SalesInvoices?CompanyId=${companyId}`),
          fetch(`/api/v1/data/PurchaseInvoices?CompanyId=${companyId}`),
          fetch(`/api/v1/data/StockAdjustments?CompanyId=${companyId}`),
          fetch(`/api/v1/data/SalesReturns?CompanyId=${companyId}`),
          fetch(`/api/v1/data/PurchaseReturns?CompanyId=${companyId}`)
        ]);
        
        const inv = await invRes.json();
        const sls = await salesRes.json();
        const pur = await purRes.json();
        const adj = await adjRes.json();
        const sRet = await sRetRes.json();
        const pRet = await pRetRes.json();

        setItems(Array.isArray(inv) ? inv : []);
        setSales(Array.isArray(sls) ? sls : []);
        setPurchases(Array.isArray(pur) ? pur : []);
        setAdjustments(Array.isArray(adj) ? adj : []);
        setSalesReturns(Array.isArray(sRet) ? sRet : []);
        setPurchaseReturns(Array.isArray(pRet) ? pRet : []);
      } catch (err) {
        console.error(err);
      }
    };
    if (activeCompany?.id) {
      fetchAll();
    }
  }, [activeCompany?.id]);

  const computedLedger = items.map(i => {
    let inward = 0;
    let outward = 0;
    
    // Purchases -> Inward
    purchases.forEach(p => {
       if (p.Status === 'Draft' || p.Status === 'Cancelled') return;
       let pItems: any[] = [];
       try { pItems = JSON.parse(p.ItemsData || '[]'); } catch(e) {}
       const lines = pItems.filter(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
       lines.forEach(line => {
         inward += parseFloat(line.qty || line.Quantity) || 0;
       });
    });
    
    // Sales -> Outward
    sales.forEach(s => {
       if (s.Status === 'Draft' || s.Status === 'Cancelled') return;
       let sItems: any[] = [];
       try { sItems = JSON.parse(s.ItemsData || '[]'); } catch(e) {}
       const lines = sItems.filter(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
       lines.forEach(line => {
         outward += parseFloat(line.qty || line.Quantity) || 0;
       });
    });

    // Sales Returns -> Inward (returned items coming back in to stock)
    salesReturns.forEach(sr => {
       if (sr.Status === 'Draft' || sr.Status === 'Cancelled') return;
       let srItems: any[] = [];
       try { srItems = JSON.parse(sr.ItemsData || '[]'); } catch(e) {}
       const lines = srItems.filter(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
       lines.forEach(line => {
         inward += parseFloat(line.qty || line.Quantity) || 0;
       });
    });

    // Purchase Returns -> Outward (defective/excess items going back to vendor)
    purchaseReturns.forEach(pr => {
       if (pr.Status === 'Draft' || pr.Status === 'Cancelled') return;
       let prItems: any[] = [];
       try { prItems = JSON.parse(pr.ItemsData || '[]'); } catch(e) {}
       const lines = prItems.filter(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
       lines.forEach(line => {
         outward += parseFloat(line.qty || line.Quantity) || 0;
       });
    });

    // Stock Adjustments
    adjustments.forEach(a => {
       if (a.Status === 'Draft' || a.Status === 'Cancelled') return;
       let aItems: any[] = [];
       try { aItems = JSON.parse(a.ItemsData || '[]'); } catch(e) {}
       const lines = aItems.filter(itm => String(itm.itemId || itm.ItemId) === String(i.Id || i.id));
       lines.forEach(line => {
         let diff = 0;
         if (line.newQty !== undefined && line.currentStr !== undefined) {
             const parsedNew = parseFloat(line.newQty) || 0;
             const parsedOld = parseFloat(line.currentStr) || 0;
             diff = Math.abs(parsedNew - parsedOld);
         } else {
             diff = parseFloat(line.qty || line.Quantity) || 0;
         }
         if (a.AdjustmentType === 'Quantity Addition') {
           inward += diff;
         } else if (a.AdjustmentType === 'Quantity Reduction') {
           outward += diff;
         }
       });
    });
    
    const openingStock = parseFloat(i.Quantity || 0) || 0; // Baseline initialized stock
    const closingStock = openingStock + inward - outward;
    const unitPrice = parseFloat(i.UnitPrice || i.unitprice) || 0;
    const value = closingStock * unitPrice;
    
    return {
      itemCode: i.ItemCode,
      itemName: i.Name,
      category: i.Category,
      uom: i.Unit,
      openingStock,
      inward,
      outward,
      closingStock,
      value
    };
  });

  const filteredLedger = computedLedger.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (item.itemName || '').toLowerCase().includes(term) || (item.itemCode || '').toLowerCase().includes(term);
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesBalance = hideZeroBalance ? item.closingStock !== 0 : true;
    return matchesSearch && matchesCategory && matchesBalance;
  });

  const categories = Array.from(new Set(items.map(i => i.Category).filter(Boolean)));

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Summary</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time inventory balances, stock summaries, incorporating Purchases, Sales, Adjustments, and Returns.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by item code or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-[#f4fbf4]"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f4fbf4]"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideZeroBalance}
                onChange={(e) => setHideZeroBalance(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Hide 0 Balance
            </label>
            <button
              onClick={() => exportToCSV(filteredLedger, 'StockLedger')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors bg-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="font-medium p-4 border-b border-gray-200">Item Code</th>
                <th className="font-medium p-4 border-b border-gray-200">Name</th>
                <th className="font-medium p-4 border-b border-gray-200">Category</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Inward Qty</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Outward Qty</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Balance Qty</th>
                <th className="font-medium p-4 border-b border-gray-200">Unit</th>
                <th className="font-medium p-4 border-b border-gray-200 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLedger.map((item) => (
                <tr key={item.itemCode || item.itemName} className="hover:bg-gray-50 transition-colors group text-sm text-gray-700">
                  <td className="p-4">{item.itemCode}</td>
                  <td className="p-4">{item.itemName}</td>
                  <td className="p-4">{item.category}</td>
                  <td className="p-4 text-right font-mono">{item.inward}</td>
                  <td className="p-4 text-right font-mono">{item.outward}</td>
                  <td className="p-4 text-right font-mono font-medium text-gray-900">{item.closingStock}</td>
                  <td className="p-4 text-gray-500">{item.uom}</td>
                  <td className="p-4 text-right font-mono font-medium text-gray-900 text-sm">
                    {item.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 text-sm">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
            {filteredLedger.length > 0 && (
              <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200 hidden sm:table-footer-group">
                <tr>
                  <td colSpan={3} className="p-4 text-right">Totals</td>
                  <td className="p-4 text-right font-mono text-sm">
                    {filteredLedger.reduce((sum, item) => sum + item.inward, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-mono text-sm">
                    {filteredLedger.reduce((sum, item) => sum + item.outward, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4 text-right font-mono text-sm text-blue-700">
                    ₹{filteredLedger.reduce((sum, item) => sum + parseFloat(String(item.value || 0)), 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
          Showing 1 to {filteredLedger.length} of {filteredLedger.length} items
        </div>
      </div>
    </div>
  );
}
