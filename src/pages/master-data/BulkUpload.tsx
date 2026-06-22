import React, { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppContext } from '../../context/AppContext';
import { Upload, Download, FileSpreadsheet, X, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

type TabType = 'customers' | 'vendors' | 'members' | 'products' | 'accounts';

interface UploadState {
  file: File | null;
  data: any[];
  preview: any[];
  headers: string[];
  status: 'idle' | 'parsing' | 'ready' | 'uploading' | 'success' | 'error';
  progress: number;
  message: string;
}

export function BulkUpload() {
  const { t } = useLanguage();
  const { activeCompany } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    data: [],
    preview: [],
    headers: [],
    status: 'idle',
    progress: 0,
    message: ''
  });

  const tabConfig = {
    customers: {
      title: 'Customers',
      table: 'Customers',
      headers: ['CustomerName', 'PhoneNo', 'Address', 'Place', 'EmailID', 'ContactPerson', 'BusinessDetails', 'RegistrationNo', 'AadharCardNo', 'TANNo', 'CINNo', 'PANNo', 'GSTINNo']
    },
    vendors: {
      title: 'Vendors',
      table: 'Vendors',
      headers: ['Vendor_NAME', 'phone_no', 'Vendor_address', 'Place', 'email_id', 'contact_person', 'business_details', 'registration_no', 'aadhar_no', 'pan_no', 'tan_no', 'cin_no', 'GSTIN']
    },
    members: {
      title: 'FPC Members',
      table: 'FPCMembers',
      headers: ['MemberName', 'FatherSpouse', 'Gender', 'DOB', 'Phone', 'AadharNo', 'Address', 'Place', 'Village', 'Panchayat', 'Tehsil', 'District', 'State', 'PINCode', 'LandHolding', 'IrrigationType', 'MajorCrops']
    },
    products: {
      title: 'Items',
      table: 'InventoryItems',
      headers: ['ItemName', 'Category', 'Location', 'IsSalesItem', 'SellingPriceMembers', 'SellingPriceNonMembers', 'BuyingPrice', 'HSNCode', 'MinStock', 'MaxCapacity', 'Status']
    },
    accounts: {
      title: 'Accounts',
      table: 'Accounts',
      headers: ['AccountName', 'AccountCode', 'AccountGroup', 'Place', 'AccountType', 'OpeningBalance', 'BalanceType', 'Status']
    }
  };

  const handleDownloadTemplate = async () => {
    const config = tabConfig[activeTab];
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template');
    const instructionsSheet = workbook.addWorksheet('Instructions');

    // Add Headers
    sheet.addRow(config.headers);

    // Format Headers
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    sheet.columns.forEach(column => {
        column.width = 20;
    });

    if (activeTab === 'products') {
        const locationsRes = activeCompany?.id ? await fetch(`/api/data/locations?CompanyId=${activeCompany.id}`) : null;
        let locations: any[] = [];
        if (locationsRes && locationsRes.ok) {
           locations = await locationsRes.json();
           if (!Array.isArray(locations)) locations = [];
        }
        
        const locNames = locations.map(l => l.Name || `Location ${l.id}`).join(',');
        
        for (let i = 2; i <= 1000; i++) {
           const catCell = sheet.getCell(`B${i}`); // Category (Index 2 -> B)
           catCell.dataValidation = {
               type: 'list',
               allowBlank: true,
               formulae: ['"Seeds,Fertilizers,Pesticides,Machinery,Services"']
           };

           const locCell = sheet.getCell(`C${i}`); // Location (Index 3 -> C)
           if (locNames) {
              locCell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`"${locNames}"`]
              };
           }

           const isSalesCell = sheet.getCell(`D${i}`); // IsSalesItem (Index 4 -> D)
           isSalesCell.dataValidation = {
               type: 'list',
               allowBlank: true,
               formulae: ['"Yes,No"']
           };

           const statusCell = sheet.getCell(`K${i}`); // Status (Index 11 -> K)
           statusCell.dataValidation = {
               type: 'list',
               allowBlank: true,
               formulae: ['"Active,Inactive"']
           };
        }
    }

    if (activeTab === 'accounts') {
        let groups: any[] = [];
        try {
            const groupsRes = await fetch(`/api/v1/data/AccountGroups`);
            if (groupsRes?.ok) {
                const groupsData = await groupsRes.json();
                const companyId = activeCompany?.id || '';
                groups = groupsData.filter((g: any) => g.IsDefault === 1 || String(g.CompanyId) === String(companyId));
            }
        } catch (e) {
            console.error('Error fetching account groups', e);
        }
        
        const groupNames = groups.map(g => g.GroupName).filter(Boolean).join(',');
        
        for (let i = 2; i <= 1000; i++) {
            const groupCell = sheet.getCell(`C${i}`); // AccountGroup (Index 3 -> C)
            if (groupNames) {
                // Ensure formula string isn't too long (Excel limit is ~255 chars for lists).
                // If it's too long, better not to validate or chunk it, but standard group names are few.
                if (groupNames.length < 255) {
                   groupCell.dataValidation = {
                       type: 'list',
                       allowBlank: true,
                       formulae: [`"${groupNames}"`]
                   };
                }
            }

            const typeCell = sheet.getCell(`E${i}`); // AccountType (Index 5 -> E)
            typeCell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"Asset,Liability,Equity,Revenue,Expense"']
            };

            const balTypeCell = sheet.getCell(`G${i}`); // BalanceType (Index 7 -> G)
            balTypeCell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"Dr,Cr"']
            };

            const statusCell = sheet.getCell(`H${i}`); // Status (Index 8 -> H)
            statusCell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"Active,Inactive"']
            };
        }
    }

    // Add Instructions Sheet
    const getInstructions = (tab: TabType) => {
        switch (tab) {
            case 'products':
                return [
                    ['Column Name', 'Valid Values / Instructions'],
                    ['Category', 'Seeds, Fertilizers, Pesticides, Machinery, Services'],
                    ['Location', 'Select from dropdown'],
                    ['IsSalesItem', 'Yes, No'],
                    ['Status', 'Active, Inactive']
                ];
            case 'accounts':
                return [
                    ['Column Name', 'Valid Values / Instructions'],
                    ['AccountGroup', 'Select from dropdown'],
                    ['AccountType', 'Asset, Liability, Equity, Revenue, Expense'],
                    ['BalanceType', 'Dr, Cr'],
                    ['Status', 'Active, Inactive']
                ];
            case 'members':
                return [
                    ['Column Name', 'Valid Values / Instructions'],
                    ['Gender', 'Male, Female, Other'],
                    ['DOB', 'Format: YYYY-MM-DD or DD/MM/YYYY'],
                ];
            default:
                return [['Instructions'], ['Please fill data starting from Row 2 matching the headers exactly.']];
        }
    };

    getInstructions(activeTab).forEach(row => instructionsSheet.addRow(row));
    instructionsSheet.getColumn(1).width = 30;
    instructionsSheet.getColumn(2).width = 60;
    instructionsSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${config.title}_Template.xlsx`);
  };

  const resetState = () => {
    setUploadState({
      file: null,
      data: [],
      preview: [],
      headers: [],
      status: 'idle',
      progress: 0,
      message: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState(prev => ({ ...prev, status: 'parsing', file, message: 'Parsing file...' }));

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (jsonData.length < 2) {
           setUploadState(prev => ({ ...prev, status: 'error', message: 'File is empty or contains only headers.' }));
           return;
        }

        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1).filter((row: any) => row.length > 0 && row.some((cell: any) => cell !== undefined && cell !== ''));
        
        // Basic required field validation based on tab
        const getRequiredFields = (tab: TabType) => {
            switch(tab) {
                case 'customers': return ['CustomerName'];
                case 'vendors': return ['Vendor_NAME'];
                case 'members': return ['MemberName'];
                case 'products': return ['ItemName'];
                case 'accounts': return ['AccountName', 'AccountGroup'];
                default: return [];
            }
        };

        const config = tabConfig[activeTab];
        let existingRecords: any[] = [];
        try {
            const tablePath = config.table === 'Accounts' ? '/api/v1/data/Accounts' : `/api/data/${config.table}`;
            const queryParam = activeCompany?.id ? `?CompanyId=${activeCompany.id}` : '';
            const res = await fetch(`${tablePath}${queryParam}`);
            if (res.ok) {
                existingRecords = await res.json();
            }
        } catch (e) {
            console.error('Failed to fetch existing records for duplicates check', e);
        }

        const getNameField = (tab: TabType) => {
             switch(tab) {
                 case 'customers': return 'CustomerName';
                 case 'vendors': return 'Vendor_NAME';
                 case 'members': return 'FarmerName';
                 case 'products': return 'Name';
                 case 'accounts': return 'Name';
                 default: return 'Name';
             }
         };

        const reqFields = getRequiredFields(activeTab);
        const nameField = getNameField(activeTab);
        const uploadNameField = reqFields[0]; // Assuming first required field is the name
        
        let hasInvalid = false;
        const seenNames = new Set<string>();

        const mappedData = dataRows.map((row: any) => {
          const obj: any = {};
          headers.forEach((header, index) => {
             obj[header] = row[index];
             // Support uppercase variations
             const upperHeader = header?.toUpperCase();
             if (upperHeader === 'ITEMNAME') obj['ItemName'] = row[index];
             if (upperHeader === 'CUSTOMERNAME') obj['CustomerName'] = row[index];
             if (upperHeader === 'VENDOR_NAME' || upperHeader === 'VENDORNAME') obj['Vendor_NAME'] = row[index];
             if (upperHeader === 'MEMBERNAME' || upperHeader === 'FARMERNAME') obj['MemberName'] = row[index];
             if (upperHeader === 'ACCOUNTNAME') obj['AccountName'] = row[index];
             if (upperHeader === 'ACCOUNTGROUP') obj['AccountGroup'] = row[index];
          });
          
          let isValid = true;
          let errors: string[] = [];
          reqFields.forEach(field => {
             if (!obj[field]) {
                 isValid = false;
                 errors.push(`Missing ${field}`);
             }
          });

          // Duplicate check
          const rowName = obj[uploadNameField]?.toString()?.trim();
          if (rowName) {
              const lowerName = rowName.toLowerCase();
              if (seenNames.has(lowerName)) {
                  isValid = false;
                  errors.push('Duplicate row in file');
              } else {
                  seenNames.add(lowerName);
              }

              // Check DB
              const exists = existingRecords.some((r: any) => {
                  let dbName = r[nameField];
                  if (!dbName && activeTab === 'products') dbName = r.Name || r.name || r.ItemName || r.itemname || r.ITEMNAME || r.ProductName || r.productname;
                  if (!dbName && activeTab === 'customers') dbName = r['customername'];
                  if (!dbName && activeTab === 'vendors') dbName = r['vendor_name'] || r['vendorname'];
                  if (!dbName && activeTab === 'accounts') dbName = r['AccountName'] || r['accountname'];
                  if (!dbName && activeTab === 'members') dbName = r['MemberName'] || r['membername'] || r['farmername'] || r['FarmerName'];
                  return dbName?.toString()?.trim()?.toLowerCase() === lowerName;
              });
              if (exists) {
                  isValid = false;
                  errors.push('Already exists in database');
              }
          }

          if (!isValid) hasInvalid = true;

          return { ...obj, _isValid: isValid, _errors: errors };
        });

        // Ensure headers includes Error column
        const finalHeaders = [...headers];
        if (!finalHeaders.includes('Error')) {
           finalHeaders.push('Error');
        }

        const finalMappedData = mappedData.map(obj => {
           if (!obj._isValid) {
               return { ...obj, Error: obj._errors?.join(', ') };
           }
           return obj;
        });

        setUploadState({
          file,
          data: finalMappedData,
          preview: finalMappedData.slice(0, 5),
          headers: finalHeaders,
          status: 'ready',
          progress: 0,
          message: hasInvalid 
             ? `Parsed ${finalMappedData.length} records. Some records have errors and will be skipped.` 
             : `Successfully parsed ${finalMappedData.length} records.`
        });

      } catch (err) {
        console.error(err);
        setUploadState(prev => ({ ...prev, status: 'error', message: 'Failed to parse Excel file. Ensure it is a valid .xlsx file.' }));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (uploadState.data.length === 0) return;
    
    setUploadState(prev => ({ ...prev, status: 'uploading', progress: 0, message: 'Uploading data...' }));
    
    const config = tabConfig[activeTab];
    const total = uploadState.data.length;
    let successCount = 0;
    let errorCount = 0;

    let locationsList: any[] = [];
    if (activeTab === 'products' && activeCompany?.id) {
        try {
           const locRes = await fetch(`/api/data/locations?CompanyId=${activeCompany.id}`);
           if (locRes.ok) {
              const locData = await locRes.json();
              if (Array.isArray(locData)) locationsList = locData;
           }
        } catch (e) {
           console.error('Failed to fetch locations for mapping', e);
        }
    }

    for (let i = 0; i < total; i++) {
        const record = uploadState.data[i];
        
        if (record._isValid === false) {
             errorCount++;
             const progress = Math.round(((i + 1) / total) * 100);
             setUploadState(prev => ({ ...prev, progress }));
             continue; // Skip invalid records
        }

        // Remove internal properties before submitting
        const { _isValid, _errors, Error, ...cleanRecord } = record;
        
        const payload: any = {
           ...cleanRecord,
           CompanyId: activeCompany?.id || 1,
        }

        if (activeTab === 'members' && payload.MemberName) {
            payload.FarmerName = payload.MemberName;
        }

        if (activeTab === 'accounts' && payload.AccountName) {
            payload.Name = payload.AccountName;
        }

        // Wait, AccountGroup is correctly mapped because the field is AccountGroup. So we don't need GroupId mapping.
        // BalanceType is also BalanceType in the template. We don't need OpeningBalanceType mapping either.
        
        if (activeTab === 'products') {
            if (payload.ItemName) {
                payload.Name = payload.ItemName;
                delete payload.ItemName;
            }
            if (payload.Category) {
                payload.Type = payload.Category;
                // do not delete Category so it can also be saved to Category column if schema has it, but map to Type as well just in case. Wait, if schema has Category, it's fine.
            }
            if (payload.Location) {
                const locObj = locationsList.find(l => (l.Name || `Location ${l.id}`) === payload.Location);
                if (locObj) {
                    payload.Location = locObj.Id || locObj.id;
                }
            }
            if (!payload.ItemCode) {
               payload.ItemCode = `ITM-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
            }
            if (payload.SellingPriceMembers) {
               payload.UnitPrice = payload.SellingPriceMembers;
            }
        }

        try {
            const res = await fetch(`/api/data/${config.table}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Upload failed for record:", cleanRecord, errData);
                throw new Error("API returned non-OK status");
            }
            successCount++;
        } catch (e) {
            console.error("Failed to upload record", cleanRecord, e);
            errorCount++;
        }

        setUploadState(prev => ({ 
            ...prev, 
            progress: Math.round(((i + 1) / total) * 100) 
        }));
    }

    setUploadState(prev => ({
        ...prev,
        status: 'success',
        message: `Upload complete. Successfully uploaded ${successCount} records${errorCount > 0 ? ` (${errorCount} failed or skipped)` : ''}.`
    }));
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col min-h-0 bg-gray-50 h-full overflow-y-auto custom-scrollbar">
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 flex-shrink-0">
         <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                 <h1 className="text-2xl flex items-center font-bold text-gray-900 tracking-tight gap-2">
                     <Upload className="w-6 h-6 text-blue-600" />
                     {t('bulkUpload.title') || 'Bulk Data Upload'}
                 </h1>
                 <p className="text-sm text-gray-500 mt-1">Import master data in batches using excel templates.</p>
             </div>
             <div className="text-right hidden sm:block">
                 <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">SELECTED COMPANY</div>
                 <div className="text-sm font-medium text-blue-600 truncate max-w-[200px]" title={activeCompany?.name}>{activeCompany?.name || 'All Companies'}</div>
             </div>
         </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-[500px]">
           <div className="border-b border-gray-200 overflow-x-auto custom-scrollbar flex-shrink-0">
               <div className="flex w-max min-w-full px-2">
                   {(Object.keys(tabConfig) as TabType[]).map((tab) => (
                       <button
                           key={tab}
                           onClick={() => { setActiveTab(tab); resetState(); }}
                           className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                               activeTab === tab
                                   ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                           }`}
                       >
                           {tabConfig[tab].title}
                       </button>
                   ))}
               </div>
           </div>

           <div className="p-6 flex-1 flex flex-col">
               <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-start gap-4">
                   <div className="bg-white p-2 rounded shadow-sm border border-blue-200 shrink-0">
                       <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                   </div>
                   <div className="flex-1 min-w-0">
                       <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-1">INSTRUCTIONS FOR {tabConfig[activeTab].title.toUpperCase()}</h3>
                       <p className="text-sm text-blue-800 mb-2">Bulk upload {tabConfig[activeTab].title.toLowerCase()} records by filling out the provided template.</p>
                       <button 
                           onClick={handleDownloadTemplate}
                           className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                       >
                           <Download className="w-4 h-4" />
                           Download Template (.xlsx)
                       </button>
                   </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                   <div className="flex flex-col h-full">
                       <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SELECT EXCEL FILE</span>
                           {uploadState.file && (
                               <button onClick={resetState} className="text-xs text-gray-500 hover:text-gray-700 flex flex-row items-center gap-1">
                                    <X className="w-3 h-3" /> RESET
                               </button>
                           )}
                       </div>
                       <label className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all min-h-[250px] ${
                           uploadState.file 
                             ? 'border-blue-300 bg-blue-50' 
                             : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400 cursor-pointer'
                       }`}>
                           {!uploadState.file ? (
                               <>
                                   <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-200 mb-4">
                                       <Upload className="w-6 h-6 text-gray-400" />
                                   </div>
                                   <span className="text-gray-900 font-medium font-sans">Click to Browse File</span>
                                   <span className="text-gray-500 text-xs mt-2 uppercase tracking-wide">SUPPORTS .XLSX FORMATS</span>
                                   <input 
                                       type="file" 
                                       className="hidden" 
                                       accept=".xlsx, .xls"
                                       onChange={handleFileChange}
                                       ref={fileInputRef}
                                   />
                               </>
                           ) : (
                               <>
                                   <FileSpreadsheet className="w-10 h-10 text-blue-500 mb-3" />
                                   <span className="text-gray-900 font-medium text-center break-all">{uploadState.file.name}</span>
                                   <span className="text-gray-500 text-sm mt-1">{(uploadState.file.size / 1024).toFixed(2)} KB</span>
                                   {uploadState.status === 'success' && (
                                       <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                           <Check className="w-4 h-4" /> Uploaded Successfully
                                       </span>
                                   )}
                               </>
                           )}
                       </label>
                   </div>

                   <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
                       <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0">
                           <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                               PREVIEW DATA ({uploadState.data.length} ROWS)
                           </span>
                       </div>
                       <div className="flex-1 overflow-auto custom-scrollbar p-0">
                           {uploadState.data.length === 0 ? (
                               <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                   No data to preview
                               </div>
                           ) : (
                               <table className="min-w-full divide-y divide-gray-200 text-sm whitespace-nowrap">
                                   <thead className="bg-gray-50 sticky top-0">
                                       <tr>
                                           <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-12 border-r border-gray-200">#</th>
                                           {uploadState.headers.map(h => (
                                               <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                           ))}
                                       </tr>
                                   </thead>
                                   <tbody className="bg-white divide-y divide-gray-200">
                                       {uploadState.preview.map((row, i) => (
                                           <tr key={i} className={`hover:bg-gray-50 ${row._isValid === false ? 'bg-red-50/50' : ''}`}>
                                              <td className="px-4 py-2 text-gray-500 border-r border-gray-200">
                                                  {i + 1}
                                                  {row._isValid === false && (
                                                      <span title={row._errors?.join(', ')}><AlertCircle className="w-3 h-3 text-red-500 inline-block ml-1" /></span>
                                                  )}
                                              </td>
                                              {uploadState.headers.map(h => (
                                                  <td key={h} className={`px-4 py-2 max-w-[150px] truncate ${row._isValid === false ? 'text-red-900' : 'text-gray-900'}`} title={row[h]}>{row[h] || '-'}</td>
                                              ))}
                                           </tr>
                                       ))}
                                       {uploadState.data.length > 5 && (
                                           <tr>
                                               <td colSpan={uploadState.headers.length + 1} className="px-4 py-3 text-center text-gray-500 text-xs italic bg-gray-50">
                                                   ... and {uploadState.data.length - 5} more rows
                                               </td>
                                           </tr>
                                       )}
                                   </tbody>
                               </table>
                           )}
                       </div>
                       
                       <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
                           {uploadState.status === 'error' && (
                               <div className="mb-3 text-red-600 text-sm flex items-center gap-1.5">
                                   <AlertCircle className="w-4 h-4" /> {uploadState.message}
                               </div>
                           )}

                           {uploadState.status === 'ready' && uploadState.message.includes('errors') && (
                               <div className="mb-3 text-amber-600 text-sm flex items-center gap-1.5">
                                   <AlertCircle className="w-4 h-4" /> {uploadState.message}
                               </div>
                           )}
                           
                           {['uploading', 'success'].includes(uploadState.status) && (
                               <div className="mb-3">
                                   <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                                       <span>Upload Progress</span>
                                       <span>{uploadState.progress}%</span>
                                   </div>
                                   <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full transition-all duration-300 ${uploadState.status === 'success' ? 'bg-green-500' : 'bg-blue-600'}`} 
                                          style={{ width: `${uploadState.progress}%` }}
                                       ></div>
                                   </div>
                                   <div className="text-xs text-gray-500 mt-1">{uploadState.message}</div>
                               </div>
                           )}

                           <button 
                               onClick={handleUpload}
                               disabled={uploadState.data.length === 0 || ['uploading', 'success'].includes(uploadState.status)}
                               className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-lg shadow-sm transition-colors text-sm"
                           >
                              <Upload className="w-4 h-4" />
                              {uploadState.status === 'uploading' ? 'UPLOADING...' : uploadState.status === 'success' ? 'UPLOAD COMPLETE' : 'UPLOAD'}
                           </button>
                           {uploadState.status === 'ready' && (
                               <div className="text-center text-[10px] uppercase text-gray-400 mt-2 font-semibold tracking-wide">DOUBLE-CHECK DATA BEFORE UPLOADING</div>
                           )}
                       </div>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
}
