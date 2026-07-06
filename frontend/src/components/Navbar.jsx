import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { useTheme } from '../contexts/ThemeContext';
import { Menu, Sun, Moon, LogOut, User, Bell, Check } from 'lucide-react';
import api from '../services/api';

const Navbar = ({ onOpenSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);

  // Notifications Popover State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      {/* Mobile Menu Trigger */}
      <button 
        onClick={onOpenSidebar}
        className="mr-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Header Info */}
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Welcome back, <span className="font-bold text-slate-800 dark:text-white">{user?.fullName || 'Guest'}</span>
        </h1>
      </div>

      {/* Actions Panel */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover (only for department heads / officers) */}
        {(user?.role === 'ROLE_DEPT_HEAD' || user?.role === 'ROLE_OFFICER') && (
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
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
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-850 dark:bg-slate-900 text-slate-800 dark:text-slate-100 z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 dark:border-slate-800">
                  <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Alerts & SLA Warnings</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-2xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">No alerts or notifications yet.</div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-lg text-xs transition-colors flex gap-2 items-start ${
                          n.isRead 
                            ? 'bg-slate-50/50 dark:bg-slate-950/20 text-slate-500' 
                            : 'bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 dark:border-blue-400 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex-1 leading-normal">{n.message}</div>
                        {!n.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-slate-400 hover:text-blue-500 shrink-0 mt-0.5"
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
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Profile Avatar Trigger / Route */}
        <button 
          onClick={() => navigate('/settings')}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <User className="h-4 w-4" />
        </button>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
