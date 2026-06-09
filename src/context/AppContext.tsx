import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company } from '../types';

export interface FinancialYear {
  id: string;
  name: string;
}

interface AppContextType {
  user: User | null;
  activeCompany: Company | null;
  setActiveCompany: (company: Company | null) => void;
  companies: Company[];
  activeFinancialYear: FinancialYear | null;
  setActiveFinancialYear: (fy: FinancialYear | null) => void;
  financialYears: FinancialYear[];
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

const mockUser: User = {
  id: 'u-1',
  name: 'Sanjay Kumar',
  email: 'admin@fpc.com',
  role: 'Super Admin'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(mockUser);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [activeFinancialYear, setActiveFinancialYear] = useState<FinancialYear | null>(null);

  useEffect(() => {
    fetch('/api/v1/data/Companies')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const comps = data.map((d: any) => ({
            id: d.Id.toString(),
            name: d.Name,
            gstNumber: d.GSTIN || d.GSTINNo,
            panNumber: d.PAN || d.PANNo
          }));
          setCompanies(comps);
          if (comps.length > 0) {
            setActiveCompany(comps[0]);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (activeCompany) {
      fetch(`/api/v1/data/FinancialYears?CompanyId=${activeCompany.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const fys = data.map((d: any) => ({
              id: d.Id.toString(),
              name: d.FinancialYear
            }));
            setFinancialYears(fys);
            if (fys.length > 0) {
              setActiveFinancialYear(fys[0]);
            } else {
              setActiveFinancialYear(null);
            }
          }
        })
        .catch(console.error);
    }
  }, [activeCompany?.id]);

  return (
    <AppContext.Provider value={{ 
      user, activeCompany, setActiveCompany, companies,
      activeFinancialYear, setActiveFinancialYear, financialYears 
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
