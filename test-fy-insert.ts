import db from "./server-db.ts";
try {
   const res = db.prepare("INSERT INTO FinancialYears (FinancialYear, CompanyId, FromDate, ToDate) VALUES (?, ?, ?, ?)").run("2026-2027", 1, "2026-04-01", "2027-03-31");
   console.log(res);
} catch (e) {
   console.error(e);
}
