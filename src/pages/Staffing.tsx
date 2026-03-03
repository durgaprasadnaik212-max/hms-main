import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Staffing() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'staff'>('doctors');
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'doctor', specialty: '', password: '' });

  const fetchUsers = () => {
    fetch(`/api/users?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setUsers(data));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    console.log('Opening Add Staff Modal');
    setEditingUser(null);
    setFormData({ 
      name: '', 
      email: '', 
      role: activeTab === 'doctors' ? 'doctor' : 'nurse', 
      specialty: '', 
      password: '' 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    console.log('Opening Edit Staff Modal for:', user.name);
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      specialty: user.specialty || '', 
      password: '' 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while deleting.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    // Ensure specialty is null if not a doctor or empty
    const payload = {
      ...formData,
      specialty: formData.role === 'doctor' ? formData.specialty : null
    };

    console.log('Submitting user data:', payload);

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log('User saved successfully');
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        console.error('Server error:', data);
        alert(data.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Failed to connect to the server.');
    }
  };

  const filteredUsers = users.filter(u => {
    if (activeTab === 'doctors') return u.role === 'doctor';
    return ['nurse', 'lab_tech', 'pharmacist', 'accountant', 'receptionist', 'radiologist'].includes(u.role);
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-blue-500/30 text-blue-200 border-blue-400/30';
      case 'nurse': return 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30';
      case 'lab_tech': return 'bg-purple-500/30 text-purple-200 border-purple-400/30';
      case 'pharmacist': return 'bg-amber-500/30 text-amber-200 border-amber-400/30';
      case 'accountant': return 'bg-cyan-500/30 text-cyan-200 border-cyan-400/30';
      case 'receptionist': return 'bg-pink-500/30 text-pink-200 border-pink-400/30';
      case 'radiologist': return 'bg-orange-500/30 text-orange-200 border-orange-400/30';
      default: return 'bg-gray-500/30 text-gray-200 border-gray-400/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staffing Management</h1>
          <p className="text-white/60">Manage doctors and hospital staff</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-2 bg-white/10 border border-white/20 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'doctors' ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              Doctors
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'staff' ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              Staff
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/10 text-white/50 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                {activeTab === 'doctors' && <th className="px-6 py-4 font-medium">Specialty</th>}
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full bg-white/10 object-cover border border-white/30"
                      />
                      <span className="font-medium text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60">{user.email}</td>
                  <td className="px-6 py-4 capitalize">
                    <span className={`px-4 py-2 rounded-lg text-sm font-extrabold tracking-wide border backdrop-blur-md shadow-md uppercase ${getRoleBadgeColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  {activeTab === 'doctors' && <td className="px-6 py-4 text-white/60">{user.specialty || 'General'}</td>}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-white/40 hover:text-indigo-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                    No {activeTab} found.
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
                    {editingUser ? 'Edit' : 'Add New'} {activeTab === 'doctors' ? 'Doctor' : 'Staff'}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
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
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                    <input 
                      type="password" 
                      {...(!editingUser && { required: true })}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={editingUser ? "Leave blank to keep current" : ""}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                    />
                  </div>

                  {activeTab === 'doctors' ? (
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Specialty</label>
                      <input 
                        type="text" 
                        required
                        value={formData.specialty}
                        onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                        placeholder="e.g. Cardiology"
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                      >
                        <option value="nurse" className="bg-slate-900 text-white">Nurse</option>
                        <option value="lab_tech" className="bg-slate-900 text-white">Lab Technician</option>
                        <option value="pharmacist" className="bg-slate-900 text-white">Pharmacist</option>
                        <option value="accountant" className="bg-slate-900 text-white">Accountant</option>
                        <option value="radiologist" className="bg-slate-900 text-white">Radiologist</option>
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
                      {editingUser ? 'Save Changes' : `Add ${activeTab === 'doctors' ? 'Doctor' : 'Staff'}`}
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
