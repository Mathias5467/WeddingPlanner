"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { login, register } from '../actions';

export function LoginView({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = isRegistering ? await register(formData) : await login(formData);

    if (res.success) {
      onLoginSuccess();
    } else {
      setError(res.error || "Chyba");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-[var(--bg-main)] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] p-10 shadow-2xl my-auto"
      >
        <div className="h-28 flex flex-col justify-center px-8">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isRegistering && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input autoComplete='off'
                  name="couple_name" required placeholder="Mená snúbencov" 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[var(--brand-primary)] transition-all font-bold"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input autoComplete='off'
              name="username" required placeholder="Užívateľské meno" 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[var(--brand-primary)] transition-all font-bold"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input autoComplete='off'
              name="password" type="password" required placeholder="Heslo" 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[var(--brand-primary)] transition-all font-bold"
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>}

          <button 
            disabled={loading}
            className="w-full bg-[var(--brand-primary)] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[var(--brand-primary)]/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer mt-6"
          >
            {loading ? "Spracúvam..." : isRegistering ? "Zaregistrovať sa" : "Prihlásiť sa"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
            className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:text-[var(--brand-primary)] transition-colors cursor-pointer"
          >
            {isRegistering ? 'Už máte účet? Prihláste sa' : 'Nemáte účet? Vytvorte si ho'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}