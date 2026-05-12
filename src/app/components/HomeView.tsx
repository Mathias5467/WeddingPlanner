"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Camera, Trash2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { getHomeData, deleteCouplePhoto, savePhotoToDb } from '../actions';
import { useUploadThing } from "@/utils/uploadthing";
import { NotificationToast, NotificationType } from './ui/NotificationToast';

export function HomeView() {
  const [data, setData] = useState<{weddingDate: string | null, photos: any[]}>({ weddingDate: null, photos: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [notify, setNotify] = useState<{ msg: string, type: NotificationType, show: boolean }>({
    msg: "", type: "info", show: false
  });

  const showNotification = (msg: string, type: NotificationType) => {
    setNotify({ msg, type, show: true });
  };

  // --- CLOUD UPLOAD ENGINE ---
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        await savePhotoToDb(res[0].url);
        await loadHome();
        setCurrentIndex(0);
        setIsUploading(false);
        showNotification("Fotka bola úspešne pridaná do albumu.", "success");
      }
    },
    onUploadError: (e) => {
      setIsUploading(false);
      showNotification(`Chyba: ${e.message}`, "error");
    },
  });

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
    <div className="space-y-12 pb-20">
      <NotificationToast isVisible={notify.show} message={notify.msg} type={notify.type} onClose={() => setNotify(prev => ({ ...prev, show: false }))} />

      <div className="flex justify-center gap-4 md:gap-8 text-center">
        {timeLeft ? Object.entries(timeLeft).map(([label, value]) => (
          <div key={label} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 md:p-6 rounded-[2rem] min-w-[80px] md:min-w-[120px] shadow-xl">
            <div className="text-3xl md:text-5xl font-black text-[var(--brand-primary)] mb-1">{value as number}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">{label}</div>
          </div>
        )) : <div className="text-[var(--text-muted)] italic font-serif text-sm">Nastavte dátum svadby v nastaveniach...</div>}
      </div>

      <div className="relative h-[500px] w-full rounded-[2.5rem] overflow-hidden group shadow-2xl border border-[var(--brand-primary)]">
        <AnimatePresence mode="wait">
          {data.photos.length > 0 ? (
            <motion.img 
                key={data.photos[currentIndex]?.id} 
                src={data.photos[currentIndex]?.path} 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                transition={{ duration: 0.6 }} 
                className="absolute inset-0 w-full h-full object-cover" 
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-4 opacity-40">
              <Camera size={48} />
              <p className="font-serif italic text-lg">Nahrajte vaše prvé spoločné fotky</p>
            </div>
          )}
        </AnimatePresence>

        {data.photos.length > 1 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity z-40">
            <button onClick={() => setCurrentIndex(prev => (prev === 0 ? data.photos.length - 1 : prev - 1))} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 pointer-events-auto cursor-pointer"><ChevronLeft size={24}/></button>
            <button onClick={() => setCurrentIndex(prev => (prev === data.photos.length - 1 ? 0 : prev + 1))} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 pointer-events-auto cursor-pointer"><ChevronRight size={24}/></button>
          </div>
        )}

        {data.photos.length > 0 && (
          <button onClick={async () => { await deleteCouplePhoto(data.photos[currentIndex].id, data.photos[currentIndex].path); setCurrentIndex(0); loadHome(); showNotification("Fotka bola odstránená.", "info"); }} className="absolute top-6 right-6 p-3 bg-red-500/20 backdrop-blur-md text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-50"><Trash2 size={20}/></button>
        )}

        <label className={`absolute bottom-6 right-6 p-4 bg-[var(--brand-primary)] text-white rounded-3xl shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest z-50 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? (
            <div className="flex items-center gap-2 px-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Nahrávam...
            </div>
          ) : (
            <>
              <Upload size={18} />
              Pridať fotku
            </>
          )}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            disabled={isUploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setIsUploading(true);
                await startUpload([file]);
                e.target.value = '';
              }
            }} 
          />
        </label>
      </div>
    </div>
  );
}