import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const account = email.trim();
    if (!account) {
      setErrorMsg('Please enter your email or username.');
      setLoading(false);
      return;
    }
    navigate('/reset-password', {
      state: {
        email: account,
        message: 'Click Send OTP to receive a verification code for this account.'
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-black text-xs">
            CMS
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Recover Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
            Enter your email or username to initiate password recovery.
          </p>
        </div>

        {/* Feedback */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address / Username</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or username"
                className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
