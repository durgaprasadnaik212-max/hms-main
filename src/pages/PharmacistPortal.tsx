import React from 'react';
import { useAuth } from '../context/AuthContext';
import Pharmacy from '../components/Pharmacy';

export default function PharmacistPortal() {
  const { user } = useAuth();

  if (user?.role !== 'pharmacist') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pharmacist Portal</h1>
          <p className="text-white/60">Manage inventory and prescriptions</p>
        </div>
      </div>
      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Pharmacy Inventory</h2>
          <Pharmacy />
        </section>
      </div>
    </div>
  );
}
