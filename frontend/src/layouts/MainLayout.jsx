import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import AIChatbot from '../components/AIChatbot';

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
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
