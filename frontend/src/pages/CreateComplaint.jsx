import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { 
  Sparkles, MapPin, Upload, AlertCircle, Eye, Info, Loader2, CheckCircle2, X
} from 'lucide-react';
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
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  
  // Geo coordinates state (default center: Mumbai coordinates)
  const [position, setPosition] = useState([19.0760, 72.8777]);
  const [address, setAddress] = useState('');
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Language configuration
  const [language, setLanguage] = useState('English');
  
  // Duplicate check state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const descriptionWatch = watch('description');
  const titleWatch = watch('title');
  const [isManualDeptSelection, setIsManualDeptSelection] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Real-time AI auto-detection of department based on title & description
  useEffect(() => {
    if (isManualDeptSelection) return;

    const content = `${titleWatch || ''} ${descriptionWatch || ''}`.toLowerCase();
    if (!content.trim()) return;

    // Define department keyword mapping
    const deptKeywords = {
      WT: [
        'water', 'leak', 'pipe', 'drain', 'sewer', 'plumb', 'tap', 'contamination', 'drainage', 'flooding',
        'குடிநீர்', 'தண்ணீர்', 'தண்ணி', 'குழாய்', 'கசிவு', 'சாக்கடை', 'கழிவுநீர்', 'பைப்', 'குழாயில்', 'நீர்',
        'पानी', 'जल', 'नाला', 'पाइप', 'सीवर', 'निकास'
      ],
      RD: [
        'road', 'pothole', 'highway', 'street', 'bridge', 'sidewalk', 'curb', 'pavement',
        'சாலை', 'பள்ளம்', 'பாதை', 'தெரு', 'தார்', 'ரோடு', 'பள்ளங்கள்',
        'सड़क', 'गड्ढा', 'रास्ता', 'मार्ग', 'गलियां'
      ],
      EL: [
        'electricity', 'power', 'wire', 'spark', 'transformer', 'light', 'voltage', 'blackout', 'electrician', 'shock', 'streetlight',
        'மின்சாரம்', 'மின்சார', 'கரண்ட்', 'கம்பம்', 'விளக்கு', 'ஒயர்', 'மின்', 'தெருவிளக்கு', 'மின்ஒயர்',
        'बिजली', 'तार', 'खंभा', 'लाइट', 'पावर', 'ट्रांसफार्मर'
      ],
      SN: [
        'garbage', 'trash', 'waste', 'sanitation', 'clean', 'sweeping', 'dump', 'litter', 'overflow',
        'குப்பை', 'குப்பைகள்', 'அசுத்தம்', 'கழிவுகள்', 'சுத்தம்', 'சுத்தப்படுத்த', 'நாற்றம்',
        'कचरा', 'कूड़ा', 'सफाई', 'कचरे', 'गंदगी'
      ],
      PL: [
        'police', 'theft', 'robbery', 'crime', 'fight', 'security', 'guard', 'nuisance', 'assault',
        'போலீஸ்', 'திருட்டு', 'சண்டை', 'பாதுகாப்பு', 'திருடன்', 'அச்சுறுத்தல்',
        'पुलिस', 'चोरी', 'लड़ाई', 'सुरक्षा', 'अपराध'
      ],
      HL: [
        'stray', 'dog', 'health', 'mosquito', 'pest', 'animal', 'disease', 'vet', 'hygiene', 'food',
        'நாய்', 'நாய்கள்', 'கொசு', 'கொசுக்கள்', 'காய்ச்சல்', 'நோய்', 'விலங்கு', 'சுகாதாரம்',
        'कुत्ता', 'मच्छर', 'बीमारी', 'जानवर', 'स्वास्थ्य'
      ]
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
  }, [titleWatch, descriptionWatch, departments, isManualDeptSelection]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  // Map events helper to handle click events on the Leaflet map
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });
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

  const triggerLocationFetch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        reverseGeocode(latitude, longitude);
      });
    }
  };

  // Duplicate Check logic using Gemini AI
  const handleCheckDuplicates = async () => {
    if (!descriptionWatch || descriptionWatch.length < 10) {
      alert("Please enter a description first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/api/ai/detect-duplicates', {
        title: titleWatch || "General Complaint",
        description: descriptionWatch,
        latitude: position[0],
        longitude: position[1]
      });
      setDuplicateData(res.data);
      setShowDuplicateModal(true);
    } catch (err) {
      alert('Failed to execute duplicate checks: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const executeSubmit = async (data) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      // Prepend language prefix if not English
      const finalDesc = language !== 'English' 
        ? `[Language: ${language}] ${data.description}` 
        : data.description;
      formData.append('description', finalDesc);
      formData.append('category', 'Auto');
      formData.append('isAnonymous', 'false');
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

      await api.post('/api/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
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

  const onSubmit = async (data) => {
    executeSubmit(data);
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
      createdAt: new Date().toISOString()
    };

    const existing = localStorage.getItem('offline_drafts') ? JSON.parse(localStorage.getItem('offline_drafts')) : [];
    existing.push(draft);
    localStorage.setItem('offline_drafts', JSON.stringify(existing));

    setSuccess(true);
    setErrorMsg('Network issue detected or Offline. Save as Offline Draft successful!');
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(files);
  };

  return (
    <div className="relative max-w-4xl mx-auto space-y-8">
      {/* Close Button */}
      <Link 
        to="/dashboard" 
        className="absolute top-12 right-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Cancel and Go Back"
      >
        <X className="h-5 w-5" />
      </Link>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Register a Complaint</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Pinpoint coordinates, upload images/files, and write details.</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200">
          <CheckCircle2 className="h-6 w-6" />
          <div>
            <h4 className="font-bold">Complaint Filed Successfully!</h4>
            <p className="text-xs">{errorMsg ? errorMsg : 'Your ticket is now registered. Redirecting to console...'}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 md:grid-cols-2">
        {/* Form panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Complaint Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Malayalam">Malayalam (മലയാളം)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Complaint Title</label>
            <input 
              type="text"
              {...register('title')}
              placeholder="Brief summary of the issue..."
              className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-800 dark:text-white focus:border-blue-500"
            />
            {errors.title && <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
            <select 
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setIsManualDeptSelection(true); // Stop auto-detect once the user changes it manually
              }}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                -- Auto-Detect (Let AI Assign) --
              </option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Detailed Description</label>
              <button 
                type="button" 
                onClick={handleCheckDuplicates}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 dark:text-blue-400"
              >
                <Eye className="h-3.5 w-3.5" />
                Scan Duplicates
              </button>
            </div>
            <textarea 
              rows={4}
              {...register('description')}
              placeholder="Provide exact details of the situation. Mention safety concerns..."
              className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-800 dark:text-white focus:border-blue-500"
            />
            {errors.description && <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attach Files (Images, PDFs)</label>
            <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-5 cursor-pointer hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
              <Upload className="h-7 w-7 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select media files for validation</span>
              <input 
                type="file" 
                multiple
                onChange={handleFileChange}
                className="hidden" 
              />
              {uploadedFiles.length > 0 && (
                <div className="text-xs font-semibold text-blue-600 mt-3">
                  Selected {uploadedFiles.length} file(s)
                </div>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/10"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'File Complaint'}
          </button>
        </div>

        {/* Location & Map panel */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Location</label>
              <button 
                type="button"
                onClick={triggerLocationFetch}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                <MapPin className="h-3.5 w-3.5" />
                Fetch GPS Location
              </button>
            </div>
            
            {/* Leaflet Map */}
            <div className="h-72 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <MapContainer center={position} zoom={13} scrollWheelZoom={false}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position} />
                <MapClickHandler />
              </MapContainer>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-2">Location Address / Landmark Details (Editable)</label>
              <textarea 
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Click GPS Location above, select on map, or type address details manually here..."
                className="w-full text-xs text-slate-800 dark:text-white font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Potential duplicate warnings */}
          {duplicates.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50/20 p-5 dark:border-red-900/30">
              <h4 className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Duplicate Complaint Warning ({duplicates.length})
              </h4>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1 leading-relaxed">
                The AI system detected existing active complaints with similar descriptions in this location. Review them below to prevent double filing.
              </p>
              <div className="mt-4 space-y-2">
                {duplicates.map(dup => (
                  <div key={dup.id} className="rounded-lg bg-white p-3 border border-red-100 dark:bg-slate-900 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-800 dark:text-white">{dup.id}</strong> - {dup.title}
                      <p className="text-[10px] text-slate-400 mt-0.5">Status: {dup.status}</p>
                    </div>
                    <a 
                      href={`/track-complaint/${dup.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* AI Duplicate Warning Modal */}
      {showDuplicateModal && duplicateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold">AI Duplicate Detected!</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Our AI duplicate scanner detected a highly similar complaint already registered in your immediate vicinity.
            </p>

            <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-150 dark:border-amber-900/30 p-4 space-y-2 text-xs">
              {duplicateData.isDuplicate ? (
                <>
                  <div className="font-bold text-slate-800 dark:text-white">
                    Matching Ticket ID: {duplicateData.matchedComplaintId || 'N/A'}
                  </div>
                  {duplicateData.matchedComplaintTitle && (
                    <div className="font-semibold text-slate-700 dark:text-slate-350">
                      Title: "{duplicateData.matchedComplaintTitle}"
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 italic">
                    Reason: {duplicateData.reason}
                  </div>
                </>
              ) : (
                <div className="text-slate-650 dark:text-slate-300">
                  {duplicateData.reason || "No exact duplicates found, but check complete."}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateData(null);
                  setPendingSubmitData(null);
                }}
                className="rounded-lg border border-slate-200 bg-transparent px-4 py-2.5 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850"
              >
                Cancel
              </button>

              {duplicateData.isDuplicate && duplicateData.matchedComplaintId && (
                <a
                  href={`/track-complaint/${duplicateData.matchedComplaintId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-blue-50 px-4 py-2.5 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400"
                >
                  View Existing
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  if (pendingSubmitData) {
                    executeSubmit(pendingSubmitData);
                  } else {
                    alert("Duplicate scan acknowledged.");
                  }
                }}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700"
              >
                File Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateComplaint;
