import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function DemandForecasting() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Demand Forecasting Engine</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Run Forecast
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Predicted Demand (Next 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,500 MT</div>
            <p className="text-xs text-green-600 mt-1">+15% vs previous period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Forecast Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.4%</div>
            <p className="text-xs text-gray-500 mt-1">Based on historical variance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">High Demand Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Soyabean, Wheat</div>
            <p className="text-xs text-orange-600 mt-1">Shortage risk identified</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 text-gray-400 rounded-md border border-dashed">
            [Demand Forecast Chart Placeholder]
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
