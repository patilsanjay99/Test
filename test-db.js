import sqlite3 from 'better-sqlite3';
const db = sqlite3('data.db');
const sales = db.prepare('SELECT * FROM SalesInvoices').all();
console.log('SalesInvoices:', sales.length);
const accounts = db.prepare('SELECT * FROM Accounts').all();
console.log('Accounts:', accounts.length);
