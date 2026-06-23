import React, { useState } from 'react';
import { BookOpen, Download, HardDrive, FileText, FileSpreadsheet, Building2, TrendingUp, Users, Wrench, Package, Info, FileBarChart } from 'lucide-react';

const ColumnDetail = ({ name, desc }: { name: string, desc: string }) => (
  <div className="flex border-b last:border-0 border-slate-100 py-3">
    <div className="w-1/3 font-semibold text-slate-700 pr-4">{name}</div>
    <div className="w-2/3 text-slate-600 text-sm leading-relaxed">{desc}</div>
  </div>
);

const FormSection = ({ title, desc, children, imagePlaceholder }: any) => (
  <div className="mt-8 mb-12 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
    <div className="p-6 border-b border-slate-100">
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{desc}</p>
    </div>
    
    <div className="bg-[#e2e8f0] border-b border-[#8faad8] p-8 flex justify-center print:hidden">
      {/* Mock Form UI to simulate an actual screenshot themed like Company Master */}
      <div className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-xl w-full max-w-3xl overflow-hidden transform transition-all hover:scale-[1.01]">
        
        {/* Green Title Header */}
        <div className="bg-[#0b8a1c] text-white py-2 px-4 border-b border-blue-900 text-center font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2">
          {title.toUpperCase()}
        </div>

        {/* Outer Excel-like grid border layer */}
        <div className="p-0.5 bg-[#8faad8] flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 divide-[#8faad8]">
            <div className="flex flex-col">
              {React.Children.map(children, (child: any, index: number) => {
                 if (index % 2 !== 0) return null; // Handle left column
                 const label = child?.props?.name?.replace(' *', '') || 'Field';
                 const isFullWidth = label?.includes('Matrix') || label?.includes('Journal Lines') || label?.includes('Line Items');
                 return (
                   <div className={`grid grid-cols-3 border-b border-blue-900 min-h-[40px] items-stretch ${isFullWidth ? 'col-span-2' : ''}`}>
                     <div className="bg-[#f1f5f9] px-3 py-2 flex items-center font-bold text-[#1e293b] text-[10px] sm:col-span-1 border-r border-[#8faad8]">
                       {label} {child?.props?.name?.includes('*') && <span className="text-red-500 ml-1">*</span>}
                     </div>
                     <div className="bg-[#f1f5f9] p-1 sm:col-span-2 flex items-center">
                       <div className="w-full h-6 border border-[#8faad8] rounded bg-[#f4fbf4] opacity-70"></div>
                     </div>
                   </div>
                 );
              })}
            </div>
            <div className="flex flex-col">
              {React.Children.map(children, (child: any, index: number) => {
                 if (index % 2 === 0) return null; // Handle right column
                 const label = child?.props?.name?.replace(' *', '') || 'Field';
                 const isFullWidth = label?.includes('Matrix') || label?.includes('Journal Lines') || label?.includes('Line Items');
                 if (isFullWidth) return null;
                 return (
                   <div className="grid grid-cols-3 border-b border-blue-900 min-h-[40px] items-stretch">
                     <div className="bg-[#f1f5f9] px-3 py-2 flex items-center font-bold text-[#1e293b] text-[10px] sm:col-span-1 border-r border-[#8faad8]">
                       {label} {child?.props?.name?.includes('*') && <span className="text-red-500 ml-1">*</span>}
                     </div>
                     <div className="bg-[#f1f5f9] p-1 sm:col-span-2 flex items-center">
                       <div className="w-full h-6 border border-[#8faad8] rounded bg-[#f4fbf4] opacity-70"></div>
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white text-sm">
      <div className="bg-slate-50 border-b border-slate-200 p-3 px-6">
        <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Field & Column Specifications</h4>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

// Define chapters
const chapters = [
  {
    id: 'intro',
    title: '1. Dashboard & Navigation',
    icon: TrendingUp,
    desc: 'Overview of the enterprise hub and navigation sidebar.'
  },
  {
    id: 'master',
    title: '2. Master Data Subsystems',
    icon: HardDrive,
    desc: 'Company Details, Customers, Vendors, and item masters.'
  },
  {
    id: 'fpc',
    title: '3. FPC Management',
    icon: Users,
    desc: 'Farmer Producer Company shareholder and loan tracking.'
  },
  {
    id: 'purchases',
    title: '4. Purchases & Procurement',
    icon: FileSpreadsheet,
    desc: 'Purchase Orders, Invoices, and Returns processing.'
  },
  {
    id: 'sales',
    title: '5. Sales & Distribution',
    icon: FileText,
    desc: 'Sales Quotations, Orders, Invoices, and Returns.'
  },
  {
    id: 'inventory',
    title: '6. Inventory & Assets',
    icon: Package,
    desc: 'Stock Adjustments, Locations, and Fixed Asset Register.'
  },
  {
    id: 'accounting',
    title: '7. Accounting & Vouchers',
    icon: Building2,
    desc: 'Journal Entries, Cash & Bank Payment/Receipt Vouchers.'
  },
  {
    id: 'etracker',
    title: '8. System E-Tracker',
    icon: Wrench,
    desc: 'Internal ticketing for operational or IT diagnostics.'
  },
  {
    id: 'reports',
    title: '9. MIS & Reports',
    icon: FileBarChart,
    desc: 'Comprehensive ledgers, registers, and analytical exports.'
  }
];

export function UserManual() {
  const [activeChapter, setActiveChapter] = useState('intro');

  return (
    <div className="flex flex-col h-full bg-slate-50 print:bg-white overflow-hidden">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white border-b border-slate-200 px-8 py-4 print:hidden shrink-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            USER MANUAL
          </h1>
          <p className="text-slate-500 text-xs font-semibold tracking-wider uppercase mt-1">ERP End-To-End Workflow & Controls Overview</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar (Chapters) */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden overflow-y-auto custom-scrollbar">
          <div className="p-6 pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Chapters</span>
            <p className="text-slate-500 text-xs pl-1 mt-1 mb-4">Select a folder to view the user guide</p>
          </div>
          
          <div className="px-4 pb-6 space-y-2">
            {chapters.map(chap => (
              <button
                key={chap.id}
                onClick={() => setActiveChapter(chap.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  activeChapter === chap.id
                    ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                    : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`font-semibold text-sm mb-1 ${activeChapter === chap.id ? 'text-blue-700' : 'text-slate-700'}`}>
                  {chap.title}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed truncate">{chap.desc}</div>
              </button>
            ))}
          </div>

          <div className="mt-auto p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 font-semibold text-xs uppercase tracking-wider mb-3">
              <Info className="w-4 h-4 text-blue-600" />
              General Help
            </div>
            <button
              onClick={() => window.print()}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Full PDF
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 print:bg-white p-8 print:p-0">
          
          <div className="max-w-4xl mx-auto pb-24 print:pb-0" id="manual-content">
            
            {/* Action Bar for Section */}
            <div className="flex justify-between items-center mb-8 print:hidden">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded tracking-wider uppercase">Active Section</span>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => alert("Word download requires backend PDF/DOCX renderer. Use PDF for now.")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Download Word (DOC)
                </button>
              </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:flex flex-col items-center justify-center min-h-[400px] text-center border-b-2 border-slate-800 mb-12">
              <BookOpen className="w-20 h-20 text-blue-800 mb-6" />
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">Master Operations Manual</h1>
              <h2 className="text-xl text-slate-600 font-medium tracking-wide">Enterprise Resource Planning System</h2>
              <div className="mt-16 space-y-2">
                <p className="text-slate-500 font-mono text-xs">Generated on: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-white print:bg-transparent rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:max-w-full">
              
              {/* CONTENT SECTIONS */}
              
              <div className={activeChapter === 'intro' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-600 print:hidden" /> 1. Dashboard & Navigation
                  </h2>
                  <p className="text-slate-600 text-justify mb-6 leading-relaxed">
                    The primary workspace interface serves as the central hub of operations. It grants immediate visibility into real-time transactional metrics, pending approvals, and ledger balances. The lateral navigation sidebar establishes immediate access points across all configured business units spanning Master Data, Inventory, Accounting, and Operational tracking modules.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                    <h4 className="font-bold text-blue-900 mb-2">Key Highlights</h4>
                    <ul className="list-disc pl-5 space-y-2 text-blue-800 text-sm">
                      <li>Real-time financial summaries including Payables and Receivables.</li>
                      <li>Quick-launch action buttons directly initiating invoices and vouchers.</li>
                      <li>Responsive sidebar that adapts to user roles and privileges.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className={activeChapter === 'master' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <HardDrive className="w-8 h-8 text-green-600 print:hidden" /> 2. Master Data Subsystems
                  </h2>

                  <FormSection title="Company Details Master" desc="Establishes root enterprise identity ensuring standardized statutory reporting outputs." imagePlaceholder="Company Details">
                    <ColumnDetail name="Company Name *" desc="The legally registered business title exactly as it appears on incorporation certificates." />
                    <ColumnDetail name="Contact Person / Phone No / E-mail ID" desc="Primary operational communication channels representing the enterprise." />
                    <ColumnDetail name="Address, City, State" desc="Registered corporate headquarters or billing locale." />
                    <ColumnDetail name="Registration No / CIN No." desc="Enterprise Corporate Identity Number alongside basic registration indices." />
                    <ColumnDetail name="GSTIN / PAN / TAN" desc="Crucial taxation vectors. GSTIN drives compliance logs while PAN connects income tax tracking layers." />
                    <ColumnDetail name="Bank Details (Account Type, No, IFSC)" desc="Default institutional banking channels utilized globally across the ERP's payment routing." />
                  </FormSection>

                  <FormSection title="Customer Details (Add New Customer)" desc="Registers trading partners engaging in receivables. Configures credit boundaries and taxation protocols." imagePlaceholder="Add New Customer">
                    <ColumnDetail name="Customer Name & Contact Person *" desc="Official debtor identity and their designated human access point." />
                    <ColumnDetail name="Place / Address" desc="Physical delivery coordination constraints and invoicing destinations." />
                    <ColumnDetail name="Opening Balance" desc="Initial debt valuation carried forward from legacy ERPs to assure ledger continuity." />
                    <ColumnDetail name="GSTIN / PAN / TAN / CIN" desc="Complete statutory mapping. Validating GSTIN dictates interstate vs intrastate transactional logic." />
                  </FormSection>

                  <FormSection title="Item Details (Add Item Master)" desc="The definitive inventory SKU configurator establishing costing methodologies, classifications, and tax applicability." imagePlaceholder="Add Item Master">
                    <ColumnDetail name="Item Name & Category *" desc="The recognized operational designation organized inside macro groups (e.g. 'Seeds', 'Hardware')." />
                    <ColumnDetail name="Measurement Unit (UOM)" desc="Defines quantifiable handling methodologies (e.g., kg, liters, units) critical for valuation." />
                    <ColumnDetail name="Buying & Selling Prices" desc="Distinguishes standard consumer tiers against specified FPC Member discounted models alongside standardized supplier procurement value thresholds." />
                    <ColumnDetail name="S.G.S.T / C.G.S.T / I.G.S.T (%)" desc="Granular embedded state and central taxation percentages overriding global settings." />
                    <ColumnDetail name="HSN Code / SAC No." desc="Mandatory Harmonized System classification ensuring statutory alignment on invoices." />
                  </FormSection>
                </div>
              </div>

              <div className={activeChapter === 'fpc' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <Users className="w-8 h-8 text-indigo-600 print:hidden" /> 3. FPC Management
                  </h2>

                  <FormSection title="FPC Member Registration" desc="Binds specialized farmer identities with operational frameworks encompassing agriculture-specific tracking indices." imagePlaceholder="FPC Member Registration">
                    <ColumnDetail name="Full Name / Father-Husband Name *" desc="Establishing official shareholder linkage and domestic identity tracking." />
                    <ColumnDetail name="Address (Tehsil / District / Panchayat)" desc="Micro-geographical regional tagging authorizing zone-based agriculture subsidy algorithms." />
                    <ColumnDetail name="Land Holding (Acres) / Irrigation Type" desc="Critical operational intelligence dictating expected crop yields based on farming capacities and water sourcing methods." />
                    <ColumnDetail name="Allocated Shares / Face Value" desc="Quantifies root capitalization and equity issuance assigned upon onboarding." />
                  </FormSection>

                  <FormSection title="Loan Management (Issue New Loan)" desc="Operates internal localized micro-asset frameworks financing agricultural operations for validated members." imagePlaceholder="Issue New Loan">
                    <ColumnDetail name="Member / Farmer *" desc="Maps liability allocations connecting directly against previous equity allocations." />
                    <ColumnDetail name="Principal / Annual Rate (%) *" desc="Core financial physics delineating expected returns mapped against structural tenures." />
                    <ColumnDetail name="Tenure (Months) *" desc="Determines projected liquidity return cycles dictating corporate working capital expectations." />
                    <ColumnDetail name="Total Interest / Grand Total" desc="Read-only computed analytics projecting absolute final return requirements." />
                  </FormSection>
                </div>
              </div>

              <div className={activeChapter === 'purchases' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-cyan-600 print:hidden" /> 4. Purchases & Procurement
                  </h2>
                  
                  <FormSection title="Purchase Orders (Create PO)" desc="Official documentation formally demanding specified provisioning from partnered vendors under structured parameters." imagePlaceholder="Create Purchase Order">
                    <ColumnDetail name="Vendor Name / PO Date *" desc="Vendor selector activating dynamic term inheritance and date of issuance." />
                    <ColumnDetail name="Line Items (Item / Qty / Rate / GST%)" desc="The core requirement grid. Calculates Subtotal valuations, injects accurate tax derivations based on HSN, and computes absolute net burdens." />
                    <ColumnDetail name="Terms & Conditions" desc="Selectable boilerplate ensuring legal coverage surrounding damage thresholds and supply contingencies." />
                  </FormSection>

                  <FormSection title="Purchase Invoices (Book Bill)" desc="Acknowledges logistical completion and converts projected intents into concrete accounts payable debt pools." imagePlaceholder="Book Purchase Invoice">
                    <ColumnDetail name="Vendor Name / Bill Date *" desc="Matches incoming invoices against active supplier agreements establishing the liability." />
                    <ColumnDetail name="Vendor Bill No *" desc="Ensuring audit linkage avoiding duplicate liability entry frameworks." />
                    <ColumnDetail name="Line Items (Moisture % / Location / QTY)" desc="Unique agricultural addition capturing product quality metrics while routing inbound verified stock directly into targeted geographical sites." />
                    <ColumnDetail name="Taxable Subtotal / GST Outflow" desc="Strict financial derivation driving input tax credit ledgers." />
                  </FormSection>
                </div>
              </div>

              <div className={activeChapter === 'sales' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-emerald-600 print:hidden" /> 5. Sales & Distribution
                  </h2>

                  <FormSection title="Sales Orders" desc="Hardens estimated quotations into reserved inventory requirements locking future dispatches." imagePlaceholder="Create Sales Order">
                    <ColumnDetail name="Customer / Order Date *" desc="Authorized operational locking mechanisms originating confirmed consumer intent." />
                    <ColumnDetail name="Expected Delivery *" desc="SLA target pushing internal logistics subsystems to prepare stock transfers securely." />
                    <ColumnDetail name="Terms & Conditions" desc="Standardized consumer expectations limiting corporate liability across transportation and payments." />
                  </FormSection>

                  <FormSection title="Sales Invoices" desc="The ultimate revenue validation trigger; executes permanent ledger accruals and physically reduces stock indices." imagePlaceholder="Create Sales Invoice">
                    <ColumnDetail name="Customer / Invoice Date *" desc="Records the taxable transfer moment immediately pushing Accounts Receivable." />
                    <ColumnDetail name="Payment Terms" desc="Calculates age analysis triggering automated collection workflows based on predefined netting delays." />
                    <ColumnDetail name="Line Items (Location / Supplier / Qty)" desc="Extracts physical commodities from mapped origins, identifies supplier origins (traceability), and applies finalized pricing grids securing revenue baselines." />
                  </FormSection>
                </div>
              </div>

              <div className={activeChapter === 'inventory' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <Package className="w-8 h-8 text-amber-600 print:hidden" /> 6. Inventory & Stock Ledger
                  </h2>

                  <FormSection title="Stock Adjustments" desc="Enforces reconciliation between physical counts and database expectations managing absolute variance." imagePlaceholder="Stock Adjustment">
                    <ColumnDetail name="Adjustment Date / Type *" desc="Determines whether variance is treated as inbound capital additions or operational write-offs." />
                    <ColumnDetail name="Reason / Ref" desc="Auditable justification indicating environmental losses, misplacements, or count errors." />
                    <ColumnDetail name="Affected Items (Current Qty / New Qty / Diff)" desc="Visualized computational matrix exposing immediately the volume of alteration bypassing manual calculations." />
                  </FormSection>

                  <FormSection title="Asset Register" desc="Monitors capitalized corporate acquisitions defining depreciation behaviors and physical deployments." imagePlaceholder="Add Asset">
                    <ColumnDetail name="Asset Name / Category *" desc="Organizational grouping mechanisms classifying massive infrastructures distinctively." />
                    <ColumnDetail name="Purchase Date & Cost *" desc="Sets the temporal and financial baseline requisite for complex taxation scheduling." />
                    <ColumnDetail name="Depr. Method & Rate (%)" desc="Ensures automated compliance governing capital erosion methodologies (Written Down Value vs Straight Line Method)." />
                  </FormSection>
                </div>
              </div>

              <div className={activeChapter === 'accounting' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-rose-600 print:hidden" /> 7. Accounting & Vouchers
                  </h2>

                  <FormSection title="Journal Entries" desc="Direct multi-line double entry interactions accommodating advanced financial resolutions not covered by pure invoicing." imagePlaceholder="Journal Entry">
                    <ColumnDetail name="Date / Reference No *" desc="Anchors the event chronology against verifiable physical paperwork trails." />
                    <ColumnDetail name="Journal Lines (Account / Debit / Credit) *" desc="Absolute raw transactional framing requiring stringent adherence to accounting equations strictly forbidding zero-sum imbalances prior to post." />
                  </FormSection>

                  <FormSection title="Cash & Bank Vouchers" desc="Drives outflows/inflows targeting generalized organizational expenditures or liability settlements." imagePlaceholder="Payment / Receipt Voucher">
                    <ColumnDetail name="Voucher Date / Sequence No. *" desc="Formal audit sequencing isolating independent transactional paths." />
                    <ColumnDetail name="Credit/Debit Accounts *" desc="Maps liquidity origins against targeted generalized sub-banks or standard physical vaults." />
                    <ColumnDetail name="Amount / Narration" desc="Defines scope alongside intricate detailing explaining routing validations." />
                  </FormSection>
                </div>
              </div>

              <div className={activeChapter === 'etracker' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <Wrench className="w-8 h-8 text-purple-600 print:hidden" /> 8. System E-Tracker
                  </h2>

                  <FormSection title="Issue Logging & Tracking" desc="Maintains centralized internal accountability regulating IT or Operational malfunction statuses." imagePlaceholder="Dynamic Ticket">
                    <ColumnDetail name="Issue Title / Summary *" desc="High-visibility descriptors enabling rapid triage environments." />
                    <ColumnDetail name="Detailed Description" desc="Detailing environment realities allowing designated resolver teams efficient intervention frameworks." />
                    <ColumnDetail name="Responsible Department / Assigned To" desc="Routes accountability workflows directly towards specialized resolution personnel." />
                    <ColumnDetail name="Priority / Status Phase" desc="Controls SLA mapping and regulates execution hierarchy." />
                  </FormSection>
                </div>
              </div>

              <div className={activeChapter === 'reports' ? 'block' : 'hidden print:block'}>
                <div className="p-8 md:p-10 print:p-0 print:break-after-page">
                  <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 flex items-center gap-3">
                    <FileBarChart className="w-8 h-8 text-indigo-600 print:hidden" /> 9. MIS & Reports
                  </h2>
                  <p className="text-slate-600 text-justify mb-6 leading-relaxed">
                    The MIS (Management Information System) and Reports module provides comprehensive operational analytics, financial statements, and regulatory exporting tools. It is designed to track organizational health, perform complex reconciliations, and output data into standardized printable formats.
                  </p>

                  <FormSection title="Financial Statements & General Ledger" desc="Crucial accounting outputs providing end-of-period financial snapshots and transactional histories." imagePlaceholder="General Ledger Report">
                    <ColumnDetail name="Ledger Name / Account Group" desc="Select specific accounts or groups (e.g. Indirect Expenses) to view summarized debits and credits." />
                    <ColumnDetail name="Date Range Selection" desc="Restricts report querying within precise Start and End boundaries." />
                    <ColumnDetail name="Trial Balance" desc="Aggregated listing of all ledger balances (Debits vs Credits) ensuring mathematical parity across the Chart of Accounts." />
                    <ColumnDetail name="Profit & Loss / Balance Sheet" desc="Finalized financial health matrices exporting standardized fiscal reporting for auditors." />
                  </FormSection>

                  <FormSection title="Inventory & Stock Summaries" desc="Exhaustive views detailing raw logistics, supply chain efficiency, and valuation." imagePlaceholder="Stock Summary Report">
                    <ColumnDetail name="Stock Ledger" desc="Chronological view of all inbound capabilities (purchases/returns) versus outbound drain (sales/discards) for specific SKUs." />
                    <ColumnDetail name="Location-Wise Stock Registry" desc="Filter total current quantities segmented physically across differing warehouses." />
                    <ColumnDetail name="Valuation Methods" desc="Identifies current absolute liquid value of held stock utilizing weighted average or FIFO calculations." />
                  </FormSection>

                  <FormSection title="Party Ledgers (Receivables & Payables)" desc="Aging analyses enforcing organizational debt management protocols." imagePlaceholder="Outstanding Payables Report">
                    <ColumnDetail name="Customer Outstanding List" desc="Highlights critical overdue Capital thresholds triggering immediate dunning procedures against defaulting clients." />
                    <ColumnDetail name="Vendor Payables Registry" desc="Schedules organizational outflow timelines preventing disruptions in raw-material procurements." />
                    <ColumnDetail name="Member Loan Registries" desc="FPC distinct views calculating active deployed micro-credit alongside accrued localized interests." />
                  </FormSection>

                  <FormSection title="Tax & Statutory Compliance (GST)" desc="Streamlined data extracts specifically formatted for uploading into government taxation portals." imagePlaceholder="GSTR Report">
                    <ColumnDetail name="GST Sales Register (GSTR-1 Data)" desc="Segmented output capturing B2B, B2C, and Export transaction lines with explicit CGST/SGST/IGST breakdown summaries." />
                    <ColumnDetail name="GST Purchase Register (GSTR-2 Data)" desc="Reconciliation tool mapping declared Inputs against claiming ledgers to secure Input Tax Credits." />
                    <ColumnDetail name="HSN/SAC Summary" desc="Categorized aggregation dictated by national statistical requirements required for definitive tax filings." />
                  </FormSection>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

