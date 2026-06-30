import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Package, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { exportToCSV } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../utils/dateFormatter';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { AutocompleteCombobox } from '../../components/AutocompleteCombobox';

export function StockLedger() {
  const { activeCompany } = useAppContext();
  const [items, setItems] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const [stockItemId, setStockItemId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('2026-04-01');
  const [toDate, setToDate] = useState<string>('2026-06-30');

  useEffect(() => {
    const compId = activeCompany?.id || '';
    Promise.all([
      fetch(`/api/v1/data/InventoryItems?CompanyId=${compId}`).then(r => r.json()),
      fetch(`/api/v1/data/SalesInvoices?CompanyId=${compId}`).then(r => r.json()),
      fetch(`/api/v1/data/PurchaseInvoices?CompanyId=${compId}`).then(r => r.json()),
      fetch(`/api/v1/data/SalesReturns?CompanyId=${compId}`).then(r => r.json()),
      fetch(`/api/v1/data/PurchaseReturns?CompanyId=${compId}`).then(r => r.json()),
      fetch(`/api/v1/data/Customers?CompanyId=${compId}`).then(r => r.json()),
      fetch(`/api/v1/data/Vendors?CompanyId=${compId}`).then(r => r.json())
    ]).then(([inv, sls, pur, srets, prets, custs, vnds]) => {
      setItems(Array.isArray(inv) ? inv : []);
      setSales(Array.isArray(sls) ? sls : []);
      setPurchases(Array.isArray(pur) ? pur : []);
      setSalesReturns(Array.isArray(srets) ? srets : []);
      setPurchaseReturns(Array.isArray(prets) ? prets : []);
      setCustomers(Array.isArray(custs) ? custs : []);
      setVendors(Array.isArray(vnds) ? vnds : []);
    }).catch(console.error);
  }, [activeCompany?.id]);

  const computedStockLedger = useMemo(() => {
    if (!stockItemId) return { ledgerRows: [], openingQty: 0, closingQty: 0 };
    
    const item = items.find(i => String(i.Id || i.id || i.ItemCode) === String(stockItemId));
    const openingQty = item ? (parseFloat(item.Quantity || 0) || 0) : 0;
    
    const txns: any[] = [];
    
    purchases.forEach(inv => {
      if (inv.Status === 'Draft' || inv.Status === 'Cancelled') return;
      const pDate = inv.InvoiceDate || inv.Date || '';
      if (!pDate) return;
      let itms: any[] = [];
      try { itms = JSON.parse(inv.ItemsData || '[]'); } catch(e) {}
      const itemTxns = itms.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId));
      itemTxns.forEach(itemTxn => {
        const vend = vendors.find(v => String(v.Vendor_ID || v.Id || v.id) === String(inv.VendorId));
        const pName = vend ? (vend.Vendor_NAME || vend.VendorName || vend.Name) : (inv.VendorName || 'Unknown');
        const pPlace = vend ? (vend.Place || vend.Vendor_address || '') : '';
        txns.push({
          Id: inv.Id || inv.id || 0,
          Date: pDate.substring(0, 10),
          VoucherType: 'Purchase',
          VoucherNo: inv.InvoiceNumber,
          PartyName: pName,
          PartyPlace: pPlace,
          Inward: parseFloat(itemTxn.qty || itemTxn.Quantity) || 0,
          Outward: 0,
          Rate: parseFloat(itemTxn.rate || itemTxn.Rate || itemTxn.Price) || 0
        });
      });
    });

    sales.forEach(inv => {
      if (inv.Status === 'Draft' || inv.Status === 'Cancelled') return;
      const sDate = inv.InvoiceDate || inv.Invoicedate || '';
      if (!sDate) return;
      let itms: any[] = [];
      try { itms = JSON.parse(inv.ItemsData || '[]'); } catch(e) {}
      const itemTxns = itms.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId));
      itemTxns.forEach(itemTxn => {
        const cust = customers.find(c => String(c.Id || c.id) === String(inv.CustomerId));
        const pName = cust ? (cust.CustomerName || cust.Name) : 'Unknown';
        const pPlace = cust ? (cust.Place || cust.Address || '') : '';
        txns.push({
          Id: inv.Id || inv.id || 0,
          Date: sDate.substring(0, 10),
          VoucherType: 'Sales',
          VoucherNo: inv.InvoiceNumber,
          PartyName: pName,
          PartyPlace: pPlace,
          Inward: 0,
          Outward: parseFloat(itemTxn.qty || itemTxn.Quantity) || 0,
          Rate: parseFloat(itemTxn.rate || itemTxn.Rate || itemTxn.Price) || 0
        });
      });
    });

    salesReturns.forEach(ret => {
      if (ret.Status === 'Draft' || ret.Status === 'Cancelled') return;
      const rDate = ret.ReturnDate || ret.returndate || '';
      if (!rDate) return;
      let itms: any[] = [];
      try { itms = JSON.parse(ret.ItemsData || '[]'); } catch(e) {}
      const itemTxns = itms.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId));
      itemTxns.forEach(itemTxn => {
        const cust = customers.find(c => String(c.Id || c.id) === String(ret.CustomerId));
        const pName = cust ? (cust.CustomerName || cust.Name) : 'Unknown';
        const pPlace = cust ? (cust.Place || cust.Address || '') : '';
        txns.push({
          Id: ret.Id || ret.id || 0,
          Date: rDate.substring(0, 10),
          VoucherType: 'Sales Return',
          VoucherNo: ret.ReturnNumber || `SR-${ret.Id || ret.id}`,
          PartyName: pName,
          PartyPlace: pPlace,
          Inward: parseFloat(itemTxn.qty || itemTxn.Quantity) || 0,
          Outward: 0,
          Rate: parseFloat(itemTxn.rate || itemTxn.Rate || itemTxn.Price) || 0
        });
      });
    });

    purchaseReturns.forEach(ret => {
      if (ret.Status === 'Draft' || ret.Status === 'Cancelled') return;
      const rDate = ret.ReturnDate || ret.returndate || '';
      if (!rDate) return;
      let itms: any[] = [];
      try { itms = JSON.parse(ret.ItemsData || '[]'); } catch(e) {}
      const itemTxns = itms.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId));
      itemTxns.forEach(itemTxn => {
        const vend = vendors.find(v => String(v.Vendor_ID || v.Id || v.id) === String(ret.VendorId));
        const pName = vend ? (vend.Vendor_NAME || vend.VendorName || vend.Name) : 'Unknown';
        const pPlace = vend ? (vend.Place || vend.Vendor_address || '') : '';
        txns.push({
          Id: ret.Id || ret.id || 0,
          Date: rDate.substring(0, 10),
          VoucherType: 'Purchase Return',
          VoucherNo: ret.ReturnNumber || `PR-${ret.Id || ret.id}`,
          PartyName: pName,
          PartyPlace: pPlace,
          Inward: 0,
          Outward: parseFloat(itemTxn.qty || itemTxn.Quantity) || 0,
          Rate: parseFloat(itemTxn.rate || itemTxn.Rate || itemTxn.Price) || 0
        });
      });
    });

    txns.sort((a, b) => {
      // 1. Sort by Date ascending
      const dateCompare = a.Date.localeCompare(b.Date);
      if (dateCompare !== 0) return dateCompare;

      // 2. Sort by Inward vs Outward (Inward first)
      const aIsInward = a.Inward > 0;
      const bIsInward = b.Inward > 0;
      if (aIsInward && !bIsInward) return -1;
      if (!aIsInward && bIsInward) return 1;

      // 3. Sort by VoucherNo (numerical comparison)
      const vCompare = String(a.VoucherNo || '').localeCompare(String(b.VoucherNo || ''), undefined, { numeric: true });
      if (vCompare !== 0) return vCompare;

      // 4. Sort by entry Id
      return (a.Id || 0) - (b.Id || 0);
    });

    let runQty = openingQty;
    const ledgerRows = [];
    
    // We can also filter txns by date range!
    // But we need to calculate adjusted opening qty based on transactions BEFORE fromDate
    let adjOpeningQty = openingQty;
    for (const txn of txns) {
      if (txn.Date < fromDate) {
        adjOpeningQty += txn.Inward - txn.Outward;
      }
    }

    let runningInPeriod = adjOpeningQty;
    for (const txn of txns) {
      if (txn.Date >= fromDate && txn.Date <= toDate) {
        runningInPeriod += txn.Inward - txn.Outward;
        ledgerRows.push({ ...txn, BalanceQty: runningInPeriod });
      }
    }

    return { 
      ledgerRows, 
      openingQty: adjOpeningQty, 
      closingQty: runningInPeriod 
    };

  }, [stockItemId, fromDate, toDate, items, purchases, sales, salesReturns, purchaseReturns, customers, vendors]);

  const outputCSV = () => {
    if (!computedStockLedger) return;
    const data = [
      { Date: '', VoucherType: '', VoucherNo: '', PartyName: 'Opening Balance', Rate: '', Inward: '', Outward: '', BalanceQty: computedStockLedger.openingQty },
      ...computedStockLedger.ledgerRows.map(r => ({
        Date: formatDate(r.Date),
        VoucherType: r.VoucherType,
        VoucherNo: r.VoucherNo,
        PartyName: r.PartyPlace ? `${r.PartyName} (${r.PartyPlace})` : r.PartyName,
        Rate: r.Rate > 0 ? r.Rate : '',
        Inward: r.Inward,
        Outward: r.Outward,
        BalanceQty: r.BalanceQty
      })),
      { Date: '', VoucherType: '', VoucherNo: '', PartyName: 'Closing Balance', Rate: '', Inward: '', Outward: '', BalanceQty: computedStockLedger.closingQty }
    ];
    exportToCSV(data, 'StockLedger');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Ledger</h1>
        <button
          onClick={outputCSV}
          disabled={!stockItemId || computedStockLedger.ledgerRows.length === 0}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Item</label>
            <AutocompleteCombobox
              options={items.map((i: any) => ({
                value: String(i.Id || i.id),
                label: i.Name || i.ItemCode || '',
                sublabel: i.Category ? `Category: ${i.Category}` : undefined
              }))}
              value={stockItemId}
              onChange={(val) => setStockItemId(val)}
              placeholder="Search/Select Item..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <CustomDatePicker
              value={fromDate}
              onChange={setFromDate}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <CustomDatePicker
              value={toDate}
              onChange={setToDate}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!stockItemId ? (
             <div className="text-center text-gray-500 py-12">Please select an item to view its ledger.</div>
          ) : (
            <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Voucher No</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Party</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Inward</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Outward</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr className="bg-blue-50 text-blue-800 font-medium font-mono text-sm">
                    <td className="px-4 py-3">{formatDate(fromDate)}</td>
                    <td colSpan={3} className="px-4 py-3 italic">Opening Balance (B/F)</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">{computedStockLedger.openingQty}</td>
                  </tr>
                  
                  {computedStockLedger.ledgerRows.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-400">No transactions in this period.</td></tr>
                  ) : (
                     computedStockLedger.ledgerRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 text-sm font-mono text-gray-600">
                        <td className="px-4 py-3">{formatDate(r.Date)}</td>
                        <td className="px-4 py-3 font-sans text-xs">{r.VoucherType}</td>
                        <td className="px-4 py-3 text-blue-600">{r.VoucherNo}</td>
                        <td className="px-4 py-3 font-sans">{r.PartyName || '-'}{r.PartyPlace ? ` (${r.PartyPlace})` : ''}</td>
                        <td className="px-4 py-3 text-right">{r.Rate > 0 ? r.Rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                        <td className="px-4 py-3 text-right text-green-600">{r.Inward > 0 ? r.Inward : '—'}</td>
                        <td className="px-4 py-3 text-right text-red-600">{r.Outward > 0 ? r.Outward : '—'}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{r.BalanceQty}</td>
                      </tr>
                    ))
                  )}

                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-sm font-mono text-gray-800">
                    <td className="px-4 py-3">{formatDate(toDate)}</td>
                    <td colSpan={3} className="px-4 py-3 italic">Closing Balance (C/F)</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">{computedStockLedger.ledgerRows.reduce((a, b) => a + b.Inward, 0)}</td>
                    <td className="px-4 py-3 text-right">{computedStockLedger.ledgerRows.reduce((a, b) => a + b.Outward, 0)}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{computedStockLedger.closingQty}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
