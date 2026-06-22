export async function applySalesInvoiceToLots(data: any, executeQuery: any) {
  if (!data?.ItemsData) return;
  let items = [];
  try { items = JSON.parse(data.ItemsData); } catch(e) { return; }
  
  for (const item of items) {
    if (item.purchaseInvoiceId && item.purchaseLineId) {
      const pinvs = await executeQuery(`SELECT ItemsData FROM PurchaseInvoices WHERE Id = ?`, [item.purchaseInvoiceId]);
      if (pinvs.length > 0) {
        let pItems = [];
        try { pItems = JSON.parse(pinvs[0].ItemsData); } catch(e) {}
        let changed = false;
        for (const pItem of pItems) {
          if (pItem.id === item.purchaseLineId) {
            pItem.soldQty = (pItem.soldQty || 0) + Number(item.qty);
            changed = true;
          }
        }
        if (changed) {
          await executeQuery(`UPDATE PurchaseInvoices SET ItemsData = ? WHERE Id = ?`, [JSON.stringify(pItems), item.purchaseInvoiceId]);
        }
      }
    }
  }
}

export async function revertSalesInvoiceFromLots(oldData: any, executeQuery: any) {
  if (!oldData?.ItemsData) return;
  let items = [];
  try { items = JSON.parse(oldData.ItemsData); } catch(e) { return; }
  
  for (const item of items) {
    if (item.purchaseInvoiceId && item.purchaseLineId) {
      const pinvs = await executeQuery(`SELECT ItemsData FROM PurchaseInvoices WHERE Id = ?`, [item.purchaseInvoiceId]);
      if (pinvs.length > 0) {
        let pItems = [];
        try { pItems = JSON.parse(pinvs[0].ItemsData); } catch(e) {}
        let changed = false;
        for (const pItem of pItems) {
          if (pItem.id === item.purchaseLineId) {
            pItem.soldQty = (pItem.soldQty || 0) - Number(item.qty);
            if (pItem.soldQty < 0) pItem.soldQty = 0;
            changed = true;
          }
        }
        if (changed) {
          await executeQuery(`UPDATE PurchaseInvoices SET ItemsData = ? WHERE Id = ?`, [JSON.stringify(pItems), item.purchaseInvoiceId]);
        }
      }
    }
  }
}

export function installLotsApi(apiRouter: any, executeQuery: any) {
  apiRouter.get("/inventory/lots", async (req: any, res: any) => {
    try {
      const { itemId, companyId } = req.query;
      const pinvs = await executeQuery(`SELECT Id, VendorName, InvoiceNumber, ItemsData FROM PurchaseInvoices WHERE Status != 'Cancelled' AND (CompanyId = ? OR CompanyId IS NULL)`, [companyId || 1]);
      const lots: any[] = [];
      for (const inv of pinvs) {
        if (!inv.ItemsData) continue;
        let items: any[] = [];
        try { items = JSON.parse(inv.ItemsData); } catch(e) {}
        
        for (const item of items) {
          if (!itemId || String(item.itemId) === String(itemId)) {
            const inward = Number(item.qty) || 0;
            const sold = Number(item.soldQty) || 0;
            const adjusted = Number(item.adjustedQty) || 0;
            const balance = inward - sold - adjusted;
            if (balance > 0) {
              lots.push({
                purchaseInvoiceId: inv.Id,
                purchaseInvoiceNo: inv.InvoiceNumber,
                vendorName: inv.VendorName,
                itemId: item.itemId,
                locationId: item.locationId,
                purchaseLineId: item.id, 
                inward, sold, adjusted, balance,
                rate: item.rate
              });
            }
          }
        }
      }
      res.json(lots);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
