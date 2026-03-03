import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  Activity, 
  FlaskConical, 
  Microscope, 
  Pill, 
  CreditCard, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Heart,
  Thermometer,
  Droplets,
  DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function PatientPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'billing'>('dashboard');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [vitals, setVitals] = useState({
    heartRate: 72,
    bloodPressure: '120/80',
    temperature: 98.6,
    oxygen: 98
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchAppointments = () => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        const patientAppointments = data.filter((a: any) => a.patientId === user?.id);
        setAppointments(patientAppointments);
      });
  };

  const fetchInvoices = () => {
    if (user?.id) {
      fetch(`/api/invoices?patientId=${user.id}`)
        .then(res => res.json())
        .then(data => setInvoices(data));
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
      fetchInvoices();
    }
  }, [user?.id]);

  const handlePay = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const processPayment = async (method: 'online' | 'cash') => {
    if (!selectedInvoice) return;

    // If cash, we might just show instructions, but user asked for "pay by cash"
    // For simplicity and to satisfy "show paid", we'll update status for both, 
    // or maybe just for online. 
    // "after paying the money in hospital page it should show paid"
    // Let's assume online payment updates it immediately.
    
    if (method === 'online') {
      try {
        const res = await fetch(`/api/invoices/${selectedInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'paid' })
        });
        
        if (res.ok) {
          alert('Payment successful!');
          setIsPaymentModalOpen(false);
          fetchInvoices();
        } else {
          alert('Payment failed');
        }
      } catch (error) {
        console.error(error);
        alert('An error occurred');
      }
    } else {
      // Cash payment
      alert('Please visit the hospital front desk to pay by cash. Your invoice ID is #' + selectedInvoice.id.slice(-6).toUpperCase());
      setIsPaymentModalOpen(false);
    }
  };

  const features = [
    { 
      id: 'symptom-checker', 
      title: 'AI Symptom Checker', 
      desc: 'Analyze symptoms with AI', 
      icon: Activity, 
      color: 'bg-indigo-600',
      path: '/symptom-checker'
    },
    { 
      id: 'appointments', 
      title: 'Appointments', 
      desc: 'Book and manage your visits', 
      icon: Calendar, 
      color: 'bg-blue-500',
      path: '/appointments'
    },
    { 
      id: 'records', 
      title: 'Medical Records', 
      desc: 'View your clinical history', 
      icon: FileText, 
      color: 'bg-indigo-500',
      path: '/records'
    },
    { 
      id: 'labs', 
      title: 'Lab Results', 
      desc: 'Blood tests and diagnostics', 
      icon: FlaskConical, 
      color: 'bg-emerald-500',
      path: '/services?tab=labs'
    },
    { 
      id: 'radiology', 
      title: 'Radiology', 
      desc: 'X-Rays, MRI, and Scans', 
      icon: Microscope, 
      color: 'bg-purple-500',
      path: '/services?tab=radiology'
    },
    { 
      id: 'pharmacy', 
      title: 'Pharmacy', 
      desc: 'Prescriptions and refills', 
      icon: Pill, 
      color: 'bg-rose-500',
      path: '/services?tab=pharmacy'
    },
    { 
      id: 'billing', 
      title: 'Billing', 
      desc: 'Invoices and payments', 
      icon: CreditCard, 
      color: 'bg-amber-500',
      action: () => setActiveTab('billing')
    },
  ];

  const handleDownload = (recordId: string) => {
    alert(`Downloading medical record ${recordId.substring(0, 8).toUpperCase()}...`);
  };

  const handleReschedule = (appointmentId: string) => {
    navigate('/appointments');
  };

  const handleCancel = async (appointmentId: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`, { method: 'DELETE' });
        if (res.ok) {
          fetchAppointments();
        } else {
          alert('Failed to cancel appointment');
        }
      } catch (error) {
        console.error(error);
        alert('An error occurred');
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {activeTab === 'billing' ? 'Billing & Payments' : `Welcome back, ${user?.name}`}
          </h1>
          <p className="text-white/60 mt-1">
            {activeTab === 'billing' ? 'Manage your invoices and payment history' : 'Your health overview and hospital services at a glance.'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20 backdrop-blur-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Connected to Hospital Network
        </div>
      </div>

      {activeTab === 'billing' && (
        <div className="mb-6">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-white/60 hover:text-indigo-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </button>
        </div>
      )}

      {activeTab === 'dashboard' ? (
        <>
          {/* Vitals Quick View */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Heart Rate', value: `${vitals.heartRate} bpm`, icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
              { label: 'Blood Pressure', value: vitals.bloodPressure, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Temperature', value: `${vitals.temperature}°F`, icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Oxygen Level', value: `${vitals.oxygen}%`, icon: Droplets, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((stat, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={stat.label} 
                className="glass-card p-4 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm bg-opacity-50", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div className="text-xs font-medium text-white/50 uppercase tracking-wider">{stat.label}</div>
                <div className="text-lg font-bold text-white mt-1">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Features Grid */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  Hospital Services
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {features.map((feature, i) => (
                    <motion.div
                      onClick={() => feature.action ? feature.action() : navigate(feature.path!)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      key={feature.id}
                      className="group glass-card p-5 hover:border-indigo-500/50 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg backdrop-blur-sm bg-opacity-90", feature.color)}>
                          <feature.icon className="w-6 h-6" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <div className="mt-4">
                        <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{feature.title}</h3>
                        <p className="text-sm text-white/50 mt-1">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar: Appointments & Health Tips */}
            <div className="space-y-8">
              <section className="glass-card overflow-hidden">
                <div className="p-5 border-b border-white/20 bg-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-white">Next Appointment</h3>
                  <Calendar className="w-4 h-4 text-white/40" />
                </div>
                <div className="p-5">
                  {appointments.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-indigo-600/90 backdrop-blur-sm text-white p-3 rounded-xl text-center min-w-[60px] shadow-lg shadow-indigo-500/30">
                          <div className="text-[10px] font-bold uppercase opacity-80">
                            {isNaN(new Date(appointments[0].startTime).getTime()) 
                              ? '---' 
                              : new Date(appointments[0].startTime).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-xl font-bold">
                            {isNaN(new Date(appointments[0].startTime).getTime()) 
                              ? '--' 
                              : new Date(appointments[0].startTime).getDate()}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-white">Dr. {appointments[0].doctor_name || 'Specialist'}</div>
                          <div className="text-sm text-white/60">{appointments[0].reason || 'Consultation'}</div>
                          <div className="text-xs font-medium text-indigo-400 mt-1">
                            {isNaN(new Date(appointments[0].startTime).getTime())
                              ? '--:--'
                              : new Date(appointments[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 flex gap-2">
                        <button 
                          onClick={() => handleReschedule(appointments[0].id)}
                          className="flex-1 py-2 bg-indigo-600/90 backdrop-blur-sm text-white rounded-lg text-sm font-bold hover:bg-indigo-700/90 transition-colors shadow-lg shadow-indigo-500/20"
                        >
                          Reschedule
                        </button>
                        <button 
                          onClick={() => handleCancel(appointments[0].id)}
                          className="flex-1 py-2 bg-white/10 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors border border-red-500/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-white/60 mb-3">No upcoming appointments</p>
                      <button 
                        onClick={() => navigate('/appointments')}
                        className="text-sm font-bold text-indigo-400 hover:underline"
                      >
                        Book Now
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : (
        /* Billing Tab Content */
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <div className="text-sm text-white/60 mb-1">Total Due</div>
              <div className="text-3xl font-bold text-white">
                ₹{invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="text-sm text-white/60 mb-1">Total Paid</div>
              <div className="text-3xl font-bold text-emerald-400">
                ₹{invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="text-sm text-white/60 mb-1">Invoices</div>
              <div className="text-3xl font-bold text-indigo-400">{invoices.length}</div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h3 className="font-bold text-white">Invoice History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white/70">
                <thead className="bg-white/10 text-white/50 border-b border-white/20">
                  <tr>
                    <th className="px-6 py-4 font-medium">Invoice ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Items</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-white/40">
                        #{invoice.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {Array.isArray(invoice.items) ? invoice.items.length : 0} items
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        ₹{invoice.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm bg-opacity-50 ${
                          invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                          invoice.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {invoice.status === 'pending' && (
                          <button 
                            onClick={() => { setSelectedInvoice(invoice); setIsPaymentModalOpen(true); }}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
                          >
                            Pay Now
                          </button>
                        )}
                        {invoice.status === 'paid' && (
                          <span className="text-xs text-emerald-400 font-medium flex items-center justify-end gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                            Paid
                          </span>
                        )}
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
        </div>
      )}
      
      {/* Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/20 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Payment Method</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-white/40 hover:text-white">
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl mb-6 border border-white/20">
                <div className="text-sm text-white/60 mb-1">Total Amount Due</div>
                <div className="text-3xl font-bold text-white">₹{selectedInvoice.amount.toFixed(2)}</div>
                <div className="text-xs font-mono text-white/40 mt-1">Invoice #{selectedInvoice.id.slice(-6).toUpperCase()}</div>
              </div>
              
              <button 
                onClick={() => processPayment('online')}
                className="w-full flex items-center justify-between p-4 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-white/10 transition-all group glass-panel"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors backdrop-blur-sm">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Online Banking / Card</div>
                    <div className="text-xs text-white/50">Instant processing</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-indigo-400" />
              </button>

              <button 
                onClick={() => processPayment('cash')}
                className="w-full flex items-center justify-between p-4 border border-white/10 rounded-xl hover:border-emerald-500/50 hover:bg-white/10 transition-all group glass-panel"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors backdrop-blur-sm">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Cash Payment</div>
                    <div className="text-xs text-white/50">Pay at hospital counter</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
