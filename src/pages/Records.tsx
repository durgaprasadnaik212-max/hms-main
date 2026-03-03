import React, { useState, useEffect } from 'react';
import { Search, FileText, Edit2, Trash2, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Records() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formData, setFormData] = useState({ reason: '', status: '' });

  const fetchRecords = () => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        if (user?.role === 'patient') {
          setRecords(data.filter((r: any) => r.patientId === user.id));
        } else if (user?.role === 'doctor') {
          setRecords(data.filter((r: any) => r.doctorId === user.id));
        } else {
          setRecords(data);
        }
      });
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      reason: record.reason || '',
      status: record.status || 'scheduled'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchRecords();
    } else {
      alert('Failed to delete record.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const res = await fetch(`/api/appointments/${editingRecord.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingRecord,
        ...formData
      })
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchRecords();
    } else {
      alert('Failed to update record.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Medical Records</h1>
          <p className="text-white/60">View and manage patient history and reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20">
          <Download className="w-4 h-4" />
          <span>Export All</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/20 flex justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/10 text-white/50 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 font-medium">Record ID</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Diagnosis/Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-white/40">
                    {record.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/40" />
                      <span className="font-medium text-white">{record.patient_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    {isNaN(new Date(record.startTime).getTime()) 
                      ? '---' 
                      : new Date(record.startTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 truncate max-w-[200px] text-white/60">{record.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border ${
                      record.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                      record.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      'bg-indigo-500/20 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user?.role !== 'patient' && (
                        <>
                          <button onClick={() => handleEdit(record)} className="p-1.5 text-white/40 hover:text-indigo-400 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(record.id)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className="p-1.5 text-white/40 hover:text-indigo-400 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                    No medical records found.
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="glass-card w-full max-w-md pointer-events-auto overflow-hidden">
                <div className="p-6 border-b border-white/20 flex items-center justify-between bg-white/10">
                  <h3 className="text-lg font-semibold text-white">Edit Medical Record</h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Diagnosis / Reason</label>
                    <textarea 
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    >
                      <option value="scheduled" className="bg-slate-900">Scheduled</option>
                      <option value="completed" className="bg-slate-900">Completed</option>
                      <option value="cancelled" className="bg-slate-900">Cancelled</option>
                      <option value="waiting" className="bg-slate-900">Waiting</option>
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-white/20 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-indigo-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-indigo-700/90 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      Save Changes
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
