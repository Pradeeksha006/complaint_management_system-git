import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useSelector } from 'react-redux';
import { 
  Sparkles, MapPin, Upload, AlertCircle, Eye, Info, Loader2, CheckCircle2, X,
  FolderOpen, ArrowRight, ArrowLeft, HelpCircle, FileText, Check, Shield, Search, Printer
} from 'lucide-react';
import api from '../services/api';
import logoImage from '../assets/logo.png';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issues in Vite packaging
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const schema = yup.object().shape({
  title: yup.string().min(5, 'Title must be at least 5 characters').required('Title is required'),
  description: yup.string().min(10, 'Description must be at least 10 characters').required('Description is required'),
});

const CreateComplaint = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Multi-step state: 1 = Describe, 2 = Evidence, 3 = Contacts, 4 = Review
  const [activeStep, setActiveStep] = useState(1);
  
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [isManualDeptSelection, setIsManualDeptSelection] = useState(false);
  
  // Geo coordinates state (default center: Mumbai coordinates)
  const [position, setPosition] = useState([19.0760, 72.8777]);
  const [address, setAddress] = useState('');
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Language configuration
  const [language, setLanguage] = useState('English');

  // Anonymity configuration
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Duplicate state
  const [duplicates, setDuplicates] = useState([]);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  
  // Submission & status states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { register, handleSubmit, watch, trigger, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const descriptionWatch = watch('description');
  const titleWatch = watch('title');

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Real-time AI auto-detection of department based on title & description
  useEffect(() => {
    if (isManualDeptSelection) return;
    if (!titleWatch || titleWatch.trim().length < 5) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.post('/api/ai/predict-department', {
          title: titleWatch,
          description: descriptionWatch || '',
          language
        });
        if (res.data && res.data.departmentId) {
          setSelectedDept(res.data.departmentId.toString());
        }
      } catch (err) {
        console.error("AI Department auto-detect failed, using local rules-based keywords", err);
        runClientDepartmentFallback();
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [titleWatch, descriptionWatch, departments, isManualDeptSelection, language]);

  const runClientDepartmentFallback = () => {
    const content = `${titleWatch || ''} ${descriptionWatch || ''}`.toLowerCase();
    if (!content.trim()) return;

    const deptKeywords = {
      WT: ['water', 'leak', 'pipe', 'drain', 'sewer', 'plumb', 'tap', 'contamination', 'drainage', 'flooding', 'குடிநீர்', 'தண்ணீர்', 'குழாய்', 'கசிவு', 'சாக்கடை'],
      RD: ['road', 'pothole', 'highway', 'street', 'bridge', 'sidewalk', 'curb', 'pavement', 'சாலை', 'பள்ளம்', 'பாதை', 'தெரு'],
      EL: ['electricity', 'power', 'wire', 'spark', 'transformer', 'light', 'voltage', 'blackout', 'streetlight', 'மின்சார', 'விளக்கு', 'தெருவிளக்கு'],
      SN: ['garbage', 'trash', 'waste', 'sanitation', 'clean', 'dump', 'litter', 'குப்பை', 'அசுத்தம்', 'கழிவுகள்'],
      PL: ['police', 'theft', 'robbery', 'crime', 'fight', 'security', 'guard', 'nuisance', 'assault', 'drinking', 'alcohol', 'drunk', 'போலீஸ்', 'திருட்டு', 'சண்டை', 'மது'],
      HL: ['stray', 'dog', 'health', 'mosquito', 'pest', 'animal', 'disease', 'hygiene', 'நாய்', 'கொசு', 'நோய்'],
      FI: ['fire', 'flame', 'burning', 'smoke', 'gas leak', 'explosion', 'blast', 'rescue', 'trapped', 'emergency'],
      FR: ['forest', 'tree cutting', 'illegal cutting', 'fallen tree', 'wildlife', 'wild animal', 'snake', 'monkey', 'elephant', 'environment'],
      RV: ['revenue', 'land record', 'patta', 'chitta', 'survey', 'property tax', 'certificate', 'income certificate', 'community certificate', 'encroachment', 'land dispute'],
      TR: ['bus', 'metro', 'traffic', 'transport', 'vehicle', 'permit', 'driving license', 'auto', 'taxi', 'bus stop', 'route', 'fare'],
      MU: ['municipal', 'corporation', 'ward office', 'public property', 'street vendor', 'license', 'birth certificate', 'death certificate', 'park', 'playground', 'public toilet', 'community hall']
    };

    let predictedCode = '';
    for (const [code, words] of Object.entries(deptKeywords)) {
      if (words.some(word => content.includes(word))) {
        predictedCode = code;
        break;
      }
    }

    if (predictedCode) {
      const match = departments.find(d => d.code === predictedCode);
      if (match) {
        setSelectedDept(match.id.toString());
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const MapClickHandler = () => {
    const map = useMapEvents({
      dblclick(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
      touchstart(e) {
        if (e.originalEvent.touches) {
          if (e.originalEvent.touches.length === 2) {
            map.dragging.enable();
          } else {
            map.dragging.disable();
          }
        } else {
          map.dragging.enable();
        }
      },
      touchmove(e) {
        if (e.originalEvent.touches) {
          if (e.originalEvent.touches.length === 2) {
            map.dragging.enable();
          } else {
            map.dragging.disable();
          }
        } else {
          map.dragging.enable();
        }
      }
    });

    useEffect(() => {
      if (position) {
        map.setView(position, map.getZoom());
      }
    }, [position, map]);

    return null;
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      setAddress(`Latitude: ${lat.toFixed(5)}, Longitude: ${lon.toFixed(5)}`);
    }
  };

  const geocodeAddress = async (query) => {
    if (!query || query.trim().length < 3) return;
    try {
      let searchQuery = query;
      try {
        const aiRes = await api.post('/api/ai/correct-address', { query });
        if (aiRes.data && aiRes.data.correctedQuery) {
          searchQuery = aiRes.data.correctedQuery;
          setAddress(searchQuery);
        }
      } catch (aiErr) {
        console.warn("AI address spelling correction offline, using raw query", aiErr);
      }

      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      let data = await res.json();

      if (!data || data.length === 0) {
        const normalized = searchQuery
          .toLowerCase()
          .replace(/ddy$/g, "di")
          .replace(/dd/g, "d")
          .replace(/pp/g, "p")
          .replace(/tt/g, "t")
          .replace(/kk/g, "k")
          .replace(/ll/g, "l")
          .replace(/nn/g, "n")
          .replace(/rr/g, "r")
          .replace(/y$/g, "i")
          .replace(/ee/g, "i")
          .replace(/oo/g, "u")
          .replace(/zh/g, "l");

        if (normalized !== searchQuery.toLowerCase()) {
          console.log(`No results for "${searchQuery}". Trying phonetic fallback "${normalized}"...`);
          res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&limit=1`);
          data = await res.json();
        }
      }

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPosition([lat, lon]);
        if (data[0].display_name) {
          setAddress(data[0].display_name);
        }
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  const handleAddressKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress(address);
    }
  };

  const triggerLocationFetch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        reverseGeocode(latitude, longitude);
      });
    }
  };

  const handleCheckDuplicates = async () => {
    if (!descriptionWatch || descriptionWatch.length < 10) {
      alert("Please enter a description first.");
      return;
    }
    setSubmitting(true);
    setDuplicateMessage('');
    try {
      const res = await api.post('/api/ai/detect-duplicates', {
        title: titleWatch || "General Incident",
        description: descriptionWatch,
        latitude: position[0],
        longitude: position[1]
      });
      if (res.data && res.data.length > 0) {
        setDuplicates(res.data);
        setDuplicateMessage(`Warning: Found ${res.data.length} similar complaints in this area.`);
      } else {
        setDuplicates([]);
        setDuplicateMessage("No duplicates detected. Your report is unique!");
      }
    } catch (err) {
      setDuplicateMessage('Could not run duplicate check: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (data) => {
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
      return;
    }
    executeSubmit(data);
  };

  const executeSubmit = async (data) => {
    if (!data.title || data.title.trim() === '') {
      setErrorMsg('Complaint Title is a mandatory field.');
      return;
    }
    if (!data.description || data.description.trim() === '') {
      setErrorMsg('Description is a mandatory field.');
      return;
    }
    if (!selectedDept) {
      setErrorMsg('Department is a mandatory field.');
      return;
    }
    if (!address || address.trim() === '') {
      setErrorMsg('Address is a mandatory field.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      
      const finalDesc = language !== 'English' 
        ? `[Language: ${language}] ${data.description}` 
        : data.description;
      
      formData.append('description', finalDesc);
      formData.append('category', 'Auto');
      formData.append('isAnonymous', isAnonymous ? 'true' : 'false');
      formData.append('latitude', position[0].toString());
      formData.append('longitude', position[1].toString());
      formData.append('address', address);
      if (selectedDept) {
        formData.append('departmentId', selectedDept);
      }

      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach(file => {
          formData.append('files', file);
        });
      }

      const res = await api.post('/api/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmittedComplaint(res.data);
      setSuccess(true);
    } catch (err) {
      if (!err.response) {
        setErrorMsg('Network issue or Offline. Saved as Offline Draft successfully.');
        saveToOfflineDrafts(data);
      } else {
        setErrorMsg(err.response?.data?.message || 'Submission failed. Please check form fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const saveToOfflineDrafts = (data) => {
    const draft = {
      title: data.title,
      description: data.description,
      category: 'Auto',
      departmentId: selectedDept,
      latitude: position[0],
      longitude: position[1],
      address: address,
      isAnonymous,
      createdAt: new Date().toISOString()
    };

    const existing = localStorage.getItem('offline_drafts') ? JSON.parse(localStorage.getItem('offline_drafts')) : [];
    existing.push(draft);
    localStorage.setItem('offline_drafts', JSON.stringify(existing));

    setSuccess(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2500);
  };

  const handlePrint = (targetComplaint) => {
    if (!targetComplaint) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the complaint copy.');
      return;
    }

    const formattedDate = new Date(targetComplaint.createdAt || new Date()).toLocaleString();
    const printDate = new Date().toLocaleString();

    const htmlContent = `
      <html>
        <head>
          <title>Complaint_${targetComplaint.id}_Receipt</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #2d3748;
              line-height: 1.5;
              padding: 40px;
            }
            .header {
              text-align: center;
              border-bottom: 3px double #cbd5e0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 800;
              margin: 0;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 12px;
              color: #64748b;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .section {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              background-color: #f8fafc;
            }
            .section-title {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              color: #475569;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
              margin-bottom: 10px;
              letter-spacing: 0.5px;
            }
            .field {
              margin-bottom: 8px;
              font-size: 12px;
            }
            .field-label {
              font-weight: 700;
              color: #475569;
            }
            .description-box {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 30px;
              background-color: #ffffff;
            }
            .description-box p {
              font-size: 13px;
              margin: 0;
              white-space: pre-wrap;
            }
            .footer {
              text-align: center;
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 10px;
              color: #94a3b8;
            }
            .stamp-box {
              float: right;
              border: 2px dashed #cbd5e0;
              padding: 10px 20px;
              font-size: 11px;
              color: #94a3b8;
              text-transform: uppercase;
              font-weight: 800;
              border-radius: 6px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CMS Municipal Authority</h1>
            <p>Official Grievance & Complaint Redressal Certificate</p>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 10px;">Document Generated: ${printDate}</div>
          </div>

          <div class="grid">
            <div class="section">
              <div class="section-title">Ticket Registry Information</div>
              <div class="field"><span class="field-label">Ticket ID:</span> ${targetComplaint.id}</div>
              <div class="field"><span class="field-label">Current Status:</span> <span style="font-weight: 800; color: #1e3a8a;">${targetComplaint.status || 'PENDING'}</span></div>
              <div class="field"><span class="field-label">Priority Level:</span> ${targetComplaint.priority || 'MEDIUM'}</div>
              <div class="field"><span class="field-label">Date Filed:</span> ${formattedDate}</div>
            </div>

            <div class="section">
              <div class="section-title">Filer & Location Registry</div>
              <div class="field"><span class="field-label">Registered By:</span> ${targetComplaint.isAnonymous ? 'Filed Anonymously' : targetComplaint.citizenName}</div>
              <div class="field"><span class="field-label">Filer Contact:</span> ${targetComplaint.isAnonymous ? 'N/A' : (targetComplaint.citizenPhone || 'N/A')}</div>
              <div class="field"><span class="field-label">Assigned Department:</span> ${targetComplaint.departmentName || 'General'}</div>
              <div class="field"><span class="field-label">Incident Address:</span> ${targetComplaint.address || 'N/A'}</div>
            </div>
          </div>

          <div class="description-box">
            <div class="section-title">Subject & Statement of Complaint</div>
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 10px; color: #1e3a8a;">
              ${targetComplaint.title}
            </div>
            <p>${targetComplaint.description}</p>
          </div>

          <div style="margin-top: 40px; overflow: auto;">
            <div class="stamp-box">
              Official Digital Seal
            </div>
            <div style="font-size: 11px; color: #64748b; padding-top: 15px;">
              This is a system-generated official receipt copy compiled under Section 4(b) of the Grievance Redressal Act.
            </div>
          </div>

          <div class="footer">
            Complaint Management System (CMS) &bull; Keep this copy for tracking and future reference.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(files);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {success && submittedComplaint ? (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#0c1912] border border-slate-200 dark:border-[#0b3a20] rounded-2xl p-8 shadow-lg space-y-6 text-left">
          {/* Header */}
          <div className="text-center pb-6 border-b border-slate-100 dark:border-[#0b3a20]">
            <div className="h-16 w-16 bg-green-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200 dark:border-[#0b3a20]">
              <Check className="h-8 w-8 text-green-600 dark:text-emerald-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Complaint Registered Successfully!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your grievance ticket has been officially logged in the system.
            </p>
          </div>

          {/* Ticket Invoice details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Ticket Receipt Copy</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#03140c] p-5 rounded-xl border border-slate-200 dark:border-[#052414] text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ticket ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{submittedComplaint.id}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Submission Time</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{new Date(submittedComplaint.createdAt).toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Subject Title</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{submittedComplaint.title}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Assigned Department</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{submittedComplaint.departmentName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Registered Citizen</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{submittedComplaint.isAnonymous ? 'Filed Anonymously' : submittedComplaint.citizenName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Priority Classification</span>
                <span className="font-bold text-slate-850 dark:text-slate-200 uppercase">{submittedComplaint.priority}</span>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Incident Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{submittedComplaint.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-[#0b3a20]">
            <button
              onClick={() => handlePrint(submittedComplaint)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white transition-colors shadow-md shadow-emerald-500/10"
            >
              <Printer className="h-4 w-4" />
              Print Receipt Certificate
            </button>
            <Link
              to={`/complaints/${submittedComplaint.id}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white transition-colors shadow-md shadow-blue-500/10"
            >
              <FileText className="h-4 w-4" />
              Go to Tracker Page
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-[#0b3a20] hover:bg-slate-50 dark:hover:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full relative">
        
        {/* Column 1: Stepper Navigation */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-28 bg-white dark:bg-[#03140c] border border-slate-200 dark:border-[#052414] rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-450 dark:text-emerald-500 uppercase tracking-widest mb-6">
              Submission Progress
            </h3>
            
            <div className="relative flex flex-col gap-6">
              {/* Vertical line connector */}
              <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-slate-200 dark:bg-emerald-950 -z-10" />

              {/* Step 1 */}
              <div className="flex items-center gap-4 text-left">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 transition-all ${
                  activeStep === 1 
                    ? 'bg-[#062c19] text-white border-emerald-500 ring-2 ring-emerald-500/20' 
                    : activeStep > 1 
                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                      : 'bg-white border-slate-300 text-slate-450 dark:bg-slate-900 dark:border-slate-800'
                }`}>
                  {activeStep > 1 ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${activeStep === 1 ? 'text-[#062c19] dark:text-[#f2e6d0]' : 'text-slate-400'}`}>
                    Describe Incident
                  </h4>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4 text-left">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 transition-all ${
                  activeStep === 2 
                    ? 'bg-[#062c19] text-white border-emerald-500 ring-2 ring-emerald-500/20' 
                    : activeStep > 2 
                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                      : 'bg-white border-slate-300 text-slate-450 dark:bg-slate-900 dark:border-slate-800'
                }`}>
                  {activeStep > 2 ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${activeStep === 2 ? 'text-[#062c19] dark:text-[#f2e6d0]' : 'text-slate-400'}`}>
                    Submit Evidence
                  </h4>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4 text-left">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 transition-all ${
                  activeStep === 3 
                    ? 'bg-[#062c19] text-white border-emerald-500 ring-2 ring-emerald-500/20' 
                    : activeStep > 3 
                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                      : 'bg-white border-slate-300 text-slate-450 dark:bg-slate-900 dark:border-slate-800'
                }`}>
                  {activeStep > 3 ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${activeStep === 3 ? 'text-[#062c19] dark:text-[#f2e6d0]' : 'text-slate-400'}`}>
                    Add Contacts
                  </h4>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-center gap-4 text-left">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 transition-all ${
                  activeStep === 4 
                    ? 'bg-[#062c19] text-white border-emerald-500 ring-2 ring-emerald-500/20' 
                    : 'bg-white border-slate-300 text-slate-450 dark:bg-slate-900 dark:border-slate-800'
                }`}>
                  '4'
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${activeStep === 4 ? 'text-[#062c19] dark:text-[#f2e6d0]' : 'text-slate-400'}`}>
                    Review & Submit
                  </h4>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Column 2, 3 & 4: Form Card Panel */}
        <div className="lg:col-span-3">
          
          <div className="bg-white dark:bg-[#0c1912] border border-slate-200 dark:border-[#0b3a20] rounded-2xl p-8 shadow-md">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8 text-left border-b border-slate-100 dark:border-emerald-950 pb-4">
              File a New Complaint
            </h2>

            {success && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-700 dark:bg-emerald-950/30 dark:text-[#d4af37] border border-green-200 dark:border-[#0b3a20] animate-pulse">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <h4 className="font-bold">Complaint Registered!</h4>
                  <p className="text-xs">{errorMsg ? errorMsg : 'Successfully posted complaint. Redirecting to dashboard console...'}</p>
                </div>
              </div>
            )}

            {errorMsg && !success && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 border border-red-200">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-semibold">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(executeSubmit)} className="space-y-6 text-left">
              
              {/* STEP 1: Describe Incident */}
              {activeStep === 1 && (
                <div className="space-y-6">
                  {/* Language */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-[#f2e6d0] uppercase tracking-wider mb-2">
                      Complaint Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-800 dark:bg-[#1a2b22] text-slate-800 dark:text-white outline-none focus:border-[#ac734c] dark:focus:border-[#d4af37]"
                    >
                      <option value="English">English</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                      <option value="Malayalam">Malayalam (മലയാളം)</option>
                      <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-[#f2e6d0] uppercase tracking-wider mb-2">
                      Complaint Title
                    </label>
                    <input 
                      type="text"
                      {...register('title')}
                      placeholder="Brief title summarizing the issue..."
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm dark:border-slate-800 dark:text-white outline-none focus:border-[#ac734c] dark:focus:border-[#d4af37]"
                    />
                    {errors.title && <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>}
                  </div>

                  {/* Target Department dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-[#f2e6d0] uppercase tracking-wider mb-2">
                      Target Department (Predicted automatically, editable)
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => {
                        setSelectedDept(e.target.value);
                        setIsManualDeptSelection(true);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-800 dark:bg-[#1a2b22] text-slate-800 dark:text-white outline-none focus:border-[#ac734c] dark:focus:border-[#d4af37]"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id.toString()}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location & Map Pin */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-500 dark:text-[#f2e6d0] uppercase tracking-wider">
                        Incident Location / Landmark
                      </label>
                      <button 
                        type="button"
                        onClick={triggerLocationFetch}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-[#d4af37] hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Fetch GPS Location
                      </button>
                    </div>

                    <div className="h-56 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                      <MapContainer center={position} zoom={13} scrollWheelZoom={false} doubleClickZoom={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={position} />
                        <MapClickHandler />
                      </MapContainer>
                    </div>

                    <div className="flex gap-2">
                      <textarea 
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onBlur={(e) => geocodeAddress(e.target.value)}
                        onKeyDown={handleAddressKeyDown}
                        placeholder="Select on the map above or enter incident address manual details here..."
                        className="w-full text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-[#1a2b22]/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 outline-none focus:border-[#ac734c] dark:focus:border-[#d4af37] flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => geocodeAddress(address)}
                        className="bg-[#062c19] hover:bg-emerald-950 text-white font-bold text-[10px] uppercase px-4 py-2.5 rounded-lg flex items-center justify-center shrink-0 border border-emerald-800 shadow transition-colors"
                      >
                        Pin Map
                      </button>
                    </div>
                  </div>


                  {/* Detailed Description */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-[#f2e6d0] uppercase tracking-wider">
                        Detailed Description of Complaint
                      </label>
                    </div>
                    <textarea 
                      rows={4}
                      {...register('description')}
                      placeholder="Describe the issue in detail, including street names, public hazards or identifiers..."
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm dark:border-slate-800 dark:text-white outline-none focus:border-[#ac734c] dark:focus:border-[#d4af37]"
                    />
                    {errors.description && <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-emerald-950 flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        const isValid = await trigger(['title', 'description']);
                        if (!selectedDept) {
                          setErrorMsg('Department is a mandatory field. Please select a department.');
                          return;
                        }
                        if (!address || address.trim() === '') {
                          setErrorMsg('Address is a mandatory field. Please pinpoint on the map or type in address.');
                          return;
                        }
                        setErrorMsg('');
                        if (isValid) {
                          setActiveStep(2);
                        }
                      }}
                      className="bg-[#ac734c] hover:bg-[#8f5e3e] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg flex items-center gap-2 shadow"
                    >
                      <span>Next Step: Attach Evidence</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Submit Evidence */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-[#f2e6d0] uppercase tracking-wider mb-2">
                      Attach Evidence (Images, Videos, PDFs)
                    </label>
                    
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-350 dark:border-emerald-900 bg-slate-50 dark:bg-[#1a2b22]/20 rounded-xl p-8 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1a2b22]/40 transition-colors">
                      <Upload className="h-10 w-10 text-slate-400 dark:text-[#d4af37]" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-3">Select and upload files</span>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF, or MP4 allowed (Max size 10MB)</p>
                      
                      <input 
                        type="file" 
                        multiple
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                    </label>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 p-4 rounded-xl border border-[#ac734c]/20 bg-[#f5e6d3]/20 space-y-2">
                        <h4 className="text-xs font-bold text-[#ac734c] dark:text-[#d4af37]">Selected Files ({uploadedFiles.length}):</h4>
                        <ul className="text-xs space-y-1 list-disc pl-4 text-slate-600 dark:text-slate-300 font-semibold">
                          {uploadedFiles.map((file, idx) => (
                            <li key={idx} className="truncate">{file.name} ({Math.round(file.size / 1024)} KB)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-emerald-950 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="border border-slate-300 text-slate-650 hover:bg-slate-50 dark:border-emerald-900 dark:text-emerald-450 dark:hover:bg-emerald-950/20 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="bg-[#ac734c] hover:bg-[#8f5e3e] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg flex items-center gap-2 shadow"
                    >
                      <span>Next Step: Add Contacts</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Add Contacts */}
              {activeStep === 3 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 dark:border-emerald-950 bg-slate-50 dark:bg-[#1a2b22]/30 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">File Anonymously</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Your email and identity will be hidden from departments.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {!isAnonymous && user && (
                      <div className="pt-4 border-t border-slate-250 dark:border-emerald-950/40 text-xs space-y-2">
                        <p><strong className="text-slate-500 dark:text-[#f2e6d0] uppercase tracking-wider">Registered Citizen:</strong> {user.fullName}</p>
                        <p><strong className="text-slate-500 dark:text-[#f2e6d0] uppercase tracking-wider">Contact Email:</strong> {user.email}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-emerald-950 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="border border-slate-300 text-slate-650 hover:bg-slate-50 dark:border-emerald-900 dark:text-emerald-450 dark:hover:bg-emerald-950/20 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setActiveStep(4)}
                      className="bg-[#ac734c] hover:bg-[#8f5e3e] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg flex items-center gap-2 shadow"
                    >
                      <span>Next Step: Review & Submit</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Submit */}
              {activeStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-[#1a2b22]/30 p-6 rounded-xl border border-slate-200 dark:border-[#0b3a20] space-y-4 text-xs font-semibold leading-relaxed">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-emerald-950 pb-2">
                      Review Form Summary
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 uppercase tracking-widest text-[9px] block">Title</span>
                        <span className="text-slate-800 dark:text-white font-bold text-sm block mt-0.5">{titleWatch}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase tracking-widest text-[9px] block">Language</span>
                        <span className="text-slate-800 dark:text-white block mt-0.5">{language}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 uppercase tracking-widest text-[9px] block">Anonymity status</span>
                        <span className="text-slate-800 dark:text-white block mt-0.5">{isAnonymous ? 'Anonymous Filing' : 'Public Profile Linked'}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-400 uppercase tracking-widest text-[9px] block">Address / Location details</span>
                        <span className="text-slate-800 dark:text-white block mt-0.5 leading-normal">{address}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-400 uppercase tracking-widest text-[9px] block">Detailed description</span>
                        <p className="text-slate-800 dark:text-white block mt-1 leading-normal font-medium max-h-36 overflow-y-auto whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          {descriptionWatch}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase tracking-widest text-[9px] block">Attachments</span>
                        <span className="text-slate-800 dark:text-white block mt-0.5">{uploadedFiles.length} file(s) attached</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-emerald-950 flex flex-col md:flex-row justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="border border-slate-300 text-slate-650 hover:bg-slate-50 dark:border-emerald-900 dark:text-emerald-450 dark:hover:bg-emerald-950/20 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSubmit(saveToOfflineDrafts)}
                        className="border border-emerald-600 hover:bg-emerald-50 text-emerald-700 dark:border-[#d4af37] dark:text-[#f2e6d0] dark:hover:bg-[#d4af37]/10 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span>Save Draft</span>
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-[#ac734c] hover:bg-[#8f5e3e] disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        <span>Submit Complaint</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
      ) }
    </div>
  );
};

export default CreateComplaint;
