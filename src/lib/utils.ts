import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateVal: any): string {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  if (!str) return '';
  
  // If already in dd/MM/yyyy format (e.g. 10/01/2026)
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    return str.substring(0, 10);
  }
  
  // If in yyyy-MM-dd format or ISO format
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  }
  
  // Try parsing with Date object as fallback
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}
  
  return str;
}

export function formatDateForInput(dateVal: any): string {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  if (!str) return '';
  
  // If in dd/MM/yyyy format or similar
  const dmyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }
  
  // If in yyyy-MM-dd
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return ymdMatch[0];
  }
  
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}
  
  return '';
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) {
    alert("No data to export");
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      let cellData = row[fieldName];
      if (cellData === null || cellData === undefined) {
        cellData = '';
      } else if (typeof cellData === 'string') {
        cellData = cellData.replace(/"/g, '""');
        if (cellData.includes(',') || cellData.includes('"') || cellData.includes('\n')) {
          cellData = `"${cellData}"`;
        }
      }
      return cellData;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
