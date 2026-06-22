import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company } from '../types';

export interface FinancialYear {
  id: string;
  name: string;
}

interface AppContextType {
  activeCompany: Company | null;
  setActiveCompany: (company: Company | null) => void;
  companies: Company[];
  activeFinancialYear: FinancialYear | null;
  setActiveFinancialYear: (fy: FinancialYear | null) => void;
  financialYears: FinancialYear[];
  refreshFinancialYears: () => void;
  refreshCompanies: () => void;
}

const mockFinancialYears: FinancialYear[] = [
  { id: '1', name: '2023-2024' },
  { id: '2', name: '2024-2025' },
  { id: '3', name: '2025-2026' }
];

const mockCompanies: Company[] = [
  { id: '1', name: 'AgriCorp FPC Ltd', gstNumber: '27AABCA1234K1Z1', panNumber: 'AABCA1234K' },
  { id: '2', name: 'GreenHarvest Farmers', gstNumber: '27XYZPK9876L1Z2', panNumber: 'XYZPK9876L' }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [activeFinancialYear, setActiveFinancialYear] = useState<FinancialYear | null>(null);

  const fetchCompanies = () => {
    fetch(`/api/data/Companies?_t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const comps = data.map((d: any) => ({
            id: (d.Id || d.id || d.ID || '').toString(),
            name: d.Name || d.name || d.NAME,
            gstNumber: d.GSTIN || d.GSTINNo || d.gstin,
            panNumber: d.PAN || d.PANNo || d.pan,
            address: d.Address || d.address || '',
            defaultQuotationTerms: d.DefaultQuotationTerms || d.defaultQuotationTerms || '',
            defaultSalesOrderTerms: d.DefaultSalesOrderTerms || d.defaultSalesOrderTerms || '',
            defaultSalesInvoiceTerms: d.DefaultSalesInvoiceTerms || d.defaultSalesInvoiceTerms || '',
            LogoUrl: d.LogoUrl || d.logoUrl || d.logo || '',
            StateCode: d.StateCode || d.stateCode || d.state_code || ''
          }));
          setCompanies(comps);
          if (comps.length > 0) {
            setActiveCompany(prevActive => {
              if (!prevActive) return comps[0];
              const updatedActive = comps.find((c: any) => c.id === prevActive.id);
              return updatedActive || prevActive;
            });
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchFinancialYears = () => {
    if (activeCompany) {
      fetch(`/api/data/FinancialYears?CompanyId=${activeCompany.id}&_t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const fys = data.map((d: any) => ({
              id: (d.Id || d.id || d.ID || '').toString(),
              name: d.FinancialYear || d.financialYear || d.FINANCIALYEAR
            }));
            setFinancialYears(fys);
            if (fys.length > 0 && !activeFinancialYear) {
              setActiveFinancialYear(fys[0]);
            } else if (fys.length === 0) {
              setActiveFinancialYear(null);
            }
          }
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchFinancialYears();
  }, [activeCompany?.id]);

  return (
    <AppContext.Provider value={{ 
      activeCompany, setActiveCompany, companies,
      activeFinancialYear, setActiveFinancialYear, financialYears,
      refreshFinancialYears: fetchFinancialYears,
      refreshCompanies: fetchCompanies
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
