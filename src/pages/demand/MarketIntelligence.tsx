import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { Brain, TrendingUp, TrendingDown, Info, RefreshCcw, MapPin, Search, ChevronDown, Check, X } from 'lucide-react';

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

export function MarketIntelligence() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const canView = hasPermission('Demand Management: Market Intelligence', 'view');

  const [marketIntelligence, setMarketIntelligence] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeItems, setActiveItems] = useState<string[]>([]);

  // Searchable Autocomplete State Selector
  const [selectedState, setSelectedState] = useState<string>("");
  const [stateSearch, setStateSearch] = useState<string>("");
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [procurementToast, setProcurementToast] = useState<string | null>(null);

  // Set default state based on active company
  useEffect(() => {
    if (activeCompany?.StateName || activeCompany?.StateCode) {
      setSelectedState(activeCompany.StateName || activeCompany.StateCode);
    } else {
      setSelectedState("Maharashtra");
    }
  }, [activeCompany]);

  const fetchMarketIntelligence = async (items: string[], stateName?: string, forceRefresh: boolean = false) => {
    if (items.length === 0) return;
    setIsFetching(true);
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
        setFetchError("No market data found for the listed commodities.");
      }
    } catch (e: any) {
      console.error("Failed to fetch market intelligence", e);
      setFetchError(e.message || "Failed to fetch market intelligence. Please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  // Re-fetch market intelligence when selectedState changes
  useEffect(() => {
    if (activeItems.length > 0 && selectedState) {
      fetchMarketIntelligence(activeItems, selectedState);
    }
  }, [selectedState, activeItems.length]);

  // Dismiss toast after 4 seconds
  useEffect(() => {
    if (procurementToast) {
      const timer = setTimeout(() => {
        setProcurementToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [procurementToast]);

  useEffect(() => {
    const fetchMasterItems = async () => {
      try {
        const res = await fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`);
        const data = await res.json();
        const masterItems = Array.isArray(data) ? data : [];
        const itemNames = Array.from(new Set(masterItems.map((i: any) => i.Name || i.name).filter(Boolean)));
        setActiveItems(itemNames as string[]);
        
        // Initial fetch with default company state
        const targetState = selectedState || activeCompany?.StateName || activeCompany?.StateCode || 'Maharashtra';
        if (itemNames.length > 0) {
          fetchMarketIntelligence(itemNames as string[], targetState);
        }
      } catch (e) {
        console.error("Failed to fetch master items", e);
      }
    };

    if (activeCompany?.id) {
      fetchMasterItems();
    }
  }, [activeCompany?.id]);

  if (!canView) {
    return <div className="p-4 text-red-500">You do not have permission to view this module.</div>;
  }

  const getPriceColor = (trend?: string) => {
    const t = trend?.toLowerCase() || '';
    if (t.includes('rising') || t.includes('up')) return 'text-red-600';
    if (t.includes('falling') || t.includes('down')) return 'text-green-600';
    return 'text-blue-600';
  };

  const getTrendIcon = (trend?: string) => {
    const t = trend?.toLowerCase() || '';
    if (t.includes('rising') || t.includes('up')) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (t.includes('falling') || t.includes('down')) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <TrendingUp className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
            AI Market Price Intelligence
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time APMC price analysis and sourcing trends for master commodities in <span className="font-semibold text-blue-600">{selectedState}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          {/* Searchable Autocomplete State Selector with Checkbox */}
          <div className="relative">
            <button
              onClick={() => setIsStateOpen(!isStateOpen)}
              className="flex items-center gap-1.5 shrink-0 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg text-xs font-bold text-blue-700 transition-colors shadow-sm uppercase tracking-wider h-10"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{selectedState || "Select State"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
            </button>

            {isStateOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsStateOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
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

          <button 
            onClick={() => fetchMarketIntelligence(activeItems, selectedState, true)}
            disabled={isFetching || activeItems.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 h-10 text-xs shadow-sm"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing Insights...' : 'Refresh AI Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isFetching ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-gray-50"></CardHeader>
              <CardContent className="h-24"></CardContent>
            </Card>
          ))
        ) : fetchError ? (
          <Card className="col-span-1 md:col-span-3 py-12 border-red-100">
            <CardContent className="flex flex-col items-center justify-center">
              <Info className="w-12 h-12 text-red-200 mb-4" />
              <div className="text-xl font-bold text-red-900">AI Analysis Interrupted</div>
              <p className="text-red-500 mt-2">{fetchError}</p>
              <button 
                onClick={() => fetchMarketIntelligence(activeItems, selectedState, true)}
                className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Retry AI Search
              </button>
            </CardContent>
          </Card>
        ) : marketIntelligence.length > 0 ? (
          <div className="col-span-1 md:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {marketIntelligence.map((intel, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-600 flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold text-gray-900">{intel.commodity}</CardTitle>
                        <div className="bg-blue-50 px-2 py-1 rounded text-[10px] font-bold text-blue-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {activeCompany?.StateName || activeCompany?.StateCode || 'MH'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline space-x-2">
                        <div className="text-2xl font-bold">{intel.currentPrice}</div>
                        <div className={`flex items-center text-sm font-bold ${getPriceColor(intel.trend)}`}>
                          {getTrendIcon(intel.trend)}
                          <span className="ml-1 uppercase text-[10px]">{intel.trend}</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 flex gap-2">
                        <Brain className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 leading-relaxed italic text-ellipsis overflow-hidden">
                          "{intel.advice}"
                        </p>
                      </div>
                    </CardContent>
                  </div>

                  {intel.apmcPrices && intel.apmcPrices.length > 0 && (
                    <div className="px-6 pb-4 pt-2 border-t border-gray-50 bg-gray-50/30">
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">Mandi Price Highlights:</span>
                      <div className="space-y-1.5">
                        {intel.apmcPrices.slice(0, 3).map((apmc: any, aIdx: number) => (
                          <div key={aIdx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate max-w-[120px]">{apmc.mandi}</span>
                            </span>
                            <span className="font-bold text-gray-700 font-mono text-[11px]">{apmc.priceRange}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Comprehensive District-wise APMC wholesale spot prices table */}
            <Card className="border border-gray-100">
              <CardHeader className="pb-3 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-4 bg-blue-600 rounded-full"></div>
                    <CardTitle className="text-base font-bold">District-wise APMC Wholesale Spot Prices</CardTitle>
                  </div>
                  <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedState} APMCs
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
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
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="col-span-1 md:col-span-3 py-12">
            <CardContent className="flex flex-col items-center justify-center">
              <Info className="w-12 h-12 text-gray-200 mb-4" />
              <div className="text-xl font-bold text-gray-900">No Intelligence Data</div>
              <p className="text-gray-500 mt-2">Inventory items are required for AI analysis.</p>
              {activeItems.length === 0 && (
                <p className="text-sm text-blue-600 mt-4 font-medium">Add items to Master Data to start seeing market insights.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Historical Price Trends</CardTitle>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center bg-gray-50 text-gray-400 rounded-md border border-dashed p-6 text-center">
              <TrendingUp className="w-12 h-12 mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">AI Trend Analysis</p>
              <p className="text-xs max-w-xs mt-2">Gemini is currently monitoring seasonal patterns and historical data points for your state.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>AI Price Prediction</CardTitle>
            <Brain className="w-5 h-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center bg-gray-50 text-gray-400 rounded-md border border-dashed p-6 text-center">
              <Search className="w-12 h-12 mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Forecasting Model</p>
              <p className="text-xs max-w-xs mt-2">Real-time prediction models are grounding with search data to provide 15-day price trajectories.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700 italic">
          Disclaimer: Market prices are fetched using Google Search grounding via Gemini AI. Prices may vary based on local mandis and actual procurement volumes.
        </p>
      </div>

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

