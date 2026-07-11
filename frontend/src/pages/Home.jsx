import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FileText, Shield, CheckCircle, Users, Search, ArrowRight, ShieldCheck, Zap, Award, 
  MessageSquare, HelpCircle, Building2, ClipboardList, Send, MapPin, BellRing,
  Droplets, Recycle, Lightbulb, Milestone, HeartPulse, Landmark, Coins, FileSpreadsheet, 
  Trees, Leaf, Flame, AlertTriangle, Bus, Route, Building
} from 'lucide-react';
import logoImage from '../assets/logo.png';
import heroImage from '../assets/hero.png';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [trackingId, setTrackingId] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const wasDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    if (wasDark) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    return () => {
      // Re-enable dark mode if it was active and we're not on Home page
      if (wasDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
    };
  }, []);

  const handleFileComplaintClick = () => {
    if (isAuthenticated) {
      navigate('/file-complaint');
    } else {
      navigate('/login', { state: { from: { pathname: '/file-complaint' } } });
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/track-complaint/${trackingId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020b06] flex flex-col font-sans transition-colors duration-300">
      {/* 1. Header (Premium Glassmorphism Style) */}
      <header className="bg-white/95 dark:bg-[#020b06]/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 dark:border-[#041d10] px-6 py-4 shadow-sm w-full transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Network Title block */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full bg-white shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-[#041d10]">
              <img 
                src={logoImage} 
                alt="Seal Logo" 
                className="h-full w-full object-contain p-0.5"
              />
            </div>
            {/* Text details */}
            <div className="flex flex-col">
              <span className="text-md md:text-lg font-bold tracking-tight text-slate-900 dark:text-[#f2e6d0] font-serif leading-none">
                Public Service Complaint Network
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-emerald-500/60 mt-1">
                Better Cities, Together
              </span>
            </div>
          </div>

          {/* Navigation links & Actions */}
          <nav className="flex items-center gap-4 md:gap-6 text-xs md:text-sm font-semibold">
            <Link to="/" className="text-[#062c19] dark:text-[#d4af37] font-bold">Home</Link>
            <a href="#features" className="text-slate-650 dark:text-slate-300 hover:text-[#062c19] dark:hover:text-[#d4af37] transition-colors">Features</a>
            <a href="#departments" className="text-slate-650 dark:text-slate-300 hover:text-[#062c19] dark:hover:text-[#d4af37] transition-colors">Departments</a>
            <a href="#how-it-works" className="text-slate-650 dark:text-slate-300 hover:text-[#062c19] dark:hover:text-[#d4af37] transition-colors">How It Works</a>
            <a href="#about" className="text-slate-650 dark:text-slate-300 hover:text-[#062c19] dark:hover:text-[#d4af37] transition-colors">About Us</a>
            
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="bg-[#062c19] hover:bg-emerald-900 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm shadow-emerald-900/10 text-xs md:text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 px-4 py-2 rounded-lg font-bold transition-all text-xs md:text-sm"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-[#062c19] hover:bg-emerald-900 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm shadow-emerald-900/10 text-xs md:text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* 2. Mockup-styled Premium Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50/20 via-white to-amber-50/10 dark:from-[#020b06] dark:via-[#020b06] dark:to-[#03140c]/40 py-20 px-6 border-b border-slate-100 dark:border-[#041d10] transition-colors duration-300">
        
        {/* Soft office hall grid background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:opacity-[0.015]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 text-left flex flex-col items-start">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-serif uppercase">
              Every Complaint <br />
              <span className="text-[#062c19] dark:text-[#d4af37] font-serif">Matters.</span>
            </h1>
            
            <p className="mt-6 text-sm md:text-base text-slate-600 dark:text-emerald-100/60 leading-relaxed max-w-xl font-medium">
              A transparent and efficient platform that connects citizens with the government. Report issues, track progress, and help build better communities.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
              <button 
                onClick={handleFileComplaintClick}
                className="bg-[#062c19] hover:bg-emerald-900 text-white font-bold px-7 py-3.5 rounded-lg transition-all shadow-md shadow-emerald-900/10 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText className="h-4.5 w-4.5" />
                <span>File a Complaint</span>
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/40 font-bold px-7 py-3.5 rounded-lg transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="h-4.5 w-4.5" />
                <span>Track Complaint</span>
              </button>
            </div>
          </div>

          {/* Right Hero Column (Phone Mockup with floating effect) */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[80px]" />
            <img 
              src={heroImage} 
              alt="PSCN Application mockup" 
              className="w-auto h-auto max-h-[480px] object-contain drop-shadow-[0_25px_60px_rgba(6,44,25,0.18)] dark:drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)] animate-float"
            />
          </div>
        </div>
      </section>

      {/* 3. Features Row (Mockup Card overlay) */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 w-full">
        <div id="features" className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-2xl shadow-xl py-6 px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 divide-y sm:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* Easy Complaint */}
          <div className="flex flex-col items-center text-center p-3 first:pl-0">
            <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#062c19] dark:text-[#d4af37] flex items-center justify-center shrink-0 mb-3.5">
              <FileText className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Easy Complaint</h4>
            <p className="text-[11px] text-slate-500 dark:text-emerald-100/40 mt-1.5 max-w-[150px] leading-relaxed">
              File complaints in just a few simple steps.
            </p>
          </div>

          {/* Track Real-time */}
          <div className="flex flex-col items-center text-center p-3 pt-6 sm:pt-3 sm:border-t-0">
            <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#062c19] dark:text-[#d4af37] flex items-center justify-center shrink-0 mb-3.5">
              <Search className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Track Real-time</h4>
            <p className="text-[11px] text-slate-500 dark:text-emerald-100/40 mt-1.5 max-w-[150px] leading-relaxed">
              Track the status of your complaints in real-time.
            </p>
          </div>

          {/* Instant Notifications */}
          <div className="flex flex-col items-center text-center p-3 pt-6 sm:pt-3">
            <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#062c19] dark:text-[#d4af37] flex items-center justify-center shrink-0 mb-3.5">
              <BellRing className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Instant Notifications</h4>
            <p className="text-[11px] text-slate-500 dark:text-emerald-100/40 mt-1.5 max-w-[150px] leading-relaxed">
              Receive updates and alerts at every step.
            </p>
          </div>

          {/* Secure & Transparent */}
          <div className="flex flex-col items-center text-center p-3 pt-6 sm:pt-3">
            <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#062c19] dark:text-[#d4af37] flex items-center justify-center shrink-0 mb-3.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Secure & Transparent</h4>
            <p className="text-[11px] text-slate-500 dark:text-emerald-100/40 mt-1.5 max-w-[150px] leading-relaxed">
              Your data is safe with us. 100% transparency.
            </p>
          </div>

          {/* Better Analytics */}
          <div className="flex flex-col items-center text-center p-3 pt-6 sm:pt-3 last:pr-0">
            <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#062c19] dark:text-[#d4af37] flex items-center justify-center shrink-0 mb-3.5">
              <Award className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Better Analytics</h4>
            <p className="text-[11px] text-slate-500 dark:text-emerald-100/40 mt-1.5 max-w-[150px] leading-relaxed">
              Data-driven insights for better decision making.
            </p>
          </div>

        </div>
      </div>

      {/* 3.1. Visual "How it Works" Step Flow */}
      <section id="how-it-works" className="bg-white dark:bg-[#020b06] border-b border-slate-100 dark:border-[#041d10] py-20 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h3 className="text-xs font-bold text-[#ac734c] dark:text-[#d4af37] uppercase tracking-widest">Procedural Flow</h3>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-800 dark:text-white mt-2 leading-tight uppercase">
              How PSCN Operates
            </h2>
            <div className="w-12 h-1 bg-[#ac734c] dark:bg-[#d4af37] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="h-16 w-16 bg-[#f5e6d3] dark:bg-amber-950/20 rounded-2xl border border-[#ac734c]/20 flex items-center justify-center text-[#ac734c] dark:text-[#d4af37] shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
                <ClipboardList className="h-8 w-8" />
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold text-slate-450 dark:text-emerald-500/60 uppercase">Step 01</span>
                <h4 className="text-md font-bold text-slate-800 dark:text-slate-250 mt-1">Submit Incident</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2 max-w-[200px] mx-auto">
                  Provide description, address, coordinates, and attachments.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
                <Zap className="h-8 w-8" />
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold text-slate-450 dark:text-emerald-500/60 uppercase">Step 02</span>
                <h4 className="text-md font-bold text-slate-800 dark:text-slate-250 mt-1">AI Smart Routing</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2 max-w-[200px] mx-auto">
                  Automatic category detection and assignment to the right department.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
                <Users className="h-8 w-8" />
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold text-slate-450 dark:text-emerald-500/60 uppercase">Step 03</span>
                <h4 className="text-md font-bold text-slate-800 dark:text-slate-250 mt-1">Officer Assignment</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2 max-w-[200px] mx-auto">
                  Assigned resolution officer investigates and updates timelines.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="h-16 w-16 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
                <BellRing className="h-8 w-8" />
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold text-slate-450 dark:text-emerald-500/60 uppercase">Step 04</span>
                <h4 className="text-md font-bold text-slate-800 dark:text-slate-250 mt-1">Track & Resolve</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2 max-w-[200px] mx-auto">
                  Receive live email updates, verify solutions, and give feedback.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Municipal Sectors Overview */}
      <section id="departments" className="bg-slate-50 dark:bg-[#020b06] border-b border-slate-200 dark:border-[#041d10] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h3 className="text-xs font-bold text-[#ac734c] dark:text-[#d4af37] uppercase tracking-widest">Public Administration</h3>
              <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-800 dark:text-white mt-2 uppercase">
                Active Municipal Sectors
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-emerald-100/40 max-w-sm mt-3 md:mt-0 font-medium">
              Citizens can file complaints under any of these central departments, which operate transparent workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Water & Sewage */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Water Supply & Sewage</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Pipelines, contamination, sewage blockages, and supply faults.</p>
              </div>
            </div>

            {/* Sanitation & Waste */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Recycle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Sanitation & Waste</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Garbage collection, littering, street sweeping, and dumping sites.</p>
              </div>
            </div>

            {/* Electricity & Lighting */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Electricity & Lighting</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Streetlight failures, voltage fluctuations, and hanging wire hazards.</p>
              </div>
            </div>

            {/* Roads & Traffic */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Milestone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Roads & Infrastructure</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Potholes, broken sidewalks, and highway/street repairs.</p>
              </div>
            </div>

            {/* Public Health & Veterinary */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Public Health & Veterinary</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Stray animal control, food hygiene, and pest control spray.</p>
              </div>
            </div>

            {/* Law & Security */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Law & Security</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Public safety, security hazards, local policing, and disturbances.</p>
              </div>
            </div>

            {/* Municipal Administration */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Municipal Administration</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">General municipal services, civic administration, and public property.</p>
              </div>
            </div>

            {/* Revenue Department */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Revenue Department</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Land records, property tax, surveys, and encroachment issues.</p>
              </div>
            </div>

            {/* Forest Department */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Trees className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Forest Department</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Tree hazards, illegal cutting, wildlife rescue, and park land.</p>
              </div>
            </div>

            {/* Fire & Rescue */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Fire & Rescue Services</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Fire incidents, rescue operations, gas leaks, and explosions.</p>
              </div>
            </div>

            {/* Transport Department */}
            <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md hover:border-emerald-500 transition-all duration-300 col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">Transport Department</h4>
                <p className="text-xs text-slate-500 dark:text-emerald-100/40 mt-2">Public transport, transit safety, bus services, and route hazards.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. The Four Modern Elevated Cards Section (Preserved Original Content & Logic) */}
      <section className="max-w-7xl mx-auto px-6 py-16 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: QUICK FILE */}
          <div 
            onClick={handleFileComplaintClick}
            className="cursor-pointer bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-600 dark:hover:border-[#d4af37] transition-all flex flex-col items-center text-center group"
          >
            <h3 className="text-sm font-bold text-slate-700 dark:text-emerald-100/80 uppercase tracking-wider mb-5">
              Quick File
            </h3>
            <div className="relative h-20 w-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900/20 shadow-inner group-hover:scale-110 transition-transform">
              <FileText className="h-10 w-10 text-emerald-700 dark:text-emerald-400" />
              <div className="absolute bottom-1 right-1 bg-emerald-700 text-white rounded-full p-1 border-2 border-white dark:border-[#03140c] shadow">
                <span className="text-[10px] leading-none font-bold block">+</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-6 group-hover:text-emerald-750 dark:group-hover:text-[#d4af37] transition-colors">
              Start a new submission.
            </p>
          </div>

          {/* Card 2: TRACK STATUS */}
          <div id="track-card-section" className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-600 dark:hover:border-[#d4af37] transition-all flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-slate-700 dark:text-emerald-100/80 uppercase tracking-wider mb-5">
              Track Status
            </h3>
            
            <div className="flex items-center gap-4 w-full justify-center mb-6">
              <div className="h-12 w-12 bg-[#f5e6d3]/40 dark:bg-amber-950/20 rounded-full flex items-center justify-center border border-[#f5e6d3] dark:border-emerald-900/20">
                <Shield className="h-6 w-6 text-[#ac734c] dark:text-[#d4af37]" />
              </div>
              <div className="flex-1 max-w-[120px] bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="bg-gradient-to-r from-[#ac734c] to-[#d4af37] h-full w-[70%] animate-pulse" />
              </div>
            </div>

            <form onSubmit={handleTrackSubmit} className="w-full mt-auto">
              <div className="relative flex items-center w-full">
                <input 
                  type="text" 
                  placeholder="Enter Tracking ID." 
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-800 dark:text-white outline-none focus:border-[#ac734c] dark:focus:border-[#d4af37] focus:bg-white transition-all pr-8"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 text-slate-400 hover:text-[#ac734c] dark:hover:text-[#d4af37] transition-colors"
                  title="Submit track code"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: RECENT RESOLUTIONS */}
          <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-600 dark:hover:border-[#d4af37] transition-all flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 dark:text-emerald-100/80 uppercase tracking-wider text-center mb-5">
              Recent Resolutions
            </h3>
            
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <div className="flex items-start gap-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="leading-tight">Streetlight Repaired</p>
                  <span className="text-[9px] text-slate-450 dark:text-slate-400">Completed</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="leading-tight">Water Leak Fixed</p>
                  <span className="text-[9px] text-slate-450 dark:text-slate-400">Completed</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="leading-tight">Road Patch Work</p>
                  <span className="text-[9px] text-slate-450 dark:text-slate-400">Anonymized</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: OUR COMMITMENT */}
          <div className="bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-600 dark:hover:border-[#d4af37] transition-all flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 dark:text-emerald-100/80 uppercase tracking-wider text-center mb-5">
              Our Commitment
            </h3>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-250">
                <div className="h-8 w-8 bg-[#f5e6d3] dark:bg-amber-950/20 rounded-full flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-[#ac734c] dark:text-[#d4af37]" />
                </div>
                <span>Efficiency</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-250">
                <div className="h-8 w-8 bg-[#f5e6d3] dark:bg-amber-950/20 rounded-full flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4 text-[#ac734c] dark:text-[#d4af37]" />
                </div>
                <span>Accountability</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-250">
                <div className="h-8 w-8 bg-[#f5e6d3] dark:bg-amber-950/20 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-[#ac734c] dark:text-[#d4af37]" />
                </div>
                <span>Feedback</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Us Footer Block */}
      <footer id="about" className="bg-slate-950 text-slate-400 dark:text-slate-400 py-10 px-6 border-t border-emerald-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-medium">
          <div>
            <h4 className="text-sm font-bold text-slate-250 uppercase tracking-wider mb-3">About The Network</h4>
            <p className="leading-relaxed">
              The Public Service Complaint Network (PSCN) is an advanced City Governance portal aimed at bringing efficiency, transparency, and trust between citizens and civic services. Powered by modern AI classification, language translation, and semantic duplication controls, we ensure that every community issue reaches the right department and resolution officer instantly.
            </p>
          </div>
          <div className="flex flex-col md:items-end justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-250 uppercase tracking-wider mb-3">Contact Support</h4>
              <p className="leading-relaxed">Email: support@pscn.gov | Helpline: 1800-345-0011</p>
            </div>
            <p className="mt-6 text-[10px] opacity-75">
              &copy; {new Date().getFullYear()} Public Service Complaint Network. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
