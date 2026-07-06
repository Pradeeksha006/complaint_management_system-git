import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AIChatbot from '../components/AIChatbot';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Viewport/Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <Outlet />
          {user?.role === 'ROLE_CITIZEN' && <AIChatbot />}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
