import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { 
  Sparkles, Calendar, User, Shield, Info, ArrowLeft, Loader2, Star, CheckCircle, FileText, X, Clock, Users, Printer
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTranslatedDesc = complaint?.translatedDescription && 
                           complaint?.translatedDescription !== complaint?.description;
  const isTranslatedTitle = complaint?.translatedTitle && 
                            complaint?.translatedTitle !== complaint?.title;
  const isStaff = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_DEPT_HEAD' || user?.role === 'ROLE_OFFICER';

  // Feedback states
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Modify / Delete states
  const [departments, setDepartments] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null); // in seconds
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [modifying, setModifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDetail();
    if (user?.role === 'ROLE_CITIZEN') {
      fetchDepartments();
    }
  }, [id, user]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/api/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  useEffect(() => {
    if (!complaint) return;
    setSelectedDeptId(complaint.departmentId);

    const calculateTimeRemaining = () => {
      const createdTime = new Date(complaint.createdAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, 300 - Math.floor((now - createdTime) / 1000)); // 5 minutes limit
      setTimeRemaining(diff);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [complaint]);

  const handleModifyDepartment = async () => {
    setModifying(true);
    try {
      await api.put(`/api/complaints/${id}/modify-department?departmentId=${selectedDeptId}`);
      alert('Department updated successfully!');
      fetchDetail();
    } catch (err) {
      alert('Failed to modify department: ' + (err.response?.data?.message || err.message));
    } finally {
      setModifying(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this complaint? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/api/complaints/${id}`);
      alert('Complaint deleted successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete complaint: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/complaints/${id}`);
      setComplaint(res.data);

      const timeRes = await api.get(`/api/complaints/${id}/timeline`);
      setTimeline(timeRes.data);

      if (res.data.status !== 'RESOLVED' && res.data.status !== 'CLOSED') {
        try {
          const predRes = await api.post('/api/ai/predict-resolution', {
            departmentId: res.data.departmentId,
            category: res.data.category,
            priority: res.data.priority
          });
          setPrediction(predRes.data);
        } catch (predErr) {
          console.error('Failed to load AI resolution predictions', predErr);
        }
      }
    } catch (err) {
      console.error('Failed to load complaint detail', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackLoading(true);
    try {
      await api.post(`/api/feedback/${id}`, { rating, comments });
      setFeedbackSuccess(true);
      fetchDetail();
    } catch (err) {
      alert('Failed to submit feedback: ' + (err.response?.data?.message || err.message));
    } finally {
      setFeedbackLoading(false);
    }
  };
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the complaint copy.');
      return;
    }

    const formattedDate = new Date(complaint.createdAt).toLocaleString();
    const printDate = new Date().toLocaleString();

    // Timeline rows
    const timelineRows = timeline.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-size: 11px; color: #4a5568;">${new Date(item.createdAt).toLocaleString()}</td>
        <td style="padding: 10px; font-size: 11px; font-weight: bold; color: #2d3748; text-transform: uppercase;">${item.status}</td>
        <td style="padding: 10px; font-size: 11px; color: #4a5568;">${item.description || ''}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Complaint_${complaint.id}_Receipt</title>
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
            .table-container {
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #1e3a8a;
              color: white;
              text-align: left;
              padding: 10px;
              font-size: 11px;
              text-transform: uppercase;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
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
              <div class="field"><span class="field-label">Ticket ID:</span> ${complaint.id}</div>
              <div class="field"><span class="field-label">Current Status:</span> <span style="font-weight: 800; color: #1e3a8a;">${complaint.status}</span></div>
              <div class="field"><span class="field-label">Priority Level:</span> ${complaint.priority}</div>
              <div class="field"><span class="field-label">Date Filed:</span> ${formattedDate}</div>
            </div>

            <div class="section">
              <div class="section-title">Filer & Location Registry</div>
              <div class="field"><span class="field-label">Registered By:</span> ${complaint.isAnonymous ? 'Filed Anonymously' : complaint.citizenName}</div>
              <div class="field"><span class="field-label">Filer Contact:</span> ${complaint.isAnonymous ? 'N/A' : (complaint.citizenPhone || 'N/A')}</div>
              <div class="field"><span class="field-label">Assigned Department:</span> ${complaint.departmentName}</div>
              <div class="field"><span class="field-label">Incident Address:</span> ${complaint.address || 'N/A'}</div>
            </div>
          </div>

          <div class="description-box">
            <div class="section-title">Subject & Statement of Complaint</div>
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 10px; color: #1e3a8a;">
              ${complaint.title}
            </div>
            <p>${complaint.description}</p>
          </div>

          <div class="table-container">
            <div class="section-title">Grievance Resolution Lifecycle History</div>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Status Status</th>
                  <th>Action Context</th>
                </tr>
              </thead>
              <tbody>
                ${timelineRows || '<tr><td colspan="3" style="text-align: center; padding: 10px; font-size: 11px;">No timeline updates available.</td></tr>'}
              </tbody>
            </table>
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
  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading complaint tracker...</div>;
  }

  if (!complaint) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Complaint not found or you lack permission to view it.</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Go to Dashboard</Link>
      </div>
    );
  }

  const mapCenter = [complaint.latitude || 19.0760, complaint.longitude || 72.8777];
  const shareableUrl = window.location.href;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Details and Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            {/* Close X Button */}
            <Link 
              to="/dashboard" 
              className="absolute top-12 right-6 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close and Go Back"
            >
              <X className="h-5 w-5" />
            </Link>
            
            {/* Title Header */}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ticket ID: {complaint.id}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'
                    ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                }`}>
                  {complaint.status}
                </span>
                {isStaff && isTranslatedTitle && (
                  <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[10px] font-bold">
                    <Sparkles className="h-3 w-3 animate-pulse text-amber-500" /> Title AI Translated
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2 leading-tight">
                {isStaff && isTranslatedTitle ? complaint.translatedTitle : complaint.title}
              </h2>
              {isStaff && isTranslatedTitle && (
                <div className="text-xs text-slate-500 mt-1">
                  Original Title: <span className="italic">"{complaint.title}"</span>
                </div>
              )}
            </div>

            {/* AI Summary Banner */}
            {isStaff && complaint.summary && (
              <div className="rounded-lg bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 p-3.5 flex items-start gap-2.5 text-xs text-blue-750 dark:text-blue-400 font-semibold leading-relaxed">
                <Sparkles className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">AI Brief Summary</span>
                  {complaint.summary}
                </div>
              </div>
            )}

            {/* Master Complaint Proximity & Support Indicator */}
            {complaint.supportCount > 1 && (
              <div className="rounded-lg bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 p-3.5 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed">
                <Users className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider block mb-1">Duplicate Merge (Master Complaint)</span>
                  This ticket has been designated as a **Master Complaint**. **{complaint.supportCount} citizens** have reported this identical issue at this location and are merged into this ticket. All linked users will receive automated email updates upon resolution.
                </div>
              </div>
            )}

            {/* Info Badges */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Filed: {new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <User className="h-4 w-4 text-slate-400" />
                <span>By: {complaint.citizenName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Shield className="h-4 w-4 text-slate-400" />
                <span>Dept: {complaint.departmentName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Info className="h-4 w-4 text-slate-400" />
                <span>Priority: <strong className="uppercase font-semibold">{complaint.priority}</strong></span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                Description
                {isStaff && isTranslatedDesc && (
                  <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[10px] font-bold">
                    <Sparkles className="h-3 w-3 animate-pulse text-amber-500" /> AI Translated
                  </span>
                )}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg">
                {isStaff && isTranslatedDesc ? complaint.translatedDescription : complaint.description}
              </p>

              {isStaff && isTranslatedDesc && (
                <details className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer select-none">
                  <summary className="outline-none">View Original regional text</summary>
                  <p className="mt-2 p-3 bg-slate-50/40 dark:bg-slate-800/20 rounded-lg text-slate-650 dark:text-slate-350 border border-slate-100 dark:border-slate-800/50 leading-relaxed font-medium">
                    {complaint.description}
                  </p>
                </details>
              )}
            </div>

            {/* Registered Citizen Details for Staff Admin / Dept Head */}
            {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_DEPT_HEAD') && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20 space-y-3">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  Registered Citizen Info
                </h4>
                <div className="grid gap-4 sm:grid-cols-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-normal uppercase tracking-wider mb-0.5">Full Name</span>
                    <span>{complaint.citizenName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-normal uppercase tracking-wider mb-0.5">Email Address</span>
                    <span>{complaint.citizenEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-normal uppercase tracking-wider mb-0.5">Phone Number</span>
                    <span>{complaint.citizenPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Supporting Media</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {complaint.attachments.map(att => (
                    <div key={att.id} className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-850 p-2 flex flex-col items-center">
                      {att.fileType === 'IMAGE' ? (
                        <img 
                          src={att.fileUrl} 
                          alt="Attachment" 
                          className="h-32 w-full object-cover rounded-md" 
                        />
                      ) : att.fileType === 'PDF' ? (
                        <div className="h-32 w-full flex items-center justify-center bg-red-50 text-red-600 rounded-md dark:bg-red-950/20 dark:text-red-400">
                          <FileText className="h-10 w-10" />
                        </div>
                      ) : (
                        <video src={att.fileUrl} controls className="h-32 w-full object-cover rounded-md" />
                      )}
                      <a 
                        href={att.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:underline mt-2 flex items-center gap-1.5"
                      >
                        View Full Resource
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leaflet Map Panel */}
          {complaint.latitude && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Geo Pinpoint Location</h4>
              <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={false}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={mapCenter} />
                </MapContainer>
              </div>
              <p className="text-xs text-slate-500">{complaint.address || 'Address unresolved'}</p>
            </div>
          )}
        </div>

        {/* Sidebar: QR tracking & Timeline & Feedback */}
        <div className="space-y-6">

          {/* Document Copy Print Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Copy</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Export a soft copy (PDF) or generate a hard copy of this complaint ticket with full tracking details.
            </p>
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/10"
            >
              <Printer className="h-4 w-4" />
              Print Complaint Copy
            </button>
          </div>
          
          {/* Citizen Edit/Delete panel */}
          {user?.role === 'ROLE_CITIZEN' && complaint.citizenId === user.id && (
            <>
              {timeRemaining > 0 ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/10 p-5 dark:border-blue-900/30 space-y-3">
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Modify Complaint</h4>
                  <p className="text-[11px] text-blue-600 dark:text-blue-500 leading-relaxed font-medium">
                    You can change the target department if this complaint was routed incorrectly.
                  </p>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5 animate-pulse">
                    <Clock className="h-4 w-4 animate-spin-slow" />
                    Time remaining: {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s
                  </div>
                  <div className="space-y-2 mt-2">
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-850 dark:text-white focus:ring-1 focus:ring-blue-500"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleModifyDepartment}
                      disabled={modifying}
                      className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-500/10"
                    >
                      {modifying ? 'Updating...' : 'Update Department'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50/15 p-5 dark:border-red-950/20 space-y-3">
                  <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">Delete Complaint</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    The 5-minute modification window has expired. If this complaint is no longer valid, you can permanently delete it.
                  </p>
                  <button
                    onClick={handleDeleteComplaint}
                    disabled={deleting}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-md shadow-red-500/10"
                  >
                    {deleting ? 'Deleting...' : 'Delete Complaint Permanently'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* AI Resolution Predictor */}
          {isStaff && prediction && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                AI Resolution Estimate
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-normal uppercase tracking-wider mb-0.5">Duration</span>
                  <span>{prediction.estimatedDays} Days ({prediction.estimatedHours} hrs)</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-normal uppercase tracking-wider mb-0.5">Confidence</span>
                  <span>{Math.round(prediction.confidenceScore * 100)}% Match</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed italic">
                *Estimated based on historical completion timeframes, priority guidelines, and AI modeling.
              </p>
            </div>
          )}

          {/* QR code and tracking link */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center flex flex-col items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Mobile Scan Tracking</h4>
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm inline-block">
              <QRCodeSVG value={shareableUrl} size={110} />
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Scan this code with a mobile camera to track live details instantly.</p>
          </div>

          {/* Timeline workflow */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Operations Log Timeline</h4>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-850">
              {timeline.map((event) => (
                <div key={event.id} className="relative">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 dark:border-slate-900" />
                  
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                      {event.status}
                    </span>
                    <p className="text-slate-500 mt-2 font-medium leading-relaxed">{event.description}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                      {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_DEPT_HEAD') && (
                        <span>By: {event.updatedByFullName}</span>
                      )}
                      <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Form for Citizen */}
          {(user?.role === 'ROLE_CITIZEN' || user?.role === 'ROLE_ADMIN') && complaint.status === 'RESOLVED' && !complaint.feedback && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/20 p-6 dark:border-blue-900/30">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400">Submit Resolution Review</h4>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 leading-relaxed">
                Confirm resolution and close ticket by providing a quality rating.
              </p>

              {feedbackSuccess ? (
                <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold">
                  <CheckCircle className="h-4 w-4" />
                  Feedback received. Complaint CLOSED.
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Service Quality Rating</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button 
                          key={num}
                          type="button"
                          onClick={() => setRating(num)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`h-6 w-6 ${
                            num <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-350'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks / Details</label>
                    <textarea 
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Comment on resolution speed, courtesy, effectiveness..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={feedbackLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10"
                  >
                    {feedbackLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Close Ticket & Rate'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Feedback Display if already submitted */}
          {complaint.feedback && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/20">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resolution Review</h4>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Star key={num} className={`h-4 w-4 ${
                    num <= complaint.feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                  }`} />
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                {complaint.feedback.comments}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
