import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { 
  ShieldAlert, CheckCircle2, Lock, Mail, User, Phone, Loader2, Eye, EyeOff, Sun, Moon 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import logoImage from '../assets/logo.png';
import loginHeroImage from '../assets/login_hero.png';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP step states
  const [registrationPending, setRegistrationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();

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
      setRegisteredEmail(submitData.email);
      setRegistrationPending(true);
      setSuccessMsg('Account details saved. Please check your email for the verification code.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setOtpLoading(true);
    setErrorMsg('');
    setOtpSuccess('');
    try {
      await api.post('/api/auth/register/verify-otp', {
        email: registeredEmail,
        code: otpCode
      });
      setOtpSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setErrorMsg('');
    setOtpSuccess('');
    try {
      await api.post('/api/auth/register/resend-otp', {
        email: registeredEmail
      });
      setOtpSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setOtpLoading(false);
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
            <h2 className="text-sm font-black tracking-tight text-slate-855 dark:text-white uppercase leading-none">
              Public Service Complaint Network
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 leading-none">
              Your Voice. Our Action. Better Communities.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8 max-w-md w-full mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Welcome! 👋
            </p>
            <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white leading-tight tracking-tight">
              Create <span className="text-blue-600">Your Account</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fill out the information below to register and start managing complaints.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/20 p-4 text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Registration Pending / OTP View */}
          {registrationPending ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-left p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                  We sent a 6-digit verification code to your email:<br />
                  <strong className="text-blue-600">{registeredEmail}</strong>.
                </p>
                <p className="text-[10px] text-slate-400">
                  Please enter the code below to verify your email and activate your account.
                </p>
              </div>

              {otpSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 p-3 text-xs text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <p className="font-bold">{otpSuccess}</p>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Verification Code</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border pl-11 pr-4 py-3 text-sm outline-none bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/10"
              >
                {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Activate'}
              </button>

              <div className="flex items-center justify-between gap-3 text-xs font-bold pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpLoading}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationPending(false)}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Edit Registration Info
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      {...register('fullName')}
                      placeholder="Your Name"
                      className={`w-full rounded-xl border pl-11 pr-4 py-3 text-sm outline-none transition-all bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                        errors.fullName 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                      }`}
                    />
                  </div>
                  {errors.fullName && <span className="text-xs text-red-500 font-semibold mt-1 block">{errors.fullName.message}</span>}
                </div>

                {/* Username */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      {...register('username')}
                      placeholder="Username"
                      className={`w-full rounded-xl border pl-11 pr-4 py-3 text-sm outline-none transition-all bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                        errors.username 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                      }`}
                    />
                  </div>
                  {errors.username && <span className="text-xs text-red-500 font-semibold mt-1 block">{errors.username.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="email"
                      {...register('email')}
                      placeholder="youremail@example.com"
                      className={`w-full rounded-xl border pl-11 pr-4 py-3 text-sm outline-none transition-all bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                        errors.email 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                      }`}
                    />
                  </div>
                  {errors.email && <span className="text-xs text-red-500 font-semibold mt-1 block">{errors.email.message}</span>}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      {...register('phoneNumber')}
                      placeholder="+919876543210"
                      className={`w-full rounded-xl border pl-11 pr-4 py-3 text-sm outline-none transition-all bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                        errors.phoneNumber 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                      }`}
                    />
                  </div>
                  {errors.phoneNumber && <span className="text-xs text-red-500 font-semibold mt-1 block">{errors.phoneNumber.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="••••••••"
                      className={`w-full rounded-xl border pl-11 pr-11 py-3 text-sm outline-none transition-all bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                        errors.password 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
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
                  {errors.password && <span className="text-xs text-red-500 font-semibold mt-1 block">{errors.password.message}</span>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="••••••••"
                      className={`w-full rounded-xl border pl-11 pr-11 py-3 text-sm outline-none transition-all bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                        errors.confirmPassword 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-655 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="text-xs text-red-500 font-semibold mt-1 block">{errors.confirmPassword.message}</span>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/10 mt-6"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Register & Send OTP <span className="ml-1">→</span></>}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-550 mt-auto pt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign in
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

export default Register;
