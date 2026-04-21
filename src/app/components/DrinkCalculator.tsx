"use client";

import React, { useState, useMemo } from 'react';
import { 
  Users, Beer, Wine, GlassWater, Droplets, 
  Clock, PartyPopper, Calculator, Info, Baby, Minus, Plus 
} from 'lucide-react';

export function DrinkCalculator() {
  const [adults, setAdults] = useState(50);
  const [kids, setKids] = useState(10);
  const [hours, setHours] = useState(10);
  const [intensity, setIntensity] = useState(1);

  
  const results = useMemo(() => {
    const totalPeople = adults + kids;
    const timeFactor = hours / 10; 
    
    return {
      wineLiters: Math.ceil(adults * 0.5 * intensity * timeFactor),
      wineBottles: Math.ceil((adults * 0.5 * intensity * timeFactor) / 0.75),
      beerLiters: Math.ceil(adults * 1.5 * intensity * timeFactor),
      beerCans: Math.ceil((adults * 1.5 * intensity * timeFactor) / 0.5),
      spiritsLiters: Math.ceil(adults * 0.3 * intensity * timeFactor),
      spiritsBottles: Math.ceil((adults * 0.3 * intensity * timeFactor) / 0.7),
      softLiters: Math.ceil(totalPeople * 1.5 * timeFactor),
      waterLiters: Math.ceil(totalPeople * 1.0 * timeFactor),
      proseccoBottles: Math.ceil((adults * 0.15) / 0.75)
    };
  }, [adults, kids, hours, intensity]);

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-8">
      
      {/* 1. NASTAVENIA VSTUPOV */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-2xl transition-colors">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-[var(--brand-light)] rounded-lg text-[rgb(var(--brand-primary))] shadow-inner">
                <Calculator size={24} />
            </div>
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Nastavenie kalkulačky</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <InputGroup label="Dospelí" icon={Users} value={adults} min={0} max={500} step={1} onChange={setAdults} />
          <InputGroup label="Deti / Abstinent" icon={Baby} value={kids} min={0} max={200} step={1} onChange={setKids} />
          <InputGroup label="Trvanie (hodiny)" icon={Clock} value={hours} min={1} max={48} step={1} onChange={setHours} />
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <PartyPopper size={14} className="text-[rgb(var(--brand-primary))]" /> Intenzita party
            </label>
            <div className="flex gap-1 bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-inner">
                {[
                    { val: 0.8, label: 'Slabá' },
                    { val: 1, label: 'Bežná' },
                    { val: 1.3, label: 'Silná' }
                ].map((opt) => (
                    <button 
                        key={opt.val}
                        onClick={() => setIntensity(opt.val)}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer
                            ${intensity === opt.val 
                                ? 'bg-[rgb(var(--brand-primary))] text-white shadow-lg shadow-[rgb(var(--brand-primary)/0.2)]' 
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HLAVNÉ VÝSLEDKY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultCard label="Víno" liters={results.wineLiters} units={results.wineBottles} unitLabel="fliaš (0.75l)" icon={Wine} color="text-rose-500" />
        <ResultCard label="Pivo" liters={results.beerLiters} units={results.beerCans} unitLabel="ks (0.5l)" icon={Beer} color="text-amber-500" />
        <ResultCard label="Tvrdý alkohol" liters={results.spiritsLiters} units={results.spiritsBottles} unitLabel="fliaš (0.7l)" icon={PartyPopper} color="text-sky-500" />
      </div>

      {/* 3. DOPLNKOVÉ VÝSLEDKY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SmallResultCard label="Prosecco / Prípitok" value={`${results.proseccoBottles} fliaš`} icon={Wine} color="text-emerald-500" />
        <SmallResultCard label="Nealko mix" value={`${results.softLiters} litrov`} icon={Droplets} color="text-orange-400" />
        <SmallResultCard label="Minerálka / Voda" value={`${results.waterLiters} litrov`} icon={GlassWater} color="text-blue-500" />
      </div>

      {/* 4. INFO PANEL */}
      <div className="bg-[var(--brand-light)] border border-[rgb(var(--brand-primary)/0.15)] p-6 rounded-[2.5rem] flex items-start gap-4">
        <div className="p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
            <Info className="text-[rgb(var(--brand-primary))]" size={20} />
        </div>
        <div className="text-sm text-[var(--text-muted)] leading-relaxed">
            <p className="font-black text-[var(--text-main)] mb-1 uppercase text-[10px] tracking-widest">Dôležité upozornenie:</p>
            Tieto výpočty sú založené na priemerných svadobných štatistikách. Vždy zvážte preferencie vašich hostí (napr. ak viete, že vaša rodina pije viac piva ako vína). Počty fliaš sú zaokrúhlené nahor pre vytvorenie bezpečnej rezervy.
        </div>
      </div>

    </div>
  );
}

// --- POMOCNÉ KOMPONENTY ---

function InputGroup({ label, icon: Icon, value, min, max, step, onChange }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
        <Icon size={14} className="text-[rgb(var(--brand-primary))]" /> {label}
      </label>
      <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-color)] p-1.5 rounded-2xl shadow-inner">
        <button 
            onClick={() => onChange(Math.max(min, value - step))} 
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-zinc-500 transition-all cursor-pointer active:scale-90"
        >
            <Minus size={16} />
        </button>
        <span className="flex-1 text-center font-black text-xl text-[var(--text-main)] tabular-nums">{value}</span>
        <button 
            onClick={() => onChange(Math.min(max, value + step))} 
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-zinc-500 transition-all cursor-pointer active:scale-90"
        >
            <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function ResultCard({ label, liters, units, unitLabel, icon: Icon, color }: any) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-xl hover:border-[rgb(var(--brand-primary)/0.3)] transition-all text-center group">
        <div className={`w-16 h-16 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ${color} shadow-inner`}>
            <Icon size={32} />
        </div>
        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">{label}</h4>
        <div className="text-4xl font-black text-[var(--text-main)] tracking-tighter mb-1">{liters} <span className="text-lg font-bold text-zinc-500">L</span></div>
        <p className="text-[10px] font-black text-[rgb(var(--brand-primary))] uppercase tracking-widest">
            ≈ {units} {unitLabel}
        </p>
    </div>
  );
}

function SmallResultCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl flex items-center gap-4 shadow-lg hover:border-zinc-500 transition-all">
        <div className={`p-3 rounded-xl bg-[var(--bg-input)] ${color} shadow-inner`}><Icon size={20} /></div>
        <div>
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-lg font-black text-[var(--text-main)]">{value}</p>
        </div>
    </div>
  );
}