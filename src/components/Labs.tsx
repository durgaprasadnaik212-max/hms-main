import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Labs() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ patientId: '', test: '', status: '' });
  const [editingBooking, setEditingBooking] = useState<any | null>(null);

  useEffect(() => {
    fetchBookings();
    fetchPatients();
  }, [user]);

  const fetchBookings = () => {
    fetch('/api/lab-bookings')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        if (user?.role === 'patient') {
          setBookings(list.filter((b: any) => b.patientId === user.id));
        } else {
          setBookings(list);
        }
      })
      .catch(error => {
        console.error('Error fetching lab bookings:', error);
        setBookings([]);
      });
  };

  const fetchPatients = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setPatients(data.filter((u: any) => u.role === 'patient')));
  };

  const handleAdd = () => {
    setEditingBooking(null);
    setFormData({ 
      patientId: user?.role === 'patient' ? user.id : '', 
      test: '', 
      status: 'pending' 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (booking: any) => {
    setEditingBooking(booking);
    setFormData({
      patientId: booking.patientId,
      test: booking.test,
      status: booking.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/lab-bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchBookings();
    } else {
      alert('Failed to delete lab booking.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingBooking ? `/api/lab-bookings/${editingBooking.id}` : '/api/lab-bookings';
    const method = editingBooking ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchBookings();
    } else {
      alert('Failed to save lab booking.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lab Test Bookings</h2>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Book Slot</span>
        </button>
      </div>

      {/* Table and Modal for Lab Bookings */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/10 text-white/50 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 font-medium">Patient Name</th>
                <th className="px-6 py-4 font-medium">Patient ID</th>
                <th className="px-6 py-4 font-medium">Test</th>
                {user?.role !== 'patient' && user?.role !== 'doctor' && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {Array.isArray(bookings) && bookings.map((booking, index) => (
                <tr key={index} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{booking.patient.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-white/40">{booking.patient.id.substring(0, 6).toUpperCase()}</td>
                  <td className="px-6 py-4 text-white/80">{booking.test}</td>
                  {user?.role !== 'patient' && user?.role !== 'doctor' && (
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(booking)} className="p-1.5 text-white/40 hover:text-indigo-400 hover:bg-white/10 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(booking.id)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                    </td>
                  )}
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'patient' || user?.role === 'doctor' ? 3 : 4} className="px-6 py-8 text-center text-white/40">
                    No bookings found.
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
                  <h3 className="text-lg font-semibold text-white">{editingBooking ? 'Edit Lab Booking' : 'Book Lab Slot'}</h3>
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
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled className="bg-slate-900">Select a patient</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900">{p.name} ({p.id.substring(0, 6).toUpperCase()})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Lab Test</label>
                    <input 
                      type="text" 
                      required
                      value={formData.test}
                      onChange={(e) => setFormData({...formData, test: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                    />
                  </div>

                    {editingBooking && (
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                        >
                          <option value="pending" className="bg-slate-900">Pending</option>
                          <option value="completed" className="bg-slate-900">Completed</option>
                          <option value="cancelled" className="bg-slate-900">Cancelled</option>
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
                      {editingBooking ? 'Save Changes' : 'Book Slot'}
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
