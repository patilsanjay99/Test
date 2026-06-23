import React, { useState } from 'react';
import { LogOut, Bell, Search, Menu, Globe, Key } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export function Header() {
  const { 
    activeCompany, 
    companies, 
    setActiveCompany, 
    activeFinancialYear, 
    setActiveFinancialYear, 
    financialYears,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useAppContext();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }
    if (newPassword.length < 4) {
      alert("Password must be at least 4 characters long");
      return;
    }
    try {
      setChanging(true);
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.Email || user?.email,
          userId: user?.Id || user?.id,
          currentPassword,
          newPassword
        })
      });

      if (res.ok) {
        alert("Password updated successfully!");
        setIsChangePasswordOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update password");
      }
    } catch (err: any) {
       console.error(err);
       alert("Error changing password");
    } finally {
       setChanging(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('header.search')} 
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[#f4fbf4] w-48 lg:w-64 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 border-r border-gray-200 pr-4 mr-2">
          <span className="text-sm text-gray-500">Company:</span>
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
        
        {user && (
          <div className="hidden md:flex items-center gap-3 pr-2">
            <div className="text-right">
               <div className="text-sm font-medium text-gray-900">{user.Name || user.name}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm tracking-tight border border-blue-200">
              {(user.Name || user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <button 
                onClick={() => setIsChangePasswordOpen(true)}
                className="ml-2 p-1.5 rounded-full hover:bg-gray-150 text-gray-500 hover:text-blue-600 transition-colors"
                title="Change Password"
            >
                <Key className="w-4 h-4" />
            </button>
            <button 
                onClick={logout}
                className="ml-1 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                title="Log out"
            >
                <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        <button className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>
      </div>

      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-bold tracking-wide uppercase text-sm">Change Access Password</span>
              <button 
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold focus:outline-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changing}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded font-bold uppercase tracking-wider"
                >
                  {changing ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
