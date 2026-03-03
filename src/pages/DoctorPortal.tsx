import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Search, 
  MoreVertical, 
  User,
  Clock,
  ChevronRight,
  Stethoscope,
  Pill,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function DoctorPortal() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('id');
  
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'prescriptions'>('records');
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        const patientList = data.filter((u: any) => u.role === 'patient');
        setPatients(patientList);
        
        if (patientId) {
          const patient = patientList.find((p: any) => p.id === patientId);
          if (patient) setSelectedPatient(patient);
        }
      });
  }, [patientId]);

  useEffect(() => {
    if (selectedPatient) {
      // In a real app, we'd fetch these. For now, using the mock data from before
      setPatientPrescriptions([
        { id: '1', date: 'Oct 20, 2023', medication: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', status: 'Active' },
        { id: '2', date: 'Sep 15, 2023', medication: 'Lisinopril', dosage: '10mg', frequency: '1x daily', status: 'Active' },
      ]);
    }
  }, [selectedPatient]);

  const handleDeletePrescription = (id: string) => {
    setPatientPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      {/* Main Interaction Area */}
      <div className="flex-1 flex flex-col gap-6">
        {selectedPatient ? (
          <>
            {/* Patient Header Card */}
            <div className="glass-card p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedPatient.avatar || `https://ui-avatars.com/api/?name=${selectedPatient.name}`} 
                  alt={selectedPatient.name}
                  className="w-16 h-16 rounded-2xl object-cover bg-white/10 shadow-sm"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">{selectedPatient.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-white/60 flex items-center gap-1">
                      <User className="w-3 h-3" /> Male, 34 yrs
                    </span>
                    <span className="text-sm text-white/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ID: {selectedPatient.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 text-white/40 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-all backdrop-blur-sm">
                  <FileText className="w-5 h-5" />
                </button>
                <button className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all backdrop-blur-sm">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Interaction Tabs */}
            <div className="flex-1 glass-card flex flex-col overflow-hidden">
              <div className="flex border-b border-white/20">
                {[
                  { id: 'records', label: 'Clinical Records', icon: FileText },
                  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all relative",
                      activeTab === tab.id ? "text-indigo-400 bg-white/10 backdrop-blur-sm" : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === 'records' && (
                    <motion.div 
                      key="records"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-6 space-y-4"
                    >
                      {[
                        { date: 'Oct 12, 2023', type: 'Lab Result', title: 'Blood Work Analysis', status: 'Reviewed' },
                        { date: 'Sep 28, 2023', type: 'Prescription', title: 'Antibiotics Course', status: 'Completed' },
                        { date: 'Aug 15, 2023', type: 'Radiology', title: 'Chest X-Ray', status: 'Reviewed' },
                      ].map((record, i) => (
                        <div key={i} className="p-4 rounded-xl border border-white/20 bg-white/10 hover:border-indigo-500/30 hover:bg-white/20 transition-all cursor-pointer group backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 rounded-lg border border-white/20 group-hover:border-indigo-500/30">
                                <FileText className="w-5 h-5 text-white/40 group-hover:text-indigo-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{record.title}</div>
                                <div className="text-xs text-white/50">{record.type} • {record.date}</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 backdrop-blur-sm px-2 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">
                              {record.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/40 font-medium hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all backdrop-blur-sm">
                        + Add Clinical Note
                      </button>
                    </motion.div>
                  )}

                  {activeTab === 'prescriptions' && (
                    <motion.div 
                      key="prescriptions"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-6 space-y-4"
                    >
                      {patientPrescriptions.map((prescription, i) => (
                        <div key={prescription.id} className="p-4 rounded-xl border border-white/20 bg-white/10 hover:border-indigo-500/30 hover:bg-white/20 transition-all cursor-pointer group backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 rounded-lg border border-white/20 group-hover:border-indigo-500/30">
                                <Pill className="w-5 h-5 text-white/40 group-hover:text-indigo-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{prescription.medication}</div>
                                <div className="text-xs text-white/50">{prescription.dosage} • {prescription.frequency} • {prescription.date}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 backdrop-blur-sm px-2 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">
                                {prescription.status}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePrescription(prescription.id);
                                }}
                                className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {patientPrescriptions.length === 0 && (
                        <div className="text-center py-8 text-white/40 italic">
                          No active prescriptions for this patient.
                        </div>
                      )}
                      {/* Add Medicine button removed as per request */}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 glass-card flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Users className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Patient Selected</h2>
            <p className="text-white/60 max-w-sm">
              Select a patient from the Patient Directory to view their clinical records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
