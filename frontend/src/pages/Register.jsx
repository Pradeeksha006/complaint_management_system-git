import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { 
  Sparkles, ShieldAlert, CheckCircle2, Lock, Mail, User, Phone, Loader2, Eye, EyeOff 
} from 'lucide-react';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { confirmPassword, ...submitData } = data;
      await api.post('/api/auth/register', submitData);
      setSuccessMsg('Registration successful! Please sign in using your new credentials.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-50 via-blue-50/20 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20 px-4 overflow-hidden py-12">
      
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-80 w-80 rounded-full bg-pink-400/10 dark:bg-pink-600/5 blur-3xl animate-blob animation-delay-4000" />

      {/* Register Card */}
      <div className="w-full max-w-xl rounded-2xl border border-white/20 dark:border-slate-800/80 glass p-8 shadow-2xl transition-all duration-300 hover:shadow-blue-500/5 dark:hover:shadow-purple-500/5">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 dark:shadow-blue-900/30 transform hover:scale-105 transition-transform duration-200">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Register to start submitting complaints</p>
        </div>

        {/* Feedback */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400 border border-green-500/20">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-500">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type="text"
                  {...register('fullName')}
                  placeholder="John Doe"
                  className={`w-full rounded-xl border bg-transparent/40 dark:bg-slate-900/35 py-3 pl-11 pr-4 text-sm outline-none transition-all dark:text-white dark:border-slate-800 ${
                    errors.fullName 
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'
                  }`}
                />
              </div>
              {errors.fullName && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.fullName.message}</span>}
            </div>

            {/* Username */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-500">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type="text"
                  {...register('username')}
                  placeholder="john_doe"
                  className={`w-full rounded-xl border bg-transparent/40 dark:bg-slate-900/35 py-3 pl-11 pr-4 text-sm outline-none transition-all dark:text-white dark:border-slate-800 ${
                    errors.username 
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'
                  }`}
                />
              </div>
              {errors.username && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.username.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type="email"
                  {...register('email')}
                  placeholder="john@example.com"
                  className={`w-full rounded-xl border bg-transparent/40 dark:bg-slate-900/35 py-3 pl-11 pr-4 text-sm outline-none transition-all dark:text-white dark:border-slate-800 ${
                    errors.email 
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'
                  }`}
                />
              </div>
              {errors.email && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.email.message}</span>}
            </div>

            {/* Phone Number */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-500">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type="text"
                  {...register('phoneNumber')}
                  placeholder="+919876543210"
                  className={`w-full rounded-xl border bg-transparent/40 dark:bg-slate-900/35 py-3 pl-11 pr-4 text-sm outline-none transition-all dark:text-white dark:border-slate-800 ${
                    errors.phoneNumber 
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'
                  }`}
                />
              </div>
              {errors.phoneNumber && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.phoneNumber.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Password */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-transparent/40 dark:bg-slate-900/35 py-3 pl-11 pr-11 text-sm outline-none transition-all dark:text-white dark:border-slate-800 ${
                    errors.password 
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.password.message}</span>}
            </div>

            {/* Confirm Password */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-500">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-transparent/40 dark:bg-slate-900/35 py-3 pl-11 pr-11 text-sm outline-none transition-all dark:text-white dark:border-slate-800 ${
                    errors.confirmPassword 
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.confirmPassword && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.confirmPassword.message}</span>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-sm font-bold text-white transition-all transform active:scale-98 disabled:opacity-50 shadow-lg shadow-blue-500/20 dark:shadow-indigo-900/30"
          >
            {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Register'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Sign in</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
