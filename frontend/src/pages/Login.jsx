import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { Sparkles, ShieldAlert, CheckCircle2, Lock, Mail, Loader2 } from 'lucide-react';

const schema = yup.object().shape({
  usernameOrEmail: yup.string().required('Username or email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/api/auth/login', data);
      dispatch(loginSuccess(response.data));
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      dispatch(loginFailure(errMsg));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Welcome back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your CMS account</p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900/30">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                {...register('usernameOrEmail')}
                placeholder="citizen123 or email@domain.com"
                className={`w-full rounded-lg border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white ${
                  errors.usernameOrEmail ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500 dark:focus:border-blue-500'
                }`}
              />
            </div>
            {errors.usernameOrEmail && <span className="text-xs text-red-500 mt-1 block">{errors.usernameOrEmail.message}</span>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500 dark:focus:border-blue-500'
                }`}
              />
            </div>
            {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Sign up</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
