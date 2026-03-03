import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', contact: '' });

  const canManageSuppliers = user?.role === 'admin' || user?.role === 'pharmacist';

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = () => {
    fetch('/api/suppliers')
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Error fetching suppliers:', error);
        setSuppliers([]);
      });
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', contact: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (sup: any) => {
    setEditingId(sup.id);
    setFormData({
      name: sup.name,
      contact: sup.contact
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchSuppliers();
    } else {
      alert('Failed to delete supplier.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
    const method = editingId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchSuppliers();
    } else {
      alert('Failed to save supplier.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Suppliers</h2>
        </div>
        {canManageSuppliers && (
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
            <UserPlus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/10 text-white/50 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                {canManageSuppliers && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {Array.isArray(suppliers) && suppliers.map((sup, index) => (
                <tr key={index} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{sup.name}</td>
                  <td className="px-6 py-4 text-white/80">{sup.contact}</td>
                  {canManageSuppliers && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(sup)} className="p-1.5 text-white/40 hover:text-indigo-400 hover:bg-white/10 rounded transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(sup.id)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={canManageSuppliers ? 3 : 2} className="px-6 py-8 text-center text-white/40">
                    No suppliers found.
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
                  <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Supplier Name</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Contact Info</label>
                    <input type="text" required value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30" />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-white/20 mt-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg font-medium transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-indigo-700/90 transition-colors shadow-lg shadow-indigo-500/20">
                      {editingId ? 'Save Changes' : 'Add Supplier'}
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
