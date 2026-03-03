import React from 'react';
import { useAuth } from '../context/AuthContext';
import Billing from './Billing';

export default function BillingPortal() {
  const { user } = useAuth();

  if (user?.role !== 'accountant') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Accountant Portal</h1>
          <p className="text-white/60">Manage billing and invoices</p>
        </div>
      </div>
      <Billing />
    </div>
  );
}
