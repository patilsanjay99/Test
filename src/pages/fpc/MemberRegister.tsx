import React, { useState, useEffect } from 'react';
import { Search, Download, Users } from 'lucide-react';
import { exportToCSV } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';

export function MemberRegister() {
  const { activeCompany } = useAppContext();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const compId = activeCompany?.id || '';
    fetch(`/api/v1/data/FPCMembers?CompanyId=${compId}`)
      .then(r => r.json())
      .then(data => {
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, [activeCompany?.id]);

  const mappedMembers = members.map(m => {
    const shares = parseFloat(m.SharesAllocated || m.sharesallocated || 0);
    const fValue = parseFloat(m.FaceValue || m.facevalue || 10);
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
      'Phone': phone,
      'Aadhar No': aadhar,
      'Full Address': `${address}${village ? ', ' + village : ''}${panchayat ? ', ' + panchayat : ''}${tehsil ? ', ' + tehsil : ''}${district ? ', ' + district : ''}${state ? ', ' + state : ''}${pincode ? ' - ' + pincode : ''}`.replace(/^, /, ''),
      'Land (Acres)': land,
      'Irrigation': irrigation,
      'Major Crops': crops,
      'Shares': shares,
      'Face Value': fValue,
      'Amt': totalAmt
    };
  });

  const doExport = () => {
    exportToCSV(mappedMembers, 'MemberRegister');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Member Register</h1>
        <button
          onClick={doExport}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-0 flex flex-col">
          <div className="flex-1 overflow-auto p-4">
              <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
                  <table className="min-w-full divide-y divide-gray-300 relative text-sm border-collapse">
                      <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">Full Name</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">Gender / DOB</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">Father/Husband</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">Phone</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">Aadhar No</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 min-w-[200px]">Full Address</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">Land (Acres)</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">Irrigation</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">Major Crops</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">Shares</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">Face Value</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">Amt</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white text-gray-600">
                          {mappedMembers.map((m, idx) => (
                             <tr key={idx} className="hover:bg-gray-50">
                                 <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-800">{m['Full Name']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap">{m['Gender / DOB']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap">{m['Father/Husband']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{m['Phone']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{m['Aadhar No']}</td>
                                 <td className="px-3 py-2 text-xs">{m['Full Address']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{m['Land (Acres)']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap">{m['Irrigation']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap">{m['Major Crops']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{m['Shares']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{m['Face Value']}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{m['Amt']}</td>
                             </tr> 
                          ))}
                          {mappedMembers.length === 0 && (
                            <tr><td colSpan={12} className="p-8 text-center text-gray-400">No members found.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
}
