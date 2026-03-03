import React, { useState, useEffect } from 'react';
import { Stethoscope, Beaker, Scan, Pill } from 'lucide-react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import Labs from '../components/Labs';
import Radiology from '../components/Radiology';
import Pharmacy from '../components/Pharmacy';

export default function HospitalServices() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('labs');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['labs', 'radiology', 'pharmacy'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { id: 'labs', label: 'Labs', icon: Beaker, component: <Labs /> },
    { id: 'radiology', label: 'Radiology', icon: Scan, component: <Radiology /> },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill, component: <Pharmacy /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Hospital Services</h1>
        <p className="text-white/60">Access labs, radiology, and pharmacy services</p>
      </div>

      <div className="glass-card overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        <div className="w-full md:w-64 border-r border-white/20 bg-white/10 p-2 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white/20 text-indigo-400 shadow-sm backdrop-blur-sm' 
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 md:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tabs.find(t => t.id === activeTab)?.component}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
