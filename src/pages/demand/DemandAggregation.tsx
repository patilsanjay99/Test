import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { Brain, TrendingUp, TrendingDown, Info, RefreshCcw, MapPin, Search, ChevronDown, X, Check } from 'lucide-react';

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export function DemandAggregation() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const canView = hasPermission('Demand Management: Demand Aggregation', 'view');

  const [itemsData, setItemsData] = useState<any[]>([]);
  const [demandData, setDemandData] = useState<any[]>([]);
  const [enquiriesList, setEnquiriesList] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [inventoryStock, setInventoryStock] = useState<Record<string, number>>({});
  const [suppliedStock, setSuppliedStock] = useState<Record<string, number>>({});
  const [marketIntelligence, setMarketIntelligence] = useState<any[]>([]);
  const [isFetchingIntelligence, setIsFetchingIntelligence] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [selectedItemName, setSelectedItemName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  // Searchable Autocomplete State Selector
  const [selectedState, setSelectedState] = useState<string>("");
  const [stateSearch, setStateSearch] = useState<string>("");
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [procurementToast, setProcurementToast] = useState<string | null>(null);

  const defaultCommodities = [
    { Name: "Maize", ItemCode: "MAIZE" },
    { Name: "Soyabean", ItemCode: "SOYABEAN" },
    { Name: "Cotton", ItemCode: "COTTON" },
    { Name: "Wheat", ItemCode: "WHEAT" },
    { Name: "Onion", ItemCode: "ONION" }
  ];

  const combinedItems = [...masterItems];
  defaultCommodities.forEach(d => {
    const exists = combinedItems.some(i => (i.Name || i.name || '').toLowerCase() === d.Name.toLowerCase());
    if (!exists) {
      combinedItems.push(d);
    }
  });

  // Set default state based on active company
  useEffect(() => {
    if (activeCompany?.StateName || activeCompany?.StateCode) {
      setSelectedState(activeCompany.StateName || activeCompany.StateCode);
    } else {
      setSelectedState("Maharashtra");
    }
  }, [activeCompany]);

  // Default select the first item as selectedItemName
  useEffect(() => {
    if (!selectedItemName && combinedItems.length > 0) {
      const firstItem = combinedItems[0].Name || combinedItems[0].name;
      if (firstItem) {
        setSelectedItemName(firstItem);
        setSearchTerm(firstItem);
      }
    }
  }, [combinedItems, selectedItemName]);

  // Reactive effect to fetch market intelligence whenever item or state changes
  useEffect(() => {
    const queryState = selectedState || activeCompany?.StateName || activeCompany?.StateCode || "Maharashtra";
    const itemToQuery = selectedItemName || (combinedItems.length > 0 ? (combinedItems[0].Name || combinedItems[0].name) : "Maize");
    if (itemToQuery) {
      fetchMarketIntelligence([itemToQuery], queryState);
    }
  }, [selectedItemName, selectedState, activeCompany]);

  // Dismiss toast after 4 seconds
  useEffect(() => {
    if (procurementToast) {
      const timer = setTimeout(() => {
        setProcurementToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [procurementToast]);

  const fetchMasterItems = async () => {
    try {
      const res = await fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`);
      const data = await res.json();
      setMasterItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch master items", e);
    }
  };

  const fetchMarketIntelligence = async (items: string[], stateName?: string, forceRefresh: boolean = false) => {
    if (items.length === 0) return;
    setIsFetchingIntelligence(true);
    setFetchError(null);
    const targetState = stateName || selectedState || activeCompany?.StateName || activeCompany?.StateCode || 'Maharashtra';
    try {
      const res = await fetch('/api/v1/market-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items, 
          state: targetState,
          forceRefresh
        })
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      setMarketIntelligence(data.intelligence || []);
      if (!data.intelligence || data.intelligence.length === 0) {
        setFetchError("No data found for the selected commodities.");
      }
    } catch (e: any) {
      console.error("Failed to fetch market intelligence", e);
      setFetchError(e.message || "Failed to fetch market intelligence. Please try again.");
    } finally {
      setIsFetchingIntelligence(false);
    }
  };

  useEffect(() => {
    if (activeCompany?.id) {
      fetchMasterItems();
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    const fetchAll = async () => {
      const companyId = activeCompany?.id || '';
      try {
        const [invRes, salesRes, purRes, adjRes, sRetRes, pRetRes, demandRes] = await Promise.all([
          fetch(`/api/v1/data/InventoryItems?CompanyId=${companyId}`),
          fetch(`/api/v1/data/SalesInvoices?CompanyId=${companyId}`),
          fetch(`/api/v1/data/PurchaseInvoices?CompanyId=${companyId}`),
          fetch(`/api/v1/data/StockAdjustments?CompanyId=${companyId}`),
          fetch(`/api/v1/data/SalesReturns?CompanyId=${companyId}`),
          fetch(`/api/v1/data/PurchaseReturns?CompanyId=${companyId}`),
          fetch(`/api/v1/data/DemandEnquiries?CompanyId=${companyId}`)
        ]);

        const items = await invRes.json();
        const sales = await salesRes.json();
        const purchases = await purRes.json();
        const adjustments = await adjRes.json();
        const salesReturns = await sRetRes.json();
        const purchaseReturns = await pRetRes.json();
        const demands = await demandRes.json();

        setSalesInvoices(Array.isArray(sales) ? sales : []);
        setEnquiriesList(Array.isArray(demands) ? demands : []);

        const stockMap: Record<string, number> = {};
        const suppliedAgainstDemandMap: Record<string, number> = {};
        
        const itemsArr = Array.isArray(items) ? items : [];
        setItemsData(itemsArr);

        itemsArr.forEach((i: any) => {
          let inward = 0;
          let outward = 0;
          let suppliedAgainstDemand = 0;
          
          const sArr = Array.isArray(sales) ? sales : [];
          sArr.forEach(s => {
             if (s.Status === 'Draft' || s.Status === 'Cancelled') return;
             let sItems: any[] = [];
             try { sItems = JSON.parse(s.ItemsData || '[]'); } catch(e) {}
             const lines = sItems.filter(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
             lines.forEach(line => {
               const qty = parseFloat(line.qty || line.Quantity) || 0;
               outward += qty;
               if (line.demandEnquiryNo) {
                 suppliedAgainstDemand += qty;
               }
             });
          });
          
          const pArr = Array.isArray(purchases) ? purchases : [];
          pArr.forEach(p => {
             if (p.Status === 'Draft' || p.Status === 'Cancelled') return;
             let pItems: any[] = [];
             try { pItems = JSON.parse(p.ItemsData || '[]'); } catch(e) {}
             const lines = pItems.filter(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
             lines.forEach(line => inward += parseFloat(line.qty || line.Quantity) || 0);
          });

          const srArr = Array.isArray(salesReturns) ? salesReturns : [];
          srArr.forEach(sr => {
             if (sr.Status === 'Draft' || sr.Status === 'Cancelled') return;
             let srItems: any[] = [];
             try { srItems = JSON.parse(sr.ItemsData || '[]'); } catch(e) {}
             const lines = srItems.filter(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
             lines.forEach(line => inward += parseFloat(line.qty || line.Quantity) || 0);
          });

          const prArr = Array.isArray(purchaseReturns) ? purchaseReturns : [];
          prArr.forEach(pr => {
             if (pr.Status === 'Draft' || pr.Status === 'Cancelled') return;
             let prItems: any[] = [];
             try { prItems = JSON.parse(pr.ItemsData || '[]'); } catch(e) {}
             const lines = prItems.filter(itm => String(itm.ItemId || itm.itemId) === String(i.Id || i.id));
             lines.forEach(line => outward += parseFloat(line.qty || line.Quantity) || 0);
          });

          const aArr = Array.isArray(adjustments) ? adjustments : [];
          aArr.forEach(a => {
             if (a.Status === 'Draft' || a.Status === 'Cancelled') return;
             let aItems: any[] = [];
             try { aItems = JSON.parse(a.ItemsData || '[]'); } catch(e) {}
             const lines = aItems.filter(itm => String(itm.itemId || itm.ItemId) === String(i.Id || i.id));
             lines.forEach(line => {
               let diff = 0;
               if (line.newQty !== undefined && line.currentStr !== undefined) {
                   diff = Math.abs((parseFloat(line.newQty) || 0) - (parseFloat(line.currentStr) || 0));
               } else {
                   diff = parseFloat(line.qty || line.Quantity) || 0;
               }
               if (a.AdjustmentType === 'Quantity Addition') inward += diff;
               else if (a.AdjustmentType === 'Quantity Reduction') outward += diff;
             });
          });
          
          const openingStock = parseFloat(i.Quantity || 0) || 0;
          stockMap[String(i.Name || i.name)] = openingStock + inward - outward;
          suppliedAgainstDemandMap[String(i.Name || i.name)] = suppliedAgainstDemand;
        });
        
        setInventoryStock(stockMap);
        setSuppliedStock(suppliedAgainstDemandMap);
      } catch (e) {
        console.error("Failed to load data for aggregation", e);
      }
    };

    if (activeCompany?.id) {
      fetchAll();
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    if (enquiriesList.length === 0) return;
    
    const activeEnquiries = enquiriesList.filter((e: any) => e.status !== 'Completed' && e.status !== 'Cancelled' && e.status !== 'Rejected');
    
    // Group by commodity for the first table
    const commodityMap: Record<string, { pending: number, enquiries: number, unit: string }> = {};
    
    activeEnquiries.forEach((e: any) => {
      const commodity = e.commodity || 'Unknown';
      if (!commodityMap[commodity]) {
        commodityMap[commodity] = { pending: 0, enquiries: 0, unit: 'KGS' };
      }
      commodityMap[commodity].pending += Number(e.totalQuantity || 0);
      commodityMap[commodity].enquiries += 1;
    });

    // Populate units
    if (itemsData.length > 0) {
      Object.keys(commodityMap).forEach(commodity => {
        const item = itemsData.find(i => (i.Name || i.name) === commodity);
        if (item) {
          commodityMap[commodity].unit = item.Unit || item.unit || 'KGS';
        }
      });
    }

    const aggregated = Object.keys(commodityMap).map(commodity => {
      const totalDemand = commodityMap[commodity].pending;
      const supplied = suppliedStock[commodity] || 0;
      const pendingQty = Math.max(0, totalDemand - supplied);
      const available = inventoryStock[commodity] || 0;
      const pendingProcurement = Math.max(0, pendingQty - available);
      
      return {
        commodity,
        enquiries: commodityMap[commodity].enquiries,
        totalDemand,
        supplied,
        pendingQty,
        available,
        pendingProcurement,
        unit: commodityMap[commodity].unit
      };
    });

    setDemandData(aggregated);
  }, [itemsData, inventoryStock, enquiriesList, suppliedStock]);

  const getSuppliedPerEnquiry = (enquiryNo: string) => {
    let supplied = 0;
    salesInvoices.forEach(inv => {
      if (inv.Status === 'Draft' || inv.Status === 'Cancelled') return;
      try {
        const items = JSON.parse(inv.ItemsData || '[]');
        items.forEach((it: any) => {
          if (it.demandEnquiryNo === enquiryNo) {
            supplied += Number(it.qty || 0);
          }
        });
      } catch (e) {}
    });
    return supplied;
  };

  if (!canView) {
    return <div className="p-4 text-red-500">You do not have permission to view this module.</div>;
  }

  const overallActiveEnquiries = demandData.reduce((sum, d) => sum + d.enquiries, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Demand Aggregation Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Active Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallActiveEnquiries}</div>
            <p className="text-xs text-gray-500 mt-1">Open Enquiries</p>
          </CardContent>
        </Card>
        
        {/* We can't sum everything easily if units differ, but we can show counts. Let's just show counts or hide the aggregated summary cards and rely on the table.
            Instead of summing random units, we will show "Commodities with Shortage" etc. */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Commodities with Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{demandData.length}</div>
            <p className="text-xs text-gray-500 mt-1">Distinct items requested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fully Fulfillable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{demandData.filter(d => d.pendingProcurement === 0 && d.totalDemand > 0).length}</div>
            <p className="text-xs text-gray-500 mt-1">Items ready to dispatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Procurement Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{demandData.filter(d => d.pendingProcurement > 0).length}</div>
            <p className="text-xs text-gray-500 mt-1">Items with shortage</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6 border-blue-100 shadow-sm">
        <CardHeader className="bg-blue-50/50 flex flex-col md:flex-row items-start md:items-center justify-between py-4 gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1 w-full">
            <div className="flex items-center gap-2 shrink-0">
              <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
              <CardTitle className="text-lg font-bold text-gray-900">AI Market Price Intelligence</CardTitle>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap flex-1 w-full md:w-auto">
              {/* Commodity Selector with Autocomplete Search */}
              <div className="relative min-w-[200px] flex-1 md:flex-initial">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Select Commodity..."
                  value={isOpen ? searchTerm : (selectedItemName || searchTerm)}
                  onFocus={() => {
                    setIsOpen(true);
                    setSearchTerm(selectedItemName);
                  }}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                  }}
                  className="w-full text-xs border border-blue-200 rounded-lg bg-white pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all shadow-sm h-9"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                  {selectedItemName && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemName("");
                        setSearchTerm("");
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in duration-200">
                      <div className="p-1">
                        {combinedItems
                          .filter(item => {
                            const name = (item.Name || item.name || '').toLowerCase();
                            return name.includes(searchTerm.toLowerCase());
                          })
                          .slice(0, 50)
                          .map((item, idx) => {
                            const name = item.Name || item.name;
                            const isSelected = selectedItemName === name;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedItemName(name);
                                  setSearchTerm(name);
                                  setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                                  isSelected 
                                    ? 'bg-blue-50 text-blue-700 font-bold' 
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span>{name}</span>
                                <span className="text-[9px] text-gray-400 font-normal uppercase tracking-tighter">{item.ItemCode || item.itemCode || ''}</span>
                              </button>
                            );
                          })}
                        {combinedItems.filter(item => (item.Name || item.name || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                          <div className="px-3 py-4 text-center text-gray-400 text-xs italic">
                            No matching items found
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Autocomplete State Selector with Checkbox */}
              <div className="relative">
                <button
                  onClick={() => setIsStateOpen(!isStateOpen)}
                  className="flex items-center gap-1.5 shrink-0 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg text-xs font-bold text-blue-700 transition-colors shadow-sm uppercase tracking-wider h-9"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{selectedState || "Select State"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
                </button>

                {isStateOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStateOpen(false)} />
                    <div className="absolute left-0 md:right-0 md:left-auto mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                      <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search State..."
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {INDIAN_STATES
                          .filter(st => st.toLowerCase().includes(stateSearch.toLowerCase()))
                          .map((st, sIdx) => {
                            const isSelected = selectedState.toLowerCase() === st.toLowerCase();
                            const isCompanyDefault = (activeCompany?.StateName || activeCompany?.StateCode || "Maharashtra").toLowerCase() === st.toLowerCase();
                            return (
                              <button
                                key={sIdx}
                                onClick={() => {
                                  setSelectedState(st);
                                  setIsStateOpen(false);
                                  setStateSearch("");
                                  const itemToQuery = selectedItemName || (combinedItems[0]?.Name || combinedItems[0]?.name || "Maize");
                                  fetchMarketIntelligence([itemToQuery], st);
                                }}
                                className={`w-full text-left px-2.5 py-2 text-xs rounded-md flex items-center justify-between transition-colors ${
                                  isSelected ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                <span className="truncate">{st}</span>
                                <div className="flex items-center gap-1.5">
                                  {isCompanyDefault && (
                                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded font-extrabold uppercase scale-90">
                                      DEFAULT
                                    </span>
                                  )}
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white"
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              const queryItem = selectedItemName || (combinedItems[0]?.Name || combinedItems[0]?.name || "Maize");
              if (queryItem) {
                fetchMarketIntelligence([queryItem.trim()], selectedState, true);
              }
            }}
            disabled={isFetchingIntelligence}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:text-gray-400 shrink-0"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isFetchingIntelligence ? 'animate-spin' : ''}`} />
            {isFetchingIntelligence ? 'Updating Insights...' : 'Refresh AI Insights'}
          </button>
        </CardHeader>
        <CardContent className="pt-4">
          {isFetchingIntelligence ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Brain className="w-12 h-12 text-blue-200 animate-pulse mb-4" />
              <p className="text-gray-500 text-sm animate-pulse">Analyzing market trends for {selectedItemName || searchTerm || 'commodities'} in {selectedState || 'selected state'}...</p>
            </div>
          ) : fetchError ? (
            <div className="text-center py-10">
              <Info className="w-10 h-10 text-red-200 mx-auto mb-3" />
              <p className="text-red-600 text-sm font-medium">{fetchError}</p>
              <button 
                onClick={() => fetchMarketIntelligence([selectedItemName || 'Maize'], selectedState)}
                className="mt-4 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold"
              >
                Retry Search
              </button>
            </div>
          ) : marketIntelligence.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketIntelligence.map((intel, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-colors shadow-sm group flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{intel.commodity}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          intel.trend?.toLowerCase().includes('rising') ? 'bg-red-50 text-red-600' :
                          intel.trend?.toLowerCase().includes('falling') ? 'bg-green-50 text-green-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {intel.trend}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-700">{intel.currentPrice}</span>
                      </div>

                      <div className="flex gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100 mb-4">
                        <Brain className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-600 leading-relaxed italic">"{intel.advice}"</p>
                      </div>
                    </div>

                    {/* Mini APMC overview list within the card */}
                    {intel.apmcPrices && intel.apmcPrices.length > 0 && (
                      <div className="border-t border-gray-50 pt-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Key Mandi Highlights ({selectedState}):</span>
                        <div className="space-y-1.5">
                          {intel.apmcPrices.slice(0, 3).map((apmc: any, aIdx: number) => (
                            <div key={aIdx} className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-500 flex items-center gap-1 font-medium">
                                <MapPin className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
                                {apmc.mandi} ({apmc.district})
                              </span>
                              <span className="font-bold text-gray-700 font-mono">{apmc.priceRange}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Comprehensive District-wise APMC wholesale spot prices table */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                    <h4 className="text-sm font-extrabold text-gray-900">District-wise APMC Mandi Spot Prices</h4>
                  </div>
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedState} Mandis
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3">District</th>
                        <th className="px-4 py-3">Major Mandi / APMC</th>
                        <th className="px-4 py-3">Commodity Name</th>
                        <th className="px-4 py-3">Variety</th>
                        <th className="px-4 py-3 text-center">Arrival Volume</th>
                        <th className="px-4 py-3 text-center">Mandi Trend</th>
                        <th className="px-4 py-3 text-right">Spot Price Range (per Quintal)</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {marketIntelligence.flatMap((intel: any) => 
                        (intel.apmcPrices || []).map((apmc: any) => ({
                          ...apmc,
                          parentCommodity: intel.commodity
                        }))
                      ).length > 0 ? (
                        marketIntelligence.flatMap((intel: any) => 
                          (intel.apmcPrices || []).map((apmc: any, aIdx: number) => (
                            <tr key={`${intel.commodity}-${aIdx}`} className="hover:bg-blue-50/40 transition-colors">
                              <td className="px-4 py-3 font-semibold text-gray-900">{apmc.district}</td>
                              <td className="px-4 py-3 text-gray-700 font-medium">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-[9px] font-bold text-blue-600 mr-2">APMC</span>
                                {apmc.mandi}
                              </td>
                              <td className="px-4 py-3 text-gray-800 font-semibold">{apmc.commodity || intel.commodity}</td>
                              <td className="px-4 py-3 text-gray-500 font-medium">{apmc.variety || 'Common'}</td>
                              <td className="px-4 py-3 text-center text-gray-600 font-bold bg-gray-50/30">{apmc.arrivalQty || 'N/A'}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  apmc.mandiTrend?.toLowerCase() === 'rising' ? 'bg-red-50 text-red-600' :
                                  apmc.mandiTrend?.toLowerCase() === 'falling' ? 'bg-green-50 text-green-600' :
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                  {apmc.mandiTrend?.toLowerCase() === 'rising' && <TrendingUp className="w-3 h-3" />}
                                  {apmc.mandiTrend?.toLowerCase() === 'falling' && <TrendingDown className="w-3 h-3" />}
                                  {apmc.mandiTrend || 'Stable'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">{apmc.priceRange}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => setProcurementToast(`Sourcing request initiated for ${apmc.commodity} from ${apmc.mandi} (${apmc.district}, ${selectedState}).`)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm transition-all"
                                >
                                  Source Stock
                                </button>
                              </td>
                            </tr>
                          ))
                        )
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-400 italic">
                            No district-wise APMC spot prices found for the selected commodities in {selectedState}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Info className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No intelligence data available. Use the search box above to get insights for any item.</p>
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 italic">Powered by Gemini AI Engine • Grounded in Google Search for real-time accuracy</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commodity Demand vs Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Commodity / Item</th>
                  <th className="px-4 py-3 font-medium text-center">Unit</th>
                  <th className="px-4 py-3 font-medium text-center">Open enquiries</th>
                  <th className="px-4 py-3 font-medium text-right">Total Demand</th>
                  <th className="px-4 py-3 font-medium text-right">Supplied Quantity</th>
                  <th className="px-4 py-3 font-medium text-right">Pending Quantity</th>
                  <th className="px-4 py-3 font-medium text-right">Inventory Available</th>
                  <th className="px-4 py-3 font-medium text-right">Pending Procurement</th>
                </tr>
              </thead>
              <tbody>
                {demandData.length > 0 ? (
                  demandData.map((data, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{data.commodity}</td>
                      <td className="px-4 py-3 text-center">{data.unit}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-700">{data.enquiries}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {data.totalDemand.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">
                        {data.supplied.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-orange-600 font-bold">
                        {data.pendingQty.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                        {data.available.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-600 font-black">
                        {data.pendingProcurement > 0 ? data.pendingProcurement.toLocaleString('en-IN') : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No active demand enquiries to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enquiry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Commodity / Item</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Enquiry No.</th>
                  <th className="px-4 py-3 font-medium">Enquiry Date</th>
                  <th className="px-4 py-3 font-medium">Buyer Name</th>
                  <th className="px-4 py-3 font-medium text-right">Total Quantity</th>
                  <th className="px-4 py-3 font-medium text-right">Supplied Quantity</th>
                  <th className="px-4 py-3 font-medium text-right">Balance Quantity</th>
                </tr>
              </thead>
              <tbody>
                {enquiriesList.length > 0 ? (
                  enquiriesList.map((enq, idx) => {
                    const supplied = getSuppliedPerEnquiry(enq.enquiryNo);
                    const total = parseFloat(enq.totalQuantity || '0');
                    const balance = Math.max(0, total - supplied);
                    const item = itemsData.find(i => (i.Name || i.name) === enq.commodity);
                    const unit = item?.Unit || item?.unit || 'KGS';
                    
                    return (
                      <tr key={enq.Id || enq.id || idx} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{enq.commodity}</td>
                        <td className="px-4 py-3">{unit}</td>
                        <td className="px-4 py-3 font-bold text-blue-700">{enq.enquiryNo}</td>
                        <td className="px-4 py-3">{enq.expectedDate}</td>
                        <td className="px-4 py-3">{enq.buyer}</td>
                        <td className="px-4 py-3 text-right font-mono">{total.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600">{supplied.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-mono text-orange-600 font-bold">{balance.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border-t">
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No demand enquiries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {procurementToast && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center justify-between gap-3 border border-gray-800 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-xs font-semibold">{procurementToast}</span>
          <button onClick={() => setProcurementToast(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}


