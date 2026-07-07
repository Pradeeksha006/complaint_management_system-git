import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  LayoutDashboard, 
  FilePlus2, 
  ListTodo, 
  Search, 
  Users, 
  Building2, 
  ClipboardList, 
  Settings, 
  Sparkles,
  Map,
  ShieldCheck
} from 'lucide-react';
import logoImage from '../assets/logo.png';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;

  const getLinks = () => {
    switch (role) {
      case 'ROLE_CITIZEN':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'File Complaint', path: '/file-complaint', icon: FilePlus2 },
          { name: 'My Complaints', path: '/my-complaints', icon: ClipboardList },
          { name: 'Track Complaint', path: '/track', icon: Search },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'ROLE_OFFICER':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Assignments', path: '/assignments', icon: ListTodo },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'ROLE_DEPT_HEAD':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Total Complaints', path: '/dept-statistics', icon: ClipboardList },
          { name: 'Manage Officers', path: '/officers', icon: Users },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'ROLE_ADMIN':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Manage Customers', path: '/users', icon: Users },
          { name: 'Manage Officers', path: '/officers', icon: Users },
          { name: 'Departments', path: '/departments', icon: Building2 },
          { name: 'Dept Control Desk', path: '/department-control', icon: Building2 },
          { name: 'Manage Complaints', path: '/all-complaints', icon: ClipboardList },
          { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="relative h-10 w-10 rounded-full border border-emerald-800 bg-white shrink-0 flex items-center justify-center overflow-hidden">
            <img 
              src={logoImage} 
              alt="Shield Seal Logo" 
              className="h-full w-full object-contain p-0.5"
            />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-[#062c19] dark:text-emerald-450 font-serif leading-none">PSCN</h2>
            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Complaint Network</p>
          </div>
        </div>

        {/* User Badge */}
        {user && (
          <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user.fullName}</h4>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                  {role?.replace('ROLE_', '').replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="mt-auto px-2 text-[10px] font-medium text-slate-400 text-center">
          <p>For the CIVIC</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
