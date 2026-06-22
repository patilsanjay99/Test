import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-8 print:p-0 print:overflow-visible print:bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
