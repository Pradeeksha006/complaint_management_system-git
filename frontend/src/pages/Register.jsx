import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { Sparkles, ShieldAlert, CheckCircle2, Lock, Mail, User, Phone, Loader2 } from 'lucide-react';

const schema = yup.object().shape({
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  fullName: yup.string().required('Full name is required'),
  phoneNumber: yup.string().optional(),
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/auth/register', data);
      setSuccessMsg('Registration successful! Please check your email inbox to verify your account.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Register to start submitting complaints</p>
        </div>

        {/* Feedback */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900/30">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                {...register('fullName')}
                placeholder="John Doe"
                className={`w-full rounded-lg border bg-transparent py-2 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white ${
                  errors.fullName ? 'border-red-500' : 'border-slate-200 focus:border-blue-500 dark:focus:border-blue-500'
                }`}
              />
            </div>
            {errors.fullName && <span className="text-xs text-red-500 mt-0.5 block">{errors.fullName.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                {...register('username')}
                placeholder="john_doe"
                className={`w-full rounded-lg border bg-transparent py-2 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white ${
                  errors.username ? 'border-red-500' : 'border-slate-200 focus:border-blue-500 dark:focus:border-blue-500'
                }`}
              />
            </div>
            {errors.username && <span className="text-xs text-red-500 mt-0.5 block">{errors.username.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                className={`w-full rounded-lg border bg-transparent py-2 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-slate-200 focus:border-blue-500 dark:focus:border-blue-500'
                }`}
              />
            </div>
            {errors.email && <span className="text-xs text-red-500 mt-0.5 block">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                {...register('phoneNumber')}
                placeholder="+919876543210"
                className={`w-full rounded-lg border bg-transparent py-2 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white ${
                  errors.phoneNumber ? 'border-red-500' : 'border-slate-200 focus:border-blue-500 dark:focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-transparent py-2 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white ${
                  errors.password ? 'border-red-500' : 'border-slate-200 focus:border-blue-500 dark:focus:border-blue-500'
                }`}
              />
            </div>
            {errors.password && <span className="text-xs text-red-500 mt-0.5 block">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Sign in</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
