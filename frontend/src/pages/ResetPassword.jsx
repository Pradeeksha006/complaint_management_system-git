/*import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Sparkles, Lock, Key, ShieldAlert, CheckCircle2, Loader2, ArrowLeft, Mail } from 'lucide-react';

const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Inputs
  const [email, setEmail] = useState(state?.email || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isStaff = state?.requiresPin || false;

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/auth/verify-reset-otp', { email, code });
      setOtpVerified(true);
      setSuccessMsg('Verification successful! Please choose a new password.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Please verify the code/PIN is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/auth/reset-password', { 
        email, 
        code, 
        newPassword: password 
      });
      setSuccessMsg('Your password has been reset successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header *//*}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-black text-xs">
            CMS
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            {otpVerified ? 'Create New Password' : 'Verify Recovery'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center font-medium">
            {otpVerified 
              ? 'Enter and confirm your new password below.' 
              : (state?.message || 'Please enter verification details below to reset your password.')
            }
          </p>
        </div>

        {/* Feedback *//*}
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

        {!otpVerified ? (
          /* Step 1: Verify OTP *//*
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address / Username</label>
              {state?.email ? (
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {email}
                </div>
              ) : (
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or username"
                    className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white focus:border-blue-500 text-slate-700"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                {isStaff ? 'Secret Recovery PIN' : 'Verification Code (OTP)'}
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={isStaff ? 'Enter 6-digit Security PIN' : 'Enter 6-digit OTP'}
                  className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white focus:border-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isStaff ? 'Verify PIN' : 'Verify OTP')}
            </button>
          </form>
        ) : (
          /* Step 2: New Password Inputs *//*
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Account</label>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white focus:border-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white focus:border-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-455 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to recover
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;*/
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import {
  Lock,
  Key,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Mail,
} from "lucide-react";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const queryEmail = new URLSearchParams(location.search).get("email") || "";

  const [email, setEmail] = useState(state.email || queryEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [requiresPin, setRequiresPin] = useState(state.requiresPin || false);

  const isStaff = requiresPin;

  const handleSendOtp = async () => {
    const account = email.trim();
    if (!account) {
      setErrorMsg("Please enter your email or username first.");
      return;
    }

    setSendingOtp(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.post("/api/auth/forgot-password", {
        email: account,
      });
      setRequiresPin(res.data.requiresPin);
      setSuccessMsg(res.data.message || "Verification code has been sent.");
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send verification code."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!email || !code) {
      setErrorMsg("Please enter all fields.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.post("/api/auth/verify-reset-otp", {
        email: email.trim(),
        code: code.trim(),
      });

      setOtpVerified(true);
      setSuccessMsg(
        "Verification successful! Please choose a new password."
      );
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Verification failed. Please verify the code/PIN."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    if (!password || !confirmPassword) {
      setErrorMsg("Please fill all fields.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      setErrorMsg("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/reset-password", {
        email: email.trim(),
        code: code.trim(),
        newPassword: password,
      });

      setSuccessMsg(
        "Your password has been reset successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Password reset failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-500/20">
            CMS
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            {otpVerified ? "Create New Password" : "Verify Recovery"}
          </h2>

          <p className="mt-1 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {otpVerified
              ? "Enter and confirm your new password below."
              : state.message ||
                "Please enter verification details below to reset your password."}
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {!otpVerified ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Email Address / Username
              </label>

              {state.email ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {email}
                </div>
              ) : (
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or username"
                    className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 dark:border-slate-800 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* OTP */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {isStaff
                  ? "Secret Recovery PIN"
                  : "Verification Code (OTP)"}
              </label>

              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={
                    isStaff
                      ? "Enter 6-digit Security PIN"
                      : "Enter 6-digit OTP"
                  }
                  className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 dark:border-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {!isStaff && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300"
              >
                {sendingOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send OTP"
                )}
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isStaff ? (
                "Verify PIN"
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Account
              </label>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {email}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                New Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 dark:border-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Confirm Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 dark:border-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/10 transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to recover
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
