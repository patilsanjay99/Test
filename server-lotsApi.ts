// Custom API endpoints for Inventory Lots
export function installLotsApi(apiRouter: any, executeGet: any, executeQuery: any) {
  apiRouter.get("/inventory/lots", async (req: any, res: any) => {
    try {
      const { itemId, companyId } = req.query;
      if (!itemId) return res.status(400).json({ error: "itemId is required" });
      const pinvs = await executeQuery(`SELECT Id, VendorName, InvoiceNumber, ItemsData FROM PurchaseInvoices WHERE Status != 'Cancelled' AND CompanyId = ?`, [companyId || 1]);
      const lots: any[] = [];
      for (const inv of pinvs) {
        if (!inv.ItemsData) continue;
        const items = JSON.parse(inv.ItemsData);
        for (const [idx, item] of items.entries()) {
          if (String(item.itemId) === String(itemId)) {
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
                lineId: item.id, // the unique id in the JSON array
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
