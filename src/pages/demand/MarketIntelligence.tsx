import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { Brain, TrendingUp, TrendingDown, Info, RefreshCcw, MapPin, Search } from 'lucide-react';

export function MarketIntelligence() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const canView = hasPermission('Demand Management: Market Intelligence', 'view');

  const [marketIntelligence, setMarketIntelligence] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeItems, setActiveItems] = useState<string[]>([]);

  const fetchMarketIntelligence = async (items: string[]) => {
    if (items.length === 0) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/v1/market-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, state: activeCompany?.StateName || activeCompany?.StateCode || 'Maharashtra' })
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

  useEffect(() => {
    const fetchMasterItems = async () => {
      try {
        const res = await fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`);
        const data = await res.json();
        const masterItems = Array.isArray(data) ? data : [];
        const itemNames = Array.from(new Set(masterItems.map((i: any) => i.Name || i.name).filter(Boolean)));
        setActiveItems(itemNames as string[]);
        if (itemNames.length > 0) {
          fetchMarketIntelligence(itemNames as string[]);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Market Price Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Live market insights for master commodities in {activeCompany?.StateName || activeCompany?.StateCode || 'Maharashtra'}</p>
        </div>
        <button 
          onClick={() => fetchMarketIntelligence(activeItems)}
          disabled={isFetching || activeItems.length === 0}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing Insights...' : 'Refresh AI Data'}
        </button>
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
                onClick={() => fetchMarketIntelligence(activeItems)}
                className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Retry AI Search
              </button>
            </CardContent>
          </Card>
        ) : marketIntelligence.length > 0 ? (
          marketIntelligence.map((intel, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-600">
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
                  <p className="text-xs text-gray-600 leading-relaxed italic">
                    "{intel.advice}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
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
    </div>
  );
}

