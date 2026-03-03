import React from 'react';
import { useAuth } from '../context/AuthContext';
import Radiology from '../components/Radiology';

export default function RadiologistPortal() {
  const { user } = useAuth();

  if (user?.role !== 'radiologist') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Radiologist Portal</h1>
          <p className="text-white/60">Manage radiology tests and results</p>
        </div>
      </div>
      <Radiology />
    </div>
  );
}
