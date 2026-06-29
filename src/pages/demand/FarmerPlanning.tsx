import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function FarmerPlanning() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Farmer Production Planning</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Allocate Crop
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crop Allocation & Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Crop Name</th>
                  <th className="px-4 py-3 font-medium">Market Demand</th>
                  <th className="px-4 py-3 font-medium">Committed Area (Acres)</th>
                  <th className="px-4 py-3 font-medium">Expected Yield</th>
                  <th className="px-4 py-3 font-medium">Gap/Surplus</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium">Wheat - Grade A</td>
                  <td className="px-4 py-3">5,000 MT</td>
                  <td className="px-4 py-3">1,200</td>
                  <td className="px-4 py-3">3,600 MT</td>
                  <td className="px-4 py-3 text-red-600">-1,400 MT</td>
                  <td className="px-4 py-3 text-blue-600 cursor-pointer">View Farmers</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3 font-medium">Soyabean</td>
                  <td className="px-4 py-3">2,000 MT</td>
                  <td className="px-4 py-3">800</td>
                  <td className="px-4 py-3">2,400 MT</td>
                  <td className="px-4 py-3 text-green-600">+400 MT</td>
                  <td className="px-4 py-3 text-blue-600 cursor-pointer">View Farmers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
