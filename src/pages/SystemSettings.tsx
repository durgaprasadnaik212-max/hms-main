import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Globe, Server, Database } from 'lucide-react';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Settings state
  const [platformName, setPlatformName] = useState('MediNexus');
  const [supportEmail, setSupportEmail] = useState('support@medinexus.com');
  const [defaultLanguage, setDefaultLanguage] = useState('English (US)');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setPlatformName(parsed.platformName || 'MediNexus');
      setSupportEmail(parsed.supportEmail || 'support@medinexus.com');
      setDefaultLanguage(parsed.defaultLanguage || 'English (US)');
      setIsMaintenanceMode(parsed.isMaintenanceMode || false);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    // Simulate API call and save to localStorage
    setTimeout(() => {
      localStorage.setItem('systemSettings', JSON.stringify({
        platformName,
        supportEmail,
        defaultLanguage,
        isMaintenanceMode
      }));
      window.dispatchEvent(new Event('settingsUpdated'));
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-white/60">Configure global application parameters</p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-emerald-400 text-sm font-medium animate-pulse">
              Settings saved!
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 border-r border-white/20 bg-white/10 p-2 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white/20 text-indigo-400 shadow-sm backdrop-blur-sm' 
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Platform Information</h3>
                  <div className="grid gap-6 max-w-2xl">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Platform Name</label>
                      <input 
                        type="text" 
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full px-4 py-2 glass-input rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Support Email</label>
                      <input 
                        type="email" 
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className="w-full px-4 py-2 glass-input rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Default Language</label>
                      <select 
                        value={defaultLanguage}
                        onChange={(e) => setDefaultLanguage(e.target.value)}
                        className="w-full px-4 py-2 glass-input rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      >
                        <option className="bg-slate-900">English (US)</option>
                        <option className="bg-slate-900">Spanish</option>
                        <option className="bg-slate-900">French</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/20">
                  <h3 className="text-lg font-medium text-white mb-4">Maintenance Mode</h3>
                  <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg backdrop-blur-sm">
                    <div>
                      <div className="font-medium text-amber-400">Enable Maintenance Mode</div>
                      <div className="text-sm text-amber-400/70 mt-1">Prevent users from accessing the platform during updates.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isMaintenanceMode}
                        onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'infrastructure' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white mb-4">Database Configuration</h3>
                <div className="p-4 glass-panel rounded-lg border border-white/20 font-mono text-sm text-white/60 break-all">
                  postgresql://neondb_owner:***@ep-small-mud-ai0mg7d2-pooler.c-4.us-east-1.aws.neon.tech/neondb
                </div>
                <div className="pt-4">
                  <button className="text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center gap-2 transition-colors">
                    <Database className="w-4 h-4" />
                    Test Connection
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
