import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, FileText, Mic, Send, X } from 'lucide-react';
import { Appointment } from '../types';
import { cn } from '../lib/utils';
import { GoogleGenAI, Type } from "@google/genai";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(setAppointments);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Clinical Dashboard</h1>
        <p className="text-white/60">Welcome back, Dr. Specialist</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="text-sm text-white/60 mb-1">Total Appointments</div>
          <div className="text-2xl font-bold text-white">{appointments.length}</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-white/60 mb-1">Pending Reviews</div>
          <div className="text-2xl font-bold text-white">12</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-white/60 mb-1">Emergency Alerts</div>
          <div className="text-2xl font-bold text-red-400">0</div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/20 bg-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="p-12 text-center text-white/40 italic">
          No recent activity to display.
        </div>
      </div>
    </div>
  );
}
