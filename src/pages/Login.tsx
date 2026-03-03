import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/30">
              <Activity className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-white/60">Sign in to MediNexus</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-white/30"
                  placeholder="name@hospital.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-white/30"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600/90 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-indigo-700/90 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md p-4 text-center text-xs text-white/40 border-t border-white/20">
          Secure HIPAA-Compliant Environment
        </div>
      </div>
    </div>
  );
}
