import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, HelpCircle } from 'lucide-react';

export const Error404 = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-4">
      <HelpCircle className="h-16 w-16 text-slate-400 animate-bounce" />
      <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white mt-4">Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        The resource you are searching for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/dashboard" className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
        Back to Dashboard
      </Link>
    </div>
  );
};

export const Error403 = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-4">
      <ShieldAlert className="h-16 w-16 text-red-500 animate-pulse" />
      <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white mt-4">Access Denied</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        You do not possess the required security clearances or administrative privileges to inspect this resource.
      </p>
      <Link to="/dashboard" className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
        Back to Dashboard
      </Link>
    </div>
  );
};

export const Error500 = () => {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-4">
      <AlertTriangle className="h-16 w-16 text-amber-500" />
      <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white mt-4">Internal Server Error</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        The server encountered an unexpected error preventing it from fulfilling your request. Try reloading.
      </p>
      <Link to="/dashboard" className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
        Back to Dashboard
      </Link>
    </div>
  );
};
