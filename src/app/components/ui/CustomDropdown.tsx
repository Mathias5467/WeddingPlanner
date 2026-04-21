import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export function CustomDropdown({ label, name, options, defaultValue }: { label?: string, name: string, options: any[], defaultValue?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(defaultValue || (options.length > 0 ? options[0].value : ''));

  const currentOption = options.find(o => o.value === selected) || options[0] || { label: 'Vyberte...', color: 'text-[var(--text-muted)]' };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider tracking-widest">{label}</label>}
      
      <input type="hidden" name={name} value={selected} />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[var(--bg-input)] border text-sm rounded-xl px-4 py-3 outline-none transition-all duration-300
          ${isOpen 
            ? 'border-[rgb(var(--brand-primary)/0.6)] ring-4 ring-[rgb(var(--brand-primary)/0.8)] shadow-[0_0_25px_rgba(var(--brand-primary),0.8)]' 
            : 'border-[var(--border-color)] hover:border-zinc-700 shadow-lg'
          }`}
      >
        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${currentOption.color}`}>
          {currentOption.label}
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-[100] w-full mt-3 bg-[#131316] border border-[var(--border-color)] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200
            shadow-[0_30px_70px_-10px_rgba(0,0,0,0.8),0_0_20px_rgba(var(--brand-primary),0.1)]"
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { setSelected(opt.value); setIsOpen(false); }}
                className={`px-4 py-3.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                  ${selected === opt.value ? 'bg-[var(--brand-light)]' : 'hover:bg-zinc-800/80'}`}
              >
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${opt.color}`}>
                  {opt.label}
                </span>
                {selected === opt.value && (
                  <Check size={16} className="text-[rgb(var(--brand-primary))]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}