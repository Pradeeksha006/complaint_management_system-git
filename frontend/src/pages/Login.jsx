import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { Sparkles, ShieldAlert, CheckCircle2, Lock, Mail, Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import logoImage from '../assets/logo.png';

const schema = yup.object().shape({
  usernameOrEmail: yup.string().required('Username or email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/api/auth/login', data);
      dispatch(loginSuccess(response.data));
      navigate(from, { replace: true });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      dispatch(loginFailure(errMsg));
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#020b06] flex min-h-screen items-center justify-center px-4 overflow-hidden py-12 transition-colors duration-300">
      
      {/* Extra floating background depth layers (glowing blobs) */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/5 dark:bg-[#062c19]/20 blur-[130px] animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-amber-500/5 dark:bg-[#ac734c]/10 blur-[150px] animate-blob animation-delay-2000" />

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#052414] bg-white dark:bg-[#03140c] p-8 shadow-xl dark:shadow-[0_0_50px_rgba(6,44,25,0.3)] transition-all duration-300 hover:border-slate-300 dark:hover:border-[#0b3a20]">
        
        {/* Theme Switcher Button */}
        <button 
          onClick={toggleTheme}
          type="button"
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-slate-700 dark:text-[#f2e6d0] transition-colors"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
        
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 relative h-16 w-16 rounded-full border border-slate-200 dark:border-[#052414] bg-[#f2e6d0] shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
            <img 
              src={logoImage} 
              alt="Shield Seal Logo" 
              className="h-full w-full object-contain p-1"
            />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white uppercase font-serif">
            Welcome back
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#f2e6d0]/80 mt-2 font-semibold">
            Sign in to your PSCN account
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200 animate-pulse">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="group text-left">
            <label className="block text-xs font-bold text-slate-700 dark:text-[#f2e6d0] uppercase tracking-widest mb-2">
              Username or Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-emerald-600" />
              <input 
                type="text"
                {...register('usernameOrEmail')}
                placeholder="Enter username or email"
                className={`w-full rounded-xl border px-4 py-3 pl-11 pr-4 text-sm outline-none transition-all bg-slate-50 text-slate-900 border-slate-200 focus:border-[#062c19] focus:ring-4 focus:ring-[#062c19]/10 focus:bg-white dark:bg-[#0c1912] dark:text-white dark:border-[#0b3a20] dark:focus:border-[#d4af37] dark:focus:ring-[#d4af37]/20 ${
                  errors.usernameOrEmail 
                    ? 'border-red-500 focus:border-red-550 focus:ring-2 focus:ring-red-550/20' 
                    : 'border-slate-200 dark:border-[#0b3a20] focus:border-[#062c19] focus:ring-4 focus:ring-[#062c19]/10'
                }`}
              />
            </div>
            {errors.usernameOrEmail && <span className="text-xs text-red-650 font-bold mt-1.5 block">{errors.usernameOrEmail.message}</span>}
          </div>

          <div className="group text-left">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-emerald-450 uppercase tracking-widest">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-[#ac734c] hover:text-[#8f5e3e] dark:text-[#d4af37] dark:hover:text-[#f2e6d0] transition-colors">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-emerald-600" />
              <input 
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter password"
                className={`w-full rounded-xl border px-4 py-3 pl-11 pr-11 text-sm outline-none transition-all bg-slate-50 text-slate-900 border-slate-200 focus:border-[#062c19] focus:ring-4 focus:ring-[#062c19]/10 focus:bg-white dark:bg-[#0c1912] dark:text-white dark:border-[#0b3a20] dark:focus:border-[#d4af37] dark:focus:ring-[#d4af37]/20 ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-550 focus:ring-2 focus:ring-red-550/20' 
                    : 'border-slate-200 dark:border-[#0b3a20] focus:border-[#062c19] focus:ring-4 focus:ring-[#062c19]/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-emerald-400 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && <span className="text-xs text-red-650 font-bold mt-1.5 block">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#062c19] hover:bg-[#041d10] dark:bg-[#ac734c] dark:hover:bg-[#8f5e3e] py-3 text-sm font-bold text-white transition-all transform active:scale-98 disabled:opacity-50 shadow-md shadow-emerald-950/10 dark:shadow-[#ac734c]/20 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-emerald-100/60 font-semibold">
          Don't have an account?{' '}
          <Link to="/register" className="font-extrabold text-[#062c19] hover:text-[#041d10] dark:text-[#d4af37] dark:hover:text-[#f2e6d0] transition-colors underline">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
