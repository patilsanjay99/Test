import sql from 'mssql';
const mssqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Oviya@202020',
  server: process.env.DB_SERVER || '52.172.33.68',
  database: process.env.DB_DATABASE || 'FPOAppDemo',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  }
};
async function run() {
  const pool = await sql.connect(mssqlConfig);
  const result = await pool.request().query("SELECT TOP 5 InvoiceDate, TotalAmount FROM SalesInvoices");
  console.log(result.recordset);
  await pool.close();
}
run().catch(console.error);
