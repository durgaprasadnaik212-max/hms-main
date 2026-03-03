import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Activity, 
  Bell,
  Search,
  Menu,
  Stethoscope,
  BedDouble,
  X,
  Camera,
  Loader2,
  CheckCircle2,
  Pill,
  Truck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardLayout() {
  const { user, logout, login } = useAuth(); // Assuming we might need to update user context, but we'll just reload for now or update local state
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfileAvatar(user.avatar || '');
    }
  }, [user, navigate]);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    try {
      const payload: any = { name: profileName, email: profileEmail, avatar: profileAvatar };
      if (profilePassword) {
        payload.password = profilePassword;
      }
      
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        // In a real app, we'd update the AuthContext here. 
        // For now, we'll just reload the page to get the new token/user data, 
        // or just let the user see the changes locally if we don't need a new token.
        alert('Profile updated successfully! Please log in again to see all changes.');
        logout();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const getNavItems = () => {
    switch (user.role) {
      case 'superadmin':
        return [
          { icon: LayoutDashboard, label: 'Global Overview', path: '/dashboard' },
          { icon: Users, label: 'All Tenants', path: '/tenants' },
          { icon: Settings, label: 'System Settings', path: '/settings' },
        ];
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
          { icon: BedDouble, label: 'Bed Management', path: '/beds' },
          { icon: Users, label: 'Staffing', path: '/staffing' },
          { icon: Users, label: 'Patients', path: '/patients' },
          { icon: Calendar, label: 'Appointments', path: '/appointments' },
        ];
      case 'doctor':
        return [
          { icon: LayoutDashboard, label: 'Workspace', path: '/dashboard' },
          { icon: Stethoscope, label: 'Doctor Portal', path: '/portal' },
          { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
          { icon: Users, label: 'Patients', path: '/patients' },
          { icon: FileText, label: 'Records', path: '/records' },
          { icon: Stethoscope, label: 'Services', path: '/services' },
        ];
      case 'patient':
        return [
          { icon: LayoutDashboard, label: 'Portal Home', path: '/dashboard' },
          { icon: Stethoscope, label: 'Symptom Checker', path: '/symptom-checker' },
          { icon: Calendar, label: 'Appointments', path: '/appointments' },
          { icon: FileText, label: 'Medical Records', path: '/records' },
          { icon: Activity, label: 'Hospital Services', path: '/services' },
        ];
      case 'staff':
        return [
          { icon: LayoutDashboard, label: 'Staff Portal', path: '/dashboard' },
          { icon: Calendar, label: 'My Schedule', path: '/staff-portal' },
        ];
      case 'pharmacist':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
          { icon: Pill, label: 'Inventory', path: '/pharmacy-portal?tab=inventory' },
          { icon: Truck, label: 'Suppliers', path: '/pharmacy-portal?tab=suppliers' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const hasSidebar = navItems.length > 0;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      {hasSidebar && (
        <aside 
          className={cn(
            "glass border-r border-white/20 fixed inset-y-0 left-0 z-50 transition-all duration-300 flex flex-col",
            isSidebarOpen ? "w-64" : "w-20"
          )}
        >
          <div className="h-16 flex items-center px-6 border-b border-white/20">
            <div className="w-8 h-8 bg-indigo-600/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
              <Activity className="w-5 h-5" />
            </div>
            {isSidebarOpen && (
              <span className="ml-3 font-bold text-white tracking-tight">MediNexus</span>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => {
                  const isActuallyActive = item.path.includes('?') 
                    ? location.pathname + location.search === item.path
                    : isActive;
                  
                  return cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActuallyActive 
                      ? "bg-white/20 text-white font-medium shadow-sm backdrop-blur-sm border border-white/20" 
                      : "text-white/60 hover:bg-white/10 hover:text-white hover:shadow-sm"
                  );
                }}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/20">
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-red-500/20 hover:text-red-400 w-full transition-colors hover:shadow-sm"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 flex flex-col min-h-screen",
        hasSidebar ? (isSidebarOpen ? "ml-64" : "ml-20") : ""
      )}>
        {/* Header */}
        <header className="h-16 glass border-b border-white/20 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {hasSidebar ? (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/20 rounded-lg text-white/70 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="font-bold text-white tracking-tight">MediNexus</span>
              </div>
            )}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-64 backdrop-blur-sm transition-all hover:bg-white/20 placeholder:text-white/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 hover:bg-white/20 rounded-full text-white/70 relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white/20 shadow-sm" />
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 glass-card overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/10">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Mark all as read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {[
                        { title: 'System Update', desc: 'Version 2.4 is now live.', time: '2m ago', unread: true },
                        { title: 'New Tenant Registered', desc: 'City Clinic has joined the platform.', time: '1h ago', unread: true },
                        { title: 'Security Alert', desc: 'Failed login attempt detected.', time: '5h ago', unread: false },
                      ].map((notif, i) => (
                        <div key={i} className={`p-4 border-b border-white/10 hover:bg-white/10 transition-colors cursor-pointer ${notif.unread ? 'bg-white/5' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-medium ${notif.unread ? 'text-white' : 'text-white/70'}`}>{notif.title}</h4>
                            <span className="text-xs text-white/40">{notif.time}</span>
                          </div>
                          <p className="text-sm text-white/50">{notif.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-white/20 bg-white/10 hover:bg-white/20 cursor-pointer transition-colors">
                      <span className="text-sm font-medium text-indigo-400">View all notifications</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div 
              className="flex items-center gap-3 pl-4 border-l border-white/20 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="text-xs text-white/50 capitalize">{user.role}</div>
              </div>
              {user.role !== 'superadmin' && user.role !== 'admin' && (
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                  alt={user.name}
                  className="w-9 h-9 rounded-full bg-white/20 object-cover border-2 border-white/20 shadow-sm"
                />
              )}
            </div>
            {!hasSidebar && (
              <button
                onClick={logout}
                className="p-2 hover:bg-red-500/20 text-white/70 hover:text-red-400 rounded-lg transition-colors ml-2"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
              onClick={() => setIsProfileModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="glass-card w-full max-w-md pointer-events-auto overflow-hidden">
                <div className="p-6 border-b border-white/20 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
                  <button 
                    onClick={() => setIsProfileModalOpen(false)}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                  {user.role !== 'superadmin' && user.role !== 'admin' && (
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <img 
                          src={profileAvatar || `https://ui-avatars.com/api/?name=${profileName}`} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
                        />
                        <button 
                          type="button"
                          className="absolute bottom-0 right-0 p-2 bg-indigo-600/90 backdrop-blur-sm text-white rounded-full hover:bg-indigo-700 shadow-lg transition-colors"
                          onClick={() => {
                            const url = prompt("Enter new avatar URL:");
                            if (url) setProfileAvatar(url);
                          }}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">New Password (optional)</label>
                    <input 
                      type="password" 
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-white/20 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsProfileModalOpen(false)}
                      className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingProfile}
                      className="px-4 py-2 bg-indigo-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-indigo-700/90 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      {isSubmittingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
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
