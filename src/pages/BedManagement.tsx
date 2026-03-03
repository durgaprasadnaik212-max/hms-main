import React, { useState, useEffect } from 'react';
import { BedDouble, Plus, Search, Edit2, Trash2, X, User } from 'lucide-react';
import { Bed, User as UserType } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from '../context/SocketContext';

export default function BedManagement() {
  const { socket, addToast } = useSocket();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<UserType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [formData, setFormData] = useState({ room: '', floor: 1, status: 'available', patientId: '' });

  const fetchBeds = () => {
    fetch('/api/beds')
      .then(res => res.json())
      .then(setBeds);
  };

  const fetchPatients = () => {
    fetch('/api/users?role=patient')
      .then(res => res.json())
      .then(setPatients);
  };

  useEffect(() => {
    fetchBeds();
    fetchPatients();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('bed-created', (newBed: Bed) => {
      setBeds(prev => {
        if (prev.find(b => b.id === newBed.id)) return prev;
        return [...prev, newBed];
      });
      addToast({
        type: 'success',
        title: 'Bed Added',
        message: `New bed added in ${newBed.room}`
      });
    });

    socket.on('bed-updated', (updatedBed: Bed) => {
      setBeds(prev => prev.map(b => b.id === updatedBed.id ? updatedBed : b));
      addToast({
        type: 'info',
        title: 'Bed Updated',
        message: `Bed in ${updatedBed.room} is now ${updatedBed.status}`
      });
    });

    socket.on('bed-deleted', (bedId: string) => {
      setBeds(prev => prev.filter(b => b.id !== bedId));
      addToast({
        type: 'warning',
        title: 'Bed Removed',
        message: 'A bed has been removed from the system'
      });
    });

    return () => {
      socket.off('bed-created');
      socket.off('bed-updated');
      socket.off('bed-deleted');
    };
  }, [socket, addToast]);

  const handleAdd = () => {
    setEditingBed(null);
    setFormData({ room: '', floor: 1, status: 'available', patientId: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (bed: Bed) => {
    setEditingBed(bed);
    setFormData({ 
      room: bed.room, 
      floor: bed.floor, 
      status: bed.status,
      patientId: bed.patientId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/beds/${id}`, { method: 'DELETE' });
    fetchBeds();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBed ? `/api/beds/${editingBed.id}` : '/api/beds';
    const method = editingBed ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    setIsModalOpen(false);
    fetchBeds();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bed Management</h1>
          <p className="text-white/60">Manage hospital beds and occupancy</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bed</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-4 text-xs text-white/70">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Available</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> Occupied</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" /> Cleaning</div>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search beds..." 
              className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/10 text-white/50 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 font-medium">Room</th>
                <th className="px-6 py-4 font-medium">Bed Number</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {beds.map((bed) => (
                <tr key={bed.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{bed.room}</td>
                  <td className="px-6 py-4 text-white/60">{bed.floor}</td>
                  <td className="px-6 py-4">
                    {bed.patient ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold backdrop-blur-sm">
                          {bed.patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{bed.patient.name}</div>
                          <div className="text-xs text-white/40">{bed.patient.email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white/30 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
                      bed.status === 'available' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
                      bed.status === 'occupied' && "bg-red-500/20 text-red-400 border-red-500/20",
                      bed.status === 'cleaning' && "bg-amber-500/20 text-amber-400 border-amber-500/20",
                      bed.status === 'maintenance' && "bg-white/10 text-white/40 border-white/20"
                    )}>
                      {bed.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(bed)}
                        className="p-1.5 text-white/40 hover:text-indigo-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(bed.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {beds.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/40">
                    No beds found.
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
                  <h3 className="text-lg font-semibold text-white">
                    {editingBed ? `Edit Bed ${editingBed.room} - ${editingBed.floor}` : 'Add New Bed'}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Room Number</label>
                      <input 
                        type="text" 
                        required
                        value={formData.room}
                        onChange={(e) => setFormData({...formData, room: e.target.value})}
                        placeholder="e.g. Room 101"
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Bed Number</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={formData.floor}
                        onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Bed Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['available', 'occupied', 'cleaning', 'maintenance'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormData({...formData, status})}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium border transition-all backdrop-blur-sm",
                            formData.status === status 
                              ? "bg-indigo-600/90 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" 
                              : "bg-white/10 text-white/40 border-white/20 hover:bg-white/20"
                          )}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Assign Patient</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <select 
                        value={formData.patientId}
                        onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none text-white"
                      >
                        <option value="" className="bg-slate-900">No Patient Assigned</option>
                        {patients.map(patient => (
                          <option key={patient.id} value={patient.id} className="bg-slate-900">
                            {patient.name} ({patient.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.patientId && (
                      <div className="mt-2 p-3 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
                        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Patient Details</div>
                        {patients.find(p => p.id === formData.patientId) && (
                          <div className="text-sm">
                            <div className="text-white font-medium">{patients.find(p => p.id === formData.patientId)?.name}</div>
                            <div className="text-white/40 text-xs">ID: {formData.patientId}</div>
                          </div>
                        )}
                      </div>
                    )}
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
                      {editingBed ? 'Save Changes' : 'Add Bed'}
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
