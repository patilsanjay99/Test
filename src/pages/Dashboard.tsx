import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Package 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';

const revenueData: any[] = [];

const SummaryCard = ({ title, value, change, isPositive, icon: Icon, vsLastMonthText }: any) => (
  <div className="bg-white p-4 lg:p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center h-full">
    <div className="flex items-start justify-between gap-3 mb-2">
      <p className="text-sm font-medium text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis mr-2 pr-2 leading-none mt-2">{title}</p>
      <div className={`p-2 rounded-lg flex items-center justify-center shrink-0 ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div>
      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">{value}</h3>
      <div className={`flex items-center gap-1 mt-1 text-xs lg:text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} whitespace-nowrap`}>
        {isPositive ? <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />}
        <span>{change} {vsLastMonthText}</span>
      </div>
    </div>
  </div>
);

export function Dashboard() {
  const { t } = useLanguage();
  const { activeCompany } = useAppContext();
  const companyId = activeCompany?.id || 1;

  const [stats, setStats] = useState({
    totalSales: 0,
    receivables: 0,
    members: 0,
    inventoryValue: 0,
    revenueData: []
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetch(`/api/v1/dashboard/stats?CompanyId=${companyId}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, [companyId]);

  return (
    <div className="space-y-4 max-w-full mx-auto w-full pb-4">
      <div className="flex items-baseline gap-2 -mt-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title={t('dashboard.totalSales')} 
          value={`₹ ${stats.totalSales.toLocaleString('en-IN')}`} 
          change="+0%" 
          isPositive={true} 
          icon={IndianRupee} 
          vsLastMonthText={t('dashboard.vsLastMonth')}
        />
        <SummaryCard 
          title={t('dashboard.pendingReceivables')} 
          value={`₹ ${stats.receivables.toLocaleString('en-IN')}`} 
          change="-0%" 
          isPositive={false} 
          icon={ShoppingCart} 
          vsLastMonthText={t('dashboard.vsLastMonth')}
        />
        <SummaryCard 
          title={t('dashboard.activeMembers')} 
          value={stats.members.toLocaleString('en-IN')} 
          change="+0" 
          isPositive={true} 
          icon={Users} 
          vsLastMonthText={t('dashboard.vsLastMonth')}
        />
        <SummaryCard 
          title={t('dashboard.inventoryValue')} 
          value={`₹ ${stats.inventoryValue.toLocaleString('en-IN')}`} 
          change="+0%" 
          isPositive={true} 
          icon={Package} 
          vsLastMonthText={t('dashboard.vsLastMonth')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Monthwise Sales Vs. Collections</h2>
            <select className="text-sm border-gray-200 rounded-md shadow-sm">
              <option>{t('dashboard.last6Months')}</option>
              <option>{t('dashboard.thisYear')}</option>
            </select>
          </div>
          <div className="h-64">
            {isMounted && (
              <ResponsiveContainer width="109%" height={240} style={{ marginLeft: '-5%' }}>
                <BarChart data={stats.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `₹${(value/1000).toFixed(0)}k` : `₹${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [
                      value >= 1000 ? `₹${(value/1000).toFixed(1)}k` : `₹${value}`,
                      name === 'sales' ? "Sales" : name === 'collections' ? "Collections" : name
                    ]} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} formatter={(val) => val === 'sales' ? 'Sales' : 'Collections'} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="collections" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Monthwise Sales Vs. Purchase</h2>
            <select className="text-sm border-gray-200 rounded-md shadow-sm">
              <option>{t('dashboard.last6Months')}</option>
              <option>{t('dashboard.thisYear')}</option>
            </select>
          </div>
          <div className="h-64">
            {isMounted && (
              <ResponsiveContainer width="109%" height={240} style={{ marginLeft: '-5%' }}>
                <BarChart data={stats.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `₹${(value/1000).toFixed(0)}k` : `₹${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [
                      value >= 1000 ? `₹${(value/1000).toFixed(1)}k` : `₹${value}`,
                      name === 'sales' ? "Sales" : name === 'purchases' ? "Purchases" : name
                    ]} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} formatter={(val) => val === 'sales' ? 'Sales' : 'Purchases'} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="purchases" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
