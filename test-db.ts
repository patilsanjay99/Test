import db from "./server-db.ts";
console.log("DB Init Success");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables);
