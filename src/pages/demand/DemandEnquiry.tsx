import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { AutocompleteCombobox } from '../../components/AutocompleteCombobox';

export function DemandEnquiry() {
  const { hasPermission } = useAuth();
  const { activeCompany } = useAppContext();
  const canAdd = hasPermission('Demand Management: Demand Enquiry', 'add');
  const canEdit = hasPermission('Demand Management: Demand Enquiry', 'edit');
  const canDelete = hasPermission('Demand Management: Demand Enquiry', 'delete');
  const canView = hasPermission('Demand Management: Demand Enquiry', 'view');

  const [enquiries, setEnquiries] = useState<any[]>([]);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/data/Customers?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/InventoryItems?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => []),
      fetch(`/api/v1/data/DemandEnquiries?CompanyId=${activeCompany?.id || ''}`).then(res => res.json()).catch(() => [])
    ]).then(([custData, itemsData, enquiriesData]) => {
      setCustomers(Array.isArray(custData) ? custData : []);
      setInventoryItems(Array.isArray(itemsData) ? itemsData : []);
      
      const fetchedEnquiries = Array.isArray(enquiriesData) ? enquiriesData : [];
      setEnquiries(fetchedEnquiries);

      // Try migrating local storage data one time if it exists
      const saved = localStorage.getItem('demand_enquiries');
      if (saved) {
        try {
          const localEnquiries = JSON.parse(saved);
          if (Array.isArray(localEnquiries) && localEnquiries.length > 0) {
            localEnquiries.forEach(async (enq) => {
              // only migrate if not already exists by enquiryNo
              if (!fetchedEnquiries.find((e: any) => e.enquiryNo === enq.enquiryNo)) {
                try {
                  const res = await fetch(`/api/v1/data/DemandEnquiries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...enq, CompanyId: activeCompany?.id || null })
                  });
                  if (res.ok) {
                    const savedEnq = await res.json();
                    setEnquiries(prev => [...prev, savedEnq]);
                  }
                } catch (e) {
                   console.error("Failed to migrate", e);
                }
              }
            });
            localStorage.removeItem('demand_enquiries');
          }
        } catch (e) { }
      }
    });
  }, [activeCompany?.id]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    enquiryNo: '',
    buyer: '',
    commodity: '',
    expectedDate: '',
    totalQuantity: '',
    targetPrice: '',
    qualitySpecs: '',
    deliveryLocation: '',
    remarks: '',
    status: 'Draft'
  });

  const getSelectedItemUnit = () => {
    const item = inventoryItems.find(i => (i.Name || i.name) === formData.commodity);
    return item?.Unit || item?.unit || 'KGS';
  };

  if (!canView) {
    return <div className="p-4 text-red-500">You do not have permission to view this module.</div>;
  }

  const handleCreate = () => {
    setFormData({
      enquiryNo: `DEM-${new Date().getFullYear()}-${String(enquiries.length + 1).padStart(3, '0')}`,
      buyer: '',
      commodity: '',
      expectedDate: '',
      totalQuantity: '',
      targetPrice: '',
      qualitySpecs: '',
      deliveryLocation: '',
      remarks: '',
      status: 'Draft'
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    const record = enquiries.find(e => e.Id === id || e.id === id);
    if (record) {
      setFormData(record);
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        const res = await fetch(`/api/v1/data/DemandEnquiries/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setEnquiries(enquiries.filter(e => e.Id !== id && e.id !== id));
        } else {
          alert('Failed to delete.');
        }
      } catch (e) {
        alert('An error occurred.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/v1/data/DemandEnquiries/${editingId}` : '/api/v1/data/DemandEnquiries';
    const method = editingId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, CompanyId: activeCompany?.id || null })
      });
      if (res.ok) {
        const saved = await res.json();
        if (editingId) {
          setEnquiries(enquiries.map(e => (e.Id === editingId || e.id === editingId) ? saved : e));
        } else {
          setEnquiries([...enquiries, saved]);
        }
        setShowForm(false);
      } else {
        alert('Failed to save.');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Demand Enquiry</h1>
        {canAdd && !showForm && (
          <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Create Enquiry
          </button>
        )}
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId !== null ? 'Edit Enquiry' : 'Create New Enquiry'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enquiry No</label>
                  <input type="text" value={formData.enquiryNo} disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Date *</label>
                  <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.expectedDate} onChange={(e) => setFormData({...formData, expectedDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Buyer Name *</label>
                  <AutocompleteCombobox
                    options={customers.map(c => ({
                      value: String(c.CustomerName || c.Customer_NAME || c.Name || c.name || ''),
                      label: String(c.CustomerName || c.Customer_NAME || c.Name || c.name || '')
                    }))}
                    value={formData.buyer}
                    onChange={(val) => setFormData({...formData, buyer: val})}
                    placeholder="Select Buyer..."
                  />
                  {!formData.buyer && <p className="text-xs text-red-500 mt-1">Please select a buyer.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commodity / Item *</label>
                  <AutocompleteCombobox
                    options={inventoryItems.map(item => ({
                      value: String(item.Name || item.name || ''),
                      label: String(item.Name || item.name || '')
                    }))}
                    value={formData.commodity}
                    onChange={(val) => setFormData({...formData, commodity: val})}
                    placeholder="Select Commodity..."
                  />
                  {!formData.commodity && <p className="text-xs text-red-500 mt-1">Please select a commodity.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Price (₹/{getSelectedItemUnit()})</label>
                  <input type="number" min="0" step="0.01" value={formData.targetPrice} onChange={(e) => setFormData({...formData, targetPrice: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Quantity ({getSelectedItemUnit()}) *</label>
                  <input type="number" required min="0" step="0.01" value={formData.totalQuantity} onChange={(e) => setFormData({...formData, totalQuantity: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quality Specs</label>
                  <input type="text" value={formData.qualitySpecs} onChange={(e) => setFormData({...formData, qualitySpecs: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Moisture < 10%" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Location</label>
                  <input type="text" value={formData.deliveryLocation} onChange={(e) => setFormData({...formData, deliveryLocation: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" rows={3}></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={!formData.buyer || !formData.commodity} className={`px-4 py-2 rounded-md ${!formData.buyer || !formData.commodity ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Save Enquiry</button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
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
                    <th className="px-4 py-3 font-medium">Commodity</th>
                    <th className="px-4 py-3 font-medium">Expected Date</th>
                    <th className="px-4 py-3 font-medium">Quantity</th>
                    <th className="px-4 py-3 font-medium">Target Price</th>
                    <th className="px-4 py-3 font-medium">Remarks</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.length > 0 ? (
                    enquiries.map((enquiry, index) => {
                      const item = inventoryItems.find(i => (i.Name || i.name) === enquiry.commodity);
                      const unit = item?.Unit || item?.unit || 'KGS';
                      const rowId = enquiry.Id || enquiry.id || index;
                      return (
                      <tr key={rowId} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">{enquiry.enquiryNo}</td>
                        <td className="px-4 py-3">{enquiry.buyer}</td>
                        <td className="px-4 py-3">{enquiry.commodity}</td>
                        <td className="px-4 py-3">{enquiry.expectedDate}</td>
                        <td className="px-4 py-3">{enquiry.totalQuantity} {unit}</td>
                        <td className="px-4 py-3">{enquiry.targetPrice ? `₹${enquiry.targetPrice}/${unit}` : '-'}</td>
                        <td className="px-4 py-3 truncate max-w-xs">{enquiry.remarks || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${enquiry.status === 'Approved' ? 'bg-green-100 text-green-800' : enquiry.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{enquiry.status}</span>
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          {canEdit && <button onClick={() => handleEdit(rowId)} className="text-blue-600 hover:text-blue-800">Edit</button>}
                          {canDelete && <button onClick={() => handleDelete(rowId)} className="text-red-600 hover:text-red-800">Delete</button>}
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr className="border-t">
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No demand enquiries found.
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

