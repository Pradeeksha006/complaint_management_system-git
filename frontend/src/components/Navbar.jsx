import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Menu, 
  X,
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Bell, 
  Check,
  LayoutDashboard,
  FilePlus2,
  ListTodo,
  Search,
  Users,
  Building2,
  ClipboardList,
  Settings,
  ShieldCheck
} from 'lucide-react';
import logoImage from '../assets/logo.png';
import api from '../services/api';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);

  // Notifications Popover State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'ROLE_DEPT_HEAD' || user.role === 'ROLE_OFFICER')) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // check alerts every 20s
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/notifications/unread-count')
      ]);
      setNotifications(listRes.data || []);
      setUnreadCount(countRes.data || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getLinks = () => {
    const role = user?.role;
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-neutral-800 bg-[#181818] px-6 text-white shadow-md relative">
      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="mr-3 rounded-lg p-1.5 text-slate-400 hover:bg-neutral-800 lg:hidden"
        aria-label="Toggle Navigation Menu"
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3 mr-4 shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="relative h-9 w-9 rounded-full border border-emerald-800 bg-white shrink-0 flex items-center justify-center overflow-hidden">
          <img 
            src={logoImage} 
            alt="Shield Seal Logo" 
            className="h-full w-full object-contain p-0.5"
          />
        </div>
        <div className="hidden sm:block">
          <h2 className="text-xs font-black tracking-tight text-emerald-450 font-serif leading-none">PSCN</h2>
          <p className="text-[7px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Complaint Network</p>
        </div>
      </div>

      {/* Welcome Message (Desktop) */}
      <div className="hidden md:block ml-2 border-l border-neutral-700 pl-4 shrink-0">
        <h1 className="text-2xs text-slate-400">
          Welcome, <span className="font-semibold text-white">{user?.fullName || 'Guest'}</span>
        </h1>
      </div>

      {/* Desktop Navigation Links (Centered) */}
      <nav className="hidden lg:flex items-center gap-2 xl:gap-4 mx-auto h-full">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 h-full text-[10px] font-bold tracking-wide uppercase transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-700'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Right Actions Panel */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Notifications Popover */}
        {(user?.role === 'ROLE_DEPT_HEAD' || user?.role === 'ROLE_OFFICER') && (
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-slate-400 hover:bg-neutral-850 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-neutral-800 bg-[#1e1e1e] p-3 shadow-2xl text-white z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Alerts & SLA Warnings</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-2xs font-bold text-blue-400 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">No alerts or notifications yet.</div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-lg text-xs transition-colors flex gap-2 items-start ${
                          n.isRead 
                            ? 'bg-neutral-900/40 text-slate-450' 
                            : 'bg-blue-950/20 border-l-2 border-blue-500 text-slate-200'
                        }`}
                      >
                        <div className="flex-1 leading-normal">{n.message}</div>
                        {!n.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-slate-500 hover:text-blue-400 shrink-0 mt-0.5"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-400 hover:bg-neutral-850 hover:text-white"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Profile User Settings */}
        <button 
          onClick={() => navigate('/settings')}
          className="rounded-full overflow-hidden h-8 w-8 flex items-center justify-center border border-neutral-700 hover:border-neutral-500 transition-colors shrink-0 bg-neutral-800"
        >
          {user?.profilePictureUrl ? (
            <img 
              src={user.profilePictureUrl} 
              alt="Profile Avatar" 
              className="h-full w-full object-cover" 
            />
          ) : (
            <User className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 border-b border-neutral-800 bg-[#181818] p-4 lg:hidden z-40 shadow-xl">
          <nav className="flex flex-col gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide uppercase transition-all ${
                      isActive
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
