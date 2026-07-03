import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Sparkles, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.get(`/api/auth/verify-email?token=${token}`);
        setSuccessMsg(response.data.message || 'Email verified successfully!');
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Verification failed. Token might be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      verify();
    } else {
      setErrorMsg('Missing verification token.');
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-center">
        
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Account Activation</h2>
        </div>

        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500">Verifying your email address...</p>
          </div>
        ) : (
          <div className="py-4">
            {successMsg && (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-14 w-14 text-green-500 animate-bounce" />
                <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">{successMsg}</p>
                <Link to="/login" className="mt-6 inline-block w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  Proceed to Sign In
                </Link>
              </div>
            )}

            {errorMsg && (
              <div className="flex flex-col items-center gap-3">
                <ShieldAlert className="h-14 w-14 text-red-500 animate-pulse" />
                <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{errorMsg}</p>
                <Link to="/register" className="mt-6 inline-block w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50">
                  Try Registering Again
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
