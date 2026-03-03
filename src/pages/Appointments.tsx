import React, { useState, useEffect } from 'react';
import { Calendar, UserPlus, Search, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', startTime: '', reason: '', status: '' });
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const fetchAppointments = () => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        if (user?.role === 'patient') {
          setAppointments(data.filter((a: any) => a.patientId === user.id));
        } else if (user?.role === 'doctor') {
          setAppointments(data.filter((a: any) => a.doctorId === user.id));
        } else {
          setAppointments(data);
        }
      });
  };

  useEffect(() => {
    fetchAppointments();
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setPatients(data.filter((u: any) => u.role === 'patient'));
        setDoctors(data.filter((u: any) => u.role === 'doctor'));
      });
  }, [user]);

  const handleAdd = () => {
    setEditingAppointment(null);
    setFormData({ 
      patientId: user?.role === 'patient' ? user.id : '', 
      doctorId: '', 
      startTime: '', 
      reason: '', 
      status: 'scheduled' 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (appointment: any) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      startTime: new Date(appointment.startTime).toISOString().slice(0, 16),
      reason: appointment.reason,
      status: appointment.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchAppointments();
    } else {
      alert('Failed to delete appointment.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingAppointment ? `/api/appointments/${editingAppointment.id}` : '/api/appointments';
    const method = editingAppointment ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchAppointments();
    } else {
      alert('Failed to save appointment.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-white/60">Schedule and manage patient appointments</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/20 flex justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search appointments..." 
              className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/10 text-white/50 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
                {user?.role !== 'patient' && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{appt.patient.name}</td>
                  <td className="px-6 py-4 text-white/80">{appt.doctor.name}</td>
                  <td className="px-6 py-4 text-white/60">
                    {isNaN(new Date(appt.startTime).getTime()) 
                      ? '---' 
                      : new Date(appt.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-white/60">{appt.reason}</td>
                  <td className="px-6 py-4 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${
                      appt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                      appt.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      'bg-indigo-500/20 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                  {user?.role !== 'patient' && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(appt)} className="p-1.5 text-white/40 hover:text-indigo-400 hover:bg-white/10 rounded transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(appt.id)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'patient' ? 5 : 6} className="px-6 py-8 text-center text-white/40">
                    No appointments found.
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
                <div className="p-6 border-b border-white/20 bg-white/10 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Patient</label>
                    <select
                      required
                      disabled={user?.role === 'patient'}
                      value={formData.patientId}
                      onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="" className="bg-slate-900">Select Patient</option>
                      {patients.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Doctor</label>
                    <select
                      required
                      value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    >
                      <option value="" className="bg-slate-900">Select Doctor</option>
                      {doctors.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name} ({d.specialty})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Reason for Visit</label>
                    <textarea 
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                    />
                  </div>

                    {editingAppointment && (
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
                    )}

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
                      {editingAppointment ? 'Save Changes' : 'Schedule Appointment'}
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
