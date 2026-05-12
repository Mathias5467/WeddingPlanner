"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Camera, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getHomeData, deleteCouplePhoto, savePhotoToDb } from '../actions';
import { useUploadThing } from "@/utils/uploadthing";
import { NotificationToast, NotificationType } from './ui/NotificationToast';

interface HomeData {
  weddingDate: string | null;
  coupleName: string;
  photos: any[];
}

export function HomeView() {
  const [data, setData] = useState<HomeData>({ weddingDate: null, coupleName: "", photos: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [notify, setNotify] = useState<{ msg: string, type: NotificationType, show: boolean }>({
    msg: "", type: "info", show: false
  });

  const showNotification = (msg: string, type: NotificationType) => {
    setNotify({ msg, type, show: true });
  };

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        await savePhotoToDb(res[0].url);
        await loadHome();
        setCurrentIndex(0);
        setIsUploading(false);
        showNotification("Fotka bola pridaná do vášho príbehu.", "success");
      }
    },
    onUploadError: (e) => {
      setIsUploading(false);
      showNotification(`Chyba: ${e.message}`, "error");
    },
  });

  const loadHome = async () => {
    const d = await getHomeData();
    setData(d as HomeData);
  };

  useEffect(() => {
    loadHome();
    const timer = setInterval(() => calculateTimeLeft(), 1000);
    return () => clearInterval(timer);
  }, [data.weddingDate]);

  const calculateTimeLeft = () => {
    if (!data.weddingDate) return;
    const diff = new Date(data.weddingDate).getTime() - new Date().getTime();
    if (diff > 0) {
      setTimeLeft({
        dni: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hod: Math.floor((diff / (1000 * 60 * 60)) % 24),
        min: Math.floor((diff / 1000 / 60) % 60),
        sek: Math.floor((diff / 1000) % 60),
      });
    } else { setTimeLeft(null); }
  };

  return (
  <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-6 md:px-12">
    <NotificationToast isVisible={notify.show} message={notify.msg} type={notify.type} onClose={() => setNotify(prev => ({ ...prev, show: false }))} />

    <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-16 lg:gap-12 items-center justify-center">
      
      <div className="flex-1 flex flex-col items-center text-center space-y-10">
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-3">
          <h1 className="font-serif italic text-5xl md:text-6xl font-black text-[var(--brand-primary)] tracking-tighter leading-tight">
            {data.coupleName.split(' a ').join(' & ')}
          </h1>
          <div className="flex items-center justify-center gap-4 text-[var(--brand-primary)]">
            <div className="h-[1px] w-12 bg-current" />
            <Heart size={14} fill="currentColor" />
            <div className="h-[1px] w-12 bg-current" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-3 w-full">
          {timeLeft ? Object.entries(timeLeft).map(([label, value]) => (
            <div key={label} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-[2rem] shadow-xl text-center min-w-[85px] md:min-w-[95px]">
              <div className="text-2xl md:text-3xl font-black text-[var(--brand-primary)] mb-0.5 leading-none">{value as number}</div>
              <div className="text-[8px] uppercase font-black tracking-widest text-[var(--text-muted)] opacity-50">{label}</div>
            </div>
          )) : (
            <div className="p-6 rounded-[2rem] border-2 border-dashed border-[var(--border-color)] flex items-center gap-4 text-[var(--text-muted)] italic font-serif text-sm">
              Nastavte si dátum svadby...
            </div>
          )}
        </motion.div>
      </div>

      {/* PRAVÁ STRANA: CAROUSEL - Nižší a kompaktnejší */}
      <div className="flex-1 w-full max-w-[340px] md:max-w-sm flex justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-[480px] md:h-[520px] w-full rounded-[3rem] overflow-hidden group shadow-[0_0_20px_var(--brand-primary)] border border-[var(--border-color)]  backdrop-blur-sm"
        >
          <AnimatePresence mode="wait">
            {data.photos.length > 0 ? (
              <motion.img 
                  key={data.photos[currentIndex]?.id} 
                  src={data.photos[currentIndex]?.path} 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                  transition={{ duration: 0.8 }} 
                  className="absolute inset-0 w-full h-full object-cover" 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-30">
                <Camera size={48} />
                <p className="font-serif italic text-xs uppercase tracking-widest">Spomienky</p>
              </div>
            )}
          </AnimatePresence>

          {/* Ostatné prvky (Navigácia, Mazanie, Upload) ostávajú nezmenené... */}
          {data.photos.length > 1 && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-40">
              <button onClick={() => setCurrentIndex(prev => (prev === 0 ? data.photos.length - 1 : prev - 1))} className="p-3 bg-black/20 backdrop-blur-xl rounded-full text-white hover:bg-[var(--brand-primary)] pointer-events-auto cursor-pointer transition-all"><ChevronLeft size={20}/></button>
              <button onClick={() => setCurrentIndex(prev => (prev === data.photos.length - 1 ? 0 : prev + 1))} className="p-3 bg-black/20 backdrop-blur-xl rounded-full text-white hover:bg-[var(--brand-primary)] pointer-events-auto cursor-pointer transition-all"><ChevronRight size={20}/></button>
            </div>
          )}

          {data.photos.length > 0 && (
            <button onClick={async () => { await deleteCouplePhoto(data.photos[currentIndex].id, data.photos[currentIndex].path); setCurrentIndex(0); loadHome(); showNotification("Fotka bola odstránená.", "info"); }} className="absolute top-6 right-6 p-2.5 bg-red-500/10 backdrop-blur-md text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-50 shadow-lg"><Trash2 size={16}/></button>
          )}

          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
            <label className={`p-4 bg-[var(--brand-primary)] text-white rounded-2xl  cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-[0.2em] whitespace-nowrap ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploading ? "NAHRÁVAM..." : <><Camera size={16} /> PRIDAŤ FOTKU</>}
              <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setIsUploading(true); await startUpload([file]); e.target.value = ''; } }} />
            </label>
          </div>
        </motion.div>
      </div>

    </div>
  </div>
);
}