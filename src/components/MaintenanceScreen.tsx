import React from 'react';
import { Settings, AlertTriangle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function MaintenanceScreen() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8 text-center space-y-6 relative"
      >
        {user && (
          <button 
            onClick={logout}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center relative">
            <Settings className="w-10 h-10 text-amber-500 animate-[spin_4s_linear_infinite]" />
            <AlertTriangle className="w-6 h-6 text-amber-400 absolute bottom-0 right-0 bg-slate-900 rounded-full" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">System Maintenance</h1>
          <p className="text-white/60">
            We are currently performing scheduled maintenance to improve our services. 
            The platform will be back online shortly.
          </p>
        </div>
        
        <div className="pt-6 border-t border-white/10">
          <p className="text-sm text-white/40">
            If you need immediate assistance, please contact support.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
