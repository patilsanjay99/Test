import express from "express";
import "dotenv/config";
import sql from "mssql";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import JSZip from "jszip";

// Load MSSQL variables
let mssqlPool: any = null;

// Fallback to SQLite (still imported for cloud / fallback usage)
import sqliteDb from "./server-db.js";

async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  if (mssqlPool) {
    // Basic substitution of ? into @p0, @p1 for simple queries
    let mssqlQuery = query;
    const request = mssqlPool.request();
    for (let i = 0; i < params.length; i++) {
      mssqlQuery = mssqlQuery.replace('?', `@p${i}`);
      request.input(`p${i}`, params[i]);
    }
    // Fix LIMIT syntax for MSSQL if easy
    if (mssqlQuery.includes('LIMIT 12')) {
       mssqlQuery = mssqlQuery.replace('SELECT ', 'SELECT TOP 12 ').replace('LIMIT 12', '');
    }
    // Fix sqlite strftime to MSSQL format
    if (mssqlQuery.includes("strftime('%Y-%m', InvoiceDate)")) {
       mssqlQuery = mssqlQuery.replace("strftime('%Y-%m', InvoiceDate)", "FORMAT(InvoiceDate, 'yyyy-MM')");
    }

    try {
        const result = await request.query(mssqlQuery);
        return result.recordset || [];
    } catch (e: any) {
      console.error("MSSQL Query Error:", e, mssqlQuery);
      throw e;
    }
  } else {
    // SQLite execution
    return sqliteDb.prepare(query).all(...params) as any[];
  }
}

async function executeGet(query: string, params: any[] = []): Promise<any> {
    const rows = await executeQuery(query, params);
    return rows[0];
}

async function startServer() {
  if (process.env.DB_SERVER) {
    try {
      const mssqlConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
        database: process.env.DB_NAME,
        options: {
          encrypt: process.env.DB_ENCRYPT === 'true',
          trustServerCertificate: true,
          instanceName: process.env.DB_INSTANCE || undefined
        }
      };
      mssqlPool = await sql.connect(mssqlConfig);
      console.log("✅ Custom MS SQL Connection Initialized to", process.env.DB_SERVER);
    } catch (err: any) {
      console.error("❌ MS SQL Connection Failed: ", err.message);
    }
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === API ROUTES ===
  const apiRouter = express.Router();
  
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", service: "FPC_Accounting_API", version: "1.0.0" });
  });

  apiRouter.get("/export/test", (req, res) => {
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
  apiRouter.get("/dashboard/stats", async (req, res) => {
    try {
      const totalSalesResult = await executeGet("SELECT SUM(TotalAmount) as total FROM SalesInvoices");
      const receivablesResult = await executeGet("SELECT SUM(TotalAmount) as total FROM SalesInvoices WHERE Status != 'Paid'");
      const membersResult = await executeGet("SELECT COUNT(*) as count FROM FPCMembers");
      const inventoryResult = await executeGet("SELECT SUM(Quantity * UnitPrice) as total FROM InventoryItems");

      // Group Sales by Month string
      let monthlySales: any[] = [];
      try {
        monthlySales = await executeQuery("SELECT strftime('%Y-%m', InvoiceDate) as month, SUM(TotalAmount) as revenue FROM SalesInvoices WHERE InvoiceDate IS NOT NULL AND InvoiceDate != '' GROUP BY month ORDER BY month LIMIT 12");
      } catch (ex) {
        // Fallback for mssql grouping if the replace fails
        try {
           monthlySales = await executeQuery("SELECT TOP 12 FORMAT(InvoiceDate, 'yyyy-MM') as month, SUM(TotalAmount) as revenue FROM SalesInvoices WHERE InvoiceDate IS NOT NULL GROUP BY FORMAT(InvoiceDate, 'yyyy-MM') ORDER BY FORMAT(InvoiceDate, 'yyyy-MM')");
        } catch(e) {}
      }
      
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
            expense: 0 
          });
        }
      }

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
  apiRouter.get("/data/:table", async (req, res) => {
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
      
      const rows = await executeQuery(query, params);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/data/:table", async (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const data = req.body;
      const keys = Object.keys(data);
      const values = Object.values(data);
      
      if (keys.length === 0) return res.status(400).json({ error: "Empty body" });

      if (mssqlPool) {
          const request = mssqlPool.request();
          const colNames = [];
          const paramNames = [];
          for (let i = 0; i < keys.length; i++) {
              colNames.push(keys[i]);
              paramNames.push(`@p${i}`);
              request.input(`p${i}`, values[i]);
          }
          const sqlQuery = `INSERT INTO ${table} (${colNames.join(', ')}) OUTPUT INSERTED.Id VALUES (${paramNames.join(', ')})`;
          const result = await request.query(sqlQuery);
          let insertedId = null;
          if (result.recordset && result.recordset.length > 0) {
             insertedId = result.recordset[0].Id;
          }
          res.json({ id: insertedId, ...data });
      } else {
          const placeholders = keys.map(() => '?').join(', ');
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
          const info = sqliteDb.prepare(sql).run(...values);
          res.json({ id: info.lastInsertRowid, ...data });
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.delete("/data/:table/:id", async (req, res) => {
    try {
      const table = req.params.table.replace(/[^a-zA-Z0-9_]/g, '');
      const id = req.params.id;
      if (mssqlPool) {
         const request = mssqlPool.request();
         request.input('id', id);
         await request.query(`DELETE FROM ${table} WHERE Id = @id`);
         res.json({ success: true });
      } else {
         sqliteDb.prepare(`DELETE FROM ${table} WHERE Id = ?`).run(id);
         res.json({ success: true });
      }
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
    if (mssqlPool) {
        console.log(`✅ CONNECTED TO LOCAL MS SQL SERVER! (DB_SERVER="${process.env.DB_SERVER}")`);
        console.log(`Using Database: ${process.env.DB_NAME}`);
    } else if (process.env.DB_SERVER) {
        console.log(`⚠️ Detected MS SQL settings in .env (DB_SERVER="${process.env.DB_SERVER}") but connection failed!`);
        console.log(`Check your .env credentials and ensure SQL Server is running and accessible from where you started node.`);
        console.log(`Using built-in SQLite (fpc_database.sqlite) as a fallback.`);
    } else {
        console.log("Using built-in SQLite (fpc_database.sqlite). No DB_SERVER detected in .env.");
    }
    console.log("=========================================");
  });
}

startServer().catch((e) => {
  console.error("Failed to start server", e);
  process.exit(1);
});
