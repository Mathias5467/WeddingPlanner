"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Camera, Trash2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { getHomeData, uploadCouplePhoto, deleteCouplePhoto } from '../actions';

export function HomeView() {
  const [data, setData] = useState<{weddingDate: string | null, photos: any[]}>({ weddingDate: null, photos: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadHome = async () => {
    const d = await getHomeData();
    setData(d);
  };

  useEffect(() => {
    loadHome();
    const timer = setInterval(() => calculateTimeLeft(), 1000);
    return () => clearInterval(timer);
  }, [data.weddingDate]);

  const calculateTimeLeft = () => {
    if (!data.weddingDate) return;
    const difference = +new Date(data.weddingDate) - +new Date();
    if (difference > 0) {
      setTimeLeft({
        dni: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hod: Math.floor((difference / (1000 * 60 * 60)) % 24),
        min: Math.floor((difference / 1000 / 60) % 60),
        sek: Math.floor((difference / 1000) % 60),
      });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await uploadCouplePhoto(fd);
      if (res?.success) {
        await loadHome(); 
        setCurrentIndex(0);
      } else {
        alert("Chyba: " + (res?.error || "Neznámy problém"));
      }
    } catch (err) {
      alert("Kritická chyba pri uploade");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* ODPOČÍTAVANIE */}
      <div className="flex justify-center gap-4 md:gap-8 text-center">
        {timeLeft ? Object.entries(timeLeft).map(([label, value]) => (
          <div key={label} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 md:p-6 rounded-[2rem] min-w-[80px] md:min-w-[120px] shadow-xl">
            <div className="text-3xl md:text-5xl font-black text-[var(--brand-primary)] mb-1">{value as number}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">{label}</div>
          </div>
        )) : <div className="text-[var(--text-muted)] italic font-serif">Nastavte dátum svadby v nastaveniach...</div>}
      </div>

      {/* CAROUSEL */}
      <div className="relative h-[500px] w-full rounded-[2rem] overflow-hidden group shadow-lg border border border-[var(--brand-primary)]">
        <AnimatePresence mode="wait">
          {data.photos.length > 0 ? (
            <motion.img
              key={data.photos[currentIndex].id}
              src={data.photos[currentIndex].path}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <Camera size={48} strokeWidth={1} />
              <p className="font-serif italic text-lg">Nahrajte vaše prvé spoločné fotky</p>
            </div>
          )}
        </AnimatePresence>

        {/* Ovládanie carouselu */}
        {data.photos.length > 1 && (
          <>
            <button onClick={() => setCurrentIndex((prev) => (prev === 0 ? data.photos.length - 1 : prev - 1))} className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => setCurrentIndex((prev) => (prev === data.photos.length - 1 ? 0 : prev + 1))} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Tlačidlo na mazanie aktuálnej fotky */}
        {data.photos.length > 0 && (
          <button 
            onClick={async () => {
              await deleteCouplePhoto(data.photos[currentIndex].id, data.photos[currentIndex].path);
              setCurrentIndex(0);
              loadHome();
            }}
            className="absolute top-6 right-6 p-3 bg-red-500/20 backdrop-blur-md text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={20} />
          </button>
        )}

        {/* Upload overlay */}
        <label className={`absolute bottom-6 right-6 p-4 bg-[var(--brand-primary)] text-white rounded-3xl shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Nahrávam...
            </div>
          ) : (
            <>
              <Upload size={18} />
              Pridať fotku
            </>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>
    </div>
  );
}