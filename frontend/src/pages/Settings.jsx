import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { updateUser } from '../redux/authSlice';
import { Sparkles, User, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // Forgot password flow states within settings
  const [recoveryStep, setRecoveryStep] = useState('idle'); // 'idle' | 'prompt' | 'sent'
  const [requiresPin, setRequiresPin] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpStatus, setOtpStatus] = useState('');

  const { register: regProfile, handleSubmit: handleProfileSubmit } = useForm({
    defaultValues: {
      fullName: user?.fullName,
      phoneNumber: user?.phoneNumber
    }
  });

  const { register: regPass, handleSubmit: handlePassSubmit, reset: resetPass } = useForm();

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setPassSuccess('');
    setOtpStatus('');
    try {
      const emailOrUser = user?.email || user?.username;
      const res = await api.post('/api/auth/forgot-password', { email: emailOrUser });
      setRequiresPin(res.data.requiresPin);
      setOtpStatus(res.data.message);
      setRecoveryStep('sent');
    } catch (err) {
      alert('Failed to send verification code: ' + (err.response?.data?.message || err.message));
    } finally {
      setOtpLoading(false);
    }
  };

  const onUpdateProfile = async (data) => {
    setLoadingProfile(true);
    setProfileSuccess('');
    try {
      const res = await api.put('/api/users/profile/update', {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber
      });
      dispatch(updateUser(res.data));
      setProfileSuccess('Profile details updated successfully!');
    } catch (err) {
      alert('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingProfile(false);
    }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setLoadingPass(true);
    setPassSuccess('');
    try {
      if (recoveryStep === 'sent') {
        // Recovery path
        await api.post('/api/auth/reset-password', {
          email: user?.email || user?.username,
          code: data.recoveryCode,
          newPassword: data.newPassword
        });
        setPassSuccess('Security credentials recovered successfully!');
        setRecoveryStep('idle');
        setOtpStatus('');
      } else {
        // Standard path
        await api.put('/api/users/profile/update', {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        });
        setPassSuccess('Security credentials updated successfully!');
      }
      resetPass();
    } catch (err) {
      alert('Failed to change password: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Account Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure profile preferences, credentials, and details.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="flex items-center gap-2 text-md font-bold text-slate-800 dark:text-white">
            <User className="h-5 w-5 text-blue-600" />
            Profile Information
          </h3>

          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900/30">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>{profileSuccess}</p>
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Username (Read-Only)</label>
              <input 
                type="text"
                disabled
                value={user?.username || ''}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Email Address (Read-Only)</label>
              <input 
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">Full Name</label>
              <input 
                type="text"
                required
                {...regProfile('fullName')}
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">Phone Number</label>
              <input 
                type="text"
                {...regProfile('phoneNumber')}
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingProfile}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loadingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Security Credentials Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="flex items-center gap-2 text-md font-bold text-slate-800 dark:text-white">
            <KeyRound className="h-5 w-5 text-purple-600" />
            Security & Password
          </h3>

          {passSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900/30">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>{passSuccess}</p>
            </div>
          )}

          <form onSubmit={handlePassSubmit(onChangePassword)} className="space-y-4">
            {recoveryStep === 'idle' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Current Password</label>
                    <button
                      type="button"
                      onClick={() => setRecoveryStep('prompt')}
                      className="text-[11px] text-blue-600 font-bold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input 
                    type="password"
                    required
                    {...regPass('currentPassword')}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">New Password</label>
                  <input 
                    type="password"
                    required
                    {...regPass('newPassword')}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    {...regPass('confirmPassword')}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingPass}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {loadingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Password'}
                </button>
              </>
            )}

            {recoveryStep === 'prompt' && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-4 text-center">
                <p className="text-xs font-medium text-slate-650 dark:text-slate-350">
                  {user?.role === 'ROLE_CITIZEN' 
                    ? 'Verify your identity by sending a verification code (OTP) to your registered email address.' 
                    : 'Verify your identity by entering your staff Secret Recovery PIN.'}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (user?.role === 'ROLE_CITIZEN') {
                      await handleSendOtp();
                    } else {
                      setRequiresPin(true);
                      setRecoveryStep('sent');
                    }
                  }}
                  disabled={otpLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/10"
                >
                  {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : user?.role === 'ROLE_CITIZEN' ? 'Send OTP' : 'Verify via PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => setRecoveryStep('idle')}
                  className="text-xs text-slate-550 hover:text-slate-800 dark:text-slate-400 hover:underline block mx-auto font-medium"
                >
                  Back to password change
                </button>
              </div>
            )}

            {recoveryStep === 'sent' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 uppercase">
                      {requiresPin ? 'Secret Recovery PIN' : 'Verification Code (OTP)'}
                    </label>
                    {!requiresPin && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        {otpLoading ? 'Resending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>
                  <input 
                    type="text"
                    required
                    {...regPass('recoveryCode')}
                    placeholder={requiresPin ? 'Enter Secret Recovery PIN' : 'Enter 6-digit OTP'}
                    className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
                  />
                  {otpStatus && (
                    <p className="text-[10px] text-blue-600 font-semibold mt-1.5">{otpStatus}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">New Password</label>
                  <input 
                    type="password"
                    required
                    {...regPass('newPassword')}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    {...regPass('confirmPassword')}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingPass}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {loadingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryStep('idle');
                    setOtpStatus('');
                  }}
                  className="text-center w-full block text-xs text-slate-500 hover:text-slate-800 hover:underline mt-2 font-medium"
                >
                  Cancel password recovery
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
