import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { 
  Sparkles, Calendar, User, Shield, Info, ArrowLeft, Loader2, Star, CheckCircle, FileText, X, Clock
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

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
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2 leading-tight">{complaint.title}</h2>
            </div>

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
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg">
                {complaint.description}
              </p>
            </div>

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
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-650 py-2.5 text-xs font-bold text-white hover:bg-red-750 transition-colors shadow-md shadow-red-500/10"
                  >
                    {deleting ? 'Deleting...' : 'Delete Complaint Permanently'}
                  </button>
                </div>
              )}
            </>
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
                      <span>By: {event.updatedByFullName}</span>
                      <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Form for Citizen */}
          {user?.role === 'ROLE_CITIZEN' && complaint.status === 'RESOLVED' && !complaint.feedback && (
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
