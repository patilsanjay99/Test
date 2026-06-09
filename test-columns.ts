import db from "./server-db.ts";
const info = db.prepare("PRAGMA table_info(FinancialYears)").all();
console.log("Cols:", info);
