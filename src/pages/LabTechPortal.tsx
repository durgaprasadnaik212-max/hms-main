import React from 'react';
import { useAuth } from '../context/AuthContext';
import Labs from '../components/Labs';

export default function LabTechPortal() {
  const { user } = useAuth();

  if (user?.role !== 'lab_tech') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lab Technician Portal</h1>
          <p className="text-white/60">Manage lab tests and results</p>
        </div>
      </div>
      <Labs />
    </div>
  );
}
