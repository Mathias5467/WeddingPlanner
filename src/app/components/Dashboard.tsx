"use client";

import React, { useMemo } from 'react';
import { 
  Users, Wallet, BarChart3, UserCheck, TrendingUp, 
  CheckCircle2, XCircle, HelpCircle, Users2, Target 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, CartesianGrid, Legend 
} from 'recharts';

export function Dashboard({ stats, onNavigate }: { stats: any, onNavigate: (id: string) => void }) {
  if (!stats) return null;

  const totalPlanned = stats.totalExp || 0;
  const budgetLimit = stats.targetBudget;
  
  const budgetPercent = Math.round((totalPlanned / budgetLimit) * 100);
  const isOverBudget = totalPlanned > budgetLimit;

  
  const guestSideData = [
    { name: 'Nevesta', count: stats.brideGuests, color: '#fb7185' },
    { name: 'Ženích', count: stats.groomGuests, color: '#38bdf8' },
    { name: 'Spoloční', count: stats.mutualGuests, color: 'var(--text-muted)' },
  ];

  const guestStatusData = [
    { name: 'Prídu', count: stats.confirmed, color: '#10b981' },
    { name: 'Neprídu', count: stats.declined, color: '#ef4444' },
    { name: 'Čaká sa', count: stats.pending, color: '#f59e0b' },
  ];

  const costPerPerson = stats.totalGuests > 0 ? totalPlanned / stats.totalGuests : 0;

  return (
    <div className="animate-in fade-in duration-500 space-y-10 pb-10">
      
      {/* 1. FINANČNÝ PREHĽAD */}
      <section>
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-[var(--brand-light)] rounded-lg text-[rgb(var(--brand-primary))]">
              <Wallet size={20} />
           </div>
           <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Ekonomika svadby</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatBox label="Plánované výdavky" value={totalPlanned} subValue="Súčet všetkých položiek" icon={Wallet} color="text-white" isCurrency />
            <StatBox label="Priemer na osobu" value={costPerPerson} subValue={`Pri ${stats.totalGuests} hosťoch`} icon={Users} color="text-[rgb(var(--brand-primary))]" isCurrency />
            <div 
              onClick={() => onNavigate('Settings')} 
              className="cursor-pointer transition-all active:scale-95 group/card"
            >
              <StatBox 
                label="Váš nastavený limit" 
                value={stats.targetBudget || 12000} 
                subValue="Kliknite pre zmenu" 
                icon={Target} 
                color="text-amber-500" 
                isCurrency 
              />
          </div>
        </div>
      </section>

      {/* 2. GRAFY HOSTÍ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GRAF: Pomer strán */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-2xl">
          <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest mb-8">Pomer strán hostí</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={guestSideData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                <Tooltip 
                  cursor={false} 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
                  }}
                  itemStyle={{ color: 'var(--text-main)', fontSize: '12px' }}
                  formatter={(value: any) => [`${value} hostí`, 'Počet']}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={50}>
                  {guestSideData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAF: Stav potvrdení */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-2xl">
          <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest mb-8">Stav potvrdení</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={guestStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: 'var(--text-main)', fontSize: '12px' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()}`, 'Počet']}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={50}>
                  {guestStatusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. VEĽKÝ GRAF: VÝDAVKY PODĽA KATEGÓRIÍ */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-[var(--brand-light)] rounded-lg text-[rgb(var(--brand-primary))]">
                <BarChart3 size={20} />
            </div>
            <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-widest">Rozpis výdavkov podľa kategórií</h3>
        </div>
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.expensesByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold'}} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'var(--text-muted)', fontSize: 11}} 
                        tickFormatter={(val) => `${val} €`}
                    />
                    <Tooltip 
                        cursor={false}
                        contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
                        itemStyle={{ color: 'var(--text-main)', fontSize: '12px' }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} €`, 'Suma']}
                    />
                    <Bar dataKey="amount" radius={[12, 12, 0, 0]} barSize={45}>
                        {stats.expensesByCategory.map((entry: any, index: number) => (
                            <Cell key={index} fill={entry.color || 'rgb(var(--brand-primary))'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 4. HLAVNÝ STAV ROZPOČTU (PLÁN VS LIMIT) */}
      <div className={`bg-[var(--bg-card)] border p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between overflow-hidden relative group transition-all ${isOverBudget ? 'border-red-500/50' : 'border-[var(--border-color)]'}`}>
        <div className="relative z-10 w-full">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">Čerpanie rozpočtu (Plán vs Limit)</p>
              <h4 className={`text-4xl font-black tracking-tighter ${isOverBudget ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                {totalPlanned.toLocaleString()} € <span className="text-zinc-600 font-medium text-2xl">/ {budgetLimit.toLocaleString()} €</span>
              </h4>
            </div>
            <div className="text-right text-[var(--text-muted)]">
                <p className="text-[10px] font-black uppercase tracking-widest">Zostáva k dispozícii</p>
                <p className={`text-xl font-mono font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-500'}`}>
                    {(budgetLimit - totalPlanned).toLocaleString()} €
                </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-4 flex-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shadow-inner text-white">
                <div 
                    className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-red-500' : 'bg-[rgb(var(--brand-primary))]'}`} 
                    style={{ width: `${budgetPercent}%` }}
                />
            </div>
            <span className={`text-sm font-black w-12 text-right ${isOverBudget ? 'text-red-500' : 'text-[rgb(var(--brand-primary))]'}`}>
                {budgetPercent}%
            </span>
          </div>
          
          {isOverBudget && (
            <p className="mt-3 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
              ⚠️ Pozor: Plánované výdavky presahujú váš nastavený rozpočet!
            </p>
          )}
        </div>

        {/* Dekorácia na pozadí */}
        <div className={`absolute -right-10 -bottom-10 w-64 h-64 rounded-full blur-3xl opacity-10 ${isOverBudget ? 'bg-red-500' : 'bg-[rgb(var(--brand-primary))]'}`} />
      </div>

    </div>
  );
}

// --- POMOCNÉ KOMPONENTY ---

function StatBox({ label, value, subValue, icon: Icon, color, isCurrency }: any) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-[2rem] shadow-xl hover:border-zinc-500 transition-all group">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] ${color} shadow-inner group-hover:scale-110 transition-transform`}>
          <Icon size={28} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest leading-none mb-2">{label}</p>
          <p className="text-2xl font-black text-[var(--text-main)] tracking-tight">
            {isCurrency 
              ? value.toLocaleString('sk-SK', { style: 'currency', currency: 'EUR' })
              : value}
          </p>
          <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase">{subValue}</p>
        </div>
      </div>
    </div>
  );
}