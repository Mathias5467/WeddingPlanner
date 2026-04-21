import { AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  text: string;
}

export function DeleteModal({ isOpen, onClose, onConfirm, text }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)]/60 p-8 rounded-[2rem] max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-main)]">{text}</h3>
          <p className="text-[var(--text-muted)] text-sm mb-8">
            Táto akcia je nenávratná.
          </p>
          <div className="flex w-full gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-all cursor-pointer">
              Zrušiť
            </button>
            <button onClick={onConfirm} className="flex-1 px-4 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-[var(--text-main)] font-bold transition-all cursor-pointer shadow-lg shadow-red-600/20">
              Vymazať
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}