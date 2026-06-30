import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { AutocompleteCombobox } from '../../components/AutocompleteCombobox';

export function FarmerPlanning() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const canView = hasPermission('Demand Management: Farmer Planning', 'view');
  const canAdd = hasPermission('Demand Management: Farmer Planning', 'add');
  const canEdit = hasPermission('Demand Management: Farmer Planning', 'edit');

  const [allocations, setAllocations] = useState<any[]>([]);

  const [members, setMembers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [demandEnquiries, setDemandEnquiries] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/data/FPCMembers?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/FarmerPlannings?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/DemandEnquiries?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => [])
    ]).then(([membersData, itemsData, planningsData, demandsData]) => {
      setMembers(Array.isArray(membersData) ? membersData : []);
      setInventoryItems(Array.isArray(itemsData) ? itemsData : []);
      setDemandEnquiries(Array.isArray(demandsData) ? demandsData : []);
      
      const fetchedPlannings = Array.isArray(planningsData) ? planningsData : [];
      setAllocations(fetchedPlannings);

      const saved = localStorage.getItem('crop_allocations');
      if (saved) {
        try {
          const localAllocations = JSON.parse(saved);
          if (Array.isArray(localAllocations) && localAllocations.length > 0) {
            localAllocations.forEach(async (alloc) => {
              try {
                const res = await fetch(`/api/v1/data/FarmerPlannings`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...alloc, CompanyId: activeCompany?.id || null })
                });
                if (res.ok) {
                  const savedAlloc = await res.json();
                  setAllocations(prev => [...prev, savedAlloc]);
                }
              } catch (e) {
                 console.error("Failed to migrate", e);
              }
            });
            localStorage.removeItem('crop_allocations');
          }
        } catch (e) { }
      }
    });

  }, [activeCompany?.id]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    farmer: '',
    cropName: '',
    variety: '',
    sowingDate: '',
    expectedHarvestDate: '',
    landParcel: '',
    marketDemand: '',
    committedArea: '',
    expectedYield: '',
    remarks: ''
  });

  const getSelectedItemUnit = () => {
    const item = inventoryItems.find(i => (i.Name || i.name) === formData.cropName);
    return item?.Unit || item?.unit || 'KGS';
  };

  const getPendingDemand = () => {
    if (!formData.cropName) return 0;
    const activeDemands = demandEnquiries.filter(e => 
      e.commodity === formData.cropName && 
      e.status !== 'Completed' && 
      e.status !== 'Cancelled' && 
      e.status !== 'Rejected'
    );
    const totalDemand = activeDemands.reduce((sum, e) => sum + Number(e.totalQuantity || 0), 0);
    
    // Also subtract already allocated quantities for this crop
    const allocated = allocations.reduce((sum, a) => {
      if (a.cropName === formData.cropName) {
        return sum + Number(a.marketDemand || 0);
      }
      return sum;
    }, 0);

    return Math.max(0, totalDemand - allocated);
  };

  const handleCreate = () => {
    setFormData({
      farmer: '',
      cropName: '',
      variety: '',
      sowingDate: '',
      expectedHarvestDate: '',
      landParcel: '',
      marketDemand: '',
      committedArea: '',
      expectedYield: '',
      remarks: ''
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    const record = allocations.find(a => a.Id === id || a.id === id);
    if (record) {
      setFormData(record);
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      try {
        const res = await fetch(`/api/v1/data/FarmerPlannings/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setAllocations(allocations.filter(a => a.Id !== id && a.id !== id));
        }
      } catch (e) {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      ...formData,
      CompanyId: activeCompany?.id || null
    };

    const url = editingId ? `/api/v1/data/FarmerPlannings/${editingId}` : '/api/v1/data/FarmerPlannings';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingId) {
          setAllocations(allocations.map(a => (a.Id === editingId || a.id === editingId) ? saved : a));
        } else {
          setAllocations([...allocations, saved]);
        }
        setShowForm(false);
      }
    } catch (e) {}
  };

  if (!canView) {
    return <div className="p-4 text-red-500">You do not have permission to view this module.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Farmer Production Planning</h1>
        {canAdd && !showForm && (
          <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Allocate Crop
          </button>
        )}
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId !== null ? 'Edit Allocation' : 'New Crop Allocation'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">FPC Member (Farmer) *</label>
                  <AutocompleteCombobox
                    options={members.map(m => ({
                      value: String(m.MemberName || m.membername || ''),
                      label: String(m.MemberName || m.membername || '')
                    }))}
                    value={formData.farmer}
                    onChange={(val) => setFormData({...formData, farmer: val})}
                    placeholder="Select Farmer..."
                  />
                  {!formData.farmer && <p className="text-xs text-red-500 mt-1">Please select a farmer.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Crop Name / Item *</label>
                  <AutocompleteCombobox
                    options={inventoryItems.map(item => ({
                      value: String(item.Name || item.name || ''),
                      label: String(item.Name || item.name || '')
                    }))}
                    value={formData.cropName}
                    onChange={(val) => setFormData({...formData, cropName: val})}
                    placeholder="Select Crop/Item..."
                  />
                  {!formData.cropName && <p className="text-xs text-red-500 mt-1">Please select a crop.</p>}
                  {formData.cropName && (
                    <p className="text-xs text-blue-600 mt-1">Pending Demand: {getPendingDemand()} {getSelectedItemUnit()}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Variety</label>
                  <input type="text" value={formData.variety} onChange={(e) => setFormData({...formData, variety: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sowing Date</label>
                  <input type="date" value={formData.sowingDate} onChange={(e) => setFormData({...formData, sowingDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Harvest Date</label>
                  <input type="date" value={formData.expectedHarvestDate} onChange={(e) => setFormData({...formData, expectedHarvestDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Land Parcel / Plot Details</label>
                  <input type="text" value={formData.landParcel} onChange={(e) => setFormData({...formData, landParcel: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Committed Area (Acres) *</label>
                  <input type="number" min="0" step="0.01" required value={formData.committedArea} onChange={(e) => setFormData({...formData, committedArea: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Market Demand Allocation ({getSelectedItemUnit()}) *</label>
                  <input type="number" min="0" step="0.01" required value={formData.marketDemand} onChange={(e) => setFormData({...formData, marketDemand: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Yield ({getSelectedItemUnit()}) *</label>
                  <input type="number" min="0" step="0.01" required value={formData.expectedYield} onChange={(e) => setFormData({...formData, expectedYield: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" rows={2}></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={!formData.farmer || !formData.cropName} className={`px-4 py-2 rounded-md ${!formData.farmer || !formData.cropName ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Save Allocation</button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Crop Allocation & Gap Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Farmer</th>
                    <th className="px-4 py-3 font-medium">Crop (Variety)</th>
                    <th className="px-4 py-3 font-medium">Harvest Date</th>
                    <th className="px-4 py-3 font-medium">Area (Acres)</th>
                    <th className="px-4 py-3 font-medium">Expected Yield</th>
                    <th className="px-4 py-3 font-medium">Demand Alloc.</th>
                    <th className="px-4 py-3 font-medium">Gap</th>
                    <th className="px-4 py-3 font-medium">Remarks</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.length > 0 ? (
                    allocations.map((item, index) => {
                      const invItem = inventoryItems.find(i => (i.Name || i.name) === item.cropName);
                      const unit = invItem?.Unit || invItem?.unit || 'KGS';
                      const rowId = item.Id || item.id || index;
                      const calcGap = Number(item.expectedYield || 0) - Number(item.marketDemand || 0);
                      return (
                      <tr key={rowId} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.farmer || '-'}</td>
                        <td className="px-4 py-3">{item.cropName} {item.variety ? `(${item.variety})` : ''}</td>
                        <td className="px-4 py-3">{item.expectedHarvestDate || '-'}</td>
                        <td className="px-4 py-3">{item.committedArea}</td>
                        <td className="px-4 py-3">{item.expectedYield} {unit}</td>
                        <td className="px-4 py-3">{item.marketDemand} {unit}</td>
                        <td className={`px-4 py-3 font-medium ${calcGap > 0 ? 'text-green-600' : 'text-red-600'}`}>{calcGap > 0 ? '+' : ''}{calcGap} {unit}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]">{item.remarks || '-'}</td>
                        <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                          {canEdit && <button onClick={() => handleEdit(rowId)} className="text-blue-600 hover:text-blue-800">Edit</button>}
                          <button onClick={() => handleDelete(rowId)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr className="border-t">
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No crop allocations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

