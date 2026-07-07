import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FileText, Shield, CheckCircle, Users, Search, ArrowRight, ShieldCheck, Zap, Award, MessageSquare 
} from 'lucide-react';
import logoImage from '../assets/logo.png';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [trackingId, setTrackingId] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* 1. Header (Dark Forest Green) */}
      <header className="bg-[#062c19] text-white px-6 py-4 shadow-md w-full sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Network Title block */}
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-full border-2 border-emerald-800 bg-white shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src={logoImage} 
                alt="Shield Seal Logo" 
                className="h-full w-full object-contain p-0.5"
              />
            </div>
            {/* Text details */}
            <div className="flex flex-col">
              <h1 className="text-md md:text-lg font-bold tracking-tight leading-tight uppercase font-serif text-[#f2e6d0]">
                Public Service Complaint Network
              </h1>
              <div className="text-[9px] font-semibold text-emerald-100 tracking-wider uppercase opacity-90 mt-0.5 leading-none">
                Building Trust • Ensuring Quality
              </div>
              <div className="text-[8px] font-bold text-[#d4af37] tracking-widest uppercase opacity-85 mt-0.5 leading-none">
                Efficiency • Accountability • Feedback
              </div>
            </div>
          </div>

          {/* Navigation links & Actions */}
          <nav className="flex items-center gap-4 md:gap-6 text-xs md:text-sm font-semibold text-slate-100">
            <Link to="/" className="hover:text-[#d4af37] transition-colors">Home</Link>
            <button onClick={handleFileComplaintClick} className="hover:text-[#d4af37] transition-colors font-semibold">
              File a Complaint
            </button>
            <Link to="/track" className="hover:text-[#d4af37] transition-colors">Track Status</Link>
            <a href="#about" className="hover:text-[#d4af37] transition-colors">About Us</a>
            
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="bg-[#ac734c] hover:bg-[#8f5e3e] text-white px-3.5 py-1.5 rounded-md font-bold transition-all shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-[#ac734c] hover:bg-[#8f5e3e] text-white px-3.5 py-1.5 rounded-md font-bold transition-all shadow-sm"
              >
                Login
              </Link>
            )}

            {/* Search toggler */}
            <div className="relative">
              <button 
                onClick={() => setSearchOpen(!searchOpen)} 
                className="flex items-center gap-1 hover:text-[#d4af37] transition-colors p-1"
                title="Search complaints"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
              {searchOpen && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 shadow-lg flex gap-1 w-64">
                  <input 
                    type="text" 
                    placeholder="Search by ticket ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-850 dark:text-white dark:bg-slate-850 w-full outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/track-complaint/${searchQuery.trim()}`);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (searchQuery.trim()) navigate(`/track-complaint/${searchQuery.trim()}`);
                    }}
                    className="bg-[#062c19] text-white text-xs px-2 py-1 rounded hover:bg-emerald-900"
                  >
                    Go
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-16 md:py-24 px-6">
        {/* Soft office hall blurred background simulation */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none dark:opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#062c19] dark:text-emerald-400 font-serif leading-tight max-w-2xl uppercase">
            Transforming Feedback <br />
            Into Quality Service
          </h2>
          
          <button 
            onClick={handleFileComplaintClick}
            className="group mt-10 relative flex items-center justify-center gap-3.5 bg-[#ac734c] hover:bg-[#8f5e3e] text-white px-8 py-4 rounded-full text-md font-bold transition-all shadow-md hover:scale-105 active:scale-95"
          >
            <span>FILE A NEW COMPLAINT</span>
            <div className="bg-white/20 rounded-full p-1 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      </section>

      {/* 3. The Four Modern Elevated Cards Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: QUICK FILE */}
          <div 
            onClick={handleFileComplaintClick}
            className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-600 dark:hover:border-emerald-800 transition-all flex flex-col items-center text-center group"
          >
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-5">
              Quick File
            </h3>
            <div className="relative h-20 w-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shadow-inner group-hover:scale-110 transition-transform">
              <FileText className="h-10 w-10 text-emerald-700 dark:text-emerald-400" />
              <div className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-1 border-2 border-white dark:border-slate-900 shadow">
                <span className="text-[10px] leading-none font-bold block">+</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-6 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              Start a new submission.
            </p>
          </div>

          {/* Card 2: TRACK STATUS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-5">
              Track Status
            </h3>
            
            <div className="flex items-center gap-4 w-full justify-center mb-6">
              <div className="h-12 w-12 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <Shield className="h-6 w-6 text-blue-750 dark:text-blue-400" />
              </div>
              <div className="flex-1 max-w-[120px] bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="bg-emerald-600 h-full w-[70%] animate-pulse" />
              </div>
            </div>

            <form onSubmit={handleTrackSubmit} className="w-full mt-auto">
              <div className="relative flex items-center w-full">
                <input 
                  type="text" 
                  placeholder="Enter Tracking ID." 
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:bg-white transition-all pr-8"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Submit track code"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: RECENT RESOLUTIONS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider text-center mb-5">
              Recent Resolutions
            </h3>
            
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <div className="flex items-start gap-2.5 text-left text-xs font-semibold text-slate-650 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="leading-tight">Streetlight Repaired</p>
                  <span className="text-[9px] text-slate-400">Completed</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-left text-xs font-semibold text-slate-650 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="leading-tight">Water Leak Fixed</p>
                  <span className="text-[9px] text-slate-400">Completed</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-left text-xs font-semibold text-slate-650 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="leading-tight">Road Patch Work</p>
                  <span className="text-[9px] text-slate-400">Anonymized</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: OUR COMMITMENT */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider text-center mb-5">
              Our Commitment
            </h3>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-250">
                <div className="h-8 w-8 bg-[#f5e6d3] dark:bg-amber-950/20 rounded-full flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-[#ac734c]" />
                </div>
                <span>Efficiency</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-250">
                <div className="h-8 w-8 bg-[#f5e6d3] dark:bg-amber-950/20 rounded-full flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4 text-[#ac734c]" />
                </div>
                <span>Accountability</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-250">
                <div className="h-8 w-8 bg-[#f5e6d3] dark:bg-amber-950/20 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-[#ac734c]" />
                </div>
                <span>Feedback</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. About Us Footer Block */}
      <footer id="about" className="bg-slate-900 text-slate-400 py-10 px-6 border-t border-slate-850">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-medium">
          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">About The Network</h4>
            <p className="leading-relaxed">
              The Public Service Complaint Network (PSCN) is an advanced City Governance portal aimed at bringing efficiency, transparency, and trust between citizens and civic services. Powered by modern AI classification, language translation, and semantic duplication controls, we ensure that every community issue reaches the right department and resolution officer instantly.
            </p>
          </div>
          <div className="flex flex-col md:items-end justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">Contact Support</h4>
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
