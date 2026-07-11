import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { ShieldAlert, CheckCircle2, Lock, Mail, Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import logoImage from '../assets/logo.png';
import loginHeroImage from '../assets/login_hero.png';

const schema = yup.object().shape({
  usernameOrEmail: yup.string().required('Username or email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/api/auth/login', data);
      dispatch(loginSuccess(response.data));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      dispatch(loginFailure(errMsg));
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      
      {/* Top Actions Bar (Language & Theme) */}
      <div className="absolute top-6 right-6 lg:right-[57%] flex items-center gap-2.5 z-20">
        {/* Language Selector Dropdown */}
        <select
          value={currentLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <option value="en">EN</option>
          <option value="ta">TA (தமிழ்)</option>
          <option value="hi">HI (हिन्दी)</option>
          <option value="te">TE (తెలుగు)</option>
          <option value="ml">ML (മലയാളം)</option>
          <option value="kn">KN (ಕನ್ನಡ)</option>
        </select>

        {/* Theme Switcher Button */}
        <button 
          onClick={toggleTheme}
          type="button"
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 transition-colors border border-slate-200 dark:border-slate-800"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Left Form Panel */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-between p-8 sm:p-12 md:p-16 relative overflow-y-auto">
        
        {/* Header Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-850 bg-white flex items-center justify-center p-0.5">
            <img src={logoImage} alt="PSCN Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-850 dark:text-white uppercase leading-none">
              Public Service Complaint Network
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 leading-none">
              Your Voice. Our Action. Better Communities.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto space-y-6">
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider flex items-center gap-1.5">
              Welcome back! <span className="animate-bounce">👋</span>
            </p>
            <h1 className="text-3xl font-extrabold text-slate-855 dark:text-white leading-tight tracking-tight">
              Log In <span className="text-blue-600">to Your Account</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Access your dashboard to manage and track complaints, view updates, and more.
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/20 p-4 text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Email or UserName
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  {...register('usernameOrEmail')}
                  placeholder="youremail@example.com"
                  className={`w-full rounded-xl border pl-11 pr-4 py-3 text-sm outline-none transition-all bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                    errors.usernameOrEmail 
                      ? 'border-red-500 focus:border-red-550 focus:ring-2 focus:ring-red-550/20' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                  }`}
                />
              </div>
              {errors.usernameOrEmail && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.usernameOrEmail.message}</span>}
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  state={{ email: getValues('usernameOrEmail') }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••••••"
                  className={`w-full rounded-xl border pl-11 pr-11 py-3 text-sm outline-none transition-all bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-550 focus:ring-2 focus:ring-red-550/20' 
                      : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-655 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white transition-all transform active:scale-98 disabled:opacity-50 shadow-md shadow-blue-500/10 cursor-pointer mt-6"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Log In <span className="ml-1">→</span></>}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-505 mt-auto pt-4">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Sign up for free
          </Link>
        </div>

      </div>

      {/* Right Presentation Panel */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] bg-slate-100 dark:bg-slate-900 justify-center items-center relative overflow-hidden select-none">
        <img 
          src={loginHeroImage} 
          alt="Public Service Complaint Network Presentation" 
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

    </div>
  );
};

export default Login;
