import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Building2, 
  Activity, 
  TrendingUp, 
  Plus,
  Search,
  X,
  Loader2,
  Trash2,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Tenant {
  id: string;
  name: string;
  url?: string;
  logo?: string;
  userCount: number;
  status: 'active' | 'inactive';
  primaryColor?: string;
  adminEmail?: string;
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  
  // Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantUrl, setTenantUrl] = useState('');
  const [tenantLogo, setTenantLogo] = useState('');
  const [tenantColor, setTenantColor] = useState('#0f172a');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      setTenants(data);
    } catch (error) {
      console.error("Failed to fetch tenants", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    setTenantName('');
    setTenantUrl('');
    setTenantLogo('');
    setTenantColor('#0f172a');
    setAdminEmail('');
    setAdminPassword('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantName(tenant.name);
    setTenantUrl(tenant.url || '');
    setTenantLogo(tenant.logo || '');
    setTenantColor(tenant.primaryColor || '#0f172a');
    setAdminEmail(tenant.adminEmail || '');
    setAdminPassword(''); // Leave empty, only update if they type a new one
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openDeleteModal = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const url = editingTenant ? `/api/tenants/${editingTenant.id}` : '/api/tenants';
      const method = editingTenant ? 'PUT' : 'POST';
      
      const payload: any = { 
        name: tenantName, 
        url: tenantUrl,
        logo: tenantLogo,
        primaryColor: tenantColor,
        adminEmail,
        adminPassword
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        await fetchTenants();
        setIsModalOpen(false);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to save tenant');
      }
    } catch (error) {
      console.error("Failed to save tenant", error);
      setErrorMessage('A network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!tenantToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchTenants();
        setIsDeleteModalOpen(false);
        setTenantToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete tenant');
      }
    } catch (error) {
      console.error("Failed to delete tenant", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = tenants.reduce((acc, curr) => acc + curr.userCount, 0);

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Super Admin Console</h1>
          <p className="text-white/60">Manage tenants and system-wide settings</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Tenant</span>
        </button>
      </div>

      {/* Tenant List */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/20 bg-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Registered Tenants</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenants..." 
              className="pl-9 pr-4 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-64 placeholder:text-white/30"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/10 border-b border-white/20">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Tenant Name</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Users</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-white/40">
                    No tenants found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-white/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm backdrop-blur-sm bg-opacity-90"
                          style={{ backgroundColor: tenant.primaryColor || '#4f46e5' }}
                        >
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                        tenant.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                          : 'bg-white/10 text-white/60 border-white/20'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-white/60">
                      {tenant.userCount} users
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(tenant)}
                          className="p-2 text-white/40 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-all"
                          title="Edit Tenant"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(tenant)}
                          className="p-2 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
                          title="Delete Tenant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
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
                  <h3 className="text-lg font-semibold text-white">
                    {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {errorMessage && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMessage}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white border-b border-white/20 pb-2">Hospital Details</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Hospital Name</label>
                      <input 
                        type="text" 
                        required
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="e.g. City General Hospital"
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Website URL</label>
                        <input 
                          type="text" 
                          value={tenantUrl}
                          onChange={(e) => setTenantUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Logo URL</label>
                        <input 
                          type="text" 
                          value={tenantLogo}
                          onChange={(e) => setTenantLogo(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-semibold text-white border-b border-white/20 pb-2">Admin Credentials</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Admin Email</label>
                      <input 
                        type="email" 
                        required={!editingTenant}
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@hospital.com"
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">
                        {editingTenant ? 'New Password (leave blank to keep current)' : 'Password'}
                      </label>
                      <input 
                        type="password" 
                        required={!editingTenant}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-white/20 mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-indigo-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-indigo-700/90 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingTenant ? 'Save Changes' : 'Create Hospital'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && tenantToDelete && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="glass-card w-full max-w-md pointer-events-auto overflow-hidden">
                <div className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Delete Tenant?</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Are you sure you want to delete <span className="font-semibold text-white">{tenantToDelete.name}</span>? 
                      This action cannot be undone and will delete all associated users, appointments, and data.
                    </p>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-red-700/90 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-red-500/20"
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Delete Tenant
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
