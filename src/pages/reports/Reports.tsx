import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  BarChart2, 
  TrendingUp, 
  Users, 
  Package, 
  Landmark, 
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { exportToCSV } from '../../lib/utils';
import { formatDate } from '../../utils/dateFormatter';
import { useAppContext } from '../../context/AppContext';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { AuditLogs } from '../settings/AuditLogs';

const reportCategories = [
  {
    title: 'Financial Reports',
    icon: Landmark,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    reports: [
      { name: 'Balance Sheet', description: 'Financial position at a specific point in time' },
      { name: 'Profit & Loss Statement', description: 'Revenues, costs, and expenses over a specific period' },
      { name: 'Trial Balance', description: 'Closing balances of all ledger accounts' },
      { name: 'Ledger Account Statement', description: 'Detailed ledger entries of selected account for specific period' }
    ]
  },
  {
    title: 'Sales & Purchase',
    icon: TrendingUp,
    color: 'bg-green-50 text-green-600 border-green-100',
    reports: [
      { name: 'Sales Register', description: 'List of all sales invoices' },
      { name: 'Sales Returns Register', description: 'List of all sales return records' },
      { name: 'Purchase Register', description: 'List of all purchase invoices' },
      { name: 'Purchase Returns Register', description: 'List of all purchase return / debit note records' }
    ]
  },
  {
    title: 'Inventory & Others',
    icon: Package,
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    reports: [
      { name: 'Location wise Stock Summary', description: 'Current stock balances and values' },
      { name: 'Location wise Stock Ledger', description: 'Item-wise inward, outward and balance details' },
      { name: 'Member Register', description: 'List of all FPC members and their shareholding' }
    ]
  },
  {
    title: 'System Reports',
    icon: Layers,
    color: 'bg-slate-50 text-slate-600 border-slate-100',
    reports: [
      { name: 'Audit Log', description: 'Track all user activities and system operations' }
    ]
  }
];

export function Reports() {
  const { activeCompany } = useAppContext();
  const [selectedReport, setSelectedReport] = React.useState<{ name: string; description: string } | null>(null);
  
  // Real database states
  const [accounts, setAccounts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [journalLines, setJournalLines] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Ledger Filter states
  const [ledgerAccId, setLedgerAccId] = useState<string>('');
  const [stockItemId, setStockItemId] = useState<string>('');
  const [stockLocationId, setStockLocationId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('2026-04-01');
  const [toDate, setToDate] = useState<string>('2026-06-30');
  const [asOnDate, setAsOnDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const compId = activeCompany?.id || '';
    Promise.all([
      fetch(`/api/v1/data/Accounts?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/InventoryItems?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/SalesInvoices?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/FPCMembers?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/JournalEntries?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch('/api/v1/data/JournalLines').then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/PurchaseInvoices?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/StockAdjustments?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/Customers?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/SalesReturns?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/PurchaseReturns?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/v1/data/Vendors?CompanyId=${compId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/data/locations?CompanyId=${compId}`).then(r => r.json()).catch(() => [])
    ]).then(([acc, inv, sls, mem, jEnt, jLines, pur, adj, custs, srets, prets, vnds, locs]) => {
      setAccounts(Array.isArray(acc) ? acc : []);
      setInventory(Array.isArray(inv) ? inv : []);
      setSales(Array.isArray(sls) ? sls : []);
      setMembers(Array.isArray(mem) ? mem : []);
      setJournalEntries(Array.isArray(jEnt) ? jEnt : []);
      setJournalLines(Array.isArray(jLines) ? jLines : []);
      setPurchases(Array.isArray(pur) ? pur : []);
      setAdjustments(Array.isArray(adj) ? adj : []);
      setCustomers(Array.isArray(custs) ? custs : []);
      setSalesReturns(Array.isArray(srets) ? srets : []);
      setPurchaseReturns(Array.isArray(prets) ? prets : []);
      setVendors(Array.isArray(vnds) ? vnds : []);
      setLocations(Array.isArray(locs) ? locs : []);
    }).catch(console.error);
  }, [activeCompany?.id]);

  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [isLedgerDropdownOpen, setIsLedgerDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (ledgerAccId && accounts.length > 0) {
      const activeAcc = accounts.find(a => String(a.Id || a.id) === String(ledgerAccId));
      if (activeAcc) {
        setLedgerSearch(`${activeAcc.Name} (${activeAcc.AccountCode || 'No Code'})`);
      } else {
        setLedgerSearch('');
      }
    } else {
      setLedgerSearch('');
    }
  }, [ledgerAccId, accounts]);

  const filteredAccounts = useMemo(() => {
    const sorted = [...accounts].sort((a, b) => {
      const nameA = (a.Name || '').toLowerCase();
      const nameB = (b.Name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    if (!ledgerSearch) return sorted;

    const query = ledgerSearch.toLowerCase();
    const activeAcc = accounts.find(a => String(a.Id || a.id) === String(ledgerAccId));
    const activeLabel = activeAcc ? `${activeAcc.Name} (${activeAcc.AccountCode || 'No Code'})` : '';
    
    if (ledgerSearch === activeLabel) {
      return sorted;
    }

    return sorted.filter(acc => {
      const name = (acc.Name || '').toLowerCase();
      const code = (acc.AccountCode || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [accounts, ledgerSearch, ledgerAccId]);

  // Compute stock ledger entries
  const computedStockLedger = useMemo(() => {
    if (!stockItemId) {
      return { ledgerRows: [], openingQty: 0, closingQty: 0, openingLocation: '-' };
    }
    
    // We assume Initial Stock Opening quantity would be in InventoryItems?
    // Let's assume 0 opening for simplicity unless found inside items.
    
    const item = inventory.find(i => String(i.Id || i.id || i.ItemCode) === String(stockItemId));
    // Calculate opening quantity based on selected location if any
    let openingQty = 0;
    let openingLocId = '';
    
    if (item) {
       openingLocId = item.LocationId || item.locationId || item.Location || item.location || '';
       // If no location filter, use the total master quantity. Otherwise check if master matches location.
       if (!stockLocationId) {
         openingQty = parseFloat(item.Quantity) || 0;
       } else if (String(openingLocId) === String(stockLocationId)) {
         openingQty = parseFloat(item.Quantity) || 0;
       }
    }
    
    let openingLocation = '-';
    if (openingLocId) {
      const loc = locations.find(l => String(l.Id || l.id) === String(openingLocId));
      openingLocation = loc ? loc.Name : (locations.length > 0 ? locations[0].Name : 'Main / Unassigned');
    } else {
      openingLocation = locations.length > 0 ? locations[0].Name : 'Main / Unassigned';
    }
    
    let runningQty = openingQty;
    
    // Gather all transactions from purchases and sales
    const txns: any[] = [];
    
    purchases.forEach(inv => {
      if (inv.Status === 'Draft' || inv.Status === 'Cancelled') return;
      const pDate = inv.InvoiceDate || inv.Date || '';
      if (!pDate) return;
      let items: any[] = [];
      try { items = JSON.parse(inv.ItemsData || '[]'); } catch(e) {}
      
      items.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId)).forEach((itemTxn: any) => {
        const loc = locations.find(l => String(l.Id || l.id) === String(itemTxn.locationId || itemTxn.LocationId));
        const vend = vendors.find(v => String(v.Vendor_ID || v.Id || v.id) === String(inv.VendorId));
        const pName = vend ? (vend.Vendor_NAME || vend.VendorName || vend.Name) : (inv.VendorName || 'Unknown');
        const pPlace = vend ? (vend.Place || vend.Vendor_address || '') : '';
        txns.push({
          date: pDate,
          voucherType: 'Purchase',
          voucherNo: inv.InvoiceNumber,
          partyName: pName,
          partyPlace: pPlace,
          location: loc ? loc.Name : '-',
          locationId: itemTxn.locationId || itemTxn.LocationId,
          supplierName: pName || '-',
          purchaseInvoiceNo: inv.InvoiceNumber || '-',
          inward: parseFloat(itemTxn.qty || itemTxn.Quantity) || 0,
          outward: 0,
          rate: parseFloat(itemTxn.rate || itemTxn.Rate || itemTxn.Price) || 0
        });
      });
    });

    sales.forEach(inv => {
      if (inv.Status === 'Draft' || inv.Status === 'Cancelled') return;
      const sDate = inv.InvoiceDate || inv.Invoicedate || '';
      if (!sDate) return;
      let items: any[] = [];
      try { items = JSON.parse(inv.ItemsData || '[]'); } catch(e) {}
      
      items.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId)).forEach((itemTxn: any) => {
        const loc = locations.find(l => String(l.Id || l.id) === String(itemTxn.locationId || itemTxn.LocationId));
        const cust = customers.find(c => String(c.Id || c.id) === String(inv.CustomerId));
        const pName = cust ? (cust.CustomerName || cust.Name) : 'Unknown';
        const pPlace = cust ? (cust.Place || cust.Address || '') : '';
        txns.push({
          date: sDate,
          voucherType: 'Sales',
          voucherNo: inv.InvoiceNumber,
          partyName: pName,
          partyPlace: pPlace,
          location: loc ? loc.Name : '-',
          locationId: itemTxn.locationId || itemTxn.LocationId,
          supplierName: itemTxn.supplierName || '-',
          purchaseInvoiceNo: itemTxn.purchaseInvoiceNo || '-',
          inward: 0,
          outward: parseFloat(itemTxn.qty || itemTxn.Quantity) || 0,
          rate: parseFloat(itemTxn.rate || itemTxn.Rate || itemTxn.Price) || 0
        });
      });
    });

    salesReturns.forEach(ret => {
      if (ret.Status === 'Draft' || ret.Status === 'Cancelled') return;
      const rDate = ret.ReturnDate || ret.returndate || '';
      if (!rDate) return;
      let items: any[] = [];
      try { items = JSON.parse(ret.ItemsData || '[]'); } catch(e) {}
      
      items.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId)).forEach((itemTxn: any) => {
        const loc = locations.find(l => String(l.Id || l.id) === String(itemTxn.locationId || itemTxn.LocationId));
        const cust = customers.find(c => String(c.Id || c.id) === String(ret.CustomerId));
        const pName = cust ? (cust.CustomerName || cust.Name) : 'Unknown';
        const pPlace = cust ? (cust.Place || cust.Address || '') : '';
        txns.push({
          date: rDate,
          voucherType: 'Sales Return',
          voucherNo: ret.ReturnNumber || `SR-${ret.Id || ret.id}`,
          partyName: pName,
          partyPlace: pPlace,
          location: loc ? loc.Name : '-',
          locationId: itemTxn.locationId || itemTxn.LocationId,
          inward: parseFloat(itemTxn.qty || itemTxn.Quantity) || 0,
          outward: 0,
          rate: parseFloat(itemTxn.rate || itemTxn.Rate || itemTxn.Price) || 0
        });
      });
    });

    purchaseReturns.forEach(ret => {
      if (ret.Status === 'Draft' || ret.Status === 'Cancelled') return;
      const rDate = ret.ReturnDate || ret.returndate || '';
      if (!rDate) return;
      let items: any[] = [];
      try { items = JSON.parse(ret.ItemsData || '[]'); } catch(e) {}
      
      items.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId)).forEach((itemTxn: any) => {
        const loc = locations.find(l => String(l.Id || l.id) === String(itemTxn.locationId || itemTxn.LocationId));
        const vend = vendors.find(v => String(v.Vendor_ID || v.Id || v.id) === String(ret.VendorId));
        const pName = vend ? (vend.Vendor_NAME || vend.VendorName || vend.Name) : 'Unknown';
        const pPlace = vend ? (vend.Place || vend.Vendor_address || '') : '';
        txns.push({
          date: rDate,
          voucherType: 'Purchase Return',
          voucherNo: ret.ReturnNumber || `PR-${ret.Id || ret.id}`,
          partyName: pName,
          partyPlace: pPlace,
          location: loc ? loc.Name : '-',
          locationId: itemTxn.locationId || itemTxn.LocationId,
          inward: 0,
          outward: parseFloat(itemTxn.qty || itemTxn.Quantity) || 0,
          rate: parseFloat(itemTxn.rate || itemTxn.Rate || itemTxn.Price) || 0
        });
      });
    });

    adjustments.forEach(adj => {
      if (adj.Status === 'Draft' || adj.Status === 'Cancelled') return;
      const aDate = adj.AdjustmentDate || '';
      if (!aDate) return;
      let items: any[] = [];
      try { items = JSON.parse(adj.ItemsData || '[]'); } catch(e) {}
      
      items.filter((itm: any) => String(itm.ItemId || itm.itemId) === String(stockItemId)).forEach((itemTxn: any) => {
        const loc = locations.find(l => String(l.Id || l.id) === String(itemTxn.locationId || itemTxn.LocationId));
        let diff = 0;
        if (itemTxn.newQty !== undefined && itemTxn.currentStr !== undefined) {
           diff = parseFloat(itemTxn.newQty) - parseFloat(itemTxn.currentStr);
        } else {
           diff = parseFloat(itemTxn.qty || itemTxn.Quantity) || 0;
           if (adj.AdjustmentType === 'Quantity Reduction') {
             diff = -diff;
           }
        }
        
        txns.push({
          date: aDate,
          voucherType: 'Adjustment',
          voucherNo: adj.AdjustmentNo,
          partyName: 'N/A',
          location: loc ? loc.Name : '-',
          locationId: itemTxn.locationId || itemTxn.LocationId,
          inward: diff > 0 ? diff : 0,
          outward: diff < 0 ? Math.abs(diff) : 0,
          rate: 0
        });
      });
    });

    // Filter by location if selected
    const filteredTxns = stockLocationId ? txns.filter(t => String(t.locationId) === String(stockLocationId)) : txns;

    // Filter, sort by date
    // Compute before opening, inside period
    let adjustedOpeningQty = runningQty;
    
    // Calculate opening
    filteredTxns.filter(t => t.date < fromDate).forEach(t => {
      adjustedOpeningQty += t.inward;
      adjustedOpeningQty -= t.outward;
    });

    runningQty = adjustedOpeningQty;

    const periodTxns = filteredTxns.filter(t => t.date >= fromDate && t.date <= toDate).sort((a, b) => a.date.localeCompare(b.date));
    
    const ledgerRows = periodTxns.map(t => {
      runningQty += t.inward;
      runningQty -= t.outward;
      return {
        Date: t.date,
        VoucherType: t.voucherType,
        VoucherNo: t.voucherNo,
        PartyName: t.partyName,
        PartyPlace: t.partyPlace || '',
        Location: t.location,
        supplierName: t.supplierName || '—',
        purchaseInvoiceNo: t.purchaseInvoiceNo || '—',
        rate: t.rate,
        Inward: t.inward,
        Outward: t.outward,
        BalanceQty: runningQty
      };
    });

    return {
      openingQty: adjustedOpeningQty,
      openingLocation,
      closingQty: runningQty,
      ledgerRows
    };
  }, [stockItemId, stockLocationId, fromDate, toDate, purchases, sales, adjustments, salesReturns, purchaseReturns, customers, vendors, inventory, locations]);

  // Compute ledger entries
  const computedLedger = useMemo(() => {
    if (!ledgerAccId) {
      return { ledgerRows: [], openingBalance: 0, openingBalanceType: 'Dr', closingBalance: 0, closingBalanceType: 'Dr' };
    }
    
    const account = accounts.find(a => String(a.Id || a.id) === String(ledgerAccId));
    if (!account) {
      return { ledgerRows: [], openingBalance: 0, openingBalanceType: 'Dr', closingBalance: 0, closingBalanceType: 'Dr' };
    }
    
    const initialOpeningBalance = parseFloat(account.OpeningBalance) || 0;
    const initialBalanceType = account.BalanceType || 'Dr';

    // 1. Calculate opening balance as of FromDate
    const linesBefore = journalLines.filter(line => {
      if (String(line.AccountId || line.accountid) !== String(ledgerAccId)) return false;
      const entry = journalEntries.find(e => String(e.Id || e.id) === String(line.JournalEntryId || line.journalentryid));
      if (!entry) return false;
      const entryDate = (entry.EntryDate || '').substring(0, 10);
      return entryDate < fromDate.substring(0, 10);
    });

    let accumDebitBefore = 0;
    let accumCreditBefore = 0;
    linesBefore.forEach(line => {
      accumDebitBefore += parseFloat(line.Debit || line.debit) || 0;
      accumCreditBefore += parseFloat(line.Credit || line.credit) || 0;
    });

    let adjustedOpeningBalance = initialOpeningBalance;
    let adjustedBalanceType = initialBalanceType;

    if (initialBalanceType === 'Dr') {
      const netDr = initialOpeningBalance + accumDebitBefore - accumCreditBefore;
      adjustedOpeningBalance = Math.abs(netDr);
      adjustedBalanceType = netDr >= 0 ? 'Dr' : 'Cr';
    } else {
      const netCr = initialOpeningBalance + accumCreditBefore - accumDebitBefore;
      adjustedOpeningBalance = Math.abs(netCr);
      adjustedBalanceType = netCr >= 0 ? 'Cr' : 'Dr';
    }

    // 2. Filter period lines
    const periodEntries = journalEntries.filter(entry => {
      const entryDate = (entry.EntryDate || '').substring(0, 10);
      return entryDate >= fromDate.substring(0, 10) && entryDate <= toDate.substring(0, 10);
    });

    const periodLines = journalLines.filter(line => {
      if (String(line.AccountId || line.accountid) !== String(ledgerAccId)) return false;
      return periodEntries.some(e => String(e.Id || e.id) === String(line.JournalEntryId || line.journalentryid));
    });

    const sortedLines = periodLines.map(line => {
      const entry = periodEntries.find(e => String(e.Id || e.id) === String(line.JournalEntryId || line.journalentryid))!;
      return { line, entry };
    }).sort((a, b) => {
      if (a.entry.EntryDate !== b.entry.EntryDate) {
        return a.entry.EntryDate.localeCompare(b.entry.EntryDate);
      }
      return String(a.entry.EntryNumber || '').localeCompare(String(b.entry.EntryNumber || ''));
    });

    let runningBalance = adjustedOpeningBalance;
    let runningType = adjustedBalanceType;

    const ledgerRows = sortedLines.map(({ line, entry }) => {
      const isDrLine = (parseFloat(line.Debit || line.debit) || 0) > 0;
      const amount = isDrLine ? (parseFloat(line.Debit || line.debit) || 0) : (parseFloat(line.Credit || line.credit) || 0);

      // Find opposite accounts in this entry
      const siblingLines = journalLines.filter(l => 
        String(l.JournalEntryId || l.journalentryid) === String(entry.Id || entry.id) && 
        String(l.AccountId || l.accountid) !== String(ledgerAccId)
      );
      
      let oppositeAccountLabel = '';
      if (siblingLines.length > 0) {
        const names = siblingLines.map(sl => {
          const acc = accounts.find(a => String(a.Id || a.id) === String(sl.AccountId || sl.accountid));
          return acc ? acc.Name : 'Sundry Account';
        });
        const uniqueNames = Array.from(new Set(names));
        if (isDrLine) {
          oppositeAccountLabel = `To ${uniqueNames.join(' / ')}`;
        } else {
          oppositeAccountLabel = `By ${uniqueNames.join(' / ')}`;
        }
      } else {
        oppositeAccountLabel = isDrLine ? 'To Balance' : 'By Balance';
      }

      // Update running balance
      if (runningType === 'Dr') {
        if (isDrLine) {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
      } else {
        if (isDrLine) {
          runningBalance -= amount;
        } else {
          runningBalance += amount;
        }
      }

      if (runningBalance < 0) {
        runningBalance = Math.abs(runningBalance);
        runningType = runningType === 'Dr' ? 'Cr' : 'Dr';
      }

      return {
        Date: entry.EntryDate,
        VoucherNo: entry.EntryNumber || `JV-${entry.Id}`,
        Reference: entry.Reference || '',
        Particulars: oppositeAccountLabel,
        Narration: line.Description || entry.Narration || '',
        Debit: isDrLine ? amount : 0,
        Credit: !isDrLine ? amount : 0,
        Balance: runningBalance,
        BalanceType: runningType
      };
    });

    return {
      ledgerRows,
      openingBalance: adjustedOpeningBalance,
      openingBalanceType: adjustedBalanceType,
      closingBalance: runningBalance,
      closingBalanceType: runningType
    };
  }, [ledgerAccId, fromDate, toDate, accounts, journalEntries, journalLines]);

  const getAccountBalance = (account: any, dateLimit?: string) => {
    let openingBal = parseFloat(account.OpeningBalance) || 0;
    let balType = account.BalanceType || 'Dr';

    let totalDebit = 0;
    let totalCredit = 0;

    const accountId = String(account.Id || account.id);
    journalLines.forEach(line => {
      const entry = journalEntries.find(e => String(e.Id || e.id) === String(line.JournalEntryId || line.journalentryid));
      if (!entry) return;
      const entryDate = (entry.EntryDate || '').substring(0, 10);
      const limitDate = dateLimit ? dateLimit.substring(0, 10) : '';
      if (limitDate && entryDate > limitDate) return;
      
      if (String(line.AccountId || line.accountid) === accountId) {
        totalDebit += parseFloat(line.Debit || line.debit) || 0;
        totalCredit += parseFloat(line.Credit || line.credit) || 0;
      }
    });

    let netBalance = 0;
    if (balType === 'Dr') {
      netBalance = openingBal + totalDebit - totalCredit;
    } else {
      netBalance = openingBal + totalCredit - totalDebit;
    }

    let finalType = balType;
    if (netBalance < 0) {
      netBalance = Math.abs(netBalance);
      finalType = balType === 'Dr' ? 'Cr' : 'Dr';
    }

    return { balance: netBalance, type: finalType };
  };

  const generateData = (reportName: string) => {
    switch (reportName) {
      case 'Balance Sheet': {
        const assets: any[] = [];
        const liab: any[] = [];
        const equity: any[] = [];
        let revSum = 0;
        let expSum = 0;

        accounts.forEach(a => {
          const { balance, type } = getAccountBalance(a, asOnDate);
          if (balance === 0) return;
          
          if (a.AccountType === 'Asset') {
            // Technically Assets have Dr nature, if they have Cr nature it's negative asset.
            assets.push({ account: a.Name, amount: type === 'Dr' ? balance : -balance });
          } else if (a.AccountType === 'Liability') {
            // Liability has Cr nature
            liab.push({ account: a.Name, amount: type === 'Cr' ? balance : -balance });
          } else if (a.AccountType === 'Equity') {
            equity.push({ account: a.Name, amount: type === 'Cr' ? balance : -balance });
          } else if (a.AccountType === 'Revenue') {
            revSum += (type === 'Cr' ? balance : -balance);
          } else if (a.AccountType === 'Expense') {
            expSum += (type === 'Dr' ? balance : -balance);
          }
        });
        
        const netProfit = revSum - expSum;

        if (netProfit > 0) {
           equity.push({ account: 'Retained Earnings (Net Profit)', amount: netProfit });
        } else if (netProfit < 0) {
           equity.push({ account: 'Retained Earnings (Net Loss)', amount: netProfit });
        }

        return { assets, liabilitiesAndEquity: [...liab, ...equity], asOnDate };
      }
      case 'Profit & Loss Statement': {
        const revenues: any[] = [];
        const expenses: any[] = [];
        let revSum = 0;
        let expSum = 0;

        accounts.forEach(a => {
          const { balance, type } = getAccountBalance(a, asOnDate);
          if (balance === 0) return;

          if (a.AccountType === 'Revenue') {
             const amt = type === 'Cr' ? balance : -balance;
             revenues.push({ account: a.Name, amount: amt });
             revSum += amt;
          } else if (a.AccountType === 'Expense') {
             const amt = type === 'Dr' ? balance : -balance;
             expenses.push({ account: a.Name, amount: amt });
             expSum += amt;
          }
        });
        
        const netProfit = revSum - expSum;

        return { revenues, expenses, netProfit, total: Math.max(revSum, expSum + Math.max(0, netProfit), revSum + Math.max(0, -netProfit)), asOnDate };
      }
      case 'Trial Balance': {
        const groups: Record<string, { accounts: any[], totalDebit: number, totalCredit: number }> = {};
        accounts.forEach(a => {
          const { balance, type } = getAccountBalance(a, asOnDate);
          if (balance === 0) return;
          const groupName = a.AccountGroup || 'Uncategorized';
          if (!groups[groupName]) {
            groups[groupName] = { accounts: [], totalDebit: 0, totalCredit: 0 };
          }
          groups[groupName].accounts.push({
            Account: a.Name,
            Debit: type === 'Dr' ? balance : 0,
            Credit: type === 'Cr' ? balance : 0
          });
          groups[groupName].totalDebit += (type === 'Dr' ? balance : 0);
          groups[groupName].totalCredit += (type === 'Cr' ? balance : 0);
        });
        const grandTotalDebit = Object.values(groups).reduce((a, b) => a + b.totalDebit, 0);
        const grandTotalCredit = Object.values(groups).reduce((a, b) => a + b.totalCredit, 0);
        return { groups, grandTotalDebit, grandTotalCredit, asOnDate };
      }
      case 'Sales Register':
        return [...sales]
          .sort((a, b) => parseInt(a.Id || a.id || 0) - parseInt(b.Id || b.id || 0))
          .filter(s => {
            const datePart = (s.InvoiceDate || s.Invoicedate || '').substring(0, 10);
            return datePart >= fromDate && datePart <= toDate;
          })
          .map(s => {
            const cust = customers.find(c => String(c.Id || c.id) === String(s.CustomerId));
            return {
              Date: formatDate(s.InvoiceDate || s.Invoicedate),
              InvoiceNo: s.InvoiceNumber,
              Customer: cust ? cust.CustomerName : 'Unknown',
              Place: cust ? cust.Place : '-',
              Amount: parseFloat(s.TotalAmount) || 0
            };
          });
      case 'Sales Returns Register':
        return [...salesReturns]
          .sort((a, b) => parseInt(a.Id || a.id || 0) - parseInt(b.Id || b.id || 0))
          .filter(sr => {
            const returnDateStr = sr.ReturnDate || sr.returndate || '';
            const datePart = returnDateStr.substring(0, 10);
            return datePart >= fromDate && datePart <= toDate;
          })
          .map(sr => {
            const cust = customers.find(c => String(c.Id || c.id) === String(sr.CustomerId));
            return {
              Date: formatDate(sr.ReturnDate || sr.returndate),
              ReturnNo: sr.ReturnNumber || `SR-${sr.Id}`,
              Customer: cust ? (cust.CustomerName || cust.Customer_NAME || cust.Name) : 'Unknown',
              Place: cust ? (cust.Place || '-') : '-',
              InvoiceNo: sr.OriginalInvoiceNumber || '-',
              Amount: parseFloat(sr.TotalAmount) || 0
            };
          });
      case 'Purchase Register':
        return [...purchases]
          .sort((a, b) => parseInt(a.Id || a.id || 0) - parseInt(b.Id || b.id || 0))
          .filter(p => {
            const invoiceDateStr = p.InvoiceDate || p.Invoicedate || '';
            const datePart = invoiceDateStr.substring(0, 10);
            return datePart >= fromDate && datePart <= toDate;
          })
          .map(p => {
            const vend = vendors.find(v => String(v.Vendor_ID || v.Id || v.id) === String(p.VendorId));
            return {
              Date: formatDate(p.InvoiceDate || p.Invoicedate),
              InvoiceNo: p.InvoiceNumber || `PI-${p.Id}`,
              Vendor: vend ? (vend.Vendor_NAME || vend.VendorName || vend.Name) : (p.VendorName || 'Unknown'),
              Place: vend ? (vend.Place || vend.Vendor_address || '-') : '-',
              Amount: parseFloat(p.TotalAmount) || 0
            };
          });
      case 'Purchase Returns Register':
        return [...purchaseReturns]
          .sort((a, b) => parseInt(a.Id || a.id || 0) - parseInt(b.Id || b.id || 0))
          .filter(pr => {
            const returnDateStr = pr.ReturnDate || pr.returndate || '';
            const datePart = returnDateStr.substring(0, 10);
            return datePart >= fromDate && datePart <= toDate;
          })
          .map(pr => {
            const vend = vendors.find(v => String(v.Vendor_ID || v.Id || v.id) === String(pr.VendorId));
            return {
              Date: formatDate(pr.ReturnDate || pr.returndate),
              ReturnNo: pr.ReturnNumber || `PR-${pr.Id}`,
              Vendor: vend ? (vend.Vendor_NAME || vend.VendorName || vend.Name) : 'Unknown',
              Place: vend ? (vend.Place || vend.Vendor_address || '-') : '-',
              InvoiceNo: pr.OriginalInvoiceNumber || '-',
              Amount: parseFloat(pr.TotalAmount) || 0
            };
          });
      case 'Location wise Stock Summary': {
        const itemLocationsMap: Record<string, any> = {};

        const processTransactions = (arr: any[], isOutward: boolean, isReturn: boolean) => {
          arr.forEach(txn => {
            if (txn.Status === 'Draft' || txn.Status === 'Cancelled') return;
            let items: any[] = [];
            try { items = JSON.parse(txn.ItemsData || '[]'); } catch(e) {}
            items.forEach(line => {
              const itemId = String(line.itemId || line.ItemId || '');
              const locId = String(line.locationId || line.LocationId || 'Unknown');
              if (!itemId) return;

              const mapKey = `${itemId}_${locId}`;
              if (!itemLocationsMap[mapKey]) {
                const itemDef = inventory.find(i => String(i.Id || i.id) === itemId);
                const locDef = locations.find(l => String(l.Id || l.id) === locId);
                itemLocationsMap[mapKey] = {
                  ItemCode: itemDef?.ItemCode || '-',
                  Name: itemDef?.Name || 'Unknown Item',
                  Category: itemDef?.Category || '-',
                  Location: locDef?.Name || (locations.length > 0 ? locations[0].Name : 'Main / Unassigned'),
                  Unit: itemDef?.Unit || '-',
                  UnitPrice: itemDef?.UnitPrice || 0,
                  inward: locId === String(itemDef?.LocationId || itemDef?.locationId || itemDef?.Location || itemDef?.location || 'Unknown') ? parseFloat(itemDef?.Quantity || 0) : 0,
                  outward: 0,
                };
              }

              const qty = parseFloat(line.qty || line.Quantity) || 0;
              
              if (!isReturn) {
                if (isOutward) itemLocationsMap[mapKey].outward += qty;
                else itemLocationsMap[mapKey].inward += qty;
              } else {
                 if (isOutward) itemLocationsMap[mapKey].outward += qty; 
                 else itemLocationsMap[mapKey].inward += qty;
              }
            });
          });
        };

        processTransactions(purchases, false, false);
        processTransactions(sales, true, false);
        processTransactions(salesReturns, false, true); 
        processTransactions(purchaseReturns, true, true); 
        
        adjustments.forEach(a => {
           if (a.Status === 'Draft' || a.Status === 'Cancelled') return;
           let items: any[] = [];
           try { items = JSON.parse(a.ItemsData || '[]'); } catch(e) {}
           items.forEach(line => {
             const itemId = String(line.itemId || line.ItemId || '');
             const locId = String(line.locationId || line.LocationId || 'Unknown');
             if (!itemId) return;
             const mapKey = `${itemId}_${locId}`;
             if (!itemLocationsMap[mapKey]) {
                const itemDef = inventory.find(i => String(i.Id || i.id) === itemId);
                const locDef = locations.find(l => String(l.Id || l.id) === locId);
                itemLocationsMap[mapKey] = {
                  ItemCode: itemDef?.ItemCode || '-',
                  Name: itemDef?.Name || 'Unknown Item',
                  Category: itemDef?.Category || '-',
                  Location: locDef?.Name || (locations.length > 0 ? locations[0].Name : 'Main / Unassigned'),
                  Unit: itemDef?.Unit || '-',
                  UnitPrice: itemDef?.UnitPrice || 0,
                  inward: locId === String(itemDef?.LocationId || itemDef?.locationId || itemDef?.Location || itemDef?.location || 'Unknown') ? parseFloat(itemDef?.Quantity || 0) : 0,
                  outward: 0,
                };
             }
             
             let diff = 0;
             if (line.newQty !== undefined && line.currentStr !== undefined) {
                diff = parseFloat(line.newQty) - parseFloat(line.currentStr);
             } else {
                diff = parseFloat(line.qty || line.Quantity) || 0;
             }
             
             if (a.AdjustmentType === 'Quantity Addition') itemLocationsMap[mapKey].inward += Math.abs(diff);
             else if (a.AdjustmentType === 'Quantity Reduction') itemLocationsMap[mapKey].outward += Math.abs(diff);
           });
        });

        inventory.forEach(i => {
           const itemId = String(i.Id || i.id);
           const locId = String(i.LocationId || i.locationId || i.Location || i.location || 'Unknown');
           const mapKey = `${itemId}_${locId}`;
           if (!itemLocationsMap[mapKey] && parseFloat(i.Quantity || 0) > 0) {
              const locDef = locations.find(l => String(l.Id || l.id) === locId);
              itemLocationsMap[mapKey] = {
                  ItemCode: i.ItemCode || '-',
                  Name: i.Name || 'Unknown Item',
                  Category: i.Category || '-',
                  Location: locDef?.Name || (locations.length > 0 ? locations[0].Name : 'Main / Unassigned'),
                  Unit: i.Unit || '-',
                  UnitPrice: i.UnitPrice || 0,
                  inward: parseFloat(i.Quantity || 0),
                  outward: 0,
              };
           }
        });

        return Object.values(itemLocationsMap).map((d: any) => {
           const finalQty = d.inward - d.outward;
           return {
              ItemCode: d.ItemCode,
              Name: d.Name,
              Category: d.Category,
              Location: d.Location,
              Rate: d.UnitPrice,
              'Inward Qty': d.inward,
              'Outward Qty': d.outward,
              'Balance Qty': finalQty,
              Unit: d.Unit,
              Value: finalQty * d.UnitPrice
           };
        });
      }
      case 'Location wise Stock Ledger':
        return computedStockLedger.ledgerRows;
      case 'Member Register':
        return members.map(m => {
          const shares = m.SharesAllocated || m.sharesallocated || 0;
          const fValue = m.FaceValue || m.facevalue || 10;
          const totalAmt = shares * fValue;
          const name = m.FarmerName || m.farmername || m.Name || m.name || '';
          const gender = m.Gender || m.gender || '';
          const dob = m.DOB || m.dob || '';
          const father = m.FatherSpouse || m.fatherspouse || '';
          const phone = m.Phone || m.phone || '';
          const aadhar = m.AadharNo || m.aadharno || '';
          const address = m.Address || m.address || '';
          const tehsil = m.Tehsil || m.tehsil || '';
          const district = m.District || m.district || '';
          const village = m.Village || m.village || '';
          const panchayat = m.Panchayat || m.panchayat || '';
          const state = m.State || m.state || '';
          const pincode = m.PINCode || m.pincode || '';
          const land = m.LandHolding || m.landholding || 0;
          const irrigation = m.IrrigationType || m.irrigationtype || '';
          const crops = m.MajorCrops || m.majorcrops || '';

          return {
            'Full Name': name,
            'Gender / DOB': `${gender} / ${dob}`.replace(/ \/ $|^ \/ /g, '') || '',
            'Father/Husband': father,
            'Mobile No. / Aadhar No.': `${phone} / ${aadhar}`.replace(/ \/ $|^ \/ /g, '') || '',
            'Address Line': address,
            'Tehsil / District': `${tehsil} / ${district}`.replace(/ \/ $|^ \/ /g, '') || '',
            'Village / Panchayat': `${village} / ${panchayat}`.replace(/ \/ $|^ \/ /g, '') || '',
            'State & PIN Code': `${state} / ${pincode}`.replace(/ \/ $|^ \/ /g, '') || '',
            'Land holding (Acres)': land,
            'Allocated Shares': shares,
            'Irrigation Type': irrigation,
            'Face Value per Share (₹)': fValue,
            'Major Crops': crops,
            'Total Share Amt (₹)': totalAmt
          };
        });
      case 'Ledger Account Statement':
        return computedLedger.ledgerRows;
      default:
        return [];
    }
  };

  const currentData = selectedReport ? generateData(selectedReport.name) : null;

  const handleExport = () => {
    if (!selectedReport || !currentData) return;
    if (selectedReport.name === 'Ledger Account Statement') {
      const act = accounts.find(a => String(a.Id || a.id) === String(ledgerAccId));
      const expRows = [
        { Date: '', VoucherNo: '', Particulars: 'Opening Balance', Narration: '', Debit: '', Credit: '', Balance: computedLedger.openingBalance, Type: computedLedger.openingBalanceType },
        ...computedLedger.ledgerRows.map(r => ({
          Date: formatDate(r.Date),
          VoucherNo: r.VoucherNo,
          Particulars: r.Particulars,
          Narration: r.Narration,
          Debit: r.Debit || '',
          Credit: r.Credit || '',
          Balance: r.Balance,
          Type: r.BalanceType
        })),
        { Date: '', VoucherNo: '', Particulars: 'Closing Balance', Narration: '', Debit: '', Credit: '', Balance: computedLedger.closingBalance, Type: computedLedger.closingBalanceType }
      ];
      exportToCSV(expRows, `Ledger_${act?.Name || 'Statement'}`);
    } else if (selectedReport.name === 'Location wise Stock Ledger') {
      const itm = inventory.find(i => String(i.Id || i.id || i.ItemId || i.ItemCode) === String(stockItemId));
      const expRows = [
        { Date: '', VoucherType: '', VoucherNo: '', PartyName: 'Opening Balance', Location: computedStockLedger.openingLocation || '', Supplier: '', PurInvNo: '', Rate: '', Inward: '', Outward: '', BalanceQty: computedStockLedger.openingQty },
        ...computedStockLedger.ledgerRows.map(r => ({
          Date: formatDate(r.Date),
          VoucherType: r.VoucherType,
          VoucherNo: r.VoucherNo,
          PartyName: r.PartyPlace ? `${r.PartyName} (${r.PartyPlace})` : r.PartyName,
          Location: r.Location,
          Supplier: r.supplierName || '—',
          PurInvNo: r.purchaseInvoiceNo || '—',
          Rate: r.rate > 0 ? r.rate : '',
          Inward: r.Inward || '',
          Outward: r.Outward || '',
          BalanceQty: r.BalanceQty
        })),
        { Date: '', VoucherType: '', VoucherNo: '', PartyName: 'Closing Balance', Location: '', Supplier: '', PurInvNo: '', Rate: '', Inward: '', Outward: '', BalanceQty: computedStockLedger.closingQty }
      ];
      exportToCSV(expRows, `Stock_Ledger_${itm?.Name || 'Item'}_${fromDate}_to_${toDate}`);
    } else if (Array.isArray(currentData)) {
      exportToCSV(currentData, selectedReport.name);
    } else {
      alert("Please export simple table reports currently. Balance Sheet export is coming soon.");
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 lg:px-8 w-full flex flex-col h-full pb-12 relative font-sans">
      <div className="print:hidden space-y-6">
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
                          onClick={() => {
                            setSelectedReport(report);
                            // Select default account if ledger
                            if (report.name === 'Ledger Account Statement' && accounts.length > 0 && !ledgerAccId) {
                              setLedgerAccId(String(accounts[0].Id || accounts[0].id));
                            }
                          }}
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
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:static print:inset-auto print:bg-white print:p-0 print:block">
          <style>
              {`
                  @media print {
                      @page { margin: 0; }
                  }
              `}
          </style>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:border-none print:w-full print:max-w-none print:overflow-visible">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white print:px-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedReport.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedReport.description}</p>
              </div>
            </div>
            
            {/* Custom parameters bar */}
            {(selectedReport.name === 'Ledger Account Statement' || selectedReport.name === 'Location wise Stock Ledger' || selectedReport.name === 'Sales Register' || selectedReport.name === 'Sales Returns Register' || selectedReport.name === 'Purchase Register' || selectedReport.name === 'Purchase Returns Register' || selectedReport.name === 'Trial Balance' || selectedReport.name === 'Balance Sheet' || selectedReport.name === 'Profit & Loss Statement') && (
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center print:hidden relative z-40">
                {selectedReport.name === 'Ledger Account Statement' && (
                  <div className="flex flex-col relative w-72 z-30">
                    <label className="text-xs font-semibold text-gray-600 mb-1">General Ledger Account</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search account by name or code..."
                        value={ledgerSearch} 
                        onChange={e => {
                          setLedgerSearch(e.target.value);
                          setIsLedgerDropdownOpen(true);
                        }} 
                        onClick={() => setIsLedgerDropdownOpen(true)}
                        onFocus={(e) => {
                          e.target.select();
                          setIsLedgerDropdownOpen(true);
                        }}
                        className="w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {ledgerSearch && (
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLedgerSearch('');
                              setLedgerAccId('');
                              setIsLedgerDropdownOpen(true);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsLedgerDropdownOpen(!isLedgerDropdownOpen);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isLedgerDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => {
                            setIsLedgerDropdownOpen(false);
                            const activeAcc = accounts.find(a => String(a.Id || a.id) === String(ledgerAccId));
                            if (activeAcc) {
                              setLedgerSearch(`${activeAcc.Name} (${activeAcc.AccountCode || 'No Code'})`);
                            } else {
                              setLedgerSearch('');
                            }
                          }} 
                        />
                        
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 py-1">
                          {filteredAccounts.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500 italic">No accounts found</div>
                          ) : (
                            filteredAccounts.map(acc => {
                              const isSelected = String(acc.Id || acc.id) === String(ledgerAccId);
                              return (
                                <button
                                  key={acc.Id || acc.id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setLedgerAccId(String(acc.Id || acc.id));
                                    setIsLedgerDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col ${
                                    isSelected 
                                      ? 'bg-blue-50 text-blue-700 font-medium' 
                                      : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <span className="font-semibold">{acc.Name}</span>
                                  <span className="text-[10px] text-gray-400 mt-0.5">Code: {acc.AccountCode || 'No Code'} | Group: {acc.AccountGroupName || 'General'}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {selectedReport.name === 'Location wise Stock Ledger' && (
                  <>
                  <div className="flex flex-col min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-600 mb-1">Inventory Item</label>
                    <select 
                      value={stockItemId} 
                      onChange={e => setStockItemId(e.target.value)} 
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                    >
                      <option value="">Select Item...</option>
                      {inventory.map(item => (
                        <option key={item.Id || item.id || item.ItemId || item.ItemCode} value={item.Id || item.id || item.ItemId || item.ItemCode}>
                          {item.Name || item.ItemName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-600 mb-1">Location</label>
                    <select 
                      value={stockLocationId} 
                      onChange={e => setStockLocationId(e.target.value)} 
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                    >
                      <option value="">All Locations</option>
                      {locations.map(loc => (
                        <option key={loc.Id || loc.id} value={loc.Id || loc.id}>
                          {loc.Name}
                        </option>
                      ))}
                    </select>
                  </div>
                  </>
                )}
                {(selectedReport.name === 'Ledger Account Statement' || selectedReport.name === 'Location wise Stock Ledger' || selectedReport.name === 'Sales Register' || selectedReport.name === 'Sales Returns Register' || selectedReport.name === 'Purchase Register' || selectedReport.name === 'Purchase Returns Register') && (
                  <>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-gray-600 mb-1">From Date</label>
                      <CustomDatePicker 
                        value={fromDate} 
                        onChange={setFromDate} 
                        className="w-full" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-gray-600 mb-1">To Date</label>
                      <CustomDatePicker 
                        value={toDate} 
                        onChange={setToDate} 
                        className="w-full" 
                      />
                    </div>
                  </>
                )}
                {(selectedReport.name === 'Trial Balance' || selectedReport.name === 'Balance Sheet' || selectedReport.name === 'Profit & Loss Statement') && (
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-600 mb-1">{selectedReport.name} as on Date</label>
                    <CustomDatePicker 
                      value={asOnDate} 
                      onChange={setAsOnDate} 
                      className="w-full" 
                    />
                  </div>
                )}
              </div>
            )}

            <div className="p-0 flex-1 overflow-auto bg-gray-50 flex flex-col print:overflow-visible">
              {selectedReport.name === 'Audit Log' ? (
                <div className="flex-1 overflow-y-auto">
                  <AuditLogs companyId={activeCompany?.id ? parseInt(activeCompany.id, 10) : 0} hideHeader={true} />
                </div>
              ) : selectedReport.name === 'Balance Sheet' ? (
                <div className="p-6">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                    Balance Sheet as on {formatDate((currentData as any).asOnDate)}
                  </div>
                  <div className="border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th colSpan={2} className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider text-center border-r border-gray-200 w-1/2">
                            Capital & Liabilities
                          </th>
                          <th colSpan={2} className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider text-center w-1/2">
                            Assets
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: Math.max((currentData as any).liabilitiesAndEquity.length, (currentData as any).assets.length) }).map((_, i) => {
                          const liab = (currentData as any).liabilitiesAndEquity[i];
                          const asset = (currentData as any).assets[i];
                          return (
                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className="p-3 border-r-0">{liab?.account || ''}</td>
                              <td className="p-3 text-right font-medium border-r border-gray-200">
                                {liab?.amount ? (liab.amount as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ''}
                              </td>
                              <td className="p-3 border-l-0">{asset?.account || ''}</td>
                              <td className="p-3 text-right font-medium">
                                {asset?.amount ? (asset.amount as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
                          <td className="p-3">Total</td>
                          <td className="p-3 text-right text-blue-700 border-r border-gray-200">
                            {((currentData as any).liabilitiesAndEquity.reduce((acc: number, val: any) => acc + val.amount, 0) as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                          <td className="p-3 pl-3">Total</td>
                          <td className="p-3 text-right text-blue-700">
                            {((currentData as any).assets.reduce((acc: number, val: any) => acc + val.amount, 0) as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : selectedReport.name === 'Profit & Loss Statement' ? (
                <div className="p-6">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                    Profit & Loss Statement as on {formatDate((currentData as any).asOnDate)}
                  </div>
                  <div className="border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th colSpan={2} className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider text-center border-r border-gray-200 w-1/2">
                            Particulars (Expenses)
                          </th>
                          <th colSpan={2} className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider text-center w-1/2">
                            Particulars (Incomes)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: Math.max((currentData as any).expenses.length + ((currentData as any).netProfit > 0 ? 1 : 0), (currentData as any).revenues.length + ((currentData as any).netProfit < 0 ? 1 : 0)) }).map((_, i) => {
                          const expList = [...(currentData as any).expenses];
                          if ((currentData as any).netProfit > 0) {
                            expList.push({ account: 'Net Profit', amount: (currentData as any).netProfit, isProfit: true });
                          }
                          
                          const revList = [...(currentData as any).revenues];
                          if ((currentData as any).netProfit < 0) {
                            revList.push({ account: 'Net Loss', amount: Math.abs((currentData as any).netProfit), isLoss: true });
                          }

                          const exp = expList[i];
                          const rev = revList[i];

                          return (
                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className={`p-3 border-r-0 ${exp?.isProfit ? 'text-green-700 font-semibold' : ''}`}>{exp?.account || ''}</td>
                              <td className={`p-3 text-right font-medium border-r border-gray-200 ${exp?.isProfit ? 'text-green-700 font-semibold' : ''}`}>
                                {exp?.amount ? (exp.amount as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ''}
                              </td>
                              <td className={`p-3 border-l-0 ${rev?.isLoss ? 'text-red-700 font-semibold' : ''}`}>{rev?.account || ''}</td>
                              <td className={`p-3 text-right font-medium ${rev?.isLoss ? 'text-red-700 font-semibold' : ''}`}>
                                {rev?.amount ? (rev.amount as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
                          <td className="p-3">Total</td>
                          <td className="p-3 text-right text-blue-700 border-r border-gray-200">
                            {((currentData as any).total as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                          <td className="p-3">Total</td>
                          <td className="p-3 text-right text-blue-700">
                            {((currentData as any).total as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : selectedReport.name === 'Ledger Account Statement' ? (
                <div className="p-6">
                  {ledgerAccId ? (
                    <div className="border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest font-semibold shrink-0">
                        <span>Account Name : {accounts.find(a => String(a.Id || a.id) === String(ledgerAccId))?.Name || 'Ledger Entry History'}</span>
                        <span>Period: {formatDate(fromDate)} to {formatDate(toDate)}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase border-b border-gray-200 text-left">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Voucher No</th>
                            <th className="px-4 py-3 min-w-[180px]">Particulars</th>
                            <th className="px-4 py-3">Reference/Narration</th>
                            <th className="px-4 py-3 text-right">Debit (Dr)</th>
                            <th className="px-4 py-3 text-right">Credit (Cr)</th>
                            <th className="px-4 py-3 text-right min-w-[120px]">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                          {/* Opening Balance Line */}
                          <tr className="bg-blue-50/50 font-medium text-slate-700">
                            <td className="px-4 py-3 font-mono">{formatDate(fromDate)}</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3 italic whitespace-nowrap">Opening Balance (B/F)</td>
                            <td className="px-4 py-3 text-xs text-slate-400">—</td>
                            <td className="px-4 py-3 text-right">—</td>
                            <td className="px-4 py-3 text-right">—</td>
                            <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                              {computedLedger.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-xs text-gray-500">{computedLedger.openingBalanceType}</span>
                            </td>
                          </tr>
                          
                          {/* Main Entries */}
                          {computedLedger.ledgerRows.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                                No transactions recorded for this account in the specified period.
                              </td>
                            </tr>
                          ) : (
                            computedLedger.ledgerRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs">{formatDate(row.Date)}</td>
                                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{row.VoucherNo}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{row.Particulars}</td>
                                <td className="px-4 py-3 text-xs text-slate-500">{row.Narration}</td>
                                <td className="px-4 py-3 text-right font-mono text-green-700">
                                  {row.Debit > 0 ? row.Debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-red-700">
                                  {row.Credit > 0 ? row.Credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-medium whitespace-nowrap">
                                  {row.Balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">{row.BalanceType}</span>
                                </td>
                              </tr>
                            ))
                          )}

                          {/* Closing Balance Line */}
                          <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                            <td className="px-4 py-3 font-mono">{formatDate(toDate)}</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3 italic whitespace-nowrap">Closing Balance (C/F)</td>
                            <td className="px-4 py-3 text-xs text-slate-400">—</td>
                            <td className="px-4 py-3 text-right font-mono">
                              {computedLedger.ledgerRows.reduce((a, b) => a + b.Debit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {computedLedger.ledgerRows.reduce((a, b) => a + b.Credit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-blue-900 whitespace-nowrap">
                              {computedLedger.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">{computedLedger.closingBalanceType}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-16 text-center text-gray-400">Please select an account.</div>
                  )}
                </div>
              ) : selectedReport.name === 'Location wise Stock Ledger' ? (
                <div className="p-6">
                  {stockItemId ? (
                    <div className="border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest font-semibold shrink-0">
                        <span>Location wise Stock Ledger Details</span>
                        <span>Period: {formatDate(fromDate)} to {formatDate(toDate)}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase border-b border-gray-200 text-left">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Voucher Type</th>
                            <th className="px-4 py-3">Voucher No</th>
                            <th className="px-4 py-3">Party Name</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Supplier</th>
                            <th className="px-4 py-3">Pur. Inv No</th>
                            <th className="px-4 py-3 text-right">Rate</th>
                            <th className="px-4 py-3 text-right">Inward Qty</th>
                            <th className="px-4 py-3 text-right">Outward Qty</th>
                            <th className="px-4 py-3 text-right">Balance Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                          {/* Opening Stock Line */}
                          <tr className="bg-blue-50/50 font-medium text-slate-700">
                            <td className="px-4 py-3 font-mono">{formatDate(fromDate)}</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3 italic">Opening Stock (B/F)</td>
                            <td className="px-4 py-3">{computedStockLedger.openingLocation || '—'}</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3 text-right">—</td>
                            <td className="px-4 py-3 text-right">—</td>
                            <td className="px-4 py-3 text-right">—</td>
                            <td className="px-4 py-3 text-right font-mono">
                              {computedStockLedger.openingQty}
                            </td>
                          </tr>
                          
                          {/* Main Entries */}
                          {computedStockLedger.ledgerRows.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="px-4 py-8 text-center text-gray-400 text-sm">
                                No stock movements recorded for this item in the specified period.
                              </td>
                            </tr>
                          ) : (
                            computedStockLedger.ledgerRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs">{formatDate(row.Date)}</td>
                                <td className="px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600">{row.VoucherType}</td>
                                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{row.VoucherNo}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{row.PartyName || '-'}{row.PartyPlace ? ` (${row.PartyPlace})` : ''}</td>
                                <td className="px-4 py-3 font-medium text-slate-700">{row.Location || '-'}</td>
                                <td className="px-4 py-3 font-medium text-slate-700">{row.supplierName || '—'}</td>
                                <td className="px-4 py-3 font-medium text-slate-700">{row.purchaseInvoiceNo || '—'}</td>
                                <td className="px-4 py-3 text-right">{row.rate > 0 ? row.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}</td>
                                <td className="px-4 py-3 text-right font-mono text-green-700">
                                  {row.Inward > 0 ? row.Inward : '—'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-red-700">
                                  {row.Outward > 0 ? row.Outward : '—'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-medium">
                                  {row.BalanceQty}
                                </td>
                              </tr>
                            ))
                          )}

                          {/* Closing Stock Line */}
                          <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                            <td className="px-4 py-3 font-mono">{formatDate(toDate)}</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3 italic">Closing Stock (C/F)</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3 text-right">—</td>
                            <td className="px-4 py-3 text-right font-mono">
                              {computedStockLedger.ledgerRows.reduce((a, b) => a + b.Inward, 0)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {computedStockLedger.ledgerRows.reduce((a, b) => a + b.Outward, 0)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-blue-900">
                              {computedStockLedger.closingQty}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-16 text-center text-gray-400">Please select an item.</div>
                  )}
                </div>
              ) : selectedReport.name === 'Trial Balance' && (currentData as any).groups ? (
                <div className="flex-1 w-full min-h-0 overflow-auto bg-white print:overflow-visible">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                    Trial Balance as on {formatDate((currentData as any).asOnDate)}
                  </div>
                  <table className="min-w-full divide-y divide-gray-200 border-b border-gray-200 border-x">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Debit</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {Object.keys((currentData as any).groups).sort().map(groupName => (
                        <React.Fragment key={groupName}>
                          <tr className="bg-gray-50/50">
                            <td colSpan={3} className="px-6 py-2 font-bold text-gray-800">{groupName}</td>
                          </tr>
                          {(currentData as any).groups[groupName].accounts.map((acc: any, i:number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-6 py-2 text-sm text-gray-700 pl-10">{acc.Account}</td>
                              <td className="px-6 py-2 text-sm text-right text-gray-700">{acc.Debit !== 0 ? acc.Debit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}</td>
                              <td className="px-6 py-2 text-sm text-right text-gray-700">{acc.Credit !== 0 ? acc.Credit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-medium">
                            <td className="px-6 py-2 text-sm font-bold text-gray-800 pl-10">Total ({groupName})</td>
                            <td className="px-6 py-2 text-sm text-right font-bold text-gray-800 border-t border-gray-200">{(currentData as any).groups[groupName].totalDebit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                            <td className="px-6 py-2 text-sm text-right font-bold text-gray-800 border-t border-gray-200">{(currentData as any).groups[groupName].totalCredit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                      <tr>
                        <td className="px-6 py-4 text-right text-gray-900">Grand Total</td>
                        <td className="px-6 py-4 text-right text-blue-700">{(currentData as any).grandTotalDebit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                        <td className="px-6 py-4 text-right text-blue-700">{(currentData as any).grandTotalCredit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (selectedReport.name === 'Sales Register' || selectedReport.name === 'Sales Returns Register' || selectedReport.name === 'Purchase Register' || selectedReport.name === 'Purchase Returns Register') && Array.isArray(currentData) && currentData.length > 0 ? (
                <div className="flex-1 w-full min-h-0 overflow-auto bg-white print:overflow-visible">
                  <table className="min-w-full divide-y divide-gray-200 border-b border-gray-200 border-x">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-200">
                      <tr>
                        {Object.keys(currentData[0]).map((header, i) => (
                          <th key={i} scope="col" className={`whitespace-nowrap px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${header === 'Amount' ? 'text-right' : 'text-left'}`}>
                            {header.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentData.map((row: any, rowIndex: number) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                          {Object.keys(row).map((header, colIndex) => (
                            <td key={colIndex} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 ${header === 'Amount' ? 'text-right font-medium' : ''}`}>
                              {typeof row[header] === 'number' 
                                ? row[header].toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                                : row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <tr>
                            <td colSpan={Object.keys(currentData[0]).length - 1} className="px-6 py-4 text-right">Total</td>
                            <td className="px-6 py-4 text-right text-blue-700">
                                {currentData.reduce((sum: number, row: any) => sum + row.Amount, 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
              ) : Array.isArray(currentData) && currentData.length > 0 ? (
                <div className="flex-1 w-full min-h-0 overflow-auto bg-white print:overflow-visible">
                  <table className="min-w-full divide-y divide-gray-200 border-b border-gray-200 border-x">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-200">
                      <tr>
                        {Object.keys(currentData[0]).map((header, i) => (
                          <th key={i} scope="col" className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
              ) : (
                <div className="p-16 flex flex-col items-center justify-center text-center bg-white">
                  <BarChart2 className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No data available for this report.</p>
                  <p className="text-gray-400 text-sm mt-2">Check back after adding records to the system.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0 print:hidden">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium text-sm transition-colors shadow-sm"
              >
                Print to PDF
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
