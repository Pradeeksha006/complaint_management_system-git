import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { 
  Sparkles, ShieldAlert, CheckCircle2, Lock, Mail, User, Phone, Loader2, Eye, EyeOff 
} from 'lucide-react';
import logoImage from '../assets/logo.png';

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
    <div className="bg-slate-50 dark:premium-dark-bg flex min-h-screen items-center justify-center px-4 overflow-hidden py-12 transition-colors duration-300">
      
      {/* Extra floating background depth layers (glowing blobs) */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/5 dark:bg-blue-500/10 blur-[130px] animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-amber-500/5 dark:bg-purple-500/10 blur-[150px] animate-blob animation-delay-2000" />

      {/* Register Card */}
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 backdrop-blur-xl p-8 shadow-md dark:shadow-[0_0_50px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-slate-350 dark:hover:border-slate-700/60">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 relative h-16 w-16 rounded-full border border-emerald-850 bg-white shrink-0 flex items-center justify-center overflow-hidden">
            <img 
              src={logoImage} 
              alt="Shield Seal Logo" 
              className="h-full w-full object-contain p-1"
            />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Register to start submitting complaints</p>
        </div>

        {/* Feedback */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-455 border border-red-500/20 animate-pulse">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50/20 p-4 text-sm text-green-700 dark:text-green-455 border border-green-200 dark:border-green-500/20">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="group text-left">
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-650 dark:group-focus-within:text-blue-405">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-650" />
                <input 
                  type="text"
                  {...register('fullName')}
                  placeholder="Enter Your Name"
                  className={`w-full rounded-xl border px-4 py-3 pl-11 pr-4 text-sm outline-none transition-all bg-slate-50 text-slate-800 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white dark:bg-slate-950/40 dark:text-white dark:border-slate-800/80 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                    errors.fullName 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-550/20' 
                      : 'border-slate-200 dark:border-slate-800/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                  }`}
                />
              </div>
              {errors.fullName && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.fullName.message}</span>}
            </div>

            {/* Username */}
            <div className="group text-left">
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-650 dark:group-focus-within:text-blue-405">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-650" />
                <input 
                  type="text"
                  {...register('username')}
                  placeholder="Enter Your Username"
                  className={`w-full rounded-xl border px-4 py-3 pl-11 pr-4 text-sm outline-none transition-all bg-slate-50 text-slate-800 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white dark:bg-slate-950/40 dark:text-white dark:border-slate-800/80 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                    errors.username 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-550/20' 
                      : 'border-slate-200 dark:border-slate-800/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                  }`}
                />
              </div>
              {errors.username && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.username.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email */}
            <div className="group text-left">
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-650 dark:group-focus-within:text-blue-405">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-650" />
                <input 
                  type="email"
                  {...register('email')}
                  placeholder="Enter Your Email"
                  className={`w-full rounded-xl border px-4 py-3 pl-11 pr-4 text-sm outline-none transition-all bg-slate-50 text-slate-800 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white dark:bg-slate-950/40 dark:text-white dark:border-slate-800/80 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-550/20' 
                      : 'border-slate-200 dark:border-slate-800/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                  }`}
                />
              </div>
              {errors.email && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.email.message}</span>}
            </div>

            {/* Phone Number */}
            <div className="group text-left">
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-650 dark:group-focus-within:text-blue-405">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-650" />
                <input 
                  type="text"
                  {...register('phoneNumber')}
                  placeholder="+919876543210"
                  className={`w-full rounded-xl border px-4 py-3 pl-11 pr-4 text-sm outline-none transition-all bg-slate-50 text-slate-800 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white dark:bg-slate-950/40 dark:text-white dark:border-slate-800/80 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                    errors.phoneNumber 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-550/20' 
                      : 'border-slate-200 dark:border-slate-800/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                  }`}
                />
              </div>
              {errors.phoneNumber && <span className="text-xs text-red-500 font-semibold mt-1.5 block">{errors.phoneNumber.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Password */}
            <div className="group text-left">
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-650 dark:group-focus-within:text-blue-405">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-650" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border px-4 py-3 pl-11 pr-11 text-sm outline-none transition-all bg-slate-50 text-slate-800 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white dark:bg-slate-950/40 dark:text-white dark:border-slate-800/80 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-550/20' 
                      : 'border-slate-200 dark:border-slate-800/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
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
            <div className="group text-left">
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-blue-655 dark:group-focus-within:text-blue-405">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 transition-colors group-focus-within:text-blue-650" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border px-4 py-3 pl-11 pr-11 text-sm outline-none transition-all bg-slate-50 text-slate-800 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white dark:bg-slate-950/40 dark:text-white dark:border-slate-800/80 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-550/20' 
                      : 'border-slate-200 dark:border-slate-800/80 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 py-3 text-sm font-bold text-white transition-all transform active:scale-98 disabled:opacity-50 shadow-md shadow-blue-500/10 dark:shadow-indigo-900/30 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Register'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-550 dark:text-slate-400 font-semibold">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
