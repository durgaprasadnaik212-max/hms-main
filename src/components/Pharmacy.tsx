import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Inventory from './Inventory';
import Suppliers from './Suppliers';
import { useAuth } from '../context/AuthContext';

export default function Pharmacy() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('inventory');
  const canManageSuppliers = user?.role === 'admin' || user?.role === 'pharmacist';

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'suppliers' && canManageSuppliers) {
      setActiveTab('suppliers');
    } else {
      setActiveTab('inventory');
    }
  }, [searchParams, canManageSuppliers]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 bg-white/10 border border-white/20 p-1 rounded-lg w-fit">
        <button
          onClick={() => handleTabChange('inventory')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'inventory' ? 'bg-white/20 text-indigo-400 shadow-sm backdrop-blur-sm' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          Inventory
        </button>
        {canManageSuppliers && (
          <button
            onClick={() => handleTabChange('suppliers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'suppliers' ? 'bg-white/20 text-indigo-400 shadow-sm backdrop-blur-sm' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Suppliers
          </button>
        )}
      </div>
      {activeTab === 'inventory' ? <Inventory /> : <Suppliers />}
    </div>
  );
}
