import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function DemandEnquiry() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Demand Enquiry</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Create Enquiry
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Demand Enquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Enquiry No</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Expected Date</th>
                  <th className="px-4 py-3 font-medium">Total Quantity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3">DEM-2023-001</td>
                  <td className="px-4 py-3">AgriCorp Inc</td>
                  <td className="px-4 py-3">2023-11-15</td>
                  <td className="px-4 py-3">500 MT</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Under Review</span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 cursor-pointer">View</td>
                </tr>
                {/* Empty state or list */}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
