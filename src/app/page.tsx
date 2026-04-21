"use client";

import { useTheme } from './context/ThemeContext';
import React, { useState, useEffect } from 'react';
import { 
  Home, Users, CreditCard, Armchair, Heart, Bell, 
  CheckSquare, Calendar, FolderOpen, Wine, Settings as SettingsIcon
} from 'lucide-react';
import Image from 'next/image';

import { getDashboardStats, getGuests, getTasks } from './actions';
import { Dashboard } from './components/Dashboard';
import { GuestManager } from './components/GuestManager';

import { SeatingManager  } from './components/SeatingManager';
import { TaskManager } from './components/TaskManager';
import { ScheduleManager } from './components/ScheduleManager';
import { FileManager } from './components/FileManager';
import { SettingsView } from './components/SettingsView';
import { DrinkCalculator } from './components/DrinkCalculator';
import { ExpenseManager } from './components/ExpenseManager';
import { NotificationCenter } from './components/NotificationCenter';

export default function WeddingPlanner() {
  const { theme, mode } = useTheme(); // Mode pridáme pre istotu, ak by sme ho potrebovali
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]); 

  const loadData = async () => {
    const s = await getDashboardStats();
    const g = await getGuests();
    const t = await getTasks();
    setStats(s);
    setGuests(g);
    setTasks(t);
  };

  useEffect(() => { loadData(); }, [activeTab]);

  const navItems = [
    { id: 'Dashboard', name: 'Prehľad', icon: Home },
    { id: 'Guests', name: 'Hostia', icon: Users },
    { id: 'Expenses', name: 'Výdavky', icon: CreditCard },
    { id: 'Tasks', name: 'Úlohy', icon: CheckSquare },
    { id: 'Schedule', name: 'Harmonogram', icon: Calendar },
    { id: 'Seating', name: 'Zasadenie', icon: Armchair },
    { id: 'Storage', name: 'Súbory', icon: FolderOpen },
    { id: 'Drinks', name: 'Kalkulačka nápojov', icon: Wine },
    { id: 'Settings', name: 'Nastavenia', icon: SettingsIcon },
  ];

  return (
    // ZMENA: text-zinc-100 -> text-[var(--text-main)], selection:bg... -> selection:bg-[var(--brand-light)]
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[var(--brand-light)] selection:text-[rgb(var(--brand-primary))] transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col z-10 transition-colors">
        <div className="h-28 flex flex-col justify-center px-8 border-b border-[var(--border-color)]">
          <div className="flex items-baseline gap-1">
            {/* Elegantné veľké W */}
            <span className="font-serif italic text-4xl font-black text-[rgb(var(--brand-primary))] leading-none">
              W
            </span>
            
            {/* Moderný tenký text PLANNER */}
            <span className="font-serif text-lg tracking-[0.3em] uppercase text-[var(--text-main)] font-light">
              Planner
            </span>
          </div>
          
          {/* Subtílna dekoračná čiara vo farbe témy */}
          <div className="mt-2 flex items-center gap-3 w-full">
            <div className="h-[1px] w-4 bg-[rgb(var(--brand-primary))] flex-shrink-0" />
            <span className="text-[8px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-semibold whitespace-nowrap">
              Wedding <br></br> Assistant
            </span>
            <div className="h-[1px] flex-1 bg-[rgb(var(--brand-primary))]" />
          </div>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 cursor-pointer rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-[var(--brand-light)] text-[rgb(var(--brand-primary))] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:bg-[var(--brand-light)] hover:text-[rgb(var(--brand-primary))]'
              }`}
            >
              <item.icon size={18} className="mr-4" />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-main)] transition-colors">
        <header className="h-20 flex items-center justify-between px-10 border-b border-[var(--border-color)]">
          <h2 className="text-2xl font-black tracking-tight">
            {navItems.find(n => n.id === activeTab)?.name}
          </h2>
          <NotificationCenter tasks={tasks} />
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeTab === 'Dashboard' && (
            <Dashboard 
              stats={stats} 
              onNavigate={(id: string) => {
                console.log("Prepínam na kartu:", id);
                setActiveTab(id);
              }} 
            />
          )}
          {activeTab === 'Guests' && <GuestManager guests={guests} refresh={loadData} />}
          {activeTab === 'Expenses' && <ExpenseManager />}
          {activeTab === 'Tasks' && <TaskManager />}
          {activeTab === 'Schedule' && <ScheduleManager />}
          {activeTab === 'Seating' && <SeatingManager guests={guests}/>}
          {activeTab === 'Storage' && <FileManager />}
          {activeTab === 'Drinks' && <DrinkCalculator />}
          {activeTab === 'Settings' && (
            <SettingsView 
              onRefresh={loadData} 
            />
          )}
        </div>
      </main>
    </div>
  );
}