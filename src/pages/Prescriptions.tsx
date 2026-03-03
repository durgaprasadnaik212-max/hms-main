import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  Plus, 
  Download, 
  Clock, 
  AlertCircle,
  ChevronRight,
  User,
  Calendar,
  Trash2,
  Mic,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { GoogleGenAI, Type } from "@google/genai";

interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  date: string;
  status: 'active' | 'completed' | 'expired';
  doctorName: string;
}

export default function Prescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voicePrescription, setVoicePrescription] = useState<{medication: string, dosage: string, instructions: string} | null>(null);

  useEffect(() => {
    // Mock data for prescriptions
    const mockPrescriptions: Prescription[] = [
      {
        id: '1',
        patientName: 'John Doe',
        patientId: 'p1',
        medication: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'Three times a day',
        duration: '7 days',
        date: '2023-10-20',
        status: 'active',
        doctorName: 'Dr. Smith'
      },
      {
        id: '2',
        patientName: 'Jane Wilson',
        patientId: 'p2',
        medication: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        date: '2023-10-15',
        status: 'active',
        doctorName: 'Dr. Smith'
      },
      {
        id: '3',
        patientName: 'Robert Brown',
        patientId: 'p3',
        medication: 'Metformin',
        dosage: '850mg',
        frequency: 'Twice daily',
        duration: '90 days',
        date: '2023-09-01',
        status: 'completed',
        doctorName: 'Dr. Smith'
      }
    ];
    setPrescriptions(mockPrescriptions);

    fetch('/api/users')
      .then(res => res.json())
      .then(data => setPatients(data.filter((u: any) => u.role === 'patient')));
  }, []);

  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPatient = patients.find(p => p.id === formData.patientId);
    const newPrescription: Prescription = {
      id: Math.random().toString(36).substr(2, 9),
      patientName: selectedPatient?.name || 'Unknown',
      patientId: formData.patientId,
      medication: formData.medication,
      dosage: formData.dosage,
      frequency: formData.frequency,
      duration: formData.duration,
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      doctorName: user?.name || 'Dr. Specialist'
    };
    setPrescriptions([newPrescription, ...prescriptions]);
    setIsModalOpen(false);
    setFormData({ patientId: '', medication: '', dosage: '', frequency: '', duration: '' });
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      // Simulate processing
      setTimeout(async () => {
        const mockTranscript = "Prescribe Amoxicillin 500mg three times a day for 7 days. Also advise plenty of fluids and rest.";
        setTranscript(mockTranscript);
        
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            setVoicePrescription({
              medication: "Amoxicillin",
              dosage: "500mg",
              instructions: "Three times a day for 7 days. Advise plenty of fluids and rest."
            });
            setIsProcessing(false);
            return;
          }
          
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-latest",
            contents: `Extract the medication, dosage, and instructions from this doctor's note into a JSON object: "${mockTranscript}"`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  medication: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  instructions: { type: Type.STRING }
                },
                required: ["medication", "dosage", "instructions"]
              }
            }
          });
          
          if (response.text) {
            const parsed = JSON.parse(response.text);
            setVoicePrescription({
              medication: parsed.medication || "Unknown",
              dosage: parsed.dosage || "Unknown",
              instructions: parsed.instructions || "None"
            });
          }
        } catch (e) {
          console.error(e);
          setVoicePrescription({
            medication: "Amoxicillin",
            dosage: "500mg",
            instructions: "Three times a day for 7 days. Advise plenty of fluids and rest."
          });
        }
        setIsProcessing(false);
      }, 2000);
    } else {
      setIsRecording(true);
      setTranscript('');
      setVoicePrescription(null);
    }
  };

  const applyVoicePrescription = () => {
    if (voicePrescription) {
      setFormData({
        ...formData,
        medication: voicePrescription.medication,
        dosage: voicePrescription.dosage,
        frequency: voicePrescription.instructions,
        duration: '7 days' // Default or extracted
      });
      setVoicePrescription(null);
      setTranscript('');
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Prescription Management</h1>
          <p className="text-white/60">Create and track patient medications</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Prescription</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-blue-600 border border-blue-500/30">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-white/60">Active Prescriptions</div>
            <div className="text-xl font-bold text-white">{prescriptions.filter(p => p.status === 'active').length}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-white/60">Completed This Month</div>
            <div className="text-xl font-bold text-white">{prescriptions.filter(p => p.status === 'completed').length}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-amber-600 border border-amber-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-white/60">Expiring Soon</div>
            <div className="text-xl font-bold text-white">2</div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/20 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search by patient or medication..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all prescriptions?')) {
                  setPrescriptions([]);
                }
              }}
              className="px-3 py-2 text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2 backdrop-blur-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/10 text-white/50 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Medication</th>
                <th className="px-6 py-4 font-medium">Dosage & Frequency</th>
                <th className="px-6 py-4 font-medium">Date Issued</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPrescriptions.map((p) => (
                <tr key={p.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 border border-white/30">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-white">{p.patientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-indigo-400" />
                      <span className="font-medium text-white/80">{p.medication}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">{p.dosage}</div>
                    <div className="text-xs text-white/40">{p.frequency} • {p.duration}</div>
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-white/30" />
                      {new Date(p.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border",
                      p.status === 'active' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                      p.status === 'completed' ? "bg-blue-500/20 text-blue-400 border-blue-500/20" :
                      "bg-white/10 text-white/40 border-white/20"
                    )}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                        View Details
                      </button>
                      <button 
                        onClick={() => {
                          setPrescriptions(prescriptions.filter(pr => pr.id !== p.id));
                        }}
                        className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPrescriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                    No prescriptions found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="glass-card w-full max-w-lg pointer-events-auto overflow-hidden">
                <div className="p-6 border-b border-white/20 flex items-center justify-between bg-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">New Prescription</h3>
                      <p className="text-xs text-white/40">Issue a new medication to a patient</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleAddPrescription} className="p-6 space-y-4">
                  {/* Voice Dictation Section */}
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
                        <Mic className="w-3 h-3 text-indigo-400" />
                        Voice Dictation
                      </h4>
                      {voicePrescription && (
                        <button 
                          type="button"
                          onClick={applyVoicePrescription}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase"
                        >
                          Apply to Form
                        </button>
                      )}
                    </div>
                    
                    <div className="text-xs text-white/60 mb-3 min-h-[40px]">
                      {isRecording ? (
                        <span className="text-red-400 animate-pulse flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                          Listening...
                        </span>
                      ) : isProcessing ? (
                        <span className="text-indigo-400 flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : transcript ? (
                        <span className="italic">"{transcript}"</span>
                      ) : (
                        "Use voice to quickly fill the form"
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={handleVoiceRecord}
                      className={cn(
                        "w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                        isRecording 
                          ? "bg-red-500/20 text-red-400 border border-red-500/20" 
                          : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/20"
                      )}
                    >
                      <Mic className={cn("w-3 h-3", isRecording && "animate-bounce")} />
                      {isRecording ? "Stop Recording" : "Start Dictating"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Select Patient</label>
                      <select
                        required
                        value={formData.patientId}
                        onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                      >
                        <option value="" className="bg-slate-900">Choose a patient...</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Medication Name</label>
                      <div className="relative">
                        <Pill className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Amoxicillin"
                          value={formData.medication}
                          onChange={(e) => setFormData({...formData, medication: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Dosage</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. 500mg"
                          value={formData.dosage}
                          onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                          className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Duration</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. 7 days"
                          value={formData.duration}
                          onChange={(e) => setFormData({...formData, duration: e.target.value})}
                          className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Frequency</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Three times a day after meals"
                        value={formData.frequency}
                        onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-3 border-t border-white/20 mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2 text-white/60 font-medium hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-indigo-600/90 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-indigo-700/90 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      Issue Prescription
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
