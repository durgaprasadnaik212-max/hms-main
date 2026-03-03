import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, X, Users, ChevronRight, Clock, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function Patients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchPatients = () => {
    fetch(`/api/users?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setPatients(data.filter((u: any) => u.role === 'patient')));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPatient ? `/api/users/${editingPatient.id}` : '/api/users';
    const method = editingPatient ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, role: 'patient' })
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingPatient(null);
      setFormData({ name: '', email: '', password: '' });
      fetchPatients();
    } else {
      const data = await res.json();
      alert(data.error || 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    console.log('Attempting to delete patient:', id);
    if (!confirm('Are you sure you want to delete this patient?')) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        console.log('Patient deleted successfully');
        fetchPatients();
      } else {
        const data = await res.json();
        console.error('Failed to delete patient:', data);
        alert(data.error || 'Failed to delete patient');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('An error occurred');
    }
  };

  const handleEdit = (patient: any) => {
    setEditingPatient(patient);
    setFormData({ name: patient.name, email: patient.email, password: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Main Content: Patient Management Table */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Patient Directory</h1>
            <p className="text-white/60">Manage all registered patients and clinical records</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Search patients..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-64 placeholder:text-white/30"
              />
            </div>
            {isAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Patient</span>
              </button>
            )}
          </div>
        </div>

        <div className="glass-card overflow-hidden min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-white/10 text-white/50 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient ID</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-white/10 transition-colors group">
                    <td className="px-6 py-4 font-mono text-white/40 text-xs">{patient.id.substring(0, 6).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={patient.avatar || `https://ui-avatars.com/api/?name=${patient.name}`} 
                          alt={patient.name}
                          className="w-8 h-8 rounded-full bg-white/10 object-cover border border-white/30"
                        />
                        <span className="font-medium text-white">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">{patient.email}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isAdmin && (
                          <button 
                            onClick={() => navigate(`/portal?id=${patient.id}`)}
                            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] uppercase tracking-wider backdrop-blur-sm"
                          >
                            VIEW PORTAL
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleEdit(patient)}
                              className="p-1.5 text-white/40 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-all"
                              title="Edit Patient"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(patient.id)}
                              className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
                              title="Delete Patient"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-white/40">
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                    {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                  </h3>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingPatient(null);
                      setFormData({ name: '', email: '', password: '' });
                    }}
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Password {editingPatient && '(Leave blank to keep current)'}
                    </label>
                    <input 
                      type="password" 
                      required={!editingPatient}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-white/20 mt-6">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingPatient(null);
                        setFormData({ name: '', email: '', password: '' });
                      }}
                      className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-indigo-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-indigo-700/90 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      {editingPatient ? 'Update Patient' : 'Add Patient'}
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
