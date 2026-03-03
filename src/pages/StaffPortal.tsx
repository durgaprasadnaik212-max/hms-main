import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import Appointments from './Appointments';
import Patients from './Patients';
import Prescriptions from './Prescriptions';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  department: string;
  role: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  location: string;
}

export default function StaffPortal() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching staff schedule
    const mockShifts: Shift[] = [
      {
        id: 's1',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00 AM',
        endTime: '04:00 PM',
        department: 'Emergency',
        role: 'Nurse',
        status: 'ongoing',
        location: 'Wing A, Floor 1'
      },
      {
        id: 's2',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '08:00 AM',
        endTime: '04:00 PM',
        department: 'Emergency',
        role: 'Nurse',
        status: 'upcoming',
        location: 'Wing A, Floor 1'
      },
      {
        id: 's3',
        date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        startTime: '12:00 PM',
        endTime: '08:00 PM',
        department: 'Pediatrics',
        role: 'Support Staff',
        status: 'upcoming',
        location: 'Wing B, Floor 2'
      }
    ];

    setTimeout(() => {
      setShifts(mockShifts);
      setIsLoading(false);
    }, 800);
  }, []);

  const [isClockedIn, setIsClockedIn] = useState(false);

  const handleClockToggle = () => {
    setIsClockedIn(!isClockedIn);
    alert(isClockedIn ? 'Successfully clocked out.' : 'Successfully clocked in.');
  };

  const handleDetails = (shift: Shift) => {
    alert(`Shift Details:\nDepartment: ${shift.department}\nRole: ${shift.role}\nLocation: ${shift.location}\nTime: ${shift.startTime} - ${shift.endTime}`);
  };

  const handleSwapRequest = (shift: Shift) => {
    const confirmSwap = confirm(`Are you sure you want to request a swap for your ${shift.department} shift on ${new Date(shift.date).toLocaleDateString()}?`);
    if (confirmSwap) {
      alert('Swap request submitted to administration.');
    }
  };

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'ongoing': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'completed': return 'bg-white/10 text-white/40 border-white/20';
    }
  };

  if (user?.role === 'receptionist') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Receptionist Portal</h1>
            <p className="text-white/60">Manage appointments and patient registrations</p>
          </div>
        </div>
        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Appointments</h2>
            <Appointments />
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Patient Registration</h2>
            <Patients />
          </section>
        </div>
      </div>
    );
  }

  if (user?.role === 'nurse') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Nurse Portal</h1>
            <p className="text-white/60">Manage assigned patients and tasks</p>
          </div>
        </div>
        <Patients />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
          <p className="text-white/60">Welcome back, {user?.name}. Here is your work schedule.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClockToggle}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all shadow-lg backdrop-blur-md border",
              isClockedIn 
                ? "bg-red-500/20 text-red-400 border-red-500/20 hover:bg-red-500/30" 
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/30"
            )}
          >
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </button>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-white">Current Shift: 08:00 AM - 04:00 PM</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/20 bg-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Your Weekly Schedule
              </h3>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {shifts.map((shift) => (
                    <motion.div 
                      key={shift.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col md:flex-row md:items-center gap-6 p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group"
                    >
                      <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center min-w-[100px] shadow-sm backdrop-blur-md group-hover:border-indigo-500/30 transition-colors">
                        <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                          {new Date(shift.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {new Date(shift.date).getDate()}
                        </div>
                        <div className="text-[10px] text-indigo-400 font-bold uppercase">
                          {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-white">{shift.department}</h4>
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm", getStatusColor(shift.status))}>
                            {shift.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            {shift.startTime} - {shift.endTime}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                            {shift.location}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <User className="w-4 h-4 text-indigo-400" />
                            Role: {shift.role}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col gap-2">
                        <button 
                          onClick={() => handleDetails(shift)}
                          className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all border border-white/10"
                        >
                          Details
                        </button>
                        {shift.status === 'upcoming' && (
                          <button 
                            onClick={() => handleSwapRequest(shift)}
                            className="flex-1 px-4 py-2 bg-indigo-600/90 hover:bg-indigo-700/90 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                          >
                            Request Swap
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Attendance Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm text-white/60">Shifts This Month</span>
                <span className="text-lg font-bold text-white">22</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm text-white/60">Hours Worked</span>
                <span className="text-lg font-bold text-white">176h</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm text-white/60">Punctuality Rate</span>
                <span className="text-lg font-bold text-emerald-400">98%</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 bg-amber-500/10 border-amber-500/20">
            <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Important Notice
            </h3>
            <p className="text-sm text-amber-400/80 leading-relaxed">
              The hospital will be undergoing a system maintenance on Sunday from 02:00 AM to 04:00 AM. Please ensure all manual logs are updated before then.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
