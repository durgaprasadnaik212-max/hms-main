import React, { useEffect, useState } from 'react';
import { Users, BedDouble, Activity, IndianRupee, AlertCircle } from 'lucide-react';
import { Bed } from '../types';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const data = [
  { name: 'Mon', patients: 40 },
  { name: 'Tue', patients: 30 },
  { name: 'Wed', patients: 55 },
  { name: 'Thu', patients: 45 },
  { name: 'Fri', patients: 60 },
  { name: 'Sat', patients: 35 },
  { name: 'Sun', patients: 20 },
];

export default function AdminDashboard() {
  const { socket } = useSocket();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    availableBeds: 0,
    doctorsOnDuty: 0,
    revenueToday: 0
  });
  const navigate = useNavigate();

  const fetchData = () => {
    fetch('/api/beds')
      .then(res => res.json())
      .then(setBeds);

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setDashboardStats(data));
  };

  useEffect(() => {
    fetchData(); // Initial fetch
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleBedUpdate = (updatedBed: Bed) => {
      setBeds(prev => prev.map(b => b.id === updatedBed.id ? updatedBed : b));
      // Refresh stats to update availableBeds count
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setDashboardStats(data));
    };

    const handleBedCreate = (newBed: Bed) => {
      setBeds(prev => [...prev, newBed]);
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setDashboardStats(data));
    };

    const handleBedDelete = (bedId: string) => {
      setBeds(prev => prev.filter(b => b.id !== bedId));
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setDashboardStats(data));
    };

    const handleInvoiceUpdate = () => {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setDashboardStats(data));
    };

    socket.on('bed-updated', handleBedUpdate);
    socket.on('bed-created', handleBedCreate);
    socket.on('bed-deleted', handleBedDelete);
    socket.on('invoice-created', handleInvoiceUpdate);
    socket.on('invoice-updated', handleInvoiceUpdate);

    return () => {
      socket.off('bed-updated', handleBedUpdate);
      socket.off('bed-created', handleBedCreate);
      socket.off('bed-deleted', handleBedDelete);
      socket.off('invoice-created', handleInvoiceUpdate);
      socket.off('invoice-updated', handleInvoiceUpdate);
    };
  }, [socket]);

  const stats = [
    { label: 'Total Patients', value: dashboardStats.totalPatients.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20', path: '/patients' },
    { label: 'Available Beds', value: dashboardStats.availableBeds.toString(), icon: BedDouble, color: 'text-emerald-400', bg: 'bg-emerald-500/20', path: '/beds' },
    { label: 'Doctors On-Duty', value: dashboardStats.doctorsOnDuty.toString(), icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/20', path: '/staffing' },
    { label: 'Revenue Today', value: `₹${dashboardStats.revenueToday.toLocaleString()}`, icon: IndianRupee, color: 'text-amber-400', bg: 'bg-amber-500/20', path: '/billing' },
  ];

  const toggleBedStatus = async (bed: Bed) => {
    const statuses: Bed['status'][] = ['available', 'occupied', 'cleaning', 'maintenance'];
    const currentIndex = statuses.indexOf(bed.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    try {
      const res = await fetch(`/api/beds/${bed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bed, status: nextStatus })
      });
      
      if (res.ok) {
        setBeds(beds.map(b => b.id === bed.id ? { ...b, status: nextStatus } : b));
      }
    } catch (error) {
      console.error("Failed to update bed status", error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <p className="text-white/60">Hospital operational overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            onClick={() => navigate(stat.path)}
            className="glass-card p-6 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-lg backdrop-blur-sm", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-white/60">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Live Bed Map */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white">Live Bed Occupancy</h3>
            <div className="flex gap-4 text-xs text-white/60">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" /> Available</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" /> Occupied</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" /> Cleaning</div>
            </div>
          </div>
          
          <div className="space-y-6">
            {[1, 2].map(floor => (
              <div key={floor}>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Floor {floor}</div>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                  {beds.filter(b => b.floor === floor).map(bed => (
                      <div 
                        key={bed.id}
                        onClick={() => toggleBedStatus(bed)}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm backdrop-blur-sm border",
                          bed.status === 'available' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
                          bed.status === 'occupied' && "bg-red-500/20 text-red-400 border-red-500/20",
                          bed.status === 'cleaning' && "bg-amber-500/20 text-amber-400 border-amber-500/20",
                          bed.status === 'maintenance' && "bg-white/10 text-white/40 border-white/20",
                        )}
                        title={`${bed.room} - ${bed.status} (Click to toggle)`}
                      >
                        {bed.room.split(' ')[1]}
                      </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Realtime Overview */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-6">Realtime Overview</h3>
          <div className="space-y-4">
            <div 
              onClick={() => navigate('/patients')}
              className="flex gap-4 items-center p-4 rounded-lg glass-panel cursor-pointer hover:shadow-md transition-all hover:-translate-x-1"
            >
              <div className="p-3 bg-blue-500/20 backdrop-blur-sm rounded-lg text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-100">Realtime Patients</div>
                <div className="text-2xl font-bold text-blue-300">{dashboardStats.totalPatients}</div>
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/beds')}
              className="flex gap-4 items-center p-4 rounded-lg glass-panel cursor-pointer hover:shadow-md transition-all hover:-translate-x-1"
            >
              <div className="p-3 bg-emerald-500/20 backdrop-blur-sm rounded-lg text-emerald-400">
                <BedDouble className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-emerald-100">Available Beds</div>
                <div className="text-2xl font-bold text-emerald-300">{dashboardStats.availableBeds}</div>
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/staffing')}
              className="flex gap-4 items-center p-4 rounded-lg glass-panel cursor-pointer hover:shadow-md transition-all hover:-translate-x-1"
            >
              <div className="p-3 bg-indigo-500/20 backdrop-blur-sm rounded-lg text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-indigo-100">Doctors On-Duty</div>
                <div className="text-2xl font-bold text-indigo-300">{dashboardStats.doctorsOnDuty}</div>
              </div>
            </div>

            <div 
              onClick={() => navigate('/appointments')}
              className="flex gap-4 items-center p-4 rounded-lg glass-panel cursor-pointer hover:shadow-md transition-all hover:-translate-x-1"
            >
              <div className="p-3 bg-amber-500/20 backdrop-blur-sm rounded-lg text-amber-400">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-amber-100">Revenue Today</div>
                <div className="text-2xl font-bold text-amber-300">₹{dashboardStats.revenueToday.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-white mb-4">Patient Inflow</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'rgba(255,255,255,0.5)'}} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#fff'}} />
                  <Bar dataKey="patients" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
