import Database from "better-sqlite3";
const db = new Database("fpc_database.sqlite");
const rows = db.prepare("SELECT * FROM InventoryItems").all();
console.log(rows);
