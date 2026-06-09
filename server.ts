import express from "express";
import "dotenv/config";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import JSZip from "jszip";
import db from "./server-db.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === API ROUTES ===
  const apiRouter = express.Router();
  
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", service: "FPC_Accounting_API", version: "1.0.0" });
  });

  // Export full source code zip
  apiRouter.get("/export/test", (req, res) => {
    console.log("HIT EXPORT TEST");
    res.json({ status: "test_ok" });
  });

  apiRouter.get("/export/source_v2", async (req, res) => {
    try {
      const zip = new JSZip();
      
      const addFilesToZip = (dir: string, zipFolder: JSZip) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (['node_modules', 'dist', '.git', 'package-lock.json', 'fpc_database.sqlite', 'fpc_database.sqlite-journal'].includes(file) || file.endsWith('.zip')) continue;
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            addFilesToZip(filePath, zipFolder.folder(file)!);
          } else {
            zipFolder.file(file, fs.readFileSync(filePath));
          }
        }
      };

      addFilesToZip(process.cwd(), zip);
      
      res.attachment('fpc-source-code.zip');
      const stream = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true });
      stream.pipe(res);
    } catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  // Real API - Dashboard Stats
  apiRouter.get("/dashboard/stats", (req, res) => {
    try {
      const totalSalesResult = db.prepare("SELECT SUM(TotalAmount) as total FROM SalesInvoices").get() as any;
      const receivablesResult = db.prepare("SELECT SUM(TotalAmount) as total FROM SalesInvoices WHERE Status != 'Paid'").get() as any;
      const membersResult = db.prepare("SELECT COUNT(*) as count FROM FPCMembers").get() as any;
      const inventoryResult = db.prepare("SELECT SUM(Quantity * UnitPrice) as total FROM InventoryItems").get() as any;

      // Group Sales by Month string
      const monthlySales = db.prepare("SELECT strftime('%Y-%m', InvoiceDate) as month, SUM(TotalAmount) as revenue FROM SalesInvoices WHERE InvoiceDate IS NOT NULL AND InvoiceDate != '' GROUP BY month ORDER BY month LIMIT 12").all() as any[];
      
      const realRevenueData: any[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (const row of monthlySales) {
        if (!row.month) continue;
        const parts = row.month.split('-');
        if (parts.length === 2) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          realRevenueData.push({
            name: `${monthNames[monthIndex]} ${parts[0].slice(2)}`,
            revenue: row.revenue || 0,
            expense: 0 // Expenses not fully tracked yet
          });
        }
      }

      // Fallback if empty so the chart looks nice
      const defaultRevenueData = [
        { name: 'Jan', revenue: 0, expense: 0 },
        { name: 'Feb', revenue: 0, expense: 0 },
        { name: 'Mar', revenue: 0, expense: 0 },
      ];

      res.json({
          totalSales: totalSalesResult?.total || 0,
          receivables: receivablesResult?.total || 0,
          members: membersResult?.count || 0,
          inventoryValue: inventoryResult?.total || 0,
          revenueData: realRevenueData.length > 0 ? realRevenueData : defaultRevenueData
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamic CRUD endpoint for tables
  apiRouter.get("/data/:table", (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const companyId = req.query.CompanyId;
      const financialYearId = req.query.FinancialYearId;
      
      let query = `SELECT * FROM ${table}`;
      const params: any[] = [];
      const conditions: string[] = [];

      if (companyId) {
        conditions.push(`CompanyId = ?`);
        params.push(companyId);
      }
      if (financialYearId) {
        conditions.push(`FinancialYearId = ?`);
        params.push(financialYearId);
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }
      
      query += ` ORDER BY Id DESC`;
      
      const rows = db.prepare(query).all(...params);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/data/:table", (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const data = req.body;
      const keys = Object.keys(data);
      const values = Object.values(data);
      
      if (keys.length === 0) return res.status(400).json({ error: "Empty body" });

      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      
      const info = db.prepare(sql).run(...values);
      res.json({ id: info.lastInsertRowid, ...data });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete("/data/:table/:id", (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const id = req.params.id;
      db.prepare(`DELETE FROM ${table} WHERE Id = ?`).run(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.use("/api/v1", apiRouter);

  // === VITE MIDDLEWARE SETUP ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("=========================================");
    console.log("DATABASE CONNECTION INFO:");
    console.log("Using built-in SQLite database (fpc_database.sqlite) for cloud environment.");
    if (process.env.DB_SERVER) {
      console.log(`NOTE: Detected SQL Server settings in .env (DB_SERVER="${process.env.DB_SERVER}")`);
      console.log("However, this app is currently running in a Google Cloud container and cannot reach your local PC's SQL Server ('" + process.env.DB_SERVER + "').");
      console.log("To connect to a local SQL Server, you must download the code (via Settings > Export ZIP) and run the app locally on your machine.");
    }
    console.log("=========================================");
  });
}

startServer().catch((e) => {
  console.error("Failed to start server", e);
  process.exit(1);
});
