"use client";

import { useTheme } from './context/ThemeContext';
import React, { useState, useEffect } from 'react';
import { 
  Home, Users, CreditCard, Armchair, Heart, Bell, 
  CheckSquare, Calendar, FolderOpen, Wine, Settings as SettingsIcon, LogOut
} from 'lucide-react';

import { getDashboardStats, getGuests, getTasks, checkAuth, logout } from './actions';
import { Dashboard } from './components/Dashboard';
import { GuestManager } from './components/GuestManager';
import { SeatingManager } from './components/SeatingManager';
import { TaskManager } from './components/TaskManager';
import { ScheduleManager } from './components/ScheduleManager';
import { FileManager } from './components/FileManager';
import { SettingsView } from './components/SettingsView';
import { DrinkCalculator } from './components/DrinkCalculator';
import { ExpenseManager } from './components/ExpenseManager';
import { NotificationCenter } from './components/NotificationCenter';
import { HomeView } from './components/HomeView';
import { LoginView } from './components/LoginView'; 

export default function WeddingPlanner() {
  const { theme, mode } = useTheme();
  const [activeTab, setActiveTab] = useState('Home');
  const [stats, setStats] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]); 

  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const loadData = async () => {
    const s = await getDashboardStats();
    const g = await getGuests();
    const t = await getTasks();
    setStats(s);
    setGuests(g);
    setTasks(t);
  };

  useEffect(() => {
    
    checkAuth().then(user => {
      if (user) {
        setIsAuthenticated(true);
        loadData();
      }
      setIsCheckingAuth(false);
    });
  }, []);

  useEffect(() => { 
    if (isAuthenticated) loadData(); 
  }, [activeTab, isAuthenticated]);

  const navItems = [
    { id: 'Home', name: 'Domov', icon: Heart },
    { id: 'Dashboard', name: 'Prehľad', icon: Home },
    { id: 'Guests', name: 'Hostia', icon: Users },
    { id: 'Expenses', name: 'Výdavky', icon: CreditCard },
    { id: 'Tasks', name: 'Úlohy', icon: CheckSquare },
    { id: 'Schedule', name: 'Harmonogram', icon: Calendar },
    { id: 'Seating', name: 'Zasadenie', icon: Armchair },
    { id: 'Storage', name: 'Súbory', icon: FolderOpen },
    { id: 'Drinks', name: 'Nápoje', icon: Wine },
    { id: 'Settings', name: 'Nastavenia', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    window.location.reload();
  };

  
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Heart className="text-[var(--brand-primary)] animate-pulse" size={48} />
      </div>
    );
  }

  
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => { setIsAuthenticated(true); loadData(); }} />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[var(--brand-light)] selection:text-[rgb(var(--brand-primary))] transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col z-10 transition-colors">
        <div className="h-28 flex flex-col justify-center px-8 border-b border-[var(--border-color)]">
          <div className="flex items-baseline gap-1">
            <span className="font-serif italic text-4xl font-black text-[var(--brand-primary)] leading-none">W</span>
            <span className="font-serif text-lg tracking-[0.3em] uppercase text-[var(--text-main)] font-light">Planner</span>
          </div>
          <div className="mt-2 flex items-center gap-3 w-full">
            <div className="h-[2px] w-4 bg-[var(--brand-primary)] flex-shrink-0" />
            <span className="text-[8px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-semibold whitespace-nowrap">Wedding <br/> Assistant</span>
            <div className="h-[2px] flex-1 bg-[var(--brand-primary)]" />
          </div>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 cursor-pointer rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-[var(--brand-light)] text-[var(--brand-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:bg-[var(--brand-light)] hover:text-[var(--brand-primary)]'
              }`}
            >
              <item.icon size={18} className="mr-4" />
              {item.name}
            </button>
          ))}
        </nav>

        {/* LOGOUT BUTTON NA SPODKU SIDEBARU */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer font-bold text-sm"
          >
            <LogOut size={18} className="mr-4" />
            Odhlásiť sa
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-main)] transition-colors">
        <header className="h-20 flex items-center justify-between px-10 border-b border-[var(--border-color)]">
          <h2 className="text-2xl font-black tracking-tight">
            {navItems.find(n => n.id === activeTab)?.name}
          </h2>
          <NotificationCenter tasks={tasks} />
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeTab === 'Home' && <HomeView />}
          {activeTab === 'Dashboard' && <Dashboard onNavigate={(id: string) => setActiveTab(id)} stats={stats} />}
          {activeTab === 'Guests' && <GuestManager guests={guests} refresh={loadData} />}
          {activeTab === 'Expenses' && <ExpenseManager />}
          {activeTab === 'Tasks' && <TaskManager />}
          {activeTab === 'Schedule' && <ScheduleManager />}
          {activeTab === 'Seating' && <SeatingManager guests={guests}/>}
          {activeTab === 'Storage' && <FileManager />}
          {activeTab === 'Drinks' && <DrinkCalculator />}
          {activeTab === 'Settings' && <SettingsView onRefresh={loadData} />}
        </div>
      </main>
    </div>
  );
}