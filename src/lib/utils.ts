import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
