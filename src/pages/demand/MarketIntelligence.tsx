import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function MarketIntelligence() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Market Price Intelligence</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Wheat (Grade A)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-2">
              <div className="text-2xl font-bold">₹2,450/Qtl</div>
              <span className="text-sm text-green-600 mb-1">↑ 2.5%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Average market rate today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Soyabean</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-2">
              <div className="text-2xl font-bold">₹4,800/Qtl</div>
              <span className="text-sm text-red-600 mb-1">↓ 1.2%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Average market rate today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Best Selling Region</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Western Zone</div>
            <p className="text-xs text-blue-600 mt-1">Highest realization price</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Historical Price Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 text-gray-400 rounded-md border border-dashed">
              [Price Trend Line Chart Placeholder]
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Price Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 text-gray-400 rounded-md border border-dashed">
              [Prediction Chart / Table Placeholder]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
