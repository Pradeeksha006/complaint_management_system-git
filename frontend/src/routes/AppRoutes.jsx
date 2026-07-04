import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import Dashboard from '../pages/Dashboard';
import CreateComplaint from '../pages/CreateComplaint';
import MyComplaints from '../pages/MyComplaints';
import TrackingPage from '../pages/TrackingPage';
import ComplaintDetail from '../pages/ComplaintDetail';
import Settings from '../pages/Settings';
import UserManagement from '../pages/UserManagement';
import DepartmentManagement from '../pages/DepartmentManagement';
import AuditLogs from '../pages/AuditLogs';
import AllComplaints from '../pages/AllComplaints';
import DeptHeadDashboard from '../pages/DeptHeadDashboard';
import { Error404, Error403 } from '../pages/ErrorPages';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />



      {/* Main Authenticated shell */}
      <Route path="/" element={<MainLayout />}>
        {/* Default route */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Citizen endpoints */}
        <Route path="file-complaint" element={
          <ProtectedRoute allowedRoles={['ROLE_CITIZEN']}>
            <CreateComplaint />
          </ProtectedRoute>
        } />
        <Route path="my-complaints" element={
          <ProtectedRoute allowedRoles={['ROLE_CITIZEN']}>
            <MyComplaints />
          </ProtectedRoute>
        } />

        {/* Officer assignments */}
        <Route path="assignments" element={
          <ProtectedRoute allowedRoles={['ROLE_OFFICER']}>
            <Dashboard /> {/* switches to assignments details */}
          </ProtectedRoute>
        } />

        {/* Administrative views */}
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="departments" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <DepartmentManagement />
          </ProtectedRoute>
        } />
        <Route path="audit-logs" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <AuditLogs />
          </ProtectedRoute>
        } />
        <Route path="all-complaints" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_DEPT_HEAD']}>
            <AllComplaints />
          </ProtectedRoute>
        } />

        <Route path="department-control" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_DEPT_HEAD']}>
            <DeptHeadDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="track" element={
          <ProtectedRoute>
            <TrackingPage />
          </ProtectedRoute>
        } />
        
        <Route path="track-complaint/:id" element={
          <ProtectedRoute>
            <ComplaintDetail />
          </ProtectedRoute>
        } />

        {/* Error mappings inside dashboard frame */}
        <Route path="unauthorized" element={<Error403 />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
};

export default AppRoutes;
