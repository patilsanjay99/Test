import * as XLSX from 'xlsx';

const ws = XLSX.utils.aoa_to_sheet([['Type', 'Location', 'IsSalesItem'], ['', '', '']]);
ws['!dataValidation'] = [
  { sqref: 'A2:A100', type: 'list', values: 'Raw Material,Finished Goods' }
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, "test-validation.xlsx");
