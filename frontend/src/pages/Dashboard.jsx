import React from 'react';
import { useSelector } from 'react-redux';
import CitizenDashboard from './CitizenDashboard';
import OfficerDashboard from './OfficerDashboard';
import DeptHeadDashboard from './DeptHeadDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;

  switch (role) {
    case 'ROLE_CITIZEN':
      return <CitizenDashboard />;
    case 'ROLE_OFFICER':
      return <OfficerDashboard />;
    case 'ROLE_DEPT_HEAD':
      return <DeptHeadDashboard />;
    case 'ROLE_ADMIN':
      return <AdminDashboard />;
    default:
      return (
        <div className="flex h-[50vh] items-center justify-center text-slate-500">
          Unrecognized user role. Please contact support.
        </div>
      );
  }
};

export default Dashboard;
