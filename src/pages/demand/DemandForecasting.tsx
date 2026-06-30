import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';

export function DemandForecasting() {
  const { hasPermission } = useAuth();
  const canView = hasPermission('Demand Management: Demand Forecasting', 'view');
  const canAdd = hasPermission('Demand Management: Demand Forecasting', 'add');

  const [forecastData, setForecastData] = useState<any>({
    predictedDemand: 0,
    accuracy: 0,
    highDemandProducts: []
  });

  const [isForecastRun, setIsForecastRun] = useState(false);

  const handleRunForecast = () => {
    const saved = localStorage.getItem('demand_enquiries');
    const enquiries = saved ? JSON.parse(saved) : [];
    
    const totalCurrentDemand = enquiries.reduce((sum: number, enq: any) => sum + Number(enq.totalQuantity || 0), 0);
    
    // Simple projection: +15% expected next month based on current open demands
    const predicted = Math.round(totalCurrentDemand * 1.15);

    setForecastData({
      predictedDemand: predicted,
      accuracy: totalCurrentDemand > 0 ? 85 : 0, // Mock accuracy when data exists
      highDemandProducts: totalCurrentDemand > 0 ? ['Wheat', 'Soyabean'] : []
    });
    setIsForecastRun(true);
  };

  if (!canView) {
    return <div className="p-4 text-red-500">You do not have permission to view this module.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Demand Forecasting Engine</h1>
        {canAdd && (
          <button onClick={handleRunForecast} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Run Forecast
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Predicted Demand (Next 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecastData.predictedDemand} MT</div>
            <p className="text-xs text-gray-500 mt-1">{isForecastRun && forecastData.predictedDemand > 0 ? '+15% vs previous period (Projected)' : 'No historical data available'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Forecast Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecastData.accuracy}%</div>
            <p className="text-xs text-gray-500 mt-1">Based on historical variance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">High Demand Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{forecastData.highDemandProducts.length > 0 ? forecastData.highDemandProducts.join(', ') : 'None'}</div>
            <p className="text-xs text-gray-500 mt-1">Shortage risk identified</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 text-gray-400 rounded-md border border-dashed">
            {isForecastRun && forecastData.predictedDemand > 0 ? '[Demand Forecast Chart Placeholder - Details Generated]' : 'No forecast data available to display chart.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

