import React, { useState, useEffect } from 'react';
import { Calendar, FileText, CreditCard, Video, MessageSquare, Sparkles, Send, User, Clock } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [symptomInput, setSymptomInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchAppointments = () => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        const patientAppointments = data.filter((a: any) => a.patientId === user?.id);
        setAppointments(patientAppointments);
      });
  };

  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    }
  }, [user?.id]);

  const handleSymptomCheck = async () => {
    if (!symptomInput.trim()) return;

    const userMsg = symptomInput;
    setSymptomInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a helpful medical assistant AI. The patient says: "${userMsg}". 
        Provide a brief, empathetic assessment and suggest urgency level (Low, Medium, High). 
        Disclaimer: Not medical advice.`,
      });

      setChatHistory(prev => [...prev, { role: 'ai', text: response.text }]);
    } catch (e) {
      console.error("Gemini Error:", e);
      setChatHistory(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now. Please try again." }]);
    }
    setIsTyping(false);
  };

  const handleReschedule = (id: string) => {
    navigate('/appointments');
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
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

  const handleBookAppointment = () => {
    navigate('/appointments');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Health Assistant</h1>
          <p className="text-white/60">Check symptoms and manage your care</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-1 gap-4">
            <div 
              onClick={handleBookAppointment}
              className="glass-card p-8 hover:border-indigo-500/50 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm backdrop-blur-sm">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">Book New Appointment</h3>
                <p className="text-white/60 mt-1">Schedule a visit with your preferred specialist</p>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/20 bg-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Upcoming Appointments
              </h3>
            </div>
            <div className="p-6">
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 2).map((app) => (
                    <div key={app.id} className="flex items-center gap-6 p-5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <div className="bg-white/20 p-4 rounded-xl border border-white/30 text-center min-w-[80px] shadow-sm backdrop-blur-md">
                        <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                          {new Date(app.startTime).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {new Date(app.startTime).getDate()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-white">Dr. {app.doctor_name || 'Specialist'}</div>
                        <div className="text-sm text-white/60">{app.reason || 'Consultation'} • {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="mt-3 flex gap-3">
                          <button 
                            onClick={() => handleReschedule(app.id)}
                            className="text-xs font-bold px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                          >
                            Reschedule
                          </button>
                          <button 
                            onClick={() => handleCancel(app.id)}
                            className="text-xs font-bold px-4 py-2 bg-white/10 border border-white/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors backdrop-blur-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/40 mb-4">No upcoming appointments</p>
                  <button 
                    onClick={handleBookAppointment}
                    className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Book your first visit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Symptom Checker */}
        <div className="glass-card flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-white/20 bg-indigo-600/90 text-white backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Symptom Checker</h3>
            </div>
            <p className="text-indigo-200 text-xs mt-1">Powered by Gemini AI</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white/5 backdrop-blur-sm">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-white/80 max-w-[85%] border border-white/20 backdrop-blur-md">
                Hello! I'm your AI health assistant. Describe your symptoms, and I can help categorize the urgency.
              </div>
            </div>

            {chatHistory.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm border",
                  msg.role === 'user' ? "bg-white/20 border-white/30" : "bg-indigo-500/20 border-indigo-500/20"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white/60" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl shadow-sm text-sm max-w-[85%] backdrop-blur-md border",
                  msg.role === 'user' 
                    ? "bg-indigo-600/90 text-white rounded-tr-none border-indigo-500/50" 
                    : "bg-white/10 text-white/80 rounded-tl-none border-white/20"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-white/40 border border-white/20 backdrop-blur-md">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-md">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSymptomCheck()}
                placeholder="Type your symptoms..."
                className="flex-1 px-4 py-2 glass-input rounded-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30"
              />
              <button 
                onClick={handleSymptomCheck}
                disabled={!symptomInput.trim() || isTyping}
                className="p-2 bg-indigo-600/90 text-white rounded-full hover:bg-indigo-700/90 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
