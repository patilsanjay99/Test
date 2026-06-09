import React from 'react';
import { Bell, Search, Menu, Globe } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

export function Header() {
  const { user, activeCompany, companies, setActiveCompany, activeFinancialYear, setActiveFinancialYear, financialYears } = useAppContext();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600">
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('header.search')} 
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-64 lg:w-96 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 border-r border-gray-200 pr-4 mr-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <select 
            className="text-sm font-medium border-0 bg-transparent focus:ring-0 cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'mr' | 'hi')}
          >
            <option value="en">English</option>
            <option value="mr">मराठी</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
        <div className="hidden md:flex items-center gap-2 border-r border-gray-200 pr-4 mr-2">
          <span className="text-sm text-gray-500">Active Company:</span>
          <select 
            className="text-sm font-medium border-0 bg-transparent focus:ring-0 cursor-pointer"
            value={activeCompany?.id || ''}
            onChange={(e) => {
              const comp = companies.find(c => c.id === e.target.value);
              if (comp) setActiveCompany(comp);
            }}
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden md:flex items-center gap-2 border-r border-gray-200 pr-4 mr-2">
          <span className="text-sm text-gray-500">FY:</span>
          <select 
            className="text-sm font-medium border-0 bg-transparent focus:ring-0 cursor-pointer"
            value={activeFinancialYear?.id || ''}
            onChange={(e) => {
              const fy = financialYears.find(f => f.id === e.target.value);
              if (fy) setActiveFinancialYear(fy);
            }}
          >
            {financialYears.map(fy => (
              <option key={fy.id} value={fy.id}>{fy.name}</option>
            ))}
          </select>
        </div>
        
        {user && (
          <div className="hidden md:flex items-center gap-3 border-r border-gray-200 pr-4 mr-2">
            <div className="text-right">
               <div className="text-sm font-medium text-gray-900">{user.name}</div>
               <div className="text-xs text-gray-500">{user.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm tracking-tight border border-blue-200">
              {user.name.charAt(0)}
            </div>
          </div>
        )}

        <button className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}
