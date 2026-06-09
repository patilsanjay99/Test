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
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const revenueData: any[] = [];

const SummaryCard = ({ title, value, change, isPositive, icon: Icon, vsLastMonthText }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>{change} {vsLastMonthText}</span>
      </div>
    </div>
    <div className={`p-3 rounded-lg flex items-center justify-center shrink-0 ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalSales: 0,
    receivables: 0,
    members: 0,
    inventoryValue: 0,
    revenueData: []
  });

  useEffect(() => {
    fetch('/api/v1/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">{t('dashboard.revenueVsExpenses')}</h2>
            <select className="text-sm border-gray-200 rounded-md shadow-sm">
              <option>{t('dashboard.last6Months')}</option>
              <option>{t('dashboard.thisYear')}</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value}`, ""]} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="font-semibold text-gray-900 mb-6">{t('dashboard.recentApprovals')}</h2>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* Real approvals would go here. Removed hardcoded dummy values. */}
            <div className="text-sm text-gray-500 text-center mt-4">No recent approvals</div>
          </div>
        </div>
      </div>
    </div>
  );
}
