"use client";
import { useTheme } from '../context/ThemeContext';
import { Check, Moon, Sun, Target, Calendar } from 'lucide-react';
import { updateTargetBudget, getTargetBudget, updateWeddingDate, getWeddingDate } from '../actions';
import { useState, useEffect } from 'react';
import { PremiumDatePicker } from './ui/PremiumDatePicker'; // Predpokladám cestu k tvojmu picker-u

export function SettingsView({ onRefresh }: { onRefresh: () => void }) {
  const { theme, mode, setTheme, setMode } = useTheme();
  const [budget, setBudget] = useState<string>("");
  const [weddingDate, setWeddingDate] = useState<string>("");

  useEffect(() => {
    getTargetBudget().then(val => setBudget(String(val)));
    getWeddingDate().then(date => setWeddingDate(date || ""));
  }, []);

  // A funkcia na zmenu dátumu:
  const handleDateChange = async (newDate: string) => {
    setWeddingDate(newDate);
    await updateWeddingDate(newDate);
    onRefresh(); // Toto zabezpečí, že sa zmeny prejavia v celom WeddingPlanner
  };

  const saveBudget = async () => {
    const num = parseFloat(budget);
    if (!isNaN(num)) {
      await updateTargetBudget(num);
      onRefresh();
    }
  };


  const themes = [
    { id: 'orange', name: 'Oranžová', color: 'bg-[#fb923c]' },
    { id: 'blue', name: 'Modrá', color: 'bg-[#38bdf8]' },
    { id: 'emerald', name: 'Zelená', color: 'bg-[#34d399]' },
    { id: 'rose', name: 'Ružová', color: 'bg-[#fb7185]' },
    { id: 'violet', name: 'Fialová', color: 'bg-[#a78bfa]' },
    { id: 'amber', name: 'Jantárová', color: 'bg-[#fbbf24]' },
    { id: 'cyan', name: 'Tyrkysová', color: 'bg-[#22d3ee]' },
    { id: 'gold', name: 'Zlatá', color: 'bg-[#a18c55]' },
  ];

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* SEKCE: ROZPOČET A DÁTUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rozpočet */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-lg">
            <div className="flex items-center gap-3 mb-6 text-[var(--text-main)]">
                <Target className="text-[var(--brand-primary)]" />
                <h3 className="text-xl font-black uppercase tracking-widest">Rozpočet</h3>
            </div>
            <div className="relative">
                <input 
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    onBlur={saveBudget}
                    onKeyDown={(e) => e.key === 'Enter' && saveBudget()}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl px-4 py-3 pr-10 outline-none focus:border-[var(--brand-primary)] transition-all font-mono font-bold"
                    placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">€</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-4 uppercase font-bold tracking-tight">
                Cieľový limit pre vaše výdavky.
            </p>
        </div>

        {/* Dátum Svadby */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-lg">
            <div className="flex items-center gap-3 mb-6 text-[var(--text-main)]">
                <Calendar className="text-[var(--brand-primary)]" />
                <h3 className="text-xl font-black uppercase tracking-widest">Dátum Svadby</h3>
            </div>
            
            {/* Použitie tvojho Custom Date Pickeru */}
            <PremiumDatePicker 
                name="wedding_date" 
                label="" 
                defaultValue={weddingDate}
                onChange={handleDateChange} // Predpokladám, že tvoj picker má onChange prop
            />

        </div>
      </div>

      {/* REŽIM ZOBRAZENIA */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-lg">
        <h3 className="text-xl font-black mb-6 text-[var(--text-main)] uppercase tracking-widest">Režim zobrazenia</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setMode('dark')}
            className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer
              ${mode === 'dark' 
                ? 'border-[var(--brand-primary)] bg-[var(--brand-light)] text-[var(--brand-primary)]' 
                : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--brand-primary)]'}`}
          >
            <Moon size={20} />
            <span className="font-bold uppercase text-xs tracking-widest">Tmavý režim</span>
          </button>

          <button
            onClick={() => setMode('light')}
            className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer
              ${mode === 'light' 
                ? 'border-[var(--brand-primary)] bg-[var(--brand-light)] text-[var(--brand-primary)]' 
                : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--brand-primary)]'}`}
          >
            <Sun size={20} />
            <span className="font-bold uppercase text-xs tracking-widest">Svetlý režim</span>
          </button>
        </div>
      </div>

      {/* FAREBNÁ TÉMA */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-lg">
        <h3 className="text-xl font-black mb-6 text-[var(--text-main)] uppercase tracking-widest">Farebná téma</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-3
                ${theme === t.id 
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-light)]' 
                  : 'border-[var(--border-color)] hover:border-[var(--brand-primary)]'}`}
            >
              <div className={`w-10 h-10 rounded-full ${t.color} shadow-lg shadow-black/20`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{t.name}</span>
              {theme === t.id && <Check size={16} className="text-[var(--brand-primary)]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}