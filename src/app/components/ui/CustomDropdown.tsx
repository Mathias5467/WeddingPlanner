"use client";

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export function CustomDropdown({ 
  label, 
  name, 
  options, 
  defaultValue,
  height = "h-[42px]",
  form // PRIDANÉ: Prop pre prepojenie s externým formulárom
}: { 
  label?: string, 
  name: string, 
  options: any[], 
  defaultValue?: string,
  height?: string,
  form?: string // Typ pre form prop
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [selected, setSelected] = useState(defaultValue || (options.length > 0 ? options[0].value : ''));
  const dropdownRef = useRef<HTMLDivElement>(null);

  // PRIDANÉ: Synchronizácia stavu, keď sa zmení defaultValue (napr. pri načítaní dát alebo prepnutí tabu)
  useEffect(() => {
    if (defaultValue !== undefined) {
      setSelected(defaultValue);
    }
  }, [defaultValue]);

  const currentOption = options.find(o => o.value === selected) || options[0] || { label: 'Vyberte...', color: '' };

  const handleToggle = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
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
      {label && (
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      
      {/* OPRAVA: Pridaný atribút form do skrytého inputu */}
      <input type="hidden" name={name} value={selected || ''} form={form} />
      
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center px-4 justify-between bg-[var(--bg-input)] border text-xs rounded-xl px-3 outline-none transition-all ${height}
          ${isOpen ? 'border-[var(--brand-primary)]' : 'border-[var(--border-color)]'}`}
      >
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${currentOption.color}`}>
          {currentOption.label}
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute z-[999] w-full min-w-[160px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200
            ${openUp ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'}`}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { setSelected(opt.value); setIsOpen(false); }}
                className={`px-4 py-3 text-[11px] cursor-pointer transition-colors flex items-center justify-between hover:bg-[var(--brand-light)]/10
                  ${selected === opt.value ? 'bg-[var(--brand-light)]/5' : ''}`}
              >
                <span className={`px-2 py-0.5 rounded-md font-bold border ${opt.color}`}>
                  {opt.label}
                </span>
                {selected === opt.value && (
                   <div className="bg-[var(--brand-primary)] p-0.5 rounded-full">
                      <Check size={12} className="text-white" />
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}