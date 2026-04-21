"use client";

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export function CustomDropdown({ label, name, options, defaultValue }: { label?: string, name: string, options: any[], defaultValue?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false); // Smer otvárania
  const [selected, setSelected] = useState(defaultValue || (options.length > 0 ? options[0].value : ''));
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find(o => o.value === selected) || options[0] || { label: 'Vyberte...', color: '' };

  // Logika pre inteligentné otváranie
  const handleToggle = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Ak je pod ním menej ako 250px, otvor ho hore
      setOpenUp(spaceBelow < 250);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="block text-[10px] uppercase font-black text-[var(--text-muted)] mb-1.5 ml-1 tracking-widest">{label}</label>}
      <input type="hidden" name={name} value={selected} />
      
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between bg-[var(--bg-input)] border text-xs rounded-xl px-3 py-2 outline-none transition-all
          ${isOpen ? 'border-[rgb(var(--brand-primary)/0.6)] ring-2 ring-[rgb(var(--brand-primary)/0.1)]' : 'border-[var(--border-color)]'}`}
      >
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${currentOption.color}`}>
          {currentOption.label}
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute z-[999] w-full min-w-[160px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-viisble animate-in fade-in zoom-in-95 duration-200
            ${openUp ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'}`}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { setSelected(opt.value); setIsOpen(false); }}
                className={`px-4 py-2.5 text-[11px] cursor-pointer transition-colors flex items-center justify-between
                  ${selected === opt.value ? 'bg-[var(--brand-light)]' : 'hover:bg-[var(--bg-input)]'}`}
              >
                <span className={`px-2 py-0.5 rounded-md font-bold border ${opt.color}`}>
                  {opt.label}
                </span>
                {selected === opt.value && <Check size={14} className="text-[rgb(var(--brand-primary))]" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}