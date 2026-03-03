import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, DollarSign, CheckCircle, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Billing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    items: [{ description: '', cost: '' }],
    status: 'pending'
  });

  useEffect(() => {
    fetchInvoices();
    fetchPatients();
  }, []);

  const fetchInvoices = () => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => setInvoices(data));
  };

  const fetchPatients = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setPatients(data.filter((u: any) => u.role === 'patient')));
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', cost: '' }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchInvoices();
      setFormData({ patientId: '', items: [{ description: '', cost: '' }], status: 'pending' });
    } else {
      alert('Failed to create invoice');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      fetchInvoices();
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Invoices</h1>
          <p className="text-white/60">Manage patient payments and generate invoices</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/20 flex justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/10 text-white/50 border-b border-white/20">
              <tr>
                <th className="px-6 py-4 font-medium">Invoice ID</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-white/40">
                    #{invoice.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {invoice.patient?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    ₹{invoice.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${
                      invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                      invoice.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/20'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(invoice.id, 'paid')}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-1.5 text-white/40 hover:text-indigo-400 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                    No invoices found.
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
              <div className="glass-card w-full max-w-lg pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/20 flex items-center justify-between shrink-0 bg-white/10">
                  <h3 className="text-lg font-semibold text-white">Generate New Invoice</h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Patient</label>
                    <select
                      required
                      value={formData.patientId}
                      onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    >
                      <option value="" className="bg-slate-900">Select Patient</option>
                      {patients.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-white/70">Billable Items</label>
                      <button 
                        type="button"
                        onClick={handleAddItem}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        + Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex gap-3">
                          <input 
                            type="text"
                            placeholder="Description"
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="flex-1 px-3 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
                          />
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                            <input 
                              type="number"
                              placeholder="0.00"
                              required
                              min="0"
                              step="0.01"
                              value={item.cost}
                              onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                              className="w-full pl-7 pr-3 py-2 glass-input rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
                            />
                          </div>
                          {formData.items.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-2 text-white/40 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/10 p-4 rounded-lg flex justify-between items-center backdrop-blur-sm">
                    <span className="font-medium text-white/70">Total Amount</span>
                    <span className="text-xl font-bold text-white">₹{totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-white/20">
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
                      Generate Invoice
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
